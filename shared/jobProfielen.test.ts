/**
 * Huistests vraagversie 2: de functievragen per functie (shared/jobProfielen.ts), de verwerking
 * in de regels (shared/jobRegels.ts) en de match (shared/kandidaatMatch.ts). Zonder AI: de lezing
 * die de AI zou geven, staat in de test. Fictieve kandidaten.
 * Draaien: npx tsx shared/jobProfielen.test.ts
 */
import { MAX_FUNCTIEVRAGEN, PROFIELEN, tegenspraak, waardeGedragen, geldigePunten, keuzeWaarde, profielVoor, puntenSamenvatting, puntenUitKnop, puntVraag, volgendPunt } from "./jobProfielen";
import { profielVelden, plannerRedenen, samenvatting as plannerSamenvatting, start, teksten, verwerk, vraag, type JobContext, type JobState, type Lezing } from "./jobRegels";
import { bewijsCheck } from "./jobLezen";
import { stelGesprekSamen, zelfdeOpening, valideerGesprek } from "./jobGesprek";
import { herkansing } from "./jobHerhaling";
import { loonVoorVacature } from "../server/job/jobBeurt";
import { FUNCTIE_MODELLEN, bereken, gesprekKennisUit, invoerVan, matchFunctie, matchKaart, metNederlands, modelVoor, type Periode } from "./kandidaatMatch";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

const NU = new Date("2026-11-25T10:00:00Z");
const ctx = (functieCode: string, functie: string, extra: Partial<JobContext> = {}): JobContext => ({ voornaam: "Noor", functie, functieCode, nationalityZone: "NL", hasCv: false, stopV3: true, begrijpen: true, vraagversie2: true, ...extra });
const lees = (velden: Lezing["velden"], extra: Partial<Lezing> = {}): Lezing => ({ velden, taal: "nl", twijfel: null, ack: "", ...extra });
/** Eén beurt: het antwoord met wat de AI eruit zou halen. */
function beurt(s: JobState, c: JobContext, tekst: string, velden: Lezing["velden"], extra: Partial<Lezing> = {}) {
  return verwerk(s, c, { tekst }, lees(velden, extra), NU);
}
const laatste = (r: { berichten: { tekst: string }[] }) => r.berichten[r.berichten.length - 1]?.tekst || "";
/** Alles wat de planner ziet, zoals de gesprekstest het toont: samenvatting, profielvelden, kaartveld, redenen. */
function plannerZiet(st: JobState, c: JobContext): string {
  return [`Samenvatting: ${plannerSamenvatting(st.velden, c)}`, ...Object.entries(profielVelden(st.velden)).map(([k, w]) => `${k}: ${w}`),
    ...(st.velden.functievraag ? [`Functie (kaart): ${st.velden.functievraag}`] : []), ...plannerRedenen(st.velden, c, st.twijfels).map((x) => `Collega: ${x}`)].join("\n");
}

// ─── Profielen ──────────────────────────────────────────────────────────────
const codes = ["housekeeping", "frontoffice", "fb", "banqueting", "keuken", "afwas", "bediening", "bar", "dinerloper", "runner", "host", "supervisor", "orderpicker", "heftruck", "inpak", "expeditie", "magazijn", "voorraad", "open"];
test("een profiel voor elke functie op het formulier, plus weet ik nog niet", codes.every((c) => !!PROFIELEN[c]), codes.filter((c) => !PROFIELEN[c]).join(","));
test("oude codes en functionTypes vinden een profiel", profielVoor({ functie: "chef", functieCode: "keuken" })?.code === "keuken" && profielVoor({ functie: "logistiek", functieCode: "logistiek" })?.code === "magazijn" && profielVoor({ functie: "horecamedewerker" })?.code === "bediening");
test("geen gedachtestreepjes in de vragen", !Object.values(PROFIELEN).some((p) => p.punten.some((pt) => typeof pt.vraag !== "function" && /[\u2013\u2014]/.test(pt.vraag.nl + pt.vraag.en)) || /[\u2013\u2014]/.test(p.luisteren)));

// ─── Start en opening ───────────────────────────────────────────────────────
const hk = ctx("housekeeping", "housekeeping", { label: "hotels" });
const s0 = start(hk, "nl", NU);
test("start: nieuw gesprek krijgt vraagversie 2", s0.state.velden.vraagversie === 2);
test("start: opening per functie", laatste(s0) === "Vertel eens: hoeveel jaar ervaring heb je in de housekeeping van een hotel tot nu toe?", laatste(s0));
const oud = start({ ...hk, vraagversie2: false }, "nl", NU);
test("schakelaar uit: geen vraagversie, opening zoals het was", oud.state.velden.vraagversie === undefined && /in de housekeeping tot nu toe/.test(laatste(oud)));

// ─── Housekeeping: gedeeltelijk antwoord ────────────────────────────────────
let r = beurt(s0.state, hk, "Ik heb twee jaar in een hotel gewerkt", { ervaring: "twee jaar in een hotel", ervaringNiveau: "ervaren" });
test("housekeeping: na \"in een hotel gewerkt\" vraagt Job wat iemand deed", r.state.laatsteOnderwerp === "functievraag" && /hotelkamers schoon, de algemene ruimtes of allebei/.test(laatste(r)), laatste(r));
test("housekeeping: geen vraag naar welke hotels", !/welke hotels/i.test(laatste(r)));
test("housekeeping: één functievraag geteld", r.state.velden.functievragen === 1 && r.state.velden.puntGevraagd === "soort");
r = beurt(r.state, hk, "Vooral de kamers, soms de lobby", { punten: { soort: "allebei" } });
test("housekeeping: antwoord vastgelegd, door naar kamers per dienst", r.state.velden.punten?.soort === "allebei" && /Hoeveel kamers/.test(laatste(r)), laatste(r));
r = beurt(r.state, hk, "Een stuk of veertien", {});
test("housekeeping: tekstantwoord zonder AI-punt wordt letterlijk bewaard", r.state.velden.punten?.kamersPerDienst === "Een stuk of veertien");
test("housekeeping: sterren als derde functievraag, met knoppen", /hoogste aantal sterren/.test(laatste(r)) && (r.berichten[r.berichten.length - 1] as any).keuzes?.length === 3);
r = beurt(r.state, hk, "4 sterren", {});
test("housekeeping: knop sterren vastgelegd, ook in het bestaande veld", r.state.velden.punten?.sterren === "4" && r.state.velden.sterren === "4");
test("housekeeping: na drie functievragen door naar de vaste vragen", r.state.laatsteOnderwerp === "diensten" && r.state.velden.functievragen === 3, `${r.state.laatsteOnderwerp} ${r.state.velden.functievragen}`);
test("housekeeping: samenvatting voor de kaart", /Soort werk: kamers en algemene ruimtes/.test(r.state.velden.functievraag || "") && /Hoogste sterren: 4 sterren/.test(r.state.velden.functievraag || ""), r.state.velden.functievraag);

// ─── Meer antwoorden in één bericht ─────────────────────────────────────────
const s1 = start(hk, "nl", NU);
r = beurt(s1.state, hk, "Ik heb acht maanden zelfstandig kamers gedaan bij het Marriott, ik kan vanaf maandag, liefst twee avonden per week",
  { ervaring: "acht maanden zelfstandig kamers bij het Marriott", ervaringNiveau: "ervaren", punten: { soort: "kamers" }, startdatumTekst: "vanaf maandag", werkmomentTekst: "liefst avonden", diensten: "1-2" });
