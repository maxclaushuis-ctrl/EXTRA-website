import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerRoutes, pingGoogleSitemap } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { pool } from "./db";
import { sendCvReminderEmail } from "./mail";
import { registerRedirects } from "./redirects";

const PgStore = connectPg(session);


// Declareer type voor session gegevens
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// Declareer type voor de globale WebSocket notificatie functie
declare global {
  var sendNotification: (notification: {
    type: string;
    userId?: number;
    userRole?: string;
    message: string;
    data?: any;
  }) => void;
}

const app = express();
app.set('trust proxy', 1);

// Helmet voegt automatisch beveiligingsheaders toe (X-Frame-Options, X-Content-Type-Options,
// Strict-Transport-Security, Referrer-Policy, etc.). CSP en CORP zijn uitgeschakeld om
// de frontend (Vite assets, embedded previews) niet te breken — die vereisen een eigen
// doorgesproken policy als ze later geactiveerd worden.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression({ level: 6, threshold: 1024 }));
// Blok 3: bewaar de exacte raw request body voor SendGrid webhook signature-verificatie.
// We hangen de buffer aan req.rawBody zodat alleen de webhook-handler hem nodig heeft;
// alle andere routes blijven werken met req.body.
app.use(express.json({
  limit: '50mb',
  verify: (req: any, _res, buf) => {
    if (buf && buf.length) req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Cache-control headers for immutable hashed assets (Vite build output)
app.use((req, res, next) => {
  const url = req.path;
  if (/\/assets\/.*\.(js|css|webp|png|jpg|jpeg|svg|woff2?|ttf|ico)(\?.*)?$/.test(url)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (/\.(webp|png|jpg|jpeg|svg|gif)$/.test(url)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
});


// Strikte CORS — alleen origins op de allowlist krijgen credentialed CORS-headers,
// ongeacht NODE_ENV. Server-to-server calls (zonder Origin header) en same-origin
// requests worden doorgelaten zonder CORS-headers. Onbekende cross-origin requests
// worden hard geweigerd met 403.
const ALLOWED_ORIGINS = [
  'https://www.doehetextra.nl',
  'https://doehetextra.nl',
  process.env.BASE_URL,
].filter(Boolean) as string[];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Geen Origin header: server-to-server, curl, mobile app, etc. — toegestaan zonder CORS-headers
  if (!origin) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    return next();
  }

  // Same-origin (browser stuurt Origin maar het komt overeen met Host) — toegestaan, geen CORS nodig
  const sameOrigin = origin === `${req.protocol}://${req.headers.host}`;

  // Bekende cross-origin op allowlist — vol-CORS met credentials
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return next();
  }

  // Same-origin: geen CORS-headers (browser vereist ze niet voor same-origin)
  if (sameOrigin) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    return next();
  }

  // Onbekende cross-origin — geweigerd
  console.warn(`[CORS] Geweigerde origin: ${origin} → ${req.method} ${req.path}`);
  return res.status(403).json({ message: 'Origin not allowed' });
});

// Verplichte secrets — geen fallback toegestaan, zelfs niet in development.
// De app weigert te starten als één van deze ontbreekt om sessie-vervalsing en
// onbetrouwbare HMAC-tokens (unsubscribe-links) te voorkomen.
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is niet ingesteld. Stel deze in voordat de app start.');
}
if (!process.env.UNSUBSCRIBE_SECRET) {
  throw new Error('UNSUBSCRIBE_SECRET environment variable is not set');
}
const SESSION_SECRET = process.env.SESSION_SECRET;

// Voeg sessie middleware toe (PostgreSQL store zodat autoscale werkt)
app.use(session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'extra.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dagen — handig voor iPad-snelkoppelingen waar je dagelijks intakes afneemt
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  }
}));

