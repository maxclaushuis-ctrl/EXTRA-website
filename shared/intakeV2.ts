/**
 * Sollicitatieformulier versie 2: het persoonlijke gesprek op kantoor.
 *
 * Versie 1 (shared/sollicitantRegels.ts, ONDERDELEN) blijft bestaan; elk dossier legt
 * vast met welke versie de intake is afgenomen (sollicitant_dossiers.intake_versie).
 * Versie 2 bouwt voort op wat het voortraject al weet (formulier, Job, cv) en legt
 * gestructureerd vast wat de planner later nodig heeft: wat iemand kan, wil, wat hem
 * motiveert, welke begeleiding past en wat praktisch mogelijk is.
 *
 * Uitgangspunten (opdracht 10 november 2026):
 *  - onbekend is geen nee, nul of onvoldoende: lege velden blijven leeg;
 *  - zelfrapportage, observatie van de interviewer en gecontroleerde informatie staan apart;
 *  - voorkeur en harde grens zijn verschillende dingen;
 *  - gewenste uren zijn geen beschikbaarheid, een weekpatroon is geen toezegging per datum;
 *  - geen motivatiecijfer en geen automatische kleur: het werkprofiel is een samenvatting
 *    van uitgesproken voorkeuren, met bron; kleuren kiest de interviewer zelf, met onderbouwing.
 *
 * Alles hier is puur (geen database, geen netwerk) en getest in shared/intakeV2.test.ts.
 */
import { DAGDELEN, DAGEN_KORT, DISC, type Cel, type Check, type DiscLetter, type Raster } from "./sollicitantRegels";
import { modelVoor } from "./kandidaatMatch";

export const INTAKE_VERSIE = 2;

// ─── Hoofdstukken ───────────────────────────────────────────────────────────

export type Hoofdstuk = "opening" | "talen" | "ervaring" | "motivatie" | "werkvoorkeuren" | "praktisch" | "beschikbaarheid" | "afronden" | "foto";
export const HOOFDSTUKKEN: { code: Hoofdstuk; titel: string; minuten: number; kop: string; doel: string; uitleg: string }[] = [
  { code: "opening", titel: "Opening", minuten: 1, kop: "Welkom, {voornaam}", doel: "Op je gemak stellen en aansluiten op wat we al weten.",
    uitleg: "Lees de introductie in je eigen woorden. Zeg alleen dat je het cv of het gesprek met Job hebt bekeken als je dat ook echt hebt gedaan." },
  { code: "talen", titel: "Talen", minuten: 1, kop: "In welke talen kan {voornaam} werken?", doel: "Weten in welke talen overleggen op het werk goed gaat.",
    uitleg: "Het niveau gaat over werken: basis is korte instructies begrijpen, werkgesprekken is overleggen met collega's en gasten, uitgebreid is ook lastige gesprekken. Zet erbij of de kandidaat het zelf zegt of dat jij het in dit gesprek hebt gehoord." },
  { code: "ervaring", titel: "Ervaring", minuten: 3, kop: "Wat kan {voornaam}?", doel: "Begrijpen wat iemand echt gedaan heeft, zodat de planner de juiste diensten kiest.",
    uitleg: "Laat eerst vertellen hoe een normale dienst eruitzag. Leg daarna per taak vast: geen ervaring, met begeleiding of zelfstandig. Dit is wat de kandidaat vertelt; controleren doet de referentie. Niemand hoeft iets voor te doen." },
  { code: "motivatie", titel: "Motivatie", minuten: 3, kop: "Wat zoekt {voornaam} in het werk?", doel: "Achterhalen wat iemand uit EXTRA wil halen en waarom iemand ergens graag terugkomt.",
    uitleg: "Laat de kandidaat eerst vertellen. Leg daarna de kern vast, hoogstens twee per vraag. Noemt iemand veel, vraag dan: wat zijn voor jou de twee belangrijkste? Er komt geen cijfer uit." },
  { code: "werkvoorkeuren", titel: "Werkvoorkeuren", minuten: 2, kop: "Hoe werkt {voornaam} het liefst?", doel: "Weten welke begeleiding en welk contact passen.",
    uitleg: "Vraag alleen wat nog niet verteld is. Wie duidelijke uitleg fijn vindt, is daarmee niet minder zelfstandig. Het werkprofiel onderaan is een samenvatting van wat is gezegd, geen test." },
  { code: "praktisch", titel: "Praktische zaken", minuten: 2, kop: "Wat is praktisch mogelijk?", doel: "Vervoer, reistijd, kleding en wat nog geregeld moet worden.",
    uitleg: "Reistijd en afstand zijn verschillende dingen: noteer wat de kandidaat noemt. Bij het ID noteer je alleen of je het zag: geen nummer, geen kopie. Geen BSN, IBAN of documentnummers in de notities." },
  { code: "beschikbaarheid", titel: "Beschikbaarheid", minuten: 2, kop: "Wanneer kan {voornaam} werken?", doel: "Gewenste uren en het gebruikelijke weekpatroon.",
    uitleg: "Gewenste uren zijn iets anders dan beschikbaarheid. Het weekpatroon is hoe een gewone week eruitziet, geen toezegging per datum: die geeft de medewerker door in de app. Kies eerst wat je wilt aangeven en tik dan de dagdelen aan." },
  { code: "afronden", titel: "Afronden", minuten: 2, kop: "Klopt het beeld?", doel: "Samenvatten, de app uitleggen en de volgende stap.",
    uitleg: "Lees de samenvatting voor en vraag of het klopt. Leg daarna de app uit. Beloof niets over aanname, loon of diensten: zeg alleen wat de volgende stap echt is." },
  { code: "foto", titel: "Foto", minuten: 1, kop: "Foto voor het dossier", doel: "Een foto, zodat planner en klant weten wie er komt.",
    uitleg: "De foto is vrijwillig en telt nergens in mee. Liever geen foto? Kies Foto overslaan." },
];

// ─── Keuzelijsten ───────────────────────────────────────────────────────────

export const TAALNIVEAUS = [
  { code: "basis", label: "Basis", uitleg: "Korte instructies begrijpen" },
  { code: "werkgesprekken", label: "Werkgesprekken", uitleg: "Overleggen met collega's en gasten" },
  { code: "uitgebreid", label: "Uitgebreid", uitleg: "Ook lastige gesprekken" },
] as const;
export type Taalniveau = (typeof TAALNIVEAUS)[number]["code"];
export const TALEN_VAST = ["Nederlands", "Engels"];
export const TALEN_MEER = ["Arabisch", "Duits", "Frans", "Spaans", "Pools", "Turks", "Portugees", "Italiaans"];

export const TAAKNIVEAUS = [
  { code: "geen", label: "Geen ervaring" },
  { code: "begeleiding", label: "Met begeleiding" },
  { code: "zelfstandig", label: "Zelfstandig" },
] as const;
export type Taakniveau = (typeof TAAKNIVEAUS)[number]["code"];

export const ERVARING_DUUR = ["Geen ervaring", "Minder dan 6 maanden", "6 tot 12 maanden", "1 tot 2 jaar", "2 tot 3 jaar", "3 tot 5 jaar", "Meer dan 5 jaar"];

export const PRIORITEITEN = ["Goed verdienen", "Voldoende uren", "Flexibiliteit", "Voorspelbaarheid", "Gezelligheid en contact", "Afwisseling", "Ontwikkeling"];
export const KEUZEFACTOREN = ["Uurloon", "Werktijden", "Reistijd", "Werkzaamheden", "Locatie", "Bekende collega's"];
export const BINDING = ["Waardering", "Duidelijke afspraken", "Een vertrouwd team", "Goede begeleiding", "Verantwoordelijkheid"];
export const MAX_KEUZES = 2;