test("één bericht: soort, diensten en wat iemand letterlijk zei over start en avonden", r.state.velden.punten?.soort === "kamers" && r.state.velden.startdatumTekst === "vanaf maandag" && r.state.velden.startdatum === undefined && r.state.velden.werkmomentTekst === "liefst avonden" && r.state.velden.diensten === "1-2");
test("één bericht: vanaf maandag is geen \"direct\", en Job vraagt het niet opnieuw", (() => { let x = r; for (const t of ["Zo'n vijftien", "5 sterren", "Tot 25 km", "Naast mijn studie"]) x = beurt(x.state, hk, t, {}); return !x.state.velden.startdatum && x.state.laatsteOnderwerp !== "startdatum" && x.state.laatsteOnderwerp !== "werkmoment"; })());
test("één bericht: Job slaat de soortvraag over en vraagt kamers per dienst", /Hoeveel kamers/.test(laatste(r)) && r.state.velden.functievragen === 1, laatste(r));

// ─── Housekeeping leren: blijft onbekend, ook als de AI "geen ervaring" las ─────
r = beurt(start(hk, "nl", NU).state, hk, "Ik wil housekeeping leren", { ervaring: "nog geen ervaring, wil housekeeping leren", ervaringNiveau: "geen" });
test("housekeeping leren: ervaring blijft onbekend (niet geen)", r.state.velden.ervaringNiveau === undefined && r.state.velden.wilLeren === true, JSON.stringify(r.state.velden));
test("housekeeping leren: wat de planner ziet en wat de cv-analyse krijgt, zegt onbekend, niet 'nog geen ervaring'", /^Wil het werk leren; ervaring nog onbekend \("Ik wil housekeeping leren"\)$/.test(r.state.velden.ervaring || "") && !/nog geen ervaring/.test(profielVelden(r.state.velden).previousExperience || "") && gesprekKennisUit(r.state.velden, false).ervaringNiveau === null, r.state.velden.ervaring);
test("housekeeping leren: Job vraagt of iemand al hotelkamers schoonmaakte", laatste(r) === "Heb je al eens hotelkamers schoongemaakt?", laatste(r));
const rl = beurt(r.state, hk, "Ja, een zomer in een hotel in Zandvoort", {});
test("housekeeping leren: ja bevestigt kamers; Job vraagt niet opnieuw wat iemand deed maar hoeveel kamers", rl.state.velden.punten?.eerderKamers === "ja" && rl.state.velden.punten?.soort === "kamers" && /Hoeveel kamers/.test(laatste(rl)) && !/hotelkamers schoon, de algemene ruimtes of allebei/.test(laatste(rl)), laatste(rl));
test("housekeeping leren: het antwoord komt in de ervaring", /Al eens hotelkamers schoongemaakt \("Ja, een zomer in een hotel in Zandvoort"\)/.test(rl.state.velden.ervaring || ""), rl.state.velden.ervaring);
const rn = beurt(r.state, hk, "Nog niet", {});
test("housekeeping leren: nog niet, dan geen vragen over kamers", rn.state.velden.punten?.eerderKamers === "nee" && rn.state.laatsteOnderwerp === "diensten", laatste(rn));
test("housekeeping leren: nog niet, dan wel geen ervaring en dat staat er", rn.state.velden.ervaringNiveau === "geen" && /Nog geen hotelkamers schoongemaakt/.test(rn.state.velden.ervaring || ""));
// Daarna is de ervaring bekend: "nog onbekend" verdwijnt uit alles wat de planner ziet, ook aan het eind van het gesprek.
test("housekeeping leren, ja: ervaring zonder 'nog onbekend', met wat de kandidaat eerst zei", rl.state.velden.ervaring === 'Al eens hotelkamers schoongemaakt ("Ja, een zomer in een hotel in Zandvoort"), wil het werk leren ("Ik wil housekeeping leren")', rl.state.velden.ervaring);
{
  let x = beurt(rl.state, hk, "Een stuk of tien", {});
  // De vaste vragen: steeds de eerste knop, tot het gesprek klaar is.
  const vast: Record<string, [string, Lezing["velden"]]> = { diensten: ["3 tot 4", { diensten: "3-4" }], werkgebied: ["Tot 25 km", { werkgebied: "tot 25 km" }], werkmoment: ["Flexibel", { werkmoment: "flexibel" }],
    startdatum: ["Direct", { startdatum: "direct" }], werkvorm: ["Naast mijn studie", { werkvorm: "studie" }], cv: ["Nee", { cvParaat: "nee" }], functievraag: ["4 sterren", {}] };
  for (let i = 0; i < 12 && x.state.status === "bezig"; i++) { const [t, v] = vast[x.state.laatsteOnderwerp || ""] || ["Nee", {}]; x = beurt(x.state, hk, t, v); }
  const pz = plannerZiet(x.state, hk);
  console.log("   De planner ziet (housekeeping leren, ja):\n" + pz.split("\n").map((l) => `     ${l}`).join("\n"));
  test("housekeeping leren, ja: volledig profiel zonder 'onbekend' of 'geen ervaring', met Zandvoort", !/onbekend|geen ervaring|nog geen/i.test(pz) && /Zandvoort/.test(pz) && x.state.status !== "bezig", pz);
}
{
  const pz = plannerZiet(rn.state, hk);
  test("housekeeping leren, nog niet: het profiel zegt nog geen hotelkamers en niets over onbekend", /Nog geen hotelkamers schoongemaakt, wil het werk leren/.test(pz) && !/onbekend/.test(pz), pz);
}
// Varianten, Nederlands en Engels, ook kort of slordig: na "ja" op de kamervraag nooit opnieuw vragen wat iemand deed.
for (const [taal, opening, antwoord] of [
  ["nl", "Ik wil housekeeping leren", "Ja, een zomer in een hotel in Zandvoort"], ["nl", "ik wil housekeeping leren", "jaa n zomer zandvoort"], ["nl", "wil het graag leren", "Jep"],
  ["en", "I want to learn housekeeping", "Yes, one summer in a hotel in Zandvoort"], ["en", "i want to learn housekeeping", "yess 1 summer zandvoort"],
] as const) {
  const r0 = beurt(start(hk, taal, NU).state, hk, opening, { ervaring: "wil housekeeping leren", ervaringNiveau: "geen" }, { taal });
  const r1 = beurt(r0.state, hk, antwoord, {}, { taal });
  test(`housekeeping leren (${taal}, "${antwoord}"): kamers bevestigd, volgende vraag gaat over het aantal kamers`, r1.state.velden.punten?.eerderKamers === "ja" && r1.state.velden.punten?.soort === "kamers" && /Hoeveel kamers|how many rooms/i.test(laatste(r1)) && !/algemene ruimtes of allebei|public areas or both/.test(laatste(r1)), `${laatste(r0)} -> ${laatste(r1)}`);
}
// Wie op de openingsvraag zegt in een hotel te hebben gewerkt, zegt nog niet wat hij deed: dan wel de soortvraag.
for (const [taal, opening] of [["nl", "Ik heb een zomer in een hotel gewerkt"], ["nl", "zomer in hotel gewerkt"], ["en", "I worked one summer in a hotel"], ["en", "worked in hotel 1 summer"]] as const) {
  const r0 = beurt(start(hk, taal, NU).state, hk, opening, { ervaring: opening, ervaringNiveau: "starter" }, { taal });
  test(`hotel gewerkt (${taal}, "${opening}"): Job vraagt wat iemand daar deed`, !r0.state.velden.punten?.soort && /hotelkamers schoon, de algemene ruimtes of allebei|hotel rooms there, the public areas or both/.test(laatste(r0)), laatste(r0));
}
// Ervaring en iets willen leren in één bericht: de ervaring blijft staan.
for (const [naam, velden] of [["model las ervaren", { ervaring: "twee jaar hotelkamers schoonmaken, wil meer leren", ervaringNiveau: "ervaren" as const }], ["model gaf geen niveau", { ervaring: "twee jaar hotelkamers schoonmaken, wil meer leren" }]] as const) {
  const re = beurt(start(hk, "nl", NU).state, hk, "Ik maak al twee jaar hotelkamers schoon en wil meer leren", velden as any);
  const pz = plannerZiet(re.state, hk);
  test(`ervaring en meer leren (${naam}): de ervaring blijft, geen 'onbekend', geen leervraag`, re.state.velden.ervaring === "twee jaar hotelkamers schoonmaken, wil meer leren" && !re.state.velden.wilLeren && !/onbekend/.test(pz) && /twee jaar hotelkamers/.test(pz) && laatste(re) !== "Heb je al eens hotelkamers schoongemaakt?", `${re.state.velden.ervaring} | ${laatste(re)}`);
}
const rg = beurt(start(hk, "nl", NU).state, hk, "Ik wil het leren, ik heb het nog nooit gedaan", { ervaring: "nog nooit gedaan", ervaringNiveau: "geen" });
test("wil leren maar zegt er zelf bij nog nooit: dan wel geen ervaring", rg.state.velden.ervaringNiveau === "geen");

