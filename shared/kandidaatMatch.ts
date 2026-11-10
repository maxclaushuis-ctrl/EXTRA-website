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

export type EisRegel = "ervaring" | "kerntaak0" | "certificaat" | "geen";
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
}

export const FUNCTIE_MODELLEN: Record<string, FunctieModel> = {
  housekeeping: { sleutel: "housekeeping", naam: "Housekeeping", soort: "vereist", eisRegel: "ervaring",
    eisTekst: "enige relevante ervaring met hotelkamers of vergelijkbaar housekeepingwerk",
    kerntaken: ["kamers opmaken", "badkamers schoonmaken", "werken met een kamerlijst"],
    verwant: "ander schoonmaakwerk (telt nooit vanzelf als hotelervaring)" },
  frontoffice: { sleutel: "frontoffice", naam: "Front office", soort: "vereist", eisRegel: "ervaring",
    eisTekst: "enige receptie-ervaring",
    kerntaken: ["in- en uitchecken", "reserveringen", "gasten te woord staan"],
    verwant: "klantenservice, baliewerk" },
  kok: { sleutel: "kok", naam: "Zelfstandig werkend kok", soort: "vereist", eisRegel: "kerntaak0",
    eisTekst: "koken, zelfstandig op een post",
    kerntaken: ["zelfstandig een post draaien", "mise-en-place", "bestellingen afwerken tijdens de service"],
    verwant: "keukenassistent of keukenhulp, cateringkeuken" },
  heftruck: { sleutel: "heftruck", naam: "Heftruck of reachtruck", soort: "vereist", eisRegel: "certificaat",
    eisTekst: "geldig certificaat",
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
export function modelVoor(functieEersteKeus: string | null | undefined, functionType: string | null | undefined, label?: string | null): FunctieModel {
  const k = (functieEersteKeus || "").toLowerCase();
  const t = (functionType || "").toLowerCase();
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
      else if (model.eisRegel === "kerntaak0") eis = [...zelfdeCv, ...zelfdeGesprek].some((p) => p.kerntaken.includes(0)) ? "voldaan" : "onbekend";
      else eis = "voldaan";
    } else eis = verwant.length ? "af_te_wegen" : "onbekend";
  }
  const schatting = !!(A && typeof A === "object" && A.min !== A.max) || !!(C && C.min !== C.max);
  return { invoer: { soort: model.soort, eis, A, B, C, D }, feiten: { A: feitA, B: feitB, C: feitC, D: feitD }, schatting };
}

// ─── Voor de kaart ───────────────────────────────────────────────────────────

const GEWICHT_PUBLIEK = (s: Soort) => GEWICHT[s];
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

/** Alles wat de kaart toont, uit dezelfde regels. */
export function matchKaart(model: FunctieModel, periodes: Periode[], certificaten: string[], gesprek: GesprekKennis, peil: Date): MatchKaart {
  const { invoer, feiten, schatting } = invoerVan(model, periodes, certificaten, gesprek, peil);
  const u = bereken(invoer);
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
  const soortTekst = { starters: "Starters welkom", gewenst: "Ervaring gewenst", vereist: "Ervaring vereist" }[model.soort];
  const som = u.toestand === "score"
    ? `${soortTekst}, startpunt ${w.start} · score ${u.score}${u.laag !== u.hoog ? ` · bandbreedte ${u.laag} tot ${u.hoog}` : ""} · dekking ${u.dekking}%`
    : u.toestand === "eis_niet_voldaan" ? "Ervaringseis niet voldaan: geen score. De beslissing ligt bij de beoordelaar."
      : `${soortTekst} · dekking ${u.dekking}%: geen score (een score vraagt bekende ervaring en minstens 70% dekking)`;
  const eisTekst = model.soort !== "vereist" ? `Geen ervaringseis: ${model.soort === "starters" ? "starters zijn welkom" : "ervaring is gewenst, niet vereist"}.`
    : ({ voldaan: "Voldaan", niet_voldaan: "Niet voldaan, zelf aangegeven", onbekend: "Onbekend", af_te_wegen: "Af te wegen door de beoordelaar", geen: "" } as Record<Eis, string>)[invoer.eis] + `: ${model.eisTekst}.`;
  const zelfde = periodes.filter((p) => p.soort === "zelfde");
  const sterk: [string, string][] = zelfde.slice(0, 3).map((p) => [`${p.functie}${p.werkgever ? `, ${p.werkgever}` : ""}${p.begin || p.einde ? `, ${p.begin || "?"} tot ${p.einde === "heden" ? "nu" : p.einde || "?"}` : p.duurMaanden ? `, ${p.duurMaanden} maanden` : ""}`, p.bron]);
  const aandacht: MatchKaart["aandacht"] = [];
  if (invoer.eis === "onbekend") aandacht.push({ t: "Ervaringseis onbekend", d: `Niet aangetoond: ${model.eisTekst}. Vraag het bij de kennismaking.`, soort: "open" });
  if (invoer.eis === "af_te_wegen") aandacht.push({ t: "Alleen verwante ervaring", d: `Verwant (${model.verwant}) telt niet vanzelf als ervaring in de functie. Weeg het af.`, soort: "open" });
  if (invoer.B === "titel") aandacht.push({ t: "Werkzaamheden onbekend", d: "Alleen de functietitel is bekend, de werkzaamheden niet.", soort: "open" });
  if (schatting) aandacht.push({ t: "Datums onvolledig", d: "Een of meer periodes staan er alleen met jaartallen; de score gebruikt een schatting.", soort: "schatting" });
  if (invoer.A === null) aandacht.push({ t: "Ervaring in de functie onbekend", d: "Het cv en het gesprek noemen geen ervaring in deze functie. Onbekend is geen nul.", soort: "onbekend" });
  if (invoer.C === null && invoer.A !== 0 && aandacht.length < 3) aandacht.push({ t: "Verwante ervaring niet vermeld", d: "Onbekend, telt niet mee en geeft geen aftrek.", soort: "onbekend" });
  const uitleg = u.toestand === "eis_niet_voldaan" ? "De kandidaat geeft zelf aan geen ervaring in deze functie te hebben."
    : invoer.A === null ? "Geen ervaring in deze functie gevonden in het cv of het gesprek."
      : invoer.A === 0 ? "Geen ervaring in deze functie; voor deze functie zijn starters welkom."
        : `${feiten.A.split(" · ")[0]} ervaring in de functie; ${invoer.B === "titel" ? "werkzaamheden niet beschreven" : invoer.B === 2 ? "kerntaken beschreven" : invoer.B === 1 ? "één kerntaak beschreven" : "geen kerntaken"}.`;
  return { model: { sleutel: model.sleutel, naam: model.naam, soort: model.soort }, uitkomst: u, eis: { status: invoer.eis, tekst: eisTekst }, uitleg, berekening, som, sterk, aandacht: aandacht.slice(0, 3) };
}
