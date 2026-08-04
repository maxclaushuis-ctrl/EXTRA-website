/**
 * Gedeelde stijlconstanten + helpers voor de WhatsApp-inbox (Fase 2).
 * Kleuren en verhoudingen komen 1-op-1 uit mockups/extra-whatsapp-mockup.html.
 *
 * TYPOGRAFIE NIET: die komt sinds deze wijziging uit client/src/lib/huisstijl.ts,
 * de Planbord-huisstijl die voor het hele dashboard geldt. Zie WA_FONT en
 * WA_TEKST hieronder.
 */
import { TYPOGRAFIE } from '../../../lib/huisstijl';

export const WA = {
  header: '#008069',
  headerDark: '#005c4b',
  panel: '#f0f2f5',
  bg: '#efeae2',
  bubbleOut: '#d9fdd3',
  bubbleIn: '#ffffff',
  border: '#d1d7db',
  text: '#111b21',
  textSub: '#667781',
  unread: '#25d366',
  purple: '#7c3aed',
  purpleDark: '#6025c9',
  check: '#53bdeb',
} as const;

/**
 * Het lettertype van de module. Hier stond '"Segoe UI",Helvetica,Arial,sans-serif'
 * — dat was de bug: Segoe UI bestaat niet op macOS, dus viel de stack door naar
 * Helvetica terwijl de rest van het dashboard Inter rendert. Twee letters op één
 * scherm. Nu exact dezelfde stack als het Planbord.
 */
export const WA_FONT = TYPOGRAFIE.primair;

/** '13px' → 13. De huisstijl bewaart maten als CSS-string, deze module rekent in getallen. */
const pt = (v: string) => parseFloat(v);

/**
 * De tekstschaal van de module — 1-op-1 de niveaus uit de Planbord-huisstijl.
 * Vóór deze wijziging stonden er ~70 losse fontSize-waarden in de vier
 * componenten, van 9,5 tot 28. Alles is naar het dichtstbijzijnde niveau
 * gevouwen; nieuwe UI hoort hier ook uit te komen, nooit uit een los getal.
 *
 * Vouwregel die daarbij gebruikt is:
 *   9,5 / 10 / 10,5  → mini
 *   11 / 11,5        → badge
 *   12 / 12,5        → secundair
 *   13 / 14 / 14,5   → body
 *   15               → h3
 *   17 / 18          → h2
 */
export const WA_TEKST = {
  h2:        pt(TYPOGRAFIE.h2.fontSize),                 // 18 — nauwelijks in gebruik, staat er voor volledigheid
  h3:        pt(TYPOGRAFIE.h3.fontSize),                 // 15 — naam boven het gesprek, naam in het profielpaneel
  body:      pt(TYPOGRAFIE.body.fontSize),               // 13 — berichtbubbels, invoervelden, gewone regels
  secundair: pt(TYPOGRAFIE.secundair.fontSize),          // 12 — subregels, meta-informatie
  badge:     pt(TYPOGRAFIE.badge.fontSize),              // 11 — chips, pills, sectiekoppen
  mini:      pt(TYPOGRAFIE.sidebarGroupHeader.fontSize), // 10 — tellers, tijdstempels in bubbels
} as const;

/** Gewichten, ook uit de huisstijl, zodat 700 niet ergens 800 wordt. */
export const WA_GEWICHT = TYPOGRAFIE.gewichten;

/**
 * Geen tekst maar tekening: glyphs die als plaatje functioneren (de
 * emoji-knoppen in de composer, het snooze-klokje). Die horen niet op een
 * tekstniveau — een emoji van 13px is onbruikbaar klein — maar de getallen
 * staan hier zodat ook zij op één plek liggen in plaats van los in de JSX.
 *
 * Er stond hier ook avatarGroot: 28, voor de initialen in de 80px-cirkel van
 * het profielpaneel. Die cirkel bestaat niet meer, dus het getal is weg: een
 * maat die niets meer opmeet is geen maat.
 */
export const WA_GLYPH = {
  icoon: 18,       // emoji-knoppen in de composer, snooze-klokje
  icoonKlein: 16,  // verzendknop, profielpaneel-toggle
} as const;

/**
 * Maten voor bijlagen in de berichtbubbel. Om dezelfde reden hier en niet in
 * de JSX als WA_GLYPH hierboven: het zijn tekeningen, geen tekst, en ze horen
 * op één plek te liggen.
 *
 * De bubbel is maximaal 62% van de kolom; een voorbeeldweergave die daar
 * binnen past leest als WhatsApp zelf, waar de foto de bubbel vult en het
 * bijschrift eronder staat.
 */
export const WA_MEDIA = {
  /** Maximale hoogte van de voorbeeldweergave in de bubbel. */
  voorbeeldMaxHoogte: 280,
  /** Hoekafronding van de voorbeeldweergave; volgt die van de bubbel. */
  radius: 6,
  /** Ruimte tussen de foto en het bijschrift eronder. */
  bijschriftMarge: 6,
  /** Vaste hoogte van de audiospeler, zodat bubbels niet gaan verspringen. */
  audioHoogte: 40,
} as const;

// avatarColor() en initials() stonden hier. Beide zijn weg samen met de
// avatar-cirkels in ConversationList, ChatView en ProfilePanel; er was daarna
// geen enkele aanroep meer over in de module. Bewust verwijderd en niet
// "voor het geval dat" laten staan: een geëxporteerde helper die nergens
// gebruikt wordt, wordt vanzelf weer ergens ingeplugd.

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const MAANDEN_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const DAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Relatieve tijd voor de gesprekkenlijst: vandaag HH:MM, "gisteren", weekdag, of "12 mei". */
export function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (isSameDay(d, now)) return formatTime(iso);
  const gisteren = new Date(now);
  gisteren.setDate(now.getDate() - 1);
  if (isSameDay(d, gisteren)) return 'gisteren';
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return DAGEN_KORT[d.getDay()];
  return `${d.getDate()} ${MAANDEN_KORT[d.getMonth()]}`;
}

/** Dag-scheider label: "Vandaag" / "Gisteren" / "12 mei 2026". */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (isSameDay(d, now)) return 'Vandaag';
  const gisteren = new Date(now);
  gisteren.setDate(now.getDate() - 1);
  if (isSameDay(d, gisteren)) return 'Gisteren';
  return `${d.getDate()} ${MAANDEN_KORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "sinds"-datum in profielpaneel: "28 jul 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MAANDEN_KORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Resterende snooze-tijd: "nog 2 u 15 m" / "nog 3 d". */
export function snoozeRemaining(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (isNaN(ms) || ms <= 0) return null;
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `nog ${min} m`;
  const uur = Math.floor(min / 60);
  if (uur < 24) return `nog ${uur} u ${min % 60} m`;
  const dag = Math.floor(uur / 24);
  return `nog ${dag} d ${uur % 24} u`;
}

/** Telefoonnummer voor weergave: "31612345678" → "+31 6 12 34 56 78". */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('316') && phone.length === 11) {
    const rest = phone.slice(3);
    return `+31 6 ${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 6)} ${rest.slice(6, 8)}`;
  }
  return `+${phone}`;
}

/** Voornaam uit een volledige naam of "daar" als fallback (voor snelle antwoorden). */
export function voornaamVan(name: string | null | undefined): string {
  const first = (name || '').trim().split(/\s+/)[0];
  return first || 'daar';
}
