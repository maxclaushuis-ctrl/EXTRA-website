/**
 * Gesprekkenlijst in de sidebar — items met naam, preview, relatieve tijd en
 * unread-badge. Bewust compact: escalatiereden, onderwerp-categorie en
 * handmatige labels staan hier niet meer (dat maakte de lijst te druk), op
 * één uitzondering na — een gesprek met categorie "afmelding" krijgt een
 * rood label "Afmelding", omdat de planner dat op de lijst wil kunnen zien.
 * Al het andere blijft gewoon zichtbaar in het profielpaneel.
 *
 * Zonder avatar-cirkel: die toonde alleen initialen (of een neutraal icoon bij
 * een onbekende naam) en voegde dus niets toe aan wat de naam er al naast zei.
 */
import { Contact } from 'lucide-react';
import type { AiCategory, Conversation, EscalationReason } from '../../../api/whatsappClient';
import { AI_CATEGORY_LABELS } from '../../../api/whatsappClient';
import { WA, WA_TEKST, WA_GEWICHT, relativeTime, snoozeRemaining } from './theme';
import { KLEUR } from '../../../lib/huisstijl';

// Kleur voor het enige badge dat nog in de lijst zelf staat — zie de
// vereenvoudiging hieronder bij ConversationList.
const AFMELDING_ROOD = '#e63946';

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
        // De lijst toont bewust geen escalatiereden, onderwerp-categorie of
        // handmatige labels meer — dat maakte de lijst te druk. Al die
        // informatie blijft ongewijzigd zichtbaar in het profielpaneel zodra
        // het gesprek open staat; hier in de compacte lijst is "Afmelding"
        // de enige uitzondering, omdat de planner die in één oogopslag wil
        // zien zonder elk gesprek open te hoeven klikken.
        const categorie = (c.aiCategory || null) as AiCategory | null;
        const isAfmelding = categorie === 'afmelding';
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
                  {isAfmelding && (
                    <span
                      title={
                        `Onderwerp: ${AI_CATEGORY_LABELS.afmelding}` +
                        (c.aiCategorySource === 'handmatig' ? ' (handmatig gezet)' : '')
                      }
                      style={{
                        fontSize: WA_TEKST.mini, fontWeight: WA_GEWICHT.bold, padding: '2px 7px', borderRadius: 10,
                        whiteSpace: 'nowrap',
                        color: '#fff', background: AFMELDING_ROOD,
                      }}
                    >Afmelding</span>
                  )}
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
