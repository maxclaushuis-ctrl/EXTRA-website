/**
 * Job, de AI-recruiter: de dienst die de regels uitvoert.
 *
 * De regels zelf staan in shared/jobRegels.ts (wat Job vraagt en wanneer) en
 * shared/jobPlanning.ts (welke momenten vrij zijn). Dit bestand doet de rest:
 * opslaan, berichten versturen (WhatsApp of het webgesprek), mails, meldingen
 * voor de planner en het boeken van de kennismaking.
 *
 * Schakelaars (Secrets in Replit):
 *  - JOB_ENABLED=1        Job start na elke voltooide aanmelding en de
 *                         herinneringen lopen. Zonder deze schakelaar doet Job
 *                         in productie niets uit zichzelf.
 *  - TESTOMGEVING=1       In de testomgeving mag een planner Job ook met de
 *                         hand starten (de simulator), ook zonder JOB_ENABLED.
 *  - JOB_WA_SJABLOON_START, JOB_WA_SJABLOON_HERINNERING, JOB_WA_SJABLOON_AFSPRAAK
 *                         Namen van de door Meta goedgekeurde sjablonen. Zonder
 *                         sjabloon voor de start praat Job via het webgesprek
 *                         en krijgt de kandidaat de link per mail.
 *
 * Er wordt nooit iets verwijderd. Een verzette afspraak krijgt status 'verzet'.
 */
import { matchAan } from "./cvAnalyse";
import { functieVan, isLabel, type AanmeldLabel } from "@shared/aanmeldLabels";
import { randomBytes } from "crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import { candidates, jobAfspraken, jobBerichten, jobGesprekken, jobInterviewers, type JobGesprek } from "@shared/schema";
import { planHerinneringNodig, planHerinnering, bestandTijdensVragen, spraakBericht, vraag,
  ervaringWerk, cvAfrondingTekst, functieLabel, herinnering, herinneringNodig, herkenCommando, profielVelden, samenvatting, start, teksten, verwerk,
  type Actie, type JobContext, type JobState, type JobStatus, type JobTaal, type Uitgaand,
} from "@shared/jobRegels";
import {
  afspraakHerinneringNodig, amsterdam, dagTekst, momentGeldig, STANDAARD_INTERVIEWERS, vrijeMomenten,
  type Bezet, type Interviewer, type Moment,
} from "@shared/jobPlanning";
import { begrijpenAan, lees } from "./jobAi";
import { filterPrivacy, privacyMelding } from "@shared/jobPrivacy";
import { brancheVan, isAfwas, ingangBranche } from "@shared/sollicitantRegels";
import { knopTitel, whatsappKnoppen, keuzeUitNummer } from "@shared/jobWhatsapp";
export { knopTitel, whatsappKnoppen, keuzeUitNummer };
import { stuurBevestigingsmail, stuurHerinneringsmail, stuurStartmail, stuurCvMail } from "./jobMails";

export function jobAan(): boolean {
  return process.env.JOB_ENABLED === "1";
}
/**
 * Job 3.0 fase 1: elke stap heeft een eigen schakelaar en staat standaard aan.
 * Terugdraaien zonder nieuwe publicatie: zet het Secret op 0, bijvoorbeeld
 * JOB_V3_PRIVACY=0, JOB_V3_STOP=0, JOB_V3_BIJLAGEN=0 of JOB_V3_TIMEOUT=0.
 */
export function v3(stap: "PRIVACY" | "STOP" | "BIJLAGEN" | "TIMEOUT"): boolean {
  return process.env[`JOB_V3_${stap}`] !== "0";
}
export function testomgeving(): boolean {
  return process.env.TESTOMGEVING === "1";
}
export function magHandmatigStarten(): boolean {
  return jobAan() || testomgeving();
}

export function basisUrl(): string {
  // In de testomgeving op Replit wijzen links naar de testomgeving zelf, niet naar de live site.
  if (process.env.TESTOMGEVING === "1") {
    const replit = (process.env.REPLIT_DEV_DOMAIN || (process.env.REPLIT_DOMAINS || "").split(",")[0] || "").trim();
    if (replit) return `https://${replit}`;
  }
  return (process.env.BASE_URL || "https://www.doehetextra.nl").replace(/\/$/, "");
}
/** Link voor de browser van de kandidaat zelf: relatief, zodat hij altijd op de omgeving blijft waar hij zich aanmeldde. */
export function gesprekPad(token: string): string {
  return `/job-gesprek?token=${encodeURIComponent(token)}`;
}

/**
 * Korte link naar het webgesprek: /j/<token>, met /cv of /plan voor de
 * uploadknop of de planning (jobRoutes stuurt door naar /job-gesprek).
 * Andere extra's (bijv. &stop=1) gaan via de lange vorm.
 */
export function gesprekLink(token: string, extra = ""): string {
  const kort = extra === "" ? "" : extra === "&cv=1" ? "/cv" : extra === "&plannen=1" ? "/plan" : null;
  if (kort === null) return `${basisUrl()}/job-gesprek?token=${encodeURIComponent(token)}${extra}`;
  return `${basisUrl()}/j/${encodeURIComponent(token)}${kort}`;
}

/** De sjablonen die Job mag gebruiken: een Secret, of het eigen sjabloon zodra Meta het goedkeurde (jobSjablonen.ts). */
async function SJABLONEN() {
  const { sjabloonNaam } = await import("./jobSjablonen");
  const [start, herinnering, afspraak] = await Promise.all([sjabloonNaam("start"), sjabloonNaam("herinnering"), sjabloonNaam("afspraak")]);
  return { start, herinnering, afspraak };
}

async function whatsappKlaar(): Promise<boolean> {
  try {
    const p = await import("../whatsapp/provider");
    return p.isSendConfigured();
  } catch {
    return false;
  }
}

export async function jobStatus() {
  const s = await SJABLONEN();
  const { aiBeschikbaar } = await import("./jobAi");
  return {
    aan: jobAan(),
    testomgeving: testomgeving(),
    handmatigStarten: magHandmatigStarten(),
    ai: aiBeschikbaar(),
    whatsapp: await whatsappKlaar(),
    sjablonen: { start: !!s.start, herinnering: !!s.herinnering, afspraak: !!s.afspraak },
  };
}

// ─── State ↔ database ────────────────────────────────────────────────────────

function naarState(g: JobGesprek): JobState {
  return {
    taal: (g.taal === "en" ? "en" : "nl") as JobTaal,
    status: g.status as JobStatus,
    velden: (g.velden || {}) as any,
    laatsteOnderwerp: (g.laatsteOnderwerp || null) as any,
    twijfels: Array.isArray(g.twijfels) ? g.twijfels : [],
    herinneringen: g.herinneringen || 0,
    herinneringAt: g.herinneringAt ? new Date(g.herinneringAt).toISOString() : null,
    laatsteInkomendAt: g.laatsteInkomendAt ? new Date(g.laatsteInkomendAt).toISOString() : null,
    laatsteActiviteitAt: new Date(g.laatsteActiviteitAt || g.gestartAt).toISOString(),
  };
}

