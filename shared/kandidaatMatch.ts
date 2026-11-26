/**
 * Kandidaatmatch (Job 3.0, fase 4): uit een cv-analyse en wat het gesprek al
 * weet een score van 0 tot 100 voor de gekozen functie. Volgt exact de regels
 * in het voorstel Job 3.0, hoofdstuk 8. Puur en getest (shared/kandidaatMatch.test.ts).
 *
 * Het rekenen gebeurt hier, met vaste regels. De AI leest alleen het cv uit
 * (werkperiodes, kerntaken, certificaten) en beslist nooit over de score.
 * Wat nooit meetelt: naam, foto, leeftijd, geslacht, afkomst, nationaliteit,
 * opmaak, spelling, lengte van het cv, korte dienstverbanden en gaten.
 */
export type Soort = "starters" | "gewenst" | "vereist";
export type Eis = "voldaan" | "niet_voldaan" | "onbekend" | "af_te_wegen" | "geen";
export interface Duur { min: number; max: number }          // maanden; gelijk als de datums volledig zijn
export interface Invoer {
  soort: Soort;
  eis: Eis;
  A: Duur | 0 | null;          // ervaring in de functie: duur, 0 = zelf gezegd geen, null = onbekend
  B: "titel" | 1 | 2 | 0 | null; // kerntaken: alleen titel, aantal verschillende kerntaken, 0 = aantoonbaar ander werk, null = onbekend
  C: Duur | null;              // verwante ervaring uit de lijst; null = onbekend (niets vermeld)
  D: number | "nu" | null;     // maanden sinds de laatste periode in de functie
}
const GEWICHT: Record<Soort, { start: number; A: number; B: number; C: number; D: number }> = {
  starters: { start: 50, A: 25, B: 15, C: 10, D: 0 },
  gewenst: { start: 25, A: 35, B: 20, C: 10, D: 10 },
  vereist: { start: 0, A: 45, B: 30, C: 10, D: 15 },
};
export const duurNiveau = (m: number) => (m <= 0 ? 0 : m < 6 ? 0.25 : m < 12 ? 0.5 : m < 24 ? 0.75 : 1);
const midden = (d: Duur) => (d.min + d.max) / 2;
const kernNiveau = (b: Invoer["B"]) => (b === "titel" ? 0.5 : b === 1 ? 0.75 : b === 2 ? 1 : b === 0 ? 0 : null);
const recentNiveau = (d: Invoer["D"]) => (d === "nu" ? 1 : d === null ? null : d <= 12 ? 1 : d <= 36 ? 0.5 : 0);

export interface Uitkomst {
  toestand: "score" | "onvoldoende" | "eis_niet_voldaan";
  score?: number; laag?: number; hoog?: number; dekking: number; voorlopig: boolean;
  onzekerheid: "laag" | "middel" | "hoog"; label: string;
}
export function bereken(i: Invoer): Uitkomst {
  const w = GEWICHT[i.soort];
  const totaal = w.A + w.B + w.C + w.D;
  if (i.eis === "niet_voldaan") return { toestand: "eis_niet_voldaan", dekking: 0, voorlopig: false, onzekerheid: "laag", label: "Voldoet niet aan de ervaringseis" };
  // niveaus: [laag, schatting, hoog] of null
  const A = i.A === null ? null : i.A === 0 ? [0, 0, 0] : [duurNiveau(i.A.min), duurNiveau(midden(i.A)), duurNiveau(i.A.max)];
  const kb = kernNiveau(i.B);
  const B = kb === null ? null : i.B === "titel" ? [0.5, 0.5, 1] : [kb, kb, kb];
  const C = i.C === null ? null : [duurNiveau(i.C.min), duurNiveau(midden(i.C)), duurNiveau(i.C.max)];
  const rd = i.A === 0 ? 0 : recentNiveau(i.D);
  const D = w.D === 0 ? null : rd === null ? null : [rd, rd, rd];
  const crit: [number, number[] | null][] = [[w.A, A], [w.B, B], [w.C, C], [w.D, D]];
  const bekend = crit.filter(([g, n]) => g > 0 && n !== null) as [number, number[]][];
  const gewBekend = bekend.reduce((s, [g]) => s + g, 0);
  const dekking = Math.round((gewBekend / totaal) * 100);
  if (A === null || gewBekend / totaal < 0.7) return { toestand: "onvoldoende", dekking, voorlopig: false, onzekerheid: "hoog", label: "Onvoldoende informatie" };
  const deel = (k: number) => bekend.reduce((s, [g, n]) => s + g * n[k], 0) / gewBekend;
  const R = (x: number) => Math.floor(w.start + (100 - w.start) * x + 0.5 + 1e-9);
  const score = R(deel(1)), laag = R(deel(0)), hoog = R(deel(2));
  const band = hoog - laag;
  const voorlopig = dekking < 100 || band >= 10 || i.eis === "onbekend" || i.eis === "af_te_wegen";
  const onzekerheid = dekking < 85 || band >= 10 ? "hoog" : dekking < 100 || band > 0 || i.eis === "onbekend" ? "middel" : "laag";
  const label = i.soort === "starters" && i.A === 0 ? "Past als starter (geen ervaring vereist)"
    : score >= 85 ? "Sterke match op basis van beschikbare informatie"
    : score >= 70 ? "Goede match, met aandachtspunten" : score >= 50 ? "Gedeeltelijke match" : "Zwakke match voor deze functie";
  return { toestand: "score", score, laag, hoog, dekking, voorlopig, onzekerheid, label };
}


