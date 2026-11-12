/**
 * Pitchdeck-tracker. Geregistreerd vanuit server/routes.ts.
 *
 *   POST /api/pitchdeck/open            de deck meldt zich bij het openen
 *   POST /api/pitchdeck/ping            kijktijd en verste slide (ook via sendBeacon)
 *   GET  /api/admin/pitchdecks          dashboard: links en openingen
 *   POST /api/admin/pitchdecks/links    dashboard: nieuwe link voor een ontvanger
 *   PATCH /api/admin/pitchdecks/links/:id  dashboard: link uit- of aanzetten
 *   POST /api/admin/pitchdecks/openingen/weghalen     eigen controles weghalen uit de cijfers
 *   POST /api/admin/pitchdecks/openingen/terugzetten  een weggehaalde opening weer laten meetellen
 *
 * Weghalen wist niets: de opening krijgt weggehaald_op en weggehaald_door en telt
 * daarna niet meer mee. Het dashboard vraagt twee bevestigingen; de tweede gaat mee
 * als eigenControle: true en zonder die gebeurt er niets.
 *
 * Openingen door een ingelogde admin of iemand met een @doehetextra.nl-account
 * tellen niet mee. Er wordt geen IP-adres opgeslagen. Links worden nooit
 * verwijderd, alleen uitgezet. Zie shared/pitchdecks.ts voor de logica.
 */
import type { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { randomBytes } from "crypto";
import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { pitchdeckLinks, pitchdeckOpeningen } from "@shared/schema";
import { AFZENDER } from "@shared/aanvraagMails";
import {
  PITCHDECKS, apparaatVan, isCode, isDeck, leesAantalSlides, leesIds, leesPing, magWeghalen, moetMailen, pitchdeckGeopendMail,
} from "@shared/pitchdecks";

type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;

/** Wie de melding krijgt als een deck wordt geopend. */
const MELDING_AAN = "max@doehetextra.nl";
const DASHBOARD_URL = "https://www.doehetextra.nl/dashboard?tab=pitchdecks";

const trackerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Te veel verzoeken." },
});

/** Ingelogd als admin of met een EXTRA-account: niet meetellen. */
async function isEigenTeam(req: Request): Promise<boolean> {
  const s: any = req.session;
  if (!s?.userId) return false;
  if (s.userRole === "admin") return true;
  try {
    const user = await storage.getUser(s.userId);
    return !!user?.email && user.email.toLowerCase().endsWith("@doehetextra.nl");
  } catch {
    return false;
  }
}

function nieuweCode(): string {
  const tekens = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => tekens[b % tekens.length]).join("");
}

