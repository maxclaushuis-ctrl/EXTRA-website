/**
 * Huistests: de bevestiging van een afspraak in WhatsApp met de knop "Zet in agenda"
 * (JOB_WA_AGENDAKNOP) en het WhatsApp-bericht met een linkknop (interactive cta_url).
 * Draaien: npx tsx shared/jobBevestiging.test.ts
 */
import { agendaKnopAan, bevestigingWhatsapp, herkenCommando, teksten } from "./jobRegels";
import { ctaUrlPayload } from "../server/whatsapp/metaClient";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

test("schakelaar: testomgeving vanzelf aan", agendaKnopAan({ TESTOMGEVING: "1" }));
test("schakelaar: testomgeving uit met 0", !agendaKnopAan({ TESTOMGEVING: "1", JOB_WA_AGENDAKNOP: "0" }));
test("schakelaar: elders alleen met 1", !agendaKnopAan({}) && agendaKnopAan({ JOB_WA_AGENDAKNOP: "1" }));

const link = "https://doehetextra.nl/api/job/abc/agenda.ics";
const tekst = teksten("nl").gepland("Maandag 23 november", "10:30", "Charlotte");
const met = bevestigingWhatsapp(tekst, link, "nl", true);
test("met knop: de link staat niet in de tekst", !met.tekst.includes("http") && met.link?.url === link && met.link?.tekst === "Zet in agenda");
test("met knop: geen knop Verzetten meer, wel uitleg om te typen", !met.keuzes && /Typ VERZETTEN/.test(met.tekst));
test("met knop: typen werkt ook echt", herkenCommando("VERZETTEN") === "verzetten" && herkenCommando("reschedule") === "verzetten");
const en = bevestigingWhatsapp(teksten("en").gepland("Monday 23 November", "10:30", "Charlotte"), link, "en", true);
test("Engels: knop en uitleg in het Engels", en.link?.tekst === "Add to calendar" && /Type RESCHEDULE/.test(en.tekst));
const zonder = bevestigingWhatsapp(tekst, link, "nl", false);
test("zonder knop: zoals voorheen, link in de tekst en knop Verzetten", zonder.tekst.includes(link) && (zonder.keuzes || [])[0] === "Verzetten" && !zonder.link);
test("knopteksten hooguit 20 tekens (regel van Meta)", met.link!.tekst.length <= 20 && en.link!.tekst.length <= 20);
test("geen gedachtestreepjes", !/[\u2013\u2014]/.test(met.tekst + en.tekst));

const p: any = ctaUrlPayload("31612345678", "Gepland!", "Een hele lange knoptekst die te lang is", link);
test("payload: interactive cta_url met display_text en url", p.type === "interactive" && p.interactive.type === "cta_url" && p.interactive.action.name === "cta_url" && p.interactive.action.parameters.url === link);
test("payload: knoptekst afgekapt op 20 tekens", p.interactive.action.parameters.display_text.length === 20);
test("payload: tekst in de body", p.interactive.body.text === "Gepland!");

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
