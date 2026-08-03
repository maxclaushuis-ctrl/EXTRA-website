/**
 * EXTRA Dashboard Design System
 * Gebaseerd op Planbord huisstijl (28 juli 2026)
 *
 * ⚠️  REGEL: Alle nieuwe UI-elementen importeren waarden UITSLUITEND hieruit.
 *     Losse hex-waarden of px-waarden in componenten = bug.
 */

// ============================================================================
// 1. KLEUREN — het volledige palet
// ============================================================================
export const KLEUR = {
  // Brand (violet)
  primair: '#7C3AED',
  primairHover: '#6D28D9',
  primairVlak: '#F5F0FF',
  primairVlakActief: '#F3EEFF',
  primairRand: '#C4B5FD',

  // Typografie & basis
  inkt: '#111111',               // koppen + body
  donkergrijs: '#374151',        // nadruk
  secundair: '#6B7280',          // tekst/iconen
  muted: '#9CA3AF',              // hints/placeholders
  stil: '#D1D5DB',               // disabled/decoratief

  // Structuur
  rand: '#E5E7EB',               // overal gebruikt
  paginaAchtergrond: '#F9F9FB',
  kaart: '#FFFFFF',
  vlak: '#F3F4F6',               // neutrale achtergrond
  zebra: '#FAFAFA',              // alternatieve rij-kleur

  // Status
  succes: '#059669',
  succesVlak: '#D1FAE5',
  fout: '#DC2626',
  foutVlak: '#FEE2E2',
  foutRand: '#FECACA',
  waarschuwing: '#B45309',
  waarschuwingVlak: '#FEF3C7',
  waarschuwingRand: '#FCD34D',
  info: '#1E40AF',
  infoVlak: '#DBEAFE',
} as const;

// ============================================================================
// 2. TYPOGRAFIE
// ============================================================================
export const TYPOGRAFIE = {
  // Font families. "Inter Variable" staat voorop: dat is de familienaam van het
  // zelf-gehoste variabele bestand (zie de @import bovenaan index.css). Zonder
  // die naam valt de stack door naar -apple-system en krijg je op een Mac San
  // Francisco in plaats van Inter — precies het verschil dat we hier wegnemen.
  primair: '"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  gewichten: {
    light: 400,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extraBold: 800,
  },

  // Font sizes & styles
  body: {
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: '1.5',
    color: KLEUR.inkt,
  },
  h1: {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: 'tight',
    color: KLEUR.inkt,
  },
  h2: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 'tight',
    color: KLEUR.inkt,
  },
  h3: {
    fontSize: '15px',
    fontWeight: 600,
    lineHeight: 'tight',
    color: KLEUR.inkt,
  },
  topbarTitel: {
    fontSize: '14px',
    fontWeight: 600,
    color: KLEUR.inkt,
  },
  topbarSubtitel: {
    fontSize: '11px',
    fontWeight: 400,
    color: KLEUR.muted,
  },
  menuItem: {
    fontSize: '13px',
    fontWeightInactief: 400,
    fontWeightActief: 500,
    color: KLEUR.inkt,
  },
  secundair: {
    fontSize: '12px',
    fontWeight: 400,
    color: KLEUR.secundair,
  },
  badge: {
    fontSize: '11px',
    fontWeight: 500,
    color: KLEUR.inkt,
  },
  sidebarGroupHeader: {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: KLEUR.muted,
  },
  tabelKop: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: KLEUR.muted,
  },
  kpiCijfers: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '1.2',
    color: KLEUR.inkt,
  },
} as const;

// ============================================================================
// 3. MATEN — componenten
// ============================================================================
export const MAAT = {
  // Knoppen
  knopHoogte: 36,
  knopHoogteCompact: 30,
  knopRadius: 8,
  knopPaddingX: 16,
  knopPaddingY: 8,
  knopIconMaat: 14,
  knopGap: 6,

  // Invoervelden
  invoerHoogte: 36,
  invoerRadius: 8,
  invoerPadding: 12,
  invoerFontSize: '13px',

  // Kaarten
  kaartRadius: 12,
  kaartPadding: 20,
  kaartRand: `1px solid ${KLEUR.rand}`,

  // Chips/Pills
  chipRadius: 20,
  chipFontSize: '11px',
  chipPadding: '4px 12px',

  // Sidebar
  sidebarBreedte: 220,
  sidebarBreedteIngeklapt: 56,
  sidebarMenuItemPaddingY: 7,
  sidebarMenuItemPaddingX: 12,  // Strakker links uitgelijnd (Planboard-style)
  sidebarMenuItemGap: 12,
  sidebarIconMaat: 16,
  sidebarLogoPadding: '20px 16px 16px 16px',  // Minder links padding
  sidebarLogoMinHoogte: 64,
  sidebarNavPaddingX: 8,  // Minimale padding linkerkant nav container

  /**
   * Sectiekoppen in de navigatie (COMMUNICATIE, MEDEWERKERS, BEDRIJVEN, …).
   *
   * Eén paar waarden voor ALLE koppen. Ze stonden eerst los in de JSX en waren
   * daar uit elkaar gelopen: 24px boven de meeste koppen, 4px boven
   * MEDEWERKERS (restant van toen dat de eerste groep was) en 16px boven
   * SYSTEEM. Gevolg: hoeveel lucht er boven een kop stond hing af van welke
   * groep er toevallig boven hem lag. Vandaar hier, en niet daar.
   */
  sidebarGroepMarginTop: 24,
  sidebarGroepMarginBottom: 12,
  /**
   * Alleen de bovenste kop in de navigatie. Die staat direct onder het
   * logoblok, dat via sidebarLogoPadding zelf al 16px onderruimte meebrengt;
   * daar telt de volle 24px dubbel en valt er een gat onder "Dashboard".
   * 16 + 8 komt optisch uit op dezelfde afstand als tussen twee groepen.
   */
  sidebarGroepMarginTopEerste: 8,

  // Topbar
  topbarHoogte: 56,
  topbarPaddingX: 28,
  topbarPaddingY: 16,
  topbarIconMaat: 20,

  // Iconen (globaal)
  iconMaatKnop: 14,
  iconMaatMenu: 16,
  iconMaatRij: 12,
  iconStrokeWidth: 2,

  // Scrollbar
  scrollbarBreedte: 5,
  scrollbarThumb: '#E0E0E0',

  // Logo
  logoRechteMVerhoudingDashboard: 3.85,
  logoHoogteDisplay: 28,
  logoBreedteDisplay: 108,
} as const;

