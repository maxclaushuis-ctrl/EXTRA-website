/**
 * Sollicitatieformulier versie 2: opslag en routes (regels in shared/intakeV2.ts).
 *
 * Schakelaar INTAKE_V2: in de testomgeving vanzelf aan, uit met INTAKE_V2=0; elders alleen
 * met INTAKE_V2=1. De schakelaar bepaalt alleen met welk formulier een NIEUWE intake begint.
 * Een intake die in versie 1 is begonnen, wordt in versie 1 afgemaakt; een intake van
 * versie 2 blijft versie 2, ook als de schakelaar daarna uit gaat. Terugschakelen kost
 * dus geen gegevens.
 *
 * Opslag:
 *  - de actuele antwoorden staan, net als bij versie 1, in sollicitant_dossiers.intake
 *    (met _versie: 2) en het dossier legt intake_versie vast;
 *  - elke wijziging van een antwoord komt daarnaast als eigen regel in intake_antwoorden
 *    (vraag, waarde, bron, status, wie, wanneer): een correctie overschrijft dus niets;
 *  - intake_revisie telt op bij elke bewaring: wie met een oude stand bewaart, krijgt een
 *    melding in plaats van dat het werk van een collega wordt overschreven.
 *
 * In de logboeken van de server komen geen antwoorden: alleen wie wat deed.
 * Er wordt hier niets verstuurd naar kandidaten en er verandert niets aan Job of het voortraject.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import {
  candidates, employees, intakeAntwoorden, onboardingTemplates, sollicitantDossiers,
  type Candidate, type SollicitantDossier,
} from "@shared/schema";
import { functieNaam, isAfwas, ingangBranche, referentieStatus, type Check } from "@shared/sollicitantRegels";
import {
  isV2, valideerIntakeV2, valideerBeoordelingV2, wijzigingen, checkUitIntakeV2, medewerkerProfiel, SCHUIVEN_V2,
  type IntakeV2, type BeoordelingV2, type FunctieCtx, type Voortraject, type Wijziging,
} from "@shared/intakeV2";
import type { JobVelden } from "@shared/jobRegels";
import type { Periode } from "@shared/kandidaatMatch";
import { laatsteAnalyses, matchUit } from "../job/cvAnalyse";
import { functiegroepVoor, planbordPayload, uitkomstTekst, type StapUitkomst } from "@shared/onboardingDoorzetten";

type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;
interface Wie { id: number | null; naam: string; voornaam: string }

/** Formulier versie 2 voor nieuwe intakes. Testomgeving aan tenzij INTAKE_V2=0, elders alleen met INTAKE_V2=1. */
export function intakeV2Aan(): boolean {
  const w = process.env.INTAKE_V2;
  return w === "1" || (process.env.TESTOMGEVING === "1" && w !== "0");
}

// ─── Aansluitlaag op het voortraject (alleen lezen) ─────────────────────────

/** De functie van de kandidaat voor het formulier: hoofdfunctie, ingang en alle bij de aanmelding gekozen functies. */
export function functieCtxVan(c: Candidate): FunctieCtx {
  const b = c.bronDetails && typeof c.bronDetails === "object" ? (c.bronDetails as Record<string, unknown>) : {};
  const functies = Array.isArray(b.functies) ? (b.functies as unknown[]).filter((x): x is string => typeof x === "string") : null;
  return { functie: c.functionType, eersteKeus: c.functieEersteKeus, label: ingangBranche(c.bronDetails), afwas: isAfwas(c), functies };
}

