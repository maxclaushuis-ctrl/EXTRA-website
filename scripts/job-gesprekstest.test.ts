/**
 * Huistest van de gesprekstest zelf (geen AI nodig): de spellingvergelijking en de status van een gesprek.
 * Draaien: npx tsx scripts/job-gesprekstest.test.ts
 */
process.env.TESTOMGEVING = "1";
import { gelijkeInhoud, verschillenInGroep, vingerafdruk, voerUit } from "./job-gesprekstest";
import { AANTAL_VAST, VERWACHT, vergelijk } from "./job-gesprekstest-vergelijk";
import { GESPREKKEN_V2 } from "./jobGesprekken";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

test("spelling: Opera en opera zijn gelijk", gelijkeInhoud("Opera", "opera"));
test("spelling: Opera en Mews verschillen", !gelijkeInhoud("Opera", "Mews"));
test("spelling: ja en nee verschillen", !gelijkeInhoud("ja", "nee"));
test("spelling: tikfouten in de taken tellen niet", gelijkeInhoud("Inchecken, uitchecken en reserveringen aanpassen", "inchecke uitchecke en reserveringe aanpasse"));
test("spelling: tikfouten bij de supervisor tellen niet", gelijkeInhoud("De briefing, de indeling van de bar en het aanspreekpunt voor de klant", "de brefing, indeling van de bar en aanspreekpunt voor de klant"));
test("spelling: zelfstandig tegenover niet zelfstandig ingecheckt is een verschil", !gelijkeInhoud("Zelfstandig ingecheckt", "Niet zelfstandig ingecheckt"));
test("spelling: andere taken zijn een verschil", !gelijkeInhoud("Inchecken en reserveringen", "Telefoon en de kassa"));
const v = verschillenInGroep([
  { naam: "a", punten: { taken: "inchecken", systeem: "Opera", engels: "ja" }, collega: false },
  { naam: "b", punten: { taken: "inchecke", systeem: "Mews", engels: "ja" }, collega: false },
]);
test("groep: Opera tegenover Mews is één verschil", v.length === 1 && /systeem/.test(v[0]), v.join(" | "));
const v2 = verschillenInGroep([
  { naam: "a", punten: { systeem: "Opera", engels: "ja" }, collega: false },
  { naam: "b", punten: { systeem: "opera" }, collega: true },
]);
test("groep: een ontbrekend punt en een andere collega zijn verschillen", v2.length === 2, v2.join(" | "));
const u1 = { toestand: "score", score: 72, eis: "voldaan", eisTekst: "Ervaring aan de receptie", collega: false };
const v3 = verschillenInGroep([
  { naam: "a", punten: { systeem: "Opera" }, collega: false, uitkomst: u1 },
  { naam: "b", punten: { systeem: "opera" }, collega: false, uitkomst: { ...u1, score: 64, eis: "af_te_wegen" } },
]);
test("groep: zelfde punten maar andere matchscore en functie-eis zijn verschillen", v3.length === 2 && /matchscore: 72 tegenover 64/.test(v3[0]) && /functie-eis/.test(v3[1]), v3.join(" | "));
test("groep: zelfde punten, zelfde uitkomst: geen verschil", verschillenInGroep([{ naam: "a", punten: { systeem: "Opera" }, collega: false, uitkomst: u1 }, { naam: "b", punten: { systeem: "opera" }, collega: false, uitkomst: { ...u1 } }]).length === 0);
// Vergelijking voor en na: alle verwachte gesprekken, volledige reeks, plannerweergave, beide afgerond.
const V = VERWACHT;
const gv = (naam: string, reeks: string[], model = "m") => ({ naam, model, status: "gefaald", fouten: [], vasteReeks: reeks, naReeks: { velden: {}, planner: ["Samenvatting: x"], status: "bezig" }, beurten: reeks.map((k) => ({ kandidaat: k, job: ["?"] })), velden: {}, planner: [], collega: [] });
const meting = (gs: any[], klaar = true) => ({ klaar, afgebroken: null, gesprekken: gs });
const alleVijf = () => V.map((v) => gv(v.naam, v.vast));
test("voor en na: alle reeksen volledig, beide afgerond: geen fout", vergelijk(meting(alleVijf()), meting(alleVijf())).fouten.length === 0, vergelijk(meting(alleVijf()), meting(alleVijf())).fouten.join(" | "));
test("voor en na: aan beide kanten hetzelfde gesprek weg is een fout", vergelijk(meting(alleVijf().slice(1)), meting(alleVijf().slice(1))).fouten.length === 2);
const afgebroken = () => alleVijf().map((g, i) => (i === 0 ? { ...g, vasteReeks: g.vasteReeks.slice(0, 1) } : g));
test("voor en na: beide op hetzelfde punt afgebroken is een fout", V[0].vast.length > 1 && vergelijk(meting(afgebroken()), meting(afgebroken())).fouten.length === 2);
test("voor en na: een ander bericht in de reeks is een fout", vergelijk(meting(alleVijf()), meting(alleVijf().map((g, i) => (i === 1 ? { ...g, vasteReeks: ["iets anders"] } : g)))).fouten.length === 1);
test("voor en na: geen plannerweergave is een fout", vergelijk(meting(alleVijf()), meting(alleVijf().map((g, i) => (i === 2 ? { ...g, naReeks: null } : g)))).fouten.length === 1);
test("voor en na: een meting die niet is afgerond is een fout", vergelijk(meting(alleVijf(), false), meting(alleVijf())).fouten.length === 1);
test("voor en na: per model, een model dat in de nameting ontbreekt telt per gesprek", vergelijk(meting([...alleVijf(), ...V.map((v) => gv(v.naam, v.vast, "m2"))]), meting(alleVijf())).fouten.length === AANTAL_VAST);
test("vingerafdruk: zelfde reeks, zelfde afdruk; andere reeks, andere afdruk", vingerafdruk(["a", "b"]) === vingerafdruk(["a", "b"]) && vingerafdruk(["a", "b"]) !== vingerafdruk(["ab"]));

