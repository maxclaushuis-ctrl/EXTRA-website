/**
 * Huistests: sollicitatieformulier versie 2 (shared/intakeV2.ts).
 * Run met:  npx tsx shared/intakeV2.test.ts
 */
import {
  HOOFDSTUKKEN, SCHUIVEN_V2, PRIORITEITEN, KEUZEFACTOREN, BINDING, isV2, takenVoor, extraTakenVoor, functievragen, kledingTekst,
  voorbereiding, ervaringsvraag, startIntake, openPunten, rasterTelling3, urenTekst, weekpatroon, patroonKort, samenvattingRegels,
  werkvoorkeuren, werkprofielKaart, plannerskaart, laterInspelen, kpis, beoordelingV2Compleet, valideerBeoordelingV2, wijzigingen,
  valideerIntakeV2, medewerkerProfiel, checkUitIntakeV2, referentieOpen, keuzes, inzetStatus, gelijk, datumInWoorden, VRAGEN, type IntakeV2, type Voortraject,
} from "./intakeV2";
import { ONDERDELEN, SCHUIVEN, beoordelingCompleet } from "./sollicitantRegels";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

const hk = { functie: "housekeeping", eersteKeus: "housekeeping", label: "hotels" };
const bediening = { functie: "horecamedewerker", eersteKeus: "bediening", label: "hotels" };
const events = { functie: "horecamedewerker", eersteKeus: "runner", label: "events" };
const logistiek = { functie: "logistiek", eersteKeus: "orderpicker", label: "logistiek" };

// Opzet: negen hoofdstukken in de vaste volgorde; versie 1 blijft onaangeroerd
{
  test("opzet: negen hoofdstukken", HOOFDSTUKKEN.map((h) => h.titel).join("|") === "Opening|Talen|Ervaring|Motivatie|Werkvoorkeuren|Praktische zaken|Beschikbaarheid|Afronden|Foto");
  test("opzet: versie 1 bestaat nog met negen onderdelen", ONDERDELEN.length === 9 && ONDERDELEN[4].titel === "Werkstijl");
  test("opzet: versie 1 heeft nog vier schuiven", SCHUIVEN.length === 4 && beoordelingCompleet({ communicatief: 1, representatief: 2, extravert: 3, indruk: 4 }));
  test("opzet: versie 2 heeft drie schuiven zonder introvert of extravert", SCHUIVEN_V2.map((s) => s.code).join(",") === "communicatief,representatief,indruk");
  test("opzet: isV2 herkent alleen versie 2", isV2({ _versie: 2 }) && !isV2({ stellingen: [1] }) && !isV2(null));
  test("opzet: zeven prioriteiten en zes keuzefactoren uit de opdracht", PRIORITEITEN.length === 7 && KEUZEFACTOREN.length === 6);
}

// Functiegerichte onderdelen: alleen bij de juiste functie
{
  test("functie: housekeeping krijgt de kamertaken", takenVoor(hk).join("|") === "Kamers opmaken|Badkamers schoonmaken|Werken met een kamerlijst", takenVoor(hk).join("|"));
  test("functie: bediening krijgt geen kamertaken", !takenVoor(bediening).some((t) => /kamer/i.test(t)) && takenVoor(bediening).includes("Uitserveren"));
  test("functie: logistiek krijgt magazijntaken", takenVoor(logistiek).includes("Orderpicken"));
  test("functie: vraag housekeeping", functievragen(hk)[0] === "Werkte je vooral op de kamers, in de algemene ruimtes of allebei?");
  test("functie: vraag runner", functievragen(events)[0] === "Wat waren jouw taken tijdens een drukke dienst?");
  test("functie: vraag bar", functievragen({ functie: "horecamedewerker", eersteKeus: "bar" })[0] === "Wat maakte en serveerde je meestal achter de bar?");
  test("functie: vraag logistiek", functievragen(logistiek)[0] === "Welke werkzaamheden deed je zelf en met welke middelen werkte je?");
  test("functie: hooguit twee functievragen", [hk, bediening, events, logistiek, { functie: "horecamedewerker", label: "events" }].every((f) => functievragen(f).length <= 2));
  const meer = { functie: "horecamedewerker", eersteKeus: "runner", label: "events", functies: ["runner", "bar", "banqueting"] };
  test("meer functies: taken van alle gekozen functies, elk één keer", takenVoor(meer).includes("Opbouwen") && takenVoor(meer).includes("Tappen") && new Set(takenVoor(meer)).size === takenVoor(meer).length, takenVoor(meer).join("|"));
  test("meer functies: hoogstens twee vragen, een per functie", functievragen(meer).join("|") === "Wat waren jouw taken tijdens een drukke dienst?|Wat maakte en serveerde je meestal achter de bar?", functievragen(meer).join("|"));
  test("functie: barista en cocktails alleen als extra bij bediening", extraTakenVoor(bediening).includes("Cocktails maken") && !extraTakenVoor(hk).includes("Cocktails maken") && !takenVoor(bediening).includes("Cocktails maken"));
  test("motivatie: vijf bindingsfactoren uit de opdracht", BINDING.length === 5);
  test("functie: kleding alleen waar het speelt", !!kledingTekst(bediening) && kledingTekst(hk) === null && kledingTekst(logistiek) === "Veiligheidsschoenen");
}

