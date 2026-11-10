/**
 * Job, de AI-recruiter van EXTRA: de regels van het gesprek.
 *
 * Dit bestand is puur: geen database, geen AI, geen netwerk. Het bepaalt
 * welke vraag Job stelt, wanneer hij klaar is, wanneer een planner erbij moet
 * en wat hij zegt. De AI leest alleen de antwoorden van de kandidaat uit
 * (server/job/jobAi.ts); wat Job vraagt en wanneer, staat hier vast. Zo kan
 * Job nooit iets beloven, afwijzen of verzinnen dat niet in deze regels staat.
 *
 * Bron: de mock-ups C, C2, C3, C4 en D op het canvas en het bouwplan
 * "Bouwplan Job en testomgeving" (6 november 2026).
 *
 * Harde regels uit het ontwerp:
 *  - Job wijst nooit af. Twijfel of een harde eis gaat naar de planner, met reden.
 *  - Nationaliteit bepaalt alleen óf Job naar werkautorisatie vraagt, nooit de uitkomst.
 *  - Job vraagt nooit om een foto of nummer van een identiteitsdocument.
 *  - Job vraagt alleen wat nog ontbreekt.
 *  - Alleen Nederlands en Engels. Spreekt iemand geen van beide, dan stopt Job
 *    vriendelijk en wijst de planner af met die reden.
 *  - Job plant nooit direct in: is alles in orde en het cv binnen, dan
 *    controleert eerst een collega het cv. Na Accepteren in Kandidaten
 *    kiest de kandidaat zelf een moment.
 */

export type JobTaal = "nl" | "en";

export type JobStatus =
  | "bezig"        // Job stelt vragen
  | "wacht_cv"     // alles gevraagd, cv ontbreekt nog
  | "cv_controle"  // alles binnen, een collega controleert eerst het cv
  | "plannen"      // cv goedgekeurd, kandidaat mag een moment kiezen
  | "gepland"      // kennismaking staat in de agenda
  | "planner"      // een collega moet kijken (twijfel, harde eis, MENS)
  | "geen_reactie" // twee herinneringen zonder antwoord
  | "gestopt";     // STOP of afgemeld

export type Onderwerp =
  | "ervaring"
  | "functievraag"
  | "specialisatie"
  | "werkautorisatie"
  | "geldigheid"
  | "diensten"
  | "werkgebied"
  | "hotels"       // hotelfuncties: bij welke hotels (akkoord Max 9 nov 2026)
  | "sterren"      // hotelfuncties: hoeveel sterren had het beste hotel
  | "restaurant"   // keuken en bediening via Hotels, alleen restaurantervaring: wat voor restaurant (akkoord Max 10 nov 2026)
  | "werkmoment"
  | "startdatum"
  | "werkvorm"     // naast studie, naast ander werk of hoofdbaan (akkoord Max 9 nov 2026)
  | "talen"        // oud: vervangen door werkmoment en startdatum (akkoord Max 9 nov 2026)
  | "cv";

export type Werkautorisatie = "vrij" | "twv" | "onbekend" | "anders";
export type Diensten = "1-2" | "3-4" | "5+";
export type Werkmoment = "doordeweeks" | "avond_weekend" | "flexibel";
/** Sterren van het beste hotel: "3" betekent 3 of minder. */
export type Sterren = "3" | "4" | "5";
export type Startdatum = "direct" | "twee_weken" | "later";
export type Werkvorm = "studie" | "ander_werk" | "hoofdbaan";

/** Wat Job uit het gesprek verzamelt. Alles optioneel: Job vraagt wat ontbreekt. */
export interface JobVelden {
  ervaring?: string;
  ervaringNiveau?: "geen" | "starter" | "ervaren";
  functievraag?: string;
  specialisatieHint?: boolean;
  specialisatie?: "ja" | "nee";
  werkautorisatie?: Werkautorisatie;
  geldigTot?: string;
  diensten?: Diensten;
  werkgebied?: string;
  vervoer?: string;
  /** Hotelfuncties: bij welke hotels de kandidaat werkte (tekst). */
  hotels?: string;
  /** Hotelfuncties: sterren van het beste hotel. */
  sterren?: Sterren;
  /** Hotelfuncties: de kandidaat werkte nog niet in een hotel; dan geen vraag naar sterren. */
  geenHotel?: boolean;
  /** Keuken en bediening via Hotels: de ervaring lag in restaurants; dan vraagt Job wat voor restaurant. */
  restaurantWerk?: boolean;
  restaurantSoort?: string;
  /** Hotelfuncties: verduidelijkende vraag van de AI als de ervaring niet duidelijk bij de functie past. */
  verduidelijking?: string;
  /** Wanneer iemand kan werken (knoppen in het gesprek). */
  werkmoment?: Werkmoment;
  /** Wanneer iemand kan beginnen (knoppen in het gesprek). */
  startdatum?: Startdatum;
  /** Naast studie, naast ander werk of als hoofdbaan (knoppen in het gesprek). */
  werkvorm?: Werkvorm;
  talen?: string;
  /** false = spreekt geen Nederlands en geen Engels: harde no-go voor de planner. */
  nlOfEn?: boolean;
  cvParaat?: "ja" | "nee";
  zoekt?: string;
  /**
   * Job 3.0 fase 1, stuurvelden (geen antwoorden van de kandidaat):
   * herinneringenUit = na STOP en terugkomen gaan automatische herinneringen niet vanzelf weer aan;
   * bestandVraag = pad van een bestand dat tijdens de vragen binnenkwam, Job vroeg of het het cv is.
   */
  herinneringenUit?: boolean;
  bestandVraag?: string;
  /**
   * Job 3.0 fase 4, cv-vragen (stuurvelden):
   * cvAfronding = het slotbericht wacht tot het cv is gelezen ("planner" of "cv_controle");
   * cvVraag = de cv-vraag die nu openstaat; cvVragen = gestelde cv-vragen met het antwoord (hoogstens twee).
   */
  cvAfronding?: "planner" | "cv_controle";
  /** Fase 2: hoe vaak Job per veld doorvroeg. */
  doorvragen?: Partial<Record<Onderwerp, number>>;
  cvVraag?: { soort: string; tekst: string };
  cvVragen?: { soort: string; vraag: string; antwoord?: string }[];
}

/** Wat Job vooraf weet uit de aanmelding. */
export interface JobContext {
  voornaam: string;
  functie: string;
  nationalityZone: "NL" | "EU" | "NON_EU" | null;
  hasCv: boolean;
  /** De functie zoals de kandidaat hem koos op het formulier per label (bijv. "front office"). */
  functieNaam?: { nl: string; en: string };
  /** Het label waarlangs iemand binnenkwam (hotels, events of logistiek). */
  label?: "hotels" | "events" | "logistiek";
  /** Alleen als er een kennismaking gepland staat, in de taal van het gesprek. */
  afspraak?: { dag: string; tijd: string; wie: string };
  /** Job 3.0 fase 1: STOP pauzeert, terugkomen alleen bij een duidelijke wens (schakelaar JOB_V3_STOP). */
  stopV3?: boolean;
  /** Meer dan één functie aangevinkt (events): het welkom noemt dan geen functie. */
  meerFuncties?: boolean;
  /** Job 3.0 fase 4: na het cv eerst lezen, dan hoogstens twee cv-vragen (schakelaar JOB_V3_MATCH). */
  cvVragen?: boolean;
  /** Job 3.0 fase 2: begrijpen, doorvragen en vervallen vragen (schakelaar JOB_V3_BEGRIJPEN). */
  begrijpen?: boolean;
}

export interface JobState {
  taal: JobTaal;
  status: JobStatus;
  velden: JobVelden;
  laatsteOnderwerp: Onderwerp | null;
  twijfels: string[];
  herinneringen: number;
  herinneringAt: string | null;
  laatsteInkomendAt: string | null;
  laatsteActiviteitAt: string;
}

export interface Uitgaand {
  tekst: string;
  /** Snelle antwoordknoppen (web) of genummerde keuzes (WhatsApp). */
  keuzes?: string[];
  /** Web: toon de cv-uploadknop. WhatsApp: de link staat in de tekst. */
  cvUpload?: boolean;
  /** Web: toon de momentenkiezer. */
  planning?: boolean;
  /** Korte reactie van Job; wordt samengevoegd met het bericht erna (zie verwerk). */
  reactie?: boolean;
}

export type Actie =
  | { soort: "planner"; reden: string }
  | { soort: "nogo"; reden: string }
  | { soort: "cv_mail" }
  | { soort: "profiel"; velden: JobVelden }
  | { soort: "verzetten" }
  | { soort: "bevestigd" }
  /** Na STOP wil de kandidaat duidelijk verder: WhatsApp-toestemming weer aan. */
  | { soort: "hervat" }
  /** Het bestand dat tijdens de vragen binnenkwam is volgens de kandidaat zijn cv. */
  | { soort: "cv_bevestigd"; bijlage: string }
  /** Antwoord op een cv-vraag: het cv opnieuw lezen met de aanvulling. */
  | { soort: "cv_aanvulling" };

