import { useState, useEffect, useRef, useMemo } from 'react';
import {
  haalGesprekken,
  haalBerichten,
  stuurBericht,
  markeerGelezen,
  haalStats,
  haalWebhookStatus,
  registreerWebhook,
  updateContactInfo,
  type Conversation,
  type Message,
  type Stats,
  type WebhookStatus,
} from '../../api/whatsappClient';

const NAVY = '#1F3A5F';
const FONT = "'Poppins', system-ui, -apple-system, sans-serif";

type Tab = 'candidate' | 'prospect' | 'unmatched';

const TAB_LABELS: Record<Tab, string> = {
  candidate: 'Kandidaten',
  prospect: 'Prospects',
  unmatched: 'Onbekend',
};

const STATUS_LABEL: Record<string, string> = {
  queued: '⌛ in wachtrij',
  sent: '✓ verzonden',
  delivered: '✓✓ bezorgd',
  read: '✓✓ gelezen',
  failed: '✗ mislukt',
  received: '',
};

const STATUS_COLOR: Record<string, string> = {
  queued: '#9CA3AF',
  sent: '#9CA3AF',
  delivered: '#6B7280',
  read: '#10B981',
  failed: '#DC2626',
};

export default function WhatsAppBeheer() {
  const [tab, setTab] = useState<Tab>('candidate');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookMsg, setWebhookMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [editingContact, setEditingContact] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const [c, s] = await Promise.all([haalGesprekken(tab), haalStats()]);
        if (!stop) {
          setConversations(c);
          setStats(s);
        }
      } catch { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { stop = true; clearInterval(id); };
  }, [tab]);

  useEffect(() => { haalWebhookStatus().then(setWebhookStatus).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedPhone) { setMessages([]); return; }
    let stop = false;
    const tick = async () => {
      try {
        const m = await haalBerichten(selectedPhone);
        if (!stop) setMessages(m);
      } catch { /* ignore */ }
    };
    tick();
    markeerGelezen(selectedPhone).catch(() => {});
    const id = setInterval(tick, 4000);
    return () => { stop = true; clearInterval(id); };
  }, [selectedPhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      (c.displayName?.toLowerCase().includes(q)) || c.phoneNumber.includes(search)
    );
  }, [conversations, search]);

  const selectedConv = conversations.find(c => c.phoneNumber === selectedPhone);

  const within24h = useMemo(() => {
    if (!selectedConv?.lastInboundAt) return false;
    const last = new Date(selectedConv.lastInboundAt).getTime();
    return Date.now() - last < 24 * 60 * 60 * 1000;
  }, [selectedConv]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selectedPhone) return;
    setSending(true);
    setSendError(null);
    try {
      await stuurBericht(selectedPhone, reply);
      setReply('');
      const m = await haalBerichten(selectedPhone);
      setMessages(m);
    } catch (e: any) {
      setSendError(e.message || 'Versturen mislukt');
    } finally {
      setSending(false);
    }
  }

  async function handleRegisterWebhook() {
    setWebhookBusy(true);
    setWebhookMsg(null);
    try {
      await registreerWebhook();
      setWebhookMsg({ kind: 'ok', text: 'Webhook geregistreerd bij 360dialog' });
      setWebhookStatus(await haalWebhookStatus());
    } catch (e: any) {
      setWebhookMsg({ kind: 'err', text: e.message?.includes('Bad request') || e.message?.includes('permission')
        ? 'Webhook kan niet via API gezet worden — vraag 360dialog support om de URL handmatig in te stellen.'
        : (e.message || 'Mislukt') });
    } finally {
      setWebhookBusy(false);
    }
  }

  function openEditContact() {
    if (!selectedConv) return;
    setEditName(selectedConv.displayName || '');
    setEditCompany(selectedConv.contactCompany || '');
    setEditNotes(selectedConv.contactNotes || '');
    setEditingContact(true);
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !editName.trim()) return;
    setEditSaving(true);
    try {
      await updateContactInfo(selectedPhone, {
        displayName: editName.trim(),
        contactCompany: editCompany.trim() || undefined,
        contactNotes: editNotes.trim() || undefined,
      });
      setEditingContact(false);
      const c = await haalGesprekken(tab);
      setConversations(c);
    } catch { /* ignore */ }
    setEditSaving(false);
  }

  function convDisplayName(c: Conversation): string {
    if (c.matchCategory === 'candidate' && c.displayName) return c.displayName;
    if (c.matchCategory === 'prospect' && c.displayName) return c.displayName;
    if (c.matchCategory === 'unmatched' && c.displayName) return c.displayName;
    return 'Onbekend';
  }

  function threadSubline(c: Conversation): string {
    const phone = `+${c.phoneNumber}`;
    if (c.matchCategory === 'candidate') {
      return `${phone} · Kandidaat${c.candidateId ? ` · #${c.candidateId}` : ''}`;
    }
    if (c.matchCategory === 'prospect') {
      return `${phone} · Prospect${c.contactCompany ? ` · ${c.contactCompany}` : (c.prospectContactId ? ` · #${c.prospectContactId}` : '')}`;
    }
    if (c.displayName) {
      return `${phone} · Onbekend${c.contactCompany ? ` · ${c.contactCompany}` : ''}`;
    }
    return `${phone} · Onbekend`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 500, fontFamily: FONT }}>

      {/* Titel + instellingen-icoon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: NAVY }}>WhatsApp</h2>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Beheer 3 WhatsApp nummers — Horeca, Logistiek en Housekeeping</div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          title="Webhook-instellingen"
          style={{
            background: showSettings ? '#F0F4FA' : 'transparent',
            border: '1px solid #E5E7EB', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', fontSize: 16, color: '#6B7280',
          }}
        >
          ⚙
        </button>
      </div>

      {/* Webhook-instellingen (opklapbaar) */}
      {showSettings && (
        <div style={{
          padding: '12px 16px', background: '#FAFBFC', border: '1px solid #E5E7EB',
          borderRadius: 10, marginBottom: 12, fontSize: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ color: '#374151', flex: 1 }}>
              <strong style={{ color: NAVY }}>Webhook:</strong>{' '}
              {webhookStatus?.configured && webhookStatus.url
                ? <span style={{ color: '#059669', fontFamily: 'monospace', wordBreak: 'break-all' }}>{webhookStatus.url}</span>
                : <span style={{ color: '#DC2626' }}>niet geregistreerd bij 360dialog</span>}
              {!webhookStatus?.secretSet && (
                <span style={{ color: '#DC2626', marginLeft: 8 }}>· WHATSAPP_WEBHOOK_SECRET ontbreekt</span>
              )}
            </div>
            <button
              onClick={handleRegisterWebhook}
              disabled={webhookBusy || !webhookStatus?.secretSet}
              style={{
                background: webhookBusy || !webhookStatus?.secretSet ? '#E5E7EB' : NAVY,
                color: webhookBusy || !webhookStatus?.secretSet ? '#9CA3AF' : '#fff',
                border: 'none', borderRadius: 6, padding: '6px 12px',
                fontSize: 12, fontWeight: 600, cursor: webhookBusy ? 'wait' : 'pointer', flexShrink: 0,
              }}
            >
              {webhookBusy ? 'Bezig...' : 'Webhook registreren'}
            </button>
          </div>
          {webhookMsg && (
            <div style={{
              marginTop: 8, padding: '6px 10px', borderRadius: 6, fontSize: 11,
              background: webhookMsg.kind === 'ok' ? '#F0FDF4' : '#FEF2F2',
              color: webhookMsg.kind === 'ok' ? '#059669' : '#DC2626',
              border: `1px solid ${webhookMsg.kind === 'ok' ? '#BBF7D0' : '#FECACA'}`,
            }}>
              {webhookMsg.text}
            </div>
          )}
        </div>
      )}

      {/* Hoofdgrid */}
      <div style={{ display: 'flex', flex: 1, gap: 12, minHeight: 0 }}>

        {/* Linkerkolom: gesprekkenlijst */}
        <div style={{
          width: 340, display: 'flex', flexDirection: 'column',
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC' }}>
            {(Object.keys(TAB_LABELS) as Tab[]).map(t => {
              const active = tab === t;
              const unread = stats?.[t]?.unread ?? 0;
              return (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSelectedPhone(null); }}
                  style={{
                    flex: 1, padding: '12px 8px', border: 'none', background: 'none',
                    fontSize: 12, fontWeight: 600,
                    color: active ? NAVY : '#6B7280',
                    borderBottom: active ? `2px solid ${NAVY}` : '2px solid transparent',
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  {TAB_LABELS[t]} {unread > 0 && (
                    <span style={{
                      background: '#DC2626', color: '#fff', borderRadius: 10,
                      padding: '1px 6px', fontSize: 10, marginLeft: 4,
                    }}>{unread}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Zoekbalk */}
          <div style={{ padding: 10, borderBottom: '1px solid #E5E7EB' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op naam of nummer..."
              style={{
                width: '100%', padding: '8px 10px', fontSize: 12,
                border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none',
                fontFamily: FONT, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Gesprekkenlijst */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                {search ? 'Geen resultaten' : 'Geen gesprekken in deze categorie'}
              </div>
            )}
            {filteredConversations.map(c => {
              const selected = c.phoneNumber === selectedPhone;
              const unread = c.unreadCount > 0;
              const name = convDisplayName(c);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedPhone(c.phoneNumber)}
                  style={{
                    padding: '12px 14px',
                    background: selected ? '#F0F4FA' : '#fff',
                    borderLeft: selected ? `3px solid ${NAVY}` : '3px solid transparent',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{
                      fontSize: 13, fontWeight: unread ? 700 : 500,
                      color: name === 'Onbekend' ? '#9CA3AF' : NAVY,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0, marginLeft: 6 }}>
                      {timeAgo(c.lastMessageAt)}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>+{c.phoneNumber}</div>
                  <div style={{
                    fontSize: 12, color: unread ? '#1F2937' : '#6B7280',
                    fontWeight: unread ? 600 : 400,
                    marginTop: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: 280,
                  }}>
                    {(c.lastMessagePreview || '—').slice(0, 60)}
                  </div>
                  {unread && (
                    <div style={{
                      display: 'inline-block', marginTop: 4,
                      background: '#DC2626', color: '#fff', borderRadius: 10,
                      padding: '0 7px', fontSize: 10, fontWeight: 700,
                    }}>{c.unreadCount}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rechterkolom: thread */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
          minWidth: 0,
        }}>
          {!selectedConv && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9CA3AF', fontSize: 13,
            }}>
              Selecteer een gesprek links
            </div>
          )}

          {selectedConv && (
            <>
              {/* Thread header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
                    {selectedConv.matchCategory === 'candidate' && selectedConv.candidateId ? (
                      <a href={`/admin/kandidaten/${selectedConv.candidateId}`} style={{ color: NAVY, textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {convDisplayName(selectedConv)}
                      </a>
                    ) : selectedConv.matchCategory === 'prospect' && selectedConv.prospectContactId ? (
                      <a href={`/admin/prospects`} style={{ color: NAVY, textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {convDisplayName(selectedConv)}
                      </a>
                    ) : (
                      convDisplayName(selectedConv)
                    )}
                  </div>
                  {selectedConv.matchCategory === 'unmatched' && (
                    <button
                      onClick={openEditContact}
                      title={selectedConv.displayName ? 'Naam bewerken' : 'Naam toevoegen'}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 14, color: '#6B7280', padding: '2px 4px',
                      }}
                    >
                      ✏️
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  {threadSubline(selectedConv)}
                </div>
              </div>

              {/* Contact bewerk-formulier */}
              {editingContact && selectedConv.matchCategory === 'unmatched' && (
                <div style={{
                  padding: '12px 18px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
                }}>
                  <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 2 }}>Contact bewerken</div>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Voornaam (verplicht)"
                      required
                      style={{
                        padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB',
                        borderRadius: 6, outline: 'none', fontFamily: FONT,
                      }}
                    />
                    <input
                      value={editCompany}
                      onChange={e => setEditCompany(e.target.value)}
                      placeholder="Bedrijf / context (optioneel)"
                      style={{
                        padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB',
                        borderRadius: 6, outline: 'none', fontFamily: FONT,
                      }}
                    />
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Notities (optioneel)"
                      rows={2}
                      style={{
                        padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB',
                        borderRadius: 6, outline: 'none', fontFamily: FONT, resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="submit"
                        disabled={editSaving || !editName.trim()}
                        style={{
                          background: editSaving || !editName.trim() ? '#E5E7EB' : NAVY,
                          color: editSaving || !editName.trim() ? '#9CA3AF' : '#fff',
                          border: 'none', borderRadius: 6, padding: '6px 14px',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                        }}
                      >
                        {editSaving ? 'Opslaan...' : 'Opslaan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingContact(false)}
                        style={{
                          background: '#fff', color: '#6B7280',
                          border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 14px',
                          fontSize: 12, cursor: 'pointer', fontFamily: FONT,
                        }}
                      >
                        Annuleren
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Berichten */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px', background: '#F8F9FB' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 40 }}>
                    Geen berichten in dit gesprek
                  </div>
                )}
                {messages.map(m => (
                  <div key={m.id} style={{
                    display: 'flex',
                    justifyContent: m.direction === 'inbound' ? 'flex-start' : 'flex-end',
                    marginBottom: 10,
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      background: m.direction === 'inbound' ? '#fff' : NAVY,
                      color: m.direction === 'inbound' ? '#1F2937' : '#fff',
                      padding: '8px 12px',
                      borderRadius: m.direction === 'inbound' ? '10px 10px 10px 2px' : '10px 10px 2px 10px',
                      border: m.direction === 'inbound' ? '1px solid #E5E7EB' : 'none',
                      fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                    }}>
                      {m.body}
                      <div style={{
                        fontSize: 10, marginTop: 4,
                        color: m.direction === 'inbound' ? '#9CA3AF' : 'rgba(255,255,255,0.7)',
                        textAlign: 'right',
                      }}>
                        {new Date(m.createdAt).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        {m.direction === 'outbound' && (
                          <span style={{
                            marginLeft: 6,
                            color: m.status === 'failed' ? '#FCA5A5' : 'inherit',
                          }}>
                            {STATUS_LABEL[m.status] || m.status}
                          </span>
                        )}
                      </div>
                      {m.errorMessage && (
                        <div style={{ fontSize: 10, color: '#FCA5A5', marginTop: 2 }}>{m.errorMessage}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply-form */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
                {!within24h && (
                  <div style={{
                    padding: '8px 12px', background: '#FFF7ED', border: '1px solid #FED7AA',
                    borderRadius: 6, fontSize: 11, color: '#9A3412', marginBottom: 8,
                  }}>
                    ⚠ 24u-venster mogelijk verstreken — WhatsApp kan vrije tekstberichten afwijzen.
                    Stuur een template of wacht tot deze persoon iets stuurt.
                  </div>
                )}
                {sendError && (
                  <div style={{
                    padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 6, fontSize: 11, color: '#DC2626', marginBottom: 8,
                  }}>
                    {sendError}
                  </div>
                )}
                <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder={within24h ? 'Typ een antwoord...' : 'Typ een antwoord (24u-venster mogelijk verlopen)...'}
                    disabled={sending}
                    style={{
                      flex: 1, padding: '10px 14px', fontSize: 13,
                      border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none',
                      fontFamily: FONT,
                      background: '#fff',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    style={{
                      background: (sending || !reply.trim()) ? '#E5E7EB' : NAVY,
                      color: (sending || !reply.trim()) ? '#9CA3AF' : '#fff',
                      border: 'none', borderRadius: 6, padding: '0 18px',
                      fontSize: 13, fontWeight: 600,
                      cursor: (sending || !reply.trim()) ? 'not-allowed' : 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    {sending ? '...' : 'Stuur'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'nu';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });
}
