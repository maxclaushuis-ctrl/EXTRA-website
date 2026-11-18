/**
 * Huistests voor shared/onboardingDoorzetten.ts. Draaien: npm run onboardingdoorzetten:test
 */
import {
  functiegroepVoor, planbordPayload, planbordProfiel, planbordProfielAan, profielSamenvatting, uitkomstTekst, PLANBORD_FUNCTIE,
} from "./onboardingDoorzetten";
import type { IntakeV2 } from "./intakeV2";

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

// Schakelaar PLANBORD_PROFIEL
test("schakelaar: testomgeving vanzelf aan", planbordProfielAan({ TESTOMGEVING: "1" }));
test("schakelaar: testomgeving uit met 0", !planbordProfielAan({ TESTOMGEVING: "1", PLANBORD_PROFIEL: "0" }));
test("schakelaar: elders alleen met 1", !planbordProfielAan({}) && !planbordProfielAan({ PLANBORD_PROFIEL: "ja" }) && planbordProfielAan({ PLANBORD_PROFIEL: "1" }));

// Profiel voor Planboard (fictieve kandidaat)
const bediening = { functie: "horecamedewerker", eersteKeus: "bar", label: null, afwas: false, functies: null };
const intake: IntakeV2 = {
  _versie: 2,
  ervaring_duur: "2 tot 3 jaar",
  taken: { Uitserveren: { niveau: "zelfstandig" }, "Bestellingen opnemen": { niveau: "zelfstandig" }, Afrekenen: { niveau: "begeleiding" }, Tappen: { niveau: "geen" }, Onbekend: { niveau: null } },
  talen: [{ taal: "Nederlands", niveau: "uitgebreid", bron: "gesprek" }, { taal: "Engels", niveau: null, bron: "zelf" }],
  niet_terug: "Geen nachtdiensten", niet_terug_soort: "harde_grens", laat_thuis: "nee",
};
const beoordeling = { indruk: 80, communicatief: 85, representatief: 90, onderbouwing: "Open en duidelijk in het gesprek." };
const vol = planbordProfiel({ intake, beoordeling, beoordeeldAt: "2026-08-31T22:30:00Z", beoordeeldDoor: "Lotte Jansen", functie: bediening })!;
test("profiel: versie 1 en de twee cijfers op 100", vol.versie === 1 && vol.beoordeling?.algeheleIndruk === 80 && vol.beoordeling?.communicatie === 85);
test("profiel: datum in Nederlandse tijd", vol.beoordeling?.datum === "2026-09-01");
test("profiel: alleen de voornaam van de beoordelaar", vol.beoordeling?.door === "Lotte");
test("profiel: representatief en onderbouwing gaan niet mee", !JSON.stringify(vol).includes("90") && !JSON.stringify(vol).includes("Open en duidelijk") && !("representatief" in (vol.beoordeling || {})));
test("profiel: ervaring met duur en hoofdfunctie", vol.ervaring?.duur === "2 tot 3 jaar" && vol.ervaring?.functie === "Bediening restaurant en bar");
test("profiel: functies als lijst", Array.isArray(vol.functies) && vol.functies!.length === 1 && vol.functies![0] === "Bediening restaurant en bar");
test("profiel: alleen taken op niveau zelfstandig", JSON.stringify(vol.zelfstandigIn) === JSON.stringify(["Uitserveren", "Bestellingen opnemen"]));
test("profiel: talen met niveau, onbekend niveau is null", JSON.stringify(vol.talen) === JSON.stringify([{ taal: "Nederlands", niveau: "uitgebreid" }, { taal: "Engels", niveau: null }]));
test("profiel: harde grenzen in let op", vol.letOp?.length === 2 && vol.letOp[0] === "Geen nachtdiensten" && vol.letOp[1].includes("late"));
const voorkeur = planbordProfiel({ intake: { ...intake, niet_terug: "Liever geen spoelkeuken", niet_terug_soort: "voorkeur", laat_thuis: "ja" }, beoordeling, functie: bediening })!;
test("profiel: een voorkeur is geen let op", voorkeur.letOp === null);
test("profiel: zonder datum en naam blijven die null", voorkeur.beoordeling?.datum === null && voorkeur.beoordeling?.door === null);
const leeg = planbordProfiel({ intake: { _versie: 2 }, beoordeling: {}, functie: bediening })!;
test("profiel: lege intake geeft null per onderdeel, geen lege lijsten", leeg.beoordeling === null && leeg.ervaring === null && leeg.zelfstandigIn === null && leeg.talen === null && leeg.letOp === null);
test("profiel: alle sleutels zijn er altijd", ["versie", "beoordeling", "ervaring", "functies", "zelfstandigIn", "talen", "letOp"].every((x) => x in leeg) && Object.keys(leeg).length === 7);
test("profiel: niets bekend geeft geen blok", planbordProfiel({ intake: null, beoordeling: null, functie: bediening }) === null && planbordProfiel({ intake: null, beoordeling: { indruk: null, communicatief: null }, functie: bediening }) === null);
const alleenCijfers = planbordProfiel({ intake: null, beoordeling: { indruk: 72 }, functie: { functie: "logistiek", eersteKeus: "orderpicker" } })!;
test("profiel: alleen een beoordeling kan ook", alleenCijfers.beoordeling?.algeheleIndruk === 72 && alleenCijfers.beoordeling.communicatie === null && alleenCijfers.ervaring === null && alleenCijfers.functies?.[0] === "Orderpicken en inpakken");
const fout = planbordProfiel({ intake, beoordeling: { indruk: 0, communicatief: 101 }, functie: bediening })!;
test("profiel: cijfers buiten 1 tot 100 worden null", fout.beoordeling === null);
const tekstCijfer = planbordProfiel({ intake, beoordeling: { indruk: "80" as any, communicatief: 60.4 }, functie: bediening })!;
test("profiel: tekst telt niet als cijfer, een kommagetal wordt afgerond", tekstCijfer.beoordeling?.algeheleIndruk === null && tekstCijfer.beoordeling?.communicatie === 60);
test("profiel: ongeldige datum wordt null", planbordProfiel({ intake, beoordeling, beoordeeldAt: "geen datum", functie: bediening })!.beoordeling?.datum === null);

