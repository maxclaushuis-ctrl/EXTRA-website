/**
 * Huistests voor Job, de AI-recruiter: de regels, het uitlezen zonder AI en
 * het inplannen. Run met:  npx tsx shared/job.test.ts
 *
 * Geen framework, geen database, geen AI. De gesprekken hieronder volgen de
 * mock-ups C, C2, C3, C4 en D: Lisa (Nederlands, rijk eerste antwoord), Maria
 * (Engels), Samir (werkautorisatie onbekend), Ahmed (vrij toegestaan) en de
 * uitzonderingen. De reserve-lezer speelt hier de rol van de AI.
 */
import {
  start, verwerk, volgendeOnderwerp, herinneringNodig, herinnering, herkenCommando, plannerRedenen,
  samenvatting, profielVelden, UUR, type JobContext, type JobState, type Lezing, type Resultaat,
} from "./jobRegels";
import { reserveLezing, valideerLezing, raadTaal } from "./jobLezen";
import {
  tijdenVan, vrijeMomenten, momentGeldig, amsterdam, dagTekst, afspraakHerinneringNodig, agendaBestand,
  STANDAARD_INTERVIEWERS, weekdag, plusDag,
} from "./jobPlanning";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

const NU = new Date("2026-11-03T09:00:00Z");
const later = (min: number) => new Date(NU.getTime() + min * 60 * 1000);

/** Speelt een antwoord in, met de reserve-lezer als AI. */
function antwoord(r: Resultaat, ctx: JobContext, tekst: string, min = 1): Resultaat {
  const lezing = herkenCommando(tekst, r.state.laatsteOnderwerp) ? null : reserveLezing(tekst, r.state.laatsteOnderwerp);
  return verwerk(r.state, ctx, { tekst }, lezing, later(min));
}
const laatste = (r: Resultaat) => r.berichten[r.berichten.length - 1];
const alleTekst = (r: Resultaat) => r.berichten.map((b) => b.tekst).join(" | ");

// ─── 1. Lisa: Nederlands, rijk eerste antwoord, cv later geüpload ───────────
{
  const ctx: JobContext = { voornaam: "Lisa", functie: "horecamedewerker", nationalityZone: "NL", hasCv: false };
  let r = start(ctx, "nl", NU);
  test("Lisa: welkom noemt naam en functie", r.berichten[0].tekst.startsWith("Hi Lisa,\n\nIk ben Job") && r.berichten[0].tekst.includes("bediening en bar"));
  test("Lisa: welkom zegt dat Job een AI-recruiter is", r.berichten[0].tekst.includes("AI-recruiter"));
  test("Lisa: eerste vraag gaat over ervaring", r.state.laatsteOnderwerp === "ervaring" && laatste(r).tekst === "Vertel eens: hoeveel jaar ervaring heb je in de horeca tot nu toe?");

  r = antwoord(r, ctx, "Twee zomers bij een strandtent in Zandvoort, daar deden we ook bruiloften en grote groepen. Nu werk ik op zaterdag in een lunchroom. Ik studeer, dus meestal kan ik twee dagen per week, en ik fiets overal heen");
  test("Lisa: één antwoord vult ervaring, diensten en vervoer", !!r.state.velden.ervaring && r.state.velden.diensten === "1-2" && r.state.velden.vervoer === "fiets", JSON.stringify(r.state.velden));
  test("Lisa: bruiloften geven een hint voor evenementen", r.state.velden.specialisatieHint === true);
  test("Lisa: daarna één functievraag", r.state.laatsteOnderwerp === "functievraag");

  r = antwoord(r, ctx, "Allebei. Ook drie borden tegelijk");
  test("Lisa: daarna de specialisatie, met keuzes", r.state.laatsteOnderwerp === "specialisatie" && (laatste(r).keuzes || []).length === 2);
  r = antwoord(r, ctx, "Ja, graag");
  test("Lisa: specialisatie ja", r.state.velden.specialisatie === "ja");
  test("Lisa: geen vraag over werkautorisatie (Nederlands) en diensten overgeslagen", r.state.laatsteOnderwerp === "werkgebied", String(r.state.laatsteOnderwerp));
  r = antwoord(r, ctx, "Tot 25 km. Amsterdam en Haarlem vind ik allebei prima");
  test("Lisa: werkgebied tot 25 km", r.state.velden.werkgebied === "tot 25 km");
  test("Lisa: daarna wanneer je kunt werken, met drie keuzes", r.state.laatsteOnderwerp === "werkmoment" && (laatste(r).keuzes || []).length === 3);
  r = antwoord(r, ctx, "Avond en weekend");
  test("Lisa: werkmoment avond en weekend, dan wanneer je kunt beginnen", r.state.velden.werkmoment === "avond_weekend" && r.state.laatsteOnderwerp === "startdatum");
  r = antwoord(r, ctx, "Direct");
  test("Lisa: kan direct beginnen", r.state.velden.startdatum === "direct");
  test("Lisa: als laatste het cv", r.state.laatsteOnderwerp === "cv");
  r = antwoord(r, ctx, "Ja");
  test("Lisa: cv paraat geeft de uploadknop, nog niet plannen", r.state.status === "wacht_cv" && laatste(r).cvUpload === true && !r.berichten.some((b) => b.planning));
  test("Lisa: bij cv paraat geen mail", !r.acties.some((a) => a.soort === "cv_mail"));
  r = verwerk(r.state, ctx, { cvOntvangen: true }, null, later(20));
  test("Lisa: cv binnen en alles in orde: eerst cv-controle, nog niet plannen", r.state.status === "cv_controle" && !r.berichten.some((b) => b.planning));
  test("Lisa: collega krijgt een melding om het cv te controleren", r.acties.some((a) => a.soort === "planner" && a.reden.startsWith("Cv controleren")));
  test("Lisa: Job zegt dat een collega het cv bekijkt", alleTekst(r).includes("Een collega bekijkt nu je cv"));
  test("Lisa: 'Fantastisch, je cv is binnen!'", alleTekst(r).includes("Fantastisch, je cv is binnen!"));
  test("Lisa: samenvatting voor de mail", samenvatting(r.state.velden, ctx) === "bediening en bar, ook evenementen en banqueting · 1 tot 2 diensten per week · tot 25 km · avond en weekend · beginnen: direct", samenvatting(r.state.velden, ctx));
  test("Lisa: profielvelden alleen bestaande kolommen", JSON.stringify(Object.keys(profielVelden(r.state.velden)).sort()) === JSON.stringify(["availability", "previousExperience"]) && profielVelden(r.state.velden).availability === "1 tot 2 diensten per week, avond en weekend");
}

