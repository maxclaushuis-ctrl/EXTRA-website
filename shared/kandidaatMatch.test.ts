/**
 * Huistests kandidaatmatch (Job 3.0, fase 4): de rekenvoorbeelden uit hoofdstuk 8
 * en het afleiden van de invoer uit een cv-analyse. Fictieve kandidaten.
 * Run met:  npx tsx shared/kandidaatMatch.test.ts
 */
import { bereken, datumTekst, duurTekst, invoerVan, matchKaart, modelVoor, FUNCTIE_MODELLEN, type Invoer, type Periode } from "./kandidaatMatch";
const d = (min: number, max = min) => ({ min, max });
const V: [string, Invoer, Partial<ReturnType<typeof bereken>>][] = [
  ["Lotte, housekeeping", { soort: "vereist", eis: "voldaan", A: d(33), B: 2, C: d(2, 24), D: "nu" }, { score: 98, laag: 93, hoog: 100, dekking: 100, voorlopig: false }],
  ["Daan, front office", { soort: "vereist", eis: "voldaan", A: d(24), B: 2, C: d(39), D: 71 }, { score: 85, dekking: 100 }],
  ["Daan na antwoord", { soort: "vereist", eis: "voldaan", A: d(55), B: 2, C: d(39), D: "nu" }, { score: 100 }],
  ["Noor, housekeeping", { soort: "vereist", eis: "voldaan", A: d(13), B: 1, C: null, D: "nu" }, { score: 79, dekking: 90, voorlopig: true }],
  ["Kevin, kok", { soort: "vereist", eis: "onbekend", A: d(14, 36), B: "titel", C: null, D: 23 }, { score: 75, laag: 63, hoog: 92, dekking: 90, voorlopig: true, onzekerheid: "hoog" }],
  ["Kevin na vraag 1", { soort: "vereist", eis: "voldaan", A: d(14, 36), B: 1, C: null, D: 23 }, { score: 83, laag: 71, hoog: 83 }],
  ["Kevin na vraag 2", { soort: "vereist", eis: "voldaan", A: d(36, 58), B: 1, C: null, D: "nu" }, { score: 92, laag: 92, hoog: 92 }],
  ["Ilse, keukenassistent", { soort: "gewenst", eis: "geen", A: d(15), B: 1, C: null, D: "nu" }, { score: 84, dekking: 87 }],
  ["Ilse als kok", { soort: "vereist", eis: "niet_voldaan", A: 0, B: 0, C: d(15), D: null }, { toestand: "eis_niet_voldaan" }],
  ["Mila, afwas", { soort: "starters", eis: "geen", A: d(10), B: 1, C: null, D: null }, { score: 80, dekking: 80 }],
  ["Sem, runner", { soort: "starters", eis: "geen", A: 0, B: 0, C: null, D: null }, { score: 50, dekking: 80 }],
  ["Ruben als kok", { soort: "vereist", eis: "niet_voldaan", A: 0, B: 0, C: null, D: null }, { toestand: "eis_niet_voldaan" }],
  ["Bo, reachtruck", { soort: "vereist", eis: "onbekend", A: d(19), B: 2, C: null, D: "nu" }, { score: 88, dekking: 90, voorlopig: true }],
  ["Yara, front office", { soort: "vereist", eis: "voldaan", A: d(24), B: 2, C: null, D: 23 }, { score: 92, dekking: 90 }],
  ["Yara zonder correctie", { soort: "vereist", eis: "voldaan", A: d(46), B: 2, C: null, D: "nu" }, { score: 100 }],
  ["Ravi, orderpicken", { soort: "starters", eis: "geen", A: null, B: null, C: null, D: null }, { toestand: "onvoldoende" }],
  ["Fleur, housekeeping, alleen kantoorschoonmaak", { soort: "vereist", eis: "af_te_wegen", A: null, B: null, C: d(12), D: null }, { toestand: "onvoldoende", dekking: 10 }],
  ["Fleur, geen ervaring", { soort: "vereist", eis: "niet_voldaan", A: 0, B: 0, C: null, D: null }, { toestand: "eis_niet_voldaan" }],
];
let f = 0;
for (const [n, i, v] of V) {
  const u = bereken(i);
  const fout = Object.entries(v).filter(([k, x]) => (u as any)[k] !== x);
  if (fout.length) f++;
  console.log(`${fout.length ? "✗" : "✓"} ${n.padEnd(46)} ${u.toestand === "score" ? `${u.score} (${u.laag} tot ${u.hoog}) dekking ${u.dekking}% ${u.voorlopig ? "voorlopig " : ""}onzekerheid ${u.onzekerheid} · ${u.label}` : `${u.label} (dekking ${u.dekking}%)`}${fout.length ? "  VERWACHT " + JSON.stringify(Object.fromEntries(fout)) : ""}`);
}
// Eigenschappen
const basis: Invoer = { soort: "vereist", eis: "voldaan", A: d(24), B: 2, C: null, D: "nu" };
const nooitNul = bereken({ ...basis, A: null }).toestand === "onvoldoende";
console.log(`${nooitNul ? "✓" : "✗"} Onbekende ervaring geeft nooit 0/100 maar onvoldoende informatie`); if (!nooitNul) f++;
const geenOpblazen = bereken({ soort: "vereist", eis: "voldaan", A: d(30), B: null, C: null, D: null }).toestand === "onvoldoende";
console.log(`${geenOpblazen ? "✓" : "✗"} Alleen een paar positieve gegevens (dekking 45%): geen score`); if (!geenOpblazen) f++;

