/**
 * Job en de gedeelde agenda in iCloud: lezen wie bezet is en de eigen afspraken gelijk trekken.
 * De regels staan puur in shared/jobAgenda.ts; de verbinding in ./jobAgendaIcloud.ts.
 *
 * Zonder de Secrets ICLOUD_AGENDA_GEBRUIKER en ICLOUD_AGENDA_WACHTWOORD, of met AGENDA_KOPPELING=0,
 * doet deze module niets en werkt Job zoals voorheen: alleen de vaste werktijden en de database.
 */

import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { candidates, jobAfspraken } from "../../shared/schema";
import {
  agendaData, agendaPlan, afspraakBestandsnaam, afspraakEvent, afspraakIdUitUid, amsterdamNaarUtc, bezetUitAgenda, functieLabel,
  leesAfspraken, type AgendaBezet, type AgendaItem, type GeplandeAfspraak,
} from "../../shared/jobAgenda";
import { amsterdam, plusDag, DAGEN_VOORUIT, type Interviewer } from "../../shared/jobPlanning";
import { agendaConfig, AgendaFout, IcloudAgenda, type AgendaConfig } from "./jobAgendaIcloud";

/** Hoe lang een gelezen agenda vers genoeg is om momenten op te baseren. */
const VERS_MS = 2 * 60 * 1000;
/** Bij een storing gebruiken we de laatste goede stand nog zo lang. */
const NOOD_MS = 10 * 60 * 1000;
/** Na een storing wacht Job zo lang voor hij iCloud opnieuw probeert. */
const WACHT_NA_FOUT_MS = 60 * 1000;

let verbinding: { sleutel: string; agenda: IcloudAgenda } | null = null;
function icloud(cfg: AgendaConfig): IcloudAgenda {
  const sleutel = `${cfg.gebruiker}|${cfg.wachtwoord.length}|${cfg.lezen}|${cfg.schrijven}`;
  if (!verbinding || verbinding.sleutel !== sleutel) verbinding = { sleutel, agenda: new IcloudAgenda(cfg) };
  return verbinding.agenda;
}

export function agendaAan(): boolean {
  return agendaConfig() !== null;
}

function foutTekst(e: unknown): string {
  return e instanceof AgendaFout ? e.message : "onbekende fout bij de agenda";
}

interface Gelezen { items: AgendaItem[]; at: number }
let laatst: Gelezen | null = null;
let laatsteFout: { tekst: string; at: number } | null = null;

/** De afspraken in de leesagenda, van vandaag tot en met de laatste dag waarop Job momenten aanbiedt. */
async function leesAgenda(cfg: AgendaConfig, vers: boolean): Promise<Gelezen> {
  if (!vers && laatst && Date.now() - laatst.at < VERS_MS) return laatst;
  const vandaag = amsterdam(new Date()).datum;
  const tot = plusDag(vandaag, DAGEN_VOORUIT + 1);
  const ruw = await icloud(cfg).afspraken(cfg.lezen, amsterdamNaarUtc(vandaag, "00:00"), amsterdamNaarUtc(tot, "00:00"));
  laatst = { items: leesAfspraken(ruw.map((r) => r.ics), vandaag, tot), at: Date.now() };
  laatsteFout = null;
  return laatst;
}

export type AgendaBezetUitkomst =
  | { status: "uit"; bezet: AgendaBezet[] }
  | { status: "ok"; bezet: AgendaBezet[]; gelezenAt: string }
  | { status: "fout"; bezet: AgendaBezet[]; fout: string };

/**
 * Wie er volgens de agenda bezet is, per halfuur, voor de komende dagen. Bij een storing:
 * de laatste goede stand (tot tien minuten oud), anders niets: Job valt dan terug op de vaste werktijden.
 */