export interface Resultaat {
  state: JobState;
  berichten: Uitgaand[];
  acties: Actie[];
}

// ─── Functies ────────────────────────────────────────────────────────────────

const FUNCTIE_LABEL: Record<string, { nl: string; en: string }> = {
  horecamedewerker: { nl: "bediening en bar", en: "service and bar" },
  housekeeping: { nl: "housekeeping", en: "housekeeping" },
  chef: { nl: "de keuken", en: "the kitchen" },
  afwas: { nl: "de afwas", en: "dishwashing" },
  frontoffice: { nl: "front office", en: "front office" },
  logistiek: { nl: "logistiek", en: "logistics" },
};

export function functieLabel(functie: string, taal: JobTaal): string {
  return FUNCTIE_LABEL[functie]?.[taal] ?? functie;
}

/** Functies waarvoor ervaring nodig is; zonder ervaring beslist de planner (C2). */
export const FUNCTIES_MET_ERVARING = ["chef", "frontoffice"];

/** Vervolgvraag voor bediening en bar als de ervaring bij festivals of evenementen lag. */
const FUNCTIEVRAAG_FESTIVAL = {
  nl: "Wat deed je daar vooral: achter de bar, drankjes uitgeven of iets anders? En werkte je ook met een kassa of pin?",
  en: "What did you mostly do there: working the bar, serving drinks or something else? And did you also handle a till or card payments?",
};
const FESTIVAL = /festival|evenement|event|concert|stadion|poppodium|beurs/i;

const FUNCTIEVRAAG: Record<string, { nl: string; en: string }> = {
  horecamedewerker: {
    nl: "Werkte je vooral in de bediening, achter de bar of allebei? En serveerde je ook diners uit?",
    en: "Did you mostly work in service, behind the bar or both? And did you also serve dinners?",
  },
  housekeeping: {
    nl: "Hoeveel kamers maakte je ongeveer schoon per dienst?",
    en: "About how many rooms did you usually clean per shift?",
  },
  chef: {
    nl: "Kookte je zelfstandig op een post, of vooral als hulp? Deed je ook de mise-en-place?",
    en: "Did you cook independently on a station, or mostly as an assistant? Did you also do the mise en place?",
  },
  afwas: {
    nl: "Heb je al eens in een spoelkeuken gewerkt? Het is staand en fysiek werk; past dat bij je?",
    en: "Have you worked in a dish room before? It is standing, physical work; does that suit you?",
  },
  frontoffice: {
    nl: "Met welk reserveringssysteem heb je gewerkt, bijvoorbeeld Opera?",
    en: "Which reservation system have you worked with, for example Opera?",
  },
  logistiek: {
    nl: "Wat voor werk deed je vooral: orderpicken, inpakken of met de heftruck?",
    en: "What kind of work did you mostly do: order picking, packing or forklift?",
  },
};

/**
 * Het werk in de eerste vraag ("wat is je ervaring met ... tot nu toe?").
 * Ook variabele {{3}} van het startsjabloon job_start_v2: Meta wil geen
 * variabele aan het eind, dus de vraag zelf staat vast in het sjabloon.
 */
const ERVARING_WERK: Record<string, { nl: string; en: string }> = {
  housekeeping: { nl: "in de housekeeping", en: "in housekeeping" },
  chef: { nl: "in een keuken", en: "in a kitchen" },
  afwas: { nl: "in een keuken", en: "in a kitchen" },
  frontoffice: { nl: "op een front office", en: "at a front office" },
  logistiek: { nl: "in een magazijn of de logistiek", en: "in a warehouse or logistics" },
  horecamedewerker: { nl: "in de horeca", en: "in hospitality" },
};

/** Hotelfuncties krijgen na de ervaring de vragen over hotels en sterren in plaats van de functievraag. */
export function isHotelPad(ctx: JobContext): boolean {
  return ctx.label === "hotels" || ctx.functie === "housekeeping" || ctx.functie === "frontoffice";
}
export function ervaringWerk(functie: string, taal: JobTaal): string {
  return (ERVARING_WERK[functie] || ERVARING_WERK.horecamedewerker)[taal];
}

// ─── Teksten ─────────────────────────────────────────────────────────────────