// ─── 2. Maria: antwoordt in het Engels, Job gaat mee ─────────────────────────
{
  const ctx: JobContext = { voornaam: "Maria", functie: "housekeeping", nationalityZone: "EU", hasCv: true };
  let r = start(ctx, "nl", NU);
  r = antwoord(r, ctx, "Hi, sorry, I don't speak Dutch. I have 2 years in a hotel in Lisbon");
  test("Maria: Job schakelt naar Engels", r.state.taal === "en");
  test("Maria: housekeeping, dus de vraag naar hotels, in het Engels", laatste(r).tekst === "Which hotels have you worked at?", laatste(r).tekst);
  r = antwoord(r, ctx, "Pestana and a Marriott");
  test("Maria: hotels opgeslagen, dan de sterren met knoppen", r.state.velden.hotels === "Pestana and a Marriott" && r.state.laatsteOnderwerp === "sterren" && (laatste(r).keuzes || []).length === 3);
  r = antwoord(r, ctx, "5 stars");
  test("Maria: vijf sterren", r.state.velden.sterren === "5");
  r = antwoord(r, ctx, "3 or 4 shifts");
  test("Maria: geen werkautorisatievraag (EU)", r.state.laatsteOnderwerp === "werkgebied");
  r = antwoord(r, ctx, "Up to 35 km");
  r = antwoord(r, ctx, "Evenings and weekends");
  r = antwoord(r, ctx, "Right away");
  test("Maria: cv al binnen, dus cv-controle", r.state.status === "cv_controle" && !r.berichten.some((b) => b.planning));
  test("Maria: afsluiting in het Engels", alleTekst(r).includes("A colleague is now looking at your CV"));
  const nog = antwoord(r, ctx, "Ok thanks");
  test("Maria: een bericht tijdens de cv-controle geeft alleen de stand", nog.state.status === "cv_controle" && nog.berichten.length === 1 && !nog.berichten[0].planning && alleTekst(nog).includes("you'll hear from us soon"));
}

