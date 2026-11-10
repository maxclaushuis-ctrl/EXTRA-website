/**
 * Vaste testgesprekken voor Job (scripts/job-gesprekstest.ts). Fictieve kandidaten.
 * Elk gesprek: wie het is, wat de kandidaat antwoordt per vraag (in de volgorde waarin
 * Job vraagt, dus het gesprek blijft kloppen ook als Job vragen overslaat), wat er
 * tussendoor gebeurt, en wat er na afloop moet kloppen.
 * De eerdere fouten uit de tests van Max staan erin, plus nieuwe lastige gevallen.
 */
import type { JobContext, JobVelden, Onderwerp } from "../shared/jobRegels";

export interface Verwachting {
  /** Veld moet (gedeeltelijk) overeenkomen. */
  velden?: Partial<Record<keyof JobVelden, RegExp>>;
  /** Veld mag dit nooit bevatten (een vraag of klacht als gegeven). */
  nooit?: { veld: keyof JobVelden; bevat: RegExp }[];
  /** Deze vragen mag Job niet stellen. */
  nietGevraagd?: Onderwerp[];
  /** Deze vragen moet Job wel stellen. */
  welGevraagd?: Onderwerp[];
  maxVragen?: number;
  eindstatus?: string[];
  taal?: "nl" | "en";
  /** Na het kandidaatbericht dat dit bevat, moet het antwoord van Job hieraan voldoen. */
  reactie?: { na: RegExp; moet?: RegExp; nietMoet?: RegExp; geenBericht?: boolean }[];
}

export interface Gesprek {
  naam: string;
  /** Eerdere fout uit een test van Max. */
  eerdereFout?: boolean;
  ctx: JobContext;
  taal: "nl" | "en";
  /** Antwoord per vraag; een lijst wordt op volgorde gebruikt als Job het opnieuw vraagt. */
  antwoorden: Partial<Record<Onderwerp, string | string[]>>;
  /** Een bericht dat de kandidaat stuurt als Job deze vraag stelt (in plaats van het antwoord), of na afloop ("na"). */
  tussendoor?: { bij: Onderwerp | "na"; tekst: string }[];
  verwacht: Verwachting;
}

const nlCtx = (functie: string, extra: Partial<JobContext> = {}): JobContext => ({ voornaam: "Noor", functie, nationalityZone: "NL", hasCv: false, stopV3: true, label: "hotels", ...extra });

/** Standaardantwoorden als een gesprek er zelf geen heeft. */
export const STANDAARD: Record<"nl" | "en", Partial<Record<Onderwerp, string>>> = {
  nl: { diensten: "3 tot 4", werkgebied: "Tot 25 km", werkmoment: "Flexibel", startdatum: "Direct", werkvorm: "Naast mijn studie", cv: "Nee", sterren: "4 sterren", specialisatie: "Ja", restaurant: "À la carte", functievraag: "Vooral bedienen aan tafel", werkautorisatie: "Arbeid vrij toegestaan", geldigheid: "Tot 2028", hotels: "Het NH Collection" },
  en: { diensten: "3 to 4", werkgebied: "Up to 25 km", werkmoment: "Flexible", startdatum: "Right away", werkvorm: "Alongside my studies", cv: "No", sterren: "4 stars", specialisatie: "Yes", restaurant: "À la carte", functievraag: "Mostly serving at tables", werkautorisatie: "Work freely permitted", geldigheid: "Until 2028", hotels: "The NH Collection" },
};

