/**
 * Huistests: momenten kiezen in WhatsApp (keuzelijst) en het antwoord daarop.
 * Run met:  npx tsx shared/jobPlanningLijst.test.ts
 */
import { gekozenMoment, momentenLijst, momentTitel, MAX_LIJST_MOMENTEN, GEEN_TIJD, type Moment } from "./jobPlanning";
import { lijstPayload } from "../server/whatsapp/metaClient";
import { momentAntwoord, teksten, type JobState } from "./jobRegels";
import { whatsappKnoppen } from "./jobWhatsapp";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}`); }
}

const m = (datum: string, tijd: string, interviewer = "Anna"): Moment => ({ datum, tijd, interviewer });
// do 12 nov 2026 en verder
const momenten: Moment[] = [
  m("2026-11-12", "10:00"), m("2026-11-12", "10:00", "Bram"), m("2026-11-12", "10:30"), m("2026-11-12", "11:00"), m("2026-11-12", "11:30"),
  m("2026-11-13", "09:00"), m("2026-11-13", "09:30"), m("2026-11-13", "10:00"), m("2026-11-13", "10:30"),
  m("2026-11-16", "13:00"), m("2026-11-16", "13:30"), m("2026-11-16", "14:00"),
  m("2026-11-17", "15:00"),
];

test("Titel kort en leesbaar (nl)", momentTitel(m("2026-11-12", "16:30"), "nl") === "do 12 nov 16:30");
test("Titel kort en leesbaar (en)", momentTitel(m("2026-11-12", "16:30"), "en") === "Thu 12 Nov 16:30");

const lijst = momentenLijst(momenten, "nl");
const rijen = lijst.flatMap((s) => s.rijen);
test("Hoogstens 10 regels in totaal (Meta)", rijen.length <= 10);
test(`Hoogstens ${MAX_LIJST_MOMENTEN} momenten plus "Geen tijd die past"`, rijen.length === MAX_LIJST_MOMENTEN + 1);
test("Laatste regel is Geen tijd die past", rijen[rijen.length - 1].titel === GEEN_TIJD.nl && rijen[rijen.length - 1].id === "moment:geen");
test("Hoogstens drie per dag", lijst.every((s) => s.rijen.length <= 3));
test("Dubbele tijd (twee interviewers) één keer", rijen.filter((r) => r.titel === "do 12 nov 10:00").length === 1);
test("Per dag een kopje", lijst[0].titel === "Donderdag 12 november" && lijst[1].titel === "Vrijdag 13 november");
test("Titels hoogstens 24 tekens, ids uniek", rijen.every((r) => r.titel.length <= 24) && new Set(rijen.map((r) => r.id)).size === rijen.length);
test("Kopjes hoogstens 24 tekens (ook Engels)", momentenLijst([m("2026-09-16", "10:00")], "en").every((s) => s.titel.length <= 24));
test("Vroegste momenten eerst", rijen[0].id === "moment:2026-11-12T10:00");
test("Geen vrije momenten: geen lijst", momentenLijst([], "nl").length === 0);

const k = gekozenMoment("do 12 nov 10:30", momenten);
test("Gekozen regel wordt datum en tijd", typeof k === "object" && k?.datum === "2026-11-12" && k?.tijd === "10:30");
const ke = gekozenMoment("Fri 13 Nov 09:30", momenten);
test("Engelse regel ook", typeof ke === "object" && ke?.datum === "2026-11-13" && ke?.tijd === "09:30");
test("Geen tijd die past", gekozenMoment("Geen tijd die past", momenten) === "geen" && gekozenMoment("No time that suits", momenten) === "geen");
test("Regel die niet meer vrij is: bezet", gekozenMoment("wo 11 nov 10:00", momenten) === "bezet");
test("Gewone tekst: geen keuze", gekozenMoment("kan ik ook zaterdag?", momenten) === null && gekozenMoment("", momenten) === null);

const p: any = lijstPayload("31600000000", "x".repeat(1100), "Kies een moment voor je gesprek", lijst);
test("Payload: interactieve lijst", p.type === "interactive" && p.interactive.type === "list");
test("Payload: body hoogstens 1024, knop hoogstens 20", p.interactive.body.text.length === 1024 && p.interactive.action.button.length <= 20);
test("Payload: regels met id en titel", p.interactive.action.sections[0].rows[0].id === "moment:2026-11-12T10:00" && p.interactive.action.sections[0].rows[0].title === "do 12 nov 10:00");

const nl = teksten("nl");
test("Knoptekst lijst past (hoogstens 20)", nl.momentKnop.length <= 20 && teksten("en").momentKnop.length <= 20);
test("Verzetten wordt een knop", JSON.stringify(whatsappKnoppen({ tekst: "x", keuzes: [nl.verzettenKnop] })) === JSON.stringify(["Verzetten"]));

const s = { status: "plannen", taal: "nl", twijfels: [], velden: {}, herinneringen: 1, herinneringAt: "2026-11-10T10:00:00Z" } as unknown as JobState;
const nu = new Date("2026-11-10T12:00:00Z");
const geen = momentAntwoord(s, "geen", nu);
test("Geen tijd: naar een collega", geen.state.status === "planner" && geen.acties.some((a) => a.soort === "planner") && geen.berichten[0].tekst === nl.geenMomentPast);
test("Geen tijd: geen herinneringen meer, laatste bericht bijgewerkt", geen.state.herinneringen === 0 && geen.state.laatsteInkomendAt === nu.toISOString());
const blijft = momentAntwoord(s, "geen", nu, true);
test("Geen tijd bij verzetten: afspraak blijft, wel een collega", blijft.state.status === "gepland" && blijft.acties.some((a) => a.soort === "planner") && blijft.berichten[0].tekst === nl.geenMomentAfspraakBlijft);
const bezet = momentAntwoord(s, "bezet", nu);
test("Bezet: lijst opnieuw, status blijft plannen", bezet.state.status === "plannen" && bezet.berichten[0].planning === true && bezet.acties.length === 0);
test("Oude state niet aangepast", s.twijfels.length === 0 && s.status === "plannen");

const teksts = [nl.momentKnop, nl.geenMomentPast, nl.momentBezet, nl.geenMomentAfspraakBlijft, teksten("en").geenMomentAfspraakBlijft, nl.agendaWa("https://x"), teksten("en").geenMomentPast, teksten("en").momentBezet, GEEN_TIJD.nl, GEEN_TIJD.en];
test("Geen gedachtestreepjes in de nieuwe teksten", teksts.every((t) => !/[–—]/.test(t)));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