// ─── Maximaal drie functievragen ────────────────────────────────────────────
const fo = ctx("frontoffice", "frontoffice", { label: "hotels" });
let f = beurt(start(fo, "nl", NU).state, fo, "Drie jaar", { ervaring: "drie jaar receptie", ervaringNiveau: "ervaren" });
test("front office: eerst de taken", /Welke taken pakte je zelf op aan de receptie/.test(laatste(f)), laatste(f));
f = beurt(f.state, fo, "Inchecken en reserveringen", { punten: { taken: "inchecken en reserveringen" } });
test("front office: dan de talen", /In welke talen kun je gasten goed helpen/.test(laatste(f)), laatste(f));
f = beurt(f.state, fo, "Engels prima, Nederlands nog niet voor gasten", { punten: { engels: "ja", nederlands: "nee" } });
test("front office: Engels en Nederlands apart vastgelegd", f.state.velden.punten?.engels === "ja" && f.state.velden.punten?.nederlands === "nee");
f = beurt(f.state, fo, "Opera", {});
test("front office: na drie functievragen geen sterrenvraag meer", f.state.velden.functievragen === MAX_FUNCTIEVRAGEN && f.state.laatsteOnderwerp === "diensten" && !f.state.velden.punten?.sterren, `${f.state.laatsteOnderwerp}`);
test("front office: taal voor gastcontact in het profielveld, met bron", /Engels voor gastcontact: ja, Nederlands voor gastcontact: nee \(door kandidaat verteld\)/.test(profielVelden(f.state.velden).language || ""), profielVelden(f.state.velden).language);
const fo2 = beurt(beurt(start(fo, "nl", NU).state, fo, "Twee jaar", { ervaring: "twee jaar receptie", ervaringNiveau: "ervaren" }).state, fo, "Ik checkte dagelijks gasten in het Engels in", { punten: { taken: "dagelijks gasten inchecken", engels: "ja" } });
test("front office: \"in het Engels ingecheckt\" vult Engels, de taalvraag komt nog voor het Nederlands", fo2.state.velden.punten?.engels === "ja" && /talen/.test(laatste(fo2)), laatste(fo2));

// ─── Onduidelijk antwoord: dezelfde vraag ───────────────────────────────────
let o = beurt(start(fo, "nl", NU).state, fo, "Drie jaar", { ervaring: "drie jaar receptie", ervaringNiveau: "ervaren" });
o = beurt(o.state, fo, "?", {}, { geenAntwoord: true });
test("onduidelijk: het punt blijft open en telt niet dubbel", o.state.velden.puntGevraagd === "taken" && o.state.velden.functievragen === 1 && /taken/.test(laatste(o)), `${o.state.velden.puntGevraagd} ${o.state.velden.functievragen}`);

// ─── Keuken: correctie en keukenhulp ────────────────────────────────────────
const ku = ctx("keuken", "chef", { label: "hotels" });
let k = beurt(start(ku, "nl", NU).state, ku, "Twee jaar, ik stond op de warme kant", { ervaring: "twee jaar, stond op de warme kant", ervaringNiveau: "ervaren", punten: { zelfstandig: "ja" } });
test("keuken: eerst wat iemand deed in een drukke dienst", /drukke dienst/.test(laatste(k)), laatste(k));
k = beurt(k.state, ku, "Nee, ik hielp in de keuken, mijn collega stond zelfstandig op de warme kant", { ervaring: "twee jaar meegeholpen in de keuken; de collega stond zelfstandig op de warme kant", punten: { zelfstandig: "nee", taken: "meehelpen in de keuken" } }, { correctie: true });
test("correctie: zelfstandig wordt nee", k.state.velden.punten?.zelfstandig === "nee");
test("correctie: de oude aanname staat niet meer in de ervaring", !/stond op de warme kant(?!.*collega)/.test(k.state.velden.ervaring || "") && /collega/.test(k.state.velden.ervaring || ""), k.state.velden.ervaring);
test("keuken: na meehelpen stelt Job keukenhulp voor, met knoppen", /keukenhulp als een mogelijke richting/.test(laatste(k)), laatste(k));
k = beurt(k.state, ku, "Nee, ik zoek werk als kok", {});
test("keuken: knop 'Nee, ik zoek werk als kok' vastgelegd", k.state.velden.punten?.richting === "nee");
// Correctie tijdens de ervaringsvraag zelf (na een doorvraag): vervangen, niet erbij plakken.
const kc = verwerk({ ...start(ku, "nl", NU).state, velden: { vraagversie: 2, ervaring: "zelfstandig op de warme kant", ervaringNiveau: "ervaren" }, laatsteOnderwerp: "ervaring" }, ku, { tekst: "Nee, dat was mijn collega" }, lees({ ervaring: "hielp in de keuken; de collega stond op de warme kant" }, { correctie: true }), NU);
test("correctie bij de ervaringsvraag: vervangt de samenvatting", kc.state.velden.ervaring === "hielp in de keuken; de collega stond op de warme kant", kc.state.velden.ervaring);

// ─── Dinerloper ─────────────────────────────────────────────────────────────
const dl = ctx("dinerloper", "horecamedewerker", { label: "events" });
let d = beurt(start(dl, "nl", NU).state, dl, "Twee zomers op bruiloften, vooral met dienbladen", { ervaring: "twee zomers op bruiloften, vooral dienbladen", ervaringNiveau: "ervaren" });
test("dinerloper: vraagt naar drie borden aan tafel", /drie borden tegelijk aan tafel/.test(laatste(d)), laatste(d));
d = beurt(d.state, dl, "Nee, dat deden de vaste obers", { punten: { drieBorden: "nee" } });
test("dinerloper: geen drie borden, geen etiquettevraag meer", d.state.laatsteOnderwerp === "diensten", d.state.laatsteOnderwerp || "");
test("dinerloper: een collega kijkt", plannerRedenen(d.state.velden, dl, d.state.twijfels).some((x) => /drie borden/.test(x)));
const dlGeen = beurt(start(dl, "nl", NU).state, dl, "Nog nooit gedaan", { ervaring: "nog geen ervaring", ervaringNiveau: "geen" });
test("dinerloper zonder ervaring: een collega kijkt", plannerRedenen(dlGeen.state.velden, dl, []).some((x) => /Dinerloper vraagt relevante ervaring/.test(x)));
let d2 = beurt(start(dl, "nl", NU).state, dl, "Drie jaar galadiners bij een cateraar, altijd met drie borden aan tafel", { ervaring: "drie jaar galadiners bij een cateraar", ervaringNiveau: "ervaren", punten: { drieBorden: "ja" } });
test("dinerloper: drie borden al genoemd, dan alleen de etiquette", /Hoe serveerden jullie de gasten aan tafel/.test(laatste(d2)), laatste(d2));

