/**
 * Huistests voor scripts/testdataRegels.ts
 * Run met:  npx tsx scripts/testdataRegels.test.ts
 *
 * Geen framework, geen database. Het punt is de beveiliging: het vulscript
 * mag nooit op een database met echte kandidaten draaien, en nooit zonder
 * TESTOMGEVING=1. Daarnaast: de testset is intern consistent, zodat de
 * mock-ups en de testomgeving dezelfde personen laten zien.
 */
import { testdossiers, testJobGesprekken, magVullen, maandagVan, isoDatum, testkandidaten, testrijen, TESTACCOUNTS, TEST_DOMEIN } from "./testdataRegels";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

// 1. Beveiliging: TESTOMGEVING
test("weigert zonder TESTOMGEVING=1, ook bij een lege database", magVullen({ testomgeving: false, bestaandeEmails: [] }).ok === false);
test("staat een lege testdatabase toe", magVullen({ testomgeving: true, bestaandeEmails: [] }).ok === true);

// 2. Beveiliging: echte gegevens
test("weigert bij één echt mailadres", magVullen({ testomgeving: true, bestaandeEmails: ["iemand@gmail.com"] }).ok === false);
test("weigert bij een kandidaat zonder mailadres", magVullen({ testomgeving: true, bestaandeEmails: [null] }).ok === false);
test("staat eerdere testgegevens toe", magVullen({ testomgeving: true, bestaandeEmails: [`lisa.devries${TEST_DOMEIN}`, `TESS.KRAMER${TEST_DOMEIN.toUpperCase()}`] }).ok === true);
test("de reden noemt het aantal echte kandidaten", magVullen({ testomgeving: true, bestaandeEmails: ["a@b.nl", "c@d.nl", `x${TEST_DOMEIN}`] }).reden.includes("2 kandidaten"));

// 3. De week
test("maandag van een woensdag", isoDatum(maandagVan(new Date("2026-11-04T12:00:00Z"))) === "2026-11-02");
test("maandag van een zondag is de maandag ervoor", isoDatum(maandagVan(new Date("2026-11-08T12:00:00Z"))) === "2026-11-02");
test("maandag van een maandag is die dag zelf", isoDatum(maandagVan(new Date("2026-11-09T00:30:00Z"))) === "2026-11-09");

// 4. De testset
const set = testkandidaten();
test("ongeveer 40 testkandidaten", set.length >= 36 && set.length <= 48, `nu ${set.length}`);
test("alle mailadressen eindigen op het testdomein", set.every((k) => k.email.endsWith(TEST_DOMEIN)));
test("alle mailadressen zijn uniek", new Set(set.map((k) => k.email)).size === set.length);
test("alle telefoonnummers zijn nepnummers (+3160000…)", set.every((k) => /^\+3160000\d{4}$/.test(k.phone)));
test("alle telefoonnummers zijn uniek", new Set(set.map((k) => k.phone)).size === set.length);
test("13 gesprekken deze week, zoals in het weekoverzicht", set.filter((k) => k.status === "gepland").length === 13);
test("elk gepland gesprek heeft dag en tijd", set.filter((k) => k.status === "gepland").every((k) => k.gesprekDag !== null && k.gesprekTijd));
test("alleen geplande kandidaten hebben een gesprek", set.filter((k) => k.status !== "gepland").every((k) => k.gesprekDag === null));
test("elke afgewezen kandidaat heeft een reden", set.filter((k) => k.status === "afgewezen").every((k) => !!k.rejectionReason));
test("alle vier de statussen komen voor", new Set(set.map((k) => k.status)).size === 4);
test("de namen uit de mock-ups zitten erin", ["Lisa", "Tess", "Noor", "Kevin"].every((v) => set.some((k) => k.firstName === v)));

// 5. Rijen met datums
const rijen = testrijen(new Date("2026-11-04T12:00:00Z"));
const lisa = rijen.find((r) => r.firstName === "Lisa")!;
test("Lisa heeft haar gesprek op dinsdag 14:00", lisa.interviewDate === "2026-11-03" && lisa.interviewTime === "14:00");
test("Tess is gisteren aangemeld", isoDatum(rijen.find((r) => r.firstName === "Tess")!.createdAt) === "2026-11-03");
test("geen rij heeft nog hulpvelden", rijen.every((r) => !("gesprekDag" in r) && !("dagenGeleden" in r)));

// 6. Accounts
test("vier testaccounts op het testdomein", TESTACCOUNTS.length === 4 && TESTACCOUNTS.every((a) => a.email.endsWith(TEST_DOMEIN)));

// 7. Dossiers voor Sollicitanten
{
  const emails = new Set(testkandidaten().map((k) => k.email));
  const ds = testdossiers();
  test("dossiers horen bij bestaande testkandidaten", ds.every((d) => emails.has(d.email)), ds.filter((d) => !emails.has(d.email)).map((d) => d.email).join(", "));
  test("dossiers: elke stap komt voor", ["beoordelen", "ref_doc_check", "extra_check", "onboarding", "archief"].every((s) => ds.some((d) => d.stap === s)));
  test("dossiers: geen dubbele kandidaat", new Set(ds.map((d) => d.email)).size === ds.length);
  test("dossiers: Lisa de Vries blijft vóór de intake", !ds.some((d) => d.email.startsWith("lisa.")));
}

// 8. Gesprekken met Job voor Kandidaten 3.0
{
  const emails = new Set(testkandidaten().map((k) => k.email));
  const js = testJobGesprekken();
  test("Job-gesprekken horen bij testkandidaten", js.every((j) => emails.has(j.email)), js.filter((j) => !emails.has(j.email)).map((j) => j.email).join(", "));
  test("Job-gesprekken: geen kandidaat met een dossier", js.every((j) => !testdossiers().some((d) => d.email === j.email)));
  test("Job-gesprekken: elke toestand komt voor", ["geen_reactie", "bezig", "planner", "wacht_cv"].every((s) => js.some((j) => j.status === s)));
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
