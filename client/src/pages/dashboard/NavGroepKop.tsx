/**
 * De sectiekop in de linker hoofdnavigatie: COMMUNICATIE, MEDEWERKERS,
 * BEDRIJVEN, CAMPAGNES, MARKETING & SEO.
 *
 * Waarom een component en geen stukje JSX per groep: dat wás het, vijf keer
 * hetzelfde blok van tien regels — en ze waren uit elkaar gelopen. 24px boven
 * de meeste koppen, 4px boven MEDEWERKERS (restant van toen dát de bovenste
 * groep was) en 16px boven SYSTEEM. Hoeveel lucht er boven een kop stond hing
 * dus af van welke groep er toevallig boven hem lag, wat je in de zijbalk
 * gewoon ziet. Vijf kopieën lopen altijd uit elkaar; één component niet.
 *
 * De maten komen uit huisstijl.ts, niet uit dit bestand. Zie de regel boven in
 * huisstijl.ts: losse px-waarden in een component zijn een bug.
 */
import { ChevronDown } from 'lucide-react';
import { HUISSTIJL } from '@/lib/huisstijl';

interface Props {
  /** Zoals je hem wilt lezen; de hoofdletters komen van textTransform. */
  label: string;
  expanded: boolean;
  onToggle: () => void;
  /**
   * Bovenste kop van de navigatie. Die staat direct onder het logoblok, dat
   * via sidebarLogoPadding zelf al onderruimte meebrengt; met de volle
   * groepsmarge telt dat dubbel en valt er een gat onder "Dashboard".
   */
  eerste?: boolean;
}

export default function NavGroepKop({ label, expanded, onToggle, eerste }: Props) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between transition-colors"
      style={{
        fontSize: HUISSTIJL.TYPOGRAFIE.sidebarGroupHeader.fontSize,
        fontWeight: HUISSTIJL.TYPOGRAFIE.sidebarGroupHeader.fontWeight,
        textTransform: HUISSTIJL.TYPOGRAFIE.sidebarGroupHeader.textTransform,
        letterSpacing: HUISSTIJL.TYPOGRAFIE.sidebarGroupHeader.letterSpacing,
        color: HUISSTIJL.KLEUR.muted,
        padding: `4px ${HUISSTIJL.MAAT.sidebarNavPaddingX}px`,
        marginTop: `${eerste ? HUISSTIJL.MAAT.sidebarGroepMarginTopEerste : HUISSTIJL.MAAT.sidebarGroepMarginTop}px`,
        marginBottom: `${HUISSTIJL.MAAT.sidebarGroepMarginBottom}px`,
      }}
    >
      <span>{label}</span>
      <ChevronDown
        className="transition-transform"
        style={{ height: 12, width: 12, transform: expanded ? 'rotate(0)' : 'rotate(-90deg)' }}
      />
    </button>
  );
}
