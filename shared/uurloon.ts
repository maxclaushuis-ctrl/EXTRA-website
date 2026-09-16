/**
 * UURLOON UIT EEN INVOERVELD LEZEN
 *
 * Het veld "Minimumloon (p/u)" in de vacaturewizard is vrije tekst. De
 * placeholder vraagt om "14.00", maar wie Nederlands typt schrijft "18,00" —
 * en dat ging mis op een plek die niemand ziet.
 *
 * De vacaturepagina zelf gebruikt parseFloat("18,00") en komt op 18 uit: die
 * stopt bij de komma. De JobPosting-structured-data gebruikte Number("18,00")
 * en komt op NaN, wat JSON.stringify naar null schrijft. Het salaris stond dus
 * goed op de pagina en kapot in de data die Google Jobs leest.
 *
 * Deze functie leest beide notaties, plus het euroteken en spaties die mensen
 * er nu eenmaal bij typen. Levert null op zodra er geen bruikbaar bedrag in
 * staat, zodat de aanroeper het veld kan weglaten in plaats van een
 * placeholder te publiceren — een harde regel uit de websiteskill.
 */

/**
 * "18,00" → 18 · "€ 18.50" → 18.5 · "" → null · "op aanvraag" → null
 *
 * Alleen positieve, eindige bedragen komen erdoor. Een duizendtalscheiding
 * ondersteunen we bewust niet: een uurloon van duizend euro bestaat niet, en
 * raden wat "1.250" betekent levert meer fouten op dan het oplost.
 */
export function leesUurloon(waarde: string | number | null | undefined): number | null {
  if (waarde === null || waarde === undefined) return null;

  if (typeof waarde === "number") {
    return Number.isFinite(waarde) && waarde > 0 ? waarde : null;
  }

  const opgeschoond = waarde
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(opgeschoond)) return null;

  const bedrag = Number(opgeschoond);
  return Number.isFinite(bedrag) && bedrag > 0 ? bedrag : null;
}
