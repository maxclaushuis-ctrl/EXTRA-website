/**
 * Centrale datumnotatie voor het hele dashboard — Europees/Nederlands:
 * eerst de dag, dan de maand, dan het jaar.
 *
 * Gebruik:
 *   formatDatum('2008-04-10')        → '10-04-2008'
 *   formatDatumLang('2026-07-23')    → '23 juli 2026'
 *   formatDatumKort('2026-07-23')    → '23 jul'
 *   formatDatumTijd(isoTimestamp)    → '23-07-2026 · 15:37'
 */

function naarDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  // Kale datum ('YYYY-MM-DD') als lokale datum parsen (anders UTC-verschuiving).
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? d + 'T00:00' : d);
  return isNaN(date.getTime()) ? null : date;
}

/** '10-04-2008' — standaardnotatie voor tabellen en detailvelden. */
export function formatDatum(d: string | Date | null | undefined, leeg = '—'): string {
  const date = naarDate(d);
  if (!date) return leeg;
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** '23 juli 2026' — voor lopende tekst en nadruk. */
export function formatDatumLang(d: string | Date | null | undefined, leeg = '—'): string {
  const date = naarDate(d);
  if (!date) return leeg;
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** '23 jul' — compact, voor kaarten en badges. */
export function formatDatumKort(d: string | Date | null | undefined, leeg = '—'): string {
  const date = naarDate(d);
  if (!date) return leeg;
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

/** '23-07-2026 · 15:37' — voor tijdstempels. */
export function formatDatumTijd(d: string | Date | null | undefined, leeg = '—'): string {
  const date = naarDate(d);
  if (!date) return leeg;
  return `${formatDatum(date)} · ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
}
