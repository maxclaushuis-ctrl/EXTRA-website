/**
 * Job 5: het model voert het gesprek (schakelaar JOB_GESPREK_AI, besluit Max 19 november 2026).
 *
 * Waarom: in Job 4 schreef de AI wel een reactie en een vraag, maar een lange rij controles
 * keurde die vaak af, waarna Job terugviel op vaste zinnen ("Ik vraag het even anders",
 * dezelfde vraag opnieuw). Dat voelde houterig. Nu schrijft het model het bericht zelf, in
 * de toon van de mock-up, en bewaakt de code alleen de harde grenzen:
 *   - velden alleen met een letterlijk citaat uit wat de kandidaat zei (nu of eerder in het gesprek);
 *   - geen bedragen, beloftes, links, BSN of IBAN in een bericht;
 *   - de vragen over werkvergunning en cv blijven letterlijk;
 *   - feiten over EXTRA alleen uit de kennisbank (shared/jobKennis.ts), letterlijk;
 *   - de vaste regels (shared/jobRegels.ts) blijven de status, de verplichte vragen en de acties bepalen.
 * Puur, getest in shared/jobGesprek.test.ts. De AI-aanroep staat in server/job/jobBeurt.ts.
 */
import type { JobTaal, Onderwerp, Uitgaand } from "./jobRegels";
import { LETTERLIJK, valideerBeurt, type Beurt } from "./jobBeurt";
import { bewijsCheck, valideerLezing } from "./jobLezen";
import { kennis, ONBEKENDE_VRAAG } from "./jobKennis";
import { taalTelling } from "./jobTaal";

/** In de testomgeving vanzelf aan, uit met JOB_GESPREK_AI=0; elders alleen met JOB_GESPREK_AI=1. */
export function gesprekAan(env: { TESTOMGEVING?: string; JOB_GESPREK_AI?: string }): boolean {
  const w = env.JOB_GESPREK_AI;
  return w === "1" || (env.TESTOMGEVING === "1" && w !== "0");
}

/** Het model voor het gesprek: JOB_GESPREK_MODEL, anders dit (te kiezen na de gesprekstest). */
export const GESPREK_MODEL_STANDAARD = "gpt-4.1";
export function gesprekModel(env: { JOB_GESPREK_MODEL?: string }): string {
  return (env.JOB_GESPREK_MODEL || "").trim() || GESPREK_MODEL_STANDAARD;
}

export const ONDERWERPEN: Onderwerp[] = ["ervaring", "functievraag", "specialisatie", "werkautorisatie", "geldigheid", "diensten", "werkgebied", "hotels", "sterren", "restaurant", "werkmoment", "startdatum", "werkvorm", "talen", "cv"];

/** Hoe vaak Job dezelfde vraag mag stellen zonder antwoord; daarna neemt een collega het over en gaat Job verder. */
export const MAX_POGINGEN = 2;

export interface Gesprek extends Beurt {
  /** Over welk veld de vraag van het model gaat, of "klaar". */
  vraagt: Onderwerp | "klaar" | null;
  /** Vraagversie 2: over welk functiepunt de vraag van het model gaat. */
  vraagtPunt: string | null;
}

/** De eerdere berichten van de kandidaat uit de geschiedenis ("Kandidaat: ..."), nieuwste laatst. */
export function eerdereAntwoorden(geschiedenis: string, max = 8): string[] {
  return geschiedenis.split("\n").filter((r) => r.startsWith("Kandidaat: ")).map((r) => r.slice(11).trim()).filter(Boolean).slice(-max);
}

/**
 * Controleert wat het model teruggeeft. Zoals Job 4 (valideerBeurt), met één verschil: verwijst de
 * kandidaat terug ("zeg ik net"), dan mag het citaat ook uit een eerder bericht van hem komen.
 */
export function valideerGesprek(ruw: any, bericht: string, onderwerp: Onderwerp | null, eerdere: string[], huidigPunt?: string | null): Gesprek {
  const b = valideerBeurt(ruw, bericht, onderwerp, huidigPunt);
  let velden = b.velden;
  const draagt = b.soorten.includes("antwoord") || b.soorten.includes("correctie");
  if (draagt && eerdere.length) {
    const l = valideerLezing({ velden: ruw?.velden || {}, taal: ruw?.taal, twijfel: ruw?.twijfel, nvt: ruw?.nvt });
    const eerder = bewijsCheck(l.velden, ruw?.bewijs, [...eerdere, bericht].join(" | "), onderwerp, huidigPunt);
    // Punten uit een eerder bericht ("dat zei ik toch") komen erbij; wat dit bericht zelf draagt, gaat voor.
    const punten = eerder.punten || velden.punten ? { ...(eerder.punten || {}), ...(velden.punten || {}) } : undefined;
    const puntBewijs = eerder.puntBewijs || velden.puntBewijs ? { ...(eerder.puntBewijs || {}), ...(velden.puntBewijs || {}) } : undefined;
    velden = { ...eerder, ...velden, ...(punten ? { punten } : {}), ...(puntBewijs ? { puntBewijs } : {}) };
  }
  const v = ruw?.vraagt;
  const vraagt = v === "klaar" ? "klaar" : typeof v === "string" && (ONDERWERPEN as string[]).includes(v) ? (v as Onderwerp) : b.volgende;
  const vp = ruw?.vraagtPunt;
  return { ...b, velden, vraagt, vraagtPunt: typeof vp === "string" && /^[a-zA-Z]{2,30}$/.test(vp) ? vp : null };
}

