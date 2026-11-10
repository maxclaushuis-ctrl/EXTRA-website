/**
 * Huistests: de taal van Job (shared/jobTaal.ts) en het wisselen in het gesprek.
 * Fictieve kandidaten, geen AI (de lezing is vast).
 * Run met:  npx tsx shared/jobTaal.test.ts
 */
import { e164, landcodes, starttaal, taalVanTekst, taalWissel } from "./jobTaal";
import { start, verwerk, teksten, type JobContext, type Lezing } from "./jobRegels";
import { kiesSjabloon } from "../server/job/jobSjablonen";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

// ─── E.164 ───
test("06 wordt +316", e164("06 12 34 56 78") === "+31612345678");
test("0031 wordt +31", e164("0031-6-12345678") === "+31612345678");
test("+31 met spaties", e164("+31 6 1234 5678") === "+31612345678");
test("dubbel plusteken", e164("++31612345678") === "+31612345678");
test("buitenlands blijft", e164("+48 512 345 678") === "+48512345678" && e164("0048512345678") === "+48512345678");
test("31612345678 zonder plus", e164("31612345678") === "+31612345678");
test("onzin is null", e164("abc") === null && e164("") === null && e164("123") === null);
test("landcodes: standaard 31, instelbaar", landcodes(undefined).join() === "31" && landcodes("31, 32").join() === "31,32");

// ─── Starttaal (tabel akkoord Max) ───
const st = (nummer: string | null, paspoort: string | null, formulierTaal: "nl" | "en" | null = null) => starttaal({ nummer, paspoort, formulierTaal });
test("NL paspoort, +31: nl", st("+31612345678", "NL") === "nl");
test("NL paspoort, buitenlands nummer: nl", st("+48512345678", "NL") === "nl");
test("EU paspoort, buitenlands nummer: en", st("+48512345678", "EU") === "en");
test("Buiten EU, buitenlands nummer: en", st("+212612345678", "NON_EU") === "en");
test("EU paspoort, +31, Nederlands formulier: nl", st("+31612345678", "EU", "nl") === "nl");
test("Buiten EU, +31, Engels formulier: en", st("+31612345678", "NON_EU", "en") === "en");
test("EU paspoort, +31, formulier onbekend: nl", st("+31612345678", "EU") === "nl");
test("Paspoort onbekend, +31: nl", st("+31612345678", null) === "nl");
test("Paspoort onbekend, buitenlands: en", st("+447700900123", null) === "en");
test("Scenario 6: nummer als 06 is +31", st("0612345678", null) === "nl");
test("Instelbare lijst: +32 telt als Nederlands", starttaal({ nummer: "+32470123456", paspoort: null, codes: ["31", "32"] }) === "nl");
test("Geen nummer: taal van het formulier", st(null, null, "en") === "en" && st(null, null) === "nl");

