/**
 * ChatView — header met avatar/naam/subregel + assigned-chip + snooze-klokje,
 * gele window-warning-balk, dag-scheiders, bubbels (in=wit / out=#d9fdd3) met
 * 🤖 AI-agent- of 👤 planner-tag, en composer met emoji/paperclip/✨/verzendknop.
 * Stijl 1-op-1 uit mockups/extra-whatsapp-mockup.html.
 */
import { useMemo, useRef, useState, useEffect, type FormEvent } from 'react';
import type { Conversation, Message, TeamMember } from '../../../api/whatsappClient';
import { WA, avatarColor, initials, formatTime, dayLabel, snoozeRemaining, voornaamVan, formatPhone } from './theme';

interface Props {
  conv: Conversation | null;
  messages: Message[];
  teamMembers: TeamMember[];
  composerText: string;
  onComposerText: (v: string) => void;
  onSend: (text: string, file: File | null) => Promise<void>;
  sending: boolean;
  sendError: string | null;
  aiLoading: boolean;
  onAiSuggest: () => void;
  onSnooze: (untilIso: string | null) => Promise<void>;
}

// Subregel onder de naam: "Kandidaat · Housekeeping · +31 6 ..." (mockup-stijl).
function subline(conv: Conversation): string {
  const rol = conv.matchCategory === 'candidate' ? 'Medewerker'
    : conv.matchCategory === 'prospect' ? 'Klant'
    : 'Kandidaat';
  const functieLabels: Record<string, string> = {
    horeca: 'Horeca', chef: 'Chef', housekeeping: 'Housekeeping',
    logistiek: 'Logistiek', frontoffice: 'Front office',
  };
  const functie = (conv.labels || []).map(l => functieLabels[l]).find(Boolean);
  const parts = [rol];
  if (functie) parts.push(functie);
  else if (conv.contactCompany) parts.push(conv.contactCompany);
  parts.push(formatPhone(conv.phoneNumber));
  return parts.join(' · ');
}

function statusChecks(status: string): { symbool: string; kleur: string } | null {
  switch (status) {
    case 'queued':    return { symbool: '⏳', kleur: WA.textSub };
    case 'sent':      return { symbool: '✓', kleur: WA.textSub };
    case 'delivered': return { symbool: '✓✓', kleur: WA.textSub };
    case 'read':      return { symbool: '✓✓', kleur: WA.check };
    case 'failed':    return { symbool: '✗', kleur: '#e63946' };
    default:          return null;
  }
}

