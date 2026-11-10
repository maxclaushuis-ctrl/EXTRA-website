/**
 * Huistests Job 3.0 fase 2, begrijpen: doorvragen die aansluiten op het antwoord,
 * vervallen vragen en de bewijscheck. Fictieve kandidaten, geen AI (de lezing is vast).
 * Run met:  npx tsx shared/jobBegrijpen.test.ts
 */
import { start, verwerk, teksten, vervolgOpErvaring, MAX_DOORVRAGEN_PER_VELD, type JobContext, type Lezing } from "./jobRegels";
import { bewijsCheck, herformuleringGoed, valideerLezing } from "./jobLezen";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}
const NU = new Date("2026-11-10T11:47:00Z");
const nl = teksten("nl");
const L = (x: Partial<Lezing>): Lezing => ({ velden: {}, taal: "nl", twijfel: null, ack: "", ...x });
const keuken: JobContext = { voornaam: "Max", functie: "chef", label: "hotels", nationalityZone: "NL", hasCv: false, stopV3: true, begrijpen: true };

// Het gesprek uit de test van Max (10 nov, 11:47), nu met begrijpen
let r = start(keuken, "nl", NU);
r = verwerk(r.state, keuken, { tekst: "Ik ben afwasser geweest en busboy" }, L({
  velden: { ervaring: "Afwasser en busboy", ervaringNiveau: "starter" },
  twijfel: "Aangemeld voor de keuken, ervaring alleen als afwasser en busboy",
  doorvraag: { tekst: "Heb je naast het afwassen ook meegeholpen met koken of voorbereiden?", voor: "ervaring" },
}), NU);
test("Kok met alleen afwaservaring: Job vraagt door op koken", r.berichten.some((b) => b.tekst.includes("meegeholpen met koken")) && r.state.laatsteOnderwerp === "ervaring", r.berichten.map((b) => b.tekst).join(" | "));
test("Twijfel voor de beoordelaar bewaard", r.state.twijfels.some((t) => t.includes("afwasser")));
r = verwerk(r.state, keuken, { tekst: "Ja soms groenten snijden, maar nooit zelf gekookt" }, L({ velden: { ervaring: "Afwasser en busboy; soms groenten gesneden, nooit zelf gekookt", ervaringNiveau: "starter" }, ack: "Groenten snijden, goed om te weten." }), NU);
test("Antwoord op de doorvraag werkt de ervaring bij", r.state.velden.ervaring?.includes("groenten") === true);
test("Daarna de hotelvraag", r.state.laatsteOnderwerp === "hotels", String(r.state.laatsteOnderwerp));
r = verwerk(r.state, keuken, { tekst: "Mee bij snackbars" }, L({ velden: { hotels: "geen, snackbars" }, nvt: ["sterren"] }), NU);
test("Snackbars: geen sterrenvraag", r.state.laatsteOnderwerp !== "sterren" && !r.berichten.some((b) => b.tekst === nl.sterren), String(r.state.laatsteOnderwerp));

// Hoogstens twee doorvragen per veld
{
  let s = start(keuken, "nl", NU).state;
  const dv = L({ velden: {}, doorvraag: { tekst: "Wat deed je daar precies?", voor: "ervaring" } });
  let laatste = verwerk(s, keuken, { tekst: "in de horeca" }, dv, NU);
  for (let i = 1; i < MAX_DOORVRAGEN_PER_VELD; i++) laatste = verwerk(laatste.state, keuken, { tekst: "van alles" }, dv, NU);
  const derde = verwerk(laatste.state, keuken, { tekst: "dingen" }, { ...dv, velden: { ervaring: "dingen" } }, NU);
  test(`Na ${MAX_DOORVRAGEN_PER_VELD} doorvragen gaat Job verder`, !derde.berichten.some((b) => b.tekst === "Wat deed je daar precies?"), derde.berichten.map((b) => b.tekst).join(" | "));
}
// Schakelaar uit: geen doorvraag
{
  const uit = { ...keuken, begrijpen: false };
  const x = verwerk(start(uit, "nl", NU).state, uit, { tekst: "afwasser" }, L({ velden: { ervaring: "afwasser" }, doorvraag: { tekst: "Heb je ook gekookt?", voor: "ervaring" } }), NU);
  test("Schakelaar uit: doorvraag genegeerd", !x.berichten.some((b) => b.tekst === "Heb je ook gekookt?"));
}
// Een "?" is geen reden voor een doorvraag
{
  const s = start(keuken, "nl", NU).state;
  const x = verwerk(s, keuken, { tekst: "?" }, L({ doorvraag: { tekst: "Hoe bedoel je?", voor: "ervaring" } }), NU);
  test("Vraagteken: dezelfde vraag opnieuw, geen doorvraag", !x.berichten.some((b) => b.tekst === "Hoe bedoel je?"));
}

// Controle van de AI-uitvoer
const v = valideerLezing({ velden: {}, doorvraag: { tekst: "Wat deed je daar", voor: "ervaring" }, nvt: ["sterren", "diensten", "x"] });
test("Doorvraag zonder vraagteken valt weg", !v.doorvraag);
test("Alleen geldige vervallen vragen", JSON.stringify(v.nvt) === '["sterren"]');
test("Doorvraag voor een onbekend veld valt weg", !valideerLezing({ doorvraag: { tekst: "Hoe oud ben je?", voor: "leeftijd" } }).doorvraag);
test("Goede doorvraag blijft", valideerLezing({ doorvraag: { tekst: "Hoe ver wil je reizen?", voor: "werkgebied" } }).doorvraag?.voor === "werkgebied");

