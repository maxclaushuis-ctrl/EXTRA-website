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

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}

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

console.log("\n— het protocol: de keten van twee sprongen naar één —");
{
  // De Ahrefs-melding: http://doehetextra.nl/ ging via https://doehetextra.nl/
  // naar https://www.doehetextra.nl/. Bereikt zo'n verzoek Express, dan doen we
  // het in één keer goed.
  eq("http op de apex gaat meteen naar https én www",
     wwwDoelUrl("doehetextra.nl", "/", "http"), "https://www.doehetextra.nl/");
  eq("http op www gaat naar https op www",
     wwwDoelUrl("www.doehetextra.nl", "/", "http"), "https://www.doehetextra.nl/");
  eq("met een pad erbij",
     wwwDoelUrl("doehetextra.nl", "/vacatures/kok-amsterdam", "http"), "https://www.doehetextra.nl/vacatures/kok-amsterdam");
  eq("een proxy die meerdere waarden meestuurt",
     wwwDoelUrl("doehetextra.nl", "/", "http, https"), "https://www.doehetextra.nl/");
  eq("als array",
     wwwDoelUrl("www.doehetextra.nl", "/", ["http", "https"]), "https://www.doehetextra.nl/");
}

console.log("\n— en wat er juist NIET mag gebeuren —");
{
  // Dit is de belangrijkste regel van het hele bestand: zonder header weten we
  // het protocol niet, en dan doen we niets. De Replit-preview en localhost
  // sturen geen x-forwarded-proto mee; een gedwongen https-redirect maakt ze
  // onbereikbaar, en dat merk je pas als je ze nodig hebt.
  eq("www zonder header: niets doen", wwwDoelUrl("www.doehetextra.nl", "/", undefined), null);
  eq("www met https: niets doen", wwwDoelUrl("www.doehetextra.nl", "/", "https"), null);
  eq("www met een lege header: niets doen", wwwDoelUrl("www.doehetextra.nl", "/", ""), null);
  eq("localhost over http blijft met rust", wwwDoelUrl("localhost:5000", "/", "http"), null);
  eq("de Replit-preview over http blijft met rust", wwwDoelUrl("extra-website.replit.app", "/", "http"), null);
  eq("een subdomein blijft met rust", wwwDoelUrl("mail.doehetextra.nl", "/", "http"), null);
  eq("een domein dat erop lijkt blijft met rust", wwwDoelUrl("nietdoehetextra.nl", "/", "http"), null);
  eq("doehetextra.nl.kwaad.nl blijft met rust", wwwDoelUrl("doehetextra.nl.kwaad.nl", "/", "http"), null);
}
{
  // Geen lus: het antwoord op de doel-URL moet null zijn.
  const doel = wwwDoelUrl("doehetextra.nl", "/", "http");
  eq("de bestemming stuurt niet verder door",
     wwwDoelUrl("www.doehetextra.nl", "/", "https"), null);
  ok("en de bestemming is de www-host over https", doel === "https://www.doehetextra.nl/", String(doel));
}
{
  // De apex over https blijft doen wat hij deed, ook zonder header.
  eq("apex zonder header", wwwDoelUrl("doehetextra.nl", "/blog", undefined), "https://www.doehetextra.nl/blog");
  eq("apex met https", wwwDoelUrl("doehetextra.nl", "/blog", "https"), "https://www.doehetextra.nl/blog");
}

{
  // /api NOOIT omleiden. Een webhook-verzender volgt geen 301.
  eq("whatsapp-webhook op de apex blijft staan",
     wwwDoelUrl("doehetextra.nl", "/api/whatsapp/webhook/geheim123"), null);
  eq("meta-webhook op de apex blijft staan",
     wwwDoelUrl("doehetextra.nl", "/api/whatsapp/meta-webhook"), null);
  eq("ook over http niet omleiden",
     wwwDoelUrl("doehetextra.nl", "/api/whatsapp/webhook/geheim123", "http"), null);
  eq("elk ander api-pad ook niet",
     wwwDoelUrl("doehetextra.nl", "/api/webhooks/sendgrid/inbound"), null);
  eq("/api zonder schuine streep ook niet",
     wwwDoelUrl("doehetextra.nl", "/api"), null);
  eq("query-string maakt geen verschil",
     wwwDoelUrl("doehetextra.nl", "/api/whatsapp/stats?limit=5"), null);

  // Maar een pagina die toevallig met 'api' begint is gewoon een pagina.
  eq("/apitest is geen api-pad",
     wwwDoelUrl("doehetextra.nl", "/apitest"), "https://www.doehetextra.nl/apitest");
  eq("/api-koppeling is geen api-pad",
     wwwDoelUrl("doehetextra.nl", "/api-koppeling"), "https://www.doehetextra.nl/api-koppeling");
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
