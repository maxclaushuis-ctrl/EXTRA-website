/**
 * Job: antwoorden van de kandidaat uitlezen, zonder AI.
 *
 * Twee taken, allebei puur en getest (shared/jobLezen.test.ts):
 *
 * 1. `valideerLezing`: controleert wat de AI teruggeeft. Alleen bekende velden
 *    met toegestane waarden komen erdoor; de rest wordt weggegooid. Zo kan een
 *    verkeerd AI-antwoord nooit een status of besluit forceren.
 * 2. `reserveLezing`: als de AI niet bereikbaar is (geen sleutel, storing, of in
 *    de testomgeving zonder AI) leest Job het antwoord met eenvoudige regels.
 *    Grover dan de AI, maar het gesprek loopt altijd door.
 */
import type { Diensten, JobTaal, JobVelden, Lezing, Onderwerp, Werkautorisatie } from "./jobRegels";
import { DOORVRAAG_VOOR, KAN_VERVALLEN } from "./jobRegels";

const DIENSTEN: Diensten[] = ["1-2", "3-4", "5+"];
const AUTORISATIE: Werkautorisatie[] = ["vrij", "twv", "onbekend", "anders"];

function tekstOf(w: unknown, max = 600): string | undefined {
  if (typeof w !== "string") return undefined;
  const s = w.trim();
  return s ? s.slice(0, max) : undefined;
}

/** Laat alleen bekende velden met geldige waarden door. */
export function valideerLezing(ruw: any): Lezing {
  const v = (ruw && typeof ruw === "object" ? ruw.velden : null) || {};
  const velden: JobVelden = {};
  const ervaring = tekstOf(v.ervaring, 1000); if (ervaring) velden.ervaring = ervaring;
  if (["geen", "starter", "ervaren"].includes(v.ervaringNiveau)) velden.ervaringNiveau = v.ervaringNiveau;
  const fv = tekstOf(v.functievraag); if (fv) velden.functievraag = fv;
  if (v.specialisatieHint === true) velden.specialisatieHint = true;
  if (v.specialisatie === "ja" || v.specialisatie === "nee") velden.specialisatie = v.specialisatie;
  if (AUTORISATIE.includes(v.werkautorisatie)) velden.werkautorisatie = v.werkautorisatie;
  const geldig = tekstOf(v.geldigTot, 100); if (geldig) velden.geldigTot = geldig;
  if (DIENSTEN.includes(v.diensten)) velden.diensten = v.diensten;
  const gebied = tekstOf(v.werkgebied, 200); if (gebied) velden.werkgebied = gebied;
  const vervoer = tekstOf(v.vervoer, 100); if (vervoer) velden.vervoer = vervoer;
  const talen = tekstOf(v.talen, 300); if (talen) velden.talen = talen;
  if (["doordeweeks", "avond_weekend", "flexibel"].includes(v.werkmoment)) velden.werkmoment = v.werkmoment;
  const hotels = tekstOf(v.hotels, 300); if (hotels) velden.hotels = hotels;
  if (["3", "4", "5"].includes(String(v.sterren))) velden.sterren = String(v.sterren) as JobVelden["sterren"];
  if (["direct", "twee_weken", "later"].includes(v.startdatum)) velden.startdatum = v.startdatum;
  if (["studie", "ander_werk", "hoofdbaan"].includes(v.werkvorm)) velden.werkvorm = v.werkvorm;
  if (v.nlOfEn === true || v.nlOfEn === false) velden.nlOfEn = v.nlOfEn;
  if (v.cvParaat === "ja" || v.cvParaat === "nee") velden.cvParaat = v.cvParaat;
  const zoekt = tekstOf(v.zoekt, 200); if (zoekt) velden.zoekt = zoekt;

  const taal = ruw?.taal === "nl" || ruw?.taal === "en" || ruw?.taal === "anders" ? ruw.taal : null;
  const twijfel = tekstOf(ruw?.twijfel, 300) || null;
  // Een bevestiging is hooguit één korte zin, zonder vraag (de vraag stelt Job zelf).
  let ack = tekstOf(ruw?.ack, 120) || "";
  // Geen vraag in de reactie en geen standaardzinnetje dat elke keer terugkomt.
  if (ack.includes("?") || /^(mooi|top|super|fijn|oké|ok|bedankt)[,!. ]*(dank je|bedankt|dankjewel)?[!. ]*$/i.test(ack.trim())) ack = "";
  const vv = tekstOf(ruw?.vervolgvraag, 200) || "";
  const vervolgvraag = vv.trim().endsWith("?") ? vv.trim() : undefined;
  // Fase 2: een doorvraag is één korte vraag voor een bekend invulveld.
  const dvTekst = tekstOf(ruw?.doorvraag?.tekst, 220) || "";
  const dvVoor = ruw?.doorvraag?.voor;
  const doorvraag = dvTekst.endsWith("?") && (DOORVRAAG_VOOR as string[]).includes(dvVoor) && (dvTekst.match(/\?/g) || []).length <= 2
    ? { tekst: dvTekst, voor: dvVoor as Onderwerp } : undefined;
  const nvt = (Array.isArray(ruw?.nvt) ? ruw.nvt : []).filter((o: unknown) => (KAN_VERVALLEN as string[]).includes(o as string)) as Onderwerp[];
  return { velden, taal, twijfel, ack, ...(vervolgvraag ? { vervolgvraag } : {}), ...(doorvraag ? { doorvraag } : {}), ...(nvt.length ? { nvt } : {}) };
}

