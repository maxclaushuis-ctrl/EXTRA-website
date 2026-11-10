/**
 * Huistests Job 3.0 fase 1: STOP en terugkomen, een bestand tijdens de vragen
 * en spraakberichten. Fictieve kandidaten, geen database, geen AI.
 * Run met:  npx tsx shared/jobFase1.test.ts
 */
import {
  start, verwerk, herkenCommando, herinneringNodig, planHerinneringNodig, bestandTijdensVragen, spraakBericht, teksten,
  type JobContext, type JobState, type Resultaat,
} from "./jobRegels";
import { reserveLezing } from "./jobLezen";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

const NU = new Date("2026-11-10T09:00:00Z");
const later = (uur: number) => new Date(NU.getTime() + uur * 3600 * 1000);
const nl = teksten("nl");
const en = teksten("en");

function antwoord(s: JobState, ctx: JobContext, tekst: string, uur = 1): Resultaat {
  const lezing = herkenCommando(tekst, s.laatsteOnderwerp) ? null : reserveLezing(tekst, s.laatsteOnderwerp);
  return verwerk(s, ctx, { tekst }, lezing, later(uur));
}

const ctx: JobContext = { voornaam: "Noor", functie: "housekeeping", nationalityZone: "NL", hasCv: false, stopV3: true };

/** Een gesprek dat bij de vraag over diensten STOP kreeg. */
function gestoptBijDiensten(c: JobContext = ctx): JobState {
  let r = start(c, "nl", NU);
  r = antwoord(r.state, c, "2 jaar in een hotel, kamers opmaken");
  for (let i = 0; i < 6 && r.state.laatsteOnderwerp !== "diensten"; i++) {
    const o = r.state.laatsteOnderwerp;
    r = antwoord(r.state, c, o === "hotels" ? "Hotel Amstelzicht" : o === "sterren" ? "4" : o === "functievraag" ? "Kamers opmaken en schoonmaken" : "ja");
  }
  return { ...r.state, status: "gestopt" };
}

