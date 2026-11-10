/**
 * Sollicitanten (Hotels), stappen D1 tot en met D10 van het bouwplan.
 *
 * Schakelaar: SOLLICITANTEN_V2=1 (in de testomgeving staat hij vanzelf aan
 * met TESTOMGEVING=1). Zonder schakelaar geven alle routes 404 en ziet het
 * dashboard het oude Sollicitanten-tabblad.
 *
 * Elke kandidaat met een gesprek krijgt een dossier (sollicitant_dossiers) met
 * de stap, de intake, de beoordeling en de ref. en doc. check. Elke handeling
 * komt in de tijdlijn (sollicitant_gebeurtenissen) met naam en tijdstip.
 * In de tabel candidates verandert alleen wat het dashboard al bijhield: de
 * status (aangenomen of afgewezen, met de oude status bewaard voor Terugzetten),
 * de afwijsreden, de bewaartermijn, het TWV-vinkje en de gespreksdatum bij Verzetten.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import {
  candidates, jobAfspraken, jobGesprekken, sollicitantDossiers, sollicitantGebeurtenissen, users,
  type Candidate, type SollicitantDossier,
} from "@shared/schema";
import {
  type Stap, type ArchiefHerkomst, type Check, type Intake, type Beoordeling,
  brancheVan, functieNaam, scriptVoor, dagenSinds, leeftijd, bewaardTot, referentieStatus, idInOrde,
  magAccepteren, magOnboarden, checkUitIntake, beoordelingCompleet, afwijsreden, afwijsLabel,
  gestoptInLabel, terugzetLabel, geenGehoorTeller, isAfwas, ingangBranche,
} from "@shared/sollicitantRegels";
import { afwijsmailAan, maakAfwijsmail, stuurAfwijsmail } from "./afwijsmail";

/** Kandidaatkaart 3 (nieuwe opmaak van het dossier in Kandidaten). In de testomgeving vanzelf aan, uit met KANDIDATEN_KAART3=0; elders alleen met KANDIDATEN_KAART3=1. */
function kaart3Aan(): boolean {
  const w = process.env.KANDIDATEN_KAART3;
  return w === "1" || (process.env.TESTOMGEVING === "1" && w !== "0");
}

type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;

export function sollicitantenAan(): boolean {
  return process.env.SOLLICITANTEN_V2 === "1" || process.env.TESTOMGEVING === "1";
}

interface Wie { id: number | null; naam: string; voornaam: string }
async function wie(req: Request): Promise<Wie> {
  const id = (req as any).session?.userId as number | undefined;
  if (!id) return { id: null, naam: "Onbekend", voornaam: "Onbekend" };
  // Uit de database: storage.getUser leest een geheugenlijst die niet gelijkloopt met de echte accounts.
  const [u] = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, id));
  return { id, naam: u ? `${u.firstName} ${u.lastName}`.trim() : "Onbekend", voornaam: u?.firstName || "Onbekend" };
}

function nummer(x: unknown): number | null {
  const n = Number(x);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const NU = () => new Date();

// ─── Data ophalen ───────────────────────────────────────────────────────────

async function kandidaat(id: number): Promise<Candidate | undefined> {
  const [c] = await db.select().from(candidates).where(eq(candidates.id, id));
  return c;
}

async function dossierVan(candidateId: number): Promise<SollicitantDossier | undefined> {
  const [d] = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.candidateId, candidateId));
  return d;
}

/** De stap van een kandidaat zonder dossier, afgeleid van de status in Kandidaten. */
function stapZonderDossier(c: Candidate): Stap {
  if (c.status === "aangenomen") return "onboarding";
  if (c.status === "afgewezen") return "archief";
  return "gesprek_gepland";
}

async function zorgVoorDossier(c: Candidate): Promise<SollicitantDossier> {
  const d = await dossierVan(c.id);
  if (d) return d;
  const stap = stapZonderDossier(c);
  await db.insert(sollicitantDossiers).values({
    candidateId: c.id, stap,
    gearchiveerdUit: stap === "archief" ? "kandidaten" : null,
    archiefReden: stap === "archief" ? c.rejectionReason : null,
    gearchiveerdAt: stap === "archief" ? c.updatedAt : null,
    geaccepteerdAt: stap === "onboarding" ? c.updatedAt : null,
    vorigeStatus: stap === "archief" ? "in_behandeling" : stap === "onboarding" ? "gepland" : null,
  }).onConflictDoNothing();
  return (await dossierVan(c.id))!;
}

async function werkBij(candidateId: number, velden: Partial<typeof sollicitantDossiers.$inferInsert>) {
  await db.update(sollicitantDossiers).set({ ...velden, bijgewerktAt: NU() }).where(eq(sollicitantDossiers.candidateId, candidateId));
}

async function log(candidateId: number, w: Wie, soort: string, tekst: string, data?: unknown) {
  await db.insert(sollicitantGebeurtenissen).values({ candidateId, soort, tekst, door: w.voornaam, doorUserId: w.id, data: (data ?? null) as any });
}