async function bewaarState(id: number, s: JobState, extra: Partial<typeof jobGesprekken.$inferInsert> = {}) {
  await db.update(jobGesprekken).set({
    taal: s.taal,
    status: s.status,
    velden: s.velden as any,
    laatsteOnderwerp: s.laatsteOnderwerp,
    twijfels: s.twijfels,
    herinneringen: s.herinneringen,
    herinneringAt: s.herinneringAt ? new Date(s.herinneringAt) : null,
    laatsteInkomendAt: s.laatsteInkomendAt ? new Date(s.laatsteInkomendAt) : null,
    laatsteActiviteitAt: new Date(s.laatsteActiviteitAt),
    bijgewerktAt: new Date(),
    ...extra,
  }).where(eq(jobGesprekken.id, id));
}

export async function gesprekVanToken(token: string): Promise<JobGesprek | null> {
  if (!token || token.length < 16) return null;
  const [g] = await db.select().from(jobGesprekken).where(eq(jobGesprekken.token, token)).limit(1);
  return g || null;
}

export async function gesprekVanKandidaat(candidateId: number): Promise<JobGesprek | null> {
  const [g] = await db.select().from(jobGesprekken).where(eq(jobGesprekken.candidateId, candidateId)).limit(1);
  return g || null;
}

/**
 * Het gesprek met Job voor een inkomend WhatsApp-bericht. Meldt iemand zich
 * vaker aan met hetzelfde nummer, dan koppelt de WhatsApp-matcher het bericht
 * aan de eerste kandidaat met dat nummer, niet per se aan die met het lopende
 * gesprek. Daarom: het meest recent actieve gesprek van alle kandidaten met
 * dit nummer (niet gestopt); anders het gesprek van de gematchte kandidaat.
 */
export async function gesprekVoorNummer(nummer: string, candidateId: number | null): Promise<JobGesprek | null> {
  const { normalizePhone } = await import("../whatsapp/phone");
  const doel = normalizePhone(nummer);
  if (doel) {
    const rijen = await db.select({ id: candidates.id, phone: candidates.phone, whatsappNummer: candidates.whatsappNummer }).from(candidates)
      .where(sql`${candidates.phone} is not null or ${candidates.whatsappNummer} is not null`);
    const ids = rijen.filter((r) => normalizePhone(r.phone) === doel || (!!r.whatsappNummer && normalizePhone(r.whatsappNummer) === doel)).map((r) => r.id);
    if (ids.length) {
      const [g] = await db.select().from(jobGesprekken)
        .where(and(inArray(jobGesprekken.candidateId, ids), sql`${jobGesprekken.status} <> 'gestopt'`))
        .orderBy(desc(jobGesprekken.laatsteActiviteitAt)).limit(1);
      if (g) return g;
      // Job 3.0: wie na STOP terugschrijft, komt bij zijn gestopte gesprek uit, ook als
      // de WhatsApp-matcher een andere kandidaat met hetzelfde nummer koos.
      if (v3("STOP")) {
        const [gestopt] = await db.select().from(jobGesprekken)
          .where(inArray(jobGesprekken.candidateId, ids))
          .orderBy(desc(jobGesprekken.laatsteActiviteitAt)).limit(1);
        if (gestopt) return gestopt;
      }
    }
  }
  return candidateId ? gesprekVanKandidaat(candidateId) : null;
}

export async function berichtenVan(gesprekId: number) {
  return db.select().from(jobBerichten).where(eq(jobBerichten.gesprekId, gesprekId)).orderBy(jobBerichten.id);
}

export async function actieveAfspraak(candidateId: number) {
  const [a] = await db.select().from(jobAfspraken)
    .where(and(eq(jobAfspraken.candidateId, candidateId), eq(jobAfspraken.status, "gepland")))
    .orderBy(desc(jobAfspraken.id)).limit(1);
  return a || null;
}

async function kandidaat(candidateId: number) {
  const [c] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  return c || null;
}

/** De functie zoals gekozen op het formulier per label, in kleine letters voor in een zin. */
function functieNaamVan(c: { functieEersteKeus?: string | null; bronDetails?: unknown }): { nl: string; en: string } | undefined {
  const label = ingangLabel(c.bronDetails);
  if (!c.functieEersteKeus || !label) return undefined;
  const f = functieVan(c.functieEersteKeus, label);
  if (!f) return undefined;
  const klein = (x: string) => (/^[A-Z]{2}|^F&B/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1));
  // "aangemeld voor bar" leest raar: een lidwoord waar dat hoort.
  const MET_LIDWOORD: Record<string, { nl: string; en: string }> = { bar: { nl: "de bar", en: "the bar" }, keuken: { nl: "de keuken", en: "the kitchen" }, afwas: { nl: "de afwas", en: "dishwashing" } };
  return MET_LIDWOORD[c.functieEersteKeus] || { nl: klein(f.nl), en: klein(f.en) };
}
/** Meer dan één functie aangevinkt op het formulier (events). */
function meerFunctiesGekozen(bron: unknown): boolean {
  const f = bron && typeof bron === "object" ? (bron as Record<string, unknown>).functies : null;
  return Array.isArray(f) && f.length > 1;
}
function ingangLabel(bron: unknown): AanmeldLabel | null {
  const b = bron && typeof bron === "object" ? (bron as Record<string, unknown>).branche : null;
  return isLabel(b) ? b : null;
}

async function context(candidateId: number, taal: JobTaal): Promise<JobContext | null> {
  const c = await kandidaat(candidateId);
  if (!c) return null;
  const a = await actieveAfspraak(candidateId);
  return {
    voornaam: c.firstName,
    functie: c.functieEersteKeus === "afwas" ? "afwas" : c.functionType,
    functieNaam: functieNaamVan(c),
    label: brancheVan(c.functionType, null, isAfwas(c as any), ingangBranche(c.bronDetails)),
    nationalityZone: (c.nationalityZone as any) || null,
    hasCv: !!c.hasCv,
    afspraak: a ? { dag: dagTekst(String(a.datum), taal), tijd: a.tijd, wie: a.interviewer } : undefined,
    stopV3: v3("STOP"),
    cvVragen: matchAan(),
    begrijpen: begrijpenAan(),
    meerFuncties: meerFunctiesGekozen(c.bronDetails),
  };
}

/** Het nummer waar Job naartoe stuurt: een apart WhatsApp-nummer gaat voor. */
function waNummer(c: { phone: string | null; whatsappNummer?: string | null }): string {
  return c.whatsappNummer || c.phone || "";
}

// ─── Berichten opslaan en versturen ──────────────────────────────────────────

async function bewaarInkomend(g: JobGesprek, tekst: string, bijlage?: string | null, kanaal?: string, extra?: string | null) {
  await db.insert(jobBerichten).values({ gesprekId: g.id, richting: "in", tekst, bijlage: bijlage || null, kanaal: kanaal || g.kanaal, extra: extra || null });
}