// Laat vasteReeks intact om uitsluitend het werkelijke beurtlog te toetsen.
type TestBeurt = ReturnType<typeof gv>["beurten"][number];
const loggevallen: [string, (log: TestBeurt[]) => TestBeurt[], boolean][] = [
  ["ontbrekende laatste beurt", (log) => log.slice(0, -1), false],
  ["leeg beurtlog", () => [], false],
  ["gewijzigd kandidaatbericht", (log) => log.map((b) => ({ ...b, kandidaat: b.kandidaat + "!" })), false],
  ["omgekeerde volgorde", (log) => [...log].reverse(), false],
  ["geen antwoord", (log) => log.map((b) => ({ ...b, job: [] })), false],
  ["antwoord met alleen spaties", (log) => log.map((b) => ({ ...b, job: ["  "] })), false],
  ["extra beurt na de reeks", (log) => [...log, { kandidaat: "Bedankt", job: ["Graag gedaan"] }], true],
];
const langGesprek = V.find((g) => g.vast.length >= 2)!;
for (const [naam, wijzig, geldig] of loggevallen) {
  for (const kant of ["voormeting", "nameting"]) {
    const origineel = meting(alleVijf());
    const gewijzigd = meting(alleVijf().map((g) =>
      g.naam === langGesprek.naam ? { ...g, beurten: wijzig(g.beurten) } : g
    ));
    const resultaat = kant === "voormeting" ? vergelijk(gewijzigd, origineel) : vergelijk(origineel, gewijzigd);
    const klopt = geldig ? resultaat.fouten.length === 0 : resultaat.fouten.some((f) =>
      f.includes(langGesprek.naam) && f.includes(kant)
    );
    test(`beurtlog ${kant}: ${naam}`, klopt, resultaat.fouten.join(" | "));
  }
}

async function main() {
  // Een nep-AI die niets begrijpt: het gesprek moet gefaald of geslaagd zijn, nooit iets anders, en de status klopt met ok.
  const nep = async () => ({ inhoud: JSON.stringify({ soort: ["onduidelijk"], velden: {}, reactie: "", vraag: "", vraagt: null }), ms: 1, model: "nep" });
  const g = GESPREKKEN_V2.find((x) => x.naam === "V2 dat heb ik toch net gezegd")!;
  const u = await voerUit(g, nep as any, "nep");
  test("vaste reeks: het eerste bericht is het vastgelegde bericht en de reeks staat in de uitslag", u.beurten[0]?.kandidaat === "Dit heb ik toch net gezegd?" && u.vasteReeks?.join("|") === "Dit heb ik toch net gezegd?" && !!u.naReeks?.planner.length, u.beurten[0]?.kandidaat);
  const hk = GESPREKKEN_V2.find((x) => x.naam === "V2 housekeeping: wil het leren")!;
  const uh = await voerUit(hk, nep as any, "nep");
  test("vaste reeks: housekeeping leren krijgt precies de twee vastgelegde berichten, wat Job ook vraagt", uh.beurten.slice(0, 2).map((b) => b.kandidaat).join("|") === hk.vast!.join("|"), uh.beurten.slice(0, 2).map((b) => b.kandidaat).join("|"));
  test("status volgt de controles", (u.status === "gefaald") === !u.ok && u.status !== "niet uitgevoerd", u.status);
  test("alleen v2 gemarkeerd: gesprekken zonder sleutel", GESPREKKEN_V2.every((x) => x.alleenVersie2 === !x.sleutel));
  test("dertien voor-en-nagesprekken, elk met een vaste reeks", GESPREKKEN_V2.filter((x) => x.sleutel).length === AANTAL_VAST && AANTAL_VAST === 13 && GESPREKKEN_V2.filter((x) => x.sleutel).every((x) => x.vast?.length), GESPREKKEN_V2.filter((x) => x.sleutel).map((x) => x.naam).join(", "));
  test("spellingparen hebben per paar hetzelfde fictieve cv", (() => { const m = new Map<string, string>(); for (const x of GESPREKKEN_V2.filter((y) => y.groep)) { const c = JSON.stringify(x.cv || null); if (c === "null" || (m.has(x.groep!) && m.get(x.groep!) !== c)) return false; m.set(x.groep!, c); } return m.size === 2; })());
  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
