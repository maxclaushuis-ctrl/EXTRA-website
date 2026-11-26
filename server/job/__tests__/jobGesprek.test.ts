/**
 * Huistests Job 5: het model voert het gesprek (verwerkBeurt met JOB_GESPREK_AI=1). De AI is hier
 * vast (een script per bericht), zodat de flow, de grenzen, de lusbewaking en de terugval los te
 * testen zijn. De echte AI test je met npm run job:gesprekstest.
 * Draaien: npx tsx server/job/__tests__/jobGesprek.test.ts
 */
import { verwerkBeurt, gesprekPrompt, type AiAanroep } from "../jobBeurt";
import { plannerRedenen, profielVelden, samenvatting, start, teksten, type JobContext, type JobState } from "@shared/jobRegels";
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
  test("2 jaar: een duidelijk antwoord, Job gaat direct door zonder het te herhalen", tekst(u.r) === "Waar was dat, in een restaurant, café of hotel?", tekst(u.r));
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
  test("werkvergunning: de vaste vraag, zonder herhaling van het antwoord", u.r.state.laatsteOnderwerp === "werkautorisatie" && tekst(u.r) === nl.werkautorisatie, tekst(u.r));

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
  test("volgorde: het model mag een andere open vraag eerst stellen; met knoppen de korte vaste vraag", u.r.state.laatsteOnderwerp === "werkmoment" && tekst(u.r) === nl.werkmoment && (u.r.berichten[0].keuzes || []).length > 0, tekst(u.r));

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

  // ─── Rustig doorvragen (afspraak Max 26 nov): de drie situaties uit zijn test ───
  const voorkeur = { ervaring: "twee jaar bediening", ervaringNiveau: "ervaren", functievraag: "bedienen aan tafel" } as any;
  let k = { ...start(bar, "nl", NU).state, velden: { ...voorkeur }, laatsteOnderwerp: "diensten" as const };
  // 1. Een reeks knoppen: direct door, ook als het model iets terugzegt.
  u = await beurt(k as any, bar, "5 of meer", { soort: ["antwoord"], velden: { diensten: "5+" }, bewijs: { diensten: "5 of meer" }, reactie: "Helder, fulltime dus.", vraag: "Hoe ver wil je reizen voor werk?", vraagt: "werkgebied" }, "Job: Top, dat is duidelijk. Hoeveel diensten per week zou je willen werken?", nl.diensten);
  test("knoppen: na 5 of meer direct de volgende vraag, kort en met knoppen", tekst(u.r) === nl.werkgebied && (u.r.berichten[0].keuzes || []).length === 3, tekst(u.r));
  // 2. Een knop met een getypte aanvulling erachteraan: allebei opslaan, alleen vragen wat openstaat.
  u = await beurt(u.r.state, bar, "maar alleen in de avond", { soort: ["antwoord"], velden: { werkmomentTekst: "alleen in de avond" }, bewijs: { werkmomentTekst: "alleen in de avond" }, reactie: "Helder, alleen in de avond.", vraag: "Hoe ver wil je reizen?", vraagt: "werkgebied" }, "Kandidaat: 5 of meer\nJob: " + nl.werkgebied, nl.werkgebied);
  test("aanvulling: diensten en het werkmoment staan allebei in het dossier", u.r.state.velden.diensten === "5+" && u.r.state.velden.werkmomentTekst === "alleen in de avond", JSON.stringify(u.r.state.velden));
  test("aanvulling: Job bevestigt kort uit het dossier en vraagt de open vraag in andere woorden", /^Genoteerd: alleen in de avond\. /.test(tekst(u.r)) && u.r.state.laatsteOnderwerp === "werkgebied" && tekst(u.r) !== `Genoteerd: alleen in de avond. ${nl.werkgebied}`, tekst(u.r));
  u = await beurt(u.r.state, bar, "Tot 25 km", { soort: ["antwoord"], velden: { werkgebied: "tot 25 km" }, bewijs: { werkgebied: "Tot 25 km" }, reactie: "Top.", vraag: "", vraagt: "startdatum" }, "", tekst(u.r));
  test("aanvulling: de vraag over wanneer je kunt werken komt niet meer", u.r.state.laatsteOnderwerp === "startdatum" && tekst(u.r) === nl.startdatum, `${u.r.state.laatsteOnderwerp}: ${tekst(u.r)}`);
  // 3. Een correctie: bevestigen zoals het in het dossier staat, dan door.
  const c0 = { ...start(bar, "nl", NU).state, velden: { ...voorkeur, diensten: "3-4", werkgebied: "tot 25 km" }, laatsteOnderwerp: "werkmoment" as const };
  u = await beurt(c0 as any, bar, "Nee, ik bedoelde 25 km enkele reis", { soort: ["correctie"], velden: { werkgebied: "25 km enkele reis" }, bewijs: { werkgebied: "25 km enkele reis" }, reactie: "Helder, aangepast.", vraag: "", vraagt: "werkmoment" }, "Job: " + nl.werkmoment, nl.werkmoment);
  test("correctie: het dossier is aangepast", u.r.state.velden.werkgebied === "25 km enkele reis", JSON.stringify(u.r.state.velden));
  test("correctie: Job zegt wat er nu staat en stelt de open vraag", tekst(u.r).startsWith("Ik heb het aangepast naar 25 km enkele reis. ") && u.r.state.laatsteOnderwerp === "werkmoment" && tekst(u.r).endsWith("?"), tekst(u.r));
  // Loonvraag tussendoor: eerst het antwoord, dan dezelfde open vraag.
  u = await beurt(u.r.state, bar, "Wat verdien ik eigenlijk?", { soort: ["vraag"], velden: {}, kennis: "loon", vraagKandidaat: "loon", reactie: "", vraag: "", vraagt: "werkmoment" }, "", tekst(u.r));
  test("loon tussendoor: eerst het antwoord, dan de open vraag", tekst(u.r).startsWith(kennis("loon")!.nl) && u.r.state.laatsteOnderwerp === "werkmoment", tekst(u.r));
  // 3b. Eerst Flexibel, later "toch alleen 's avonds": Job en de planner zien alleen nog de avond.
  const f0 = { ...start(bar, "nl", NU).state, velden: { ...voorkeur, diensten: "3-4", werkgebied: "tot 25 km", werkmoment: "flexibel", startdatum: "direct" }, laatsteOnderwerp: "werkvorm" as const };
  u = await beurt(f0 as any, bar, "Nee, toch alleen 's avonds", { soort: ["correctie"], velden: { werkmoment: "avond_weekend" }, bewijs: { werkmoment: "toch alleen 's avonds" }, reactie: "Helder, aangepast.", vraag: "", vraagt: "werkvorm" }, "Job: " + nl.werkvorm, nl.werkvorm);
  const fv = u.r.state.velden;
  test("flexibel naar avond: alleen de avond in het dossier, Flexibel en avond en weekend zijn weg", !fv.werkmoment && /alleen 's avonds/.test(fv.werkmomentTekst || ""), JSON.stringify(fv));
  test("flexibel naar avond: Job bevestigt alleen de avond", tekst(u.r).startsWith("Ik heb het aangepast naar alleen 's avonds. ") && !/flexibel|weekend/i.test(tekst(u.r)), tekst(u.r));
  const zicht = [samenvatting(fv, bar), ...Object.values(profielVelden(fv))].join(" | ");
  test("flexibel naar avond: de planner ziet alleen de avond", /alleen 's avonds/.test(zicht) && !/flexibel|weekend/i.test(zicht), zicht);
  test("flexibel naar avond: Job ziet in de instructie alleen de avond", /alleen 's avonds/.test(gesprekPrompt({ ctx: bar, state: u.r.state, laatsteVraag: nl.werkvorm, geschiedenis: "" })) && !/wanneer: flexibel/.test(gesprekPrompt({ ctx: bar, state: u.r.state, laatsteVraag: nl.werkvorm, geschiedenis: "" })));
  // Model zet zelf de eigen woorden (zoals de instructie vraagt): ook dan valt Flexibel weg.
  u = await beurt(f0 as any, bar, "toch alleen 's avonds", { soort: ["correctie"], velden: { werkmomentTekst: "alleen 's avonds" }, bewijs: { werkmomentTekst: "alleen 's avonds" }, reactie: "", vraag: "", vraagt: "werkvorm" }, "Job: " + nl.werkvorm, nl.werkvorm);
  test("flexibel naar avond (eigen woorden van het model): Flexibel valt weg", !u.r.state.velden.werkmoment && u.r.state.velden.werkmomentTekst === "alleen 's avonds", JSON.stringify(u.r.state.velden));
  // 3c. Een correctie die niet in het dossier komt: Job zegt geen "1 tot 2" toe zolang er nog 5 of meer staat.
  const n0 = { ...start(bar, "nl", NU).state, velden: { ...voorkeur, diensten: "5+" }, laatsteOnderwerp: "werkgebied" as const };
  u = await beurt(n0 as any, bar, "Sorry, ik bedoelde minder diensten", { soort: ["correctie"], velden: { diensten: "1-2" }, bewijs: { diensten: "1 tot 2 diensten" }, reactie: "Ik zet het op 1 tot 2 diensten.", vraag: "", vraagt: "werkgebied" }, "Job: " + nl.werkgebied, nl.werkgebied);
  test("correctie zonder citaat: het dossier houdt 5 of meer en Job zegt niets toe", u.r.state.velden.diensten === "5+" && !/1 tot 2/.test(tekst(u.r)), `${u.r.state.velden.diensten}: ${tekst(u.r)}`);
  const kaartNa = [samenvatting(u.r.state.velden, bar), ...plannerRedenen(u.r.state.velden, bar, u.r.state.twijfels)].join(" | ");
  test("correctie zonder citaat: de planner ziet direct dat de kandidaat minder wil werken", /minder diensten/.test(kaartNa) && /niet kon verwerken/.test(kaartNa), kaartNa);
  const n1 = { ...start(bar, "nl", NU).state, velden: { ...voorkeur, diensten: "1-2" }, laatsteOnderwerp: "werkgebied" as const };
  u = await beurt(n1 as any, bar, "Ik bedoelde 1 tot 2 diensten", { soort: ["correctie"], velden: { diensten: "1-2" }, bewijs: { diensten: "1 tot 2 diensten" }, reactie: "Helder, aangepast.", vraag: "", vraagt: "werkgebied" }, "Job: " + nl.werkgebied, nl.werkgebied);
  test("correctie die er al stond: Job zegt dat kort", tekst(u.r).startsWith("Dat staat al zo genoteerd: 1 tot 2 diensten per week. "), tekst(u.r));
  // 3d. Avond maar geen weekend: direct na die beurt wat Job zegt en wat de planner ziet, met en zonder vraagversie 2.
  for (const [naam, c] of [["zonder vraagversie 2", bar], ["met vraagversie 2", { ...bar, functieCode: "bediening", label: "events", vraagversie2: true, begrijpen: true } as JobContext]] as const) {
    let w0: any = { ...start(c, "nl", NU).state };
    w0 = { ...w0, velden: { ...w0.velden, ...voorkeur, hotels: "NH", sterren: "4", functievragen: 3, diensten: "3-4", werkgebied: "tot 25 km" }, laatsteOnderwerp: "werkmoment" };
    u = await beurt(w0, c, "Ik kan 's avonds, maar in het weekend kan ik niet.", { soort: ["antwoord"], velden: { werkmoment: "avond_weekend" }, bewijs: { werkmoment: "Ik kan 's avonds" }, reactie: "Helder, avond en weekend.", vraag: "", vraagt: "startdatum" }, "Job: " + nl.werkmoment, nl.werkmoment);
    const wk = [samenvatting(u.r.state.velden, c), ...Object.values(profielVelden(u.r.state.velden))].join(" | ");
    test(`avond, geen weekend (${naam}): de planner leest de volledige beperking`, /avonds, maar in het weekend kan ik niet/.test(wk) && !/avond en weekend/i.test(wk) && !u.r.state.velden.werkmoment, wk);
    test(`avond, geen weekend (${naam}): Job zegt geen avond en weekend en gaat door`, !/avond en weekend|weekend/i.test(tekst(u.r)) && u.r.state.laatsteOnderwerp === "startdatum", tekst(u.r));
    // Knop 5 of meer, daarna "maar alleen in de avond": de avond staat direct op de kaart.
    let a0: any = { ...start(c, "nl", NU).state };
    a0 = { ...a0, velden: { ...a0.velden, ...voorkeur, hotels: "NH", sterren: "4", functievragen: 3, diensten: "5+" }, laatsteOnderwerp: "werkgebied" };
    u = await beurt(a0, c, "maar alleen in de avond", { soort: ["antwoord"], velden: { werkmoment: "avond_weekend" }, bewijs: { werkmoment: "alleen in de avond" }, reactie: "", vraag: "", vraagt: "werkgebied" }, "Job: " + nl.werkgebied, nl.werkgebied);
    const ak = samenvatting(u.r.state.velden, c);
    test(`aanvulling (${naam}): direct na de beurt staat de avond op de kaart, geen weekend`, /5 of meer.*alleen in de avond/.test(ak) && !/weekend/i.test(ak), ak);
    test(`aanvulling (${naam}): Job bevestigt de avond en vraagt de open vraag`, /^Genoteerd: alleen in de avond\. /.test(tekst(u.r)) && u.r.state.laatsteOnderwerp === "werkgebied", tekst(u.r));
  }
  // 3e. Buiten het script (voorstel Max): startmoment, aantal, avonden met een uitzondering en een loonvraag in één bericht.
  const m0 = { ...start(bar, "nl", NU).state, velden: { ...voorkeur, hotels: "NH", sterren: "4" }, laatsteOnderwerp: "diensten" as const };
  u = await beurt(m0 as any, bar, "Vanaf maandag kan ik twee avonden per week, behalve op vrijdag. Wat verdien ik eigenlijk?", { soort: ["antwoord", "vraag"], velden: { diensten: "1-2", startdatumTekst: "vanaf maandag", werkmoment: "avond_weekend" }, bewijs: { diensten: "twee avonden per week", startdatumTekst: "Vanaf maandag", werkmoment: "twee avonden" }, kennis: "loon", vraagKandidaat: "loon", reactie: "Helder.", vraag: "", vraagt: "werkgebied" }, "Job: " + nl.diensten, nl.diensten);
  const mv = u.r.state.velden;
  const mk = [samenvatting(mv, bar), ...Object.values(profielVelden(mv))].join(" | ");
  test("buiten het script: eerst het antwoord op de loonvraag, dan alleen wat openstaat", tekst(u.r).startsWith(kennis("loon")!.nl) && u.r.state.laatsteOnderwerp === "werkgebied", tekst(u.r));
  test("buiten het script: diensten, startmoment en de vrijdaguitzondering staan in het dossier", mv.diensten === "1-2" && /maandag/.test(mv.startdatumTekst || "") && /behalve op vrijdag/.test(mv.werkmomentTekst || "") && !mv.werkmoment, JSON.stringify(mv));
  test("buiten het script: de planner leest de vrijdaguitzondering en niet de loonvraag", /behalve op vrijdag/.test(mk) && !/verdien/i.test(mk) && !/avond en weekend/i.test(mk), mk);
  // 4. Cv: na Ja direct de uploadinstructie, na Nee hoe het later kan.
  const cvS = { ...start(bar, "nl", NU).state, velden: { ...voorkeur, hotels: "NH", sterren: "4", diensten: "5+", werkgebied: "tot 25 km", werkmoment: "flexibel", startdatum: "direct", werkvorm: "hoofdbaan" }, laatsteOnderwerp: "cv" as const };
  u = await beurt(cvS as any, bar, "Ja", { soort: ["antwoord"], velden: { cvParaat: "ja" }, bewijs: { cvParaat: "Ja" }, reactie: "Top, dank je!", vraag: "", vraagt: "klaar" }, "Job: " + nl.cv, nl.cv);
  test("cv ja: direct de uploadinstructie, zonder reactie ervoor", tekst(u.r) === nl.cvUpload && !!u.r.berichten[0].cvUpload, tekst(u.r));
  u = await beurt(cvS as any, bar, "Nee", { soort: ["antwoord"], velden: { cvParaat: "nee" }, bewijs: { cvParaat: "Nee" }, reactie: "Geen probleem.", vraag: "", vraagt: "klaar" }, "Job: " + nl.cv, nl.cv);
  test("cv nee: uitleg hoe het cv later kan", /^Geen probleem! .*cv/.test(tekst(u.r)) && !!u.r.berichten[0].cvUpload, tekst(u.r));
  const p = gesprekPrompt({ ctx: bar, state: start(bar, "nl", NU).state, laatsteVraag: "Vertel eens?", geschiedenis: "Kandidaat: Hi" });
  test("instructie: toon, eerlijk over AI, zeg ik net, kennisbank", /Kort en warm/.test(p) && /Je bent een AI/.test(p) && /zeg ik net/.test(p) && /loon/.test(p));
  test("instructie: geen gedachtestreepjes", !/[\u2013\u2014]/.test(p));
  test("instructie: direct door bij een duidelijk antwoord, eerst afhandelen bij een vraag of correctie", /ga dan direct door met de volgende vraag/.test(p) && /Vraagt of corrigeert de kandidaat iets, handel dat dan eerst af/.test(p) && !/"Helder\."\)/.test(p));
  test("instructie: een aanvulling in eigen woorden heeft een veld", /werkmomentTekst/.test(p) && /maar alleen in de avond/.test(p));

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
