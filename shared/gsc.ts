/**
 * Google Search Console: de pure logica achter de cijfers op het tabblad
 * SEO & Content (Website Statistieken). De koppeling zelf staat in
 * server/gsc.ts en gebruikt hetzelfde service-account als GA4.
 *
 * Bewust puur (geen server-imports), zodat `npm run gsc:test` het onder kale
 * tsx kan draaien.
 */

export type GscPeriode = "7" | "28" | "90" | "alles";
export const GSC_PERIODES: { id: GscPeriode; label: string }[] = [
  { id: "7", label: "7 dagen" },
  { id: "28", label: "28 dagen" },
  { id: "90", label: "3 maanden" },
  { id: "alles", label: "Alles" },
];

export function leesPeriode(x: unknown): GscPeriode {
  return x === "7" || x === "28" || x === "90" || x === "alles" ? x : "28";
}

/** Search Console loopt twee tot drie dagen achter; de laatste twee dagen zijn nog niet compleet. */
export const GSC_ACHTERSTAND_DAGEN = 2;
/** Search Console bewaart zestien maanden. */
export const GSC_MAX_DAGEN = 486;

const dag = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

export interface GscBereik { start: string; eind: string; vorigeStart: string | null; vorigeEind: string | null }

/** Datumbereik voor een periode, plus dezelfde periode ervoor om mee te vergelijken. */
export function datumBereik(periode: GscPeriode, nu: Date = new Date()): GscBereik {
  const eind = new Date(Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth(), nu.getUTCDate()) - GSC_ACHTERSTAND_DAGEN * dag);
  const dagen = periode === "alles" ? GSC_MAX_DAGEN : Number(periode);
  const start = new Date(eind.getTime() - (dagen - 1) * dag);
  if (periode === "alles") return { start: iso(start), eind: iso(eind), vorigeStart: null, vorigeEind: null };
  const vorigeEind = new Date(start.getTime() - dag);
  const vorigeStart = new Date(vorigeEind.getTime() - (dagen - 1) * dag);
  return { start: iso(start), eind: iso(eind), vorigeStart: iso(vorigeStart), vorigeEind: iso(vorigeEind) };
}

export interface GscSite { siteUrl: string; permissionLevel?: string }

/**
 * De property van doehetextra.nl uit de lijst die het service-account mag zien.
 * Voorkeur: domein-property, dan https met www, dan de rest. Niet-geverifieerde
 * toegang telt niet mee.
 */
export function kiesSite(sites: GscSite[] | null | undefined): string | null {
  const bruikbaar = (sites ?? []).filter((s) => s?.siteUrl && s.permissionLevel !== "siteUnverifiedUser" && /(^|[.:/])doehetextra\.nl/i.test(s.siteUrl));
  const voorkeur = ["sc-domain:doehetextra.nl", "https://www.doehetextra.nl/", "https://doehetextra.nl/", "http://www.doehetextra.nl/", "http://doehetextra.nl/"];
  for (const v of voorkeur) {
    const s = bruikbaar.find((x) => x.siteUrl.toLowerCase() === v);
    if (s) return s.siteUrl;
  }
  return bruikbaar[0]?.siteUrl ?? null;
}

/** Filter voor de Engelse pagina's (alles onder /en), als RE2-expressie voor de API. */
export const ENGELS_REGEX = "^https?://[^/]+/en(/|\\?|#|$)";

/** Het pad van een volledige URL, zoals in de rest van het dashboard. */
export function padVan(url: string): string {
  const p = String(url || "").replace(/^https?:\/\/[^/]+/i, "");
  return p || "/";
}

/** Procentuele verandering, of null als er niets te vergelijken valt. */
export function verschil(nu: number, vorige: number | null | undefined): number | null {
  if (vorige == null || !Number.isFinite(vorige) || vorige <= 0) return null;
  return ((nu - vorige) / vorige) * 100;
}

export type PositieKlasse = "top" | "pagina1" | "ver";
/** Groen: top 5. Oker: pagina 1 of 2. Grijs: verder weg. */
export function positieKlasse(pos: number): PositieKlasse {
  if (pos < 6) return "top";
  if (pos <= 20) return "pagina1";
  return "ver";
}

export interface GscRij { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }
export interface GscCijfers { klikken: number; vertoningen: number; ctr: number; positie: number }

export function cijfers(r: GscRij | null | undefined): GscCijfers {
  return {
    klikken: Math.round(r?.clicks ?? 0),
    vertoningen: Math.round(r?.impressions ?? 0),
    ctr: r?.ctr ?? 0,
    positie: r?.position ?? 0,
  };
}

export interface GscKans { zoekwoord: string; pad: string; vertoningen: number; klikken: number; positie: number }

/**
 * Kansen: zoekwoorden met veel vertoningen die net niet bovenaan staan
 * (positie 8 tot en met 20). Per zoekwoord alleen de pagina met de meeste
 * vertoningen, gesorteerd op vertoningen.
 */
export function kansen(rijen: GscRij[] | null | undefined, max = 5, minVertoningen = 50): GscKans[] {
  const perZoekwoord = new Map<string, GscKans>();
  for (const r of rijen ?? []) {
    const [zoekwoord, pagina] = r.keys ?? [];
    const positie = r.position ?? 0;
    const vertoningen = Math.round(r.impressions ?? 0);
    if (!zoekwoord || !pagina || positie < 8 || positie > 20 || vertoningen < minVertoningen) continue;
    const k: GscKans = { zoekwoord, pad: padVan(pagina), vertoningen, klikken: Math.round(r.clicks ?? 0), positie };
    const al = perZoekwoord.get(zoekwoord);
    if (!al || k.vertoningen > al.vertoningen) perZoekwoord.set(zoekwoord, k);
  }
  return Array.from(perZoekwoord.values()).sort((a, b) => b.vertoningen - a.vertoningen).slice(0, max);
}
