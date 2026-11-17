/**
 * Tekst voor /llms.txt en /llms-full.txt.
 *
 * fragmentNaarTekst haalt de leesbare inhoud uit een geprerenderd fragment.
 * Menu, kruimelpad, voettekst, formulieren en iconen gaan eruit: die staan op
 * elke pagina en zeggen niets over de pagina zelf.
 */
export function fragmentNaarTekst(html: string): string {
  // Staat er een <main>, dan is dat de inhoud; anders het hele fragment.
  const main = /<main\b[^>]*>([\s\S]*)<\/main>/i.exec(html);
  let h = main ? main[1] : html;
  for (const tag of ["script", "style", "svg", "header", "footer", "nav", "form", "noscript"]) {
    h = h.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }
  return h
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * De Engelse pagina's voor llms.txt: eerst de vaste volgorde, daarna alles wat
 * er sindsdien onder /en bij is gekomen. Beleidspagina's horen er niet in.
 */
export function engelsePaden(vooraan: string[], indexeerbaar: string[]): string[] {
  const beleid = /(privacy|terms|cookie)/;
  const rest = indexeerbaar.filter((p) => (p === "/en" || p.startsWith("/en/")) && !beleid.test(p) && !vooraan.includes(p));
  return [...vooraan.filter((p) => indexeerbaar.includes(p)), ...rest];
}
