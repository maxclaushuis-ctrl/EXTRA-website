/**
 * Huistests cv-vragen (Job 3.0, fase 4): de voorbeelden uit hoofdstuk 8. Fictieve kandidaten.
 * Run met:  npx tsx shared/cvVragen.test.ts
 */
import { cvVraagVoor } from "./cvVragen";
import { FUNCTIE_MODELLEN as M, type Periode } from "./kandidaatMatch";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}
const peil = new Date("2026-11-15T12:00:00Z");
const P = (x: Partial<Periode>): Periode => ({ functie: "x", soort: "zelfde", kerntaken: [], begin: null, einde: null, bron: "cv", ...x });
const vraag = (model: keyof typeof M, periodes: Periode[], extra: Partial<Parameters<typeof cvVraagVoor>[0]> = {}) =>
  cvVraagVoor({ status: "klaar", model: M[model], periodes, certificaten: [], gesprek: {}, gesteld: [], peil, ...extra });

const kevin = [P({ functie: "Kok", werkgever: "Restaurant De Haven", begin: "2022", einde: "2024" })];
const k1 = vraag("kok", kevin);
test("Kevin: eerst de werkzaamheden bij De Haven", k1?.soort === "werkzaamheden" && k1.nl === "Welke werkzaamheden deed je bij Restaurant De Haven vooral?", JSON.stringify(k1));
const k2 = vraag("kok", [P({ functie: "Kok", werkgever: "Restaurant De Haven", begin: "2022", einde: "2024", kerntaken: [0] })], { gesteld: ["werkzaamheden"] });
test("Kevin na antwoord: of hij daarna nog als kok werkte", k2?.soort === "recent" && k2.nl.includes("loopt tot 2024"), JSON.stringify(k2));
test("Nooit meer dan twee vragen", vraag("kok", kevin, { gesteld: ["werkzaamheden", "recent"] }) === null);
test("Lotte: duidelijk cv, geen vraag", vraag("housekeeping", [P({ functie: "Housekeeper", begin: "2024-03", einde: "heden", kerntaken: [0, 1] }), P({ soort: "verwant", begin: "2022", einde: "2023" })]) === null);
test("Ravi: foto en geen ervaring uit het gesprek: om pdf of Word vragen", vraag("orderpicken", [], { status: "niet_leesbaar" })?.soort === "leesbaar");
test("Foto, maar het gesprek geeft ervaring: geen vraag", vraag("orderpicken", [], { status: "niet_leesbaar", gesprek: { ervaringNiveau: "ervaren" } }) === null);
test("Bo: certificaat onbekend", vraag("heftruck", [P({ functie: "Reachtruckchauffeur", begin: "2025-05", einde: "heden", kerntaken: [1, 2] })])?.soort === "certificaat");
test("Fleur: zelf geen ervaring: niets meer vragen", vraag("housekeeping", [], { gesprek: { ervaringNiveau: "geen" } }) === null);
const hk = vraag("housekeeping", [P({ functie: "Verkoper", soort: "anders", begin: "2023", einde: "heden" })]);
test("Housekeeping zonder ervaring in het cv: de ervaringsvraag uit het voorstel", hk?.soort === "ervaring" && hk.nl.startsWith("Heb je al ervaring met hotelkamers"), JSON.stringify(hk));
const daan = vraag("frontoffice", [P({ functie: "Receptionist", werkgever: "Hotel Y", begin: "2019-01", einde: "2020-12", kerntaken: [0, 1] }), P({ soort: "verwant", begin: "2021-01", einde: "2024-03" })]);
test("Daan: laatste receptie lang geleden, vraag of hij daarna nog zo werkte", daan?.soort === "recent" && daan.nl.includes("dec 2020"), JSON.stringify(daan));
test("Starters welkom: geen vraag over recent", vraag("afwas", [P({ functie: "Afwasser", begin: "2020-01", einde: "2021-01", kerntaken: [0] })]) === null);
test("Fout bij uitlezen: geen vraag", vraag("kok", [], { status: "fout" }) === null);
console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
