/**
 * Unit-tests voor server/mailGrootte.ts
 * Run met:  npx tsx server/mailGrootte.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 */
import {
  meetMail, bytesVan, leesbaar, ingebakkenBeelden,
  GMAIL_KNIPGRENS, TE_GROOT,
} from "./mailGrootte";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}

function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  ok(label, gelijk, gelijk ? undefined : `actual: ${JSON.stringify(actual)}  expected: ${JSON.stringify(expected)}`);
}

/** Een data:-URL van ongeveer n bytes. */
const nepBeeld = (n: number) => `data:image/jpeg;base64,${'A'.repeat(Math.max(0, n - 23))}`;

console.log("\n— bytesVan(): bytes, geen tekens —");
eq("gewone tekst", bytesVan("abc"), 3);
eq("een é is twee bytes", bytesVan("é"), 2);
eq("een emoji is er vier", bytesVan("🙂"), 4);
eq("leeg is nul", bytesVan(""), 0);
eq("null crasht niet", bytesVan(null as any), 0);

console.log("\n— leesbaar() —");
eq("bytes", leesbaar(512), "512 B");
eq("kilobytes", leesbaar(102400), "100 kB");
eq("megabytes met een komma", leesbaar(1_500_000), "1,4 MB");

console.log("\n— ingebakkenBeelden() —");
{
  const html = `<img src="${nepBeeld(1000)}"><p>tekst</p><img src="${nepBeeld(2000)}">`;
  const b = ingebakkenBeelden(html);
  eq("twee gevonden", b.aantal, 2);
  ok("samen ongeveer 3 kB", b.bytes >= 2900 && b.bytes <= 3100, String(b.bytes));
  eq("een mail zonder ingebakken beeld telt nul", ingebakkenBeelden('<img src="https://x.nl/a.jpg">').aantal, 0);
  eq("lege invoer", ingebakkenBeelden("").aantal, 0);
  eq("null crasht niet", ingebakkenBeelden(null as any).aantal, 0);
}

console.log("\n— meetMail(): de drie niveaus —");
{
  const klein = meetMail("<p>Hallo</p>");
  eq("een kleine mail is ruim", klein.oordeel, "ruim");
  eq("en heeft geen melding", klein.melding, "");
}
{
  const krap = meetMail("x".repeat(GMAIL_KNIPGRENS + 10));
  eq("net boven de Gmail-grens is krap", krap.oordeel, "krap");
  ok("de melding noemt het inkorten", krap.melding.includes("ingekort"));
  ok("en waarschuwt over de afmeldlink", krap.melding.includes("afmeldlink"));
}
{
  const netEronder = meetMail("x".repeat(GMAIL_KNIPGRENS - 1));
  eq("net eronder is nog ruim", netEronder.oordeel, "ruim");
}
{
  const groot = meetMail("x".repeat(TE_GROOT + 10));
  eq("boven de bovengrens is te groot", groot.oordeel, "te_groot");
  ok("de melding zegt dat filters hem weigeren", groot.melding.includes("weigeren"));
}

console.log("\n— meetMail(): de oorzaak benoemen —");
{
  // Dit is het echte geval: één telefoonfoto, meegebakken.
  const html = `<p>Beste {{voornaam}},</p><img src="${nepBeeld(3_000_000)}">`;
  const m = meetMail(html);
  eq("te groot", m.oordeel, "te_groot");
  eq("één ingebakken afbeelding geteld", m.ingebakkenBeelden, 1);
  ok("de melding noemt het aantal", m.melding.includes("1 ingesloten afbeelding"));
  ok("en het aandeel in procenten", /\d+% van de mail/.test(m.melding), m.melding);
  ok("en vertelt wat je eraan doet", m.melding.includes("Upload ze opnieuw"));
  ok("enkelvoud klopt", m.melding.includes("afbeelding is") && !m.melding.includes("afbeeldingen"));
}
{
  const html = `<img src="${nepBeeld(60_000)}"><img src="${nepBeeld(60_000)}">`;
  const m = meetMail(html);
  eq("twee beelden samen boven de knipgrens", m.oordeel, "krap");
  ok("meervoud klopt", m.melding.includes("2 ingesloten afbeeldingen zijn"));
}
{
  // Groot zonder ingebakken beelden: dan geen advies over uploaden, want dat
  // zou de lezer op het verkeerde spoor zetten.
  const m = meetMail("x".repeat(GMAIL_KNIPGRENS + 10));
  ok("geen upload-advies als er niets is ingebakken", !m.melding.includes("Upload"));
}

console.log("\n— meetMail(): een mail met een gehoste afbeelding blijft klein —");
{
  const m = meetMail(`<p>Beste Max,</p><img src="https://www.doehetextra.nl/campagne-beeld/eveline.jpg">`);
  eq("ruim", m.oordeel, "ruim");
  eq("niets ingebakken", m.ingebakkenBeelden, 0);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
