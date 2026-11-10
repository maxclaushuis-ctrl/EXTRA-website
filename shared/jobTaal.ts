/**
 * De taal van Job: in welke taal hij begint en wanneer hij wisselt.
 *
 * Starttaal (akkoord Max, 10 nov 2026):
 *   paspoort of ID-kaart  | nummer +31                  | buitenlands nummer
 *   Nederlands            | nl                          | nl
 *   ander EU of buiten EU | taal van het formulier      | en
 *   niet bekend           | nl                          | en
 * "+31" is een instelbare lijst (Secret JOB_NL_LANDCODES, standaard 31).
 *
 * Wisselen tijdens het gesprek:
 *   - alleen bij een duidelijke zin in de andere taal van minstens drie woorden;
 *   - niet bij korte of neutrale antwoorden (ok, ja, een naam, een getal, een plaats, een knop);
 *   - hooguit één automatische wissel per gesprek (ENGLISH of NEDERLANDS typen kan altijd);
 *   - een andere taal (Pools, Spaans): Job antwoordt in het Engels en zegt dat hij
 *     Nederlands en Engels spreekt.
 * Puur, getest in shared/jobTaal.test.ts.
 */
export type Taal = "nl" | "en";

/** Telefoonnummer naar E.164 met plus: 06 wordt +316, 0031 wordt +31, spaties en streepjes eruit. Ongeldig: null. */
export function e164(invoer: string | null | undefined): string | null {
  if (!invoer) return null;
  const ruw = String(invoer).trim();
  if (!ruw) return null;
  // "++31..." (dubbel plusteken) komt voor; het blijft een internationaal nummer.
  const plus = /^\+/.test(ruw);
  let cijfers = ruw.replace(/\D+/g, "");
  if (!cijfers) return null;
  let internationaal = plus;
  if (!internationaal && cijfers.startsWith("00")) { internationaal = true; cijfers = cijfers.slice(2); }
  if (!internationaal) {
    if (cijfers.startsWith("0")) cijfers = "31" + cijfers.slice(1);
    else if (cijfers.length < 9) return null;
    else if (!cijfers.startsWith("31") && cijfers.length <= 9) cijfers = "31" + cijfers;
  }
  if (cijfers.length < 8 || cijfers.length > 15) return null;
  return "+" + cijfers;
}

/** De landnummers waarbij Job in het Nederlands begint (zonder plus), uit "31" of "31, 32". */
export function landcodes(waarde: string | null | undefined): string[] {
  const l = String(waarde || "").split(/[\s,;]+/).map((x) => x.replace(/\D/g, "")).filter(Boolean);
  return l.length ? l : ["31"];
}

export function nlNummer(nummer: string | null | undefined, codes: string[]): boolean | null {
  const n = e164(nummer);
  if (!n) return null;
  return codes.some((c) => n.startsWith("+" + c));
}

/**
 * @param paspoort de zone van het paspoort of de nationaliteit: "NL", "EU", "NON_EU" of onbekend.
 * @param formulierTaal de taal waarin het formulier is ingevuld, als die bekend is.
 */
export function starttaal(i: { nummer: string | null | undefined; paspoort: string | null | undefined; formulierTaal?: Taal | null; codes?: string[] }): Taal {
  const codes = i.codes?.length ? i.codes : ["31"];
  const nl = nlNummer(i.nummer, codes);
  const zone = (i.paspoort || "").toUpperCase();
  if (zone === "NL") return "nl";
  if (zone === "EU" || zone === "NON_EU") {
    if (nl === false) return "en";
    if (nl === true) return i.formulierTaal || "nl";
    return i.formulierTaal || "en";
  }
  if (nl === true) return "nl";
  if (nl === false) return "en";
  return i.formulierTaal || "nl";
}

// ─── Wisselen ────────────────────────────────────────────────────────────────

const NL_WOORDEN = new Set("allebei twee drie vier nu dan toen al zo of tot over na zelf sinds kamers ik je jij het een de en niet wel ben heb heeft hebt was waren bij voor met van naar ook maar want dus nog geen graag dank bedankt alleen werk gewerkt werken jaar jaren als ervaring wil kan kun mag zou wat waar wanneer hoe waarom dat dit deze die er hier daar om op uit veel weinig goed mijn mij me wij we ze zij hun".split(" "));
const EN_WOORDEN = new Set("i you he she it the a an and not is am are was were have has had do does did at for with of to in on from also but because so still no yes please thanks thank only work worked working year years as experience want can could may would what where when how why that this these those there here my me we they their been just very good".split(" "));
/** Woorden die in beide talen voorkomen of niets zeggen over de taal. */
const NEUTRAAL = new Set("ok oke oké okay top hoi hi hey hallo hello yes ja nee no thanks thx bedankt dank super prima cool".split(" "));