/** Tekst voor WhatsApp: links voor cv en planning erbij; keuzes genummerd als er geen knoppen komen. */
export function whatsappTekst(b: Uitgaand, token: string, taal: JobTaal, metKnoppen = false): string {
  const t = teksten(taal);
  let tekst = b.tekst;
  if (b.cvUpload) tekst = b.tekst === t.cvUpload ? t.cvUploadWa(gesprekLink(token, "&cv=1")) : `${b.tekst}\n${gesprekLink(token, "&cv=1")}`;
  if (b.planning) {
    if (b.tekst === t.plannen) tekst = t.plannenWa(gesprekLink(token, "&plannen=1"));
    else if (b.tekst === t.verzetten) tekst = t.verzettenWa(gesprekLink(token, "&plannen=1"));
    else tekst = `${b.tekst}\n${gesprekLink(token, "&plannen=1")}`;
  }
  if (b.keuzes && b.keuzes.length && !metKnoppen) tekst += "\n\n" + b.keuzes.map((k, i) => `${i + 1}. ${k}`).join("\n");
  return tekst;
}


/** Fictieve testkandidaten (e-mail op @voorbeeld.nl) krijgen nooit een echt WhatsApp-bericht. */
async function isTestkandidaat(candidateId: number): Promise<boolean> {
  const c = await kandidaat(candidateId);
  return !!c?.email && c.email.toLowerCase().endsWith("@voorbeeld.nl");
}

/** Een bericht van Job naar WhatsApp: met knoppen als dat kan, anders als tekst. */
async function stuurJobBericht(candidateId: number, telefoon: string, b: Uitgaand, token: string, taal: JobTaal): Promise<boolean> {
  const knoppen = whatsappKnoppen(b);
  return verstuurWhatsappTekst(candidateId, telefoon, whatsappTekst(b, token, taal, !!knoppen), knoppen);
}

async function verstuurWhatsappTekst(candidateId: number, telefoon: string, tekst: string, knoppen: string[] | null = null): Promise<boolean> {
  try {
    const waProvider = await import("../whatsapp/provider");
    const waStorage = await import("../whatsapp/storage");
    if (!waProvider.isSendConfigured()) return false;
    if (await isTestkandidaat(candidateId)) { console.log(`[Job] kandidaat ${candidateId} is fictief (testdata), geen WhatsApp`); return false; }
    const match = await waStorage.resolveAndUpsertConversation({ phoneNumber: telefoon, inbound: false, bodyPreview: tekst, at: new Date() });
    const dbId = await waStorage.insertOutboundQueued({
      direction: "outbound", fromNumber: "extra", toNumber: telefoon, messageType: knoppen ? "interactive" : "text",
      body: knoppen ? `${tekst}\n\n${knoppen.map((k) => `[${k}]`).join(" ")}` : tekst,
      candidateId: match.candidateId ?? candidateId, prospectContactId: match.prospectContactId, matchCategory: match.category,
      sentByUserId: null, rawPayload: knoppen ? { type: "interactive", knoppen, text: { body: tekst }, to: telefoon, job: true } : { type: "text", text: { body: tekst }, to: telefoon, job: true },
    } as any);
    const r = knoppen ? await waProvider.sendButtons(telefoon, tekst, knoppen) : await waProvider.sendText(telefoon, tekst);
    await waStorage.updateOutboundResult(dbId, r.ok ? { waMessageId: r.waMessageId ?? null, status: "sent" } : { status: "failed", errorCode: r.errorCode ?? null, errorMessage: r.errorMessage ?? null });
    if (!r.ok) console.warn(`[Job] WhatsApp naar kandidaat ${candidateId} mislukt: ${r.errorMessage}`);
    return r.ok;
  } catch (e: any) {
    console.warn("[Job] WhatsApp versturen mislukt:", e?.message || e);
    return false;
  }
}

async function verstuurSjabloon(candidateId: number, telefoon: string, naam: string, taal: JobTaal, parameters: string[], tekstVoorInbox: string): Promise<boolean> {
  if (!naam) return false;
  try {
    const waProvider = await import("../whatsapp/provider");
    const waStorage = await import("../whatsapp/storage");
    if (!waProvider.isSendConfigured()) return false;
    if (await isTestkandidaat(candidateId)) { console.log(`[Job] kandidaat ${candidateId} is fictief (testdata), geen WhatsApp`); return false; }
    const match = await waStorage.resolveAndUpsertConversation({ phoneNumber: telefoon, inbound: false, bodyPreview: tekstVoorInbox, at: new Date() });
    // Meta weigert variabelen met regeleinden, tabs of meer dan vier spaties op rij.
    const components = [{ type: "body", parameters: parameters.map((p) => ({ type: "text", text: String(p || "").replace(/\s+/g, " ").trim().slice(0, 900) })) }];
    const dbId = await waStorage.insertOutboundQueued({
      direction: "outbound", fromNumber: "extra", toNumber: telefoon, messageType: "template", body: tekstVoorInbox,
      candidateId: match.candidateId ?? candidateId, prospectContactId: match.prospectContactId, matchCategory: match.category,
      sentByUserId: null, rawPayload: { type: "template", template: { name: naam, language: taal, components }, job: true },
    } as any);
    const r = await waProvider.sendTemplate(telefoon, naam, taal, components);
    await waStorage.updateOutboundResult(dbId, r.ok ? { waMessageId: r.waMessageId ?? null, status: "sent" } : { status: "failed", errorCode: r.errorCode ?? null, errorMessage: r.errorMessage ?? null });
    return r.ok;
  } catch (e: any) {
    console.warn("[Job] sjabloon versturen mislukt:", e?.message || e);
    return false;
  }
}

/** Binnen 24 uur na het laatste bericht van de kandidaat mag Job vrij antwoorden (regel van Meta). */
function binnenVenster(s: JobState, nu: Date): boolean {
  return !!s.laatsteInkomendAt && nu.getTime() - new Date(s.laatsteInkomendAt).getTime() < 23.5 * 60 * 60 * 1000;
}

/**
 * ookNaStop: de kandidaat schreef zelf na STOP. Job mag dan antwoorden (binnen
 * het venster van 24 uur), ook al staat de WhatsApp-toestemming nog op opt_out.
 */
async function bewaarEnVerstuur(g: JobGesprek, s: JobState, berichten: Uitgaand[], nu: Date, ookNaStop = false) {
  const c = g.kanaal === "whatsapp" ? await kandidaat(g.candidateId) : null;
  for (const b of berichten) {
    if (!b.tekst) continue;
    await db.insert(jobBerichten).values({
      gesprekId: g.id, richting: "uit", tekst: b.tekst, keuzes: b.keuzes || null,
      extra: b.planning ? "planning" : b.cvUpload ? "cv_upload" : null, kanaal: g.kanaal,
    });
    const magSturen = c?.whatsappOptInStatus === "actief" || (ookNaStop && c?.whatsappOptInStatus === "opt_out");
    if (c?.phone && magSturen && binnenVenster(s, nu)) {
      await stuurJobBericht(g.candidateId, waNummer(c), b, g.token, s.taal);
    }
  }
}

// ─── Acties: planner, cv-mail, profiel ───────────────────────────────────────

