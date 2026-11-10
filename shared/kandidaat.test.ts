/**
 * Huistests: Kandidaten 3.0 (shared/kandidaatRegels.ts) en het tellen van open vragen van Job.
 * Run met:  npx tsx shared/kandidaat.test.ts
 */
import { bolletje, inKandidaten, sindsTekst, plannerLabel, vergelijk, matchRedenen, type KandidaatInvoer } from "./kandidaatRegels";
import { openOnderwerpen } from "./jobRegels";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

const nu = new Date("2026-11-07T12:00:00Z");
const uurTerug = (n: number) => new Date(nu.getTime() - n * 3600 * 1000).toISOString();
const basis = (o: Partial<KandidaatInvoer> = {}): KandidaatInvoer => ({
  status: "in_behandeling", interviewDate: null, createdAt: uurTerug(5), birthDate: "2000-01-01", woonland: null,
  functie: "horecamedewerker", nationalityZone: "NL", hasCv: false, job: null, matchOpen: null, ...o,
});
const job = (o: Partial<NonNullable<KandidaatInvoer["job"]>> = {}) => ({
  status: "bezig", herinneringen: 0, herinneringAt: null, laatsteActiviteitAt: uurTerug(3), bijgewerktAt: uurTerug(3), velden: {}, twijfels: [], ...o,
});

test("in Kandidaten: in behandeling", inKandidaten({ status: "in_behandeling", interviewDate: null }));
test("in Kandidaten: uitgenodigd zonder datum", inKandidaten({ status: "gepland", interviewDate: null }));
test("niet in Kandidaten: gesprek gepland", !inKandidaten({ status: "gepland", interviewDate: "2026-11-10" }));
test("niet in Kandidaten: afgewezen of aangenomen", !inKandidaten({ status: "afgewezen", interviewDate: null }) && !inKandidaten({ status: "aangenomen", interviewDate: null }));

test("geen Job na 5 uur: geel", bolletje(basis(), nu).kleur === "geel" && bolletje(basis(), nu).reden === "geen_job");
test("geen Job na 10 minuten: oranje, nog niet gestart", bolletje(basis({ createdAt: new Date(nu.getTime() - 600000).toISOString() }), nu).reden === "nog_niet_gestart");
test("match gaat voor alles", bolletje(basis({ matchOpen: { aangemaaktOp: uurTerug(1), redenen: ["telefoon"] }, job: job({ status: "geen_reactie" }) }), nu).reden === "match");
const twv = bolletje(basis({ nationalityZone: "NON_EU", job: job({ status: "planner", velden: { werkautorisatie: "twv" } as any }) }), nu);
test("planner, TWV: geel met TWV vereist", twv.kleur === "geel" && twv.tekst === "Twijfel: TWV vereist");
test("planner, chef zonder ervaring", bolletje(basis({ functie: "chef", job: job({ status: "planner", velden: { ervaringNiveau: "geen" } as any }) }), nu).reden === "ervaring");
test("planner, MENS", bolletje(basis({ job: job({ status: "planner", twijfels: ["Kandidaat vroeg om een collega (MENS)."] }) }), nu).reden === "mens");
test("jonger dan 17: geel", bolletje(basis({ birthDate: "2010-06-01", job: job() }), nu).reden === "jong");
test("woont in het buitenland: geel", bolletje(basis({ woonland: "Spanje", job: job() }), nu).reden === "buitenland");
test("meerdere gele redenen: allemaal in het dossier", bolletje(basis({ birthDate: "2010-06-01", woonland: "Spanje", job: job() }), nu).gele.length === 2);
test("STOP: geel afsluiten", bolletje(basis({ job: job({ status: "gestopt" }) }), nu).reden === "gestopt");
const rood = bolletje(basis({ job: job({ status: "geen_reactie", herinneringen: 2, velden: { ervaring: "x", diensten: "1-2" } as any }) }), nu);
test("geen reactie: rood met open vragen", rood.kleur === "rood" && /vragen open, geen reactie op 2 herinneringen$/.test(rood.tekst), rood.tekst);
test("tweede herinnering: oranje 2", bolletje(basis({ job: job({ herinneringen: 2 }) }), nu).kleur === "oranje2");
test("eerste herinnering: oranje 1", bolletje(basis({ job: job({ herinneringen: 1 }) }), nu).cijfer === "1");
test("nu in gesprek", bolletje(basis({ job: job({ laatsteActiviteitAt: new Date(nu.getTime() - 120000).toISOString() }) }), nu).tekst === "Nu in gesprek met Job");
test("uitgenodigd, binnen 48 uur: oranje", bolletje(basis({ status: "gepland", job: job({ status: "plannen", laatsteActiviteitAt: uurTerug(10) }) }), nu).reden === "uitgenodigd");
test("uitgenodigd, na 48 uur: geel", bolletje(basis({ status: "gepland", job: job({ status: "plannen", laatsteActiviteitAt: uurTerug(60) }) }), nu).reden === "uitgenodigd_lang");
test("cv nog niet binnen", bolletje(basis({ job: job({ status: "wacht_cv", herinneringen: 1, velden: { ervaring: "x", functievraag: "x", diensten: "1-2", werkgebied: "x", werkmoment: "flexibel", startdatum: "direct", werkvorm: "hoofdbaan", talen: "NL", cvParaat: "nee" } as any }) }), nu).tekst === "Cv nog niet binnen");

