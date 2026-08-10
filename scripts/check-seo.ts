/**
 * SEO BUILD-CHECK — draait vóór elke build (npm run build) en faalt hard bij:
 *  - titles > 62 tekens of dubbele titles
 *  - descriptions buiten 110–160 tekens of dubbele descriptions (indexeerbare routes)
 *  - een canonical die naar een route met noindex of een andere canonical wijst
 *  - prerender-fragmenten zonder (precies één) H1 of met verwijzingen naar build-assets
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
for (const m of indexable) {
  if (m.title.length > 62) errors.push(`${m.path}: title ${m.title.length} tekens (max 62): "${m.title}"`);
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
for (const m of ROUTE_META.filter((x) => x.prerender && !x.noindex)) {
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