// ─── STOP en terugkomen ──────────────────────────────────────────────────────
{
  const s = gestoptBijDiensten();
  test("Opzet: gestopt bij diensten", s.status === "gestopt" && s.laatsteOnderwerp === "diensten", `${s.status} ${s.laatsteOnderwerp}`);

  const onduidelijk = antwoord(s, ctx, "hallo?");
  test("Onduidelijk bericht: Job vraagt of de kandidaat verder wil", onduidelijk.berichten.length === 1 && onduidelijk.berichten[0].tekst === nl.welkomTerug && JSON.stringify(onduidelijk.berichten[0].keuzes) === JSON.stringify(nl.welkomTerugKeuzes));
  test("Onduidelijk bericht: gesprek blijft gestopt, niets hervat", onduidelijk.state.status === "gestopt" && !onduidelijk.acties.some((a) => a.soort === "hervat"));

  const vraagWaarom = antwoord(s, ctx, "Waarom stuurden jullie dit?");
  test("Vraag zonder wens: antwoord, maar hervat niets", vraagWaarom.state.status === "gestopt" && vraagWaarom.berichten[0].tekst === nl.welkomTerug);

  const ja = antwoord(onduidelijk.state, ctx, "Ja, verder");
  test("Ja, verder: gesprek hervat bij de open vraag", ja.state.status === "bezig" && ja.state.laatsteOnderwerp === "diensten");
  test("Ja, verder: één bericht, welkom terug plus de vraag", ja.berichten.length === 1 && ja.berichten[0].tekst.startsWith(nl.welkomTerugKort + " ") && ja.berichten[0].tekst.includes(nl.diensten), JSON.stringify(ja.berichten));
  test("Ja, verder: WhatsApp-toestemming weer aan (actie hervat)", ja.acties.some((a) => a.soort === "hervat"));
  test("Ja, verder: herinneringen blijven uit", ja.state.velden.herinneringenUit === true && herinneringNodig(ja.state, later(80)) === null);

  const wens = antwoord(s, ctx, "Sorry, was druk. Ik wil toch verder");
  test("Duidelijke wens in eigen woorden hervat ook", wens.state.status === "bezig" && wens.acties.some((a) => a.soort === "hervat"));

  const nee = antwoord(onduidelijk.state, ctx, "Nee");
  test("Nee: blijft gestopt met één bevestiging", nee.state.status === "gestopt" && nee.berichten.length === 1 && nee.berichten[0].tekst === nl.blijftGestopt && nee.acties.length === 0);

  const direct = antwoord(s, ctx, "3 tot 4");
  test("Antwoord op de open vraag: verder waar het was", direct.state.status === "bezig" && direct.state.velden.diensten === "3-4" && direct.state.laatsteOnderwerp !== "diensten", JSON.stringify(direct.state.velden));
  test("Antwoord op de open vraag: actie hervat", direct.acties.some((a) => a.soort === "hervat"));

  test("Nee hoor, ik wil toch verder: hervat", antwoord(s, ctx, "Nee hoor, ik wil toch verder").state.status === "bezig");
  test("Ja hoi, wie is dit? met een vraag erachter: niet hervat", antwoord(s, ctx, "Ja hoi, wie is dit eigenlijk?").state.status === "gestopt");
  const knopNummer = antwoord(onduidelijk.state, ctx, "ja");
  test("Kort 'ja' na de welkom-terugvraag hervat", knopNummer.state.status === "bezig");

  // Een open vraag die elke tekst aanneemt (hotels): een groet of vraag is geen antwoord.
  const sHotels: JobState = { ...s, laatsteOnderwerp: "hotels", velden: { ...s.velden, hotels: undefined, sterren: undefined } };
  test("Hotels open: 'hallo?' hervat niets", antwoord(sHotels, ctx, "hallo?").state.status === "gestopt");
  test("Hotels open: 'wie is dit?' hervat niets", antwoord(sHotels, ctx, "wie is dit").state.status === "gestopt");
  const jaHotels = antwoord(sHotels, ctx, "Ja, verder");
  test("Hotels open: 'Ja, verder' wordt niet als hotel opgeslagen", jaHotels.state.status === "bezig" && jaHotels.state.velden.hotels === undefined && jaHotels.state.laatsteOnderwerp === "hotels", JSON.stringify(jaHotels.state.velden));
  const interesse = antwoord(sHotels, ctx, "Toch wel interesse");
  test("Hotels open: 'Toch wel interesse' hervat, niet als hotel", interesse.state.status === "bezig" && interesse.state.velden.hotels === undefined);
  test("Hotels open: een hotelnaam is een antwoord", antwoord(sHotels, ctx, "Hotel Amstelzicht en Hotel Zuidas").state.status === "bezig");

  // Schakelaar uit: oud gedrag, meteen verder.
  const oud = antwoord({ ...s }, { ...ctx, stopV3: false }, "hallo?");
  test("Schakelaar uit: oud gedrag (meteen verder)", oud.state.status === "bezig" && !oud.berichten.some((b) => b.tekst === nl.welkomTerug));

  // Engels
  const sEn: JobState = { ...s, taal: "en" };
  const enOnduidelijk = antwoord(sEn, ctx, "hi");
  test("EN: welkom terug met Engelse knoppen", enOnduidelijk.berichten[0].tekst === en.welkomTerug && JSON.stringify(enOnduidelijk.berichten[0].keuzes) === JSON.stringify(en.welkomTerugKeuzes));
  test("EN: Yes, continue hervat", antwoord(enOnduidelijk.state, ctx, "Yes, continue").state.status === "bezig");

  // Herinneringen na hervatten en na plannen
  const hervat = ja.state;
  test("Na hervatten geen herinnering, ook niet na dagen", herinneringNodig(hervat, later(24 * 5)) === null);
  test("Na hervatten geen planherinnering", planHerinneringNodig({ ...hervat, status: "plannen" }, later(24 * 5)) === false);
  test("Zonder STOP gaan herinneringen gewoon", herinneringNodig({ ...hervat, velden: { ...hervat.velden, herinneringenUit: undefined } }, later(30)) === "eerste");
}

// ─── Een bestand tijdens de vragen ───────────────────────────────────────────
{
  const s0 = { ...gestoptBijDiensten(), status: "bezig" as const };
  const pad = "/objects/fictief/bestand-1";
  const b = bestandTijdensVragen(s0, pad, later(1));
  test("Bestand: telt niet vanzelf als cv, Job vraagt het", b.berichten[0].tekst === nl.bestandVraag && JSON.stringify(b.berichten[0].keuzes) === JSON.stringify(nl.bestandKeuzes) && b.acties.length === 0);
  test("Bestand: pad onthouden, open vraag blijft", b.state.velden.bestandVraag === pad && b.state.laatsteOnderwerp === "diensten");

  const ja = antwoord(b.state, ctx, "Ja, mijn cv", 2);
  test("Ja, mijn cv: actie cv_bevestigd met het pad", ja.acties.some((a) => a.soort === "cv_bevestigd" && a.bijlage === pad));
  test("Ja, mijn cv: korte bevestiging plus de open vraag", ja.berichten.length === 1 && ja.berichten[0].tekst.startsWith(nl.cvBinnenKort + " ") && ja.berichten[0].tekst.includes(nl.diensten), JSON.stringify(ja.berichten));
  test("Ja, mijn cv: vraag opgeruimd, niets als antwoord opgeslagen", !ja.state.velden.bestandVraag && ja.state.velden.diensten === undefined);

  const nee = antwoord(b.state, ctx, "Nee", 2);
  test("Nee: geen cv, open vraag opnieuw", !nee.acties.some((a) => a.soort === "cv_bevestigd") && nee.berichten[0].tekst === nl.diensten && !nee.state.velden.bestandVraag);

  const anders = antwoord(b.state, ctx, "3 tot 4", 2);
  test("Ander antwoord: gewoon verwerkt, notitie voor de planner", anders.state.velden.diensten === "3-4" && anders.state.twijfels.some((t) => t.includes("bestand")) && !anders.acties.some((a) => a.soort === "cv_bevestigd"));

  const enB = bestandTijdensVragen({ ...s0, taal: "en" }, pad, later(1));
  test("EN: Yes, my CV", antwoord(enB.state, ctx, "Yes, my CV", 2).acties.some((a) => a.soort === "cv_bevestigd"));
}

