/**
 * Huistests Job 5: het model voert het gesprek (verwerkBeurt met JOB_GESPREK_AI=1). De AI is hier
 * vast (een script per bericht), zodat de flow, de grenzen, de lusbewaking en de terugval los te
 * testen zijn. De echte AI test je met npm run job:gesprekstest.
 * Draaien: npx tsx server/job/__tests__/jobGesprek.test.ts
 */
import { verwerkBeurt, gesprekPrompt, type AiAanroep } from "../jobBeurt";
import { start, teksten, type JobContext, type JobState } from "@shared/jobRegels";
import { kennis } from "@shared/jobKennis";

process.env.JOB_GESPREK_AI = "1";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}
const NU = new Date("2026-11-19T10:00:00Z");
const bar: JobContext = { voornaam: "Sam", functie: "horecamedewerker", label: "hotels", nationalityZone: "NL", hasCv: false, stopV3: true, functieNaam: { nl: "bediening en bar", en: "waiting and bar" } } as JobContext;
const hk: JobContext = { voornaam: "Noor", functie: "housekeeping", label: "hotels", nationalityZone: "NL", hasCv: false, stopV3: true } as JobContext;
const nonEu: JobContext = { ...hk, nationalityZone: "NON_EU" } as JobContext;
const ai = (antwoord: object | null): AiAanroep => async () => (antwoord ? { inhoud: JSON.stringify(antwoord), ms: 5, model: "nep" } : null);
const tekst = (r: { berichten: { tekst: string }[] }) => r.berichten.map((b) => b.tekst).join(" | ");
async function beurt(state: JobState, ctx: JobContext, t: string, a: object | null, geschiedenis = "", laatsteVraag = "") {
  return verwerkBeurt({ state, ctx, tekst: t, laatsteVraag, geschiedenis, nu: NU, ai: a === null ? null : ai(a) });
}