// Snooze-presets: 1 uur / vanmiddag 14:00 / morgenochtend 09:00.
function presetVanmiddag(): Date {
  const d = new Date();
  if (d.getHours() >= 14) d.setDate(d.getDate() + 1);
  d.setHours(14, 0, 0, 0);
  return d;
}
function presetMorgenochtend(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function ChatView(props: Props) {
  const {
    conv, messages, teamMembers, composerText, onComposerText,
    onSend, sending, sendError, aiLoading, onAiSuggest, onSnooze,
  } = props;
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [customSnooze, setCustomSnooze] = useState('');
  const [showCustomSnooze, setShowCustomSnooze] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conv?.phoneNumber]);

  // Sluit snooze-menu wanneer een ander gesprek geselecteerd wordt.
  useEffect(() => { setShowSnoozeMenu(false); setShowCustomSnooze(false); setAttachedFile(null); }, [conv?.phoneNumber]);

  const plannerVoornaam = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of teamMembers) map.set(m.id, voornaamVan(m.name));
    return map;
  }, [teamMembers]);

  // Fase 3 — serviceklok: het 24-uurs venster telt zichtbaar af, vlak boven het
  // invoerveld, zodat het in beeld blijft terwijl je typt. `klokTik` ververst
  // elke 30 seconden zodat de resterende tijd meeloopt zonder te pollen.
  const [klokTik, setKlokTik] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setKlokTik(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const windowInfo = useMemo(() => {
    if (!conv?.lastInboundAt) {
      // Nog nooit een inkomend bericht: er is geen venster om af te tellen.
      return { open: false, rest: '', tekst: 'Serviceklok: geen inkomend bericht — alleen een template-bericht is mogelijk' };
    }
    const restMs = 24 * 60 * 60 * 1000 - (klokTik - new Date(conv.lastInboundAt).getTime());
    if (restMs <= 0) {
      return { open: false, rest: '00:00', tekst: 'Serviceklok verlopen — alleen een template-bericht is nog mogelijk' };
    }
    const uren = Math.floor(restMs / 3600000);
    const minuten = Math.floor((restMs % 3600000) / 60000);
    const rest = `${uren}u ${String(minuten).padStart(2, '0')}m`;
    return {
      open: true,
      rest,
      // Onder een uur wordt het dringend; dat zegt de tekst dan ook.
      tekst: restMs < 3600000
        ? 'Serviceklok bijna verlopen — antwoord nu, daarna kan alleen nog een template-bericht'
        : 'Serviceklok: zo lang kun je nog vrij antwoorden',
    };
  }, [conv?.lastInboundAt, klokTik]);

  if (!conv) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: WA.bg, backgroundImage: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4))',
        color: WA.textSub, fontSize: 14,
      }}>
        Selecteer een gesprek om te beginnen
      </div>
    );
  }

  const naam = conv.displayName || `+${conv.phoneNumber}`;
  const snoozeRest = snoozeRemaining(conv.snoozedUntil);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!composerText.trim() && !attachedFile) return;
    await onSend(composerText, attachedFile);
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function kiesSnooze(until: Date | null) {
    setShowSnoozeMenu(false);
    setShowCustomSnooze(false);
    await onSnooze(until ? until.toISOString() : null);
  }

  // Berichten groeperen per dag voor de dag-scheiders.
  const items: Array<{ divider?: string; msg?: Message }> = [];
  let vorigeDag = '';
  for (const m of messages) {
    const label = dayLabel(m.createdAt);
    if (label !== vorigeDag) {
      items.push({ divider: label });
      vorigeDag = label;
    }
    items.push({ msg: m });
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
      background: WA.bg, backgroundImage: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4))',
    }}>
      {/* Header */}
      <div style={{
        background: WA.panel, padding: '10px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${WA.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13, background: avatarColor(naam),
          }}>{initials(naam)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</div>
            <div style={{ fontSize: 12, color: WA.textSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subline(conv)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#54656f', position: 'relative' }}>
          {/* Assigned-chip met mini-avatar */}
          {conv.assignedToName ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
              border: `1px solid ${WA.border}`, padding: '4px 10px 4px 4px',
              borderRadius: 20, fontSize: 12, color: WA.text,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: WA.purple,
                color: '#fff', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{initials(conv.assignedToName)}</div>
              {voornaamVan(conv.assignedToName)}
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
              border: `1px dashed ${WA.border}`, padding: '4px 10px',
              borderRadius: 20, fontSize: 12, color: WA.textSub,
            }}>
              Niet toegewezen
            </div>
          )}
          {/* Snooze-klokje */}
          <button
            type="button"
            title={snoozeRest ? `Gesnoozed (${snoozeRest})` : 'Snooze dit gesprek'}
            onClick={() => setShowSnoozeMenu(v => !v)}
            style={{
              border: 'none', cursor: 'pointer', fontSize: 17, lineHeight: 1,
              background: snoozeRest ? '#f1e9ff' : 'transparent',
              color: snoozeRest ? WA.purple : '#54656f',
              borderRadius: 8, padding: '5px 7px',
            }}
          >⏰</button>
          {showSnoozeMenu && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 30,
              background: '#fff', border: `1px solid ${WA.border}`, borderRadius: 10,
              boxShadow: '0 6px 24px rgba(0,0,0,.15)', minWidth: 210, overflow: 'hidden',
              fontSize: 13, color: WA.text,
            }}>
              <div style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: WA.textSub, borderBottom: '1px solid #f2f2f2' }}>
                Snooze gesprek
              </div>
              {([
                { label: '1 uur', until: () => new Date(Date.now() + 3600000) },
                { label: 'Vanmiddag 14:00', until: presetVanmiddag },
                { label: 'Morgenochtend 09:00', until: presetMorgenochtend },
              ] as const).map(p => (
                <div
                  key={p.label}
                  onClick={() => kiesSnooze(p.until())}
                  style={{ padding: '9px 14px', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = WA.panel; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                >{p.label}</div>
              ))}
              {!showCustomSnooze ? (
                <div
                  onClick={() => setShowCustomSnooze(true)}
                  style={{ padding: '9px 14px', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = WA.panel; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                >Zelf kiezen…</div>
              ) : (
                <div style={{ padding: '9px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="datetime-local"
                    value={customSnooze}
                    onChange={e => setCustomSnooze(e.target.value)}
                    style={{ fontSize: 12, padding: '5px 6px', border: `1px solid ${WA.border}`, borderRadius: 6, fontFamily: 'inherit' }}
                  />
                  <button
                    type="button"
                    disabled={!customSnooze}
                    onClick={() => { const d = new Date(customSnooze); if (!isNaN(d.getTime())) kiesSnooze(d); }}
                    style={{
                      background: WA.purple, color: '#fff', border: 'none', borderRadius: 6,
                      padding: '6px 10px', fontSize: 12, fontWeight: 600,
                      cursor: customSnooze ? 'pointer' : 'default', opacity: customSnooze ? 1 : 0.5,
                    }}
                  >Snooze</button>
                </div>
              )}
              {snoozeRest && (
                <div
                  onClick={() => kiesSnooze(null)}
                  style={{ padding: '9px 14px', cursor: 'pointer', color: '#e63946', borderTop: '1px solid #f2f2f2', fontWeight: 600 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fef2f2'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                >Snooze opheffen ({snoozeRest})</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Berichten */}
      <div style={{
        flex: 1, padding: '22px 8%', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {items.map((item, i) => {
          if (item.divider) {
            return (
              <div key={`d-${i}`} style={{
                alignSelf: 'center', background: '#e1f2fb', color: '#5c6f7a',
                fontSize: 12, padding: '5px 12px', borderRadius: 8, margin: '10px 0 16px',
              }}>{item.divider}</div>
            );
          }
          const m = item.msg!;
          const uit = m.direction === 'outbound';
          const checks = uit ? statusChecks(m.status) : null;
          const isMedia = m.messageType !== 'text' && m.messageType !== 'unknown';
          const mediaLink = m.mediaUrl && /^https?:\/\//i.test(m.mediaUrl) ? m.mediaUrl : null;
          return (
            <div
              key={m.id}
              style={{
                maxWidth: '62%', padding: '7px 9px 8px 10px', borderRadius: 8,
                fontSize: 14, lineHeight: 1.35, position: 'relative',
                boxShadow: '0 1px 1px rgba(0,0,0,.08)', marginBottom: 2,
                alignSelf: uit ? 'flex-end' : 'flex-start',
                background: uit ? WA.bubbleOut : WA.bubbleIn,
                borderTopRightRadius: uit ? 0 : 8,
                borderTopLeftRadius: uit ? 8 : 0,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >
              {uit && (
                m.sentByUserId != null ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, color: '#008069', background: '#e3f7ee',
                    padding: '2px 7px', borderRadius: 8, marginBottom: 5,
                  }}>👤 {plannerVoornaam.get(m.sentByUserId) || 'Planner'}</div>
                ) : (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, color: WA.purple, background: '#f1e9ff',
                    padding: '2px 7px', borderRadius: 8, marginBottom: 5,
                  }}>🤖 AI-agent</div>
                )
              )}
              <div>
                {isMedia && (
                  <span style={{ marginRight: 4 }}>📎</span>
                )}
                {m.body || (isMedia ? `[${m.messageType}]` : '')}
                {mediaLink && (
                  <>
                    {' '}
                    <a href={mediaLink} target="_blank" rel="noreferrer" style={{ color: WA.purple, fontSize: 13 }}>
                      Bijlage openen
                    </a>
                  </>
                )}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                gap: 4, marginTop: 3, fontSize: 10.5, color: WA.textSub,
              }}>
                {formatTime(m.createdAt)}
                {checks && <span style={{ color: checks.kleur }}>{checks.symbool}</span>}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Serviceklok — permanent boven het invoerveld, dus ook zichtbaar
          terwijl je typt. Groen/amber zolang het venster open is, rood zodra
          het verlopen is; de teller loopt elke 30 seconden mee. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 12, padding: '5px 18px',
        borderTop: `1px solid ${windowInfo.open ? '#f1e2a8' : '#fecaca'}`,
        background: windowInfo.open ? '#fff3cd' : '#fef2f2',
        color: windowInfo.open ? '#7a5b00' : '#b91c1c',
      }}>
        <span>⏱</span>
        {windowInfo.rest && (
          <strong style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>{windowInfo.rest}</strong>
        )}
        <span>{windowInfo.tekst}</span>
      </div>

      {/* Composer */}
      {sendError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: 12, padding: '6px 18px', borderTop: '1px solid #fecaca' }}>
          {sendError}
        </div>
      )}
      {attachedFile && (
        <div style={{
          background: WA.panel, fontSize: 12, color: WA.text, padding: '6px 18px',
          borderTop: `1px solid ${WA.border}`, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          📎 {attachedFile.name}
          <button
            type="button"
            onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e63946', fontWeight: 700 }}
          >×</button>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{
        background: WA.panel, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderTop: `1px solid ${WA.border}`,
      }}>
        <span style={{ color: '#54656f', fontSize: 18, cursor: 'default' }} title="Emoji">😊</span>
        <span
          style={{ color: '#54656f', fontSize: 18, cursor: 'pointer' }}
          title="Bijlage toevoegen"
          onClick={() => fileInputRef.current?.click()}
        >📎</span>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={e => setAttachedFile(e.target.files?.[0] || null)}
        />
        <input
          value={composerText}
          onChange={e => onComposerText(e.target.value)}
          placeholder="Typ een bericht"
          style={{
            flex: 1, background: '#fff', border: 'none', outline: 'none',
            borderRadius: 20, padding: '9px 16px', fontSize: 14, color: WA.text, fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={onAiSuggest}
          disabled={aiLoading}
          title="AI-suggestie"
          style={{
            border: 'none', background: '#f1e9ff', color: WA.purple, borderRadius: '50%',
            width: 32, height: 32, cursor: aiLoading ? 'wait' : 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >{aiLoading ? '…' : '✨'}</button>
        <button
          type="submit"
          disabled={sending}
          style={{
            width: 38, height: 38, borderRadius: '50%', background: WA.purple, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            border: 'none', cursor: sending ? 'wait' : 'pointer', flexShrink: 0,
            opacity: sending ? 0.7 : 1,
          }}
        >➤</button>
      </form>
    </div>
  );
}
