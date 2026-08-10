/**
 * BUILD-CHECK — interne links naar routes die niet bestaan (P15).
 *
 * Aanleiding: Bas signaleerde op 27 juli 10 interne links die een 404 gaven
 * (/voorwaarden, /cookiebeleid, /werkgevers, /nen-4400-1-certificering en 6
 * conceptartikelen). Dit script voorkomt dat dat opnieuw sluipenderwijs
 * gebeurt: het scant elke `href="/…"` / `href={`/…`}` in client/src en faalt
 * de build zodra er eentje naar een pad wijst dat geen route in client/src/App.tsx
 * is en ook niet via server/redirects.ts naar een bestaande route resolvet.
 *
 * Bewust deterministisch en zonder browser (regex-gebaseerd, net als
 * check-seo.ts), zodat het veilig in de Replit-deploybuild kan draaien.
 *
 * Grenzen (bewust, om valse positieven te voorkomen):
 *  - Alleen `href="/pad"` en `href={`/pad/${var}`}` worden gecontroleerd.
 *    Een href die volledig dynamisch is (bijv. `href={variabele}`, geen
 *    letterlijk pad-voorvoegsel) kan dit script niet statisch narekenen en
 *    wordt overgeslagen.
 *  - Externe URL's (http/https), `mailto:`, `tel:`, `#anchors` en protocol-
 *    relative `//` links worden overgeslagen; een `#fragment` áchter een pad
 *    (bijv. "/ik-zoek-extra-werk#functies") wordt eerst gestript, alleen het
 *    pad ervoor wordt gecontroleerd.
 *  - Voor een template-literal href (bijv. `/blog/${slug}`) wordt alleen het
 *    statische voorvoegsel (`/blog/`) tegen de dynamische routepatronen in
 *    App.tsx (`/blog/:slug`) gecontroleerd, niet de volledige (onbekende)
 *    waarde.
 *  - client/src/pages/dashboard/** en client/src/components/admin/** vallen
 *    buiten scope: dat is het interne, met noindex afgeschermde beheerscherm
 *    (zie shared/routeMeta.ts) met een eigen routing-opzet los van de publieke
 *    wouter-routes in App.tsx — geen onderdeel van wat een crawler ooit ziet.
 */
import fs from "fs";
import path from "path";
import { resolveRedirect } from "../server/redirects";

const ROOT = path.resolve(import.meta.dirname, "..");
const CLIENT_SRC = path.join(ROOT, "client", "src");
const APP_TSX = path.join(CLIENT_SRC, "App.tsx");

/**
 * Mappen die bewust buiten scope vallen: het interne, met noindex afgeschermde
 * beheerscherm (dashboard) met een eigen routing-opzet los van de publieke
 * wouter-routes in App.tsx — zie doc-comment bovenaan dit bestand.
 */
const EXCLUDED_DIRS = [
  path.join(CLIENT_SRC, "pages", "dashboard"),
  path.join(CLIENT_SRC, "components", "admin"),
];

/**
 * Losse bestanden die bewust buiten scope vallen. MainNav.tsx staat niet onder
 * een van de EXCLUDED_DIRS hierboven, maar is dode/ongebruikte code (nergens
 * geïmporteerd — geverifieerd via een grep op "from.*MainNav|import.*MainNav",
 * nul treffers), dus de admin/*-links erin worden nooit daadwerkelijk aan een
 * gebruiker of crawler getoond.
 */
const EXCLUDED_FILES = [path.join(CLIENT_SRC, "components", "MainNav.tsx")];

function walk(dir: string, out: string[] = []): string[] {
  if (EXCLUDED_DIRS.some((excluded) => dir === excluded || dir.startsWith(excluded + path.sep))) {
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name) && !EXCLUDED_FILES.includes(full)) out.push(full);
  }
  return out;
}