// ─── Wisselregels ───
const w = (huidig: "nl" | "en", tekst: string, aiTaal: any = null, extra: Partial<Parameters<typeof taalWissel>[0]> = {}) => taalWissel({ huidig, tekst, aiTaal, wissels: 0, andereTaal: 0, ...extra });
test("Duidelijke Engelse zin wisselt", JSON.stringify(w("nl", "I worked in a hotel for two years", "en")) === JSON.stringify({ soort: "wissel", taal: "en" }));
test("Duidelijke Nederlandse zin wisselt", w("en", "Ik heb twee jaar in de bediening gewerkt", "nl").soort === "wissel");
test("ok / yes / ja wisselt niet", ["ok", "yes", "ja", "Yes please", "ok thanks"].every((t) => w("nl", t, "en").soort === "blijf"));
test("Naam wisselt niet (Van der Valk)", w("en", "Van der Valk", null).soort === "blijf" && w("en", "Van der Valk", "nl").soort === "blijf");
test("Zin met een naam erin telt wel", w("nl", "I worked at Van der Valk as freelancer", "en").soort === "wissel");
test("Getal of plaats wisselt niet", w("nl", "3", "en").soort === "blijf" && w("en", "Amsterdam", "nl").soort === "blijf" && w("en", "Den Haag", "nl").soort === "blijf");
test("Knopkeuze wisselt niet", w("nl", "Alongside studies", "en", { keuze: true }).soort === "blijf");
test("Twee woorden is te kort", w("nl", "Begrijp niet", "nl").soort === "blijf" && w("en", "Begrijp niet", "nl").soort === "blijf");
test("Hooguit één automatische wissel", w("en", "Ik spreek ook Nederlands hoor", "nl", { wissels: 1 }).soort === "blijf");
test("AI spreekt tegen: geen wissel", w("nl", "I am in Amsterdam", "nl").soort === "blijf");
test("Drie woorden met één herkend woord wisselt niet (Look for job)", w("nl", "Look for job", "en").soort === "blijf");
test("Vier woorden met AI-bevestiging wisselt wel", w("nl", "Looking for a job", "en").soort === "wissel");
test("Andere taal (Pools): Engels met uitleg", w("nl", "Szukam pracy w hotelu", "anders").soort === "andere_taal");
test("Andere taal zonder AI, zes woorden", w("nl", "Szukam pracy w hotelu jako pokojówka teraz", null).soort === "andere_taal");
test("Nederlandse zin met hoofdletter na een punt is geen andere taal", w("nl", "Allebei. Ook drie borden tegelijk", null).soort === "blijf");
test("taalVanTekst", taalVanTekst("I have worked there") === "en" && taalVanTekst("ik heb daar gewerkt") === "nl" && taalVanTekst("ok") === null);

// ─── In het gesprek (verwerk) ───
const NU = new Date("2026-11-10T12:00:00Z");
const L = (x: Partial<Lezing>): Lezing => ({ velden: {}, taal: null, twijfel: null, ack: "", ...x });
const hk: JobContext = { voornaam: "Lisa", functie: "housekeeping", label: "hotels", nationalityZone: "NL", hasCv: false, stopV3: true };
const nl = teksten("nl"), en = teksten("en");
{
  // Scenario 1: +31, antwoordt Nederlands: blijft Nederlands
  let r = start(hk, "nl", NU);
  r = verwerk(r.state, hk, { tekst: "Ik heb twee jaar kamers schoongemaakt in een hotel" }, L({ velden: { ervaring: "2 jaar kamers schoonmaken", ervaringNiveau: "ervaren" }, taal: "nl" }), NU);
  test("Scenario 1: blijft Nederlands", r.state.taal === "nl" && !r.berichten.some((b) => /[A-Z][a-z]+ you/.test(b.tekst)));
}
{
  // Scenario 2: +31, antwoordt Engels: schakelt naar Engels
  let r = start(hk, "nl", NU);
  r = verwerk(r.state, hk, { tekst: "I cleaned hotel rooms for two years" }, L({ velden: { ervaring: "2 years cleaning hotel rooms", ervaringNiveau: "ervaren" }, taal: "en", ack: "Twee jaar, mooi." }), NU);
  test("Scenario 2: schakelt naar Engels", r.state.taal === "en" && r.state.velden.taalWissels === 1);
  test("Scenario 2: volgende vraag in het Engels, geen Nederlandse reactie", r.berichten.length > 0 && !r.berichten.some((b) => b.tekst === "Twee jaar, mooi."));
}
{
  // Scenario 3: buitenlands nummer start Engels, Nederlandse zin: naar Nederlands en blijft daar
  const ctx = { ...hk, nationalityZone: "EU" as const };
  let r = start(ctx, "en", NU);
  test("Scenario 3: start in het Engels", r.state.taal === "en" && r.berichten[0].tekst === start(ctx, "en", NU).berichten[0].tekst);
  r = verwerk(r.state, ctx, { tekst: "Ik heb drie jaar in een hotel gewerkt als schoonmaker" }, L({ velden: { ervaring: "3 jaar schoonmaak hotel", ervaringNiveau: "ervaren" }, taal: "nl" }), NU);
  test("Scenario 3: wisselt naar Nederlands", r.state.taal === "nl");
  const vraagNu = r.state.laatsteOnderwerp;
  r = verwerk(r.state, ctx, { tekst: "Yes I can work weekends too" }, L({ velden: {}, taal: "en" }), NU);
  test("Scenario 3: blijft daarna Nederlands (hooguit één wissel)", r.state.taal === "nl", String(vraagNu));
}
{
  // Scenario 4: buitenlands nummer, alleen een knop of ok: geen wissel
  const ctx = { ...hk, nationalityZone: "NON_EU" as const };
  let r = start(ctx, "en", NU);
  r = verwerk(r.state, ctx, { tekst: "ok" }, L({ taal: "nl" }), NU);
  test("Scenario 4: ok wisselt niet", r.state.taal === "en");
  const ks = (["1 to 2", "3 to 4"] as const);
  r = verwerk({ ...r.state, laatsteOnderwerp: "diensten" }, ctx, { tekst: ks[1] }, L({ velden: { diensten: "3-4" }, taal: "nl" }), NU);
  test("Scenario 4: knop wisselt niet", r.state.taal === "en");
}
{
  // Andere taal: eerst Engels met uitleg, de vraag opnieuw; daarna de bestaande regel
  let r = start(hk, "nl", NU);
  r = verwerk(r.state, hk, { tekst: "Szukam pracy w hotelu jako pokojówka" }, L({ taal: "anders" }), NU);
  test("Andere taal: Engels met uitleg en dezelfde vraag", r.state.taal === "en" && r.berichten[0].tekst === en.alleenNlEn && r.state.laatsteOnderwerp === "ervaring" && r.state.status === "bezig");
  r = verwerk(r.state, hk, { tekst: "Nie rozumiem, mówię tylko po polsku" }, L({ taal: "anders", velden: { nlOfEn: false } }), NU);
  test("Andere taal, tweede keer: naar een collega (bestaande regel)", r.state.status === "planner");
}
test("ENGLISH typen kan ook na een wissel", (() => {
  let r = start(hk, "nl", NU);
  r = verwerk(r.state, hk, { tekst: "I cleaned rooms for two years" }, L({ velden: { ervaring: "2 years", ervaringNiveau: "ervaren" }, taal: "en" }), NU);
  r = verwerk(r.state, hk, { tekst: "NEDERLANDS" }, null, NU);
  return r.state.taal === "nl" && r.berichten[0].tekst === nl.wisselNl;
})());

