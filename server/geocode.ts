// ─── Geocoding via PDOK Locatieserver (gratis, geen API-key) ────────────────
// Zet een Nederlands adres om naar WGS84-coördinaten. Best-effort: elke fout
// (timeout, netwerkfout, geen resultaat, onverwacht formaat) levert null op —
// deze module gooit nooit een exception, zodat opslaan nooit blokkeert.

const PDOK_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";
const TIMEOUT_MS = 5000;

export interface GeocodeInput {
  address?: string | null;    // straat + huisnummer, bijv. "Herengracht 100"
  postalCode?: string | null; // bijv. "1015 BS"
  city?: string | null;       // bijv. "Amsterdam"
}

export interface GeocodeResult {
  lat: number;
  lon: number;
}

/**
 * Geocodeert een NL-adres via de PDOK Locatieserver.
 * Retourneert { lat, lon } of null (nooit een exception).
 */
export async function geocodeNlAddress(input: GeocodeInput): Promise<GeocodeResult | null> {
  try {
    const parts = [input.address, input.postalCode, input.city]
      .map((p) => (p ?? "").trim())
      .filter((p) => p.length > 0);
    if (parts.length === 0) return null;

    const url = `${PDOK_URL}?q=${encodeURIComponent(parts.join(", "))}&rows=1&fl=centroide_ll`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let json: any;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      json = await res.json();
    } finally {
      clearTimeout(timer);
    }

    // centroide_ll is een WKT-punt: "POINT(4.89 52.37)" — LET OP: lon eerst, dan lat.
    const centroide: unknown = json?.response?.docs?.[0]?.centroide_ll;
    if (typeof centroide !== "string") return null;
    const m = centroide.match(/POINT\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
    if (!m) return null;
    const lon = parseFloat(m[1]);
    const lat = parseFloat(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null; // timeout, netwerkfout, ongeldige JSON — allemaal: geen coördinaten
  }
}

/**
 * Plaatsnaam bij een Nederlandse postcode via de PDOK Locatieserver.
 * Best-effort: geeft null bij een fout of time-out (nooit een exception).
 */
export async function plaatsBijPostcode(postcode: string): Promise<string | null> {
  const pc = String(postcode || "").replace(/\s+/g, "").toUpperCase();
  if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(pc)) return null;
  try {
    const url = `${PDOK_URL}?q=${encodeURIComponent(pc)}&fq=type:postcode&rows=1&fl=woonplaatsnaam`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!res.ok) return null;
      const json: any = await res.json();
      const plaats = json?.response?.docs?.[0]?.woonplaatsnaam;
      return typeof plaats === "string" && plaats.trim() ? plaats.trim() : null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
