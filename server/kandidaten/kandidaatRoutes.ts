/**
 * Kandidaten 3.0 (borden G en H). Schakelaar: KANDIDATEN_V2=1 (in de
 * testomgeving vanzelf aan). Zonder schakelaar geven de routes 404 en blijft
 * het oude Kandidaten-tabblad staan.
 *
 * Afwijzen loopt via de route van Sollicitanten (POST /api/sollicitanten/actie/:id).
 * Bolletjes en status worden afgeleid in shared/kandidaatRegels.ts.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import {
  candidates, jobGesprekken, jobBerichten, kandidaatMogelijkeMatch, sollicitantGebeurtenissen, users, employees,
  type Candidate,
} from "@shared/schema";
import { bolletje, inKandidaten, plannerLabel, sindsTekst, vergelijk, VOLGENDE_ACTIE, MATCH_REDEN_TEKST, KLEUR_VOLGORDE, type Kleur } from "@shared/kandidaatRegels";
import { brancheVan, functieNaam, isAfwas, ingangBranche, BRANCHE, leeftijd } from "@shared/sollicitantRegels";
import type { JobVelden } from "@shared/jobRegels";

type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;

export function kandidatenAan(): boolean {
  return process.env.KANDIDATEN_V2 === "1" || process.env.TESTOMGEVING === "1";
}

class Fout extends Error { constructor(public status: number, msg: string, public code?: string) { super(msg); } }

async function wie(req: Request) {
  const id = (req as any).session?.userId as number | undefined;
  const [u] = id ? await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, id)) : [];
  return { id: id ?? null, voornaam: u?.firstName || "Onbekend", naam: u ? `${u.firstName} ${u.lastName}`.trim() : "Onbekend" };
}

const DIENSTEN: Record<string, string> = { "1-2": "1 tot 2 per week", "3-4": "3 tot 4 per week", "5+": "5 of meer per week" };

function invoer(c: Candidate, g: any | undefined, match: any | undefined, uitgenodigdAt?: Date | null) {
  return {
    status: c.status, interviewDate: c.interviewDate ? String(c.interviewDate) : null, createdAt: c.createdAt,
    birthDate: c.birthDate ? String(c.birthDate) : null, woonland: c.woonland ?? null,
    functie: isAfwas(c) ? "afwas" : c.functionType, nationalityZone: c.nationalityZone, hasCv: !!c.hasCv,
    job: g ? { status: g.status, herinneringen: g.herinneringen, herinneringAt: g.herinneringAt, laatsteActiviteitAt: g.laatsteActiviteitAt, bijgewerktAt: g.bijgewerktAt, velden: (g.velden || {}) as JobVelden, twijfels: g.twijfels || [] } : null,
    matchOpen: match ? { aangemaaktOp: match.aangemaaktOp, redenen: match.redenen } : null,
    uitgenodigdAt: uitgenodigdAt ?? null,
  };
}

async function lopende() {
  const cs = await db.select().from(candidates).where(or(eq(candidates.status, "in_behandeling"), and(eq(candidates.status, "gepland"), isNull(candidates.interviewDate))));
  const ids = cs.map((c) => c.id);
  const gs = ids.length ? await db.select().from(jobGesprekken).where(inArray(jobGesprekken.candidateId, ids)) : [];
  const ms = ids.length ? await db.select().from(kandidaatMogelijkeMatch).where(and(inArray(kandidaatMogelijkeMatch.candidateId, ids), eq(kandidaatMogelijkeMatch.status, "open"))) : [];
  const uitnodigingen = ids.length ? await db.select({ id: sollicitantGebeurtenissen.candidateId, at: sql<Date>`max(${sollicitantGebeurtenissen.at})` })
    .from(sollicitantGebeurtenissen).where(and(inArray(sollicitantGebeurtenissen.candidateId, ids), eq(sollicitantGebeurtenissen.soort, "uitgenodigd")))
    .groupBy(sollicitantGebeurtenissen.candidateId) : [];
  const planners = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName }).from(users);
  return {
    cs, gm: new Map(gs.map((g) => [g.candidateId, g])), mm: new Map(ms.map((m) => [m.candidateId, m])),
    um: new Map(uitnodigingen.map((u) => [u.id, new Date(u.at)])), pm: new Map(planners.map((p) => [p.id, p])),
  };
}

async function overzicht(ik: number | null) {
  const nu = new Date();
  const { cs, gm, mm, um, pm } = await lopende();
  const rijen = cs.filter((c) => inKandidaten({ status: c.status, interviewDate: c.interviewDate ? String(c.interviewDate) : null })).map((c) => {
    const b = bolletje(invoer(c, gm.get(c.id), mm.get(c.id), um.get(c.id)), nu);
    const planner = c.plannerUserId ? pm.get(c.plannerUserId) : null;
    return {
      id: c.id, naam: `${c.firstName} ${c.lastName}`.trim(), functie: functieNaam(c.functionType, isAfwas(c)), functieCode: c.functieEersteKeus || c.functionType,
      branche: brancheVan(c.functionType, null, isAfwas(c), ingangBranche(c.bronDetails)),
      kleur: b.kleur, cijfer: b.cijfer || null, status: b.tekst, sinds: b.sinds, sindsTekst: sindsTekst(b.sinds, nu),
      planner: plannerLabel(planner || null), plannerId: c.plannerUserId || null, mijn: !!ik && c.plannerUserId === ik, aangemeld: c.createdAt,
    };
  }).sort((a, b) => vergelijk({ kleur: a.kleur as Kleur, sinds: new Date(a.sinds) }, { kleur: b.kleur as Kleur, sinds: new Date(b.sinds) }));
  const perKleur = Object.fromEntries(KLEUR_VOLGORDE.map((k) => [k, rijen.filter((r) => r.kleur === k).length]));
  const perBranche = { alle: rijen.length, hotels: rijen.filter((r) => r.branche === "hotels").length, events: rijen.filter((r) => r.branche === "events").length, logistiek: rijen.filter((r) => r.branche === "logistiek").length };
  const gezien = new Set<number>();
  const planners: { id: number; naam: string }[] = [];
  for (const r of rijen) if (r.plannerId && !gezien.has(r.plannerId)) { gezien.add(r.plannerId); planners.push({ id: r.plannerId, naam: r.planner }); }
  return { rijen, tellers: { perKleur, perBranche, aandacht: (perKleur.geel || 0) + (perKleur.rood || 0) }, planners };
}

async function dossier(id: number) {
  const [c] = await db.select().from(candidates).where(eq(candidates.id, id));
  if (!c) return null;
  const nu = new Date();
  const [g] = await db.select().from(jobGesprekken).where(eq(jobGesprekken.candidateId, id));
  const matches = await db.select().from(kandidaatMogelijkeMatch).where(and(eq(kandidaatMogelijkeMatch.candidateId, id), eq(kandidaatMogelijkeMatch.status, "open")));
  const [uitgenodigd] = await db.select({ at: sollicitantGebeurtenissen.at }).from(sollicitantGebeurtenissen)
    .where(and(eq(sollicitantGebeurtenissen.candidateId, id), eq(sollicitantGebeurtenissen.soort, "uitgenodigd"))).orderBy(desc(sollicitantGebeurtenissen.at)).limit(1);
  const b = bolletje(invoer(c, g, matches[0], uitgenodigd?.at), nu);
  const [planner] = c.plannerUserId ? await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, c.plannerUserId)) : [];
  const matchDetails = await Promise.all(matches.map(async (m) => {
    if (m.soort === "medewerker") {
      const [e] = await db.select({ firstName: employees.firstName, lastName: employees.lastName, createdAt: employees.createdAt }).from(employees).where(eq(employees.id, m.matchId));
      return { id: m.id, soort: m.soort, matchId: m.matchId, redenen: (m.redenen as string[]).map((r) => MATCH_REDEN_TEKST[r] || r), naam: e ? `${e.firstName} ${e.lastName}` : "onbekend", wanneer: e?.createdAt || null, stand: "Is al medewerker." };
    }
    const [k] = await db.select().from(candidates).where(eq(candidates.id, m.matchId));
    const stand = !k ? "Bestaat niet meer." : k.status === "afgewezen" ? `Is toen afgewezen${k.rejectionReason ? ` (${k.rejectionReason.replace(/_/g, " ")})` : ""}.` : k.status === "aangenomen" ? "Is aangenomen." : k.status === "gepland" ? "Heeft een gesprek gepland." : "Loopt nog.";
    return { id: m.id, soort: m.soort, matchId: m.matchId, redenen: (m.redenen as string[]).map((r) => MATCH_REDEN_TEKST[r] || r), naam: k ? `${k.firstName} ${k.lastName}` : "onbekend", wanneer: k?.createdAt || null, stand };
  }));
  const berichten = g ? await db.select().from(jobBerichten).where(eq(jobBerichten.gesprekId, g.id)).orderBy(jobBerichten.aangemaaktAt) : [];
  const audit = await storage.getCandidateAuditLogs(id).catch(() => [] as any[]);
  const gebeurtenissen = await db.select().from(sollicitantGebeurtenissen).where(eq(sollicitantGebeurtenissen.candidateId, id)).orderBy(desc(sollicitantGebeurtenissen.at));
  const tijdlijn = [
    ...gebeurtenissen.map((e) => ({ at: e.at, tekst: e.tekst, notitie: e.soort === "notitie" })),
    ...audit.map((a: any) => ({ at: a.createdAt, tekst: (a.changeData as any)?.description || a.action, notitie: false })),
    ...(g ? [{ at: g.gestartAt, tekst: "Gesprek met Job gestart", notitie: false }] : []),
  ].sort((p, q) => new Date(q.at).getTime() - new Date(p.at).getTime());
  const v = (g?.velden || {}) as JobVelden & Record<string, unknown>;
  const ruwe = (c.bronDetails as any)?.chip || (c.sourceChannel || "").replace(/^website - /i, "") || "";
  const bron = !ruwe ? null : /^(aanmeldflow|aanmeldformulier|website)$/i.test(ruwe.trim()) ? "de website" : ruwe;
  return {
    id: c.id, voornaam: c.firstName, naam: `${c.firstName} ${c.lastName}`.trim(), status: c.status,
    functie: functieNaam(c.functionType, isAfwas(c)), branche: brancheVan(c.functionType, null, isAfwas(c), ingangBranche(c.bronDetails)),
    leeftijd: leeftijd(c.birthDate ? String(c.birthDate) : null, nu), plaats: c.city, aangemeld: c.createdAt, bron,
    bolletje: { kleur: b.kleur, cijfer: b.cijfer || null, tekst: b.tekst, reden: b.reden, sinds: b.sinds, sindsTekst: sindsTekst(b.sinds, nu), gele: b.gele.map((x) => ({ ...x, ...VOLGENDE_ACTIE[x.reden] })) },
    planner: planner ? { id: planner.id, label: plannerLabel(planner) } : null,
    matches: matchDetails,
    profiel: {
      ervaring: v.ervaring || c.previousExperience || null, diensten: v.diensten ? DIENSTEN[String(v.diensten)] || String(v.diensten) : c.availability || null,
      werkgebied: v.werkgebied ? `${v.werkgebied}${c.postcode ? ` van ${c.postcode.slice(0, 4)}` : ""}` : null,
      nationaliteit: c.nationality, talen: v.talen || c.language || null, werkautorisatie: v.werkautorisatie || null,
      cv: c.hasCv ? (c.cvFilename || "") : null, uitJob: !!g,
    },
    contact: {
      telefoon: c.phone, whatsapp: c.whatsappNummer, email: c.email, postcode: c.postcode, woonland: c.woonland,
      whatsappStatus: c.whatsappOptInStatus, toestemmingOp: c.whatsappToestemmingOp, gesprekstaal: c.gesprekstaal,
    },
    job: g ? {
      status: g.status, kanaal: g.kanaal, token: g.token, gestart: g.gestartAt,
      berichten: berichten.map((m) => ({ richting: m.richting, tekst: m.tekst, at: m.aangemaaktAt, bijlage: !!m.bijlage })),
    } : null,
    tijdlijn,
  };
}

export function registerKandidatenRoutes(app: Express, adminMiddleware: Middleware) {
  const aan: Middleware = (_req, res, next) => { if (!kandidatenAan()) return res.status(404).json({ message: "Niet beschikbaar" }); next(); };
  const r = (pad: string) => `/api/admin/kandidaten${pad}`;
  const veilig = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
    try { await fn(req, res); }
    catch (e: any) {
      if (e instanceof Fout) return res.status(e.status).json({ message: e.message, code: e.code });
      console.error("[Kandidaten]", e?.message || e);
      res.status(500).json({ message: "Er ging iets mis. Probeer het opnieuw." });
    }
  };
  const nummer = (x: unknown) => { const n = Number(x); if (!Number.isInteger(n) || n <= 0) throw new Fout(404, "Kandidaat niet gevonden."); return n; };
  async function kandidaat(id: number) {
    const [c] = await db.select().from(candidates).where(eq(candidates.id, id));
    if (!c) throw new Fout(404, "Kandidaat niet gevonden.");
    return c;
  }
  async function log(c: Candidate, w: { id: number | null; voornaam: string }, soort: string, tekst: string) {
    await db.insert(sollicitantGebeurtenissen).values({ candidateId: c.id, soort, tekst, door: w.voornaam, doorUserId: w.id });
  }

  app.get(r("/overzicht"), adminMiddleware, aan, veilig(async (req, res) => { res.json(await overzicht((await wie(req)).id)); }));
  app.get(r("/momenten"), adminMiddleware, aan, veilig(async (_req, res) => {
    const job = await import("../job/jobService");
    res.json(await job.momenten());
  }));
  app.get(r("/dossier/:id"), adminMiddleware, aan, veilig(async (req, res) => {
    const d = await dossier(nummer(req.params.id));
    if (!d) throw new Fout(404, "Kandidaat niet gevonden.");
    res.json(d);
  }));

  app.post(r("/:id/accepteren"), adminMiddleware, aan, veilig(async (req, res) => {
    const c = await kandidaat(nummer(req.params.id));
    if (c.status !== "in_behandeling") throw new Fout(409, `${c.firstName} staat niet meer bij de lopende kandidaten.`);
    const [open] = await db.select({ id: kandidaatMogelijkeMatch.id }).from(kandidaatMogelijkeMatch).where(and(eq(kandidaatMogelijkeMatch.candidateId, c.id), eq(kandidaatMogelijkeMatch.status, "open")));
    if (open) throw new Fout(409, "Beoordeel eerst het mogelijke dubbele dossier.", "match");
    if (!c.hasCv && req.body?.zonderCv !== true) throw new Fout(409, "Er is nog geen cv. Toch uitnodigen?", "geen_cv");
    const w = await wie(req);
    const job = await import("../job/jobService");
    const g = await job.naarPlannen(c.id);
    await db.update(candidates).set({ status: "gepland", updatedAt: new Date() }).where(eq(candidates.id, c.id));
    await job.uitnodigingNaCheck(c.id).catch((e: any) => console.warn("[Kandidaten] bericht van Job na accepteren mislukt:", e?.message || e));
    let mail = false;
    if (c.email) {
      const { stuurUitnodigingsmail } = await import("../job/jobMails");
      mail = await stuurUitnodigingsmail({
        voornaam: c.firstName, email: c.email, functie: c.functionType, taal: g.taal === "en" ? "en" : "nl",
        link: job.gesprekLink(g.token, "&plannen=1"), nonEu: c.nationalityZone === "NON_EU", viaWhatsapp: g.kanaal === "whatsapp",
      }).catch(() => false);
    }
    await storage.createCandidateAuditLog({ candidateId: c.id, action: "updated", changedByUserId: w.id, changeData: { description: `Uitgenodigd door ${w.voornaam}` }, ipAddress: null } as any).catch(() => {});
    await log(c, w, "uitgenodigd", `Uitgenodigd door ${w.voornaam}${mail ? ", mail met afspraakknop verstuurd" : ", geen mail verstuurd"}`);
    res.json({ ok: true, mail });
  }));

  app.post(r("/:id/inplannen"), adminMiddleware, aan, veilig(async (req, res) => {
    const c = await kandidaat(nummer(req.params.id));
    if (c.status !== "in_behandeling" && !(c.status === "gepland" && !c.interviewDate)) throw new Fout(409, `${c.firstName} heeft al een gesprek of staat niet meer bij de lopende kandidaten.`);
    const datum = String(req.body?.datum || ""), tijd = String(req.body?.tijd || "");
    const w = await wie(req);
    const job = await import("../job/jobService");
    const g = await job.naarPlannen(c.id);
    if (c.status === "in_behandeling") await db.update(candidates).set({ status: "gepland", updatedAt: new Date() }).where(eq(candidates.id, c.id));
    const uit = await job.boek(g, { datum, tijd });
    if (!uit.ok) {
      if (c.status === "in_behandeling") await db.update(candidates).set({ status: "in_behandeling" }).where(eq(candidates.id, c.id));
      throw new Fout(409, (uit as any).reden === "bezet" ? "Dit moment is net weg. Kies een ander moment." : "Inplannen lukte niet. Kies een ander moment.");
    }
    await log(c, w, "ingepland", `Gesprek ingepland door ${w.voornaam}: ${datum.split("-").reverse().join("-")} om ${tijd}`);
    res.json({ ok: true });
  }));

  app.post(r("/:id/planner"), adminMiddleware, aan, veilig(async (req, res) => {
    const c = await kandidaat(nummer(req.params.id));
    const w = await wie(req);
    const naar = req.body?.loslaten === true ? null : w.id;
    await db.update(candidates).set({ plannerUserId: naar, plannerSinds: naar ? new Date() : null }).where(eq(candidates.id, c.id));
    await log(c, w, "planner", naar ? `${w.voornaam} is nu de planner` : `${w.voornaam} heeft de kandidaat losgelaten`);
    res.json({ ok: true });
  }));

  app.post(r("/match/:matchId"), adminMiddleware, aan, veilig(async (req, res) => {
    const mid = nummer(req.params.matchId);
    const status = String(req.body?.status || "");
    if (status !== "zelfde_persoon" && status !== "iemand_anders") throw new Fout(400, "Kies Zelfde persoon of Iemand anders.");
    const [m] = await db.select().from(kandidaatMogelijkeMatch).where(eq(kandidaatMogelijkeMatch.id, mid));
    if (!m) throw new Fout(404, "Niet gevonden.");
    const w = await wie(req);
    await db.update(kandidaatMogelijkeMatch).set({ status, beoordeeldDoor: w.id, beoordeeldOp: new Date() }).where(eq(kandidaatMogelijkeMatch.id, mid));
    const c = await kandidaat(m.candidateId);
    await log(c, w, "match", status === "zelfde_persoon" ? `Mogelijk dubbel dossier: zelfde persoon, volgens ${w.voornaam}` : `Mogelijk dubbel dossier: iemand anders, volgens ${w.voornaam}`);
    res.json({ ok: true });
  }));

  app.post(r("/:id/notitie"), adminMiddleware, aan, veilig(async (req, res) => {
    const c = await kandidaat(nummer(req.params.id));
    const tekst = typeof req.body?.tekst === "string" ? req.body.tekst.trim().slice(0, 2000) : "";
    if (!tekst) throw new Fout(400, "Lege notitie.");
    const w = await wie(req);
    await log(c, w, "notitie", `Notitie van ${w.voornaam}: ${tekst}`);
    res.json({ ok: true });
  }));
}

export { BRANCHE };
