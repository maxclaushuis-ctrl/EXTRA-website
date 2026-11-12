/**
 * Controle van een vacature uit content/vacatures/<slug>.json, vóór
 * scripts/publish-vacature.ts hem in de database zet. Puur, zodat
 * `npm run vacatureinvoer:test` zonder database draait.
 *
 * De regels komen uit de skill extra-website (hoofdstuk 6) en docs/VACATURE-FORMAT.md:
 * title ≤ 60, meta description 110 tot 160, nooit een loon van €0, slug in kleine
 * letters met koppeltekens, en geen gedachtestreepje of liggend streepje als leesteken.
 */
import { leesUurloon } from "./uurloon";

export const DIENSTVERBANDEN = ["Oproep", "Parttime", "Fulltime", "Bijbaan"] as const;

export interface VacatureInvoer {
  title: string; slug: string; internalTitle?: string | null;
  functionType: string; serviceType: string; location: string; region: string; workplace: string;
  client?: string | null; salaryMin: string;
  focusKeyword: string; metaTitle: string; metaDescription: string;
  ogTitle?: string | null; ogDescription?: string | null; canonicalUrl: string;
  shortDescription: string; introductionText: string; aboutRole?: string | null; workEnvironment?: string | null;
  responsibilities: string[]; requirements: string[]; offer: string[];
  faqItems?: string | null; ctaText?: string | null;
  featuredImage?: string | null; featuredImageAlt?: string | null;
}

const VERPLICHT: (keyof VacatureInvoer)[] = [
  "title", "slug", "functionType", "serviceType", "location", "region", "workplace", "salaryMin",
  "focusKeyword", "metaTitle", "metaDescription", "canonicalUrl", "shortDescription", "introductionText",
];

const STREEPJE = /[–—]/;

/** Alle tekst van een vacature achter elkaar, om op streepjes te controleren. */
function alleTekst(d: Partial<VacatureInvoer>): string {
  return Object.values(d).map((v) => (Array.isArray(v) ? v.join("\n") : v == null ? "" : String(v))).join("\n");
}

export function controleerVacature(d: Partial<VacatureInvoer>, bestandsnaam: string): { fouten: string[]; waarschuwingen: string[] } {
  const fouten: string[] = [];
  const waarschuwingen: string[] = [];
  for (const v of VERPLICHT) if (!d[v] || String(d[v]).trim() === "") fouten.push(`veld "${v}" ontbreekt`);

  if (d.slug && d.slug !== bestandsnaam) fouten.push(`slug "${d.slug}" wijkt af van de bestandsnaam "${bestandsnaam}"`);
  if (d.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) fouten.push("slug mag alleen kleine letters, cijfers en koppeltekens bevatten");
  if (d.slug && d.canonicalUrl && d.canonicalUrl !== `https://www.doehetextra.nl/vacatures/${d.slug}`) {
    fouten.push("canonicalUrl hoort https://www.doehetextra.nl/vacatures/<slug> te zijn");
  }
  if (d.serviceType && !(DIENSTVERBANDEN as readonly string[]).includes(d.serviceType)) {
    fouten.push(`dienstverband "${d.serviceType}" bestaat niet; kies uit ${DIENSTVERBANDEN.join(", ")}`);
  }
  const loon = leesUurloon(d.salaryMin ?? null);
  if (loon === null || loon <= 0) fouten.push("salaryMin is geen bruikbaar uurloon (nooit €0 of een placeholder)");

  if (d.metaTitle && d.metaTitle.length > 60) fouten.push(`metaTitle is ${d.metaTitle.length} tekens (maximaal 60)`);
  if (d.metaDescription && (d.metaDescription.length < 110 || d.metaDescription.length > 160)) {
    fouten.push(`metaDescription is ${d.metaDescription.length} tekens (110 tot 160)`);
  }
  if (d.title && d.title.length > 70) waarschuwingen.push(`title is ${d.title.length} tekens; korter leest beter in Google Jobs`);

  const kw = (d.focusKeyword || "").toLowerCase();
  if (kw) {
    const woorden = kw.split(/\s+/).filter((w) => w.length > 2);
    const bevat = (t?: string | null) => woorden.every((w) => (t || "").toLowerCase().includes(w));
    if (!bevat(d.metaTitle)) waarschuwingen.push("het focus-zoekwoord staat niet volledig in de metaTitle");
    if (!bevat(d.introductionText?.split("\n")[0])) waarschuwingen.push("het focus-zoekwoord staat niet volledig in de eerste alinea");
  }

  for (const lijst of ["responsibilities", "requirements", "offer"] as const) {
    const l = d[lijst];
    if (!Array.isArray(l) || l.length === 0 || l.some((x) => typeof x !== "string" || !x.trim())) fouten.push(`${lijst} moet een lijst met tekst zijn`);
  }
  if (d.faqItems) {
    try {
      const f = JSON.parse(d.faqItems);
      if (!Array.isArray(f) || f.some((x: any) => !x?.q || !x?.a)) fouten.push("faqItems moet een lijst met { q, a } zijn");
    } catch {
      fouten.push("faqItems is geen geldige JSON");
    }
  }
  if (STREEPJE.test(alleTekst(d))) fouten.push("er staat een gedachtestreepje of liggend streepje in de tekst");
  return { fouten, waarschuwingen };
}

/** Meta title en description moeten uniek zijn over alle vacatures heen. */
export function dubbeleMeta(lijst: Pick<VacatureInvoer, "slug" | "metaTitle" | "metaDescription">[]): string[] {
  const uit: string[] = [];
  for (const veld of ["metaTitle", "metaDescription"] as const) {
    const gezien = new Map<string, string>();
    for (const v of lijst) {
      const w = (v[veld] || "").trim().toLowerCase();
      if (!w) continue;
      if (gezien.has(w)) uit.push(`${veld} van ${v.slug} is gelijk aan die van ${gezien.get(w)}`);
      else gezien.set(w, v.slug);
    }
  }
  return uit;
}
