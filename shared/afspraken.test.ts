/**
 * Huistests: Kandidaten en afspraken (schakelaar KANDIDATEN_AFSPRAKEN): kleuren en volgende stap,
 * 48 uur voorloop, agenda, derde herinnering op de uitnodiging en andere tijden aanbieden.
 * Draaien: npm run afspraken:test
 */
import { afspraakStatus, AFSPRAAK, BEL_REGEL, type KandidaatInvoer } from "./kandidaatRegels";
import { afsprakenAan, agenda, momentGeldig, voorloopUur, vrijeMomenten, STANDAARD_INTERVIEWERS, type Moment } from "./jobPlanning";
import { planHerinneringNodig, momentAntwoord, ANDERE_TIJDEN_TWIJFEL, type JobState } from "./jobRegels";
import { geenTijd, gekozenVoorkeur, momentenVoorVoorkeur, sleutel, voorkeurAntwoord, voorkeurLijst, MAX_RONDEN, type AndereTijden } from "./andereTijden";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

const nu = new Date("2026-11-18T12:00:00Z"); // woensdag 13:00 in Nederland
const uurTerug = (n: number) => new Date(nu.getTime() - n * 3600 * 1000).toISOString();
const basis = (o: Partial<KandidaatInvoer> = {}): KandidaatInvoer => ({
  status: "in_behandeling", interviewDate: null, createdAt: uurTerug(50), birthDate: "2000-01-01", woonland: null,
  functie: "horecamedewerker", nationalityZone: "NL", hasCv: true, job: null, matchOpen: null, ...o,
});
const job = (o: Partial<NonNullable<KandidaatInvoer["job"]>> = {}) => ({
  status: "planner", kanaal: "whatsapp", herinneringen: 0, herinneringAt: null, laatsteActiviteitAt: uurTerug(3), bijgewerktAt: uurTerug(3), velden: {}, twijfels: [], ...o,
});

// ─── Kleuren en volgende stap ────────────────────────────────────────────────
const geel = afspraakStatus(basis({ job: job({ status: "cv_controle" }) }));
test("geel: Beoordelen", geel.kleur === "geel" && geel.label === "Beoordelen");
test("geel: volgende stap Afspraak maken of afwijzen", geel.stap === "Afspraak maken of afwijzen");
test("geel ook zonder Job", afspraakStatus(basis()).kleur === "geel");
const oranje = afspraakStatus(basis({ status: "gepland", job: job({ status: "plannen" }) }));
test("oranje: afspraak aangeboden, volgende stap Afspraakbevestiging", oranje.kleur === "oranje" && oranje.label === "Afspraak aangeboden" && oranje.stap === "Afspraakbevestiging");
test("oranje zonder regel bij de eerste herinneringen", oranje.sub === null && afspraakStatus(basis({ status: "gepland", job: job({ status: "plannen", herinneringen: 2 }) })).sub === null);
test("oranje na drie herinneringen: bel hem of haar", afspraakStatus(basis({ status: "gepland", job: job({ status: "plannen", herinneringen: 3 }) })).sub === BEL_REGEL);
const rood = afspraakStatus(basis({ status: "gepland", job: job({ status: "planner", twijfels: [ANDERE_TIJDEN_TWIJFEL], velden: { andereTijden: { ronde: 2, wacht: false, aangeboden: [], voorkeur: "dinsdag" } } }) }));
test("rood: wil andere tijden, volgende stap uit het besluit", rood.kleur === "rood" && rood.label === "Wil andere tijden" && rood.stap === "Bevestig zijn tijden of biedt andere tijden aan");
test("rood toont de voorkeur van de kandidaat", rood.sub === "Voorkeur: dinsdag");
test("planner met een andere twijfel is geen rood", afspraakStatus(basis({ status: "gepland", job: job({ status: "planner", twijfels: ["Kandidaat vroeg om een collega (MENS)."] }) })).kleur === "oranje");
test("na opnieuw aanbieden (status plannen) weer oranje, ook met oude twijfel", afspraakStatus(basis({ status: "gepland", job: job({ status: "plannen", twijfels: [ANDERE_TIJDEN_TWIJFEL] }) })).kleur === "oranje");
test("de teksten bevatten geen gedachtestreepjes", !/[\u2013\u2014]/.test(JSON.stringify(AFSPRAAK) + BEL_REGEL));

// ─── Schakelaar en 48 uur ────────────────────────────────────────────────────
test("schakelaar: testomgeving vanzelf aan", afsprakenAan({ TESTOMGEVING: "1" }));
test("schakelaar: testomgeving uit met 0", !afsprakenAan({ TESTOMGEVING: "1", KANDIDATEN_AFSPRAKEN: "0" }));
test("schakelaar: elders alleen met 1", !afsprakenAan({}) && !afsprakenAan({ KANDIDATEN_AFSPRAKEN: "ja" }) && afsprakenAan({ KANDIDATEN_AFSPRAKEN: "1" }));
test("voorloop: 48 uur met schakelaar, anders 12", voorloopUur({ TESTOMGEVING: "1" }) === 48 && voorloopUur({}) === 12);