// ─── Runner, host, supervisor, voorraad, heftruck ───────────────────────────
const ru = ctx("runner", "horecamedewerker", { label: "events" });
const rr = beurt(start(ru, "nl", NU).state, ru, "Ik liep op cateringevents met hapjes en drankjes en haalde glazen op", { ervaring: "cateringevents, hapjes en drankjes uitlopen, glazen ophalen", ervaringNiveau: "ervaren", punten: { past: "ja" } });
test("runner: werk al concreet beschreven, geen uitleg of functievraag", rr.state.laatsteOnderwerp === "diensten" && !/Als runner/.test(laatste(rr)), laatste(rr));
const rs = beurt(start(ru, "nl", NU).state, ru, "Geen ervaring", { ervaring: "geen", ervaringNiveau: "geen" });
test("runner: starter krijgt de uitleg en de vraag of het past", /Als runner loop je met dienbladen/.test(laatste(rs)) && /Is dat het soort werk dat je zoekt/.test(laatste(rs)), laatste(rs));

const ho = ctx("host", "horecamedewerker", { label: "events" });
let h = beurt(start(ho, "nl", NU).state, ho, "Twee jaar op beurzen bezoekers ontvangen", { ervaring: "twee jaar beurzen, bezoekers ontvangen", ervaringNiveau: "ervaren", punten: { waar: "op beurzen" } });
test("host: waar al bekend, dan de Engelse vraag", /goed in het Engels helpen/.test(laatste(h)), laatste(h));
h = beurt(h.state, ho, "Weet ik niet zo goed", {});
test("host: na een vaag antwoord vraagt Job het één keer opnieuw", /Engels/.test(laatste(h)), laatste(h));
h = beurt(h.state, ho, "Lastig te zeggen", {});
test("host: Engels niet vastgesteld blijft een open punt voor een collega", plannerRedenen(h.state.velden, ho, []).some((x) => /goed Engels is nog niet vastgesteld/.test(x)), JSON.stringify(h.state.velden.punten));

const su = ctx("supervisor", "horecamedewerker", { label: "events" });
const sv = beurt(start(su, "nl", NU).state, su, "We stonden met twaalf man op een festival", { ervaring: "festival, team van twaalf", ervaringNiveau: "ervaren", punten: { teamgrootte: "twaalf" } });
test("supervisor: teamgrootte zegt niet of iemand leidinggaf", sv.state.velden.punten?.teamgrootte === "twaalf" && /zelf een team aangestuurd/.test(laatste(sv)), laatste(sv));

const vo = ctx("voorraad", "logistiek", { label: "logistiek" });
const vr = beurt(start(vo, "nl", NU).state, vo, "Ik controleerde of de aantallen op de pakbon klopten", { ervaring: "controle van pakbonnen", ervaringNiveau: "ervaren", punten: { soort: "kwaliteit", controle: "of de aantallen op de pakbon klopten" } });
test("voorraad: wat iemand controleerde is al beantwoord", vr.state.laatsteOnderwerp === "diensten", vr.state.laatsteOnderwerp || "");

const ht = ctx("heftruck", "logistiek", { label: "logistiek" });
const hv = beurt(start(ht, "nl", NU).state, ht, "Ik reed op allebei, maar mijn certificaat is alleen voor de heftruck", { ervaring: "heftruck en reachtruck", ervaringNiveau: "ervaren", punten: { gereden: "allebei", certHeftruck: "opgegeven", certReachtruck: "geen" } });
test("heftruck: per truck vastgelegd en geen vraag meer", hv.state.velden.punten?.certHeftruck === "opgegeven" && hv.state.velden.punten?.certReachtruck === "geen" && hv.state.laatsteOnderwerp === "diensten", hv.state.laatsteOnderwerp || "");
let hq = beurt(start(ht, "nl", NU).state, ht, "Vier jaar", { ervaring: "vier jaar", ervaringNiveau: "ervaren" });
hq = beurt(hq.state, ht, "Allebei", {});
test("heftruck: bij allebei de vraag per truck", /Voor welke truck heb je een geldig certificaat/.test(laatste(hq)), laatste(hq));
hq = beurt(hq.state, ht, "Heftruck", {});
test("heftruck: knop Heftruck = heftruck opgegeven, reachtruck geen", hq.state.velden.punten?.certHeftruck === "opgegeven" && hq.state.velden.punten?.certReachtruck === "geen");
const pt = PROFIELEN.heftruck.punten.find((x) => x.sleutel === "certificaat")!;
test("heftruck: één truck, vraag en knoppen voor die truck", puntVraag(pt, {}, { gereden: "reachtruck" }, "nl").tekst === "Heb je voor de reachtruck een certificaat?" && JSON.stringify(puntenUitKnop(pt, { gereden: "reachtruck" }, "verlopen")) === '{"certReachtruck":"verlopen"}');

// ─── Meer functies: eerst de voorkeur ───────────────────────────────────────
const ev = ctx("bediening", "horecamedewerker", { label: "events", meerFuncties: true, functies: [{ code: "bediening", nl: "Bediening", en: "Waiting staff" }, { code: "bar", nl: "Bar", en: "Bar" }, { code: "runner", nl: "Runner", en: "Runner" }] });
let e = beurt(start(ev, "nl", NU).state, ev, "Twee zomers op festivals", { ervaring: "twee zomers festivals", ervaringNiveau: "ervaren" });
test("meer functies: eerst de voorkeur, met de gekozen functies als knoppen", /Je koos bediening, bar en runner/.test(laatste(e)), laatste(e));
e = beurt(e.state, ev, "Bar", {});
test("meer functies: voorkeur vastgelegd, dan de vraag van die functie", e.state.velden.punten?.voorkeur === "bar" && /Wat maakte of schonk je meestal/.test(laatste(e)), laatste(e));

// ─── Wat de AI teruggeeft ───────────────────────────────────────────────────
test("geldige punten: onbekende sleutel en waarde vallen weg", JSON.stringify(geldigePunten(dl, {}, { drieBorden: "misschien", etiquette: "ja", hack: "x" })) === '{"etiquette":"ja"}');
const bc = bewijsCheck({ punten: { drieBorden: "ja", etiquette: "ja" } }, { punten: { drieBorden: "drie borden" } }, "Ja, altijd met drie borden", "functievraag", "drieBorden");
test("bewijs: punt met citaat blijft, punt zonder citaat alleen als het gevraagd was", bc.punten?.drieBorden === "ja" && bc.punten?.etiquette === undefined, JSON.stringify(bc));
const bc2 = bewijsCheck({ punten: { drieBorden: "ja" } }, {}, "Ja", "functievraag", "drieBorden");
test("bewijs: kort antwoord op het gevraagde punt telt", bc2.punten?.drieBorden === "ja");
const zg = valideerGesprek({ soort: ["antwoord"], velden: { punten: { taken: "inchecken" } }, bewijs: { punten: { taken: "inchecken" } }, vraagt: "functievraag" }, "Dat zei ik toch", "functievraag", ["Ik deed inchecken en reserveringen"], "systeem");
test("dat zei ik toch: punt uit een eerder bericht telt", zg.velden.punten?.taken === "inchecken", JSON.stringify(zg.velden));
test("keuzewaarde: knoptekst naar waarde", keuzeWaarde(PROFIELEN.supervisor.punten[0], {}, {}, "Nog niet") === "nee");