// ─── 3. Samir: buiten de EU, werkautorisatie onbekend ────────────────────────
{
  const ctx: JobContext = { voornaam: "Samir", functie: "chef", nationalityZone: "NON_EU", hasCv: true };
  let r = start(ctx, "nl", NU);
  r = antwoord(r, ctx, "3 jaar hulpkok in een hotelkeuken, soms alleen op de ontbijtpost");
  r = antwoord(r, ctx, "Vooral als hulp");
  test("Samir: na ervaring de vraag over het verblijfsdocument", r.state.laatsteOnderwerp === "werkautorisatie" && (laatste(r).keuzes || []).includes("Weet ik niet"));
  r = antwoord(r, ctx, "Ik heb een vergunning maar weet niet precies wat erop staat");
  test("Samir: onbekend", r.state.velden.werkautorisatie === "onbekend");
  test("Samir: 'Geen zorgen. Een collega kijkt met je mee'", alleTekst(r).includes("Een collega van EXTRA kijkt met je mee"));
  test("Samir: Job vraagt gewoon verder", r.state.laatsteOnderwerp === "diensten" && r.state.status === "bezig");
  r = antwoord(r, ctx, "3 of 4");
  r = antwoord(r, ctx, "35 km");
  r = antwoord(r, ctx, "Wanneer nodig");
  r = antwoord(r, ctx, "Binnen 2 weken");
  test("Samir: aan het eind naar de planner, niet afgewezen", r.state.status === "planner" && r.acties.some((a) => a.soort === "planner" && a.reden.includes("Werkautorisatie")));
  test("Samir: nooit gevraagd om een foto of nummer van een document", !alleTekst(r).match(/foto van|nummer van je|documentnummer/i));
}

// ─── 4. Ahmed: buiten de EU, arbeid vrij toegestaan ──────────────────────────
{
  const ctx: JobContext = { voornaam: "Ahmed", functie: "chef", nationalityZone: "NON_EU", hasCv: true };
  let r = start(ctx, "nl", NU);
  r = antwoord(r, ctx, "4 jaar in een restaurant in Rotterdam, het laatste jaar als zelfstandig kok");
  r = antwoord(r, ctx, "Alles, ook inkoop en de koelcel bijhouden");
  r = antwoord(r, ctx, "Arbeid vrij toegestaan, TWV niet vereist");
  test("Ahmed: 'TWV niet vereist' telt als vrij", r.state.velden.werkautorisatie === "vrij", String(r.state.velden.werkautorisatie));
  test("Ahmed: dan de vraag tot wanneer", r.state.laatsteOnderwerp === "geldigheid");
  r = antwoord(r, ctx, "Tot 2029");
  test("Ahmed: document meenemen naar het gesprek", alleTekst(r).includes("Neem het document mee"));
  r = antwoord(r, ctx, "3 of 4. Ik heb een auto, tot 50 km is prima");
  test("Ahmed: werkgebied uit hetzelfde antwoord", r.state.velden.werkgebied === "tot 50 km" && r.state.laatsteOnderwerp === "werkmoment");
  r = antwoord(r, ctx, "Doordeweeks");
  r = antwoord(r, ctx, "Direct");
  test("Ahmed: alles in orde, cv-controle", r.state.status === "cv_controle");
}

