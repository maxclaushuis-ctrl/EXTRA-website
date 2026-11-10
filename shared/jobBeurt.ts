/**
 * Job 4: één beurt per bericht van de kandidaat.
 *
 * De AI leest het bericht in de context van het gesprek en zegt in één keer wat het is
 * (antwoord, eigen vraag, correctie, verwarring, frustratie, bedankje...), welke velden
 * het antwoord echt draagt (met letterlijk citaat), en stelt een korte reactie en de
 * volgende vraag voor. Deze module controleert dat allemaal voordat er iets wordt
 * opgeslagen of verstuurd: de vaste regels bepalen welke gegevens nodig zijn en welke
 * vraag aan de beurt is, de kennisbank bepaalt welke feiten Job mag noemen.
 * Puur, getest in shared/jobBeurt.test.ts.
 */
import type { JobTaal, JobVelden, Lezing, Onderwerp, Uitgaand } from "./jobRegels";
import { DOORVRAAG_VOOR, KAN_VERVALLEN } from "./jobRegels";
import { bewijsCheck, herformuleringGoed, valideerLezing } from "./jobLezen";
import { kennis, ONBEKENDE_VRAAG, type KennisSleutel } from "./jobKennis";
import { taalTelling } from "./jobTaal";

export const SOORTEN = ["antwoord", "correctie", "vraag", "hulp", "verwarring", "frustratie", "bedankje", "onduidelijk", "andere_taal", "mens", "stop", "grens"] as const;
export type Soort = typeof SOORTEN[number];

export interface Beurt {
  soorten: Soort[];
  velden: JobVelden;
  /** De open vraag is niet duidelijk genoeg beantwoord: Job vraagt gericht door (dit veld). */
  doorvragen: Onderwerp | null;
  /** De kandidaat vraagt iets: het onderwerp uit de kennisbank, of "onbekend". */
  kennis: KennisSleutel | "onbekend" | null;
  /** Korte samenvatting van de vraag van de kandidaat, voor een collega. */
  vraagKandidaat: string | null;
  grens: { regel: "G1" | "G2" | "G3" | "G4"; bewijs: string } | null;
  taal: JobTaal | "anders" | null;
  twijfel: string | null;
  nvt: Onderwerp[];
  /** Een korte reactie op wat de kandidaat zei (hooguit één zin, geen vraag); mag leeg. */
  reactie: string;
  /** De volgende vraag zoals de AI hem zou stellen (één zin, één vraagteken). */
  vraag: string;
  /** Voor welk veld die vraag is, of "klaar". */
  volgende: Onderwerp | "klaar" | null;
}

const tekst = (w: unknown, max: number) => (typeof w === "string" ? w.trim().slice(0, max) : "");
const schoon = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Velden die een antwoord kan dragen, en de vraag waar ze bij horen. */
const VELD_ONDERWERP: Partial<Record<keyof JobVelden, Onderwerp>> = {
  ervaring: "ervaring", functievraag: "functievraag", hotels: "hotels", sterren: "sterren", restaurantSoort: "restaurant",
  diensten: "diensten", werkgebied: "werkgebied", werkmoment: "werkmoment", startdatum: "startdatum", werkvorm: "werkvorm",
  werkautorisatie: "werkautorisatie", geldigTot: "geldigheid", specialisatie: "specialisatie", cvParaat: "cv",
};

/**
 * Controleert wat de AI teruggeeft. Onbekende soorten en velden vallen weg; een veld blijft
 * alleen als het citaat echt in het bericht staat (of het is het antwoord op de eigen vraag);
 * is het bericht geen antwoord en geen correctie, dan wordt er niets opgeslagen.
 */