// ─── Functies en eisen (hoofdstuk 8) ─────────────────────────────────────────

export type EisRegel = "ervaring" | "kerntaak0" | "certificaat" | "drieBorden" | "geen";
export interface FunctieModel {
  sleutel: string;
  naam: string;
  soort: Soort;
  /** Zo staat de eis op de kaart. */
  eisTekst: string;
  eisRegel: EisRegel;
  kerntaken: string[];
  /** Wat als verwante ervaring telt (voor de AI en op de kaart). */
  verwant: string;
  /** Alleen in vraagversie 2 (JOB_FUNCTIEVRAGEN): een model dat daar nieuw of anders is. */
  versie2?: boolean;
}

/** Minimale ervaring in maanden bij housekeeping, front office en kok (besluit Max 16 nov 2026). */
export const EIS_MAANDEN = 6;
/** Alleen voor deze modellen; een ander model met "ervaring vereist" krijgt die grens niet vanzelf. */
export const EIS_MAANDEN_VOOR = ["housekeeping", "frontoffice", "kok"];

/**
 * Front office: bevestigd Nederlands voor gastcontact (door de kandidaat verteld). Voorstel V2: tot
 * 3 punten erbij, met 100 als plafond; geen Nederlands of onbekend: niets erbij of eraf. Staat op 0
 * tot Max de weging kiest (afspraak 25 nov 2026): de kaart toont het gegeven wel, de score verandert niet.
 */
export const NL_BONUS_FRONT_OFFICE = 0;

export const FUNCTIE_MODELLEN: Record<string, FunctieModel> = {
  housekeeping: { sleutel: "housekeeping", naam: "Housekeeping", soort: "vereist", eisRegel: "ervaring",
    eisTekst: "minimaal zes maanden ervaring met hotelkamers of vergelijkbaar housekeepingwerk",
    kerntaken: ["kamers opmaken", "badkamers schoonmaken", "werken met een kamerlijst"],
    verwant: "ander schoonmaakwerk (telt nooit vanzelf als hotelervaring)" },
  frontoffice: { sleutel: "frontoffice", naam: "Front office", soort: "vereist", eisRegel: "ervaring",
    eisTekst: "minimaal zes maanden receptie-ervaring",
    kerntaken: ["in- en uitchecken", "reserveringen", "gasten te woord staan"],
    verwant: "klantenservice, baliewerk" },
  dinerloper: { sleutel: "dinerloper", naam: "Dinerloper", soort: "vereist", eisRegel: "drieBorden", versie2: true,
    eisTekst: "relevante ervaring als dinerloper: zelf met drie borden tegelijk aan tafel uitserveren en de serveeretiquette kennen",
    kerntaken: ["met drie borden tegelijk aan tafel uitserveren", "uitserveren volgens de serveeretiquette", "afstemmen met keuken en bediening"],
    verwant: "bediening, banqueting, catering (dienbladen lopen of borden tot aan de zaal brengen telt niet als uitserveren aan tafel)" },
  kok: { sleutel: "kok", naam: "Zelfstandig werkend kok", soort: "vereist", eisRegel: "kerntaak0",
    eisTekst: "minimaal zes maanden koken, zelfstandig op een post",
    kerntaken: ["zelfstandig een post draaien", "mise-en-place", "bestellingen afwerken tijdens de service"],
    verwant: "keukenassistent of keukenhulp, cateringkeuken" },
  heftruck: { sleutel: "heftruck", naam: "Heftruck of reachtruck", soort: "vereist", eisRegel: "certificaat",
    eisTekst: "geldig certificaat",
    kerntaken: ["rijden", "laden en lossen", "in- en uitslaan in stellingen"],
    verwant: "magazijnwerk" },
  // Vraagversie 2, besluit Max 25 nov 2026: zelf op de truck gereden is de relevante ervaring; een ontbrekend of
  // verlopen certificaat is geen reden voor een controle vooraf. Het certificaat controleert de planner per opdracht.
  heftruck2: { sleutel: "heftruck", naam: "Heftruck of reachtruck", soort: "vereist", eisRegel: "ervaring", versie2: true,
    eisTekst: "zelf op de heftruck of reachtruck gereden; het certificaat wordt per opdracht gecontroleerd",
    kerntaken: ["rijden", "laden en lossen", "in- en uitslaan in stellingen"],
    verwant: "magazijnwerk" },
  keukenassistent: { sleutel: "keukenassistent", naam: "Keukenassistent", soort: "gewenst", eisRegel: "geen",
    eisTekst: "geen", kerntaken: ["voorbereiden en mise-en-place", "helpen tijdens de service"],
    verwant: "afwas of spoelkeuken, lunchroom" },
  bediening: { sleutel: "bediening", naam: "Bediening restaurant en bar", soort: "gewenst", eisRegel: "geen",
    eisTekst: "geen", kerntaken: ["bestellingen opnemen", "uitserveren", "afrekenen", "tappen"],
    verwant: "catering, events, lunchroom" },
  events: { sleutel: "events", naam: "Runner en bediening bij events", soort: "starters", eisRegel: "geen",
    eisTekst: "geen", kerntaken: ["uitserveren", "afruimen", "opbouwen"],
    verwant: "bediening, catering" },
  afwas: { sleutel: "afwas", naam: "Afwas", soort: "starters", eisRegel: "geen",
    eisTekst: "geen", kerntaken: ["afwassen (spoelkeuken of vaatwasser)", "keuken schoonhouden"],
    verwant: "keukenhulp, schoonmaak" },
  orderpicken: { sleutel: "orderpicken", naam: "Orderpicken en inpakken", soort: "starters", eisRegel: "geen",
    eisTekst: "geen", kerntaken: ["orderpicken", "inpakken", "laden en lossen"],
    verwant: "magazijnwerk, productiewerk" },
};

