/**
 * Huistests: Job en de gedeelde agenda in iCloud (akkoord Max, 27 november 2026).
 * Run met:  npx tsx shared/jobAgenda.test.ts
 * De namen van kandidaten zijn fictief.
 */
import {
  afspraakEvent, afspraakIdUitUid, afspraakTitel, afspraakUid, agendaPlan, amsterdamNaarUtc, bezetUitAgenda, functieLabel, herhalingen,
  isOptie, leesAfspraken, noemtNaam, ontvouw, tekstIn, tekstUit, type AanwezigEvent, type GeplandeAfspraak,
} from "./jobAgenda";
import { STANDAARD_INTERVIEWERS, vrijeMomenten } from "./jobPlanning";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}`); }
}

const vcal = (...events: string[]) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Apple Inc.//iCloud//EN", ...events, "END:VCALENDAR"].join("\r\n");
const ev = (uid: string, titel: string, start: string, eind: string, extra: string[] = []) =>
  ["BEGIN:VEVENT", `UID:${uid}`, `SUMMARY:${titel}`, start, eind, ...extra, "END:VEVENT"].join("\r\n");
const tz = (dt: string) => `;TZID=Europe/Amsterdam:${dt}`;

// ─── Het vrijdagvoorbeeld uit de mock-up (vrijdag 4 december 2026, zelfde agenda als 27 november) ──
const vrijdag = "2026-12-04";
const agendaVrijdag = vcal(
  ev("a1", "Charlotte vrij inpakdag RUX", "DTSTART;VALUE=DATE:20261204", "DTEND;VALUE=DATE:20261205", ["TRANSP:TRANSPARENT"]),
  ev("a2", "Belletje Wilde Zwijnen", `DTSTART${tz("20261204T120000")}`, `DTEND${tz("20261204T130000")}`),
  ev("a3", "Optie Sollicitant Daan Smit", `DTSTART${tz("20261204T133000")}`, `DTEND${tz("20261204T140000")}`),
  ev("a4", "Lea hartkastje halen", `DTSTART${tz("20261204T140000")}`, `DTEND${tz("20261204T150000")}`),
  // in UTC opgeslagen: 14:00Z is 15:00 Nederlandse tijd
  ev("a5", "Eef & Lea zitten", "DTSTART:20261204T140000Z", "DTEND:20261204T150000Z"),
  ev("a6", "Langs Versmarkt Food Line Up", `DTSTART${tz("20261204T160000")}`, `DTEND${tz("20261204T180000")}`),
  ev("a7", "Espresso Martini's drinken", `DTSTART${tz("20261204T180000")}`, `DTEND${tz("20261204T210000")}`, ["BEGIN:VALARM", "TRIGGER:-PT15M", "SUMMARY:Lea alarm", "END:VALARM"]),
);
const items = leesAfspraken([agendaVrijdag], vrijdag, vrijdag);
test("Zeven afspraken gelezen", items.length === 7);
test("Hele dag: 00:00 tot 00:00 van de dag erna", items.some((i) => i.heleDag && i.van === "2026-12-04 00:00" && i.tot === "2026-12-05 00:00"));
test("UTC wordt Nederlandse tijd", items.some((i) => i.titel === "Eef & Lea zitten" && i.van === "2026-12-04 15:00" && i.tot === "2026-12-04 16:00"));
test("Een alarm binnen een afspraak verandert de titel niet", items.some((i) => i.uid === "a7" && i.titel === "Espresso Martini's drinken"));

const bezet = bezetUitAgenda(items, STANDAARD_INTERVIEWERS, [vrijdag]);
const nu = new Date("2026-11-30T09:00:00Z");
const vrij = vrijeMomenten(STANDAARD_INTERVIEWERS, bezet, nu, 14, 48).filter((m) => m.datum === vrijdag);
test("Vrijdag: alleen 13:00, 16:00 en 16:30", vrij.map((m) => m.tijd).join(",") === "13:00,16:00,16:30");
test("Vrijdag: allemaal bij Lea", vrij.every((m) => m.interviewer === "Lea"));
test("Charlotte de hele dag dicht", bezet.filter((b) => b.interviewer === "Charlotte").length === 8);
test("Zonder koppeling bood Job Charlotte om 10:30 aan", vrijeMomenten(STANDAARD_INTERVIEWERS, [], nu, 14, 48).some((m) => m.datum === vrijdag && m.tijd === "10:30" && m.interviewer === "Charlotte"));
test("Afspraak zonder naam blokkeert niemand", !bezet.some((b) => b.titel === "Langs Versmarkt Food Line Up"));
test("De planner ziet de titel", bezet.some((b) => b.interviewer === "Lea" && b.tijd === "14:00" && b.titel === "Lea hartkastje halen"));

// ─── Optie zonder naam: één interviewer ──
const dinsdag = "2026-12-08";
const optie = leesAfspraken([vcal(ev("o1", "Optie Sollicitant Daan Smit", `DTSTART${tz("20261208T133000")}`, `DTEND${tz("20261208T140000")}`))], dinsdag, dinsdag);
const bOptie = bezetUitAgenda(optie, STANDAARD_INTERVIEWERS, [dinsdag]);
test("Optie zonder naam: precies één interviewer bezet", bOptie.length === 1);
test("Optie: het moment blijft vrij bij de ander", vrijeMomenten(STANDAARD_INTERVIEWERS, bOptie, nu, 14, 48).some((m) => m.datum === dinsdag && m.tijd === "13:30"));
const optieOchtend = leesAfspraken([vcal(ev("o2", "Optie sollicitant", `DTSTART${tz("20261208T110000")}`, `DTEND${tz("20261208T113000")}`))], dinsdag, dinsdag);
const bOchtend = bezetUitAgenda(optieOchtend, STANDAARD_INTERVIEWERS, [dinsdag]);
test("Optie als er maar één werkt: dat moment is dicht", !vrijeMomenten(STANDAARD_INTERVIEWERS, bOchtend, nu, 14, 48).some((m) => m.datum === dinsdag && m.tijd === "11:00"));
const tweeOpties = leesAfspraken([vcal(
  ev("o3", "Optie Sollicitant A", `DTSTART${tz("20261208T133000")}`, `DTEND${tz("20261208T140000")}`),
  ev("o4", "Optie Sollicitant B", `DTSTART${tz("20261208T133000")}`, `DTEND${tz("20261208T140000")}`),
)], dinsdag, dinsdag);
test("Twee opties tegelijk: beide interviewers bezet", bezetUitAgenda(tweeOpties, STANDAARD_INTERVIEWERS, [dinsdag]).length === 2);
const optieLang = leesAfspraken([vcal(ev("o5", "Optie Sollicitant C", `DTSTART${tz("20261208T133000")}`, `DTEND${tz("20261208T143000")}`))], dinsdag, dinsdag);
const bLang = bezetUitAgenda(optieLang, STANDAARD_INTERVIEWERS, [dinsdag]);
test("Een optie van een uur blijft bij één persoon", bLang.length === 2 && new Set(bLang.map((b) => b.interviewer)).size === 1);
const optieMetNaam = leesAfspraken([vcal(ev("o6", "Optie Sollicitant Daan (Lea)", `DTSTART${tz("20261208T133000")}`, `DTEND${tz("20261208T140000")}`))], dinsdag, dinsdag);
const bMetNaam = bezetUitAgenda(optieMetNaam, STANDAARD_INTERVIEWERS, [dinsdag]);
test("Optie met naam: alleen die persoon", bMetNaam.length === 1 && bMetNaam[0].interviewer === "Lea");

// ─── Namen herkennen ──
test("Naam als los woord", noemtNaam("Eef & Lea zitten", "Lea"));
test("Naam aan het begin met dubbele punt", noemtNaam("Lea: Sollicitant Andres (logistiek)", "Lea"));
test("Hoofdletters maken niet uit", noemtNaam("overleg met CHARLOTTE", "Charlotte"));
test("Niet in een langer woord", !noemtNaam("Leanne bellen", "Lea") && !noemtNaam("Galea langs", "Lea"));
test("Accenten maken niet uit", noemtNaam("Léa ophalen", "Lea"));
test("Optie en sollicitant herkend", isOptie("Optie Sollicitant Daan") && isOptie("sollicitatie 14u") && !isOptie("Optiek bellen"));

// ─── iCalendar-details ──
test("Doorlopende regels worden samengevoegd", ontvouw("SUMMARY:Lang\r\n  verhaal\r\nUID:x").join("|") === "SUMMARY:Lang verhaal|UID:x");
test("Tekst escapen heen en terug", tekstUit(tekstIn("Lea: Sollicitant Andres (logistiek), test; ok")) === "Lea: Sollicitant Andres (logistiek), test; ok");
const geannuleerd = leesAfspraken([vcal(ev("g1", "Lea weg", `DTSTART${tz("20261208T140000")}`, `DTEND${tz("20261208T150000")}`, ["STATUS:CANCELLED"]))], dinsdag, dinsdag);
test("Geannuleerde afspraak telt niet", geannuleerd.length === 0);
const metDuur = leesAfspraken([vcal(["BEGIN:VEVENT", "UID:d1", "SUMMARY:Lea call", `DTSTART${tz("20261208T140000")}`, "DURATION:PT45M", "END:VEVENT"].join("\r\n"))], dinsdag, dinsdag);
test("DURATION in plaats van DTEND", metDuur.length === 1 && metDuur[0].tot === "2026-12-08 14:45");

// Terugkerend: elke dinsdag en donderdag 14:00 tot 15:00 "Lea teamoverleg", behalve 10 december
const herhaal = vcal(ev("r1", "Lea teamoverleg", `DTSTART${tz("20261201T140000")}`, `DTEND${tz("20261201T150000")}`, ["RRULE:FREQ=WEEKLY;BYDAY=TU,TH", `EXDATE${tz("20261210T140000")}`]));
const hItems = leesAfspraken([herhaal], "2026-12-07", "2026-12-13");
test("Wekelijkse herhaling uitgeklapt", hItems.map((i) => i.van).join(",") === "2026-12-08 14:00");
test("Herhaling met UNTIL en COUNT", herhalingen("2026-12-01", "FREQ=DAILY;COUNT=3", "2026-12-01", "2026-12-31").join(",") === "2026-12-01,2026-12-02,2026-12-03"
  && herhalingen("2026-12-01", "FREQ=WEEKLY;INTERVAL=2;UNTIL=20261231T000000Z", "2026-12-01", "2026-12-31").join(",") === "2026-12-01,2026-12-15,2026-12-29");
const metUitzondering = vcal(
  ev("r2", "Lea blok", `DTSTART${tz("20261201T100000")}`, `DTEND${tz("20261201T110000")}`, ["RRULE:FREQ=DAILY;COUNT=10"]),
  ["BEGIN:VEVENT", "UID:r2", `RECURRENCE-ID${tz("20261208T100000")}`, "SUMMARY:Lea blok", `DTSTART${tz("20261208T160000")}`, `DTEND${tz("20261208T170000")}`, "END:VEVENT"].join("\r\n"),
);
const uItems = leesAfspraken([metUitzondering], dinsdag, dinsdag);
test("Verplaatste herhaling: alleen op de nieuwe tijd", uItems.length === 1 && uItems[0].van === "2026-12-08 16:00");
const meerdaags = leesAfspraken([vcal(ev("m1", "Charlotte vakantie", "DTSTART;VALUE=DATE:20261207", "DTEND;VALUE=DATE:20261210"))], dinsdag, dinsdag);
test("Meerdaagse hele dag telt ook op de dagen ertussen", bezetUitAgenda(meerdaags, STANDAARD_INTERVIEWERS, [dinsdag]).filter((b) => b.interviewer === "Charlotte").length === 8);

// ─── Tijd en zomertijd ──
test("Winter: 13:00 is 12:00 UTC", amsterdamNaarUtc("2026-12-04", "13:00").toISOString() === "2026-12-04T12:00:00.000Z");
test("Zomer: 13:00 is 11:00 UTC", amsterdamNaarUtc("2027-06-04", "13:00").toISOString() === "2027-06-04T11:00:00.000Z");
test("Dag na de omschakeling in maart", amsterdamNaarUtc("2027-03-29", "10:30").toISOString() === "2027-03-29T08:30:00.000Z");
test("Dag na de omschakeling in oktober", amsterdamNaarUtc("2027-11-01", "10:30").toISOString() === "2027-11-01T09:30:00.000Z");

// ─── Schrijven ──
test("Titel volgens Max", afspraakTitel("Lea", "Andres", "logistiek") === "Lea: Sollicitant Andres (logistiek)");
test("Alleen de voornaam", afspraakTitel("Charlotte", "Sanne Marie", "bediening") === "Charlotte: Sollicitant Sanne (bediening)");
test("Functie: gekozen functie eerst, anders de soort", functieLabel("bediening", "horecamedewerker") === "bediening" && functieLabel(null, "logistiek") === "logistiek" && functieLabel("", "frontoffice") === "front office");
const a = { id: 42, interviewer: "Lea", voornaam: "Andres", functie: "logistiek", datum: "2026-12-04", tijd: "13:00", dossierLink: "https://voorbeeld.nl/dashboard?tab=kandidaten&kandidaat=7" };
const ics = afspraakEvent(a, "test", new Date("2026-11-27T10:00:00Z"));
test("Event: eigen UID met omgeving", ics.includes(`UID:${afspraakUid("test", 42)}`) && afspraakIdUitUid(afspraakUid("test", 42), "test") === 42);
test("Event: tijden in UTC, een half uur", ics.includes("DTSTART:20261204T120000Z") && ics.includes("DTEND:20261204T123000Z"));
test("Event: titel en geen telefoonnummer of adres van de kandidaat", ics.includes("SUMMARY:Lea: Sollicitant Andres (logistiek)") && !/\+31|06\d{8}/.test(ics));
const terug = leesAfspraken([ics], "2026-12-04", "2026-12-04");
test("Event leest terug als Nederlandse tijd met dezelfde titel", terug.length === 1 && terug[0].van === "2026-12-04 13:00" && terug[0].titel === "Lea: Sollicitant Andres (logistiek)");
test("Jobs eigen afspraak telt als bezet voor Lea", bezetUitAgenda(terug, STANDAARD_INTERVIEWERS, ["2026-12-04"]).some((b) => b.interviewer === "Lea" && b.tijd === "13:00"));
test("Eigen afspraken worden overgeslagen als dat gevraagd wordt", bezetUitAgenda(terug, STANDAARD_INTERVIEWERS, ["2026-12-04"], (u) => afspraakIdUitUid(u, "test") !== null).length === 0);
test("UID van een andere omgeving is niet van ons", afspraakIdUitUid(afspraakUid("prod", 42), "test") === null && afspraakIdUitUid("a1", "test") === null);

// ─── Gelijk trekken ──
const g = (id: number, status: string, tijd = "13:00"): GeplandeAfspraak => ({ ...a, id, status, tijd });
const er = (id: number, tijd = "13:00", omgeving: "test" | "prod" = "test", titel = "Lea: Sollicitant Andres (logistiek)"): AanwezigEvent => ({ href: `https://p1/${id}-${omgeving}.ics`, uid: afspraakUid(omgeving, id), titel, van: `2026-12-04 ${tijd}` });
const plan = agendaPlan(
  [g(1, "gepland"), g(2, "gepland"), g(3, "verzet"), g(4, "geannuleerd"), g(5, "gepland", "16:00"), g(6, "gepland")],
  [er(2), er(3), er(4), er(5, "13:00"), er(6, "13:00", "test", "Lea: Sollicitant Iemand (bar)"), er(9), er(3, "13:00", "prod"), { href: "https://p1/a4.ics", uid: "a4", titel: "Lea hartkastje halen", van: "2026-12-04 14:00" }],
  "test",
);
test("Nieuwe afspraak erin", plan.plaats.some((p) => p.id === 1));
test("Goede afspraak blijft", plan.goed.includes(2) && !plan.plaats.some((p) => p.id === 2));
test("Verzet en geannuleerd: eruit, en het moment is weer vrij", plan.verwijder.map((e) => e.uid).sort().join(",") === [afspraakUid("test", 3), afspraakUid("test", 4)].sort().join(","));
test("Andere tijd of titel: bijwerken", plan.plaats.some((p) => p.id === 5) && plan.plaats.some((p) => p.id === 6));
test("Onbekend nummer, andere omgeving en afspraken van anderen: nooit weghalen", !plan.verwijder.some((e) => e.uid === afspraakUid("test", 9) || e.uid === afspraakUid("prod", 3) || e.uid === "a4"));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
