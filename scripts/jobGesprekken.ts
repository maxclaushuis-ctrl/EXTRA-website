/**
 * Vaste testgesprekken voor Job (scripts/job-gesprekstest.ts). Fictieve kandidaten.
 * Elk gesprek: wie het is, wat de kandidaat antwoordt per vraag (in de volgorde waarin
 * Job vraagt, dus het gesprek blijft kloppen ook als Job vragen overslaat), wat er
 * tussendoor gebeurt, en wat er na afloop moet kloppen.
 * De eerdere fouten uit de tests van Max staan erin, plus nieuwe lastige gevallen.
 */
import type { JobContext, JobVelden, Onderwerp } from "../shared/jobRegels";
// De gesprekken draaien ook op de versie van vóór vraagversie 2 (nulmeting): velden die die versie niet kent, negeert hij.

export interface Verwachting {
  /** Veld moet (gedeeltelijk) overeenkomen. Losse sleutels, zodat de gesprekken ook op een oudere versie draaien. */
  velden?: Partial<Record<keyof JobVelden | string, RegExp>>;
  /** Veld mag dit nooit bevatten (een vraag of klacht als gegeven). */
  nooit?: { veld: keyof JobVelden | string; bevat: RegExp }[];
  /** Deze vragen mag Job niet stellen. */
  nietGevraagd?: Onderwerp[];
  /** Deze vragen moet Job wel stellen. */
  welGevraagd?: Onderwerp[];
  maxVragen?: number;
  eindstatus?: string[];
  taal?: "nl" | "en";
  /** Na het kandidaatbericht dat dit bevat, moet het antwoord van Job hieraan voldoen. */
  reactie?: { na: RegExp; moet?: RegExp; nietMoet?: RegExp; geenBericht?: boolean; puntLeeg?: string; puntGevuld?: string }[];
  /** Vraagversie 2: functiepunten die (gedeeltelijk) moeten kloppen, of nooit gezet mogen zijn. */
  punten?: Record<string, RegExp>;
  puntenLeeg?: string[];
  /** Vraagversie 2: deze functiepunten mogen nooit deze waarde krijgen (de verkeerde lezing bij een duidelijke tegenspraak). */
  puntNiet?: Record<string, RegExp>;
  /** Vraagversie 2: deze functiepunten mag Job niet vragen. */
  puntNietGevraagd?: string[];
  /** Vraagversie 2: hooguit zoveel functievragen. */
  maxFunctievragen?: number;
  /** Vraagversie 2: deze functiepunten moet Job wel vragen. */
  puntWelGevraagd?: string[];
  /** Wat de planner ziet (samenvatting en profielvelden) mag dit nooit bevatten. */
  plannerNooit?: RegExp[];
  /** Kijkt een collega mee vóór de uitnodiging (plannerRedenen)? */
  collega?: boolean;
}

export interface Gesprek {
  naam: string;
  /** Eerdere fout uit een test van Max. */
  eerdereFout?: boolean;
  ctx: JobContext;
  taal: "nl" | "en";
  /** Antwoord per vraag; een lijst wordt op volgorde gebruikt als Job het opnieuw vraagt. */
  antwoorden: Partial<Record<Onderwerp, string | string[]>>;
  /**
   * Een bericht dat de kandidaat stuurt als Job deze vraag stelt (in plaats van het antwoord), na afloop ("na"),
   * of als antwoord op de eerste vraag na de opening, welke dat ook is ("eerstvolgende").
   * Wordt een tussenbericht nooit verstuurd, dan faalt het gesprek: dan is de situatie niet getest.
   */
  tussendoor?: { bij: Onderwerp | "na" | "eerstvolgende"; tekst: string; punt?: string }[];
  /**
   * Vaste reeks voor de voor-en-nagesprekken: precies deze kandidaatberichten op volgorde, welke vraag Job ook stelt,
   * tot en met de beurt die we beoordelen. Daarna gaat het gesprek gewoon verder. De runner controleert dat ze
   * letterlijk zo verstuurd zijn; de vergelijking van voor- en nameting controleert dat beide versies ze kregen.
   */
  vast?: string[];
  /** Een fictief cv (zoals de cv-analyse het zou lezen): dan rekent de runner de match uit met dit dossier. */
  cv?: { periodes: unknown[]; certificaten?: string[] };
  /**
   * Alleen zinvol op vraagversie 2 (het gesprek draait om functiepunten). Op de oude versie krijgt het de status
   * "niet uitgevoerd" in plaats van een rij fouten die niets zeggen.
   */
  alleenVersie2?: boolean;
  /** Een van de vijf voor-en-nagesprekken (heeft een vaste reeks). */
  sleutel?: boolean;
  /** Zo vaak draaien (standaard 1, hooguit 5): de belangrijkste situaties meer dan eens. JOB_TEST_HERHAAL=0 zet dit uit. */
  herhaal?: number;
  /** Begin midden in een gesprek: eerdere beurten en de stand op dat moment (bijvoorbeeld een gemist antwoord). */
  voorgeschiedenis?: { kandidaat: string; job: string }[];
  startVelden?: Record<string, unknown>;
  startOnderwerp?: Onderwerp;
  /** Gesprekken met dezelfde groep worden in het verslag naast elkaar gezet (bijvoorbeeld dezelfde inhoud, andere spelling). */
  groep?: string;
  /** Vraagversie 2: antwoord per functiepunt (de functievraag gaat over steeds een ander punt). */
  puntAntwoorden?: Record<string, string | string[]>;
  verwacht: Verwachting;
}