/** Actieve afspraken (Job) per kandidaat: interviewer en bevestigd. */
async function afsprakenVan(ids: number[]) {
  if (!ids.length) return new Map<number, { interviewer: string; bevestigd: boolean; aangemaaktAt: Date }>();
  const rijen = await db.select().from(jobAfspraken).where(and(inArray(jobAfspraken.candidateId, ids), eq(jobAfspraken.status, "gepland")));
  return new Map(rijen.map((a) => [a.candidateId, { interviewer: a.interviewer, bevestigd: !!a.bevestigdAt, aangemaaktAt: a.aangemaaktAt }]));
}

function naam(c: Candidate) { return `${c.firstName} ${c.lastName}`.trim(); }
function twvNodig(c: Candidate, d?: SollicitantDossier | null): boolean {
  const i = (d?.intake || {}) as Intake;
  return !!c.needsTwv || i.nationaliteit === "TWV nodig";
}

async function tellers(week?: { van: string; tot: string }) {
  const stappen = await db.select({ stap: sollicitantDossiers.stap, n: sql<number>`count(*)::int` }).from(sollicitantDossiers).groupBy(sollicitantDossiers.stap);
  const per = Object.fromEntries(stappen.map((s) => [s.stap, s.n])) as Record<string, number>;
  const w = week || weekVan(NU());
  const [g] = await db.select({ n: sql<number>`count(*)::int` }).from(candidates)
    .where(and(gte(candidates.interviewDate, w.van), lte(candidates.interviewDate, w.tot), ne(candidates.status, "afgewezen")));
  return { gesprekken: g?.n || 0, beoordelen: per.beoordelen || 0, ref_doc_check: per.ref_doc_check || 0, extra_check: per.extra_check || 0 };
}

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function weekVan(datum: Date): { van: string; tot: string } {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" });
  const d = new Date(`${f.format(datum)}T12:00:00Z`);
  const dag = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (dag === 0 ? 6 : dag - 1));
  const tot = new Date(d); tot.setUTCDate(tot.getUTCDate() + 6);
  return { van: iso(d), tot: iso(tot) };
}

/**
 * In het weekend opent het overzicht op de komende week, als daar al
 * gesprekken in staan. Anders blijft het op de week die nu loopt.
 */
async function standaardWeek(): Promise<{ van: string; tot: string }> {
  const nu = NU();
  const dag = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", weekday: "short" }).format(nu);
  const deze = weekVan(nu);
  if (dag !== "Sat" && dag !== "Sun") return deze;
  const volgende = weekVan(new Date(nu.getTime() + 2 * 86400000));
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(candidates)
    .where(and(gte(candidates.interviewDate, volgende.van), lte(candidates.interviewDate, volgende.tot), ne(candidates.status, "afgewezen")));
  return (r?.n || 0) > 0 ? volgende : deze;
}

// ─── Overzichten ────────────────────────────────────────────────────────────

async function week(vanParam?: string) {
  const w = vanParam && /^\d{4}-\d{2}-\d{2}$/.test(vanParam) ? weekVan(new Date(`${vanParam}T12:00:00Z`)) : await standaardWeek();
  const rijen = await db.select().from(candidates)
    .where(and(gte(candidates.interviewDate, w.van), lte(candidates.interviewDate, w.tot), ne(candidates.status, "afgewezen")));
  const ids = rijen.map((c) => c.id);
  const afspraken = await afsprakenVan(ids);
  const dossiers = ids.length ? await db.select().from(sollicitantDossiers).where(inArray(sollicitantDossiers.candidateId, ids)) : [];
  const dm = new Map(dossiers.map((d) => [d.candidateId, d]));
  const gesprekken = rijen.map((c) => {
    const d = dm.get(c.id);
    const a = afspraken.get(c.id);
    return {
      id: c.id, naam: naam(c), datum: String(c.interviewDate), tijd: String(c.interviewTime || "").slice(0, 5),
      functie: functieNaam(c.functionType, isAfwas(c)), branche: brancheVan(c.functionType, d?.branche, isAfwas(c), ingangBranche(c.bronDetails)),
      interviewer: a?.interviewer || d?.interviewer || "", bevestigd: !!a?.bevestigd, stap: d?.stap || stapZonderDossier(c),
    };
  }).sort((p, q) => (p.datum + p.tijd).localeCompare(q.datum + q.tijd));
  return { ...w, gesprekken, tellers: await tellers(w) };
}

