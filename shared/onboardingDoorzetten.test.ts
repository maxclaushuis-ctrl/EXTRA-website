/**
 * Huistests voor shared/onboardingDoorzetten.ts. Draaien: npm run onboardingdoorzetten:test
 */
import { functiegroepVoor, planbordPayload, uitkomstTekst, PLANBORD_FUNCTIE } from "./onboardingDoorzetten";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}`); }
}

// Functiegroep voor de template
test("groep: housekeeping", functiegroepVoor("housekeeping", "housekeeping") === "Housekeeping");
test("groep: keuken is Chef", functiegroepVoor("chef", "keuken") === "Chef" && functiegroepVoor("horecamedewerker", "keuken") === "Chef");
test("groep: logistiek", functiegroepVoor("logistiek", "orderpicker") === "Logistiek");
test("groep: bediening en events", functiegroepVoor("horecamedewerker", "bediening") === "Bediening" && functiegroepVoor("horecamedewerker", "runner") === "Bediening");
test("groep: afwas en front office krijgen de standaard", functiegroepVoor("horecamedewerker", "afwas", true) === null && functiegroepVoor("frontoffice", "frontoffice") === null);
test("groep: onbekend geeft null", functiegroepVoor(null, null) === null && functiegroepVoor("iets", "anders") === null);

// Payload: alleen velden die de oude route ook stuurt
const k = { id: 12, firstName: "Fleur", lastName: "van Dijk", email: "fleur@voorbeeld.nl", phone: "", birthDate: "2002-03-14", city: "Amsterdam", nationality: "Nederlandse", language: "", functionType: "housekeeping", referralCode: null };
const p = planbordPayload(k, 345);
test("payload: id is het medewerkernummer als tekst", p.id === "345" && p.employeeId === 345 && p.candidateId === 12);
test("payload: functie zoals de oude route", p.function === "housekeeping" && planbordPayload({ ...k, functionType: "logistiek" }, 1).function === "orderpicker" && planbordPayload({ ...k, functionType: "frontoffice" }, 1).function === "front-office");
test("payload: branche zoals de oude route", p.branche === "Hotel" && planbordPayload({ ...k, functionType: "chef" }, 1).branche === "Restaurant");
test("payload: lege waarden worden null", p.phone === null && p.referralCode === null);
test("payload: taal valt terug op Nederlands", p.language === "Nederlands");
test("payload: geen applicationId, geen cv en geen intakeblok", !("applicationId" in p) && !("cv" in p) && !("intake" in p));
test("payload: alleen bekende velden", Object.keys(p).every((x) => ["id", "candidateId", "employeeId", "firstName", "lastName", "function", "email", "phone", "birthDate", "city", "nationality", "branche", "opdrachtgever", "contractType", "startDate", "language", "referralCode"].includes(x)));
test("payload: onbekende functie blijft leesbaar", planbordPayload({ ...k, functionType: "iets" }, 1).function === "iets" && Object.keys(PLANBORD_FUNCTIE).length === 5);

// Melding na de klik
const t1 = uitkomstTekst("Fleur", { status: "verzonden" }, { status: "verzonden" });
test("melding: alles gelukt", t1 === "Fleur staat in Medewerkers: onboardingmail verstuurd, doorgezet naar Planboard.");
const t2 = uitkomstTekst("Fleur", { status: "mislukt", reden: "template is niet actief" }, { status: "overgeslagen", reden: "testomgeving" });
test("melding: mail mislukt en testomgeving", t2.includes("niet verstuurd (template is niet actief)") && t2.includes("vanuit Medewerkers") && t2.includes("niet naar Planboard (testomgeving)"));
test("melding: geen streepjes als leesteken", ![t1, t2].some((x) => /[\u2013\u2014]/.test(x)));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