export function valideerBeurt(ruw: any, bericht: string, onderwerp: Onderwerp | null): Beurt {
  const soorten = (Array.isArray(ruw?.soort) ? ruw.soort : [ruw?.soort]).filter((s: unknown): s is Soort => (SOORTEN as readonly string[]).includes(s as string));
  const l = valideerLezing({ velden: ruw?.velden || {}, taal: ruw?.taal, twijfel: ruw?.twijfel, nvt: ruw?.nvt });
  let velden: JobVelden = bewijsCheck(l.velden, ruw?.bewijs, bericht, onderwerp);
  // Een citaat moet ook echt iets met dat veld te maken hebben: een vraag of klacht is nooit ervaring of een hotelnaam.
  const draagt = soorten.includes("antwoord") || soorten.includes("correctie");
  if (!draagt) velden = {};
  // Restaurantsoort (vrije tekst bij de restaurantvraag)
  const rs = tekst(ruw?.velden?.restaurantSoort, 100);
  if (draagt && rs && onderwerp === "restaurant") velden.restaurantSoort = rs;
  const dv = ruw?.doorvragen;
  const doorvragen = (DOORVRAAG_VOOR as string[]).includes(dv) ? dv as Onderwerp : null;
  const k = tekst(ruw?.kennis, 40);
  const kennisSleutel = k === "onbekend" ? "onbekend" : kennis(k) ? (k as KennisSleutel) : null;
  const g = ruw?.grens;
  const grens = g && ["G1", "G2", "G3", "G4"].includes(g.regel) && tekst(g.bewijs, 300) && schoon(bericht).includes(schoon(tekst(g.bewijs, 300)))
    ? { regel: g.regel, bewijs: tekst(g.bewijs, 300) } : null;
  const nvt = (Array.isArray(ruw?.nvt) ? ruw.nvt : []).filter((o: unknown): o is Onderwerp => (KAN_VERVALLEN as string[]).includes(o as string));
  const volg = ruw?.volgende;
  return {
    soorten: soorten.length ? soorten : ["onduidelijk"],
    velden,
    doorvragen,
    kennis: soorten.includes("vraag") ? kennisSleutel ?? "onbekend" : null,
    vraagKandidaat: tekst(ruw?.vraagKandidaat, 200) || null,
    grens: soorten.includes("grens") ? grens : null,
    taal: l.taal,
    twijfel: l.twijfel,
    nvt: draagt ? nvt : [],
    reactie: tekst(ruw?.reactie, 240),
    vraag: tekst(ruw?.vraag, 240),
    volgende: volg === "klaar" ? "klaar" : typeof volg === "string" && volg ? (volg as Onderwerp) : null,
  };
}

/** Geeft de beurt aan de vaste regels door als lezing (verwerk in jobRegels.ts). */
export function alsLezing(b: Beurt): Lezing {
  const antwoord = b.soorten.includes("antwoord") || b.soorten.includes("correctie");
  return {
    velden: b.velden,
    taal: b.taal,
    twijfel: b.twijfel,
    ack: "",
    ...(b.nvt.length ? { nvt: b.nvt } : {}),
    ...(b.soorten.includes("correctie") ? { correctie: true } : {}),
    ...(!antwoord && !b.soorten.includes("andere_taal") ? { geenAntwoord: true } : {}),
  };
}

// ─── Controle vóór verzending ────────────────────────────────────────────────

const STANDAARD_OPENERS = /^(top|fantastisch|super|geweldig|perfect|mooi zo|prima|fijn|great|awesome|perfect|fantastic|wonderful|excellent)\b[!,. ]/i;
const BELOFTE = /https?:|www\.|aangenomen|garantie|gegarandeerd|beloof|zeker weten|\bje krijgt\b|€|\beuro\b|\d+[.,]\d{2}|per uur|hired|guarantee|promise|you will get|per hour/i;

function zinnen(t: string): number {
  return t.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9])/).filter((z) => z.trim()).length;
}

/** Klopt de taal van een zin met de gesprekstaal? Een duidelijke zin in de andere taal mag niet. */
function taalKlopt(t: string, taal: JobTaal): boolean {
  const c = taalTelling(t);
  const eigen = taal === "nl" ? c.nl : c.en;
  const ander = taal === "nl" ? c.en : c.nl;
  return !(ander >= 2 && ander > eigen);
}

/** De reactie: hooguit één zin, geen vraag, geen standaardopener, geen belofte, link of bedrag, in de gesprekstaal. */
export function reactieGoed(t: string, taal: JobTaal): boolean {
  const r = t.trim();
  if (!r) return false;
  if (r.length > 200 || r.includes("?") || zinnen(r) > 1) return false;
  if (STANDAARD_OPENERS.test(r + " ") || BELOFTE.test(r)) return false;
  return taalKlopt(r, taal);
}

/** Vragen die altijd letterlijk blijven (wettelijk of met een vaste uitleg). */
export const LETTERLIJK: Onderwerp[] = ["werkautorisatie", "geldigheid", "cv"];

