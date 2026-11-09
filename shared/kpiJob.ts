/**
 * KPI & Rapportage: de cijfers van Job en de instroom per week
 * (mock-up Job en KPI, akkoord Max 9 nov 2026).
 *
 * Puur: de route haalt de rijen op, deze module telt. Getest in
 * shared/kpiJob.test.ts.
 *
 * Een kandidaat telt bij elke stap tot en met de verste stap die hij haalde.
 * Definities (staan ook op de pagina als uitleg):
 * - Gesprek met Job: er is een gesprek met Job gestart.
 * - Vragen beantwoord: Job heeft alle vragen gesteld (wacht op cv, cv-controle,
 *   plannen of gepland) of er staat al een kennismaking.
 * - Cv binnen: de kandidaat heeft een cv.
 * - Cv goedgekeurd: het gesprek staat op plannen of gepland, of er staat een kennismaking.
 * - Gepland: er staat een kennismaking (interview_date).
 * - Verschenen: de intake is gestart, de sollicitant is verder in het proces, of aangenomen.
 * - Niet verschenen: gearchiveerd met de reden "niet_verschenen".
 * - Opkomst: verschenen gedeeld door verschenen plus niet verschenen.
 */

export type KpiLabel = "hotels" | "events" | "logistiek";

export interface KpiKandidaat {
  id: number;
  createdAt: string | Date;
  hasCv: boolean | null;
  interviewDate: string | null;
  interviewTime?: string | null;
  status: string | null;
  /** hotels, events of logistiek, zoals Sollicitanten het toont (brancheVan in sollicitantRegels). */
  label: string | null;
}

export interface KpiGesprek {
  candidateId: number;
  status: string;
  laatsteOnderwerp: string | null;
  gestartAt: string | Date;
  /** Eerste bericht van de kandidaat. */
  eersteAntwoordAt: string | Date | null;
  /** Eerste bericht met een cv. */
  cvAt: string | Date | null;
}

export interface KpiDossier {
  candidateId: number;
  stap: string;
  intakeStatus: string;
  archiefReden: string | null;
}

export interface KpiJobUit {
  aanmeldingen: number;
  /**
   * Aanmeldingen in dezelfde periode, hele weken eerder (deze week tot nu
   * tegen vorige week tot hetzelfde moment). Null zonder begindatum.
   */
  vorigePeriode: number | null;
  /** Hoeveel weken eerder de vergelijking ligt (1 bij deze of vorige week). */
  vorigeWekenTerug: number | null;
  trechter: {
    aangemeld: number; jobGestart: number; vragenAf: number; cvBinnen: number; cvGoedgekeurd: number;
    gepland: number; verschenen: number; nietVerschenen: number; aangenomen: number;
  };
  /** Procent, of null als er nog niemand verscheen of wegbleef. */
  opkomst: number | null;
  afhaak: { onderwerp: string; label: string; aantal: number }[];
  snelheid: { eersteAntwoordMinuten: number | null; cvUren: number | null; kennismakingDagen: number | null };
  weken: { label: string; van: string; aanmeldingen: number; gepland: number; verschenen: number }[];
}

const NA_VRAGEN = ["wacht_cv", "cv_controle", "plannen", "gepland"];
const CV_GOED = ["plannen", "gepland"];
const VERDER = ["beoordelen", "ref_doc_check", "extra_check", "onboarding"];

const ONDERWERP_LABEL: Record<string, string> = {
  ervaring: "Ervaring", functievraag: "Vervolgvraag", specialisatie: "Specialisatie", werkautorisatie: "Werkvergunning",
  geldigheid: "Geldigheid document", diensten: "Diensten", werkgebied: "Regio", hotels: "Hotels", sterren: "Sterren", werkmoment: "Wanneer werken",
  startdatum: "Wanneer beginnen", werkvorm: "Studie of bijbaan", talen: "Talen", cv: "Cv sturen",
};

const tijd = (x: string | Date) => (x instanceof Date ? x.getTime() : new Date(x).getTime());

function mediaan(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const rond = (x: number | null, d = 1) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);

/** Maandag 00:00 (lokale tijd) van de week waarin d valt. */
export function maandagVan(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** ISO-weeknummer. */
export function weeknummer(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dag);
  const jan1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
}