// ─── Hoe Job schrijft ───────────────────────────────────────────────────────
test("zelfde opening als het vorige bericht wordt herkend", zelfdeOpening("Helder, dan weet ik genoeg.", "Helder! Hoeveel diensten wil je?") && !zelfdeOpening("Mooi.", "Helder! Hoeveel?"));
const gs = (reactie: string, vorig: string, soort: string[] = ["antwoord"], versie2 = true) => stelGesprekSamen({ gesprek: { ...valideerGesprek({ soort, reactie, vraag: "", vraagt: "diensten" }, "x", "werkgebied", []) }, regels: [{ tekst: "Hoeveel diensten per week zou je willen werken?" }], onderwerp: "diensten", standaard: "Hoeveel diensten per week zou je willen werken?", taal: "nl", vorigBericht: vorig, versie2 });
test("correctie: de woorden van het model zeggen niets toe (de bevestiging komt alleen uit het dossier)", gs("Helder, ik zet het op 1 tot 2.", "Helder! In welke regio wil je werken?", ["correctie"]).berichten[0].tekst === "Hoeveel diensten per week zou je willen werken?");
test("ook zonder vraagversie 2: een duidelijk antwoord krijgt geen reactie", gs("Tot 25 km. Dat is mooi dichtbij.", "x", ["antwoord"], false).berichten[0].tekst === "Hoeveel diensten per week zou je willen werken?");
test("kale bevestiging met hetzelfde openingswoord als het vorige bericht valt weg", gs("Helder.", "Helder! In welke regio wil je werken?").berichten[0].tekst === "Hoeveel diensten per week zou je willen werken?");
test("een herhaling van het antwoord valt weg, ook als die inhoudelijk klinkt", gs("Helder, tot 25 km is goed te doen.", "Helder! In welke regio wil je werken?").berichten[0].tekst === "Hoeveel diensten per week zou je willen werken?");
test("ergernis: een reactie met een andere opening blijft staan", gs("Snap ik, nog twee korte vragen.", "Helder! In welke regio wil je werken?", ["frustratie"]).berichten[0].tekst.startsWith("Snap ik"));
test("met een vraag erna hooguit één zin reactie", gs("Tot 25 km. Dat is mooi dichtbij.", "x").berichten[0].tekst === "Hoeveel diensten per week zou je willen werken?");
const loon = stelGesprekSamen({ gesprek: valideerGesprek({ soort: ["vraag"], kennis: "loon", vraagt: "diensten" }, "wat verdien ik", "diensten", []), regels: [{ tekst: "Hoeveel diensten per week zou je willen werken?" }], onderwerp: "diensten", standaard: "Hoeveel diensten per week zou je willen werken?", taal: "nl", loonTekst: loonVoorVacature("€20,76", "nl") });
test("loontekst: alleen wat de vacature onderbouwt (salaryMin, vanaf), geen all-in", loonVoorVacature("€20,76", "nl") === "Voor deze vacature staat een uurloon vanaf €20,76. De rest bespreekt een collega met je bij de kennismaking." && /van €20 tot €24\./.test(loonVoorVacature("€20 tot €24", "nl") || "") && loonVoorVacature(undefined, "nl") === undefined);
test("loonvraag bij een gekoppelde vacature: het loon van de vacature, dan de open vraag", /€20,76/.test(loon.berichten.map((b) => b.tekst).join(" ")) && /diensten/.test(loon.berichten.map((b) => b.tekst).join(" ")));
const loonAlg = stelGesprekSamen({ gesprek: valideerGesprek({ soort: ["vraag"], kennis: "loon", vraagt: "diensten" }, "wat verdien ik", "diensten", []), regels: [{ tekst: "Hoeveel diensten per week zou je willen werken?" }], onderwerp: "diensten", standaard: "Hoeveel diensten per week zou je willen werken?", taal: "nl" });
test("loonvraag zonder vacature: de goedgekeurde tekst", /hangt af van de functie en de opdracht/.test(loonAlg.berichten[0].tekst), loonAlg.berichten[0].tekst);

// ─── Lopende gesprekken ─────────────────────────────────────────────────────
const lopend: JobState = { ...start({ ...hk, vraagversie2: false }, "nl", NU).state };
const lr = verwerk(lopend, hk, { tekst: "2 jaar kamers bij het Hilton" }, lees({ ervaring: "2 jaar kamers bij het Hilton", ervaringNiveau: "ervaren" }), NU);
test("lopend gesprek zonder vraagversie: zoals het was (hotels of sterren)", lr.state.velden.vraagversie === undefined && /hotel|sterren/i.test(laatste(lr)), laatste(lr));
test("vraag() zonder velden blijft werken", !!vraag("functievraag", "nl", hk).tekst);

// ─── Kandidaatmatch ─────────────────────────────────────────────────────────
const peil = new Date("2026-11-25T12:00:00Z");
test("model: dinerloper heeft in vraagversie 2 een eigen model met ervaring vereist", modelVoor("dinerloper", "horecamedewerker", "events", true).sleutel === "dinerloper" && FUNCTIE_MODELLEN.dinerloper.soort === "vereist");
test("model: zonder vraagversie 2 zoals het was (dinerloper is events, heftruck met certificaatseis)", modelVoor("dinerloper", "horecamedewerker", "events").sleutel === "events" && modelVoor("heftruck", "logistiek", "logistiek").eisRegel === "certificaat" && modelVoor("heftruck", "logistiek", "logistiek", true).eisRegel === "ervaring");
const dPer: Periode[] = [{ functie: "Bediening bruiloften", soort: "zelfde", kerntaken: [0], begin: "2026-06", einde: "2026-08", bron: "cv" }];
const eisVan = (g: Parameters<typeof invoerVan>[3], per = dPer) => invoerVan(FUNCTIE_MODELLEN.dinerloper, per, [], g, peil).invoer.eis;
test("dinerloper: geen zesmaandengrens (drie maanden, drie borden en etiquette ja: voldaan)", eisVan({ ervaringNiveau: "ervaren", drieBorden: "ja", etiquette: "ja" }) === "voldaan");
test("dinerloper: drie borden ja, etiquette onbekend: onbekend", eisVan({ ervaringNiveau: "ervaren", drieBorden: "ja" }) === "onbekend");
test("dinerloper: drie borden nee volgens eigen antwoord: niet voldaan, geen score", eisVan({ ervaringNiveau: "ervaren", drieBorden: "nee" }) === "niet_voldaan" && matchKaart(FUNCTIE_MODELLEN.dinerloper, dPer, [], { drieBorden: "nee" }, peil).uitkomst.toestand === "eis_niet_voldaan");
test("dinerloper: de kaart toont drie borden en etiquette", /Drie borden aan tafel: ja \(door kandidaat verteld\)\. Serveeretiquette: onbekend\./.test(matchKaart(FUNCTIE_MODELLEN.dinerloper, dPer, [], { drieBorden: "ja" }, peil).eis.tekst));
const foKort: Periode[] = [{ functie: "Receptionist", soort: "zelfde", kerntaken: [0, 1], begin: "2026-08", einde: "heden", bron: "cv" }];
test("front office: zesmaandengrens blijft", invoerVan(FUNCTIE_MODELLEN.frontoffice, foKort, [], {}, peil).invoer.eis === "niet_voldaan");