// Voorbereiding: alleen echte gegevens, met bron; ontbrekend blijft onbekend
const voor: Voortraject = {
  functieNaam: "Housekeeping",
  formulier: { talen: "Nederlands", ervaring: null, beschikbaarheid: null },
  job: { ervaring: "anderhalf jaar in hotels", diensten: "3-4", werkmoment: "avond_weekend", werkgebied: "tot 15 km", vervoer: "fiets en ov", talen: "Nederlands en Engels" },
  jobTwijfels: ["Vraag van de kandidaat: krijg ik reiskosten?"],
  cv: { status: "gelezen", uitleg: "18 maanden housekeeping in hotels", aandacht: ["Verschil tussen gesprek en cv: gesprek zegt 3 jaar"], periodes: [
    { functie: "Kamermeisje", werkgever: "Hotel Voorbeeld", begin: "2024-01", einde: "2025-06" },
    { functie: "Schoonmaker", werkgever: "Oud Bedrijf", begin: "2022-01", einde: "2022-12" },
  ] },
};
{
  const v = voorbereiding(voor);
  test("voorbereiding: functie, ervaring, inzet, werkgebied, talen en cv staan erin", ["Gewenste functie", "Ervaring", "Gewenste inzet", "Werkgebied", "Talen", "Cv"].every((l) => v.bekend.some((b) => b.label === l)), v.bekend.map((b) => b.label).join(","));
  test("voorbereiding: elke regel heeft een bron", v.bekend.every((b) => ["job", "cv", "formulier"].includes(b.bron)));
  test("voorbereiding: ervaring komt van Job", v.bekend.find((b) => b.label === "Ervaring")!.bron === "job");
  test("voorbereiding: tegenstrijdigheid wordt genoemd", v.tegenstrijdig.length === 1);
  test("voorbereiding: hoogstens twee bespreekpunten, tegenstrijdig eerst", v.bespreekpunten.length === 2 && /Verschil/.test(v.bespreekpunten[0]));
  test("voorbereiding: laatste werkgever uit het cv", v.werkgever === "Hotel Voorbeeld");
  test("voorbereiding: vraag noemt de werkgever alleen als die bekend is", /Hotel Voorbeeld/.test(ervaringsvraag(v.werkgever)) && !/\[|undefined|null/.test(ervaringsvraag(null)));

  const leeg = voorbereiding({ functieNaam: "Bediening", formulier: {}, job: null, jobTwijfels: [], cv: { status: "geen", periodes: [], aandacht: [] } });
  test("zonder cv: cv staat bij ontbreekt, niet als negatief", leeg.ontbreekt.includes("Cv") && !leeg.bekend.some((b) => b.label === "Cv"));
  test("zonder gegevens: niets verzonnen", leeg.bekend.length === 1 && leeg.werkgever === null && leeg.tegenstrijdig.length === 0);
  test("zonder gegevens: bespreekpunten zijn de ontbrekende gegevens", leeg.bespreekpunten.length === 2 && /nog niet bekend/.test(leeg.bespreekpunten[0]));
}

// Start: overnemen wat eenduidig is, met bron; de rest blijft leeg
{
  const s = startIntake(voor);
  test("start: versie 2", s._versie === 2);
  test("start: talen overgenomen zonder niveau", s.talen?.map((t) => t.taal).join(",") === "Nederlands,Engels" && s.talen!.every((t) => t.niveau === null) && s.bronnen?.talen === "job");
  test("start: vervoer overgenomen", s.vervoer?.join(",") === "Fiets,OV" && s.bronnen?.vervoer === "job", s.vervoer?.join(","));
  test("start: afstand overgenomen, reistijd niet omgerekend", s.reisafstand_km === 15 && s.reistijd_min === undefined);
  test("start: uren en raster blijven leeg", s.uren === undefined && s.raster === undefined);
  test("start: e-bike is geen gewone fiets", startIntake({ ...voor, job: { vervoer: "e-bike" } }).vervoer?.join(",") === "E-bike");
  const niets = startIntake({ functieNaam: "x", formulier: {}, job: null, jobTwijfels: [], cv: { status: "geen", periodes: [], aandacht: [] } });
  test("start: zonder voortraject alleen de versie", Object.keys(niets).filter((k) => k !== "_versie" && k !== "bronnen").length === 0);
}

// Een ingevulde intake (fictief)
const vol: IntakeV2 = {
  _versie: 2, bronnen: { talen: "job" }, bevestigd: { talen: "klopt" },
  talen: [{ taal: "Nederlands", niveau: "uitgebreid", bron: "gesprek" }, { taal: "Engels", niveau: "werkgesprekken", bron: "zelf" }],
  ervaring_duur: "1 tot 2 jaar", ervaring_dienst: "Twaalf kamers per dienst, samen met een collega",
  taken: { "Kamers opmaken": { niveau: "zelfstandig", voorbeeld: "Twaalf kamers per dienst" }, "Badkamers schoonmaken": { niveau: "zelfstandig" }, "Werken met een kamerlijst": { niveau: "begeleiding" } },
  prioriteiten: ["Flexibiliteit", "Gezelligheid en contact"], keuzefactoren: ["Werktijden", "Reistijd"], binding: ["Een vertrouwd team", "Waardering"],
  niet_terug: "Onduidelijke afspraken over eindtijden", niet_terug_soort: "voorkeur",
  start_hulp: ["Meelopen met een collega"], locaties: "vast", samenwerken: "team", contact: "regelmatig", kanaal: "whatsapp",
  werkprofiel: { kleuren: ["I", "S"], status: "voorlopig", onderbouwing: "Vertelt vooral over collega's en vaste hotels" },
  vervoer: ["Fiets", "OV"], reistijd_min: 30, laat_thuis: "afhankelijk", kleding: null, id_gezien: "Gezien", werkrecht: "geen_twv",
  acties: [{ tekst: "VCA-certificaat nasturen", eigenaar: "Kandidaat" }, { tekst: "Al gedaan", eigenaar: "Sanne", klaar: true }],
  uren: 14, uren_min: 12, uren_max: 16, patroon: "vast", lastminute: "soms", aankondiging: "paar_dagen",
  raster: { Ma: { avond: "ja" }, Di: { ochtend: "nee", overdag: "nee", avond: "nee", nacht: "nee" }, Wo: { avond: "ja" }, Vr: { avond: "ja" }, Za: { ochtend: "ja", overdag: "ja" }, Zo: { ochtend: "ja", overdag: "ja" } },
  tijden: { Ma: { van: "16:00", tot: "22:00" }, Wo: { van: "16:00", tot: "22:00" }, Vr: { van: "16:00", tot: "23:00" }, Za: { van: "08:00", tot: "18:00" }, Zo: { van: "08:00", tot: "16:00" } },
  samenvatting: "klopt", app_uitleg: ["Diensten bekijken en reageren"], uitbetaling: "dagbetaling", extraatje: "ja",
  referentie: { naam: "Fictieve Leidinggevende", relatie: "Leidinggevende", telefoon: "0600000000", toestemming: true },
};

// Beschikbaarheid: drie standen, uren los van patroon
{
  const t = rasterTelling3(vol.raster);
  test("raster: beschikbaar, niet beschikbaar en onbekend apart geteld", t.ja === 7 && t.nee === 4 && t.onbekend === 17, JSON.stringify(t));
  test("uren: bereik in woorden", urenTekst(vol) === "12 tot 16 uur per week", String(urenTekst(vol)));
  test("uren: leeg blijft leeg", urenTekst({ _versie: 2 }) === null);
  test("uren: alleen gewenst", urenTekst({ _versie: 2, uren: 20 }) === "20 uur per week");
  const w = weekpatroon(vol);
  test("weekpatroon: exacte tijden", w[0].status === "beschikbaar" && w[0].tekst === "16:00 tot 22:00");
  test("weekpatroon: niet beschikbaar", w[1].status === "niet" && w[1].tekst === "Niet beschikbaar");
  test("weekpatroon: onbekend is geen nee", w[3].status === "onbekend" && w[3].tekst === "Nog onbekend");
  test("weekpatroon: zonder tijden de dagdelen", weekpatroon({ _versie: 2, raster: { Ma: { avond: "ja" } } })[0].tekst === "Avond");
  test("patroon kort: avonden en weekend", patroonKort(vol) === "Avonden en weekend", patroonKort(vol));
  test("patroon kort: leeg", patroonKort({ _versie: 2 }) === "Weekpatroon nog niet bekend");
}

// Open punten: onbekend blijft zichtbaar, niets wordt een nul
{
  const open = openPunten({ _versie: 2 }, hk, false);
  test("open: lege intake heeft open punten in elk inhoudelijk hoofdstuk", ["talen", "ervaring", "motivatie", "praktisch", "beschikbaarheid", "afronden", "foto"].every((h) => open.some((o) => o.hoofdstuk === h)));
  test("open: volledige intake heeft er geen", openPunten(vol, hk, true).length === 0, openPunten(vol, hk, true).map((o) => o.tekst).join(","));
  test("open: zonder ervaring geen taakniveaus nodig", !openPunten({ ...vol, ervaring_duur: "Geen ervaring", taken: {} }, hk, true).some((o) => o.tekst === "Niveau per taak"));
  test("open: referentie later aanleveren telt als besproken", !openPunten({ ...vol, referentie: { later: true } }, hk, true).some((o) => o.tekst === "Referentie"));
}

// Samenvatting: hoogstens drie regels, alleen uit antwoorden
{
  const r = samenvattingRegels(vol, "Fleur");
  test("samenvatting: hoogstens drie regels", r.length === 3, String(r.length));
  test("samenvatting: begint met de formule", r[0].startsWith("Als ik je goed begrijp, zoek je vooral flexibiliteit en gezelligheid en contact"), r[0]);
  test("samenvatting: uren uit het antwoord", r[1].includes("12 tot 16 uur per week"), r[1]);
  test("samenvatting: voorkeur wordt geen harde grens", !r.join(" ").includes("harde grens"));
  test("samenvatting: harde grens alleen als bevestigd", samenvattingRegels({ ...vol, niet_terug_soort: "harde_grens" }, "Fleur").join(" ").includes("harde grens"));
  test("samenvatting: leeg geeft niets", samenvattingRegels({ _versie: 2 }, "Fleur").length === 0);
  test("samenvatting: geen gedachtestreepjes", !/[\u2013\u2014]/.test(r.join(" ")));
}

// Werkprofiel: geen automatische kleur, geen percentages
{
  test("werkprofiel: zonder keuze geen kleur", werkprofielKaart({ ...vol, werkprofiel: undefined }).kleuren.length === 0 && werkprofielKaart({ ...vol, werkprofiel: undefined }).titel === "Nog niet vastgesteld");
  const k = werkprofielKaart(vol);
  test("werkprofiel: gekozen kleuren met status", k.titel === "Sociaal · Stabiel" && k.statusLabel === "Voorlopig");
  test("werkprofiel: hoogstens twee kleuren", werkprofielKaart({ _versie: 2, werkprofiel: { kleuren: ["D", "I", "S"] } }).kleuren.length === 2);
  test("werkprofiel: onvoldoende informatie toont geen kleur", werkprofielKaart({ _versie: 2, werkprofiel: { kleuren: ["D"], status: "onvoldoende" } }).kleuren.length === 0);
  test("werkprofiel: geen percentages in de uitvoer", !/%|\d{2,}/.test(JSON.stringify(k)));
  const v = werkvoorkeuren(vol);
  test("voorkeuren: elk met bron", v.length >= 5 && v.every((x) => x.bron.length > 5));
  test("voorkeuren: leeg geeft niets", werkvoorkeuren({ _versie: 2 }).length === 0);
}

// Plannerskaart en later inspelen
{
  const p = plannerskaart(vol);
  test("planner: rijen uit de antwoorden", p.rijen.map((r) => r.label).join("|") === "Werk dat past|Belangrijk bij een dienst|Komt graag terug bij|Prettig contact|Reizen", p.rijen.map((r) => r.label).join("|"));
  test("planner: reizen met tijd, niet omgerekend", p.rijen.find((r) => r.label === "Reizen")!.waarde === "Fiets en OV · maximaal 30 minuten", p.rijen.find((r) => r.label === "Reizen")!.waarde);
  test("planner: voorkeur staat bij liever niet", p.lieverNiet.includes("Onduidelijke afspraken over eindtijden") && p.grenzen.length === 0);
  test("planner: harde grens apart", plannerskaart({ ...vol, niet_terug_soort: "harde_grens" }).grenzen.length === 1 && plannerskaart({ ...vol, niet_terug_soort: "harde_grens" }).lieverNiet.length === 0);
  test("planner: terugreis nog bespreken", p.aandacht[0] === "Nog bespreken: terugreis na een late dienst");
  test("planner: open actie met eigenaar, afgeronde niet", p.aandacht.includes("VCA-certificaat nasturen (Kandidaat)") && !p.aandacht.some((a) => a.includes("Al gedaan")));
  test("planner: leeg geeft lege kaart", plannerskaart({ _versie: 2 }).rijen.length === 0 && plannerskaart({ _versie: 2 }).aandacht.length === 0);
  const l = laterInspelen(vol, "Fleur");
  test("later: flexibiliteit, contact, waardering, dagbetaling, extraatje", ["Flexibiliteit", "Contact en een vertrouwd team", "Waardering", "Regelmatig contact", "Dagbetaling", "EXTRAATJE"].every((b) => l.some((x) => x.behoefte === b)), l.map((x) => x.behoefte).join(","));
  test("later: uren met het gewenste aantal", laterInspelen({ ...vol, prioriteiten: ["Voldoende uren"] }, "Fleur")[0].opvolging === "Na vier weken: haalt Fleur de gewenste 12 tot 16 uur per week?");
  test("later: leeg geeft niets", laterInspelen({ _versie: 2 }, "Fleur").length === 0);
}

// Dashboardkaarten
{
  const k = kpis(vol, hk);
  test("kpi: vier kaarten", k.map((x) => x.label).join("|") === "Ervaring|Werkprofiel|Motivatie|Gewenste inzet");
  test("kpi: ervaring", k[0].hoofd === "1 tot 2 jaar" && k[0].sub === "Zelfstandig: kamers opmaken en badkamers schoonmaken", k[0].sub);
  test("kpi: motivatie zonder cijfer", k[2].hoofd === "Flexibiliteit · Contact" && !/\d/.test(k[2].hoofd + k[2].sub), k[2].hoofd);
  test("planner: kanaal in een zin", plannerskaart(vol).rijen.find((r) => r.label === "Prettig contact")!.waarde === "Regelmatig even inchecken, via WhatsApp");
  test("datum in woorden", datumInWoorden("2026-11-10") === "10 november 2026" && datumInWoorden("") === "" && datumInWoorden("morgen") === "morgen");
  test("kpi: gewenste inzet", k[3].hoofd === "12 tot 16 uur per week" && k[3].sub === "Avonden en weekend");
  const l = kpis({ _versie: 2 }, hk);
  test("kpi: leeg is nog niet bekend, geen nul", l.every((x) => !/^0|\b0 uur/.test(x.hoofd)) && l[0].hoofd === "Nog niet bekend" && l[3].hoofd === "Nog niet bekend");
}

// Beoordeling: leeg blijft leeg
{
  test("beoordeling: leeg is niet compleet", !beoordelingV2Compleet({}) && !beoordelingV2Compleet(null));
  test("beoordeling: drie cijfers is compleet", beoordelingV2Compleet({ communicatief: 72, representatief: 80, indruk: 76 }));
  test("beoordeling: twee cijfers niet", !beoordelingV2Compleet({ communicatief: 72, representatief: 80 }));
  const v = valideerBeoordelingV2({ communicatief: 73, representatief: 0, indruk: 101, extravert: 50, onderbouwing: "  Duidelijk en rustig  " });
  test("beoordeling: exact cijfer blijft exact", v.communicatief === 73);
  test("beoordeling: 0 en 101 worden niet opgeslagen", v.representatief === undefined && v.indruk === undefined);
  test("beoordeling: introvert of extravert gaat niet mee", !("extravert" in v));
  test("beoordeling: onderbouwing bewaard", v.onderbouwing === "Duidelijk en rustig");
  test("beoordeling: wissen kan (null)", valideerBeoordelingV2({ communicatief: null }).communicatief === null);
}

// Historie: correcties overschrijven niets
{
  const a: IntakeV2 = { _versie: 2, bronnen: { vervoer: "job" }, vervoer: ["Fiets"] };
  const w1 = wijzigingen(null, a);
  test("historie: overgenomen uit Job", w1.length === 1 && w1[0].vraag === "vervoer" && w1[0].status === "overgenomen" && w1[0].bron === "job");
  const b: IntakeV2 = { ...a, vervoer: ["Auto"], bevestigd: { vervoer: "aangepast" }, uren: 12 };
  const w2 = wijzigingen(a, b);
  test("historie: correctie is een nieuwe regel met bron gesprek", w2.find((w) => w.vraag === "vervoer")?.status === "aangepast" && w2.find((w) => w.vraag === "vervoer")?.bron === "gesprek");
  test("historie: nieuw antwoord is ingevuld", w2.find((w) => w.vraag === "uren")?.status === "ingevuld");
  test("historie: geen wijziging geeft geen regels", wijzigingen(b, b).length === 0);
  const c: IntakeV2 = { ...a, bevestigd: { vervoer: "klopt" } };
  test("historie: bevestigen zonder wijziging wordt vastgelegd", wijzigingen(a, c).length === 1 && wijzigingen(a, c)[0].status === "bevestigd" && wijzigingen(a, c)[0].bron === "job");
  test("historie: een andere sleutelvolgorde uit de database is geen wijziging", wijzigingen({ _versie: 2, talen: [{ bron: "zelf", taal: "Nederlands", niveau: null }] as any }, { _versie: 2, talen: [{ taal: "Nederlands", niveau: null, bron: "zelf" }] }).length === 0 && gelijk({ a: 1, b: [{ x: 1, y: 2 }] }, { b: [{ y: 2, x: 1 }], a: 1 }) && !gelijk({ a: 1 }, { a: 2 }));
  test("historie: wissen wordt vastgelegd", wijzigingen({ ...a, uren: 12 }, { ...a, uren: null })[0].status === "gewist");
}

// Invoer schonen
{
  test("invoer: geen object geweigerd", valideerIntakeV2("x") === null && valideerIntakeV2([1]) === null);
  test("invoer: hoogstens twee prioriteiten", valideerIntakeV2({ prioriteiten: ["a", "b", "c"] })!.prioriteiten!.length === 2);
  test("invoer: versie wordt gezet", valideerIntakeV2({})!._versie === 2);
  test("invoer: onzinnige uren vallen weg", valideerIntakeV2({ uren: -4 })!.uren === undefined && valideerIntakeV2({ uren: 14 })!.uren === 14);
  test("invoer: te groot geweigerd", valideerIntakeV2({ vragen: "x".repeat(70000) }) === null);
  test("invoer: keuzes met Anders", keuzes(["Uurloon", "Anders"], "Parkeren").join(",") === "Uurloon,Parkeren" && keuzes(["Anders"], "").length === 0);
}

// Aansluiting op de bestaande controles
{
  const c = checkUitIntakeV2(vol, "Sanne", "2026-11-10T10:00:00Z");
  test("controle: ID gezien gaat mee", c.idGezien === true && c.idDoor === "Sanne");
  test("controle: referentie met toestemming gaat mee", c.referent === "Fictieve Leidinggevende, Leidinggevende" && c.telefoon === "0600000000");
  const zonder = checkUitIntakeV2({ ...vol, referentie: { naam: "Iemand", telefoon: "0600000000", toestemming: false } }, "Sanne", "x");
  test("controle: zonder toestemming geen nummer in de check", zonder.referent === undefined && zonder.telefoon === undefined);
  const geen = checkUitIntakeV2({ ...vol, referentie: { geen: true } }, "Sanne", "x");
  test("controle: geen geschikte referentie met reden", geen.overgeslagen === true && /geen geschikte referentie/.test(geen.overslaanReden || ""));
  test("controle: ID niet gezien blijft open", checkUitIntakeV2({ ...vol, id_gezien: "Niet gezien" }, "Sanne", "x").idGezien === undefined);
  test("controle: bestaande check wordt niet overschreven", checkUitIntakeV2(vol, "Sanne", "x", { referent: "Eerder" }).referent === "Eerder");
  test("controle: later aanleveren blijft open", referentieOpen({ _versie: 2, referentie: { later: true } }) === "Kandidaat levert de referentie later aan" && referentieOpen(vol) === null);
}

// Medewerkersprofiel: wat meegaat naar het dossier
{
  const m = medewerkerProfiel(vol, hk, "Fleur");
  test("profiel: versie, inzet, weekpatroon, talen en taken", m.versie === 2 && m.inzet.tekst === "12 tot 16 uur per week" && m.weekpatroon.length === 7 && m.talen.length === 2 && m.taken.length === 3);
  test("profiel: taken zijn zelfrapportage", m.taken.every((t) => t.bron === "volgens kandidaat"));
  test("profiel: Jixbee, EXTRAATJE en contact apart", m.uitbetaling === "dagbetaling" && m.extraatje === "ja" && m.contact.frequentie === "regelmatig" && m.contact.kanaal === "whatsapp");
  test("profiel: leeg blijft leeg", medewerkerProfiel({ _versie: 2 }, hk, "Fleur").inzet.uren === null && medewerkerProfiel({ _versie: 2 }, hk, "Fleur").uitbetaling === null);
}

// Inzetbaar: een positief gesprek of afgeronde controles is nog geen inzetbaar
{
  test("status: na het gesprek nog niet inzetbaar", inzetStatus("beoordelen", null).code === "nog_niet" && inzetStatus("ref_doc_check", null).code === "nog_niet");
  test("status: onboarding is nog niet inzetbaar", inzetStatus("onboarding", null).code === "onboarding" && inzetStatus("onboarding", "nieuw").code === "onboarding");
  test("status: pas inzetbaar als de medewerker actief is", inzetStatus("onboarding", "actief").code === "inzetbaar");
  test("status: archief", inzetStatus("archief", null).code === "gestopt");
  test("vragen: elk antwoord van de voorbeeldintake heeft een vraagtekst", Object.keys(vol).filter((k) => !["_versie", "bronnen", "bevestigd"].includes(k)).every((k) => !!VRAGEN[k]), Object.keys(vol).filter((k) => !VRAGEN[k]).join(","));
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
