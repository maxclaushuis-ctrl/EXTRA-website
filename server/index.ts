import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerRoutes, pingGoogleSitemap } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { sendCvReminderEmail } from "./mail";

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

// Serve uploaded files (candidate photos, etc.)
app.use('/uploads', express.static('uploads'));

// CORS headers toevoegen om cross-domain problemen te voorkomen
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-ws-auth');
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
  secret: 'extra-rewards-secret',
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

(async () => {
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
  });
})();

function scheduleDailyCvReminders() {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  async function runDailyCvReminders() {
    try {
      const result = await storage.getCandidates({ status: 'in_behandeling', page: 1, limit: 500 });
      const now = new Date();
      for (const candidate of result.candidates) {
        if (candidate.hasCv || !candidate.email) continue;
        const created = new Date(candidate.createdAt);
        const daysSinceCreated = (now.getTime() - created.getTime()) / MS_PER_DAY;
        if (daysSinceCreated < 1) continue;

        const lastReminder = candidate.cvReminderSentAt ? new Date(candidate.cvReminderSentAt) : null;
        const daysSinceReminder = lastReminder ? (now.getTime() - lastReminder.getTime()) / MS_PER_DAY : Infinity;

        if (daysSinceReminder >= 1) {
          await sendCvReminderEmail({ firstName: candidate.firstName, email: candidate.email, id: candidate.id });
          await storage.updateCandidate(candidate.id, { cvReminderSentAt: now });
          log(`Cv-reminder verstuurd naar ${candidate.email}`);
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