const T = {
  nl: {
    welkom: (v: string, f: string) => `Hi ${v},\n\nIk ben Job, de AI-recruiter van EXTRA. Leuk dat je je hebt aangemeld voor ${f}! Ik stel je een paar korte vragen.`,
    welkomAlgemeen: (v: string) => `Hi ${v},\n\nIk ben Job, de AI-recruiter van EXTRA. Leuk dat je interesse hebt om bij EXTRA te werken! Ik stel je een paar korte vragen.`,
    disclaimer: "Je praat met Job, een AI. Typ MENS voor een collega of ENGLISH om te wisselen.",
    ervaring: (functie: string) => `Vertel eens: hoeveel jaar ervaring heb je ${ervaringWerk(functie, "nl")} tot nu toe?`,
    hotels: "Bij welke hotels heb je gewerkt?",
    hotelsOfRestaurants: "Waar heb je gewerkt? Noem gerust de restaurants of hotels.",
    restaurant: "Wat voor restaurant was dat?",
    restaurantKeuzes: ["Fine dining", "À la carte", "Lunch of café"],
    sterren: "Hoeveel sterren had het beste hotel waar je werkte?",
    sterrenKeuzes: ["3 of minder", "4 sterren", "5 sterren"],
    specialisatie: "Dan zet ik evenementen en banqueting erbij als specialisatie. Goed?",
    specialisatieKeuzes: ["Ja, graag", "Liever niet"],
    werkautorisatie: "Nog één praktische vraag over werken in Nederland. Wat staat er op je verblijfsdocument bij arbeid?",
    werkautorisatieKeuzes: ["Arbeid vrij toegestaan", "TWV vereist", "Weet ik niet"],
    geldigheid: "Dank je. Weet je tot wanneer het geldig is?",
    diensten: "Hoeveel diensten per week zou je willen werken?",
    dienstenKeuzes: ["1 tot 2", "3 tot 4", "5 of meer"],
    werkgebied: "In welke regio wil je werken? Kies hoe ver je wilt reizen vanaf je huis, of typ een regio.",
    werkgebiedKeuzes: ["Tot 25 km", "Tot 35 km", "Tot 50 km"],
    talen: "Welke talen spreek je?",
    werkmoment: "Wanneer kun je werken?",
    werkmomentKeuzes: ["Doordeweeks", "Avond en weekend", "Wanneer nodig"],
    startdatum: "Wanneer kun je beginnen?",
    startdatumKeuzes: ["Direct", "Binnen 2 weken", "Later"],
    werkvorm: "Doe je dit naast je studie, naast ander werk of als hoofdbaan?",
    werkvormKeuzes: ["Naast mijn studie", "Naast ander werk", "Als hoofdbaan"],
    cv: "Laatste vraag: heb je je cv paraat?",
    cvKeuzes: ["Ja", "Nee"],
    cvUpload: "Top! Upload je cv hier, dat kan als pdf of foto.",
    cvUploadWa: (link: string) => `Top! Stuur je cv hier in WhatsApp als pdf of foto, of upload het via ${link}`,
    cvLater: "Geen probleem! Ik heb je een mail gestuurd met een knop om je cv te uploaden. Zodra het binnen is, kun je meteen een kennismaking plannen.",
    cvOntvangen: "Fantastisch, je cv is binnen!",
    cvBekijken: "Ik kijk er even naar.",
    cvVraagEerste: (vraag: string) => `Ik heb je cv bekeken, dank je. Een vraag daarover: ${vraag}`,
    cvVraagDank: "Dank je, dat helpt.",
    screeningKlaar: "De eerste screening is klaar.",
    cvControle: (v: string) => `Dank je, ${v}! Een collega bekijkt nu je cv. Is alles in orde, dan krijg je van mij een bericht om zelf een moment te kiezen voor je kennismaking op kantoor.`,
    cvControleWacht: "Een collega bekijkt je cv, je hoort snel van ons. Liever iemand spreken? Typ MENS.",
    uitgenodigd: (v: string) => `Goed nieuws, ${v}! Je cv is bekeken. Kies zelf een moment voor je kennismaking op ons kantoor aan de Herengracht 372 in Amsterdam. Neem je paspoort of ID-kaart mee.`,
    plannen: "Kies zelf een moment voor je kennismaking op ons kantoor aan de Herengracht 372 in Amsterdam.",
    plannenWa: (link: string) => `Kies zelf een moment voor je kennismaking op ons kantoor aan de Herengracht 372: ${link}`,
    idMee: "Neem je paspoort of ID-kaart mee, dan regelen we alles in één keer.",
    plannenNogmaals: "Kies hieronder een moment dat je uitkomt. Komt er geen moment uit? Typ MENS, dan helpt een collega.",
    planHerinnering: (v: string) => `Hoi ${v}, je kunt nu zelf een moment kiezen voor je kennismaking op kantoor. Kies hieronder een moment dat je uitkomt.`,
    planner: (v: string) => `Dankjewel, ${v}! Een collega van EXTRA bekijkt je aanmelding en laat je zo snel mogelijk weten hoe het verder gaat.`,
    werkautorisatieCollega: "Geen zorgen. Een collega van EXTRA kijkt met je mee en laat het je weten.",
    geenErvaringOk: "Geen probleem, veel collega's zijn zo begonnen.",
    documentMee: "Fijn. Neem het document mee naar het gesprek, dan kijkt een collega het samen met je na.",
    mens: "Prima, ik geef het door aan een collega van EXTRA. Die neemt zo snel mogelijk contact met je op.",
    wisselNl: "Prima, we gaan verder in het Nederlands.",
    gepland: (dag: string, tijd: string, wie: string) => `Gepland! ${dag} om ${tijd} op de Herengracht 372, met ${wie}. Neem je paspoort of ID-kaart mee.`,
    alGepland: (dag: string, tijd: string) => `Je kennismaking staat op ${dag} om ${tijd} op de Herengracht 372. Wil je een ander moment? Typ VERZETTEN. Een vraag voor een collega? Typ MENS.`,
    verzetten: "Geen probleem. Kies hieronder een nieuw moment; je oude afspraak vervalt zodra je een nieuwe kiest.",
    verzettenWa: (link: string) => `Geen probleem. Kies een nieuw moment via ${link}. Je oude afspraak vervalt zodra je een nieuwe kiest.`,
    wachtPlanner: "Een collega van EXTRA kijkt naar je aanmelding en neemt contact met je op. Wil je iets doorgeven? Typ het gerust, dan leest een collega mee.",
    gestopt: "Je krijgt geen berichten meer van ons over deze aanmelding. Wil je later toch verder, stuur dan gerust een bericht.",
    welkomTerug: "Fijn dat je er weer bent. Wil je verder met je aanmelding?",
    welkomTerugKeuzes: ["Ja, verder", "Nee"],
    welkomTerugKort: "Fijn dat je er weer bent!",
    blijftGestopt: "Helemaal goed, je hoort niets meer van ons over deze aanmelding.",
    spraak: "Spraakberichten kan ik helaas niet beluisteren. Wil je je antwoord even typen?",
    bestandVraag: "Dank je, ik heb je bestand ontvangen. Is dit je cv?",
    bestandKeuzes: ["Ja, mijn cv", "Nee"],
    cvBinnenKort: "Top, je cv is binnen.",
    herinnering1: (v: string) => `Hoi ${v}, je was bijna klaar. Nog een paar korte vragen, dan kun je meteen een kennismaking plannen. Zullen we verder?`,
    herinnering2: (v: string) => `Hoi ${v}, je aanmelding bij EXTRA staat nog open. Wil je verder? Stuur gerust een bericht, ik ga verder waar we gebleven waren.`,
    herinneringKeuzes: ["Verder", "Liever bellen"],
    afspraakHerinnering: (v: string, tijd: string, wie: string) => `Hoi ${v}, morgen om ${tijd} is je kennismaking met ${wie} bij EXTRA, Herengracht 372. Lukt het?`,
    afspraakKeuzes: ["Ik kom", "Verzetten"],
    ikKom: "Fijn, tot morgen!",
    nogo: "Thanks for your interest in EXTRA! For our work you need to speak Dutch or English. A colleague will look at your application and let you know.",
    bellen: "Prima, een collega van EXTRA belt je zo snel mogelijk.",
  },
  en: {
    welkom: (v: string, f: string) => `Hi ${v},\n\nI'm Job, the AI recruiter at EXTRA. Great that you signed up for ${f}! I have a few quick questions for you.`,
    welkomAlgemeen: (v: string) => `Hi ${v},\n\nI'm Job, the AI recruiter at EXTRA. Great that you're interested in working at EXTRA! I have a few quick questions for you.`,
    disclaimer: "You're chatting with Job, an AI. Type HUMAN for a colleague or NEDERLANDS to switch.",
    ervaring: (functie: string) => `Tell me: how many years of experience do you have ${ervaringWerk(functie, "en")} so far?`,
    hotels: "Which hotels have you worked at?",
    hotelsOfRestaurants: "Where did you work? Feel free to name the restaurants or hotels.",
    restaurant: "What kind of restaurant was it?",
    restaurantKeuzes: ["Fine dining", "À la carte", "Lunch or café"],
    sterren: "How many stars did the best hotel you worked at have?",
    sterrenKeuzes: ["3 or fewer", "4 stars", "5 stars"],
    specialisatie: "Shall I add events and banqueting as a specialisation?",
    specialisatieKeuzes: ["Yes, please", "Rather not"],
    werkautorisatie: "One practical question about working in the Netherlands. What does your residence document say about work?",
    werkautorisatieKeuzes: ["Work freely permitted", "Work permit (TWV) required", "I don't know"],
    geldigheid: "Thanks. Do you know until when it is valid?",
    diensten: "How many shifts per week would you like to work?",
    dienstenKeuzes: ["1 to 2", "3 to 4", "5 or more"],
    werkgebied: "Which area would you like to work in? Choose how far you'd travel from home, or type an area.",
    werkgebiedKeuzes: ["Up to 25 km", "Up to 35 km", "Up to 50 km"],
    talen: "Which languages do you speak?",
    werkmoment: "When can you work?",
    werkmomentKeuzes: ["Weekdays", "Evenings and weekends", "Whenever needed"],
    startdatum: "When can you start?",
    startdatumKeuzes: ["Right away", "Within 2 weeks", "Later"],
    werkvorm: "Would you do this alongside your studies, alongside another job or as your main job?",
    werkvormKeuzes: ["Alongside studies", "Alongside other job", "As my main job"],
    cv: "Last question: do you have your CV ready?",
    cvKeuzes: ["Yes", "No"],
    cvUpload: "Great! Upload your CV here, a PDF or a photo is fine.",
    cvUploadWa: (link: string) => `Great! Send your CV here in WhatsApp as a PDF or photo, or upload it via ${link}`,
    cvLater: "No problem! I've sent you an email with a button to upload your CV. As soon as it's in, you can book a short meeting at our office.",
    cvOntvangen: "Fantastic, your CV is in!",
    cvBekijken: "Let me take a quick look.",
    cvVraagEerste: (vraag: string) => `I've looked at your CV, thanks. A question about it: ${vraag}`,
    cvVraagDank: "Thanks, that helps.",
    screeningKlaar: "The first screening is done.",
    cvControle: (v: string) => `Thanks, ${v}! A colleague is now looking at your CV. If everything is fine, I'll send you a message to choose a moment for a short meeting at our office.`,
    cvControleWacht: "A colleague is looking at your CV, you'll hear from us soon. Rather talk to someone? Type HUMAN.",
    uitgenodigd: (v: string) => `Good news, ${v}! We've looked at your CV. Choose a moment for a short meeting at our office at Herengracht 372 in Amsterdam. Please bring your passport or ID card.`,
    plannen: "Choose a moment for a short meeting at our office at Herengracht 372 in Amsterdam.",
    plannenWa: (link: string) => `Choose a moment for a short meeting at our office at Herengracht 372: ${link}`,
    idMee: "Bring your passport or ID card, then we can arrange everything in one go.",
    plannenNogmaals: "Choose a moment below that suits you. None works? Type HUMAN and a colleague will help.",
    planHerinnering: (v: string) => `Hi ${v}, you can now choose a time for your meeting at our office. Pick a moment below that suits you.`,
    planner: (v: string) => `Thank you, ${v}! A colleague from EXTRA will look at your application and let you know as soon as possible.`,
    werkautorisatieCollega: "No worries. A colleague from EXTRA will check it with you and let you know.",
    geenErvaringOk: "No problem, many colleagues started that way.",
    documentMee: "Great. Bring the document to the meeting, and a colleague will check it with you.",
    mens: "Sure, I'll pass this on to a colleague from EXTRA. They'll get in touch as soon as possible.",
    wisselNl: "Sure, we'll continue in English.",
    gepland: (dag: string, tijd: string, wie: string) => `Booked! ${dag} at ${tijd} at Herengracht 372, with ${wie}. Bring your passport or ID card.`,
    alGepland: (dag: string, tijd: string) => `Your meeting is on ${dag} at ${tijd} at Herengracht 372. Want another moment? Type RESCHEDULE. A question for a colleague? Type HUMAN.`,
    verzetten: "No problem. Choose a new moment below; your old appointment is cancelled as soon as you pick a new one.",
    verzettenWa: (link: string) => `No problem. Choose a new moment via ${link}. Your old appointment is cancelled as soon as you pick a new one.`,
    wachtPlanner: "A colleague from EXTRA is looking at your application and will get in touch. Anything to add? Just type it and a colleague will read along.",
    gestopt: "You won't get any more messages from us about this application. Want to continue later after all? Just send a message.",
    welkomTerug: "Good to have you back. Do you want to continue with your application?",
    welkomTerugKeuzes: ["Yes, continue", "No"],
    welkomTerugKort: "Good to have you back!",
    blijftGestopt: "All good, you won't hear from us again about this application.",
    spraak: "I can't listen to voice messages, unfortunately. Could you type your answer?",
    bestandVraag: "Thanks, I've received your file. Is this your CV?",
    bestandKeuzes: ["Yes, my CV", "No"],
    cvBinnenKort: "Great, your CV is in.",
    herinnering1: (v: string) => `Hi ${v}, you were almost done. A few more quick questions, then you can book a meeting right away. Shall we continue?`,
    herinnering2: (v: string) => `Hi ${v}, your application at EXTRA is still open. Want to continue? Just send a message and I'll pick up where we left off.`,
    herinneringKeuzes: ["Continue", "Call me instead"],
    afspraakHerinnering: (v: string, tijd: string, wie: string) => `Hi ${v}, tomorrow at ${tijd} you have your meeting with ${wie} at EXTRA, Herengracht 372. Does that still work?`,
    afspraakKeuzes: ["I'll be there", "Reschedule"],
    ikKom: "Great, see you tomorrow!",
    nogo: "Thanks for your interest in EXTRA! For our work you need to speak Dutch or English. A colleague will look at your application and let you know.",
    bellen: "Sure, a colleague from EXTRA will call you as soon as possible.",
  },
};

