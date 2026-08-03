/**
 * Sidebar (400px) — tabs Medewerkers/Kandidaten/Klanten/Taken, zoekbalk en
 * filterrij ("Toegewezen aan mij" + "Gesnoozed" + "AI-afgehandeld verbergen").
 */
import type { ReactNode } from 'react';
import type { Conversation, Stats, Task, TaskStatus, TeamMember } from '../../../api/whatsappClient';
import { WA } from './theme';
import ConversationList from './ConversationList';
import TakenPanel, { type TakenAssigneeFilter } from './TakenPanel';

/**
 * De drie gesprekscategorieën. BEWUST los van SidebarTab gehouden: deze waarde
 * gaat één op één naar de API (`haalGesprekken`) en is een sleutel in `stats`.
 * 'taken' hoort daar niet bij — dat is een weergave, geen gesprekscategorie.
 */
export type InboxTab = 'candidate' | 'unmatched' | 'prospect';

/** Wat er in de zijbalk zichtbaar is: een gesprekscategorie óf de takenlijst. */
export type SidebarTab = InboxTab | 'taken';

// Volgorde en labels zoals in de mockup: Medewerkers · Kandidaten · Klanten,
// sinds Fase 3E met Taken erachter. Mapping identiek aan WhatsAppBeheer:
// candidate=Medewerkers (aangenomen), unmatched=Kandidaten, prospect=Klanten.
export const TAB_VOLGORDE: Array<{ key: SidebarTab; label: string }> = [
  { key: 'candidate', label: 'Medewerkers' },
  { key: 'unmatched', label: 'Kandidaten' },
  { key: 'prospect', label: 'Klanten' },
  { key: 'taken', label: 'Taken' },
];

interface Props {
  tab: SidebarTab;
  onTab: (t: SidebarTab) => void;
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
  /** Fase 3B: alles voor het Taken-tabblad. */
  taken: {
    tasks: Task[];
    /** Open taken in totaal, ongeacht het filter. Voedt de badge op de tab. */
    openTotaal: number;
    statusFilter: TaskStatus | 'alle';
    onStatusFilter: (s: TaskStatus | 'alle') => void;
    assigneeFilter: TakenAssigneeFilter;
    onAssigneeFilter: (f: TakenAssigneeFilter) => void;
    teamMembers: TeamMember[];
    onToggleTask: (t: Task) => void;
    onAssign: (t: Task, assignedToId: number | null) => void;
    onSelectConversation: (t: Task) => void;
    bezig: number[];
    fout: string | null;
  };
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
        fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
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
    conversations, selectedPhone, onSelect, taken,
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

      {/* Tabs met paarse onderstreping. De vierde tab (Taken) telt openstaande
          taken in plaats van ongelezen berichten; groen is in dit dashboard de
          kleur van "ongelezen bericht", dus die badge is paars — anders lees je
          hem als post die er niet is. De teller staat er ook als je op een
          ander tabblad kijkt: dat was precies de reden dat het oude paneel
          altijd een zichtbare kop had. */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: `1px solid ${WA.border}` }}>
        {TAB_VOLGORDE.map(t => {
          const active = tab === t.key;
          const isTaken = t.key === 'taken';
          const teller = isTaken ? taken.openTotaal : (stats?.[t.key as InboxTab]?.unread ?? 0);
          return (
            <div
              key={t.key}
              onClick={() => onTab(t.key)}
              title={isTaken ? 'Taken die de AI uit de gesprekken heeft gehaald' : undefined}
              style={{
                // 12.5px in plaats van 13: met een vierde tab erbij raakten
                // "Medewerkers 3" en "Kandidaten 1" elkaar bijna in de 400px
                // brede zijbalk. Een halve punt kleiner geeft precies genoeg
                // lucht zonder dat de labels moeten worden afgekort.
                flex: 1, textAlign: 'center', padding: '11px 3px',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                color: active ? WA.purple : WA.textSub,
                borderBottom: `3px solid ${active ? WA.purple : 'transparent'}`,
              }}
            >
              {t.label}
              {teller > 0 && (
                <span style={{
                  marginLeft: 5, background: isTaken ? WA.purple : WA.unread, color: '#fff',
                  fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px',
                }}>{teller}</span>
              )}
            </div>
          );
        })}
      </div>

      {tab === 'taken' ? (
        // Taken-tabblad: eigen filters, volle hoogte. De zoekbalk en de
        // gespreksfilters staan er bewust niet — die filteren gesprekken, niet
        // taken, en een filter die niets doet is erger dan geen filter.
        <TakenPanel
          tasks={taken.tasks}
          statusFilter={taken.statusFilter}
          onStatusFilter={taken.onStatusFilter}
          assigneeFilter={taken.assigneeFilter}
          onAssigneeFilter={taken.onAssigneeFilter}
          teamMembers={taken.teamMembers}
          onToggleTask={taken.onToggleTask}
          onAssign={taken.onAssign}
          onSelectConversation={taken.onSelectConversation}
          bezig={taken.bezig}
          fout={taken.fout}
        />
      ) : (
      <>
      {/* Zoekbalk */}
      <div style={{ padding: '8px 12px', background: '#fff' }}>
        <div style={{
          background: WA.panel, borderRadius: 8, padding: '7px 12px',
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: WA.textSub }}>🔍</span>
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Zoek of start een gesprek"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: WA.text, fontFamily: 'inherit',
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

      <ConversationList
        conversations={conversations}
        selectedPhone={selectedPhone}
        onSelect={onSelect}
        snoozedView={snoozedView}
      />
      </>
      )}
    </div>
  );
}