/**
 * Welk model hoort bij de aanmelding. Eén plek, zodat de indeling na de testronde
 * makkelijk aan te passen is. Keuken zonder nadere keuze is zelfstandig werkend kok
 * (Job behandelt keuken al als functie waarvoor ervaring nodig is).
 */
export function modelVoor(functieEersteKeus: string | null | undefined, functionType: string | null | undefined, label?: string | null, versie2 = false): FunctieModel {
  const k = (functieEersteKeus || "").toLowerCase();
  const t = (functionType || "").toLowerCase();
  // Vraagversie 2: de modellen van 25 november. Zonder vraagversie 2 rekent alles zoals het was.
  if (versie2 && k === "heftruck") return FUNCTIE_MODELLEN.heftruck2;
  if (versie2 && k === "dinerloper") return FUNCTIE_MODELLEN.dinerloper;
  if (k === "housekeeping" || t === "housekeeping") return FUNCTIE_MODELLEN.housekeeping;
  if (k === "frontoffice" || t === "frontoffice") return FUNCTIE_MODELLEN.frontoffice;
  if (k === "afwas") return FUNCTIE_MODELLEN.afwas;
  if (k === "heftruck") return FUNCTIE_MODELLEN.heftruck;
  if (k === "keuken" || t === "chef") return FUNCTIE_MODELLEN.kok;
  if (t === "logistiek" || ["orderpicker", "inpak", "expeditie", "magazijn", "voorraad"].includes(k)) return FUNCTIE_MODELLEN.orderpicken;
  if (k === "bar" || k === "fb" || k === "banqueting") return FUNCTIE_MODELLEN.bediening;
  if (label === "events" || ["bediening", "runner", "dinerloper", "host", "supervisor"].includes(k)) return FUNCTIE_MODELLEN.events;
  return FUNCTIE_MODELLEN.bediening;
}

// ─── Van cv-analyse naar invoer ──────────────────────────────────────────────

/** Eén werkperiode zoals de cv-analyse hem teruggeeft (na validatie). */
export interface Periode {
  functie: string;
  werkgever?: string | null;
  /** Ten opzichte van de gekozen functie. */
  soort: "zelfde" | "verwant" | "anders";
  /** Nummers (0, 1, 2...) van de kerntaken van het model die in deze periode aantoonbaar zijn. */
  kerntaken: number[];
  /** "YYYY-MM" of "YYYY"; null als onbekend. */
  begin: string | null;
  /** "YYYY-MM", "YYYY", "heden" of null. */
  einde: string | null;
  /** Alleen uit het gesprek, zonder datums. */
  duurMaanden?: number | null;
  bron: "cv" | "gesprek";
  citaat?: string | null;
}