async function meldPlanner(candidateId: number, reden: string) {
  const c = await kandidaat(candidateId);
  const naam = c ? `${c.firstName} ${c.lastName}` : `kandidaat ${candidateId}`;
  try {
    await storage.createAdminNotification({
      type: "job_planner",
      title: "Job: een collega moet kijken",
      message: `${naam}: ${reden}`,
      link: "/dashboard?tab=job",
      candidateId,
    } as any);
    await storage.createCandidateAuditLog({
      candidateId, action: "updated", changedByUserId: null,
      changeData: { description: `Job: naar de planner. ${reden}` }, ipAddress: null,
    } as any);
  } catch (e: any) {
    console.warn("[Job] melding voor de planner mislukt:", e?.message || e);
  }
}

async function voerUit(g: JobGesprek, s: JobState, acties: Actie[]) {
  for (const a of acties) {
    if (a.soort === "planner" || a.soort === "nogo") await meldPlanner(g.candidateId, a.reden);
    if (a.soort === "profiel") {
      const velden = profielVelden(a.velden);
      if (Object.keys(velden).length) {
        try { await storage.updateCandidate(g.candidateId, velden as any); } catch (e: any) { console.warn("[Job] profiel bijwerken mislukt:", e?.message); }
      }
    }
    if (a.soort === "hervat") {
      // De kandidaat wil na STOP duidelijk verder: WhatsApp-toestemming weer aan, met reden.
      try {
        const { setOptInStatus } = await import("../whatsapp/optInService");
        await setOptInStatus("kandidaat", g.candidateId, "actief", "Kandidaat wil na STOP verder met Job");
      } catch (e: any) { console.warn("[Job] toestemming weer aanzetten mislukt:", e?.message); }
    }
    if (a.soort === "cv_aanvulling") {
      import("./cvAnalyse").then((m) => m.startCvAnalyse(g.candidateId)).catch(() => {});
    }
    if (a.soort === "cv_bevestigd") {
      try { await storage.updateCandidate(g.candidateId, { hasCv: true, cvFilename: a.bijlage } as any); } catch (e: any) { console.warn("[Job] cv bijwerken mislukt:", e?.message); }
      import("./cvAnalyse").then((m) => m.startCvAnalyse(g.candidateId)).catch(() => {});
      await db.update(jobBerichten).set({ extra: null })
        .where(and(eq(jobBerichten.gesprekId, g.id), eq(jobBerichten.extra, "bestand"), eq(jobBerichten.bijlage, a.bijlage)));
    }
    if (a.soort === "bevestigd") {
      // Vinkje "Kandidaat heeft bevestigd" in het weekoverzicht van Sollicitanten.
      await db.update(jobAfspraken).set({ bevestigdAt: new Date() })
        .where(and(eq(jobAfspraken.candidateId, g.candidateId), eq(jobAfspraken.status, "gepland")));
    }
    if (a.soort === "cv_mail") {
      const c = await kandidaat(g.candidateId);
      // Kreeg de kandidaat al de cv-mail van de aanmeldflow, dan geen tweede.
      if (c?.email && !c.cvReminderSentAt) {
        stuurCvMail({ voornaam: c.firstName, email: c.email, functie: c.functionType, taal: s.taal, gesprekToken: g.token }).catch(() => {});
      }
    }
  }
}

// ─── Starten ─────────────────────────────────────────────────────────────────

