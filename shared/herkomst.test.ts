/**
 * Tests voor de herkomstbepaling.
 * Draaien: npm run herkomst:test
 */

import {
  bepaalBronEnMedium,
  bepaalHerkomst,
  hostUitUrl,
  isGeldigeHerkomst,
  leesGaClientId,
  leesGclid,
  zonderWww,
} from "./herkomst";

let gefaald = 0;
let geslaagd = 0;

function ok(omschrijving: string, waar: boolean) {
  if (waar) { geslaagd++; console.log(`  ✓ ${omschrijving}`); }
  else { gefaald++; console.log(`  ✗ ${omschrijving}`); }
}

function eq(omschrijving: string, gekregen: unknown, verwacht: unknown) {
  const gelijk = JSON.stringify(gekregen) === JSON.stringify(verwacht);
  if (!gelijk) {
    console.log(`    verwacht: ${JSON.stringify(verwacht)}`);
    console.log(`    gekregen: ${JSON.stringify(gekregen)}`);
  }
  ok(omschrijving, gelijk);
}

const EIGEN = "www.doehetextra.nl";
const bm = (zoek: string, verwijzer: string) => bepaalBronEnMedium(zoek, verwijzer, EIGEN);

console.log("\nHOSTNAAM UITLEZEN\n");

eq("gewone url", hostUitUrl("https://www.google.nl/search?q=uitzendbureau"), "www.google.nl");
eq("hoofdletters worden klein", hostUitUrl("https://WWW.Google.NL/"), "www.google.nl");
eq("onzin geeft leeg", hostUitUrl("niet-een-url"), "");
eq("lege string geeft leeg", hostUitUrl(""), "");
eq("www eraf", zonderWww("www.google.nl"), "google.nl");
eq("zonder www blijft gelijk", zonderWww("chatgpt.com"), "chatgpt.com");

console.log("\nUTM WINT ALTIJD\n");

eq("source en medium uit utm", bm("?utm_source=nieuwsbrief&utm_medium=email", ""), { source: "nieuwsbrief", medium: "email" });
eq("utm wint van de verwijzer", bm("?utm_source=folder&utm_medium=print", "https://www.google.nl/"), { source: "folder", medium: "print" });
eq("alleen utm_source wordt referral", bm("?utm_source=partner", ""), { source: "partner", medium: "referral" });
eq("alleen utm_medium houdt source leeg", bm("?utm_medium=cpc", ""), { source: "(not set)", medium: "cpc" });
eq("vraagteken mag ontbreken", bm("utm_source=nieuwsbrief&utm_medium=email", ""), { source: "nieuwsbrief", medium: "email" });

console.log("\nZOEKMACHINES\n");

eq("google.nl", bm("", "https://www.google.nl/"), { source: "google", medium: "organic" });
eq("google.com", bm("", "https://www.google.com/"), { source: "google", medium: "organic" });
eq("google.co.uk", bm("", "https://www.google.co.uk/"), { source: "google", medium: "organic" });
eq("bing", bm("", "https://www.bing.com/search?q=x"), { source: "bing", medium: "organic" });
eq("duckduckgo", bm("", "https://duckduckgo.com/"), { source: "duckduckgo", medium: "organic" });

console.log("\nAI-ASSISTENTEN\n");

eq("chatgpt", bm("", "https://chatgpt.com/"), { source: "chatgpt.com", medium: "ai-assistant" });
eq("oude openai-url", bm("", "https://chat.openai.com/"), { source: "chatgpt.com", medium: "ai-assistant" });
eq("perplexity", bm("", "https://www.perplexity.ai/"), { source: "perplexity.ai", medium: "ai-assistant" });
eq("copilot", bm("", "https://copilot.microsoft.com/"), { source: "copilot", medium: "ai-assistant" });
eq("claude", bm("", "https://claude.ai/"), { source: "claude.ai", medium: "ai-assistant" });
eq(
  "gemini telt als AI en niet als google",
  bm("", "https://gemini.google.com/app"),
  { source: "gemini", medium: "ai-assistant" },
);

console.log("\nSOCIAL EN OVERIG\n");