// ─── Harde grenzen voor wat Job verstuurt ────────────────────────────────────

const BELOFTE = /https?:|www\.|aangenomen|garantie|gegarandeerd|beloof|zeker weten|\bje krijgt\b|€|\beuro\b|\d+[.,]\d{2}|per uur|bruto|netto|hired|guarantee|promise|you will get|per hour|gross|salary of/i;
const PRIVACY = /\b\d{9}\b|\b[A-Z]{2}\d{2}\s?[A-Z]{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/i;

function zinnen(t: string): number {
  return t.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9])/).filter((z) => z.trim()).length;
}
function taalKlopt(t: string, taal: JobTaal): boolean {
  const c = taalTelling(t);
  const eigen = taal === "nl" ? c.nl : c.en;
  const ander = taal === "nl" ? c.en : c.nl;
  return !(ander >= 2 && ander > eigen);
}

/** Wat er mis is met een bericht van Job; leeg = mag weg. */
export function grensFouten(t: string, taal: JobTaal, maxZinnen = 4): string[] {
  const f: string[] = [];
  const s = (t || "").trim();
  if (!s) return ["leeg"];
  if (s.length > 450) f.push("te lang");
  if (zinnen(s) > maxZinnen) f.push(`meer dan ${maxZinnen} zinnen`);
  if ((s.match(/\?/g) || []).length > 1) f.push("meer dan één vraag");
  if (BELOFTE.test(s)) f.push("bedrag, belofte of link");
  if (PRIVACY.test(s)) f.push("persoonsgegevens");
  if (!taalKlopt(s, taal)) f.push("verkeerde taal");
  return f;
}

/**
 * Alleen de vorm van een samengesteld bericht (lengte, zinnen, vragen). De inhoud is al gecontroleerd:
 * de delen van het model met grensFouten, de vaste teksten van de regels en de kennisbank zijn goedgekeurd.
 */
export function vormFouten(t: string, maxZinnen = 4): string[] {
  const f: string[] = [];
  const s = (t || "").trim();
  if (!s) return ["leeg"];
  if (s.length > 600) f.push("te lang");
  if (zinnen(s) > maxZinnen) f.push(`meer dan ${maxZinnen} zinnen`);
  if ((s.match(/\?/g) || []).length > 1) f.push("meer dan één vraag");
  return f;
}

/** Een reactie van het model: geen vraag, hooguit twee korte zinnen (één als er een vraag volgt), binnen de grenzen. */
export function reactieMag(t: string, taal: JobTaal, maxZinnen = 2): boolean {
  const s = (t || "").trim();
  return !!s && !s.includes("?") && s.length <= 220 && grensFouten(s, taal, maxZinnen).length === 0;
}

