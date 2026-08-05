/**
 * Gesprekkenlijst in de sidebar — items met naam, preview, relatieve tijd,
 * unread-badge en label-tags.
 *
 * Zonder avatar-cirkel: die toonde alleen initialen (of een neutraal icoon bij
 * een onbekende naam) en voegde dus niets toe aan wat de naam er al naast zei.
 */
import { Contact } from 'lucide-react';
import type { AiCategory, Conversation, EscalationReason } from '../../../api/whatsappClient';
import { AI_CATEGORY_LABELS, ESCALATION_REASON_LABELS } from '../../../api/whatsappClient';
import { WA, WA_TEKST, WA_GEWICHT, relativeTime, snoozeRemaining } from './theme';
import { KLEUR } from '../../../lib/huisstijl';

// Label → tag-stijl uit de mockup: NIEUW=paars, SPOED=rood, klant=amber.
function tagStyle(label: string): { text: string; bg: string } | null {
  const l = label.toLowerCase();
  if (l === 'nieuw') return { text: 'NIEUW', bg: WA.purple };
  if (l === 'spoed' || l === 'urgent') return { text: 'SPOED', bg: '#e63946' };
  if (l === 'klant') return { text: 'klant', bg: '#f0a500' };
  return { text: l, bg: '#6b7280' };
}

/**
 * Fase 3: escalatiereden als badge NAAST DE NAAM, dus zichtbaar zonder het
 * gesprek te openen. Kleur zegt hoe dringend: rood = boos, amber = iemand
 * wacht op contact, grijs = de AI kwam er inhoudelijk niet uit.
 */
const ESCALATIE_KLEUR: Record<EscalationReason, string> = {
  boos: '#e63946',
  wil_telefonisch: '#f0a500',
  mens_gevraagd: '#f0a500',
  buiten_kennisbank: '#6b7280',
  overig: '#6b7280',
};

/**
 * Fase 3C: het onderwerp-label van de AI als badge in de lijst. Dat was het
 * doel van automatisch labelen — zien waar een gesprek over gaat zonder het
 * te openen — maar tot nu toe stond het label alleen in het gesprek zelf.
 *
 * Exhaustief getypt op AiCategory, net als CATEGORIE_KLEUR in TakenPanel.tsx:
 * een nieuwe categorie zonder kleur is dan een compile-fout, geen stille
 * grijze badge.
 *
 * Rood en amber komen hier BEWUST niet voor: die twee kleuren betekenen in
 * deze lijst "iemand wacht op een mens" (ESCALATIE_KLEUR). Een onderwerp is
 * nooit dringend uit zichzelf.
 */
const CATEGORIE_KLEUR: Record<AiCategory, string> = {
  sollicitatie: '#2a9d8f',
  afmelding: '#7048b6',
  klacht: '#b5179e',
  algemene_vraag: '#0077b6',
  verzoek: '#4f772d',
  overig: '#667781',
};

interface Props {
  conversations: Conversation[];
  selectedPhone: string | null;
  onSelect: (phone: string) => void;
  /** In de "Gesnoozed"-weergave tonen we de resterende snooze-tijd. */
  snoozedView?: boolean;
}