/** Wat formulier, Job en cv al weten over deze kandidaat. Leest alleen; wijzigt niets aan het voortraject. */
export async function voortrajectVan(c: Candidate, g: { velden: unknown; twijfels: unknown } | null): Promise<Voortraject> {
  const velden = (g?.velden || {}) as JobVelden;
  const analyse = (await laatsteAnalyses([c.id]).catch(() => new Map())).get(c.id);
  const blok = matchUit(c, analyse, velden);
  const gelezen = blok.status === "klaar" && !!analyse;
  const status: Voortraject["cv"]["status"] = !c.hasCv || !c.cvFilename ? "geen" : gelezen ? "gelezen"
    : blok.status === "niet_leesbaar" || blok.status === "geen_tekst" ? "niet_leesbaar" : "ontvangen";
  const periodes = gelezen ? ((analyse!.periodes || []) as Periode[]).filter((p) => p.bron === "cv")
    .map((p) => ({ functie: p.functie, werkgever: p.werkgever || null, begin: p.begin, einde: p.einde, soort: p.soort })) : [];
  return {
    functieNaam: functieNaam(c.functionType, isAfwas(c)),
    formulier: { talen: c.language, ervaring: c.horecaExperience || c.previousExperience, beschikbaarheid: c.availability, postcode: c.postcode, woonplaats: c.city, zone: c.nationalityZone },
    job: g ? (velden as Record<string, unknown>) : null,
    jobTwijfels: Array.isArray(g?.twijfels) ? (g!.twijfels as string[]) : [],
    cv: { status, periodes, uitleg: gelezen ? blok.kaart?.uitleg || null : null, // Alleen punten om na te vragen; "onbekend" en "schatting" zijn uitleg bij de score, geen bespreekpunt.
      aandacht: gelezen ? (blok.kaart?.aandacht || []).filter((a) => a.soort === "open").map((a) => (a.d ? `${a.t}: ${a.d}` : a.t)) : [] },
  };
}

// ─── Medewerkersdossier ─────────────────────────────────────────────────────

/** De medewerker die bij deze kandidaat hoort (employees.candidate_id), als die er is. */
export async function medewerkerVan(candidateId: number): Promise<{ id: number; status: string } | null> {
  const [e] = await db.select({ id: employees.id, status: employees.status }).from(employees).where(eq(employees.candidateId, candidateId));
  return e || null;
}
export async function medewerkersVan(ids: number[]): Promise<Map<number, number>> {
  if (!ids.length) return new Map();
  const rijen = await db.select({ id: employees.id, candidateId: employees.candidateId }).from(employees).where(inArray(employees.candidateId, ids));
  return new Map(rijen.filter((r) => r.candidateId != null).map((r) => [r.candidateId as number, r.id]));
}

/** Het profiel uit de intake zoals het medewerkersdossier het toont. Leest uit het dossier van de kandidaat. */
async function profielVan(c: Candidate, d: SollicitantDossier | undefined) {
  const basis = { kandidaatId: c.id, naam: `${c.firstName} ${c.lastName}`.trim(), voornaam: c.firstName, functie: functieNaam(c.functionType, isAfwas(c)) };
  if (!d || d.intakeStatus !== "afgerond") return { ...basis, versie: null, profiel: null };
  const ctl = (d.controle || {}) as Check;
  const controle = { idGezien: !!ctl.idGezien, idDoor: ctl.idDoor || null, idAt: ctl.idAt || null, referentie: referentieStatus(ctl) };
  const gemeen = { ...basis, intakeDoor: d.intakeDoor, intakeAfgerondAt: d.intakeAfgerondAt, beoordeeldDoor: d.beoordeeldDoor, beoordeeldAt: d.beoordeeldAt, controle, heeftFoto: !!d.foto };
  if (d.intakeVersie !== 2 || !isV2(d.intake)) return { ...gemeen, versie: 1, profiel: null, beoordeling: d.beoordeling };
  return { ...gemeen, versie: 2, profiel: medewerkerProfiel(d.intake, functieCtxVan(c), c.firstName), beoordeling: d.beoordeling };
}

// ─── Historie ───────────────────────────────────────────────────────────────

const SAMENVOEGEN_MS = 120000;

/**
 * Legt wijzigingen vast als regels. Typt dezelfde persoon binnen twee minuten door in hetzelfde
 * veld, dan is dat één handeling: de laatste regel van die persoon voor dat veld wordt bijgewerkt
 * in plaats van dat elke aanslag een regel wordt. Regels uit een andere bron of van iemand anders
 * blijven altijd staan.
 */
