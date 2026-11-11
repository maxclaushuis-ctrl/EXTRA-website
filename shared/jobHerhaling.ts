/**
 * Job herhaalt zich nooit (opdracht Max, 11 november 2026).
 *
 * Aanleiding: Job vroeg drie keer "Bij welke hotels heb je gewerkt?" terwijl de kandidaat
 * telkens zei dat hij niet in een hotel had gewerkt. De AI begreep het antwoord, maar gaf niet
 * door dat de vraag daarmee verviel; de regels telden het dan als onduidelijk en stelden
 * dezelfde vraag opnieuw.
 *
 * Deze module is de laatste stap na elk bericht van de kandidaat, voor beide versies van Job
 * (Job 4 en de oudere lezer), en werkt zonder de AI. Ze garandeert, voor elke vraag en elke functie:
 *
 *  1. Een duidelijk nee of "niet van toepassing" sluit de vraag af ("Ik heb niet in hotels
 *     gewerkt", "Nee", "Nog niet"). Bij de hotelvraag vervalt dan ook de vraag naar sterren.
 *  2. "Weet ik niet" of "geen idee" sluit de vraag af als onbekend; de kennismaking vult het aan.
 *  3. Een vraag wordt hooguit twee keer gesteld: de tweede keer altijd met andere woorden.
 *     Blijft het antwoord daarna onduidelijk, dan staat het als onbekend en gaat Job verder.
 *  4. Job stuurt nooit twee keer achter elkaar hetzelfde bericht.
 *
 * Onbekend is geen nee: het dossier toont "Niet bekend". Bij werkautorisatie wordt onbekend het
 * bestaande antwoord "weet ik niet", zodat een collega het controleert voordat er gepland wordt.
 *
 * Uitzonderingen, met opzet: vraagt de kandidaat zelf iets (Job antwoordt en stelt zijn vraag
 * opnieuw), stuurt hij een commando (MENS, ENGLISH) of wisselt de taal, dan is dat geen herhaling.
 */
import {
  herkenCommando, teksten, verwerk, vervalt, vraag, ervaringWerk,
  type Actie, type JobContext, type JobState, type JobTaal, type JobVelden, type Lezing, type Onderwerp, type Resultaat, type Uitgaand,
} from "./jobRegels";

const BEZIG = ["bezig", "wacht_cv", "geen_reactie", "gestopt"];

/** Het veld dat bij een vraag hoort. */
export const VELD_VAN_ONDERWERP: Partial<Record<Onderwerp, keyof JobVelden>> = {
  ervaring: "ervaring", functievraag: "functievraag", hotels: "hotels", sterren: "sterren", restaurant: "restaurantSoort", specialisatie: "specialisatie",
  werkautorisatie: "werkautorisatie", geldigheid: "geldigTot", diensten: "diensten", werkgebied: "werkgebied", werkmoment: "werkmoment",
  startdatum: "startdatum", werkvorm: "werkvorm", talen: "talen", cv: "cvParaat",
};

/** Is de vraag beantwoord (of vervallen)? */
export function veldGevuld(o: Onderwerp, v: JobVelden): boolean {
  if ((o === "sterren" || o === "hotels") && v.geenHotel) return true;
  const k = VELD_VAN_ONDERWERP[o];
  if (!k) return true;
  const w = v[k];
  return w !== undefined && w !== null && w !== "";
}

// ─── Wat het antwoord zegt, zonder de AI ─────────────────────────────────────

