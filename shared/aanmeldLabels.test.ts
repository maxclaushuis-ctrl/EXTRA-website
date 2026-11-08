/**
 * Huistests voor aanmelden per label (shared/aanmeldLabels.ts).
 * Run met:  npx tsx shared/aanmeldLabels.test.ts
 */
import { LABELS, OPEN_CODE, functieVan, labelVanPad, zoneVanPaspoort, isLabel } from "./aanmeldLabels";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

test("Hotels heeft geen logistiek", !LABELS.hotels.functies.some((f) => f.functionType === "logistiek"));
test("Logistiek heeft alleen logistiek", LABELS.logistiek.functies.every((f) => f.functionType === "logistiek"));
test("Events heeft geen housekeeping", !LABELS.events.functies.some((f) => f.functionType === "housekeeping"));
test("Codes zijn uniek over alle labels", (() => { const c = Object.values(LABELS).flatMap((l) => l.functies.map((f) => f.code)); return new Set(c).size === c.length; })());
test("Front office bij hotels", functieVan("frontoffice", "hotels")?.functionType === "frontoffice");
test("Afwas bij hotels is keuken met afwas", (() => { const f = functieVan("afwas", "hotels"); return f?.functionType === "chef" && f.afwas === true; })());
test("Heftruck niet bij hotels", functieVan("heftruck", "hotels") === null);
test("Housekeeping niet bij logistiek", functieVan("housekeeping", "logistiek") === null);
test("Open bij logistiek wordt logistiek", functieVan(OPEN_CODE, "logistiek")?.functionType === "logistiek");
test("Open bij hotels heeft een label", functieVan(OPEN_CODE, "hotels")?.label === "hotels");
test("Oude code zonder label werkt nog", functieVan("bediening", null)?.functionType === "horecamedewerker");
test("Oude code logistiek zonder label hoort bij logistiek", functieVan("logistiek", null)?.label === "logistiek");
test("Onbekende code zonder label geeft null", functieVan("orderpicker", null) === null);
test("Hotelpagina geeft hotels", labelVanPad("/horeca-vacatures-amsterdam") === "hotels");
test("Engelse eventpagina geeft events", labelVanPad("/en/event-jobs") === "events");
test("Logistiekpagina met query geeft logistiek", labelVanPad("/logistiek-werk?utm_source=x") === "logistiek");
test("Bijbaanpagina geeft geen label", labelVanPad("/bijbaan-amsterdam") === null);
test("Paspoort NL", zoneVanPaspoort("nl").nationalityZone === "NL" && zoneVanPaspoort("nl").nationality === "Nederland");
test("Paspoort EU zonder land", zoneVanPaspoort("eu").nationalityZone === "EU" && zoneVanPaspoort("eu").nationality === null);
test("Paspoort buiten de EU", zoneVanPaspoort("buiten").nationalityZone === "NON_EU");
test("isLabel", isLabel("events") && !isLabel("horeca") && !isLabel(null));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
