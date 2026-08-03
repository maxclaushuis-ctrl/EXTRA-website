/**
 * Gesprekkenlijst in de sidebar — items met avatar (deterministische kleur),
 * naam, preview, relatieve tijd, unread-badge en label-tags, conform de mockup.
 */
import type { Conversation, EscalationReason } from '../../../api/whatsappClient';
import { ESCALATION_REASON_LABELS } from '../../../api/whatsappClient';
import { WA, avatarColor, initials, relativeTime, snoozeRemaining } from './theme';

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
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, textAlign: 'center', fontSize: 13, color: WA.textSub }}>
        {snoozedView ? 'Geen gesnoozede gesprekken' : 'Geen gesprekken gevonden'}
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {conversations.map(c => {
        const naam = c.displayName || `+${c.phoneNumber}`;
        const active = c.phoneNumber === selectedPhone;
        const rest = snoozedView ? snoozeRemaining(c.snoozedUntil) : null;
        const tags = (c.labels || []).map(tagStyle).filter(Boolean).slice(0, 2) as Array<{ text: string; bg: string }>;
        // Alleen tonen zolang het gesprek écht openstaat; opgelost/spam wacht op niemand.
        const escalatie = (c.displayStatus === 'wacht_op_planner' && c.escalationReason)
          ? (c.escalationReason as EscalationReason)
          : null;
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c.phoneNumber)}
            style={{
              display: 'flex', gap: 12, padding: '11px 14px', cursor: 'pointer',
              borderBottom: '1px solid #f2f2f2',
              background: active ? WA.panel : undefined,
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = '#f9f9f9'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = active ? WA.panel : ''; }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 15,
              background: avatarColor(naam),
            }}>
              {initials(naam)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                  <span style={{
                    fontSize: 14.5, fontWeight: 600, color: WA.text,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{naam}</span>
                  {escalatie && (
                    <span
                      title={`Wacht op planner — ${ESCALATION_REASON_LABELS[escalatie]}`}
                      style={{
                        flexShrink: 0, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.2,
                        padding: '2px 6px', borderRadius: 9, whiteSpace: 'nowrap',
                        color: '#fff', background: ESCALATIE_KLEUR[escalatie],
                      }}
                    >{ESCALATION_REASON_LABELS[escalatie].toUpperCase()}</span>
                  )}
                  {!escalatie && c.displayStatus === 'afgehandeld_ai' && (
                    <span title="Laatste bericht is door de AI-agent beantwoord"
                      style={{ flexShrink: 0, fontSize: 11, opacity: 0.65 }}>🤖</span>
                  )}
                </span>
                <span style={{ fontSize: 11.5, color: WA.textSub, flexShrink: 0, marginLeft: 6 }}>
                  {relativeTime(c.lastMessageAt)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{
                  fontSize: 13, color: WA.textSub,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 230,
                }}>
                  {c.lastMessagePreview || '—'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {rest && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                      background: '#e1f2fb', color: '#5c6f7a',
                    }}>⏰ {rest}</span>
                  )}
                  {tags.map(t => (
                    <span key={t.text} style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                      color: '#fff', background: t.bg,
                    }}>{t.text}</span>
                  ))}
                  {c.unreadCount > 0 && (
                    <span style={{
                      background: WA.unread, color: '#fff', fontSize: 11, fontWeight: 700,
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