// Maskeer WhatsApp-webhook secret in request-logs.
// Pad: /api/whatsapp/webhook/<secret> → /api/whatsapp/webhook/***
function maskSecretsInPath(p: string): string {
  return p.replace(/^(\/api\/whatsapp\/webhook)\/[^/]+/, '$1/***');
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = maskSecretsInPath(req.path);
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Verifieer dat er minstens één actief admin-account bestaat in de database.
// Admin-accounts worden volledig in de database beheerd (geen hardcoded lijst).
async function ensureAdminAccounts() {
  try {
    const users = await storage.getUsers();
    const activeAdmins = users.filter(u => u.role === 'admin' && u.status === 'active');
    if (activeAdmins.length === 0) {
      console.warn('[admin-guard] WAARSCHUWING: geen actieve admin-accounts in de database. Maak er minstens één aan.');
    } else {
      log(`[admin-guard] ${activeAdmins.length} actieve admin-account(s) gevonden in database`);
    }
  } catch (err) {
    console.error('[admin-guard] Fout bij controleren admin-accounts:', err);
  }
}

(async () => {
  // Verifieer bij start dat er minimaal één actief admin-account in de database staat
  await ensureAdminAccounts();

  // Herstel: zet is_internal_interview = true voor alle handmatig via TWV aangemaakte kandidaten
  // zodat ze niet in het Kandidaten-overzicht verschijnen
  try {
    const result = await pool.query(
      `UPDATE candidates SET is_internal_interview = true
       WHERE source_channel = 'handmatig' AND needs_twv = true AND (is_internal_interview IS NULL OR is_internal_interview = false)`
    );
    if (result.rowCount && result.rowCount > 0) {
      log(`[twv-fix] ${result.rowCount} handmatige TWV-kandidaten uit Kandidaten-overzicht gefilterd`);
    }
  } catch (err) {
    console.error('[twv-fix] Fout bij TWV kandidaten herstel:', err);
  }

  // Schema-migratie: voeg 'gepland' toe aan candidate_status enum (veilig, idempotent)
  try {
    await pool.query(`ALTER TYPE candidate_status ADD VALUE IF NOT EXISTS 'gepland' AFTER 'in_behandeling'`);
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.error('[migration] Fout bij toevoegen gepland-status:', err.message);
    }
  }

  // Registreer 301 redirects vóór alle andere routes
  // zodat old Wix URLs een echte HTTP 301 terugkrijgen.
  registerRedirects(app);

  // Interne admin/mockup-pagina's uitsluiten van zoekmachines
  const NOINDEX_PATHS = new Set([
    '/dashboard-mockup',
    '/employee-app',
    '/employee-app-v1',
  ]);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const p = req.path.toLowerCase().replace(/\/$/, '') || '/';
    if (NOINDEX_PATHS.has(p)) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);

    scheduleDailyCvReminders();
    scheduleBlogAutoPublish();
    scheduleFlowEngine();
    // Eenmalige backfill van rejection_reason voor bestaande afgewezen kandidaten (idempotent)
    backfillRejectionReasons().catch(err => console.warn('Backfill rejection_reason mislukt (niet-kritiek):', err?.message || err));
    // WhatsApp Fase 1: 360dialog Cloud API met DB-persistentie. Zie server/whatsapp/README.md.
    // Eenmalige opruiming van placeholder-conversaties die zijn aangemaakt door de
    // (inmiddels uitgeschakelde) auto-sync van sollicitanten/medewerkers naar de
    // WhatsApp-inbox. Idempotent: verwijdert alleen rijen waar nog géén echt bericht
    // voor is verstuurd of ontvangen.
    cleanupPlaceholderConversations().catch(err => console.warn('Cleanup placeholder-conversaties mislukt (niet-kritiek):', err?.message || err));
  });
})();

async function cleanupPlaceholderConversations() {
  const sql = `
    DELETE FROM whatsapp_conversations c
    WHERE c.last_message_preview IN ('[Sollicitant — nog geen bericht]', '[Medewerker — nog geen bericht]')
      AND NOT EXISTS (
        SELECT 1 FROM whatsapp_messages m
        WHERE m.from_number = c.phone_number OR m.to_number = c.phone_number
      )
    RETURNING phone_number, display_name
  `;
  const r: any = await pool.query(sql);
  if (r?.rowCount && r.rowCount > 0) {
    console.log(`[WA cleanup] ${r.rowCount} placeholder-conversatie(s) verwijderd:`,
      r.rows.map((x: any) => `${x.display_name || '?'} (${x.phone_number})`).join(', '));
  }
}

async function backfillRejectionReasons() {
  // Haalt voor elke afgewezen kandidaat zonder rejection_reason de meest recente
  // audit-log entry op met "Afgewezen: ..." in change_data.description en bewaart die
  // tekst (gestript) in candidates.rejection_reason. Idempotent: vult alleen NULLs.
  const sql = `
    WITH src AS (
      SELECT
        c.id AS candidate_id,
        (
          SELECT regexp_replace(l.change_data::jsonb->>'description', '^Afgewezen:\\s*', '')
          FROM candidate_audit_log l
          WHERE l.candidate_id = c.id
            AND l.change_data::jsonb ? 'description'
            AND l.change_data::jsonb->>'description' LIKE 'Afgewezen:%'
          ORDER BY l.created_at DESC
          LIMIT 1
        ) AS reason
      FROM candidates c
      WHERE c.status = 'afgewezen' AND c.rejection_reason IS NULL
    )
    UPDATE candidates c
       SET rejection_reason = src.reason
      FROM src
     WHERE c.id = src.candidate_id
       AND src.reason IS NOT NULL
       AND length(src.reason) > 0
       AND src.reason <> 'onbekend';
  `;
  try {
    const { pool } = await import('./db');
    const result: any = await pool.query(sql);
    if (result?.rowCount && result.rowCount > 0) {
      log(`Backfill rejection_reason: ${result.rowCount} kandidaten bijgewerkt`);
    }
  } catch (err: any) {
    // Log maar laat de app niet crashen
    console.warn('backfillRejectionReasons SQL-fout:', err?.message || err);
  }
}

