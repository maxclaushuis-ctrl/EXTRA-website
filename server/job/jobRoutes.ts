/**
 * Routes van Job, de AI-recruiter.
 *
 * Openbaar, alleen met de persoonlijke sleutel (token) uit de link:
 *   GET  /api/job/:token                 het gesprek (berichten, status, afspraak)
 *   POST /api/job/:token/bericht         een bericht van de kandidaat
 *   POST /api/job/:token/cv              het cv (pdf, doc, docx, jpg of png, max. 10 MB)
 *   GET  /api/job/:token/momenten        vrije momenten voor de kennismaking
 *   POST /api/job/:token/boek            een moment kiezen (ook verzetten)
 *   POST /api/job/:token/stop            afmelden: geen herinneringen meer
 *   GET  /api/job/:token/agenda.ics      de afspraak voor in de agenda
 *
 * Voor het dashboard (admin):
 *   GET  /api/admin/job/status           schakelaars en wat er klaarstaat
 *   GET  /api/admin/job/overzicht        alle gesprekken met status
 *   GET  /api/admin/job/kandidaat/:id    het gesprek bij een kandidaat
 *   POST /api/admin/job/start/:id        Job met de hand starten (testomgeving of JOB_ENABLED)
 *   GET  /api/admin/job/zonder-gesprek   kandidaten zonder gesprek (voor de simulator)
 *   GET  /api/admin/job/interviewers     werktijden
 *   PUT  /api/admin/job/interviewers     werktijden bewaren (nooit verwijderen; uitzetten kan)
 *   GET  /api/admin/job/afspraken        geplande kennismakingen vanaf vandaag
 *   POST /api/admin/job/herinneringen    herinneringen nu draaien; in de testomgeving met een klok vooruit
 */
import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { uploadCvFile } from "../objectStorageFiles";
import { storage } from "../storage";
import { agendaBestand, amsterdam, dagTekst, type Interviewer } from "@shared/jobPlanning";
import { teksten, type JobTaal } from "@shared/jobRegels";
import * as job from "./jobService";

type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;

const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  message: { message: "Even rustig aan. Probeer het over een paar minuten opnieuw." },
  standardHeaders: true,
  legacyHeaders: false,
});

const CV_TYPES = ["pdf", "doc", "docx", "jpg", "png"];
const cvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single("cv");

async function bestandstype(buffer: Buffer): Promise<{ ext: string; mime: string } | null> {
  try {
    const { fileTypeFromBuffer } = await import("file-type");
    const d = await fileTypeFromBuffer(buffer);
    if (d && CV_TYPES.includes(d.ext)) return { ext: d.ext, mime: d.mime };
    // Oude .doc-bestanden herkent file-type als 'cfb'.
    if (d && d.ext === "cfb") return { ext: "doc", mime: "application/msword" };
    return null;
  } catch {
    return null;
  }
}

function geldigTijdstip(s: unknown): s is string {
  return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

async function gesprekVoorKandidaat(req: Request, res: Response) {
  const g = await job.gesprekVanToken(String(req.params.token || ""));
  if (!g) {
    res.status(404).json({ message: "Deze link werkt niet (meer). Bel ons gerust op 085 130 59 15." });
    return null;
  }
  return g;
}

/**
 * Elke async route krijgt een vangnet: een fout geeft een nette 500 in plaats
 * van een onafgehandelde fout die de hele server kan laten stoppen. In de
 * testomgeving gaat de technische oorzaak mee in het antwoord.
 */
function veilig(fn: any) {
  if (typeof fn !== "function" || fn.length > 3) return fn;
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((e: any) => {
      console.error(`[Job] ${req.method} ${req.path} mislukt:`, e?.message || e);
      if (res.headersSent) return;
      res.status(500).json({ message: "Er ging iets mis. Probeer het opnieuw.", ...(process.env.TESTOMGEVING === "1" ? { oorzaak: String(e?.message || e).slice(0, 300) } : {}) });
    });
  };
}