const nlCtx = (functie: string, extra: Partial<JobContext> = {}): JobContext => ({ voornaam: "Noor", functie, nationalityZone: "NL", hasCv: false, stopV3: true, label: "hotels", ...extra });

/** Standaardantwoorden als een gesprek er zelf geen heeft. */
export const STANDAARD: Record<"nl" | "en", Partial<Record<Onderwerp, string>>> = {
  nl: { diensten: "3 tot 4", werkgebied: "Tot 25 km", werkmoment: "Flexibel", startdatum: "Direct", werkvorm: "Naast mijn studie", cv: "Nee", sterren: "4 sterren", specialisatie: "Ja", restaurant: "À la carte", functievraag: "Vooral bedienen aan tafel", werkautorisatie: "Arbeid vrij toegestaan", geldigheid: "Tot 2028", hotels: "Het NH Collection" },
  en: { diensten: "3 to 4", werkgebied: "Up to 25 km", werkmoment: "Flexible", startdatum: "Right away", werkvorm: "Alongside my studies", cv: "No", sterren: "4 stars", specialisatie: "Yes", restaurant: "À la carte", functievraag: "Mostly serving at tables", werkautorisatie: "Work freely permitted", geldigheid: "Until 2028", hotels: "The NH Collection" },
};

/** Vraagversie 2 (afspraken Max 25 nov 2026): een nieuw gesprek met de functievragen per functie. */
const v2 = (functieCode: string, functie: string, label: "hotels" | "events" | "logistiek", extra: Record<string, unknown> = {}): JobContext =>
  nlCtx(functie, { functieCode, label, vraagversie2: true, begrijpen: true, ...extra } as Partial<JobContext>);