// ─── 4b. Hotelfuncties: jaren, hotels, sterren (akkoord Max 9 nov 2026) ─────
{
  const ctx: JobContext = { voornaam: "Noor", functie: "housekeeping", nationalityZone: "NL", hasCv: true, label: "hotels" };
  let r = start(ctx, "nl", NU);
  test("Noor: eerste vraag in jaren", laatste(r).tekst === "Vertel eens: hoeveel jaar ervaring heb je in de housekeeping tot nu toe?");
  // AI ziet dat AD niet duidelijk housekeeping is en vraagt door
  r = verwerk(r.state, ctx, { tekst: "2 jaar AD gedaan" }, { velden: { ervaring: "2 jaar AD", ervaringNiveau: "ervaren" }, taal: "nl", twijfel: null, ack: "Twee jaar AD, goed om te weten.", vervolgvraag: "Heb je ook op de kamers gewerkt?" }, later(1));
  test("Noor: bij AD vraagt Job door, met de reactie ervoor", laatste(r).tekst === "Twee jaar AD, goed om te weten. Heb je ook op de kamers gewerkt?" && r.state.laatsteOnderwerp === "functievraag", laatste(r).tekst);
  r = antwoord(r, ctx, "Ja, ook kamers");
  test("Noor: daarna de hotels", r.state.laatsteOnderwerp === "hotels");
  r = antwoord(r, ctx, "Okura en Ibis Centraal");
  r = antwoord(r, ctx, "4 sterren");
  test("Noor: vier sterren, daarna diensten", r.state.velden.sterren === "4" && r.state.laatsteOnderwerp === "diensten");
  test("Noor: geen vraag naar kamers per dienst", !alleTekst(r).includes("kamers maakte je"));
  // Een reactie na een knop wordt niet herhaald
  const k = verwerk(r.state, ctx, { tekst: "3 tot 4" }, { velden: { diensten: "3-4" }, taal: "nl", twijfel: null, ack: "Twee jaar AD, goed om te weten." }, later(5));
  test("Noor: geen reactie na een keuze-antwoord", !alleTekst(k).includes("Twee jaar AD"));
  test("Noor: profiel noemt hotels en sterren", /Okura en Ibis Centraal.*4 sterren/.test(profielVelden(k.state.velden).previousExperience || ""));

  // Past het antwoord wel: geen doorvraag, meteen hotels
  let p = start(ctx, "nl", NU);
  p = verwerk(p.state, ctx, { tekst: "3 jaar housekeeping" }, { velden: { ervaring: "3 jaar housekeeping", ervaringNiveau: "ervaren" }, taal: "nl", twijfel: null, ack: "" }, later(1));
  test("Noor 2: past het, dan meteen de hotels", p.state.laatsteOnderwerp === "hotels");

  // Geen ervaring: geen hotelvragen
  let z = start(ctx, "nl", NU);
  z = antwoord(z, ctx, "0 jaar");
  test("Noor 3: 0 jaar is geen ervaring, geen hotelvragen", z.state.velden.ervaringNiveau === "geen" && z.state.laatsteOnderwerp === "diensten" && alleTekst(z).includes("veel collega's zijn zo begonnen"));

  // Keuken via Hotels krijgt ook de hotelvragen; bediening via Events niet
  const keuken: JobContext = { voornaam: "Daan", functie: "chef", nationalityZone: "NL", hasCv: true, label: "hotels" };
  let kk = start(keuken, "nl", NU);
  kk = antwoord(kk, keuken, "4 jaar");
  test("Daan: keuken via Hotels, dan de hotels", kk.state.laatsteOnderwerp === "hotels");
  const events: JobContext = { voornaam: "Sem", functie: "horecamedewerker", nationalityZone: "NL", hasCv: true, label: "events" };
  let ev = start(events, "nl", NU);
  ev = antwoord(ev, events, "2 jaar achter de bar");
  test("Sem: Events houdt de eigen vervolgvraag", ev.state.laatsteOnderwerp === "functievraag");
  test("Reserve: sterren", reserveLezing("3 of minder", "sterren").velden.sterren === "3" && reserveLezing("vier", "sterren").velden.sterren === "4" && reserveLezing("4 of 5", "sterren").velden.sterren === "5");
}