const rec = (begin: string): Periode[] => [{ functie: "Receptionist", werkgever: "Hotel (fictief)", soort: "zelfde", kerntaken: [0, 1], begin, einde: "heden", bron: "cv" }];
const score = (per: Periode[], nl: "ja" | "nee" | null) => matchKaart(FUNCTIE_MODELLEN.frontoffice, per, [], { ervaringNiveau: "ervaren", nederlands: nl }, peil).uitkomst.score;
test("front office: weging staat op 0, scores veranderen niet (88 en 100)", [null, "ja", "nee"].every((nl) => score(rec("2025-09"), nl as any) === 88 && score(rec("2024-05"), nl as any) === 100));
const kaart = matchKaart(FUNCTIE_MODELLEN.frontoffice, rec("2025-09"), [], { engels: "ja", nederlands: "ja" }, peil, { versie2: true });
test("front office: Engels en Nederlands op de kaart, met de bron", kaart.berekening.some((r) => r[0] === "E Engels voor gastcontact" && r[3] === "ja · door kandidaat verteld" && r[1] === 0) && kaart.berekening.some((r) => r[0] === "F Nederlands voor gastcontact" && r[3] === "ja · door kandidaat verteld" && r[2] === "telt nog niet"));
test("front office zonder vraagversie 2: geen extra regels op de kaart", matchKaart(FUNCTIE_MODELLEN.frontoffice, rec("2025-09"), [], { nederlands: "ja" }, peil).berekening.length === 4);
const basis = (begin: string) => bereken(invoerVan(FUNCTIE_MODELLEN.frontoffice, rec(begin), [], {}, peil).invoer);
test("voorstel V2 (+3, plafond 100): 88 wordt 91, 100 blijft 100", metNederlands(basis("2025-09"), FUNCTIE_MODELLEN.frontoffice, { nederlands: "ja" }, 3).score === 91 && metNederlands(basis("2024-05"), FUNCTIE_MODELLEN.frontoffice, { nederlands: "ja" }, 3).score === 100);
test("voorstel V2: geen Nederlands of onbekend geeft niets erbij of eraf", metNederlands(basis("2025-09"), FUNCTIE_MODELLEN.frontoffice, { nederlands: "nee" }, 3).score === 88 && metNederlands(basis("2025-09"), FUNCTIE_MODELLEN.frontoffice, {}, 3).score === 88);
test("voorstel V2: dekking en voorlopig veranderen niet", (() => { const a = basis("2025-09"); const b = metNederlands(a, FUNCTIE_MODELLEN.frontoffice, { nederlands: "ja" }, 3); return a.dekking === b.dekking && a.voorlopig === b.voorlopig; })());
const hostPer: Periode[] = [{ functie: "Hostess beurzen", soort: "zelfde", kerntaken: [0], begin: "2025-01", einde: "heden", bron: "cv" }];
const hostScore = (nl: "ja" | "nee" | null) => matchKaart(modelVoor("host", "horecamedewerker", "events"), hostPer, [], { ervaringNiveau: "ervaren", nederlands: nl }, peil).uitkomst.score;
test("host: Nederlands heeft geen invloed op de score, ook niet met de voorgestelde weging", hostScore("ja") === hostScore("nee") && hostScore("nee") === hostScore(null) && metNederlands(bereken(invoerVan(modelVoor("host", "horecamedewerker", "events"), hostPer, [], {}, peil).invoer), modelVoor("host", "horecamedewerker", "events"), { nederlands: "ja" }, 3).score === hostScore(null));
test("gesprek naar match: alleen uit de punten, geen ervaring blijft geen", JSON.stringify(gesprekKennisUit({ ervaringNiveau: "geen", punten: { drieBorden: "ja", nederlands: "nee", engels: "ja" } }, true)) === '{"ervaringNiveau":"geen","drieBorden":"ja","etiquette":null,"engels":"ja","nederlands":"nee","gereden":null,"certHeftruck":null,"certReachtruck":null}');
test("samenvatting noemt wat nog open is", /nog open: /.test(puntenSamenvatting(ho, h.state.velden)), puntenSamenvatting(ho, h.state.velden));
test("volgend punt: niets als de functie onbekend is", volgendPunt({ functie: "onbekend" }, { vraagversie: 2 }) === null);

// ─── Zonder AI: kort ja of nee, en een herkansing over hetzelfde punt ───────
let jn = beurt(start(dl, "nl", NU).state, dl, "Twee jaar bruiloften", { ervaring: "twee jaar bruiloften", ervaringNiveau: "ervaren" });
jn = beurt(jn.state, dl, "Nee, dat deden de vaste obers", {});
test("zonder AI: \"Nee, dat deden de vaste obers\" is drie borden nee", jn.state.velden.punten?.drieBorden === "nee");
const hk2 = herkansing("functievraag", "nl", dl, { vraagversie: 2, ervaring: "x", ervaringNiveau: "ervaren" });
test("herkansing in vraagversie 2: over hetzelfde punt", /^Nog even over mijn vraag: heb je daar ook zelf met drie borden/.test(hk2?.tekst || ""), hk2?.tekst);

// ─── Besluiten Max 25 november 2026 ─────────────────────────────────────────
// 1. Front office: goed Engels is de basis.
let fe = beurt(start(fo, "nl", NU).state, fo, "Twee jaar receptie", { ervaring: "twee jaar receptie", ervaringNiveau: "ervaren", punten: { taken: "inchecken" } });
fe = beurt(fe.state, fo, "Nederlands", { punten: { nederlands: "ja" } });
test("front office: Engels onbekend na de taalvraag, één gerichte doorvraag", laatste(fe) === "Kun je gasten ook in het Engels ontvangen en hun vragen beantwoorden?", laatste(fe));
const feJa = beurt(fe.state, fo, "Ja", {});
test("front office: ja op de doorvraag vult Engels, geen collega", feJa.state.velden.punten?.engels === "ja" && !plannerRedenen(feJa.state.velden, fo, []).some((x) => /Front office/.test(x)));
const feNee = beurt(fe.state, fo, "Nee, alleen Nederlands", {});
test("front office: alleen Nederlands, geen Engels: een collega kijkt eerst", feNee.state.velden.punten?.engels === "nee" && plannerRedenen(feNee.state.velden, fo, []).some((x) => /niet in het Engels/.test(x)));
const feVaag = beurt(fe.state, fo, "Hmm een beetje misschien", {});
test("front office: na de doorvraag nog onbekend: open punt, geen tweede doorvraag", !feVaag.state.velden.punten?.engels && !/Engels/.test(laatste(feVaag)) && /nog open: .*Engels/.test(feVaag.state.velden.functievraag || ""), `${laatste(feVaag)} | ${feVaag.state.velden.functievraag}`);
test("front office: \"Engels\" op de taalvraag is een antwoord, geen taalwissel", beurt(beurt(start(fo, "nl", NU).state, fo, "Twee jaar", { ervaring: "twee jaar receptie", ervaringNiveau: "ervaren", punten: { taken: "inchecken" } }).state, fo, "Engels", { punten: { engels: "ja" } }).state.taal === "nl");
const feEn = beurt(start(fo, "nl", NU).state, fo, "Twee jaar, ik checkte dagelijks gasten in het Engels in", { ervaring: "twee jaar receptie", ervaringNiveau: "ervaren", punten: { taken: "inchecken", engels: "ja" } });
const feEn2 = beurt(feEn.state, fo, "Alleen Engels", { punten: { nederlands: "nee" } });
test("front office: goed Engels zonder Nederlands is voldoende", !plannerRedenen(feEn2.state.velden, fo, []).some((x) => /Front office/.test(x)) && !/in het Engels ontvangen/.test(laatste(feEn2)), laatste(feEn2));
// 2. Event supervisor: nog geen team, wel eventervaring.
let sx = beurt(start(su, "nl", NU).state, su, "Zes jaar op festivals en congressen", { ervaring: "zes jaar festivals en congressen", ervaringNiveau: "ervaren" });
sx = beurt(sx.state, su, "Nog niet", {});
test("supervisor: nog geen team aangestuurd, dan wat iemand zelf regelde", sx.state.velden.punten?.leiding === "nee" && laatste(sx) === "Wat regelde jij zelf tijdens een druk evenement?", laatste(sx));
sx = beurt(sx.state, su, "Ik deed de briefing van de runners en hield de bar bevoorraad", {});
test("supervisor: kort vastgelegd voor de collega, geen collega vooraf, geen grens in jaren", /Regelde zelf: Ik deed de briefing/.test(sx.state.velden.functievraag || "") && !plannerRedenen(sx.state.velden, su, []).length, sx.state.velden.functievraag);
// 3. Heftruck: zelf gereden is genoeg, certificaat apart per truck.
let hx = beurt(start(ht, "nl", NU).state, ht, "Drie jaar reachtruck", { ervaring: "drie jaar reachtruck", ervaringNiveau: "ervaren", punten: { gereden: "reachtruck" } });
hx = beurt(hx.state, ht, "Ja, verlopen", {});
test("heftruck: verlopen certificaat per truck vastgelegd, geen collega vooraf", hx.state.velden.punten?.certReachtruck === "verlopen" && !plannerRedenen(hx.state.velden, ht, []).length);
const hPer: Periode[] = [{ functie: "Reachtruckchauffeur", soort: "zelfde", kerntaken: [0, 1], begin: "2023-05", einde: "heden", bron: "cv" }];
const hk3 = matchKaart(FUNCTIE_MODELLEN.heftruck2, hPer, [], gesprekKennisUit(hx.state.velden, false), peil);
test("heftruck: zonder certificaat is de eis voldaan, de kaart noemt per truck wat er is", hk3.eis.status === "voldaan" && /Zelf gereden volgens de kandidaat: reachtruck\. Certificaat volgens de kandidaat: heftruck onbekend, reachtruck verlopen\. Per opdracht controleren\./.test(hk3.eis.tekst), hk3.eis.tekst);