export const GESPREKKEN: Gesprek[] = [
  {
    naam: "Housekeeping, gewoon gesprek", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "Ik heb 2 jaar kamers schoongemaakt bij het Hilton", sterren: "5 sterren" },
    verwacht: { velden: { ervaring: /2 jaar|twee jaar/i, hotels: /hilton/i, diensten: /3-4/ }, nietGevraagd: ["hotels"], maxVragen: 9, taal: "nl" },
  },
  {
    naam: "Meerdere antwoorden in één bericht", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "3 jaar housekeeping in het Marriott, ik kan 3 of 4 diensten per week en wil maximaal 25 km reizen", sterren: "5" },
    verwacht: { velden: { diensten: /3-4/, werkgebied: /25/ }, nietGevraagd: ["diensten", "werkgebied", "hotels"], maxVragen: 7 },
  },
  {
    naam: "Korte antwoorden", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "2 jr hotel", hotels: "nh", sterren: "4", diensten: "3", werkgebied: "25", werkmoment: "maakt niet uit", startdatum: "nu", werkvorm: "studie", cv: "nee" },
    verwacht: { velden: { diensten: /3-4/, werkvorm: /studie/ }, maxVragen: 10 },
  },
  {
    naam: "Tikfouten", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "3 jaa kamer schoonmaak in hotle", hotels: "ibis en novtel", sterren: "3 sterrn", diensten: "drie tot vier dinsten", werkgebied: "tot 35 kilometr" },
    verwacht: { velden: { ervaring: /3|drie/i, diensten: /3-4/, werkgebied: /35/ }, maxVragen: 10 },
  },
  {
    naam: "Antwoord plus loonvraag", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "Ik heb twee jaar ervaring in een hotel, maar wat verdien ik eigenlijk?" },
    verwacht: { velden: { ervaring: /twee jaar|2 jaar/i }, reactie: [{ na: /wat verdien ik/i, moet: /hangt af van de functie|bespreekt een collega/i, nietMoet: /€|euro|\d+[.,]\d{2}/i }] },
  },
  {
    naam: "Eigen vraag tussendoor", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "1 jaar in een hostel", hotels: "Generator hostel" },
    tussendoor: [{ bij: "diensten", tekst: "Waar zit jullie kantoor eigenlijk?" }],
    verwacht: { reactie: [{ na: /kantoor/i, moet: /Herengracht 372/ }], velden: { diensten: /3-4/ }, nooit: [{ veld: "diensten", bevat: /kantoor/i }] },
  },
  {
    naam: "Correctie van een eerder antwoord", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "2 jaar in een hotel", diensten: "5 of meer" },
    tussendoor: [{ bij: "werkmoment", tekst: "Sorry, ik bedoelde 1 tot 2 diensten per week, niet 5" }],
    verwacht: { velden: { diensten: /1-2/ } },
  },
  {
    naam: "Frustratie", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "2 jaar housekeeping" },
    tussendoor: [{ bij: "diensten", tekst: "wat een hoop vragen zeg, schiet nou op" }],
    verwacht: { reactie: [{ na: /schiet nou op/i, nietMoet: /^(top|fantastisch|super)/i }], nooit: [{ veld: "diensten", bevat: /vragen/i }] },
  },
  {
    naam: "Look for job, Begrijp niet, Wat? bij de hotelvraag", eerdereFout: true, ctx: nlCtx("horecamedewerker", { functieNaam: { nl: "F&B", en: "F&B" } }), taal: "nl",
    antwoorden: { ervaring: "Ik heb in de bediening gewerkt", functievraag: "Bedienen aan tafel en achter de bar", hotels: ["Look for job", "Begrijp niet", "Wat?"] },
    verwacht: { nooit: [{ veld: "hotels", bevat: /look for job|begrijp|wat\?/i }], nietGevraagd: ["sterren"] },
  },
  {
    naam: "Bedankjes na afloop", eerdereFout: true, ctx: nlCtx("housekeeping", { hasCv: true }), taal: "nl",
    antwoorden: { ervaring: "3 jaar housekeeping bij het Ibis" },
    tussendoor: [{ bij: "na", tekst: "Thanks" }, { bij: "na", tekst: "Thanks" }],
    verwacht: { reactie: [{ na: /^Thanks$/, nietMoet: /collega bekijkt|Type HUMAN|Typ MENS/i }] },
  },
  {
    naam: "Kok 9 jaar, nooit in een hotel, wel restaurants", eerdereFout: true, ctx: nlCtx("chef", { voornaam: "Max" }), taal: "nl",
    antwoorden: { ervaring: "Ik heb 9 jaar keukenervaring", hotels: "Ik heb voornamelijk gewerkt in restaurants, nog niet in een hotel", functievraag: "Zelfstandig op de warme kant" },
    verwacht: { velden: { ervaring: /9 jaar/i, ervaringNiveau: /ervaren/ }, nietGevraagd: ["sterren"] },
  },
  {
    naam: "Kok met alleen afwaservaring", eerdereFout: true, ctx: nlCtx("chef", { voornaam: "Sem" }), taal: "nl",
    antwoorden: { ervaring: ["Ik ben afwasser geweest", "Nee, nooit zelf gekookt"], hotels: "Nog niet in een hotel", functievraag: "Alleen afwassen" },
    verwacht: { velden: { ervaringNiveau: /geen|starter/ } },
  },
  {
    naam: "Barman (barwerk spreekt voor zich)", eerdereFout: true, ctx: nlCtx("horecamedewerker", { label: "events" }), taal: "nl",
    antwoorden: { ervaring: "Ik heb 3 jaar als barman gewerkt op festivals" },
    verwacht: { nietGevraagd: ["functievraag", "werkautorisatie", "geldigheid"] },
  },
  {
    naam: "Engels vanaf de start", ctx: nlCtx("housekeeping", { nationalityZone: "EU" }), taal: "en",
    antwoorden: { ervaring: "I cleaned hotel rooms for two years at the Hilton", sterren: "5 stars" },
    verwacht: { taal: "en", velden: { hotels: /hilton/i } },
  },
  {
    naam: "Start Engels, kandidaat schrijft Nederlands", ctx: nlCtx("housekeeping", { nationalityZone: "EU" }), taal: "en",
    antwoorden: { ervaring: "Ik heb drie jaar in een hotel kamers schoongemaakt", hotels: "Het Hotel Okura" },
    verwacht: { taal: "nl" },
  },
  {
    naam: "+31 nummer, kandidaat antwoordt Engels", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "I have worked as a room attendant for three years", hotels: "The Conservatorium hotel" },
    verwacht: { taal: "en" },
  },
  {
    naam: "Andere taal (Pools)", ctx: nlCtx("housekeeping", { nationalityZone: "EU" }), taal: "nl",
    antwoorden: { ervaring: ["Pracowałam dwa lata jako pokojówka w hotelu", "I worked two years as a room attendant in a hotel"], hotels: "Hotel Ibis" },
    verwacht: { taal: "en", velden: { ervaring: /two years|2 years|twee jaar|dwa/i } },
  },
  {
    naam: "Vaag antwoord: ik maak al jaren schoon", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: ["Ik maak al jaren schoon", "Vooral kantoren en bij mensen thuis"], hotels: "Nog nooit in een hotel" },
    verwacht: { velden: { ervaring: /kantoor|kantoren|thuis/i }, nietGevraagd: ["sterren"] },
  },
  {
    naam: "Tegenstrijdig: eerst geen ervaring, later wel", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "Geen ervaring eigenlijk" },
    tussendoor: [{ bij: "diensten", tekst: "Oh wacht, ik heb wel een zomer in een hotel kamers gedaan, bij het Ibis" }],
    verwacht: { velden: { ervaring: /ibis|hotel|zomer/i } },
  },
  {
    naam: "Wil een mens spreken", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "Ik wil liever gewoon iemand spreken in plaats van een bot" },
    verwacht: { eindstatus: ["planner"] },
  },
  {
    naam: "Belediging, daarna normaal verder", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "2 jaar housekeeping" },
    tussendoor: [{ bij: "diensten", tekst: "Hou je bek met je vragen, idioot" }],
    verwacht: { reactie: [{ na: /idioot/i, moet: /normale toon/i }], velden: { diensten: /3-4/ } },
  },
  {
    naam: "Ben jij een robot?", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "Eerst even: ben jij een robot?" },
    verwacht: { reactie: [{ na: /robot/i, moet: /AI/ }], nooit: [{ veld: "ervaring", bevat: /robot/i }] },
  },
  {
    naam: "Front office buiten de EU", ctx: nlCtx("frontoffice", { nationalityZone: "NON_EU" }), taal: "nl",
    antwoorden: { ervaring: "2 jaar receptie in een hotel in Rotterdam", hotels: "Hotel New York", werkautorisatie: "Op mijn verblijfsvergunning staat arbeid vrij toegestaan" },
    verwacht: { velden: { werkautorisatie: /vrij/ }, welGevraagd: ["werkautorisatie"] },
  },
  {
    naam: "Onduidelijk werkgebied", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "1 jaar in een hotel", werkgebied: ["ergens in de buurt", "Amsterdam en Amstelveen"] },
    verwacht: { velden: { werkgebied: /amsterdam|amstelveen|km/i } },
  },
  {
    naam: "Klacht is geen gegeven", ctx: nlCtx("horecamedewerker"), taal: "nl",
    antwoorden: { ervaring: "Waarom moet ik dit allemaal invullen, ik heb toch al een formulier gedaan?" },
    verwacht: { nooit: [{ veld: "ervaring", bevat: /formulier|waarom/i }] },
  },
];
