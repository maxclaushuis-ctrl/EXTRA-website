/**
 * Sidebar (400px) — tabs Medewerkers/Kandidaten/Klanten, zoekbalk en filterrij
 * ("Toegewezen aan mij" + "Gesnoozed" + "AI-afgehandeld verbergen").
 */
import type { ReactNode } from 'react';
import type { Conversation, Stats } from '../../../api/whatsappClient';
import { WA, WA_TEKST, WA_GEWICHT } from './theme';
import ConversationList from './ConversationList';

export type InboxTab = 'candidate' | 'unmatched' | 'prospect';

// Volgorde en labels zoals in de mockup: Medewerkers · Kandidaten · Klanten.
// Mapping identiek aan WhatsAppBeheer: candidate=Medewerkers (aangenomen),
// unmatched=Kandidaten, prospect=Klanten.
export const TAB_VOLGORDE: Array<{ key: InboxTab; label: string }> = [
  { key: 'candidate', label: 'Medewerkers' },
  { key: 'unmatched', label: 'Kandidaten' },
  { key: 'prospect', label: 'Klanten' },
];

interface Props {
  tab: InboxTab;
  onTab: (t: InboxTab) => void;
  stats: Stats | null;
  search: string;
  onSearch: (v: string) => void;
  assignedToMe: boolean;
  onToggleAssignedToMe: () => void;
  snoozedView: boolean;
  onToggleSnoozedView: () => void;
  /** Fase 3: verberg gesprekken waarvan de AI het laatste woord had. Default AAN. */
  hideAiHandled: boolean;
  onToggleHideAiHandled: () => void;
  /** Aantal gesprekken dat door die filter verborgen is (0 = chip zonder teller). */
  hiddenAiCount: number;
  conversations: Conversation[];
  selectedPhone: string | null;
  onSelect: (phone: string) => void;
  // Hier zat een `taken`-prop met de hele Taken-state. Taken is een eigen
  // pagina geworden in de hoofdnavigatie (TakenPagina.tsx), dus de sidebar
  // heeft er niets meer van nodig: terug naar drie tabbladen.
}

function FilterChip({ active, onClick, title, children }: {
  active: boolean;
  onClick: () => void;
  /** Volledige omschrijving; de chip zelf houdt een korte tekst. */
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 11px', borderRadius: 999, flexShrink: 0,
        fontSize: WA_TEKST.badge, fontWeight: WA_GEWICHT.semibold, cursor: 'pointer',
        background: active ? WA.purple : '#fff',
        color: active ? '#fff' : '#4b5563',
        border: `1px solid ${active ? WA.purple : WA.border}`,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

export default function Sidebar(props: Props) {
  const {
    tab, onTab, stats, search, onSearch,
    assignedToMe, onToggleAssignedToMe, snoozedView, onToggleSnoozedView,
    hideAiHandled, onToggleHideAiHandled, hiddenAiCount,
    conversations, selectedPhone, onSelect,
  } = props;

  return (
    <div style={{
      width: 400, minWidth: 320, background: '#fff',
      display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${WA.border}`,
    }}>
      {/* De paarse "EXTRA WhatsApp"-banner stond hier. Weg: het dashboard
          eromheen draagt de EXTRA-branding al via zijn eigen navigatie, dus
          binnen de module was het een tweede merkbalk die alleen verticale
          ruimte kostte. Het driepuntsmenu erin had geen onClick en geen menu
          erachter — puur decoratief — dus er hoefde niets te verhuizen. */}

      {/* Tabs met paarse onderstreping */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: `1px solid ${WA.border}` }}>
        {TAB_VOLGORDE.map(t => {
          const active = tab === t.key;
          const unread = stats?.[t.key]?.unread ?? 0;
          return (
            <div
              key={t.key}
              onClick={() => onTab(t.key)}
              style={{
                flex: 1, textAlign: 'center', padding: '11px 4px',
                fontSize: WA_TEKST.body, fontWeight: WA_GEWICHT.semibold, cursor: 'pointer',
                color: active ? WA.purple : WA.textSub,
                borderBottom: `3px solid ${active ? WA.purple : 'transparent'}`,
              }}
            >
              {t.label}
              {unread > 0 && (
                <span style={{
                  marginLeft: 5, background: WA.unread, color: '#fff',
                  fontSize: WA_TEKST.mini, fontWeight: WA_GEWICHT.bold, borderRadius: 10, padding: '1px 6px',
                }}>{unread}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Zoekbalk */}
      <div style={{ padding: '8px 12px', background: '#fff' }}>
        <div style={{
          background: WA.panel, borderRadius: 8, padding: '7px 12px',
          fontSize: WA_TEKST.body, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: WA.textSub }}>🔍</span>
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Zoek of start een gesprek"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: WA_TEKST.body, color: WA.text, fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Filterrij: Toegewezen aan mij + Gesnoozed + AI-afgehandeld verbergen.
          De laatste staat standaard AAN: de planner ziet zo alleen wat nog
          menselijke aandacht vraagt. De teller maakt zichtbaar hoeveel er
          verborgen is, zodat de filter nooit stilletjes gesprekken opslokt.

          WRAPPEN, NIET SCROLLEN: hiervoor stond hier overflowX:'auto', waardoor
          de derde chip half buiten beeld viel — een filter die je niet ziet
          bestaat niet. Wrappen is ook de enige van de twee opties die blijft
          werken als er filters bijkomen (bv. per categorie); iconen-met-tooltip
          zouden bij zes of zeven chips onleesbaar worden én tooltips doen het
          niet op touch. De rij groeit gewoon een regel mee. */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, padding: '2px 12px 8px', background: '#fff',
        borderBottom: `1px solid ${WA.border}`,
      }}>
        <FilterChip
          active={assignedToMe}
          onClick={onToggleAssignedToMe}
          title="Alleen gesprekken die aan mij zijn toegewezen"
        >👤 Aan mij</FilterChip>
        <FilterChip active={snoozedView} onClick={onToggleSnoozedView}>⏰ Gesnoozed</FilterChip>
        <FilterChip
          active={hideAiHandled}
          onClick={onToggleHideAiHandled}
          title="Verberg gesprekken waarin de AI-agent het laatste woord had"
        >
          🤖 AI-afgehandeld verbergen{hideAiHandled && hiddenAiCount > 0 ? ` (${hiddenAiCount})` : ''}
        </FilterChip>
      </div>

      {/* Tussen de filterrij en de gesprekken stond het ingeklapte Taken-paneel.
          Dat is verhuisd naar een eigen pagina; de gesprekken beginnen nu
          direct onder de filters. */}
      <ConversationList
        conversations={conversations}
        selectedPhone={selectedPhone}
        onSelect={onSelect}
        snoozedView={snoozedView}
      />
    </div>
  );
}
