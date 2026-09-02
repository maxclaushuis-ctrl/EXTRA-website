/**
 * Unit-tests voor scripts/prerenderOpruimen.ts
 * Run met:  npx tsx scripts/prerenderOpruimen.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 *
 * Het gevaarlijke geval staat hier voorop: deze functie verwijdert bestanden.
 * Eén verkeerde match en een statische route verliest zijn fragment, waarna
 * check-seo.ts de build terecht laat vallen. Vandaar de tests op het verschil
 * tussen blog.html en blog__slug.html.
 */
import { isDynamischFragment, verouderdeFragmenten } from "./prerenderOpruimen";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}

console.log("\n— Wat telt als een dynamisch fragment —");
ok("blog__slug.html wel", isDynamischFragment("blog__zzp-inhuren-horeca.html"));
ok("nieuws__slug.html wel", isDynamischFragment("nieuws__zzp-inhuren-horeca.html"));
ok("vacatures__slug.html wel", isDynamischFragment("vacatures__kok-amsterdam.html"));
ok("blog.html NIET — dat is de statische route /blog", !isDynamischFragment("blog.html"));
ok("vacatures.html NIET — statische route", !isDynamischFragment("vacatures.html"));
ok("index.html NIET", !isDynamischFragment("index.html"));
ok("een statische route die met blog begint blijft veilig",
  !isDynamischFragment("blogregels.html"));
ok("horeca-vacatures-amsterdam.html NIET — statische landingspagina",
  !isDynamischFragment("horeca-vacatures-amsterdam.html"));
ok("iets anders dan .html telt niet mee", !isDynamischFragment("blog__slug.txt"));

console.log("\n— Wat er opgeruimd wordt —");
const aanwezig = [
  "index.html",
  "blog.html",
  "vacatures.html",
  "horeca-vacatures-amsterdam.html",
  "blog__zzp-inhuren-horeca.html",
  "blog__barista-als-visitekaartje.html",
  "blog__test-blog-artikel.html",
  "nieuws__zzp-inhuren-horeca.html",
  "vacatures__kok-amsterdam.html",
  "vacatures__oude-vacature.html",
];
const geschreven = [
  "index.html",
  "blog.html",
  "vacatures.html",
  "horeca-vacatures-amsterdam.html",
  "blog__zzp-inhuren-horeca.html",
  "nieuws__zzp-inhuren-horeca.html",
  "vacatures__kok-amsterdam.html",
];
const weg = verouderdeFragmenten(aanwezig, geschreven);
ok("drie bestanden mogen weg", weg.length === 3);
ok("en het zijn precies de verdwenen slugs",
  weg.join(",") === "blog__barista-als-visitekaartje.html,blog__test-blog-artikel.html,vacatures__oude-vacature.html");
ok("blog.html blijft", !weg.includes("blog.html"));
ok("vacatures.html blijft", !weg.includes("vacatures.html"));
ok("index.html blijft", !weg.includes("index.html"));
ok("een landingspagina blijft", !weg.includes("horeca-vacatures-amsterdam.html"));
ok("de invoerlijst is niet gewijzigd", aanwezig.length === 10);

console.log("\n— Randgevallen —");
ok("alles geschreven → niets weg", verouderdeFragmenten(geschreven, geschreven).length === 0);
ok("lege map geeft lege lijst", verouderdeFragmenten([], geschreven).length === 0);
ok(
  "niets geschreven → alle dynamische fragmenten staan op de lijst (daarom de veiligheidsklep in prerender.ts)",
  verouderdeFragmenten(aanwezig, []).length === 6,
);
ok("de uitkomst is gesorteerd",
  verouderdeFragmenten(aanwezig, []).join(",") === [...verouderdeFragmenten(aanwezig, [])].sort().join(","));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