async function legVast(candidateId: number, w: Wie, onderdeel: "intake" | "beoordeling", lijst: Wijziging[]) {
  if (!lijst.length) return;
  const nu = new Date();
  const recent = await db.select().from(intakeAntwoorden)
    .where(and(eq(intakeAntwoorden.candidateId, candidateId), eq(intakeAntwoorden.onderdeel, onderdeel), sql`${intakeAntwoorden.at} > ${new Date(nu.getTime() - SAMENVOEGEN_MS)}`))
    .orderBy(desc(intakeAntwoorden.id));
  const laatste = new Map<string, (typeof recent)[number]>();
  for (const r of recent) if (!laatste.has(r.vraag)) laatste.set(r.vraag, r);
  const nieuw: (typeof intakeAntwoorden.$inferInsert)[] = [];
  for (const x of lijst) {
    const vorig = laatste.get(x.vraag);
    const zelfdeHandeling = vorig && vorig.doorUserId === w.id && vorig.bron === x.bron && x.bron !== "job" && x.bron !== "cv" && x.bron !== "formulier"
      && (vorig.status === "ingevuld" || vorig.status === "aangepast") && (x.status === "ingevuld" || x.status === "aangepast");
    if (zelfdeHandeling) await db.update(intakeAntwoorden).set({ waarde: x.waarde as any, at: nu }).where(eq(intakeAntwoorden.id, vorig!.id));
    else nieuw.push({ candidateId, versie: 2, onderdeel, vraag: x.vraag, waarde: x.waarde as any, bron: x.bron, status: x.status, door: w.voornaam, doorUserId: w.id, at: nu });
  }
  if (nieuw.length) await db.insert(intakeAntwoorden).values(nieuw);
}

// ─── Routes ─────────────────────────────────────────────────────────────────

export interface Hulp {
  Fout: (status: number, tekst: string, extra?: Record<string, unknown>) => Error;
  nummer: (x: unknown) => number | null;
  wie: (req: Request) => Promise<Wie>;
  kandidaat: (id: number) => Promise<Candidate | undefined>;
  zorgVoorDossier: (c: Candidate) => Promise<SollicitantDossier>;
  dossierVan: (id: number) => Promise<SollicitantDossier | undefined>;
  werkBij: (id: number, velden: Partial<typeof sollicitantDossiers.$inferInsert>) => Promise<void>;
  log: (candidateId: number, w: Wie, soort: string, tekst: string, data?: unknown) => Promise<void>;
  twvNodig: (c: Candidate, d?: SollicitantDossier | null) => boolean;
}