// ─── 5. Uitzonderingen ───────────────────────────────────────────────────────
{
  const ctx: JobContext = { voornaam: "Mark", functie: "horecamedewerker", nationalityZone: "NL", hasCv: true };
  let r = start(ctx, "nl", NU);
  r = antwoord(r, ctx, "Nee, nog nooit");
  test("Mark: geen ervaring is geen probleem", alleTekst(r).includes("veel collega's zijn zo begonnen"));
  test("Mark: geen functievraag zonder ervaring", r.state.laatsteOnderwerp === "diensten");
  r = antwoord(r, ctx, "2"); r = antwoord(r, ctx, "25 km"); r = antwoord(r, ctx, "Avond en weekend"); r = antwoord(r, ctx, "Direct");
  test("Mark: starter in de bediening gaat gewoon door naar de cv-controle", r.state.status === "cv_controle");

  const chef: JobContext = { voornaam: "Tim", functie: "chef", nationalityZone: "NL", hasCv: true };
  test("Chef zonder ervaring: planner beslist", plannerRedenen({ ervaringNiveau: "geen" }, chef, []).length === 1);

  let m = start(ctx, "nl", NU);
  m = antwoord(m, ctx, "MENS");
  test("MENS: naar de planner, met reden", m.state.status === "planner" && m.acties.some((a) => a.soort === "planner"));
  m = antwoord(m, ctx, "Hallo?");
  test("Na MENS: Job zegt dat een collega meekijkt", alleTekst(m).includes("Een collega van EXTRA kijkt"));

  let e = start(ctx, "nl", NU);
  e = antwoord(e, ctx, "ENGLISH");
  test("ENGLISH: taal wisselt en de vraag komt opnieuw, in het Engels", e.state.taal === "en" && /hospitality/i.test(laatste(e).tekst));
  e = antwoord(e, ctx, "nederlands");
  test("NEDERLANDS: terug naar Nederlands", e.state.taal === "nl");

  // Harde no-go: geen Nederlands en geen Engels (alleen via de AI vast te stellen)
  const nogoLezing: Lezing = { velden: { talen: "Alleen Pools", nlOfEn: false }, taal: "anders", twijfel: null, ack: "" };
  let n = start(ctx, "nl", NU);
  n = verwerk(n.state, ctx, { tekst: "tylko polski" }, nogoLezing, later(1));
  test("No-go taal: naar de planner, Job wijst zelf niet af", n.state.status === "planner" && n.acties.some((a) => a.soort === "nogo"));
  test("No-go taal: vriendelijk bericht in het Engels", alleTekst(n).includes("Dutch or English"));

  // Een kort of Nederlands antwoord is nooit een no-go op taal, ook niet als de AI dat denkt
  let n2 = start(ctx, "nl", NU);
  n2 = verwerk(n2.state, ctx, { tekst: "1" }, { velden: { nlOfEn: false }, taal: "anders", twijfel: null, ack: "" }, later(1));
  test("Geen no-go: antwoord \"1\"", n2.state.status !== "planner" && !n2.acties.some((a) => a.soort === "nogo"));
  let n3 = start(ctx, "nl", NU);
  n3 = verwerk(n3.state, ctx, { tekst: "Tot 25 km" }, { velden: { nlOfEn: false }, taal: "nl", twijfel: null, ack: "" }, later(1));
  test("Geen no-go: Nederlands antwoord", !n3.acties.some((a) => a.soort === "nogo") && !alleTekst(n3).includes("Dutch or English"));

  // Geen cv bij de hand
  const zonderCv: JobContext = { ...ctx, hasCv: false };
  let c = start(zonderCv, "nl", NU);
  c = antwoord(c, zonderCv, "Twee jaar bediening"); c = antwoord(c, zonderCv, "Allebei"); c = antwoord(c, zonderCv, "3 of 4");
  c = antwoord(c, zonderCv, "Tot 35 km"); c = antwoord(c, zonderCv, "Doordeweeks"); c = antwoord(c, zonderCv, "Later");
  c = antwoord(c, zonderCv, "Nee");
  test("Geen cv: mail met uploadknop, wachten", c.state.status === "wacht_cv" && c.acties.some((a) => a.soort === "cv_mail"));
  c = antwoord(c, zonderCv, "Ok, komt eraan");
  test("Geen cv: de mail gaat maar één keer", !c.acties.some((a) => a.soort === "cv_mail"));
}

// ─── 6. Herinneringen ────────────────────────────────────────────────────────
{
  const ctx: JobContext = { voornaam: "Noor", functie: "housekeeping", nationalityZone: "NL", hasCv: false };
  const r = start(ctx, "nl", NU);
  const s: JobState = r.state;
  test("Herinnering: niet na 21 uur", herinneringNodig(s, new Date(NU.getTime() + 21 * UUR)) === null);
  test("Herinnering: eerste na 22 uur", herinneringNodig(s, new Date(NU.getTime() + 22 * UUR)) === "eerste");
  const h1 = herinnering(s, ctx, "eerste", new Date(NU.getTime() + 22 * UUR));
  test("Herinnering 1: tekst en knoppen Verder / Liever bellen", h1.berichten[0].tekst.includes("je was bijna klaar") && (h1.berichten[0].keuzes || []).includes("Liever bellen"));
  test("Herinnering: tweede pas 48 uur na de eerste", herinneringNodig(h1.state, new Date(NU.getTime() + 69 * UUR)) === null && herinneringNodig(h1.state, new Date(NU.getTime() + 70 * UUR)) === "tweede");
  const h2 = herinnering(h1.state, ctx, "tweede", new Date(NU.getTime() + 70 * UUR));
  test("Herinnering: daarna rood voor de planner", herinneringNodig(h2.state, new Date(NU.getTime() + 118 * UUR)) === "rood");
  const rood = herinnering(h2.state, ctx, "rood", new Date(NU.getTime() + 118 * UUR));
  test("Rood: status geen reactie, planner krijgt een melding, geen bericht", rood.state.status === "geen_reactie" && rood.berichten.length === 0 && rood.acties.some((a) => a.soort === "planner"));
  const terug = antwoord({ state: rood.state, berichten: [], acties: [] }, ctx, "Sorry, druk gehad. Ik heb 3 jaar housekeeping gedaan", 200 * 60);
  test("Rood: wie toch reageert, gaat verder waar hij was", terug.state.status === "bezig" && terug.state.herinneringen === 0);
  const verder = antwoord({ state: h1.state, berichten: [], acties: [] }, ctx, "Verder");
  test("Verder: Job stelt de openstaande vraag opnieuw", verder.state.status === "bezig" && verder.berichten.length === 1 && verder.berichten[0].tekst.includes("housekeeping"));
  test("Liever bellen: naar de planner", antwoord({ state: h1.state, berichten: [], acties: [] }, ctx, "Liever bellen").state.status === "planner");
  test("Geen herinneringen als het gesprek bij de planner ligt", herinneringNodig({ ...s, status: "planner" }, new Date(NU.getTime() + 100 * UUR)) === null);
}