/** De gesprekken voor vraagversie 2: de situaties uit de opdracht van 25 november, per functie. */
// Gesprekken zonder sleutel draaien alleen op vraagversie 2; op de oude versie: "niet uitgevoerd".
export const GESPREKKEN_V2: Gesprek[] = ([
  {
    naam: "V2 housekeeping: alles in één bericht", ctx: v2("housekeeping", "housekeeping", "hotels", { functieNaam: { nl: "housekeeping", en: "housekeeping" } }), taal: "nl",
    antwoorden: { ervaring: "Ik heb acht maanden zelfstandig kamers gedaan bij het Marriott. Ik kan vanaf maandag, liefst twee avonden per week" },
    puntAntwoorden: { kamersPerDienst: "Zo'n vijftien", sterren: "5 sterren" },
    verwacht: { punten: { soort: /kamers/ }, velden: { startdatumTekst: /maandag/i, diensten: /1-2/, werkmomentTekst: /avond/i }, nooit: [{ veld: "startdatum", bevat: /direct/ }], nietGevraagd: ["diensten", "startdatum", "werkmoment", "hotels"], puntNietGevraagd: ["soort"], maxFunctievragen: 3 },
  },
  {
    naam: "V2 housekeeping: alleen in een hotel gewerkt", ctx: v2("housekeeping", "housekeeping", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Ik heb twee jaar in een hotel gewerkt" },
    puntAntwoorden: { soort: "Vooral de kamers", kamersPerDienst: "Een stuk of veertien", sterren: "4 sterren" },
    verwacht: { punten: { soort: /kamers/ }, reactie: [{ na: /twee jaar in een hotel/i, moet: /kamers/i }], nietGevraagd: ["hotels"] },
  },
  {
    naam: "V2 housekeeping: wil het leren", sleutel: true, herhaal: 2, ctx: v2("housekeeping", "housekeeping", "hotels"), taal: "nl",
    vast: ["Ik wil housekeeping leren", "Ja, een zomer in een hotel in Zandvoort"],
    antwoorden: { ervaring: "Ik wil housekeeping leren" },
    puntAntwoorden: { eerderKamers: "Een paar keer, in een vakantiepark", soort: "Alleen de huisjes", kamersPerDienst: "Zes of zo" },
    verwacht: { reactie: [{ na: /housekeeping leren/i, moet: /al eens hotelkamers schoongemaakt/i }, { na: /zomer in een hotel in Zandvoort/i, nietMoet: /algemene ruimtes of allebei/i }], nooit: [{ veld: "ervaringNiveau", bevat: /geen/ }, { veld: "ervaring", bevat: /^geen|nog geen ervaring|geen ervaring/i }], plannerNooit: [/nog geen ervaring/i, /geen ervaring/i, /onbekend/i], puntWelGevraagd: ["eerderKamers"] },
  },
  {
    naam: "V2 front office: tussenvraag over loon", sleutel: true, herhaal: 2, ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    vast: ["Drie jaar aan de receptie. Wat verdien ik eigenlijk?"],
    antwoorden: { ervaring: "Drie jaar aan de receptie. Wat verdien ik eigenlijk?" },
    puntAntwoorden: { taken: "Inchecken, uitchecken en reserveringen", taal: "Engels en Nederlands allebei goed", systeem: "Opera" },
    verwacht: { reactie: [{ na: /wat verdien ik/i, moet: /hangt af van de functie en de opdracht/i, nietMoet: /€|euro|per uur/i }], punten: { engels: /ja/, nederlands: /ja/ } },
  },
  {
    naam: "V2 front office: appt in het Nederlands, Engels voor gasten", ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Ik heb twee jaar aan de receptie gewerkt in een hotel in Amsterdam, vooral inchecken en reserveringen" },
    puntAntwoorden: { taal: "Gasten help ik in het Engels, mijn Nederlands is nog niet goed genoeg voor gasten", systeem: "Mews", sterren: "4 sterren" },
    verwacht: { punten: { engels: /ja/, nederlands: /nee/ }, taal: "nl", puntNietGevraagd: ["taken"] },
  },
  {
    naam: "V2 keuken: correctie, collega stond op de warme kant", ctx: v2("keuken", "chef", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Twee jaar in een restaurantkeuken, op de warme kant" },
    tussendoor: [{ bij: "eerstvolgende", tekst: "Nee, ik hielp in de keuken, mijn collega stond zelfstandig op de warme kant" }],
    puntAntwoorden: { taken: "Groenten snijden en de mise-en-place", zelfstandig: "Niks echt alleen", richting: "Ja" },
    verwacht: { punten: { zelfstandig: /nee/ }, nooit: [{ veld: "ervaring", bevat: /^(?!.*collega).*warme kant/i }] },
  },
  {
    naam: "V2 bar: taken al in de opening", ctx: v2("bar", "horecamedewerker", "events", { functieNaam: { nl: "de bar", en: "the bar" } }), taal: "nl",
    antwoorden: { ervaring: "Drie jaar achter de bar, ik tapte bier en maakte cocktails" },
    verwacht: { punten: { taken: /bier|cocktail/i }, puntNietGevraagd: ["taken"] },
  },
  {
    // Job vroeg het al eens, het antwoord is gemist (zo begint het gesprek); de kandidaat zegt het.
    naam: "V2 dat heb ik toch net gezegd", sleutel: true, herhaal: 2, ctx: v2("housekeeping", "housekeeping", "hotels"), taal: "nl",
    antwoorden: {},
    voorgeschiedenis: [
      { kandidaat: "Twee jaar in een hotel in Haarlem", job: "Maakte je daar de hotelkamers schoon, de algemene ruimtes of allebei?" },
      { kandidaat: "Vooral de kamers, soms de lobby", job: "Deed je vooral kamers of de algemene ruimtes?" },
    ],
    startVelden: { ervaring: "twee jaar in een hotel in Haarlem", ervaringNiveau: "ervaren", puntGevraagd: "soort", functievragen: 1, puntPogingen: { soort: 1 } },
    startOnderwerp: "functievraag",
    vast: ["Dit heb ik toch net gezegd?"],
    puntAntwoorden: { kamersPerDienst: "Een stuk of vijftien", sterren: "4 sterren" },
    verwacht: { punten: { soort: /allebei|kamers/ }, reactie: [{ na: /toch net gezegd/i, moet: /sorry|gelijk|klopt/i, nietMoet: /kamers schoon, de algemene ruimtes of allebei/i, puntGevuld: "soort" }] },
  },
  {
    naam: "V2 front office: Opera en een loonvraag in één bericht", herhaal: 2, ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Drie jaar aan de receptie, inchecken en reserveringen" },
    puntAntwoorden: { taal: "Engels en Nederlands", systeem: "Wij gebruikten Opera. Wat verdien ik eigenlijk?", sterren: "4 sterren" },
    verwacht: { punten: { systeem: /opera/i }, reactie: [{ na: /Opera\. Wat verdien/i, moet: /hangt af van de functie en de opdracht/i, nietMoet: /€|euro|per uur/i, puntGevuld: "systeem" }] },
  },
  {
    naam: "V2 front office: alleen een loonvraag bij de systeemvraag", ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Drie jaar aan de receptie, inchecken en reserveringen" },
    tussendoor: [{ bij: "functievraag", punt: "systeem", tekst: "Wat verdien ik eigenlijk?" }],
    puntAntwoorden: { taal: "Engels en Nederlands", systeem: "Opera", sterren: "4 sterren" },
    verwacht: { punten: { systeem: /^opera$/i }, reactie: [{ na: /^Wat verdien ik eigenlijk\?$/i, moet: /hangt af van de functie en de opdracht/i, puntLeeg: "systeem" }] },
  },
  {
    // Voor-en-nagesprek: de loonvraag als derde bericht, met in beide versies dezelfde twee berichten ervoor.
    naam: "V2 loonvraag als derde bericht", sleutel: true, herhaal: 2, ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Drie jaar aan de receptie, inchecken en reserveringen" },
    vast: ["Drie jaar aan de receptie, inchecken en reserveringen", "Engels en Nederlands", "Ik ben benieuwd naar het uurloon"],
    puntAntwoorden: { taal: "Engels en Nederlands", systeem: "Opera", sterren: "4 sterren" },
    verwacht: { reactie: [{ na: /benieuwd naar het uurloon/i, moet: /hangt af van de functie en de opdracht|uurloon/i, puntLeeg: "systeem" }], nooit: [{ veld: "functievraag", bevat: /uurloon/i }] },
  },
  {
    naam: "V2 events: bediening aangevinkt, voorkeur dinerloper", sleutel: true, herhaal: 2, ctx: v2("bediening", "horecamedewerker", "events", { meerFuncties: true, functies: [{ code: "bediening", nl: "Bediening", en: "Waiting staff" }, { code: "dinerloper", nl: "Dinerloper", en: "Food runner" }] }), taal: "nl",
    antwoorden: { ervaring: "Twee jaar op bruiloften en galadiners" },
    vast: ["Twee jaar op bruiloften en galadiners", "Eigenlijk vooral dinerloper"],
    puntAntwoorden: { voorkeur: "Eigenlijk vooral dinerloper", drieBorden: "Ja, bij de galadiners altijd met drie borden", etiquette: "Van rechts uitserveren en per tafel tegelijk, de gastheer als laatste" },
    verwacht: { punten: { voorkeur: /dinerloper/, drieBorden: /ja/, etiquette: /ja/ }, puntWelGevraagd: ["drieBorden"], collega: false },
  },
  {
    naam: "V2 communicatie: front office, Engels met gasten", cv: { periodes: [{ functie: "Receptionist", werkgever: "Hotel De Fictieve Gracht", soort: "zelfde", kerntaken: [0, 1], begin: "2024-10", einde: "heden", bron: "cv" }] }, groep: "communicatie front office", ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Ik heb twee jaar aan de receptie gewerkt en help gasten dagelijks in het Engels bij het inchecken" },
    puntAntwoorden: { taken: "Inchecken, uitchecken en reserveringen aanpassen", taal: "Ook Nederlands", systeem: "Opera", sterren: "4 sterren" },
    verwacht: { punten: { engels: /ja/ } },
  },
  {
    naam: "V2 communicatie: front office, zelfde met andere spelling", cv: { periodes: [{ functie: "Receptionist", werkgever: "Hotel De Fictieve Gracht", soort: "zelfde", kerntaken: [0, 1], begin: "2024-10", einde: "heden", bron: "cv" }] }, groep: "communicatie front office", ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "ik heb 2 jaar aan de receptie gewerkt en help gaste dagelijk in het engels bij t inchecke" },
    puntAntwoorden: { taken: "inchecke uitchecke en reserveringe aanpasse", taal: "ook nederlands", systeem: "opera", sterren: "4 sterren" },
    verwacht: { punten: { engels: /ja/ } },
  },
  {
    naam: "V2 communicatie: supervisor geeft zelf briefings", cv: { periodes: [{ functie: "Barmedewerker evenementen", werkgever: "Fictief Events", soort: "zelfde", kerntaken: [0, 1], begin: "2022-04", einde: "heden", bron: "cv" }] }, groep: "communicatie supervisor", ctx: v2("supervisor", "horecamedewerker", "events"), taal: "nl",
    antwoorden: { ervaring: "Vier jaar bij evenementen, de laatste twee jaar geef ik zelf de briefings aan het barteam" },
    puntAntwoorden: { leiding: "Ja", verantwoordelijk: "De briefing, de indeling van de bar en het aanspreekpunt voor de klant" },
    verwacht: { punten: { leiding: /ja/ } },
  },
  {
    naam: "V2 communicatie: supervisor, zelfde met andere spelling", cv: { periodes: [{ functie: "Barmedewerker evenementen", werkgever: "Fictief Events", soort: "zelfde", kerntaken: [0, 1], begin: "2022-04", einde: "heden", bron: "cv" }] }, groep: "communicatie supervisor", ctx: v2("supervisor", "horecamedewerker", "events"), taal: "nl",
    antwoorden: { ervaring: "4 jr bij events, laatste 2 jaar geef ik zelf de brefings aan t barteam" },
    puntAntwoorden: { leiding: "ja", verantwoordelijk: "de brefing, indeling van de bar en aanspreekpunt voor de klant" },
    verwacht: { punten: { leiding: /ja/ } },
  },
  {
    naam: "V2 afwas: starter zonder cv", ctx: v2("afwas", "afwas", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Nog nooit gedaan", cv: "Nee, ik heb er geen" },
    puntAntwoorden: { past: "Ja" },
    verwacht: { punten: { past: /ja/ }, eindstatus: ["wacht_cv"] },
  },
  {
    naam: "V2 dinerloper: bruiloften met dienbladen", ctx: v2("dinerloper", "horecamedewerker", "events", { functieNaam: { nl: "dinerloper", en: "food runner" } }), taal: "nl",
    antwoorden: { ervaring: "Ik heb twee zomers op bruiloften gewerkt, vooral met dienbladen" },
    puntAntwoorden: { drieBorden: "Nee, dat deden de vaste obers" },
    verwacht: { reactie: [{ na: /bruiloften/i, moet: /drie borden/i, nietMoet: /wat deed je tijdens die bruiloften/i }], punten: { drieBorden: /nee/ }, eindstatus: ["planner", "wacht_cv"] },
  },
  {
    naam: "V2 dinerloper: galadiners met drie borden", ctx: v2("dinerloper", "horecamedewerker", "events"), taal: "nl",
    antwoorden: { ervaring: "Drie jaar bij een cateraar op galadiners" },
    puntAntwoorden: { drieBorden: "Ja, altijd met drie borden aan tafel", etiquette: "Van rechts uitserveren, dames eerst en per tafel tegelijk" },
    verwacht: { punten: { drieBorden: /ja/, etiquette: /ja/ } },
  },
  {
    naam: "V2 runner: werk al beschreven", ctx: v2("runner", "horecamedewerker", "events"), taal: "nl",
    antwoorden: { ervaring: "Ik heb een jaar op cateringevents hapjes en drankjes rondgebracht en glazen opgehaald" },
    verwacht: { punten: { runnerwerk: /hapjes|drankjes|glazen/i }, puntenLeeg: ["past"], puntNietGevraagd: ["past"], reactie: [{ na: /hapjes en drankjes/i, nietMoet: /als runner loop je/i }] },
  },
  {
    naam: "V2 host: beurzen in het Engels", ctx: v2("host", "horecamedewerker", "events"), taal: "nl",
    antwoorden: { ervaring: "Twee jaar op beurzen bezoekers ontvangen en badges gescand, vaak in het Engels" },
    verwacht: { punten: { engels: /ja/ }, puntNietGevraagd: ["engels"] },
  },
  {
    naam: "V2 heftruck: allebei, certificaat alleen heftruck", ctx: v2("heftruck", "logistiek", "logistiek"), taal: "nl",
    antwoorden: { ervaring: "Vier jaar. Ik reed op allebei, maar mijn certificaat is alleen voor de heftruck" },
    verwacht: { punten: { gereden: /allebei/, certHeftruck: /opgegeven/, certReachtruck: /geen/ }, puntNietGevraagd: ["gereden", "certificaat"] },
  },
  {
    naam: "V2 supervisor: twaalf man is geen leiding", ctx: v2("supervisor", "horecamedewerker", "events"), taal: "nl",
    antwoorden: { ervaring: "Vijf jaar op festivals, we stonden met twaalf man" },
    puntAntwoorden: { leiding: "Een enkele keer", verantwoordelijk: "De briefing en de indeling van de bar" },
    verwacht: { punten: { leiding: /enkele_keer|ja/ }, reactie: [{ na: /twaalf man/i, moet: /zelf|aangestuurd|leiding/i }] },
  },
  {
    naam: "V2 voorraad: pakbon gecontroleerd", ctx: v2("voorraad", "logistiek", "logistiek"), taal: "nl",
    antwoorden: { ervaring: "Twee jaar in een magazijn. Ik controleerde of de aantallen op de pakbon klopten" },
    puntAntwoorden: { soort: "Vooral kwaliteit" },
    verwacht: { punten: { controle: /pakbon|aantallen/i }, puntNietGevraagd: ["controle"] },
  },
  {
    naam: "V2 events: meer functies gekozen", ctx: v2("bediening", "horecamedewerker", "events", { meerFuncties: true, functies: [{ code: "bediening", nl: "Bediening", en: "Waiting staff" }, { code: "bar", nl: "Bar", en: "Bar" }, { code: "runner", nl: "Runner", en: "Runner" }] }), taal: "nl",
    antwoorden: { ervaring: "Twee zomers op festivals" },
    puntAntwoorden: { voorkeur: "Bar", taken: "Bier tappen en wijn schenken" },
    verwacht: { punten: { voorkeur: /bar/ } },
  },
  // Besluiten Max 25 november 2026
  {
    naam: "V2 besluit front office: alleen Nederlands", ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Drie jaar aan de receptie van een hotel in Utrecht, inchecken en reserveringen" },
    puntAntwoorden: { taal: "Alleen Nederlands, gasten in het Engels helpen lukt me niet", systeem: "Opera", sterren: "3 of minder" },
    verwacht: { punten: { engels: /nee/, nederlands: /ja/ }, collega: true },
  },
  {
    naam: "V2 besluit front office: Engels onbekend, gerichte doorvraag", ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Twee jaar receptie, vooral inchecken en de telefoon" },
    puntAntwoorden: { taal: "Nederlands", engelsCheck: "Ja, dat lukt prima", systeem: "Mews" },
    verwacht: { punten: { engels: /ja/ }, puntWelGevraagd: ["engelsCheck"], collega: false, reactie: [{ na: /^Nederlands$/, moet: /Engels/i }] },
  },
  {
    naam: "V2 besluit supervisor: geen team, wel veel events", ctx: v2("supervisor", "horecamedewerker", "events"), taal: "nl",
    antwoorden: { ervaring: "Zes jaar op festivals en congressen, vooral achter de bar en bij de opbouw" },
    puntAntwoorden: { leiding: "Nog niet", regelde: "De briefing van de nieuwe runners en dat de bar op tijd bevoorraad was" },
    verwacht: { punten: { leiding: /nee/, regelde: /briefing|bevoorraad/i }, puntWelGevraagd: ["regelde"], collega: false },
  },
  {
    naam: "V2 besluit heftruck: zelf gereden, certificaat verlopen", ctx: v2("heftruck", "logistiek", "logistiek"), taal: "nl",
    antwoorden: { ervaring: "Drie jaar op de reachtruck in een distributiecentrum" },
    puntAntwoorden: { gereden: "Reachtruck", certificaat: "Ja, verlopen" },
    verwacht: { punten: { gereden: /reachtruck/, certReachtruck: /verlopen/ }, collega: false, eindstatus: ["wacht_cv"] },
  },
  {
    naam: "V2 Engels: front office in het Engels", ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "en",
    antwoorden: { ervaring: "Two years at a hotel reception in Rotterdam, check-ins and reservations" },
    puntAntwoorden: { taal: "English only for guests", systeem: "Opera", sterren: "4 stars" },
    verwacht: { punten: { engels: /ja/, nederlands: /nee/ }, taal: "en" },
  },
  // Praktijksituaties waarin een gesprek makkelijk stroef wordt (opdracht Max 26 november).
  {
    naam: "V2 housekeeping: een zomer in een hotel gewerkt (nog onbekend wat)", ctx: v2("housekeeping", "housekeeping", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Ik heb een zomer in een hotel gewerkt" },
    puntAntwoorden: { soort: "Vooral kamers", kamersPerDienst: "Een stuk of twaalf", sterren: "4 sterren" },
    verwacht: { reactie: [{ na: /zomer in een hotel gewerkt/i, moet: /hotelkamers|algemene ruimtes/i }], puntWelGevraagd: ["soort"] },
  },
  {
    naam: "V2 housekeeping in eenvoudig Engels met tikfouten: wil het leren", herhaal: 2, ctx: v2("housekeeping", "housekeeping", "hotels", { nationalityZone: "EU" }), taal: "en",
    antwoorden: { ervaring: "i want lern housekeeping" },
    puntAntwoorden: { eerderKamers: "yess 1 summer in zandvoort hotel", kamersPerDienst: "maybe 10", sterren: "4 stars" },
    verwacht: { taal: "en", punten: { eerderKamers: /ja/ }, reactie: [{ na: /yess 1 summer/i, nietMoet: /public areas or both/i }], nooit: [{ veld: "ervaringNiveau", bevat: /geen/ }] },
  },
  {
    naam: "V2 front office: drie antwoorden in één bericht", herhaal: 2, ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "2 jaar receptie in een hotel, inchecken en reserveringen, ik help gasten in het engels en nederlands en we werkte met opera" },
    puntAntwoorden: { sterren: "4 sterren" },
    verwacht: { punten: { engels: /ja/, nederlands: /ja/, systeem: /opera/i }, puntNietGevraagd: ["taken", "taal", "systeem"] },
  },
  {
    naam: "V2 front office: corrigeert de taal later", herhaal: 2, ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Twee jaar aan de receptie, inchecken en reserveringen" },
    tussendoor: [{ bij: "functievraag", punt: "systeem", tekst: "Sorry, ik bedoelde: in het Nederlands lukt het nog niet. We gebruikten Opera." }],
    puntAntwoorden: { taal: "Engels en Nederlands", systeem: "Opera", sterren: "4 sterren" },
    verwacht: { punten: { engels: /ja/ }, puntNiet: { nederlands: /ja/ }, plannerNooit: [/Nederlands voor gastcontact: ja/], reactie: [{ na: /ik bedoelde/i, nietMoet: /In welke talen/i }] },
  },
  {
    naam: "V2 front office in eenvoudig Engels met tikfouten", herhaal: 2, ctx: v2("frontoffice", "frontoffice", "hotels", { nationalityZone: "EU" }), taal: "en",
    antwoorden: { ervaring: "i work 2 year at hotel recepton, check in and reservaton" },
    tussendoor: [{ bij: "functievraag", punt: "systeem", tekst: "how much i earn per hour?" }],
    puntAntwoorden: { taal: "english good, dutch not so good", systeem: "opera", sterren: "4 stars" },
    verwacht: { taal: "en", punten: { engels: /ja/ }, puntNiet: { nederlands: /ja/ }, reactie: [{ na: /how much i earn/i, moet: /depends|hourly|wage|pay/i, puntLeeg: "systeem" }] },
  },
  {
    naam: "V2 heftruck: geldig heftruckcertificaat, verlopen reachtruckcertificaat", herhaal: 2, ctx: v2("heftruck", "logistiek", "logistiek"), taal: "nl",
    antwoorden: { ervaring: "Vier jaar in een distributiecentrum, ik reed op allebei" },
    puntAntwoorden: { gereden: "Allebei", certificaat: "Mijn heftruckcertificaat is geldig. Mijn reachtruckcertificaat is verlopen." },
    verwacht: { punten: { gereden: /allebei/, certHeftruck: /opgegeven/, certReachtruck: /verlopen/ }, collega: false },
  },
  // Tegenspraak bij de punten die bepalen of een collega meekijkt (opdracht Max 25 november, derde ronde).
  // Leest het model het goed, dan staat het juiste gegeven er; vergist het zich, dan een open punt met de letterlijke zin.
  {
    naam: "V2 tegenspraak: Engels wel, Nederlands nog niet", ctx: v2("frontoffice", "frontoffice", "hotels"), taal: "nl",
    antwoorden: { ervaring: "Twee jaar aan de receptie, inchecken en reserveringen" },
    puntAntwoorden: { taal: "Ik help gasten in het Engels. In het Nederlands lukt dat nog niet.", systeem: "Opera", sterren: "4 sterren" },
    verwacht: { punten: { engels: /^ja$/ }, puntNiet: { nederlands: /ja/ }, plannerNooit: [/Nederlands voor gastcontact: ja/] },
  },
  {
    naam: "V2 tegenspraak: de collega serveerde met drie borden", ctx: v2("dinerloper", "horecamedewerker", "events", { functieNaam: { nl: "dinerloper", en: "food runner" } }), taal: "nl",
    antwoorden: { ervaring: "Twee zomers bij een cateraar op bruiloften" },
    puntAntwoorden: { drieBorden: "Ik bracht de borden tot aan de zaal. Mijn collega serveerde ze met drie tegelijk uit.", etiquette: "Van rechts uitserveren" },
    verwacht: { puntNiet: { drieBorden: /ja/ }, plannerNooit: [/Drie borden aan tafel: ja/] },
  },
  {
    naam: "V2 tegenspraak: reachtruck met verlopen certificaat", ctx: v2("heftruck", "logistiek", "logistiek"), taal: "nl",
    antwoorden: { ervaring: "Ik reed op de reachtruck. Mijn certificaat is verlopen." },
    puntAntwoorden: { gereden: "Reachtruck", certificaat: "Ja, verlopen" },
    verwacht: { puntNiet: { gereden: /heftruck|allebei|geen/, certReachtruck: /opgegeven|geen/, certHeftruck: /opgegeven|verlopen/ }, plannerNooit: [/Zelf gereden: (heftruck|allebei|geen)/, /Certificaat reachtruck: (opgegeven|geen)/] },
  },
] as Gesprek[]).map((g) => ({ alleenVersie2: !g.sleutel, ...g }));

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
    antwoorden: { ervaring: ["Eerst even: ben jij een robot?", "Oké. Ik heb 2 jaar housekeeping gedaan in een hotel"] },
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
    antwoorden: { ervaring: ["Waarom moet ik dit allemaal invullen, ik heb toch al een formulier gedaan?", "Oké, ik heb 1 jaar in de bediening gewerkt"] },
    // De klacht krijgt een antwoord (waarom deze vragen) en wordt geen gegeven.
    verwacht: { nooit: [{ veld: "ervaring", bevat: /formulier|waarom/i }], reactie: [{ na: /formulier gedaan/i, moet: /welk werk bij je past|collega/i }] },
  },
  {
    // De test van Max (11 nov, 12:00): drie keer "Bij welke hotels heb je gewerkt?" na een nee.
    naam: "Keuken: niet in hotels gewerkt", eerdereFout: true, ctx: nlCtx("chef"), taal: "nl",
    antwoorden: {
      ervaring: "Tijdens mijn studie op de hotelschool heb ik een aantal maanden praktijkles gehad in de keuken hier heb ik de basis geleerd en daarna heb ik in totaal drie jaar werkervaring. 1.5 jaar bij republiek Bloemendaal op het strand en daarna 1.5 jaar in de keuken bij bar barolo",
      hotels: ["Ik heb niet in hotels gewerkt maar gewoon praktijkles op school van de hotelschool", "Ik heb niet gewerkt bij hotels", "Nee"],
    },
    verwacht: { nietGevraagd: ["sterren"], velden: { ervaringNiveau: /ervaren/ }, reactie: [{ na: /niet in hotels gewerkt/i, nietMoet: /welke hotels|which hotels/i }] },
  },
  // Test van Max, 18 november 2026: "2 jaar" werd niet als antwoord gezien, de vraag kwam terug en na "Zeg ik net" ging Job door zonder de ervaring.
  {
    naam: "Max 18 nov: Hi, dan 2 jaar (bediening en bar)", eerdereFout: true, ctx: nlCtx("horecamedewerker", { voornaam: "Max", functieNaam: { nl: "bediening en bar", en: "waiting and bar" } }), taal: "nl",
    antwoorden: { ervaring: ["Hi", "2 jaar", "Zeg ik net", "Zeg ik net"] },
    verwacht: {
      velden: { ervaring: /2 jaar|twee jaar/i },
      nooit: [{ veld: "ervaring", bevat: /zeg ik net/i }],
      reactie: [
        { na: /^2 jaar$/i, nietMoet: /hoeveel jaar ervaring|ik vraag het even anders|hoe lang ongeveer|al eens in de horeca gewerkt/i },
        { na: /^Hi$/, nietMoet: /bespreken we bij de kennismaking/i },
      ],
    },
  },
  {
    naam: "Kort antwoord op de ervaringsvraag: 2 jaar", eerdereFout: true, ctx: nlCtx("horecamedewerker", { functieNaam: { nl: "bediening en bar", en: "waiting and bar" } }), taal: "nl",
    antwoorden: { ervaring: ["2 jaar", "Zeg ik net"] },
    verwacht: { velden: { ervaring: /2 jaar|twee jaar/i }, reactie: [{ na: /^2 jaar$/i, nietMoet: /hoeveel jaar ervaring|ik vraag het even anders/i }] },
  },
  {
    naam: "Kort antwoord in het Engels: 2 years", ctx: nlCtx("horecamedewerker", { functieNaam: { nl: "bediening en bar", en: "waiting and bar" } }), taal: "en",
    antwoorden: { ervaring: ["2 years", "I just told you"] },
    verwacht: { velden: { ervaring: /2 years|two years/i }, nooit: [{ veld: "ervaring", bevat: /just told/i }] },
  },
  // Job 5 (19 november 2026): lastige kandidaten uit de mock-up die Max goedkeurde.
  {
    naam: "Job 5: ben jij een echt persoon?", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "2 jaar kamers in een hotel", hotels: "Ibis", sterren: "3" },
    tussendoor: [{ bij: "diensten", tekst: "ben jij eigenlijk een echt persoon?" }],
    verwacht: { reactie: [{ na: /echt persoon/i, moet: /\bAI\b/i, nietMoet: /ik ben een (mens|persoon)|echt persoon ben/i }], velden: { diensten: /3-4/ } },
  },
  {
    naam: "Job 5: bel me gewoon", ctx: nlCtx("housekeeping"), taal: "nl",
    antwoorden: { ervaring: "1 jaar in een hotel", hotels: "NH", sterren: "4" },
    tussendoor: [{ bij: "werkgebied", tekst: "waarom moet ik dit allemaal typen, bel me gewoon" }],
    verwacht: { eindstatus: ["planner"], reactie: [{ na: /bel me gewoon/i, moet: /collega|bel/i, nietMoet: /vandaag nog|morgen|binnen een uur/i }] },
  },
  {
    naam: "Job 5: ergernis over het aantal vragen", ctx: nlCtx("chef", { voornaam: "Sem" }), taal: "nl",
    antwoorden: { ervaring: "5 jaar kok in restaurants", hotels: "Nee, nooit in een hotel", restaurant: "À la carte" },
    tussendoor: [{ bij: "werkgebied", tekst: "hoeveel vragen nog man, dit duurt lang" }],
    verwacht: { reactie: [{ na: /hoeveel vragen nog/i, moet: /\?/ }], nietGevraagd: ["sterren"] },
  },
  {
    naam: "Job 5: off topic tussendoor", ctx: nlCtx("horecamedewerker", { label: "events" }), taal: "nl",
    antwoorden: { ervaring: "3 jaar barwerk op festivals" },
    tussendoor: [{ bij: "werkmoment", tekst: "lekker weer vandaag he" }],
    verwacht: { velden: { ervaring: /3 jaar|drie jaar/i }, reactie: [{ na: /lekker weer/i, moet: /\?/ }] },
  },
  {
    naam: "Job 5: groet en korte antwoorden", eerdereFout: true, ctx: nlCtx("horecamedewerker", { voornaam: "Sam", functieNaam: { nl: "bediening en bar", en: "waiting and bar" } }), taal: "nl",
    antwoorden: { ervaring: ["hoi", "2 jr", "café in de pijp achter de bar"], hotels: "nog niet in een hotel", diensten: "3", werkgebied: "25", werkmoment: "maakt niet uit", startdatum: "nu", werkvorm: "studie", cv: "nee" },
    verwacht: { velden: { ervaring: /2/, diensten: /3-4/ }, reactie: [{ na: /^2 jr$/i, nietMoet: /ik vraag het even anders|hoeveel jaar ervaring/i }], maxVragen: 11 },
  },
];
