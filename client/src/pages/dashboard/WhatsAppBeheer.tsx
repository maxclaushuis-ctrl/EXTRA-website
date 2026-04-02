import { useState, useEffect, useRef } from 'react';

type AccountId = 'horeca' | 'logistiek' | 'housekeeping';

interface AccountState {
  id: AccountId;
  label: string;
  categorie: string;
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected';
  telefoon: string | null;
  qr: string | null;
  lastSeen: string | null;
  berichtenCount: number;
  ongelezen: number;
}

interface Bericht {
  id: string;
  accountId: AccountId;
  van?: string;
  naar?: string;
  naam?: string;
  tekst: string;
  tijdstip: string;
  gelezen: boolean;
  inkomend: boolean;
}

const ACCOUNT_KLEUREN: Record<AccountId, { bg: string; text: string }> = {
  horeca:       { bg: '#FEF3C7', text: '#92400E' },
  logistiek:    { bg: '#DBEAFE', text: '#1E40AF' },
  housekeeping: { bg: '#D1FAE5', text: '#065F46' },
};

function statusDot(status: AccountState['status']) {
  if (status === 'connected') return '#10B981';
  if (status === 'qr_ready') return '#F59E0B';
  if (status === 'connecting') return '#A78BFA';
  return '#D1D5DB';
}

function statusLabel(account: AccountState) {
  if (account.status === 'connected') return `● Verbonden${account.telefoon ? ` · +${account.telefoon}` : ''}`;
  if (account.status === 'qr_ready') return '● Scan QR code om te verbinden';
  if (account.status === 'connecting') return '● Verbinden...';
  return '● Niet verbonden';
}

function statusColor(status: AccountState['status']) {
  if (status === 'connected') return '#10B981';
  if (status === 'qr_ready') return '#F59E0B';
  if (status === 'connecting') return '#A78BFA';
  return '#9590A8';
}