export function registerIntakeV2Routes(
  app: Express, adminMiddleware: Middleware, alleenAan: Middleware,
  veilig: (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response) => Promise<unknown>,
  h: Hulp,
) {
  const r = (pad: string) => `/api/sollicitanten${pad}`;
  async function vind(req: Request) {
    const id = h.nummer(req.params.id);
    const c = id ? await h.kandidaat(id) : undefined;
    if (!c) throw h.Fout(404, "Sollicitant niet gevonden.");
    return c;
  }
  /** Mag dit dossier met versie 2 werken? Een begonnen intake houdt zijn eigen versie. */
  function eisV2(d: SollicitantDossier) {
    if (d.intakeStatus === "niet_gestart") { if (!intakeV2Aan()) throw h.Fout(409, "Het nieuwe formulier staat uit. Open de intake opnieuw."); return; }
    if (d.intakeVersie !== 2) throw h.Fout(409, "Deze intake is begonnen in het oude formulier en wordt daarin afgemaakt. Open hem opnieuw.");
  }
  async function laatsteBewerker(candidateId: number): Promise<string | null> {
    const [l] = await db.select({ door: intakeAntwoorden.door }).from(intakeAntwoorden).where(eq(intakeAntwoorden.candidateId, candidateId)).orderBy(desc(intakeAntwoorden.id)).limit(1);
    return l?.door || null;
  }

  // Concept bewaren. De browser stuurt de revisie mee die hij las; alleen dan wordt bewaard.
  app.put(r("/intake2/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const c = await vind(req);
    const d = await h.zorgVoorDossier(c);
    if (d.stap !== "gesprek_gepland") throw h.Fout(409, "De intake is al afgerond.", { afgerond: true });
    eisV2(d);
    const intake = valideerIntakeV2(req.body?.intake);
    if (!intake) throw h.Fout(400, "Geen geldige intake.");
    const revisie = Number(req.body?.revisie);
    if (!Number.isInteger(revisie) || revisie < 0) throw h.Fout(400, "Geen revisie.");
    const w = await h.wie(req);
    const stap = Math.min(9, Math.max(1, Number(req.body?.stap) || d.intakeStap || 1));
    const eerste = d.intakeStatus === "niet_gestart";
    const bewaard = await db.update(sollicitantDossiers)
      .set({ intake, intakeStap: stap, intakeStatus: "concept", intakeVersie: 2, intakeDoor: d.intakeDoor || w.naam, intakeRevisie: revisie + 1, bijgewerktAt: new Date() })
      .where(and(eq(sollicitantDossiers.candidateId, c.id), eq(sollicitantDossiers.intakeRevisie, revisie), eq(sollicitantDossiers.stap, "gesprek_gepland")))
      .returning({ revisie: sollicitantDossiers.intakeRevisie });
    if (!bewaard.length) {
      const nu = await h.dossierVan(c.id);
      const door = await laatsteBewerker(c.id);
      throw h.Fout(409, `${door && door !== w.voornaam ? door : "Iemand"} heeft deze intake intussen aangepast. Laad de laatste stand om verder te gaan; jouw laatste wijziging is niet bewaard.`,
        { conflict: true, revisie: nu?.intakeRevisie ?? null, intake: nu?.intake ?? null });
    }
    if (eerste) await h.log(c.id, w, "intake_gestart", `Intake gestart door ${w.voornaam} (formulier versie 2)`);
    await legVast(c.id, w, "intake", wijzigingen(eerste ? null : (d.intake as IntakeV2), intake));
    res.json({ ok: true, revisie: bewaard[0].revisie });
  }));

  // Afronden. Kan maar één keer: een tweede klik krijgt hetzelfde antwoord zonder dat er iets dubbel gebeurt.
  app.post(r("/intake2/:id/afronden"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const c = await vind(req);
    const d = await h.zorgVoorDossier(c);
    if (d.stap === "beoordelen" && d.intakeVersie === 2 && d.intakeStatus === "afgerond") return res.json({ stap: "beoordelen", al: true });
    if (d.stap !== "gesprek_gepland") throw h.Fout(409, "De intake is al afgerond.");
    eisV2(d);
    const w = await h.wie(req);
    const intake = (req.body?.intake ? valideerIntakeV2(req.body.intake) : null) || (isV2(d.intake) ? d.intake : null);
    if (!intake) throw h.Fout(400, "Er is nog niets ingevuld.");
    const nu = new Date();
    const controle = checkUitIntakeV2(intake, w.voornaam, nu.toISOString(), d.controle as Check);
    const gedaan = await db.update(sollicitantDossiers)
      .set({ intake, intakeStatus: "afgerond", intakeVersie: 2, intakeAfgerondAt: nu, intakeDoor: d.intakeDoor || w.naam, controle, stap: "beoordelen", stapSinds: nu, intakeRevisie: d.intakeRevisie + 1, bijgewerktAt: nu })
      .where(and(eq(sollicitantDossiers.candidateId, c.id), eq(sollicitantDossiers.stap, "gesprek_gepland"), eq(sollicitantDossiers.intakeRevisie, d.intakeRevisie)))
      .returning({ id: sollicitantDossiers.id });
    if (!gedaan.length) {
      const nuD = await h.dossierVan(c.id);
      if (nuD?.stap === "beoordelen") return res.json({ stap: "beoordelen", al: true });
      throw h.Fout(409, "De intake is intussen aangepast. Laad de laatste stand en rond dan af.", { conflict: true, revisie: nuD?.intakeRevisie ?? null, intake: nuD?.intake ?? null });
    }
    await legVast(c.id, w, "intake", wijzigingen(d.intakeStatus === "niet_gestart" ? null : (d.intake as IntakeV2), intake));
    const dag = nu.toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
    if (intake.id_gezien === "Niet gezien") await h.log(c.id, w, "id_niet_gezien", `ID niet gecontroleerd bij de intake · ${dag}, ${w.voornaam}`);
    if (intake.werkrecht === "twv_nodig" && !c.needsTwv) {
      await db.update(candidates).set({ needsTwv: true, updatedAt: nu }).where(eq(candidates.id, c.id));
      await h.log(c.id, w, "twv", `TWV nodig, vastgelegd bij de intake door ${w.voornaam}`);
    }
    const open = (intake.acties || []).filter((a) => !a.klaar && a.tekst?.trim());
    if (open.length) await h.log(c.id, w, "acties", `${open.length} open ${open.length === 1 ? "punt" : "punten"} uit de intake: ${open.map((a) => `${a.tekst.trim()}${a.eigenaar ? ` (${a.eigenaar})` : ""}`).join("; ")}`.slice(0, 400));
    await h.log(c.id, w, "intake_afgerond", `Intake afgerond door ${w.voornaam} (formulier versie 2)`);
    res.json({ stap: "beoordelen" });
  }));

  // Beoordeling door de interviewer: drie schuiven van 1 tot 100 en een onderbouwing. Leeg blijft leeg.
  app.put(r("/beoordeling2/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const c = await vind(req);
    const d = await h.zorgVoorDossier(c);
    if (d.stap !== "beoordelen") throw h.Fout(409, "De beoordeling is al afgerond.");
    if (d.intakeVersie !== 2) throw h.Fout(409, "Deze beoordeling hoort bij het oude formulier.");
    const w = await h.wie(req);
    const oud = (d.beoordeling || {}) as BeoordelingV2 & { _versie?: number };
    const inv = valideerBeoordelingV2(req.body?.beoordeling);
    const b: BeoordelingV2 & { _versie: 2 } = { _versie: 2 };
    for (const s of SCHUIVEN_V2) {
      const v = s.code in inv ? inv[s.code] : oud[s.code];
      if (typeof v === "number") b[s.code] = v;
    }
    const tekst = inv.onderbouwing !== undefined ? inv.onderbouwing : oud.onderbouwing;
    if (tekst) b.onderbouwing = tekst;
    const lijst: Wijziging[] = [];
    for (const k of [...SCHUIVEN_V2.map((s) => s.code), "onderbouwing"] as const) {
      const a = (oud as any)[k] ?? null, n = (b as any)[k] ?? null;
      if (a !== n) lijst.push({ vraag: k, waarde: n, bron: "gesprek", status: n === null ? "gewist" : a === null ? "ingevuld" : "aangepast" });
    }
    const nu = new Date();
    await h.werkBij(c.id, { beoordeling: b, beoordeeldDoor: w.naam, beoordeeldAt: nu });
    await legVast(c.id, w, "beoordeling", lijst.map((x) => ({ ...x, bron: "gesprek" as const })));
    res.json({ ok: true, beoordeling: b, beoordeeldDoor: w.naam, beoordeeldAt: nu });
  }));

  // Historie per antwoord: wie wat wanneer invulde, bevestigde of aanpaste.
  app.get(r("/intake2/:id/historie"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const c = await vind(req);
    const rijen = await db.select().from(intakeAntwoorden).where(eq(intakeAntwoorden.candidateId, c.id)).orderBy(desc(intakeAntwoorden.id)).limit(500);
    res.json(rijen.map((x) => ({ id: x.id, onderdeel: x.onderdeel, vraag: x.vraag, waarde: x.waarde, bron: x.bron, status: x.status, door: x.door, at: x.at })));
  }));

  // Medewerkersdossier: het profiel uit de intake, voor planner en begeleider.
  app.get(r("/profiel/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const c = await vind(req);
    res.json({ ...(await profielVan(c, await h.dossierVan(c.id))), medewerker: await medewerkerVan(c.id) });
  }));
  app.get(r("/medewerkerprofiel/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const id = h.nummer(req.params.id);
    const [e] = id ? await db.select({ id: employees.id, candidateId: employees.candidateId, status: employees.status }).from(employees).where(eq(employees.id, id)) : [];
    if (!e) throw h.Fout(404, "Medewerker niet gevonden.");
    if (!e.candidateId) return res.json({ versie: null, profiel: null, medewerker: { id: e.id, status: e.status }, gekoppeld: false });
    const c = await h.kandidaat(e.candidateId);
    if (!c) return res.json({ versie: null, profiel: null, medewerker: { id: e.id, status: e.status }, gekoppeld: false });
    res.json({ ...(await profielVan(c, await h.dossierVan(c.id))), medewerker: { id: e.id, status: e.status }, gekoppeld: true });
  }));

  /**
   * Wat de knop "Medewerker aanmaken" gaat doen: de onboardingtemplates (de best passende
   * voorgeselecteerd op taal en functiegroep) en of mail en Planboard echt naar buiten gaan.
   */
  app.get(r("/onboardingmail/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const c = await vind(req);
    const { storage } = await import("../storage");
    const { isMailMock } = await import("../mail");
    const templates = await db.select({ id: onboardingTemplates.id, naam: onboardingTemplates.naam, taal: onboardingTemplates.taal, functiegroep: onboardingTemplates.functiegroep, opdrachtgever: onboardingTemplates.opdrachtgever, content: onboardingTemplates.content })
      .from(onboardingTemplates).where(eq(onboardingTemplates.actief, true)).orderBy(onboardingTemplates.naam);
    const bruikbaar = templates.filter((t) => (t.content || "").trim()).map(({ content: _c, ...t }) => t);
    const groep = functiegroepVoor(c.functionType, (c as any).functieEersteKeus, isAfwas(c as any));
    const voorstel = await storage.selecteerOnboardingTemplate({ taal: c.language || "Nederlands", functie: groep, opdrachtgever: null }).catch(() => undefined);
    const test = process.env.TESTOMGEVING === "1";
    res.json({
      templates: bruikbaar,
      voorstel: voorstel && bruikbaar.some((t) => t.id === voorstel.id) ? voorstel.id : null,
      email: c.email || null,
      mail: test ? (isMailMock() ? "mailvenster" : "geblokkeerd") : isMailMock() ? "uit" : "aan",
      planbord: test ? "testomgeving" : process.env.PLANBORD_WEBHOOK_URL && process.env.WEBHOOK_SECRET ? "aan" : "uit",
    });
  }));

  /**
   * Van Onboarding naar het medewerkersdossier (besluit Max, 11 nov). Maakt de medewerker één keer
   * aan, met dezelfde velden als de bestaande route /api/admin/candidates/:id/aannemen. Bij een
   * nieuwe medewerker gaat daarna de gekozen onboardingmail uit en gaat hij via de bestaande
   * webhook naar Planboard (shared/onboardingDoorzetten.ts). Mislukt een van die twee, dan blijft
   * de medewerker staan en zegt de melding wat er nog moet. Bestaat de medewerker al, dan gebeurt
   * er niets dubbel en wordt er niets verstuurd. In de testomgeving gaat er niets naar Planboard en
   * gaat de mail alleen naar het mailvenster.
   * De antwoorden blijven in het dossier van de kandidaat staan; de medewerker verwijst daarnaar.
   */
  app.post(r("/medewerker/:id"), adminMiddleware, alleenAan, veilig(async (req, res) => {
    const c = await vind(req);
    const d = await h.zorgVoorDossier(c);
    if (d.stap !== "onboarding") throw h.Fout(409, "Een medewerker aanmaken kan pas vanuit Onboarding.");
    const w = await h.wie(req);
    const t = req.body?.templateId;
    const templateId = typeof t === "number" && Number.isInteger(t) && t > 0 ? t : null;
    const bestaand = await medewerkerVan(c.id);
    if (bestaand) return res.json({ medewerkerId: bestaand.id, nieuw: false });
    if (!c.email) throw h.Fout(400, `${c.firstName} heeft geen e-mailadres. Vul dat eerst in bij de persoonsgegevens.`);
    const [opMail] = await db.select({ id: employees.id, candidateId: employees.candidateId }).from(employees).where(sql`lower(${employees.email}) = ${c.email.toLowerCase()}`);
    if (opMail) {
      if (opMail.candidateId && opMail.candidateId !== c.id) throw h.Fout(409, "Er bestaat al een medewerker met dit e-mailadres die bij een andere aanmelding hoort. Kijk dit na in Medewerkers.");
      await db.update(employees).set({ candidateId: c.id }).where(and(eq(employees.id, opMail.id), sql`${employees.candidateId} IS NULL`));
      await h.log(c.id, w, "medewerker", `Gekoppeld aan de bestaande medewerker met hetzelfde e-mailadres door ${w.voornaam}`);
      return res.json({ medewerkerId: opMail.id, nieuw: false, gekoppeld: true });
    }
    try {
      const [e] = await db.insert(employees).values({
        firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone || null, birthDate: c.birthDate || null, city: c.city || null,
        language: c.language || "Nederlands", functie: c.functionType, status: "nieuw", candidateId: c.id,
      } as any).returning({ id: employees.id });
      await h.log(c.id, w, "medewerker", `Medewerker aangemaakt door ${w.voornaam}`);
      const mail = await onboardingmail(h, c, e.id, templateId, w);
      const planbord = await naarPlanbord(h, c, e.id, w);
      res.status(201).json({ medewerkerId: e.id, nieuw: true, mail, planbord, melding: uitkomstTekst(c.firstName, mail, planbord) });
    } catch (fout: any) {
      // Twee klikken tegelijk: de tweede vindt de medewerker die de eerste maakte.
      const nu = await medewerkerVan(c.id);
      if (nu) return res.json({ medewerkerId: nu.id, nieuw: false });
      throw fout;
    }
  }));
}