const volgorde = (ms: Moment[]) => ms.map((m) => `${m.datum} ${m.tijd}`);
const oud = vrijeMomenten(STANDAARD_INTERVIEWERS, [], nu);
const nieuw = vrijeMomenten(STANDAARD_INTERVIEWERS, [], nu, 14, 48);
test("zonder schakelaar blijft donderdag 10:30 mogelijk (12 uur)", volgorde(oud)[0] === "2026-11-19 13:00" || volgorde(oud)[0] === "2026-11-19 10:30");
test("met 48 uur: niets voor vrijdag 13:00 (Nederlandse tijd)", volgorde(nieuw).every((x) => x >= "2026-11-20 13:00"), volgorde(nieuw)[0]);
test("met 48 uur: het eerste moment is vrijdag 13:00", volgorde(nieuw)[0] === "2026-11-20 13:00", volgorde(nieuw)[0]);
test("met 48 uur blijft het binnen 14 dagen", volgorde(nieuw).every((x) => x.slice(0, 10) <= "2026-12-02"));
test("momentGeldig weigert donderdag met 48 uur, accepteert hem met 12", !momentGeldig(STANDAARD_INTERVIEWERS, [], nu, { datum: "2026-11-19", tijd: "14:00" }, 48) && !!momentGeldig(STANDAARD_INTERVIEWERS, [], nu, { datum: "2026-11-19", tijd: "14:00" }));
test("momentGeldig accepteert vrijdag 14:00 met 48 uur", !!momentGeldig(STANDAARD_INTERVIEWERS, [], nu, { datum: "2026-11-20", tijd: "14:00" }, 48));
test("een bezet moment is niet geldig", !momentGeldig(STANDAARD_INTERVIEWERS, [{ interviewer: "Lea", datum: "2026-11-20", tijd: "14:00" }, { interviewer: "Charlotte", datum: "2026-11-20", tijd: "14:00" }], nu, { datum: "2026-11-20", tijd: "14:00" }, 48));

// ─── Agenda ──────────────────────────────────────────────────────────────────
const ag = agenda(STANDAARD_INTERVIEWERS, [{ interviewer: "Lea", datum: "2026-11-20", tijd: "14:00", wie: "Daan P." }], nu, 14, 48);
const dag = (d: string) => ag.find((x) => x.datum === d);
const cel = (d: string, tijd: string, wie: string) => dag(d)?.rijen.find((r) => r.tijd === tijd)?.cellen.find((c) => c.interviewer === wie);
test("agenda: start morgen, zonder weekend", ag[0].datum === "2026-11-19" && !dag("2026-11-21") && !dag("2026-11-22"));
test("agenda: donderdag 10:30 is te vroeg (binnen 48 uur)", cel("2026-11-19", "10:30", "Charlotte")?.status === "te_vroeg");
test("agenda: Lea werkt 10:30 niet", cel("2026-11-20", "10:30", "Lea")?.status === "niet");
test("agenda: pauze van Charlotte om 12:00", cel("2026-11-20", "12:00", "Charlotte")?.status === "pauze");
test("agenda: vrijdag 14:00 Lea bezet, met de naam", cel("2026-11-20", "14:00", "Lea")?.status === "bezet" && cel("2026-11-20", "14:00", "Lea")?.wie === "Daan P.");
test("agenda: vrijdag 14:00 Charlotte is vrij", cel("2026-11-20", "14:00", "Charlotte")?.status === "vrij");
test("agenda: niets bezet buiten wat gepland is", ag.flatMap((d) => d.rijen.flatMap((r) => r.cellen)).filter((c) => c.status === "bezet").length === 1);

// ─── Herinneringen op de uitnodiging ─────────────────────────────────────────
const plan = (herinneringen: number, activiteit: number, at: number | null): JobState => ({
  taal: "nl", status: "plannen", velden: {}, laatsteOnderwerp: null, twijfels: [], herinneringen,
  herinneringAt: at === null ? null : uurTerug(at), laatsteInkomendAt: null, laatsteActiviteitAt: uurTerug(activiteit),
});
test("herinnering 1 na 24 uur, niet eerder", planHerinneringNodig(plan(0, 24, null), nu) && !planHerinneringNodig(plan(0, 23, null), nu));
test("herinnering 2 na 48 uur", planHerinneringNodig(plan(1, 80, 48), nu) && !planHerinneringNodig(plan(1, 80, 47), nu));
test("zonder schakelaar stopt het na twee", !planHerinneringNodig(plan(2, 200, 60), nu));
test("met schakelaar komt er een derde na 48 uur", planHerinneringNodig(plan(2, 200, 48), nu, 3) && !planHerinneringNodig(plan(2, 200, 47), nu, 3));
test("na drie is het klaar, ook met schakelaar", !planHerinneringNodig(plan(3, 400, 100), nu, 3));
test("STOP blokkeert de herinneringen", !planHerinneringNodig({ ...plan(0, 30, null), velden: { herinneringenUit: true } as any }, nu, 3));

