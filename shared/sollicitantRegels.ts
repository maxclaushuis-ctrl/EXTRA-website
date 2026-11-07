/**
 * Sollicitanten (Hotels): de regels van de flow van gesprek tot Onboarding of
 * Archief. Bron: borden I tot en met J2 op het canvas en het bouwplan, stappen
 * D1 tot en met D10. Alles hier is puur (geen database, geen netwerk) en wordt
 * getest in shared/sollicitant.test.ts.
 *
 * Stappen van een sollicitant:
 *   gesprek_gepland → beoordelen → ref_doc_check → onboarding
 *                         │              │
 *                         └── twijfel ──►extra_check → onboarding
 *   Vanuit elke stap kan Afwijzen of Niet verschenen naar archief.
 *   Terugzetten uit het archief brengt iemand naar de stap waar die stond.
 */

export type Stap = "gesprek_gepland" | "beoordelen" | "ref_doc_check" | "extra_check" | "onboarding" | "archief";
/** "kandidaten": afgewezen in Kandidaten, voordat er een gesprek was. */
export type ArchiefHerkomst = Exclude<Stap, "archief" | "onboarding"> | "kandidaten";

export const STAPPEN: Stap[] = ["gesprek_gepland", "beoordelen", "ref_doc_check", "extra_check", "onboarding", "archief"];

/** Label voor de kolom "Gestopt in" in het Archief. */
export function gestoptInLabel(s: ArchiefHerkomst | null | undefined): string {
  switch (s) {
    case "gesprek_gepland": return "Sollicitatiegesprek";
    case "beoordelen": return "Beoordeling";
    case "ref_doc_check":
    case "extra_check": return "Ref. en doc. check";
    default: return "Aangemeld";
  }
}

/** Label in de vraag "terugzetten?": met de substap EXTRA check erbij. */
export function terugzetLabel(s: ArchiefHerkomst | null | undefined): string {
  if (s === "extra_check") return "Ref. en doc. check · EXTRA check";
  if (s === "kandidaten") return "Kandidaten";
  return gestoptInLabel(s);
}

/** De zes stappen van de voortgangsbalk op de kaart. */
export const VOORTGANG = ["Aangemeld", "Kwalificatie", "Sollicitatiegesprek", "Beoordeling", "Ref. en doc. check", "Onboarding"];
export function voortgangIndex(s: Stap): number {
  switch (s) {
    case "gesprek_gepland": return 2;
    case "beoordelen": return 3;
    case "ref_doc_check":
    case "extra_check": return 4;
    case "onboarding": return 5;
    default: return 2;
  }
}

// ─── Branche ────────────────────────────────────────────────────────────────

export type Branche = "hotels" | "events" | "logistiek";
export const BRANCHES: Branche[] = ["hotels", "events", "logistiek"];
export const BRANCHE: Record<Branche, { label: string; vlak: string; tekst: string; rand: string; foto: string }> = {
  hotels: { label: "Hotels", vlak: "#F6ECF3", tekst: "#7A3D66", rand: "#E6CBDD", foto: "#EBD0E4" },
  events: { label: "Events", vlak: "#EAF3FB", tekst: "#1D4566", rand: "#C9DDF0", foto: "#C7DFF4" },
  logistiek: { label: "Logistiek", vlak: "#EEF3E7", tekst: "#3E5A2A", rand: "#D3E0C2", foto: "#CEDBBC" },
};
export function brancheVan(functie: string | null | undefined, opgeslagen?: string | null): Branche {
  if (opgeslagen === "hotels" || opgeslagen === "events" || opgeslagen === "logistiek") return opgeslagen;
  return functie === "logistiek" ? "logistiek" : "hotels";
}

export const FUNCTIE_LABEL: Record<string, string> = {
  horecamedewerker: "Bediening en bar",
  housekeeping: "Housekeeping",
  chef: "Keuken",
  frontoffice: "Front office",
  logistiek: "Logistiek",
};
export function functieNaam(functie: string, afwas?: boolean | null): string {
  if (functie === "horecamedewerker" && afwas) return "Afwas";
  return FUNCTIE_LABEL[functie] || functie;
}

// ─── Intakescript ───────────────────────────────────────────────────────────

/**
 * horeca: het volledige script Horecamedewerker (I3c).
 * afwas: hetzelfde zonder de barvragen (3.5 cocktails, 3.6 barista, Bar bij 3.8).
 * algemeen: voor functies zonder eigen script (keuken, housekeeping, front office,
 *   logistiek): de gedeelde onderdelen, met een korte ervaring en praktische zaken.
 */
export type Script = "horeca" | "afwas" | "algemeen";
export function scriptVoor(functie: string, afwas?: boolean | null): Script {
  if (functie === "horecamedewerker") return afwas ? "afwas" : "horeca";
  return "algemeen";
}
export const SCRIPT_NAAM: Record<Script, string> = { horeca: "Horecamedewerker", afwas: "Afwas", algemeen: "Algemeen" };

export type VraagSoort =
  | "keuze" | "meer" | "score" | "tekst" | "getal" | "maand"
  | "vaardigheden" | "stellingen" | "woordparen" | "raster" | "referentie" | "foto";