export async function agendaBezet(interviewers: Interviewer[], nu: Date = new Date()): Promise<AgendaBezetUitkomst> {
  const cfg = agendaConfig();
  if (!cfg) return { status: "uit", bezet: [] };
  let g: Gelezen | null = null;
  // Net mislukt? Dan een minuut niet opnieuw proberen, zodat de kandidaat niet steeds op iCloud wacht.
  const netMislukt = laatsteFout !== null && Date.now() - laatsteFout.at < WACHT_NA_FOUT_MS && !(laatst && Date.now() - laatst.at < VERS_MS);
  if (netMislukt) {
    if (laatst && Date.now() - laatst.at < NOOD_MS) g = laatst;
  } else try {
    g = await leesAgenda(cfg, false);
  } catch (e) {
    laatsteFout = { tekst: foutTekst(e), at: Date.now() };
    console.warn(`[Job agenda] lezen mislukt: ${laatsteFout.tekst}`);
    if (laatst && Date.now() - laatst.at < NOOD_MS) g = laatst;
  }
  if (!g) return { status: "fout", bezet: [], fout: laatsteFout?.tekst || "agenda niet gelezen" };
  const eigen = (uid: string) => afspraakIdUitUid(uid, cfg.omgeving) !== null;
  const bezet = bezetUitAgenda(g.items, interviewers, [amsterdam(nu).datum, ...agendaData(nu, DAGEN_VOORUIT)], eigen);
  return { status: "ok", bezet, gelezenAt: new Date(g.at).toISOString() };
}

// ─── Gelijk trekken ──────────────────────────────────────────────────────────

/** Afspraaknummers die bij de laatste ronde goed in de schrijfagenda stonden. */
let inAgenda = new Set<number>();
let gesyncAt: number | null = null;
let bezig: Promise<SyncUitkomst> | null = null;
/** Per afspraak hooguit één melding aan de planner dat het niet lukte. */
const gemeld = new Set<number>();

export interface SyncUitkomst { aan: boolean; geplaatst: number; verwijderd: number; mislukt: { id: number; candidateId: number }[]; fout?: string }

export function staatInAgenda(id: number): boolean | null {
  if (!agendaAan() || gesyncAt === null) return null;
  return inAgenda.has(id);
}

/** Waar het dossier staat: in de testomgeving de testomgeving zelf, anders de live site. */
function dashboardBasis(): string {
  if (process.env.TESTOMGEVING === "1") {
    const replit = (process.env.REPLIT_DEV_DOMAIN || (process.env.REPLIT_DOMAINS || "").split(",")[0] || "").trim();
    if (replit) return `https://${replit}`;
  }
  return (process.env.BASE_URL || "https://www.doehetextra.nl").replace(/\/$/, "");
}

async function afsprakenInVenster(van: string, tot: string): Promise<(GeplandeAfspraak & { candidateId: number })[]> {
  const rijen = await db.select({
    id: jobAfspraken.id, candidateId: jobAfspraken.candidateId, interviewer: jobAfspraken.interviewer, datum: jobAfspraken.datum,
    tijd: jobAfspraken.tijd, status: jobAfspraken.status, voornaam: candidates.firstName, functionType: candidates.functionType,
    functieEersteKeus: candidates.functieEersteKeus,
  }).from(jobAfspraken).innerJoin(candidates, eq(candidates.id, jobAfspraken.candidateId))
    .where(and(gte(jobAfspraken.datum, van), lte(jobAfspraken.datum, tot)));
  const basis = dashboardBasis();
  return rijen.map((r) => ({
    id: r.id, candidateId: r.candidateId, interviewer: r.interviewer, datum: String(r.datum), tijd: r.tijd.slice(0, 5), status: r.status,
    voornaam: r.voornaam || "", functie: functieLabel(r.functieEersteKeus, r.functionType),
    dossierLink: `${basis}/dashboard?tab=kandidaten&kandidaat=${r.candidateId}`,
  }));
}

/**
 * Trekt de schrijfagenda gelijk met de afspraken in de database: geplande afspraken erin (of bijgewerkt),
 * verzette en geannuleerde eruit. Alleen afspraken met Jobs eigen UID uit deze omgeving worden aangeraakt.
 * `opMislukt` krijgt per afspraak één keer een seintje als neerzetten niet lukte.
 */
