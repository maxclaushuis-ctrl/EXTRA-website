/**
 * Huistests: Nieuwe aanmeldingen of Kandidaten (aanmeldfase, stadium en schakelaar in
 * shared/kandidaatRegels.ts). Draaien: npm run aanmeldfase:test
 */
import { aanmeldfase, stadium, nieuweAanmeldingenAan, groepenVoor, GROEPEN, indeling, type KandidaatInvoer } from "./kandidaatRegels";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

const nu = new Date("2026-11-18T12:00:00Z");
const uurTerug = (n: number) => new Date(nu.getTime() - n * 3600 * 1000).toISOString();
const basis = (o: Partial<KandidaatInvoer> = {}): KandidaatInvoer => ({
  status: "in_behandeling", interviewDate: null, createdAt: uurTerug(5), birthDate: "2000-01-01", woonland: null,
  functie: "horecamedewerker", nationalityZone: "NL", hasCv: false, job: null, matchOpen: null, ...o,
});
const VOL = { ervaring: "x", functievraag: "x", diensten: "1-2", werkgebied: "x", werkmoment: "flexibel", startdatum: "direct", werkvorm: "hoofdbaan", talen: "NL" } as any;
const HALF = { ervaring: "x", functievraag: "x" } as any;
const job = (o: Partial<NonNullable<KandidaatInvoer["job"]>> = {}) => ({
  status: "bezig", kanaal: "web", herinneringen: 0, herinneringAt: null, laatsteActiviteitAt: uurTerug(3), bijgewerktAt: uurTerug(3), velden: {}, twijfels: [], ...o,
});

// Nieuwe aanmelding
test("net aangemeld, nog geen Job: nieuw", aanmeldfase(basis()) === "nieuw");
test("Job bezig met vragen: nieuw", aanmeldfase(basis({ job: job({ velden: HALF }) })) === "nieuw");
test("gesprek af, cv nog niet binnen (wacht_cv): nieuw", aanmeldfase(basis({ job: job({ status: "wacht_cv", velden: { ...VOL, cvParaat: "ja" } }) })) === "nieuw");
test("alleen cv binnen, gesprek nog bezig: nieuw", aanmeldfase(basis({ hasCv: true, job: job({ velden: HALF }) })) === "nieuw");
test("geen reactie na 2 herinneringen: nieuw", aanmeldfase(basis({ job: job({ status: "geen_reactie", herinneringen: 2, velden: HALF }) })) === "nieuw");
test("gestopt via STOP: nieuw", aanmeldfase(basis({ job: job({ status: "gestopt", velden: HALF }) })) === "nieuw");
test("collega kijkt mee terwijl Job nog vragen heeft: nieuw", aanmeldfase(basis({ job: job({ status: "planner", velden: HALF, twijfels: ["Kandidaat vroeg om een collega (MENS)."] }) })) === "nieuw");
test("planner, gesprek af, cv nog onderweg (cvParaat ja): nieuw", aanmeldfase(basis({ job: job({ status: "planner", velden: { ...VOL, cvParaat: "ja" } }) })) === "nieuw");

// Kandidaat
test("gesprek af en cv binnen (cv_controle): kandidaat", aanmeldfase(basis({ hasCv: true, job: job({ status: "cv_controle", velden: VOL }) })) === "kandidaat");
test("gesprek af en cv binnen (planner): kandidaat", aanmeldfase(basis({ hasCv: true, job: job({ status: "planner", velden: VOL }) })) === "kandidaat");
test("compleet met twijfel (TWV) blijft kandidaat", aanmeldfase(basis({ hasCv: true, nationalityZone: "NON_EU", job: job({ status: "planner", velden: { ...VOL, werkautorisatie: "twv", geldigTot: "x" } }) })) === "kandidaat");
test("compleet, wil een collega spreken: kandidaat", aanmeldfase(basis({ hasCv: true, job: job({ status: "planner", velden: VOL, twijfels: ["Kandidaat vroeg om een collega (MENS)."] }) })) === "kandidaat");
test("klaar met Job, zegt geen cv te hebben: kandidaat", aanmeldfase(basis({ job: job({ status: "planner", velden: { ...VOL, cvParaat: "nee" } }) })) === "kandidaat");
test("al uitgenodigd, nog geen moment gekozen: kandidaat", aanmeldfase(basis({ status: "gepland", job: job({ status: "plannen", velden: VOL }) })) === "kandidaat");
test("uitgenodigd zonder Job-gesprek: kandidaat", aanmeldfase(basis({ status: "gepland" })) === "kandidaat");
test("nieuw volgt vanzelf: zodra het cv binnen is wordt het kandidaat", aanmeldfase(basis({ job: job({ status: "planner", velden: { ...VOL, cvParaat: "ja" } }) })) === "nieuw" && aanmeldfase(basis({ hasCv: true, job: job({ status: "planner", velden: { ...VOL, cvParaat: "ja" } }) })) === "kandidaat");

// Stadium
test("stadium: geen Job is Aangemeld via de website", stadium(basis()).stap === 1 && stadium(basis()).label === "Aangemeld" && stadium(basis()).kanaal === "via de website");
test("stadium: Job gestart maar nog niets beantwoord is Aangemeld", stadium(basis({ job: job() })).stap === 1);
test("stadium: vragen open is Gesprek", stadium(basis({ job: job({ velden: HALF }) })).stap === 2 && stadium(basis({ job: job({ velden: HALF }) })).label === "Gesprek");
test("stadium: alles beantwoord, cv open is Cv", stadium(basis({ job: job({ status: "wacht_cv", velden: VOL }) })).stap === 3 && stadium(basis({ job: job({ status: "wacht_cv", velden: VOL }) })).label === "Cv");
test("stadium: kanaal WhatsApp en webgesprek", stadium(basis({ job: job({ kanaal: "whatsapp", velden: HALF }) })).kanaal === "via WhatsApp" && stadium(basis({ job: job({ kanaal: "web", velden: HALF }) })).kanaal === "via het webgesprek");

// Groepsnamen per bak
test("groepen: Kandidaten noemt actie Eerst nakijken en lopend Uitgenodigd", groepenVoor("kandidaat").actie.titel === "Eerst nakijken" && groepenVoor("kandidaat").lopend.titel === "Uitgenodigd");
test("groepen: Nieuwe aanmeldingen houdt de bestaande namen", groepenVoor("nieuw") === GROEPEN && GROEPEN.actie.titel === "Actie nodig");
test("groepen: kleuren en volgorde blijven gelijk", groepenVoor("kandidaat").beoordelen.kleur === GROEPEN.beoordelen.kleur && groepenVoor("kandidaat").actie.kleur === GROEPEN.actie.kleur);
test("indeling blijft ongewijzigd door de nieuwe regels", indeling(basis({ hasCv: true, job: job({ status: "cv_controle", velden: VOL }) }), nu).groep === "beoordelen");

// Schakelaar
test("schakelaar: testomgeving vanzelf aan", nieuweAanmeldingenAan({ TESTOMGEVING: "1" }));
test("schakelaar: testomgeving uit met 0", !nieuweAanmeldingenAan({ TESTOMGEVING: "1", NIEUWE_AANMELDINGEN: "0" }));
test("schakelaar: elders alleen met 1", !nieuweAanmeldingenAan({}) && !nieuweAanmeldingenAan({ NIEUWE_AANMELDINGEN: "ja" }) && nieuweAanmeldingenAan({ NIEUWE_AANMELDINGEN: "1" }));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