// ─── Nalooppunten van 25 november ───────────────────────────────────────────
// 1. Een open antwoord alleen opslaan als het de vraag beantwoordt.
let ov = beurt(start(fo, "nl", NU).state, fo, "Drie jaar", { ervaring: "drie jaar receptie", ervaringNiveau: "ervaren", punten: { taken: "inchecken", engels: "ja", nederlands: "ja" } });
test("systeemvraag staat open", ov.state.velden.puntGevraagd === "systeem", ov.state.velden.puntGevraagd);
const alleenLoon = verwerk(ov.state, fo, { tekst: "Wat verdien ik eigenlijk?" }, lees({}, { bron: "ai" }), NU);
test("alleen een loonvraag, ook als het model hem als antwoord zag: systeem blijft open", !alleenLoon.state.velden.punten?.systeem && alleenLoon.state.velden.puntGevraagd === "systeem");
const zonderAi = verwerk(ov.state, fo, { tekst: "Wat verdien ik eigenlijk?" }, lees({}), NU);
test("zonder AI: een vraag wordt nooit als systeem opgeslagen", !zonderAi.state.velden.punten?.systeem);
const zonderAiOk = verwerk(ov.state, fo, { tekst: "Opera" }, lees({}), NU);
test("zonder AI: een gewoon antwoord wel", zonderAiOk.state.velden.punten?.systeem === "Opera");
// 3. Eisen gelijk in gesprek, plannerreden en kaart.
let de = beurt(start(dl, "nl", NU).state, dl, "Drie jaar galadiners, altijd met drie borden", { ervaring: "drie jaar galadiners", ervaringNiveau: "ervaren", punten: { drieBorden: "ja" } });
de = beurt(de.state, dl, "Eerlijk gezegd ken ik die regels niet", { punten: { etiquette: "nee" } });
const deKaart = matchKaart(modelVoor("dinerloper", "horecamedewerker", "events", true), dPer, [], gesprekKennisUit(de.state.velden, false), peil, { versie2: true });
test("dinerloper zonder etiquette: collega kijkt en de kaart zegt niet voldaan (geen voorlopige score)", plannerRedenen(de.state.velden, dl, []).some((x) => /etiquette/.test(x)) && deKaart.eis.status === "niet_voldaan" && deKaart.uitkomst.toestand === "eis_niet_voldaan");
const hGeen = beurt(start(ht, "nl", NU).state, ht, "Ik heb alleen meegereden", { ervaring: "alleen meegereden", ervaringNiveau: "ervaren", punten: { gereden: "geen" } });
test("heftruck nooit zelf gereden: een collega kijkt", plannerRedenen(hGeen.state.velden, ht, []).some((x) => /nog niet op een heftruck/.test(x)));
const hKaart = matchKaart(FUNCTIE_MODELLEN.heftruck2, hPer, [], gesprekKennisUit(hGeen.state.velden, false), peil, { versie2: true });
test("heftruck: cv toont rijwerk, kandidaat zegt nooit zelf gereden: af te wegen en zichtbaar voor de collega", hKaart.eis.status === "af_te_wegen" && hKaart.aandacht.some((a) => /zelf rijden/.test(a.t)), JSON.stringify(hKaart.aandacht));
test("heftruck: nooit gereden en geen rijwerk op het cv: niet voldaan", matchKaart(FUNCTIE_MODELLEN.heftruck2, [], [], { gereden: "geen", ervaringNiveau: "ervaren" }, peil).eis.status === "niet_voldaan");
// 4. De met de kandidaat vastgestelde functie, overal.
const evd = ctx("bediening", "horecamedewerker", { label: "events", meerFuncties: true, functies: [{ code: "bediening", nl: "Bediening", en: "Waiting staff" }, { code: "dinerloper", nl: "Dinerloper", en: "Food runner" }] });
let vk = beurt(start(evd, "nl", NU).state, evd, "Twee jaar op bruiloften", { ervaring: "twee jaar bruiloften", ervaringNiveau: "ervaren" });
vk = beurt(vk.state, evd, "Dinerloper", {});
test("voorkeur dinerloper: de vervolgvraag is die van dinerloper", vk.state.velden.punten?.voorkeur === "dinerloper" && /drie borden/.test(laatste(vk)), laatste(vk));
const mf = matchFunctie("bediening", vk.state.velden);
const vkKaart = matchKaart(modelVoor(mf, "horecamedewerker", "events", true), dPer, [], gesprekKennisUit(vk.state.velden, false), peil, { versie2: true, functie: mf, formulierKeuze: "bediening" });
test("voorkeur dinerloper: cv-analyse en kaart rekenen met dinerloper, de formulierkeuze blijft zichtbaar", mf === "dinerloper" && vkKaart.model.sleutel === "dinerloper" && vkKaart.aandacht.some((a) => /Functie gewisseld/.test(a.t) && /bediening/.test(a.d)));
test("voorkeur dinerloper: de eisen van dinerloper gelden ook voor de planner", (() => { const x = beurt(vk.state, evd, "Nee, dat deden de vaste obers", { punten: { drieBorden: "nee" } }); return plannerRedenen(x.state.velden, evd, []).some((y) => /drie borden/.test(y)); })());
test("zonder vraagversie 2 telt de voorkeur niet voor de match", matchFunctie("bediening", { punten: { voorkeur: "dinerloper" } }) === "bediening");
// 2. Runner: eerder runnerwerk is nog geen "dit past bij mij".
const rw = beurt(start(ru, "nl", NU).state, ru, "Ik liep op cateringevents met hapjes en drankjes", { ervaring: "cateringevents", ervaringNiveau: "ervaren", punten: { runnerwerk: "hapjes en drankjes uitlopen op cateringevents" } });
test("runner: runnerwerk vastgelegd, past niet aangenomen, geen uitlegvraag", rw.state.velden.punten?.runnerwerk === "hapjes en drankjes uitlopen op cateringevents" && rw.state.velden.punten?.past === undefined && rw.state.laatsteOnderwerp === "diensten");
// 5. Cv-berichten: geen belofte van direct plannen.
const tk = [teksten("nl"), teksten("en")];
test("cv-berichten: een collega bekijkt de aanmelding, geen 'meteen plannen'", tk.every((t) => ![t.cvLater, t.cvLaterWa, t.cvLaterZonderMail, t.herinnering1("x")].some((x) => /meteen een kennismaking|book a (short )?meeting|kennismaking plannen/i.test(x))) && /collega/.test(teksten("nl").cvLaterWa) && /colleague/.test(teksten("en").cvLater));