/** Besluit Max 11 nov: de eerste drie staan er in elk geval in. Oude keuzes in bestaande dossiers blijven staan. */
export const START_HULP = ["Een duidelijke briefing", "Een vast aanspreekpunt", "Samen met iemand anders van EXTRA", "Eerst meelopen met een ervaren collega", "Zelf rustig de werkplek verkennen", "Meteen zelfstandig aan de slag"];
/** Vaste lijst certificaten (besluit Max 11 nov), met "Anders" voor wat er niet in staat. */
export const CERTIFICATEN = ["Heftruckcertificaat", "Reachtruckcertificaat", "VCA", "HACCP", "BHV", "EHBO", "Sociale Hygiëne"];
export const LOCATIES = [{ code: "vast", label: "Liefst vertrouwde plekken" }, { code: "afwisseling", label: "Juist afwisseling" }, { code: "geen_voorkeur", label: "Geen voorkeur" }] as const;
export const SAMENWERKEN = [{ code: "team", label: "Liefst in een team" }, { code: "zelfstandig", label: "Liefst zelfstandig" }, { code: "beide", label: "Allebei prima" }] as const;
export const CONTACT = [{ code: "regelmatig", label: "Regelmatig even inchecken" }, { code: "wanneer_nodig", label: "Vooral wanneer nodig" }, { code: "geen_voorkeur", label: "Geen voorkeur" }] as const;
export const KANALEN = [{ code: "whatsapp", label: "WhatsApp" }, { code: "bellen", label: "Bellen" }, { code: "app", label: "De app" }, { code: "mail", label: "Mail" }] as const;

export const VERVOER = ["Fiets", "E-bike", "Scooter", "Auto", "OV", "Anders"];
export const LAAT_THUIS = [{ code: "ja", label: "Ja" }, { code: "afhankelijk", label: "Hangt af van locatie en eindtijd" }, { code: "nee", label: "Nee" }] as const;
export const KLEDING = [{ code: "aanwezig", label: "Aanwezig" }, { code: "regelen", label: "Nog regelen" }, { code: "bespreken", label: "Bespreken" }] as const;
export const WERKRECHT = [{ code: "geen_twv", label: "Geen TWV nodig" }, { code: "twv_nodig", label: "TWV nodig" }, { code: "nog_controleren", label: "Nog controleren" }] as const;

/** Het voorkeurskanaal in een zin. */
export const KANAAL_ZIN: Record<string, string> = { whatsapp: "via WhatsApp", bellen: "telefonisch", app: "via de app", mail: "per mail" };
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
/** "2026-11-10" wordt "10 november 2026". Geen geldige datum: de tekst zoals hij is. */
export function datumInWoorden(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m && MAANDEN[Number(m[2]) - 1] ? `${Number(m[3])} ${MAANDEN[Number(m[2]) - 1]} ${m[1]}` : iso || "";
}

export const PATROON = [{ code: "vast", label: "Meestal een vast patroon" }, { code: "wisselend", label: "Wisselt per week" }] as const;
export const AANKONDIGING = [{ code: "dag", label: "Een dag van tevoren is prima" }, { code: "paar_dagen", label: "Een paar dagen" }, { code: "week", label: "Een week" }, { code: "langer", label: "Langer dan een week" }, { code: "geen_voorkeur", label: "Geen voorkeur" }] as const;
export const LASTMINUTE = [{ code: "ja", label: "Ja, bel maar" }, { code: "soms", label: "Soms" }, { code: "nee", label: "Liever niet" }] as const;

export const APP_UITLEG = ["Diensten bekijken en reageren", "Beschikbaarheid bijhouden", "Contact en afmelden", "Uitbetaling en Jixbee", "EXTRAATJE"];
export const UITBETALING = [{ code: "dagbetaling", label: "Dagbetaling" }, { code: "maandelijks", label: "Maandelijks is prima" }, { code: "geen_voorkeur", label: "Nog geen voorkeur" }] as const;
export const EXTRAATJE = [{ code: "ja", label: "Ja" }, { code: "misschien", label: "Misschien" }, { code: "nee", label: "Nee" }] as const;

export const PROFIEL_STATUS = [
  { code: "voorlopig", label: "Voorlopig", uitleg: "Jouw indruk, nog niet met de kandidaat besproken" },
  { code: "bevestigd", label: "Bevestigd", uitleg: "De kandidaat herkent zich erin" },
  { code: "gemengd", label: "Gemengd", uitleg: "Geen duidelijke voorkeur, hangt af van de situatie" },
  { code: "onvoldoende", label: "Onvoldoende informatie", uitleg: "Nog niet genoeg gehoord om iets te zeggen" },
] as const;
export type ProfielStatus = (typeof PROFIEL_STATUS)[number]["code"];
/** Zo noemen we de kleuren in het werkprofiel: een voorkeur in het werk, geen testuitslag. */
export const KLEUR_WERK: Record<DiscLetter, { label: string; herken: string }> = {
  D: { label: "Daadkrachtig", herken: "Pakt graag door, houdt van tempo en eigen verantwoordelijkheid" },
  I: { label: "Sociaal", herken: "Krijgt energie van contact, werkt graag samen en met gasten" },
  S: { label: "Stabiel", herken: "Werkt graag op vertrouwde plekken, met bekende mensen en duidelijkheid" },
  C: { label: "Nauwkeurig", herken: "Wil weten wat de bedoeling is en werkt graag precies" },
};

// ─── Antwoorden ─────────────────────────────────────────────────────────────

export type Bron = "gesprek" | "job" | "cv" | "formulier";
export interface TaalAntwoord { taal: string; niveau: Taalniveau | null; bron: "zelf" | "gesprek" }
export interface TaakAntwoord { niveau: Taakniveau | null; voorbeeld?: string }
export interface Actie { tekst: string; eigenaar: string; klaar?: boolean }
export interface Tijdvak { van?: string; tot?: string }

export interface IntakeV2 {
  [veld: string]: unknown;
  _versie: 2;
  /** Per veld: waar het antwoord vandaan komt als het uit het voortraject is overgenomen. */
  bronnen?: Record<string, Bron>;
  /** Per overgenomen veld: bevestigd in het gesprek of aangepast. */
  bevestigd?: Record<string, "klopt" | "aangepast">;

  /** Vrije notities van de interviewer. Geen BSN, IBAN of documentnummers. */
  notities?: string;

  // Opening
  cv_bekeken?: boolean;
  job_bekeken?: boolean;
  aanleiding?: string;

  // Talen
  talen?: TaalAntwoord[];

  // Ervaring
  ervaring_dienst?: string;
  ervaring_duur?: string;
  taken?: Record<string, TaakAntwoord>;
  taken_eigen?: string[];
  ervaring_extra?: string;
  ervaring_extra2?: string;

  // Motivatie
  prioriteiten?: string[];
  prioriteiten_anders?: string;
  prioriteiten_toelichting?: string;
  keuzefactoren?: string[];
  keuzefactoren_anders?: string;
  fijne_plek?: string;
  binding?: string[];
  binding_anders?: string;
  niet_terug?: string;
  niet_terug_soort?: "voorkeur" | "harde_grens" | null;

  // Werkvoorkeuren en contact
  start_hulp?: string[];
  start_toelichting?: string;
  locaties?: "vast" | "afwisseling" | "geen_voorkeur" | null;
  samenwerken?: "team" | "zelfstandig" | "beide" | null;
  contact?: "regelmatig" | "wanneer_nodig" | "geen_voorkeur" | null;
  kanaal?: "whatsapp" | "bellen" | "app" | "mail" | null;
  werkprofiel?: { kleuren?: DiscLetter[]; status?: ProfielStatus; onderbouwing?: string };

  // Praktisch
  vervoer?: string[];
  reistijd_min?: number | null;
  reisafstand_km?: number | null;
  laat_thuis?: "ja" | "afhankelijk" | "nee" | null;
  rijbewijs?: "ja" | "nee" | null;
  voertuig?: "ja" | "nee" | null;
  kleding?: "aanwezig" | "regelen" | "bespreken" | null;
  /** naam uit CERTIFICATEN, of vrije tekst bij anders: true. */
  certificaten?: { naam: string; geldig_tot?: string; anders?: boolean }[];
  id_gezien?: "Gezien" | "Niet gezien";
  werkrecht?: "geen_twv" | "twv_nodig" | "nog_controleren";
  acties?: Actie[];

  // Beschikbaarheid
  uren?: number | null;
  uren_min?: number | null;
  uren_max?: number | null;
  raster?: Raster;
  tijden?: Record<string, Tijdvak>;
  patroon?: "vast" | "wisselend" | null;
  startdatum?: string;
  aankondiging?: "dag" | "paar_dagen" | "week" | "langer" | "geen_voorkeur" | null;
  lastminute?: "ja" | "soms" | "nee" | null;
  beschikbaarheid_bevestigd_op?: string;

