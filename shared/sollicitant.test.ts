/**
 * Huistests: regels van de Sollicitanten-flow (shared/sollicitantRegels.ts).
 * Run met:  npx tsx shared/sollicitant.test.ts
 */
import {
  WOORDPAREN, STELLINGEN, ONDERDELEN, AFWIJSREDENEN, vragenVoor, scriptVoor, motivatie, disc, rasterTelling,
  beschikbaarheidSamenvatting, dagenSinds, dagenTekst, dagKleur, leeftijd, bewaardTot, referentieStatus,
  magAccepteren, magOnboarden, idInOrde, checkUitIntake, openVragen, gestoptInLabel, terugzetLabel,
  afwijsmail, afwijsLabel, redenenVoor, standaardReden, beoordelingCompleet, brancheVan, functieNaam,
  vulIn, voortgangIndex, type Raster,
} from "./sollicitantRegels";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

// DISC: elke stijl staat precies twee keer tegenover elk van de andere drie
{
  const tel: Record<string, number> = {};
  for (const [[, a], [, b]] of WOORDPAREN) { const k = [a, b].sort().join(""); tel[k] = (tel[k] || 0) + 1; }
  test("DISC: zes stijlparen", Object.keys(tel).length === 6);
  test("DISC: elk paar twee keer", Object.values(tel).every((n) => n === 2), JSON.stringify(tel));
  // Mock I5 S4 C2 D1: kies I waar het kan, anders S, anders C
  const keuzes = WOORDPAREN.map(([a, b]) => {
    const rang = ["I", "S", "C", "D"];
    return (rang.indexOf(a[1]) <= rang.indexOf(b[1]) ? 0 : 1) as 0 | 1;
  });
  const d = disc(keuzes);
  test("DISC: profiel I/S", d.profiel === "I/S", d.profiel);
  test("DISC: scores tellen op tot 12", d.scores.D + d.scores.I + d.scores.S + d.scores.C === 12);
  test("DISC: zin I/S", d.zin === "Enthousiast en sociaal, met een rustige en loyale basis.", d.zin);
  test("DISC: onvolledig geeft geen profiel", disc([0, 1]).profiel === "");
}

// Motivatie
{
  const a = [5, 2, 3, 4, 3, 3, 4, 5, 2, 4, 3, 2];
  const m = motivatie(a, "Gezellige collega's");
  test("motivatie: volledig", m.volledig);
  test("motivatie: sociaal 88 (5 en 4)", m.scores.find((s) => s.code === "sociaal")!.score === 88);
  test("motivatie: top twee", m.profiel.map((p) => p.code).join(",") === "sociaal,beleving" || m.profiel.map((p) => p.code).join(",") === "sociaal,vrijheid", m.profiel.map((p) => `${p.code}${p.score}`).join(","));
  const gelijk = motivatie(Array(12).fill(3), "Iets nieuws leren");
  test("motivatie: bij gelijke stand beslist 4.2", gelijk.profiel[0].code === "leerzaam");
  test("motivatie: 1 is 0 en 5 is 100", motivatie(Array(12).fill(1)).scores[0].score === 0 && motivatie(Array(12).fill(5)).scores[0].score === 100);
  test("motivatie: onvolledig", !motivatie([5, 5]).volledig && motivatie([5, 5]).profiel.length === 0);
  test("motivatie: 12 stellingen", STELLINGEN.length === 12);
}

// Beschikbaarheid
{
  const r: Raster = { Vr: { avond: "ja", nacht: "ja" }, Za: { avond: "ja", overdag: "ja" }, Zo: { avond: "ja" }, Ma: { ochtend: "nee" }, Wo: { avond: "ja" } };
  test("raster: telling", rasterTelling(r).ja === 6 && rasterTelling(r).nee === 1);
  test("raster: vooral avond en weekend", beschikbaarheidSamenvatting(r) === "vooral avond en weekend", beschikbaarheidSamenvatting(r));
  test("raster: leeg", beschikbaarheidSamenvatting({}) === "nog niet opgegeven");
}