export interface Vraag {
  id: string;
  nr: string;
  soort: VraagSoort;
  tekst: string;
  hint?: string;
  opties?: string[];
  /** Bij "meer": deze optie sluit de rest uit. */
  exclusief?: string;
  /** Bij "meer": eigen chips toevoegen met de plus. */
  eigen?: boolean;
  /** Bij "meer": vrije tekst als deze optie gekozen is. */
  andersOptie?: string;
  min?: number;
  max?: number;
  labels?: [string, string];
  placeholder?: string;
  /** Vul in zonder te vragen ("Jij beoordeelt"). */
  beoordeel?: boolean;
  /** Sleutel in wat Job al wist (zie jobWistAl). */
  job?: "talen" | "ervaring" | "werkgebied" | "diensten" | "bijbaan";
  /** Alleen tonen als een andere vraag dit antwoord heeft. */
  als?: { vraag: string; is: string };
  /** Na een keuze meteen door naar het volgende onderdeel. */
  autoVolgende?: boolean;
  scripts?: Script[];
}

export interface Onderdeel {
  nr: number;
  titel: string;
  doel: string;
  jeZegt?: string;
  jeZegtNa?: string;
  uitleg: string;
  vragen: Vraag[];
}

const ALLE: Script[] = ["horeca", "afwas", "algemeen"];
const HORECA: Script[] = ["horeca", "afwas"];

export const STELLINGEN = [
  "Ik werk graag in een gezellig team.",
  "Ik bepaal graag zelf wanneer ik werk.",
  "Ik wil zoveel mogelijk verdienen.",
  "Ik hou van afwisseling.",
  "Ik wil nieuwe dingen leren.",
  "Ik wil laten zien wat ik kan.",
  "Contact met mensen geeft me energie.",
  "Werk moet naast mijn studie of baan passen.",
  "Ik wil duidelijke uren en op tijd betaald worden.",
  "Ik werk graag op inspirerende locaties.",
  "Ik wil mezelf ontwikkelen.",
  "Ik wil doorgroeien.",
];

export type Motief = "sociaal" | "vrijheid" | "rationeel" | "beleving" | "leerzaam" | "prestatie";
export const MOTIEVEN: { code: Motief; label: string; stellingen: [number, number]; belangrijkst: string; zoekt: string; biedt: string }[] = [
  { code: "sociaal", label: "Sociaal", stellingen: [0, 6], belangrijkst: "Gezellige collega's", zoekt: "Gezellige collega's en contact met gasten", biedt: "Vaste teams en terugkerende locaties, samen met bekenden inplannen" },
  { code: "vrijheid", label: "Vrijheid", stellingen: [1, 7], belangrijkst: "Zelf mijn tijd indelen", zoekt: "Zelf bepalen wanneer en hoeveel", biedt: "Diensten die passen naast studie of andere baan" },
  { code: "rationeel", label: "Rationeel", stellingen: [2, 8], belangrijkst: "Goed verdienen en zekerheid", zoekt: "Goed verdienen en zekerheid", biedt: "Veel uren, duidelijke tarieven, op tijd betaald" },
  { code: "beleving", label: "Beleving", stellingen: [3, 9], belangrijkst: "Afwisseling en bijzondere plekken", zoekt: "Afwisseling en bijzondere plekken", biedt: "Events, festivals en steeds een andere locatie" },
  { code: "leerzaam", label: "Leerzaam", stellingen: [4, 10], belangrijkst: "Iets nieuws leren", zoekt: "Iets nieuws leren en ontwikkelen", biedt: "Meelopen met ervaren collega's, nieuwe taken proberen" },
  { code: "prestatie", label: "Prestatie", stellingen: [5, 11], belangrijkst: "Laten zien wat ik kan", zoekt: "Laten zien wat je kan, doorgroeien", biedt: "Meer verantwoordelijkheid, teamleider, vaste klant" },
];
const BELANGRIJKST_OPTIES = ["Gezellige collega's", "Zelf mijn tijd indelen", "Afwisseling en bijzondere plekken", "Goed verdienen en zekerheid", "Iets nieuws leren", "Laten zien wat ik kan"];

export type DiscLetter = "D" | "I" | "S" | "C";
/** Twaalf woordparen; elke stijl staat twee keer tegenover elk van de andere drie. */
export const WOORDPAREN: [[string, DiscLetter], [string, DiscLetter]][] = [
  [["Doortastend", "D"], ["Geduldig", "S"]],
  [["Enthousiast", "I"], ["Nauwkeurig", "C"]],
  [["Snel", "D"], ["Bedachtzaam", "C"]],
  [["Spontaan", "I"], ["Rustig", "S"]],
  [["Zorgvuldig", "C"], ["Vastberaden", "D"]],
  [["Daadkrachtig", "D"], ["Gezellig", "I"]],
  [["Betrouwbaar", "S"], ["Precies", "C"]],
  [["Overtuigend", "I"], ["Behulpzaam", "S"]],
  [["Gedreven", "D"], ["Hartelijk", "I"]],
  [["Kalm", "S"], ["Direct", "D"]],
  [["Grondig", "C"], ["Vrolijk", "I"]],
  [["Geordend", "C"], ["Loyaal", "S"]],
];
export const DISC: Record<DiscLetter, { naam: string; omschrijving: string; kleur: string; kleurNaam: string }> = {
  D: { naam: "Dominant", omschrijving: "Resultaatgericht en direct", kleur: "#C8553D", kleurNaam: "Rood" },
  I: { naam: "Interactief", omschrijving: "Enthousiast en sociaal", kleur: "#E3B23C", kleurNaam: "Geel" },
  S: { naam: "Stabiel", omschrijving: "Rustig en loyaal", kleur: "#5B8C51", kleurNaam: "Groen" },
  C: { naam: "Consciëntieus", omschrijving: "Nauwkeurig en analytisch", kleur: "#3C6E9F", kleurNaam: "Blauw" },
};
/** Bij gelijke stand gaat deze volgorde voor. */
const DISC_VOLGORDE: DiscLetter[] = ["I", "S", "C", "D"];