async function lijst(stap: "beoordelen" | "ref_doc_check" | "extra_check") {
  const dossiers = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.stap, stap));
  const ids = dossiers.map((d) => d.candidateId);
  const cs = ids.length ? await db.select().from(candidates).where(inArray(candidates.id, ids)) : [];
  const cm = new Map(cs.map((c) => [c.id, c]));
  const nu = NU();
  const rijen = dossiers.filter((d) => cm.has(d.candidateId)).map((d) => {
    const c = cm.get(d.candidateId)!;
    const ctl = (d.controle || {}) as Check;
    return {
      id: c.id, naam: naam(c), functie: functieNaam(c.functionType, isAfwas(c)), branche: brancheVan(c.functionType, d.branche, isAfwas(c), ingangBranche(c.bronDetails)),
      dagen: dagenSinds(d.stapSinds, nu), interviewer: (d.intakeDoor || d.interviewer || "").split(" ")[0],
      intakeAfgerond: d.intakeAfgerondAt, referentie: referentieStatus(ctl), pogingen: geenGehoorTeller(ctl),
      idOk: idInOrde(ctl, twvNodig(c, d)), twijfelDoor: d.twijfelDoor, twijfelAt: d.twijfelAt,
    };
  }).sort((a, b) => b.dagen - a.dagen || a.naam.localeCompare(b.naam));
  const kpi = {
    referentieOpen: rijen.filter((r) => r.referentie !== "positief" && r.referentie !== "overgeslagen").length,
    idOpen: rijen.filter((r) => !r.idOk).length,
    langerDanWeek: rijen.filter((r) => r.dagen > 7).length,
  };
  return { rijen, kpi, tellers: await tellers() };
}

async function onboarding() {
  const dossiers = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.stap, "onboarding"));
  const metDossier = new Set((await db.select({ id: sollicitantDossiers.candidateId }).from(sollicitantDossiers)).map((r) => r.id));
  const ids = dossiers.map((d) => d.candidateId);
  const cs = ids.length ? await db.select().from(candidates).where(inArray(candidates.id, ids)) : [];
  const zonder = (await db.select().from(candidates).where(eq(candidates.status, "aangenomen"))).filter((c) => !metDossier.has(c.id));
  const dm = new Map(dossiers.map((d) => [d.candidateId, d]));
  return [...cs, ...zonder].map((c) => {
    const d = dm.get(c.id);
    return {
      id: c.id, naam: naam(c), functie: functieNaam(c.functionType, isAfwas(c)), branche: brancheVan(c.functionType, d?.branche, isAfwas(c), ingangBranche(c.bronDetails)),
      geaccepteerd: d?.geaccepteerdAt || c.updatedAt, interviewer: (d?.geaccepteerdDoor || d?.intakeDoor || "").split(" ")[0],
    };
  }).sort((a, b) => new Date(b.geaccepteerd).getTime() - new Date(a.geaccepteerd).getTime());
}

async function archief() {
  const dossiers = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.stap, "archief"));
  const metDossier = new Set((await db.select({ id: sollicitantDossiers.candidateId }).from(sollicitantDossiers)).map((r) => r.id));
  const ids = dossiers.map((d) => d.candidateId);
  const cs = ids.length ? await db.select().from(candidates).where(inArray(candidates.id, ids)) : [];
  const zonder = (await db.select().from(candidates).where(eq(candidates.status, "afgewezen"))).filter((c) => !metDossier.has(c.id));
  const dm = new Map(dossiers.map((d) => [d.candidateId, d]));
  return [...cs, ...zonder].map((c) => {
    const d = dm.get(c.id);
    const uit = (d?.gearchiveerdUit || "kandidaten") as ArchiefHerkomst;
    const at = d?.gearchiveerdAt || c.updatedAt;
    return {
      id: c.id, naam: naam(c), voornaam: c.firstName, functie: functieNaam(c.functionType, isAfwas(c)), branche: brancheVan(c.functionType, d?.branche, isAfwas(c), ingangBranche(c.bronDetails)),
      gestoptIn: gestoptInLabel(uit), terugNaar: terugzetLabel(uit), reden: afwijsLabel(d?.archiefReden ?? c.rejectionReason, d?.archiefRedenTekst),
      datum: at, door: d?.gearchiveerdDoor || "", bewaardTot: c.retentionUntil || bewaardTot(new Date(at)),
    };
  }).sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
}

/** Het cv op de kaart: nette naam, soort voor de voorvertoning en wie het controleerde (Accepteren in Kandidaten). */
function cvInfo(c: typeof candidates.$inferSelect, gebeurtenissen: { soort: string; door: string | null; at: Date }[]) {
  if (!c.hasCv || !c.cvFilename) return null;
  const bestand = String(c.cvFilename).split("/").pop() || "cv";
  const naam = bestand.replace(/^\d{10,}[-_]/, "").replace(/^[0-9a-f]{8}-[0-9a-f-]{27,}[-_]/i, "") || "cv";
  const ext = (naam.split(".").pop() || "").toLowerCase();
  const soort = ext === "pdf" ? "pdf" : ["jpg", "jpeg", "png", "webp", "heic"].includes(ext) ? "afbeelding" : ["doc", "docx"].includes(ext) ? "word" : "anders";
  const check = gebeurtenissen.find((e) => e.soort === "uitgenodigd");
  return { naam, soort, gecontroleerdDoor: check?.door || null };
}