test("open onderwerpen: leeg gesprek", openOnderwerpen({}, { voornaam: "", functie: "horecamedewerker", nationalityZone: "NL", hasCv: false }).vragen === 7);
test("open onderwerpen: buiten de EU een vraag meer", openOnderwerpen({}, { voornaam: "", functie: "logistiek", nationalityZone: "NON_EU", hasCv: true }).vragen === 9);
test("open onderwerpen: alleen cv", (() => { const o = openOnderwerpen({ ervaring: "x", functievraag: "x", diensten: "1-2", werkgebied: "x", werkmoment: "flexibel", startdatum: "direct", werkvorm: "hoofdbaan", talen: "NL" } as any, { voornaam: "", functie: "horecamedewerker", nationalityZone: "NL", hasCv: false }); return o.vragen === 0 && o.cv; })());

test("sinds", sindsTekst(uurTerug(0.05), nu) === "3 min" && sindsTekst(uurTerug(3), nu) === "3 uur" && sindsTekst(uurTerug(30), nu) === "1 dag" && sindsTekst(uurTerug(60), nu) === "2 dagen");
test("planner", plannerLabel({ firstName: "Eva", lastName: "Jansen" }) === "Eva J." && plannerLabel(null) === "Niet toegewezen");
test("volgorde: geel voor rood, langst wachtend eerst", vergelijk({ kleur: "geel", sinds: new Date(2) }, { kleur: "rood", sinds: new Date(1) }) < 0 && vergelijk({ kleur: "oranje", sinds: new Date(1) }, { kleur: "oranje", sinds: new Date(2) }) < 0);
test("match: telefoon en e-mail", matchRedenen({ phone: "+31600000001", email: "A@x.nl" }, { phone: "+31 6 00000001", email: "a@x.nl " }).join() === "telefoon,email");
test("match: naam en geboortedatum", matchRedenen({ firstName: "Zoë", lastName: "de Vries", birthDate: "2001-02-03" }, { firstName: "Zoe", lastName: "De Vries", birthDate: "2001-02-03" }).join() === "naam_geboortedatum");
test("match: andere persoon", matchRedenen({ firstName: "Zoë", lastName: "de Vries", birthDate: "2001-02-03", phone: "+31600000001" }, { firstName: "Zoë", lastName: "de Vries", birthDate: "2001-02-04", phone: "+31600000002" }).length === 0);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