const LETTERS = new RegExp("[\\p{L}']+", "gu");
const WOORD_ORIGINEEL = new RegExp("[\\p{L}']+", "gu");
function woorden(tekst: string): string[] {
  return (tekst.toLowerCase().match(LETTERS) || []);
}

/** Telling van herkende Nederlandse en Engelse woorden, zonder neutrale woorden. */
export function taalTelling(tekst: string): { woorden: number; nl: number; en: number } {
  // Namen en plaatsen (een hoofdletter midden in een zin, zoals "Van der Valk" of "Den Haag")
  // zeggen niets over de taal en tellen niet mee. Het eerste woord van een zin telt wel.
  const echt: string[] = [];
  for (const zin of tekst.split(/[.!?\n]+/)) {
    const w = zin.match(WOORD_ORIGINEEL) || [];
    const klein = w.filter((x) => x.charAt(0) === x.charAt(0).toLowerCase()).length;
    w.forEach((x, i) => {
      const hoofd = x.charAt(0) !== x.charAt(0).toLowerCase();
      // Eerste woord: telt, behalve als de zin vooral uit namen bestaat ("Van der Valk").
      if (hoofd && (i > 0 || (w.length > 1 && klein < 2 && w.slice(1).some((y) => y.charAt(0) !== y.charAt(0).toLowerCase())))) return;
      const l = x.toLowerCase();
      if (!NEUTRAAL.has(l)) echt.push(l);
    });
  }
  return { woorden: echt.length, nl: echt.filter((x) => NL_WOORDEN.has(x)).length, en: echt.filter((x) => EN_WOORDEN.has(x)).length };
}

/** "nl", "en", "anders" (wel tekst, geen van beide) of null (te kort, neutraal of gelijk). */
export function taalVanTekst(tekst: string): Taal | "anders" | null {
  const t = taalTelling(tekst);
  if (t.woorden < 3) return null;
  if (t.nl === 0 && t.en === 0) return "anders";
  if (t.nl === t.en) return null;
  return t.nl > t.en ? "nl" : "en";
}

export interface WisselInvoer {
  huidig: Taal;
  tekst: string;
  /** De taal volgens de AI (of de reserve-lezer): "nl", "en", "anders" of null. */
  aiTaal?: "nl" | "en" | "anders" | null;
  /** Het antwoord is een knop of een van de keuzes van de vraag. */
  keuze?: boolean;
  /** Aantal automatische wissels tot nu toe. */
  wissels: number;
  /** Aantal keer dat Job al zei dat hij alleen Nederlands en Engels spreekt. */
  andereTaal: number;
}

export type WisselUitkomst =
  | { soort: "blijf" }
  | { soort: "wissel"; taal: Taal }
  | { soort: "andere_taal"; keer: number };

export function taalWissel(i: WisselInvoer): WisselUitkomst {
  if (i.keuze) return { soort: "blijf" };
  const t = taalTelling(i.tekst);
  // Kort, neutraal, een naam, een getal of een plaats: geen wissel.
  if (t.woorden < 3) return { soort: "blijf" };
  const ai = i.aiTaal ?? null;
  // Een andere taal (Pools, Spaans): de AI zegt het en de woordenlijst herkent bijna niets,
  // of zonder AI een zin van minstens zes woorden zonder één herkend woord.
  if ((ai === "anders" && Math.max(t.nl, t.en) <= 1) || (ai === null && t.nl === 0 && t.en === 0 && t.woorden >= 6)) {
    return { soort: "andere_taal", keer: i.andereTaal + 1 };
  }
  // Een duidelijke zin in de andere taal: minstens twee herkende woorden (of één als de AI het
  // bevestigt), meer dan in de huidige taal, en de AI spreekt het niet tegen. Zo wisselt een
  // naam als "Van der Valk" niet.
  const doel: Taal = i.huidig === "nl" ? "en" : "nl";
  const hits = doel === "nl" ? t.nl : t.en;
  const ander = doel === "nl" ? t.en : t.nl;
  const aiZegt = ai === doel;
  const aiTegen = ai === i.huidig;
  if (aiTegen || hits <= ander) return { soort: "blijf" };
  if (!(hits >= 2 || (aiZegt && hits >= 1))) return { soort: "blijf" };
  if (i.wissels >= 1) return { soort: "blijf" };
  return { soort: "wissel", taal: doel };
}