/** 16 tekens (96 bits): kort genoeg voor een nette link in WhatsApp, lang genoeg om niet te raden. */
function nieuwToken(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * Start een gesprek met Job voor een kandidaat. Bestaat er al een gesprek,
 * dan komt dat terug (nooit twee gesprekken per kandidaat).
 * `voorkeur` 'whatsapp' werkt alleen als WhatsApp en het startsjabloon klaarstaan.
 */
export async function startGesprek(candidateId: number, opties: { voorkeur?: "whatsapp" | "web"; taal?: JobTaal; mail?: boolean } = {}): Promise<JobGesprek | null> {
  const bestaand = await gesprekVanKandidaat(candidateId);
  if (bestaand) return bestaand;
  const c = await kandidaat(candidateId);
  if (!c) return null;
  const taal: JobTaal = opties.taal || (/english|engels/i.test(c.language || "") && !/nederlands|dutch/i.test(c.language || "") ? "en" : "nl");
  const ctx = (await context(candidateId, taal))!;
  const nu = new Date();
  const r = start(ctx, taal, nu);

  const sjabloon = (await SJABLONEN()).start;
  const viaWhatsapp = opties.voorkeur !== "web" && !!waNummer(c) && c.whatsappOptInStatus === "actief" && !!sjabloon && (await whatsappKlaar());

  let g: JobGesprek;
  try {
    [g] = await db.insert(jobGesprekken).values({
      candidateId, token: nieuwToken(), kanaal: viaWhatsapp ? "whatsapp" : "web", taal,
      status: r.state.status, velden: {}, laatsteOnderwerp: r.state.laatsteOnderwerp, twijfels: [],
      laatsteActiviteitAt: nu,
    }).returning();
  } catch {
    // Tegelijk gestart (unieke kandidaat): neem het bestaande gesprek.
    return gesprekVanKandidaat(candidateId);
  }

  for (const b of r.berichten) {
    await db.insert(jobBerichten).values({ gesprekId: g.id, richting: "uit", tekst: b.tekst, keuzes: b.keuzes || null, kanaal: g.kanaal });
  }

  if (viaWhatsapp) {
    const eersteVraag = r.berichten[r.berichten.length - 1].tekst;
    const { startParameters } = await import("./jobSjablonen");
    const ok = await verstuurSjabloon(candidateId, waNummer(c), sjabloon, taal,
      startParameters(sjabloon, c.firstName, ctx.meerFuncties ? (taal === "en" ? "work at EXTRA" : "werk bij EXTRA") : functieLabel(c.functionType, taal), eersteVraag, ervaringWerk(ctx.functie, taal), ctx.functie, taal),
      `${r.berichten[0].tekst}\n\n${eersteVraag}`);
    if (!ok) {
      await db.update(jobGesprekken).set({ kanaal: "web" }).where(eq(jobGesprekken.id, g.id));
      g = { ...g, kanaal: "web" };
    }
  }
  if (g.kanaal === "web" && opties.mail !== false && c.email) {
    stuurStartmail({ voornaam: c.firstName, email: c.email, functie: c.functionType, taal, link: gesprekLink(g.token) }).catch(() => {});
  }
  try {
    await storage.createCandidateAuditLog({ candidateId, action: "updated", changedByUserId: null, changeData: { description: `Job gestart via ${g.kanaal}` }, ipAddress: null } as any);
  } catch { /* geen ramp */ }
  return g;
}

// ─── Een bericht verwerken ───────────────────────────────────────────────────

export interface VerwerkResultaat {
  ok: boolean;
  status: JobStatus;
  berichten: { tekst: string; keuzes?: string[] | null; extra?: string | null }[];
}

/** Verwerkt een bericht van de kandidaat (web of WhatsApp) en geeft de antwoorden van Job terug. */
/** Fase 2: het gesprek tot nu toe voor de AI (laatste berichten, het nieuwe antwoord niet meegerekend). */
async function gesprekVoorAi(gesprekId: number, nieuw: string): Promise<{ laatsteVraag: string; geschiedenis: string }> {
  const rijen = await db.select({ richting: jobBerichten.richting, tekst: jobBerichten.tekst }).from(jobBerichten)
    .where(eq(jobBerichten.gesprekId, gesprekId)).orderBy(desc(jobBerichten.id)).limit(16);
  const lijst = rijen.reverse();
  // Het zojuist opgeslagen antwoord staat er mogelijk al in: niet dubbel.
  if (lijst.length && lijst[lijst.length - 1].richting === "in" && lijst[lijst.length - 1].tekst.trim() === nieuw.trim()) lijst.pop();
  const laatsteVraag = [...lijst].reverse().find((r) => r.richting === "uit")?.tekst || "";
  const geschiedenis = lijst.map((r) => `${r.richting === "uit" ? "Job" : "Kandidaat"}: ${r.tekst.replace(/\s+/g, " ").slice(0, 300)}`).join("\n");
  return { laatsteVraag: laatsteVraag.slice(0, 400), geschiedenis };
}

export async function verwerkBericht(g: JobGesprek, invoer: { tekst?: string; cvOntvangen?: boolean; bijlage?: string | null; kanaal?: "web" | "whatsapp" }): Promise<VerwerkResultaat> {
  const nu = new Date();
  let s = naarState(g);
  // Een genummerd antwoord op WhatsApp ("2") wordt de tekst van die keuze.
  let tekst = (invoer.tekst || "").slice(0, 2000);
  // Job 3.0: BSN, IBAN, documentnummers en adressen komen niet in de opslag van Job en niet bij de AI.
  let privacy: ReturnType<typeof filterPrivacy> | null = null;
  if (tekst && v3("PRIVACY")) {
    const f = filterPrivacy(tekst);
    if (f.gevonden.length) {
      privacy = f;
      tekst = f.tekst;
      console.log(`[Job] privacyfilter: ${f.gevonden.join(", ")} weggelaten (gesprek ${g.id})`);
    }
  }
  if (tekst) {
    const [vorig] = await db.select().from(jobBerichten)
      .where(and(eq(jobBerichten.gesprekId, g.id), eq(jobBerichten.richting, "uit")))
      .orderBy(desc(jobBerichten.id)).limit(1);
    tekst = keuzeUitNummer(tekst, vorig?.keuzes as string[] | null);
  }
  if (tekst || invoer.bijlage) await bewaarInkomend(g, tekst || (invoer.cvOntvangen ? (g.taal === "en" ? "CV sent" : "Cv gestuurd") : ""), invoer.bijlage, invoer.kanaal);
  if (invoer.kanaal === "whatsapp" && g.kanaal !== "whatsapp") {
    await db.update(jobGesprekken).set({ kanaal: "whatsapp" }).where(eq(jobGesprekken.id, g.id));
    g = { ...g, kanaal: "whatsapp" };
  }

  let ctx = await context(g.candidateId, s.taal);
  if (!ctx) return { ok: false, status: s.status, berichten: [] };
  if (invoer.cvOntvangen) ctx = { ...ctx, hasCv: true };

  const wachtOpKandidaat = ["bezig", "wacht_cv", "geen_reactie", "gestopt"].includes(s.status);
  const wasGestopt = s.status === "gestopt";
  let r: ReturnType<typeof verwerk>;
  if (privacy?.leeg) {
    // Alleen gevoelige gegevens: niets uitlezen, de open vraag blijft staan.
    const herhaal = s.status === "bezig" && s.laatsteOnderwerp ? [vraag(s.laatsteOnderwerp, s.taal, ctx, s.velden)] : [];
    r = { state: { ...s, laatsteInkomendAt: nu.toISOString(), laatsteActiviteitAt: nu.toISOString(), herinneringen: 0, herinneringAt: null }, berichten: herhaal, acties: [] };
  } else {
    const leesbaar = tekst && wachtOpKandidaat && !herkenCommando(tekst, s.laatsteOnderwerp);
    const lezing = leesbaar ? await lees(tekst, s.laatsteOnderwerp, ctx, s.velden, s.taal, ctx.begrijpen ? await gesprekVoorAi(g.id, tekst) : undefined) : null;
    r = verwerk(s, ctx, { tekst, cvOntvangen: invoer.cvOntvangen }, lezing, nu);
  }
  if (privacy) r = { ...r, berichten: [{ tekst: privacyMelding(r.state.taal) }, ...r.berichten] };
  s = r.state;

  const klaar = ["plannen", "planner", "gepland"].includes(s.status) && !g.afgerondAt;
  await bewaarState(g.id, s, klaar ? { afgerondAt: nu } : {});
  await voerUit(g, s, r.acties);
  await bewaarEnVerstuur(g, s, r.berichten, nu, wasGestopt && !!tekst && !!ctx.stopV3);

  // Twijfel of geen planner nodig: de bevestigingsmail met "een collega bekijkt je aanmelding" volgt alleen bij planner.
  return {
    ok: true,
    status: s.status,
    berichten: r.berichten.filter((b) => b.tekst).map((b) => ({ tekst: b.tekst, keuzes: b.keuzes || null, extra: b.planning ? "planning" : b.cvUpload ? "cv_upload" : null })),
  };
}

/** Het cv is binnen (site, link of WhatsApp). Loopt het gesprek nog, dan gaat Job verder. */
export async function cvOntvangen(candidateId: number, bijlage?: string | null, kanaal?: "web" | "whatsapp"): Promise<VerwerkResultaat | null> {
  // Job 3.0, fase 4: het cv uitlezen op de achtergrond (schakelaar JOB_V3_MATCH). Pas nadat het
  // gesprek is bijgewerkt, zodat Job weet dat het slotbericht op het lezen wacht.
  const lees = () => import("./cvAnalyse").then((m) => m.startCvAnalyse(candidateId)).catch(() => {});
  let g = await gesprekVanKandidaat(candidateId);
  // Stond er een cv-vraag open (bijvoorbeeld "heb je het ook als pdf?"), dan is dit nieuwe cv het antwoord.
  if (g && (g.velden as any)?.cvVraag) {
    const s = naarState(g);
    const open = s.velden.cvVraag!;
    s.velden.cvVragen = (s.velden.cvVragen || []).map((v) => (v.soort === open.soort && v.antwoord === undefined ? { ...v, antwoord: "nieuw cv gestuurd" } : v));
    delete s.velden.cvVraag;
    await bewaarState(g.id, s);
    g = await gesprekVanKandidaat(candidateId);
  }
  if (!g || !["bezig", "wacht_cv", "geen_reactie", "cv_controle"].includes(g.status)) { lees(); return null; }
  try { return await verwerkBericht(g, { cvOntvangen: true, bijlage, kanaal }); }
  finally { lees(); }
}

/**
 * Job 3.0, fase 4: het cv is gelezen. Wacht het slotbericht daarop, dan stelt Job
 * eerst hoogstens twee cv-vragen (shared/cvVragen.ts) en anders, of daarna, het slotbericht.
 */
export async function naCvAnalyse(candidateId: number): Promise<void> {
  const g = await gesprekVanKandidaat(candidateId);
  if (!g) return;
  const s = naarState(g);
  const v = s.velden;
  if (!v.cvAfronding || v.cvVraag) return;
  const nu = new Date();
  if (!["planner", "cv_controle"].includes(s.status)) { delete v.cvAfronding; await bewaarState(g.id, s); return; }
  const c = await kandidaat(candidateId);
  if (!c) return;
  const { cvVraagVoor } = await import("@shared/cvVragen");
  const { modelVoor } = await import("@shared/kandidaatMatch");
  const { laatsteAnalyses } = await import("./cvAnalyse");
  const a = (await laatsteAnalyses([candidateId])).get(candidateId);
  const gesteld = (v.cvVragen || []).map((x) => x.soort);
  const vraag = a ? cvVraagVoor({
    status: a.status, model: modelVoor(c.functieEersteKeus, c.functionType, (c.bronDetails as any)?.branche ?? null),
    periodes: (a.periodes || []) as any, certificaten: (a.certificaten || []) as string[],
    gesprek: { ervaringNiveau: v.ervaringNiveau ?? null }, gesteld, peil: nu,
  }) : null;
  let tekst: string;
  if (vraag) {
    const vr = vraag[s.taal];
    v.cvVraag = { soort: vraag.soort, tekst: vr };
    v.cvVragen = [...(v.cvVragen || []), { soort: vraag.soort, vraag: vr }];
    tekst = gesteld.length === 0 && vraag.soort !== "leesbaar" ? teksten(s.taal).cvVraagEerste(vr) : vr;
  } else {
    tekst = cvAfrondingTekst(v.cvAfronding, c.firstName, s.taal);
    delete v.cvAfronding;
  }
  s.laatsteActiviteitAt = nu.toISOString();
  await bewaarState(g.id, s);
  await bewaarEnVerstuur(g, s, [{ tekst }], nu);
}

/**
 * Kandidaten (H): de planner accepteert. Is er nog geen gesprek met Job, dan
 * komt er een zonder startberichten; daarna staat het gesprek op "plannen",
 * zodat de kandidaat via de link zelf een moment kiest.
 */
export async function naarPlannen(candidateId: number): Promise<JobGesprek> {
  let g = await gesprekVanKandidaat(candidateId);
  if (!g) {
    const c = await kandidaat(candidateId);
    const taal: JobTaal = c?.gesprekstaal === "en" ? "en" : "nl";
    [g] = await db.insert(jobGesprekken).values({ candidateId, token: nieuwToken(), kanaal: "web", taal }).onConflictDoNothing().returning();
    if (!g) g = (await gesprekVanKandidaat(candidateId))!;
  }
  const s = { ...naarState(g), status: "plannen" as JobStatus, herinneringen: 0, herinneringAt: null, laatsteActiviteitAt: new Date().toISOString() };
  await bewaarState(g.id, s);
  return (await gesprekVanKandidaat(candidateId))!;
}

/**
 * Na Accepteren in Kandidaten: Job laat de kandidaat weten dat het cv is
 * bekeken en dat hij zelf een moment kan kiezen. In het webgesprek staat dan
 * de momentenkiezer; via WhatsApp gaat een bericht met de planlink (binnen 24
 * uur na het laatste bericht van de kandidaat een gewoon bericht, anders het
 * herinneringssjabloon). De mail met de afspraakknop stuurt de route zelf.
 */
export async function uitnodigingNaCheck(candidateId: number): Promise<void> {
  const g = await gesprekVanKandidaat(candidateId);
  const c = await kandidaat(candidateId);
  if (!g || !c) return;
  const s = naarState(g);
  const b: Uitgaand = { tekst: teksten(s.taal).uitgenodigd(c.firstName), planning: true };
  await db.insert(jobBerichten).values({ gesprekId: g.id, richting: "uit", tekst: b.tekst, extra: "planning", kanaal: g.kanaal });
  if (g.kanaal === "whatsapp" && c.whatsappOptInStatus === "actief" && waNummer(c)) {
    if (binnenVenster(s, new Date())) await stuurJobBericht(c.id, waNummer(c), b, g.token, s.taal);
    else await verstuurSjabloon(c.id, waNummer(c), (await SJABLONEN()).herinnering, s.taal, [c.firstName], b.tekst);
  }
}

/**
 * STOP via WhatsApp of de afmeldlink in de mail: geen berichten meer van Job.
 * Job 3.0: na STOP via WhatsApp stuurt Job één bevestiging (een antwoord op het
 * bericht van de kandidaat zelf, dus binnen het venster van 24 uur).
 */
export async function stopGesprek(candidateId: number, bron: "whatsapp" | "web" | "mail" = "web") {
  const g = await gesprekVanKandidaat(candidateId);
  if (!g || g.status === "gepland" || g.status === "gestopt") return;
  const nu = new Date();
  const s: JobState = { ...naarState(g), status: "gestopt" as JobStatus, ...(bron === "whatsapp" ? { laatsteInkomendAt: nu.toISOString() } : {}) };
  await bewaarState(g.id, s);
  if (bron !== "whatsapp" || !v3("STOP")) return;
  await bewaarInkomend(g, "STOP", null, "whatsapp");
  const tekst = teksten(s.taal).gestopt;
  await db.insert(jobBerichten).values({ gesprekId: g.id, richting: "uit", tekst, kanaal: "whatsapp" });
  const c = await kandidaat(candidateId);
  if (c && waNummer(c)) await verstuurWhatsappTekst(candidateId, waNummer(c), tekst);
}

/**
 * Een spraakbericht via WhatsApp (Job 3.0): Job vraagt vriendelijk om te typen.
 * Geeft false als Job niet reageert (geen lopend gesprek of schakelaar uit).
 */
export async function spraakOntvangen(candidateId: number): Promise<boolean> {
  if (!v3("BIJLAGEN")) return false;
  const g = await gesprekVanKandidaat(candidateId);
  if (!g || !["bezig", "wacht_cv", "geen_reactie"].includes(g.status)) return false;
  const nu = new Date();
  await bewaarInkomend(g, g.taal === "en" ? "[Voice message]" : "[Spraakbericht]", null, "whatsapp");
  const r = spraakBericht(naarState(g), nu);
  await bewaarState(g.id, r.state);
  await bewaarEnVerstuur({ ...g, kanaal: "whatsapp" }, r.state, r.berichten, nu);
  return true;
}

/**
 * Een foto of document via WhatsApp. Job 3.0: alleen als Job om het cv vroeg
 * (of het gesprek al op cv-controle staat) telt het als cv. Komt het tijdens de
 * andere vragen binnen, dan vraagt Job één keer of het het cv is.
 * Geeft "cv" (de route werkt de kandidaat bij), "gevraagd" of null (Job doet niets).
 */
export async function bijlageOntvangen(candidateId: number, bijlage: string): Promise<"cv" | "gevraagd" | null> {
  const g = await gesprekVanKandidaat(candidateId);
  if (!g || !["bezig", "wacht_cv", "geen_reactie", "cv_controle"].includes(g.status)) return null;
  const cvVraag = g.status === "wacht_cv" || g.status === "cv_controle" || g.laatsteOnderwerp === "cv";
  if (!v3("BIJLAGEN") || cvVraag) return "cv";
  const nu = new Date();
  await bewaarInkomend(g, g.taal === "en" ? "File sent" : "Bestand gestuurd", bijlage, "whatsapp", "bestand");
  const r = bestandTijdensVragen(naarState(g), bijlage, nu);
  await bewaarState(g.id, r.state);
  await bewaarEnVerstuur({ ...g, kanaal: "whatsapp" }, r.state, r.berichten, nu);
  return "gevraagd";
}

// ─── Inplannen ───────────────────────────────────────────────────────────────

export async function interviewers(): Promise<Interviewer[]> {
  const rijen = await db.select().from(jobInterviewers).orderBy(jobInterviewers.naam);
  if (rijen.length === 0) return STANDAARD_INTERVIEWERS;
  return rijen.map((r) => ({
    naam: r.naam,
    dagen: r.dagen.split(",").map((d) => Number(d.trim())).filter((d) => d >= 1 && d <= 7),
    van: r.van, tot: r.tot, pauzeVan: r.pauzeVan, pauzeTot: r.pauzeTot, actief: r.actief,
  }));
}

async function bezet(): Promise<Bezet[]> {
  const vandaag = amsterdam(new Date()).datum;
  const rijen = await db.select({ interviewer: jobAfspraken.interviewer, datum: jobAfspraken.datum, tijd: jobAfspraken.tijd })
    .from(jobAfspraken).where(and(eq(jobAfspraken.status, "gepland"), sql`${jobAfspraken.datum} >= ${vandaag}`));
  return rijen.map((r) => ({ interviewer: r.interviewer, datum: String(r.datum), tijd: r.tijd }));
}

export async function momenten(): Promise<Moment[]> {
  return vrijeMomenten(await interviewers(), await bezet(), new Date());
}

export type BoekUitkomst =
  | { ok: true; datum: string; tijd: string; interviewer: string; dagTekst: string; berichten: VerwerkResultaat["berichten"] }
  | { ok: false; reden: "status" | "bezet" | "ongeldig" };

export async function boek(g: JobGesprek, m: { datum: string; tijd: string }): Promise<BoekUitkomst> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.datum || "") || !/^\d{2}:\d{2}$/.test(m.tijd || "")) return { ok: false, reden: "ongeldig" };
  if (g.status !== "plannen" && g.status !== "gepland") return { ok: false, reden: "status" };
  const oud = await actieveAfspraak(g.candidateId);
  // Twee kandidaten kunnen tegelijk hetzelfde moment kiezen. De unieke index
  // laat er één winnen; de ander krijgt, als er nog een interviewer vrij is,
  // die interviewer. Pas als niemand meer vrij is, is het moment bezet.
  let vrij: Moment | null = null;
  for (let poging = 0; poging < 3; poging++) {
    vrij = momentGeldig(await interviewers(), await bezet(), new Date(), m);
    if (!vrij) return { ok: false, reden: "bezet" };
    try {
      const gekozen = vrij;
      await db.transaction(async (tx) => {
        if (oud) await tx.update(jobAfspraken).set({ status: "verzet" }).where(eq(jobAfspraken.id, oud.id));
        await tx.insert(jobAfspraken).values({ candidateId: g.candidateId, gesprekId: g.id, interviewer: gekozen.interviewer, datum: gekozen.datum, tijd: gekozen.tijd, status: "gepland" });
      });
      break;
    } catch {
      vrij = null;
    }
  }
  if (!vrij) return { ok: false, reden: "bezet" };

  const nu = new Date();
  const s: JobState = { ...naarState(g), status: "gepland", laatsteActiviteitAt: nu.toISOString() };
  await bewaarState(g.id, s, { afgerondAt: g.afgerondAt || nu });
  await storage.updateCandidate(g.candidateId, {
    status: "gepland", interviewDate: vrij.datum, interviewTime: vrij.tijd, interviewLocation: "Herengracht 372",
  } as any);
  try {
    await storage.createCandidateAuditLog({
      candidateId: g.candidateId, action: "updated", changedByUserId: null,
      changeData: { description: `Job: kennismaking ${oud ? "verzet naar" : "gepland op"} ${vrij.datum} ${vrij.tijd} met ${vrij.interviewer}` }, ipAddress: null,
    } as any);
  } catch { /* geen ramp */ }

  const dag = dagTekst(vrij.datum, s.taal);
  const tekst = teksten(s.taal).gepland(dag, vrij.tijd, vrij.interviewer);
  await bewaarEnVerstuur(g, s, [{ tekst }], nu);

  const c = await kandidaat(g.candidateId);
  if (c?.email) {
    stuurBevestigingsmail({
      voornaam: c.firstName, email: c.email, functie: c.functionType, taal: s.taal,
      dag, datum: vrij.datum, tijd: vrij.tijd, interviewer: vrij.interviewer,
      samenvatting: samenvatting(s.velden, { voornaam: c.firstName, functie: c.functionType, nationalityZone: null, hasCv: true }, s.taal),
      agendaLink: `${basisUrl()}/api/job/${encodeURIComponent(g.token)}/agenda.ics`,
      verzettenLink: gesprekLink(g.token, "&plannen=1"),
      gesprekLink: gesprekLink(g.token),
    }).catch(() => {});
  }
  return { ok: true, datum: vrij.datum, tijd: vrij.tijd, interviewer: vrij.interviewer, dagTekst: dag, berichten: [{ tekst }] };
}

