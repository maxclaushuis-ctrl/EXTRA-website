/**
 * HOE EEN VACATURE UIT HET CMS OP DE SITE STAAT (design 3.0)
 *
 * De vacatures komen ongewijzigd uit de database (/api/vacatures). Hier staat
 * alleen hoe ze getoond worden: afdeling, branche, korte titel, loon en de
 * opdeling van "Wat wij bieden". Puur, zodat `npm run vacatureweergave:test`
 * het zonder database kan draaien.
 */

export type VacBranche = "hotels" | "events" | "logistiek";

export interface VacatureVelden {
  slug: string;
  title: string;
  functionType?: string | null;
  serviceType?: string | null;
  workplace?: string | null;
  location?: string | null;
  client?: string | null;
  salaryMin?: string | number | null;
}

/** Afdeling zoals in de filter en het chipje: "Housekeeping", "Keuken", ... */
export function afdelingVan(v: Pick<VacatureVelden, "functionType" | "title">): string {
  const f = `${v.functionType || ""} ${v.title || ""}`.toLowerCase();
  const ft = (v.functionType || "").toLowerCase();
  if (/logist|magazijn|orderpick|heftruck|reachtruck|inpak|expeditie/.test(ft)) return "Logistiek";
  if (/housekeep|kamer|room/.test(ft)) return "Housekeeping";
  if (/front ?office|receptie|reception/.test(ft)) return "Front office";
  if (/afwas|steward/.test(ft)) return "Afwas";
  if (/banquet/.test(ft)) return "Banqueting";
  if (/chef|kok|keuken|kitchen/.test(ft)) return "Keuken";
  if (/bediening|bartender|bar\b|f&b|runner|host/.test(ft)) return "F&B";
  // Functietype leeg of onbekend: kijk naar de titel.
  if (/housekeep/.test(f)) return "Housekeeping";
  if (/front ?office|receptie/.test(f)) return "Front office";
  if (/chef|kok\b|keuken/.test(f)) return "Keuken";
  if (/afwas/.test(f)) return "Afwas";
  if (/banquet/.test(f)) return "Banqueting";
  if (/bediening|bartender|barista/.test(f)) return "F&B";
  return v.functionType?.trim() || "Overig";
}

/** Branche van een vacature: logistieke functies, eventlocaties en catering, anders hotels. */
export function brancheVan(v: Pick<VacatureVelden, "functionType" | "title" | "workplace">): VacBranche {
  if (afdelingVan(v) === "Logistiek" || /logist|magazijn|distributie/i.test(v.workplace || "")) return "logistiek";
  if (/event|catering|festival/i.test(v.workplace || "")) return "events";
  return "hotels";
}

export function isBranche(w: unknown): w is VacBranche {
  return w === "hotels" || w === "events" || w === "logistiek";
}

/**
 * Korte titel voor de lijst en de kop. De titels in het CMS zijn lange
 * SEO-titels ("Housekeeping medewerker Amsterdam – Grand Hotel Amrâth gezocht
 * (Fulltime)"). Op de pagina staat de functie, met de opdrachtgever eronder.
 * Regel: het deel vóór het eerste streepje, zonder de plaatsnaam aan het eind
 * en zonder "(Fulltime)" of "(Parttime)". Valt er niets over, dan de hele titel.
 */
export function korteTitel(title: string, location?: string | null): string {
  let t = (title || "").split(/\s+[–—-]\s+/)[0].replace(/\s*\((fulltime|parttime|bijbaan|oproep)\)\s*$/i, "").trim();
  const plaatsen = (location || "")
    .split(/[()/,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const p of plaatsen) {
    const re = new RegExp(`\\s+${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    if (re.test(t)) { t = t.replace(re, "").trim(); break; }
  }
  return t || (title || "").trim();
}

/** Plaatsnaam zonder toevoeging: "Scheveningen (Den Haag)" wordt "Scheveningen". */
export function plaats(location?: string | null): string {
  return (location || "").replace(/\s*\(.*\)\s*$/, "").trim();
}

const euro = (n: number, decimalen: boolean) =>
  "€" + (decimalen ? n.toFixed(2).replace(".", ",") : String(Math.round(n * 100) / 100).replace(".", ","));

/**
 * Loon voor de lijst en de kop. Een bedrag wordt "€18,00", een bereik
 * ("20-24", "20 – 24") wordt "€20 tot €24". Geen loon: null.
 */
export function loonLabel(salaryMin: string | number | null | undefined): string | null {
  if (salaryMin === null || salaryMin === undefined || salaryMin === "") return null;
  const tekst = String(salaryMin).replace(/€/g, "").trim();
  const bereik = tekst.match(/^(\d+(?:[.,]\d+)?)\s*(?:[-–—]|tot)\s*(\d+(?:[.,]\d+)?)$/i);
  if (bereik) {
    const a = parseFloat(bereik[1].replace(",", "."));
    const b = parseFloat(bereik[2].replace(",", "."));
    if (!isNaN(a) && !isNaN(b)) return `${euro(a, false)} tot ${euro(b, false)}`;
  }
  const n = parseFloat(tekst.replace(",", "."));
  return isNaN(n) || n <= 0 ? null : euro(n, true);
}

/**
 * Een punt uit "Wat wij bieden" in een vet deel en een toelichting:
 * "Dagbetaling mogelijk – je krijgt je geld snel na je dienst". Het streepje
 * zelf komt niet op de pagina.
 */
export function splitsAanbod(item: string): [string, string | null] {
  const m = (item || "").match(/^(.+?)\s+[–—-]\s+(.+)$/) || (item || "").match(/^([^:]{3,60}):\s+(.+)$/);
  return m ? [m[1].trim(), m[2].trim()] : [(item || "").trim(), null];
}

/** Lopende tekst uit het CMS naar alinea's (lege regels scheiden alinea's). */
export function alineas(...teksten: (string | null | undefined)[]): string[] {
  return teksten
    .filter((t): t is string => !!t && !!t.trim())
    .flatMap((t) => t.split(/\n\s*\n/))
    .map((t) => t.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

/** Telt per waarde, in volgorde van eerste voorkomen. */
export function tel<T>(lijst: T[], sleutel: (x: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const x of lijst) { const k = sleutel(x); m.set(k, (m.get(k) || 0) + 1); }
  return Array.from(m.entries());
}

/** "Amsterdam en Scheveningen", "Amsterdam, Utrecht en Den Haag". */
export function opsomming(woorden: string[]): string {
  const u = woorden.filter((w, i) => w && woorden.indexOf(w) === i);
  if (u.length <= 1) return u[0] || "";
  return `${u.slice(0, -1).join(", ")} en ${u[u.length - 1]}`;
}