// ============================================================================
// 4. KNOPPEN — verplichte varianten
// ============================================================================
export const KNOP = {
  primair: {
    bg: KLEUR.primair,
    bgHover: KLEUR.primairHover,
    text: '#FFFFFF',
    hoogte: MAAT.knopHoogte,
    radius: MAAT.knopRadius,
    fontSize: '13px',
    fontWeight: 600,
  },
  secundair: {
    bg: KLEUR.kaart,
    bgHover: KLEUR.vlak,
    border: KLEUR.rand,
    text: KLEUR.donkergrijs,
    hoogte: MAAT.knopHoogte,
    radius: MAAT.knopRadius,
    fontSize: '13px',
    fontWeight: 600,
  },
  gevaar: {
    bg: KLEUR.kaart,
    bgHover: KLEUR.foutVlak,
    border: KLEUR.foutRand,
    text: KLEUR.fout,
    hoogte: MAAT.knopHoogte,
    radius: MAAT.knopRadius,
    fontSize: '13px',
    fontWeight: 600,
  },
  compact: {
    hoogte: MAAT.knopHoogteCompact,
  },
} as const;

// ============================================================================
// 5. INVOERVELDEN
// ============================================================================
export const INVOER = {
  hoogte: MAAT.invoerHoogte,
  radius: MAAT.invoerRadius,
  padding: MAAT.invoerPadding,
  fontSize: MAAT.invoerFontSize,
  border: `1px solid ${KLEUR.rand}`,
  borderHover: `1px solid ${KLEUR.donkergrijs}`,
  borderFocus: `2px solid ${KLEUR.primair}`,
  bg: KLEUR.kaart,
  text: KLEUR.inkt,
  placeholder: KLEUR.muted,
} as const;

// ============================================================================
// 6. KAARTEN
// ============================================================================
export const KAART = {
  radius: MAAT.kaartRadius,
  padding: MAAT.kaartPadding,
  border: MAAT.kaartRand,
  bg: KLEUR.kaart,
  shadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
} as const;

// ============================================================================
// 7. TABELLEN
// ============================================================================
export const TABELKOP = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: KLEUR.muted,
  bg: KLEUR.vlak,
  padding: '12px 16px',
} as const;

export const TABEL = {
  kopstijl: TABELKOP,
  rijFontSize: '13px',
  rijPadding: '12px 16px',
  rijHover: KLEUR.primairVlak,
  zebraRij: KLEUR.zebra,
  divider: KLEUR.vlak,
  border: KLEUR.rand,
} as const;

// ============================================================================
// 8. STATUS-WEERGAVE (verplicht 4-paar systeem)
// ============================================================================
export const STATUS = {
  succes: {
    text: KLEUR.succes,
    bg: KLEUR.succesVlak,
  },
  fout: {
    text: KLEUR.fout,
    bg: KLEUR.foutVlak,
    border: KLEUR.foutRand,
  },
  waarschuwing: {
    text: KLEUR.waarschuwing,
    bg: KLEUR.waarschuwingVlak,
    border: KLEUR.waarschuwingRand,
  },
  info: {
    text: KLEUR.info,
    bg: KLEUR.infoVlak,
  },
} as const;

// ============================================================================
// 9. LAYOUT CONSTANTS
// ============================================================================
export const LAYOUT = {
  // Sidebar
  sidebarBreedte: MAAT.sidebarBreedte,
  sidebarBreedteIngeklapt: MAAT.sidebarBreedteIngeklapt,

  // Topbar
  topbarHoogte: MAAT.topbarHoogte,

  // Responsive breakpoints (Tailwind-standaard)
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// ============================================================================
// 10. SHADOW & DEPTH
// ============================================================================
export const SHADOW = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
} as const;

// ============================================================================
// 11. TRANSITIES & ANIMATIES
// ============================================================================
export const TRANSITIE = {
  snel: '150ms ease-in-out',
  normaal: '300ms ease-in-out',
  traag: '500ms ease-in-out',
} as const;

// ============================================================================
// EXPORT: Alle constants in één object (optioneel)
// ============================================================================
export const HUISSTIJL = {
  KLEUR,
  TYPOGRAFIE,
  MAAT,
  KNOP,
  INVOER,
  KAART,
  TABEL,
  STATUS,
  LAYOUT,
  SHADOW,
  TRANSITIE,
} as const;

export default HUISSTIJL;
