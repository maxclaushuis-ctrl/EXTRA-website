/**
 * Kandidaten 3.0 (borden G en H): welke kandidaten er staan, welk bolletje ze
 * krijgen, wat de status in woorden is en sinds wanneer. Alles wordt afgeleid,
 * niets opgeslagen. Getest in shared/kandidaat.test.ts.
 *
 * In Kandidaten staan lopende kandidaten vóór het gesprek op kantoor:
 * status in_behandeling, of gepland zonder gespreksdatum (uitgenodigd, nog geen
 * moment). Met een gespreksdatum staan ze in Sollicitanten, afgewezen in het
 * Archief en aangenomen in Onboarding.
 */
import { FUNCTIES_MET_ERVARING, openOnderwerpen, type JobVelden } from "./jobRegels";

export type Kleur = "geel" | "rood" | "oranje2" | "oranje1" | "oranje";
export const KLEUREN: Record<Kleur, { kleur: string; label: string; cijfer?: string }> = {
  geel: { kleur: "#E8C93A", label: "Twijfel of besluit nodig" },
  rood: { kleur: "#C2412D", label: "Onvolledig na 2e herinnering" },
  oranje2: { kleur: "#D9761C", label: "2e herinnering", cijfer: "2" },
  oranje1: { kleur: "#E9963A", label: "1e herinnering", cijfer: "1" },
  oranje: { kleur: "#F2B866", label: "Nog niet alles ingevuld" },
};
export const KLEUR_VOLGORDE: Kleur[] = ["geel", "rood", "oranje2", "oranje1", "oranje"];

export type RedenCode =
  | "match" | "werkautorisatie" | "ervaring" | "mens" | "cv" | "twijfel" | "jong" | "buitenland"
  | "gestopt" | "geen_job" | "uitgenodigd_lang" | "geen_reactie" | "bezig" | "uitgenodigd" | "nog_niet_gestart";

export interface KandidaatInvoer {
  status: string;
  interviewDate: string | null;
  createdAt: Date | string;
  birthDate: string | null;
  woonland: string | null;
  functie: string;
  nationalityZone: string | null;
  hasCv: boolean;
  job: null | {
    status: string;
    herinneringen: number;
    herinneringAt: Date | string | null;
    laatsteActiviteitAt: Date | string;
    bijgewerktAt: Date | string;
    velden: JobVelden;
    twijfels: string[];
  };
  matchOpen: null | { aangemaaktOp: Date | string; redenen: string[] };
  /** Moment van uitnodigen (Accepteren); anders de laatste activiteit van Job bij "plannen". */
  uitgenodigdAt?: Date | string | null;
}

export interface Bolletje {
  kleur: Kleur;
  cijfer?: string;
  reden: RedenCode;
  tekst: string;
  sinds: Date;
  /** Alle gele redenen, voor het dossier. */
  gele: { reden: RedenCode; tekst: string }[];
}

export function inKandidaten(c: { status: string; interviewDate: string | null }): boolean {
  return c.status === "in_behandeling" || (c.status === "gepland" && !c.interviewDate);
}

function leeftijd(geboren: string | null, nu: Date): number | null {
  if (!geboren) return null;
  const g = new Date(`${String(geboren).slice(0, 10)}T12:00:00Z`);
  if (isNaN(g.getTime())) return null;
  let j = nu.getUTCFullYear() - g.getUTCFullYear();
  const m = nu.getUTCMonth() - g.getUTCMonth();
  if (m < 0 || (m === 0 && nu.getUTCDate() < g.getUTCDate())) j--;
  return j;
}

const d = (x: Date | string | null | undefined, terug: Date) => (x ? new Date(x) : terug);
const UUR = 3600 * 1000;

function openTekst(c: KandidaatInvoer, achtervoegsel = ""): string {
  if (!c.job) return "";
  const o = openOnderwerpen(c.job.velden || {}, { voornaam: "", functie: c.functie, nationalityZone: (c.nationalityZone as any) || null, hasCv: c.hasCv });
  const cvOpen = !c.hasCv && (o.cv || c.job.status === "wacht_cv");
  let t: string;
  if (o.vragen && cvOpen) t = `Cv en ${o.vragen} ${o.vragen === 1 ? "vraag" : "vragen"} open`;
  else if (o.vragen) t = `Nog ${o.vragen} ${o.vragen === 1 ? "vraag" : "vragen"} open`;
  else if (cvOpen) t = "Cv nog niet binnen";
  else t = "Gesprek met Job nog niet af";
  return t + achtervoegsel;
}

