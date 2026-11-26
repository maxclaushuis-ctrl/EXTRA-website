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
import type { JobTaal, JobVelden, Onderwerp, Uitgaand } from "./jobRegels";
import { DIENSTEN_TEKST, STARTDATUM_TEKST, STERREN_TEKST, WERKMOMENT_TEKST, WERKVORM_TEKST } from "./jobRegels";
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

// ─── Rustig doorvragen (afspraak Max 26 nov 2026) ────────────────────────────
// De hoofdregel: is het antwoord duidelijk, dan gaat Job direct door met de volgende vraag, zonder het antwoord
// te herhalen of te bevestigen. Vraagt of corrigeert de kandidaat iets, dan handelt Job dat eerst af. Het
// vangnet daaronder: een stopwoord als "top" of "helder" opent hooguit één bericht per gesprek.

/** De eerdere berichten van Job uit de geschiedenis ("Job: ..."), nieuwste laatst. */
export function eerdereJobBerichten(geschiedenis: string, max = 16): string[] {
  return geschiedenis.split("\n").filter((r) => r.startsWith("Job: ")).map((r) => r.slice(5).trim()).filter(Boolean).slice(-max);
}

export const STOPWOORDEN = ["top", "helder", "duidelijk", "mooi", "prima", "fijn", "super", "perfect", "oke", "ok", "okay", "goed", "great", "clear", "nice", "lovely", "alright"];

/** Het stopwoord waarmee een tekst opent, of null. */
export function openendStopwoord(t: string): string | null {
  const w = eersteWoord(t);
  return STOPWOORDEN.includes(w) ? w : null;
}

/**
 * Opent de tekst met een stopwoord dat Job eerder in dit gesprek al als opening gebruikte, dan gaat dat woord eraf
 * ("Helder, fulltime dus." wordt "Fulltime dus."). Blijft er bijna niets over, dan leeg.
 */
