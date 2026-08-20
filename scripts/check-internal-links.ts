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
// De routekennis (welke paden bestaan, waar komt een pad uit) is uitgelicht naar
// een eigen module omdat scripts/content-links.ts dezelfde vraag stelt voor de
// links die in de database staan. Zie de toelichting daar.
import {
  ROOT,
  CLIENT_SRC,
  normalize,
  aantalRoutes,
  isKnownRoute,
  resolvesToKnownRoute,
  eindbestemming,
  prefixMatchesDynamicRoute,
} from "./routeKennis";

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

// ── 2. Scan client/src op href's ─────────────────────────────────────────
const SKIP_PREFIXES = ["http://", "https://", "mailto:", "tel:", "//", "#"];

const files = walk(CLIENT_SRC);
const errors: string[] = [];
/** Links die wél werken, maar via een 301 lopen. Aparte lijst, aparte melding. */
const omwegen: string[] = [];
let checked = 0;

/** Registreert een href die via een redirect loopt (of laat hem met rust). */
function controleerOmweg(rel: string, rawHref: string, href: string): void {
  const doel = resolveRedirect(normalize(href));
  if (!doel) return;
  omwegen.push(`${rel}: href="${rawHref}" → wijst beter rechtstreeks naar "${eindbestemming(href)}"`);
}

// href="/pad" (letterlijke string)
const LITERAL_HREF = /href=["'](\/[^"'{}]*)["']/g;
// { label: "…", href: "/pad" } — link-clouds en navigatielijsten gebruiken deze
// objectvorm; die werd tot nu toe niet gescand, terwijl juist daar de meeste
// interne links zitten.
const OBJECT_HREF = /href:\s*["'](\/[^"']*)["']/g;
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
    // Een #fragment of ?query áchter een pad (bijv. "/aanmelden?lang=en")
    // hoort niet bij de route-lookup — alleen het pad ervoor telt.
    const href = rawHref.split(/[#?]/)[0];
    if (href === "") continue;
    checked++;
    if (!isKnownRoute(href) && !resolvesToKnownRoute(href)) {
      errors.push(`${rel}: href="${rawHref}" — geen route in App.tsx en geen werkende redirect`);
    } else {
      controleerOmweg(rel, rawHref, href);
    }
  }

  for (const m of src.matchAll(OBJECT_HREF)) {
    const rawHref = m[1];
    if (SKIP_PREFIXES.some((p) => rawHref.startsWith(p)) || rawHref === "") continue;
    const href = rawHref.split(/[#?]/)[0];
    if (href === "") continue;
    checked++;
    if (!isKnownRoute(href) && !resolvesToKnownRoute(href)) {
      errors.push(`${rel}: href: "${rawHref}" — geen route in App.tsx en geen werkende redirect`);
    } else {
      controleerOmweg(rel, rawHref, href);
    }
  }

  for (const m of src.matchAll(TEMPLATE_HREF_STATIC)) {
    const rawHref = m[1];
    if (SKIP_PREFIXES.some((p) => rawHref.startsWith(p)) || rawHref === "") continue;
    const href = rawHref.split(/[#?]/)[0];
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

// ── 3. Redirectketens in server/redirects.ts zelf ────────────────────────
// Een redirect die naar een pad wijst dat zélf doorverwijst kost de crawler
// twee sprongen. Google volgt ze wel, maar geeft niet alle waarde door en kapt
// na een paar hops af.
//
// resolveRedirect() slaat zo'n keten sinds augustus zelf plat, dus een bezoeker
// merkt er niets meer van. Deze check blijft staan omdat een keten in de
// declaratie nog steeds een leesbaarheidsprobleem is: wie de map leest, ziet
// niet waar een pad écht uitkomt. De patroonregels (/nieuws/* → /blog/*) staan
// bewust buiten deze scan — die kunnen per definitie niet één-op-één worden
// uitgeschreven, en dáárvoor bestaat de ketenresolutie.
const ketens: string[] = [];
{
  const src = fs.readFileSync(path.join(ROOT, "server", "redirects.ts"), "utf-8");
  for (const m of src.matchAll(/"(\/[^"]*)":\s*"(\/[^"]*)"/g)) {
    const volgende = resolveRedirect(normalize(m[2]));
    if (volgende) ketens.push(`${m[1]} → ${m[2]} → ${volgende} (verwijs meteen naar "${eindbestemming(m[2])}")`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} interne link(s) naar een niet-bestaande route:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
if (omwegen.length) {
  console.error(
    `✗ ${omwegen.length} interne link(s) lopen via een redirect (Ahrefs: "Page has links to redirect"):\n  - ` +
      omwegen.join("\n  - ")
  );
  process.exit(1);
}
if (ketens.length) {
  console.error(`✗ ${ketens.length} redirectketen(s) in server/redirects.ts:\n  - ${ketens.join("\n  - ")}`);
  process.exit(1);
}
console.log(
  `✓ Interne-links-check geslaagd: ${checked} href's gecontroleerd tegen ${aantalRoutes} routes — ` +
    `0 kapotte links, 0 links via een redirect, 0 redirectketens.`
);