const eersteWoord = (t: string) => ((t || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9']+/) || [""])[0];
/** Begint de reactie met hetzelfde woord als het vorige bericht van Job? Dan voelt het als een riedel. */
export function zelfdeOpening(reactie: string, vorig: string | null | undefined): boolean {
  const a = eersteWoord(reactie);
  return !!a && !!vorig && a === eersteWoord(vorig);
}

/** Een vraag van het model: eindigt met het enige vraagteken, kort, binnen de grenzen. */
export function vraagMag(t: string, taal: JobTaal): boolean {
  const s = (t || "").trim();
  return s.endsWith("?") && s.split(/\s+/).length <= 35 && grensFouten(s, taal, 2).length === 0;
}

export interface GesprekSamenstelling {
  berichten: Uitgaand[];
  gebruikt: { reactie: boolean; vraag: boolean; kennis: Beurt["kennis"] };
}

/**
 * Het bericht dat Job verstuurt. De vaste regels kozen wat er gebeurt (welke vraag, of het gesprek
 * klaar is); het model levert de woorden. Vooraan, in deze volgorde: het antwoord op de vraag van de
 * kandidaat uit de kennisbank, een vaste opmerking van de regels (zoals "een collega kijkt naar je
 * document"), of de reactie van het model. Daarna de vraag van het model, of de vaste vraag als het
 * om de werkvergunning of het cv gaat of als de vraag van het model niet door de grenzen komt.
 */
export function stelGesprekSamen(i: {
  gesprek: Gesprek | null;
  /** De berichten van de vaste regels. */
  regels: Uitgaand[];
  /** De vraag die nu openstaat na verwerken, of null als Job niet meer vraagt. */
  onderwerp: Onderwerp | null;
  /** De vaste tekst van die vraag. */
  standaard: string | null;
  taal: JobTaal;
  /** Vaste reactie die voorgaat (bijvoorbeeld als Job na twee pogingen verder gaat). */
  vasteReactie?: string;
  /** Het vorige bericht van Job: een reactie die met hetzelfde woord begint, valt weg. */
  vorigBericht?: string;
  /** Het loon van een gekoppelde vacature; vervangt bij een loonvraag de algemene tekst. */
  loonTekst?: string;
  /**
   * Vraagversie 2: het functiepunt waar de vaste vraag over gaat. Bij een functiepunt verstuurt Job altijd de
   * vraag uit het profiel (met de knoppen van dat punt); de persoonlijke aansluiting zit in de korte reactie.
   * Zo kan een vraagtekst nooit over iets anders gaan dan het veld waarin het antwoord terechtkomt.
   */
  punt?: string | null;
  /** Vraagversie 2: de schrijfregels van 25 november (één zin reactie vóór een vraag, zachte voorkeur voor afwisseling). */
  versie2?: boolean;
}): GesprekSamenstelling {
  const g = i.gesprek;
  const gebruikt: GesprekSamenstelling["gebruikt"] = { reactie: false, vraag: false, kennis: null };
  const berichten = i.regels.map((x) => ({ ...x }));
  if (!g || !berichten.length) return { berichten, gebruikt };

  let voor = i.vasteReactie || "";
  if (!voor && g.kennis) {
    const k = g.kennis === "onbekend" ? null : kennis(g.kennis);
    voor = g.kennis === "loon" && i.loonTekst ? i.loonTekst : k ? k[i.taal] : ONBEKENDE_VRAAG[i.taal];
    gebruikt.kennis = g.kennis;
  }
  // Hetzelfde openingswoord als het vorige bericht is een zachte voorkeur: alleen een kale bevestiging
  // ("Helder.", "Top!") valt weg; een inhoudelijke reactie, of een reactie op een correctie of ergernis, blijft.
  const kaal = (t: string) => t.trim().split(/\s+/).length <= 3;
  const inhoudelijk = g.soorten.includes("correctie") || g.soorten.includes("frustratie");
  // Zonder vraagversie 2 (punt undefined) zoals het was: hooguit twee zinnen, geen controle op het openingswoord.
  const v2 = i.punt !== undefined || !!i.loonTekst || i.versie2;
  const reactieOk = (max: number) => v2 ? reactieMag(g.reactie, i.taal, max) && (inhoudelijk || !kaal(g.reactie) || !zelfdeOpening(g.reactie, i.vorigBericht)) : reactieMag(g.reactie, i.taal);

  const laatste = berichten[berichten.length - 1];
  if (i.onderwerp && i.standaard) {
    // Een vaste opmerking van de regels staat vóór de standaardvraag in hetzelfde bericht.
    const regelsVoor = laatste.tekst !== i.standaard && laatste.tekst.endsWith(i.standaard) ? laatste.tekst.slice(0, -i.standaard.length).trim() : "";
    const regelsVraag = regelsVoor ? i.standaard : laatste.tekst;
    if (!voor && regelsVoor) voor = regelsVoor;
    // Met een vraag erna: hooguit één zin reactie, zodat het bericht bij twee korte zinnen blijft.
    if (!voor && reactieOk(1)) { voor = g.reactie.trim(); gebruikt.reactie = true; }
    let vraagTekst = regelsVraag;
    const zelfdeVeld = g.vraagt === i.onderwerp;
    const profielvraag = i.punt !== undefined;
    if (!LETTERLIJK.includes(i.onderwerp) && zelfdeVeld && !profielvraag && vraagMag(g.vraag, i.taal)) { vraagTekst = g.vraag.trim(); gebruikt.vraag = true; }
    const samen = voor ? `${voor} ${vraagTekst}` : vraagTekst;
    if (vormFouten(samen).length === 0) laatste.tekst = samen;
    else {
      laatste.tekst = regelsVoor && voor !== regelsVoor ? `${regelsVoor} ${vraagTekst}` : vraagTekst;
      // Het antwoord op de vraag van de kandidaat valt nooit weg: dan als eigen bericht ervoor.
      if (gebruikt.kennis) berichten.splice(berichten.length - 1, 0, { tekst: voor });
      gebruikt.reactie = false;
    }
    return { berichten, gebruikt };
  }

  // Job vraagt niets meer (cv, collega, klaar): de vaste berichten, met vooraan het antwoord of de reactie.
  if (!voor && reactieOk(2)) { voor = g.reactie.trim(); gebruikt.reactie = true; }
  if (voor) {
    const eerste = berichten[0];
    const samen = `${voor} ${eerste.tekst}`;
    if (vormFouten(samen, 6).length === 0) eerste.tekst = samen;
    else if (gebruikt.kennis) berichten.unshift({ tekst: voor });
    else gebruikt.reactie = false;
  }
  return { berichten, gebruikt };
}