export const DAGEN = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
export const DAGEN_KORT = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
export const DAGDELEN = [
  { code: "ochtend", label: "Ochtend", tijd: "05:00 tot 08:00" },
  { code: "overdag", label: "Overdag", tijd: "08:00 tot 16:00" },
  { code: "avond", label: "Avond", tijd: "16:00 tot 22:00" },
  { code: "nacht", label: "Nacht", tijd: "22:00 tot 05:00" },
];

const UITLEG_SCRIPT = "Zo lees je het script: de vraag tussen aanhalingstekens lees je letterlijk voor. Bij \"Je zegt\" staat vaste tekst om voor te lezen. \"Jij beoordeelt\" vul je zelf in, zonder te vragen. \"Job wist al\" bevestig je met Klopt of pas je aan met Aanpassen.";

export const ONDERDELEN: Onderdeel[] = [
  {
    nr: 1, titel: "Opening", doel: "Op je gemak stellen en vertellen hoe het gesprek loopt.",
    jeZegt: "Hoi {voornaam}, welkom! Ik ben {interviewer}. Dit gesprek duurt zo'n half uur. Aan het eind is er tijd voor jouw vragen.",
    uitleg: `${UITLEG_SCRIPT} Bij het ID noteer je alleen of je het zag: geen nummer, geen kopie.`,
    vragen: [
      { id: "id_gezien", nr: "1.1", soort: "keuze", tekst: "Mag ik je ID-kaart of paspoort zien?", hint: "Alleen noteren of je het zag. Geen nummer, geen kopie.", opties: ["Gezien", "Niet gezien"], autoVolgende: true },
    ],
  },
  {
    nr: 2, titel: "Achtergrond", doel: "Talen en werkautorisatie bevestigen.",
    uitleg: `${UITLEG_SCRIPT} Dit onderdeel is hetzelfde voor elke functie.`,
    vragen: [
      { id: "talen", nr: "2.1", soort: "meer", tekst: "Spreek je naast Nederlands en Engels nog andere talen?", opties: ["Nederlands", "Engels", "Arabisch", "Duits", "Frans", "Spaans", "Anders, namelijk"], andersOptie: "Anders, namelijk", placeholder: "Andere taal, bij Anders", job: "talen" },
      { id: "nationaliteit", nr: "2.2", soort: "keuze", tekst: "Je bent {nationaliteit}, klopt dat?", hint: "Buiten de EU? Vraag naar het verblijfsdocument.", opties: ["Ja, geen TWV nodig", "TWV nodig"] },
    ],
  },
  {
    nr: 3, titel: "Ervaring", doel: "Begrijpen wat {voornaam} kan, zodat de planner de juiste diensten kiest.",
    uitleg: `${UITLEG_SCRIPT} Dit onderdeel verschilt per functie.`,
    vragen: [
      { id: "ervaring_soort", nr: "3.1", soort: "meer", tekst: "Wat voor soort ervaring heb je?", hint: "Mist er iets? Voeg het toe met de plus.", opties: ["Festival", "Fine dining", "Hotel", "Restaurant", "Café/bar", "High-end events"], eigen: true, job: "ervaring", scripts: HORECA },
      { id: "ervaring_werk", nr: "3.1", soort: "tekst", tekst: "Wat voor werk heb je tot nu toe gedaan?", placeholder: "Waar, hoe lang en wat deed je", job: "ervaring", scripts: ["algemeen"] },
      { id: "ervaring_jaren", nr: "3.2", soort: "keuze", tekst: "Hoeveel werkervaring heb je in dit werk?", opties: ["Geen ervaring", "<6 maanden", "6-12 maanden", "1-2 jaar", "2-3 jaar", "3-5 jaar", "5+ jaar"], job: "ervaring" },
      { id: "alleen_dienst", nr: "3.3", soort: "keuze", tekst: "Heb je weleens alleen een dienst gedraaid?", opties: ["Ja", "Nee"], scripts: HORECA },
      { id: "drie_borden", nr: "3.4", soort: "keuze", tekst: "Kun je drie borden tegelijk dragen?", hint: "Twijfel? Laat het voordoen.", opties: ["Ja", "Nee"], scripts: HORECA },
      { id: "cocktails", nr: "3.5", soort: "score", tekst: "Hoe goed kun je cocktails maken?", min: 0, max: 5, labels: ["0 = kan ik niet", "5 = heel goed"], scripts: ["horeca"] },
      { id: "barista", nr: "3.6", soort: "score", tekst: "Heb je barista-ervaring? Hoe goed ben je?", min: 0, max: 5, labels: ["0 = geen ervaring", "5 = heel goed"], scripts: ["horeca"] },
      { id: "bijbaan", nr: "3.7", soort: "tekst", tekst: "Heb je nu nog een andere bijbaan?", placeholder: "Bijvoorbeeld: nee, studeert", job: "bijbaan" },
      { id: "vaardigheden", nr: "3.8", soort: "vaardigheden", tekst: "Vaardigheden, jouw inschatting", beoordeel: true, min: 1, max: 5, labels: ["1 = zwak", "5 = sterk"], scripts: HORECA },
    ],
  },
  {
    nr: 4, titel: "Motivatie", doel: "Achterhalen wat {voornaam} in EXTRA zoekt. Levert het motivatieprofiel op.",
    jeZegt: "Welke stelling is waar voor jou? 1 is helemaal niet waar, 5 is helemaal waar.",
    uitleg: "Twaalf stellingen, elk twee keer per motief: Sociaal, Vrijheid, Rationeel, Beleving, Leerzaam en Prestatie. Het profiel is de top twee. Bij gelijke stand beslist wat het belangrijkst is (4.2). Het is een indicatie, nooit een reden om af te wijzen.",
    vragen: [
      { id: "stellingen", nr: "4.1", soort: "stellingen", tekst: "Welke stelling is waar voor jou?", hint: "Het motivatieprofiel verschijnt na de laatste zin." },
      { id: "belangrijkst", nr: "4.2", soort: "keuze", tekst: "Wat is voor jou het belangrijkst?", opties: BELANGRIJKST_OPTIES },
    ],
  },
  {
    nr: 5, titel: "Werkstijl", doel: "Zien hoe {voornaam} werkt en samenwerkt. Levert het DISC-profiel op.",
    jeZegt: "Ik noem steeds twee woorden. Kies het woord dat het meest bij je past. Er is geen goed of fout.",
    uitleg: "Twaalf woordparen. Elk woord hoort bij één stijl: D Dominant (rood), I Interactief (geel), S Stabiel (groen) of C Consciëntieus (blauw). Beide woorden zijn even positief, dus er is geen wenselijk antwoord. Score per stijl: aantal keer gekozen, van 0 tot 6. De hoogste twee vormen het profiel. Eigen vragenset op basis van het DISC-model, geen gevalideerde test. Nooit een reden om af te wijzen.",
    vragen: [
      { id: "woordparen", nr: "5.1", soort: "woordparen", tekst: "Kies steeds het woord dat het meest bij je past.", hint: "Lees beide woorden voor en tik het gekozen woord aan." },
    ],
  },
  {
    nr: 6, titel: "Praktische zaken", doel: "Vervoer, rijbewijs, werkkleding en EHBO.",
    uitleg: `${UITLEG_SCRIPT} Dit onderdeel verschilt per functie.`,
    vragen: [
      { id: "vervoer", nr: "6.1", soort: "meer", tekst: "Heb je eigen vervoer?", hint: "Meerdere keuzes mogelijk.", opties: ["Fiets", "Elektrische fiets", "Scooter", "Auto", "OV"], job: "werkgebied" },
      { id: "studenten_ov", nr: "6.1", soort: "keuze", tekst: "Studenten-OV", opties: ["Geen", "Week", "Weekend"] },
      { id: "rijbewijzen", nr: "6.2", soort: "meer", tekst: "Welke rijbewijzen heb je?", hint: "AM is bromfiets en scooter, B is auto, C en CE zijn vrachtwagen, D is bus.", opties: ["Geen", "AM", "A1", "A2", "A", "B", "BE", "C1", "C", "CE", "D"], exclusief: "Geen" },
      { id: "kleding", nr: "6.3", soort: "meer", tekst: "Heb je een wit hemd, zwarte broek en zwarte schoenen?", hint: "Mist er iets? Zeg dat het vóór de eerste dienst geregeld moet zijn.", opties: ["Wit hemd", "Zwarte pantalon", "Nette zwarte schoenen"], scripts: HORECA },
      { id: "ehbo", nr: "6.4", soort: "keuze", tekst: "Heb je een EHBO-diploma?", hint: "Ja? Vraag tot wanneer het geldig is.", opties: ["Ja", "Nee"] },
      { id: "ehbo_geldig", nr: "6.4", soort: "maand", tekst: "Geldig tot (maand en jaar)", als: { vraag: "ehbo", is: "Ja" } },
    ],
  },
  {
    nr: 7, titel: "Beschikbaarheid", doel: "Weten wanneer de planner {voornaam} kan inzetten.",
    uitleg: "De vier dagdelen zijn dezelfde als in de EXTRAATJE-app. Groen is beschikbaar, rood is niet beschikbaar, leeg is niet opgegeven. Het doorsturen naar de app volgt later, na apart akkoord.",
    vragen: [
      { id: "uren", nr: "7.1", soort: "getal", tekst: "Hoeveel uur per week kun je werken?", placeholder: "Aantal uren", job: "diensten" },
      { id: "raster", nr: "7.2", soort: "raster", tekst: "Wanneer ben je beschikbaar?", hint: "Loop de week door. Tik één keer voor beschikbaar, twee keer voor niet beschikbaar, nog een keer voor leeg. Events zijn vaak op vrijdag en zaterdag, en lopen tot laat." },
    ],
  },
  {
    nr: 8, titel: "Afronden", doel: "Referentie, vragen en de volgende stap.",
    jeZegtNa: "Dankjewel {voornaam}! We bellen eerst je referentie. Daarna hoor je van ons.",
    uitleg: "Vraag naar iemand die je over het werk van de sollicitant kan vertellen, bij voorkeur een leidinggevende. Geen werkervaring? Zet dan Geen referentie mogelijk aan; de referentiecheck staat dan op overgeslagen.",
    vragen: [
      { id: "referentie", nr: "8.1", soort: "referentie", tekst: "Wie mogen we bellen als referentie?" },
      { id: "vragen", nr: "8.2", soort: "tekst", tekst: "Heb jij nog vragen?", placeholder: "Notitie" },
    ],
  },
  {
    nr: 9, titel: "Foto", doel: "Een foto van {voornaam} voor het dossier.",
    uitleg: "De camera gaat aan zodra je dit onderdeel opent. Na Gebruik foto haalt de iPad zelf de achtergrond weg en zet de sollicitant op de kleur van de branche. Er gaat niets naar een externe dienst. Liever geen foto? Kies Foto overslaan.",
    vragen: [
      { id: "foto", nr: "9.1", soort: "foto", tekst: "Foto" },
    ],
  },
];

