/**
 * Gedeelde stijlconstanten + helpers voor de WhatsApp-inbox (Fase 2).
 * Kleuren en verhoudingen komen 1-op-1 uit mockups/extra-whatsapp-mockup.html.
 */

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

export const WA_FONT = '"Segoe UI",Helvetica,Arial,sans-serif';

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
