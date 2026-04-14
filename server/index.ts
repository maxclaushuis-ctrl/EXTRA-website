import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
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
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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


// CORS headers toevoegen om cross-domain problemen te voorkomen
const ALLOWED_ORIGINS = [
  'https://www.doehetextra.nl',
  'https://doehetextra.nl',
  process.env.BASE_URL,
].filter(Boolean) as string[];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production';
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Voeg sessie middleware toe (PostgreSQL store zodat autoscale werkt)
app.use(session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'extra-rewards-fallback-only-for-dev',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'extra.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 uur
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
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

// Vaste admin-accounts die altijd aanwezig moeten zijn.
// Wachtwoorden zijn bcrypt-hashes — nooit als plaintext opslaan.
const REQUIRED_ADMINS = [
  { email: 'admin@extra.nl',            firstName: 'Admin',     lastName: 'EXTRAATJE',     password: '$2b$10$ZtjnweBSZOPnSgCHevw7/OZTpOAko4RaeAA8nN8L/.NyfO0VvEFd6' },
  { email: 'charlotte@doehetextra.nl',  firstName: 'Charlotte', lastName: '',              password: '$2b$12$XW1Dc.n6YebI/hKMbNWHiO8uXXo7JybIl4z6q5WM7mRgJW8CKIfw6' },
  { email: 'eveline@doehetextra.nl',    firstName: 'Eveline',   lastName: '',              password: '$2b$12$Qi.e2LUmhKppqhQ1XMAxreefN4tlA.6R7BhvufV9tbHlp7dxs/IUi' },
  { email: 'lea@doehetextra.nl',        firstName: 'Lea',       lastName: '',              password: '$2b$12$sBP9rhd28Vop79JuhgVE8en3bmSKPWy5I2.OqXS7cWUnXAI3B1Yr.' },
  { email: 'max@doehetextra.nl',        firstName: 'Max',       lastName: '',              password: '$2b$12$sBP9rhd28Vop79JuhgVE8en3bmSKPWy5I2.OqXS7cWUnXAI3B1Yr.' },
];

async function ensureAdminAccounts() {
  try {
    for (const admin of REQUIRED_ADMINS) {
      const { rows } = await pool.query('SELECT id, role, status FROM users WHERE email = $1', [admin.email]);
      if (rows.length === 0) {
        // Account bestaat niet — aanmaken
        await pool.query(
          `INSERT INTO users (email, password, first_name, last_name, role, status, points, monthly_points)
           VALUES ($1, $2, $3, $4, 'admin', 'active', 0, 0)`,
          [admin.email, admin.password, admin.firstName, admin.lastName]
        );
        log(`[admin-guard] Admin-account aangemaakt: ${admin.email}`);
      } else {
        const existing = rows[0];
        // Account bestaat maar is mogelijk gedegradeerd of gedeactiveerd — herstellen
        if (existing.role !== 'admin' || existing.status !== 'active') {
          await pool.query(
            `UPDATE users SET role = 'admin', status = 'active' WHERE email = $1`,
            [admin.email]
          );
          log(`[admin-guard] Admin-account hersteld (rol/status): ${admin.email}`);
        }
      }
    }
  } catch (err) {
    console.error('[admin-guard] Fout bij herstellen admin-accounts:', err);
  }
}

(async () => {
  // Zorg dat alle admin-accounts altijd bestaan (ook na DB-reset of nieuw deployment)
  await ensureAdminAccounts();

  // Hercontrole elke 10 minuten — ook als accounts tussentijds worden verwijderd
  setInterval(() => ensureAdminAccounts(), 10 * 60 * 1000);

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

  // Registreer 301 redirects vóór alle andere routes
  // zodat old Wix URLs een echte HTTP 301 terugkrijgen.
  registerRedirects(app);

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
    // WhatsApp wordt beheerd via externe VPS (geconfigureerd via WHATSAPP_API_URL secret)
  });
})();

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