export function teksten(taal: JobTaal) {
  return T[taal];
}

// ─── Volgorde van de vragen (C4) ─────────────────────────────────────────────

/** De volgende vraag die Job moet stellen, of null als alles bekend is. */
export function volgendeOnderwerp(v: JobVelden, ctx: JobContext): Onderwerp | null {
  if (!v.ervaring) return "ervaring";
  if (isHotelPad(ctx)) {
    // Hotels: alleen een verduidelijking als de AI die nodig vond, dan hotels en sterren.
    if (v.ervaringNiveau !== "geen") {
      if (v.verduidelijking && v.functievraag === undefined) return "functievraag";
      if (!v.hotels) return "hotels";
      if (!v.sterren && !v.geenHotel) return "sterren";
      if (v.geenHotel && v.restaurantWerk && !v.restaurantSoort) return "restaurant";
    }
  } else if (v.functievraag === undefined && v.ervaringNiveau !== "geen" && FUNCTIEVRAAG[ctx.functie]) return "functievraag";
  if (ctx.functie === "horecamedewerker" && v.specialisatieHint && !v.specialisatie) return "specialisatie";
  if (ctx.nationalityZone === "NON_EU" && !v.werkautorisatie) return "werkautorisatie";
  if (ctx.nationalityZone === "NON_EU" && v.werkautorisatie === "vrij" && v.geldigTot === undefined) return "geldigheid";
  if (!v.diensten) return "diensten";
  if (!v.werkgebied) return "werkgebied";
  if (!v.werkmoment) return "werkmoment";
  if (!v.startdatum) return "startdatum";
  if (!v.werkvorm) return "werkvorm";
  if (!ctx.hasCv && !v.cvParaat) return "cv";
  return null;
}

export function vraag(onderwerp: Onderwerp, taal: JobTaal, ctx: JobContext, velden?: JobVelden): Uitgaand {
  const t = T[taal];
  switch (onderwerp) {
    case "ervaring": return { tekst: t.ervaring(ctx.functie) };
    case "functievraag":
      if (velden?.verduidelijking) return { tekst: velden.verduidelijking };
      if (ctx.functie === "horecamedewerker" && FESTIVAL.test(velden?.ervaring || "")) return { tekst: FUNCTIEVRAAG_FESTIVAL[taal] };
      return { tekst: FUNCTIEVRAAG[ctx.functie]?.[taal] ?? t.ervaring(ctx.functie) };
    case "specialisatie": return { tekst: t.specialisatie, keuzes: t.specialisatieKeuzes };
    case "werkautorisatie": return { tekst: t.werkautorisatie, keuzes: t.werkautorisatieKeuzes };
    case "geldigheid": return { tekst: t.geldigheid };
    case "diensten": return { tekst: t.diensten, keuzes: t.dienstenKeuzes };
    case "werkgebied": return { tekst: t.werkgebied, keuzes: t.werkgebiedKeuzes };
    case "hotels": return { tekst: restaurantGenoemd(velden?.ervaring || "") ? t.hotelsOfRestaurants : t.hotels };
    case "restaurant": return { tekst: t.restaurant, keuzes: t.restaurantKeuzes };
    case "sterren": return { tekst: t.sterren, keuzes: t.sterrenKeuzes };
    case "werkmoment": return { tekst: t.werkmoment, keuzes: t.werkmomentKeuzes };
    case "startdatum": return { tekst: t.startdatum, keuzes: t.startdatumKeuzes };
    case "werkvorm": return { tekst: t.werkvorm, keuzes: t.werkvormKeuzes };
    case "talen": return { tekst: t.talen };
    case "cv": return { tekst: t.cv, keuzes: t.cvKeuzes };
  }
}

/** Welke onderwerpen nog open staan (voor "Nog 3 vragen open" in Kandidaten). Het cv telt apart. */
export function openOnderwerpen(v: JobVelden, ctx: JobContext): { vragen: number; cv: boolean } {
  const kopie: JobVelden = { ...v };
  let vragen = 0;
  let cv = false;
  for (let i = 0; i < 12; i++) {
    const o = volgendeOnderwerp(kopie, ctx);
    if (!o) break;
    if (o === "cv") { cv = true; break; }
    vragen++;
    if (o === "ervaring") kopie.ervaring = "x";
    else if (o === "functievraag") kopie.functievraag = "x";
    else if (o === "specialisatie") kopie.specialisatie = "nee";
    else if (o === "werkautorisatie") kopie.werkautorisatie = "vrij" as any;
    else if (o === "geldigheid") kopie.geldigTot = "x";
    else if (o === "diensten") kopie.diensten = "1-2";
    else if (o === "werkgebied") kopie.werkgebied = "x";
    else if (o === "hotels") kopie.hotels = "x";
    else if (o === "sterren") kopie.sterren = "4";
    else if (o === "restaurant") kopie.restaurantSoort = "x";
    else if (o === "werkmoment") kopie.werkmoment = "flexibel";
    else if (o === "startdatum") kopie.startdatum = "direct";
    else if (o === "werkvorm") kopie.werkvorm = "hoofdbaan";
    else if (o === "talen") kopie.talen = "x";
  }
  return { vragen, cv };
}

// ─── Wanneer moet een planner kijken? (C2, C4) ───────────────────────────────

/** Redenen waarom Job niet zelf mag inplannen. Leeg = alle criteria in orde. */
export function plannerRedenen(v: JobVelden, ctx: JobContext, twijfels: string[]): string[] {
  const r: string[] = [];
  if (ctx.nationalityZone === "NON_EU" && v.werkautorisatie && v.werkautorisatie !== "vrij") {
    const omschrijving = { twv: "TWV vereist", onbekend: "weet het niet", anders: "ander antwoord" }[v.werkautorisatie];
    r.push(`Werkautorisatie: ${omschrijving}. Controleren vóór het uitnodigen.`);
  }
  if (FUNCTIES_MET_ERVARING.includes(ctx.functie) && v.ervaringNiveau === "geen") {
    r.push(`Functie ${ctx.functie} vraagt ervaring en die ontbreekt.`);
  }
  for (const t of twijfels) if (!r.includes(t)) r.push(t);
  return r;
}

// ─── Commando's ──────────────────────────────────────────────────────────────

export type Commando = "mens" | "english" | "nederlands" | "verzetten" | "bellen" | "ikkom" | "verder";

/**
 * Herkent de vaste woorden uit het ontwerp. Bij de vraag naar talen is
 * "Nederlands" of "Engels" een antwoord, geen verzoek om te wisselen.
 */
export function herkenCommando(tekst: string | null | undefined, onderwerp: Onderwerp | null = null): Commando | null {
  const s = (tekst || "").trim().toLowerCase().replace(/[.!?]+$/, "");
  if (!s) return null;
  if (onderwerp === "talen" && ["english", "engels", "nederlands", "dutch"].includes(s)) return null;
  if (["mens", "human", "collega", "medewerker", "een mens", "a human"].includes(s)) return "mens";
  if (["english", "engels", "in english", "english please"].includes(s)) return "english";
  if (["nederlands", "dutch", "in het nederlands"].includes(s)) return "nederlands";
  if (["verzetten", "reschedule", "ander moment", "another moment"].includes(s)) return "verzetten";
  if (["liever bellen", "bellen", "call me", "call me instead", "bel mij", "bel me"].includes(s)) return "bellen";
  if (["ik kom", "i'll be there", "ill be there", "ik kom!", "yes i'll be there"].includes(s)) return "ikkom";
  if (["verder", "continue", "ga verder", "doorgaan", "go on"].includes(s)) return "verder";
  return null;
}

// ─── Het gesprek ─────────────────────────────────────────────────────────────

