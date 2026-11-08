/**
 * Aanmeldformulier 3 (bord A, bouwplan fase 1a). Eén POST bij het versturen;
 * daarna voert Job het gesprek. De oude routes /api/aanmelden* blijven
 * ongewijzigd voor het huidige formulier.
 *
 * Schakelaar AANMELDFORMULIER:
 *   huidig (standaard)  iedereen ziet het huidige formulier
 *   test                het nieuwe formulier alleen met ?formulier=nieuw
 *   nieuw               iedereen ziet het nieuwe formulier
 * In de testomgeving (TESTOMGEVING=1) staat hij op nieuw, tenzij anders gezet.
 */
import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { and, eq, gte, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { candidates, employees, kandidaatMogelijkeMatch } from "@shared/schema";
import { landvelden, ALLE_LANDNAMEN } from "@shared/landen";
import { matchRedenen } from "@shared/kandidaatRegels";
import { plaatsBijPostcode } from "./geocode";

export type FormulierVersie = "huidig" | "test" | "nieuw";
export function formulierVersie(): FormulierVersie {
  const v = (process.env.AANMELDFORMULIER || "").trim();
  if (v === "huidig" || v === "test" || v === "nieuw") return v;
  return process.env.TESTOMGEVING === "1" ? "nieuw" : "huidig";
}

/** Sleutel van de exacte toestemmingstekst onder de groene knop. */
export const TOESTEMMING_VERSIE = "form3-2026-11";

export const FUNCTIES = {
  bediening: { functionType: "horecamedewerker", afwas: false, label: "Bediening en bar" },
  keuken: { functionType: "chef", afwas: false, label: "Keuken" },
  afwas: { functionType: "chef", afwas: true, label: "Afwas" },
  housekeeping: { functionType: "housekeeping", afwas: false, label: "Housekeeping" },
  frontoffice: { functionType: "frontoffice", afwas: false, label: "Front office" },
  logistiek: { functionType: "logistiek", afwas: false, label: "Logistiek" },
} as const;

export function normaalPostcode(pc: string): string | null {
  const s = String(pc || "").replace(/\s+/g, "").toUpperCase();
  return /^[1-9][0-9]{3}[A-Z]{2}$/.test(s) ? `${s.slice(0, 4)} ${s.slice(4)}` : null;
}
export function naarE164(landcode: string, nummer: string): string {
  let cijfers = String(nummer || "").replace(/[\s\-().]/g, "");
  if (cijfers.startsWith("+")) return cijfers;
  if (cijfers.startsWith("00")) cijfers = cijfers.slice(2);
  else if (cijfers.startsWith("0")) cijfers = cijfers.slice(1);
  const code = landcode === "+other" ? "+" : landcode;
  return `${code}${cijfers}`;
}
const geldigE164 = (s: string) => /^\+\d{7,15}$/.test(s);
function geldigeDatum(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !isNaN(d.getTime()) && d.getUTCDate() === Number(m[3]) && Number(m[1]) >= 1940 && d.getTime() <= Date.now();
}

const tekst = (max: number) => z.string().trim().max(max);
export const aanmeldSchema = z.object({
  sleutel: z.string().uuid(),
  functie: z.enum(["bediening", "keuken", "afwas", "housekeeping", "frontoffice", "logistiek"]),
  voornaam: tekst(60).min(1),
  achternaam: tekst(80).min(1),
  geboortedatum: z.string().refine(geldigeDatum, "Ongeldige geboortedatum"),
  nationaliteit: z.string().refine((n) => ALLE_LANDNAMEN.includes(n) && !/^-+$/.test(n), "Kies een nationaliteit"),
  postcode: tekst(10).optional().nullable(),
  woonland: z.string().optional().nullable(),
  landcode: tekst(8),
  mobiel: tekst(30).min(4),
  whatsappAnders: z.boolean().optional().default(false),
  whatsappLandcode: tekst(8).optional().nullable(),
  whatsappNummer: tekst(30).optional().nullable(),
  email: z.string().trim().max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  bronChip: tekst(40).optional().nullable(),
  bronAnders: tekst(100).optional().nullable(),
  kanaal: z.enum(["whatsapp", "web"]),
  taal: z.enum(["nl", "en"]),
  referralCode: tekst(100).optional().nullable(),
  bronUitLink: z.record(z.string().max(200)).optional().nullable(),
  herkomst: z.record(z.any()).optional().nullable(),
  website: z.string().optional().nullable(),
}).strip();

/** Controle op het formulier, ook los te testen. Geeft per veld een foutcode. */
export function controleer(b: z.infer<typeof aanmeldSchema>): Record<string, string> {
  const f: Record<string, string> = {};
  if (b.woonland) {
    if (!ALLE_LANDNAMEN.includes(b.woonland)) f.woonland = "Kies het land waar je nu woont";
  } else if (!normaalPostcode(b.postcode || "")) f.postcode = "Vul een geldige postcode in, bijvoorbeeld 1055 AB";
  if (!geldigE164(naarE164(b.landcode, b.mobiel))) f.mobiel = "Vul een geldig telefoonnummer in (minimaal 7 cijfers)";
  if (b.whatsappAnders) {
    const wa = naarE164(b.whatsappLandcode || b.landcode, b.whatsappNummer || "");
    if (!geldigE164(wa)) f.whatsappNummer = "Vul je WhatsApp-nummer in";
    else if (wa === naarE164(b.landcode, b.mobiel)) f.whatsappNummer = "Dit is hetzelfde nummer als je mobiele nummer";
  }
  return f;
}

const limiet = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Te veel aanmeldingen vanaf dit adres. Probeer het over een kwartier opnieuw." },
});