export interface GesprekKennis {
  /** Uit het gesprek met Job: "geen" als de kandidaat zelf zei nooit zulk werk te hebben gedaan. */
  ervaringNiveau?: "geen" | "starter" | "ervaren" | null;
  /** Dinerloper, door de kandidaat aan Job verteld: zelf met drie borden aan tafel uitgeserveerd, en de etiquette. */
  drieBorden?: "ja" | "nee" | null;
  etiquette?: "ja" | "nee" | null;
  /** Front office en host, door de kandidaat aan Job verteld: kan gasten in het Engels of het Nederlands helpen. */
  engels?: "ja" | "nee" | null;
  nederlands?: "ja" | "nee" | null;
  /** Heftruck, door de kandidaat aan Job verteld: zelf gereden (heftruck, reachtruck, allebei) en het certificaat per truck. */
  gereden?: string | null;
  certHeftruck?: string | null;
  certReachtruck?: string | null;
}

/**
 * Wat het gesprek met Job aan de match meegeeft. Eén plek, zodat cv-analyse, kaart en cv-vragen
 * hetzelfde gebruiken. Taal komt alleen uit wat de kandidaat zegt (nooit uit de taal van de chat)
 * en alleen uit het gesprek: het cv-onderdeel Talen wordt afgeschermd, dus niets telt dubbel.
 */
/** De functie voor de match: wat met de kandidaat is vastgesteld (de voorkeur bij Job), anders de keuze op het formulier. */
export function matchFunctie(functieEersteKeus: string | null | undefined, velden: { punten?: Record<string, string>; vraagversie?: number } | null | undefined): string | null {
  return (velden?.vraagversie === 2 && velden.punten?.voorkeur) || functieEersteKeus || null;
}

export function gesprekKennisUit(v: { ervaringNiveau?: string | null; punten?: Record<string, string> } | null | undefined, geenErvaring: boolean): GesprekKennis {
  const p = v?.punten || {};
  const jn = (x: string | undefined) => (x === "ja" || x === "nee" ? x : null);
  return {
    ervaringNiveau: geenErvaring ? "geen" : v?.ervaringNiveau === "geen" ? null : ((v?.ervaringNiveau as GesprekKennis["ervaringNiveau"]) ?? null),
    drieBorden: jn(p.drieBorden), etiquette: jn(p.etiquette), engels: jn(p.engels), nederlands: jn(p.nederlands),
    gereden: p.gereden ?? null, certHeftruck: p.certHeftruck ?? null, certReachtruck: p.certReachtruck ?? null,
  };
}

type Bereik = [number, number];
const maandNr = (j: number, m: number) => j * 12 + (m - 1);
function datum(s: string | null, peil: Date): Bereik | null {
  if (!s) return null;
  if (s === "heden") { const p = maandNr(peil.getUTCFullYear(), peil.getUTCMonth() + 1); return [p, p]; }
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  const j = Number(m[1]);
  if (m[2]) { const n = maandNr(j, Math.min(12, Math.max(1, Number(m[2])))); return [n, n]; }
  return [maandNr(j, 1), maandNr(j, 12)];
}

/** Aantal maanden van een verzameling intervallen, overlap één keer geteld. */
function maandenUnie(iv: Bereik[]): number {
  const s = iv.filter(([a, b]) => b >= a).sort((x, y) => x[0] - y[0]);
  let tot = 0, cur: Bereik | null = null;
  for (const [a, b] of s) {
    if (!cur || a > cur[1] + 1) { if (cur) tot += cur[1] - cur[0] + 1; cur = [a, b]; }
    else cur[1] = Math.max(cur[1], b);
  }
  if (cur) tot += cur[1] - cur[0] + 1;
  return tot;
}

/** Duur van periodes met datums (min en max bij onvolledige datums), of null als geen enkele periode datums heeft. */
export function duurVan(periodes: Periode[], peil: Date): Duur | null {
  const min: Bereik[] = [], max: Bereik[] = [];
  for (const p of periodes) {
    const b = datum(p.begin, peil), e = datum(p.einde, peil);
    if (!b || !e) continue;
    min.push([b[1], e[0]]);
    max.push([b[0], e[1]]);
  }
  if (!max.length) return null;
  return { min: Math.max(1, maandenUnie(min.map(([a, b]) => (b < a ? [a, a] : [a, b]) as Bereik))), max: maandenUnie(max) };
}

/** Maanden sinds de laatste periode, "nu" als er een nog loopt, null als onbekend. */
function recentVan(periodes: Periode[], peil: Date): number | "nu" | null {
  const p = maandNr(peil.getUTCFullYear(), peil.getUTCMonth() + 1);
  let laatste: number | null = null;
  for (const x of periodes) {
    if (x.einde === "heden") return "nu";
    const e = datum(x.einde, peil);
    if (e) laatste = laatste === null ? e[1] : Math.max(laatste, e[1]);
  }
  if (laatste === null) return null;
  return laatste >= p ? "nu" : p - laatste;
}