export function nieuweState(taal: JobTaal, nu: Date): JobState {
  return {
    taal,
    status: "bezig",
    velden: {},
    laatsteOnderwerp: null,
    twijfels: [],
    herinneringen: 0,
    herinneringAt: null,
    laatsteInkomendAt: null,
    laatsteActiviteitAt: nu.toISOString(),
  };
}

/** Het eerste bericht van Job, plus de eerste vraag. */
export function start(ctx: JobContext, taal: JobTaal, nu: Date): Resultaat {
  const state = nieuweState(taal, nu);
  const t = T[taal];
  const onderwerp = volgendeOnderwerp(state.velden, ctx)!;
  state.laatsteOnderwerp = onderwerp;
  return {
    state,
    berichten: [
      { tekst: ctx.meerFuncties ? t.welkomAlgemeen(ctx.voornaam) : t.welkom(ctx.voornaam, ctx.functieNaam?.[taal] ?? functieLabel(ctx.functie, taal)) },
      vraag(onderwerp, taal, ctx),
    ],
    acties: [],
  };
}

/** Wat de AI (of de reserve-lezer) uit één antwoord haalde. */
export interface Lezing {
  velden: JobVelden;
  /** Taal waarin de kandidaat schreef. */
  taal: JobTaal | "anders" | null;
  /** Job twijfelt aan dit antwoord: reden voor de planner. */
  twijfel: string | null;
  /** Korte bevestiging in de taal van het gesprek, hooguit één zin. Mag leeg. */
  ack: string;
  /** Alleen na de ervaringsvraag: een vervolgvraag die past bij waar de kandidaat werkte. */
  vervolgvraag?: string;
  /**
   * Fase 2, begrijpen: een vervolgvraag die logisch aansluit op het antwoord, om een invulveld
   * goed te krijgen (bijvoorbeeld bij een kok die alleen afwaservaring noemt).
   */
  doorvraag?: { tekst: string; voor: Onderwerp };
  /** Fase 2: vragen die door dit antwoord niet meer van toepassing zijn (zoals sterren zonder hotelervaring). */
  nvt?: Onderwerp[];
}

/** Velden waar Job op mag doorvragen, en welke vragen door een antwoord kunnen vervallen. */
export const DOORVRAAG_VOOR: Onderwerp[] = ["ervaring", "functievraag", "hotels", "sterren", "restaurant", "werkgebied", "werkmoment", "startdatum", "werkvorm", "diensten"];
export const KAN_VERVALLEN: Onderwerp[] = ["hotels", "sterren", "restaurant", "functievraag", "specialisatie"];
/** Hoogstens zoveel doorvragen per veld en in totaal: het gesprek wordt nooit eindeloos. */
export const MAX_DOORVRAGEN_PER_VELD = 2;
export const MAX_DOORVRAGEN_TOTAAL = 5;

/**
 * Velden die alleen als antwoord op hun eigen vraag mogen tellen. Een AI-lezing die bij een
 * ander antwoord toch werkautorisatie, een geldigheid of "geen ervaring" invult (gezien bij "Drinken inschenken"
 * en bij "Ik heb nog niet in een hotel gewerkt"),
 * mag het gesprek nooit naar vragen over een verblijfsdocument sturen.
 */
export function alleenBijEigenVraag(v: JobVelden, vorig: Onderwerp | null, ctx: JobContext, bekend: JobVelden = {}): JobVelden {
  const uit: JobVelden = { ...v };
  // De ervaring komt uit de ervaringsvraag. Een later antwoord ("ik heb nog niet in een hotel
  // gewerkt" bij de hotelvraag) overschrijft die niet en maakt er nooit "geen ervaring" van.
  if (vorig !== "ervaring") {
    delete uit.ervaringNiveau;
    if (bekend.ervaring) delete uit.ervaring;
  }
  if (ctx.nationalityZone !== "NON_EU") { delete uit.werkautorisatie; delete uit.geldigTot; }
  else if (vorig !== "werkautorisatie" && vorig !== "geldigheid") delete uit.geldigTot;
  if (vorig !== "specialisatie") delete uit.specialisatie;
  if (vorig !== "cv") delete uit.cvParaat;
  return uit;
}

/** Antwoord op de hotelvraag dat zegt: nog niet in een hotel gewerkt. */
const GEEN_HOTEL = /^\s*(nee|no|nope|geen|nooit|never|nergens)\b|nog (niet|nooit)|niet in (een )?hotel|geen hotel|nooit in (een )?hotel|not in a hotel|no hotels?\b|never (worked )?in a hotel|haven'?t worked in a hotel|not yet/i;

/** Alleen ander werk genoemd (restaurant, café, catering...) en geen hotel. */
const ANDER_WERK = /\b(restaurants?|caf[eé]s?|eetcaf[eé]|brasserie|bistro|bar|bars|catering|cateraar|lunchroom|kantine|strandtent|snackbar|pizzeria|festivals?|evenementen|events?|zzp|zelfstandig|kantoren|ziekenhuis|zorg|winkel|supermarkt)\b/i;
/** Fase 2: een vraag die door het antwoord niet meer van toepassing is. */
function vervalt(v: JobVelden, o: Onderwerp): void {
  if (!KAN_VERVALLEN.includes(o)) return;
  if (o === "hotels" || o === "sterren") { if (!v.hotels) v.hotels = "nog niet in een hotel gewerkt"; v.geenHotel = true; }
  if (o === "restaurant" && !v.restaurantSoort) v.restaurantSoort = "-";
  if (o === "functievraag" && v.functievraag === undefined) v.functievraag = "-";
  if (o === "specialisatie") delete v.specialisatieHint;
}

/** Noemt de tekst restaurantwerk (en geen hotel)? */
export function restaurantGenoemd(tekst: string): boolean {
  return /\b(restaurants?|brasserie|bistro|eetcaf[eé]|pizzeria|trattoria)\b/i.test(tekst) && !/hotel/i.test(tekst);
}
/** Zegt het antwoord op de hotelvraag dat iemand (nog) niet in een hotel werkte? */
export function geenHotelervaring(tekst: string): boolean {
  if (GEEN_HOTEL.test(tekst)) return true;
  return ANDER_WERK.test(tekst) && !/hotel|hostel|resort/i.test(tekst);
}

/** Geen antwoord maar verwarring: Job stelt dezelfde vraag opnieuw. */
const VERWARD = /^\s*(\?+|huh\?*|hè\?*|wat bedoel je\?*|wat\?+|sorry\?+|what do you mean\?*|what\?+)\s*$/i;

const BARWERK = /\b(bar(man|mannen|vrouw|keeper|tender|tenders|medewerker|werk|dienst)|bartend(er|ing)?|achter de bar|behind the bar)\b/i;
/** Bediening en bar: noemt de kandidaat zelf barwerk, dan is de functievraag overbodig. */
export function barwerkDuidelijk(tekst: string, ctx: JobContext): boolean {
  return ctx.functie === "horecamedewerker" && !isHotelPad(ctx) && BARWERK.test(tekst);
}

function samenvoegen(oud: JobVelden, nieuw: JobVelden): JobVelden {
  const uit: JobVelden = { ...oud };
  for (const [k, w] of Object.entries(nieuw) as [keyof JobVelden, any][]) {
    if (w === undefined || w === null || w === "") continue;
    // Wat de kandidaat zelf al eerder vertelde, overschrijft Job niet met een afleiding.
    if (k === "specialisatieHint" && oud.specialisatie) continue;
    (uit as any)[k] = w;
  }
  return uit;
}

/**
 * Verwerkt één bericht van de kandidaat. `lezing` is null als het bericht een
 * commando was of er geen tekst is (bijvoorbeeld alleen een bijlage).
 */
/**
 * Verwerkt één antwoord. Een korte reactie van Job ("Twee jaar achter de bar,
 * top.") komt in hetzelfde bericht als de vraag erna, zodat het gesprek niet
 * uit losse bevestigingen bestaat.
 */
export function verwerk(
  vorige: JobState,
  ctx: JobContext,
  invoer: { tekst?: string | null; cvOntvangen?: boolean },
  lezing: Lezing | null,
  nu: Date,
): Resultaat {
  const r = verwerkLos(vorige, ctx, invoer, lezing, nu);
  const uit: Uitgaand[] = [];
  for (let i = 0; i < r.berichten.length; i++) {
    const b = r.berichten[i];
    const volgende = r.berichten[i + 1];
    if (b.reactie && volgende) {
      r.berichten[i + 1] = { ...volgende, tekst: `${b.tekst} ${volgende.tekst}` };
      continue;
    }
    const { reactie: _r, ...rest } = b;
    uit.push(rest);
  }
  return { ...r, berichten: uit };
}

/** Welke keuze (index) het antwoord is, ongeacht hoofdletters en leestekens; anders -1. */
function welkeKeuze(tekst: string | null | undefined, keuzes: string[]): number {
  const n = (x: string) => x.trim().toLowerCase().replace(/[.!?,]+/g, "").replace(/\s+/g, " ");
  const s = n(tekst || "");
  return s ? keuzes.findIndex((k) => n(k) === s) : -1;
}