  // Afronden
  samenvatting?: "klopt" | "aangepast" | "niet_bevestigd";
  samenvatting_correctie?: string;
  app_uitleg?: string[];
  uitbetaling?: "dagbetaling" | "maandelijks" | "geen_voorkeur" | null;
  extraatje?: "ja" | "misschien" | "nee" | null;
  referentie?: { naam?: string; relatie?: string; telefoon?: string; toestemming?: boolean | null; later?: boolean; geen?: boolean };
  vragen?: string;
}

/**
 * De vraag bij elk antwoord, met een vast kenmerk. De historie (intake_antwoorden) verwijst naar
 * dit kenmerk; verandert een vraagtekst later, dan krijgt hij een nieuw kenmerk en blijft de oude staan.
 */
export const VRAGEN: Record<string, string> = {
  cv_bekeken: "Cv bekeken voor het gesprek",
  job_bekeken: "Gesprek met Job bekeken voor het gesprek",
  aanleiding: "Wat sprak je aan toen je EXTRA tegenkwam?",
  talen: "In welke talen kun je op je werk goed overleggen?",
  ervaring_dienst: "Hoe zag een normale dienst er voor jou uit?",
  taken: "Welke taken pakte je zelf op en waarbij werkte je samen met iemand?",
  taken_eigen: "Extra taken die de kandidaat noemde",
  ervaring_extra: "Aanvullende vraag bij de functie",
  ervaring_extra2: "Tweede aanvullende vraag bij de functie",
  ervaring_duur: "Ervaring in deze functie, alles bij elkaar (vaststelling interviewer)",
  prioriteiten: "Wat hoop je vooral uit EXTRA te halen?",
  prioriteiten_anders: "Wat hoop je vooral uit EXTRA te halen? Anders, namelijk",
  prioriteiten_toelichting: "Toelichting bij wat iemand uit EXTRA wil halen",
  keuzefactoren: "Waar let je vooral op als je een dienst kiest?",
  keuzefactoren_anders: "Waar let je vooral op als je een dienst kiest? Anders, namelijk",
  fijne_plek: "Waar heb je met plezier gewerkt? Wat maakte het daar fijn?",
  binding: "Wat maakte een werkplek fijn (bindingsfactoren)",
  binding_anders: "Wat maakte een werkplek fijn? Anders, namelijk",
  niet_terug: "Wat zou voor jou een reden zijn om ergens niet terug te komen?",
  niet_terug_soort: "Voorkeur of harde grens",
  start_hulp: "Wat helpt jou om op een nieuwe plek lekker te starten?",
  start_toelichting: "Toelichting bij de start op een nieuwe plek",
  locaties: "Werk je liever op vertrouwde plekken, of vind je afwisseling juist leuk?",
  samenwerken: "Liever in een team of zelfstandig",
  contact: "Vind je het fijn als we af en toe even inchecken, of zoek je ons liever zelf op?",
  kanaal: "Hoe bereiken we je het liefst?",
  werkprofiel: "Werkprofiel (kleuren, status en onderbouwing van de interviewer)",
  vervoer: "Hoe ga je meestal naar je werk?",
  reistijd_min: "Hoelang wil je ongeveer onderweg zijn naar je werk? (minuten)",
  reisafstand_km: "Hoe ver wil je reizen? (km)",
  laat_thuis: "En lukt het dan ook om weer thuis te komen als het laat wordt?",
  rijbewijs: "Rijbewijs B",
  voertuig: "Eigen auto of scooter beschikbaar",
  kleding: "Heb je de werkkleding al?",
  certificaten: "Certificaten met geldigheid",
  id_gezien: "Paspoort of ID-kaart gezien",
  werkrecht: "Werkrecht",
  acties: "Wat moet er nog geregeld worden?",
  uren: "Hoeveel uur per week zou je het liefst werken?",
  uren_min: "Minimaal aantal uren per week",
  uren_max: "Maximaal aantal uren per week",
  raster: "Welke dagen en tijden passen meestal goed? (weekpatroon)",
  tijden: "Exacte tijden per dag",
  patroon: "Is dat meestal een vast patroon, of wisselt het per week?",
  startdatum: "Vanaf wanneer kun je beginnen?",
  aankondiging: "Hoe ver van tevoren hoor je het liefst wanneer je werkt?",
  lastminute: "Mogen we je bellen als er op het laatste moment iemand uitvalt?",
  beschikbaarheid_bevestigd_op: "Beschikbaarheid voor het laatst besproken op",
  samenvatting: "Samenvatting voorgelegd: klopt dat?",
  samenvatting_correctie: "Reactie van de kandidaat op de samenvatting",
  app_uitleg: "App-uitleg: wat is getoond",
  uitbetaling: "Zou je gebruik willen maken van dagbetaling, of vind je maandelijkse uitbetaling prima?",
  extraatje: "Lijkt het je leuk om op deze manier voor extra's te sparen?",
  referentie: "Wie kan iets vertellen over hoe jij werkt, en mogen we die persoon benaderen?",
  vragen: "Wat wil je verder nog weten over werken via EXTRA?",
  notities: "Notities van de interviewer",
  communicatief: "Beoordeling: communicatieve vaardigheden",
  representatief: "Beoordeling: representatief",
  indruk: "Beoordeling: algehele indruk",
  onderbouwing: "Beoordeling: wat onderbouwt jouw beoordeling?",
};

export function isV2(intake: unknown): intake is IntakeV2 {
  return !!intake && typeof intake === "object" && (intake as any)._versie === 2;
}

// ─── Functiegerichte onderdelen ─────────────────────────────────────────────

export interface FunctieCtx {
  functie: string; eersteKeus?: string | null; label?: string | null; afwas?: boolean;
  /** Alle gekozen functies bij de aanmelding (Events kan er meer hebben); de eerste is de hoofdfunctie. */
  functies?: string[] | null;
}

/** De functiemodellen van alle gekozen functies, de hoofdfunctie eerst, elk model één keer. */
function modellen(f: FunctieCtx) {
  const keuzes = [f.afwas ? "afwas" : f.eersteKeus, ...(f.functies || [])];
  const uit = [modelVoor(keuzes[0], f.functie, f.label)];
  for (const k of keuzes.slice(1)) {
    const m = modelVoor(k, f.functie, f.label);
    if (!uit.some((x) => x.sleutel === m.sleutel)) uit.push(m);
  }
  return uit;
}
const hoofd = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** De taken waarvoor de interviewer het niveau vastlegt: de kerntaken van de gekozen functies (shared/kandidaatMatch.ts). */
export function takenVoor(f: FunctieCtx): string[] {
  const uit: string[] = [];
  for (const m of modellen(f)) for (const t of m.kerntaken) if (!uit.includes(hoofd(t))) uit.push(hoofd(t));
  return uit;
}
/** Taken die alleen relevant zijn als de kandidaat ze noemt (toe te voegen met de plus). */
export function extraTakenVoor(f: FunctieCtx): string[] {
  const uit: string[] = [];
  for (const m of modellen(f)) {
    const lijst = m.sleutel === "bediening" || m.sleutel === "events" ? ["Koffie maken (barista)", "Cocktails maken", "Alleen een dienst draaien", "Banqueting"]
      : m.sleutel === "housekeeping" ? ["Algemene ruimtes", "Linnen en voorraad", "Kamers controleren"]
      : m.sleutel === "kok" || m.sleutel === "keukenassistent" ? ["Koude kant", "Warme kant", "Patisserie", "Bestellen en voorraad"]
      : m.sleutel === "frontoffice" ? ["Nachtdienst", "Kassa en afrekenen", "Telefoon en mail"]
      : m.sleutel === "orderpicken" || m.sleutel === "heftruck" ? ["Scannen", "Heftruck", "Reachtruck", "Voorraad tellen"] : [];
    for (const t of lijst) if (!uit.includes(t)) uit.push(t);
  }
  return uit;
}