// ─── Nalooppunten 25 november, derde ronde ──────────────────────────────────
// 1. Het citaat moet de waarde onderbouwen.
test("citaat: Opera bij \"Wij gebruikten Mews\" is niet gedragen", !waardeGedragen("Opera", "Wij gebruikten Mews"));
test("citaat: Opera bij \"Wij gebruikten Opera\" wel", waardeGedragen("Opera", "Wij gebruikten Opera"));
test("citaat: tikfout in de uitgang mag", waardeGedragen("inchecken en reserveringen", "inchecke en reserveringe"));
test("citaat: een ontkenning die ontbreekt, is niet gedragen", !waardeGedragen("zelfstandig ingecheckt", "Ik heb niet zelfstandig ingecheckt"));
test("citaat: een ontkenning die het model toevoegt, ook niet", !waardeGedragen("niet zelfstandig", "Ik checkte zelfstandig in"));
const mews = verwerk(ov.state, fo, { tekst: "Wij gebruikten Mews" }, lees({ punten: { systeem: "Opera" }, puntBewijs: { systeem: "Wij gebruikten Mews" } }, { bron: "ai" }), NU);
test("Opera met het echte citaat \"Wij gebruikten Mews\": de planner ziet de woorden van de kandidaat, nooit Opera", mews.state.velden.punten?.systeem === "Wij gebruikten Mews" && !/Opera/.test(plannerZiet(mews.state, fo)), `${mews.state.velden.punten?.systeem} | ${mews.state.velden.functievraag}`);
const opera = verwerk(ov.state, fo, { tekst: "Wij gebruikten Opera" }, lees({ punten: { systeem: "Opera" }, puntBewijs: { systeem: "Wij gebruikten Opera" } }, { bron: "ai" }), NU);
test("Opera met citaat \"Wij gebruikten Opera\": exact Opera", opera.state.velden.punten?.systeem === "Opera");
// Tekstfout planner: "allebei" bij voorraad en kwaliteit.
const voAl = beurt(start(vo, "nl", NU).state, vo, "Twee jaar magazijn", { ervaring: "twee jaar magazijn", ervaringNiveau: "ervaren" });
const voAl2 = beurt(voAl.state, vo, "Allebei", {});
test("voorraad: allebei is voorraad en kwaliteitscontrole, geen kamers", /Soort werk: voorraad en kwaliteitscontrole/.test(voAl2.state.velden.functievraag || "") && !/kamers/.test(voAl2.state.velden.functievraag || ""), voAl2.state.velden.functievraag);

// ─── Duidelijke tegenspraak bij de punten die bepalen of een collega meekijkt ──
const ENG = "Ik help gasten in het Engels. In het Nederlands lukt dat nog niet.";
const BORD = "Ik bracht de borden tot aan de zaal. Mijn collega serveerde ze met drie tegelijk uit.";
const TRUCK = "Ik reed op de reachtruck. Mijn certificaat is verlopen.";
test("tegenspraak: Nederlands ja bij \"In het Nederlands lukt dat nog niet\"", tegenspraak("nederlands", "ja", ENG) === "In het Nederlands lukt dat nog niet.");
test("tegenspraak: Engels ja bij hetzelfde bericht is goed", tegenspraak("engels", "ja", ENG) === null);
test("tegenspraak: Engels nee bij \"Ik help gasten in het Engels\"", !!tegenspraak("engels", "nee", ENG));
test("tegenspraak: drie borden ja als de collega uitserveerde", !!tegenspraak("drieBorden", "ja", BORD));
test("tegenspraak: drie borden nee bij hetzelfde bericht is goed", tegenspraak("drieBorden", "nee", BORD) === null);
test("tegenspraak: zelf gereden heftruck bij \"Ik reed op de reachtruck\"", !!tegenspraak("gereden", "heftruck", TRUCK) && tegenspraak("gereden", "reachtruck", TRUCK) === null);
test("tegenspraak: certificaat opgegeven bij \"Mijn certificaat is verlopen\"", !!tegenspraak("certReachtruck", "opgegeven", TRUCK) && tegenspraak("certReachtruck", "verlopen", TRUCK) === null);
test("geen tegenspraak: \"Engels is geen probleem\" met Engels ja", tegenspraak("engels", "ja", "Engels is geen probleem") === null);
test("geen tegenspraak: \"Ik spreek Engels maar niet goed genoeg voor gasten\" met Engels nee", tegenspraak("engels", "nee", "Ik spreek Engels maar niet goed genoeg voor gasten") === null);
test("geen tegenspraak: \"Ja, altijd met drie borden\" met ja", tegenspraak("drieBorden", "ja", "Ja, bij de galadiners altijd met drie borden") === null);
// Het model vergist zich: de regels laten het punt open, de planner ziet de letterlijke zin en een collega kijkt mee.
{
  let f = beurt(start(fo, "nl", NU).state, fo, "Twee jaar receptie, inchecken en reserveringen", { ervaring: "twee jaar receptie", ervaringNiveau: "ervaren", punten: { taken: "inchecken en reserveringen" } });
  f = verwerk(f.state, fo, { tekst: ENG }, lees({ punten: { engels: "ja", nederlands: "ja" }, puntBewijs: { engels: "Ik help gasten in het Engels", nederlands: "In het Nederlands lukt dat" } }, { bron: "ai" }), NU);
  const pz = plannerZiet(f.state, fo);
  test("model zegt Nederlands ja: Engels ja, Nederlands open, de zin voor de planner, geen herhaling van de taalvraag", f.state.velden.punten?.engels === "ja" && !f.state.velden.punten?.nederlands && /Controleren: Nederlands voor gastcontact is open gelaten\. Het model las "ja", de kandidaat schreef: "In het Nederlands lukt dat nog niet\."/.test(pz) && !/talen/.test(laatste(f)), `${pz} | ${laatste(f)}`);
}
{
  let d = beurt(start(dl, "nl", NU).state, dl, "Twee zomers op bruiloften", { ervaring: "twee zomers op bruiloften", ervaringNiveau: "ervaren" });
  d = verwerk(d.state, dl, { tekst: BORD }, lees({ punten: { drieBorden: "ja" }, puntBewijs: { drieBorden: "met drie tegelijk uit" } }, { bron: "ai" }), NU);
  const pz = plannerZiet(d.state, dl);
  test("model zegt drie borden ja: open, de zin voor de planner, een collega kijkt mee", !d.state.velden.punten?.drieBorden && /Zelf drie borden|Drie borden aan tafel is open gelaten/.test(pz) && /Mijn collega serveerde ze met drie tegelijk uit/.test(pz) && plannerRedenen(d.state.velden, dl, d.state.twijfels).length > 0 && !/drie borden/i.test(laatste(d)), `${pz} | ${laatste(d)}`);
}
{
  const h = verwerk(start(ht, "nl", NU).state, ht, { tekst: TRUCK }, lees({ ervaring: "reachtruck, certificaat verlopen", ervaringNiveau: "ervaren", punten: { gereden: "heftruck", certReachtruck: "opgegeven" }, puntBewijs: { gereden: "Ik reed op de reachtruck", certReachtruck: "Mijn certificaat" } }, { bron: "ai" }), NU);
  const pz = plannerZiet(h.state, ht);
  test("model zegt heftruck en certificaat opgegeven: beide open met de letterlijke zinnen, nooit heftruck of opgegeven in het dossier", !h.state.velden.punten?.gereden && !h.state.velden.punten?.certReachtruck && /Zelf gereden is open gelaten/.test(pz) && /Certificaat reachtruck is open gelaten/.test(pz) && !/Zelf gereden: heftruck|Certificaat reachtruck: opgegeven/.test(pz), pz);
  const h2 = verwerk(start(ht, "nl", NU).state, ht, { tekst: TRUCK }, lees({ ervaring: "reachtruck", ervaringNiveau: "ervaren", punten: { gereden: "reachtruck", certReachtruck: "verlopen" }, puntBewijs: { gereden: "Ik reed op de reachtruck", certReachtruck: "Mijn certificaat is verlopen" } }, { bron: "ai" }), NU);
  test("model leest het goed: reachtruck en verlopen staan in het dossier, geen controleregel", h2.state.velden.punten?.gereden === "reachtruck" && h2.state.velden.punten?.certReachtruck === "verlopen" && !h2.state.twijfels.length, JSON.stringify(h2.state.velden.punten));
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