const WIL_VERDER = /^(ja|yes|yep|jazeker|graag|ja graag|ok|oke|oké|okay|prima|goed|verder|ga verder|doorgaan|continue|go on|start|opnieuw|weer verder)\b/i;
/** Een duidelijke wens midden in een zin ("Sorry, was druk. Ik wil toch verder"). */
const WIL_VERDER_ZIN = /\b(ik wil (toch |graag |nog )*(verder|door|doorgaan)|toch verder|wil (graag )?verder|ga (graag )?verder|i (still )?want to continue|i'?d like to continue|let'?s continue|continue after all|still interested|(toch|nog)( wel| steeds| altijd)* interesse|heb (toch |nog |wel )*interesse)\b/i;
const WIL_NIET = /^(nee|no|nope|nee dank( je| u)?|no thanks|niet meer|laat maar|stop)\b/i;

/**
 * Na STOP schrijft de kandidaat zelf (Job 3.0, hoofdstuk 7):
 * - antwoord op de knoppen "Ja, verder" of "Nee";
 * - een antwoord op de open vraag of een duidelijke wens: verder waar het was,
 *   automatische herinneringen blijven uit;
 * - iets anders: Job reageert en vraagt of de kandidaat verder wil, maar hervat niets.
 * Geeft null als het gesprek gewoon verder moet (het antwoord wordt dan normaal verwerkt).
 */
function naStop(state: JobState, ctx: JobContext, tekst: string | null | undefined, lezing: Lezing | null): Resultaat | null {
  const t = T[state.taal];
  const s = (tekst || "").trim();
  const knop = welkeKeuze(s, [...T.nl.welkomTerugKeuzes, ...T.en.welkomTerugKeuzes]);
  const hervat = () => {
    state.status = "bezig";
    state.velden.herinneringenUit = true;
  };
  const wilVerder = knop === 0 || knop === 2 || (knop < 0 && ((WIL_VERDER.test(s) && s.split(/\s+/).length <= 4) || WIL_VERDER_ZIN.test(s)));
  const antwoord = knop < 0 && beantwoordtOpenVraag(state, ctx, lezing, s);
  if (knop === 1 || knop === 3 || (knop < 0 && WIL_NIET.test(s) && !wilVerder && !antwoord)) {
    return { state, berichten: [{ tekst: t.blijftGestopt }], acties: [] };
  }
  if (wilVerder) {
    hervat();
    const onderwerp = state.laatsteOnderwerp || volgendeOnderwerp(state.velden, ctx);
    // Alle vragen waren al beantwoord: verder via de gewone stap (cv of planner).
    if (!onderwerp) return null;
    state.laatsteOnderwerp = onderwerp;
    return { state, berichten: [{ tekst: t.welkomTerugKort, reactie: true }, vraag(onderwerp, state.taal, ctx, state.velden)], acties: [{ soort: "hervat" }] };
  }
  if (antwoord) {
    hervat();
    return null;
  }
  return { state, berichten: [{ tekst: t.welkomTerug, keuzes: t.welkomTerugKeuzes }], acties: [] };
}

const GROET_OF_VRAAG = /^(hallo|hoi|hey|hi|hello|dag|goedemorgen|goedemiddag|goedenavond|good (morning|afternoon|evening)|wie is dit|who is this)\b|\?\s*$/i;

/** Vult deze lezing de vraag die openstond toen de kandidaat STOP stuurde? */
function beantwoordtOpenVraag(state: JobState, ctx: JobContext, lezing: Lezing | null, tekst?: string | null): boolean {
  if (!lezing || !state.laatsteOnderwerp || lezing.twijfel) return false;
  // Een groet of een eigen vraag is geen antwoord, ook al neemt een open vraag (zoals hotels) elke tekst aan.
  if (GROET_OF_VRAAG.test((tekst || "").trim())) return false;
  if (!Object.keys(lezing.velden || {}).length) return false;
  const na = volgendeOnderwerp(samenvoegen(state.velden, lezing.velden), ctx);
  return na !== state.laatsteOnderwerp;
}

/**
 * Een bestand kwam binnen terwijl Job nog vragen stelde (Job 3.0, fase 1): het
 * telt niet vanzelf als cv. Job vraagt het één keer; het antwoord verwerkt verwerk().
 */
export function bestandTijdensVragen(vorige: JobState, bijlage: string, nu: Date): Resultaat {
  const state: JobState = {
    ...vorige,
    velden: { ...vorige.velden, bestandVraag: bijlage },
    laatsteInkomendAt: nu.toISOString(),
    laatsteActiviteitAt: nu.toISOString(),
    herinneringen: 0,
    herinneringAt: null,
  };
  if (state.status === "geen_reactie") state.status = "bezig";
  const t = T[state.taal];
  return { state, berichten: [{ tekst: t.bestandVraag, keuzes: t.bestandKeuzes }], acties: [] };
}

/** Een spraakbericht: Job kan het niet beluisteren en vraagt om te typen; de open vraag blijft staan. */
export function spraakBericht(vorige: JobState, nu: Date): Resultaat {
  const state: JobState = { ...vorige, laatsteInkomendAt: nu.toISOString(), laatsteActiviteitAt: nu.toISOString(), herinneringen: 0, herinneringAt: null };
  if (state.status === "geen_reactie") state.status = "bezig";
  return { state, berichten: [{ tekst: T[state.taal].spraak }], acties: [] };
}