async function zoekMatches(id: number, p: { phone: string; whatsappNummer: string | null; email: string; firstName: string; lastName: string; birthDate: string }) {
  const telefoons = [p.phone, p.whatsappNummer].filter(Boolean) as string[];
  const kandidaten = await db.select({
    id: candidates.id, phone: candidates.phone, whatsappNummer: candidates.whatsappNummer, email: candidates.email,
    firstName: candidates.firstName, lastName: candidates.lastName, birthDate: candidates.birthDate,
  }).from(candidates).where(and(ne(candidates.id, id), or(
    inArray(candidates.phone, telefoons), inArray(candidates.whatsappNummer, telefoons),
    sql`lower(${candidates.email}) = ${p.email.toLowerCase()}`, eq(candidates.birthDate, p.birthDate),
  )));
  const medewerkers = await db.select({
    id: employees.id, phone: employees.phone, email: employees.email, firstName: employees.firstName, lastName: employees.lastName, birthDate: employees.birthDate,
  }).from(employees).where(or(inArray(employees.phone, telefoons), sql`lower(${employees.email}) = ${p.email.toLowerCase()}`, eq(employees.birthDate, p.birthDate)));
  const rijen: { soort: string; matchId: number; redenen: string[] }[] = [];
  for (const k of kandidaten) { const r = matchRedenen(p, k as any); if (r.length) rijen.push({ soort: "kandidaat", matchId: k.id, redenen: r }); }
  for (const m of medewerkers) { const r = matchRedenen(p, m as any); if (r.length) rijen.push({ soort: "medewerker", matchId: m.id, redenen: r }); }
  if (rijen.length) await db.insert(kandidaatMogelijkeMatch).values(rijen.map((r) => ({ candidateId: id, ...r })));
  return rijen.length;
}

async function meldPlanners(c: { id: number; firstName: string; lastName: string; functionType: string; city: string | null }) {
  const naam = `${c.firstName} ${c.lastName}`;
  try {
    const { getPushNotificationService } = await import("./push-notifications");
    const admins = (await storage.getUsers()).filter((u: any) => u.role === "admin").map((u: any) => u.id);
    const push = getPushNotificationService();
    if (push && admins.length) await push.sendNewCandidateAlert(admins, naam, c.functionType, c.id).catch(() => {});
    if (typeof (global as any).broadcastNotification === "function") {
      (global as any).broadcastNotification("new_candidate", { message: `Nieuwe aanmelding: ${naam}`, data: { candidateId: c.id, functionType: c.functionType, name: naam } }, undefined, "admin");
    }
  } catch (e: any) { console.warn("[Aanmelding] melding mislukt:", e?.message || e); }
  storage.createAdminNotification({
    type: "new_candidate", title: "Nieuwe aanmelding",
    message: `${naam} heeft zich aangemeld als ${c.functionType}${c.city ? ` (${c.city})` : ""}.`,
    link: "/dashboard?tab=kandidaten", candidateId: c.id,
  } as any).catch(() => {});
}