function vragenBij(keus: string | null | undefined, f: FunctieCtx): string[] {
  const k = (keus || "").toLowerCase();
  if (k === "afwas") return ["Werkte je vooral in de spoelkeuken, of hielp je ook mee in de keuken?"];
  if (k === "runner" || k === "dinerloper") return ["Wat waren jouw taken tijdens een drukke dienst?"];
  if (k === "bar") return ["Wat maakte en serveerde je meestal achter de bar?"];
  if (k === "banqueting") return ["Wat deed jij bij de voorbereiding en tijdens het evenement?"];
  if (f.functie === "housekeeping" || k === "housekeeping") return ["Werkte je vooral op de kamers, in de algemene ruimtes of allebei?"];
  if (f.functie === "logistiek") return ["Welke werkzaamheden deed je zelf en met welke middelen werkte je?"];
  if (f.functie === "chef" || k === "keuken") return ["Welke onderdelen van de keuken deed je zelf?"];
  if (f.functie === "frontoffice" || k === "frontoffice") return ["Welke onderdelen van de receptie deed je zelf?"];
  if (f.label === "events" && !k) return ["Wat waren jouw taken tijdens een drukke dienst?", "Wat deed jij bij de voorbereiding en tijdens het evenement?"];
  return ["Welke onderdelen van de bediening deed je zelf?"];
}
/** Hooguit twee aanvullende functiegerichte vragen, alleen als het antwoord nog niet duidelijk is. */
export function functievragen(f: FunctieCtx): string[] {
  const uit: string[] = [];
  for (const k of [f.afwas ? "afwas" : f.eersteKeus, ...(f.functies || [])]) for (const v of vragenBij(k, f)) if (!uit.includes(v)) uit.push(v);
  return uit.slice(0, 2);
}

/**
 * Werkkleding per functie (besluit Max 11 nov). Banqueting valt onder bediening.
 * Afwas en functies zonder afspraak: geen vraag.
 */
export const KLEDING_PER_FUNCTIE = {
  bediening: "Wit hemd, zwarte pantalon en nette zwarte schoenen",
  housekeeping: "Zwarte broek, zwart T-shirt en zwarte schoenen zonder logo's",
  frontoffice: "Witte blouse, zwarte pantalon en nette zwarte schoenen",
  keuken: "Koksbuis, koksbroek, veiligheidsschoenen en een messenset",
  logistiek: "Veiligheidsschoenen",
} as const;
export function kledingTekst(f: FunctieCtx): string | null {
  if (f.afwas) return null;
  if (f.functie === "logistiek") return KLEDING_PER_FUNCTIE.logistiek;
  const m = modelVoor(f.eersteKeus, f.functie, f.label).sleutel;
  if (m === "housekeeping") return KLEDING_PER_FUNCTIE.housekeeping;
  if (m === "frontoffice") return KLEDING_PER_FUNCTIE.frontoffice;
  if (m === "kok") return KLEDING_PER_FUNCTIE.keuken;
  if (m === "afwas") return null;
  if (m === "orderpicken" || m === "heftruck") return KLEDING_PER_FUNCTIE.logistiek;
  if (f.functie === "horecamedewerker" || m === "bediening" || m === "events") return KLEDING_PER_FUNCTIE.bediening;
  return null;
}

// ─── Wat het voortraject al weet (aansluitlaag, alleen lezen) ───────────────

export interface Voortraject {
  functieNaam: string;
  formulier: { talen?: string | null; ervaring?: string | null; beschikbaarheid?: string | null; postcode?: string | null; woonplaats?: string | null; zone?: string | null };
  /** De velden van Job zoals ze zijn opgeslagen (shared/jobRegels.ts, JobVelden). */
  job: Record<string, unknown> | null;
  jobTwijfels: string[];
  cv: { status: "geen" | "ontvangen" | "gelezen" | "niet_leesbaar"; periodes: { functie: string; werkgever?: string | null; begin?: string | null; einde?: string | null; soort?: string }[]; uitleg?: string | null; aandacht: string[] };
}

const DIENSTEN_TEKST: Record<string, string> = { "1-2": "1 tot 2 diensten per week", "3-4": "3 tot 4 diensten per week", "5+": "5 of meer diensten per week" };
const WERKMOMENT_TEKST: Record<string, string> = { doordeweeks: "doordeweeks", avond_weekend: "avond en weekend", flexibel: "flexibel" };
const STARTDATUM_TEKST: Record<string, string> = { direct: "direct", twee_weken: "binnen twee weken", later: "later" };
const WERKVORM_TEKST: Record<string, string> = { studie: "naast de studie", ander_werk: "naast een andere baan", hoofdbaan: "als hoofdbaan" };
const tekst = (x: unknown) => (typeof x === "string" && x.trim() && x.trim() !== "-" ? x.trim() : "");

export interface Bekend { label: string; waarde: string; bron: Bron }
export interface Voorbereiding {
  bekend: Bekend[];
  ontbreekt: string[];
  tegenstrijdig: string[];
  /** Hoogstens twee punten om in het gesprek op door te gaan. */
  bespreekpunten: string[];
  werkgever: string | null;
}

/** De compacte samenvatting voor de interviewer, alleen uit echte gegevens. */
export function voorbereiding(v: Voortraject): Voorbereiding {
  const j = v.job || {};
  const bekend: Bekend[] = [];
  const ontbreekt: string[] = [];
  const zet = (label: string, waarde: string, bron: Bron) => { if (waarde) bekend.push({ label, waarde, bron }); };
  zet("Gewenste functie", v.functieNaam, "formulier");
  const ervaring = tekst(j.ervaring);
  if (ervaring) zet("Ervaring", ervaring, "job"); else if (tekst(v.formulier.ervaring)) zet("Ervaring", tekst(v.formulier.ervaring), "formulier"); else ontbreekt.push("Ervaring");
  if (tekst(j.functievraag)) zet("Werkzaamheden", tekst(j.functievraag), "job");
  if (tekst(j.hotels) && !j.geenHotel) zet("Hotels", tekst(j.hotels), "job");
  const inzet = [j.diensten ? DIENSTEN_TEKST[String(j.diensten)] : "", j.werkmoment ? WERKMOMENT_TEKST[String(j.werkmoment)] : "", j.werkvorm ? WERKVORM_TEKST[String(j.werkvorm)] : ""].filter(Boolean).join(", ");
  if (inzet) zet("Gewenste inzet", inzet, "job"); else if (tekst(v.formulier.beschikbaarheid)) zet("Gewenste inzet", tekst(v.formulier.beschikbaarheid), "formulier"); else ontbreekt.push("Gewenste inzet");
  if (j.startdatum) zet("Kan beginnen", STARTDATUM_TEKST[String(j.startdatum)] || String(j.startdatum), "job");
  const gebied = [tekst(j.werkgebied), tekst(j.vervoer)].filter(Boolean).join(", ");
  if (gebied) zet("Werkgebied", gebied, "job"); else ontbreekt.push("Werkgebied");
  const talen = tekst(j.talen) || tekst(v.formulier.talen);
  if (talen) zet("Talen", talen, tekst(j.talen) ? "job" : "formulier"); else ontbreekt.push("Talen");
  const cvTekst = v.cv.status === "geen" ? "" : v.cv.status === "gelezen" ? (v.cv.uitleg || "Ontvangen en gelezen") : v.cv.status === "niet_leesbaar" ? "Ontvangen, niet automatisch te lezen" : "Ontvangen";
  if (cvTekst) zet("Cv", cvTekst, "cv"); else ontbreekt.push("Cv");

  const tegenstrijdig = [...v.cv.aandacht.filter((a) => /verschil|tegenstrijd/i.test(a)), ...v.jobTwijfels.filter((t) => /wijkt af|tegenstrijd|verschil/i.test(t))];
  const onbekendJob = Array.isArray(j.onbekend) ? (j.onbekend as string[]) : [];
  const bespreekpunten = [
    ...tegenstrijdig,
    ...v.jobTwijfels.filter((t) => !tegenstrijdig.includes(t) && !/^Vraag van de kandidaat/i.test(t)),
    ...v.jobTwijfels.filter((t) => /^Vraag van de kandidaat/i.test(t)),
    ...onbekendJob.map((o) => `Bij Job onduidelijk gebleven: ${o}`),
    ...v.cv.aandacht.filter((a) => !tegenstrijdig.includes(a)),
    ...ontbreekt.map((o) => `${o} is nog niet bekend`),
  ].slice(0, 2);
  const laatste = [...v.cv.periodes].filter((p) => p.werkgever).sort((a, b) => String(b.einde === "heden" ? "9999" : b.einde || b.begin || "").localeCompare(String(a.einde === "heden" ? "9999" : a.einde || a.begin || "")))[0];
  return { bekend, ontbreekt, tegenstrijdig, bespreekpunten, werkgever: laatste?.werkgever || null };
}

/** De kernvraag bij Ervaring: met de werkgever als die echt bekend is, anders neutraal. */
export function ervaringsvraag(werkgever: string | null): string {
  return werkgever ? `Je hebt bij ${werkgever} gewerkt. Hoe zag een normale dienst er voor jou uit?` : "Hoe zag een normale dienst er voor jou uit op je laatste werkplek?";
}