/** Kennismakingsmoment als tijdstip (datum plus tijd, anders 12:00). */
function kennismaking(k: KpiKandidaat): number | null {
  if (!k.interviewDate) return null;
  const t = String(k.interviewTime || "12:00").slice(0, 5);
  const d = new Date(`${String(k.interviewDate).slice(0, 10)}T${t}:00`);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export function berekenJobKpi(input: {
  kandidaten: KpiKandidaat[];
  gesprekken: KpiGesprek[];
  dossiers: KpiDossier[];
  van: Date | null;
  /** Exclusief: alles vóór dit moment telt mee. */
  tot: Date | null;
  label: KpiLabel | null;
  nu: Date;
  aantalWeken?: number;
}): KpiJobUit {
  const { van, tot, label, nu } = input;
  const opLabel = input.kandidaten.filter((k) => !label || k.label === label);
  const inPeriode = (k: KpiKandidaat, a: Date | null, b: Date | null) => {
    const t = tijd(k.createdAt);
    return (!a || t >= a.getTime()) && (!b || t < b.getTime());
  };
  const deze = opLabel.filter((k) => inPeriode(k, van, tot));

  let vorigePeriode: number | null = null;
  let vorigeWekenTerug: number | null = null;
  if (van) {
    const eind = tot || nu;
    const week = 7 * 86400000;
    vorigeWekenTerug = Math.max(1, Math.ceil((eind.getTime() - van.getTime()) / week));
    const terug = vorigeWekenTerug * week;
    vorigePeriode = opLabel.filter((k) => inPeriode(k, new Date(van.getTime() - terug), new Date(eind.getTime() - terug))).length;
  }

  const gesprekVan = new Map(input.gesprekken.map((g) => [g.candidateId, g]));
  const dossierVan = new Map(input.dossiers.map((d) => [d.candidateId, d]));

  const isVerschenen = (k: KpiKandidaat) => {
    const d = dossierVan.get(k.id);
    return k.status === "aangenomen" || (!!d && (d.intakeStatus !== "niet_gestart" || VERDER.includes(d.stap)));
  };
  const isNietVerschenen = (k: KpiKandidaat) => dossierVan.get(k.id)?.archiefReden === "niet_verschenen";

  // Een echte trechter: wie een latere stap haalde, telt ook bij de stappen ervoor
  // (iemand met een kennismaking maar zonder gesprek met Job telt dus mee als "verder").
  const verste = (k: KpiKandidaat): number => {
    const g = gesprekVan.get(k.id);
    if (k.status === "aangenomen") return 7;
    if (isVerschenen(k)) return 6;
    if (k.interviewDate) return 5;
    if (CV_GOED.includes(g?.status || "")) return 4;
    if (k.hasCv && (!g || NA_VRAGEN.includes(g.status))) return 3;
    if (NA_VRAGEN.includes(g?.status || "")) return 2;
    if (g) return 1;
    return 0;
  };
  const stap = deze.map(verste);
  const vanaf = (i: number) => stap.filter((x) => x >= i).length;
  const trechter = {
    aangemeld: deze.length,
    jobGestart: vanaf(1),
    vragenAf: vanaf(2),
    cvBinnen: vanaf(3),
    cvGoedgekeurd: vanaf(4),
    gepland: vanaf(5),
    verschenen: vanaf(6),
    nietVerschenen: deze.filter((k) => !isVerschenen(k) && isNietVerschenen(k)).length,
    aangenomen: vanaf(7),
  };
  const bekend = trechter.verschenen + trechter.nietVerschenen;
  const opkomst = bekend ? Math.round((trechter.verschenen / bekend) * 100) : null;

  // Afhaken: gesprekken zonder reactie, per laatste vraag.
  const telling = new Map<string, number>();
  for (const k of deze) {
    const g = gesprekVan.get(k.id);
    if (!g || g.status !== "geen_reactie") continue;
    const o = g.laatsteOnderwerp || "onbekend";
    telling.set(o, (telling.get(o) || 0) + 1);
  }
  const afhaak = Array.from(telling.entries())
    .map(([onderwerp, aantal]) => ({ onderwerp, label: ONDERWERP_LABEL[onderwerp] || "Onbekend", aantal }))
    .sort((a, b) => b.aantal - a.aantal);

  // Snelheid: mediaan, vanaf de aanmelding (eerste antwoord: vanaf de start van het gesprek).
  const antwoord: number[] = [];
  const cv: number[] = [];
  const km: number[] = [];
  for (const k of deze) {
    const g = gesprekVan.get(k.id);
    if (g?.eersteAntwoordAt) antwoord.push((tijd(g.eersteAntwoordAt) - tijd(g.gestartAt)) / 60000);
    if (g?.cvAt) cv.push((tijd(g.cvAt) - tijd(k.createdAt)) / 3600000);
    const m = kennismaking(k);
    if (m !== null) km.push((m - tijd(k.createdAt)) / 86400000);
  }
  const pos = (xs: number[]) => xs.filter((x) => x >= 0);
  const snelheid = {
    eersteAntwoordMinuten: rond(mediaan(pos(antwoord)), 0),
    cvUren: rond(mediaan(pos(cv))),
    kennismakingDagen: rond(mediaan(pos(km))),
  };

  // Per week: cohort van aanmeldingen (label telt mee, de gekozen periode niet).
  const aantal = input.aantalWeken ?? 8;
  const dezeMaandag = maandagVan(nu);
  const weken: KpiJobUit["weken"] = [];
  for (let i = aantal - 1; i >= 0; i--) {
    const a = new Date(dezeMaandag); a.setDate(a.getDate() - 7 * i);
    const b = new Date(a); b.setDate(b.getDate() + 7);
    const cohort = opLabel.filter((k) => inPeriode(k, a, b));
    weken.push({
      label: `wk ${weeknummer(a)}`,
      van: `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, "0")}-${String(a.getDate()).padStart(2, "0")}`,
      aanmeldingen: cohort.length,
      gepland: cohort.filter((k) => !!k.interviewDate).length,
      verschenen: cohort.filter(isVerschenen).length,
    });
  }

  return { aanmeldingen: deze.length, vorigePeriode, vorigeWekenTerug, trechter, opkomst, afhaak, snelheid, weken };
}