export function vragenVoor(o: Onderdeel, script: Script): Vraag[] {
  return o.vragen.filter((v) => (v.scripts || ALLE).includes(script));
}

/** Vult {voornaam}, {interviewer} en {nationaliteit} in. */
export function vulIn(tekst: string, w: { voornaam?: string; interviewer?: string; nationaliteit?: string }): string {
  return tekst
    .replace(/\{voornaam\}/g, w.voornaam || "de sollicitant")
    .replace(/\{interviewer\}/g, w.interviewer || "je interviewer")
    .replace(/\{nationaliteit\}/g, nationaliteitBijvoeglijk(w.nationaliteit));
}

const BIJVOEGLIJK: Record<string, string> = {
  nederland: "Nederlands", belgie: "Belgisch", "belgië": "Belgisch", duitsland: "Duits", spanje: "Spaans", italie: "Italiaans", "italië": "Italiaans",
  polen: "Pools", frankrijk: "Frans", portugal: "Portugees", marokko: "Marokkaans", turkije: "Turks", "verenigd koninkrijk": "Brits", griekenland: "Grieks",
};
export function nationaliteitBijvoeglijk(n?: string | null): string {
  if (!n) return "Nederlands";
  return BIJVOEGLIJK[n.trim().toLowerCase()] || n.trim();
}

