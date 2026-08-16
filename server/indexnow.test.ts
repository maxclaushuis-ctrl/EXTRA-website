/**
 * Unit-tests voor server/indexnow.ts
 * Run met:  npx tsx server/indexnow.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Zelfde opzet als server/redirects.test.ts.
 *
 * Er gaat geen enkel verzoek het net op: fetch wordt geïnjecteerd.
 */
import fs from "fs";
import path from "path";
import {
  INDEXNOW_SLEUTEL,
  INDEXNOW_ENDPOINT,
  MAX_PER_VERZOEK,
  normaliseerUrls,
  verdeel,
  bouwPayload,
  sleutelLocatie,
  duidStatus,
  meldAan,
  vergeetHerhaalvenster,
} from "./indexnow";

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

/** Stille logger — anders loopt de testuitvoer vol. */
const stil = { log: () => {}, warn: () => {} };

/** Nep-fetch die een vaste status teruggeeft en de verzoeken bewaart. */
function nepFetch(status = 200) {
  const verzoeken: { url: string; body: any }[] = [];
  const impl = (async (url: any, init: any) => {
    verzoeken.push({ url: String(url), body: JSON.parse(init.body) });
    return { status, ok: status < 400 } as any;
  }) as unknown as typeof fetch;
  return { impl, verzoeken };
}

console.log("\n— De sleutel —");
ok("hexadecimaal en tussen 8 en 128 tekens", /^[a-zA-Z0-9-]{8,128}$/.test(INDEXNOW_SLEUTEL));
{
  const bestand = path.resolve(import.meta.dirname, "..", "client", "public", `${INDEXNOW_SLEUTEL}.txt`);
  ok("het sleutelbestand staat in client/public", fs.existsSync(bestand), bestand);
  if (fs.existsSync(bestand)) {
    eq("en bevat exact de sleutel", fs.readFileSync(bestand, "utf-8").trim(), INDEXNOW_SLEUTEL);
  }
}
eq(
  "sleutelLocatie wijst naar de root van het canonieke domein",
  sleutelLocatie(),
  `https://www.doehetextra.nl/${INDEXNOW_SLEUTEL}.txt`
);

console.log("\n— normaliseerUrls() —");
eq("pad wordt absoluut", normaliseerUrls(["/blog/x"]), ["https://www.doehetextra.nl/blog/x"]);
eq(
  "volledige URL op het eigen domein blijft",
  normaliseerUrls(["https://www.doehetextra.nl/contact"]),
  ["https://www.doehetextra.nl/contact"]
);
eq("ander domein valt af", normaliseerUrls(["https://google.com/x"]), []);
eq("zonder www valt af (dat is het canonieke domein niet)", normaliseerUrls(["https://doehetextra.nl/x"]), []);
eq("dubbelen verdwijnen", normaliseerUrls(["/a", "/a", "/b"]), [
  "https://www.doehetextra.nl/a",
  "https://www.doehetextra.nl/b",
]);
eq("volgorde blijft", normaliseerUrls(["/z", "/a"]), [
  "https://www.doehetextra.nl/z",
  "https://www.doehetextra.nl/a",
]);
eq("#fragment gaat eraf", normaliseerUrls(["/contact#formulier"]), ["https://www.doehetextra.nl/contact"]);
eq("trailing slash gaat eraf", normaliseerUrls(["/contact/"]), ["https://www.doehetextra.nl/contact"]);
eq("de homepage blijft de homepage", normaliseerUrls(["/"]), ["https://www.doehetextra.nl/"]);
eq("lege waarden verdwijnen", normaliseerUrls(["", "   ", "/a"]), ["https://www.doehetextra.nl/a"]);
eq("lege lijst geeft lege lijst", normaliseerUrls([]), []);
eq("null crasht niet", normaliseerUrls(null as any), []);

console.log("\n— verdeel() —");
eq("kleine lijst blijft één groep", verdeel(["a", "b"]).length, 1);
eq("precies op de grens is één groep", verdeel(new Array(3).fill("x"), 3).length, 1);
eq("eentje erover wordt twee groepen", verdeel(new Array(4).fill("x"), 3).length, 2);
eq("lege lijst geeft geen groepen", verdeel([]).length, 0);
eq("de standaardgrens is 10.000", MAX_PER_VERZOEK, 10_000);

console.log("\n— bouwPayload() —");
{
  const p = bouwPayload(["https://www.doehetextra.nl/blog/x"]);
  eq("host zonder protocol", p.host, "www.doehetextra.nl");
  eq("sleutel meegestuurd", p.key, INDEXNOW_SLEUTEL);
  eq("sleutellocatie meegestuurd", p.keyLocation, sleutelLocatie());
  eq("urlList klopt", p.urlList, ["https://www.doehetextra.nl/blog/x"]);
}