// ─── Andere tijden aanbieden ─────────────────────────────────────────────────
const ms = nieuw;
const eersteLijst = ["2026-11-20T13:00", "2026-11-20T13:30", "2026-11-20T14:00"];
test("voorkeurlijst: hoogstens 10 regels, titels hooguit 24 tekens", voorkeurLijst("nl").flatMap((x) => x.rijen).length <= 10 && voorkeurLijst("nl").flatMap((x) => [x.titel, ...x.rijen.map((r) => r.titel)]).every((t) => t.length <= 24));
test("voorkeurlijst: geen gedachtestreepjes", !/[\u2013\u2014]/.test(JSON.stringify(voorkeurLijst("nl")) + JSON.stringify(voorkeurLijst("en"))));
test("voorkeur herkend: Dinsdag, Middag, Later dan deze", JSON.stringify(gekozenVoorkeur("Dinsdag")) === '{"soort":"dag","dag":2}' && gekozenVoorkeur("middag")?.soort === "deel" && gekozenVoorkeur("Later dan deze")?.soort === "later");
test("voorkeur herkend in het Engels", gekozenVoorkeur("Tuesday")?.soort === "dag" && gekozenVoorkeur("Call me instead")?.soort === "bellen");
test("een gewoon antwoord is geen voorkeur", gekozenVoorkeur("ik kan nooit") === null && gekozenVoorkeur("") === null);

const v1 = geenTijd(undefined, eersteLijst, "nl");
test("Geen tijd die past: Job vraagt eerst wat beter past", v1.soort === "vraag" && v1.staat.wacht && v1.staat.ronde === 0 && v1.staat.aangeboden.length === 3);
const dinsdag = gekozenVoorkeur("Dinsdag")!;
const a1 = voorkeurAntwoord((v1 as any).staat, dinsdag, ms, "nl");
test("Dinsdag: maximaal drie momenten, allemaal op dinsdag", a1.soort === "aanbod" && a1.momenten.length === 3 && a1.momenten.every((m) => new Date(`${m.datum}T12:00:00Z`).getUTCDay() === 2));
test("de ronde telt op en de momenten worden onthouden", a1.soort === "aanbod" && a1.staat.ronde === 1 && !a1.staat.wacht && a1.staat.aangeboden.length === 6 && a1.staat.voorkeur === "dinsdag");
const v2 = geenTijd((a1 as any).staat, a1.soort === "aanbod" ? a1.momenten.map(sleutel) : [], "nl");
test("past het weer niet: tweede ronde, Job vraagt opnieuw", v2.soort === "vraag" && v2.staat.ronde === 1);
const a2 = voorkeurAntwoord((v2 as any).staat, gekozenVoorkeur("Middag")!, ms, "nl");
test("tweede ronde: Middag geeft andere momenten dan eerder", a2.soort === "aanbod" && a2.momenten.every((m) => m.tijd >= "12:00" && !(a1 as any).staat.aangeboden.includes(sleutel(m))) && a2.staat.ronde === 2);
const v3 = geenTijd((a2 as any).staat, [], "nl");
test(`na ${MAX_RONDEN} rondes is het aan een planner`, v3.soort === "planner" && v3.staat.ronde === 2);
test("liever gebeld worden: meteen een planner", voorkeurAntwoord((v1 as any).staat, gekozenVoorkeur("Liever gebeld worden")!, ms, "nl").soort === "planner");
test("niets vrij op die dag: een planner", voorkeurAntwoord({ ronde: 0, wacht: true, aangeboden: [] }, dinsdag, [], "nl").soort === "planner");
test("Later dan deze: alleen momenten na wat al is aangeboden", (() => {
  const l = momentenVoorVoorkeur(ms, { soort: "later" }, eersteLijst);
  return l.length === 3 && l.every((m) => sleutel(m) > "2026-11-20T14:00");
})());
test("Ochtend geeft geen middagmomenten", momentenVoorVoorkeur(ms, { soort: "deel", deel: "ochtend" }, []).every((m) => m.tijd < "12:00"));
test("al aangeboden momenten komen niet terug", !momentenVoorVoorkeur(ms, { soort: "dag", dag: 5 }, ["2026-11-20T13:00"]).some((m) => sleutel(m) === "2026-11-20T13:00"));

const st: JobState = plan(0, 5, null);
const pl = momentAntwoord({ ...st, velden: { andereTijden: v3.staat } as any }, "geen", nu, false);
test("rood: status planner met de twijfel, de voorkeur blijft bewaard", pl.state.status === "planner" && pl.state.twijfels.includes(ANDERE_TIJDEN_TWIJFEL) && (pl.state.velden as any).andereTijden.ronde === 2);
test("de planner krijgt een melding", pl.acties.some((a) => a.soort === "planner"));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