// ─── Antwoorden van de intake ───────────────────────────────────────────────

export type Cel = "ja" | "nee" | null;
export type Raster = Record<string, Record<string, Cel>>;
export interface Intake {
  [vraag: string]: unknown;
  id_gezien?: "Gezien" | "Niet gezien";
  talen?: string[];
  talen_anders?: string;
  nationaliteit?: string;
  ervaring_soort?: string[];
  ervaring_werk?: string;
  ervaring_jaren?: string;
  alleen_dienst?: string;
  drie_borden?: string;
  cocktails?: number;
  barista?: number;
  bijbaan?: string;
  vaardigheden?: { bediening?: number; bar?: number; diner?: number };
  stellingen?: (number | null)[];
  belangrijkst?: string;
  woordparen?: (0 | 1 | null)[];
  vervoer?: string[];
  studenten_ov?: string;
  rijbewijzen?: string[];
  kleding?: string[];
  ehbo?: string;
  ehbo_geldig?: string;
  uren?: number;
  raster?: Raster;
  referentie?: { naam?: string; telefoon?: string; geen?: boolean };
  vragen?: string;
  /** Per vraag: heeft de interviewer "Job wist al" bevestigd of aangepast? */
  job?: Record<string, "klopt" | "aanpassen">;
}

/** Welke vragen zijn nog leeg (voor de waarschuwing bij Intake afronden). */
export function openVragen(intake: Intake, script: Script, metFoto: boolean): string[] {
  const uit: string[] = [];
  for (const o of ONDERDELEN) {
    for (const v of vragenVoor(o, script)) {
      if (v.als && intake[v.als.vraag] !== v.als.is) continue;
      if (v.soort === "foto") { if (!metFoto) uit.push(`${o.nr} ${o.titel}`); continue; }
      const a = intake[v.id];
      let leeg = a === undefined || a === null || a === "" || (Array.isArray(a) && a.length === 0);
      if (v.soort === "stellingen") leeg = !Array.isArray(a) || a.filter((x) => typeof x === "number").length < STELLINGEN.length;
      if (v.soort === "woordparen") leeg = !Array.isArray(a) || a.filter((x) => x === 0 || x === 1).length < WOORDPAREN.length;
      if (v.soort === "referentie") { const r = a as Intake["referentie"]; leeg = !r || (!r.geen && !(r.naam || "").trim()); }
      if (v.soort === "raster") leeg = rasterTelling(a as Raster).ja + rasterTelling(a as Raster).nee === 0;
      if (v.soort === "vaardigheden") { const s = (a || {}) as Record<string, number>; leeg = !s.bediening || !s.diner || (script === "horeca" && !s.bar); }
      if (leeg) uit.push(`${v.nr} ${v.tekst}`);
    }
  }
  return Array.from(new Set(uit));
}