// Van cv-analyse naar invoer (peildatum november 2026)
const PEIL = new Date("2026-11-15T12:00:00Z");
const P = (x: Partial<Periode>): Periode => ({ functie: "x", soort: "zelfde", kerntaken: [], begin: null, einde: null, bron: "cv", ...x });
function check(naam: string, ok: boolean, uitleg = "") { console.log(`${ok ? "✓" : "✗"} ${naam}${ok ? "" : "  " + uitleg}`); if (!ok) f++; }
{
  const m = matchKaart(FUNCTIE_MODELLEN.housekeeping, [
    P({ functie: "Housekeeper", werkgever: "Hotel Amstelzicht", begin: "2024-03", einde: "heden", kerntaken: [0, 1] }),
    P({ functie: "Schoonmaker", soort: "verwant", begin: "2022", einde: "2023" }),
  ], [], {}, PEIL);
  check("Lotte uit periodes: 98, bandbreedte 93 tot 100", m.uitkomst.score === 98 && m.uitkomst.laag === 93 && m.uitkomst.hoog === 100 && m.eis.status === "voldaan", JSON.stringify(m.uitkomst));
}
{
  const m = matchKaart(FUNCTIE_MODELLEN.kok, [P({ functie: "Kok", werkgever: "Restaurant De Haven", begin: "2022", einde: "2024" })], [], {}, PEIL);
  check("Kevin uit periodes: 75 voorlopig, 63 tot 92, eis onbekend", m.uitkomst.score === 75 && m.uitkomst.laag === 63 && m.uitkomst.hoog === 92 && m.eis.status === "onbekend" && m.uitkomst.voorlopig, JSON.stringify(m.uitkomst));
  check("Kevin: aandachtspunt werkzaamheden onbekend", m.aandacht.some((a) => a.t === "Werkzaamheden onbekend"));
}
{
  const m = matchKaart(FUNCTIE_MODELLEN.orderpicken, [], [], {}, PEIL);
  check("Ravi zonder gegevens: onvoldoende informatie, geen getal", m.uitkomst.toestand === "onvoldoende" && m.uitkomst.score === undefined);
}
{
  const m = matchKaart(FUNCTIE_MODELLEN.housekeeping, [], [], { ervaringNiveau: "geen" }, PEIL);
  check("Fleur zelf geen ervaring: eis niet voldaan, geen score", m.uitkomst.toestand === "eis_niet_voldaan" && m.eis.status === "niet_voldaan");
}
{
  const m = matchKaart(FUNCTIE_MODELLEN.afwas, [P({ functie: "Afwasser", begin: "2025-02", einde: "2025-11", kerntaken: [0] })], [], {}, PEIL);
  check("Mila uit periodes: 80, starters welkom", m.uitkomst.score === 80 && m.eis.status === "geen", JSON.stringify(m.uitkomst));
}
{
  const m = matchKaart(FUNCTIE_MODELLEN.heftruck, [P({ functie: "Reachtruckchauffeur", begin: "2025-05", einde: "heden", kerntaken: [1, 2] })], [], {}, PEIL);
  check("Bo zonder certificaat: 88, eis onbekend", m.uitkomst.score === 88 && m.eis.status === "onbekend", JSON.stringify(m.uitkomst));
  const z = matchKaart(FUNCTIE_MODELLEN.heftruck, [P({ functie: "Reachtruckchauffeur", begin: "2025-05", einde: "heden", kerntaken: [1, 2] })], ["Certificaat reachtruck"], {}, PEIL);
  check("Bo met certificaat: eis voldaan", z.eis.status === "voldaan");
}
{
  // Ervaring alleen uit het gesprek, cv over ander werk
  const m = matchKaart(FUNCTIE_MODELLEN.housekeeping, [P({ functie: "Chef", soort: "anders", begin: "2016", einde: "2026" }), P({ functie: "Housekeeping", bron: "gesprek", duurMaanden: 24 })], [], {}, PEIL);
  check("Alleen gesprek: 24 maanden telt, voorlopig", m.uitkomst.toestand === "score" && m.uitkomst.voorlopig && m.berekening[0][3].includes("gesprek"), JSON.stringify(m.uitkomst));
}
{
  // Tegenstrijdig: cv 6 maanden, gesprek 2 jaar: score met de lage waarde, bandbreedte tot de hoge
  const laag = invoerVan(FUNCTIE_MODELLEN.housekeeping, [P({ begin: "2026-05", einde: "2026-10" }), P({ bron: "gesprek", duurMaanden: 24 })], [], {}, PEIL).invoer.A as any;
  check("Tegenstrijdig: cv 6, gesprek 24 geeft 6 tot 24", laag.min === 6 && laag.max === 24, JSON.stringify(laag));
}
{
  // Overlap telt één keer
  const a = invoerVan(FUNCTIE_MODELLEN.housekeeping, [P({ begin: "2025-01", einde: "2025-12" }), P({ begin: "2025-06", einde: "2026-05" })], [], {}, PEIL).invoer.A as any;
  check("Overlappende periodes: 17 maanden, niet 24", a.min === 17 && a.max === 17, JSON.stringify(a));
}
check("Datum leesbaar", datumTekst("2022-08") === "aug 2022" && datumTekst("heden") === "nu" && datumTekst("2024") === "2024");
check("Duur leesbaar", duurTekst(99, 109) === "8 tot 9 jaar" && duurTekst(33, 33) === "ruim 2 jaar" && duurTekst(14, 20) === "14 tot 20 maanden");
{
  const m = matchKaart(FUNCTIE_MODELLEN.kok, [P({ functie: "Souschef", begin: "2016", einde: "heden", kerntaken: [0, 1] })], [], { ervaringNiveau: "geen" }, PEIL);
  check("Gesprek zegt geen, cv wel: eis voldaan, verschil zichtbaar", m.eis.status === "voldaan" && m.aandacht[0]?.t === "Gesprek en cv verschillen", JSON.stringify(m.aandacht));
  check("Uitleg in jaren", m.uitleg.startsWith("10 tot 10 jaar") === false && /jaar ervaring in de functie/.test(m.uitleg), m.uitleg);
}
check("Indeling: keuken is zelfstandig werkend kok", modelVoor("keuken", "chef", "hotels").sleutel === "kok");
check("Indeling: afwas", modelVoor("afwas", "chef", "hotels").sleutel === "afwas");
check("Indeling: runner bij events", modelVoor("runner", "horecamedewerker", "events").sleutel === "events");
check("Indeling: bar is bediening restaurant en bar", modelVoor("bar", "horecamedewerker", "events").sleutel === "bediening");
check("Indeling: heftruck", modelVoor("heftruck", "logistiek", "logistiek").sleutel === "heftruck");
check("Indeling: orderpicker", modelVoor("orderpicker", "logistiek", "logistiek").sleutel === "orderpicken");
check("Indeling: oude housekeeping zonder keuze", modelVoor(null, "housekeeping", null).sleutel === "housekeeping");
process.exit(f ? 1 : 0);
