/**
 * Unit-tests voor server/wwwRedirect.ts
 * Run met:  npx tsx server/wwwRedirect.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 *
 * De nadruk ligt op wat er NIET mag gebeuren. Een te ruime hostcontrole maakt
 * de Replit-preview en de health checks van de deploy onbereikbaar, en dat merk
 * je pas op het moment dat je ze nodig hebt.
 */
import { wwwDoelUrl } from "./wwwRedirect";

let passed = 0;
let failed = 0;

function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  if (gelijk) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}\n      actual:   ${JSON.stringify(actual)}\n      expected: ${JSON.stringify(expected)}`); }
}

console.log("\n— de apex gaat naar www —");
eq("homepage", wwwDoelUrl("doehetextra.nl", "/"), "https://www.doehetextra.nl/");
eq("pad blijft behouden", wwwDoelUrl("doehetextra.nl", "/blog/zzp-inhuren-horeca"), "https://www.doehetextra.nl/blog/zzp-inhuren-horeca");
eq("query-string blijft behouden", wwwDoelUrl("doehetextra.nl", "/contact?ref=google"), "https://www.doehetextra.nl/contact?ref=google");
eq("de sitemap ook", wwwDoelUrl("doehetextra.nl", "/sitemap.xml"), "https://www.doehetextra.nl/sitemap.xml");
eq("hoofdletters in de host", wwwDoelUrl("DoeHetExtra.NL", "/"), "https://www.doehetextra.nl/");
eq("met poortnummer", wwwDoelUrl("doehetextra.nl:443", "/"), "https://www.doehetextra.nl/");

console.log("\n— wat met rust gelaten moet worden —");
eq("www zelf: geen lus", wwwDoelUrl("www.doehetextra.nl", "/"), null);
eq("Replit-preview", wwwDoelUrl("extra-website.replit.app", "/"), null);
eq("oude Replit-hostnaam", wwwDoelUrl("abc-123.repl.co", "/"), null);
eq("localhost", wwwDoelUrl("localhost:5000", "/"), null);
eq("interne health check zonder host", wwwDoelUrl(undefined, "/"), null);
eq("lege host", wwwDoelUrl("", "/"), null);

console.log("\n— hostnamen die er alleen op lijken —");
eq("subdomein", wwwDoelUrl("mail.doehetextra.nl", "/"), null);
eq("ander domein dat erop eindigt", wwwDoelUrl("nietdoehetextra.nl", "/"), null);
eq("domein met de apex als voorvoegsel", wwwDoelUrl("doehetextra.nl.kwaad.nl", "/"), null);

console.log("\n— rare invoer mag niet crashen —");
eq("leeg pad krijgt een schuine streep", wwwDoelUrl("doehetextra.nl", ""), "https://www.doehetextra.nl/");
eq("pad zonder schuine streep", wwwDoelUrl("doehetextra.nl", "blog"), "https://www.doehetextra.nl/blog");

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