export default function ConversationList({ conversations, selectedPhone, onSelect, snoozedView }: Props) {
  if (conversations.length === 0) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, textAlign: 'center', fontSize: WA_TEKST.body, color: WA.textSub }}>
        {snoozedView ? 'Geen gesnoozede gesprekken' : 'Geen gesprekken gevonden'}
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {conversations.map(c => {
        const naam = c.displayName || c.importedContactName || `+${c.phoneNumber}`;
        // Naam komt uit de eenmalige contactenimport, niet uit een échte match —
        // bepaalt of het dunne signaal-icoontje naast de naam getoond wordt.
        const geimporteerdeNaam = !c.displayName && !!c.importedContactName;
        const active = c.phoneNumber === selectedPhone;
        const rest = snoozedView ? snoozeRemaining(c.snoozedUntil) : null;
        // Categorie krijgt voorrang op de vrije labels: die zijn handwerk en
        // staan lang niet overal, de categorie staat er (bijna) altijd. Samen
        // met de unread-badge passen er hooguit twee tags op één regel.
        const categorie = (c.aiCategory || null) as AiCategory | null;
        const tags = (c.labels || []).map(tagStyle).filter(Boolean).slice(0, categorie ? 1 : 2) as Array<{ text: string; bg: string }>;
        // Alleen tonen zolang het gesprek écht openstaat; opgelost/spam wacht op niemand.
        const escalatie = (c.displayStatus === 'wacht_op_planner' && c.escalationReason)
          ? (c.escalationReason as EscalationReason)
          : null;
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c.phoneNumber)}
            style={{
              display: 'flex', padding: '11px 14px', cursor: 'pointer',
              borderBottom: '1px solid #f2f2f2',
              background: active ? WA.panel : undefined,
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = '#f9f9f9'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = active ? WA.panel : ''; }}
          >
            {/* Geen avatar-cirkel meer: de naam begint links, waar eerst de
                cirkel stond. Daarom staat er ook geen gap meer op de rij —
                anders bleef er een lege kolom van 46px staan. */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                  <span style={{
                    fontSize: WA_TEKST.body, fontWeight: WA_GEWICHT.semibold, color: WA.text,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{naam}</span>
                  {geimporteerdeNaam && (
                    <span title="Naam uit geïmporteerde contactenlijst" style={{ display: 'inline-flex', flexShrink: 0 }}>
                      <Contact size={11} strokeWidth={1.5} color={KLEUR.muted} />
                    </span>
                  )}
                  {escalatie && (
                    <span
                      title={`Wacht op planner — ${ESCALATION_REASON_LABELS[escalatie]}`}
                      style={{
                        flexShrink: 0, fontSize: WA_TEKST.mini, fontWeight: WA_GEWICHT.bold, letterSpacing: 0.2,
                        padding: '2px 6px', borderRadius: 9, whiteSpace: 'nowrap',
                        color: '#fff', background: ESCALATIE_KLEUR[escalatie],
                      }}
                    >{ESCALATION_REASON_LABELS[escalatie].toUpperCase()}</span>
                  )}
                  {!escalatie && c.displayStatus === 'afgehandeld_ai' && (
                    <span title="Laatste bericht is door de AI-agent beantwoord"
                      style={{ flexShrink: 0, fontSize: WA_TEKST.badge, opacity: 0.65 }}>🤖</span>
                  )}
                </span>
                <span style={{ fontSize: WA_TEKST.badge, color: WA.textSub, flexShrink: 0, marginLeft: 6 }}>
                  {relativeTime(c.lastMessageAt)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{
                  fontSize: WA_TEKST.secundair, color: WA.textSub,
                  // 230 → 288: de 46px cirkel plus 12px gap zijn weg, die
                  // ruimte gaat naar de preview in plaats van naar niets.
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 288,
                }}>
                  {c.lastMessagePreview || '—'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {rest && (
                    <span style={{
                      fontSize: WA_TEKST.mini, fontWeight: WA_GEWICHT.bold, padding: '2px 7px', borderRadius: 10,
                      background: '#e1f2fb', color: '#5c6f7a',
                    }}>⏰ {rest}</span>
                  )}
                  {categorie && (
                    <span
                      title={
                        `Onderwerp: ${AI_CATEGORY_LABELS[categorie] ?? categorie}` +
                        (c.aiCategorySource === 'handmatig' ? ' (handmatig gezet)' : '')
                      }
                      style={{
                        fontSize: WA_TEKST.mini, fontWeight: WA_GEWICHT.bold, padding: '2px 7px', borderRadius: 10,
                        whiteSpace: 'nowrap',
                        color: '#fff', background: CATEGORIE_KLEUR[categorie] ?? CATEGORIE_KLEUR.overig,
                      }}
                    >{AI_CATEGORY_LABELS[categorie] ?? categorie}</span>
                  )}
                  {tags.map(t => (
                    <span key={t.text} style={{
                      fontSize: WA_TEKST.mini, fontWeight: WA_GEWICHT.bold, padding: '2px 7px', borderRadius: 10,
                      color: '#fff', background: t.bg,
                    }}>{t.text}</span>
                  ))}
                  {c.unreadCount > 0 && (
                    <span style={{
                      background: WA.unread, color: '#fff', fontSize: WA_TEKST.badge, fontWeight: WA_GEWICHT.bold,
                      borderRadius: '50%', width: 19, height: 19,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{c.unreadCount > 9 ? '9+' : c.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