function verwerkLos(
  vorige: JobState,
  ctx: JobContext,
  invoer: { tekst?: string | null; cvOntvangen?: boolean },
  lezing: Lezing | null,
  nu: Date,
): Resultaat {
  const state: JobState = {
    ...vorige,
    velden: { ...vorige.velden },
    twijfels: [...vorige.twijfels],
    laatsteInkomendAt: nu.toISOString(),
    laatsteActiviteitAt: nu.toISOString(),
    herinneringen: 0,
    herinneringAt: null,
  };
  const berichten: Uitgaand[] = [];
  const acties: Actie[] = [];
  const t = () => T[state.taal];

  if (state.status === "gestopt" && ctx.stopV3) {
    const na = naStop(state, ctx, invoer.tekst, lezing);
    if (na) return na;
    if (state.status !== "gestopt") acties.push({ soort: "hervat" });
  } else if (state.status === "gestopt") {
    // Oud gedrag (schakelaar uit): wie na STOP weer schrijft, gaat verder waar hij was.
    state.status = "bezig";
  }

  // Een bestand kwam tijdens de vragen binnen en Job vroeg of het het cv is.
  if (state.velden.bestandVraag) {
    const bijlage = state.velden.bestandVraag;
    delete state.velden.bestandVraag;
    const keuze = welkeKeuze(invoer.tekst, [...T.nl.bestandKeuzes, ...T.en.bestandKeuzes]);
    if (keuze === 0 || keuze === 2) {
      acties.push({ soort: "cv_bevestigd", bijlage });
      ctx = { ...ctx, hasCv: true };
      berichten.push({ tekst: t().cvBinnenKort, reactie: true });
      lezing = null;
    } else if (keuze === 1 || keuze === 3) {
      lezing = null;
    } else {
      const noot = "Kandidaat stuurde tijdens de vragen een bestand en zei niet of het het cv is.";
      if (!state.twijfels.includes(noot)) state.twijfels.push(noot);
    }
  }

  const commando = herkenCommando(invoer.tekst, vorige.laatsteOnderwerp);

  // Taal wisselen
  if (commando === "english" || commando === "nederlands") {
    state.taal = commando === "english" ? "en" : "nl";
    berichten.push({ tekst: commando === "english" ? T.en.wisselNl : T.nl.wisselNl });
    if (state.status === "bezig" && state.laatsteOnderwerp) berichten.push(vraag(state.laatsteOnderwerp, state.taal, ctx));
    return { state, berichten, acties };
  }

  // Een collega
  if (commando === "mens" || commando === "bellen") {
    const reden = commando === "mens" ? "Kandidaat vroeg om een collega (MENS)." : "Kandidaat wil liever gebeld worden.";
    if (state.status !== "gepland") state.status = "planner";
    if (!state.twijfels.includes(reden)) state.twijfels.push(reden);
    berichten.push({ tekst: commando === "mens" ? t().mens : t().bellen });
    acties.push({ soort: "planner", reden });
    return { state, berichten, acties };
  }

  // "Verder" (knop uit de herinnering): stel de openstaande vraag opnieuw.
  if (commando === "verder") {
    if (state.status === "geen_reactie") state.status = "bezig";
    if ((state.status === "bezig" || state.status === "wacht_cv") && state.laatsteOnderwerp) {
      berichten.push(vraag(state.laatsteOnderwerp, state.taal, ctx));
      return { state, berichten, acties };
    }
  }

  // Na het plannen
  if (state.status === "gepland") {
    if (commando === "verzetten") {
      state.status = "plannen";
      state.herinneringen = 0;
      state.herinneringAt = null;
      berichten.push({ tekst: t().verzetten, planning: true });
      acties.push({ soort: "verzetten" });
    } else if (commando === "ikkom") {
      berichten.push({ tekst: t().ikKom });
      acties.push({ soort: "bevestigd" });
    } else {
      // Geen vrije chat na het plannen: kort de stand van zaken.
      const a = ctx.afspraak;
      berichten.push({ tekst: a ? t().alGepland(a.dag, a.tijd) : t().wachtPlanner });
    }
    return { state, berichten, acties };
  }

  // Antwoord op een cv-vraag (fase 4): bewaren, het cv opnieuw lezen met de aanvulling.
  if (state.velden.cvVraag && invoer.tekst && !invoer.cvOntvangen) {
    const open = state.velden.cvVraag;
    if (VERWARD.test(invoer.tekst)) { berichten.push({ tekst: open.tekst }); return { state, berichten, acties }; }
    state.velden.cvVragen = (state.velden.cvVragen || []).map((v) => (v.soort === open.soort && v.antwoord === undefined ? { ...v, antwoord: invoer.tekst!.trim().slice(0, 500) } : v));
    delete state.velden.cvVraag;
    berichten.push({ tekst: t().cvVraagDank });
    acties.push({ soort: "profiel", velden: state.velden });
    acties.push({ soort: "cv_aanvulling" });
    return { state, berichten, acties };
  }

  if (state.status === "planner") {
    berichten.push({ tekst: t().wachtPlanner });
    return { state, berichten, acties };
  }
  if (state.status === "cv_controle" && !invoer.cvOntvangen) {
    berichten.push({ tekst: t().cvControleWacht });
    return { state, berichten, acties };
  }
  if (state.status === "plannen" && !invoer.cvOntvangen) {
    berichten.push({ tekst: t().plannenNogmaals, planning: true });
    return { state, berichten, acties };
  }
  if (state.status === "geen_reactie") state.status = "bezig";

  // Cv binnen
  if (invoer.cvOntvangen) {
    ctx = { ...ctx, hasCv: true };
  }

  // Antwoord uitlezen
  const vorigOnderwerp = state.laatsteOnderwerp;
  if (lezing) {
    if (lezing.taal === "en" && state.taal === "nl" && !state.velden.ervaring && vorigOnderwerp === "ervaring") {
      // Eerste antwoord in het Engels: Job gaat mee (C2, Maria).
      state.taal = "en";
    }
    const oudeAutorisatie = state.velden.werkautorisatie;
    // Een no-go op taal alleen als het antwoord zelf geen Nederlands of Engels is
    // en echt tekst bevat: "1" of "Tot 25 km" mag nooit tot een afwijzing leiden.
    const letters = (invoer.tekst || "").replace(/[^A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u06FF\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/g, "").length;
    if (lezing.velden.nlOfEn === false && (lezing.taal !== "anders" || letters < 6)) {
      const { nlOfEn: _weg, ...rest } = lezing.velden;
      lezing = { ...lezing, velden: rest };
    }
    // Een "?" of "wat bedoel je" is geen antwoord: niets invullen, dezelfde vraag komt terug.
    const verward = VERWARD.test(invoer.tekst || "");
    lezing = verward ? { ...lezing, velden: {}, ack: "", vervolgvraag: undefined } : { ...lezing, velden: alleenBijEigenVraag(lezing.velden, vorigOnderwerp, ctx, state.velden) };
    state.velden = samenvoegen(state.velden, lezing.velden);
    // Fase 2: vragen die door dit antwoord vervallen (sterren zonder hotelervaring en dergelijke).
    if (ctx.begrijpen) for (const o of lezing.nvt || []) vervalt(state.velden, o);
    // Barwerk spreekt voor zich: geen vraag meer wat iemand achter de bar deed.
    if (vorigOnderwerp === "ervaring" && barwerkDuidelijk(invoer.tekst || "", ctx) && state.velden.functievraag === undefined) {
      state.velden.functievraag = "-";
    }
    if (lezing.twijfel && !state.twijfels.includes(lezing.twijfel)) state.twijfels.push(lezing.twijfel);

    // Taal: harde no-go
    if (state.velden.nlOfEn === false) {
      state.status = "planner";
      const reden = "Spreekt geen Nederlands en geen Engels: harde no-go, planner wijst af met deze reden.";
      if (!state.twijfels.includes(reden)) state.twijfels.push(reden);
      berichten.push({ tekst: T.en.nogo });
      acties.push({ soort: "profiel", velden: state.velden });
      acties.push({ soort: "nogo", reden });
      return { state, berichten, acties };
    }

    // Korte reacties die het ontwerp voorschrijft
    // Een korte reactie alleen na een open vraag; na een knop of keuze zou hij herhalen wat al gezegd is.
    if (lezing.ack && ["ervaring", "functievraag", "hotels"].includes(vorigOnderwerp || "")) berichten.push({ tekst: lezing.ack, reactie: true });
    // Hotelfuncties: past de ervaring niet duidelijk bij de functie, dan vraagt Job eerst door.
    if (vorigOnderwerp === "ervaring" && isHotelPad(ctx) && lezing.vervolgvraag && state.velden.ervaringNiveau !== "geen") {
      state.velden.verduidelijking = lezing.vervolgvraag;
    }
    if (!oudeAutorisatie && state.velden.werkautorisatie && state.velden.werkautorisatie !== "vrij") {
      berichten.push({ tekst: t().werkautorisatieCollega, reactie: true });
    }
    if (vorigOnderwerp === "geldigheid" && state.velden.geldigTot !== undefined) {
      berichten.push({ tekst: t().documentMee, reactie: true });
    }
    if (vorigOnderwerp === "ervaring" && state.velden.ervaringNiveau === "geen" && !lezing.ack) {
      berichten.push({ tekst: t().geenErvaringOk, reactie: true });
    }
    // Een vraag die niet beantwoord kon worden, stelt Job niet eindeloos opnieuw.
    // Nog nooit in een hotel gewerkt: dan ook niet vragen naar de sterren van "het beste hotel".
    if (!verward && vorigOnderwerp === "hotels" && geenHotelervaring(invoer.tekst || "")) {
      state.velden.hotels = "nog niet in een hotel gewerkt";
      state.velden.geenHotel = true;
      // Keuken of bediening en restaurantervaring: Job vraagt wat voor restaurant, in plaats van de sterren.
      if ((ctx.functie === "chef" || ctx.functie === "horecamedewerker") && restaurantGenoemd(invoer.tekst || "")) state.velden.restaurantWerk = true;
    }
    if (!verward && vorigOnderwerp === "restaurant" && !state.velden.restaurantSoort) state.velden.restaurantSoort = (invoer.tekst || "").trim().slice(0, 100) || "-";
    if (!verward && vorigOnderwerp === "hotels" && !state.velden.hotels) state.velden.hotels = (invoer.tekst || "").trim().slice(0, 300) || "-";
    if (!verward && vorigOnderwerp === "functievraag" && state.velden.functievraag === undefined) {
      state.velden.functievraag = (invoer.tekst || "").trim() || "-";
    }
    if (!verward && vorigOnderwerp === "geldigheid" && state.velden.geldigTot === undefined) {
      state.velden.geldigTot = (invoer.tekst || "").trim() || "onbekend";
    }
    acties.push({ soort: "profiel", velden: state.velden });
  }

  // Fase 2: een logische vervolgvraag op dit antwoord, om het invulveld goed te krijgen.
  const dv = ctx.begrijpen && lezing && !VERWARD.test(invoer.tekst || "") ? lezing.doorvraag : undefined;
  if (dv && DOORVRAAG_VOOR.includes(dv.voor)) {
    const teller = { ...(state.velden.doorvragen || {}) };
    const totaal = Object.values(teller).reduce((a, b) => a + (b || 0), 0);
    if ((teller[dv.voor] || 0) < MAX_DOORVRAGEN_PER_VELD && totaal < MAX_DOORVRAGEN_TOTAAL) {
      teller[dv.voor] = (teller[dv.voor] || 0) + 1;
      state.velden.doorvragen = teller;
      // Het antwoord op de doorvraag hoort bij dat veld: een eerder noodantwoord wordt weer open.
      if (dv.voor === "hotels" && state.velden.hotels && !state.velden.geenHotel) delete state.velden.hotels;
      if (dv.voor === "functievraag") delete state.velden.functievraag;
      state.status = "bezig";
      state.laatsteOnderwerp = dv.voor;
      berichten.push({ tekst: dv.tekst });
      return { state, berichten, acties };
    }
  }

  // Volgende stap
  const onderwerp = volgendeOnderwerp(state.velden, ctx);
  if (onderwerp) {
    state.status = "bezig";
    state.laatsteOnderwerp = onderwerp;
    const v = vraag(onderwerp, state.taal, ctx, state.velden);
    if (onderwerp === "functievraag" && lezing?.vervolgvraag && !isHotelPad(ctx)) v.tekst = lezing.vervolgvraag;
    berichten.push(v);
    return { state, berichten, acties };
  }
  state.laatsteOnderwerp = null;

  // Alles gevraagd. Cv?
  if (!ctx.hasCv) {
    const wasAl = vorige.status === "wacht_cv";
    state.status = "wacht_cv";
    if (state.velden.cvParaat === "ja") {
      berichten.push({ tekst: t().cvUpload, cvUpload: true });
    } else {
      if (!wasAl) acties.push({ soort: "cv_mail" });
      berichten.push({ tekst: t().cvLater, cvUpload: true });
    }
    return { state, berichten, acties };
  }

  const redenen = plannerRedenen(state.velden, ctx, state.twijfels);
  const cvNet = !!invoer.cvOntvangen;
  // Fase 4: eerst het cv lezen; het slotbericht (of een cv-vraag) volgt als dat klaar is.
  const uitstellen = cvNet && !!ctx.cvVragen;
  if (redenen.length > 0) {
    state.status = "planner";
    if (cvNet) berichten.push({ tekst: t().cvOntvangen });
    if (uitstellen) { state.velden.cvAfronding = "planner"; berichten.push({ tekst: t().cvBekijken }); }
    else berichten.push({ tekst: t().planner(ctx.voornaam) });
    acties.push({ soort: "planner", reden: redenen.join(" ") });
    return { state, berichten, acties };
  }

  // Alles in orde, maar eerst controleert een collega het cv (Kandidaten).
  // Na Accepteren nodigt Job uit om zelf een moment te kiezen.
  state.status = "cv_controle";
  state.herinneringen = 0;
  state.herinneringAt = null;
  if (cvNet) berichten.push({ tekst: t().cvOntvangen });
  if (uitstellen) { state.velden.cvAfronding = "cv_controle"; berichten.push({ tekst: t().cvBekijken }); }
  else berichten.push({ tekst: t().cvControle(ctx.voornaam) });
  acties.push({ soort: "planner", reden: "Cv controleren, daarna uitnodigen." });
  return { state, berichten, acties };
}

/** Het uitgestelde slotbericht na het lezen van het cv. */
export function cvAfrondingTekst(soort: "planner" | "cv_controle", voornaam: string, taal: JobTaal): string {
  return soort === "planner" ? T[taal].planner(voornaam) : T[taal].cvControle(voornaam);
}

// ─── Herinneringen (C2, B2) ──────────────────────────────────────────────────

export const UUR = 60 * 60 * 1000;
export const EERSTE_HERINNERING_NA = 22 * UUR;
export const TWEEDE_HERINNERING_NA = 48 * UUR;
export const ROOD_NA = 48 * UUR;

export type Herinnering = "eerste" | "tweede" | "rood";

/** Welke herinnering is nu aan de beurt? Alleen voor gesprekken die op de kandidaat wachten. */
export function herinneringNodig(s: JobState, nu: Date): Herinnering | null {
  if (s.status !== "bezig" && s.status !== "wacht_cv") return null;
  if (s.velden?.herinneringenUit) return null;
  const sinds = (iso: string | null) => (iso ? nu.getTime() - new Date(iso).getTime() : 0);
  if (s.herinneringen === 0 && sinds(s.laatsteActiviteitAt) >= EERSTE_HERINNERING_NA) return "eerste";
  if (s.herinneringen === 1 && sinds(s.herinneringAt) >= TWEEDE_HERINNERING_NA) return "tweede";
  if (s.herinneringen === 2 && sinds(s.herinneringAt) >= ROOD_NA) return "rood";
  return null;
}

/**
 * Uitgenodigd, maar nog geen moment gekozen: een herinnering na 24 uur en een
 * tweede na nog eens 48 uur. Daarna niets meer; Kandidaten kleurt het geel.
 */
export function planHerinneringNodig(s: JobState, nu: Date): boolean {
  if (s.status !== "plannen" || s.herinneringen >= 2 || s.velden?.herinneringenUit) return false;
  const vanaf = s.herinneringen === 0 ? s.laatsteActiviteitAt : s.herinneringAt;
  const wacht = s.herinneringen === 0 ? EERSTE_HERINNERING_NA + 2 * 3600 * 1000 : TWEEDE_HERINNERING_NA;
  return !!vanaf && nu.getTime() - new Date(vanaf).getTime() >= wacht;
}

export function planHerinnering(s: JobState, ctx: JobContext, nu: Date): Resultaat {
  const state: JobState = { ...s, herinneringen: s.herinneringen + 1, herinneringAt: nu.toISOString() };
  return { state, berichten: [{ tekst: T[s.taal].planHerinnering(ctx.voornaam), planning: true }], acties: [] };
}

export function herinnering(s: JobState, ctx: JobContext, soort: Herinnering, nu: Date): Resultaat {
  const state: JobState = { ...s, herinneringAt: nu.toISOString() };
  const t = T[s.taal];
  if (soort === "rood") {
    state.status = "geen_reactie";
    state.herinneringen = 3;
    return { state, berichten: [], acties: [{ soort: "planner", reden: "Geen reactie na twee herinneringen. Kies: bellen, nog een bericht of laten rusten." }] };
  }
  state.herinneringen = soort === "eerste" ? 1 : 2;
  const tekst = soort === "eerste" ? t.herinnering1(ctx.voornaam) : t.herinnering2(ctx.voornaam);
  return { state, berichten: [{ tekst, keuzes: t.herinneringKeuzes }], acties: [] };
}

// ─── Velden naar het kandidaatprofiel ────────────────────────────────────────

const DIENSTEN_TEKST: Record<Diensten, string> = { "1-2": "1 tot 2 diensten per week", "3-4": "3 tot 4 diensten per week", "5+": "5 of meer diensten per week" };
/** Leesbare tekst voor de planner (kaart, profiel). */
export const WERKMOMENT_TEKST: Record<Werkmoment, { nl: string; en: string }> = {
  doordeweeks: { nl: "Doordeweeks", en: "Weekdays" },
  avond_weekend: { nl: "Avond en weekend", en: "Evenings and weekends" },
  flexibel: { nl: "Wanneer nodig", en: "Whenever needed" },
};
export const STERREN_TEKST: Record<Sterren, { nl: string; en: string }> = {
  "3": { nl: "3 sterren of minder", en: "3 stars or fewer" },
  "4": { nl: "4 sterren", en: "4 stars" },
  "5": { nl: "5 sterren", en: "5 stars" },
};
export const WERKVORM_TEKST: Record<Werkvorm, { nl: string; en: string }> = {
  studie: { nl: "Naast studie", en: "Alongside studies" },
  ander_werk: { nl: "Naast ander werk", en: "Alongside another job" },
  hoofdbaan: { nl: "Hoofdbaan", en: "Main job" },
};
export const STARTDATUM_TEKST: Record<Startdatum, { nl: string; en: string }> = {
  direct: { nl: "Direct", en: "Right away" },
  twee_weken: { nl: "Binnen 2 weken", en: "Within 2 weeks" },
  later: { nl: "Later", en: "Later" },
};

/** Korte samenvatting voor de planner en de bevestigingsmail ("Wat je Job vertelde"). */
export function samenvatting(v: JobVelden, ctx: JobContext, taal: JobTaal = "nl"): string {
  const delen: string[] = [functieLabel(ctx.functie, taal)];
  if (v.specialisatie === "ja") delen[0] += taal === "nl" ? ", ook evenementen en banqueting" : ", also events and banqueting";
  if (v.diensten) delen.push(taal === "nl" ? DIENSTEN_TEKST[v.diensten] : { "1-2": "1 to 2 shifts a week", "3-4": "3 to 4 shifts a week", "5+": "5 or more shifts a week" }[v.diensten]);
  if (v.werkgebied) delen.push(v.werkgebied);
  if (v.werkmoment) delen.push(WERKMOMENT_TEKST[v.werkmoment][taal].toLowerCase());
  if (v.startdatum) delen.push(taal === "nl" ? `beginnen: ${STARTDATUM_TEKST[v.startdatum].nl.toLowerCase()}` : `start: ${STARTDATUM_TEKST[v.startdatum].en.toLowerCase()}`);
  return delen.join(" · ");
}

/**
 * Welke bestaande kandidaatvelden Job mag invullen. Alleen bestaande kolommen,
 * en alleen tekstvelden die de planner toch al leest.
 */
export function profielVelden(v: JobVelden): Record<string, string> {
  const uit: Record<string, string> = {};
  if (v.ervaring) {
    const hotel = [v.hotels && v.hotels !== "-" ? `Hotels: ${v.hotels}` : "", v.sterren ? `beste hotel ${STERREN_TEKST[v.sterren].nl}` : ""].filter(Boolean).join(", ");
    uit.previousExperience = (hotel ? `${v.ervaring}. ${hotel}` : v.ervaring).slice(0, 2000);
  }
  const beschikbaar = [v.diensten ? DIENSTEN_TEKST[v.diensten] : "", v.werkmoment ? WERKMOMENT_TEKST[v.werkmoment].nl.toLowerCase() : ""].filter(Boolean).join(", ");
  if (beschikbaar) uit.availability = beschikbaar;
  if (v.talen) uit.language = v.talen.slice(0, 500);
  return uit;
}