// Dagen in stap
{
  const nu = new Date("2026-11-07T10:00:00Z");
  test("dagen: vandaag", dagenTekst(dagenSinds("2026-11-07T06:00:00Z", nu)) === "vandaag");
  test("dagen: 1 dag (23:00 in Amsterdam op 6 november)", dagenTekst(dagenSinds("2026-11-06T22:00:00Z", nu)) === "1 dag");
  test("dagen: 8 dagen is rood", dagKleur(dagenSinds("2026-10-30T10:00:00Z", nu)) === "#C2412D");
  test("dagen: 2 dagen is oranje", dagKleur(2) === "#F2B866" && dagKleur(1) === "#3E8E5A" && dagKleur(7) === "#D9761C");
}

// Leeftijd en bewaartermijn
{
  const nu = new Date("2026-11-07T10:00:00Z");
  test("leeftijd: 22", leeftijd("2004-03-12", nu) === 22);
  test("leeftijd: nog niet jarig", leeftijd("2004-12-01", nu) === 21);
  test("bewaard tot: 6 maanden", bewaardTot(new Date("2026-11-07T10:00:00Z")) === "2027-05-07");
  test("bewaard tot: 31 augustus wordt 28 februari", bewaardTot(new Date("2026-08-31T10:00:00Z")) === "2027-02-28");
}

// Ref. en doc. check
{
  test("referentie: open", referentieStatus({}) === "open");
  test("referentie: bezig na geen gehoor", referentieStatus({ pogingen: [{ at: "x", door: "Sanne", uitkomst: "geen_gehoor" }] }) === "bezig");
  test("referentie: overgeslagen telt als in orde", magAccepteren({ idGezien: true, overgeslagen: true }, false));
  test("accepteren: zonder ID niet", !magAccepteren({ uitkomst: "positief" }, false));
  test("accepteren: TWV vraagt verblijfsdocument", !magAccepteren({ idGezien: true, uitkomst: "positief" }, true) && magAccepteren({ idGezien: true, verblijfGezien: true, uitkomst: "positief" }, true));
  test("accepteren: negatief nooit", !magAccepteren({ idGezien: true, uitkomst: "negatief", overgeslagen: true }, false));
  test("onboarden: ID nodig, referentie mag open", magOnboarden({ idGezien: true }, false) && !magOnboarden({}, false));
  test("idInOrde zonder check", !idInOrde(null, false));
  const c = checkUitIntake({ id_gezien: "Gezien", referentie: { naam: "Mark, Café de Jaren", telefoon: "0600000000" } }, "Sanne", "2026-11-07");
  test("check uit intake: ID en referent", c.idGezien === true && c.idDoor === "Sanne" && c.referent === "Mark, Café de Jaren");
  const g = checkUitIntake({ id_gezien: "Niet gezien", referentie: { geen: true } }, "Sanne", "2026-11-07");
  test("check uit intake: eerste baan wordt overgeslagen", g.overgeslagen === true && !g.idGezien && referentieStatus(g) === "overgeslagen");
  const bestaand = checkUitIntake({ id_gezien: "Gezien" }, "Tom", "x", { referent: "Al ingevuld", idGezien: false });
  test("check uit intake: overschrijft niets", bestaand.referent === "Al ingevuld" && bestaand.idGezien === false);
}

