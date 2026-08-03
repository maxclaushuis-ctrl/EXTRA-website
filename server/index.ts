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
import { registerLlmsTxt } from "./llms";
import { scheduleSalesflowDailyJob, ensureSalesflowSchema } from "./salesflow";
import { ensureAuthResetSchema } from "./authReset";
import path from "path";
import fs from "fs";

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


// ── Healthcheck ───────────────────────────────────────────────────────────
// Bewust hier, vóór de sessie-middleware en vóór de CORS-poort: deze route
// raakt de database niet en heeft geen enkele afhankelijkheid die kan hangen.
// De promote-stap van een deploy heeft een goedkoop doelwit nodig; landt die
// check op de SPA-route, dan meet hij de hele render- en databaseketen mee en
// faalt hij op traagheid die niets met gezondheid te maken heeft.
app.get(['/healthz', '/api/healthz'], (_req, res) => {
  res.status(200).type('text/plain').send('ok');
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
//
// Waarom een expliciete melding en process.exit in plaats van een throw: een
// throw op moduleniveau levert in de deploy-logs een stacktrace op waarin de
// oorzaak ondersneeuwt, en Replit meldt dan alleen "built successfully but
// failed to start". Deploy-secrets staan bovendien los van workspace-secrets,
// dus dit is een reëel scenario. Beide ontbrekende namen worden in één keer
// genoemd, anders moet je twee keer publiceren om twee namen te vinden.
const ONTBREKENDE_SECRETS = ['SESSION_SECRET', 'UNSUBSCRIBE_SECRET'].filter(
  naam => !process.env[naam],
);
if (ONTBREKENDE_SECRETS.length > 0) {
  console.error(
    `[start] FATAAL: verplichte environment variable(s) niet ingesteld: ${ONTBREKENDE_SECRETS.join(', ')}. ` +
      `Zet ze in de secrets van de deployment (die staan los van de workspace-secrets) en publiceer opnieuw.`,
  );
  process.exit(1);
}
const SESSION_SECRET = process.env.SESSION_SECRET as string;

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
    const { db } = await import('./db');
    const { sql } = await import('drizzle-orm');
    const r: any = await db.execute(sql`SELECT email FROM users WHERE role = 'admin' AND status = 'active'`);
    const activeAdmins: any[] = r.rows ?? r ?? [];
    if (activeAdmins.length === 0) {
      console.warn('[admin-guard] WAARSCHUWING: geen actieve admin-accounts in de database. Maak er minstens één aan.');
      return;
    }
    log(`[admin-guard] ${activeAdmins.length} actieve admin-account(s) gevonden in database`);
    // Gedeelde admin uitfaseren: automatisch deactiveren zodra er minstens één
    // ander actief admin-account bestaat (lockout-bescherming). De rij blijft
    // bestaan voor de historie; verwijderen kan daarna via Admin-accounts.
    const anderen = activeAdmins.filter(a => String(a.email).toLowerCase() !== 'admin@extra.nl');
    if (anderen.length > 0) {
      const upd: any = await db.execute(sql`UPDATE users SET status = 'inactive' WHERE lower(email) = 'admin@extra.nl' AND status = 'active' RETURNING id`);
      if ((upd.rows ?? upd ?? []).length > 0) log(`[admin-guard] gedeeld account admin@extra.nl gedeactiveerd (${anderen.length} persoonlijke admin-accounts actief)`);
    }
  } catch (err) {
    console.error('[admin-guard] Fout bij controleren admin-accounts:', err);
  }
}

/**
 * Al het databasewerk dat bij het opstarten gebeurt: de admin-controle, de
 * herstelquery's en de idempotente schema-migraties.
 *
 * Waarom dit een aparte functie is en niet langer inline in de opstart-IIFE
 * staat: dit werk stond vóór server.listen(), zonder enige begrenzing. Een
 * `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` neemt in Postgres éérst een
 * ACCESS EXCLUSIVE lock op de tabel en kijkt pás daarna of er iets te wijzigen
 * valt — ook als de kolom er al is. Tijdens een deploy draait de oude versie
 * nog en die bevraagt whatsapp_conversations continu (de inbox pollt). De
 * nieuwe instantie kan daar onbeperkt op blijven wachten, waardoor de poort
 * nooit opengaat en de promote-stap afbreekt met "built successfully but
 * failed to start". Vandaar: eigen timeouts hieronder, en de aanroeper zet er
 * bovendien een harde tijdslimiet omheen.
 *
 * lock_timeout: wachten we langer dan 5 seconden op een lock, dan geven we op.
 * statement_timeout: een query die zelf langer dan 30 seconden duurt is hier
 * per definitie fout. Beide gelden alleen voor deze sessies, niet globaal.
 * Alle stappen zijn idempotent, dus een afgebroken poging is niet erg: de
 * volgende start doet hem gewoon opnieuw.
 */
