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
  haalTeamMembers,
  wijsGesprekToe,
  updateLabels,
  haalNotities,
  maakNotitie,
  type Conversation,
  type Message,
  type Stats,
  type WebhookStatus,
  type TeamMember,
  type InternalNote,
} from '../../api/whatsappClient';

const NAVY = '#1F3A5F';
const FONT = "'Poppins', system-ui, -apple-system, sans-serif";

type Tab = 'candidate' | 'prospect' | 'unmatched';
type ThreadView = 'messages' | 'notes';
type FilterUnread = 'all' | 'unread';

const TAB_LABELS: Record<Tab, string> = {
  candidate: 'Medewerkers',
  prospect: 'Klanten',
  unmatched: 'Kandidaten',
};

const STATUS_LABEL: Record<string, string> = {
  queued: '\u231B in wachtrij',
  sent: '\u2713 verzonden',
  delivered: '\u2713\u2713 bezorgd',
  read: '\u2713\u2713 gelezen',
  failed: '\u2717 mislukt',
  received: '',
};

const LABEL_COLORS: Record<string, string> = {
  urgent: '#DC2626',
  opvolgen: '#F59E0B',
  wacht: '#6366F1',
  belangrijk: '#059669',
  nieuw: '#3B82F6',
};

function labelColor(label: string): string {
  return LABEL_COLORS[label] || '#6B7280';
}

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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [threadView, setThreadView] = useState<ThreadView>('messages');
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [filterUnread, setFilterUnread] = useState<FilterUnread>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [labelInput, setLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    haalWebhookStatus().then(setWebhookStatus).catch(() => {});
    haalTeamMembers().then(setTeamMembers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPhone) { setMessages([]); setNotes([]); setThreadView('messages'); return; }
    let stop = false;
    const tick = async () => {
      try {
        const m = await haalBerichten(selectedPhone);
        if (!stop) setMessages(m);
      } catch { /* ignore */ }
    };
    tick();
    markeerGelezen(selectedPhone).catch(() => {});
    haalNotities(selectedPhone).then(setNotes).catch(() => {});
    const id = setInterval(tick, 4000);
    return () => { stop = true; clearInterval(id); };
  }, [selectedPhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes.length]);

  const allLabelsInUse = useMemo(() => {
    const set = new Set<string>();
    conversations.forEach(c => c.labels?.forEach(l => set.add(l)));
    return Array.from(set).sort();
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.displayName?.toLowerCase().includes(q)) || c.phoneNumber.includes(search)
      );
    }
    if (filterUnread === 'unread') {
      list = list.filter(c => c.unreadCount > 0);
    }
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        list = list.filter(c => !c.assignedToId);
      } else {
        const id = parseInt(filterAssignee);
        list = list.filter(c => c.assignedToId === id);
      }
    }
    if (filterLabel !== 'all') {
      list = list.filter(c => c.labels?.includes(filterLabel));
    }
    return list;
  }, [conversations, search, filterUnread, filterAssignee, filterLabel]);

  const selectedConv = conversations.find(c => c.phoneNumber === selectedPhone);

  const within24h = useMemo(() => {
    if (!selectedConv?.lastInboundAt) return false;
    const last = new Date(selectedConv.lastInboundAt).getTime();
    return Date.now() - last < 24 * 60 * 60 * 1000;
  }, [selectedConv]);

  const hasActiveFilters = filterUnread !== 'all' || filterAssignee !== 'all' || filterLabel !== 'all';

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
        ? 'Webhook kan niet via API gezet worden \u2014 vraag 360dialog support om de URL handmatig in te stellen.'
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

  async function handleAssign(memberId: string) {
    if (!selectedPhone) return;
    if (memberId === '') {
      await wijsGesprekToe(selectedPhone, null, null);
    } else {
      const member = teamMembers.find(m => m.id === parseInt(memberId));
      if (member) await wijsGesprekToe(selectedPhone, member.id, member.name);
    }
    const c = await haalGesprekken(tab);
    setConversations(c);
  }

  async function handleAddLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !labelInput.trim()) return;
    const current = selectedConv?.labels || [];
    const newLabel = labelInput.trim().toLowerCase();
    if (current.includes(newLabel)) { setLabelInput(''); return; }
    await updateLabels(selectedPhone, [...current, newLabel]);
    setLabelInput('');
    setShowLabelInput(false);
    const c = await haalGesprekken(tab);
    setConversations(c);
  }

  async function handleRemoveLabel(label: string) {
    if (!selectedPhone || !selectedConv) return;
    const current = selectedConv.labels || [];
    await updateLabels(selectedPhone, current.filter(l => l !== label));
    const c = await haalGesprekken(tab);
    setConversations(c);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !newNote.trim()) return;
    setNoteSaving(true);
    try {
      await maakNotitie(selectedPhone, newNote.trim());
      setNewNote('');
      const n = await haalNotities(selectedPhone);
      setNotes(n);
    } catch { /* ignore */ }
    setNoteSaving(false);
  }

  function convDisplayName(c: Conversation): string {
    if (c.displayName) return c.displayName;
    return 'Onbekend';
  }

  function threadSubline(c: Conversation): string {
    const phone = `+${c.phoneNumber}`;
    if (c.matchCategory === 'candidate') {
      return `${phone} \u00B7 Medewerker${c.candidateId ? ` \u00B7 #${c.candidateId}` : ''}`;
    }
    if (c.matchCategory === 'prospect') {
      return `${phone} \u00B7 Klant${c.contactCompany ? ` \u00B7 ${c.contactCompany}` : (c.prospectContactId ? ` \u00B7 #${c.prospectContactId}` : '')}`;
    }
    if (c.displayName) {
      return `${phone} \u00B7 Kandidaat${c.contactCompany ? ` \u00B7 ${c.contactCompany}` : ''}`;
    }
    return `${phone} \u00B7 Kandidaat`;
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
          \u2699
        </button>
      </div>

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
                <span style={{ color: '#DC2626', marginLeft: 8 }}>\u00B7 WHATSAPP_WEBHOOK_SECRET ontbreekt</span>
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

          {/* Zoekbalk + filters */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #E5E7EB' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op naam of nummer..."
              style={{
                width: '100%', padding: '7px 10px', fontSize: 12,
                border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none',
                fontFamily: FONT, boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              <select
                value={filterUnread}
                onChange={e => setFilterUnread(e.target.value as FilterUnread)}
                style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid #E5E7EB', fontFamily: FONT, color: filterUnread !== 'all' ? NAVY : '#6B7280', fontWeight: filterUnread !== 'all' ? 600 : 400 }}
              >
                <option value="all">Alle</option>
                <option value="unread">Ongelezen</option>
              </select>
              <select
                value={filterAssignee}
                onChange={e => setFilterAssignee(e.target.value)}
                style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid #E5E7EB', fontFamily: FONT, color: filterAssignee !== 'all' ? NAVY : '#6B7280', fontWeight: filterAssignee !== 'all' ? 600 : 400 }}
              >
                <option value="all">Iedereen</option>
                <option value="unassigned">Niet toegewezen</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={String(m.id)}>{m.name}</option>
                ))}
              </select>
              {allLabelsInUse.length > 0 && (
                <select
                  value={filterLabel}
                  onChange={e => setFilterLabel(e.target.value)}
                  style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid #E5E7EB', fontFamily: FONT, color: filterLabel !== 'all' ? NAVY : '#6B7280', fontWeight: filterLabel !== 'all' ? 600 : 400 }}
                >
                  <option value="all">Labels</option>
                  {allLabelsInUse.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              )}
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterUnread('all'); setFilterAssignee('all'); setFilterLabel('all'); }}
                  style={{ fontSize: 10, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px' }}
                >
                  \u2715 Reset
                </button>
              )}
            </div>
          </div>

          {/* Gesprekkenlijst */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 && (
              <div style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                {search || hasActiveFilters ? 'Geen resultaten' : 'Geen gesprekken in deze categorie'}
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
                    padding: '10px 14px',
                    background: selected ? '#F0F4FA' : '#fff',
                    borderLeft: selected ? `3px solid ${NAVY}` : '3px solid transparent',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{
                      fontSize: 13, fontWeight: unread ? 700 : 600,
                      color: name === 'Onbekend' ? '#9CA3AF' : NAVY,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0, marginLeft: 6 }}>
                      {timeAgo(c.lastMessageAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      +{c.phoneNumber}
                      {c.matchCategory === 'prospect' && c.contactCompany ? ` \u00B7 ${c.contactCompany}` : ''}
                      {c.matchCategory === 'unmatched' && c.contactCompany ? ` \u00B7 ${c.contactCompany}` : ''}
                    </span>
                    {c.assignedToName && (
                      <span style={{ fontSize: 9, color: '#8B5CF6', background: '#EDE9FE', borderRadius: 3, padding: '0 4px', flexShrink: 0 }}>
                        {c.assignedToName.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, color: unread ? '#1F2937' : '#64748B',
                    fontWeight: unread ? 600 : 400,
                    marginTop: 3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: 280,
                  }}>
                    {(c.lastMessagePreview || '\u2014').slice(0, 60)}
                  </div>
                  {(c.labels?.length || unread) ? (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {unread && (
                        <span style={{
                          background: '#DC2626', color: '#fff', borderRadius: 10,
                          padding: '0 7px', fontSize: 10, fontWeight: 700,
                        }}>{c.unreadCount}</span>
                      )}
                      {c.labels?.map(l => (
                        <span key={l} style={{
                          fontSize: 9, padding: '1px 6px', borderRadius: 3,
                          background: labelColor(l) + '18', color: labelColor(l),
                          fontWeight: 600,
                        }}>{l}</span>
                      ))}
                    </div>
                  ) : null}
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
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', padding: '1px 3px' }}
                        >
                          \u270F\uFE0F
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                      {threadSubline(selectedConv)}
                    </div>
                    {/* Labels */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {selectedConv.labels?.map(l => (
                        <span key={l} style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 3,
                          background: labelColor(l) + '18', color: labelColor(l),
                          fontWeight: 600, cursor: 'pointer',
                        }} onClick={() => handleRemoveLabel(l)} title={`Verwijder label "${l}"`}>
                          {l} \u00D7
                        </span>
                      ))}
                      {showLabelInput ? (
                        <form onSubmit={handleAddLabel} style={{ display: 'inline-flex', gap: 2 }}>
                          <input
                            value={labelInput}
                            onChange={e => setLabelInput(e.target.value)}
                            placeholder="label..."
                            autoFocus
                            onBlur={() => { if (!labelInput.trim()) setShowLabelInput(false); }}
                            style={{ width: 70, fontSize: 10, padding: '1px 4px', border: '1px solid #D1D5DB', borderRadius: 3, outline: 'none', fontFamily: FONT }}
                          />
                        </form>
                      ) : (
                        <button
                          onClick={() => setShowLabelInput(true)}
                          style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: '1px dashed #D1D5DB', borderRadius: 3, padding: '1px 6px', cursor: 'pointer' }}
                        >
                          + label
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Toewijzing */}
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Toegewezen aan</div>
                    <select
                      value={selectedConv.assignedToId ? String(selectedConv.assignedToId) : ''}
                      onChange={e => handleAssign(e.target.value)}
                      style={{
                        fontSize: 11, padding: '4px 6px', borderRadius: 4,
                        border: '1px solid #D1D5DB', fontFamily: FONT,
                        color: selectedConv.assignedToId ? NAVY : '#9CA3AF',
                        minWidth: 120,
                      }}
                    >
                      <option value="">Niemand</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={String(m.id)}>{m.name}</option>
                      ))}
                    </select>
                  </div>
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
                      placeholder="Naam (verplicht)"
                      required
                      style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }}
                    />
                    <input
                      value={editCompany}
                      onChange={e => setEditCompany(e.target.value)}
                      placeholder="Bedrijf / context (optioneel)"
                      style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }}
                    />
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Notities (optioneel)"
                      rows={2}
                      style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" disabled={editSaving || !editName.trim()}
                        style={{ background: editSaving || !editName.trim() ? '#E5E7EB' : NAVY, color: editSaving || !editName.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                        {editSaving ? 'Opslaan...' : 'Opslaan'}
                      </button>
                      <button type="button" onClick={() => setEditingContact(false)}
                        style={{ background: '#fff', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
                        Annuleren
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Berichten / Notities toggle */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                <button onClick={() => setThreadView('messages')}
                  style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', color: threadView === 'messages' ? NAVY : '#9CA3AF', borderBottom: threadView === 'messages' ? `2px solid ${NAVY}` : '2px solid transparent', cursor: 'pointer', fontFamily: FONT }}>
                  Berichten
                </button>
                <button onClick={() => setThreadView('notes')}
                  style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', color: threadView === 'notes' ? '#F59E0B' : '#9CA3AF', borderBottom: threadView === 'notes' ? '2px solid #F59E0B' : '2px solid transparent', cursor: 'pointer', fontFamily: FONT }}>
                  Interne notities {notes.length > 0 && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', borderRadius: 10, padding: '0 5px', marginLeft: 4 }}>{notes.length}</span>}
                </button>
              </div>

              {/* Berichten view */}
              {threadView === 'messages' && (
                <>
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
                        \u26A0 24u-venster mogelijk verstreken — WhatsApp kan vrije tekstberichten afwijzen.
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
                        style={{ flex: 1, padding: '10px 14px', fontSize: 13, border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none', fontFamily: FONT, background: '#fff' }}
                      />
                      <button type="submit" disabled={sending || !reply.trim()}
                        style={{ background: (sending || !reply.trim()) ? '#E5E7EB' : NAVY, color: (sending || !reply.trim()) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '0 18px', fontSize: 13, fontWeight: 600, cursor: (sending || !reply.trim()) ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                        {sending ? '...' : 'Stuur'}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* Interne notities view */}
              {threadView === 'notes' && (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '18px', background: '#FFFBEB' }}>
                    {notes.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 40 }}>
                        Nog geen interne notities voor dit gesprek
                      </div>
                    )}
                    {[...notes].reverse().map(n => (
                      <div key={n.id} style={{
                        marginBottom: 12, padding: '10px 14px',
                        background: '#fff', border: '1px solid #FDE68A', borderRadius: 8,
                        borderLeft: '3px solid #F59E0B',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>{n.authorName}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                            {new Date(n.createdAt).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                      </div>
                    ))}
                    <div ref={notesEndRef} />
                  </div>

                  {/* Notitie toevoegen */}
                  <div style={{ padding: '12px 18px', borderTop: '1px solid #FDE68A', background: '#FFFBEB' }}>
                    <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Schrijf een interne notitie..."
                        disabled={noteSaving}
                        style={{ flex: 1, padding: '10px 14px', fontSize: 13, border: '1px solid #FDE68A', borderRadius: 6, outline: 'none', fontFamily: FONT, background: '#fff' }}
                      />
                      <button type="submit" disabled={noteSaving || !newNote.trim()}
                        style={{ background: (noteSaving || !newNote.trim()) ? '#E5E7EB' : '#F59E0B', color: (noteSaving || !newNote.trim()) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: (noteSaving || !newNote.trim()) ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                        {noteSaving ? '...' : 'Notitie'}
                      </button>
                    </form>
                  </div>
                </>
              )}
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