// ─── 7. Na het plannen ───────────────────────────────────────────────────────
{
  const ctx: JobContext = { voornaam: "Lisa", functie: "horecamedewerker", nationalityZone: "NL", hasCv: true, afspraak: { dag: "Dinsdag 10 november", tijd: "14:00", wie: "Charlotte" } };
  const s: JobState = { ...start(ctx, "nl", NU).state, status: "gepland" };
  const v = antwoord({ state: s, berichten: [], acties: [] }, ctx, "VERZETTEN");
  test("Verzetten: terug naar plannen met de momentenkiezer", v.state.status === "plannen" && v.berichten.some((b) => b.planning) && v.acties.some((a) => a.soort === "verzetten"));
  const vraagErna = antwoord({ state: s, berichten: [], acties: [] }, ctx, "Waar is het ook alweer?");
  test("Na het plannen: Job noemt de afspraak", alleTekst(vraagErna).includes("Dinsdag 10 november om 14:00"));
  test("Ik kom: 'Fijn, tot morgen!'", alleTekst(antwoord({ state: s, berichten: [], acties: [] }, ctx, "Ik kom")) === "Fijn, tot morgen!");
}

// ─── 8. Volgorde en commando's ───────────────────────────────────────────────
{
  const ctx: JobContext = { voornaam: "X", functie: "logistiek", nationalityZone: null, hasCv: false };
  test("Onbekende nationaliteit: geen werkautorisatievraag", volgendeOnderwerp({ ervaring: "x", functievraag: "y" }, ctx) === "diensten");
  test("Alles bekend en cv paraat: geen vraag meer", volgendeOnderwerp({ ervaring: "x", functievraag: "y", diensten: "1-2", werkgebied: "a", werkmoment: "flexibel", startdatum: "direct", cvParaat: "ja" }, ctx) === null);
  test("Talen wordt niet meer gevraagd", volgendeOnderwerp({ ervaring: "x", functievraag: "y", diensten: "1-2", werkgebied: "a", werkmoment: "flexibel", startdatum: "later" }, ctx) === "cv");
  test("Reserve: werkmoment uit eigen woorden", reserveLezing("vooral in het weekend", "werkmoment").velden.werkmoment === "avond_weekend" && reserveLezing("maakt niet uit", "werkmoment").velden.werkmoment === "flexibel" && reserveLezing("Weekdays", "werkmoment").velden.werkmoment === "doordeweeks");
  test("Reserve: startdatum uit eigen woorden", reserveLezing("Meteen!", "startdatum").velden.startdatum === "direct" && reserveLezing("volgende week", "startdatum").velden.startdatum === "twee_weken" && reserveLezing("Later", "startdatum").velden.startdatum === "later" && reserveLezing("Within 2 weeks", "startdatum").velden.startdatum === "twee_weken");
  test("Reserve: vaag startmoment blijft leeg", reserveLezing("weet ik nog niet", "startdatum").velden.startdatum === undefined);
  test("AI-antwoord: werkmoment en startdatum alleen geldige waarden", valideerLezing({ velden: { werkmoment: "avond_weekend", startdatum: "morgen" } }).velden.werkmoment === "avond_weekend" && valideerLezing({ velden: { startdatum: "morgen" } }).velden.startdatum === undefined);
  test("Bij de vraag naar talen is 'Nederlands' een antwoord", herkenCommando("Nederlands", "talen") === null && herkenCommando("Nederlands", "diensten") === "nederlands");
  test("Commando's herkend", herkenCommando("Mens") === "mens" && herkenCommando("HUMAN.") === "mens" && herkenCommando("reschedule") === "verzetten" && herkenCommando("Ik kom") === "ikkom" && herkenCommando("ik kom morgen om 2 uur") === null);
}

