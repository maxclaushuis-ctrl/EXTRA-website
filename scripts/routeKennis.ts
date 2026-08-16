/**
 * ROUTEKENNIS — welke interne paden bestaan er, en waar komt een pad uiteindelijk uit?
 *
 * Uitgelicht uit scripts/check-internal-links.ts omdat er nu een tweede
 * gebruiker is: scripts/content-links.ts controleert dezelfde vraag voor links
 * die in de database staan in plaats van in de code. Twee kopieën van "welke
 * routes kent deze site" lopen gegarandeerd uit de pas — deze module is de ene
 * plek waar dat antwoord vandaan komt.
 *
 * De routes worden gelezen uit client/src/App.tsx, niet uit shared/routeMeta.ts:
 * routeMeta beschrijft alleen de pagina's met eigen SEO-metadata, App.tsx is de
 * volledige lijst van wat de router daadwerkelijk rendert (inclusief de
 * dynamische /blog/:slug en /vacatures/:slug).
 *
 * Bewust regex-gebaseerd en zonder browser of build, zodat dit veilig in de
 * Replit-deploybuild kan draaien.
 */
import fs from "fs";
import path from "path";
import { resolveRedirect } from "../server/redirects";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const CLIENT_SRC = path.join(ROOT, "client", "src");
const APP_TSX = path.join(CLIENT_SRC, "App.tsx");

/** Lowercase, zonder trailing slash — gelijk aan normalizePath() in server/redirects.ts. */
export function normalize(p: string): string {
  const lower = p.toLowerCase();
  return lower !== "/" && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

const appTsxSource = fs.readFileSync(APP_TSX, "utf-8");
const routePaths = Array.from(appTsxSource.matchAll(/<Route\s+path="([^"]+)"/g)).map((m) => m[1]);

// Vangnet tegen stille mislukking: als het regex-patroon ooit niet meer op
// App.tsx aansluit, vindt dit script nul routes en zou het élke link goedkeuren
// (of juist afkeuren) zonder dat iemand doorheeft dat de meting kapot is.
// Beide gebruikers zijn build- of onderhoudsscripts, dus hard stoppen is hier
// het juiste gedrag.
if (routePaths.length < 50) {
  console.error(
    `✗ Slechts ${routePaths.length} <Route path="..."> gevonden in App.tsx — dat lijkt te weinig, ` +
      `het regex-patroon in scripts/routeKennis.ts sluit vermoedelijk niet meer aan op App.tsx. ` +
      `Controleer handmatig.`
  );
  process.exit(1);
}

export interface RoutePattern {
  raw: string;
  regex: RegExp;
  /** true als het pad een :param bevat (dynamische route) */
  dynamic: boolean;
  /** statisch voorvoegsel tot aan het eerste :param, voor prefix-matching van template-literal hrefs */
  staticPrefix: string;
}

export const routePatterns: RoutePattern[] = routePaths.map((raw) => {
  const dynamic = raw.includes(":");
  const escaped = raw
    .split("/")
    .map((seg) => (seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  const staticPrefix = raw.split(":")[0];
  return { raw, regex: new RegExp(`^${escaped}$`, "i"), dynamic, staticPrefix };
});

/** Aantal routes dat in App.tsx gevonden is — voor de slotregel van de checks. */
export const aantalRoutes = routePatterns.length;

export function isKnownRoute(p: string): boolean {
  const n = normalize(p);
  return routePatterns.some((r) => r.regex.test(n));
}

/**
 * Volgt server/redirects.ts tot een bekende route, of geeft false.
 *
 * resolveRedirect() slaat ketens sinds augustus zelf al plat, dus in de praktijk
 * is één sprong genoeg; de lus blijft staan als vangnet voor het geval daar ooit
 * een grens aan zit.
 */
export function resolvesToKnownRoute(p: string): boolean {
  let current = p;
  for (let hop = 0; hop < 5; hop++) {
    const dest = resolveRedirect(current);
    if (!dest) return false;
    if (isKnownRoute(dest)) return true;
    current = dest;
  }
  return false;
}

/**
 * Het pad waar een link uiteindelijk uitkomt — dus ná alle 301's.
 *
 * Waarom dat uitmaakt: een interne link naar een pad dat zelf doorverwijst werkt
 * prima voor de bezoeker, maar Ahrefs meldt het als "Page has links to redirect",
 * het kost een extra serverronde en er lekt een beetje linkwaarde weg. De
 * eindbestemming staat gewoon in server/redirects.ts, dus er is geen reden om de
 * omweg te laten staan.
 */
export function eindbestemming(p: string): string {
  let current = normalize(p);
  for (let hop = 0; hop < 5; hop++) {
    const dest = resolveRedirect(current);
    if (!dest) return current;
    current = normalize(dest);
  }
  return current; // vangnet tegen een cirkel
}

/** Voor een template-literal href: klopt het statische voorvoegsel met een bekende dynamische route? */
export function prefixMatchesDynamicRoute(prefix: string): boolean {
  const n = normalize(prefix);
  return routePatterns.some((r) => r.dynamic && n.startsWith(normalize(r.staticPrefix)));
}