// ─── Berekeningen ───────────────────────────────────────────────────────────

/** Motivatie: gemiddelde van de twee stellingen, 1 = 0 en 5 = 100. */
export function motivatie(antwoorden: (number | null | undefined)[] | undefined, belangrijkst?: string) {
  const a = antwoorden || [];
  const scores = MOTIEVEN.map((m) => {
    const x = a[m.stellingen[0]], y = a[m.stellingen[1]];
    if (typeof x !== "number" || typeof y !== "number") return { ...m, score: null as number | null };
    return { ...m, score: Math.round((((x + y) / 2 - 1) / 4) * 100 + 1e-9) };
  });
  const volledig = scores.every((s) => s.score !== null);
  const voorkeur = MOTIEVEN.find((m) => m.belangrijkst === belangrijkst)?.code;
  const gesorteerd = [...scores].sort((p, q) => {
    const d = (q.score ?? -1) - (p.score ?? -1);
    if (d !== 0) return d;
    if (p.code === voorkeur) return -1;
    if (q.code === voorkeur) return 1;
    return MOTIEVEN.findIndex((m) => m.code === p.code) - MOTIEVEN.findIndex((m) => m.code === q.code);
  });
  return { volledig, scores: gesorteerd, profiel: volledig ? [gesorteerd[0], gesorteerd[1]] : [] };
}

export function disc(keuzes: (0 | 1 | null | undefined)[] | undefined) {
  const tel: Record<DiscLetter, number> = { D: 0, I: 0, S: 0, C: 0 };
  let n = 0;
  WOORDPAREN.forEach((paar, i) => {
    const k = keuzes?.[i];
    if (k === 0 || k === 1) { tel[paar[k][1]] += 1; n += 1; }
  });
  const volgorde = [...DISC_VOLGORDE].sort((a, b) => tel[b] - tel[a] || DISC_VOLGORDE.indexOf(a) - DISC_VOLGORDE.indexOf(b));
  const volledig = n === WOORDPAREN.length;
  return {
    volledig, scores: tel, volgorde,
    profiel: volledig ? `${volgorde[0]}/${volgorde[1]}` : "",
    zin: volledig ? discZin(volgorde[0], volgorde[1]) : "",
  };
}

const DISC_TWEEDE: Record<DiscLetter, string> = {
  D: "met een doortastende, directe kant",
  I: "met een enthousiaste, sociale kant",
  S: "met een rustige en loyale basis",
  C: "met oog voor nauwkeurigheid",
};
export function discZin(a: DiscLetter, b: DiscLetter): string {
  return `${DISC[a].omschrijving}, ${DISC_TWEEDE[b]}.`;
}

export function rasterTelling(r: Raster | undefined | null) {
  let ja = 0, nee = 0;
  for (const dag of DAGEN_KORT) for (const d of DAGDELEN) {
    const c = r?.[dag]?.[d.code];
    if (c === "ja") ja++; else if (c === "nee") nee++;
  }
  return { ja, nee };
}

/** "vooral avond en weekend": de dagdelen met de meeste ja, en weekend als vrijdagavond tot zondag de helft of meer is. */
export function beschikbaarheidSamenvatting(r: Raster | undefined | null): string {
  const { ja } = rasterTelling(r);
  if (!ja) return "nog niet opgegeven";
  const perDeel = DAGDELEN.map((d) => ({ label: d.label.toLowerCase(), n: DAGEN_KORT.filter((dag) => r?.[dag]?.[d.code] === "ja").length }));
  const max = Math.max(...perDeel.map((p) => p.n));
  const delen = perDeel.filter((p) => p.n === max && p.n > 0).map((p) => p.label);
  let weekend = 0;
  if (r?.Vr?.avond === "ja") weekend++;
  if (r?.Vr?.nacht === "ja") weekend++;
  for (const dag of ["Za", "Zo"]) for (const d of DAGDELEN) if (r?.[dag]?.[d.code] === "ja") weekend++;
  const stukken = delen.length > 2 ? ["verspreid over de week"] : delen;
  if (weekend * 2 >= ja && !stukken.includes("verspreid over de week")) stukken.push("weekend");
  return `vooral ${stukken.join(" en ")}`;
}

/** Hele kalenderdagen sinds `sinds` (Amsterdamse datum). */
export function dagenSinds(sinds: Date | string | null | undefined, nu: Date): number {
  if (!sinds) return 0;
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" });
  const a = Date.parse(f.format(new Date(sinds)));
  const b = Date.parse(f.format(nu));
  return Math.max(0, Math.round((b - a) / 86400000));
}
export function dagenTekst(n: number): string {
  return n === 0 ? "vandaag" : n === 1 ? "1 dag" : `${n} dagen`;
}
export function dagKleur(n: number): string {
  if (n <= 1) return "#3E8E5A";
  if (n <= 3) return "#F2B866";
  if (n <= 5) return "#E9963A";
  if (n <= 7) return "#D9761C";
  return "#C2412D";
}