const woorden = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const WEET_NIET = /\b(weet (ik )?(het )?(nog )?niet|weet niet|geen (flauw )?idee|geen benul|i don'?t know|dont know|no idea|not sure|dunno|idk)\b/i;
/** Begint met een nee. Alleen in korte antwoorden: in een lange zin kan "nee" iets anders betekenen. */
const KORT_NEE = /^\s*(nee|neen|nope|no|nah|geen|nooit|never|nergens|nowhere|niet|none|nog niet|nog nooit|not yet|n\.?v\.?t\.?|niet van toepassing)\b/i;
const NIET_ALLEEN = /\b(niet alleen|niet enkel|not only|not just)\b/i;
const HOTEL = String.raw`(?:hotels?|hotelervaring|hotelwerk|hostels?|resorts?)`;
/** "niet in hotels gewerkt", "nooit bij een hotel", "geen hotelervaring". Een hotelschool is geen hotel. */
const HOTEL_NEE = new RegExp(
  String.raw`\b(niet|nooit|geen|nergens|never|not|no|haven'?t|hasn'?t|didn'?t)\b[^.?!\n]{0,40}\b${HOTEL}\b` +
  String.raw`|\b${HOTEL}\b[^.?!\n]{0,30}\b(niet|nooit|never|not)\b[^.?!\n]{0,20}\b(gewerkt|werken|worked|working)\b`,
  "i",
);
const RESTAURANT_NEE = /\b(geen|niet( in)?( een)?|not a|no) (restaurant|zaak)\b/i;
const ERVARING_NEE = /\b(geen ervaring|nog (geen|nooit)|no experience|never (worked|done))\b/i;
const DUUR = /\d|\b(jaar|jaren|maand|maanden|week|weken|year|years|month|months|weeks?)\b/i;

/** "Weet ik niet", "geen idee". */
export function weetNiet(tekst: string): boolean {
  return WEET_NIET.test(tekst);
}

/**
 * Zegt het antwoord duidelijk nee, of dat de vraag niet van toepassing is? Geeft de velden die
 * dan gelden, of null. Alleen voor vragen waar nee een betekenis heeft.
 */
export function ontkenning(o: Onderwerp, tekst: string): JobVelden | null {
  const t = tekst.trim();
  if (!t || weetNiet(t) || NIET_ALLEEN.test(t)) return null;
  const kortNee = KORT_NEE.test(t) && woorden(t) <= 8;
  switch (o) {
    case "hotels":
    case "sterren": {
      if (!kortNee && !HOTEL_NEE.test(t)) return null;
      const v: JobVelden = {};
      vervalt(v, "hotels");
      return v;
    }
    case "restaurant": {
      if (!kortNee && !RESTAURANT_NEE.test(t)) return null;
      const v: JobVelden = {};
      vervalt(v, "restaurant");
      return v;
    }
    case "functievraag": {
      if (!kortNee && !(/^\s*(niks|niets|nothing)\b/i.test(t) && woorden(t) <= 6)) return null;
      const v: JobVelden = {};
      vervalt(v, "functievraag");
      return v;
    }
    case "specialisatie": return kortNee ? { specialisatie: "nee" } : null;
    case "cv": return kortNee ? { cvParaat: "nee" } : null;
    case "ervaring":
      return (kortNee || ERVARING_NEE.test(t)) && !DUUR.test(t) ? { ervaring: "geen ervaring", ervaringNiveau: "geen" } : null;
    default: return null;
  }
}

/** Een vraag die onbekend blijft. Werkautorisatie en geldigheid krijgen hun bestaande "weet ik niet". */
function maakOnbekend(v: JobVelden, o: Onderwerp): void {
  if (o === "werkautorisatie") { v.werkautorisatie = "onbekend"; return; }
  if (o === "geldigheid") { v.geldigTot = "onbekend"; return; }
  if (!v.onbekend?.includes(o)) v.onbekend = [...(v.onbekend || []), o];
}

// ─── De tweede keer: andere woorden ──────────────────────────────────────────

/** Hoe vaak Job een vraag terugstelt na een eigen vraag of correctie van de kandidaat, voordat hij verdergaat. */
const MAX_VRIJ = 3;

/** Vragen die de tweede keer niet anders gesteld worden: een onduidelijk antwoord wordt meteen "weet ik niet". */
const GEEN_HERKANSING: Onderwerp[] = ["werkautorisatie", "geldigheid"];

const ANDERS = { nl: "Ik vraag het even anders.", en: "Let me put it differently." };

/** De tweede keer dezelfde vraag, met andere woorden en een duidelijke uitweg. */
export function herkansing(o: Onderwerp, taal: JobTaal, ctx: JobContext): Uitgaand | null {
  const t = teksten(taal);
  const nl = taal === "nl";
  switch (o) {
    case "ervaring": return { tekst: nl ? `Heb je al eens ${ervaringWerk(ctx.functie, "nl")} gewerkt, en zo ja, hoe lang ongeveer?` : `Have you worked ${ervaringWerk(ctx.functie, "en")} before, and if so, for how long?`, keuzes: [nl ? "Nog niet" : "Not yet"] };
    case "hotels": return { tekst: nl ? "Heb je al eens in een hotel gewerkt, en zo ja, in welk hotel?" : "Have you worked in a hotel before, and if so, which one?", keuzes: [nl ? "Nog niet" : "Not yet"] };
    case "sterren": return { tekst: nl ? "Hoeveel sterren had dat hotel ongeveer?" : "Roughly how many stars did that hotel have?", keuzes: t.sterrenKeuzes };
    case "restaurant": return { tekst: nl ? "Wat voor zaak was het, in een paar woorden?" : "What kind of place was it, in a few words?", keuzes: t.restaurantKeuzes };
    case "functievraag": return { tekst: nl ? "Wat deed je daar meestal tijdens een dienst?" : "What did you usually do there during a shift?" };
    case "specialisatie": return { tekst: nl ? "Wil je ook bij evenementen en banqueting werken?" : "Would you also like to work at events and banqueting?", keuzes: t.specialisatieKeuzes };
    case "diensten": return { tekst: nl ? "Hoeveel diensten per week passen ongeveer bij je?" : "Roughly how many shifts a week suit you?", keuzes: t.dienstenKeuzes };
    case "werkgebied": return { tekst: nl ? "Hoe ver wil je ongeveer reizen naar je werk?" : "Roughly how far do you want to travel to work?", keuzes: t.werkgebiedKeuzes };
    case "werkmoment": return { tekst: nl ? "Op welke momenten kun je meestal werken?" : "At what times can you usually work?", keuzes: t.werkmomentKeuzes };
    case "startdatum": return { tekst: nl ? "Vanaf wanneer zou je ongeveer kunnen beginnen?" : "Roughly when could you start?", keuzes: t.startdatumKeuzes };
    case "werkvorm": return { tekst: nl ? "Is dit voor jou een bijbaan naast iets anders, of je hoofdbaan?" : "Is this a side job next to something else, or your main job?", keuzes: t.werkvormKeuzes };
    case "talen": return { tekst: nl ? "In welke talen kun je je goed redden?" : "Which languages can you get by in?" };
    case "cv": return { tekst: nl ? "Heb je een cv dat je nu kunt sturen?" : "Do you have a CV you can send now?", keuzes: t.cvKeuzes };
    default: return null;
  }
}

// ─── Vergelijken ─────────────────────────────────────────────────────────────

/** Tekst zonder hoofdletters, leestekens en emoji, voor het vergelijken van berichten. */
export function normaal(t: string): string {
  return (t || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
/** De vraag in een bericht: de laatste zin met een vraagteken, of het hele bericht. */
export function vraagDeel(t: string): string {
  const zinnen = (t || "").split(/(?<=[.!?])\s+/);
  const v = [...zinnen].reverse().find((z) => z.includes("?"));
  return normaal(v || t);
}
/** Stelt het nieuwe bericht dezelfde vraag als het vorige, met dezelfde woorden? */
export function zelfdeVraag(nieuw: string, vorig: string): boolean {
  const n = vraagDeel(nieuw);
  return !!n && n === vraagDeel(vorig);
}

// ─── De bewaker ──────────────────────────────────────────────────────────────

export interface HerhaalInfo {
  /** Het laatste bericht dat Job stuurde (zoals bewaard). */
  laatsteVraag: string;
  /** De kandidaat stelde zelf een vraag en Job beantwoordde die: de open vraag terugstellen is dan geen herhaling. */
  kennis?: boolean;
  /** De doorvraag die Job deze beurt bewust stelt over hetzelfde veld, als die er is. */
  doorvraag?: string | null;
  /** Wat voor de vraag staat moet blijven (Job erkent frustratie). */
  behoudVoor?: boolean;
}

/** Verwerkt het bericht opnieuw met een bijgewerkte stand, zonder het antwoord nog eens te lezen. */
function opnieuw(state: JobState, ctx: JobContext, tekst: string, nu: Date): Resultaat {
  const leeg: Lezing = { velden: {}, taal: null, twijfel: null, ack: "", geenAntwoord: true };
  return verwerk(state, ctx, { tekst }, leeg, nu);
}

function samen(eerst: Resultaat, daarna: Resultaat): Resultaat {
  const acties: Actie[] = [...eerst.acties.filter((a) => a.soort !== "profiel"), ...daarna.acties.filter((a) => a.soort !== "profiel")];
  acties.push({ soort: "profiel", velden: daarna.state.velden });
  return { ...daarna, acties };
}

function metVoorvoegsel(r: Resultaat, voor: string): Resultaat {
  if (!r.berichten.length) return { ...r, berichten: [{ tekst: voor }] };
  const [eerste, ...rest] = r.berichten;
  return { ...r, berichten: [{ ...eerste, tekst: `${voor} ${eerste.tekst}` }, ...rest] };
}

/** Stuurvelden: geen antwoorden van de kandidaat. */
const STUUR = new Set(["pogingen", "doorvragen", "onbekend", "begrensd", "taalWissels", "andereTaal", "herinneringenUit", "bestandVraag",
  "cvAfronding", "cvVraag", "cvVragen", "verduidelijking", "specialisatieHint", "nlOfEn", "restaurantWerk"]);
const gelijk = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Heeft het bericht een ander veld aangevuld of verbeterd (een correctie of een antwoord op een latere vraag)? */
function anderVeldGewijzigd(o: Onderwerp, voor: JobVelden, na: JobVelden): boolean {
  const eigen = VELD_VAN_ONDERWERP[o];
  return Object.keys({ ...voor, ...na }).some((k) => !STUUR.has(k) && k !== eigen && !gelijk((voor as any)[k], (na as any)[k]));
}

/** Splitst een bericht in wat voor de vraag staat en de vraag zelf. */
function splitsVraag(t: string): { voor: string; vraag: string } {
  const zinnen = t.split(/(?<=[.!?])\s+/);
  const i = zinnen.map((z) => z.includes("?")).lastIndexOf(true);
  if (i < 0) return { voor: "", vraag: t };
  return { voor: zinnen.slice(0, i).join(" ").trim(), vraag: zinnen.slice(i).join(" ").trim() };
}

/**
 * De laatste stap na elk bericht tijdens de vragen. `voor` is de stand voor het bericht,
 * `na` het resultaat van de regels. Geeft een resultaat waarin de vraag niet herhaald wordt.
 */
export function zonderHerhaling(voor: JobState, na: Resultaat, ctx: JobContext, tekst: string, nu: Date, info: HerhaalInfo): Resultaat {
  const o = voor.laatsteOnderwerp;
  if (!o || !BEZIG.includes(voor.status)) return na;
  if (herkenCommando(tekst, o) || na.state.taal !== voor.taal) return na;
  if (!["bezig", "wacht_cv"].includes(na.state.status) || na.state.laatsteOnderwerp !== o || !na.berichten.length) return na;

  // Job stelt dezelfde vraag (of een doorvraag over hetzelfde veld) opnieuw.
  const taal = na.state.taal;
  const onbekendVerder = taal === "en" ? "No problem, we'll go through that at the meeting." : "Geen probleem, dat bespreken we bij de kennismaking.";
  const state: JobState = { ...na.state, velden: { ...na.state.velden }, twijfels: [...na.state.twijfels] };
  const gevuld = veldGevuld(o, state.velden);
  const keer = state.velden.pogingen?.[o] || 0;
  const berichten = na.berichten.map((b) => ({ ...b }));
  const laatste = berichten[berichten.length - 1];
  const identiek = normaal(laatste.tekst) === normaal(info.laatsteVraag);
  const anderVeld = anderVeldGewijzigd(o, voor.velden, state.velden);

  // Geen herhaling: Job beantwoordde een vraag van de kandidaat, of het bericht vulde iets anders aan.
  // Alleen als het bericht niet woord voor woord hetzelfde is als het vorige, en hooguit drie keer
  // achter elkaar: ook een gesprek vol eigen vragen of correcties komt zo altijd verder.
  if ((info.kennis || anderVeld) && !identiek && keer < MAX_VRIJ) {
    const s2: JobState = { ...state, velden: { ...state.velden, pogingen: { ...(state.velden.pogingen || {}), [o]: keer + 1 } } };
    return { ...na, state: s2, acties: [...na.acties.filter((a) => a.soort !== "profiel"), { soort: "profiel", velden: s2.velden }] };
  }

  const verder = (s: JobState, voorvoegsel?: string): Resultaat => {
    let r = samen(na, opnieuw(s, ctx, tekst, nu));
    // Vangnet: staat dezelfde vraag er nog steeds (zou niet mogen), dan onbekend en nog één keer.
    if (r.state.laatsteOnderwerp === o && ["bezig", "wacht_cv"].includes(r.state.status)) {
      const s2: JobState = { ...r.state, velden: { ...r.state.velden } };
      maakOnbekend(s2.velden, o);
      r = samen(na, opnieuw(s2, ctx, tekst, nu));
    }
    return voorvoegsel ? metVoorvoegsel(r, voorvoegsel) : r;
  };

  if (!gevuld && !info.kennis) {
    // 1. Duidelijk nee of niet van toepassing: de vraag is beantwoord.
    const nee = ontkenning(o, tekst);
    if (nee) {
      state.velden = { ...state.velden, ...nee };
      if (nee.geenHotel && (ctx.functie === "chef" || ctx.functie === "horecamedewerker") && /\b(restaurants?|brasserie|bistro|eetcaf[eé]|pizzeria|trattoria)\b/i.test(tekst)) state.velden.restaurantWerk = true;
      return verder(state);
    }
    // 2. Weet het niet: onbekend, de kennismaking vult het aan.
    if (weetNiet(tekst)) {
      maakOnbekend(state.velden, o);
      return verder(state, onbekendVerder);
    }
  }

  // 3. Al een keer opnieuw gevraagd, of een vraag die niet anders gesteld wordt: onbekend (als het veld leeg is) en verder.
  if (keer >= 1 || (GEEN_HERKANSING.includes(o) && !gevuld) || ((info.kennis || anderVeld) && keer >= MAX_VRIJ)) {
    if (!gevuld) maakOnbekend(state.velden, o);
    return verder(state, gevuld ? undefined : onbekendVerder);
  }

  // 4. De eerste keer opnieuw: tellen, en altijd met andere woorden.
  state.velden.pogingen = { ...(state.velden.pogingen || {}), [o]: 1 };
  const standaard = vraag(o, taal, ctx, state.velden).tekst;
  const isDoorvraag = !!info.doorvraag && laatste.tekst === info.doorvraag;
  const nieuweWoorden = !zelfdeVraag(laatste.tekst, info.laatsteVraag) && (isDoorvraag || !zelfdeVraag(laatste.tekst, standaard));
  if (!nieuweWoorden) {
    const h = herkansing(o, taal, ctx);
    if (!h || zelfdeVraag(h.tekst, info.laatsteVraag)) {
      if (!gevuld) maakOnbekend(state.velden, o);
      return verder(state, gevuld ? undefined : onbekendVerder);
    }
    // Wat de regels ervoor zetten (een bevestiging van een correctie) blijft; een losse reactie van de AI niet.
    const voorTekst = anderVeld || info.behoudVoor ? splitsVraag(laatste.tekst).voor : "";
    berichten[berichten.length - 1] = { ...h, tekst: [voorTekst || ANDERS[taal], h.tekst].join(" ") };
  }
  return { ...na, state, berichten, acties: [...na.acties.filter((a) => a.soort !== "profiel"), { soort: "profiel", velden: state.velden }] };
}

// ─── Nooit twee keer hetzelfde bericht ───────────────────────────────────────

/**
 * Na de vragen (cv, collega, plannen): stuurt Job hetzelfde bericht als de vorige keer,
 * dan een korte andere versie. Zo wisselen ze af en komt hetzelfde bericht nooit twee keer achter elkaar.
 */
export function geenDubbelBericht(berichten: Uitgaand[], laatsteVraag: string, taal: JobTaal): Uitgaand[] {
  if (!berichten.length || !laatsteVraag) return berichten;
  const t = teksten(taal);
  const nl = taal === "nl";
  const VARIANT: [string, string][] = [
    [t.wachtPlanner, nl ? "Je bericht staat genoteerd; een collega leest het en neemt contact met je op." : "Your message is noted; a colleague will read it and get in touch."],
    [t.cvControleWacht, nl ? "Je cv ligt bij een collega. Liever iemand spreken? Typ MENS." : "Your CV is with a colleague. Rather talk to someone? Type HUMAN."],
    [t.plannenNogmaals, nl ? "Kies een moment uit de lijst. Lukt dat niet? Typ MENS." : "Pick a moment from the list. Doesn't work? Type HUMAN."],
    [t.cvLater, nl ? "Je kunt je cv sturen zodra je het hebt, als pdf of Word-bestand." : "You can send your CV as soon as you have it, as a PDF or Word file."],
    [t.cvUpload, nl ? "Je cv kun je hier sturen als pdf of Word-bestand." : "You can send your CV here as a PDF or Word file."],
    [t.welkomTerug, nl ? "Wil je verder met je aanmelding?" : "Do you want to continue with your application?"],
  ];
  const uit = berichten.map((b) => ({ ...b }));
  const laatste = uit[uit.length - 1];
  if (normaal(laatste.tekst) !== normaal(laatsteVraag)) return uit;
  for (const [a, b] of VARIANT) {
    if (laatste.tekst === a) { laatste.tekst = b; return uit; }
    if (laatste.tekst === b) { laatste.tekst = a; return uit; }
  }
  return uit;
}