async function main() {
  const nl = teksten("nl");
  // ─── Het gesprek van Max (17:18), nu met Job 5 ───
  let s = start(bar, "nl", NU).state;
  test("start: Job vraagt eerst de ervaring", s.laatsteOnderwerp === "ervaring");
  let u = await beurt(s, bar, "Hi", { soort: ["onduidelijk"], velden: {}, reactie: "Hoi Sam!", vraag: "Heb je al eens in de horeca gewerkt?", vraagt: "ervaring" });
  test("Hi: groet terug en de vraag eenvoudig, geen 'ik vraag het even anders'", tekst(u.r) === "Hoi Sam! Heb je al eens in de horeca gewerkt?" && u.bron === "gesprek", tekst(u.r));
  test("Hi: niets opgeslagen, de vraag blijft open", !u.r.state.velden.ervaring && u.r.state.laatsteOnderwerp === "ervaring");
  s = u.r.state;
  u = await beurt(s, bar, "2 jaar", { soort: ["antwoord"], velden: { ervaring: "2 jaar in de horeca", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "2 jaar" }, reactie: "Twee jaar, mooi.", vraag: "Waar was dat, in een restaurant, café of hotel?", vraagt: "hotels" }, "Kandidaat: Hi");
  test("2 jaar: de ervaring is opgeslagen", /2 jaar/.test(u.r.state.velden.ervaring || ""), JSON.stringify(u.r.state.velden));
  test("2 jaar: Job reageert en gaat door", tekst(u.r) === "Twee jaar, mooi. Waar was dat, in een restaurant, café of hotel?", tekst(u.r));
  test("2 jaar: de ervaringsvraag komt niet terug", u.r.state.laatsteOnderwerp === "hotels");

  // ─── "Zeg ik net": het antwoord stond eerder in het gesprek ───
  let z = start(bar, "nl", NU).state;
  const gesch = "Job: Vertel eens: wat is je ervaring?\nKandidaat: 2 jaar\nJob: Vertel eens: hoeveel jaar ervaring heb je in de horeca tot nu toe?";
  u = await beurt(z, bar, "Zeg ik net", { soort: ["antwoord"], velden: { ervaring: "2 jaar in de horeca" }, bewijs: { ervaring: "2 jaar" }, reactie: "Je hebt gelijk, sorry.", vraag: "Waar was dat, in een restaurant, café of hotel?", vraagt: "hotels" }, gesch);
  test("zeg ik net: het eerdere antwoord telt, Job zegt sorry en gaat door", /2 jaar/.test(u.r.state.velden.ervaring || "") && tekst(u.r).startsWith("Je hebt gelijk, sorry.") && u.r.state.laatsteOnderwerp === "hotels", tekst(u.r));

  // ─── Meerdere antwoorden en een loonvraag ───
  let h = start(hk, "nl", NU).state;
  u = await beurt(h, hk, "ik heb 3 jaar kamers gedaan bij een NH hotel, kan 4 dagen per week. wat verdien je eigenlijk?", {
    soort: ["antwoord", "vraag"], velden: { ervaring: "3 jaar kamers schoonmaken in een NH hotel", ervaringNiveau: "ervaren", hotels: "NH", diensten: "3-4" },
    bewijs: { ervaring: "3 jaar kamers gedaan", hotels: "NH hotel", diensten: "4 dagen per week" }, kennis: "loon", vraagKandidaat: "loon",
    reactie: "Dat is rond de 15 euro.", vraag: "Hoeveel sterren had het hotel?", vraagt: "sterren" });
  test("loon: de vaste tekst uit de kennisbank, geen bedrag van het model", tekst(u.r).startsWith(kennis("loon")!.nl) && !/15|euro/.test(tekst(u.r)), tekst(u.r));
  test("meerdere antwoorden: ervaring, hotel en diensten opgeslagen", !!u.r.state.velden.ervaring && !!u.r.state.velden.hotels && u.r.state.velden.diensten === "3-4", JSON.stringify(u.r.state.velden));
  test("meerdere antwoorden: Job vraagt niet naar wat al gezegd is", u.r.state.laatsteOnderwerp === "sterren" && u.r.berichten.length === 1, tekst(u.r));

  // ─── Een bedrag of belofte in de woorden van het model ───
  h = { ...start(hk, "nl", NU).state, velden: { ervaring: "x", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" } as any, laatsteOnderwerp: "diensten" };
  u = await beurt(h, hk, "3 of 4", { soort: ["antwoord"], velden: { diensten: "3-4" }, bewijs: { diensten: "3 of 4" }, reactie: "Je bent zo goed als aangenomen.", vraag: "Hoe ver wil je reizen? Je krijgt reiskosten.", vraagt: "werkgebied" });
  test("belofte: reactie en vraag van het model vallen weg, de vaste vraag gaat", tekst(u.r) === nl.werkgebied, tekst(u.r));
  test("belofte: het antwoord zelf is wel opgeslagen", u.r.state.velden.diensten === "3-4");

  // ─── Werkvergunning blijft letterlijk ───
  let ne = { ...start(nonEu, "nl", NU).state, velden: { ervaring: "x", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" } as any, laatsteOnderwerp: "sterren" as const };
  u = await beurt(ne as any, nonEu, "4", { soort: ["antwoord"], velden: { sterren: "4" }, bewijs: { sterren: "4" }, reactie: "Vier sterren, mooi.", vraag: "Mag jij in Nederland werken?", vraagt: "werkautorisatie" });
  test("werkvergunning: de vaste vraag, met de reactie ervoor", u.r.state.laatsteOnderwerp === "werkautorisatie" && tekst(u.r) === `Vier sterren, mooi. ${nl.werkautorisatie}`, tekst(u.r));

  // ─── Geen lussen ───
  let l = start(hk, "nl", NU).state;
  u = await beurt(l, hk, "?", { soort: ["verwarring"], velden: {}, reactie: "", vraag: "Heb je al eens kamers schoongemaakt in een hotel?", vraagt: "ervaring" });
  test("lus: eerste keer onduidelijk, de vraag in andere woorden", u.r.state.laatsteOnderwerp === "ervaring" && tekst(u.r) === "Heb je al eens kamers schoongemaakt in een hotel?", tekst(u.r));
  u = await beurt(u.r.state, hk, "weet niet", { soort: ["onduidelijk"], velden: {}, reactie: "", vraag: "Heb je ooit in een hotel gewerkt?", vraagt: "ervaring" });
  test("lus: na twee keer gaat Job door en neemt een collega de vraag over", u.r.state.laatsteOnderwerp !== "ervaring" && (u.r.state.velden.onbekend || []).includes("ervaring"), tekst(u.r));
  test("lus: de collega ziet het in Kandidaten", u.r.state.twijfels.some((t) => /niet verder bij de vraag over ervaring/.test(t)));
  test("lus: Job zegt dat kort en stelt de volgende vraag", tekst(u.r).startsWith("Geen probleem") && tekst(u.r).endsWith("?"), tekst(u.r));

  // ─── Een andere open vraag eerst ───
  let o = { ...start(hk, "nl", NU).state, velden: { ervaring: "x", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" } as any, laatsteOnderwerp: "diensten" as const };
  u = await beurt(o as any, hk, "3 of 4, ik woon in Zaandam", { soort: ["antwoord"], velden: { diensten: "3-4" }, bewijs: { diensten: "3 of 4" }, reactie: "Helder.", vraag: "Kun je ook in het weekend werken?", vraagt: "werkmoment" });
  test("volgorde: het model mag een andere open vraag eerst stellen", u.r.state.laatsteOnderwerp === "werkmoment" && tekst(u.r) === "Helder. Kun je ook in het weekend werken?" && (u.r.berichten[0].keuzes || []).length > 0, tekst(u.r));

  // ─── Aan het eind ───
  let e = { ...start(hk, "nl", NU).state, velden: { ervaring: "x", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4", diensten: "3-4", werkgebied: "tot 25 km", werkmoment: "flexibel", startdatum: "direct", werkvorm: "studie" } as any, laatsteOnderwerp: "cv" as const };
  u = await beurt(e as any, hk, "nee nog niet", { soort: ["antwoord"], velden: { cvParaat: "nee" }, bewijs: { cvParaat: "nee" }, reactie: "Geen probleem.", vraag: "", vraagt: "klaar" });
  test("eind: cv later, het vaste bericht met de uploadknop", u.r.state.status === "wacht_cv" && u.r.berichten.some((b) => b.cvUpload), tekst(u.r));

  // ─── Terugval naar Job 4 ───
  u = await beurt(start(hk, "nl", NU).state, hk, "2 jaar", null);
  test("terugval: geen AI, dan Job 4", u.bron !== "gesprek");
  u = await beurt(start(hk, "nl", NU).state, hk, "kan ik iemand spreken", { soort: ["mens"], velden: {} });
  test("terugval: een mens spreken gaat via de vaste afhandeling", u.bron !== "gesprek" && u.r.state.status === "planner", `${u.bron} ${u.r.state.status}`);
  u = await beurt(start(hk, "nl", NU).state, hk, "MENS", { soort: ["mens"], velden: {} });
  test("terugval: het commando MENS gaat altijd via de vaste regels", u.r.state.status === "planner");

  // ─── Nooit twee keer hetzelfde bericht ───
  let d = { ...start(hk, "nl", NU).state, velden: { ervaring: "x", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" } as any, laatsteOnderwerp: "diensten" as const };
  u = await beurt(d as any, hk, "dank je", { soort: ["bedankje"], velden: {}, reactie: "", vraag: nl.diensten, vraagt: "diensten" }, "", nl.diensten);
  test("dubbel: dezelfde vraag komt in andere woorden, niet letterlijk opnieuw", tekst(u.r) !== nl.diensten && u.r.state.laatsteOnderwerp === "diensten" && (u.r.berichten[0].keuzes || []).length > 0, tekst(u.r));

  // ─── De instructie ───
  const p = gesprekPrompt({ ctx: bar, state: start(bar, "nl", NU).state, laatsteVraag: "Vertel eens?", geschiedenis: "Kandidaat: Hi" });
  test("instructie: toon, eerlijk over AI, zeg ik net, kennisbank", /Kort en warm/.test(p) && /Je bent een AI/.test(p) && /zeg ik net/.test(p) && /loon/.test(p));
  test("instructie: geen gedachtestreepjes", !/[\u2013\u2014]/.test(p));

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