// ─── 9. Uitlezen ─────────────────────────────────────────────────────────────
{
  const v = valideerLezing({ velden: { diensten: "7", werkautorisatie: "ja", nlOfEn: "nee", cvParaat: "ja", talen: " Engels " }, taal: "fr", ack: "Mooi! Hoeveel dagen?" });
  test("AI-antwoord: ongeldige waarden vallen weg", v.velden.diensten === undefined && v.velden.werkautorisatie === undefined && v.velden.nlOfEn === undefined);
  test("AI-antwoord: geldige waarden blijven", v.velden.cvParaat === "ja" && v.velden.talen === "Engels");
  test("AI-antwoord: onbekende taal wordt null", v.taal === null);
  test("AI-antwoord: een bevestiging met een vraag wordt weggegooid", v.ack === "");
  test("AI-antwoord: rommel geeft een lege lezing", JSON.stringify(valideerLezing("kapot").velden) === "{}");
  test("Reserve: diensten '5 dagen' is 5+", reserveLezing("5 dagen", "diensten").velden.diensten === "5+");
  test("Reserve: 'weekend' is 1-2", reserveLezing("alleen in het weekend", "diensten").velden.diensten === "1-2");
  test("Reserve: vage diensten blijft leeg, Job vraagt opnieuw", reserveLezing("maakt niet uit", "diensten").velden.diensten === undefined);
  test("Reserve: zegt nooit dat iemand geen NL/EN spreekt", reserveLezing("Pools en Russisch", "talen").velden.nlOfEn === undefined);
  test("Reserve: taal raden", raadTaal("I have worked in a hotel for two years") === "en" && raadTaal("Ik heb twee jaar in een hotel gewerkt") === "nl");
}

