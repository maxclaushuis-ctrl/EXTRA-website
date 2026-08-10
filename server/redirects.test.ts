/**
 * Unit-tests voor server/redirects.ts
 * Run met:  npx tsx server/redirects.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Test bewust alleen resolveRedirect() (pure functie, geen Express nodig) —
 * registerRedirects() zelf is een dunne wrapper die alleen res.redirect(301, ...)
 * aanroept met wat resolveRedirect() teruggeeft.
 */
import { resolveRedirect, normalizePath } from "./redirects";

let passed = 0;
let failed = 0;

function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}\n      actual:   ${JSON.stringify(actual)}\n      expected: ${JSON.stringify(expected)}`);
  }
}

console.log("\n— normalizePath() —");
assertEq('root "/" blijft "/"', normalizePath("/"), "/");
assertEq("trailing slash verwijderd", normalizePath("/beloningssysteem/"), "/beloningssysteem");
assertEq("lowercase", normalizePath("/BELONINGSSYSTEEM"), "/beloningssysteem");
assertEq("geen trailing slash, geen wijziging", normalizePath("/extraatje"), "/extraatje");

console.log("\n— resolveRedirect(): P14-duplicaten (exacte match) —");
assertEq("/beloningssysteem -> /extraatje", resolveRedirect("/beloningssysteem"), "/extraatje");
assertEq("/hoe-extra-werkt -> /onze-werkwijze", resolveRedirect("/hoe-extra-werkt"), "/onze-werkwijze");
assertEq("/over-extra/ons-team -> /ons-team", resolveRedirect("/over-extra/ons-team"), "/ons-team");
assertEq("hoofdlettergevoeligheid: /Beloningssysteem -> /extraatje", resolveRedirect("/Beloningssysteem"), "/extraatje");
assertEq("trailing slash: /beloningssysteem/ -> /extraatje", resolveRedirect("/beloningssysteem/"), "/extraatje");

console.log("\n— resolveRedirect(): /nieuws -> /blog (patroon) —");
assertEq("index: /nieuws -> /blog", resolveRedirect("/nieuws"), "/blog");
assertEq(
  "artikel: /nieuws/minimumuurtaief-van-36--voor-zzp-ers -> /blog/minimumuurtaief-van-36--voor-zzp-ers",
  resolveRedirect("/nieuws/minimumuurtaief-van-36--voor-zzp-ers"),
  "/blog/minimumuurtaief-van-36--voor-zzp-ers"
);
assertEq(
  "generaliseert naar een toekomstig, nu nog niet bestaand artikel",
  resolveRedirect("/nieuws/een-artikel-dat-morgen-pas-verschijnt"),
  "/blog/een-artikel-dat-morgen-pas-verschijnt"
);
assertEq("trailing slash op artikel", resolveRedirect("/nieuws/mijn-artikel/"), "/blog/mijn-artikel");
assertEq(
  "geneste segmenten blijven intact",
  resolveRedirect("/nieuws/categorie/artikel"),
  "/blog/categorie/artikel"
);

console.log("\n— resolveRedirect(): geen match —");
assertEq("bestaande, niet-omgeleide route geeft null", resolveRedirect("/extraatje"), null);
assertEq("onbekend pad geeft null", resolveRedirect("/dit-bestaat-nergens"), null);
assertEq('"/nieuwsbrief" mag niet als /nieuws-prefix matchen', resolveRedirect("/nieuwsbrief"), null);
assertEq("lege string geeft null (geen crash)", resolveRedirect(""), null);

console.log("\n— resolveRedirect(): bestaande (pre-P14) entries blijven werken —");
assertEq("/landing -> /", resolveRedirect("/landing"), "/");
assertEq("/hoe-werkt-dagbetaling -> /dagbetaling", resolveRedirect("/hoe-werkt-dagbetaling"), "/dagbetaling");
assertEq(
  "/vacatures/hotelpersoneel-amstelhotel -> /hotelpersoneel-inhuren",
  resolveRedirect("/vacatures/hotelpersoneel-amstelhotel"),
  "/hotelpersoneel-inhuren"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