// ─── Fase 2: bewijscheck ─────────────────────────────────────────────────────

/** Welk veld hoort bij welke vraag; een veld zonder bewijs telt alleen als antwoord op zijn eigen vraag. */
const VELD_VAN: Partial<Record<keyof JobVelden, Onderwerp>> = {
  ervaring: "ervaring", ervaringNiveau: "ervaring", functievraag: "functievraag", hotels: "hotels", sterren: "sterren",
  diensten: "diensten", werkgebied: "werkgebied", werkmoment: "werkmoment", startdatum: "startdatum", werkvorm: "werkvorm",
  werkautorisatie: "werkautorisatie", geldigTot: "geldigheid", specialisatie: "specialisatie", cvParaat: "cv",
};
const schoon = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Laat alleen velden door die het antwoord echt draagt: met een citaat dat in het antwoord staat,
 * of als antwoord op hun eigen vraag. Zo vult de AI geen velden in op basis van een bijzin of een gok.
 */
export function bewijsCheck(velden: JobVelden, bewijs: unknown, antwoord: string, onderwerp: Onderwerp | null): JobVelden {
  const b = bewijs && typeof bewijs === "object" ? (bewijs as Record<string, unknown>) : {};
  const tekst = schoon(antwoord);
  const uit: JobVelden = {};
  for (const [k, w] of Object.entries(velden) as [keyof JobVelden, unknown][]) {
    const eigen = VELD_VAN[k];
    const citaat = typeof b[k] === "string" ? schoon(String(b[k])) : "";
    const gedragen = citaat.length >= 2 && tekst.includes(citaat);
    // Met citaat: alleen als het citaat echt in het antwoord staat. Zonder citaat: alleen als antwoord op de eigen vraag.
    if (citaat ? gedragen : !eigen || eigen === onderwerp) (uit as any)[k] = w;
  }
  return uit;
}

// ─── Reserve: regels zonder AI ───────────────────────────────────────────────

const ENGELS = /\b(i|i'm|im|my|the|and|have|worked|work|yes|no|years?|hotel|in a|don't|dont|speak|english|thanks|hello|hi there)\b/i;
const NEDERLANDS = /\b(ik|heb|het|een|de|en|niet|ja|nee|jaar|gewerkt|werk|bij|spreek|nederlands|dank|hoi|hallo)\b/i;

export function raadTaal(tekst: string): JobTaal | null {
  const en = (tekst.match(new RegExp(ENGELS.source, "gi")) || []).length;
  const nl = (tekst.match(new RegExp(NEDERLANDS.source, "gi")) || []).length;
  if (en === 0 && nl === 0) return null;
  return en > nl ? "en" : "nl";
}

