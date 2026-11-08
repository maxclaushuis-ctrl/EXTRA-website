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
  | "talen"
  | "cv";

export type Werkautorisatie = "vrij" | "twv" | "onbekend" | "anders";
export type Diensten = "1-2" | "3-4" | "5+";

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
  talen?: string;
  /** false = spreekt geen Nederlands en geen Engels: harde no-go voor de planner. */
  nlOfEn?: boolean;
  cvParaat?: "ja" | "nee";
  zoekt?: string;
}

/** Wat Job vooraf weet uit de aanmelding. */
export interface JobContext {
  voornaam: string;
  functie: string;
  nationalityZone: "NL" | "EU" | "NON_EU" | null;
  hasCv: boolean;
  /** Alleen als er een kennismaking gepland staat, in de taal van het gesprek. */
  afspraak?: { dag: string; tijd: string; wie: string };
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
}

export type Actie =
  | { soort: "planner"; reden: string }
  | { soort: "nogo"; reden: string }
  | { soort: "cv_mail" }
  | { soort: "profiel"; velden: JobVelden }
  | { soort: "verzetten" }
  | { soort: "bevestigd" };

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

// ─── Teksten ─────────────────────────────────────────────────────────────────

const T = {
  nl: {
    welkom: (v: string, f: string) => `Hoi ${v}, ik ben Job, de AI-recruiter van EXTRA! Leuk dat je je hebt aangemeld voor ${f}. Een paar korte vragen, dan kunnen we je goed voorstellen.`,
    disclaimer: "Je praat met Job, een AI. Typ MENS voor een collega of ENGLISH om te wisselen.",
    ervaring: (functie: string) =>
      functie === "chef" ? "Vertel eens: waar heb je tot nu toe gekookt?"
      : functie === "housekeeping" ? "Vertel eens: wat is je ervaring met housekeeping tot nu toe?"
      : functie === "logistiek" ? "Vertel eens: wat voor werk heb je tot nu toe gedaan, bijvoorbeeld in een magazijn?"
      : "Vertel eens: waar heb je tot nu toe in de horeca gewerkt?",
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
    cv: "Laatste vraag: heb je je cv paraat?",
    cvKeuzes: ["Ja", "Nee"],
    cvUpload: "Top! Upload je cv hier, dat kan als pdf of foto.",
    cvUploadWa: (link: string) => `Top! Stuur je cv hier in WhatsApp als pdf of foto, of upload het via ${link}`,
    cvLater: "Geen probleem! Ik heb je een mail gestuurd met een knop om je cv te uploaden. Zodra het binnen is, kun je meteen een kennismaking plannen.",
    cvOntvangen: "Fantastisch, je cv is binnen!",
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
    gestopt: "Je krijgt geen berichten meer van Job. Toch verder? Stuur gerust een bericht.",
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
    welkom: (v: string, f: string) => `Hi ${v}, I'm Job, the AI recruiter at EXTRA! Thanks for signing up for ${f}. A few quick questions so we can introduce you well.`,
    disclaimer: "You're chatting with Job, an AI. Type HUMAN for a colleague or NEDERLANDS to switch.",
    ervaring: (functie: string) =>
      functie === "chef" ? "Tell me: where have you cooked so far?"
      : functie === "housekeeping" ? "Tell me about your housekeeping experience so far?"
      : functie === "logistiek" ? "Tell me: what kind of work have you done so far, for example in a warehouse?"
      : "Tell me: where have you worked in hospitality so far?",
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
    cv: "Last question: do you have your CV ready?",
    cvKeuzes: ["Yes", "No"],
    cvUpload: "Great! Upload your CV here, a PDF or a photo is fine.",
    cvUploadWa: (link: string) => `Great! Send your CV here in WhatsApp as a PDF or photo, or upload it via ${link}`,
    cvLater: "No problem! I've sent you an email with a button to upload your CV. As soon as it's in, you can book a short meeting at our office.",
    cvOntvangen: "Fantastic, your CV is in!",
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
    gestopt: "You won't get any more messages from Job. Want to continue after all? Just send a message.",
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
  if (v.functievraag === undefined && v.ervaringNiveau !== "geen" && FUNCTIEVRAAG[ctx.functie]) return "functievraag";
  if (ctx.functie === "horecamedewerker" && v.specialisatieHint && !v.specialisatie) return "specialisatie";
  if (ctx.nationalityZone === "NON_EU" && !v.werkautorisatie) return "werkautorisatie";
  if (v.werkautorisatie === "vrij" && v.geldigTot === undefined) return "geldigheid";
  if (!v.diensten) return "diensten";
  if (!v.werkgebied) return "werkgebied";
  if (!v.talen) return "talen";
  if (!ctx.hasCv && !v.cvParaat) return "cv";
  return null;
}

export function vraag(onderwerp: Onderwerp, taal: JobTaal, ctx: JobContext): Uitgaand {
  const t = T[taal];
  switch (onderwerp) {
    case "ervaring": return { tekst: t.ervaring(ctx.functie) };
    case "functievraag": return { tekst: FUNCTIEVRAAG[ctx.functie]?.[taal] ?? t.ervaring(ctx.functie) };
    case "specialisatie": return { tekst: t.specialisatie, keuzes: t.specialisatieKeuzes };
    case "werkautorisatie": return { tekst: t.werkautorisatie, keuzes: t.werkautorisatieKeuzes };
    case "geldigheid": return { tekst: t.geldigheid };
    case "diensten": return { tekst: t.diensten, keuzes: t.dienstenKeuzes };
    case "werkgebied": return { tekst: t.werkgebied, keuzes: t.werkgebiedKeuzes };
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
      { tekst: t.welkom(ctx.voornaam, functieLabel(ctx.functie, taal)) },
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
export function verwerk(
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

  if (state.status === "gestopt") {
    // Wie na STOP weer schrijft, gaat verder waar hij was.
    state.status = "bezig";
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
    state.velden = samenvoegen(state.velden, lezing.velden);
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
    if (lezing.ack) berichten.push({ tekst: lezing.ack });
    if (!oudeAutorisatie && state.velden.werkautorisatie && state.velden.werkautorisatie !== "vrij") {
      berichten.push({ tekst: t().werkautorisatieCollega });
    }
    if (vorigOnderwerp === "geldigheid" && state.velden.geldigTot !== undefined) {
      berichten.push({ tekst: t().documentMee });
    }
    if (vorigOnderwerp === "ervaring" && state.velden.ervaringNiveau === "geen" && !lezing.ack) {
      berichten.push({ tekst: t().geenErvaringOk });
    }
    // Een vraag die niet beantwoord kon worden, stelt Job niet eindeloos opnieuw.
    if (vorigOnderwerp === "functievraag" && state.velden.functievraag === undefined) {
      state.velden.functievraag = (invoer.tekst || "").trim() || "-";
    }
    if (vorigOnderwerp === "geldigheid" && state.velden.geldigTot === undefined) {
      state.velden.geldigTot = (invoer.tekst || "").trim() || "onbekend";
    }
    acties.push({ soort: "profiel", velden: state.velden });
  }

  // Volgende stap
  const onderwerp = volgendeOnderwerp(state.velden, ctx);
  if (onderwerp) {
    state.status = "bezig";
    state.laatsteOnderwerp = onderwerp;
    berichten.push(vraag(onderwerp, state.taal, ctx));
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
  if (redenen.length > 0) {
    state.status = "planner";
    if (cvNet) berichten.push({ tekst: t().cvOntvangen });
    berichten.push({ tekst: t().planner(ctx.voornaam) });
    acties.push({ soort: "planner", reden: redenen.join(" ") });
    return { state, berichten, acties };
  }

  // Alles in orde, maar eerst controleert een collega het cv (Kandidaten).
  // Na Accepteren nodigt Job uit om zelf een moment te kiezen.
  state.status = "cv_controle";
  state.herinneringen = 0;
  state.herinneringAt = null;
  if (cvNet) berichten.push({ tekst: t().cvOntvangen });
  berichten.push({ tekst: t().cvControle(ctx.voornaam) });
  acties.push({ soort: "planner", reden: "Cv controleren, daarna uitnodigen." });
  return { state, berichten, acties };
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
  if (s.status !== "plannen" || s.herinneringen >= 2) return false;
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

/** Korte samenvatting voor de planner en de bevestigingsmail ("Wat je Job vertelde"). */
export function samenvatting(v: JobVelden, ctx: JobContext, taal: JobTaal = "nl"): string {
  const delen: string[] = [functieLabel(ctx.functie, taal)];
  if (v.specialisatie === "ja") delen[0] += taal === "nl" ? ", ook evenementen en banqueting" : ", also events and banqueting";
  if (v.diensten) delen.push(taal === "nl" ? DIENSTEN_TEKST[v.diensten] : { "1-2": "1 to 2 shifts a week", "3-4": "3 to 4 shifts a week", "5+": "5 or more shifts a week" }[v.diensten]);
  if (v.werkgebied) delen.push(v.werkgebied);
  return delen.join(" · ");
}

/**
 * Welke bestaande kandidaatvelden Job mag invullen. Alleen bestaande kolommen,
 * en alleen tekstvelden die de planner toch al leest.
 */
export function profielVelden(v: JobVelden): Record<string, string> {
  const uit: Record<string, string> = {};
  if (v.ervaring) uit.previousExperience = v.ervaring.slice(0, 2000);
  if (v.diensten) uit.availability = DIENSTEN_TEKST[v.diensten];
  if (v.talen) uit.language = v.talen.slice(0, 500);
  return uit;
}