function normalize(p: string): string {
  const lower = p.toLowerCase();
  return lower !== "/" && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

// ── 1. Bekende routes uit App.tsx ────────────────────────────────────────
const appTsxSource = fs.readFileSync(APP_TSX, "utf-8");
const routePaths = Array.from(appTsxSource.matchAll(/<Route\s+path="([^"]+)"/g)).map((m) => m[1]);

if (routePaths.length < 50) {
  console.error(
    `✗ Slechts ${routePaths.length} <Route path="..."> gevonden in App.tsx — dat lijkt te weinig, ` +
      `het regex-patroon in dit script sluit vermoedelijk niet meer aan op App.tsx. Controleer handmatig.`
  );
  process.exit(1);
}

interface RoutePattern {
  raw: string;
  regex: RegExp;
  /** true als het pad een :param bevat (dynamische route) */
  dynamic: boolean;
  /** statisch voorvoegsel tot aan het eerste :param, voor prefix-matching van template-literal hrefs */
  staticPrefix: string;
}

const routePatterns: RoutePattern[] = routePaths.map((raw) => {
  const dynamic = raw.includes(":");
  const escaped = raw
    .split("/")
    .map((seg) => (seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  const staticPrefix = raw.split(":")[0];
  return { raw, regex: new RegExp(`^${escaped}$`, "i"), dynamic, staticPrefix };
});

function isKnownRoute(p: string): boolean {
  const n = normalize(p);
  return routePatterns.some((r) => r.regex.test(n));
}

/** Volgt server/redirects.ts (max 5 hops, ter bescherming tegen een cirkel) tot een bekende route of geeft null. */
function resolvesToKnownRoute(p: string): boolean {
  let current = p;
  for (let hop = 0; hop < 5; hop++) {
    const dest = resolveRedirect(current);
    if (!dest) return false;
    if (isKnownRoute(dest)) return true;
    current = dest;
  }
  return false;
}

/** Voor een template-literal href: klopt het statische voorvoegsel met een bekende dynamische route? */
function prefixMatchesDynamicRoute(prefix: string): boolean {
  const n = normalize(prefix);
  return routePatterns.some((r) => r.dynamic && n.startsWith(normalize(r.staticPrefix)));
}

// ── 2. Scan client/src op href's ─────────────────────────────────────────
const SKIP_PREFIXES = ["http://", "https://", "mailto:", "tel:", "//", "#"];

const files = walk(CLIENT_SRC);
const errors: string[] = [];
let checked = 0;

// href="/pad" (letterlijke string)
const LITERAL_HREF = /href=["'](\/[^"'{}]*)["']/g;
// href={`/pad/${iets}`} (template literal met een letterlijk voorvoegsel)
const TEMPLATE_HREF = /href=\{`(\/[^`]*?)\$\{/g;
// href={`/pad`} (template literal zonder interpolatie — functioneel gelijk aan een letterlijke string)
const TEMPLATE_HREF_STATIC = /href=\{`(\/[^`$]*)`\}/g;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, "utf-8");

  for (const m of src.matchAll(LITERAL_HREF)) {
    const rawHref = m[1];
    if (SKIP_PREFIXES.some((p) => rawHref.startsWith(p)) || rawHref === "") continue;
    // Een #fragment áchter een pad (bijv. "/ik-zoek-extra-werk#functies") hoort
    // niet bij de route-lookup — alleen het pad ervoor wordt gecontroleerd.
    const href = rawHref.split("#")[0];
    if (href === "") continue;
    checked++;
    if (!isKnownRoute(href) && !resolvesToKnownRoute(href)) {
      errors.push(`${rel}: href="${rawHref}" — geen route in App.tsx en geen werkende redirect`);
    }
  }

  for (const m of src.matchAll(TEMPLATE_HREF_STATIC)) {
    const rawHref = m[1];
    if (SKIP_PREFIXES.some((p) => rawHref.startsWith(p)) || rawHref === "") continue;
    const href = rawHref.split("#")[0];
    if (href === "") continue;
    checked++;
    if (!isKnownRoute(href) && !resolvesToKnownRoute(href)) {
      errors.push(`${rel}: href={\`${rawHref}\`} — geen route in App.tsx en geen werkende redirect`);
    }
  }

  for (const m of src.matchAll(TEMPLATE_HREF)) {
    const prefix = m[1];
    if (SKIP_PREFIXES.some((p) => prefix.startsWith(p)) || prefix === "") continue;
    checked++;
    if (!prefixMatchesDynamicRoute(prefix)) {
      errors.push(
        `${rel}: href={\`${prefix}\${…}\`} — voorvoegsel matcht geen dynamische route (bijv. "/blog/:slug") in App.tsx`
      );
    }
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} interne link(s) naar een niet-bestaande route:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ Interne-links-check geslaagd: ${checked} href's gecontroleerd tegen ${routePaths.length} routes, 0 kapotte links.`);
