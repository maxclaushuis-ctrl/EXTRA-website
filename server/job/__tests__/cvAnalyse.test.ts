/**
 * Huistests cv-analyse (Job 3.0, fase 4): wat de AI teruggeeft wordt streng gecontroleerd.
 * Run met:  npx tsx server/job/__tests__/cvAnalyse.test.ts
 */
import { valideerAnalyse, soortVan } from "@shared/cvLezen";
import { FUNCTIE_MODELLEN } from "@shared/kandidaatMatch";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}
const hk = FUNCTIE_MODELLEN.housekeeping;
const v = valideerAnalyse({
  periodes: [
    { functie: "Housekeeper", werkgever: "Hotel X", soort: "zelfde", kerntaken: [0, 1, 1, 7, "x"], begin: "2024-03", einde: "tot heden" },
    { functie: "Kok", soort: "raar", begin: "maart 2020", einde: "03/2021" },
  ],
  certificaten: ["BHV", 5, ""],
  gesprek: { duurMaanden: 24, functie: "Housekeeping" },
}, hk);
test("Kerntaken: alleen geldige nummers, elk één keer", JSON.stringify(v.periodes[0].kerntaken) === "[0,1]");
test("Tot heden wordt heden", v.periodes[0].einde === "heden");
test("Onbekende soort wordt anders", v.periodes[1].soort === "anders");
test("Maart 2020 wordt 2020-03", v.periodes[1].begin === "2020-03", String(v.periodes[1].begin));
test("03/2021 wordt 2021-03", v.periodes[1].einde === "2021-03", String(v.periodes[1].einde));
test("Certificaten: alleen tekst", JSON.stringify(v.certificaten) === '["BHV"]');
test("Gesprek wordt een periode zonder datums", v.periodes[2]?.bron === "gesprek" && v.periodes[2].duurMaanden === 24);
test("Onzin van de AI geeft niets", valideerAnalyse({ periodes: "x", gesprek: { duurMaanden: -3 } }, hk).periodes.length === 0);
test("Soort bestand", soortVan("/objects/cv/a.PDF") === "pdf" && soortVan("x.docx") === "word" && soortVan("x.jpg") === "afbeelding" && soortVan("x.txt") === "anders");
console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