// ─── Sjabloon per taal (scenario 7: herinnering in de juiste taal) ───
const lijst = (extra: { naam: string; taal: string; status: string }[]) => extra;
const beide = lijst([{ naam: "job_herinnering", taal: "nl", status: "APPROVED" }, { naam: "job_herinnering", taal: "en", status: "APPROVED" }]);
test("Herinnering Engels als goedgekeurd", JSON.stringify(kiesSjabloon("herinnering", "en", beide)) === JSON.stringify({ naam: "job_herinnering", taal: "en", terugval: false }));
test("Herinnering Nederlands", kiesSjabloon("herinnering", "nl", beide)?.taal === "nl");
const alleenNl = lijst([{ naam: "job_herinnering", taal: "nl", status: "APPROVED" }, { naam: "job_herinnering", taal: "en", status: "PENDING" }]);
test("Engels niet goedgekeurd: Nederlands met terugval", JSON.stringify(kiesSjabloon("herinnering", "en", alleenNl)) === JSON.stringify({ naam: "job_herinnering", taal: "nl", terugval: true }));
const start3 = lijst([{ naam: "job_start_v3", taal: "nl", status: "APPROVED" }, { naam: "job_start_v2", taal: "nl", status: "APPROVED" }, { naam: "job_start_v2", taal: "en", status: "APPROVED" }]);
test("Start Engels: oudere versie in het Engels gaat voor Nederlands", kiesSjabloon("start", "en", start3)?.naam === "job_start_v2" && kiesSjabloon("start", "en", start3)?.taal === "en");
test("Start Nederlands: nieuwste versie", kiesSjabloon("start", "nl", start3)?.naam === "job_start_v3");
test("Niets goedgekeurd: null", kiesSjabloon("afspraak", "nl", []) === null);
test("Uitlegtekst zonder gedachtestreepjes", ![en.alleenNlEn, nl.alleenNlEn].some((t) => /[–—]/.test(t)));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
