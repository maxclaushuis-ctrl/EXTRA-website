import { useState, useEffect, useRef } from 'react';
import { haalAccountsOp, haalBerichtenOp, stuurBericht, haalWebhookStatus, registreerWebhook } from '../../api/whatsappClient';

interface Bericht {
  id: string;
  inkomend: boolean;
  naam?: string | null;
  van?: string | null;
  tekst: string;
  tijdstip: string;
}

export default function WhatsAppBeheer() {
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [nummer, setNummer] = useState('');
  const [tekst, setTekst] = useState('');
  const [loading, setLoading] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [webhookFout, setWebhookFout] = useState<string | null>(null);
  const [webhookSucces, setWebhookSucces] = useState<string | null>(null);
  const berichtenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    laadStatus();
    laadBerichten();
    laadWebhookStatus();
    const interval = setInterval(() => {
      laadStatus();
      laadBerichten();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (berichtenRef.current) {
      berichtenRef.current.scrollTop = berichtenRef.current.scrollHeight;
    }
  }, [berichten]);

  async function laadStatus() {
    try {
      const data = await haalAccountsOp();
      setStatus(data?.[0]?.status === 'connected' ? 'connected' : 'disconnected');
      setFout(null);
    } catch {
      setStatus('disconnected');
      setFout('360dialog niet bereikbaar — controleer de API key');
    }
  }

  async function laadWebhookStatus() {
    try {
      const data = await haalWebhookStatus();
      setWebhookUrl(data?.url || null);
    } catch {}
  }

  async function laadBerichten() {
    try {
      const data = await haalBerichtenOp();
      setBerichten(data);
    } catch {}
  }

  async function handleRegistreerWebhook() {
    setWebhookLoading(true);
    setWebhookFout(null);
    setWebhookSucces(null);
    try {
      const result = await registreerWebhook('https://doehetextra.nl/api/whatsapp/webhook');
      setWebhookSucces('Webhook succesvol geregistreerd bij 360dialog');
      setWebhookUrl('https://doehetextra.nl/api/whatsapp/webhook');
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('Bad request') || msg.includes('400') || msg.includes('permission')) {
        setWebhookFout(
          'Webhook instellen is geblokkeerd door 360dialog (accountbeperking). ' +
          'Stuur een e-mail naar support@360dialog.com of open een ticket en vraag om: ' +
          '"Please set webhook URL to https://doehetextra.nl/api/whatsapp/webhook for our channel."'
        );
      } else {
        setWebhookFout(msg || 'Registreren mislukt');
      }
    } finally {
      setWebhookLoading(false);
    }
  }

  async function handleStuur(e: React.FormEvent) {
    e.preventDefault();
    if (!tekst.trim() || !nummer.trim()) return;
    setLoading(true);
    setFout(null);
    try {
      await stuurBericht(nummer, tekst);
      setTekst('');
      await laadBerichten();
    } catch {
      setFout('Versturen mislukt — controleer het nummer en de API key');
    } finally {
      setLoading(false);
    }
  }

  const webhookOk = webhookUrl && webhookUrl.includes('doehetextra.nl');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Instellingen-kaart */}
      <div style={{
        border: '1px solid #EEEEEE', borderRadius: 12, background: '#fff',
        padding: '20px 24px',
      }}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 16px', color: '#1A1730' }}>⚙️ Verbindingsinstellingen</p>

        {/* API-verbindingsstatus */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#1A1730' }}>360dialog API-verbinding</p>
            <p style={{ fontSize: 11, margin: '2px 0 0', color: '#9590A8' }}>
              Gebruikt WHATSAPP_360_API_KEY · waba-v2.360dialog.io
            </p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: status === 'connected' ? '#D1FAE5' : '#FEF2F2',
            color: status === 'connected' ? '#065F46' : '#DC2626',
          }}>
            {status === 'connected' ? '● Verbonden' : '● Niet verbonden'}
          </span>
        </div>

        <div style={{ height: 1, background: '#F3F4F6', margin: '12px 0' }} />

        {/* Webhook-status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#1A1730' }}>Inkomende berichten (webhook)</p>
            <p style={{ fontSize: 11, margin: '2px 0 0', color: webhookOk ? '#059669' : '#9590A8', fontFamily: 'monospace' }}>
              {webhookUrl
                ? webhookUrl
                : 'Nog niet geregistreerd bij 360dialog'}
            </p>
          </div>
          <button
            onClick={handleRegistreerWebhook}
            disabled={webhookLoading}
            style={{
              background: webhookOk ? '#F0FDF4' : '#7C3AED',
              color: webhookOk ? '#059669' : '#fff',
              border: webhookOk ? '1px solid #BBF7D0' : 'none',
              borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: webhookLoading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {webhookLoading ? 'Bezig...' : webhookOk ? '✓ Herregistreer' : 'Registreer webhook →'}
          </button>
        </div>

        {webhookFout && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
            <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>⚠ {webhookFout}</p>
          </div>
        )}
        {webhookSucces && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
            <p style={{ fontSize: 12, color: '#059669', margin: 0 }}>✓ {webhookSucces}</p>
          </div>
        )}
      </div>

      {/* Chat-interface */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 360px)',
        minHeight: 400,
        border: '1px solid #EEEEEE',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #EEEEEE',
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: '#D1FAE5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: '#1A1730' }}>WhatsApp Business</p>
            <p style={{ fontSize: 12, margin: '2px 0 0', fontWeight: 500, color: status === 'connected' ? '#10B981' : '#9590A8' }}>
              {status === 'connected' ? '● Verbonden via 360dialog' : '● Niet verbonden'}
            </p>
          </div>
        </div>

        {fout && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>⚠ {fout}</p>
          </div>
        )}

        {/* Berichten */}
        <div
          ref={berichtenRef}
          style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {berichten.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#C4BED8' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>Geen berichten</p>
              <p style={{ fontSize: 12, margin: '6px 0 0', color: '#D1D5DB' }}>
                Stuur een bericht of wacht op inkomende berichten via de webhook
              </p>
            </div>
          )}
          {[...berichten].reverse().map(bericht => (
            <div key={bericht.id} style={{
              display: 'flex',
              flexDirection: bericht.inkomend ? 'row' : 'row-reverse',
              gap: 10, alignItems: 'flex-end',
            }}>
              {bericht.inkomend && (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#F0EEFF',
                  color: '#7C3AED', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {bericht.naam?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              <div style={{ maxWidth: '65%' }}>
                {bericht.inkomend && bericht.naam && (
                  <p style={{ fontSize: 11, color: '#9590A8', margin: '0 0 3px 4px', fontWeight: 600 }}>
                    {bericht.naam}{bericht.van ? ` · +${bericht.van}` : ''}
                  </p>
                )}
                <div style={{
                  background: bericht.inkomend ? '#F9F8FE' : '#7C3AED',
                  color: bericht.inkomend ? '#1A1730' : '#fff',
                  borderRadius: bericht.inkomend ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  {bericht.tekst}
                </div>
                <p style={{
                  fontSize: 10, color: '#C4BED8', margin: '4px 4px 0',
                  textAlign: bericht.inkomend ? 'left' : 'right',
                }}>
                  {new Date(bericht.tijdstip).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stuur bericht */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #EEEEEE', flexShrink: 0, background: '#FAFAFA' }}>
          <form onSubmit={handleStuur} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={nummer}
              onChange={e => setNummer(e.target.value)}
              placeholder="Ontvanger nummer (bijv. 31612345678)"
              style={{
                border: '1px solid #E5E7EB', borderRadius: 8,
                padding: '8px 12px', fontSize: 12,
                fontFamily: 'Inter, sans-serif', outline: 'none', background: '#fff',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={tekst}
                onChange={e => setTekst(e.target.value)}
                placeholder="Typ een bericht..."
                style={{
                  flex: 1, border: '1px solid #E5E7EB', borderRadius: 8,
                  padding: '10px 14px', fontSize: 13,
                  fontFamily: 'Inter, sans-serif', outline: 'none', background: '#fff',
                }}
              />
              <button
                type="submit"
                disabled={loading || !tekst.trim() || !nummer.trim()}
                style={{
                  background: loading || !tekst.trim() || !nummer.trim() ? '#C4B5FD' : '#7C3AED',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '10px 20px', fontSize: 13, fontWeight: 600,
                  cursor: loading || !tekst.trim() || !nummer.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {loading ? 'Versturen...' : 'Stuur →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
