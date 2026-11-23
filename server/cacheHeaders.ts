/**
 * Cache-Control per bestandsverzoek. PageSpeed (23 november 2026) meldde 497 KiB
 * aan bestanden met een te korte cachetijd: foto's kregen een dag, en de
 * lettertypen van design 3.0 (/d3/*.woff2) kregen niets, dus max-age=0.
 *
 * - /assets/ (bestandsnaam met hash uit de Vite-build): een jaar, onveranderlijk.
 * - Lettertypen: een jaar. Die vervangen we nooit onder dezelfde naam.
 * - Foto's en iconen: dertig dagen. Geen hash in de naam, dus niet onveranderlijk:
 *   vervang je een foto onder dezelfde naam, geef hem dan een nieuwe naam.
 * - Pitchdecks: null, die veranderen vaak onder dezelfde naam.
 * - Al het andere: null, dan beslist express.static of de route zelf.
 */
export function cacheVoor(pad: string): string | null {
  const p = String(pad || "").split("?")[0].toLowerCase();
  // Pitchdecks passen we vaak aan, met dezelfde bestandsnamen: die beslist server/pitchdecks.ts.
  if (p.startsWith("/pitchdeck/")) return null;
  if (/\/assets\/.*\.(js|css|webp|png|jpg|jpeg|svg|woff2?|ttf|ico)$/.test(p)) return "public, max-age=31536000, immutable";
  if (/\.(woff2?|ttf)$/.test(p)) return "public, max-age=31536000";
  if (/\.(webp|png|jpg|jpeg|svg|gif|avif|ico)$/.test(p)) return "public, max-age=2592000, stale-while-revalidate=86400";
  return null;
}