console.log("\n— duidStatus() —");
ok("200 is geslaagd", duidStatus(200).includes("aangemeld"));
ok("403 wijst naar het sleutelbestand", duidStatus(403).includes("sleutel"));
ok("429 spreekt over wachten", duidStatus(429).includes("wachten"));
ok("onbekende code valt niet stil", duidStatus(500).includes("500"));

console.log("\n— meldAan(): wanneer wel en niet —");
{
  vergeetHerhaalvenster();
  const { impl, verzoeken } = nepFetch();
  const uit = await meldAan(["/blog/a"], { fetchImpl: impl, logger: stil });
  eq("buiten productie gaat er niets het net op", verzoeken.length, 0);
  eq("en de URL geldt als overgeslagen", uit.overgeslagen.length, 1);
}
{
  vergeetHerhaalvenster();
  const { impl, verzoeken } = nepFetch();
  await meldAan(["/blog/a"], { fetchImpl: impl, logger: stil, geforceerd: true });
  eq("geforceerd wél", verzoeken.length, 1);
  eq("naar het gedeelde endpoint", verzoeken[0].url, INDEXNOW_ENDPOINT);
  eq("met de juiste URL erin", verzoeken[0].body.urlList, ["https://www.doehetextra.nl/blog/a"]);
}
{
  vergeetHerhaalvenster();
  const { impl, verzoeken } = nepFetch();
  process.env.INDEXNOW_UIT = "1";
  await meldAan(["/blog/a"], { fetchImpl: impl, logger: stil, geforceerd: true });
  delete process.env.INDEXNOW_UIT;
  eq("INDEXNOW_UIT=1 zet alles stil", verzoeken.length, 0);
}
{
  vergeetHerhaalvenster();
  const { impl, verzoeken } = nepFetch();
  await meldAan([], { fetchImpl: impl, logger: stil, geforceerd: true });
  eq("lege lijst levert geen verzoek op", verzoeken.length, 0);
}
{
  vergeetHerhaalvenster();
  const { impl, verzoeken } = nepFetch();
  await meldAan(["https://ergens-anders.nl/x"], { fetchImpl: impl, logger: stil, geforceerd: true });
  eq("alleen vreemde URL's levert geen verzoek op", verzoeken.length, 0);
}

console.log("\n— meldAan(): niet dezelfde URL blijven melden —");
{
  vergeetHerhaalvenster();
  const { impl, verzoeken } = nepFetch();
  await meldAan(["/blog/a"], { fetchImpl: impl, logger: stil, geforceerd: true });
  const tweede = await meldAan(["/blog/a"], { fetchImpl: impl, logger: stil, geforceerd: true });
  eq("tweede melding binnen het venster gaat niet mee", verzoeken.length, 1);
  eq("en staat als overgeslagen genoteerd", tweede.overgeslagen, ["https://www.doehetextra.nl/blog/a"]);

  await meldAan(["/blog/b"], { fetchImpl: impl, logger: stil, geforceerd: true });
  eq("een ándere URL gaat wel gewoon mee", verzoeken.length, 2);

  await meldAan(["/blog/a"], { fetchImpl: impl, logger: stil, geforceerd: true, negeerHerhaalvenster: true });
  eq("bewust negeren kan", verzoeken.length, 3);
}

console.log("\n— meldAan(): foutafhandeling —");
{
  vergeetHerhaalvenster();
  const { impl } = nepFetch(429);
  const uit = await meldAan(["/blog/a"], { fetchImpl: impl, logger: stil, geforceerd: true });
  eq("een 429 telt niet als verzonden", uit.verzonden.length, 0);
  eq("en wordt gemeld als overgeslagen", uit.overgeslagen.length, 1);

  const { impl: impl2, verzoeken } = nepFetch(200);
  await meldAan(["/blog/a"], { fetchImpl: impl2, logger: stil, geforceerd: true });
  eq("een mislukte melding blokkeert de volgende poging niet", verzoeken.length, 1);
}
{
  vergeetHerhaalvenster();
  const stuk = (async () => { throw new Error("netwerk weg"); }) as unknown as typeof fetch;
  let geworpen = false;
  let uit: any;
  try {
    uit = await meldAan(["/blog/a"], { fetchImpl: stuk, logger: stil, geforceerd: true });
  } catch { geworpen = true; }
  ok("een kapot netwerk werpt niet — publiceren mag hier nooit op stuklopen", !geworpen);
  eq("en levert niets verzonden op", uit?.verzonden?.length, 0);
}
{
  vergeetHerhaalvenster();
  const { impl } = nepFetch(202);
  const uit = await meldAan(["/blog/a"], { fetchImpl: impl, logger: stil, geforceerd: true });
  eq("202 telt als geslaagd", uit.verzonden.length, 1);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