async function kaart(id: number) {
  const c = await kandidaat(id);
  if (!c) return null;
  const d = (await dossierVan(id)) || null;
  const [g] = await db.select().from(jobGesprekken).where(eq(jobGesprekken.candidateId, id));
  const afspraak = (await afsprakenVan([id])).get(id) || null;
  const gebeurtenissen = await db.select().from(sollicitantGebeurtenissen).where(eq(sollicitantGebeurtenissen.candidateId, id)).orderBy(desc(sollicitantGebeurtenissen.at));
  const tijdlijn = [
    ...gebeurtenissen.map((e) => ({ at: e.at, tekst: e.tekst })),
    ...(afspraak ? [{ at: afspraak.aangemaaktAt, tekst: `Gesprek gepland bij ${afspraak.interviewer}` }] : []),
    ...(g ? [{ at: g.gestartAt, tekst: "Gesprek met Job" }] : []),
    { at: c.createdAt, tekst: c.isInternalInterview ? "Aangemaakt op kantoor" : "Aangemeld via de website" },
  ].sort((p, q) => new Date(q.at).getTime() - new Date(p.at).getTime());
  return {
    kandidaat: {
      id: c.id, voornaam: c.firstName, achternaam: c.lastName, naam: naam(c), email: c.email, telefoon: c.phone,
      geboren: c.birthDate, leeftijd: leeftijd(c.birthDate ? String(c.birthDate) : null, NU()), nationaliteit: c.nationality,
      zone: c.nationalityZone, woonplaats: c.city, functie: c.functionType, functieNaam: functieNaam(c.functionType, isAfwas(c)),
      afwas: !!c.canDoWashing, twvNodig: twvNodig(c, d), heeftCv: !!c.hasCv, status: c.status, gespreksdatum: c.interviewDate,
      gesprekstijd: c.interviewTime ? String(c.interviewTime).slice(0, 5) : null, talen: c.language, ervaring: c.horecaExperience,
      beschikbaarheid: c.availability, aangemeld: c.createdAt, whatsapp: c.whatsappOptInStatus, bewaardTot: c.retentionUntil, postcode: c.postcode, woonland: c.woonland,
      cv: cvInfo(c, gebeurtenissen),
    },
    stap: (d?.stap || stapZonderDossier(c)) as Stap,
    branche: brancheVan(c.functionType, d?.branche, isAfwas(c), ingangBranche(c.bronDetails)),
    script: scriptVoor(c.functionType, isAfwas(c)),
    interviewer: afspraak?.interviewer || d?.interviewer || null,
    bevestigd: !!afspraak?.bevestigd,
    dossier: d ? {
      intakeStatus: d.intakeStatus, intakeStap: d.intakeStap, intake: d.intake, intakeDoor: d.intakeDoor, intakeAfgerondAt: d.intakeAfgerondAt,
      beoordeling: d.beoordeling, beoordeeldDoor: d.beoordeeldDoor, beoordeeldAt: d.beoordeeldAt, controle: d.controle,
      twijfelVan: d.twijfelVan, twijfelDoor: d.twijfelDoor, twijfelAt: d.twijfelAt, geaccepteerdDoor: d.geaccepteerdDoor, geaccepteerdAt: d.geaccepteerdAt,
      gearchiveerdUit: d.gearchiveerdUit, archiefReden: afwijsLabel(d.archiefReden, d.archiefRedenTekst), gearchiveerdDoor: d.gearchiveerdDoor,
      gearchiveerdAt: d.gearchiveerdAt, foto: d.foto, fotoOvergeslagen: d.fotoOvergeslagen, stapSinds: d.stapSinds,
    } : null,
    job: g ? { velden: g.velden, twijfels: g.twijfels, status: g.status } : null,
    tijdlijn,
    afwijsmailAan: afwijsmailAan(),
  };
}

// ─── Handelingen ────────────────────────────────────────────────────────────

class Fout extends Error { constructor(public status: number, msg: string) { super(msg); } }

async function verplaats(c: Candidate, w: Wie, naar: Stap, velden: Partial<typeof sollicitantDossiers.$inferInsert>, tekst: string) {
  await werkBij(c.id, { stap: naar, stapSinds: NU(), ...velden });
  await log(c.id, w, `stap_${naar}`, tekst);
}

