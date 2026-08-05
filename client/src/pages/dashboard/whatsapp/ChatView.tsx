/**
 * ChatView — header met naam/subregel + assigned-chip + snooze-klokje,
 * gele window-warning-balk, dag-scheiders, bubbels (in=wit / out=#d9fdd3) met
 * 🤖 AI-agent- of 👤 planner-tag, en composer met emoji/paperclip/✨/verzendknop.
 * Stijl 1-op-1 uit mockups/extra-whatsapp-mockup.html.
 */
import { useMemo, useRef, useState, useEffect, type FormEvent } from 'react';
import { Contact as ContactIcon } from 'lucide-react';
import type { Conversation, Message, TeamMember } from '../../../api/whatsappClient';
import {
  WA, WA_TEKST, WA_GEWICHT, WA_GLYPH, WA_MEDIA,
  formatTime, dayLabel, snoozeRemaining, voornaamVan, formatPhone,
} from './theme';
import { KLEUR } from '../../../lib/huisstijl';

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
  /** Staat het profielpaneel rechts open? Zie de knop in de header hieronder. */
  profielOpen: boolean;
  onToggleProfiel: () => void;
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

/**
 * URL van de bijlage bij een bericht. preview=1 levert het bestand inline
 * (Content-Disposition: inline), zonder die vlag komt het als download binnen.
 * Het opslagpad zelf komt nooit naar de client — de server zoekt het op bij
 * het bericht-id.
 */
function bijlageUrl(messageId: number, preview: boolean): string {
  return `/api/whatsapp/messages/${messageId}/media${preview ? '?preview=1' : ''}`;
}

