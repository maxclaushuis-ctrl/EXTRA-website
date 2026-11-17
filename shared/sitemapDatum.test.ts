/**
 * Huistests voor shared/sitemapDatum.ts en shared/paginaDatums.ts. Draaien: npm run sitemapdatum:test
 */
import { lastmodRegel } from "./sitemapDatum";
import { PAGINA_DATUMS } from "./paginaDatums";
import { ROUTE_META } from "./routeMeta";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}`); }
}

test("bekende pagina krijgt haar datum", lastmodRegel("/a", { "/a": "2026-10-24" }) === "    <lastmod>2026-10-24</lastmod>\n");
test("onbekende pagina krijgt geen regel", lastmodRegel("/b", { "/a": "2026-10-24" }) === "");
test("ongeldige datum geeft geen regel", lastmodRegel("/a", { "/a": "vandaag" }) === "" && lastmodRegel("/a", { "/a": "" }) === "");

const vandaag = new Date().toISOString().slice(0, 10);
const paden = Object.keys(PAGINA_DATUMS);
test("alle datums zijn geldig en niet in de toekomst", paden.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(PAGINA_DATUMS[p]) && PAGINA_DATUMS[p] <= vandaag));
test("alleen bestaande routes", paden.every((p) => ROUTE_META.some((m) => m.path === p)));
const metFragment = ROUTE_META.filter((m) => m.prerender && !m.noindex && !m.canonical);
const zonder = metFragment.filter((m) => !PAGINA_DATUMS[m.path]).map((m) => m.path);
test(`elke geprerenderde pagina heeft een datum (ontbreekt: ${zonder.join(", ") || "geen"}); draai npm run datums`, zonder.length === 0);
test("niet overal dezelfde datum", new Set(Object.values(PAGINA_DATUMS)).size > 3);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
