/**
 * Rechterpaneel (300px) — gradient-avatar, Profiel-rijen, Labels-pills,
 * Snelle antwoorden, Toewijzen, Interne notities (inklapbaar) en Opt-in-status.
 * Stijl uit mockups/extra-whatsapp-mockup.html; data via bestaande endpoints.
 */
import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import {
  haalContacten,
  updateContactOptIn,
  haalNotities,
  maakNotitie,
  updateLabels,
  wijsGesprekToe,
  zetAiCategorie,
  AI_CATEGORIES,
  AI_CATEGORY_LABELS,
  ESCALATION_REASON_LABELS,
  type AiCategory,
  type Conversation,
  type TeamMember,
  type InternalNote,
  type WaContact,
} from '../../../api/whatsappClient';
import { WA, WA_TEKST, WA_GEWICHT, WA_GLYPH, initials, formatDate, formatPhone, voornaamVan } from './theme';

interface Props {
  conv: Conversation;
  teamMembers: TeamMember[];
  /** Zet de tekst van een snel antwoord in de composer. */
  onQuickReply: (text: string) => void;
  /** Na assign/labels wijziging: gesprekkenlijst verversen. */
  onConversationChanged: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ padding: 16, borderBottom: '1px solid #f2f2f2' }}>
      {/* fontFamily: 'inherit' is hier GEEN overbodige regel. index.css heeft een
          basisregel `h1,h2,h3,h4,h5,h6 { @apply font-poppins font-bold }`, en die
          wint van een geërfd lettertype. Zonder deze regel staan "PROFIEL",
          "LABELS" enzovoort in Poppins terwijl de rest van het paneel Inter is. */}
      <h4 style={{
        margin: '0 0 10px', fontSize: WA_TEKST.badge, letterSpacing: '.05em',
        textTransform: 'uppercase', color: WA.textSub, fontWeight: WA_GEWICHT.bold,
        fontFamily: 'inherit',
      }}>{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', fontSize: WA_TEKST.body,
      padding: '6px 0', borderBottom: last ? 'none' : '1px dashed #ececec', gap: 8,
    }}>
      <span style={{ color: WA.textSub, flexShrink: 0 }}>{k}</span>
      <span style={{ fontWeight: WA_GEWICHT.semibold, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

const FUNCTIE_WEERGAVE: Record<string, string> = {
  horeca: 'Horeca', horecamedewerker: 'Horeca', bediening: 'Horeca',
  chef: 'Chef', housekeeping: 'Housekeeping',
  logistiek: 'Logistiek', orderpicker: 'Logistiek',
  frontoffice: 'Front office', 'front-office': 'Front office',
};

const STATUS_WEERGAVE: Record<string, string> = {
  in_behandeling: 'Sollicitant',
  gepland: 'In kennismaking',
  aangenomen: 'Aangenomen',
  nieuw: 'Nieuw',
  actief: 'Actief',
};

const OPT_IN_WEERGAVE: Record<string, { label: string; kleur: string }> = {
  actief: { label: 'Actief', kleur: '#059669' },
  opt_out: { label: 'Opt-out', kleur: '#e63946' },
  verzending_faalt: { label: 'Verzending faalt', kleur: '#f0a500' },
};

// Vaste snelle antwoorden zoals in de mockup.
function quickReplies(voornaam: string): Array<{ icon: string; label: string; text: string }> {
  return [
    {
      icon: '📋', label: 'Uitleg dienstenrooster',
      text: `Hoi ${voornaam}! In de EXTRA-app zie je onder 'Diensten' alle beschikbare diensten. Je plant jezelf direct in op de diensten die jou passen — wijzigingen zie je meteen in je rooster. Lukt er iets niet? Laat het me weten!`,
    },
    {
      icon: '📎', label: 'Stuur afmeldprotocol',
      text: `Hoi ${voornaam}, hierbij ons afmeldprotocol: kun je een dienst onverhoopt niet werken, meld je dan uiterlijk 24 uur van tevoren af via de EXTRA-app of stuur ons hier een berichtje. Zo kunnen we op tijd vervanging regelen.`,
    },
    {
      icon: '🔗', label: 'Link naar Medewerkers App',
      text: `Hoi ${voornaam}! Via deze link kom je bij de EXTRA Medewerkers App: https://doehetextra.nl/employee-app — daar zie je je diensten, punten en beschikbaarheid.`,
    },
  ];
}

export default function ProfilePanel({ conv, teamMembers, onQuickReply, onConversationChanged }: Props) {
  const [contact, setContact] = useState<WaContact | null>(null);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [optInBusy, setOptInBusy] = useState(false);
  const [catBusy, setCatBusy] = useState(false);

  /** Fase 3: handmatige override van het onderwerp-label (null = terug naar AI). */
  async function handleCategorie(category: AiCategory | null) {
    setCatBusy(true);
    try {
      await zetAiCategorie(conv.phoneNumber, category);
      onConversationChanged();
    } catch { /* stil falen; de poll zet de waarde terug */ }
    finally { setCatBusy(false); }
  }

  const naam = conv.displayName || `+${conv.phoneNumber}`;
  const rol = conv.matchCategory === 'candidate' ? 'Medewerker'
    : conv.matchCategory === 'prospect' ? 'Klant'
    : 'Kandidaat';

  // Contact-lookup (functie/status/opt-in) via het bestaande /contacten endpoint.
  useEffect(() => {
    let stop = false;
    setContact(null);
    const digits = conv.phoneNumber.replace(/\D/g, '');
    const zoek = digits.slice(-8);
    if (!zoek) return;
    haalContacten({ q: zoek, pageSize: 10 })
      .then(r => {
        if (stop) return;
        const match = r.items.find(it => (it.phone || '').replace(/\D/g, '').endsWith(zoek));
        setContact(match || r.items[0] || null);
      })
      .catch(() => {});
    return () => { stop = true; };
  }, [conv.phoneNumber]);

  useEffect(() => {
    setNotes([]);
    setNewNote('');
    haalNotities(conv.phoneNumber).then(setNotes).catch(() => {});
  }, [conv.phoneNumber]);

  const functie =
    (contact?.functie && (FUNCTIE_WEERGAVE[contact.functie.toLowerCase()] || contact.functie)) ||
    (conv.labels || []).map(l => FUNCTIE_WEERGAVE[l]).find(Boolean) ||
    '—';
  const status =
    (contact?.sourceStatus && (STATUS_WEERGAVE[contact.sourceStatus] || contact.sourceStatus)) ||
    (conv.inboxStatus === 'resolved' ? 'Opgelost' : conv.inboxStatus === 'spam' ? 'Spam' : 'Open');

  async function handleAssign(value: string) {
    if (value === '') {
      await wijsGesprekToe(conv.phoneNumber, null, null);
    } else {
      const member = teamMembers.find(m => m.id === parseInt(value, 10));
      if (member) await wijsGesprekToe(conv.phoneNumber, member.id, member.name);
    }
    onConversationChanged();
  }

  async function handleAddLabel(e: FormEvent) {
    e.preventDefault();
    const nieuw = labelInput.trim().toLowerCase();
    if (!nieuw) return;
    const huidige = conv.labels || [];
    if (!huidige.includes(nieuw)) {
      await updateLabels(conv.phoneNumber, [...huidige, nieuw]);
      onConversationChanged();
    }
    setLabelInput('');
    setShowLabelInput(false);
  }

  async function handleRemoveLabel(label: string) {
    await updateLabels(conv.phoneNumber, (conv.labels || []).filter(l => l !== label));
    onConversationChanged();
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNoteSaving(true);
    try {
      await maakNotitie(conv.phoneNumber, newNote.trim());
      setNewNote('');
      setNotes(await haalNotities(conv.phoneNumber));
    } catch { /* ignore */ }
    setNoteSaving(false);
  }

  async function toggleOptIn() {
    if (!contact || optInBusy) return;
    setOptInBusy(true);
    const doel = contact.whatsappOptInStatus === 'actief' ? 'opt_out' : 'actief';
    try {
      await updateContactOptIn(contact.contactType, contact.contactId, doel, 'Handmatig gewijzigd via inbox');
      setContact({ ...contact, whatsappOptInStatus: doel });
    } catch { /* ignore */ }
    setOptInBusy(false);
  }

  const optIn = contact ? OPT_IN_WEERGAVE[contact.whatsappOptInStatus] : null;

  return (
    <div style={{
      width: 300, background: '#fff', borderLeft: `1px solid ${WA.border}`,
      display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
    }}>
      {/* Header met gradient-avatar */}
      <div style={{
        background: WA.panel, padding: 16, textAlign: 'center',
        borderBottom: `1px solid ${WA.border}`,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `linear-gradient(135deg,${WA.purple},#a780f0)`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: WA_GLYPH.avatarGroot, fontWeight: WA_GEWICHT.bold, margin: '0 auto 10px',
        }}>{initials(naam)}</div>
        <div style={{ fontWeight: WA_GEWICHT.bold, fontSize: WA_TEKST.h3 }}>{naam}</div>
        <div style={{ fontSize: WA_TEKST.secundair, color: WA.textSub, marginTop: 2 }}>
          {rol} sinds {formatDate(conv.createdAt)}
        </div>
      </div>

      {/* Profiel */}
      <Section title="Profiel">
        <InfoRow k="Functie" v={functie} />
        <InfoRow k="Telefoon" v={formatPhone(conv.phoneNumber)} />
        <InfoRow k="Status" v={status} last />
      </Section>

      {/* Fase 3 — onderwerp: door de AI bepaald, door de planner te overrulen.
          Eén veld, geen tweede statusveld dat kan afwijken. */}
      <Section title="Onderwerp">
        <select
          value={conv.aiCategory ?? ''}
          disabled={catBusy}
          onChange={e => handleCategorie(e.target.value === '' ? null : (e.target.value as AiCategory))}
          style={{
            width: '100%', fontSize: WA_TEKST.secundair, padding: '7px 9px', borderRadius: 8,
            border: `1px solid ${WA.border}`, background: '#fff', color: WA.text,
            fontFamily: 'inherit', cursor: catBusy ? 'wait' : 'pointer',
          }}
        >
          <option value="">— nog niet bepaald —</option>
          {AI_CATEGORIES.map(c => (
            <option key={c} value={c}>{AI_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <div style={{ fontSize: WA_TEKST.badge, color: WA.textSub, marginTop: 6, lineHeight: 1.45 }}>
          {conv.aiCategorySource === 'handmatig' ? (
            <>
              Handmatig gezet — de AI past dit niet meer aan.{' '}
              <span
                onClick={() => !catBusy && handleCategorie(null)}
                style={{ color: WA.purpleDark, fontWeight: WA_GEWICHT.semibold, cursor: 'pointer' }}
              >Weer door AI laten bepalen</span>
            </>
          ) : (
            'Automatisch bepaald door de AI bij elk inkomend bericht.'
          )}
        </div>
        {conv.displayStatus === 'wacht_op_planner' && conv.escalationReason && (
          <div style={{
            marginTop: 8, fontSize: WA_TEKST.badge, padding: '6px 9px', borderRadius: 8,
            background: '#fef2f2', color: '#b91c1c', fontWeight: WA_GEWICHT.semibold,
          }}>
            Wacht op planner — {ESCALATION_REASON_LABELS[conv.escalationReason]}
          </div>
        )}
      </Section>

      {/* Labels */}
      <Section title="Labels">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {(conv.labels || []).map(l => (
            <span
              key={l}
              title="Klik om label te verwijderen"
              onClick={() => handleRemoveLabel(l)}
              style={{
                fontSize: WA_TEKST.badge, padding: '4px 10px', borderRadius: 14,
                background: '#f1e9ff', color: WA.purpleDark, fontWeight: WA_GEWICHT.semibold, cursor: 'pointer',
              }}
            >{l}</span>
          ))}
          {showLabelInput ? (
            <form onSubmit={handleAddLabel} style={{ display: 'inline-flex' }}>
              <input
                autoFocus
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                onBlur={() => { setShowLabelInput(false); setLabelInput(''); }}
                placeholder="label…"
                style={{
                  fontSize: WA_TEKST.badge, padding: '3px 8px', borderRadius: 14, width: 90,
                  border: `1px solid ${WA.border}`, outline: 'none', fontFamily: 'inherit',
                }}
              />
            </form>
          ) : (
            <span
              onClick={() => setShowLabelInput(true)}
              style={{
                fontSize: WA_TEKST.badge, padding: '4px 10px', borderRadius: 14, cursor: 'pointer',
                background: '#fff', color: WA.textSub, fontWeight: WA_GEWICHT.semibold, border: `1px dashed ${WA.border}`,
              }}
            >+ label</span>
          )}
        </div>
      </Section>

      {/* Snelle antwoorden */}
      <Section title="Snelle antwoorden">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quickReplies(voornaamVan(conv.displayName)).map(q => (
            <div
              key={q.label}
              onClick={() => onQuickReply(q.text)}
              style={{
                fontSize: WA_TEKST.secundair, background: WA.panel, padding: '8px 10px',
                borderRadius: 6, color: WA.text, cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#e9ebee'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = WA.panel; }}
            >{q.icon} {q.label}</div>
          ))}
        </div>
      </Section>

      {/* Toewijzen */}
      <Section title="Toewijzen">
        <select
          value={conv.assignedToId ?? ''}
          onChange={e => handleAssign(e.target.value)}
          style={{
            width: '100%', fontSize: WA_TEKST.body, padding: '7px 8px', borderRadius: 8,
            border: `1px solid ${WA.border}`, background: '#fff', color: WA.text,
            outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <option value="">Niet toegewezen</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </Section>

      {/* Interne notities (inklapbaar) */}
      <div style={{ padding: 16, borderBottom: '1px solid #f2f2f2' }}>
        <h4
          onClick={() => setNotesOpen(v => !v)}
          style={{
            margin: 0, fontSize: WA_TEKST.badge, letterSpacing: '.05em', textTransform: 'uppercase',
            color: WA.textSub, fontWeight: WA_GEWICHT.bold, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            // Zie de Section-kop hierboven: anders pakt de h4-basisregel Poppins.
            fontFamily: 'inherit',
          }}
        >
          <span>Interne notities{notes.length > 0 ? ` (${notes.length})` : ''}</span>
          <span style={{ fontSize: WA_TEKST.mini }}>{notesOpen ? '▲' : '▼'}</span>
        </h4>
        {notesOpen && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {notes.length === 0 && (
                <div style={{ fontSize: WA_TEKST.secundair, color: WA.textSub }}>Nog geen notities</div>
              )}
              {notes.map(n => (
                <div key={n.id} style={{ background: '#fffbea', border: '1px solid #f5e6a8', borderRadius: 6, padding: '6px 8px' }}>
                  <div style={{ fontSize: WA_TEKST.secundair, color: WA.text, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                  <div style={{ fontSize: WA_TEKST.mini, color: WA.textSub, marginTop: 3 }}>
                    {n.authorName} · {formatDate(n.createdAt)}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Nieuwe notitie…"
                style={{
                  flex: 1, fontSize: WA_TEKST.secundair, padding: '6px 8px', borderRadius: 6,
                  border: `1px solid ${WA.border}`, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                disabled={noteSaving || !newNote.trim()}
                style={{
                  border: 'none', background: WA.purple, color: '#fff', borderRadius: 6,
                  padding: '6px 10px', fontSize: WA_TEKST.secundair, fontWeight: WA_GEWICHT.semibold,
                  cursor: noteSaving ? 'wait' : 'pointer', opacity: newNote.trim() ? 1 : 0.5,
                }}
              >+</button>
            </form>
          </div>
        )}
      </div>

      {/* Opt-in-status */}
      <Section title="Opt-in-status">
        {contact && optIn ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: WA_TEKST.body, fontWeight: WA_GEWICHT.semibold }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: optIn.kleur, display: 'inline-block' }} />
              {optIn.label}
            </span>
            <button
              type="button"
              onClick={toggleOptIn}
              disabled={optInBusy}
              style={{
                border: `1px solid ${WA.border}`, background: '#fff', color: WA.textSub,
                borderRadius: 6, padding: '4px 8px', fontSize: WA_TEKST.badge, fontWeight: WA_GEWICHT.semibold,
                cursor: optInBusy ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {contact.whatsappOptInStatus === 'actief' ? 'Zet op opt-out' : 'Zet op actief'}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: WA_TEKST.secundair, color: WA.textSub }}>Geen gekoppeld contact gevonden</div>
        )}
      </Section>
    </div>
  );
}