const CERTIFICAAT = /heftruck|reachtruck|vorkheftruck|forklift|reach truck|orderpick(?:truck)?[- ]?certificaat|certificaat heftruck/i;

export interface MatchInvoer { invoer: Invoer; feiten: { A: string; B: string; C: string; D: string }; schatting: boolean }

/** Bouwt de invoer van de rekenmodule uit de periodes, de certificaten en het gesprek. */
export function invoerVan(model: FunctieModel, periodes: Periode[], certificaten: string[], gesprek: GesprekKennis, peil: Date): MatchInvoer {
  const zelfdeCv = periodes.filter((p) => p.soort === "zelfde" && p.bron === "cv");
  const zelfdeGesprek = periodes.filter((p) => p.soort === "zelfde" && p.bron === "gesprek" && (p.duurMaanden || 0) > 0);
  const verwant = periodes.filter((p) => p.soort === "verwant");
  const zelfGeen = gesprek.ervaringNiveau === "geen";

  // A: ervaring in de functie. Cv met datums gaat voor; het gesprek vult aan of verlengt de bandbreedte.
  let A: Invoer["A"] = null;
  let feitA = "niet vermeld";
  const cvDuur = duurVan(zelfdeCv, peil);
  const gesprekMaanden = Math.max(0, ...zelfdeGesprek.map((p) => p.duurMaanden || 0));
  if (cvDuur) {
    A = gesprekMaanden > cvDuur.max ? { min: cvDuur.min, max: gesprekMaanden } : cvDuur;
    feitA = `${cvDuur.min === cvDuur.max ? cvDuur.min : `${cvDuur.min} tot ${cvDuur.max}`} maanden · cv${gesprekMaanden > cvDuur.max ? `; gesprek ${gesprekMaanden}` : ""}`;
  } else if (gesprekMaanden > 0) {
    A = { min: gesprekMaanden, max: gesprekMaanden };
    feitA = `${gesprekMaanden} maanden · gesprek`;
  } else if (zelfGeen) {
    A = 0; feitA = "zelf aangegeven: geen · gesprek";
  }

  // B: kerntaken, elke kerntaak één keer.
  let B: Invoer["B"] = null;
  let feitB = "onbekend";
  if (A === 0) { B = 0; feitB = "geen ervaring in de functie"; }
  else if (A !== null) {
    const taken = new Set<number>();
    for (const p of [...zelfdeCv, ...zelfdeGesprek]) for (const k of p.kerntaken) if (k >= 0 && k < model.kerntaken.length) taken.add(k);
    B = taken.size === 0 ? "titel" : taken.size === 1 ? 1 : 2;
    feitB = taken.size === 0 ? "alleen de functietitel" : Array.from(taken).map((k) => model.kerntaken[k]).join(", ");
  }

  // C: verwante ervaring (alleen werk uit de lijst).
  const C = duurVan(verwant.filter((p) => p.bron === "cv"), peil);
  const feitC = C ? `${C.min === C.max ? C.min : `${C.min} tot ${C.max}`} maanden · cv` : "niet vermeld · telt niet mee";

  // D: hoe recent.
  const D = zelfdeCv.length ? recentVan(zelfdeCv, peil) : null;
  const feitD = D === "nu" ? "nog bezig of deze maand" : D === null ? "onbekend" : `${D} maanden geleden`;

  // De ervaringseis: geen punt, een aparte uitkomst.
  let eis: Eis = "geen";
  if (model.soort === "vereist") {
    const heeftZelfde = A !== null && A !== 0;
    if (A === 0 || (zelfGeen && !heeftZelfde)) eis = "niet_voldaan";
    else if (heeftZelfde) {
      if (model.eisRegel === "certificaat") eis = certificaten.some((c) => CERTIFICAAT.test(c)) ? "voldaan" : "onbekend";
      else if (model.eisRegel === "drieBorden") eis = gesprek.drieBorden === "ja" && gesprek.etiquette === "ja" ? "voldaan" : "onbekend";
      else if (model.eisRegel === "kerntaak0") eis = [...zelfdeCv, ...zelfdeGesprek].some((p) => p.kerntaken.includes(0)) ? "voldaan" : "onbekend";
      else eis = "voldaan";
      // Minimaal zes maanden in de functie (besluit Max 16 nov 2026). Niet bij heftruck: daar telt het certificaat.
      // Zeker te kort: niet voldaan. Kan het allebei zijn (datums onvolledig): onbekend, een mens kijkt.
      if (EIS_MAANDEN_VOOR.includes(model.sleutel) && A && typeof A === "object") {
        if (A.max < EIS_MAANDEN) eis = "niet_voldaan";
        else if (A.min < EIS_MAANDEN && eis === "voldaan") eis = "onbekend";
      }
    } else eis = verwant.length ? "af_te_wegen" : "onbekend";
    // Dinerloper: drie borden en etiquette zijn allebei vereist. Zegt de kandidaat zelf een van beide niet te doen, dan is de eis niet gehaald.
    if (model.eisRegel === "drieBorden" && (gesprek.drieBorden === "nee" || gesprek.etiquette === "nee")) eis = "niet_voldaan";
    // Heftruck (vraagversie 2): zelf rijden is de ervaring. Zegt de kandidaat nooit zelf te hebben gereden: niet gehaald,
    // tenzij het cv wel rijwerk toont; dan spreken ze elkaar tegen en weegt een collega het af.
    if (model.versie2 && model.sleutel === "heftruck" && gesprek.gereden === "geen") eis = zelfdeCv.length ? "af_te_wegen" : "niet_voldaan";
  }
  const schatting = !!(A && typeof A === "object" && A.min !== A.max) || !!(C && C.min !== C.max);
  return { invoer: { soort: model.soort, eis, A, B, C, D }, feiten: { A: feitA, B: feitB, C: feitC, D: feitD }, schatting };
}