function scheduleDailyCvReminders() {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Reminder schema: max 3 reminders
  // Reminder 1: 1 day after registration
  // Reminder 2: 3 days after reminder 1
  // Reminder 3: 7 days after reminder 2
  const REMINDER_INTERVALS = [1, 3, 7];

  async function runDailyCvReminders() {
    try {
      const result = await storage.getCandidates({ status: 'in_behandeling', page: 1, limit: 500 });
      const now = new Date();
      for (const candidate of result.candidates) {
        if (candidate.hasCv || !candidate.email) continue;

        const reminderCount = candidate.cvReminderCount ?? 0;
        if (reminderCount >= 3) continue;

        const lastReminder = candidate.cvReminderSentAt ? new Date(candidate.cvReminderSentAt) : null;
        const created = new Date(candidate.createdAt);

        let shouldSend = false;

        if (reminderCount === 0) {
          // First reminder: 1 day after registration
          const daysSinceCreated = (now.getTime() - created.getTime()) / MS_PER_DAY;
          shouldSend = daysSinceCreated >= REMINDER_INTERVALS[0];
        } else if (lastReminder) {
          // Subsequent reminders: based on interval since last reminder
          const daysSinceLastReminder = (now.getTime() - lastReminder.getTime()) / MS_PER_DAY;
          shouldSend = daysSinceLastReminder >= REMINDER_INTERVALS[reminderCount];
        }

        if (shouldSend) {
          // Zorg dat kandidaat een cvUploadToken heeft voor de directe upload link
          let cvUploadToken = (candidate as any).cvUploadToken;
          if (!cvUploadToken) {
            const { randomUUID } = await import('crypto');
            cvUploadToken = randomUUID();
            await storage.updateCandidate(candidate.id, { cvUploadToken } as any);
          }
          await sendCvReminderEmail({ firstName: candidate.firstName, email: candidate.email, id: candidate.id, cvUploadToken, baseUrl: process.env.BASE_URL || 'https://www.doehetextra.nl' });
          await storage.updateCandidate(candidate.id, {
            cvReminderSentAt: now,
            cvReminderCount: reminderCount + 1,
          });
          log(`Cv-reminder ${reminderCount + 1}/3 verstuurd naar ${candidate.email}`);
        }
      }
    } catch (err) {
      console.error("Fout bij dagelijkse cv-reminders:", err);
    }
  }

  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(9, 0, 0, 0);
  if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
  const msUntilFirst = nextRun.getTime() - now.getTime();

  log(`Volgende cv-reminder check gepland om ${nextRun.toLocaleString('nl-NL')} (over ${Math.round(msUntilFirst / 60000)} minuten)`);

  setTimeout(() => {
    runDailyCvReminders();
    setInterval(runDailyCvReminders, MS_PER_DAY);
  }, msUntilFirst);
}

function scheduleBlogAutoPublish() {
  const MS_PER_HOUR = 60 * 60 * 1000;

  async function runPublishCheck() {
    try {
      const published = await storage.publishScheduledBlogPosts();
      if (published > 0) {
        log(`Blog auto-publish: ${published} artikel(en) gepubliceerd`);
        pingGoogleSitemap();
      }
    } catch (err) {
      console.error("Fout bij blog auto-publish:", err);
    }
  }

  runPublishCheck();
  setInterval(runPublishCheck, MS_PER_HOUR);
  log("Blog auto-publish scheduler actief (elk uur)");
}

function scheduleFlowEngine() {
  const MS_PER_5MIN = 5 * 60 * 1000;

  async function runCheck() {
    // Check geplande campagnes
    try {
      const { checkGeplandeCampagnes } = await import('./campaignScheduler');
      await checkGeplandeCampagnes();
    } catch (err) {
      console.error("[CampaignScheduler] Fout:", err);
    }
    // Flow stappen verwerken
    try {
      const { runFlowScheduler } = await import('./flowEngine');
      await runFlowScheduler();
    } catch (err) {
      console.error("[FlowEngine] Scheduler fout:", err);
    }
    // Check A/B winners
    try {
      const { checkABWinners } = await import('./abEngine');
      await checkABWinners();
    } catch (err) {
      console.error("[ABEngine] Scheduler fout:", err);
    }
    // Log scheduler run
    try {
      const { logScheduler } = await import('./schedulerUtils');
      await logScheduler('scheduler_run', null, 'Cyclus voltooid');
    } catch (_) {}
  }

  // Init instellingen bij start
  import('./schedulerUtils').then(({ initInstellingen }) => {
    initInstellingen().catch(console.error);
  });

  // Start na 15 seconden, daarna elke 5 minuten
  setTimeout(() => {
    runCheck();
    setInterval(runCheck, MS_PER_5MIN);
  }, 15_000);

  log("Flow + A/B scheduler actief (elke 5 minuten)");
}