// ─── Spraakbericht ───────────────────────────────────────────────────────────
{
  const s0 = { ...gestoptBijDiensten(), status: "geen_reactie" as const };
  const r = spraakBericht(s0, later(3));
  test("Spraak: Job vraagt om te typen", r.berichten.length === 1 && r.berichten[0].tekst === nl.spraak);
  test("Spraak: open vraag blijft staan, gesprek loopt weer", r.state.laatsteOnderwerp === "diensten" && r.state.status === "bezig");
  test("Spraak: venster van 24 uur opent (laatste inkomend)", r.state.laatsteInkomendAt === later(3).toISOString());
  test("Spraak: max 2 zinnen en 1 vraag", (nl.spraak.match(/\?/g) || []).length === 1 && nl.spraak.split(/[.?!]\s/).length <= 2);
}

// ─── Teksten: geen streepjes, kort ───────────────────────────────────────────
for (const k of ["gestopt", "welkomTerug", "welkomTerugKort", "blijftGestopt", "spraak", "bestandVraag", "cvBinnenKort"] as const) {
  for (const [taal, t] of [["nl", nl], ["en", en]] as const) {
    const tekst = (t as any)[k] as string;
    test(`${taal} ${k}: geen gedachtestreepje, hooguit 1 vraag`, !/[–—]/.test(tekst) && (tekst.match(/\?/g) || []).length <= 1);
  }
}

// ─── Slordige vragen (test Max, 10 nov) ──────────────────────────────────────
{
  const bar: JobContext = { voornaam: "Daan", functie: "horecamedewerker", label: "events", nationalityZone: "NL", hasCv: false, stopV3: true };
  let r = start(bar, "nl", NU);
  // Barwerk spreekt voor zich: geen vraag wat iemand achter de bar deed
  r = antwoord(r.state, bar, "Ik heb in een bar gewerkt als barman en op verschillende andere locaties zoals hockeyclubs");
  test("Barman: geen functievraag, door naar de volgende vraag", r.state.laatsteOnderwerp !== "functievraag", String(r.state.laatsteOnderwerp));
  // Een AI-lezing die bij een gewoon antwoord toch werkautorisatie invult, mag niets doen bij een Nederlandse kandidaat
  const s0 = { ...r.state, laatsteOnderwerp: "functievraag" as const, velden: { ...r.state.velden, functievraag: undefined } };
  const fout = verwerk(s0, bar, { tekst: "Drinken inschenken" }, { velden: { functievraag: "Drinken inschenken", werkautorisatie: "vrij", geldigTot: "2030" }, taal: "nl", twijfel: null, ack: "" }, later(2));
  test("NL: werkautorisatie uit de AI telt niet", fout.state.velden.werkautorisatie === undefined && fout.state.velden.geldigTot === undefined);
  test("NL: nooit de vraag tot wanneer het geldig is", fout.state.laatsteOnderwerp !== "geldigheid" && !fout.berichten.some((b) => b.tekst.includes(nl.geldigheid)), String(fout.state.laatsteOnderwerp));
  test("NL: geen document meenemen", !fout.berichten.some((b) => b.tekst.includes(nl.documentMee)));
  // Buiten de EU blijft de vraag naar de geldigheid wel
  const buiten: JobContext = { ...bar, nationalityZone: "NON_EU" };
  const s1 = { ...fout.state, laatsteOnderwerp: "werkautorisatie" as const, velden: { ...fout.state.velden } };
  const w = verwerk(s1, buiten, { tekst: "Arbeid vrij toegestaan" }, { velden: { werkautorisatie: "vrij" }, taal: "nl", twijfel: null, ack: "" }, later(3));
  test("Buiten de EU: na arbeid vrij volgt de geldigheid", w.state.laatsteOnderwerp === "geldigheid", String(w.state.laatsteOnderwerp));
  // "?" is geen antwoord: dezelfde vraag komt terug
  const v = verwerk(w.state, buiten, { tekst: "?" }, { velden: { geldigTot: "?" }, taal: "nl", twijfel: null, ack: "" }, later(4));
  test("Een vraagteken: dezelfde vraag opnieuw, niets ingevuld", v.state.laatsteOnderwerp === "geldigheid" && v.state.velden.geldigTot === undefined && !v.berichten.some((b) => b.tekst.includes(nl.documentMee)));
  // Bediening zonder barwerk krijgt de functievraag nog wel
  let o = start(bar, "nl", NU);
  o = antwoord(o.state, bar, "Twee jaar bediening in een restaurant");
  test("Bediening: functievraag blijft", o.state.laatsteOnderwerp === "functievraag", String(o.state.laatsteOnderwerp));
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
