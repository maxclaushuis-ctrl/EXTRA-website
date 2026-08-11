/**
 * SEO BUILD-CHECK — draait vóór elke build (npm run build) en faalt hard bij:
 *  - titles > 60 tekens of dubbele titles
 *  - descriptions buiten 110–160 tekens of dubbele descriptions (indexeerbare routes)
 *  - een canonical die naar een route met noindex of een andere canonical wijst
 *  - prerender-fragmenten zonder (precies één) H1 of met verwijzingen naar build-assets
 *  - (P17) een prerender-fragment dat zelf een <title>-tag bevat — de shell zet
 *    via injectMeta() al precies één <title> in <head>; een <title> die
 *    daarnaast in het fragment terechtkomt (bijv. een component die op eigen
 *    houtje een <title>-JSX-tag rendert) levert dus altijd een pagina met twee
 *    title-tags op. Zie NieuwsArtikel.tsx voor het concrete geval dat deze
 *    check moest voorkomen.
 *
 * (P18) De prerender-fragment-checks (punt 4) draaien op elke prerender:true
 * route, ook een noindex-route zoals /BHG-group of /xebia — prerenderen is
 * een crawlbaarheids-keuze, los van of de route in de zoekresultaten hoort.
 * Alleen de title-/description-lengte- en uniciteitschecks (punt 1 en 2)
 * blijven beperkt tot de indexeerbare set.
 *
 * Bewust deterministisch en zonder browser/netwerk, zodat hij veilig in de
 * Replit-deploybuild kan draaien.
 */
import fs from "fs";
import path from "path";
import { ROUTE_META, HREFLANG_GROUPS, normalizeMetaPath } from "../shared/routeMeta";

const ROOT = path.resolve(import.meta.dirname, "..");
const FRAGMENT_DIR = path.join(ROOT, "client", "public", "prerender");

const errors: string[] = [];
const warnings: string[] = [];

const indexable = ROUTE_META.filter((m) => !m.noindex);

// 1. Lengtes
// P17: title-limiet aangescherpt van 62 naar 60 tekens — dat is waar Google
// de meeste titles in de SERP afkapt, dus 62 was in de praktijk al te ruim.
for (const m of indexable) {
  if (m.title.length > 60) errors.push(`${m.path}: title ${m.title.length} tekens (max 60): "${m.title}"`);
  if (m.description.length < 110 || m.description.length > 160)
    errors.push(`${m.path}: description ${m.description.length} tekens (110–160 vereist)`);
}

// 2. Uniciteit
for (const field of ["title", "description"] as const) {
  const seen = new Map<string, string>();
  for (const m of indexable) {
    const v = m[field];
    if (seen.has(v)) errors.push(`Dubbele ${field} op ${seen.get(v)} en ${m.path}`);
    else seen.set(v, m.path);
  }
}

// 3. Canonical-integriteit
const byPath = new Map(ROUTE_META.map((m) => [normalizeMetaPath(m.path), m]));
for (const m of ROUTE_META) {
  if (!m.canonical) continue;
  const target = byPath.get(normalizeMetaPath(m.canonical));
  if (!target) errors.push(`${m.path}: canonical ${m.canonical} bestaat niet in het manifest`);
  else if (target.noindex) errors.push(`${m.path}: canonical ${m.canonical} wijst naar een noindex-route`);
  else if (target.canonical) errors.push(`${m.path}: canonical ${m.canonical} wijst naar een route die zelf een afwijkende canonical heeft`);
}

