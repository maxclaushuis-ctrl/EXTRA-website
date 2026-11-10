/**
 * Huistests Job 4: één beurt per bericht. De AI is hier vast (een script per bericht),
 * zodat de controle, de kennisbank, de terugval en de flow los te testen zijn.
 * De echte AI wordt getest met scripts/job-gesprekstest.ts in de testomgeving.
 * Run met:  npx tsx server/job/__tests__/jobBeurt.test.ts
 */
import { verwerkBeurt, beurtPrompt, BEURT_TEKSTEN, type AiAanroep } from "../jobBeurt";
import { start, teksten, vraag, type JobContext, type JobState } from "@shared/jobRegels";
import { reactieGoed, vraagGoed, valideerBeurt, berichtControle } from "@shared/jobBeurt";
import { kennis } from "@shared/jobKennis";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}
const NU = new Date("2026-11-11T10:00:00Z");
const nl = teksten("nl");
const hk: JobContext = { voornaam: "Noor", functie: "housekeeping", label: "hotels", nationalityZone: "NL", hasCv: false, stopV3: true };
const kok: JobContext = { voornaam: "Sem", functie: "chef", label: "hotels", nationalityZone: "NL", hasCv: false, stopV3: true };
const ai = (antwoord: object | null): AiAanroep => async () => (antwoord ? { inhoud: JSON.stringify(antwoord), ms: 5, model: "nep" } : null);
const tekst = (r: { berichten: { tekst: string }[] }) => r.berichten.map((b) => b.tekst).join(" | ");
async function beurt(state: JobState, ctx: JobContext, t: string, a: object | null) {
  return verwerkBeurt({ state, ctx, tekst: t, laatsteVraag: "", geschiedenis: "", nu: NU, ai: a === null ? null : ai(a) });
}