export function zonderHerhaaldStopwoord(t: string, eerder: string[]): string {
  const s = (t || "").trim();
  const w = openendStopwoord(s);
  if (!w || !eerder.some((e) => openendStopwoord(e) === w)) return s;
  const rest = s.replace(/^[^\s,.!:;]+[\s,.!:;]*/, "").trim();
  if (rest.split(/\s+/).filter(Boolean).length < 2) return "";
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** Welke velden bij welke vraag horen (voor het verschil tussen een antwoord en een aanvulling). */
export const VELDEN_VAN: Partial<Record<Onderwerp, (keyof JobVelden)[]>> = {
  ervaring: ["ervaring", "ervaringNiveau"], functievraag: ["functievraag", "punten", "puntBewijs"], hotels: ["hotels"], sterren: ["sterren"],
  restaurant: ["restaurantSoort"], specialisatie: ["specialisatie"], werkautorisatie: ["werkautorisatie"], geldigheid: ["geldigTot"],
  diensten: ["diensten"], werkgebied: ["werkgebied", "vervoer"], werkmoment: ["werkmoment", "werkmomentTekst"],
  startdatum: ["startdatum", "startdatumTekst"], werkvorm: ["werkvorm"], talen: ["talen"], cv: ["cvParaat"],
};

/** Een opgeslagen waarde zoals de kandidaat hem terugleest; null als die zich niet leent voor een korte bevestiging. */
export function veldTekst(k: keyof JobVelden, v: unknown, taal: JobTaal): string | null {
  if (v === undefined || v === null || v === "" || v === "-") return null;
  const nl = taal === "nl";
  const tekst = typeof v === "string" ? v.trim() : "";
  switch (k) {
    case "diensten": return nl ? (DIENSTEN_TEKST as any)[v as string] ?? null : ({ "1-2": "1 to 2 shifts a week", "3-4": "3 to 4 shifts a week", "5+": "5 or more shifts a week" } as any)[v as string] ?? null;
    case "werkgebied": return tekst || null;
    case "werkmoment": return (WERKMOMENT_TEKST as any)[v as string]?.[taal]?.toLowerCase() ?? null;
    case "werkmomentTekst": return tekst || null;
    case "startdatum": { const l = (STARTDATUM_TEKST as any)[v as string]?.[taal]?.toLowerCase(); return l ? (nl ? `starten ${l}` : `start ${l}`) : null; }
    case "startdatumTekst": return tekst ? (nl ? `starten ${tekst}` : `start ${tekst}`) : null;
    case "werkvorm": return (WERKVORM_TEKST as any)[v as string]?.[taal]?.toLowerCase() ?? null;
    case "sterren": return (STERREN_TEKST as any)[v as string]?.[taal]?.toLowerCase() ?? null;
    case "hotels": case "restaurantSoort": case "talen": case "vervoer": return tekst || null;
    case "geldigTot": return tekst ? (nl ? `geldig tot ${tekst}` : `valid until ${tekst}`) : null;
    default: return null;
  }
}

/**
 * Een korte bevestiging uit het dossier zelf, zodat wat Job zegt altijd klopt met wat er is opgeslagen.
 * Bij een correctie: wat er nu staat ("Ik heb het aangepast naar 25 km enkele reis."). Bij een losse aanvulling
 * (iets dat bij een andere vraag hoort, terwijl de open vraag onbeantwoord bleef): wat erbij kwam ("Genoteerd: alleen in de avond.").
 * Leeg als er niets kort te bevestigen is.
 */
export function wijzigingBevestiging(oud: JobVelden, nieuw: JobVelden, i: { correctie: boolean; gevraagd: Onderwerp | null; taal: JobTaal }): string {
  const nl = i.taal === "nl";
  const eigen = new Set<string>(i.gevraagd ? VELDEN_VAN[i.gevraagd] || [] : []);
  const kandidaten: (keyof JobVelden)[] = ["diensten", "werkgebied", "werkmoment", "werkmomentTekst", "startdatum", "startdatumTekst", "werkvorm", "sterren", "hotels", "restaurantSoort", "talen", "geldigTot"];
  const veranderd = (k: keyof JobVelden) => JSON.stringify(oud[k] ?? null) !== JSON.stringify(nieuw[k] ?? null) && nieuw[k] !== undefined;
  // Een aanvulling alleen bevestigen als de open vraag zelf niet beantwoord is (bijvoorbeeld "maar alleen in de avond"
  // na de vraag over reisafstand): anders gaat Job gewoon door en slaat hij de beantwoorde vragen over.
  if (!i.correctie && Array.from(eigen).some((k) => veranderd(k as keyof JobVelden))) return "";
  const delen = kandidaten.filter((k) => veranderd(k) && (i.correctie || !eigen.has(k))).map((k) => veldTekst(k, nieuw[k], i.taal)).filter((x): x is string => !!x);
  const uniek = Array.from(new Set(delen));
  let zin = "";
  if (uniek.length) {
    const lijst = uniek.length === 1 ? uniek[0] : `${uniek.slice(0, -1).join(", ")} ${nl ? "en" : "and"} ${uniek[uniek.length - 1]}`;
    zin = i.correctie ? (nl ? `Ik heb het aangepast naar ${lijst}.` : `I've updated it to ${lijst}.`) : (nl ? `Genoteerd: ${lijst}.` : `Noted: ${lijst}.`);
  } else if (i.correctie && (veranderd("ervaring") || veranderd("functievraag"))) {
    zin = nl ? "Ik heb je ervaring aangepast." : "I've updated your experience.";
  }
  return zin && grensFouten(zin, i.taal, 2).length === 0 ? zin : "";
}

const WERKMOMENT_KNOPPEN = /^(doordeweeks|avond en weekend|flexibel|wanneer nodig|weekdays|evenings and weekends|evenings, weekends|flexible|whenever needed)$/i;
/** Een beperking in eigen woorden: "in het weekend kan ik niet", "geen avonden", "not on weekends". */
const MOMENT = "(?:avond|avonden|'s avonds|weekend|weekenden|doordeweeks|overdag|ochtend|ochtenden|middag|middagen|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|evening|evenings|weekends?|weekdays|daytime|mornings?|afternoons?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)";
const BEPERKING = new RegExp(`\\b(?:niet|geen|nooit|behalve|uitgezonderd|not|no|never|except)\\b[^.;?]{0,25}${MOMENT}|${MOMENT}[^.;?]{0,30}\\b(?:niet|geen|nooit|not|never)\\b`, "i");

/** De woorden van de kandidaat zonder de aanloop: "Nee, toch alleen 's avonds" wordt "alleen 's avonds". */
function eigenWoorden(t: string): string {
  let e = t.trim().replace(/[.!]+$/, "");
  for (let i = 0; i < 3; i++) e = e.replace(/^(nee|ja|oh|sorry|oke|ok)[,!.]?\s+/i, "").replace(/^(toch|maar|eigenlijk|dan|ik kan|i can)\s+/i, "");
  return (e || t.trim()).slice(0, 160);
}

/**
 * Wanneer iemand kan werken, precies zoals hij het zei. Twee gevallen waarin een knopwaarde van het model te grof is:
 *  - een beperking ("Ik kan 's avonds, maar in het weekend kan ik niet"): de volledige beperking in werkmomentTekst;
 *  - alleen de avond, zonder weekend: geen "avond en weekend" maar de eigen woorden.
 * Een aangetikte knop blijft de knop; zonder werkmoment van het model verandert er niets.
 */
export function preciezerWerkmoment(velden: JobVelden, bericht: string, bewijs?: string | null): JobVelden {
  if (!velden.werkmoment && !velden.werkmomentTekst) return velden;
  const t = (bericht || "").trim();
  if (WERKMOMENT_KNOPPEN.test(t)) return velden;
  const { werkmoment: _weg, ...rest } = velden;
  // Alleen de zinnen over wanneer iemand kan werken: geen vraag ("Wat verdien ik eigenlijk?") en niet de rest van het bericht.
  const zinnen = t.split(/(?<=[.!?])\s+/).filter((z) => !z.trim().endsWith("?") && new RegExp(MOMENT, "i").test(z));
  const over = zinnen.join(" ");
  if (over && BEPERKING.test(over)) return { ...rest, werkmomentTekst: eigenWoorden(over) };
  if (velden.werkmoment === "avond_weekend" && /avond|evening/i.test(over) && !/weekend/i.test(over)) return { ...rest, werkmomentTekst: eigenWoorden((bewijs && bewijs.trim()) || over) };
  return velden;
}

/**
 * Een correctie die niets veranderde omdat de gewenste waarde er al stond: dan mag Job dat kort zeggen
 * ("Dat staat al zo genoteerd: 1 tot 2 diensten per week."). Staat er iets anders, dan zegt Job niets toe.
 */
export function alGenoteerd(voorgesteld: JobVelden, dossier: JobVelden, taal: JobTaal): string {
  const delen = (Object.keys(voorgesteld) as (keyof JobVelden)[])
    .filter((k) => voorgesteld[k] !== undefined && JSON.stringify(voorgesteld[k]) === JSON.stringify(dossier[k]))
    .map((k) => veldTekst(k, dossier[k], taal)).filter((x): x is string => !!x);
  if (!delen.length) return "";
  const lijst = delen.length === 1 ? delen[0] : `${delen.slice(0, -1).join(", ")} ${taal === "nl" ? "en" : "and"} ${delen[delen.length - 1]}`;
  const zin = taal === "nl" ? `Dat staat al zo genoteerd: ${lijst}.` : `That's already noted: ${lijst}.`;
  return grensFouten(zin, taal, 2).length === 0 ? zin : "";
}

/** Een vraag van het model: eindigt met het enige vraagteken, kort, binnen de grenzen. */
export function vraagMag(t: string, taal: JobTaal): boolean {
  const s = (t || "").trim();
  return s.endsWith("?") && s.split(/\s+/).length <= 35 && grensFouten(s, taal, 2).length === 0;
}

export interface GesprekSamenstelling {
  berichten: Uitgaand[];
  gebruikt: { reactie: boolean; vraag: boolean; kennis: Beurt["kennis"]; bevestiging?: boolean };
}

/** Soorten berichten waar Job eerst op ingaat; bij alleen een duidelijk antwoord gaat Job direct door. */
const AFHANDELEN = ["correctie", "frustratie", "verwarring", "hulp", "onduidelijk", "bedankje"];
/** De kandidaat verwijst naar wat hij al zei: Job erkent dat kort (bijvoorbeeld met sorry) en gaat door. */
const VERWIJZING = /\b(net|al|toch|eerder)\s+(gezegd|verteld|genoemd|geantwoord)\b|\bzei ik\b|\bzeg ik\b|\bsaid that\b|\btold you\b|\balready (said|told|answered)\b/i;

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
  /** Een korte bevestiging uit het dossier na een correctie of aanvulling (wijzigingBevestiging). Gaat vóór de reactie van het model. */
  bevestiging?: string;
  /** De eerdere berichten van Job in dit gesprek: een stopwoord dat daar al een bericht opende, komt niet nog eens vooraan. */
  eerder?: string[];
  /** Het bericht van de kandidaat: een wedervraag of een verwijzing ("zei ik toch") vraagt om een reactie. */
  bericht?: string;
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
  // Een correctie of aanvulling: eerst de bevestiging uit het dossier, dan pas het antwoord op een eigen vraag.
  if (i.bevestiging && !i.vasteReactie) { voor = voor ? `${i.bevestiging} ${voor}` : i.bevestiging; gebruikt.bevestiging = true; }
  const eerder = [...(i.eerder || []), ...(i.vorigBericht ? [i.vorigBericht] : [])];
  // De reactie van het model alleen als er iets af te handelen is (correctie zonder bevestiging uit het dossier,
  // ergernis, verwarring, een doorvraag). Een duidelijk antwoord, getypt of met een knop, krijgt geen reactie.
  const afhandelen = g.soorten.some((x) => AFHANDELEN.includes(x)) || !!g.doorvragen || (!!i.bericht && (i.bericht.includes("?") || VERWIJZING.test(i.bericht)));
  // Een correctie bevestigt Job alleen uit het dossier (i.bevestiging), nooit in de woorden van het model: dan kan
  // Job geen "1 tot 2" toezeggen terwijl er nog "5 of meer" staat.
  const modelReactie = afhandelen && !gebruikt.bevestiging && !g.soorten.includes("correctie") ? zonderHerhaaldStopwoord(g.reactie, eerder) : "";
  // Hetzelfde openingswoord als het vorige bericht is een zachte voorkeur: alleen een kale bevestiging
  // ("Helder.", "Top!") valt weg; een inhoudelijke reactie, of een reactie op een correctie of ergernis, blijft.
  const kaal = (t: string) => t.trim().split(/\s+/).length <= 3;
  const inhoudelijk = g.soorten.includes("correctie") || g.soorten.includes("frustratie");
  // Zonder vraagversie 2 (punt undefined) zoals het was: hooguit twee zinnen, geen controle op het openingswoord.
  const v2 = i.punt !== undefined || !!i.loonTekst || i.versie2;
  const reactieOk = (max: number) => !!modelReactie && (v2 ? reactieMag(modelReactie, i.taal, max) && (inhoudelijk || !kaal(modelReactie) || !zelfdeOpening(modelReactie, i.vorigBericht)) : reactieMag(modelReactie, i.taal));

  const laatste = berichten[berichten.length - 1];
  if (i.onderwerp && i.standaard) {
    // Een vaste opmerking van de regels staat vóór de standaardvraag in hetzelfde bericht.
    const regelsVoor = laatste.tekst !== i.standaard && laatste.tekst.endsWith(i.standaard) ? laatste.tekst.slice(0, -i.standaard.length).trim() : "";
    const regelsVraag = regelsVoor ? i.standaard : laatste.tekst;
    if (!voor && regelsVoor) voor = regelsVoor;
    // Met een vraag erna: hooguit één zin reactie, zodat het bericht bij twee korte zinnen blijft.
    if (!voor && reactieOk(1)) { voor = modelReactie; gebruikt.reactie = true; }
    let vraagTekst = regelsVraag;
    const zelfdeVeld = g.vraagt === i.onderwerp;
    const profielvraag = i.punt !== undefined;
    // Een vraag met knoppen blijft de korte vaste vraag: de opties staan al in de knoppen.
    const metKnoppen = !!laatste.keuzes?.length;
    const eigenVraag = zonderHerhaaldStopwoord(g.vraag, voor ? [] : eerder);
    if (!LETTERLIJK.includes(i.onderwerp) && zelfdeVeld && !profielvraag && !metKnoppen && eigenVraag.endsWith("?") && vraagMag(eigenVraag, i.taal)) { vraagTekst = eigenVraag; gebruikt.vraag = true; }
    const samen = voor ? `${voor} ${vraagTekst}` : vraagTekst;
    if (vormFouten(samen).length === 0) laatste.tekst = samen;
    else {
      laatste.tekst = regelsVoor && voor !== regelsVoor ? `${regelsVoor} ${vraagTekst}` : vraagTekst;
      // Het antwoord op de vraag van de kandidaat valt nooit weg: dan als eigen bericht ervoor.
      if (gebruikt.kennis || gebruikt.bevestiging) berichten.splice(berichten.length - 1, 0, { tekst: voor });
      gebruikt.reactie = false;
    }
    return { berichten, gebruikt };
  }

  // Job vraagt niets meer (cv, collega, klaar): de vaste berichten, met vooraan het antwoord of de reactie.
  if (!voor && reactieOk(2)) { voor = modelReactie; gebruikt.reactie = true; }
  if (voor) {
    const eerste = berichten[0];
    const samen = `${voor} ${eerste.tekst}`;
    if (vormFouten(samen, 6).length === 0) eerste.tekst = samen;
    else if (gebruikt.kennis || gebruikt.bevestiging) berichten.unshift({ tekst: voor });
    else gebruikt.reactie = false;
  }
  return { berichten, gebruikt };
}