async function afwijzen(c: Candidate, d: SollicitantDossier, w: Wie, body: any) {
  if (d.stap === "archief") throw new Fout(409, `${c.firstName} staat al in het archief.`);
  if (d.stap === "onboarding") throw new Fout(409, `${c.firstName} staat al in Onboarding.`);
  const reden = afwijsreden(String(body?.reden || ""));
  if (!reden) throw new Fout(400, "Kies een reden.");
  const eigen = typeof body?.redenTekst === "string" ? body.redenTekst.trim().slice(0, 200) : "";
  if (reden.code === "anders" && !eigen) throw new Fout(400, "Vul de reden in bij Anders.");
  const uit = (d.stap === "gesprek_gepland" && !c.interviewDate ? "kandidaten" : d.stap) as ArchiefHerkomst;
  const nu = NU();
  const tot = bewaardTot(nu);
  await werkBij(c.id, {
    stap: "archief", stapSinds: nu, gearchiveerdUit: uit, archiefReden: reden.code, archiefRedenTekst: eigen || null,
    gearchiveerdDoor: w.naam, gearchiveerdAt: nu, vorigeStatus: c.status,
  });
  await db.update(candidates).set({ status: "afgewezen", rejectionReason: reden.code, retentionUntil: tot, updatedAt: nu }).where(eq(candidates.id, c.id));
  await db.update(jobAfspraken).set({ status: "geannuleerd" }).where(and(eq(jobAfspraken.candidateId, c.id), eq(jobAfspraken.status, "gepland")));

  // Job stopt: geen herinneringen meer na een afwijzing.
  let metJob = false;
  try {
    const job = await import("../job/jobService");
    const g = await job.gesprekVanKandidaat(c.id);
    if (g) {
      metJob = (await job.berichtenVan(g.id)).some((b: any) => b.richting === "in");
      await job.stopGesprek(c.id).catch(() => {});
    }
  } catch (e: any) { console.warn("[Sollicitanten] Job stoppen mislukt:", e?.message || e); }

  const wilMail = body?.mail !== false && afwijsmailAan() && !!c.email;
  let verstuurd = false;
  if (wilMail) {
    const mailTekst = typeof body?.mailTekst === "string" ? body.mailTekst.trim().slice(0, 3000) : "";
    verstuurd = await stuurAfwijsmail({
      email: c.email!, voornaam: c.firstName, functie: c.functionType, reden: reden.code,
      naGesprek: uit !== "kandidaten" && uit !== "gesprek_gepland" || body?.naGesprek === true, metJob, eigenTekst: mailTekst || undefined,
    }).catch(() => false);
    if (verstuurd) await werkBij(c.id, { afwijsmailAt: NU() });
  }
  const label = afwijsLabel(reden.code, eigen);
  await log(c.id, w, "afgewezen", `Afgewezen door ${w.voornaam}: ${label} · ${verstuurd ? "mail verstuurd" : "geen mail verstuurd"}`, { reden: reden.code, uit });
  return { verstuurd };
}

async function terugzetten(c: Candidate, d: SollicitantDossier, w: Wie) {
  if (d.stap !== "archief") throw new Fout(409, `${c.firstName} staat niet in het archief.`);
  const uit = (d.gearchiveerdUit || "kandidaten") as ArchiefHerkomst;
  const naar: Stap = uit === "kandidaten" ? "gesprek_gepland" : uit;
  const status = (d.vorigeStatus || (uit === "kandidaten" ? "in_behandeling" : "gepland")) as Candidate["status"];
  await werkBij(c.id, {
    stap: naar, stapSinds: NU(), gearchiveerdUit: null, archiefReden: null, archiefRedenTekst: null,
    gearchiveerdDoor: null, gearchiveerdAt: null, vorigeStatus: null,
  });
  await db.update(candidates).set({ status, rejectionReason: null, retentionUntil: null, updatedAt: NU() }).where(eq(candidates.id, c.id));
  await log(c.id, w, "teruggezet", `Teruggezet uit het archief door ${w.voornaam}, naar ${terugzetLabel(uit)}`);
  return { naar, label: terugzetLabel(uit) };
}