export function registerJobRoutes(express: Express, adminMiddleware: Middleware) {
  const app = {
    get: (pad: string, ...h: any[]) => express.get(pad, ...h.map(veilig)),
    post: (pad: string, ...h: any[]) => express.post(pad, ...h.map(veilig)),
    put: (pad: string, ...h: any[]) => express.put(pad, ...h.map(veilig)),
    delete: (pad: string, ...h: any[]) => express.delete(pad, ...h.map(veilig)),
  };
  // ─── Openbaar, met token ──────────────────────────────────────────────────

  app.get("/api/job/:token", chatLimiter, async (req: Request, res: Response) => {
    const g = await gesprekVoorKandidaat(req, res);
    if (!g) return;
    const berichten = await job.berichtenVan(g.id);
    const a = await job.actieveAfspraak(g.candidateId);
    const [c] = await Promise.all([storage.getCandidate(g.candidateId)]);
    const taal = (g.taal === "en" ? "en" : "nl") as JobTaal;
    res.json({
      voornaam: c?.firstName || "",
      taal,
      status: g.status,
      kanaal: g.kanaal,
      heeftCv: !!c?.hasCv,
      berichten: berichten.map((b) => ({ id: b.id, richting: b.richting, tekst: b.tekst, keuzes: b.keuzes, extra: b.extra, tijd: b.aangemaaktAt })),
      afspraak: a ? { datum: a.datum, tijd: a.tijd, interviewer: a.interviewer, dagTekst: dagTekst(String(a.datum), taal) } : null,
    });
  });

  app.post("/api/job/:token/bericht", chatLimiter, async (req: Request, res: Response) => {
    const g = await gesprekVoorKandidaat(req, res);
    if (!g) return;
    const tekst = typeof req.body?.tekst === "string" ? req.body.tekst.trim().slice(0, 2000) : "";
    if (!tekst) return res.status(400).json({ message: "Leeg bericht" });
    try {
      const r = await job.verwerkBericht(g, { tekst, kanaal: "web" });
      res.json(r);
    } catch (e: any) {
      console.error("[Job] bericht verwerken mislukt:", e?.message || e);
      res.status(500).json({ message: "Er ging iets mis. Probeer het opnieuw." });
    }
  });

  app.post("/api/job/:token/cv", chatLimiter, (req: Request, res: Response, next: NextFunction) => {
    cvUpload(req, res, (err: any) => {
      if (err) return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Het bestand is groter dan 10 MB." : "Upload mislukt." });
      next();
    });
  }, async (req: Request, res: Response) => {
    const g = await gesprekVoorKandidaat(req, res);
    if (!g) return;
    const file = (req as any).file as { buffer: Buffer; originalname: string } | undefined;
    if (!file) return res.status(400).json({ message: "Geen bestand ontvangen." });
    const type = await bestandstype(file.buffer);
    if (!type) return res.status(400).json({ message: "Dit bestandstype kunnen we niet openen. Kies een pdf, Word-bestand of foto." });
    try {
      const pad = await uploadCvFile(file.buffer, type.mime, file.originalname || `cv.${type.ext}`);
      await storage.updateCandidate(g.candidateId, { hasCv: true, cvFilename: pad } as any);
      storage.createAdminNotification({
        type: "cv_uploaded", title: "CV ontvangen", message: "Cv ontvangen via het gesprek met Job.",
        link: "/dashboard?tab=kandidaten", candidateId: g.candidateId,
      } as any).catch(() => {});
      const r = await job.cvOntvangen(g.candidateId, pad, "web");
      res.json(r || { ok: true, status: g.status, berichten: [] });
    } catch (e: any) {
      console.error("[Job] cv opslaan mislukt:", e?.message || e);
      res.status(500).json({ message: "Opslaan mislukt. Probeer het opnieuw.", ...(process.env.TESTOMGEVING === "1" ? { oorzaak: String(e?.message || e).slice(0, 300) } : {}) });
    }
  });

  app.get("/api/job/:token/momenten", chatLimiter, async (req: Request, res: Response) => {
    const g = await gesprekVoorKandidaat(req, res);
    if (!g) return;
    if (g.status !== "plannen" && g.status !== "gepland") return res.json({ momenten: [] });
    const taal = (g.taal === "en" ? "en" : "nl") as JobTaal;
    const m = await job.momenten();
    // De kandidaat ziet tijden, niet wie er vrij is (bord D).
    res.json({ momenten: m.map((x) => ({ datum: x.datum, tijd: x.tijd, dagTekst: dagTekst(x.datum, taal) })) });
  });

  app.post("/api/job/:token/boek", chatLimiter, async (req: Request, res: Response) => {
    const g = await gesprekVoorKandidaat(req, res);
    if (!g) return;
    const datum = String(req.body?.datum || "");
    const tijd = req.body?.tijd;
    if (!geldigTijdstip(tijd)) return res.status(400).json({ message: "Ongeldig moment" });
    const r = await job.boek(g, { datum, tijd });
    if (!r.ok) {
      const taal = (g.taal === "en" ? "en" : "nl") as JobTaal;
      const melding = r.reden === "bezet"
        ? (taal === "en" ? "Someone just booked this moment. Please choose another one." : "Dit moment is net door iemand anders gekozen. Kies een ander moment.")
        : (taal === "en" ? "This moment can't be booked right now." : "Dit moment kan nu niet worden geboekt.");
      return res.status(409).json({ reden: r.reden, message: melding });
    }
    res.json(r);
  });

  app.post("/api/job/:token/stop", chatLimiter, async (req: Request, res: Response) => {
    const g = await gesprekVoorKandidaat(req, res);
    if (!g) return;
    await job.stopGesprek(g.candidateId);
    const taal = (g.taal === "en" ? "en" : "nl") as JobTaal;
    res.json({ ok: true, message: teksten(taal).gestopt });
  });

  app.get("/api/job/:token/agenda.ics", chatLimiter, async (req: Request, res: Response) => {
    const g = await gesprekVoorKandidaat(req, res);
    if (!g) return;
    const a = await job.actieveAfspraak(g.candidateId);
    if (!a) return res.status(404).send("Geen afspraak");
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="kennismaking-extra.ics"');
    res.send(agendaBestand({ datum: String(a.datum), tijd: a.tijd, interviewer: a.interviewer, uid: `job-${a.id}` }));
  });

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  app.get("/api/admin/job/status", adminMiddleware, async (_req: Request, res: Response) => {
    res.json(await job.jobStatus());
  });

  // WhatsApp-sjablonen van Job bij Meta: status en indienen (jobSjablonen.ts)
  app.get("/api/admin/job/sjablonen", adminMiddleware, async (req: Request, res: Response) => {
    const sj = await import("./jobSjablonen");
    const stand = await sj.standBijMeta(req.query.vers === "1");
    const rijen = sj.SJABLOON_DEFS.map((d) => {
      const t = stand.lijst.find((x) => x.naam === sj.NAMEN[d.soort] && x.taal === d.taal);
      return { naam: sj.NAMEN[d.soort], taal: d.taal, tekst: d.tekst, knoppen: d.knoppen || [], status: t?.status || null, reden: t?.reden || null };
    });
    // In de testomgeving het adres van de testomgeving zelf (zie job.basisUrl), anders BASE_URL.
    const basis = job.basisUrl();
    res.json({
      metaActief: sj.metaActief(), fout: stand.ok ? null : stand.fout, rijen, nummer: await sj.jobNummer(),
      webhook: `${basis}/api/whatsapp/meta-webhook`, verifyToken: !!process.env.META_WA_BOT_VERIFY_TOKEN, appSecret: !!process.env.META_WA_BOT_APP_SECRET,
    });
  });
  app.post("/api/admin/job/sjablonen/indienen", adminMiddleware, async (_req: Request, res: Response) => {
    const sj = await import("./jobSjablonen");
    res.json(await sj.dienIn());
  });

  app.get("/api/admin/job/overzicht", adminMiddleware, async (_req: Request, res: Response) => {
    res.json(await job.overzicht());
  });

  app.get("/api/admin/job/kandidaat/:id", adminMiddleware, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Ongeldig id" });
    const g = await job.gesprekVanKandidaat(id);
    if (!g) return res.json({ gesprek: null, magStarten: job.magHandmatigStarten() });
    const berichten = await job.berichtenVan(g.id);
    const a = await job.actieveAfspraak(id);
    res.json({
      gesprek: { id: g.id, status: g.status, kanaal: g.kanaal, taal: g.taal, velden: g.velden, twijfels: g.twijfels, gestartAt: g.gestartAt, laatsteActiviteitAt: g.laatsteActiviteitAt, link: job.gesprekLink(g.token) },
      berichten,
      afspraak: a,
      magStarten: job.magHandmatigStarten(),
    });
  });

  app.post("/api/admin/job/start/:id", adminMiddleware, async (req: Request, res: Response) => {
    if (!job.magHandmatigStarten()) return res.status(403).json({ message: "Job staat uit. Zet JOB_ENABLED aan, of gebruik de testomgeving." });
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Ongeldig id" });
    const voorkeur = req.body?.kanaal === "whatsapp" ? "whatsapp" : "web";
    const g = await job.startGesprek(id, { voorkeur, mail: req.body?.mail !== false });
    if (!g) return res.status(404).json({ message: "Kandidaat niet gevonden" });
    res.json({ ok: true, kanaal: g.kanaal, link: job.gesprekLink(g.token) });
  });

  app.get("/api/admin/job/zonder-gesprek", adminMiddleware, async (_req: Request, res: Response) => {
    if (!job.magHandmatigStarten()) return res.json({ kandidaten: [] });
    res.json({ kandidaten: await job.kandidatenZonderGesprek() });
  });

  app.get("/api/admin/job/interviewers", adminMiddleware, async (_req: Request, res: Response) => {
    res.json({ interviewers: await job.interviewers() });
  });

  app.put("/api/admin/job/interviewers", adminMiddleware, async (req: Request, res: Response) => {
    const lijst = Array.isArray(req.body?.interviewers) ? req.body.interviewers : null;
    if (!lijst) return res.status(400).json({ message: "Geen lijst" });
    const schoon: Interviewer[] = [];
    for (const i of lijst) {
      const naam = typeof i?.naam === "string" ? i.naam.trim() : "";
      const dagen = Array.isArray(i?.dagen) ? i.dagen.map(Number).filter((d: number) => d >= 1 && d <= 7) : [];
      if (!naam || !geldigTijdstip(i?.van) || !geldigTijdstip(i?.tot) || i.van >= i.tot) {
        return res.status(400).json({ message: `Controleer de tijden van ${naam || "een interviewer"}.` });
      }
      const pauzeVan = geldigTijdstip(i?.pauzeVan) ? i.pauzeVan : null;
      const pauzeTot = geldigTijdstip(i?.pauzeTot) ? i.pauzeTot : null;
      schoon.push({ naam, dagen, van: i.van, tot: i.tot, pauzeVan: pauzeVan && pauzeTot ? pauzeVan : null, pauzeTot: pauzeVan && pauzeTot ? pauzeTot : null, actief: i?.actief !== false });
    }
    await job.bewaarInterviewers(schoon);
    res.json({ interviewers: await job.interviewers() });
  });

  app.get("/api/admin/job/afspraken", adminMiddleware, async (req: Request, res: Response) => {
    const vanaf = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.vanaf || "")) ? String(req.query.vanaf) : amsterdam(new Date()).datum;
    res.json({ afspraken: await job.afsprakenVanaf(vanaf) });
  });

  app.post("/api/admin/job/herinneringen", adminMiddleware, async (req: Request, res: Response) => {
    let nu = new Date();
    const uren = Number(req.body?.klokVooruitUren || 0);
    if (uren) {
      if (!job.testomgeving()) return res.status(403).json({ message: "De klok vooruitzetten kan alleen in de testomgeving." });
      nu = new Date(nu.getTime() + Math.min(Math.max(uren, 0), 24 * 30) * 60 * 60 * 1000);
    }
    res.json({ nu: nu.toISOString(), ...(await job.herinneringenRun(nu)) });
  });
}