// Payload met en zonder profiel
const metProfiel = planbordPayload(k, 345, vol);
const zonder = planbordPayload(k, 345, null);
test("payload: zonder profiel precies de oude payload", JSON.stringify(zonder) === JSON.stringify(p) && !("profiel" in zonder));
test("payload: met profiel komt er alleen de sleutel profiel bij", "profiel" in metProfiel && Object.keys(metProfiel).filter((x) => x !== "profiel").sort().join() === Object.keys(p).sort().join());
test("payload: de bestaande velden blijven gelijk met profiel", Object.keys(p).every((x) => JSON.stringify((metProfiel as any)[x]) === JSON.stringify((p as any)[x])));

// Samenvatting voor de tijdlijn
test("samenvatting: telt de onderdelen", profielSamenvatting(vol) === "met profiel: beoordeling, ervaring, 2 taken, 2 talen, 2 keer let op");
test("samenvatting: enkelvoud en zonder profiel", profielSamenvatting({ ...leeg, zelfstandigIn: ["Uitserveren"], talen: [{ taal: "Engels", niveau: null }] }) === "met profiel: 1 taak, 1 taal" && profielSamenvatting(null) === "zonder profiel" && profielSamenvatting(leeg) === "met profiel");
test("samenvatting: geen inhoud uit het dossier", !profielSamenvatting(vol).includes("Lotte") && !profielSamenvatting(vol).includes("80") && !profielSamenvatting(vol).includes("nachtdiensten"));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