// ─── Voor de kaart ───────────────────────────────────────────────────────────

const MAAND_KORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
/** "2022-08" wordt "aug 2022"; "heden" wordt "nu". */
export function datumTekst(d: string | null): string {
  if (!d) return "?";
  if (d === "heden") return "nu";
  const m = /^(\d{4})-(\d{2})$/.exec(d);
  return m ? `${MAAND_KORT[Number(m[2]) - 1]} ${m[1]}` : d;
}
/** Een duur leesbaar: onder twee jaar in maanden, daarboven in jaren. */
export function duurTekst(min: number, max: number): string {
  if (max < 24) return `${min === max ? min : `${min} tot ${max}`} maanden`;
  const a = Math.floor(min / 12), b = Math.floor(max / 12);
  return a === b ? `ruim ${a} jaar` : `${a} tot ${b} jaar`;
}

const GEWICHT_PUBLIEK = (s: Soort) => GEWICHT[s];

/** Heftruck: per truck wat de kandidaat zelf reed en welk certificaat er is, voor de planner. */
function truckTekst(g: GesprekKennis, certificaten: string[]): string {
  const gereden = g.gereden === "allebei" ? "heftruck en reachtruck" : g.gereden === "geen" ? "geen van beide" : g.gereden || "onbekend";
  const cert = (x: string | null | undefined) => (x === "opgegeven" ? "opgegeven" : x === "verlopen" ? "verlopen" : x === "geen" ? "geen" : "onbekend");
  const cv = certificaten.filter((c) => CERTIFICAAT.test(c));
  return `Zelf gereden volgens de kandidaat: ${gereden}. Certificaat volgens de kandidaat: heftruck ${cert(g.certHeftruck)}, reachtruck ${cert(g.certReachtruck)}${cv.length ? `; op het cv: ${cv.join(", ")}` : ""}. Per opdracht controleren.`;
}

const labelVoor = (soort: Soort, starter: boolean, score: number) => (soort === "starters" && starter ? "Past als starter (geen ervaring vereist)"
  : score >= 85 ? "Sterke match op basis van beschikbare informatie"
  : score >= 70 ? "Goede match, met aandachtspunten" : score >= 50 ? "Gedeeltelijke match" : "Zwakke match voor deze functie");

/**
 * Front office: bevestigd Nederlands voor gastcontact geeft NL_BONUS_FRONT_OFFICE punten erbij (plafond 100).
 * Dekking en "voorlopig" veranderen niet: het is een voorkeur, geen onderdeel van de ervaring.
 */
export function metNederlands(u: Uitkomst, model: FunctieModel, gesprek: GesprekKennis, bonus = NL_BONUS_FRONT_OFFICE): Uitkomst {
  if (model.sleutel !== "frontoffice" || gesprek.nederlands !== "ja" || !bonus || u.toestand !== "score") return u;
  const op = (x: number | undefined) => Math.min(100, (x ?? 0) + bonus);
  const score = op(u.score);
  return { ...u, score, laag: op(u.laag), hoog: op(u.hoog), label: labelVoor(model.soort, false, score) };
}
const NIVEAU_TEKST = (n: number | null) => (n === null ? "onbekend" : String(n).replace(".", ","));

export interface MatchKaart {
  model: { sleutel: string; naam: string; soort: Soort };
  uitkomst: Uitkomst;
  eis: { status: Eis; tekst: string };
  uitleg: string;
  berekening: [string, number, string, string][];
  som: string;
  sterk: [string, string][];
  aandacht: { t: string; d: string; soort: "open" | "onbekend" | "schatting" }[];
}