async function main() {
  // ─── Controles ───
  test("reactie: standaardopener geweigerd", !reactieGoed("Top! Twee jaar is mooi.", "nl") && !reactieGoed("Fantastisch, dank je.", "nl"));
  test("reactie: geen vraag, één zin", !reactieGoed("Twee jaar, mooi. Waar was dat?", "nl") && !reactieGoed("Dat is lang. En verder.", "nl"));
  test("reactie: geen bedragen of beloftes", !reactieGoed("Je krijgt 15 euro per uur.", "nl") && !reactieGoed("Je bent aangenomen.", "nl"));
  test("reactie: een gewone, inhoudelijke zin mag", reactieGoed("Snap ik, het is ook veel tegelijk.", "nl"));
  test("reactie: niet in de verkeerde taal", !reactieGoed("I understand that, it is a lot.", "nl"));
  test("vraag: moet over het veld gaan", vraagGoed("Hoeveel diensten per week wil je werken?", "diensten", "nl") && !vraagGoed("Waar woon je?", "diensten", "nl"));
  test("vraag: één vraag, één zin", !vraagGoed("Hoeveel diensten? En welke dagen?", "diensten", "nl"));
  test("vraag: werkautorisatie en cv blijven letterlijk", !vraagGoed("Mag je in Nederland werken?", "werkautorisatie", "nl") && !vraagGoed("Heb je je cv klaar?", "cv", "nl"));
  const vb = valideerBeurt({ soort: ["vraag"], velden: { hotels: "Look for job" }, bewijs: { hotels: "Look for job" } }, "Look for job", "hotels");
  test("validatie: een vraag of onduidelijk bericht slaat niets op", Object.keys(vb.velden).length === 0);
  const vb2 = valideerBeurt({ soort: ["antwoord"], velden: { diensten: "3-4", werkgebied: "tot 25 km" }, bewijs: { diensten: "3 of 4", werkgebied: "Amsterdam" } }, "3 of 4 dagen", "diensten");
  test("validatie: alleen velden met citaat in het bericht", vb2.velden.diensten === "3-4" && vb2.velden.werkgebied === undefined);
  test("validatie: onbekende soort wordt onduidelijk", valideerBeurt({ soort: ["blabla"] }, "x", null).soorten.join() === "onduidelijk");
  test("prompt bevat open vragen en kennisbank", (() => { const p = beurtPrompt({ ctx: hk, state: start(hk, "nl", NU).state, laatsteVraag: "Hoeveel ervaring?", geschiedenis: "", modus: "vragen" }); return p.includes("Vragen die nog open staan") && p.includes("loon") && p.includes("ervaring"); })());

  // ─── Antwoord plus eigen vraag in één bericht (opdracht Max) ───
  let s = start(hk, "nl", NU).state;
  let u = await beurt(s, hk, "Ik heb twee jaar ervaring, maar wat verdien ik?", {
    soort: ["antwoord", "vraag"], velden: { ervaring: "2 jaar ervaring", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "twee jaar ervaring" },
    kennis: "loon", vraagKandidaat: "wat verdien ik", reactie: "", vraag: "In welke hotels heb je gewerkt?", volgende: "hotels",
  });
  test("Twee dingen tegelijk: ervaring opgeslagen", u.r.state.velden.ervaring === "2 jaar ervaring");
  test("Twee dingen tegelijk: loonvraag beantwoord uit de kennisbank, dan de volgende vraag", tekst(u.r).startsWith(kennis("loon")!.nl) && tekst(u.r).includes("hotels"), tekst(u.r));
  test("Twee dingen tegelijk: hooguit twee zinnen en één vraag", berichtControle(u.r.berichten[0].tekst, "nl").length === 0, berichtControle(u.r.berichten[0].tekst, "nl").join());

  // ─── "Look for job" bij de hotelvraag: niet opslaan, verduidelijken ───
  s = { ...u.r.state };
  u = await beurt(s, hk, "Look for job", { soort: ["onduidelijk"], velden: { hotels: "Look for job" }, bewijs: { hotels: "Look for job" }, taal: "en", reactie: "", vraag: "In welke hotels heb je eerder gewerkt, of nog nergens?", volgende: "hotels" });
  test("Look for job: geen hotelnaam opgeslagen", !u.r.state.velden.hotels);
  test("Look for job: dezelfde vraag, anders gesteld", u.r.state.laatsteOnderwerp === "hotels" && tekst(u.r) === "In welke hotels heb je eerder gewerkt, of nog nergens?", tekst(u.r));
  test("Look for job: geen taalwissel op drie woorden zonder bevestiging", u.r.state.taal === "nl");
  // Twee keer onduidelijk erbij: dan onbekend en verder
  u = await beurt(u.r.state, hk, "huh", { soort: ["verwarring"], reactie: "", vraag: "Heb je al eens in een hotel gewerkt? Zo ja, welke?", volgende: "hotels" });
  u = await beurt(u.r.state, hk, "weet niet", { soort: ["onduidelijk"], reactie: "", vraag: "", volgende: "hotels" });
  test("Drie keer onduidelijk: vraag staat als onbekend, Job gaat verder", u.r.state.velden.onbekend?.includes("hotels") === true && u.r.state.laatsteOnderwerp !== "hotels", String(u.r.state.laatsteOnderwerp));
  test("Onbekend: geen sterrenvraag erachteraan", u.r.state.laatsteOnderwerp !== "sterren");

  // ─── AI stelt de verkeerde volgende vraag voor: de standaardvraag van de regels ───
  s = start(hk, "nl", NU).state;
  u = await beurt(s, hk, "3 jaar kamers schoonmaken in het Hilton", { soort: ["antwoord"], velden: { ervaring: "3 jaar kamers schoonmaken", ervaringNiveau: "ervaren", hotels: "Hilton" }, bewijs: { ervaring: "3 jaar kamers schoonmaken", hotels: "Hilton" }, reactie: "Drie jaar in het Hilton, dat is een mooie basis.", vraag: "Hoeveel diensten per week wil je werken?", volgende: "diensten" });
  test("Meerdere antwoorden: ervaring en hotel opgeslagen, hotelvraag overgeslagen", u.r.state.velden.hotels === "Hilton" && u.r.state.laatsteOnderwerp === "sterren", String(u.r.state.laatsteOnderwerp));
  test("Verkeerde volgende vraag van de AI: de vraag van de regels (sterren)", tekst(u.r).includes(nl.sterren), tekst(u.r));
  test("Reactie erbij als die door de controle komt", tekst(u.r).startsWith("Drie jaar in het Hilton"));

  // ─── Correctie ───
  s = { ...start(hk, "nl", NU).state, velden: { ervaring: "2 jaar", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4", diensten: "1-2" }, laatsteOnderwerp: "werkgebied" };
  u = await beurt(s, hk, "Sorry, ik bedoelde 3 tot 4 diensten. En tot 25 km", { soort: ["correctie", "antwoord"], velden: { diensten: "3-4", werkgebied: "tot 25 km" }, bewijs: { diensten: "3 tot 4 diensten", werkgebied: "tot 25 km" }, reactie: "Helder, ik heb het aangepast naar 3 tot 4 diensten.", vraag: "Wanneer kun je werken: doordeweeks, in de avond en het weekend, of flexibel?", volgende: "werkmoment" });
  test("Correctie: diensten bijgewerkt en werkgebied opgeslagen", u.r.state.velden.diensten === "3-4" && u.r.state.velden.werkgebied === "tot 25 km");
  test("Correctie: bevestigd en door naar werkmoment", u.r.state.laatsteOnderwerp === "werkmoment" && tekst(u.r).startsWith("Helder"), tekst(u.r));

  // ─── Doorvragen bij een vaag antwoord ───
  s = start(hk, "nl", NU).state;
  u = await beurt(s, hk, "Ik maak al jaren schoon", { soort: ["antwoord"], velden: { ervaring: "jaren schoonmaakwerk", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "al jaren schoon" }, doorvragen: "ervaring", reactie: "", vraag: "Deed je dat in hotelkamers of bijvoorbeeld in kantoren of bij mensen thuis?", volgende: "ervaring" });
  test("Vaag antwoord: één concrete doorvraag", tekst(u.r) === "Deed je dat in hotelkamers of bijvoorbeeld in kantoren of bij mensen thuis?" && u.r.state.laatsteOnderwerp === "ervaring", tekst(u.r));

  // ─── Frustratie: kort erkennen en verder ───
  s = { ...start(hk, "nl", NU).state, velden: { ervaring: "2 jaar", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" }, laatsteOnderwerp: "diensten" };
  u = await beurt(s, hk, "Wat een hoop vragen zeg", { soort: ["frustratie"], reactie: "Snap ik, nog maar een paar korte vragen.", vraag: "Hoeveel diensten per week wil je ongeveer werken?", volgende: "diensten" });
  test("Frustratie: erkend en dezelfde vraag, niets opgeslagen", tekst(u.r) === "Snap ik, nog maar een paar korte vragen. Hoeveel diensten per week wil je ongeveer werken?" && !u.r.state.velden.diensten, tekst(u.r));

  // ─── Gedrag ───
  u = await beurt(s, hk, "Hou je bek met je vragen, idioot", { soort: ["grens"], grens: { regel: "G4", bewijs: "Hou je bek met je vragen, idioot" }, reactie: "", vraag: "", volgende: "diensten" });
  test("G4 eerste keer: één keer begrenzen, de vraag blijft", u.r.berichten[0].tekst === BEURT_TEKSTEN.nl.begrenzen && u.r.state.velden.begrensd === true && u.r.state.status === "bezig");
  u = await beurt(u.r.state, hk, "Kankerbedrijf", { soort: ["grens"], grens: { regel: "G4", bewijs: "Kankerbedrijf" } });
  test("G4 tweede keer: gesprek gepauzeerd, collega beslist", u.r.state.status === "planner" && u.r.acties.some((a) => a.soort === "planner"));
  u = await beurt(s, hk, "Mijn vorige baas noemde me een idioot", { soort: ["antwoord"], grens: { regel: "G4", bewijs: "idioot" }, reactie: "", vraag: "", volgende: "diensten" });
  test("Citaat zonder soort grens: geen begrenzing", u.r.berichten[0]?.tekst !== BEURT_TEKSTEN.nl.begrenzen);

  // ─── Na het gesprek: bedankje, vraag ───
  const klaar: JobState = { ...start(hk, "nl", NU).state, status: "cv_controle", laatsteOnderwerp: null };
  u = await beurt(klaar, hk, "Thanks", { soort: ["bedankje"], reactie: "" });
  test("Na het gesprek: bedankje krijgt 'Graag gedaan', geen statuszin", tekst(u.r) === BEURT_TEKSTEN.nl.graagGedaan, tekst(u.r));
  const tweede = await verwerkBeurt({ state: klaar, ctx: hk, tekst: "Thanks", laatsteVraag: BEURT_TEKSTEN.nl.graagGedaan, geschiedenis: "", nu: NU, ai: ai({ soort: ["bedankje"] }) });
  test("Na het gesprek: tweede bedankje krijgt niets meer", tweede.r.berichten.length === 0);
  u = await beurt(klaar, hk, "Waar is jullie kantoor?", { soort: ["vraag"], kennis: "kantoor" });
  test("Na het gesprek: vraag krijgt het antwoord uit de kennisbank", tekst(u.r) === kennis("kantoor")!.nl);
  u = await beurt(klaar, hk, "Kan mijn broer ook komen werken?", { soort: ["vraag"], kennis: "onbekend", vraagKandidaat: "broer ook aanmelden" });
  test("Na het gesprek: onbekende vraag eerlijk doorgegeven aan een collega", tekst(u.r).includes("collega") && u.r.acties.some((a) => a.soort === "planner") && u.r.state.status === "cv_controle");

  // ─── Geen AI: gecontroleerde terugval ───
  s = start(hk, "nl", NU).state;
  u = await beurt(s, hk, "Wat bedoel je?", null);
  test("Terugval: een vraag wordt geen ervaring", !u.r.state.velden.ervaring && u.bron === "terugval");
  test("Terugval: Job zegt dat hij het niet begreep en vraagt opnieuw", tekst(u.r).startsWith(BEURT_TEKSTEN.nl.nietBegrepen) && tekst(u.r).includes(vraag("ervaring", "nl", hk).tekst), tekst(u.r));
  u = await beurt(s, hk, "Twee jaar housekeeping in een hotel", null);
  test("Terugval: een duidelijk antwoord gaat gewoon door", !!u.r.state.velden.ervaring);
  s = { ...start(hk, "nl", NU).state, velden: { ervaring: "2 jaar", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" }, laatsteOnderwerp: "diensten" };
  u = await beurt(s, hk, "geen idee eigenlijk", null);
  test("Terugval: keuzevraag zonder herkenbaar antwoord blijft open", !u.r.state.velden.diensten && u.r.state.laatsteOnderwerp === "diensten");
  u = await beurt(s, hk, "x", { kapot: true });
  test("Onbruikbaar AI-antwoord: niets opgeslagen, de vraag blijft", !u.r.state.velden.diensten && u.r.state.laatsteOnderwerp === "diensten");

  // ─── Kok met 9 jaar (eerdere fout): hotelantwoord laat de ervaring staan ───
  s = { ...start(kok, "nl", NU).state, velden: { ervaring: "9 jaar keukenervaring", ervaringNiveau: "ervaren" }, laatsteOnderwerp: "hotels" };
  u = await beurt(s, kok, "Ik heb nog niet in een hotel gewerkt, vooral restaurants", { soort: ["antwoord"], velden: { hotels: "nog niet in een hotel gewerkt", ervaring: "nog niet in een hotel" , ervaringNiveau: "geen" }, bewijs: { hotels: "nog niet in een hotel gewerkt", ervaring: "nog niet in een hotel", ervaringNiveau: "nog niet" }, nvt: ["sterren"], reactie: "", vraag: "Wat voor restaurant was dat?", volgende: "restaurant" });
  test("Kok: ervaring en niveau blijven staan", u.r.state.velden.ervaring === "9 jaar keukenervaring" && u.r.state.velden.ervaringNiveau === "ervaren", JSON.stringify(u.r.state.velden));
  test("Kok: geen sterrenvraag, wel restaurantvraag", u.r.state.laatsteOnderwerp === "restaurant", String(u.r.state.laatsteOnderwerp));

  // ─── MENS via de AI ───
  s = start(hk, "nl", NU).state;
  u = await beurt(s, hk, "ik wil gewoon iemand spreken", { soort: ["mens"] });
  test("Wil een mens spreken: overdracht", u.r.state.status === "planner" && tekst(u.r) === nl.mens);

  // ─── Tegenstrijdig: later wel ervaring (correctie bij een andere vraag) ───
  s = { ...start(hk, "nl", NU).state, velden: { ervaring: "geen ervaring", ervaringNiveau: "geen" }, laatsteOnderwerp: "diensten" };
  u = await beurt(s, hk, "Oh wacht, ik heb wel een zomer in een hotel kamers gedaan, bij het Ibis", { soort: ["correctie"], velden: { ervaring: "een zomer kamers schoonmaken in hotel Ibis", ervaringNiveau: "starter", hotels: "Ibis" }, bewijs: { ervaring: "een zomer in een hotel kamers gedaan", ervaringNiveau: "een zomer", hotels: "Ibis" }, reactie: "Goed dat je het zegt, dat pas ik aan.", vraag: "Hoeveel diensten per week wil je werken?", volgende: "diensten" });
  test("Correctie op ervaring bij een andere vraag: ervaring bijgewerkt", /Ibis/.test(u.r.state.velden.ervaring || "") && u.r.state.velden.ervaringNiveau === "starter", JSON.stringify(u.r.state.velden));
  test("Correctie met een hotel erin: de regels vragen nu de sterren (nieuw open), met bevestiging", u.r.state.laatsteOnderwerp === "sterren" && tekst(u.r).startsWith("Goed dat je het zegt"), tekst(u.r));

  // ─── AI noemt het een antwoord maar vult niets: geen lus ───
  s = { ...start(hk, "nl", NU).state, velden: { ervaring: "2 jaar", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" }, laatsteOnderwerp: "diensten" };
  let v = s;
  for (let n = 0; n < 4; n++) v = (await beurt(v, hk, "hmm", { soort: ["antwoord"], velden: {}, reactie: "", vraag: "", volgende: "diensten" })).r.state;
  test("Antwoord zonder veld: na drie keer onbekend, geen eindeloze herhaling", v.velden.onbekend?.includes("diensten") === true && v.laatsteOnderwerp !== "diensten", String(v.laatsteOnderwerp));

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