// Intakescript
{
  test("script: horeca", scriptVoor("horecamedewerker", false) === "horeca");
  test("script: afwas", scriptVoor("horecamedewerker", true) === "afwas");
  test("script: algemeen", scriptVoor("chef") === "algemeen");
  const ervaring = ONDERDELEN[2];
  const afwas = vragenVoor(ervaring, "afwas").map((v) => v.id);
  test("afwas: geen cocktails en barista", !afwas.includes("cocktails") && !afwas.includes("barista") && afwas.includes("drie_borden"));
  test("horeca: met cocktails", vragenVoor(ervaring, "horeca").some((v) => v.id === "cocktails"));
  test("algemeen: vrije ervaring", vragenVoor(ervaring, "algemeen").some((v) => v.id === "ervaring_werk"));
  test("negen onderdelen", ONDERDELEN.length === 9 && ONDERDELEN.map((o) => o.nr).join("") === "123456789");
  test("vulIn", vulIn("Hoi {voornaam}, ik ben {interviewer}. Je bent {nationaliteit}?", { voornaam: "Lisa", interviewer: "Sanne", nationaliteit: "Nederland" }) === "Hoi Lisa, ik ben Sanne. Je bent Nederlands?");
  test("open vragen: leeg intake heeft er veel", openVragen({}, "horeca", false).length > 10);
  test("open vragen: EHBO geldig alleen bij Ja", !openVragen({ ehbo: "Nee" }, "horeca", true).some((v) => v.startsWith("6.4 Geldig")) && openVragen({ ehbo: "Ja" }, "horeca", true).some((v) => v.startsWith("6.4 Geldig")));
  test("unieke vraag-id's", new Set(ONDERDELEN.flatMap((o) => o.vragen.map((v) => v.id))).size === ONDERDELEN.flatMap((o) => o.vragen).length);
}

// Labels, stappen en afwijzen
{
  test("gestopt in", gestoptInLabel("extra_check") === "Ref. en doc. check" && gestoptInLabel("kandidaten") === "Aangemeld" && gestoptInLabel("gesprek_gepland") === "Sollicitatiegesprek");
  test("terugzetten naar EXTRA check", terugzetLabel("extra_check") === "Ref. en doc. check · EXTRA check");
  test("voortgang", voortgangIndex("beoordelen") === 3 && voortgangIndex("extra_check") === 4);
  test("redenen: niet verschenen alleen bij het gesprek", redenenVoor("gesprek_gepland").some((r) => r.code === "niet_verschenen") && !redenenVoor("beoordelen").some((r) => r.code === "niet_verschenen"));
  test("redenen: referentie negatief alleen bij de check", redenenVoor("ref_doc_check").some((r) => r.code === "referentie_negatief") && !redenenVoor("beoordelen").some((r) => r.code === "referentie_negatief"));
  test("standaardreden", standaardReden("ref_doc_check", "negatief") === "referentie_negatief" && standaardReden("gesprek_gepland", "niet_verschenen") === "niet_verschenen");
  const m = afwijsmail("geen_twv", "Lisa", { naGesprek: true });
  test("afwijsmail: aanhef en onderwerp", m.aanhef === "Hoi Lisa," && m.onderwerp === "Je aanmelding bij EXTRA");
  test("afwijsmail: na gesprek", m.alineas[0].includes("gesprek op kantoor"));
  test("afwijsmail: eigen tekst wint", afwijsmail("anders", "Lisa", { naGesprek: false, eigenTekst: "Eigen zin." }).alineas[1] === "Eigen zin.");
  test("afwijslabel: bestaande code uit Kandidaten", afwijsLabel("te_jong") === "Te jong voor deze functie" && afwijsLabel("anders", "Eigen") === "Eigen");
  const streep = /[\u2013\u2014]/;
  test("geen gedachtestreepjes in redenen en mails", !AFWIJSREDENEN.some((r) => streep.test(r.label) || streep.test(r.mail)));
  test("geen gedachtestreepjes in het script", !ONDERDELEN.some((o) => streep.test(JSON.stringify(o))));
  test("beoordeling compleet", beoordelingCompleet({ communicatief: 0, representatief: 50, extravert: 40, indruk: 100 }) && !beoordelingCompleet({ communicatief: 10 }));
  test("branche", brancheVan("logistiek") === "logistiek" && brancheVan("horecamedewerker") === "hotels" && brancheVan("chef", "events") === "events");
  test("functienaam afwas", functieNaam("horecamedewerker", true) === "Afwas" && functieNaam("chef") === "Keuken");
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