const TAALWOORDEN: [RegExp, string][] = [[/nederlands|dutch/i, "Nederlands"], [/engels|english/i, "Engels"], [/arabisch|arabic/i, "Arabisch"], [/duits|german/i, "Duits"], [/frans|french/i, "Frans"], [/spaans|spanish/i, "Spaans"], [/pools|polish/i, "Pools"], [/turks|turkish/i, "Turks"], [/portugees|portuguese/i, "Portugees"], [/italiaans|italian/i, "Italiaans"]];

/**
 * Het begin van een nieuwe intake: wat het voortraject al weet staat klaar, met de bron erbij.
 * Alleen wat eenduidig over te nemen is; de rest blijft leeg (onbekend).
 */
export function startIntake(v: Voortraject): IntakeV2 {
  const j = v.job || {};
  const i: IntakeV2 = { _versie: 2, bronnen: {} };
  const talen = tekst(j.talen) || tekst(v.formulier.talen);
  if (talen) {
    const gevonden = TAALWOORDEN.filter(([r]) => r.test(talen)).map(([, n]) => n);
    if (gevonden.length) { i.talen = gevonden.map((taal) => ({ taal, niveau: null, bron: "zelf" as const })); i.bronnen!.talen = tekst(j.talen) ? "job" : "formulier"; }
  }
  const vervoer = tekst(j.vervoer);
  if (vervoer) {
    const lijst = [[/e-?bike|elektrische fiets/i, "E-bike"], [/fiets/i, "Fiets"], [/scooter|brommer/i, "Scooter"], [/auto/i, "Auto"], [/\bov\b|openbaar vervoer|trein|bus|metro|tram/i, "OV"]] as [RegExp, string][];
    const g = lijst.filter(([r]) => r.test(vervoer)).map(([, n]) => n).filter((n, idx, a) => a.indexOf(n) === idx && !(n === "Fiets" && /e-?bike|elektrische fiets/i.test(vervoer) && !/\bfiets\b(?!.*elektr)/i.test(vervoer.replace(/elektrische fiets/gi, ""))));
    if (g.length) { i.vervoer = g; i.bronnen!.vervoer = "job"; }
  }
  const km = /tot (\d{1,3}) ?km/i.exec(tekst(j.werkgebied));
  if (km) { i.reisafstand_km = Number(km[1]); i.bronnen!.reisafstand_km = "job"; }
  return i;
}

// ─── Wat is nog open ────────────────────────────────────────────────────────

const leeg = (x: unknown) => x === undefined || x === null || x === "" || (Array.isArray(x) && x.length === 0);

/** Open punten per hoofdstuk, voor de voortgang en de waarschuwing bij afronden. Alleen wat relevant is. */
export function openPunten(i: IntakeV2, f: FunctieCtx, metFoto: boolean): { hoofdstuk: Hoofdstuk; tekst: string }[] {
  const uit: { hoofdstuk: Hoofdstuk; tekst: string }[] = [];
  const mis = (hoofdstuk: Hoofdstuk, t: string) => uit.push({ hoofdstuk, tekst: t });
  if (leeg(i.talen)) mis("talen", "Talen");
  else if ((i.talen || []).some((t) => !t.niveau)) mis("talen", "Niveau per taal");
  if (leeg(i.ervaring_duur)) mis("ervaring", "Hoe lang ervaring");
  if (i.ervaring_duur !== "Geen ervaring") {
    const taken = takenVoor(f);
    if (!taken.some((t) => i.taken?.[t]?.niveau)) mis("ervaring", "Niveau per taak");
  }
  if (leeg(i.prioriteiten)) mis("motivatie", "Wat hoopt de kandidaat uit EXTRA te halen");
  if (leeg(i.keuzefactoren)) mis("motivatie", "Waar let de kandidaat op bij een dienst");
  if (leeg(i.contact)) mis("werkvoorkeuren", "Contactvoorkeur");
  if (leeg(i.vervoer)) mis("praktisch", "Vervoer");
  if (leeg(i.id_gezien)) mis("praktisch", "ID gezien of niet");
  if (leeg(i.werkrecht)) mis("praktisch", "Werkrecht");
  if (leeg(i.uren)) mis("beschikbaarheid", "Gewenste uren per week");
  const t = rasterTelling3(i.raster);
  if (t.ja + t.nee === 0) mis("beschikbaarheid", "Weekpatroon");
  if (leeg(i.samenvatting)) mis("afronden", "Samenvatting bevestigen");
  const r = i.referentie;
  if (!r || (!r.geen && !r.later && !(r.naam || "").trim())) mis("afronden", "Referentie");
  if (!metFoto) mis("foto", "Foto maken of overslaan");
  return uit;
}

export function rasterTelling3(r: Raster | undefined | null) {
  let ja = 0, nee = 0;
  for (const dag of DAGEN_KORT) for (const d of DAGDELEN) {
    const c = r?.[dag]?.[d.code];
    if (c === "ja") ja++; else if (c === "nee") nee++;
  }
  return { ja, nee, onbekend: DAGEN_KORT.length * DAGDELEN.length - ja - nee };
}

// ─── Samenvattingen (alleen uit vastgelegde antwoorden) ─────────────────────

const lijst = (x: string[]) => (x.length <= 1 ? x.join("") : `${x.slice(0, -1).join(", ")} en ${x[x.length - 1]}`);
const klein = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const label = <T extends readonly { code: string; label: string }[]>(l: T, code: unknown) => l.find((x) => x.code === code)?.label || "";

export function keuzes(basis: string[] | undefined, anders: string | undefined): string[] {
  return [...(basis || []).filter((x) => x !== "Anders"), ...((basis || []).includes("Anders") && anders?.trim() ? [anders.trim()] : [])];
}

/** Gewenste uren, los van beschikbaarheid: "12 tot 16 uur per week" of "12 uur per week". */
export function urenTekst(i: IntakeV2): string | null {
  const min = i.uren_min, max = i.uren_max;
  if (typeof min === "number" && typeof max === "number" && min !== max) return `${Math.min(min, max)} tot ${Math.max(min, max)} uur per week`;
  if (typeof i.uren === "number") return `${i.uren} uur per week`;
  if (typeof min === "number") return `minimaal ${min} uur per week`;
  if (typeof max === "number") return `maximaal ${max} uur per week`;
  return null;
}

export interface DagPatroon { dag: string; status: "beschikbaar" | "niet" | "onbekend"; tekst: string }
/** Het gebruikelijke weekpatroon per dag. Exacte tijden als ze bekend zijn, anders de dagdelen. */
export function weekpatroon(i: IntakeV2): DagPatroon[] {
  return DAGEN_KORT.map((dag) => {
    const cellen = DAGDELEN.map((d) => ({ d, c: (i.raster?.[dag]?.[d.code] ?? null) as Cel }));
    const ja = cellen.filter((x) => x.c === "ja");
    const nee = cellen.filter((x) => x.c === "nee");
    const tijd = i.tijden?.[dag];
    if (ja.length) {
      const t = tijd?.van && tijd?.tot ? `${tijd.van} tot ${tijd.tot}` : tijd?.van ? `vanaf ${tijd.van}` : tijd?.tot ? `tot ${tijd.tot}` : lijst(ja.map((x) => x.d.label));
      return { dag, status: "beschikbaar" as const, tekst: t };
    }
    if (nee.length) return { dag, status: "niet" as const, tekst: "Niet beschikbaar" };
    return { dag, status: "onbekend" as const, tekst: "Nog onbekend" };
  });
}