async function opstartDatabasewerk() {
  try {
    await pool.query(`SET lock_timeout = '5s'`);
    await pool.query(`SET statement_timeout = '30s'`);
  } catch (err: any) {
    console.warn('[start] kon lock_timeout/statement_timeout niet zetten:', err?.message || err);
  }

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

  // Schema-migratie (WhatsApp Fase 2): snooze-kolom op whatsapp_conversations (veilig, idempotent)
  try {
    await pool.query(`ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS snoozed_until timestamp`);
  } catch (err: any) {
    console.error('[migration] Fout bij toevoegen snoozed_until-kolom:', err.message);
  }

  // Schema-migratie (WhatsApp Fase 3): AI-label + escalatiereden op
  // whatsapp_conversations. Puur additief — bestaande rijen houden NULL en
  // vallen daarmee in de status "open", precies zoals vóór deze migratie.
  try {
    await pool.query(`
      ALTER TABLE whatsapp_conversations
        ADD COLUMN IF NOT EXISTS ai_category text,
        ADD COLUMN IF NOT EXISTS ai_category_source text,
        ADD COLUMN IF NOT EXISTS escalation_reason text,
        ADD COLUMN IF NOT EXISTS escalated_at timestamp
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS wa_conv_escalated_idx
        ON whatsapp_conversations (escalated_at)
    `);
  } catch (err: any) {
    console.error('[migration] Fout bij toevoegen AI-label/escalatie-kolommen:', err.message);
  }

  // Schema-migratie (WhatsApp Fase 3B): takentabel. Nieuwe tabel, dus puur
  // additief — geen enkele bestaande rij wordt aangeraakt. De unieke index op
  // source_message_id is de dubbelslag-beveiliging: komt een webhook twee keer
  // binnen, dan blijft het bij één taak.
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_tasks (
        id serial PRIMARY KEY,
        conversation_id integer NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
        phone_number text NOT NULL,
        summary text NOT NULL,
        category text NOT NULL DEFAULT 'overig',
        assigned_to_id integer REFERENCES users(id) ON DELETE SET NULL,
        assigned_to_name text,
        status text NOT NULL DEFAULT 'open',
        source_message_id integer REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT NOW(),
        completed_at timestamp,
        completed_by_id integer REFERENCES users(id) ON DELETE SET NULL,
        completed_by_name text
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS wa_task_conv_idx ON whatsapp_tasks (conversation_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS wa_task_status_idx ON whatsapp_tasks (status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS wa_task_assigned_idx ON whatsapp_tasks (assigned_to_id)`);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS wa_task_source_msg_unique
        ON whatsapp_tasks (source_message_id)
    `);
  } catch (err: any) {
    console.error('[migration] Fout bij aanmaken whatsapp_tasks:', err.message);
  }

  // Schema-migratie (WhatsApp Fase 3D): herkomst van uitgaande berichten.
  // Puur additief: één nullable kolom erbij, geen bestaande rij wordt
  // aangeraakt en geen default die de tabel herschrijft. Alleen de echo's die
  // Meta terugstuurt (Coexistence — verstuurd vanaf de telefoon zelf) krijgen
  // hier 'app' in; alles wat er al staat blijft null.
  try {
    await pool.query(`ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS sent_source text`);
  } catch (err: any) {
    console.error('[migration] Fout bij toevoegen sent_source-kolom:', err.message);
  }
}

/** Hoe lang het opstarten maximaal op de database wacht voordat de poort opengaat. */
const OPSTART_DB_MAX_MS = 10_000;

(async () => {
  // Het databasewerk start hier, maar wordt bewust niet hier afgewacht — de
  // race staat vlak vóór server.listen(). Eigen .catch zodat een afwijzing
  // nooit als unhandled rejection het proces omlegt.
  const databasewerk = opstartDatabasewerk().catch(err => {
    console.error('[start] opstart-databasewerk mislukt (niet-kritiek, app start door):', err?.message || err);
  });

  // Registreer 301 redirects vóór alle andere routes
  // zodat old Wix URLs een echte HTTP 301 terugkrijgen.
  registerRedirects(app);

  // /llms.txt en /llms-full.txt voor AI-crawlers (llmstxt.org-conventie).
  // Vóór de static/catch-all-middleware zodat ze als text/plain geserveerd worden.
  registerLlmsTxt(app, () =>
    app.get("env") === "development"
      ? path.resolve(import.meta.dirname, "..", "dist", "public")
      : path.resolve(import.meta.dirname, "public")
  );

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

  // Poort: Autoscale geeft PORT mee en verwacht dat de app daarop luistert.
  // Stond die hardgecodeerd op 5000, dan luistert de app in een deploy op een
  // poort waar de healthcheck niet kijkt en faalt de promote-stap zonder dat
  // er iets mis is met de code. 5000 blijft de terugval voor de workspace,
  // want dat is daar de enige poort die niet gefirewalld is.
  const port = Number(process.env.PORT) || 5000;
  if (process.env.PORT) log(`[start] PORT uit de omgeving overgenomen: ${port}`);

  // ── Zelfherstellend opstarten ─────────────────────────────────────────────
  // Probleem in de praktijk: een oud (zombie-)serverproces blijft poort 5000
  // vasthouden → EADDRINUSE → de nieuwe code draait nooit. Oplossing: bij het
  // opstarten ruimen we andere serverprocessen op (via /proc, geen externe
  // tools nodig) en bij EADDRINUSE proberen we het na een korte pauze opnieuw.
  function ruimOudeServerprocessenOp(): number {
    let opgeruimd = 0;
    try {
      // Eigen proces-keten (onszelf, tsx, npm, sh) nooit killen.
      const eigenKeten = new Set<number>();
      let p: number = process.pid;
      for (let i = 0; i < 10 && p > 1; i++) {
        eigenKeten.add(p);
        try {
          const stat = fs.readFileSync(`/proc/${p}/stat`, "utf8");
          p = parseInt(stat.slice(stat.lastIndexOf(")") + 2).split(" ")[1], 10);
        } catch { break; }
      }
      for (const dir of fs.readdirSync("/proc")) {
        const pid = Number(dir);
        if (!pid || eigenKeten.has(pid)) continue;
        try {
          const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
          if (cmd.includes("server/index.ts") || cmd.includes("dist/index.js")) {
            process.kill(pid, "SIGKILL");
            opgeruimd++;
          }
        } catch { /* proces al weg of geen rechten */ }
      }
    } catch { /* /proc niet beschikbaar — dan gewoon doorstarten */ }
    if (opgeruimd > 0) log(`[start] ${opgeruimd} oud(e) serverproces(sen) opgeruimd (poort ${port} vrijgemaakt)`);
    return opgeruimd;
  }

  ruimOudeServerprocessenOp();

  // Schema-checks van salesflow en auth-reset horen bij hetzelfde opstartwerk
  // en vallen daarom onder dezelfde tijdslimiet hieronder.
  const restantDatabasewerk = Promise.all([
    ensureSalesflowSchema().catch(err => console.error("[salesflow] schema-check mislukt (niet-kritiek):", err?.message || err)),
    ensureAuthResetSchema().catch(err => console.error("[auth] schema-check mislukt (niet-kritiek):", err?.message || err)),
  ]);

  // ── De poort gaat hoe dan ook open ────────────────────────────────────────
  // Normaal is dit databasewerk in tientallen milliseconden klaar en verandert
  // er niets aan de volgorde: eerst migreren, dan luisteren. Loopt het vast op
  // een lock van de nog draaiende oude versie, dan wachten we hooguit
  // OPSTART_DB_MAX_MS en gaan we alsnog luisteren. Het werk loopt op de
  // achtergrond door en is idempotent, dus er gaat niets verloren; de
  // waarschuwing hieronder maakt in de deploy-logs zichtbaar dát het gebeurde.
  // Zonder deze grens is een blokkerende lock niet te onderscheiden van een
  // kapotte build, en meldt Replit alleen "built successfully but failed to
  // start".
  let databasewerkKlaar = false;
  const alleOpstartQueries = Promise.all([databasewerk, restantDatabasewerk])
    .then(() => { databasewerkKlaar = true; });
  await Promise.race([
    alleOpstartQueries,
    new Promise(resolve => setTimeout(resolve, OPSTART_DB_MAX_MS)),
  ]);
  if (!databasewerkKlaar) {
    console.warn(
      `[start] opstart-databasewerk nog niet klaar na ${OPSTART_DB_MAX_MS / 1000}s — ` +
        `de poort gaat nu open, de migraties lopen op de achtergrond door. ` +
        `Meestal betekent dit dat een ALTER TABLE wacht op een lock van de nog draaiende vorige versie.`,
    );
    alleOpstartQueries.then(() => log('[start] opstart-databasewerk alsnog afgerond'));
  }

  let listenPogingen = 0;
  server.on("error", (err: any) => {
    if (err?.code === "EADDRINUSE" && listenPogingen < 5) {
      listenPogingen++;
      log(`[start] poort ${port} nog bezet — oude processen opruimen en opnieuw proberen (poging ${listenPogingen}/5)…`);
      ruimOudeServerprocessenOp();
      setTimeout(() => server.listen({ port, host: "0.0.0.0", reusePort: true }), 1500);
      return;
    }
    console.error(`[start] FATAAL: server kon niet op poort ${port} luisteren:`, err?.message || err);
    throw err;
  });

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);

    scheduleDailyCvReminders();
    scheduleBlogAutoPublish();
    scheduleFlowEngine();
    scheduleSalesflowDailyJob();
    // Eenmalige backfill van rejection_reason voor bestaande afgewezen kandidaten (idempotent)
    backfillRejectionReasons().catch(err => console.warn('Backfill rejection_reason mislukt (niet-kritiek):', err?.message || err));
    // WhatsApp Fase 1: 360dialog Cloud API met DB-persistentie. Zie server/whatsapp/README.md.
    // Eenmalige opruiming van placeholder-conversaties die zijn aangemaakt door de
    // (inmiddels uitgeschakelde) auto-sync van sollicitanten/medewerkers naar de
    // WhatsApp-inbox. Idempotent: verwijdert alleen rijen waar nog géén echt bericht
    // voor is verstuurd of ontvangen.
    cleanupPlaceholderConversations().catch(err => console.warn('Cleanup placeholder-conversaties mislukt (niet-kritiek):', err?.message || err));
    // Eenmalige backfill: kandidaten in WhatsApp-inbox die nog niet 'aangenomen' zijn
    // moeten in het Kandidaten-tabblad staan ('unmatched'), niet in Medewerkers
    // ('candidate'). Idempotent en respecteert handmatige overrides via manual_category.
    backfillKandidaatInboxCategory().catch(err => console.warn('Backfill kandidaat-inbox-category mislukt (niet-kritiek):', err?.message || err));
  });
})().catch(err => {
  // Zonder deze catch is elke afwijzing in het opstartpad een unhandled
  // rejection: Node stopt dan met een kale stacktrace en de deploy-log toont
  // alleen "built successfully but failed to start". Eén herkenbare regel met
  // de werkelijke oorzaak scheelt een halve avond zoeken.
  console.error('[start] FATAAL bij het opstarten:', err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});

async function backfillKandidaatInboxCategory() {
  const sql = `
    UPDATE whatsapp_conversations wc
    SET match_category = 'unmatched', updated_at = NOW()
    FROM candidates c
    WHERE c.id = wc.candidate_id
      AND wc.manual_category IS NULL
      AND wc.match_category = 'candidate'
      AND c.status <> 'aangenomen'
    RETURNING wc.id
  `;
  try {
    const { pool } = await import('./db');
    const r: any = await pool.query(sql);
    if (r?.rowCount && r.rowCount > 0) {
      log(`[WA backfill] ${r.rowCount} gesprek(ken) verplaatst van Medewerkers naar Kandidaten-tab`);
    }
  } catch (err: any) {
    console.warn('backfillKandidaatInboxCategory SQL-fout:', err?.message || err);
  }
}

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
