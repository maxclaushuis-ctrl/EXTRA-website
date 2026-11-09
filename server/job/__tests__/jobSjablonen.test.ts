/**
 * Huistests: de WhatsApp-sjablonen van Job en de herinnering bij het plannen.
 * Run met:  npx tsx server/job/__tests__/jobSjablonen.test.ts
 */
import { SJABLOON_DEFS, NAMEN, START_OUD, componenten, sjabloonNaam, startParameters } from "../jobSjablonen";
import { planHerinneringNodig, planHerinnering, nieuweState, teksten, ervaringWerk, type JobState } from "@shared/jobRegels";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

async function main() {
  test("zes sjablonen: drie soorten in NL en EN", SJABLOON_DEFS.length === 6 && (["start", "herinnering", "afspraak"] as const).every((s) => ["nl", "en"].every((t) => SJABLOON_DEFS.some((d) => d.soort === s && d.taal === t))));
  test("namen zoals in docs/JOB.md", NAMEN.start === "job_start_v2" && START_OUD === "job_start" && NAMEN.herinnering === "job_herinnering" && NAMEN.afspraak === "job_afspraak");
  // Startsjabloon v2: de kern van elke eerste vraag past in "Vertel eens: {{3}}?" / "Tell me: {{3}}?"
  for (const taal of ["nl", "en"] as const) {
    for (const functie of ["housekeeping", "chef", "logistiek", "horecamedewerker", "frontoffice"]) {
      const vraag = teksten(taal).ervaring(functie);
      const p = startParameters(NAMEN.start, "Lisa", "x", vraag, ervaringWerk(functie, taal));
      const def = SJABLOON_DEFS.find((d) => d.soort === "start" && d.taal === taal)!;
      const zin = def.tekst.replace("{{1}}", p[0]).replace("{{2}}", p[1]).replace("{{3}}", p[2]);
      test(`start v2 ${taal}/${functie}: eindigt met precies de eerste vraag`, zin.endsWith(vraag), zin.split("\n").pop());
    }
  }
  test("oud startsjabloon krijgt de hele vraag", startParameters(START_OUD, "Lisa", "x", "Vertel eens: waar?", "housekeeping")[2] === "Vertel eens: waar?");
  test("start v2: welkomstregel met witregel na de naam", /^Hi \{\{1\}\},\n\n/.test(SJABLOON_DEFS.find((d) => d.soort === "start" && d.taal === "nl")!.tekst));
  for (const d of SJABLOON_DEFS) {
    const vars = (d.tekst.match(/\{\{\d\}\}/g) || []).length;
    const c = componenten(d);
    const label = `${d.soort}/${d.taal}`;
    test(`${label}: voorbeeld per variabele`, c[0].example.body_text[0].length === vars);
    test(`${label}: begint en eindigt niet met een variabele (regel van Meta)`, !/^\{\{/.test(d.tekst) && !/\}\}\s*$/.test(d.tekst));
    test(`${label}: geen regeleinden in voorbeeldwaarden`, d.voorbeeld.every((v) => !/\n/.test(v)));
    if (d.knoppen) test(`${label}: snelle antwoorden max 20 tekens`, c[1].type === "BUTTONS" && c[1].buttons.every((b: any) => b.type === "QUICK_REPLY" && b.text.length <= 20));
    test(`${label}: geen gedachtestreepjes`, !/[–—]/.test(d.tekst));
  }
  const oud = process.env.WHATSAPP_PROVIDER;
  delete process.env.WHATSAPP_PROVIDER;
  process.env.JOB_WA_SJABLOON_START = "eigen_start";
  test("Secret gaat voor", (await sjabloonNaam("start")) === "eigen_start");
  delete process.env.JOB_WA_SJABLOON_START;
  test("zonder Meta en zonder Secret: geen sjabloon", (await sjabloonNaam("herinnering")) === "");
  if (oud) process.env.WHATSAPP_PROVIDER = oud;

  const nu = new Date("2026-11-08T12:00:00Z");
  const uurTerug = (n: number) => new Date(nu.getTime() - n * 3600 * 1000).toISOString();
  const s = (o: Partial<JobState>): JobState => ({ ...nieuweState("nl", nu), status: "plannen", herinneringen: 0, herinneringAt: null, ...o });
  test("plannen: na 10 uur nog geen herinnering", !planHerinneringNodig(s({ laatsteActiviteitAt: uurTerug(10) }), nu));
  test("plannen: na 25 uur de eerste", planHerinneringNodig(s({ laatsteActiviteitAt: uurTerug(25) }), nu));
  test("plannen: tweede pas 48 uur na de eerste", !planHerinneringNodig(s({ herinneringen: 1, herinneringAt: uurTerug(30), laatsteActiviteitAt: uurTerug(60) }), nu) && planHerinneringNodig(s({ herinneringen: 1, herinneringAt: uurTerug(49), laatsteActiviteitAt: uurTerug(80) }), nu));
  test("plannen: na twee herinneringen niets meer", !planHerinneringNodig(s({ herinneringen: 2, herinneringAt: uurTerug(200), laatsteActiviteitAt: uurTerug(300) }), nu));
  test("alleen bij plannen", !planHerinneringNodig(s({ status: "gepland", laatsteActiviteitAt: uurTerug(100) }), nu));
  const r = planHerinnering(s({ laatsteActiviteitAt: uurTerug(25) }), { voornaam: "Lisa", functie: "horecamedewerker", nationalityZone: "NL", hasCv: true }, nu);
  test("planherinnering: telt op en heeft de planner", r.state.herinneringen === 1 && r.berichten[0].planning === true && r.berichten[0].tekst.startsWith("Hoi Lisa"));

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