async function actie(id: number, w: Wie, body: any) {
  const c = await kandidaat(id);
  if (!c) throw new Fout(404, "Sollicitant niet gevonden.");
  const d = await zorgVoorDossier(c);
  const ctl = (d.controle || {}) as Check;
  const soort = String(body?.actie || "");
  switch (soort) {
    case "naar_check": {
      if (d.stap !== "beoordelen") throw new Fout(409, "Deze sollicitant staat niet op Beoordelen.");
      if (!beoordelingCompleet(d.beoordeling as Beoordeling)) throw new Fout(400, "Vul eerst alle vier de schuiven in.");
      await verplaats(c, w, "ref_doc_check", {}, `Beoordeeld door ${w.voornaam}, naar ref. en doc. check`);
      return { stap: "ref_doc_check" };
    }
    case "twijfel": {
      if (d.stap !== "beoordelen" && d.stap !== "ref_doc_check") throw new Fout(409, "Twijfel kan na de beoordeling of bij de ref. en doc. check.");
      if (d.stap === "beoordelen" && !beoordelingCompleet(d.beoordeling as Beoordeling)) throw new Fout(400, "Vul eerst alle vier de schuiven in.");
      await verplaats(c, w, "extra_check", { twijfelVan: d.stap, twijfelDoor: w.naam, twijfelAt: NU() }, `Twijfel door ${w.voornaam}, naar EXTRA check`);
      return { stap: "extra_check" };
    }
    case "accepteren": {
      if (d.stap !== "ref_doc_check") throw new Fout(409, "Accepteren kan alleen bij de ref. en doc. check.");
      if (!magAccepteren(ctl, twvNodig(c, d))) throw new Fout(400, "Accepteren kan pas als het ID en de referentie allebei in orde zijn.");
      await verplaats(c, w, "onboarding", { geaccepteerdDoor: w.naam, geaccepteerdAt: NU(), geaccepteerdVia: "ref_doc_check", vorigeStatus: c.status }, `Geaccepteerd door ${w.voornaam}, naar Onboarding`);
      await db.update(candidates).set({ status: "aangenomen", updatedAt: NU() }).where(eq(candidates.id, c.id));
      return { stap: "onboarding" };
    }
    case "onboarden": {
      if (d.stap !== "extra_check") throw new Fout(409, "Onboarden kan alleen vanuit EXTRA check.");
      if (!magOnboarden(ctl, twvNodig(c, d))) throw new Fout(400, `Zet eerst bij de documentcheck dat je het ID${twvNodig(c, d) ? " en het verblijfsdocument" : ""} van ${c.firstName} hebt gezien.`);
      await verplaats(c, w, "onboarding", { geaccepteerdDoor: w.naam, geaccepteerdAt: NU(), geaccepteerdVia: "extra_check", vorigeStatus: c.status }, `Onboarden na EXTRA check door ${w.voornaam}`);
      await db.update(candidates).set({ status: "aangenomen", updatedAt: NU() }).where(eq(candidates.id, c.id));
      return { stap: "onboarding" };
    }
    case "afwijzen": return { stap: "archief", ...(await afwijzen(c, d, w, body)) };
    case "terugzetten": return await terugzetten(c, d, w);
    case "verzetten": {
      if (d.stap !== "gesprek_gepland") throw new Fout(409, "Verzetten kan alleen voor het gesprek.");
      const datum = String(body?.datum || ""), tijd = String(body?.tijd || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}$/.test(tijd)) throw new Fout(400, "Kies een datum en een tijd.");
      const interviewer = typeof body?.interviewer === "string" ? body.interviewer.trim().slice(0, 60) : "";
      await db.update(candidates).set({ interviewDate: datum, interviewTime: `${tijd}:00`, status: "gepland", updatedAt: NU() }).where(eq(candidates.id, c.id));
      await db.update(jobAfspraken).set({ status: "verzet" }).where(and(eq(jobAfspraken.candidateId, c.id), eq(jobAfspraken.status, "gepland")));
      await werkBij(c.id, { interviewer: interviewer || d.interviewer });
      await log(c.id, w, "verzet", `Gesprek verzet door ${w.voornaam} naar ${datum.split("-").reverse().join("-")} ${tijd}${interviewer ? ` bij ${interviewer}` : ""}`);
      return { stap: "gesprek_gepland" };
    }
    default: throw new Fout(400, "Onbekende handeling.");
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

export function registerSollicitantenRoutes(app: Express, adminMiddleware: Middleware) {
  const alleenAan: Middleware = (_req, res, next) => {
    if (!sollicitantenAan()) return res.status(404).json({ message: "Niet beschikbaar" });
    next();
  };
  const r = (pad: string) => `/api/sollicitanten${pad}`;
  const veilig = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
    try { await fn(req, res); }
    catch (e: any) {
      if (e instanceof Fout) return res.status(e.status).json({ message: e.message });
      console.error("[Sollicitanten]", e?.message || e);
      res.status(500).json({ message: "Er ging iets mis. Probeer het opnieuw." });
    }
  };

  app.get(r("/status"), adminMiddleware, (_req, res) => {
    res.json({ aan: sollicitantenAan(), kandidaten: process.env.KANDIDATEN_V2 === "1" || process.env.TESTOMGEVING === "1", kaart3: kaart3Aan(), afwijsmail: afwijsmailAan() });
  });

  app.get(r("/week"), adminMiddleware, alleenAan, veilig(async (req, res) => { res.json(await week(String(req.query.van || ""))); }));
  app.get(r("/lijst"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const stap = String(req.query.stap || "");
    if (stap !== "beoordelen" && stap !== "ref_doc_check" && stap !== "extra_check") throw new Fout(400, "Onbekende lijst.");
    res.json(await lijst(stap));
  }));
  app.get(r("/onboarding"), adminMiddleware, alleenAan, veilig(async (_req, res) => { res.json(await onboarding()); }));
  app.get(r("/archief"), adminMiddleware, alleenAan, veilig(async (_req, res) => { res.json(await archief()); }));

  app.get(r("/kaart/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    const k = id ? await kaart(id) : null;
    if (!k) throw new Fout(404, "Sollicitant niet gevonden.");
    res.json({ ...k, ik: (await wie(req)).naam });
  }));

  // Intake: concept bewaren bij elke wijziging (D4)
  app.put(r("/intake/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    const c = id ? await kandidaat(id) : undefined;
    if (!c) throw new Fout(404, "Sollicitant niet gevonden.");
    const d = await zorgVoorDossier(c);
    if (d.stap !== "gesprek_gepland") throw new Fout(409, "De intake is al afgerond.");
    const intake = req.body?.intake;
    if (!intake || typeof intake !== "object" || Array.isArray(intake)) throw new Fout(400, "Geen intake.");
    if (JSON.stringify(intake).length > 50000) throw new Fout(413, "Intake te groot.");
    const w = await wie(req);
    const stap = Math.min(9, Math.max(1, Number(req.body?.stap) || d.intakeStap || 1));
    if (d.intakeStatus === "niet_gestart") await log(c.id, w, "intake_gestart", `Intake gestart door ${w.voornaam}`);
    await werkBij(c.id, { intake, intakeStap: stap, intakeStatus: "concept", intakeDoor: d.intakeDoor || w.naam });
    res.json({ ok: true });
  }));

  // Foto (D5): de iPad knipt zelf uit; hier komt alleen het resultaat.
  app.put(r("/foto/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    const c = id ? await kandidaat(id) : undefined;
    if (!c) throw new Fout(404, "Sollicitant niet gevonden.");
    await zorgVoorDossier(c);
    const w = await wie(req);
    if (req.body?.overgeslagen === true) {
      await werkBij(c.id, { foto: null, fotoOvergeslagen: true });
      await log(c.id, w, "foto", `Foto overgeslagen door ${w.voornaam}`);
      return res.json({ ok: true });
    }
    const foto = String(req.body?.foto || "");
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(foto) || foto.length > 600000) throw new Fout(400, "Ongeldige foto.");
    await werkBij(c.id, { foto, fotoOvergeslagen: false });
    await log(c.id, w, "foto", `Foto gemaakt door ${w.voornaam}`);
    res.json({ ok: true });
  }));

  app.post(r("/intake/:id/afronden"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    const c = id ? await kandidaat(id) : undefined;
    if (!c) throw new Fout(404, "Sollicitant niet gevonden.");
    const d = await zorgVoorDossier(c);
    if (d.stap !== "gesprek_gepland") throw new Fout(409, "De intake is al afgerond.");
    const w = await wie(req);
    const intake = (req.body?.intake && typeof req.body.intake === "object" ? req.body.intake : d.intake) as Intake;
    const nu = NU();
    const controle = checkUitIntake(intake, w.voornaam, nu.toISOString(), d.controle as Check);
    await werkBij(c.id, {
      intake, intakeStatus: "afgerond", intakeAfgerondAt: nu, intakeDoor: d.intakeDoor || w.naam, controle,
      stap: "beoordelen", stapSinds: nu,
    });
    if (intake.id_gezien === "Niet gezien") {
      await log(c.id, w, "id_niet_gezien", `ID niet gecontroleerd bij de intake · ${nu.toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" })}, ${w.voornaam}`);
    }
    if (intake.nationaliteit === "TWV nodig" && !c.needsTwv) {
      await db.update(candidates).set({ needsTwv: true, updatedAt: nu }).where(eq(candidates.id, c.id));
      await log(c.id, w, "twv", `TWV nodig, vastgelegd bij de intake door ${w.voornaam}`);
    }
    await log(c.id, w, "intake_afgerond", `Intake afgerond door ${w.voornaam}`);
    res.json({ stap: "beoordelen" });
  }));

  app.put(r("/beoordeling/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    const c = id ? await kandidaat(id) : undefined;
    if (!c) throw new Fout(404, "Sollicitant niet gevonden.");
    const d = await zorgVoorDossier(c);
    if (d.stap !== "beoordelen") throw new Fout(409, "De beoordeling is al afgerond.");
    const b: Beoordeling = {};
    for (const k of ["communicatief", "representatief", "extravert", "indruk"] as const) {
      const v = req.body?.beoordeling?.[k];
      if (typeof v === "number" && v >= 0 && v <= 100) b[k] = Math.round(v);
    }
    const w = await wie(req);
    await werkBij(c.id, { beoordeling: b, beoordeeldDoor: w.naam, beoordeeldAt: NU() });
    res.json({ ok: true });
  }));

  // Ref. en doc. check (D7): elk veld bewaart meteen.
  app.put(r("/check/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    const c = id ? await kandidaat(id) : undefined;
    if (!c) throw new Fout(404, "Sollicitant niet gevonden.");
    const d = await zorgVoorDossier(c);
    if (d.stap !== "ref_doc_check" && d.stap !== "extra_check") throw new Fout(409, "Deze sollicitant staat niet bij de ref. en doc. check.");
    const w = await wie(req);
    const ctl: Check = { ...((d.controle || {}) as Check) };
    const b = req.body || {};
    const nu = NU().toISOString();
    const tekst = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : undefined);
    if (typeof b.idGezien === "boolean" && b.idGezien !== !!ctl.idGezien) {
      ctl.idGezien = b.idGezien; ctl.idDoor = w.voornaam; ctl.idAt = nu;
      await log(c.id, w, "id", b.idGezien ? `ID gezien door ${w.voornaam}` : `ID op nog niet gezien gezet door ${w.voornaam}`);
    }
    if (typeof b.verblijfGezien === "boolean" && b.verblijfGezien !== !!ctl.verblijfGezien) {
      ctl.verblijfGezien = b.verblijfGezien; ctl.verblijfDoor = w.voornaam; ctl.verblijfAt = nu;
      await log(c.id, w, "verblijf", b.verblijfGezien ? `Verblijfsdocument gezien door ${w.voornaam}` : `Verblijfsdocument op nog niet gezien gezet door ${w.voornaam}`);
    }
    if (b.referent !== undefined) ctl.referent = tekst(b.referent, 200);
    if (b.telefoon !== undefined) ctl.telefoon = tekst(b.telefoon, 40);
    if (b.verslag !== undefined) ctl.verslag = tekst(b.verslag, 4000);
    if (b.poging === "gesproken" || b.poging === "geen_gehoor") {
      ctl.pogingen = [...(ctl.pogingen || []), { at: nu, door: w.voornaam, uitkomst: b.poging }];
      const n = ctl.pogingen.length;
      await log(c.id, w, "referentie_gebeld", b.poging === "gesproken" ? `Referentie gebeld door ${w.voornaam} (${n}e poging)` : `Referentie geen gehoor (${n}e poging), ${w.voornaam}`);
    }
    if (b.uitkomst === "positief" || b.uitkomst === "negatief" || b.uitkomst === null) {
      if (b.uitkomst !== ctl.uitkomst) {
        ctl.uitkomst = b.uitkomst;
        if (b.uitkomst) await log(c.id, w, "referentie_uitkomst", `Referentie ${b.uitkomst} volgens ${w.voornaam}`);
      }
    }
    if (b.overslaan && typeof b.overslaan === "object") {
      const reden = tekst(b.overslaan.reden, 300) || "";
      if (reden.length < 3) throw new Fout(400, "Geef een reden voor goedkeuren zonder referentie.");
      ctl.overgeslagen = true; ctl.overslaanReden = reden; ctl.overslaanDoor = w.voornaam; ctl.overslaanAt = nu;
      await log(c.id, w, "referentie_overgeslagen", `Referentie overgeslagen door ${w.voornaam}: ${reden}`);
    }
    if (b.overslaanTerug === true && ctl.overgeslagen) {
      ctl.overgeslagen = false;
      await log(c.id, w, "referentie_overgeslagen", `Goedkeuren zonder referentie ongedaan gemaakt door ${w.voornaam}`);
    }
    await werkBij(c.id, { controle: ctl });
    res.json({ controle: ctl, referentie: referentieStatus(ctl), magAccepteren: magAccepteren(ctl, twvNodig(c, d)) });
  }));

  app.post(r("/actie/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    if (!id) throw new Fout(404, "Sollicitant niet gevonden.");
    res.json(await actie(id, await wie(req), req.body));
  }));

  // Afwijzen: de mail vooraf zien (H2)
  app.post(r("/afwijsmail/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    const c = id ? await kandidaat(id) : undefined;
    if (!c) throw new Fout(404, "Sollicitant niet gevonden.");
    const d = await dossierVan(c.id);
    const reden = afwijsreden(String(req.body?.reden || "")) || afwijsreden("anders")!;
    const stap = d?.stap || stapZonderDossier(c);
    const naGesprek = stap !== "gesprek_gepland" || req.body?.naGesprek === true;
    const m = maakAfwijsmail({ voornaam: c.firstName, functie: c.functionType, reden: reden.code, naGesprek, eigenTekst: typeof req.body?.mailTekst === "string" ? req.body.mailTekst : undefined });
    res.json({ ...m, kern: reden.mail, naar: c.email || null, aan: afwijsmailAan() && !!c.email, standaardGeenMail: !!reden.geenMail });
  }));

  // Persoonsgegevens aanpassen
  app.put(r("/persoon/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = nummer(req.params.id);
    const c = id ? await kandidaat(id) : undefined;
    if (!c) throw new Fout(404, "Sollicitant niet gevonden.");
    const b = req.body || {};
    const velden: Partial<Candidate> = {};
    const tekst = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : undefined);
    if (b.telefoon !== undefined) velden.phone = tekst(b.telefoon, 40) || null;
    if (b.email !== undefined) {
      const e = tekst(b.email, 200) || "";
      if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Fout(400, "Dit e-mailadres klopt niet.");
      velden.email = e || null;
    }
    if (b.woonplaats !== undefined) velden.city = tekst(b.woonplaats, 120) || null;
    if (b.nationaliteit !== undefined) velden.nationality = tekst(b.nationaliteit, 80) || null;
    if (b.geboren !== undefined) {
      const g = tekst(b.geboren, 10) || "";
      if (g && !/^\d{4}-\d{2}-\d{2}$/.test(g)) throw new Fout(400, "Geboortedatum klopt niet.");
      velden.birthDate = g || null;
    }
    if (!Object.keys(velden).length) throw new Fout(400, "Niets om op te slaan.");
    await db.update(candidates).set({ ...velden, updatedAt: NU() } as any).where(eq(candidates.id, c.id));
    const w = await wie(req);
    await log(c.id, w, "persoon", `Persoonsgegevens aangepast door ${w.voornaam}`);
    res.json({ ok: true });
  }));
}