/** Leesbare bestandsnaam voor de downloadregel bij documenten. */
function bijlageNaam(m: Message): string {
  if (m.mediaFilename) return m.mediaFilename;
  const uitBody = (m.body || '').match(/^\[document:\s*(.+?)\]$/);
  if (uitBody) return uitBody[1];
  return 'Bijlage';
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
    profielOpen, onToggleProfiel,
  } = props;
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [customSnooze, setCustomSnooze] = useState('');
  const [showCustomSnooze, setShowCustomSnooze] = useState(false);
  /** Foto op volledig formaat; null = dicht. Zie de overlay onderaan. */
  const [vergroot, setVergroot] = useState<{ src: string; alt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conv?.phoneNumber]);

  // Sluit snooze-menu wanneer een ander gesprek geselecteerd wordt. Een open
  // foto hoort daar ook bij: die gaat over het vorige gesprek.
  useEffect(() => { setShowSnoozeMenu(false); setShowCustomSnooze(false); setAttachedFile(null); setVergroot(null); }, [conv?.phoneNumber]);

  // Escape sluit de vergrote foto. Alleen geregistreerd zolang er één open
  // staat, zodat we niet bij elk toetsaanslag in de composer meeluisteren.
  useEffect(() => {
    if (!vergroot) return;
    const opToets = (e: KeyboardEvent) => { if (e.key === 'Escape') setVergroot(null); };
    window.addEventListener('keydown', opToets);
    return () => window.removeEventListener('keydown', opToets);
  }, [vergroot]);

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
        color: WA.textSub, fontSize: WA_TEKST.body,
      }}>
        Selecteer een gesprek om te beginnen
      </div>
    );
  }

  // Zelfde volgorde als Sidebar/ConversationList/ProfilePanel: echte match >
  // geïmporteerde contactenlijst (eenmalige import, aug. 2026) > kaal nummer.
  // Deze header miste de importedContactName-fallback nog, waardoor iemand
  // die in de gesprekkenlijst wél een naam toonde, in de chat zelf alsnog
  // als kaal nummer verscheen.
  const naam = conv.displayName || conv.importedContactName || `+${conv.phoneNumber}`;
  const naamUitImport = !conv.displayName && !!conv.importedContactName;
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
        {/* Geen avatar-cirkel: naam en subregel beginnen links, op de plek waar
            eerst de cirkel stond. Geen gap dus, anders bleef er een lege kolom. */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div style={{ fontSize: WA_TEKST.h3, fontWeight: WA_GEWICHT.semibold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</div>
              {naamUitImport && (
                <span title="Naam uit geïmporteerde contactenlijst" style={{ display: 'inline-flex', flexShrink: 0 }}>
                  <ContactIcon size={12} strokeWidth={1.5} color={KLEUR.muted} />
                </span>
              )}
            </div>
            <div style={{ fontSize: WA_TEKST.secundair, color: WA.textSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subline(conv)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#54656f', position: 'relative' }}>
          {/* Assigned-chip. Ook hier is de mini-avatar weg: dat was dezelfde
              initialen-cirkel, alleen kleiner, en de voornaam ernaast zei het
              al. De chip houdt zijn paarse rand zodat "toegewezen" en "niet
              toegewezen" (gestippeld, grijs) uit elkaar te houden blijven
              zonder dat er een cirkel voor nodig is. */}
          {conv.assignedToName ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#f1e9ff',
              border: `1px solid ${WA.purple}`, padding: '4px 11px',
              borderRadius: 20, fontSize: WA_TEKST.secundair, fontWeight: WA_GEWICHT.semibold, color: WA.purple,
            }}>
              {voornaamVan(conv.assignedToName)}
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
              border: `1px dashed ${WA.border}`, padding: '4px 10px',
              borderRadius: 20, fontSize: WA_TEKST.secundair, color: WA.textSub,
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
              border: 'none', cursor: 'pointer', fontSize: WA_GLYPH.icoon, lineHeight: 1,
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
              fontSize: WA_TEKST.body, color: WA.text,
            }}>
              <div style={{ padding: '9px 14px', fontSize: WA_TEKST.badge, fontWeight: WA_GEWICHT.bold, letterSpacing: '.05em', textTransform: 'uppercase', color: WA.textSub, borderBottom: '1px solid #f2f2f2' }}>
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
                    style={{ fontSize: WA_TEKST.secundair, padding: '5px 6px', border: `1px solid ${WA.border}`, borderRadius: 6, fontFamily: 'inherit' }}
                  />
                  <button
                    type="button"
                    disabled={!customSnooze}
                    onClick={() => { const d = new Date(customSnooze); if (!isNaN(d.getTime())) kiesSnooze(d); }}
                    style={{
                      background: WA.purple, color: '#fff', border: 'none', borderRadius: 6,
                      padding: '6px 10px', fontSize: WA_TEKST.secundair, fontWeight: WA_GEWICHT.semibold,
                      cursor: customSnooze ? 'pointer' : 'default', opacity: customSnooze ? 1 : 0.5,
                    }}
                  >Snooze</button>
                </div>
              )}
              {snoozeRest && (
                <div
                  onClick={() => kiesSnooze(null)}
                  style={{ padding: '9px 14px', cursor: 'pointer', color: '#e63946', borderTop: '1px solid #f2f2f2', fontWeight: WA_GEWICHT.semibold }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fef2f2'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                >Snooze opheffen ({snoozeRest})</div>
              )}
            </div>
          )}

          {/* Profielpaneel in-/uitklappen. Staat hier en niet in het paneel
              zelf, want een knop die met zijn eigen paneel verdwijnt kun je
              niet meer gebruiken om het terug te halen. De staat leeft in
              index.tsx en dus per bezoek: bij een refresh staat het paneel
              weer open, dat is bewust — niets om te onthouden. */}
          <button
            type="button"
            title={profielOpen ? 'Verberg profielpaneel (meer ruimte voor het gesprek)' : 'Toon profielpaneel'}
            aria-label={profielOpen ? 'Verberg profielpaneel' : 'Toon profielpaneel'}
            aria-expanded={profielOpen}
            onClick={onToggleProfiel}
            style={{
              border: 'none', cursor: 'pointer', fontSize: WA_GLYPH.icoonKlein, lineHeight: 1,
              background: profielOpen ? '#f1e9ff' : 'transparent',
              color: profielOpen ? WA.purple : '#54656f',
              borderRadius: 8, padding: '5px 7px',
            }}
          >{profielOpen ? '⇥' : '⇤'}</button>
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
                fontSize: WA_TEKST.secundair, padding: '5px 12px', borderRadius: 8, margin: '10px 0 16px',
              }}>{item.divider}</div>
            );
          }
          const m = item.msg!;
          const uit = m.direction === 'outbound';
          const checks = uit ? statusChecks(m.status) : null;
          const isMedia = m.messageType !== 'text' && m.messageType !== 'unknown';
          // Hier stond een test op /^https?:\/\//. Die kon nooit slagen: Meta
          // levert in de webhook een media-id, geen URL, dus viel elk
          // mediabericht terug op de kale tekstbeschrijving. Nu bepaalt de
          // server of het bestand er daadwerkelijk staat (heeftBijlage) en
          // halen we het op via het bericht-id.
          const heeftBestand = m.heeftBijlage === true;
          const isAfbeelding = heeftBestand && (m.messageType === 'image' || m.messageType === 'sticker');
          const bijschrift = (m.body || '').replace(/^\[(afbeelding|video|sticker|document)(:\s*)?/, '').replace(/\]$/, '').trim();
          return (
            <div
              key={m.id}
              style={{
                maxWidth: '62%', padding: '7px 9px 8px 10px', borderRadius: 8,
                fontSize: WA_TEKST.body, lineHeight: 1.35, position: 'relative',
                boxShadow: '0 1px 1px rgba(0,0,0,.08)', marginBottom: 2,
                alignSelf: uit ? 'flex-end' : 'flex-start',
                background: uit ? WA.bubbleOut : WA.bubbleIn,
                borderTopRightRadius: uit ? 0 : 8,
                borderTopLeftRadius: uit ? 8 : 0,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >
              {/* Herkomst van een uitgaand bericht. De echo-tak staat BEWUST
                  vooraan: een bericht dat op de telefoon is getypt heeft geen
                  sentByUserId (we weten niet wie het typte) en zou in de oude
                  volgorde als "AI-agent" worden gelabeld. */}
              {uit && (
                m.sentSource === 'app' ? (
                  <div
                    title="Verstuurd vanaf de WhatsApp-app op de telefoon, niet vanuit dit dashboard"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 700, color: '#8a5a00', background: '#fdf1d6',
                      padding: '2px 7px', borderRadius: 8, marginBottom: 5,
                    }}
                  >📱 Planner (telefoon)</div>
                ) : m.sentByUserId != null ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: WA_TEKST.mini, fontWeight: WA_GEWICHT.bold, color: '#008069', background: '#e3f7ee',
                    padding: '2px 7px', borderRadius: 8, marginBottom: 5,
                  }}>👤 {plannerVoornaam.get(m.sentByUserId) || 'Planner'}</div>
                ) : (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: WA_TEKST.mini, fontWeight: WA_GEWICHT.bold, color: WA.purple, background: '#f1e9ff',
                    padding: '2px 7px', borderRadius: 8, marginBottom: 5,
                  }}>🤖 AI-agent</div>
                )
              )}
              {/* Bijlage. Een foto vult de bubbel met het bijschrift eronder,
                  zoals WhatsApp zelf; audio en video krijgen een speler; al het
                  overige een downloadregel met de bestandsnaam. Staat het
                  bestand er niet (download mislukt of bericht van vóór deze
                  functie), dan blijft de oude tekstweergave over. */}
              {isAfbeelding ? (
                <div>
                  <img
                    src={bijlageUrl(m.id, true)}
                    alt={bijschrift || 'Bijlage'}
                    onClick={() => setVergroot({ src: bijlageUrl(m.id, true), alt: bijschrift || 'Bijlage' })}
                    style={{
                      display: 'block', maxWidth: '100%', maxHeight: WA_MEDIA.voorbeeldMaxHoogte,
                      borderRadius: WA_MEDIA.radius, cursor: 'zoom-in',
                    }}
                  />
                  {bijschrift && (
                    <div style={{ marginTop: WA_MEDIA.bijschriftMarge }}>{bijschrift}</div>
                  )}
                </div>
              ) : heeftBestand && m.messageType === 'video' ? (
                <div>
                  <video
                    src={bijlageUrl(m.id, true)}
                    controls
                    style={{
                      display: 'block', maxWidth: '100%', maxHeight: WA_MEDIA.voorbeeldMaxHoogte,
                      borderRadius: WA_MEDIA.radius,
                    }}
                  />
                  {bijschrift && (
                    <div style={{ marginTop: WA_MEDIA.bijschriftMarge }}>{bijschrift}</div>
                  )}
                </div>
              ) : heeftBestand && m.messageType === 'audio' ? (
                <audio src={bijlageUrl(m.id, true)} controls style={{ display: 'block', maxWidth: '100%', height: WA_MEDIA.audioHoogte }} />
              ) : heeftBestand ? (
                <a
                  href={bijlageUrl(m.id, false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: WA.purple, fontSize: WA_TEKST.body, fontWeight: WA_GEWICHT.medium,
                    textDecoration: 'none', wordBreak: 'break-all',
                  }}
                >
                  <span style={{ fontSize: WA_GLYPH.icoonKlein }}>📄</span>
                  <span>{bijlageNaam(m)}</span>
                </a>
              ) : (
                <div>
                  {isMedia && (
                    <span style={{ marginRight: 4 }}>📎</span>
                  )}
                  {m.body || (isMedia ? `[${m.messageType}]` : '')}
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                gap: 4, marginTop: 3, fontSize: WA_TEKST.mini, color: WA.textSub,
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
        fontSize: WA_TEKST.secundair, padding: '5px 18px',
        borderTop: `1px solid ${windowInfo.open ? '#f1e2a8' : '#fecaca'}`,
        background: windowInfo.open ? '#fff3cd' : '#fef2f2',
        color: windowInfo.open ? '#7a5b00' : '#b91c1c',
      }}>
        <span>⏱</span>
        {windowInfo.rest && (
          <strong style={{ fontVariantNumeric: 'tabular-nums', fontSize: WA_TEKST.secundair }}>{windowInfo.rest}</strong>
        )}
        <span>{windowInfo.tekst}</span>
      </div>

      {/* Composer */}
      {sendError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: WA_TEKST.secundair, padding: '6px 18px', borderTop: '1px solid #fecaca' }}>
          {sendError}
        </div>
      )}
      {attachedFile && (
        <div style={{
          background: WA.panel, fontSize: WA_TEKST.secundair, color: WA.text, padding: '6px 18px',
          borderTop: `1px solid ${WA.border}`, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          📎 {attachedFile.name}
          <button
            type="button"
            onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e63946', fontWeight: WA_GEWICHT.bold }}
          >×</button>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{
        background: WA.panel, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderTop: `1px solid ${WA.border}`,
      }}>
        <span style={{ color: '#54656f', fontSize: WA_GLYPH.icoon, cursor: 'default' }} title="Emoji">😊</span>
        <span
          style={{ color: '#54656f', fontSize: WA_GLYPH.icoon, cursor: 'pointer' }}
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
            borderRadius: 20, padding: '9px 16px', fontSize: WA_TEKST.body, color: WA.text, fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={onAiSuggest}
          disabled={aiLoading}
          title="AI-suggestie"
          style={{
            border: 'none', background: '#f1e9ff', color: WA.purple, borderRadius: '50%',
            width: 32, height: 32, cursor: aiLoading ? 'wait' : 'pointer', fontSize: WA_TEKST.body,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >{aiLoading ? '…' : '✨'}</button>
        <button
          type="submit"
          disabled={sending}
          style={{
            width: 38, height: 38, borderRadius: '50%', background: WA.purple, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: WA_GLYPH.icoonKlein,
            border: 'none', cursor: sending ? 'wait' : 'pointer', flexShrink: 0,
            opacity: sending ? 0.7 : 1,
          }}
        >➤</button>
      </form>

      {/* Foto op volledig formaat. Klik ergens of Escape sluit hem weer;
          bewust geen aparte sluitknop-in-de-hoek, de hele overlay is de knop. */}
      {vergroot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={vergroot.alt}
          onClick={() => setVergroot(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.82)', cursor: 'zoom-out',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <img
            src={vergroot.src}
            alt={vergroot.alt}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: WA_MEDIA.radius }}
          />
        </div>
      )}
    </div>
  );
}