// ─── 10. Inplannen ───────────────────────────────────────────────────────────
{
  const [charlotte, lea] = STANDAARD_INTERVIEWERS;
  test("Charlotte: 8 momenten, niet tijdens de pauze", JSON.stringify(tijdenVan(charlotte)) === JSON.stringify(["10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00"]), tijdenVan(charlotte).join(","));
  test("Lea: 13:00 tot en met 16:30", JSON.stringify(tijdenVan(lea)) === JSON.stringify(["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]));
  test("Charlotte werkt maandag tot en met vrijdag", JSON.stringify(charlotte.dagen) === "[1,2,3,4,5]");
  test("Weekdag van 10 november 2026 is dinsdag", weekdag("2026-11-10") === 2);
  test("Amsterdam: 9:00 UTC in november is 10:00", amsterdam(new Date("2026-11-09T09:00:00Z")).tijd === "10:00");
  test("Amsterdam: 9:00 UTC in juli is 11:00", amsterdam(new Date("2026-07-09T09:00:00Z")).tijd === "11:00");

  const vrijdagAvond = new Date("2026-11-06T18:00:00Z");
  const m = vrijeMomenten(STANDAARD_INTERVIEWERS, [], vrijdagAvond);
  test("Geen momenten in het weekend", m.every((x) => weekdag(x.datum) <= 5));
  test("Eerste moment: maandag 10:30 bij Charlotte", m[0]?.datum === "2026-11-09" && m[0]?.tijd === "10:30" && m[0]?.interviewer === "Charlotte", JSON.stringify(m[0]));
  test("Per tijd één moment, ook als twee interviewers vrij zijn", m.filter((x) => x.datum === "2026-11-09" && x.tijd === "13:00").length === 1);
  test("Maandag: 10:30 tot en met 16:30 zonder 12:00 en 12:30", m.filter((x) => x.datum === "2026-11-09").map((x) => x.tijd).join(",") === "10:30,11:00,11:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30");
  const bezet = [{ interviewer: "Charlotte", datum: "2026-11-09", tijd: "13:00" }];
  const m2 = vrijeMomenten(STANDAARD_INTERVIEWERS, bezet, vrijdagAvond);
  test("Bezet bij Charlotte: Lea neemt het moment", m2.find((x) => x.datum === "2026-11-09" && x.tijd === "13:00")?.interviewer === "Lea");
  const beidenBezet = [...bezet, { interviewer: "Lea", datum: "2026-11-09", tijd: "13:00" }];
  test("Allebei bezet: het moment verdwijnt", !vrijeMomenten(STANDAARD_INTERVIEWERS, beidenBezet, vrijdagAvond).some((x) => x.datum === "2026-11-09" && x.tijd === "13:00"));
  test("Moment controleren vlak voor boeken", momentGeldig(STANDAARD_INTERVIEWERS, beidenBezet, vrijdagAvond, { datum: "2026-11-09", tijd: "13:00" }) === null && momentGeldig(STANDAARD_INTERVIEWERS, [], vrijdagAvond, { datum: "2026-11-09", tijd: "13:00" }) !== null);
  const maandagOchtend = new Date("2026-11-09T08:00:00Z");
  test("Niet vandaag en niet binnen 12 uur", vrijeMomenten(STANDAARD_INTERVIEWERS, [], maandagOchtend).every((x) => x.datum > "2026-11-09"));
  test("Twee weken vooruit, 10 werkdagen", new Set(m.map((x) => x.datum)).size === 10);
  test("Een uitgezette interviewer krijgt geen gesprekken", vrijeMomenten([{ ...charlotte, actief: false }, lea], [], vrijdagAvond).every((x) => x.interviewer === "Lea"));
  test("Dagtekst Nederlands", dagTekst("2026-11-10", "nl") === "Dinsdag 10 november");
  test("Dagtekst Engels", dagTekst("2026-11-10", "en") === "Tuesday 10 November");
  test("plusDag over de maand heen", plusDag("2026-11-30", 1) === "2026-12-01");
  const a = { datum: "2026-11-10", tijd: "14:00", herinneringVerstuurd: false };
  test("Afspraakherinnering: niet om 17:00 de dag ervoor", !afspraakHerinneringNodig(a, new Date("2026-11-09T16:00:00Z")));
  test("Afspraakherinnering: wel om 18:00 de dag ervoor", afspraakHerinneringNodig(a, new Date("2026-11-09T17:00:00Z")));
  test("Afspraakherinnering: niet na het gesprek", !afspraakHerinneringNodig(a, new Date("2026-11-10T14:00:00Z")));
  test("Afspraakherinnering: maar één keer", !afspraakHerinneringNodig({ ...a, herinneringVerstuurd: true }, new Date("2026-11-09T17:00:00Z")));
  const ics = agendaBestand({ datum: "2026-11-10", tijd: "14:00", interviewer: "Charlotte", uid: "job-1" });
  test("Agenda: start en eind in Nederlandse tijd", ics.includes("DTSTART;TZID=Europe/Amsterdam:20261110T140000") && ics.includes("DTEND;TZID=Europe/Amsterdam:20261110T143000"));
}


// ─── Vloeiend gesprek: reactie en vraag in één bericht, vervolgvraag past bij de plek ──
{
  const ctx: JobContext = { voornaam: "Luuk", functie: "horecamedewerker", nationalityZone: "NL", hasCv: false };
  const s0 = start(ctx, "nl", NU).state;
  const lez = (ervaring: string, ack: string, extra: Partial<Lezing> = {}): Lezing => ({ velden: { ervaring, ervaringNiveau: "ervaren" }, taal: "nl", twijfel: null, ack, ...extra });
  const r1 = verwerk(s0, ctx, { tekst: "Heb gewerkt op festivals" }, lez("festivals", "Festivals, gezellig druk werk."), NU);
  test("Vloeiend: reactie en vraag in één bericht", r1.berichten.length === 1 && r1.berichten[0].tekst.startsWith("Festivals, gezellig druk werk. "), JSON.stringify(r1.berichten));
  test("Vloeiend: geen interne vlag in de berichten", !("reactie" in r1.berichten[0]));
  test("Festival: vervolgvraag zonder diners", /bar/.test(r1.berichten[0].tekst) && !/diner/i.test(r1.berichten[0].tekst), r1.berichten[0].tekst);
  const r2 = verwerk(s0, ctx, { tekst: "Twee jaar in een restaurant" }, lez("twee jaar restaurant", ""), NU);
  test("Restaurant: gewone vervolgvraag over bediening en diners", /diners/.test(r2.berichten[0].tekst) && r2.berichten.length === 1);
  const r3 = verwerk(s0, ctx, { tekst: "Op een cruiseschip" }, lez("cruiseschip", "", { vervolgvraag: "Stond je aan boord vooral achter de bar of in het restaurant?" }), NU);
  test("AI-vervolgvraag gaat voor", r3.berichten[0].tekst === "Stond je aan boord vooral achter de bar of in het restaurant?");
  test("Lezer: standaardzin 'Mooi, dank je!' valt weg", valideerLezing({ velden: {}, ack: "Mooi, dank je!" }).ack === "");
  test("Lezer: vervolgvraag zonder vraagteken valt weg", valideerLezing({ velden: {}, vervolgvraag: "Vertel meer" }).vervolgvraag === undefined);
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