// Bewijscheck
const b1 = bewijsCheck({ hotels: "Hilton", ervaringNiveau: "geen" }, { hotels: "Hilton" }, "Ik heb nog niet in een hotel gewerkt", "hotels");
test("Hotel dat niet in het antwoord staat: valt weg; niveau zonder bewijs bij een andere vraag ook", b1.hotels === undefined && b1.ervaringNiveau === undefined, JSON.stringify(b1));
const b2 = bewijsCheck({ werkgebied: "tot 25 km", diensten: "3-4" }, { diensten: "3 of 4 diensten" }, "Tot 25 km, en 3 of 4 diensten per week", "werkgebied");
test("Rijk antwoord: veld van de vraag en veld met citaat blijven", b2.werkgebied === "tot 25 km" && b2.diensten === "3-4", JSON.stringify(b2));
const b3 = bewijsCheck({ diensten: "5+" }, {}, "Ik wil fulltime werken", "werkgebied");
test("Veld zonder citaat bij een andere vraag valt weg", b3.diensten === undefined);

// Herformuleren: alleen als de vraag over hetzelfde blijft gaan
test("Herformulering diensten goed", herformuleringGoed("diensten", "Fijn dat je ervaring hebt. Hoeveel diensten per week zou je willen draaien?"));
test("Herformulering die van onderwerp wisselt: afgewezen", !herformuleringGoed("diensten", "Hoe ver wil je reizen?"));
test("Zonder vraagteken: afgewezen", !herformuleringGoed("werkgebied", "Vertel me hoe ver je wilt reizen"));
test("Met link: afgewezen", !herformuleringGoed("startdatum", "Wanneer kun je beginnen? Zie www.doehetextra.nl?"));
test("Te lang: afgewezen", !herformuleringGoed("werkmoment", `Wanneer kun je werken ${"heel ".repeat(60)}?`));
test("Sterren alleen met het woord sterren", herformuleringGoed("sterren", "Hoeveel sterren had het hotel aan de Amstel?") && !herformuleringGoed("sterren", "Was het een duur hotel?"));

// Het gesprek van Max (10 nov, 11:15): 9 jaar keuken, daarna een doorvraag, en dan
// "Ik heb nog niet in een hotel gewerkt". Dat mocht de ervaring niet overschrijven.
{
  let k = start(keuken, "nl", NU);
  k = verwerk(k.state, keuken, { tekst: "Ik heb 9 jaar keukenervaring" }, L({ velden: { ervaring: "9 jaar keukenervaring", ervaringNiveau: "ervaren" } }), NU);
  k = verwerk(k.state, keuken, { tekst: "Ik heb voornamelijk gewerkt in restaurants" }, L({ velden: {}, doorvraag: { tekst: "In wat voor keukens heb je vooral gewerkt?", voor: "ervaring" } }), NU);
  test("Max: doorvraag op ervaring", k.state.laatsteOnderwerp === "ervaring");
  k = verwerk(k.state, keuken, { tekst: "Ik heb nog niet in een hotel gewerkt" }, L({ velden: { ervaring: "Ik heb nog niet in een hotel gewerkt", ervaringNiveau: "geen" } }), NU);
  test("Max: hotelantwoord laat de 9 jaar staan", k.state.velden.ervaring === "9 jaar keukenervaring", String(k.state.velden.ervaring));
  test("Max: niveau blijft ervaren, geen twijfel over ervaring", k.state.velden.ervaringNiveau === "ervaren" && k.state.status !== "planner");
  test("Max: wel genoteerd als geen hotelervaring, dus geen sterrenvraag", k.state.velden.geenHotel === true && k.state.laatsteOnderwerp !== "sterren");
}
test("Vervolg: nieuw antwoord komt erbij", vervolgOpErvaring({ ervaring: "vooral à la carte" }, { ervaring: "9 jaar keuken" }, "ervaring", "vooral à la carte").velden.ervaring === "9 jaar keuken. vooral à la carte");
test("Vervolg: samenvatting van de AI met het oude erin wint", vervolgOpErvaring({ ervaring: "9 jaar keuken, vooral à la carte" }, { ervaring: "9 jaar keuken" }, "ervaring", "x").velden.ervaring === "9 jaar keuken, vooral à la carte");
const afw = vervolgOpErvaring({ ervaringNiveau: "geen" }, { ervaring: "3 jaar keuken", ervaringNiveau: "ervaren" }, "ervaring", "eigenlijk alleen afwas");
test("Vervolg: ervaren gaat niet stil omlaag, wel een twijfel", afw.velden.ervaringNiveau === undefined && !!afw.twijfel?.includes("alleen afwas"));
test("Vervolg: eerste antwoord ongemoeid", vervolgOpErvaring({ ervaring: "geen", ervaringNiveau: "geen" }, {}, "ervaring", "geen").velden.ervaringNiveau === "geen");
test("Vervolg: bij een andere vraag niets anders", vervolgOpErvaring({ diensten: "3-4" } as any, { ervaring: "x" }, "diensten", "3 tot 4").velden.diensten === "3-4");

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
