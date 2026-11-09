/**
 * Huistests: KPI & Rapportage, de cijfers van Job en de weken.
 * Run met:  npx tsx shared/kpiJob.test.ts
 */
import { berekenJobKpi, maandagVan, weeknummer, type KpiKandidaat, type KpiGesprek, type KpiDossier } from "./kpiJob";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

// Woensdag 11 november 2026, 12:00 (week 46)
const NU = new Date(2026, 10, 11, 12, 0);
const dag = (d: number, u = 10) => new Date(2026, 10, d, u, 0);
const k = (id: number, aangemeld: Date, o: Partial<KpiKandidaat> = {}): KpiKandidaat =>
  ({ id, createdAt: aangemeld, hasCv: false, interviewDate: null, interviewTime: null, status: "in_behandeling", label: "hotels", ...o });

const kandidaten: KpiKandidaat[] = [
  k(1, dag(9), { hasCv: true, interviewDate: "2026-11-12", interviewTime: "10:00:00" }),        // gepland
  k(2, dag(9), { hasCv: true, interviewDate: "2026-11-10", interviewTime: "14:00:00" }),        // verschenen (intake gestart)
  k(3, dag(10), { hasCv: true, interviewDate: "2026-11-10", interviewTime: "15:00:00" }),       // niet verschenen
  k(4, dag(10)),                                                                                 // geen reactie bij cv
  k(5, dag(10), { label: "logistiek" }),                                                         // geen reactie bij ervaring
  k(6, dag(11), { status: "aangenomen", hasCv: true, interviewDate: "2026-11-11" }),             // aangenomen
  k(7, dag(3)),                                                                                  // vorige week
  k(8, dag(2), { label: "events" }),                                                             // vorige week
];
const g = (candidateId: number, status: string, o: Partial<KpiGesprek> = {}): KpiGesprek =>
  ({ candidateId, status, laatsteOnderwerp: null, gestartAt: dag(9, 10), eersteAntwoordAt: null, cvAt: null, ...o });
const gesprekken: KpiGesprek[] = [
  g(1, "gepland", { eersteAntwoordAt: dag(9, 10).getTime() + 4 * 60000 as any, cvAt: dag(9, 12) }),
  g(2, "gepland", { eersteAntwoordAt: new Date(dag(9, 10).getTime() + 2 * 60000), cvAt: dag(9, 11) }),
  g(3, "plannen"),
  g(4, "geen_reactie", { laatsteOnderwerp: "cv" }),
  g(5, "geen_reactie", { laatsteOnderwerp: "ervaring" }),
];
const dossiers: KpiDossier[] = [
  { candidateId: 1, stap: "gesprek_gepland", intakeStatus: "niet_gestart", archiefReden: null },
  { candidateId: 2, stap: "gesprek_gepland", intakeStatus: "bezig", archiefReden: null },
  { candidateId: 3, stap: "archief", intakeStatus: "niet_gestart", archiefReden: "niet_verschenen" },
];

const maandag = maandagVan(NU);
test("Maandag van de week", maandag.getDate() === 9 && maandag.getHours() === 0);
test("Weeknummer (ISO)", weeknummer(NU) === 46 && weeknummer(new Date(2026, 0, 1)) === 1);

const r = berekenJobKpi({ kandidaten, gesprekken: gesprekken.map((x) => ({ ...x, eersteAntwoordAt: x.eersteAntwoordAt ? new Date(x.eersteAntwoordAt as any) : null })), dossiers, van: maandag, tot: null, label: null, nu: NU });
test("Deze week: 6 aanmeldingen", r.aanmeldingen === 6, String(r.aanmeldingen));
test("Vergelijking: vorige week tot hetzelfde moment (2 en 3 november)", r.vorigePeriode === 2 && r.vorigeWekenTerug === 1, String(r.vorigePeriode));
test("Trechter: gesprek met Job (of verder: de aangenomene zonder gesprek telt mee)", r.trechter.jobGestart === 6, String(r.trechter.jobGestart));
test("Trechter loopt nooit op", [r.trechter.aangemeld, r.trechter.jobGestart, r.trechter.vragenAf, r.trechter.cvBinnen, r.trechter.cvGoedgekeurd, r.trechter.gepland, r.trechter.verschenen, r.trechter.aangenomen].every((x, i, a) => i === 0 || x <= a[i - 1]));
test("Trechter: vragen beantwoord (gepland, plannen of kennismaking)", r.trechter.vragenAf === 4, String(r.trechter.vragenAf));
test("Trechter: cv binnen", r.trechter.cvBinnen === 4);
test("Trechter: cv goedgekeurd", r.trechter.cvGoedgekeurd === 4, String(r.trechter.cvGoedgekeurd));
test("Trechter: gepland", r.trechter.gepland === 4);
test("Trechter: verschenen (intake gestart of aangenomen)", r.trechter.verschenen === 2, String(r.trechter.verschenen));
test("Trechter: niet verschenen", r.trechter.nietVerschenen === 1);
test("Trechter: aangenomen", r.trechter.aangenomen === 1);
test("Opkomst: 2 van 3", r.opkomst === 67, String(r.opkomst));
test("Afhaken per laatste vraag", JSON.stringify(r.afhaak.map((a) => [a.label, a.aantal])) === JSON.stringify([["Cv sturen", 1], ["Ervaring", 1]]) || JSON.stringify(r.afhaak.map((a) => [a.label, a.aantal])) === JSON.stringify([["Ervaring", 1], ["Cv sturen", 1]]));
test("Snelheid: eerste antwoord mediaan 3 minuten", r.snelheid.eersteAntwoordMinuten === 3, String(r.snelheid.eersteAntwoordMinuten));
test("Snelheid: cv mediaan 1,5 uur", r.snelheid.cvUren === 1.5, String(r.snelheid.cvUren));
test("Snelheid: kennismaking in dagen", r.snelheid.kennismakingDagen !== null && r.snelheid.kennismakingDagen > 0);
test("Weken: 8 weken, de laatste is week 46", r.weken.length === 8 && r.weken[7].label === "wk 46" && r.weken[7].aanmeldingen === 6);
test("Weken: vorige week 2 aanmeldingen", r.weken[6].label === "wk 45" && r.weken[6].aanmeldingen === 2);

const l = berekenJobKpi({ kandidaten, gesprekken, dossiers, van: maandag, tot: null, label: "logistiek", nu: NU });
test("Label logistiek: alleen die kandidaten", l.aanmeldingen === 1 && l.trechter.jobGestart === 1 && l.trechter.vragenAf === 0 && l.weken[7].aanmeldingen === 1);

const leeg = berekenJobKpi({ kandidaten: [], gesprekken: [], dossiers: [], van: null, tot: null, label: null, nu: NU });
test("Leeg: geen fouten, opkomst onbekend", leeg.aanmeldingen === 0 && leeg.opkomst === null && leeg.vorigePeriode === null && leeg.snelheid.cvUren === null);

const tot = berekenJobKpi({ kandidaten, gesprekken, dossiers, van: dag(2, 0), tot: maandag, label: null, nu: NU });
test("Vorige week als periode: 2 aanmeldingen, tot is exclusief", tot.aanmeldingen === 2, String(tot.aanmeldingen));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
