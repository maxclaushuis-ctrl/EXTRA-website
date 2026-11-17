/**
 * De <lastmod>-regel voor een vaste pagina in sitemap.xml.
 *
 * De datum komt uit shared/paginaDatums.ts: de dag waarop de inhoud van de
 * pagina voor het laatst is gewijzigd. Is die niet bekend, dan komt er geen
 * regel. Dat is beter dan de datum van vandaag: zoekmachines negeren lastmod
 * zodra die op alle pagina's elke dag verandert.
 */
export function lastmodRegel(pad: string, datums: Record<string, string>): string {
  const d = datums[pad];
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `    <lastmod>${d}</lastmod>\n` : "";
}