eq("instagram", bm("", "https://www.instagram.com/"), { source: "instagram.com", medium: "social" });
eq("linkedin", bm("", "https://nl.linkedin.com/"), { source: "nl.linkedin.com", medium: "social" });
eq("onbekende site wordt referral", bm("", "https://horecatrends.com/artikel"), { source: "horecatrends.com", medium: "referral" });
eq("geen verwijzer is direct", bm("", ""), { source: "(direct)", medium: "(none)" });
eq("onzinverwijzer is direct", bm("", "javascript:void(0)"), { source: "(direct)", medium: "(none)" });
eq("eigen domein telt niet als bron", bm("", "https://www.doehetextra.nl/dagbetaling"), { source: "(direct)", medium: "(none)" });
eq("eigen domein zonder www ook niet", bm("", "https://doehetextra.nl/blog"), { source: "(direct)", medium: "(none)" });

console.log("\nGCLID\n");

eq("gclid wordt gelezen", leesGclid("?gclid=abc123"), "abc123");
eq("gclid tussen andere parameters", leesGclid("?utm_source=x&gclid=abc123&y=1"), "abc123");
eq("geen gclid geeft null", leesGclid("?utm_source=x"), null);
eq("lege gclid geeft null", leesGclid("?gclid="), null);

console.log("\nGA CLIENT ID\n");

eq("uit een normaal cookie", leesGaClientId("_ga=GA1.1.1234567890.1700000000"), "1234567890.1700000000");
eq("tussen andere cookies", leesGaClientId("foo=bar; _ga=GA1.1.99.88; _gid=x"), "99.88");
eq("andere versie werkt ook", leesGaClientId("_ga=GA2.3.55.44"), "55.44");
eq("geen ga-cookie geeft null", leesGaClientId("foo=bar"), null);
eq("leeg cookie geeft null", leesGaClientId(""), null);
eq("_ga_XXXX is niet hetzelfde cookie", leesGaClientId("_ga_ABC=GS1.1.17.1.0"), null);

console.log("\nHELE HERKOMST\n");

eq(
  "bezoek vanuit ChatGPT op de dagbetalingspagina",
  bepaalHerkomst({
    zoekstring: "",
    verwijzer: "https://chatgpt.com/",
    pad: "/dagbetaling",
    cookieTekst: "_ga=GA1.1.42.99",
    eigenHost: EIGEN,
  }),
  { source: "chatgpt.com", medium: "ai-assistant", landing_page: "/dagbetaling", gclid: null, ga_client_id: "42.99" },
);

eq(
  "advertentieklik zonder ga-cookie",
  bepaalHerkomst({
    zoekstring: "?gclid=xyz&utm_source=google&utm_medium=cpc",
    verwijzer: "https://www.google.nl/",
    pad: "/personeelsaanvraag",
    cookieTekst: "",
    eigenHost: EIGEN,
  }),
  { source: "google", medium: "cpc", landing_page: "/personeelsaanvraag", gclid: "xyz", ga_client_id: null },
);

eq(
  "leeg pad wordt de homepage",
  bepaalHerkomst({ zoekstring: "", verwijzer: "", pad: "", cookieTekst: "", eigenHost: EIGEN }).landing_page,
  "/",
);

console.log("\nTERUGLEZEN UIT OPSLAG\n");

const geldig = bepaalHerkomst({ zoekstring: "", verwijzer: "", pad: "/", cookieTekst: "", eigenHost: EIGEN });
ok("verse herkomst is geldig", isGeldigeHerkomst(geldig));
ok("na json heen en weer nog geldig", isGeldigeHerkomst(JSON.parse(JSON.stringify(geldig))));
ok("null is niet geldig", !isGeldigeHerkomst(null));
ok("lege string is niet geldig", !isGeldigeHerkomst(""));
ok("object zonder source is niet geldig", !isGeldigeHerkomst({ medium: "organic", landing_page: "/" }));
ok("lege source is niet geldig", !isGeldigeHerkomst({ ...geldig, source: "" }));
ok("gclid mag geen getal zijn", !isGeldigeHerkomst({ ...geldig, gclid: 5 }));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald\n`);
process.exit(gefaald > 0 ? 1 : 0);