export function registerPitchdeckTracker(app: Express, adminMiddleware: Middleware): void {
  app.post("/api/pitchdeck/open", trackerLimiter, async (req: Request, res: Response) => {
    try {
      const { deck, k, slides } = req.body || {};
      if (!isDeck(deck)) return res.status(400).json({ message: "Onbekende presentatie" });
      if (await isEigenTeam(req)) return res.json({ id: null, eigenTeam: true });

      const [link] = isCode(k)
        ? await db.select().from(pitchdeckLinks).where(and(eq(pitchdeckLinks.code, k), eq(pitchdeckLinks.deck, deck), eq(pitchdeckLinks.actief, true)))
        : [];

      // Weggehaalde openingen (eigen controles) tellen ook hier niet mee.
      const zelfde = and(
        link ? eq(pitchdeckOpeningen.linkId, link.id) : and(isNull(pitchdeckOpeningen.linkId), eq(pitchdeckOpeningen.deck, deck)),
        isNull(pitchdeckOpeningen.weggehaaldOp),
      );
      const [vorige] = await db.select({ op: pitchdeckOpeningen.geopendOp }).from(pitchdeckOpeningen)
        .where(zelfde).orderBy(desc(pitchdeckOpeningen.geopendOp)).limit(1);

      const sleutel = randomBytes(16).toString("hex");
      const apparaat = apparaatVan(req.get("user-agent"));
      const [rij] = await db.insert(pitchdeckOpeningen).values({
        deck, linkId: link?.id ?? null, sleutel, apparaat, aantalSlides: leesAantalSlides(slides),
      }).returning({ id: pitchdeckOpeningen.id, geopendOp: pitchdeckOpeningen.geopendOp });

      if (moetMailen(vorige?.op ?? null)) {
        const [{ keer }] = await db.select({ keer: sql<number>`count(*)::int` }).from(pitchdeckOpeningen).where(zelfde);
        const mail = pitchdeckGeopendMail({
          deck, ontvanger: link?.ontvanger ?? null, bedrijf: link?.bedrijf ?? null, apparaat,
          geopendOp: rij.geopendOp ?? new Date(), keer,
        }, DASHBOARD_URL);
        import("./mail")
          .then(({ sendEmail }) => sendEmail({ to: MELDING_AAN, from: AFZENDER, subject: mail.subject, html: mail.html, text: mail.text }))
          .catch((err) => console.error("[pitchdeck] melding versturen mislukt:", err?.message || err));
      }
      return res.json({ id: rij.id, sleutel });
    } catch (err) {
      console.error("[pitchdeck] opening vastleggen mislukt:", err);
      return res.status(500).json({ message: "Niet gelukt" });
    }
  });

  app.post("/api/pitchdeck/ping", trackerLimiter, async (req: Request, res: Response) => {
    const p = leesPing(req.body);
    if (!p) return res.status(400).end();
    try {
      await db.update(pitchdeckOpeningen).set({
        kijktijdSec: sql`greatest(${pitchdeckOpeningen.kijktijdSec}, ${p.sec})`,
        maxSlide: sql`greatest(${pitchdeckOpeningen.maxSlide}, ${p.slide})`,
        laatstGezien: new Date(),
      }).where(and(eq(pitchdeckOpeningen.id, p.id), eq(pitchdeckOpeningen.sleutel, p.sleutel)));
      return res.status(204).end();
    } catch (err) {
      console.error("[pitchdeck] ping mislukt:", err);
      return res.status(500).end();
    }
  });

  app.get("/api/admin/pitchdecks", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const links = await db.select().from(pitchdeckLinks).orderBy(desc(pitchdeckLinks.aangemaaktOp));
      const openingen = await db.select({
        id: pitchdeckOpeningen.id, deck: pitchdeckOpeningen.deck, linkId: pitchdeckOpeningen.linkId,
        apparaat: pitchdeckOpeningen.apparaat, aantalSlides: pitchdeckOpeningen.aantalSlides,
        maxSlide: pitchdeckOpeningen.maxSlide, kijktijdSec: pitchdeckOpeningen.kijktijdSec,
        geopendOp: pitchdeckOpeningen.geopendOp,
        weggehaaldOp: pitchdeckOpeningen.weggehaaldOp, weggehaaldDoor: pitchdeckOpeningen.weggehaaldDoor,
      }).from(pitchdeckOpeningen).orderBy(desc(pitchdeckOpeningen.geopendOp)).limit(500);
      return res.json({ decks: PITCHDECKS, links, openingen });
    } catch (err) {
      console.error("[pitchdeck] overzicht mislukt:", err);
      return res.status(500).json({ message: "Overzicht laden mislukt" });
    }
  });

  app.post("/api/admin/pitchdecks/links", adminMiddleware, async (req: Request, res: Response) => {
    const deck = req.body?.deck;
    const ontvanger = String(req.body?.ontvanger ?? "").trim().slice(0, 120);
    const bedrijf = String(req.body?.bedrijf ?? "").trim().slice(0, 120) || null;
    if (!isDeck(deck)) return res.status(400).json({ message: "Kies een presentatie" });
    if (!ontvanger) return res.status(400).json({ message: "Vul de naam van de ontvanger in" });
    try {
      for (let poging = 0; poging < 5; poging++) {
        const code = nieuweCode();
        const [bestaat] = await db.select({ id: pitchdeckLinks.id }).from(pitchdeckLinks).where(eq(pitchdeckLinks.code, code));
        if (bestaat) continue;
        const [rij] = await db.insert(pitchdeckLinks).values({
          deck, code, ontvanger, bedrijf, aangemaaktDoor: (req.session as any)?.userId ?? null,
        }).returning();
        return res.status(201).json(rij);
      }
      return res.status(500).json({ message: "Geen vrije code gevonden, probeer het opnieuw" });
    } catch (err) {
      console.error("[pitchdeck] link maken mislukt:", err);
      return res.status(500).json({ message: "Link maken mislukt" });
    }
  });

  app.patch("/api/admin/pitchdecks/links/:id", adminMiddleware, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || typeof req.body?.actief !== "boolean") return res.status(400).json({ message: "Ongeldig verzoek" });
    try {
      const [rij] = await db.update(pitchdeckLinks).set({ actief: req.body.actief }).where(eq(pitchdeckLinks.id, id)).returning();
      if (!rij) return res.status(404).json({ message: "Link niet gevonden" });
      return res.json(rij);
    } catch (err) {
      console.error("[pitchdeck] link bijwerken mislukt:", err);
      return res.status(500).json({ message: "Bijwerken mislukt" });
    }
  });

  app.post("/api/admin/pitchdecks/openingen/weghalen", adminMiddleware, async (req: Request, res: Response) => {
    const ids = leesIds(req.body?.ids);
    if (!ids) return res.status(400).json({ message: "Kies één of meer openingen" });
    if (!magWeghalen(req.body)) return res.status(400).json({ message: "Bevestig eerst dat het eigen controles waren" });
    try {
      const door = await wieIsHet(req);
      const rijen = await db.update(pitchdeckOpeningen).set({ weggehaaldOp: new Date(), weggehaaldDoor: door })
        .where(and(inArray(pitchdeckOpeningen.id, ids), isNull(pitchdeckOpeningen.weggehaaldOp)))
        .returning({ id: pitchdeckOpeningen.id });
      console.log(`[pitchdeck] ${rijen.length} opening(en) weggehaald door ${door}`);
      return res.json({ weggehaald: rijen.length });
    } catch (err) {
      console.error("[pitchdeck] weghalen mislukt:", err);
      return res.status(500).json({ message: "Weghalen mislukt" });
    }
  });

  app.post("/api/admin/pitchdecks/openingen/terugzetten", adminMiddleware, async (req: Request, res: Response) => {
    const ids = leesIds(req.body?.ids);
    if (!ids) return res.status(400).json({ message: "Kies één of meer openingen" });
    try {
      const rijen = await db.update(pitchdeckOpeningen).set({ weggehaaldOp: null, weggehaaldDoor: null })
        .where(and(inArray(pitchdeckOpeningen.id, ids), isNotNull(pitchdeckOpeningen.weggehaaldOp)))
        .returning({ id: pitchdeckOpeningen.id });
      return res.json({ teruggezet: rijen.length });
    } catch (err) {
      console.error("[pitchdeck] terugzetten mislukt:", err);
      return res.status(500).json({ message: "Terugzetten mislukt" });
    }
  });
}

/** De naam van wie weghaalt, voor de markering. Alleen de naam, geen e-mailadres. */
async function wieIsHet(req: Request): Promise<string> {
  const s: any = req.session;
  try {
    const u: any = s?.userId ? await storage.getUser(s.userId) : null;
    const naam = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || u?.username || u?.name;
    return String(naam || "Admin").slice(0, 80);
  } catch {
    return "Admin";
  }
}
