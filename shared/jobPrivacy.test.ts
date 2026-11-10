/**
 * Huistests: privacyfilter van Job. Alle nummers zijn fictief (testwaarden die
 * alleen de controle halen, geen echte personen).
 * Run met:  npx tsx shared/jobPrivacy.test.ts
 */
import { filterPrivacy, VERWIJDERD } from "./jobPrivacy";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}`); }
}

const weg = (t: string) => filterPrivacy(t);

// BSN (111222333 en 123456782 halen de elfproef, zijn testwaarden)
test("BSN los", weg("111222333").gevonden.includes("bsn") && weg("111222333").leeg);
test("BSN met spaties", weg("mijn bsn is 123 456 782").gevonden.includes("bsn"));
test("BSN met punten", weg("1234.56.782").gevonden.includes("bsn"));
test("9 cijfers zonder elfproef blijven staan", weg("123456789").gevonden.length === 0);
test("Telefoonnummer blijft staan", weg("bel me op 0612345678").gevonden.length === 0);

// IBAN (NL91ABNA0417164300 is het bekende voorbeeldnummer)
test("IBAN aan elkaar", weg("NL91ABNA0417164300").gevonden.includes("iban"));
test("IBAN met spaties", weg("rekening NL91 ABNA 0417 1643 00 graag").tekst.includes(VERWIJDERD));
test("IBAN met fout controlegetal blijft staan", weg("NL92ABNA0417164300").gevonden.length === 0);

// Documentnummer, alleen in een bericht over een document
test("Paspoortnummer", weg("mijn paspoortnummer is XR1234567").gevonden.includes("document"));
test("Zelfde patroon zonder document blijft staan", weg("ik werkte bij HOTEL2024").gevonden.length === 0);

// Adres
test("Straat en huisnummer", weg("ik woon op de Kalverstraat 12").gevonden.includes("adres"));
test("Postcode met huisnummer", weg("1012 AB 5").gevonden.includes("adres"));
test("Losse postcode", weg("postcode 1012AB").gevonden.includes("adres"));

// Gewone antwoorden blijven heel
for (const t of [
  "2 jaar ervaring in de housekeeping",
  "Ik werkte bij de supermarkt 3 jaar",
  "Als hoofdbaan 20 uur",
  "Van 2019 en 2020 bij Hotel Amstelzicht",
  "4 sterren",
  "alleen zaterdagavond",
  "vanaf januari",
  "Ik woon in Amsterdam Zuid",
  "Singel 3 jaar gewerkt",
]) test(`Blijft staan: "${t}"`, weg(t).gevonden.length === 0 && weg(t).tekst === t);

// Inhoud naast het gefilterde blijft bruikbaar
const gemengd = weg("2 jaar housekeeping, mijn bsn is 111222333");
test("Gemengd: antwoord blijft, nummer weg", gemengd.tekst.includes("2 jaar housekeeping") && !gemengd.tekst.includes("111222333") && !gemengd.leeg);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