export function leeftijd(geboren: string | null | undefined, nu: Date): number | null {
  if (!geboren) return null;
  const g = new Date(`${String(geboren).slice(0, 10)}T12:00:00Z`);
  if (isNaN(g.getTime())) return null;
  let j = nu.getUTCFullYear() - g.getUTCFullYear();
  const m = nu.getUTCMonth() - g.getUTCMonth();
  if (m < 0 || (m === 0 && nu.getUTCDate() < g.getUTCDate())) j--;
  return j;
}

/** Bewaartermijn in het archief: 6 maanden na archiveren (besluit 6 november). */
export const BEWAAR_MAANDEN = 6;
export function bewaardTot(gearchiveerd: Date): string {
  const d = new Date(Date.UTC(gearchiveerd.getUTCFullYear(), gearchiveerd.getUTCMonth() + BEWAAR_MAANDEN, gearchiveerd.getUTCDate()));
  if (d.getUTCDate() !== gearchiveerd.getUTCDate()) d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

// ─── Ref. en doc. check ─────────────────────────────────────────────────────

export interface Poging { at: string; door: string; uitkomst: "gesproken" | "geen_gehoor" }
export interface Check {
  /** ID: bij de intake gezien, of later bij de check. */
  idGezien?: boolean;
  idDoor?: string;
  idAt?: string;
  verblijfGezien?: boolean;
  verblijfDoor?: string;
  verblijfAt?: string;
  referent?: string;
  telefoon?: string;
  pogingen?: Poging[];
  verslag?: string;
  uitkomst?: "positief" | "negatief" | null;
  overgeslagen?: boolean;
  overslaanReden?: string;
  overslaanDoor?: string;
  overslaanAt?: string;
}

export type RefStatus = "open" | "bezig" | "positief" | "negatief" | "overgeslagen";
export function referentieStatus(c: Check | null | undefined): RefStatus {
  if (!c) return "open";
  if (c.uitkomst === "negatief") return "negatief";
  if (c.uitkomst === "positief") return "positief";
  if (c.overgeslagen) return "overgeslagen";
  if ((c.pogingen || []).length > 0) return "bezig";
  return "open";
}
export function referentieInOrde(c: Check | null | undefined): boolean {
  const s = referentieStatus(c);
  return s === "positief" || s === "overgeslagen";
}
export function idInOrde(c: Check | null | undefined, twvNodig: boolean): boolean {
  if (!c?.idGezien) return false;
  if (twvNodig && !c.verblijfGezien) return false;
  return true;
}
export function magAccepteren(c: Check | null | undefined, twvNodig: boolean): boolean {
  return idInOrde(c, twvNodig) && referentieInOrde(c);
}
/** Onboarden vanuit EXTRA check: het ID moet gezien zijn; de referentie mag open staan (twijfel is al een besluit van een mens). */
export function magOnboarden(c: Check | null | undefined, twvNodig: boolean): boolean {
  return idInOrde(c, twvNodig) && referentieStatus(c) !== "negatief";
}
export function geenGehoorTeller(c: Check | null | undefined): number {
  return (c?.pogingen || []).filter((p) => p.uitkomst === "geen_gehoor").length;
}

/** Begint de check: neemt het ID en de referentie uit de intake over. */
export function checkUitIntake(intake: Intake, door: string, at: string, bestaand?: Check | null): Check {
  const c: Check = { ...(bestaand || {}) };
  if (c.idGezien === undefined && intake.id_gezien === "Gezien") { c.idGezien = true; c.idDoor = door; c.idAt = at; }
  if (c.referent === undefined && intake.referentie?.naam) c.referent = intake.referentie.naam;
  if (c.telefoon === undefined && intake.referentie?.telefoon) c.telefoon = intake.referentie.telefoon;
  if (intake.referentie?.geen && !c.overgeslagen && !c.uitkomst) {
    c.overgeslagen = true; c.overslaanReden = "eerste baan"; c.overslaanDoor = door; c.overslaanAt = at;
  }
  return c;
}

// ─── Beoordeling ────────────────────────────────────────────────────────────

export const SCHUIVEN = [
  { code: "communicatief", naam: "Communicatief vaardig", links: "Gesloten", rechts: "Super vlot", kort: "COMMUNICATIEF" },
  { code: "representatief", naam: "Representatief", links: "Onverzorgd", rechts: "Zeer representatief", kort: "REPRESENTATIEF" },
  { code: "extravert", naam: "Introvert vs extravert", links: "Introvert", rechts: "Extravert", kort: "INTROVERT / EXTRAVERT", tweezijdig: true },
  { code: "indruk", naam: "Algehele indruk", links: "Matig", rechts: "Topper", kort: "ALGEHELE INDRUK" },
] as const;
export type Beoordeling = Partial<Record<(typeof SCHUIVEN)[number]["code"], number>>;
export function beoordelingCompleet(b: Beoordeling | null | undefined): boolean {
  return SCHUIVEN.every((s) => typeof b?.[s.code] === "number");
}

// ─── Afwijzen ───────────────────────────────────────────────────────────────

export interface Afwijsreden {
  code: string;
  label: string;
  /** De alinea in de mail; {voornaam} wordt ingevuld. */
  mail: string;
  /** Alleen kiezen in deze stappen; leeg = overal. */
  stappen?: ArchiefHerkomst[];
  /** Standaard geen mail (bijvoorbeeld als iemand zelf afhaakte). */
  geenMail?: boolean;
}

export const AFWIJSREDENEN: Afwijsreden[] = [
  { code: "beoordeling", label: "Past nu niet bij de functie",
    mail: "We hebben goed naar je gesprek gekeken. Voor de functies die we nu hebben, kiezen we helaas voor andere kandidaten. Dat zegt niets over wie je bent; het gaat om wat er op dit moment nodig is." },
  { code: "te_weinig_diensten", label: "Te weinig diensten beschikbaar",
    mail: "Onze opdrachtgevers vragen meer diensten per week dan je nu kunt werken. Daarom kunnen we je op dit moment helaas niet inzetten. Heb je later meer tijd, dan horen we graag weer van je." },
  { code: "cv", label: "Cv onvoldoende passend",
    mail: "We hebben je cv goed bekeken. Voor de functies die we nu hebben, sluit je ervaring helaas nog niet genoeg aan." },
  { code: "locatie", label: "Locatie te ver",
    mail: "De locaties waar we werken liggen te ver van waar je woont. Dat maakt het lastig om je goed in te plannen, dus we kunnen je op dit moment helaas niet inzetten." },
  { code: "niet_verschenen", label: "Niet komen opdagen", stappen: ["gesprek_gepland"],
    mail: "We hadden een afspraak voor een gesprek op kantoor, maar we hebben je helaas niet gezien. Daarom stoppen we je aanmelding. Wil je toch bij EXTRA werken? Meld je dan opnieuw aan via doehetextra.nl." },
  { code: "geen_reactie", label: "Geen reactie",
    mail: "We hebben een paar keer geprobeerd je te bereiken, maar kregen geen reactie. Daarom stoppen we je aanmelding. Wil je toch bij EXTRA werken? Meld je dan opnieuw aan via doehetextra.nl." },
  { code: "geen_twv", label: "Geen werkvergunning",
    mail: "Op dit moment kunnen we je helaas niet inzetten, omdat je daarvoor een werkvergunning nodig hebt. Verandert dat, dan horen we graag weer van je." },
  { code: "taal", label: "Taal onvoldoende voor deze functie",
    mail: "Voor deze functie is goed Nederlands of Engels nodig, omdat je veel met gasten en collega's praat. Daarom kunnen we je op dit moment helaas niet inzetten." },
  { code: "id_niet_getoond", label: "ID niet getoond",
    mail: "Om bij EXTRA te kunnen werken, moeten we je ID-kaart of paspoort gezien hebben. Dat is helaas niet gelukt, dus we stoppen je aanmelding. Kun je je ID wel laten zien, neem dan contact met ons op." },
  { code: "referentie_negatief", label: "Referentie negatief", stappen: ["ref_doc_check", "extra_check"],
    mail: "We hebben je referentie gesproken en alles naast elkaar gelegd. We kiezen er helaas voor om niet met je verder te gaan." },
  { code: "te_jong", label: "Te jong voor deze functie",
    mail: "Voor deze functie moet je een bepaalde leeftijd hebben, bijvoorbeeld omdat je alcohol schenkt of laat werkt. Daarom kunnen we je nu helaas niet inzetten. Over een tijdje ben je van harte welkom om je opnieuw aan te melden." },
  { code: "zelf_afgehaakt", label: "Zelf afgehaakt", geenMail: true,
    mail: "Je liet ons weten dat je niet verder wilt met je aanmelding. Jammer, maar helemaal goed. Bedenk je je, dan horen we graag weer van je." },
  { code: "anders", label: "Anders, namelijk",
    mail: "We hebben je aanmelding goed bekeken en kiezen er helaas voor om niet met je verder te gaan." },
];

export function afwijsreden(code: string | null | undefined): Afwijsreden | undefined {
  return AFWIJSREDENEN.find((r) => r.code === code);
}
export function afwijsLabel(code: string | null | undefined, eigen?: string | null): string {
  if (code === "anders" && eigen) return eigen;
  return afwijsreden(code)?.label || (code ? code.replace(/_/g, " ") : "Afgewezen");
}
export function redenenVoor(stap: ArchiefHerkomst): Afwijsreden[] {
  return AFWIJSREDENEN.filter((r) => !r.stappen || r.stappen.includes(stap));
}
/** De reden die de context al aangeeft. */
export function standaardReden(stap: ArchiefHerkomst, aanleiding?: "niet_verschenen" | "negatief"): string {
  if (aanleiding === "niet_verschenen") return "niet_verschenen";
  if (aanleiding === "negatief") return "referentie_negatief";
  return stap === "gesprek_gepland" ? "" : "beoordeling";
}

export interface Afwijsmail { onderwerp: string; aanhef: string; alineas: string[] }
export function afwijsmail(code: string, voornaam: string, o: { naGesprek: boolean; eigenTekst?: string }): Afwijsmail {
  const r = afwijsreden(code) || afwijsreden("anders")!;
  const opening = o.naGesprek
    ? "Dank je voor je aanmelding en voor het gesprek op kantoor."
    : "Dank je voor je aanmelding bij EXTRA.";
  const kern = (o.eigenTekst && o.eigenTekst.trim()) || r.mail.replace(/\{voornaam\}/g, voornaam);
  return {
    onderwerp: "Je aanmelding bij EXTRA",
    aanhef: `Hoi ${voornaam},`,
    alineas: [opening, kern, "We wensen je veel succes."],
  };
}