export function bolletje(c: KandidaatInvoer, nu: Date): Bolletje {
  const aangemeld = new Date(c.createdAt);
  const j = c.job;
  const gele: { reden: RedenCode; tekst: string; sinds: Date }[] = [];
  const jobSinds = j ? d(j.laatsteActiviteitAt, aangemeld) : aangemeld;

  if (c.matchOpen) gele.push({ reden: "match", tekst: "Twijfel: mogelijk dubbel dossier", sinds: d(c.matchOpen.aangemaaktOp, aangemeld) });
  if (j && j.status === "cv_controle") gele.push({ reden: "cv", tekst: "Cv controleren", sinds: jobSinds });
  if (j && j.status === "planner") {
    const v = j.velden || {};
    const twijfels = j.twijfels || [];
    if (c.nationalityZone === "NON_EU" && v.werkautorisatie && v.werkautorisatie !== "vrij") {
      gele.push({ reden: "werkautorisatie", tekst: v.werkautorisatie === "twv" ? "Twijfel: TWV vereist" : "Twijfel: werkautorisatie onduidelijk", sinds: jobSinds });
    } else if (FUNCTIES_MET_ERVARING.includes(c.functie) && v.ervaringNiveau === "geen") {
      gele.push({ reden: "ervaring", tekst: `Twijfel: geen ervaring voor ${c.functie === "chef" ? "de keuken" : "front office"}`, sinds: jobSinds });
    } else if (twijfels.some((t) => /MENS|collega|gebeld/i.test(t))) {
      gele.push({ reden: "mens", tekst: "Wil een collega spreken", sinds: jobSinds });
    } else if (twijfels.some((t) => /geen Nederlands en geen Engels|no-go/i.test(t))) {
      gele.push({ reden: "twijfel", tekst: "Twijfel: spreekt geen Nederlands of Engels", sinds: jobSinds });
    } else if (c.hasCv && twijfels.length === 0) {
      gele.push({ reden: "cv", tekst: "Cv controleren", sinds: jobSinds });
    } else {
      const eerste = (twijfels[0] || "Job twijfelt").replace(/\s+/g, " ");
      gele.push({ reden: "twijfel", tekst: `Twijfel: ${eerste.length > 60 ? `${eerste.slice(0, 57)}...` : eerste}`, sinds: jobSinds });
    }
  }
  const jaren = leeftijd(c.birthDate, nu);
  if (jaren !== null && jaren < 17) gele.push({ reden: "jong", tekst: "Twijfel: jonger dan 17", sinds: aangemeld });
  if (c.woonland) gele.push({ reden: "buitenland", tekst: "Twijfel: woont nog niet in Nederland", sinds: aangemeld });
  if (j && j.status === "gestopt") gele.push({ reden: "gestopt", tekst: "Gestopt via STOP, afsluiten", sinds: d(j.bijgewerktAt, aangemeld) });
  if (!j && c.status === "in_behandeling" && nu.getTime() - aangemeld.getTime() > 0.5 * UUR) gele.push({ reden: "geen_job", tekst: "Nog geen gesprek met Job", sinds: aangemeld });
  const uitgenodigd = c.status === "gepland" || j?.status === "plannen";
  const uitgenodigdSinds = d(c.uitgenodigdAt ?? (j?.status === "plannen" ? j.laatsteActiviteitAt : null), aangemeld);
  if (uitgenodigd && nu.getTime() - uitgenodigdSinds.getTime() > 48 * UUR) gele.push({ reden: "uitgenodigd_lang", tekst: "Uitgenodigd, nog geen moment gekozen", sinds: uitgenodigdSinds });

  const lijst = gele.map(({ reden, tekst }) => ({ reden, tekst }));
  if (gele.length) return { kleur: "geel", reden: gele[0].reden, tekst: gele[0].tekst, sinds: gele[0].sinds, gele: lijst };

  if (j && j.status === "geen_reactie") {
    return { kleur: "rood", reden: "geen_reactie", tekst: openTekst(c, ", geen reactie op 2 herinneringen"), sinds: d(j.herinneringAt, jobSinds), gele: [] };
  }
  if (j && (j.status === "bezig" || j.status === "wacht_cv")) {
    if (j.herinneringen >= 2) return { kleur: "oranje2", cijfer: "2", reden: "bezig", tekst: openTekst(c), sinds: d(j.herinneringAt, jobSinds), gele: [] };
    if (j.herinneringen === 1) return { kleur: "oranje1", cijfer: "1", reden: "bezig", tekst: openTekst(c), sinds: d(j.herinneringAt, jobSinds), gele: [] };
    const actief = nu.getTime() - jobSinds.getTime() < 0.5 * UUR;
    return { kleur: "oranje", reden: "bezig", tekst: actief ? "Nu in gesprek met Job" : openTekst(c), sinds: jobSinds, gele: [] };
  }
  if (uitgenodigd) return { kleur: "oranje", reden: "uitgenodigd", tekst: "Uitgenodigd, nog geen moment gekozen", sinds: uitgenodigdSinds, gele: [] };
  return { kleur: "oranje", reden: "nog_niet_gestart", tekst: "Nog niet gestart met Job", sinds: aangemeld, gele: [] };
}

