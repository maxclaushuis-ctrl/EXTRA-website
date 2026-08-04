/**
 * De groep COMMUNICATIE uit de linker hoofdnavigatie: WhatsApp · Taken ·
 * Contacten · AI-instellingen.
 *
 * Waarom een eigen component en niet gewoon JSX in DashboardMockup.tsx, waar
 * de andere groepen staan: DashboardMockup hangt aan useAuth(), react-query en
 * de echte API, en is daardoor niet te fotograferen zonder server, database en
 * inlog. De navigatie was tot nu toe het enige stuk van de module dat ik in de
 * layout-harness moest namaken om er een screenshot van te kunnen laten zien,
 * en namaak bewijst niets. Zo staat er precies één versie van deze groep, en
 * ziet de harness dezelfde als productie.
 *
 * Alles komt binnen via props; het component leest zelf geen state en doet
 * geen fetch. Dat is ook wat het fotografeerbaar maakt.
 *
 * ⚠️ Alle maten en kleuren komen uit huisstijl.ts. Losse px- of hex-waarden
 * horen hier niet — zie de regel boven in dat bestand.
 */
import { MessageSquare, ListChecks, Users, Sparkles } from 'lucide-react';
import { HUISSTIJL } from '@/lib/huisstijl';
import NavGroepKop from './NavGroepKop';

export type CommunicatieTab = 'whatsapp' | 'whatsapp-taken' | 'whatsapp-contacten' | 'whatsapp-ai';

interface Props {
  activeTab: string;
  onSelect: (tab: CommunicatieTab) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  /** Ongelezen WhatsApp-berichten. 0 = geen badge. */
  ongelezen: number;
  /** Openstaande taken. 0 = geen badge. */
  takenOpen: number;
  /**
   * Of de groep de bovenste in de navigatie is. Zo ja, dan een kleinere
   * top-marge: het logoblok erboven brengt zelf al ruimte mee.
   */
  eerste?: boolean;
}

/**
 * Rode telbadge, identiek voor WhatsApp en Taken. Stond eerst als losse JSX
 * bij WhatsApp; één functie zodat de twee niet uit elkaar kunnen lopen.
 */
function Badge({ aantal, titel, testId }: { aantal: number; titel: string; testId: string }) {
  if (aantal <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold shadow-sm"
      title={titel}
      data-testid={testId}
    >
      {aantal > 99 ? '99+' : aantal}
    </span>
  );
}

function MenuItem({
  icon: Icon, label, tab, activeTab, onSelect, children,
}: {
  icon: typeof MessageSquare;
  label: string;
  tab: CommunicatieTab;
  activeTab: string;
  onSelect: (t: CommunicatieTab) => void;
  children?: React.ReactNode;
}) {
  const actief = activeTab === tab;
  // dh-nav-item is het haakje voor de ingeklapte zijbalk (zie index.css): in
  // die stand verdwijnt alle tekst in de knop en blijft het icoon gecentreerd
  // over. title= hierboven wordt dan de tooltip, want het label is weg.
  return (
    <button
      onClick={() => onSelect(tab)}
      title={label}
      className="dh-nav-item w-full flex items-center rounded-xl mb-1 transition-colors"
      style={{
        fontSize: HUISSTIJL.TYPOGRAFIE.menuItem.fontSize,
        fontWeight: actief ? HUISSTIJL.TYPOGRAFIE.menuItem.fontWeightActief : HUISSTIJL.TYPOGRAFIE.menuItem.fontWeightInactief,
        padding: `${HUISSTIJL.MAAT.sidebarMenuItemPaddingY}px ${HUISSTIJL.MAAT.sidebarMenuItemPaddingX}px`,
        gap: `${HUISSTIJL.MAAT.sidebarMenuItemGap}px`,
        color: actief ? HUISSTIJL.KLEUR.primair : HUISSTIJL.KLEUR.inkt,
        backgroundColor: actief ? HUISSTIJL.KLEUR.primairVlakActief : 'transparent',
      }}
    >
      <Icon
        className="flex-shrink-0"
        style={{
          height: HUISSTIJL.MAAT.sidebarIconMaat,
          width: HUISSTIJL.MAAT.sidebarIconMaat,
          strokeWidth: HUISSTIJL.MAAT.iconStrokeWidth,
        }}
      />
      <span>{label}</span>
      {children}
    </button>
  );
}

export default function CommunicatieNav({
  activeTab, onSelect, expanded, onToggleExpanded, ongelezen, takenOpen, eerste,
}: Props) {
  return (
    <>
      <NavGroepKop label="Communicatie" expanded={expanded} onToggle={onToggleExpanded} eerste={eerste} />

      {expanded && (
        <>
          <MenuItem icon={MessageSquare} label="WhatsApp" tab="whatsapp" activeTab={activeTab} onSelect={onSelect}>
            <Badge
              aantal={ongelezen}
              titel={`${ongelezen} ongelezen bericht${ongelezen === 1 ? '' : 'en'}`}
              testId="badge-whatsapp-unread"
            />
          </MenuItem>

          {/* Taken stond tot nu toe als vierde tabblad in de WhatsApp-sidebar,
              naast Medewerkers/Kandidaten/Klanten. Dat was de verkeerde plek:
              die drie zijn categorieën gesprekken, taken zijn dat niet, en je
              moest de inbox openen om te zien of er iets lag. Hier staat de
              teller in het zicht zonder dat je ergens naartoe hoeft. */}
          <MenuItem icon={ListChecks} label="Taken" tab="whatsapp-taken" activeTab={activeTab} onSelect={onSelect}>
            <Badge
              aantal={takenOpen}
              titel={`${takenOpen} openstaande ta${takenOpen === 1 ? 'ak' : 'ken'}`}
              testId="badge-taken-open"
            />
          </MenuItem>

          <MenuItem icon={Users} label="Contacten" tab="whatsapp-contacten" activeTab={activeTab} onSelect={onSelect} />
          <MenuItem icon={Sparkles} label="AI-instellingen" tab="whatsapp-ai" activeTab={activeTab} onSelect={onSelect} />
        </>
      )}
    </>
  );
}
