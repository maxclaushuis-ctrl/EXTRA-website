/**
 * Huistests voor shared/startScherm.ts (beginscherm van het gesprek). Draaien: npm run startscherm:test
 */
import { duur, feiten, gespreksmoment, initialen, punten, tegels, tijdlijn, vasteVraag } from "./startScherm";
import { voorbereiding, type Voortraject } from "./intakeV2";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, detail?: string) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${detail ? `: ${detail}` : ""}`); }
}

const peil = new Date("2026-11-12T10:00:00Z");
const v: Voortraject = {
  functieNaam: "Keuken",
  formulier: { talen: null, ervaring: null, beschikbaarheid: null },
  job: { ervaring: "Ik heb nog niet in een hotel gewerkt", hotels: "Ik heb voornamelijk gewerkt in restaurants", diensten: "5+", werkmoment: "doordeweeks", werkvorm: "hoofdbaan", startdatum: "direct", werkgebied: "tot 25 km" },
  jobTwijfels: [],
  cv: {
    status: "gelezen", uitleg: "8 tot 9 jaar ervaring in de functie; kerntaken beschreven.",
    periodes: [
      { functie: "Kok", werkgever: "Café Voorbeeld", begin: "2018-09", einde: "2018-10" },
      { functie: "Zelfstandig kok", werkgever: "zzp", begin: "2024", einde: "heden" },
      { functie: "Souschef", werkgever: "Bistro Voorbeeld", begin: "2021-04", einde: "2022-06" },
    ],
    aandacht: ["Gesprek en cv verschillen: In het gesprek gaf de kandidaat aan geen ervaring te hebben; het cv toont wel ervaring in de functie. Vraag het bij de kennismaking."],
  },
};

// Kerncijfers
const t = tegels(v);
test("tegels: vier stuks in vaste volgorde", t.map((x) => x.label).join("|") === "Ervaring|Gewenste inzet|Kan beginnen|Werkgebied");
test("tegels: ervaring uit het cv", t[0].hoofd === "8 tot 9 jaar" && t[0].bron === "cv");
test("tegels: inzet kort met toelichting", t[1].hoofd === "5+ diensten" && t[1].sub === "Doordeweeks, als hoofdbaan");
test("tegels: kan beginnen", t[2].hoofd === "Direct");
test("tegels: werkgebied met vervoer onbekend", t[3].hoofd === "Tot 25 km" && t[3].sub === "Vervoer nog onbekend");
const leeg = tegels({ ...v, job: null, cv: { status: "geen", periodes: [], aandacht: [] } });
test("tegels: zonder gegevens alles 'Nog niet bekend', zonder bron", leeg.every((x) => x.hoofd === "Nog niet bekend" && x.bron === null));
test("tegels: duur uit Job als er geen cv is", tegels({ ...v, cv: { status: "geen", periodes: [], aandacht: [] }, job: { ervaring: "3 jaar in een restaurant" } })[0].hoofd === "3 jaar");

// Eerst bespreken
const vb = voorbereiding(v);
const p = punten(vb);
test("punten: hooguit twee", p.length <= 2);
test("punten: de tegenstrijdigheid staat er één keer", p.filter((x) => x.soort === "tegen").length === 1);
test("punten: titel en tekst gesplitst, zonder 'Vraag het bij de kennismaking'", p[0].titel === "Gesprek en cv verschillen" && !p[0].tekst.includes("kennismaking"));
test("punten: vaste vraag bij ervaring", p[0].vraag === vasteVraag("ervaring") && !!p[0].vraag);
test("punten: talen onbekend met vaste vraag", p.some((x) => x.soort === "onbekend" && x.titel === "Talen" && x.vraag === "Welke talen spreek je, en hoe goed?"));
const metVraag = punten({ ...vb, tegenstrijdig: [], bespreekpunten: ["Vraag van de kandidaat: krijg ik reiskosten vergoed?"] });
test("punten: vraag van de kandidaat zonder vraagvak", metVraag[0].soort === "vraag" && metVraag[0].titel === "Krijg ik reiskosten vergoed?" && metVraag[0].vraag === null);
test("punten: onbekend onderwerp zonder vaste zin krijgt geen vraag", vasteVraag("Cv") === null);

// Wat we al weten
const f = feiten(vb);
test("feiten: antwoorden van Job als citaat", f.find((x) => x.label === "Hotels")?.citaat === true && f.find((x) => x.label === "Gewenste functie")?.citaat === false);

// Tijdlijn
const tl = tijdlijn(v, peil);
test("tijdlijn: nieuwste eerst, huidige baan gemarkeerd", tl[0].functie === "Zelfstandig kok" && tl[0].nu && tl[0].periode === "sinds 2024");
test("tijdlijn: duur uit de datums", tl[1].duur === "1 jaar" && tl[2].duur === "2 mnd", JSON.stringify(tl.map((x) => x.duur)));
test("duur: onbekende datum geeft niets", duur(null, "2020", peil) === "" && duur("2020-05", "2019", peil) === "");
test("duur: anderhalf jaar", duur("2019-01", "2020-07", peil) === "1,5 jaar");

// Kop
test("moment: vandaag", gespreksmoment("2026-11-12", "15:00:00", new Date(2026, 10, 12, 9)) === "vandaag 15:00");
test("moment: morgen", gespreksmoment("2026-11-13", "10:30:00", new Date(2026, 10, 12, 9)) === "morgen 10:30");
test("moment: later met dag en datum", /^\S+ 20 nov, 09:00$/.test(gespreksmoment("2026-11-20", "09:00:00", new Date(2026, 10, 12, 9))), gespreksmoment("2026-11-20", "09:00:00", new Date(2026, 10, 12, 9)));
test("moment: zonder datum leeg", gespreksmoment(null, "10:00") === "");
test("initialen", initialen("Daan van Visser") === "DV" && initialen("Daan") === "D" && initialen("") === "?");
test("geen gedachtestreepje in vaste teksten", ![...t.map((x) => x.sub), ...p.map((x) => x.tekst + (x.vraag || ""))].some((x) => /[–—]/.test(x)));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