// ─── Herinneringen ───────────────────────────────────────────────────────────

/**
 * Loopt elk uur (als JOB_ENABLED=1). In de testomgeving kan een planner de
 * klok vooruitzetten met `nu`, om de herinneringen te testen.
 */
export async function herinneringenRun(nu: Date = new Date()): Promise<{ herinneringen: number; rood: number; afspraken: number }> {
  let aantal = 0, rood = 0, afspraken = 0;
  const open = await db.select().from(jobGesprekken).where(inArray(jobGesprekken.status, ["bezig", "wacht_cv"]));
  for (const g of open) {
    const s = naarState(g);
    const soort = herinneringNodig(s, nu);
    if (!soort) continue;
    const ctx = await context(g.candidateId, s.taal);
    if (!ctx) continue;
    const r = herinnering(s, ctx, soort, nu);
    await bewaarState(g.id, r.state);
    await voerUit(g, r.state, r.acties);
    if (soort === "rood") { rood++; continue; }
    aantal++;
    for (const b of r.berichten) {
      await db.insert(jobBerichten).values({ gesprekId: g.id, richting: "uit", tekst: b.tekst, keuzes: b.keuzes || null, kanaal: g.kanaal });
    }
    const c = await kandidaat(g.candidateId);
    if (!c) continue;
    if (g.kanaal === "whatsapp" && c.phone && c.whatsappOptInStatus === "actief") {
      const tekst = r.berichten[0].tekst;
      if (binnenVenster(s, nu)) await stuurJobBericht(c.id, waNummer(c), r.berichten[0], g.token, s.taal);
      else await verstuurSjabloon(c.id, waNummer(c), (await SJABLONEN()).herinnering, s.taal, [c.firstName], tekst);
    }
    if (c.email && soort === "eerste") {
      const waNr = await (await import("./jobSjablonen")).jobNummer();
      stuurHerinneringsmail({ voornaam: c.firstName, email: c.email, functie: c.functionType, taal: s.taal, link: gesprekLink(g.token), stopLink: gesprekLink(g.token, "&stop=1"), waLink: g.kanaal === "whatsapp" && c.whatsappOptInStatus === "actief" && waNr ? `https://wa.me/${waNr.replace(/\D/g, "")}` : null }).catch(() => {});
    }
  }

  // Uitgenodigd maar nog geen moment gekozen: herinneren met de planlink.
  const teKiezen = await db.select().from(jobGesprekken).where(eq(jobGesprekken.status, "plannen"));
  for (const g of teKiezen) {
    const s = naarState(g);
    if (!planHerinneringNodig(s, nu)) continue;
    const c = await kandidaat(g.candidateId);
    const ctx = await context(g.candidateId, s.taal);
    if (!c || !ctx || c.status === "afgewezen" || c.interviewDate) continue;
    const r = planHerinnering(s, ctx, nu);
    await bewaarState(g.id, r.state);
    aantal++;
    const b = r.berichten[0];
    await db.insert(jobBerichten).values({ gesprekId: g.id, richting: "uit", tekst: b.tekst, extra: "planning", kanaal: g.kanaal });
    if (g.kanaal === "whatsapp" && c.whatsappOptInStatus === "actief" && waNummer(c)) {
      if (binnenVenster(s, nu)) await stuurJobBericht(c.id, waNummer(c), b, g.token, s.taal);
      else await verstuurSjabloon(c.id, waNummer(c), (await SJABLONEN()).herinnering, s.taal, [c.firstName], b.tekst);
    }
    if (c.email) {
      const { stuurUitnodigingsmail } = await import("./jobMails");
      stuurUitnodigingsmail({ voornaam: c.firstName, email: c.email, functie: c.functionType, taal: s.taal, link: gesprekLink(g.token, "&plannen=1"), nonEu: c.nationalityZone === "NON_EU", viaWhatsapp: g.kanaal === "whatsapp" }).catch(() => {});
    }
  }

  const gepland = await db.select().from(jobAfspraken).where(eq(jobAfspraken.status, "gepland"));
  for (const a of gepland) {
    if (!afspraakHerinneringNodig({ datum: String(a.datum), tijd: a.tijd, herinneringVerstuurd: !!a.herinneringVerstuurdAt }, nu)) continue;
    await db.update(jobAfspraken).set({ herinneringVerstuurdAt: nu }).where(eq(jobAfspraken.id, a.id));
    afspraken++;
    const g = await gesprekVanKandidaat(a.candidateId);
    const c = await kandidaat(a.candidateId);
    if (!g || !c) continue;
    const s = naarState(g);
    const t = teksten(s.taal);
    const tekst = t.afspraakHerinnering(c.firstName, a.tijd, a.interviewer);
    await db.insert(jobBerichten).values({ gesprekId: g.id, richting: "uit", tekst, keuzes: t.afspraakKeuzes, kanaal: g.kanaal });
    if (c.phone && c.whatsappOptInStatus === "actief" && g.kanaal === "whatsapp") {
      if (binnenVenster(s, nu)) await stuurJobBericht(c.id, waNummer(c), { tekst, keuzes: t.afspraakKeuzes }, g.token, s.taal);
      else await verstuurSjabloon(c.id, waNummer(c), (await SJABLONEN()).afspraak, s.taal, [c.firstName, a.tijd, a.interviewer], tekst);
    }
  }
  return { herinneringen: aantal, rood, afspraken };
}

