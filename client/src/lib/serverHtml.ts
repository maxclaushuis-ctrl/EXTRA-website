/**
 * De server zet bij elke openbare pagina de geprerenderde inhoud in #root
 * (server/seo.ts). Zodra React start, vervangt createRoot die inhoud. Daarna
 * laadt de pagina zelf nog (lazy), en tot dat klaar is toonde de app het
 * laadscherm "Even laden..." over het hele scherm.
 *
 * Gevolg op elke eerste paginaweergave: inhoud, dan een donker laadscherm,
 * dan weer inhoud. Dat kost laadsnelheid (LCP), laat de pagina verspringen
 * (CLS) en is voor een bezoeker een flits.
 *
 * Daarom bewaren we de inhoud van de server vóór de eerste render. Zolang de
 * eerste pagina nog laadt, toont de Suspense-fallback precies die inhoud.
 * Alleen als het een pagina in design 3.0 is (er staat een .d3-element in):
 * die is met de stijl van design 3.0 opgemaakt, die nu meteen meelaadt
 * (main.tsx). Bij elke volgende navigatie binnen de app geldt het gewone
 * laadscherm weer.
 */

/** Puur, getest in shared/serverHtml.test.ts: alleen op het pad waarop de bezoeker binnenkwam. */
export function kiesServerHtml(beginPad: string, pad: string, html: string): string {
  if (!html) return "";
  return beginPad === pad ? html : "";
}

const BEGIN_PAD = typeof window !== "undefined" ? window.location.pathname : "";

const SERVER_HTML: string = (() => {
  if (typeof document === "undefined") return "";
  const d3 = document.getElementById("root")?.querySelector(".d3");
  return d3 ? d3.outerHTML : "";
})();

/** De inhoud van de server voor de pagina waarop de bezoeker binnenkwam, anders "". */
export function serverHtmlVoorDezePagina(): string {
  return kiesServerHtml(BEGIN_PAD, typeof window !== "undefined" ? window.location.pathname : "", SERVER_HTML);
}