/** Uitleg en volgende actie in het aandachtspunt van het dossier (bord H). */
export const VOLGENDE_ACTIE: Record<RedenCode, { titel: string; actie: string }> = {
  match: { titel: "Mogelijk dubbel dossier", actie: "Vergelijken: zelfde persoon of iemand anders" },
  werkautorisatie: { titel: "Werkautorisatie onduidelijk", actie: "Werkautorisatie nagaan, daarna accepteren of afwijzen; bij TWV naar het TWV-onderdeel" },
  ervaring: { titel: "Geen ervaring voor deze functie", actie: "Cv beoordelen, dan uitnodigen of afwijzen" },
  mens: { titel: "Wil een collega spreken", actie: "Terugbellen" },
  cv: { titel: "Cv controleren", actie: "Bekijk het cv. In orde? Accepteren, dan kiest de kandidaat zelf een moment. Anders afwijzen." },
  twijfel: { titel: "Job twijfelt", actie: "Navragen via Job of bellen" },
  jong: { titel: "Jonger dan 17", actie: "Beoordelen volgens beleid" },
  buitenland: { titel: "Woont nog niet in Nederland", actie: "Beoordelen op de verhuisdatum" },
  gestopt: { titel: "Gestopt via STOP", actie: "Afsluiten: afwijzen met de reden Zelf afgehaakt" },
  geen_job: { titel: "Nog geen gesprek met Job", actie: "Bellen, of Job alsnog starten" },
  uitgenodigd_lang: { titel: "Nog geen moment gekozen", actie: "Bellen, of zelf een moment inplannen" },
  geen_reactie: { titel: "Geen reactie", actie: "Bellen, nog een bericht, of laten rusten" },
  bezig: { titel: "", actie: "" },
  uitgenodigd: { titel: "", actie: "" },
  nog_niet_gestart: { titel: "", actie: "" },
};

/** "4 min", "3 uur", "1 dag", "2 dagen". */
export function sindsTekst(sinds: Date | string, nu: Date): string {
  const ms = Math.max(0, nu.getTime() - new Date(sinds).getTime());
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} min`;
  const uur = Math.floor(min / 60);
  if (uur < 24) return `${uur} uur`;
  const dagen = Math.floor(uur / 24);
  return dagen === 1 ? "1 dag" : `${dagen} dagen`;
}

/** "Eva J." */
export function plannerLabel(u: { firstName: string; lastName: string } | null | undefined): string {
  if (!u) return "Niet toegewezen";
  return `${u.firstName}${u.lastName ? ` ${u.lastName.trim()[0]}.` : ""}`;
}

export function vergelijk(a: { kleur: Kleur; sinds: Date }, b: { kleur: Kleur; sinds: Date }): number {
  return KLEUR_VOLGORDE.indexOf(a.kleur) - KLEUR_VOLGORDE.indexOf(b.kleur) || a.sinds.getTime() - b.sinds.getTime();
}

// ─── Mogelijke dubbele personen (bouwplan sectie 5) ─────────────────────────

export function normaalNaam(s: string | null | undefined): string {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
}

export interface Persoon { phone?: string | null; whatsappNummer?: string | null; email?: string | null; firstName?: string | null; lastName?: string | null; birthDate?: string | null }
export function matchRedenen(nieuw: Persoon, ander: Persoon): string[] {
  const r: string[] = [];
  const tel = (x?: string | null) => (x ? x.replace(/[^\d+]/g, "") : "");
  const a = [tel(nieuw.phone), tel(nieuw.whatsappNummer)].filter(Boolean);
  const b = [tel(ander.phone), tel(ander.whatsappNummer)].filter(Boolean);
  if (a.some((x) => b.includes(x))) r.push("telefoon");
  if (nieuw.email && ander.email && nieuw.email.trim().toLowerCase() === ander.email.trim().toLowerCase()) r.push("email");
  if (nieuw.birthDate && ander.birthDate && String(nieuw.birthDate).slice(0, 10) === String(ander.birthDate).slice(0, 10)
    && normaalNaam(nieuw.firstName) && normaalNaam(nieuw.firstName) === normaalNaam(ander.firstName)
    && normaalNaam(nieuw.lastName) === normaalNaam(ander.lastName)) r.push("naam_geboortedatum");
  return r;
}
export const MATCH_REDEN_TEKST: Record<string, string> = { telefoon: "telefoonnummer", email: "e-mailadres", naam_geboortedatum: "naam en geboortedatum" };
