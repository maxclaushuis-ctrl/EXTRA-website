/**
 * Koppeling met Google Search Console (alleen lezen).
 *
 * Gebruikt hetzelfde service-account als GA4 (GA_SERVICE_ACCOUNT_JSON). Dat
 * account moet in Search Console als gebruiker met beperkte rechten zijn
 * toegevoegd, en de Search Console API moet aanstaan in het Google Cloud-project
 * van dat account. De property zoeken we zelf op (domein of URL-prefix).
 * De pure logica staat in shared/gsc.ts.
 */
import { JWT } from "google-auth-library";
import {
  datumBereik, kiesSite, padVan, kansen, cijfers, ENGELS_REGEX,
  type GscPeriode, type GscRij, type GscSite,
} from "@shared/gsc";

const API = "https://searchconsole.googleapis.com/webmasters/v3";
let _client: JWT | null = null;

export function isGscConfigured(): boolean {
  return !!process.env.GA_SERVICE_ACCOUNT_JSON;
}

function client(): JWT {
  if (_client) return _client;
  const json = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GA_SERVICE_ACCOUNT_JSON niet ingesteld");
  let creds: any;
  try { creds = JSON.parse(json); } catch { throw new Error("GA_SERVICE_ACCOUNT_JSON is geen geldige JSON"); }
  _client = new JWT({
    email: creds.client_email,
    key: String(creds.private_key || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return _client;
}

/** Leesbare melding uit een fout van Google. */
function melding(e: any): string {
  const g = e?.response?.data?.error;
  const tekst = g?.message || e?.message || String(e);
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(tekst)) return "De Search Console API staat nog niet aan in het Google Cloud-project van het service-account.";
  return tekst;
}

async function api<T = any>(pad: string, body?: unknown): Promise<T> {
  try {
    const res = await client().request<T>({ url: `${API}/${pad}`, method: body ? "POST" : "GET", data: body });
    return res.data;
  } catch (e) {
    throw new Error(melding(e));
  }
}

let siteCache: { t: number; site: string } | null = null;

/** De property van doehetextra.nl die het service-account mag lezen (een uur onthouden). */
export async function gscSite(): Promise<string> {
  if (siteCache && Date.now() - siteCache.t < 60 * 60_000) return siteCache.site;
  const data = await api<{ siteEntry?: GscSite[] }>("sites");
  const site = kiesSite(data?.siteEntry);
  if (!site) throw new Error("Het service-account heeft nog geen toegang tot doehetextra.nl in Search Console. Voeg het toe via Instellingen, Gebruikers en rechten.");
  siteCache = { t: Date.now(), site };
  return site;
}

async function query(site: string, start: string, eind: string, dimensions: string[], rowLimit: number, alleenEngels: boolean): Promise<GscRij[]> {
  const body: any = { startDate: start, endDate: eind, dimensions, rowLimit };
  if (alleenEngels) body.dimensionFilterGroups = [{ filters: [{ dimension: "page", operator: "includingRegex", expression: ENGELS_REGEX }] }];
  const data = await api<{ rows?: GscRij[] }>(`sites/${encodeURIComponent(site)}/searchAnalytics/query`, body);
  return data?.rows ?? [];
}

const cache = new Map<string, { t: number; body: any }>();

/** Alle cijfers voor het tabblad SEO & Content in één keer (een uur onthouden). */
export async function gscOverzicht(periode: GscPeriode, alleenEngels: boolean) {
  const sleutel = `${periode}|${alleenEngels ? "en" : "alles"}`;
  const al = cache.get(sleutel);
  if (al && Date.now() - al.t < 60 * 60_000) return al.body;

  const site = await gscSite();
  const b = datumBereik(periode);
  const [totaal, vorige, perDag, zoekwoorden, paginas, combinaties] = await Promise.all([
    query(site, b.start, b.eind, [], 1, alleenEngels),
    b.vorigeStart && b.vorigeEind ? query(site, b.vorigeStart, b.vorigeEind, [], 1, alleenEngels) : Promise.resolve(null),
    query(site, b.start, b.eind, ["date"], 500, alleenEngels),
    query(site, b.start, b.eind, ["query"], 5000, alleenEngels),
    query(site, b.start, b.eind, ["page"], 2000, alleenEngels),
    query(site, b.start, b.eind, ["query", "page"], 5000, alleenEngels),
  ]);

  const body = {
    site,
    periode,
    alleenEngels,
    start: b.start,
    eind: b.eind,
    totaal: cijfers(totaal[0]),
    vorige: vorige ? cijfers(vorige[0]) : null,
    perDag: perDag.map((r) => ({ datum: r.keys?.[0] ?? "", ...cijfers(r) })).sort((x, y) => x.datum.localeCompare(y.datum)),
    zoekwoorden: { aantal: zoekwoorden.length, top: zoekwoorden.slice(0, 10).map((r) => ({ zoekwoord: r.keys?.[0] ?? "", ...cijfers(r) })) },
    paginas: { aantal: paginas.length, top: paginas.slice(0, 10).map((r) => ({ pad: padVan(r.keys?.[0] ?? ""), ...cijfers(r) })) },
    kansen: kansen(combinaties),
  };
  cache.set(sleutel, { t: Date.now(), body });
  return body;
}