// ─── Overzicht voor het dashboard ────────────────────────────────────────────

export async function overzicht() {
  const rijen = await db.select({
    id: jobGesprekken.id, candidateId: jobGesprekken.candidateId, token: jobGesprekken.token, kanaal: jobGesprekken.kanaal,
    taal: jobGesprekken.taal, status: jobGesprekken.status, twijfels: jobGesprekken.twijfels,
    laatsteActiviteitAt: jobGesprekken.laatsteActiviteitAt, gestartAt: jobGesprekken.gestartAt,
    voornaam: candidates.firstName, achternaam: candidates.lastName, functie: candidates.functionType,
  }).from(jobGesprekken).innerJoin(candidates, eq(candidates.id, jobGesprekken.candidateId))
    .orderBy(desc(jobGesprekken.laatsteActiviteitAt)).limit(300);
  const tellers: Record<string, number> = {};
  for (const r of rijen) tellers[r.status] = (tellers[r.status] || 0) + 1;
  return { tellers, gesprekken: rijen.map((r) => ({ ...r, link: gesprekLink(r.token) })) };
}

export async function afsprakenVanaf(vanaf: string) {
  return db.select({
    id: jobAfspraken.id, candidateId: jobAfspraken.candidateId, interviewer: jobAfspraken.interviewer,
    datum: jobAfspraken.datum, tijd: jobAfspraken.tijd, status: jobAfspraken.status,
    voornaam: candidates.firstName, achternaam: candidates.lastName, functie: candidates.functionType,
  }).from(jobAfspraken).innerJoin(candidates, eq(candidates.id, jobAfspraken.candidateId))
    .where(and(eq(jobAfspraken.status, "gepland"), sql`${jobAfspraken.datum} >= ${vanaf}`))
    .orderBy(jobAfspraken.datum, jobAfspraken.tijd);
}

export async function bewaarInterviewers(lijst: Interviewer[]) {
  for (const i of lijst) {
    const waarden = {
      naam: i.naam.trim().slice(0, 60), dagen: i.dagen.join(","), van: i.van, tot: i.tot,
      pauzeVan: i.pauzeVan || null, pauzeTot: i.pauzeTot || null, actief: i.actief !== false, bijgewerktAt: new Date(),
    };
    await db.insert(jobInterviewers).values(waarden).onConflictDoUpdate({ target: jobInterviewers.naam, set: waarden });
  }
}

/** Kandidaten zonder gesprek met Job, nieuwste eerst: voor de simulator en het handmatig starten. */
export async function kandidatenZonderGesprek() {
  return db.select({ id: candidates.id, firstName: candidates.firstName, lastName: candidates.lastName, functionType: candidates.functionType, email: candidates.email })
    .from(candidates)
    .where(and(eq(candidates.status, "in_behandeling"), sql`NOT EXISTS (SELECT 1 FROM job_gesprekken jg WHERE jg.candidate_id = ${candidates.id})`))
    .orderBy(desc(candidates.createdAt)).limit(50);
}