const JA = /^(ja|yes|yep|jazeker|zeker|graag|ja graag|ja, graag|yes please|yes, please|klopt|ok|oké|okay|prima|goed)\b/i;
const NEE = /^(nee|no|nope|liever niet|rather not|niet|geen)\b/i;

function diensten(s: string): Diensten | undefined {
  const t = s.toLowerCase();
  if (/(5|vijf|five|6|zes|six|7|fulltime|full time|full-time|elke dag|every day)/.test(t) && !/1 tot 2|1 to 2/.test(t)) return "5+";
  if (/(3|4|drie|vier|three|four)/.test(t)) return "3-4";
  if (/(1|2|een|één|twee|one|two|weekend)/.test(t)) return "1-2";
  return undefined;
}

function werkgebied(s: string): string | undefined {
  const km = s.match(/(\d{2})\s*(km|kilometer)/i) || s.match(/\b(25|35|50)\b/);
  if (km) return `tot ${km[1]} km`;
  return undefined;
}

function autorisatie(s: string): Werkautorisatie {
  const t = s.toLowerCase();
  if (/(weet ik niet|weet niet|geen idee|don't know|dont know|not sure|no idea|onbekend)/.test(t)) return "onbekend";
  if (/(niet toegestaan|not allowed|not permitted|mag niet werken|cannot work|can't work)/.test(t)) return "twv";
  if (/(niet vereist|niet nodig|not required|not needed|vrij|toegestaan|free|freely|permitted|allowed|mag werken|can work)/.test(t)) return "vrij";
  if (/(twv|vereist|required|nodig|needed|work permit)/.test(t)) return "twv";
  return "anders";
}

const TALEN_NL_EN = /(nederlands|dutch|engels|english)/i;

/** Sterren van het beste hotel, uit een knop of een eigen antwoord. Bij twijfel de hoogste. */
export function sterren(s: string): JobVelden["sterren"] {
  const t = s.toLowerCase();
  if (/\b5\b|vijf|five/.test(t)) return "5";
  if (/\b4\b|vier|four/.test(t)) return "4";
  if (/\b[0-3]\b|drie|twee|een ster|three|two|one star|minder|fewer|less|hostel/.test(t)) return "3";
  return undefined;
}

/** Wanneer iemand kan werken, uit een knop of een eigen antwoord. */
export function werkmoment(s: string): JobVelden["werkmoment"] {
  const t = s.toLowerCase();
  if (/wanneer nodig|altijd|flexibel|maakt niet uit|whenever|any ?time|always|flexible|alles/.test(t)) return "flexibel";
  if (/avond|weekend|evening|nacht|night/.test(t)) return "avond_weekend";
  if (/doordeweeks|weekdag|weekday|overdag|daytime|maandag tot vrijdag|monday to friday/.test(t)) return "doordeweeks";
  return undefined;
}

/** Naast studie, naast ander werk of als hoofdbaan, uit een knop of een eigen antwoord. */
export function werkvorm(s: string): JobVelden["werkvorm"] {
  const t = s.toLowerCase();
  if (/studie|studeer|student|school|study|studies|studying|universiteit|university|hbo|mbo|college/.test(t)) return "studie";
  if (/hoofdbaan|fulltime|full-time|full time|voltijd|main job|alleen dit|only this/.test(t)) return "hoofdbaan";
  if (/ander werk|andere baan|naast mijn werk|other job|another job|second job|bijbaan|parttime|part-time/.test(t)) return "ander_werk";
  return undefined;
}

/** Wanneer iemand kan beginnen, uit een knop of een eigen antwoord. */
export function startdatum(s: string): JobVelden["startdatum"] {
  const t = s.toLowerCase();
  if (/binnen 2 weken|binnen twee weken|within 2 weeks|within two weeks|volgende week|next week|2 weken|two weeks/.test(t)) return "twee_weken";
  if (/^later$|over een maand|volgende maand|next month|in a month|na de zomer|later/.test(t)) return "later";
  if (/direct|meteen|nu\b|asap|zo snel mogelijk|right away|immediately|now|morgen|tomorrow|vandaag|today/.test(t)) return "direct";
  return undefined;
}

/**
 * Leest één antwoord met eenvoudige regels. Bewust voorzichtig: bij twijfel
 * laat de reserve een veld leeg (dan vraagt Job het nog eens) in plaats van
 * iets te verzinnen. De reserve zegt nooit dat iemand geen Nederlands of
 * Engels spreekt: wie in het Nederlands of Engels chat, spreekt het.
 */
export function reserveLezing(tekst: string, onderwerp: Onderwerp | null): Lezing {
  const s = (tekst || "").trim();
  const velden: JobVelden = {};
  const taal = raadTaal(s);
  if (!s) return { velden, taal, twijfel: null, ack: "" };

  switch (onderwerp) {
    case "ervaring":
      velden.ervaring = s.slice(0, 1000);
      velden.ervaringNiveau = /^(nee|no|nooit|never|geen|none|0|nul|zero)\b|geen ervaring|no experience|nog nooit|never worked|\b(0|nul|geen) jaar|zero years|0 years/i.test(s) ? "geen" : "ervaren";
      if (/(bruiloft|evenement|event|banquet|banqueting|catering|feest|festival|congres)/i.test(s)) velden.specialisatieHint = true;
      break;
    case "functievraag":
      velden.functievraag = s.slice(0, 600);
      break;
    case "specialisatie":
      if (JA.test(s)) velden.specialisatie = "ja";
      else if (NEE.test(s)) velden.specialisatie = "nee";
      break;
    case "werkautorisatie":
      velden.werkautorisatie = autorisatie(s);
      break;
    case "geldigheid":
      velden.geldigTot = s.slice(0, 100);
      break;
    case "diensten": {
      const d = diensten(s);
      if (d) velden.diensten = d;
      break;
    }
    case "werkgebied":
      velden.werkgebied = werkgebied(s) || s.slice(0, 200);
      break;
    case "hotels":
      velden.hotels = s.slice(0, 300);
      break;
    case "restaurant":
      velden.restaurantSoort = s.slice(0, 100);
      break;
    case "sterren": {
      const st = sterren(s);
      if (st) velden.sterren = st;
      break;
    }
    case "werkmoment": {
      const w = werkmoment(s);
      if (w) velden.werkmoment = w;
      break;
    }
    case "werkvorm": {
      const w = werkvorm(s);
      if (w) velden.werkvorm = w;
      break;
    }
    case "startdatum": {
      const d = startdatum(s);
      if (d) velden.startdatum = d;
      break;
    }
    case "talen":
      velden.talen = s.slice(0, 300);
      if (TALEN_NL_EN.test(s)) velden.nlOfEn = true;
      break;
    case "cv":
      if (JA.test(s)) velden.cvParaat = "ja";
      else if (NEE.test(s)) velden.cvParaat = "nee";
      break;
  }

  // Wat er verder nog in het antwoord staat (één rijk antwoord vult meer velden, C4).
  if (onderwerp !== "diensten" && /(per week|diensten|dagen per week|days a week|shifts)/i.test(s)) {
    const d = diensten(s.match(/[^.]*?(per week|diensten|dagen per week|days a week|shifts)[^.]*/i)?.[0] || "");
    if (d) velden.diensten = d;
  }
  if (onderwerp !== "werkgebied") {
    const g = werkgebied(s);
    if (g && /km|kilometer/i.test(s)) velden.werkgebied = g;
  }
  if (/\b(fiets|bike|bicycle|scooter|auto|car|ov|metro|tram|trein|train)\b/i.test(s)) {
    velden.vervoer = (s.match(/\b(fiets|bike|bicycle|scooter|auto|car|ov|metro|tram|trein|train)\b/i) || [""])[0].toLowerCase();
  }
  return { velden, taal, twijfel: null, ack: "" };
}