/** De vraag: één zin met één vraagteken, gaat aantoonbaar over het veld dat aan de beurt is. */
export function vraagGoed(t: string, onderwerp: Onderwerp, taal: JobTaal): boolean {
  const v = t.trim();
  if (LETTERLIJK.includes(onderwerp)) return false;
  if (!v.endsWith("?") || (v.match(/\?/g) || []).length !== 1 || zinnen(v) > 1 || v.split(/\s+/).length > 30) return false;
  if (BELOFTE.test(v) || STANDAARD_OPENERS.test(v + " ")) return false;
  return herformuleringGoed(onderwerp, v) && taalKlopt(v, taal);
}

export interface Samenstelling {
  berichten: Uitgaand[];
  /** Wat er van de AI is gebruikt, voor de log en de tests. */
  gebruikt: { reactie: boolean; vraag: boolean; kennis: KennisSleutel | "onbekend" | null };
}

/**
 * Maakt het bericht dat Job verstuurt: de berichten die de vaste regels kozen, met
 * vooraan het antwoord op de vraag van de kandidaat (uit de kennisbank) of een korte
 * reactie, en de vraag in de woorden van de AI als die door de controle komt.
 * Hooguit twee zinnen en één vraag als Job verder vraagt.
 */
export function stelSamen(i: {
  beurt: Beurt | null;
  regels: Uitgaand[];
  /** Het veld dat de regels nu vragen (laatsteOnderwerp na verwerken), of null als Job niet vraagt. */
  onderwerp: Onderwerp | null;
  /** De standaardtekst van die vraag. */
  standaard: string | null;
  taal: JobTaal;
}): Samenstelling {
  const b = i.beurt;
  const gebruikt: Samenstelling["gebruikt"] = { reactie: false, vraag: false, kennis: null };
  const berichten = i.regels.map((x) => ({ ...x }));
  if (!b) return { berichten, gebruikt };

  // 1. Het voorvoegsel: eerst een antwoord op de vraag van de kandidaat, anders een reactie.
  let voor = "";
  if (b.kennis) {
    const k = b.kennis === "onbekend" ? null : kennis(b.kennis);
    voor = k ? k[i.taal] : ONBEKENDE_VRAAG[i.taal];
    gebruikt.kennis = b.kennis;
  } else if (reactieGoed(b.reactie, i.taal)) {
    voor = b.reactie;
    gebruikt.reactie = true;
  }

  // 2. De vraag: alleen vervangen als de AI hetzelfde veld bedoelt en de vraag door de controle komt.
  const laatste = berichten[berichten.length - 1];
  const isVraag = !!laatste && !!i.onderwerp && !!i.standaard && laatste.tekst === i.standaard;
  // Een doorvraag van de AI staat al als vraag in de berichten (de regels namen hem over).
  const isDoorvraag = !!laatste && !!b.vraag && laatste.tekst === b.vraag.trim();
  if (isVraag && b.volgende === i.onderwerp && vraagGoed(b.vraag, i.onderwerp!, i.taal)) {
    laatste.tekst = b.vraag;
    gebruikt.vraag = true;
  }

  // 3. Voorvoegsel alleen als het eerste bericht nog geen eigen reactie van de regels heeft.
  if (voor) {
    const eerste = berichten[0];
    if (!eerste) berichten.push({ tekst: voor });
    else if (berichten.length === 1 && (isVraag || isDoorvraag)) eerste.tekst = `${voor} ${eerste.tekst}`;
    else if (gebruikt.kennis) berichten.unshift({ tekst: voor });
    else gebruikt.reactie = false;
  }
  return { berichten, gebruikt };
}

/** Controle per bericht van Job, voor de tests en de log: kort, één vraag, geen standaardopener. */
export function berichtControle(t: string, taal: JobTaal): string[] {
  const fouten: string[] = [];
  if (zinnen(t) > 3) fouten.push("meer dan drie zinnen");
  if ((t.match(/\?/g) || []).length > 1) fouten.push("meer dan één vraag");
  if (STANDAARD_OPENERS.test(t.trim() + " ")) fouten.push("standaardopener");
  if (/https?:|www\./i.test(t) && !/\/j\/|picard|doehetextra/i.test(t)) fouten.push("onbekende link");
  if (!taalKlopt(t, taal)) fouten.push("verkeerde taal");
  return fouten;
}