export default function WhatsAppBeheer() {
  const [accounts, setAccounts] = useState<AccountState[]>([]);
  const [actief, setActief] = useState<AccountId>('horeca');
  const [berichten, setBerichten] = useState<Record<string, Bericht[]>>({});
  const [nieuwBericht, setNieuwBericht] = useState('');
  const [ontvangerNummer, setOntvangerNummer] = useState('');
  const [loading, setLoading] = useState(false);
  const berichtenRef = useRef<HTMLDivElement>(null);

  async function laadBerichten(id: AccountId) {
    try {
      const res = await fetch(`/api/whatsapp/accounts/${id}/berichten`);
      if (!res.ok) return;
      const data: Bericht[] = await res.json();
      setBerichten(prev => ({ ...prev, [id]: data }));
    } catch {/* silent */}
  }

  useEffect(() => {
    fetch('/api/whatsapp/accounts')
      .then(r => r.ok ? r.json() : [])
      .then((data: AccountState[]) => setAccounts(data))
      .catch(() => {});

    (['horeca', 'logistiek', 'housekeeping'] as AccountId[]).forEach(laadBerichten);

    const sse = new EventSource('/api/whatsapp/stream');

    sse.addEventListener('status', (e) => {
      const { id, state } = JSON.parse((e as MessageEvent).data);
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...state } : a));
    });

    sse.addEventListener('qr', (e) => {
      const { id, qr } = JSON.parse((e as MessageEvent).data);
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, qr, status: 'qr_ready' } : a));
    });

    sse.addEventListener('bericht', (e) => {
      const { id, bericht } = JSON.parse((e as MessageEvent).data);
      setBerichten(prev => ({ ...prev, [id]: [bericht, ...(prev[id] || [])] }));
    });

    return () => sse.close();
  }, []);

  useEffect(() => {
    if (berichtenRef.current) {
      berichtenRef.current.scrollTop = 0;
    }
  }, [actief]);

  async function handleAccountKlik(id: AccountId) {
    setActief(id);
    await fetch(`/api/whatsapp/accounts/${id}/gelezen`, { method: 'POST' }).catch(() => {});
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ongelezen: 0 } : a));
  }

  async function handleVerbinden(id: AccountId) {
    await fetch(`/api/whatsapp/accounts/${id}/connect`, { method: 'POST' }).catch(() => {});
  }

  async function handleStuurBericht(e: React.FormEvent) {
    e.preventDefault();
    if (!nieuwBericht.trim() || !ontvangerNummer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/accounts/${actief}/stuur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nummer: ontvangerNummer, tekst: nieuwBericht }),
      });
      if (res.ok) {
        setNieuwBericht('');
        await laadBerichten(actief);
      }
    } catch {/* silent */}
    finally { setLoading(false); }
  }

  const actiefAccount = accounts.find(a => a.id === actief);
  const actiefBerichten = berichten[actief] || [];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      height: 'calc(100vh - 120px)',
      gap: 0,
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #EEEEEE',
      overflow: 'hidden',
    }}>
      {/* ── Linker kolom: account lijst ── */}
      <div style={{ borderRight: '1px solid #EEEEEE', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F0EFF8' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1730', margin: 0 }}>WhatsApp accounts</p>
          <p style={{ fontSize: 11, color: '#9590A8', margin: '3px 0 0' }}>3 nummers beheerd via Baileys</p>
        </div>

        {accounts.length === 0 ? (
          <div style={{ padding: 24, color: '#C4BED8', fontSize: 12, textAlign: 'center' }}>
            Laden...
          </div>
        ) : accounts.map(account => {
          const kleur = ACCOUNT_KLEUREN[account.id];
          const isActief = actief === account.id;
          return (
            <div
              key={account.id}
              onClick={() => handleAccountKlik(account.id)}
              style={{
                padding: '13px 16px',
                cursor: 'pointer',
                background: isActief ? '#F3F0FD' : 'transparent',
                borderBottom: '1px solid #F0EEF8',
                borderLeft: isActief ? '3px solid #7C3AED' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: statusDot(account.status),
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1730' }}>{account.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: kleur.bg, color: kleur.text }}>
                    {account.categorie}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#9590A8', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {account.status === 'connected' ? (account.telefoon ? `+${account.telefoon}` : 'Verbonden') :
                   account.status === 'qr_ready' ? 'Scan QR code' :
                   account.status === 'connecting' ? 'Verbinden...' : 'Niet verbonden'}
                </p>
              </div>
              {account.ongelezen > 0 && (
                <div style={{
                  background: '#7C3AED', color: '#fff', borderRadius: '50%',
                  width: 18, height: 18, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>
                  {account.ongelezen}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Rechter kolom: chat + QR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: '13px 20px', borderBottom: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1730', margin: 0 }}>{actiefAccount?.label ?? '—'}</p>
            <p style={{ fontSize: 11, color: statusColor(actiefAccount?.status ?? 'disconnected'), margin: '2px 0 0', fontWeight: 500 }}>
              {actiefAccount ? statusLabel(actiefAccount) : ''}
            </p>
          </div>
          {actiefAccount?.status === 'disconnected' && (
            <button
              onClick={() => handleVerbinden(actief)}
              style={{
                background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8,
                padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Verbinden
            </button>
          )}
        </div>

        {/* QR code */}
        {actiefAccount?.status === 'qr_ready' && actiefAccount?.qr && (
          <div style={{
            padding: '28px 20px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 14, borderBottom: '1px solid #EEEEEE', background: '#FAFAFA', flexShrink: 0,
          }}>
            <img src={actiefAccount.qr} alt="QR Code" style={{ width: 188, height: 188, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1730', margin: '0 0 4px' }}>Scan met WhatsApp</p>
              <p style={{ fontSize: 11, color: '#9590A8', margin: 0 }}>
                Open WhatsApp → Instellingen → Gekoppelde apparaten → Apparaat koppelen
              </p>
            </div>
          </div>
        )}

        {/* Berichten */}
        <div ref={berichtenRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {actiefBerichten.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#C4BED8', fontSize: 13 }}>
              {actiefAccount?.status === 'connected'
                ? 'Geen berichten — inkomende berichten verschijnen hier automatisch'
                : 'Koppel dit account om berichten te ontvangen'}
            </div>
          )}
          {actiefBerichten.map(bericht => (
            <div
              key={bericht.id}
              style={{ display: 'flex', flexDirection: bericht.inkomend ? 'row' : 'row-reverse', gap: 8, alignItems: 'flex-end' }}
            >
              {bericht.inkomend && (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', background: '#F0EEFF',
                  color: '#7C3AED', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {bericht.naam?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div style={{ maxWidth: '70%' }}>
                {bericht.inkomend && (
                  <p style={{ fontSize: 10, color: '#9590A8', margin: '0 0 3px 4px', fontWeight: 500 }}>
                    {bericht.naam}{bericht.van ? ` · +${bericht.van}` : ''}
                  </p>
                )}
                <div style={{
                  background: bericht.inkomend ? '#F9F8FE' : '#7C3AED',
                  color: bericht.inkomend ? '#1A1730' : '#fff',
                  borderRadius: bericht.inkomend ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  padding: '9px 13px', fontSize: 13, lineHeight: 1.5,
                }}>
                  {bericht.tekst}
                </div>
                <p style={{ fontSize: 10, color: '#C4BED8', margin: '3px 4px 0', textAlign: bericht.inkomend ? 'left' : 'right' }}>
                  {new Date(bericht.tijdstip).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stuur bericht */}
        {actiefAccount?.status === 'connected' && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #EEEEEE', background: '#fff', flexShrink: 0 }}>
            <form onSubmit={handleStuurBericht} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={ontvangerNummer}
                onChange={e => setOntvangerNummer(e.target.value)}
                placeholder="Ontvangers nummer (bijv. 31612345678)"
                style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none', fontFamily: 'Inter, sans-serif' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={nieuwBericht}
                  onChange={e => setNieuwBericht(e.target.value)}
                  placeholder="Typ een bericht..."
                  style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 13px', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                />
                <button
                  type="submit"
                  disabled={loading || !nieuwBericht.trim() || !ontvangerNummer.trim()}
                  style={{
                    background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    opacity: (loading || !nieuwBericht.trim() || !ontvangerNummer.trim()) ? 0.5 : 1,
                    transition: 'opacity 0.15s',
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
