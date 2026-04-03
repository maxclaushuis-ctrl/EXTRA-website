import { useState, useEffect, useRef } from 'react';
import {
  haalAccountsOp,
  verbindAccount,
  haalBerichtenOp,
  stuurBericht,
  markeerGelezen,
  maakStream,
} from '../../api/whatsappClient';

const KLEUREN: Record<string, { bg: string; text: string }> = {
  horeca:       { bg: '#FEF3C7', text: '#92400E' },
  logistiek:    { bg: '#DBEAFE', text: '#1E40AF' },
  housekeeping: { bg: '#D1FAE5', text: '#065F46' },
};

interface Account {
  id: string;
  label: string;
  categorie: string;
  status: 'connected' | 'qr_ready' | 'connecting' | 'disconnected';
  telefoon?: string;
  qr?: string | null;
  ongelezen?: number;
  fout?: string | null;
}

interface Bericht {
  id: string;
  inkomend: boolean;
  naam?: string;
  van?: string;
  tekst: string;
  tijdstip: string;
}

export default function WhatsAppBeheer() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [actief, setActief] = useState('horeca');
  const [berichten, setBerichten] = useState<Record<string, Bericht[]>>({});
  const [nummer, setNummer] = useState('');
  const [tekst, setTekst] = useState('');
  const [loading, setLoading] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const berichtenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    laadAlles();
    const poll = setInterval(laadAlles, 3000);

    const stopStream = maakStream(
      (id, state) => {
        setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...state } : a));
      },
      (id, bericht) => {
        setBerichten(prev => ({
          ...prev,
          [id]: [...(prev[id] || []), bericht],
        }));
        setAccounts(prev => prev.map(a =>
          a.id === id && id !== actief
            ? { ...a, ongelezen: (a.ongelezen ?? 0) + 1 }
            : a
        ));
      }
    );

    return () => {
      clearInterval(poll);
      stopStream();
    };
  }, []);

  // Scroll naar beneden bij nieuwe berichten
  useEffect(() => {
    if (berichtenRef.current) {
      berichtenRef.current.scrollTop = berichtenRef.current.scrollHeight;
    }
  }, [berichten, actief]);

  async function laadAlles() {
    try {
      const data = await haalAccountsOp();
      setAccounts(data);
      setFout(null);
    } catch {
      setFout('WhatsApp VPS niet bereikbaar — controleer of de server actief is');
    }
  }

  async function handleAccountKlik(id: string) {
    setActief(id);
    await markeerGelezen(id);
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ongelezen: 0 } : a));
    try {
      const data = await haalBerichtenOp(id);
      setBerichten(prev => ({ ...prev, [id]: data }));
    } catch {
      console.error('Berichten laden mislukt');
    }
  }

  async function handleVerbinden(id: string) {
    try {
      await verbindAccount(id);
      setTimeout(laadAlles, 2000);
    } catch {
      setFout('Verbinden mislukt — controleer of de VPS actief is');
    }
  }

  async function handleStuur(e: React.FormEvent) {
    e.preventDefault();
    if (!tekst.trim() || !nummer.trim()) return;
    setLoading(true);
    try {
      await stuurBericht(actief, nummer, tekst);
      setTekst('');
      const data = await haalBerichtenOp(actief);
      setBerichten(prev => ({ ...prev, [actief]: data }));
    } catch {
      setFout('Versturen mislukt');
    } finally {
      setLoading(false);
    }
  }

  const actiefAccount = accounts.find(a => a.id === actief);
  const actiefBerichten = berichten[actief] || [];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      height: 'calc(100vh - 200px)',
      border: '1px solid #EEEEEE',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
    }}>

      {/* LINKER KOLOM */}
      <div style={{ borderRight: '1px solid #EEEEEE', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #F3F3F5' }}>
          <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: '#1A1730' }}>WhatsApp accounts</p>
          <p style={{ fontSize: 11, color: '#9590A8', margin: '2px 0 0' }}>3 nummers beheerd via VPS</p>
        </div>

        {fout && (
          <div style={{ margin: 12, padding: '8px 12px', background: '#FEE2E2', borderRadius: 8, fontSize: 12, color: '#991B1B' }}>
            ⚠️ {fout}
          </div>
        )}

        {accounts.length === 0 && !fout && (
          <div style={{ padding: 16, fontSize: 12, color: '#9590A8' }}>Verbinding maken...</div>
        )}

        {accounts.map(account => {
          const kleur = KLEUREN[account.id] || { bg: '#F3F4F6', text: '#374151' };
          const isActief = actief === account.id;
          return (
            <div
              key={account.id}
              onClick={() => handleAccountKlik(account.id)}
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                background: isActief ? '#F9F8FE' : '#fff',
                borderBottom: '1px solid #F7F7F7',
                borderLeft: isActief ? '3px solid #7C3AED' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background:
                  account.status === 'connected' ? '#10B981' :
                  account.status === 'qr_ready' ? '#F59E0B' :
                  account.status === 'connecting' ? '#3B82F6' : '#D1D5DB',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1730' }}>{account.label}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: kleur.bg, color: kleur.text, fontWeight: 600 }}>
                    {account.categorie}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#9590A8', margin: '2px 0 0' }}>
                  {account.status === 'connected' ? `+${account.telefoon}` :
                   account.status === 'qr_ready' ? '📱 Scan QR code' :
                   account.status === 'connecting' ? 'Verbinden...' : 'Niet verbonden'}
                </p>
              </div>
              {(account.ongelezen ?? 0) > 0 && (
                <div style={{
                  background: '#7C3AED', color: '#fff', borderRadius: '50%',
                  width: 18, height: 18, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 700,
                }}>
                  {account.ongelezen}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RECHTER KOLOM */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1730', margin: 0 }}>
              {actiefAccount?.label ?? '—'}
            </p>
            <p style={{
              fontSize: 11, margin: '2px 0 0', fontWeight: 500,
              color: actiefAccount?.status === 'connected' ? '#10B981' : '#9590A8',
            }}>
              {actiefAccount?.status === 'connected' ? `● Verbonden · +${actiefAccount?.telefoon}` :
               actiefAccount?.status === 'qr_ready' ? '● Scan de QR code hieronder' :
               actiefAccount?.status === 'connecting' ? '● Verbinden...' : '● Niet verbonden'}
            </p>
          </div>
          {actiefAccount && actiefAccount.status !== 'connected' && (
            <button
              onClick={() => handleVerbinden(actief)}
              disabled={actiefAccount.status === 'connecting'}
              style={{
                background: actiefAccount.status === 'connecting' ? '#C4B5FD' : '#7C3AED',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '7px 14px', fontSize: 12, fontWeight: 500,
                cursor: actiefAccount.status === 'connecting' ? 'not-allowed' : 'pointer',
              }}
            >
              {actiefAccount.status === 'connecting' ? 'Verbinden...' :
               actiefAccount.status === 'qr_ready' ? 'Nieuwe QR' : 'Verbinden'}
            </button>
          )}
        </div>

        {/* QR Code */}
        {actiefAccount?.status === 'qr_ready' && actiefAccount?.qr && (
          <div style={{
            padding: 24, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 12, borderBottom: '1px solid #EEEEEE', background: '#FAFAFA', flexShrink: 0,
          }}>
            <img src={actiefAccount.qr} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12 }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1730', margin: '0 0 4px' }}>Scan met WhatsApp</p>
              <p style={{ fontSize: 12, color: '#9590A8', margin: 0 }}>
                WhatsApp → Instellingen → Gekoppelde apparaten → Apparaat koppelen
              </p>
            </div>
          </div>
        )}

        {/* Berichten */}
        <div
          ref={berichtenRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {actiefBerichten.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#C4BED8', fontSize: 13 }}>
              {actiefAccount?.status === 'connected'
                ? 'Geen berichten — inkomende berichten verschijnen hier automatisch'
                : 'Koppel eerst een WhatsApp nummer via de "Verbinden" knop'}
            </div>
          )}
          {actiefBerichten.map(bericht => (
            <div key={bericht.id} style={{
              display: 'flex',
              flexDirection: bericht.inkomend ? 'row' : 'row-reverse',
              gap: 8, alignItems: 'flex-end',
            }}>
              {bericht.inkomend && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#F0EEFF',
                  color: '#7C3AED', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {bericht.naam?.charAt(0) ?? '?'}
                </div>
              )}
              <div style={{ maxWidth: '70%' }}>
                {bericht.inkomend && (
                  <p style={{ fontSize: 10, color: '#9590A8', margin: '0 0 3px 4px', fontWeight: 500 }}>
                    {bericht.naam} · +{bericht.van}
                  </p>
                )}
                <div style={{
                  background: bericht.inkomend ? '#F9F8FE' : '#7C3AED',
                  color: bericht.inkomend ? '#1A1730' : '#fff',
                  borderRadius: bericht.inkomend ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  padding: '10px 14px', fontSize: 13, lineHeight: 1.5,
                }}>
                  {bericht.tekst}
                </div>
                <p style={{
                  fontSize: 10, color: '#C4BED8', margin: '3px 4px 0',
                  textAlign: bericht.inkomend ? 'left' : 'right',
                }}>
                  {new Date(bericht.tijdstip).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stuur bericht */}
        {actiefAccount?.status === 'connected' && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #EEEEEE', flexShrink: 0 }}>
            <form onSubmit={handleStuur} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={nummer}
                onChange={e => setNummer(e.target.value)}
                placeholder="Nummer (bijv. 31612345678)"
                style={{
                  border: '1px solid #EEEEEE', borderRadius: 8,
                  padding: '8px 12px', fontSize: 12, fontFamily: 'Inter, sans-serif', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={tekst}
                  onChange={e => setTekst(e.target.value)}
                  placeholder="Typ een bericht..."
                  style={{
                    flex: 1, border: '1px solid #EEEEEE', borderRadius: 8,
                    padding: '10px 14px', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !tekst.trim() || !nummer.trim()}
                  style={{
                    background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '10px 18px', fontSize: 13, fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? '...' : 'Stuur'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