/** "avonden en weekend": waar de meeste beschikbare dagdelen vallen. */
export function patroonKort(i: IntakeV2): string {
  const r = i.raster;
  const t = rasterTelling3(r);
  if (!t.ja) return "Weekpatroon nog niet bekend";
  const per = DAGDELEN.map((d) => ({ label: d.code === "avond" ? "avonden" : d.code === "ochtend" ? "ochtenden" : d.code === "nacht" ? "nachten" : "overdag", n: DAGEN_KORT.filter((dag) => r?.[dag]?.[d.code] === "ja").length }));
  const max = Math.max(...per.map((p) => p.n));
  const top = per.filter((p) => p.n === max).map((p) => p.label);
  let weekend = 0;
  for (const dag of ["Za", "Zo"]) for (const d of DAGDELEN) if (r?.[dag]?.[d.code] === "ja") weekend++;
  if (r?.Vr?.avond === "ja") weekend++;
  const stukken = top.length > 2 ? ["verspreid over de week"] : top;
  if (weekend * 2 >= t.ja && stukken[0] !== "verspreid over de week") stukken.push("weekend");
  const s = lijst(stukken);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** De samenvatting die de interviewer voorleest: hoogstens drie regels, alleen uit antwoorden. */
export function samenvattingRegels(i: IntakeV2, voornaam: string): string[] {
  const uit: string[] = [];
  const pr = keuzes(i.prioriteiten, i.prioriteiten_anders);
  const loc = i.locaties === "vast" ? "werk je het liefst op vertrouwde plekken" : i.locaties === "afwisseling" ? "vind je afwisseling juist leuk" : "";
  if (pr.length || loc) uit.push(`Als ik je goed begrijp, zoek je vooral ${pr.length ? lijst(pr.map(klein)) : "werk dat bij je past"}${loc ? `, en ${loc}` : ""}.`);
  const kf = keuzes(i.keuzefactoren, i.keuzefactoren_anders);
  const uren = urenTekst(i);
  if (kf.length || uren) uit.push(`${kf.length ? `Bij een dienst let je vooral op ${lijst(kf.map(klein))}` : "Je wilt"}${kf.length && uren ? `, en je wilt ongeveer ${uren} werken` : uren ? ` ongeveer ${uren} werken` : ""}.`);
  const c = i.contact === "regelmatig" ? "Je vindt het fijn als we af en toe even inchecken" : i.contact === "wanneer_nodig" ? "Je zoekt ons vooral zelf op als er iets is" : "";
  const grens = i.niet_terug && i.niet_terug_soort === "harde_grens" ? `${c ? ", en een" : "Een"} harde grens voor jou is: ${klein(i.niet_terug.trim().replace(/\.$/, ""))}` : "";
  if (c || grens) uit.push(`${c}${grens}.`);
  void voornaam;
  return uit.slice(0, 3);
}

// ─── Werkprofiel en plannerskaart ───────────────────────────────────────────

export interface Voorkeur { tekst: string; bron: string }

/**
 * Het werkprofiel in woorden: uitgesproken voorkeuren, elk met het antwoord waar het uit komt.
 * Geen gewichten, geen percentages, geen afgeleide eigenschappen.
 */
export function werkvoorkeuren(i: IntakeV2): Voorkeur[] {
  const uit: Voorkeur[] = [];
  if (i.locaties === "vast") uit.push({ tekst: "Werkt het liefst op vertrouwde plekken", bron: "Werkvoorkeuren: vaste of wisselende locaties" });
  if (i.locaties === "afwisseling") uit.push({ tekst: "Vindt afwisseling in locaties leuk", bron: "Werkvoorkeuren: vaste of wisselende locaties" });
  if (i.samenwerken === "team") uit.push({ tekst: "Werkt het liefst in een team", bron: "Werkvoorkeuren: samenwerken" });
  if (i.samenwerken === "zelfstandig") uit.push({ tekst: "Werkt het liefst zelfstandig", bron: "Werkvoorkeuren: samenwerken" });
  for (const h of i.start_hulp || []) uit.push({ tekst: `Goede start: ${klein(h)}`, bron: "Werkvoorkeuren: wat helpt bij de start" });
  for (const b of keuzes(i.binding, i.binding_anders)) uit.push({ tekst: `Komt graag terug bij: ${klein(b)}`, bron: "Motivatie: waar met plezier gewerkt" });
  if (i.contact === "regelmatig") uit.push({ tekst: "Vindt regelmatig contact fijn", bron: "Werkvoorkeuren: contact" });
  if (i.contact === "wanneer_nodig") uit.push({ tekst: "Zoekt zelf contact wanneer nodig", bron: "Werkvoorkeuren: contact" });
  return uit;
}

export interface WerkprofielKaart { kleuren: DiscLetter[]; titel: string; status: ProfielStatus | null; statusLabel: string; onderbouwing: string }
export function werkprofielKaart(i: IntakeV2): WerkprofielKaart {
  const p = i.werkprofiel || {};
  const kleuren = (p.kleuren || []).filter((k) => !!DISC[k]).slice(0, 2);
  const status = p.status || (kleuren.length ? "voorlopig" : null);
  const titel = status === "onvoldoende" ? "Onvoldoende informatie" : kleuren.length ? kleuren.map((k) => KLEUR_WERK[k].label).join(" · ") : status === "gemengd" ? "Gemengd" : "Nog niet vastgesteld";
  return { kleuren: status === "onvoldoende" ? [] : kleuren, titel, status, statusLabel: status ? label(PROFIEL_STATUS, status) : "", onderbouwing: (p.onderbouwing || "").trim() };
}

export interface Plannerskaart {
  /** Compacte regels voor "Wat zoekt [voornaam]?" */
  rijen: { label: string; waarde: string }[];
  /** Zo zet je iemand goed in: doen, liever niet, harde grens. */
  doen: string[];
  lieverNiet: string[];
  grenzen: string[];
  /** Alleen wezenlijke openstaande punten. */
  aandacht: string[];
}

/**
 * Wat de planner moet weten om iemand goed in te zetten. Elke regel komt rechtstreeks uit
 * een vastgelegd antwoord; staat er niets, dan staat de regel er niet.
 */
export function plannerskaart(i: IntakeV2): Plannerskaart {
  const rijen: { label: string; waarde: string }[] = [];
  const pr = keuzes(i.prioriteiten, i.prioriteiten_anders);
  const past = [...pr, i.locaties === "vast" ? "vaste locaties" : i.locaties === "afwisseling" ? "wisselende locaties" : ""].filter(Boolean);
  if (past.length) rijen.push({ label: "Werk dat past", waarde: past.map((x, n) => (n ? klein(x) : x)).join(" · ") });
  const kf = keuzes(i.keuzefactoren, i.keuzefactoren_anders);
  if (kf.length) rijen.push({ label: "Belangrijk bij een dienst", waarde: lijst(kf.map((x, n) => (n ? klein(x) : x))) });
  const bind = keuzes(i.binding, i.binding_anders);
  if (bind.length) rijen.push({ label: "Komt graag terug bij", waarde: lijst(bind.map((x, n) => (n ? klein(x) : x))) });
  const contact = [label(CONTACT, i.contact), i.kanaal ? KANAAL_ZIN[i.kanaal] || "" : ""].filter(Boolean).join(", ");
  if (contact) rijen.push({ label: "Prettig contact", waarde: contact });
  const reis = [lijst(i.vervoer || []), typeof i.reistijd_min === "number" ? `maximaal ${i.reistijd_min} minuten` : "", typeof i.reisafstand_km === "number" && typeof i.reistijd_min !== "number" ? `tot ${i.reisafstand_km} km` : ""].filter(Boolean).join(" · ");
  if (reis) rijen.push({ label: "Reizen", waarde: reis });

  const doen: string[] = [];
  if ((i.start_hulp || []).length) doen.push(`Eerste dienst: ${klein(lijst(i.start_hulp || []))}`);
  if (i.locaties === "vast") doen.push("Plan bij voorkeur op een locatie waar iemand al geweest is");
  if (i.locaties === "afwisseling") doen.push("Wissel locaties af");
  if (i.samenwerken === "team") doen.push("Plan samen met collega's");
  if ((i.binding || []).includes("Een vertrouwd team")) doen.push("Plan waar mogelijk met bekende collega's");
  if (i.lastminute === "ja") doen.push("Mag gebeld worden voor lastminutediensten (geen toezegging)");
  const lieverNiet: string[] = [];
  if (i.niet_terug?.trim() && i.niet_terug_soort !== "harde_grens") lieverNiet.push(i.niet_terug.trim());
  if (i.lastminute === "nee") lieverNiet.push("Lastminutediensten");
  if (i.aankondiging === "week" || i.aankondiging === "langer") lieverNiet.push(`Diensten korter dan ${i.aankondiging === "week" ? "een week" : "ruim een week"} van tevoren`);
  const grenzen: string[] = [];
  if (i.niet_terug?.trim() && i.niet_terug_soort === "harde_grens") grenzen.push(i.niet_terug.trim());
  if (i.laat_thuis === "nee") grenzen.push("Kan na een late dienst niet thuiskomen: geen late eindtijden");

  const aandacht: string[] = [];
  if (i.laat_thuis === "afhankelijk") aandacht.push("Nog bespreken: terugreis na een late dienst");
  if (i.kleding === "regelen") aandacht.push("Werkkleding moet vóór de eerste dienst geregeld zijn");
  if (i.kleding === "bespreken") aandacht.push("Werkkleding nog bespreken");
  for (const a of i.acties || []) if (!a.klaar && a.tekst.trim()) aandacht.push(`${a.tekst.trim()}${a.eigenaar ? ` (${a.eigenaar})` : ""}`);
  if (i.samenvatting === "niet_bevestigd") aandacht.push("Samenvatting nog niet bevestigd door de kandidaat");
  return { rijen, doen: uniek(doen), lieverNiet, grenzen, aandacht };
}
const uniek = (x: string[]) => x.filter((v, n) => x.indexOf(v) === n);

/**
 * Signalen om later op in te spelen (eigen toevoeging): bij elke uitgesproken behoefte een
 * concreet moment om erop terug te komen. Er wordt niets verstuurd; dit is een geheugensteun
 * voor planner en begeleider, en de basis voor latere persoonlijke opvolging.
 */
export function laterInspelen(i: IntakeV2, voornaam: string): { behoefte: string; opvolging: string }[] {
  const uit: { behoefte: string; opvolging: string }[] = [];
  const pr = i.prioriteiten || [];
  const uren = urenTekst(i);
  if (pr.includes("Voldoende uren")) uit.push({ behoefte: "Voldoende uren", opvolging: `Na vier weken: haalt ${voornaam} ${uren ? `de gewenste ${uren}` : "de gewenste uren"}?` });
  if (pr.includes("Goed verdienen")) uit.push({ behoefte: "Goed verdienen", opvolging: "Wijs op diensten met een hoger uurloon of toeslag zodra die er zijn." });
  if (pr.includes("Flexibiliteit")) uit.push({ behoefte: "Flexibiliteit", opvolging: "Laat zelf kiezen; niet aandringen als iemand een week minder kan." });
  if (pr.includes("Voorspelbaarheid")) uit.push({ behoefte: "Voorspelbaarheid", opvolging: "Plan vooruit en houd vaste dagen aan waar het kan." });
  if (pr.includes("Gezelligheid en contact") || (i.binding || []).includes("Een vertrouwd team")) uit.push({ behoefte: "Contact en een vertrouwd team", opvolging: `Vraag na de eerste diensten met wie ${voornaam} fijn werkte en plan die collega's vaker samen.` });
  if (pr.includes("Afwisseling")) uit.push({ behoefte: "Afwisseling", opvolging: "Bied na een paar diensten op dezelfde plek iets anders aan." });
  if (pr.includes("Ontwikkeling")) uit.push({ behoefte: "Ontwikkeling", opvolging: `Bespreek na een maand welke nieuwe taak ${voornaam} wil leren.` });
  if ((i.binding || []).includes("Waardering")) uit.push({ behoefte: "Waardering", opvolging: "Geef een compliment van de klant altijd door." });
  if (i.contact === "regelmatig") uit.push({ behoefte: "Regelmatig contact", opvolging: "Check kort in na de eerste dienst en daarna eens per paar weken." });
  if (i.uitbetaling === "dagbetaling") uit.push({ behoefte: "Dagbetaling", opvolging: "Controleer na de eerste dienst of Jixbee goed is ingesteld." });
  if (i.extraatje === "ja") uit.push({ behoefte: "EXTRAATJE", opvolging: "Wijs na de eerste diensten op de spaarstand." });
  return uit;
}

// ─── Dashboardkaarten ───────────────────────────────────────────────────────

export interface Kpi { label: string; hoofd: string; sub: string; kleuren?: DiscLetter[] }
/** Korte namen voor de kaart Motivatie; de volledige keuze staat bij Wat zoekt en in de intake. */
const PRIORITEIT_KORT: Record<string, string> = { "Gezelligheid en contact": "Contact", "Voldoende uren": "Uren", "Goed verdienen": "Verdienen" };
export function kpis(i: IntakeV2, f: FunctieCtx, cvUitleg?: string | null): Kpi[] {
  const taken = Object.entries(i.taken || {}).filter(([, t]) => t.niveau === "zelfstandig").map(([naam]) => klein(naam));
  const ervSub = i.ervaring_duur === "Geen ervaring" ? "Start zonder ervaring in deze functie"
    : taken.length ? `Zelfstandig: ${lijst(taken.slice(0, 3))}` : cvUitleg ? cvUitleg.split(";")[0] : (i.ervaring_dienst || "").slice(0, 70) || "Werkzaamheden nog niet vastgelegd";
  const wp = werkprofielKaart(i);
  const pr = keuzes(i.prioriteiten, i.prioriteiten_anders);
  const uren = urenTekst(i);
  void f;
  return [
    { label: "Ervaring", hoofd: i.ervaring_duur || "Nog niet bekend", sub: ervSub },
    { label: "Werkprofiel", hoofd: wp.titel, sub: wp.status && wp.status !== "onvoldoende" ? `${wp.statusLabel}${wp.onderbouwing ? " · met onderbouwing" : ""}` : "Samenvatting van voorkeuren, geen test", kleuren: wp.kleuren },
    { label: "Motivatie", hoofd: pr.length ? pr.map((x) => PRIORITEIT_KORT[x] || x).join(" · ") : "Nog niet bekend", sub: pr.length ? "Voorkeuren uit het gesprek" : "Uit het hoofdstuk Motivatie" },
    { label: "Gewenste inzet", hoofd: uren ? uren.charAt(0).toUpperCase() + uren.slice(1) : "Nog niet bekend", sub: patroonKort(i) },
  ];
}

// ─── Beoordeling door de interviewer (versie 2) ─────────────────────────────

export const SCHUIVEN_V2 = [
  { code: "communicatief", naam: "Communicatieve vaardigheden", hulp: "Begrijpt vragen, antwoordt duidelijk en kan passend overleggen" },
  { code: "representatief", naam: "Representatief", hulp: "Verzorgde, professionele presentatie passend bij het werk" },
  { code: "indruk", naam: "Algehele indruk", hulp: "Jouw totaalbeeld van het gesprek" },
] as const;
export type SchuifV2 = (typeof SCHUIVEN_V2)[number]["code"];
export interface BeoordelingV2 { communicatief?: number | null; representatief?: number | null; indruk?: number | null; onderbouwing?: string }

/** Korte, vaste instructie zodat iedereen hetzelfde bedoelt met een cijfer. */
export const BEOORDEEL_INSTRUCTIE = [
  "Beoordeel alleen wat je in dit gesprek zag en hoorde, niet wat je verwacht of vermoedt.",
  "Communicatie: begrijpt de kandidaat je vragen, zijn de antwoorden duidelijk, kan iemand overleggen in de taal van het werk?",
  "Representatief: verzorgd en professioneel voor deze functie. Geen oordeel over uiterlijk, smaak of stijl.",
  "Algehele indruk: jouw totaaloordeel. Schrijf in de onderbouwing één of twee feiten waar het op rust.",
  "Richtlijn: 1 tot 40 onder wat het werk vraagt, 41 tot 60 voldoende, 61 tot 80 goed, 81 tot 100 uitstekend.",
  "Niet beoordeeld blijft leeg. Eén laag cijfer is nooit vanzelf een afwijzing.",
];

export function beoordelingV2Compleet(b: BeoordelingV2 | null | undefined): boolean {
  return SCHUIVEN_V2.every((s) => typeof b?.[s.code] === "number" && (b[s.code] as number) >= 1 && (b[s.code] as number) <= 100);
}
/** Laat alleen geldige waarden door: 1 tot en met 100 of leeg. */
export function valideerBeoordelingV2(ruw: any): BeoordelingV2 {
  const b: BeoordelingV2 = {};
  for (const s of SCHUIVEN_V2) {
    const v = ruw?.[s.code];
    if (v === null) b[s.code] = null;
    else if (typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 100) b[s.code] = Math.round(v);
  }
  if (typeof ruw?.onderbouwing === "string") b.onderbouwing = ruw.onderbouwing.trim().slice(0, 1000);
  return b;
}

// ─── Gestructureerde opslag: wat is er veranderd ────────────────────────────

/** Vaste tekstvorm met gesorteerde sleutels: de database geeft objecten in een andere sleutelvolgorde terug. */
function vast(x: unknown): string {
  if (x === undefined || x === null) return "null";
  if (Array.isArray(x)) return `[${x.map(vast).join(",")}]`;
  if (typeof x === "object") return `{${Object.keys(x as object).sort().filter((k) => (x as any)[k] !== undefined).map((k) => `${JSON.stringify(k)}:${vast((x as any)[k])}`).join(",")}}`;
  return JSON.stringify(x);
}
/** Zijn twee antwoorden inhoudelijk gelijk, los van de volgorde van sleutels? */
export function gelijk(a: unknown, b: unknown): boolean { return vast(a) === vast(b); }

/** Velden die geen antwoord zijn. */
const META = new Set(["_versie", "bronnen", "bevestigd"]);

export interface Wijziging { vraag: string; waarde: unknown; bron: Bron; status: "overgenomen" | "bevestigd" | "aangepast" | "ingevuld" | "gewist" }

/**
 * Welke antwoorden zijn veranderd tussen twee versies van de intake. Elke wijziging wordt een
 * regel in intake_antwoorden: zo blijft de historie bewaard en overschrijft een correctie niets.
 */
export function wijzigingen(oud: IntakeV2 | null | undefined, nieuw: IntakeV2): Wijziging[] {
  const uit: Wijziging[] = [];
  const sleutels = new Set([...Object.keys(oud || {}), ...Object.keys(nieuw)]);
  for (const k of Array.from(sleutels)) {
    if (META.has(k)) continue;
    const a = (oud as any)?.[k], b = (nieuw as any)[k];
    if (gelijk(a, b)) continue;
    const bron = (nieuw.bronnen?.[k] as Bron) || "gesprek";
    const bev = nieuw.bevestigd?.[k];
    const wasLeeg = a === undefined || a === null;
    const status: Wijziging["status"] = b === undefined || b === null || b === "" ? "gewist"
      : bev === "aangepast" ? "aangepast" : bev === "klopt" ? "bevestigd" : wasLeeg && bron !== "gesprek" ? "overgenomen" : wasLeeg ? "ingevuld" : "aangepast";
    uit.push({ vraag: k, waarde: b ?? null, bron: status === "aangepast" || status === "ingevuld" ? "gesprek" : bron, status });
  }
  // Een bevestiging zonder dat de waarde verandert, telt ook als gebeurtenis.
  for (const [k, v] of Object.entries(nieuw.bevestigd || {})) {
    if (oud?.bevestigd?.[k] === v || uit.some((w) => w.vraag === k)) continue;
    uit.push({ vraag: k, waarde: (nieuw as any)[k] ?? null, bron: v === "klopt" ? ((nieuw.bronnen?.[k] as Bron) || "gesprek") : "gesprek", status: v === "klopt" ? "bevestigd" : "aangepast" });
  }
  return uit;
}

/** Schoont wat de browser stuurt: alleen een object met _versie 2, begrensd in omvang. */
export function valideerIntakeV2(ruw: unknown): IntakeV2 | null {
  if (!ruw || typeof ruw !== "object" || Array.isArray(ruw)) return null;
  const i = { ...(ruw as Record<string, unknown>), _versie: 2 } as IntakeV2;
  if (JSON.stringify(i).length > 60000) return null;
  for (const k of ["prioriteiten", "keuzefactoren"] as const) if (Array.isArray(i[k]) && (i[k] as string[]).length > MAX_KEUZES) i[k] = (i[k] as string[]).slice(0, MAX_KEUZES);
  if (i.werkprofiel?.kleuren && i.werkprofiel.kleuren.length > 2) i.werkprofiel = { ...i.werkprofiel, kleuren: i.werkprofiel.kleuren.slice(0, 2) };
  for (const k of ["uren", "uren_min", "uren_max", "reistijd_min", "reisafstand_km"] as const) {
    const v = i[k];
    if (v !== undefined && v !== null && !(typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 500)) delete i[k];
  }
  return i;
}

/** Het profiel dat meegaat naar het medewerkersdossier: alles wat planner en begeleider nodig hebben. */
export function medewerkerProfiel(i: IntakeV2, f: FunctieCtx, voornaam: string) {
  return {
    versie: 2 as const,
    werkprofiel: werkprofielKaart(i),
    voorkeuren: werkvoorkeuren(i),
    planner: plannerskaart(i),
    laterInspelen: laterInspelen(i, voornaam),
    inzet: { uren: i.uren ?? null, urenMin: i.uren_min ?? null, urenMax: i.uren_max ?? null, tekst: urenTekst(i), patroon: i.patroon ?? null, startdatum: i.startdatum || null, aankondiging: i.aankondiging ?? null, lastminute: i.lastminute ?? null, bevestigdOp: i.beschikbaarheid_bevestigd_op || null },
    weekpatroon: weekpatroon(i),
    talen: i.talen || [],
    taken: Object.entries(i.taken || {}).filter(([, t]) => t.niveau).map(([naam, t]) => ({ naam, niveau: t.niveau, voorbeeld: t.voorbeeld || null, bron: "volgens kandidaat" })),
    ervaringDuur: i.ervaring_duur || null,
    uitbetaling: i.uitbetaling ?? null,
    extraatje: i.extraatje ?? null,
    contact: { frequentie: i.contact ?? null, kanaal: i.kanaal ?? null },
    functie: modellen(f).map((m) => m.naam).join(" en "),
  };
}

// ─── Aansluiting op de bestaande controles ──────────────────────────────────

/**
 * Begint de bestaande Ref. en doc. check vanuit een intake versie 2. Het ID gaat mee als het
 * gezien is. De referentie gaat alleen mee als de kandidaat toestemming gaf om te bellen.
 * Geen geschikte referentie: de check wordt overgeslagen met die reden erbij (een mens kan
 * dat in de check terugdraaien). Later aanleveren: de referentie blijft open.
 */
export function checkUitIntakeV2(i: IntakeV2, door: string, at: string, bestaand?: Check | null): Check {
  const c: Check = { ...(bestaand || {}) };
  if (c.idGezien === undefined && i.id_gezien === "Gezien") { c.idGezien = true; c.idDoor = door; c.idAt = at; }
  const r = i.referentie;
  if (r && r.toestemming === true && !r.geen && !r.later) {
    if (c.referent === undefined && r.naam?.trim()) c.referent = [r.naam.trim(), r.relatie?.trim()].filter(Boolean).join(", ");
    if (c.telefoon === undefined && r.telefoon?.trim()) c.telefoon = r.telefoon.trim();
  }
  if (r?.geen && !c.overgeslagen && !c.uitkomst) {
    c.overgeslagen = true; c.overslaanReden = "geen geschikte referentie volgens de kandidaat"; c.overslaanDoor = door; c.overslaanAt = at;
  }
  return c;
}

/** Wat er nog open staat voordat iemand ingezet kan worden: voor de kaart Controles. */
export function referentieOpen(i: IntakeV2): string | null {
  const r = i.referentie;
  if (!r) return "Referentie nog niet besproken";
  if (r.geen) return null;
  if (r.later) return "Kandidaat levert de referentie later aan";
  if (r.naam?.trim() && r.toestemming !== true) return "Nog geen toestemming om de referentie te bellen";
  return null;
}

/**
 * Inzetbaar of niet, met de bestaande statussen: de stap van het dossier en de status van de
 * medewerker (employees.status). Een positief gesprek of afgeronde controles maken iemand nog
 * niet inzetbaar: dat is pas zo als de medewerker op actief staat.
 */
export function inzetStatus(stap: string, medewerkerStatus: string | null | undefined): { code: "gestopt" | "nog_niet" | "onboarding" | "inzetbaar" | "niet_meer"; tekst: string } {
  if (stap === "archief") return { code: "gestopt", tekst: "Afgewezen of gearchiveerd" };
  if (medewerkerStatus === "actief") return { code: "inzetbaar", tekst: "Inzetbaar" };
  if (medewerkerStatus === "inactief" || medewerkerStatus === "uitgestroomd") return { code: "niet_meer", tekst: "Niet inzetbaar: medewerker staat op inactief of uitgestroomd" };
  if (stap === "onboarding") return { code: "onboarding", tekst: medewerkerStatus ? "Onboarding loopt, nog niet inzetbaar" : "Controles afgerond, nog niet inzetbaar" };
  return { code: "nog_niet", tekst: "Nog niet inzetbaar" };
}