export function agendaSync(opMislukt?: (candidateId: number, id: number) => Promise<void> | void): Promise<SyncUitkomst> {
  if (bezig) return bezig;
  bezig = (async (): Promise<SyncUitkomst> => {
    const cfg = agendaConfig();
    if (!cfg) return { aan: false, geplaatst: 0, verwijderd: 0, mislukt: [] };
    const vandaag = amsterdam(new Date()).datum;
    const van = plusDag(vandaag, -1), tot = plusDag(vandaag, 45);
    const uit: SyncUitkomst = { aan: true, geplaatst: 0, verwijderd: 0, mislukt: [] };
    try {
      const afspraken = await afsprakenInVenster(van, tot);
      const ruw = await icloud(cfg).afspraken(cfg.schrijven, amsterdamNaarUtc(van, "00:00"), amsterdamNaarUtc(plusDag(tot, 1), "00:00"));
      const aanwezig = ruw.flatMap((r) => leesAfspraken([r.ics], van, plusDag(tot, 1)).map((i) => ({ href: r.href, uid: i.uid, titel: i.titel, van: i.van })));
      const plan = agendaPlan(afspraken, aanwezig, cfg.omgeving);
      const goed = new Set(plan.goed);
      for (const a of plan.plaats) {
        try {
          await icloud(cfg).plaats(cfg.schrijven, afspraakBestandsnaam(cfg.omgeving, a.id), afspraakEvent(a, cfg.omgeving));
          goed.add(a.id);
          uit.geplaatst++;
          gemeld.delete(a.id);
        } catch (e) {
          console.warn(`[Job agenda] afspraak ${a.id} neerzetten mislukt: ${foutTekst(e)}`);
          const cand = afspraken.find((x) => x.id === a.id)!.candidateId;
          uit.mislukt.push({ id: a.id, candidateId: cand });
          if (!gemeld.has(a.id) && opMislukt) { gemeld.add(a.id); await opMislukt(cand, a.id); }
        }
      }
      for (const e of plan.verwijder) {
        try {
          await icloud(cfg).verwijder(e.href);
          uit.verwijderd++;
        } catch (err) {
          console.warn(`[Job agenda] afspraak weghalen mislukt: ${foutTekst(err)}`);
        }
      }
      inAgenda = goed;
      gesyncAt = Date.now();
      if (plan.plaats.length || plan.verwijder.length) laatst = null; // de leesagenda kan dezelfde zijn
    } catch (e) {
      uit.fout = foutTekst(e);
      laatsteFout = { tekst: uit.fout, at: Date.now() };
      console.warn(`[Job agenda] gelijk trekken mislukt: ${uit.fout}`);
    }
    return uit;
  })().finally(() => { bezig = null; });
  return bezig;
}

// ─── Voor het dashboard ──────────────────────────────────────────────────────

export interface AgendaStatus {
  aan: boolean;
  leesAgenda?: string;
  schrijfAgenda?: string;
  omgeving?: string;
  ok?: boolean;
  fout?: string | null;
  agendas?: string[];
  afspraken?: number;
  perInterviewer?: Record<string, number>;
  gelezenAt?: string | null;
  gesyncAt?: string | null;
}

/** "Agenda controleren": leest vers en telt per interviewer de bezette halfuren. Wijzigt niets. */
export async function agendaStatus(interviewers: Interviewer[]): Promise<AgendaStatus> {
  const cfg = agendaConfig();
  if (!cfg) return { aan: false };
  const basis: AgendaStatus = { aan: true, leesAgenda: cfg.lezen, schrijfAgenda: cfg.schrijven, omgeving: cfg.omgeving, gesyncAt: gesyncAt ? new Date(gesyncAt).toISOString() : null };
  try {
    const agendas = (await icloud(cfg).agendas(true)).map((k) => k.naam);
    const g = await leesAgenda(cfg, true);
    const nu = new Date();
    const eigen = (uid: string) => afspraakIdUitUid(uid, cfg.omgeving) !== null;
    const bezet = bezetUitAgenda(g.items, interviewers, agendaData(nu, DAGEN_VOORUIT), eigen);
    const perInterviewer: Record<string, number> = {};
    for (const i of interviewers) perInterviewer[i.naam] = 0;
    for (const b of bezet) perInterviewer[b.interviewer] = (perInterviewer[b.interviewer] || 0) + 1;
    return { ...basis, ok: true, fout: null, agendas, afspraken: g.items.length, perInterviewer, gelezenAt: new Date(g.at).toISOString() };
  } catch (e) {
    return { ...basis, ok: false, fout: foutTekst(e) };
  }
}