/**
 * Alles wat de kaart toont, uit dezelfde regels. Opties: versie2 = het gesprek liep op vraagversie 2 (alleen dan de
 * taalregels en de punten uit het gesprek); formulierKeuze = de functie zoals gekozen op het formulier, als die
 * afwijkt van de functie die met de kandidaat is vastgesteld.
 */
export function matchKaart(model: FunctieModel, periodes: Periode[], certificaten: string[], gesprek: GesprekKennis, peil: Date, opties: { versie2?: boolean; functie?: string | null; formulierKeuze?: string | null } = {}): MatchKaart {
  const v2 = !!opties.versie2 || !!model.versie2;
  const { invoer, feiten, schatting } = invoerVan(model, periodes, certificaten, gesprek, peil);
  const u = v2 ? metNederlands(bereken(invoer), model, gesprek) : bereken(invoer);
  const w = GEWICHT_PUBLIEK(model.soort);
  const A = invoer.A === null ? null : invoer.A === 0 ? 0 : duurNiveau((invoer.A.min + invoer.A.max) / 2);
  const B = invoer.B === "titel" ? 0.5 : invoer.B === 1 ? 0.75 : invoer.B === 2 ? 1 : invoer.B === 0 ? 0 : null;
  const C = invoer.C === null ? null : duurNiveau((invoer.C.min + invoer.C.max) / 2);
  const D = w.D === 0 ? null : invoer.A === 0 ? 0 : invoer.D === "nu" ? 1 : invoer.D === null ? null : invoer.D <= 12 ? 1 : invoer.D <= 36 ? 0.5 : 0;
  const berekening: [string, number, string, string][] = [
    ["A Ervaring in de functie", w.A, NIVEAU_TEKST(A) + (invoer.A && typeof invoer.A === "object" && invoer.A.min !== invoer.A.max ? " (schatting)" : ""), feiten.A],
    ["B Kerntaken", w.B, NIVEAU_TEKST(B), feiten.B],
    ["C Verwante ervaring", w.C, NIVEAU_TEKST(C) + (invoer.C && invoer.C.min !== invoer.C.max ? " (schatting)" : ""), feiten.C],
    ["D Recent", w.D, w.D === 0 ? "telt niet" : NIVEAU_TEKST(D), w.D === 0 ? "geen gewicht bij starters welkom" : feiten.D],
  ];
  // Vraagversie 2, front office en host: de taal voor gastcontact staat erbij, met de bron. Engels is de basis
  // (geen punten, een collega kijkt bij nee); Nederlands telt bij front office pas mee als de weging gekozen is.
  const bronTekst = (x: "ja" | "nee" | null | undefined) => (x === "ja" ? "ja · door kandidaat verteld" : x === "nee" ? "nee · door kandidaat verteld" : "onbekend");
  if (v2 && (model.sleutel === "frontoffice" || opties.functie === "host")) {
    berekening.push(["E Engels voor gastcontact", 0, "basis, geen punten", bronTekst(gesprek.engels)]);
  }
  if (v2 && model.sleutel === "frontoffice") {
    const nl = gesprek.nederlands;
    berekening.push(["F Nederlands voor gastcontact", NL_BONUS_FRONT_OFFICE, NL_BONUS_FRONT_OFFICE ? (nl === "ja" ? `+${NL_BONUS_FRONT_OFFICE}` : "0") : "telt nog niet", bronTekst(nl)]);
  }
  const soortTekst = { starters: "Starters welkom", gewenst: "Ervaring gewenst", vereist: "Ervaring vereist" }[model.soort];
  const som = u.toestand === "score"
    ? `${soortTekst}, startpunt ${w.start} · score ${u.score}${u.laag !== u.hoog ? ` · bandbreedte ${u.laag} tot ${u.hoog}` : ""} · dekking ${u.dekking}%`
    : u.toestand === "eis_niet_voldaan" ? "Ervaringseis niet voldaan: geen score. De beslissing ligt bij de beoordelaar."
      : `${soortTekst} · dekking ${u.dekking}%: geen score (een score vraagt bekende ervaring en minstens 70% dekking)`;
  const jnTekst = (x: "ja" | "nee" | null | undefined) => (x === "ja" ? "ja (door kandidaat verteld)" : x === "nee" ? "nee (door kandidaat verteld)" : "onbekend");
  const eisTekst = (model.soort !== "vereist" ? `Geen ervaringseis: ${model.soort === "starters" ? "starters zijn welkom" : "ervaring is gewenst, niet vereist"}.`
    : ({ voldaan: "Voldaan", niet_voldaan: "Niet voldaan", onbekend: "Onbekend", af_te_wegen: "Af te wegen door de beoordelaar", geen: "" } as Record<Eis, string>)[invoer.eis] + `: ${model.eisTekst}.`)
    + (model.eisRegel === "drieBorden" ? ` Drie borden aan tafel: ${jnTekst(gesprek.drieBorden)}. Serveeretiquette: ${jnTekst(gesprek.etiquette)}.` : "")
    + (model.versie2 && model.sleutel === "heftruck" ? ` ${truckTekst(gesprek, certificaten)}` : "");
  const zelfde = periodes.filter((p) => p.soort === "zelfde");
  const sterk: [string, string][] = zelfde.slice(0, 3).map((p) => [`${p.functie}${p.werkgever ? `, ${p.werkgever}` : ""}${p.begin || p.einde ? `, ${datumTekst(p.begin)} tot ${datumTekst(p.einde)}` : p.duurMaanden ? `, ${p.duurMaanden} maanden` : ""}`, p.bron]);
  const aandacht: MatchKaart["aandacht"] = [];
  const cvZelfde = periodes.some((p) => p.soort === "zelfde" && p.bron === "cv");
  if (v2 && opties.formulierKeuze && opties.functie && opties.formulierKeuze !== opties.functie) aandacht.push({ t: "Functie gewisseld", d: `Op het formulier als eerste gekozen: ${opties.formulierKeuze}. Met Job vastgesteld: ${opties.functie}; de score gaat over ${model.naam}.`, soort: "open" });
  if (model.versie2 && model.sleutel === "heftruck" && gesprek.gereden === "geen" && cvZelfde) aandacht.push({ t: "Gesprek en cv verschillen over zelf rijden", d: "De kandidaat zei tegen Job nog niet zelf te hebben gereden; het cv toont wel rijwerk. Vraag het na.", soort: "open" });
  if (gesprek.ervaringNiveau === "geen" && cvZelfde) aandacht.push({ t: "Gesprek en cv verschillen", d: "In het gesprek gaf de kandidaat aan geen ervaring te hebben; het cv toont wel ervaring in de functie. Vraag het bij de kennismaking.", soort: "open" });
  if (invoer.eis === "onbekend") aandacht.push({ t: "Ervaringseis onbekend", d: `Niet aangetoond: ${model.eisTekst}. Vraag het bij de kennismaking.`, soort: "open" });
  if (invoer.eis === "af_te_wegen") aandacht.push({ t: "Alleen verwante ervaring", d: `Verwant (${model.verwant}) telt niet vanzelf als ervaring in de functie. Weeg het af.`, soort: "open" });
  if (invoer.B === "titel") aandacht.push({ t: "Werkzaamheden onbekend", d: "Alleen de functietitel is bekend, de werkzaamheden niet.", soort: "open" });
  if (schatting) aandacht.push({ t: "Datums onvolledig", d: "Een of meer periodes staan er alleen met jaartallen; de score gebruikt een schatting.", soort: "schatting" });
  if (invoer.A === null) aandacht.push({ t: "Ervaring in de functie onbekend", d: "Het cv en het gesprek noemen geen ervaring in deze functie. Onbekend is geen nul.", soort: "onbekend" });
  if (invoer.C === null && invoer.A !== 0 && aandacht.length < 3) aandacht.push({ t: "Verwante ervaring niet vermeld", d: "Onbekend, telt niet mee en geeft geen aftrek.", soort: "onbekend" });
  const uitleg = u.toestand === "eis_niet_voldaan" ? (model.eisRegel === "drieBorden" && gesprek.drieBorden === "nee" ? "De kandidaat geeft zelf aan niet met drie borden tegelijk aan tafel te hebben uitgeserveerd."
      : model.eisRegel === "drieBorden" && gesprek.etiquette === "nee" ? "De kandidaat geeft zelf aan de serveeretiquette aan tafel niet te kennen."
      : model.versie2 && model.sleutel === "heftruck" && gesprek.gereden === "geen" ? "De kandidaat geeft zelf aan nog niet op een heftruck of reachtruck te hebben gereden."
      : "De kandidaat geeft zelf aan geen ervaring in deze functie te hebben.")
    : invoer.A === null ? "Geen ervaring in deze functie gevonden in het cv of het gesprek."
      : invoer.A === 0 ? "Geen ervaring in deze functie; voor deze functie zijn starters welkom."
        : `${invoer.A && typeof invoer.A === "object" ? duurTekst(invoer.A.min, invoer.A.max) : feiten.A.split(" · ")[0]} ervaring in de functie; ${invoer.B === "titel" ? "werkzaamheden niet beschreven" : invoer.B === 2 ? "kerntaken beschreven" : invoer.B === 1 ? "één kerntaak beschreven" : "geen kerntaken"}.`;
  return { model: { sleutel: model.sleutel, naam: model.naam, soort: model.soort }, uitkomst: u, eis: { status: invoer.eis, tekst: eisTekst }, uitleg, berekening, som, sterk, aandacht: aandacht.slice(0, 3) };
}
