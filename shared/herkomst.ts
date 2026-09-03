/**
 * HERKOMST VAN EEN BEZOEKER — pure logica
 *
 * Waarom dit bestaat: Analytics ziet wél dat er bezoek is, maar het CRM ziet
 * niet waar een aanmelding of aanvraag vandaan kwam. Zonder die koppeling is
 * niet te zeggen of Google, ChatGPT of Instagram klanten oplevert — alleen dat
 * ze bezoek opleveren.
 *
 * Dit bestand bevat alleen rekenwerk: geen window, geen localStorage, geen
 * cookies lezen. De browserkant staat in client/src/lib/herkomst.ts, de opslag
 * volgt in een aparte stap. Zo is de logica te testen zonder browser.
 *
 * De velden zijn afgesproken met Wrkt: source, medium, landing_page, gclid en
 * ga_client_id.
 */

export interface Herkomst {
  /** Waar het bezoek vandaan kwam: "google", "chatgpt.com", "(direct)". */
  source: string;
  /** Soort verkeer: "organic", "ai-assistant", "social", "referral", "(none)". */
  medium: string;
  /** Pad van de eerste pagina die de bezoeker zag. */
  landing_page: string;
  /** Google Ads-klikidentificatie, als die in de URL stond. */
  gclid: string | null;
  /** Het bezoekers-id van GA4, uit het _ga-cookie. */
  ga_client_id: string | null;
}

export const DIRECT: Pick<Herkomst, "source" | "medium"> = {
  source: "(direct)",
  medium: "(none)",
};

/**
 * AI-assistenten worden vóór de zoekmachines gecontroleerd. gemini.google.com
 * eindigt anders als "google/organic", terwijl het juist het kanaal is dat we
 * apart willen kunnen zien.
 */
const AI_ASSISTENTEN: { patroon: RegExp; source: string }[] = [
  { patroon: /(^|\.)chatgpt\.com$/, source: "chatgpt.com" },
  { patroon: /(^|\.)chat\.openai\.com$/, source: "chatgpt.com" },
  { patroon: /(^|\.)perplexity\.ai$/, source: "perplexity.ai" },
  { patroon: /(^|\.)copilot\.microsoft\.com$/, source: "copilot" },
  { patroon: /(^|\.)gemini\.google\.com$/, source: "gemini" },
  { patroon: /(^|\.)claude\.ai$/, source: "claude.ai" },
];

const ZOEKMACHINES: { patroon: RegExp; source: string }[] = [
  { patroon: /(^|\.)google\.[a-z.]+$/, source: "google" },
  { patroon: /(^|\.)bing\.com$/, source: "bing" },
  { patroon: /(^|\.)duckduckgo\.com$/, source: "duckduckgo" },
  { patroon: /(^|\.)ecosia\.org$/, source: "ecosia" },
  { patroon: /(^|\.)yahoo\.com$/, source: "yahoo" },
];

const SOCIAL: RegExp[] = [
  /(^|\.)instagram\.com$/,
  /(^|\.)facebook\.com$/,
  /(^|\.)linkedin\.com$/,
  /(^|\.)tiktok\.com$/,
  /(^|\.)youtube\.com$/,
  /(^|\.)x\.com$/,
  /(^|\.)twitter\.com$/,
];

/** "https://www.google.nl/zoeken?q=x" → "www.google.nl". Leeg bij onzin. */
export function hostUitUrl(url: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Zonder "www." ervoor, zodat we niet twee keer hoeven te matchen. */
export function zonderWww(host: string): string {
  return host.replace(/^www\./, "");
}

/**
 * Bepaalt source en medium.
 *
 * utm_source en utm_medium winnen altijd: als een campagne zichzelf benoemt,
 * geloven we die en gaan we niet zelf raden. Staat er alleen utm_source, dan
 * vullen we medium aan met "referral" — half gelabeld verkeer is lastiger te
 * duiden dan helemaal niet gelabeld.
 */
export function bepaalBronEnMedium(
  zoekstring: string,
  verwijzer: string,
  eigenHost: string,
): Pick<Herkomst, "source" | "medium"> {
  const params = new URLSearchParams(zoekstring.replace(/^\?/, ""));
  const utmSource = (params.get("utm_source") || "").trim();
  const utmMedium = (params.get("utm_medium") || "").trim();
  if (utmSource) {
    return { source: utmSource, medium: utmMedium || "referral" };
  }
  if (utmMedium) {
    return { source: "(not set)", medium: utmMedium };
  }

  const host = zonderWww(hostUitUrl(verwijzer));
  if (!host) return { ...DIRECT };

  // Verkeer van onszelf is geen nieuwe bron.
  if (host === zonderWww(eigenHost.toLowerCase())) return { ...DIRECT };

  for (const { patroon, source } of AI_ASSISTENTEN) {
    if (patroon.test(host)) return { source, medium: "ai-assistant" };
  }
  for (const { patroon, source } of ZOEKMACHINES) {
    if (patroon.test(host)) return { source, medium: "organic" };
  }
  for (const patroon of SOCIAL) {
    if (patroon.test(host)) return { source: host, medium: "social" };
  }
  return { source: host, medium: "referral" };
}

/** De gclid uit de URL, of null. Google Ads hangt die aan elke advertentieklik. */
export function leesGclid(zoekstring: string): string | null {
  const params = new URLSearchParams(zoekstring.replace(/^\?/, ""));
  const gclid = (params.get("gclid") || "").trim();
  return gclid || null;
}

/**
 * Het GA4-bezoekers-id uit het _ga-cookie.
 * "GA1.1.1234567890.1700000000" → "1234567890.1700000000".
 * Het cookie bestaat pas nadat gtag geladen is, dus dit mag null opleveren.
 */
export function leesGaClientId(cookieTekst: string): string | null {
  const match = /(?:^|;\s*)_ga=GA\d+\.\d+\.([^;]+)/.exec(cookieTekst || "");
  return match ? match[1] : null;
}

export interface HerkomstInvoer {
  zoekstring: string;
  verwijzer: string;
  pad: string;
  cookieTekst: string;
  eigenHost: string;
}

export function bepaalHerkomst(invoer: HerkomstInvoer): Herkomst {
  const { source, medium } = bepaalBronEnMedium(
    invoer.zoekstring,
    invoer.verwijzer,
    invoer.eigenHost,
  );
  return {
    source,
    medium,
    landing_page: invoer.pad || "/",
    gclid: leesGclid(invoer.zoekstring),
    ga_client_id: leesGaClientId(invoer.cookieTekst),
  };
}

/** Controle bij het teruglezen uit opslag: is dit nog een geldige herkomst? */
export function isGeldigeHerkomst(waarde: unknown): waarde is Herkomst {
  if (!waarde || typeof waarde !== "object") return false;
  const h = waarde as Record<string, unknown>;
  return (
    typeof h.source === "string" && h.source.length > 0 &&
    typeof h.medium === "string" && h.medium.length > 0 &&
    typeof h.landing_page === "string" &&
    (h.gclid === null || typeof h.gclid === "string") &&
    (h.ga_client_id === null || typeof h.ga_client_id === "string")
  );
}