/** De gekozen onboardingmail versturen. Gooit nooit: de medewerker is er al. */
async function onboardingmail(h: Hulp, c: Candidate, medewerkerId: number, templateId: number | null, w: Wie): Promise<StapUitkomst> {
  let uit: StapUitkomst;
  if (!templateId) uit = { status: "overgeslagen", reden: "geen template gekozen" };
  else {
    try {
      const { isMailMock } = await import("../mail");
      if (process.env.TESTOMGEVING === "1" && !isMailMock()) uit = { status: "overgeslagen", reden: "testomgeving zonder mailvenster" };
      else {
        const { verstuurOnboardingMail } = await import("../onboardingService");
        const r = await verstuurOnboardingMail(medewerkerId, templateId, "handmatig");
        uit = { status: "verzonden", reden: r.templateNaam };
      }
    } catch (fout: any) {
      uit = { status: "mislukt", reden: String(fout?.message || "onbekende fout").slice(0, 200) };
    }
  }
  const tekst = uit.status === "verzonden" ? `Onboardingmail verstuurd (${uit.reden}) door ${w.voornaam}`
    : uit.status === "mislukt" ? `Onboardingmail niet verstuurd: ${uit.reden}` : `Geen onboardingmail verstuurd (${uit.reden})`;
  await h.log(c.id, w, "onboardingmail", tekst).catch(() => {});
  return uit;
}

/** Via de bestaande webhook naar Planboard, met alleen de velden van de oude route. Gooit nooit. */
async function naarPlanbord(h: Hulp, c: Candidate, medewerkerId: number, w: Wie): Promise<StapUitkomst> {
  let uit: StapUitkomst;
  try {
    const { sendPlanbordWebhook } = await import("../integrations/planbord-webhook");
    const r = await sendPlanbordWebhook(planbordPayload(c as any, medewerkerId));
    uit = { status: r.result, reden: r.reason === "testomgeving" ? "testomgeving" : r.reason?.startsWith("PLANBORD_WEBHOOK_URL") ? "koppeling niet ingesteld" : r.reason };
  } catch (fout: any) {
    uit = { status: "mislukt", reden: String(fout?.message || "onbekende fout").slice(0, 200) };
  }
  const tekst = uit.status === "verzonden" ? "Doorgezet naar Planboard" : uit.status === "mislukt" ? `Niet doorgezet naar Planboard: ${uit.reden}` : `Niet naar Planboard (${uit.reden})`;
  await h.log(c.id, w, "planbord", tekst).catch(() => {});
  return uit;
}