// 4. Prerender-fragmenten
//
// P11: een ontbrekend fragment op een route die expliciet prerender:true
// heeft, was hier tot nu toe alleen een waarschuwing — dat is precies hoe 8
// routes (/vacatures, /blog, /nieuws, /cv-upload, /sollicitatieformulier,
// /beloningssysteem, /hoe-extra-werkt, /over-extra/ons-team) onopgemerkt
// zonder fragment kwamen te zitten. Een route die zelf zegt dat hij
// geprerenderd moet worden, moet ook echt een fragment hebben — dat is nu een
// harde fout. (De dynamische vacature-/blogroutes staan niet in ROUTE_META en
// worden hier dus niet gecontroleerd; scripts/prerender.ts faalt zelf hard als
// daar een gepubliceerde vacature of blogartikel zonder fragment overblijft —
// bewust, want dat vereist databasetoegang, wat deze check expres niet heeft.)
// P18: geen `!x.noindex` meer hier — sinds /BHG-group en /xebia noindex maar
// wél prerender:true zijn (zie shared/routeMeta.ts), is prerenderen een
// crawlbaarheids-keuze los van indexeerbaarheid. Alleen punt 1 (title-/
// description-lengtes) en punt 2 (uniciteit) blijven op de indexeerbare set
// draaien — die gaan wél over hoe de pagina in de zoekresultaten verschijnt.
for (const m of ROUTE_META.filter((x) => x.prerender)) {
  const n = normalizeMetaPath(m.path);
  const file = path.join(FRAGMENT_DIR, (n === "/" ? "index" : n.slice(1).replace(/\//g, "__")) + ".html");
  if (!fs.existsSync(file)) {
    errors.push(`${m.path}: geen prerender-fragment — draai npm run prerender en commit het resultaat`);
    continue;
  }
  const html = fs.readFileSync(file, "utf-8");
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s === 0) errors.push(`${m.path}: prerender-fragment bevat geen <h1>`);
  if (h1s > 1) warnings.push(`${m.path}: prerender-fragment bevat ${h1s} <h1>-tags (1 verwacht)`);
  if (/<script(?![^>]*application\/ld\+json)/.test(html))
    errors.push(`${m.path}: prerender-fragment bevat een niet-JSON-LD <script> (verwijst mogelijk naar verouderde assets)`);
  // P17: de shell zet al precies één <title> in <head> via injectMeta(). Een
  // <title>-tag die daarnaast in het #root-fragment terechtkomt (bijv. een
  // component die zelf <title>{...}</title> rendert) levert dus een pagina
  // met twee title-tags op — altijd fout, ongeacht de inhoud van die tag.
  const titleTagsInFragment = (html.match(/<title[\s>]/g) || []).length;
  if (titleTagsInFragment > 0)
    errors.push(
      `${m.path}: prerender-fragment bevat ${titleTagsInFragment} <title>-tag(s) — de shell zet al een <title> in <head>, dit levert dubbele title-tags op`
    );
}

// 4b. Dezelfde <title>- en H1-checks, maar dan over ALLE fragmenten in
// FRAGMENT_DIR — dus ook de dynamische vacature-/blogfragmenten die
// scripts/prerender.ts genereert en die (bewust, zie de toelichting bij punt
// 4) niet in ROUTE_META staan en dus niet door de loop hierboven komen. Deze
// check heeft geen databasetoegang nodig: hij leest alleen wat er al op schijf
// staat, dus hij vangt ook een regressie op een dynamische route zodra
// npm run prerender in een omgeving mét DATABASE_URL heeft gedraaid.
if (fs.existsSync(FRAGMENT_DIR)) {
  const knownFragmentPaths = new Set(
    ROUTE_META.filter((x) => x.prerender).map((m) => {
      const n = normalizeMetaPath(m.path);
      return n === "/" ? "index.html" : n.slice(1).replace(/\//g, "__") + ".html";
    })
  );
  for (const file of fs.readdirSync(FRAGMENT_DIR)) {
    if (!file.endsWith(".html") || knownFragmentPaths.has(file)) continue; // al gecontroleerd hierboven
    const html = fs.readFileSync(path.join(FRAGMENT_DIR, file), "utf-8");
    const titleTagsInFragment = (html.match(/<title[\s>]/g) || []).length;
    if (titleTagsInFragment > 0)
      errors.push(
        `prerender/${file}: fragment bevat ${titleTagsInFragment} <title>-tag(s) — de shell zet al een <title> in <head>, dit levert dubbele title-tags op`
      );
    const h1sInFragment = (html.match(/<h1[\s>]/g) || []).length;
    if (h1sInFragment === 0) errors.push(`prerender/${file}: fragment bevat geen <h1>`);
    if (h1sInFragment > 1) warnings.push(`prerender/${file}: fragment bevat ${h1sInFragment} <h1>-tags (1 verwacht)`);
  }
}

// 5. Hreflang-koppeling (P13): elke entry in HREFLANG_GROUPS moet naar een
// bestaande, self-canonical, indexeerbare route wijzen — anders geeft
// server/seo.ts (hreflangTags()) straks een tegenstrijdig of dood signaal af.
// Elk pad mag hoogstens in één groep voorkomen: zit een pad in twee groepen,
// dan zou het twee verschillende "vertalingen" claimen, wat bidirectionaliteit
// (A ↔ B) breekt.
{
  const seenInGroup = new Map<string, string>(); // genormaliseerd pad -> "nl:.." / "en:.." herkomst
  for (const { nl, en } of HREFLANG_GROUPS) {
    for (const [p, lang] of [[nl, "nl"], [en, "en"]] as const) {
      const n = normalizeMetaPath(p);
      const target = byPath.get(n);
      if (!target) {
        errors.push(`hreflang-groep (${nl} ↔ ${en}): ${p} bestaat niet in ROUTE_META`);
        continue;
      }
      if (target.noindex) errors.push(`hreflang-groep (${nl} ↔ ${en}): ${p} heeft noindex, hoort niet in een hreflang-groep`);
      if (target.canonical) errors.push(`hreflang-groep (${nl} ↔ ${en}): ${p} heeft zelf een afwijkende canonical (${target.canonical}) — hreflang hoort op de canonical-pagina zelf te staan`);
      const effectiveLang = target.lang ?? "nl"; // NL-routes laten lang meestal ongezet (default nl)
      if (effectiveLang !== lang) errors.push(`hreflang-groep (${nl} ↔ ${en}): ${p} heeft lang="${target.lang}" in ROUTE_META, verwacht "${lang}"`);
      const dup = seenInGroup.get(n);
      if (dup && dup !== `${nl}|${en}`) errors.push(`${p} komt in meerdere hreflang-groepen voor (ook in ${dup})`);
      seenInGroup.set(n, `${nl}|${en}`);
    }
  }
}

if (warnings.length) console.warn(`⚠ Waarschuwingen:\n  - ${warnings.join("\n  - ")}\n`);
if (errors.length) {
  console.error(`✗ SEO-check gefaald (${errors.length}):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ SEO-check geslaagd: ${indexable.length} indexeerbare routes, ${warnings.length} waarschuwing(en).`);
