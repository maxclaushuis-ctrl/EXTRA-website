/**
 * Routes voor de Google-reviews. Geregistreerd vanuit server/routes.ts.
 *
 *   GET   /api/reviews                         publiek: score, aantal, medewerkerreviews
 *   GET   /api/admin/google/status             dashboard: stand van de koppeling
 *   GET   /api/admin/google/koppelen           dashboard: naar de toestemmingspagina van Google
 *   GET   /api/admin/google/callback           Google stuurt hier terug na toestemming
 *   POST  /api/admin/google/sync               dashboard: nu ophalen
 *   POST  /api/admin/google/ontkoppelen        dashboard: token leegmaken
 *   GET   /api/admin/google/reviews            dashboard: alle opgehaalde reviews
 *   PATCH /api/admin/google/reviews/:id        dashboard: categorie zetten
 *
 * De redirect-URI moet exact zo in Google Cloud staan. Het dashboard toont hem.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { desc, sql } from "drizzle-orm";
import { db } from "./db";
import { googleReviews } from "@shared/schema";
import { isCategorie, toestemmingsUrl } from "@shared/googleReviews";
import {
  gbpGeconfigureerd, ruilCodeOm, bewaarKoppeling, ontkoppel, synchroniseerGoogleReviews,
  koppelingStatus, publiekeReviews, wisPubliekeCache,
} from "./googleBusiness";

declare module "express-session" {
  interface SessionData {
    gbpState?: string;
  }
}

type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;

/** https://<host>/api/admin/google/callback — achter de proxy van Replit altijd https. */
export function redirectUri(req: Request): string {
  return `https://${req.get("host")}/api/admin/google/callback`;
}

export function registerGoogleReviewRoutes(app: Express, adminMiddleware: Middleware): void {
  app.get("/api/reviews", async (_req: Request, res: Response) => {
    try {
      res.set("Cache-Control", "public, max-age=300");
      return res.json(await publiekeReviews());
    } catch (error) {
      console.error("[google-reviews] publieke reviews:", error);
      return res.status(500).json({ message: "Reviews tijdelijk niet beschikbaar" });
    }
  });

  app.get("/api/admin/google/status", adminMiddleware, async (req: Request, res: Response) => {
    return res.json({ ...(await koppelingStatus()), redirectUri: redirectUri(req) });
  });

  app.get("/api/admin/google/koppelen", adminMiddleware, (req: Request, res: Response) => {
    if (!gbpGeconfigureerd()) {
      return res.status(400).send("GBP_CLIENT_ID en GBP_CLIENT_SECRET staan nog niet in de Secrets van Replit.");
    }
    const state = randomBytes(24).toString("hex");
    req.session.gbpState = state;
    req.session.save(() => res.redirect(toestemmingsUrl(process.env.GBP_CLIENT_ID as string, redirectUri(req), state)));
  });

  app.get("/api/admin/google/callback", adminMiddleware, async (req: Request, res: Response) => {
    const terug = (uitkomst: string) => res.redirect(`/dashboard?google=${encodeURIComponent(uitkomst)}`);
    try {
      const { code, state, error } = req.query as Record<string, string | undefined>;
      const verwacht = req.session.gbpState;
      req.session.gbpState = undefined;
      if (error) return terug("geweigerd");
      if (!code || !state || !verwacht || state !== verwacht) return terug("ongeldig");
      const refreshToken = await ruilCodeOm(code, redirectUri(req));
      await bewaarKoppeling(refreshToken, req.session.userId);
      try {
        await synchroniseerGoogleReviews();
      } catch (err: any) {
        console.error("[google-reviews] eerste ophaalronde mislukt:", err?.message || err);
        return terug("gekoppeld-met-fout");
      }
      return terug("gekoppeld");
    } catch (err: any) {
      console.error("[google-reviews] koppelen mislukt:", err?.message || err);
      return terug("mislukt");
    }
  });

  app.post("/api/admin/google/sync", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      return res.json(await synchroniseerGoogleReviews());
    } catch (err: any) {
      return res.status(502).json({ message: String(err?.message || err) });
    }
  });

  app.post("/api/admin/google/ontkoppelen", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      await ontkoppel();
      wisPubliekeCache();
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ message: String(err?.message || err) });
    }
  });

  app.get("/api/admin/google/reviews", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const rijen = await db.select().from(googleReviews).orderBy(desc(googleReviews.geplaatstOp));
      return res.json(rijen);
    } catch (err: any) {
      return res.status(500).json({ message: String(err?.message || err) });
    }
  });

  app.patch("/api/admin/google/reviews/:id", adminMiddleware, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const categorie = req.body?.categorie;
    if (!Number.isInteger(id) || !isCategorie(categorie)) {
      return res.status(400).json({ message: "Ongeldige review of categorie" });
    }
    try {
      const [rij] = await db.update(googleReviews).set({ categorie }).where(sql`${googleReviews.id} = ${id}`).returning();
      if (!rij) return res.status(404).json({ message: "Review niet gevonden" });
      wisPubliekeCache();
      return res.json(rij);
    } catch (err: any) {
      return res.status(500).json({ message: String(err?.message || err) });
    }
  });
}