export function registerAanmeldingRoutes(app: Express) {
  app.get("/api/aanmeldformulier/versie", (_req: Request, res: Response) => {
    res.set("Cache-Control", "no-store");
    res.json({ versie: formulierVersie() });
  });

  app.get("/api/postcode", async (req: Request, res: Response) => {
    const pc = normaalPostcode(String(req.query.pc || ""));
    if (!pc) return res.json({ plaats: null });
    res.json({ plaats: await plaatsBijPostcode(pc) });
  });

  app.post("/api/aanmelding", limiet, async (req: Request, res: Response) => {
    if (formulierVersie() === "huidig") return res.status(404).json({ message: "Niet beschikbaar" });
    const p = aanmeldSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: "Controleer de velden.", velden: p.error.flatten().fieldErrors });
    const b = p.data;
    if (b.website) return res.status(400).json({ message: "Er ging iets mis. Probeer het opnieuw." });
    const fouten = controleer(b);
    if (Object.keys(fouten).length) return res.status(400).json({ message: "Controleer de velden.", velden: fouten });

    try {
      // Dubbel klikken of opnieuw versturen: hetzelfde antwoord, geen tweede dossier.
      const [al] = await db.select({ id: candidates.id }).from(candidates)
        .where(and(eq(candidates.aanmeldSleutel, b.sleutel), gte(candidates.createdAt, new Date(Date.now() - 24 * 3600 * 1000))));
      if (al) return res.json(await antwoord(al.id));

      const f = FUNCTIES[b.functie];
      const phone = naarE164(b.landcode, b.mobiel);
      const wa = b.whatsappAnders ? naarE164(b.whatsappLandcode || b.landcode, b.whatsappNummer || "") : null;
      const postcode = b.woonland ? null : normaalPostcode(b.postcode || "");
      const plaats = postcode ? await plaatsBijPostcode(postcode) : null;
      const land = landvelden(b.nationaliteit);
      const link = b.bronUitLink || {};
      const linkKanaal = link.utm_source ? link.utm_source.charAt(0).toUpperCase() + link.utm_source.slice(1).toLowerCase() : link.jid ? "Jobster" : "";
      const bron = linkKanaal || (b.bronChip ? (b.bronChip.startsWith("Anders") ? "Anders" : b.bronChip) : "");
      const nu = new Date();
      const bewaar = new Date(nu); bewaar.setFullYear(bewaar.getFullYear() + 2);
      const metWhatsapp = b.kanaal === "whatsapp";

      const [c] = await db.insert(candidates).values({
        firstName: b.voornaam, lastName: b.achternaam, email: b.email.toLowerCase(), phone, phoneOriginal: b.mobiel,
        birthDate: b.geboortedatum, nationality: land.nationality, nationalityIso: land.nationalityIso, nationalityZone: land.nationalityZone,
        city: plaats, functionType: f.functionType as any, canDoWashing: f.afwas, status: "in_behandeling",
        sourceChannel: bron ? `Website - ${bron}` : "Website - aanmeldformulier", referralCode: b.referralCode || null,
        retentionUntil: bewaar.toISOString().slice(0, 10), hasCv: false, needsTwv: false,
        whatsappOptInStatus: metWhatsapp ? "actief" : "opt_out", whatsappOptInChangedAt: nu,
        whatsappOptInReason: metWhatsapp ? "Toestemming via aanmeldformulier 3" : "Koos 'Liever door zonder WhatsApp'",
        aanmeldVersie: "3", functieEersteKeus: b.functie, postcode, woonland: b.woonland || null, whatsappNummer: wa,
        gesprekstaal: b.taal, aanmeldSleutel: b.sleutel,
        bronDetails: {
          ingang: link.vacature ? "vacature" : linkKanaal ? "link" : "formulier", chip: b.bronChip || null, anders: b.bronAnders || null,
          utm_source: link.utm_source || null, utm_medium: link.utm_medium || null, utm_campaign: link.utm_campaign || null,
          jid: link.jid || null, vacature: link.vacature || null, branche: link.branche || null, herkomst: b.herkomst || null,
        },
        whatsappToestemmingOp: metWhatsapp ? nu : null, whatsappToestemmingVersie: metWhatsapp ? TOESTEMMING_VERSIE : null,
      } as any).returning();

      await storage.createCandidateAuditLog({ candidateId: c.id, action: "created", changedByUserId: null, changeData: { description: "Kandidaat via aanmeldformulier 3" }, ipAddress: null } as any).catch(() => {});
      await zoekMatches(c.id, { phone, whatsappNummer: wa, email: b.email, firstName: b.voornaam, lastName: b.achternaam, birthDate: b.geboortedatum }).catch((e) => console.warn("[Aanmelding] dubbelcontrole mislukt:", e?.message));
      meldPlanners(c).catch(() => {});

      const job = await import("./job/jobService");
      if (job.jobAan()) {
        await job.startGesprek(c.id, { taal: b.taal, voorkeur: metWhatsapp ? "whatsapp" : "web", mail: true }).catch((e: any) => console.warn("[Aanmelding] Job starten mislukt:", e?.message || e));
      }
      res.json(await antwoord(c.id));
    } catch (e: any) {
      console.error("[Aanmelding] mislukt:", e?.message || e);
      // Alleen in de testomgeving: de technische oorzaak meesturen, zodat een test direct laat zien wat er mis is.
      res.status(500).json({ message: "Er ging iets mis. Probeer het opnieuw.", ...(process.env.TESTOMGEVING === "1" ? { oorzaak: String(e?.message || e).slice(0, 300) } : {}) });
    }
  });
}

/** Nooit een kandidaatnummer en nooit een melding dat het adres al bekend is. */
async function antwoord(id: number) {
  const job = await import("./job/jobService");
  const g = await job.gesprekVanKandidaat(id);
  return { ok: true, kanaal: g?.kanaal ?? null, jobLink: g ? job.gesprekPad(g.token) : null, waNummer: await (await import("./job/jobSjablonen")).jobNummer() };
}
