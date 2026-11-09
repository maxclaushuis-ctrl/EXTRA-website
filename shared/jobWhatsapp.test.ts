/**
 * Huistests: keuzes van Job als WhatsApp-knoppen.
 * Run met:  npx tsx shared/jobWhatsapp.test.ts
 */
import { knopTitel, whatsappKnoppen, keuzeUitNummer } from "./jobWhatsapp";
import { teksten } from "./jobRegels";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}`); }
}

const nl = teksten("nl");
const en = teksten("en");

test("Diensten: drie knoppen", JSON.stringify(whatsappKnoppen({ tekst: nl.diensten, keuzes: nl.dienstenKeuzes })) === JSON.stringify(["1 tot 2", "3 tot 4", "5 of meer"]));
test("Geen keuzes: geen knoppen", whatsappKnoppen({ tekst: "Vraag?" }) === null);
test("Vier keuzes: geen knoppen (genummerd)", whatsappKnoppen({ tekst: "x", keuzes: ["a", "b", "c", "d"] }) === null);
test("Te lange keuze wordt ingekort", knopTitel("Arbeid vrij toegestaan") === "Vrij toegestaan");

// Elke keuzelijst van Job past in WhatsApp-knoppen (hooguit 3, hooguit 20 tekens, uniek)
for (const [taal, t] of [["nl", nl], ["en", en]] as const) {
  for (const [naam, waarde] of Object.entries(t)) {
    if (!/Keuzes$/.test(naam) || !Array.isArray(waarde)) continue;
    const k = whatsappKnoppen({ tekst: "x", keuzes: waarde as string[] });
    test(`${taal} ${naam}: knoppen passen zonder afgekapte tekst`, !!k && k.every((x) => x.length <= 20) && (waarde as string[]).every((w) => w.length <= 20 || knopTitel(w) !== w.slice(0, 20)));
  }
}

test("Getikte korte knop wordt de volledige keuze", keuzeUitNummer("Vrij toegestaan", nl.werkautorisatieKeuzes) === "Arbeid vrij toegestaan");
test("Getikte knop die al kort is blijft gelijk", keuzeUitNummer("5 of meer", nl.dienstenKeuzes) === "5 of meer");
test("Nummer werkt nog", keuzeUitNummer("2", nl.werkgebiedKeuzes) === "Tot 35 km");
test("Vrije tekst blijft vrije tekst", keuzeUitNummer("Amsterdam en Haarlem", nl.werkgebiedKeuzes) === "Amsterdam en Haarlem");

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
