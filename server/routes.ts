import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { isGa4Configured, fetchGa4Overview, fetchGa4Trend, fetchGa4Sources, fetchGa4TopPages, fetchGa4Devices } from "./ga4";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { storage } from "./storage";
import { createHash, randomUUID } from "crypto";
import { 
  insertApplicantSchema, 
  insertUserSchema, 
  userFormSchema,
  insertRewardSchema,
  insertPointTransactionSchema,
  insertRedemptionSchema,
  insertRuleSchema,
  insertSettingsSchema,
  insertEmailTemplateSchema,
  insertCampaignSchema,
  insertBlogPostSchema,
  insertDiscountSchema,
  insertChallengeSchema,
  insertMarketingTemplateSchema,
  insertMarketingCampaignSchema,
  insertMarketingCampaignRecipientSchema,
  insertMarketingCampaignClickSchema,
  // Sollicitanten schema imports
  insertCandidateSchema,
  insertSalaryScaleSchema,
  insertCandidateAuditLogSchema,
  insertCandidateImportSchema,
  pushSubscriptions,
} from "@shared/schema";
import { z, ZodError } from "zod";
import { awardBirthdayPoints, BIRTHDAY_POINTS, POINTS_TO_EURO_RATIO } from "./birthday";
import { initMailService, sendCandidateConfirmationEmail, sendAdminCandidateNotificationEmail, sendAdminCandidateNoCvEmail, sendCalendlyInviteEmail, sendApplicationRejectionEmail, sendCvUploadFirstEmail, sendCandidateRejectionEmailDiensten, sendCandidateRejectionEmailCv, sendTwvExpiryReminderEmail, sendAdminWelcomeEmail } from "./mail";
import { initPlanningAPI, getPlanningAPI } from "./planning-api";
import { initChallengeSyncService, getChallengeSyncService } from "./challenge-sync";
import { initPushNotificationService, getPushNotificationService, NotificationTemplates } from "./push-notifications";
import { WebSocketServer, WebSocket } from 'ws';
import { db } from "./db";
import { users, candidates as candidatesTable, applications } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { checkInactiveUsers, updateUserActivity, getInactivityWarningUsers, InactivityReport } from "./inactivity-management";
import { getSupabaseAdmin, extractCvStoragePath, downloadCvBuffer } from './supabase';

async function uploadCvToSupabase(buffer: Buffer, mimetype: string, originalName: string): Promise<string> {
  const ext = path.extname(originalName);
  const filename = `cv-${Date.now()}${ext}`;
  const client = getSupabaseAdmin();

  // Zorg dat de bucket bestaat; maak hem aan als dat niet het geval is
  const { data: buckets } = await client.storage.listBuckets();
  const bucketExists = buckets?.some((b: { name: string }) => b.name === 'cvs');
  if (!bucketExists) {
    const { error: bucketErr } = await client.storage.createBucket('cvs', { public: false });
    if (bucketErr && !bucketErr.message.includes('already exists')) {
      throw new Error(`Supabase bucket aanmaken mislukt: ${bucketErr.message}`);
    }
  }

  const { error } = await client.storage.from('cvs').upload(filename, buffer, {
    contentType: mimetype,
    upsert: false,
  });
  if (error) throw new Error(`Supabase upload fout: ${error.message}`);

  // Sla het pad op als interne referentie (niet de publieke URL, die afhankelijk is van bucket-policy)
  // We genereren signed URLs on-the-fly bij het downloaden
  const { data } = client.storage.from('cvs').getPublicUrl(filename);
  return data.publicUrl;
}
import { calculateRoleBasedPoints, awardWorkSessionPoints, getEmployeeTypeRules, updateEmployeeType, WorkSession } from "./role-based-points";
import rateLimit from "express-rate-limit";

// ─── Jaicob.ai webhook helper ─────────────────────────────────────────────────
async function sendJaicobWebhook(candidate: {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  functionType?: string;
  experience?: string | null;
  dutchLevel?: string | null;
  englishLevel?: string | null;
  sourceChannel?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const webhookUrl = process.env.JAICOB_WEBHOOK_URL;
    const apiKey = process.env.JAICOB_API_KEY;
    if (!webhookUrl) {
      console.warn('[Jaicob] JAICOB_WEBHOOK_URL niet geconfigureerd, webhook overgeslagen');
      return { success: false, error: 'JAICOB_WEBHOOK_URL ontbreekt' };
    }
    const body = JSON.stringify({
      event: 'candidate.created',
      timestamp: new Date().toISOString(),
      source: 'EXTRA Horecapersoneel',
      data: {
        id: String(candidate.id),
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email ?? null,
        phone: candidate.phone ?? null,
        city: candidate.city ?? null,
        birthDate: candidate.birthDate ?? null,
        nationality: candidate.nationality ?? null,
        function: candidate.functionType ?? null,
        experience: candidate.experience ?? null,
        dutchLevel: candidate.dutchLevel ?? null,
        englishLevel: candidate.englishLevel ?? null,
        sourceChannel: candidate.sourceChannel ?? null,
      },
    });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[Jaicob] Antwoordde ${response.status}: ${text}`);
      return { success: false, error: `Jaicob: HTTP ${response.status}` };
    }
    console.log(`[Jaicob] Kandidaat #${candidate.id} (${candidate.firstName} ${candidate.lastName}) doorgestuurd naar Jaicob.ai`);
    return { success: true };
  } catch (err: any) {
    console.error('[Jaicob] Fout bij versturen naar Jaicob.ai:', err?.message ?? err);
    return { success: false, error: err?.message ?? 'Netwerkfout' };
  }
}

// ─── EXTRA Planbord webhook helper ────────────────────────────────────────────
const PLANBORD_WEBHOOK_URL = process.env.PLANBORD_WEBHOOK_URL || '';

async function sendPlanbordWebhook(candidate: { id: number; firstName: string; lastName: string; functionType: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.warn('[Webhook] WEBHOOK_SECRET niet geconfigureerd, webhook overgeslagen');
      return { success: false, error: 'WEBHOOK_SECRET ontbreekt' };
    }
    const body = JSON.stringify({
      event: 'applicant.ready',
      timestamp: new Date().toISOString(),
      data: {
        id: String(candidate.id),
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        function: candidate.functionType,
      },
    });
    const response = await fetch(PLANBORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[Webhook] Planbord antwoordde ${response.status}: ${text}`);
      return { success: false, error: `Planbord: HTTP ${response.status}` };
    }
    console.log(`[Webhook] Kandidaat #${candidate.id} (${candidate.firstName} ${candidate.lastName}) doorgestuurd naar Planbord`);
    return { success: true };
  } catch (err: any) {
    console.error('[Webhook] Fout bij versturen naar Planbord:', err?.message ?? err);
    return { success: false, error: err?.message ?? 'Netwerkfout' };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skip: (req: Request) => {
    // @doehetextra.nl e-mailadressen mogen onbeperkt testen
    const email = (req.body?.email || '').toLowerCase();
    return email.endsWith('@doehetextra.nl');
  },
  message: { message: "Te veel aanmeldingen vanaf dit IP-adres. Probeer het over 15 minuten opnieuw." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple cookie parser function
function parseCookies(cookieString?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;
  
  cookieString.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length === 2) {
      cookies[parts[0]] = decodeURIComponent(parts[1]);
    }
  });
  
  return cookies;
}

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Niet ingelogd" });
}

// Admin middleware
async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  return res.status(403).json({ message: "Geen toegang" });
}

// Plan de dagelijkse verjaardagscontrole (standaard elke dag om 00:05)
let birthdayCheckTimer: NodeJS.Timeout | null = null;

/**
 * Haalt het ingestelde tijdstip voor de dagelijkse verjaardagscontrole
 * uit de instellingen of gebruikt de standaardwaarde
 */
async function getBirthdayCheckTime(): Promise<{ hour: number, minute: number }> {
  try {
    const setting = await storage.getSetting('birthday_check_time');
    
    if (setting && setting.value) {
      // Formaat moet "uur:minuut" zijn, bijv. "00:05" of "09:00"
      const parts = setting.value.split(':');
      
      if (parts.length === 2) {
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);
        
        if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
          return { hour, minute };
        }
      }
    }
    
    // Standaard: 00:05 (middernacht + 5 minuten)
    return { hour: 0, minute: 5 };
  } catch (error) {
    console.error('Fout bij ophalen verjaardagscontrole tijdstip:', error);
    return { hour: 0, minute: 5 };
  }
}

/**
 * Haalt het geplande tijdstip voor het verzenden van verjaardagsmails
 * uit de instellingen of gebruikt de standaardwaarde
 */
async function getBirthdayEmailTime(): Promise<{ hour: number, minute: number }> {
  try {
    const setting = await storage.getSetting('birthday_email_time');
    
    if (setting && setting.value) {
      // Formaat moet "uur:minuut" zijn, bijv. "09:00" of "10:30"
      const parts = setting.value.split(':');
      
      if (parts.length === 2) {
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);
        
        if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
          return { hour, minute };
        }
      }
    }
    
    // Standaard: 09:00 (9 uur 's ochtends)
    return { hour: 9, minute: 0 };
  } catch (error) {
    console.error('Fout bij ophalen verjaardagsmail tijdstip:', error);
    return { hour: 9, minute: 0 };
  }
}

/**
 * Plant de dagelijkse verjaardagscontrole voor punten en e-mails
 */
async function scheduleBirthdayCheck() {
  // Verwijder bestaande timer als die bestaat
  if (birthdayCheckTimer) {
    clearTimeout(birthdayCheckTimer);
  }
  
  // Haal de tijd voor de verjaardagscontrole op
  const { hour, minute } = await getBirthdayCheckTime();
  
  // Bereken tijd tot de volgende controle
  const now = new Date();
  const nextCheckTime = new Date(now);
  
  // Reset naar het ingestelde tijdstip
  nextCheckTime.setHours(hour, minute, 0, 0);
  
  // Als het tijdstip al voorbij is, plan dan voor morgen
  if (now >= nextCheckTime) {
    nextCheckTime.setDate(nextCheckTime.getDate() + 1);
  }
  
  // Bereken milliseconden tot de volgende controle
  const timeUntilNextCheck = nextCheckTime.getTime() - now.getTime();
  
  // Haal ook het tijdstip op waarop e-mails verzonden moeten worden
  const emailTime = await getBirthdayEmailTime();
  
  console.log(`Volgende verjaardagscontrole gepland om ${nextCheckTime.toLocaleString()} (over ${Math.round(timeUntilNextCheck / 1000 / 60)} minuten)`);
  console.log(`Verjaardags e-mails worden verzonden rond ${emailTime.hour}:${emailTime.minute.toString().padStart(2, '0')}`);
  
  // Plan de verjaardagscontrole
  birthdayCheckTimer = setTimeout(async () => {
    try {
      console.log("Dagelijkse verjaardagscontrole wordt uitgevoerd...");
      const usersAwarded = await awardBirthdayPoints();
      console.log(`Verjaardagscontrole voltooid. ${usersAwarded} gebruikers hebben punten ontvangen.`);
    } catch (error) {
      console.error("Fout tijdens verjaardagscontrole:", error);
    } finally {
      // Plan de volgende controle
      scheduleBirthdayCheck();
    }
  }, timeUntilNextCheck);
}

async function pingGoogleSitemap() {
  const sitemapUrl = 'https://www.doehetextra.nl/sitemap.xml';
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    console.log(`Google sitemap ping: ${res.status}`);
  } catch (err) {
    console.warn('Google sitemap ping mislukt:', err);
  }
}

export { pingGoogleSitemap };

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize mail service
  const mailServiceInitialized = initMailService();
  console.log(`Mail service geïnitialiseerd: ${mailServiceInitialized ? 'Ja' : 'Nee'}`);
  
  // Initialize push notification service
  const pushService = initPushNotificationService();
  console.log('Push notification service geïnitialiseerd');

  // Load persisted push subscriptions from DB into memory
  pushService.loadFromDb(db, pushSubscriptions).catch(console.error);

  // Start de verjaardagscontrole planning
  scheduleBirthdayCheck();

  // Auto-herstel: zet has_cv=true voor kandidaten die een cv_filename hebben maar has_cv=false
  (async () => {
    try {
      const { isNotNull, sql: drizzleSql } = await import('drizzle-orm');
      await db.execute(drizzleSql`UPDATE candidates SET has_cv = true WHERE cv_filename IS NOT NULL AND has_cv = false`);
      console.log('[CV-fix] has_cv auto-herstel uitgevoerd');
    } catch (e) {
      console.error('[CV-fix] Onverwachte fout:', e);
    }
  })();

  async function scheduleGdprCleanup() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();
    setTimeout(async () => {
      try {
        console.log("GDPR cleanup gestart...");
        const result = await storage.getCandidates({ limit: 2000 });
        const allCandidates = result.candidates;

        // Anonymize expired candidates
        const expired = allCandidates.filter((c: any) =>
          c.retentionUntil &&
          new Date(c.retentionUntil) < new Date() &&
          !c.anonymizedAt
        );
        for (const c of expired) {
          await storage.anonymizeCandidate(c.id);
          console.log(`GDPR: kandidaat ${c.id} geanonimiseerd`);
        }

        // Delete partial candidates older than 30 days with no CV
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const stalePartials = allCandidates.filter((c: any) =>
          !c.hasCv &&
          c.status === 'in_behandeling' &&
          new Date(c.createdAt) < thirtyDaysAgo
        );
        for (const c of stalePartials) {
          await storage.deleteCandidate(c.id);
          console.log(`Cleanup: gedeeltelijke aanmelding ${c.id} verwijderd`);
        }

        console.log(`GDPR cleanup klaar: ${expired.length} geanonimiseerd, ${stalePartials.length} verwijderd`);
      } catch (e) {
        console.error("GDPR cleanup fout:", e);
      } finally {
        scheduleGdprCleanup();
      }
    }, delay);
  }
  scheduleGdprCleanup();

  // Legacy API routes - behouden voor backward compatibility
  app.post("/api/signup", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertApplicantSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: result.error.errors,
        });
      }
      
      // Check if email already exists
      const existingApplicant = await storage.getApplicantByEmail(result.data.email);
      
      if (existingApplicant) {
        return res.status(409).json({
          message: "Er bestaat al een aanmelding met dit e-mailadres"
        });
      }
      
      // Create the applicant
      const applicant = await storage.createApplicant(result.data);
      
      // Return success
      return res.status(201).json({
        message: "Aanmelding succesvol ontvangen",
        applicant: {
          id: applicant.id,
          name: applicant.name,
          email: applicant.email
        }
      });
    } catch (error) {
      console.error("Error during signup:", error);
      return res.status(500).json({
        message: "Er is iets misgegaan bij het verwerken van je aanmelding. Probeer het later opnieuw."
      });
    }
  });
  
  // Get current stats (for A/B testing metrics and analytics)
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
      
      // Zorg ervoor dat toDate het einde van de dag is als het is opgegeven
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
      }
      
      // Gebruik de nieuwe analytics methoden
      const transactionsPerDay = await storage.getTransactionsPerDay(fromDate, toDate);
      const popularRewards = await storage.getPopularRewards(fromDate, toDate);
      
      // Bereken groeipercentages voor verdiende punten
      const earnedThisPeriod = transactionsPerDay.reduce((sum, day) => sum + day.earned, 0);
      const earnedPreviousPeriod = await storage.getPointsAwardedPreviousPeriod(fromDate, toDate);
      
      let earnedGrowth = 0;
      if (earnedPreviousPeriod > 0) {
        earnedGrowth = Math.round(((earnedThisPeriod - earnedPreviousPeriod) / earnedPreviousPeriod) * 100);
      } else if (earnedThisPeriod > 0) {
        earnedGrowth = 100; // Als er geen vorige periode was, maar nu wel punten
      }
      
      // Bereken groeipercentages voor verzilveringen
      const redeemedThisPeriod = transactionsPerDay.reduce((sum, day) => sum + day.redeemed, 0);
      const redemptionsPreviousPeriod = await storage.getRedemptionsPreviousPeriod(fromDate, toDate);
      
      let redeemedGrowth = 0;
      if (redemptionsPreviousPeriod > 0) {
        redeemedGrowth = Math.round(((redeemedThisPeriod - redemptionsPreviousPeriod) / redemptionsPreviousPeriod) * 100);
      } else if (redeemedThisPeriod > 0) {
        redeemedGrowth = 100; // Als er geen vorige periode was, maar nu wel verzilveringen
      }
      
      // Haal gebruikersstatistieken op
      const users = await storage.getUsers();
      const activeUsers = users.filter(user => user.status === 'active');
      const activeEmployees = activeUsers.filter(user => user.role === 'employee');
      
      // Haal alle transacties en verzilveringen op
      const transactions = await storage.getPointTransactions();
      const redemptions = await storage.getRedemptions();
      
      // Filter transactions by date range if specified
      const filteredTransactions = transactions.filter(t => {
        if (!fromDate && !toDate) return true;
        const txDate = new Date(t.createdAt);
        return (!fromDate || txDate >= fromDate) && (!toDate || txDate <= toDate);
      });
      
      // Bereken betrokkenheidsgraad op basis van transacties
      const usersWithTransactions = new Set(filteredTransactions.map(t => t.userId));
      const engagementRate = activeEmployees.length > 0 
        ? Math.round((usersWithTransactions.size / activeEmployees.length) * 100) 
        : 0;
      
      return res.status(200).json({
        // Statistieken voor applicants (behouden voor backwards compatibility)
        totalApplicants: 0,
        variants: { a: 0, b: 0 },
        
        // Nieuwe statistieken voor het beloningssysteem
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        activeEmployees: activeEmployees.length,
        activeUsersPercent: activeEmployees.length > 0 
          ? Math.round((activeEmployees.length / users.length) * 100) 
          : 0,
        totalPointsAwarded: earnedThisPeriod,
        totalRedemptions: redemptions.length,
        engagementRate,
        
        // Analytics data
        transactionsPerDay,
        popularRewards,
        earnedGrowth,
        redeemedGrowth,
        
        // Bereken veranderingspercentages dynamisch op basis van de huidige gegevens
        changes: {
          // Gebruik de berekende groeipercentages
          pointsChange: earnedGrowth > 0 ? `+${earnedGrowth}%` : (earnedGrowth < 0 ? `${earnedGrowth}%` : '0%'),
          redemptionsChange: redeemedGrowth > 0 ? `+${redeemedGrowth}%` : (redeemedGrowth < 0 ? `${redeemedGrowth}%` : '0%'),
          // Als er actieve medewerkers zijn, +X%, anders N/A
          activeUsersChange: activeEmployees.length > 0 ? `+${Math.min(100, activeEmployees.length * 5)}%` : 'N/A',
          // Betrokkenheid op basis van gebruikers met transacties
          engagementChange: usersWithTransactions.size > 0 ? `+${Math.min(100, usersWithTransactions.size * 5)}%` : 'N/A'
        }
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({
        message: "Er is iets misgegaan bij het ophalen van de statistieken."
      });
    }
  });

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email en wachtwoord zijn vereist" });
      }

      // Voor reguliere users
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      
      // Wachtwoordcheck: alle gebruikers (inclusief admins) worden via bcrypt geverifieerd.
      // SHA256-pad is alleen behouden voor accounts die nog niet gemigreerd zijn.
      // TODO: verwijder de SHA256-tak zodra alle bestaande hashes zijn gemigreerd naar bcrypt.
      //       Auto-migratie vindt al plaats bij elke succesvolle SHA256-login (zie hieronder).
      let isValidPassword = false;
      if (user.password.startsWith('$2')) {
        // Bcrypt hash — standaard pad voor alle (nieuwe) accounts
        isValidPassword = await bcrypt.compare(password, user.password);
      } else {
        // TODO: legacy SHA256-hash — wordt automatisch gemigreerd naar bcrypt bij succesvolle login
        const sha256Hash = createHash('sha256').update(password).digest('hex');
        isValidPassword = sha256Hash === user.password;
        if (isValidPassword) {
          const newHash = await bcrypt.hash(password, 12);
          await storage.updateUser(user.id, { password: newHash });
        }
      }
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      
      console.log("Medewerker login poging gedetecteerd");
      
      // Sessie instellen
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      console.log("Medewerker sessie ingesteld, nu opslaan...");
      
      // Expliciete sessie opslaan
      req.session.save((err) => {
        if (err) {
          console.error("Fout bij opslaan sessie:", err);
          return res.status(500).json({ message: "Fout bij opslaan sessie" });
        }
        
        console.log("Medewerker sessie succesvol opgeslagen voor gebruiker:", user.id);
        
        return res.status(200).json({
          message: "Login succesvol",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het inloggen" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    console.log("Logout request ontvangen");
    
    req.session.destroy(err => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Er is iets misgegaan bij het uitloggen" });
      }
      
      // Zorg dat we de juiste cookie naam gebruiken die in index.ts is ingesteld
      res.clearCookie("extra.sid", { 
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      });
      
      console.log("Sessie en cookie succesvol verwijderd");
      
      return res.status(200).json({ message: "Uitloggen succesvol" });
    });
  });
  
  app.post("/api/auth/change-password", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Huidig en nieuw wachtwoord zijn verplicht" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Nieuw wachtwoord moet minimaal 8 tekens bevatten" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Gebruiker niet gevonden" });

      // Verifieer huidig wachtwoord
      let valid = false;
      if (user.password.startsWith('$2')) {
        valid = await bcrypt.compare(currentPassword, user.password);
      } else {
        const sha256Hash = createHash('sha256').update(currentPassword).digest('hex');
        valid = sha256Hash === user.password;
      }
      if (!valid) {
        return res.status(401).json({ message: "Huidig wachtwoord is onjuist" });
      }
      const hashedNew = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(user.id, { password: hashedNew });
      return res.json({ message: "Wachtwoord succesvol gewijzigd" });
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({ message: "Er is iets misgegaan" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(200).json(null);
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Strip sensitive info
      const sanitizedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        birthDate: user.birthDate,
        dateJoined: user.dateJoined,
        role: user.role,
        status: user.status,
        points: user.points,
        profileImage: user.profileImage,
        tags: user.tags
      };
      
      return res.status(200).json(sanitizedUser);
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de gebruiker" });
    }
  });
  
  // User routes
  app.get("/api/users", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      // Query de database direct zodat alle gebruikers altijd zichtbaar zijn,
      // ook na een herstart waarbij de MemStorage nog leeg is.
      const dbUsers = await db.select().from(users);
      
      // Strip sensitive info
      const sanitizedUsers = dbUsers.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        birthDate: user.birthDate,
        dateJoined: user.dateJoined,
        role: user.role,
        status: user.status,
        points: user.points,
        profileImage: user.profileImage,
        apiId: user.apiId,
        tags: user.tags
      }));
      
      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de gebruikers" });
    }
  });
  
  app.get("/api/users/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Check if requesting own data or admin
      if (req.session.userId !== userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Geen toegang" });
      }
      
      // Strip sensitive info
      const sanitizedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        birthDate: user.birthDate,
        dateJoined: user.dateJoined,
        role: user.role,
        status: user.status,
        points: user.points,
        profileImage: user.profileImage,
        apiId: user.apiId,
        tags: user.tags,
        settings: user.settings
      };
      
      return res.status(200).json(sanitizedUser);
    } catch (error) {
      console.error(`Error fetching user ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de gebruiker" });
    }
  });
  
  app.post("/api/users", adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige data",
          errors: result.error.errors,
        });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(result.data.email);
      
      if (existingUser) {
        return res.status(409).json({ message: "Er bestaat al een gebruiker met dit e-mailadres" });
      }
      
      // Create the user
      const user = await storage.createUser(result.data);
      
      // Strip sensitive info
      const sanitizedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      return res.status(201).json({
        message: "Gebruiker succesvol aangemaakt",
        user: sanitizedUser
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het aanmaken van de gebruiker" });
    }
  });
  
  app.put("/api/users/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Check if updating own data or admin
      if (req.session.userId !== userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Geen toegang" });
      }
      
      // Only allow admins to change role, status, etc.
      if (req.session.userRole !== 'admin') {
        // Filter out protected fields
        const { role, status, points, ...allowedFields } = req.body;
        req.body = allowedFields;
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Strip sensitive info
      const sanitizedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        status: updatedUser.status,
        points: updatedUser.points
      };
      
      return res.status(200).json({
        message: "Gebruiker succesvol bijgewerkt",
        user: sanitizedUser
      });
    } catch (error) {
      console.error(`Error updating user ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de gebruiker" });
    }
  });
  
  app.delete("/api/users/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      // Zoek gebruiker direct in de database
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }

      // Blokkeer verwijdering van vaste admin-accounts
      const PROTECTED_ADMIN_EMAILS = [
        'admin@extra.nl',
        'charlotte@doehetextra.nl',
        'eveline@doehetextra.nl',
        'lea@doehetextra.nl',
        'max@doehetextra.nl',
      ];
      if (PROTECTED_ADMIN_EMAILS.includes(user.email)) {
        return res.status(403).json({ message: "Dit account is beveiligd en kan niet worden verwijderd." });
      }

      // Verwijder uit database én MemStorage
      await db.delete(users).where(eq(users.id, userId));
      await storage.deleteUser(userId);

      return res.status(200).json({ message: "Gebruiker succesvol verwijderd" });
    } catch (error) {
      console.error(`Error deleting user ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de gebruiker" });
    }
  });
  
  /**
   * Maak een nieuw admin-account aan en stuur een welkomstmail met inloggegevens.
   * Alleen beschikbaar voor admins.
   */
  app.post("/api/admin/create-admin-user", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Voornaam, achternaam, e-mailadres en wachtwoord zijn verplicht" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Er bestaat al een account met dit e-mailadres" });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await storage.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'admin',
      } as any);

      // Stuur welkomstmail
      const baseUrl = (process.env.BASE_URL || 'https://www.doehetextra.nl').replace(/\/$/, '');
      const loginUrl = `${baseUrl}/dashboard`;
      sendAdminWelcomeEmail({
        to: email,
        firstName,
        lastName,
        email,
        password,
        loginUrl,
      }).catch(err => console.error('Fout bij verzenden welkomstmail admin:', err));

      return res.status(201).json({
        message: `Admin-account aangemaakt en welkomstmail verstuurd naar ${email}`,
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: 'admin' },
      });
    } catch (error) {
      console.error("Error creating admin user:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het aanmaken van het admin-account" });
    }
  });

  app.get("/api/users/search", authMiddleware, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Zoekterm moet minimaal 2 tekens bevatten" });
      }
      
      const users = await storage.searchUsers(query);
      
      // Strip sensitive info but keep necessary data for the contactentabel
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        points: user.points,
        role: user.role,
        status: user.status,
        phone: user.phone
      }));
      
      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error(`Error searching users:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het zoeken naar gebruikers" });
    }
  });
  
  // Reward routes
  app.get("/api/rewards", authMiddleware, async (req: Request, res: Response) => {
    try {
      const rewards = await storage.getRewards();
      
      // Filter rewards based on status for non-admins
      let filteredRewards = rewards;
      if (req.session.userRole !== 'admin') {
        filteredRewards = rewards.filter(reward => reward.status === 'available');
      }
      
      return res.status(200).json(filteredRewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de beloningen" });
    }
  });
  
  app.get("/api/rewards/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const rewardId = parseInt(req.params.id);
      
      // Check if reward exists
      const reward = await storage.getReward(rewardId);
      
      if (!reward) {
        return res.status(404).json({ message: "Beloning niet gevonden" });
      }
      
      // Check if reward is available for non-admins
      if (req.session.userRole !== 'admin' && reward.status !== 'available') {
        return res.status(404).json({ message: "Beloning niet gevonden" });
      }
      
      return res.status(200).json(reward);
    } catch (error) {
      console.error(`Error fetching reward ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de beloning" });
    }
  });
  
  app.post("/api/rewards", adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertRewardSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige data",
          errors: result.error.errors,
        });
      }
      
      // Create the reward
      const reward = await storage.createReward(result.data);
      
      // Broadcast new reward to all users
      if (typeof global.broadcastNotification === 'function') {
        global.broadcastNotification('reward_created', {
          message: `Nieuwe beloning beschikbaar: ${reward.name}`,
          data: {
            rewardId: reward.id,
            rewardName: reward.name,
            pointsRequired: reward.pointsRequired,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return res.status(201).json({
        message: "Beloning succesvol aangemaakt",
        reward
      });
    } catch (error) {
      console.error("Error creating reward:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het aanmaken van de beloning" });
    }
  });
  
  app.put("/api/rewards/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const rewardId = parseInt(req.params.id);
      
      // Check if reward exists
      const reward = await storage.getReward(rewardId);
      
      if (!reward) {
        return res.status(404).json({ message: "Beloning niet gevonden" });
      }
      
      // Update reward
      const updatedReward = await storage.updateReward(rewardId, req.body);
      
      if (!updatedReward) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de beloning" });
      }
      
      return res.status(200).json({
        message: "Beloning succesvol bijgewerkt",
        reward: updatedReward
      });
    } catch (error) {
      console.error(`Error updating reward ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de beloning" });
    }
  });
  
  app.delete("/api/rewards/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const rewardId = parseInt(req.params.id);
      
      // Check if reward exists
      const reward = await storage.getReward(rewardId);
      
      if (!reward) {
        return res.status(404).json({ message: "Beloning niet gevonden" });
      }
      
      // Delete reward
      const success = await storage.deleteReward(rewardId);
      
      if (!success) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de beloning" });
      }
      
      return res.status(200).json({ message: "Beloning succesvol verwijderd" });
    } catch (error) {
      console.error(`Error deleting reward ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de beloning" });
    }
  });
  
  // Challenges API routes
  app.get("/api/challenges", authMiddleware, async (req: Request, res: Response) => {
    try {
      const challenges = await storage.getChallenges();
      
      // Filter challenges based on status for non-admins
      let filteredChallenges = challenges;
      if (req.session.userRole !== 'admin') {
        filteredChallenges = challenges.filter(challenge => challenge.status === 'active');
      }
      
      return res.status(200).json(filteredChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het ophalen van de challenges"
      });
    }
  });

  // Admin challenges endpoint - shows all challenges including inactive ones
  app.get("/api/admin/challenges", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const challenges = await storage.getChallenges();
      return res.status(200).json(challenges);
    } catch (error) {
      console.error("Error fetching admin challenges:", error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het ophalen van challenges"
      });
    }
  });

  app.get("/api/challenges/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge niet gevonden" });
      }
      
      return res.status(200).json(challenge);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het ophalen van de challenge"
      });
    }
  });

  app.post("/api/challenges", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const result = insertChallengeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige data",
          errors: result.error.errors,
        });
      }
      
      const challenge = await storage.createChallenge(result.data);
      
      return res.status(201).json({
        message: "Challenge succesvol aangemaakt",
        challenge
      });
    } catch (error) {
      console.error("Error creating challenge:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het aanmaken van de challenge" });
    }
  });

  app.put("/api/challenges/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge niet gevonden" });
      }
      
      const updatedChallenge = await storage.updateChallenge(challengeId, req.body);
      
      if (!updatedChallenge) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de challenge" });
      }
      
      return res.status(200).json({
        message: "Challenge succesvol bijgewerkt",
        challenge: updatedChallenge
      });
    } catch (error) {
      console.error(`Error updating challenge ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de challenge" });
    }
  });

  app.delete("/api/challenges/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge niet gevonden" });
      }
      
      const success = await storage.deleteChallenge(challengeId);
      
      if (!success) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de challenge" });
      }
      
      return res.status(200).json({ message: "Challenge succesvol verwijderd" });
    } catch (error) {
      console.error(`Error deleting challenge ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de challenge" });
    }
  });

  // Planworks sync status endpoint
  app.get("/api/admin/planworks/status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { isPlanworksConfigured, getPlanworksAPI } = await import('./planworks-integration');
      const isConfigured = isPlanworksConfigured();
      const api = getPlanworksAPI();
      
      res.status(200).json({
        configured: isConfigured,
        available: api.isAvailable(),
        lastSync: null, // TODO: Get from database
        message: isConfigured ? "Planworks integratie actief" : "Planworks API key niet geconfigureerd"
      });
    } catch (error) {
      console.error("Error checking Planworks status:", error);
      res.status(500).json({ 
        message: "Fout bij controleren Planworks status",
        configured: false,
        available: false
      });
    }
  });

  // Trigger manual Planworks sync
  app.post("/api/admin/planworks/sync", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { getPlanworksAPI } = await import('./planworks-integration');
      const api = getPlanworksAPI();
      
      if (!api.isAvailable()) {
        return res.status(503).json({ 
          message: "Planworks integratie niet beschikbaar - controleer API configuratie" 
        });
      }

      const { userId } = req.body;
      
      if (userId) {
        // Sync specific user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "Gebruiker niet gevonden" });
        }
        
        if (!user.apiId) {
          return res.status(400).json({ 
            message: "Gebruiker heeft geen Planworks API ID geconfigureerd" 
          });
        }

        const metrics = await api.getChallengeMetrics(user.apiId);
        if (!metrics) {
          return res.status(404).json({ 
            message: "Geen data gevonden in Planworks voor deze gebruiker" 
          });
        }

        // Update challenge progress based on Planworks data
        const challenges = await storage.getChallenges();
        const results = [];

        for (const challenge of challenges) {
          if (challenge.category && metrics.challengeMetrics[challenge.category as keyof typeof metrics.challengeMetrics] !== undefined) {
            const newValue = metrics.challengeMetrics[challenge.category as keyof typeof metrics.challengeMetrics];
            
            // Update user progress
            let progress = await storage.getUserChallengeProgress(user.id, challenge.id);
            if (!progress) {
              progress = await storage.createUserChallengeProgress({
                userId: user.id,
                challengeId: challenge.id,
                currentValue: newValue,
                completedSteps: [],
                lastSyncAt: new Date(),
                planworksData: metrics.challengeMetrics
              });
            } else {
              progress = await storage.updateUserChallengeProgress(progress.id, {
                currentValue: newValue,
                lastSyncAt: new Date(),
                planworksData: metrics.challengeMetrics
              });
            }

            results.push({
              challengeId: challenge.id,
              challengeTitle: challenge.title,
              previousValue: progress.currentValue,
              newValue: newValue,
              updated: true
            });
          }
        }
        
        return res.status(200).json({
          message: `Synchronisatie voltooid voor ${user.firstName} ${user.lastName}`,
          results
        });
      } else {
        // Sync all users with apiId
        const users = await storage.getUsers();
        const usersWithApiId = users.filter(u => u.apiId);
        
        if (usersWithApiId.length === 0) {
          return res.status(400).json({ 
            message: "Geen gebruikers gevonden met Planworks API ID" 
          });
        }

        const allMetrics = await api.getAllEmployeeMetrics();
        let successCount = 0;
        let errorCount = 0;
        
        for (const user of usersWithApiId) {
          try {
            const userMetrics = allMetrics.find(m => m.userId === user.apiId);
            if (userMetrics) {
              // Update challenge progress for this user
              // Similar logic as above for single user
              successCount++;
            }
          } catch (error) {
            console.error(`Error syncing user ${user.id}:`, error);
            errorCount++;
          }
        }
        
        return res.status(200).json({
          message: `Bulk synchronisatie voltooid: ${successCount} gebruikers gesynchroniseerd, ${errorCount} fouten`,
          successCount,
          errorCount
        });
      }
    } catch (error) {
      console.error("Error syncing with Planworks:", error);
      return res.status(500).json({ 
        message: "Fout bij synchroniseren met Planworks" 
      });
    }
  });

  // Challenge steps API routes
  app.get("/api/challenges/:id/steps", authMiddleware, async (req: Request, res: Response) => {
    try {
      const challengeId = parseInt(req.params.id);
      
      const steps = await storage.getChallengeSteps(challengeId);
      
      return res.status(200).json(steps);
    } catch (error) {
      console.error("Error fetching challenge steps:", error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het ophalen van de challenge stappen"
      });
    }
  });

  // User challenge progress routes
  app.get("/api/users/:userId/challenges", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Ongeldig gebruiker ID" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }

      // Get all user challenge progress
      const progressList = await storage.getUserChallengeProgress(userId);
      
      // Enrich with challenge data
      const enrichedProgress = await Promise.all(
        progressList.map(async (progress) => {
          const challenge = await storage.getChallenge(progress.challengeId);
          const steps = challenge ? await storage.getChallengeSteps(challenge.id) : [];
          
          return {
            ...progress,
            challenge: challenge ? { ...challenge, steps } : null
          };
        })
      );

      return res.status(200).json(enrichedProgress);
    } catch (error) {
      console.error("Error fetching user challenge progress:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het ophalen van challenge voortgang" 
      });
    }
  });

  // Update challenge progress manually (for admin use)
  app.put("/api/admin/users/:userId/challenges/:challengeId/progress", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const challengeId = parseInt(req.params.challengeId);
      const { currentValue } = req.body;
      
      if (isNaN(userId) || isNaN(challengeId) || typeof currentValue !== 'number') {
        return res.status(400).json({ message: "Ongeldig gebruiker ID, challenge ID of voortgang waarde" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }

      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge niet gevonden" });
      }

      // Get or create user challenge progress
      let progress = await storage.getUserChallengeProgress(userId, challengeId);
      if (!progress) {
        progress = await storage.createUserChallengeProgress({
          userId,
          challengeId,
          currentValue,
          completedSteps: [],
          lastSyncAt: new Date()
        });
      } else {
        progress = await storage.updateUserChallengeProgress(progress.id, {
          currentValue,
          lastSyncAt: new Date()
        });
      }

      // Check if any steps should be completed
      const steps = await storage.getChallengeSteps(challengeId);
      const completedSteps = [...(progress?.completedSteps || [])];
      let pointsAwarded = 0;

      for (const step of steps) {
        if (currentValue >= step.targetValue && !completedSteps.includes(step.id)) {
          completedSteps.push(step.id);
          pointsAwarded += step.pointsReward;
          
          // Award points to user
          await storage.updateUserPoints(userId, step.pointsReward);
          
          // Create point transaction
          await storage.createPointTransaction({
            userId,
            amount: step.pointsReward,
            type: 'earned',
            source: 'challenge_step',
            description: `Challenge stap voltooid: ${step.title}`,
            metadata: {
              challengeId,
              stepId: step.id,
              stepTitle: step.title
            }
          });
        }
      }

      // Update completed steps if any new ones
      if (pointsAwarded > 0) {
        await storage.updateUserChallengeProgress(progress.id, {
          completedSteps,
          currentValue
        });
      }

      return res.status(200).json({
        message: pointsAwarded > 0 
          ? `Voortgang bijgewerkt en ${pointsAwarded} punten toegekend`
          : "Voortgang bijgewerkt",
        progress,
        pointsAwarded
      });
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het bijwerken van de voortgang" 
      });
    }
  });

  // Complete a one-time challenge for a user
  app.post("/api/admin/users/:userId/challenges/:challengeId/complete", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const challengeId = parseInt(req.params.challengeId);
      
      if (isNaN(userId) || isNaN(challengeId)) {
        return res.status(400).json({ message: "Ongeldig gebruiker ID of challenge ID" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }

      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge niet gevonden" });
      }

      // Check if it's a one-time challenge
      if (challenge.type !== 'eenmalig') {
        return res.status(400).json({ message: "Alleen eenmalige challenges kunnen als voltooid worden gemarkeerd" });
      }

      // Get user challenge progress
      const userProgress = await storage.getUserChallengeProgress(userId);
      const existingProgress = userProgress.find(p => p.challengeId === challengeId);
      
      let progress;
      if (!existingProgress || existingProgress.id === 0) {
        // Create new progress entry
        progress = await storage.createUserChallengeProgress({
          userId,
          challengeId,
          currentValue: 1,
          isCompleted: true,
          completedSteps: []
        });
      } else {
        // Update existing progress
        progress = await storage.updateUserChallengeProgress(existingProgress.id, {
          currentValue: 1,
          isCompleted: true
        });
      }

      // Award points
      const pointsToAward = challenge.points || 0;
      if (pointsToAward > 0) {
        await storage.createPointTransaction({
          userId,
          amount: pointsToAward,
          type: "earned",
          description: `Challenge voltooid: ${challenge.title}`,
          source: "challenge_completion",
          sourceId: challengeId.toString()
        });
      }

      // Send push notification for challenge completion
      const pushService = getPushNotificationService();
      if (pushService && user) {
        try {
          await pushService.sendAchievementNotification(user, {
            title: 'Challenge Voltooid!',
            points: pointsToAward,
            type: 'challenge_complete'
          });
        } catch (error) {
          console.error('Failed to send push notification for challenge completion:', error);
        }
      }

      return res.status(200).json({
        message: "Challenge succesvol voltooid",
        progress,
        pointsAwarded: pointsToAward
      });
    } catch (error) {
      console.error("Error completing challenge:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het voltooien van de challenge" 
      });
    }
  });

  // Increment progress for a progressive challenge step
  app.post("/api/users/:userId/challenges/:challengeId/increment", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const challengeId = parseInt(req.params.challengeId);
      const { stepIndex } = req.body;
      
      if (isNaN(userId) || isNaN(challengeId) || typeof stepIndex !== 'number') {
        return res.status(400).json({ message: "Ongeldig gebruiker ID, challenge ID of step index" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }

      // Check if challenge exists
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge niet gevonden" });
      }

      // Check if it's a progressive challenge
      if (challenge.type !== 'doorlopend') {
        return res.status(400).json({ message: "Alleen doorlopende challenges hebben stappen" });
      }

      // Get challenge steps
      const steps = await storage.getChallengeSteps(challengeId);
      const sortedSteps = steps.sort((a, b) => a.stepNumber - b.stepNumber);
      
      if (stepIndex >= sortedSteps.length) {
        return res.status(400).json({ message: "Ongeldige step index" });
      }

      const targetStep = sortedSteps[stepIndex];

      // Get or create user challenge progress
      let progress = await storage.getUserChallengeProgress(userId, challengeId);
      
      if (!progress) {
        // Create new progress entry
        progress = await storage.createUserChallengeProgress({
          userId,
          challengeId,
          currentValue: 1,
          isCompleted: false,
          completedSteps: [],
          currentStep: 0
        });
      } else {
        // Increment current value
        const newValue = (progress.currentValue || 0) + 1;
        let completedSteps = [...(progress.completedSteps || [])];
        let currentStep = progress.currentStep || 0;
        let pointsAwarded = 0;

        // Check if this increment completes the current step
        if (newValue >= targetStep.targetValue && !completedSteps.includes(targetStep.id)) {
          completedSteps.push(targetStep.id);
          currentStep = stepIndex + 1;
          pointsAwarded = targetStep.pointsReward || 0;

          // Award points for completing this step
          if (pointsAwarded > 0) {
            await storage.createPointTransaction({
              userId,
              amount: pointsAwarded,
              type: "earned",
              description: `Challenge stap voltooid: ${challenge.title} - Stap ${stepIndex + 1}`,
              source: "challenge_step_completion",
              sourceId: targetStep.id.toString()
            });
          }
        }

        // Update progress
        progress = await storage.updateUserChallengeProgress(progress.id, {
          currentValue: newValue,
          completedSteps,
          currentStep,
          isCompleted: currentStep >= sortedSteps.length
        });

        return res.status(200).json({
          message: "Progress succesvol verhoogd",
          progress,
          pointsAwarded,
          stepCompleted: pointsAwarded > 0
        });
      }

      return res.status(200).json({
        message: "Progress succesvol verhoogd",
        progress,
        pointsAwarded: 0
      });
    } catch (error) {
      console.error("Error incrementing challenge progress:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het verhogen van de progress" 
      });
    }
  });

  // Complete a one-time challenge for user
  app.post("/api/admin/users/:userId/challenges/:challengeId/complete", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const challengeId = parseInt(req.params.challengeId);
      
      if (isNaN(userId) || isNaN(challengeId)) {
        return res.status(400).json({ message: "Ongeldige parameters" });
      }

      // Check if user and challenge exist
      const user = await storage.getUser(userId);
      const challenge = await storage.getChallenge(challengeId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge niet gevonden" });
      }

      if (challenge.type !== 'eenmalig') {
        return res.status(400).json({ message: "Deze actie is alleen beschikbaar voor eenmalige challenges" });
      }

      // Check if challenge is already completed
      let progress = await storage.getUserChallengeProgress(userId, challengeId);
      
      if (progress && progress.isCompleted) {
        return res.status(400).json({ message: "Challenge is al voltooid" });
      }

      // Create or update progress
      if (!progress) {
        progress = await storage.createUserChallengeProgress({
          userId,
          challengeId,
          currentValue: challenge.targetValue || 1,
          completedSteps: [],
          isCompleted: true
        });
      } else {
        progress = await storage.updateUserChallengeProgress(progress.id, {
          currentValue: challenge.targetValue || 1,
          isCompleted: true
        });
      }

      // Award points
      if (challenge.points) {
        await storage.createPointTransaction({
          userId,
          type: 'earned',
          amount: challenge.points,
          description: `Challenge voltooid: ${challenge.title}`,
          category: 'challenge'
        });

        // Update user points
        await storage.updateUser(userId, {
          points: user.points + challenge.points
        });
      }

      return res.status(200).json({
        message: "Challenge succesvol voltooid",
        progress,
        pointsAwarded: challenge.points || 0
      });
    } catch (error) {
      console.error("Error completing challenge:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het voltooien van de challenge" 
      });
    }
  });

  // Update progress for ongoing challenge
  app.put("/api/admin/users/:userId/challenges/:challengeId/progress", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const challengeId = parseInt(req.params.challengeId);
      const { currentValue } = req.body;
      
      if (isNaN(userId) || isNaN(challengeId) || isNaN(currentValue)) {
        return res.status(400).json({ message: "Ongeldige parameters" });
      }

      // Check if user and challenge exist
      const user = await storage.getUser(userId);
      const challenge = await storage.getChallenge(challengeId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge niet gevonden" });
      }

      if (challenge.type !== 'doorlopend') {
        return res.status(400).json({ message: "Deze actie is alleen beschikbaar voor doorlopende challenges" });
      }

      // Get challenge steps
      const steps = await storage.getChallengeSteps(challengeId);
      steps.sort((a, b) => a.stepNumber - b.stepNumber);

      // Get current progress
      let progress = await storage.getUserChallengeProgress(userId, challengeId);
      let pointsAwarded = 0;

      if (!progress) {
        // Create new progress
        progress = await storage.createUserChallengeProgress({
          userId,
          challengeId,
          currentValue,
          completedSteps: [],
          isCompleted: false
        });
      } else {
        // Check for newly completed steps
        const previousValue = progress.currentValue;
        const newlyCompletedSteps = steps.filter(step => 
          step.targetValue <= currentValue && step.targetValue > previousValue
        );

        // Award points for newly completed steps
        for (const step of newlyCompletedSteps) {
          pointsAwarded += step.pointsReward;
          
          await storage.createPointTransaction({
            userId,
            type: 'earned',
            amount: step.pointsReward,
            description: `Challenge stap voltooid: ${challenge.title} - Stap ${step.stepNumber}`,
            category: 'challenge'
          });
        }

        // Update user points
        if (pointsAwarded > 0) {
          await storage.updateUser(userId, {
            points: user.points + pointsAwarded
          });
        }

        // Update progress
        const completedStepIds = steps
          .filter(step => step.targetValue <= currentValue)
          .map(step => step.id);

        progress = await storage.updateUserChallengeProgress(progress.id, {
          currentValue,
          completedSteps: completedStepIds
        });
      }

      return res.status(200).json({
        message: "Voortgang succesvol bijgewerkt",
        progress,
        pointsAwarded
      });
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het bijwerken van de voortgang" 
      });
    }
  });

  // Planning system integration endpoints
  app.post("/api/admin/sync-challenges", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const syncService = getChallengeSyncService();
      if (!syncService) {
        return res.status(503).json({ 
          message: "Challenge synchronisatie service niet beschikbaar" 
        });
      }

      const { userId } = req.body;
      
      if (userId) {
        // Sync specific user
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "Gebruiker niet gevonden" });
        }
        
        const results = await syncService.syncUserChallenges(user);
        return res.status(200).json({
          message: `Challenge synchronisatie voltooid voor ${user.firstName} ${user.lastName}`,
          results
        });
      } else {
        // Sync all users
        const summary = await syncService.syncAllUserChallenges();
        return res.status(200).json({
          message: `Bulk synchronisatie voltooid: ${summary.successfulSyncs} geslaagd, ${summary.errors} fouten`,
          summary
        });
      }
    } catch (error) {
      console.error("Error syncing challenges:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het synchroniseren van challenges" 
      });
    }
  });

  app.get("/api/admin/planning-status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const planningAPI = getPlanningAPI();
      if (!planningAPI) {
        return res.status(200).json({
          connected: false,
          message: "Planning system niet geconfigureerd"
        });
      }

      const isConnected = await planningAPI.testConnection();
      return res.status(200).json({
        connected: isConnected,
        message: isConnected ? "Planning system verbonden" : "Planning system niet bereikbaar"
      });
    } catch (error) {
      console.error("Error checking planning system status:", error);
      return res.status(200).json({
        connected: false,
        message: "Fout bij controleren planning system status"
      });
    }
  });

  app.get("/api/users/:userId/challenge-progress", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessionUserId = req.session.userId;
      const userRole = req.session.userRole;

      // Check authorization - users can only see their own progress, admins can see all
      if (userRole !== 'admin' && sessionUserId !== userId) {
        return res.status(403).json({ message: "Geen toegang tot deze gebruiker" });
      }

      const syncService = getChallengeSyncService();
      if (!syncService) {
        return res.status(503).json({ 
          message: "Challenge service niet beschikbaar" 
        });
      }

      const summary = await syncService.getUserChallengesSummary(userId);
      return res.status(200).json(summary);
    } catch (error) {
      console.error("Error fetching user challenge progress:", error);
      return res.status(500).json({ 
        message: "Er is een fout opgetreden bij het ophalen van challenge voortgang" 
      });
    }
  });

  // Discounts API routes
  app.get("/api/discounts", authMiddleware, async (req: Request, res: Response) => {
    try {
      const discounts = await storage.getDiscounts();
      
      // Filter discounts based on status for non-admins
      let filteredDiscounts = discounts;
      if (req.session.userRole !== 'admin') {
        filteredDiscounts = discounts.filter(discount => discount.status === 'active');
      }
      
      return res.status(200).json(filteredDiscounts);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het ophalen van de kortingsacties"
      });
    }
  });
  
  app.get("/api/discounts/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const discountId = parseInt(req.params.id);
      
      // Check if discount exists
      const discount = await storage.getDiscount(discountId);
      
      if (!discount) {
        return res.status(404).json({
          message: "Kortingsactie niet gevonden"
        });
      }
      
      // Check if discount is active/visible for non-admins
      if (req.session.userRole !== 'admin' && discount.status !== 'active') {
        return res.status(403).json({
          message: "Deze kortingsactie is momenteel niet beschikbaar"
        });
      }
      
      return res.status(200).json(discount);
    } catch (error) {
      console.error(`Error fetching discount ${req.params.id}:`, error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het ophalen van de kortingsactie"
      });
    }
  });
  
  app.post("/api/discounts", adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertDiscountSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige gegevens",
          errors: result.error.errors,
        });
      }
      
      const discountData = { ...result.data };
      
      // Create the discount (qrImageUrl komt direct uit de request body)
      const discount = await storage.createDiscount(discountData);
      
      return res.status(201).json({
        message: "Kortingsactie succesvol aangemaakt",
        discount
      });
    } catch (error) {
      console.error("Error creating discount:", error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het aanmaken van de kortingsactie"
      });
    }
  });
  
  app.put("/api/discounts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const discountId = parseInt(req.params.id);
      
      // Check if discount exists
      const discount = await storage.getDiscount(discountId);
      
      if (!discount) {
        return res.status(404).json({
          message: "Kortingsactie niet gevonden"
        });
      }
      
      const updateData = { ...req.body };
      
      // Update discount (qrImageUrl komt direct uit de request body)
      const updatedDiscount = await storage.updateDiscount(discountId, updateData);
      
      // Notify connected users of the update if their session is authenticated
      const notifyData = {
        type: 'discount_updated',
        message: 'Een kortingsactie is bijgewerkt',
        data: updatedDiscount
      };
      
      if (global.sendNotification && typeof global.sendNotification === 'function') {
        global.sendNotification(notifyData);
      }
      
      return res.status(200).json({
        message: "Kortingsactie succesvol bijgewerkt",
        discount: updatedDiscount
      });
    } catch (error) {
      console.error(`Error updating discount ${req.params.id}:`, error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het bijwerken van de kortingsactie"
      });
    }
  });
  
  app.delete("/api/discounts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const discountId = parseInt(req.params.id);
      
      // Check if discount exists
      const discount = await storage.getDiscount(discountId);
      
      if (!discount) {
        return res.status(404).json({
          message: "Kortingsactie niet gevonden"
        });
      }
      
      // Delete discount
      const success = await storage.deleteDiscount(discountId);
      
      if (success) {
        // Notify connected users about the deletion
        if (global.sendNotification && typeof global.sendNotification === 'function') {
          global.sendNotification({
            type: 'discount_deleted',
            message: 'Een kortingsactie is verwijderd',
            data: { id: discountId }
          });
        }
        
        return res.status(200).json({
          message: "Kortingsactie succesvol verwijderd"
        });
      } else {
        return res.status(500).json({
          message: "Er is iets misgegaan bij het verwijderen van de kortingsactie"
        });
      }
    } catch (error) {
      console.error(`Error deleting discount ${req.params.id}:`, error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het verwijderen van de kortingsactie"
      });
    }
  });
  
  // Transaction routes
  app.get("/api/transactions", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const transactions = await storage.getPointTransactions();
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de transacties" });
    }
  });
  
  app.get("/api/users/:userId/transactions", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Check if requesting own data or admin
      if (req.session.userId !== userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Geen toegang" });
      }
      
      const transactions = await storage.getPointTransactionsByUserId(userId);
      return res.status(200).json(transactions);
    } catch (error) {
      console.error(`Error fetching transactions for user ${req.params.userId}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de transacties" });
    }
  });
  
  // Test endpoint voor het toevoegen van punten (voor demonstratie van WebSocket)
  app.post("/api/users/:userId/add-points", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Controleer of gebruiker bestaat
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Controleer of gebruiker zichzelf is of admin
      if (req.session.userId !== userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Geen toegang" });
      }
      
      const { points, description } = req.body;
      
      // Valideer dat punten een positief getal is
      if (!points || typeof points !== 'number' || points <= 0) {
        return res.status(400).json({ message: "Ongeldig aantal punten" });
      }
      
      // Maak een transactie aan
      const transaction = await storage.createPointTransaction({
        userId,
        amount: points,
        type: "earned",
        description: description || "Test punten",
        source: "test",
      });
      
      // Haal de bijgewerkte gebruiker op
      const updatedUser = await storage.getUser(userId);
      
      // Send WebSocket notification for real-time updates
      if (typeof global.broadcastNotification === 'function') {
        // Send push notification for achievement
        const pushService = getPushNotificationService();
        if (pushService && updatedUser) {
          try {
            await pushService.sendAchievementNotification(updatedUser, {
              title: 'Punten Verdiend!',
              points: points,
              type: 'points_earned'
            });
          } catch (error) {
            console.error('Failed to send push notification for points:', error);
          }
        }

        // Notify the specific user about their points update
        global.broadcastNotification('points_update', {
          message: `Je hebt ${points} punten ontvangen!`,
          data: {
            userId: userId,
            points: updatedUser!.points,
            monthlyPoints: updatedUser!.monthlyPoints,
            change: points,
            timestamp: new Date().toISOString()
          }
        }, userId);
        
        // Notify all users about leaderboard update
        global.broadcastNotification('leaderboard_update', {
          message: 'Ranglijst bijgewerkt',
          data: {
            userId: userId,
            newPoints: updatedUser!.points,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Stuur een response
      return res.status(200).json({
        message: "Punten succesvol toegevoegd",
        transaction,
        user: {
          id: updatedUser!.id,
          points: updatedUser!.points,
          monthlyPoints: updatedUser!.monthlyPoints
        }
      });
    } catch (error) {
      console.error(`Error adding points for user ${req.params.userId}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het toevoegen van punten" });
    }
  });
  
  app.post("/api/transactions", adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertPointTransactionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige data",
          errors: result.error.errors,
        });
      }
      
      // Check if user exists
      const user = await storage.getUser(result.data.userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Maak de amount parameter aan vanuit points voor compatibiliteit
      // Zorg dat we de amount parameter gebruiken als die bestaat, 
      // anders de points parameter (voor oudere code)
      // Kopieer de data zonder points property
      const { points, ...restData } = result.data as any;
      
      const transactionData = {
        ...restData,
        amount: result.data.amount || points || 0
      };
      
      // Create the transaction
      const transaction = await storage.createPointTransaction(transactionData);
      
      // Get updated user
      const updatedUser = await storage.getUser(result.data.userId);
      
      // Voeg points property toe aan transaction response voor frontend compatibiliteit
      const transactionResponse = {
        ...transaction,
        points: transaction.amount
      };
      
      // Stuur notificatie naar de gebruiker over nieuwe punten
      if (typeof global.sendNotification === 'function') {
        try {
          const isPositive = transaction.type === 'earned';
          const userName = updatedUser ? `${updatedUser.firstName} ${updatedUser.lastName}` : 'Gebruiker';
          
          // Stuur notificatie naar de betreffende gebruiker
          global.sendNotification({
            type: isPositive ? 'points_earned' : 'points_redeemed',
            userId: transaction.userId,
            message: isPositive 
              ? `Je hebt ${Math.abs(transaction.amount)} punten ontvangen: ${transaction.description}`
              : `Je hebt ${Math.abs(transaction.amount)} punten ingewisseld: ${transaction.description}`,
            data: {
              transactionId: transaction.id,
              amount: transaction.amount,
              description: transaction.description,
              newBalance: updatedUser?.points || 0
            }
          });
          
          // Stuur ook notificatie naar admins voor monitoring
          global.sendNotification({
            type: 'admin_transaction_alert',
            userRole: 'admin',
            message: `${isPositive ? 'Punten toegekend' : 'Punten ingewisseld'} voor ${userName}`,
            data: {
              transactionId: transaction.id,
              userId: transaction.userId,
              userName,
              amount: transaction.amount,
              description: transaction.description,
              newBalance: updatedUser?.points || 0
            }
          });
          
          console.log(`Transactie notificatie verzonden naar gebruiker ${transaction.userId}`);
        } catch (notificationError) {
          console.error('Fout bij versturen transactie notificatie:', notificationError);
        }
      }
      
      return res.status(201).json({
        message: "Transactie succesvol aangemaakt",
        transaction: transactionResponse,
        user: {
          id: updatedUser!.id,
          points: updatedUser!.points
        }
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het aanmaken van de transactie" });
    }
  });
  
  // Redemption routes
  app.get("/api/redemptions", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const redemptions = await storage.getRedemptions();
      return res.status(200).json(redemptions);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de verzilveringen" });
    }
  });
  
  app.get("/api/users/:userId/redemptions", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Check if requesting own data or admin
      if (req.session.userId !== userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Geen toegang" });
      }
      
      const redemptions = await storage.getRedemptionsByUserId(userId);
      return res.status(200).json(redemptions);
    } catch (error) {
      console.error(`Error fetching redemptions for user ${req.params.userId}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de verzilveringen" });
    }
  });
  
  app.post("/api/redemptions", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Valideer de basis van het request
      const { userId, rewardId, status = "pending", notes } = req.body;
      
      if (!userId || !rewardId) {
        return res.status(400).json({
          message: "Ongeldige data",
          errors: [{ message: "userId en rewardId zijn verplicht" }],
        });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Check if reward exists and is available
      const reward = await storage.getReward(rewardId);
      
      if (!reward) {
        return res.status(404).json({ message: "Beloning niet gevonden" });
      }
      
      if (reward.status !== 'available') {
        return res.status(400).json({ message: "Deze beloning is momenteel niet beschikbaar" });
      }
      
      // Check if user has enough points
      if (user.points < reward.pointsCost) {
        return res.status(400).json({ message: "Niet genoeg punten om deze beloning te verzilveren" });
      }
      
      // Create redemption data with cost from reward
      const redemptionData = {
        userId,
        rewardId,
        pointsCost: reward.pointsCost,
        status,
        notes
      };
      
      // Create the redemption (this also updates user points and creates a transaction)
      const redemption = await storage.createRedemption(redemptionData);
      
      // Get updated user
      const updatedUser = await storage.getUser(userId);
      
      // Stuur notificatie over verzilvering
      if (typeof global.sendNotification === 'function') {
        try {
          const userName = updatedUser ? `${updatedUser.firstName} ${updatedUser.lastName}` : 'Gebruiker';
          
          // Stuur notificatie naar de betreffende gebruiker
          global.sendNotification({
            type: 'reward_redeemed',
            userId: userId,
            message: `Je hebt ${reward.name} verzilverd voor ${reward.pointsCost} punten.`,
            data: {
              redemptionId: redemption.id,
              rewardId: reward.id,
              rewardName: reward.name,
              pointsCost: reward.pointsCost,
              newBalance: updatedUser?.points || 0
            }
          });
          
          // Stuur ook notificatie naar admins voor verwerking
          global.sendNotification({
            type: 'admin_redemption_alert',
            userRole: 'admin',
            message: `Nieuwe verzilvering: ${userName} heeft ${reward.name} verzilverd`,
            data: {
              redemptionId: redemption.id,
              rewardId: reward.id,
              userId: userId,
              userName,
              rewardName: reward.name,
              pointsCost: reward.pointsCost
            }
          });
          
          console.log(`Verzilvering notificatie verzonden naar gebruiker ${userId}`);
        } catch (notificationError) {
          console.error('Fout bij versturen verzilvering notificatie:', notificationError);
        }
      }
      
      return res.status(201).json({
        message: "Beloning succesvol verzilverd",
        redemption,
        user: {
          id: updatedUser!.id,
          points: updatedUser!.points
        }
      });
    } catch (error) {
      console.error("Error creating redemption:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verzilveren van de beloning" });
    }
  });
  
  app.put("/api/redemptions/:id/status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const redemptionId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is vereist" });
      }
      
      // Check if redemption exists
      const redemption = await storage.getRedemption(redemptionId);
      
      if (!redemption) {
        return res.status(404).json({ message: "Verzilvering niet gevonden" });
      }
      
      // Update redemption status
      const updatedRedemption = await storage.updateRedemptionStatus(redemptionId, status);
      
      if (!updatedRedemption) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de status" });
      }
      
      return res.status(200).json({
        message: "Status succesvol bijgewerkt",
        redemption: updatedRedemption
      });
    } catch (error) {
      console.error(`Error updating redemption status ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de status" });
    }
  });
  
  // Rule routes
  app.get("/api/rules", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const rules = await storage.getRules();
      return res.status(200).json(rules);
    } catch (error) {
      console.error("Error fetching rules:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de regels" });
    }
  });
  
  app.post("/api/rules", adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = insertRuleSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige data",
          errors: result.error.errors,
        });
      }
      
      // Create the rule
      const rule = await storage.createRule(result.data);
      
      return res.status(201).json({
        message: "Regel succesvol aangemaakt",
        rule
      });
    } catch (error) {
      console.error("Error creating rule:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het aanmaken van de regel" });
    }
  });
  
  app.put("/api/rules/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const ruleId = parseInt(req.params.id);
      
      // Check if rule exists
      const rule = await storage.getRule(ruleId);
      
      if (!rule) {
        return res.status(404).json({ message: "Regel niet gevonden" });
      }
      
      // Update rule
      const updatedRule = await storage.updateRule(ruleId, req.body);
      
      if (!updatedRule) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de regel" });
      }
      
      return res.status(200).json({
        message: "Regel succesvol bijgewerkt",
        rule: updatedRule
      });
    } catch (error) {
      console.error(`Error updating rule ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de regel" });
    }
  });
  
  app.put("/api/rules/:id/toggle", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const ruleId = parseInt(req.params.id);
      
      // Check if rule exists
      const rule = await storage.getRule(ruleId);
      
      if (!rule) {
        return res.status(404).json({ message: "Regel niet gevonden" });
      }
      
      // Toggle rule
      const updatedRule = await storage.toggleRuleStatus(ruleId);
      
      if (!updatedRule) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het togglen van de regel" });
      }
      
      return res.status(200).json({
        message: `Regel succesvol ${updatedRule.isActive ? 'geactiveerd' : 'gedeactiveerd'}`,
        rule: updatedRule
      });
    } catch (error) {
      console.error(`Error toggling rule ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het togglen van de regel" });
    }
  });
  
  app.delete("/api/rules/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const ruleId = parseInt(req.params.id);
      
      // Check if rule exists
      const rule = await storage.getRule(ruleId);
      
      if (!rule) {
        return res.status(404).json({ message: "Regel niet gevonden" });
      }
      
      // Delete rule
      const success = await storage.deleteRule(ruleId);
      
      if (!success) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de regel" });
      }
      
      return res.status(200).json({ message: "Regel succesvol verwijderd" });
    } catch (error) {
      console.error(`Error deleting rule ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de regel" });
    }
  });
  
  // Settings routes
  app.get("/api/settings", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Only return certain settings for non-admins
      if (req.session.userRole !== 'admin') {
        const uiSettings = await storage.getSettingsByCategory('appearance');
        return res.status(200).json(uiSettings);
      }
      
      // Get all settings or by category
      if (req.query.category) {
        const category = req.query.category as string;
        const settings = await storage.getSettingsByCategory(category);
        return res.status(200).json(settings);
      } else {
        // For now, we don't have any settings initialized, but in a real app this would return all settings
        return res.status(200).json([]);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de instellingen" });
    }
  });
  
  app.put("/api/settings/:key", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      
      // Validate request body
      const result = insertSettingsSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige data",
          errors: result.error.errors,
        });
      }
      
      // Update or create setting
      const setting = await storage.upsertSetting(key, result.data);
      
      return res.status(200).json({
        message: "Instelling succesvol bijgewerkt",
        setting
      });
    } catch (error) {
      console.error(`Error updating setting ${req.params.key}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de instelling" });
    }
  });
  
  // Endpoint voor het uitvoeren van een handmatige verjaardagscontrole
  app.post("/api/admin/check-birthdays", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const usersAwarded = await awardBirthdayPoints();
      
      return res.status(200).json({
        success: true,
        message: `Verjaardagscontrole uitgevoerd. ${usersAwarded} gebruikers hebben ${BIRTHDAY_POINTS} punten ontvangen.`,
        usersAwarded,
        pointsPerUser: BIRTHDAY_POINTS,
        euroValue: BIRTHDAY_POINTS / POINTS_TO_EURO_RATIO
      });
    } catch (error) {
      console.error("Fout bij handmatige verjaardagscontrole:", error);
      return res.status(500).json({ 
        success: false,
        message: "Er is een fout opgetreden bij het uitvoeren van de verjaardagscontrole" 
      });
    }
  });
  
  // Endpoint voor het testen van verjaardagsmail naar specifieke gebruiker
  app.post("/api/admin/test-birthday-email", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "Gebruikers-ID is vereist" });
      }
      
      // Haal de gebruiker op
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Haal de puntenwaarde op uit de instellingen
      const birthdayPoints = await storage.getSetting('birthday_points');
      const pointsValue = birthdayPoints && birthdayPoints.value ? 
                        parseInt(birthdayPoints.value) : BIRTHDAY_POINTS;
      
      // Import de sendBirthdayEmail functie
      const { sendBirthdayEmail } = await import('./mail');
      
      // Verstuur de test e-mail
      const emailSent = await sendBirthdayEmail(user, pointsValue);
      
      if (emailSent) {
        return res.status(200).json({
          success: true,
          message: `Test verjaardagsmail succesvol verzonden naar ${user.email}`,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Kon geen test verjaardagsmail verzenden naar ${user.email}`,
        });
      }
    } catch (error) {
      console.error("Error sending test birthday email:", error);
      return res.status(500).json({ 
        success: false,
        message: "Fout bij versturen van test verjaardagsmail",
        error: (error as Error).message
      });
    }
  });
  
  // API Integration routes
  // Placeholder voor API routes die zouden communiceren met het plansysteem
  // Deze zouden in een echte applicatie worden geïmplementeerd met de juiste API credentials
  
  app.get("/api/integration/shifts/:userId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // In een echte app zouden we hier API calls maken naar het plansysteem
      // Voor nu retourneren we mock data
      return res.status(200).json({
        message: "Deze functionaliteit vereist integratie met het externe plansysteem",
        info: "Deze API endpoint zou shifts ophalen uit het externe plansysteem voor de specifieke gebruiker"
      });
    } catch (error) {
      console.error(`Error fetching shifts for user ${req.params.userId}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de shifts" });
    }
  });
  
  app.post("/api/integration/process-rules", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is verplicht" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Vraag de regels op
      const rules = await storage.getRules();
      const activeRules = rules.filter(rule => rule.isActive);
      
      const results = [];
      
      for (const rule of activeRules) {
        const { condition, type, pointsValue } = rule;
        let pointsToAward = 0;
        
        // Verwerk elke regel op basis van het type
        switch (type) {
          case 'fixed':
            // Kennen punten toe als aan de voorwaarde is voldaan
            pointsToAward = pointsValue;
            break;
            
          case 'multiplication':
            // Vermenigvuldig een waarde met het aantal punten
            const baseValue = 10; // In het echt zouden we dit ophalen uit de data van de gebruiker
            pointsToAward = baseValue * pointsValue;
            break;
            
          case 'custom':
            // Voor aangepaste formules: in het echt zouden we hier een evaluatielogica implementeren
            pointsToAward = Math.round(pointsValue * 1.5);
            break;
            
          default:
            break;
        }
        
        if (pointsToAward > 0) {
          // Maak een transactie aan voor de toegekende punten
          const transaction = await storage.createPointTransaction({
            userId: user.id,
            amount: pointsToAward,
            type: "earned",
            description: `Automatisch toegekend: ${rule.name}`,
            source: "rule_automation",
            sourceId: rule.id.toString(),
            metadata: { ruleType: [rule.type] }
          });
          
          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            pointsAwarded: pointsToAward,
            transactionId: transaction.id
          });
        }
      }
      
      return res.status(200).json({
        message: `${results.length} regels verwerkt, ${results.reduce((sum, r) => sum + r.pointsAwarded, 0)} punten toegekend`,
        processedRules: results
      });
    } catch (error) {
      console.error("Error processing rules:", error);
      return res.status(500).json({ message: "Fout bij het verwerken van de regels" });
    }
  });

  // Email Template routes
  app.get("/api/email-templates", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const templates = await storage.getEmailTemplates();
      return res.status(200).json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      return res.status(500).json({ message: "Fout bij het ophalen van e-mailsjablonen" });
    }
  });
  
  app.get("/api/email-templates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "E-mailsjabloon niet gevonden" });
      }
      
      return res.status(200).json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      return res.status(500).json({ message: "Fout bij het ophalen van het e-mailsjabloon" });
    }
  });
  
  app.get("/api/email-templates/type/:type", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      const templates = await storage.getEmailTemplatesByType(type);
      return res.status(200).json(templates);
    } catch (error) {
      console.error(`Error fetching ${req.params.type} email templates:`, error);
      return res.status(500).json({ message: "Fout bij het ophalen van e-mailsjablonen" });
    }
  });
  
  app.post("/api/email-templates", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const result = insertEmailTemplateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige gegevens",
          errors: result.error.errors
        });
      }
      
      const template = await storage.createEmailTemplate(result.data);
      
      return res.status(201).json({
        message: "E-mailsjabloon succesvol aangemaakt",
        template
      });
    } catch (error) {
      console.error("Error creating email template:", error);
      return res.status(500).json({ message: "Fout bij het aanmaken van het e-mailsjabloon" });
    }
  });
  
  app.put("/api/email-templates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const result = insertEmailTemplateSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige gegevens",
          errors: result.error.errors
        });
      }
      
      const updatedTemplate = await storage.updateEmailTemplate(templateId, result.data);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: "E-mailsjabloon niet gevonden" });
      }
      
      return res.status(200).json({
        message: "E-mailsjabloon succesvol bijgewerkt",
        template: updatedTemplate
      });
    } catch (error) {
      console.error("Error updating email template:", error);
      return res.status(500).json({ message: "Fout bij het bijwerken van het e-mailsjabloon" });
    }
  });
  
  app.delete("/api/email-templates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const success = await storage.deleteEmailTemplate(templateId);
      
      if (!success) {
        return res.status(404).json({ message: "E-mailsjabloon niet gevonden" });
      }
      
      return res.status(200).json({ message: "E-mailsjabloon succesvol verwijderd" });
    } catch (error) {
      console.error("Error deleting email template:", error);
      return res.status(500).json({ message: "Fout bij het verwijderen van het e-mailsjabloon" });
    }
  });
  
  // Campaign routes
  app.get("/api/campaigns", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const campaigns = await storage.getCampaigns();
      return res.status(200).json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return res.status(500).json({ message: "Fout bij het ophalen van campagnes" });
    }
  });
  
  app.get("/api/campaigns/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      
      return res.status(200).json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      return res.status(500).json({ message: "Fout bij het ophalen van de campagne" });
    }
  });
  
  app.post("/api/campaigns", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const result = insertCampaignSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige gegevens",
          errors: result.error.errors
        });
      }
      
      const campaign = await storage.createCampaign(result.data);
      
      return res.status(201).json({
        message: "Campagne succesvol aangemaakt",
        campaign
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      return res.status(500).json({ message: "Fout bij het aanmaken van de campagne" });
    }
  });
  
  app.put("/api/campaigns/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const result = insertCampaignSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ongeldige gegevens",
          errors: result.error.errors
        });
      }
      
      const updatedCampaign = await storage.updateCampaign(campaignId, result.data);
      
      if (!updatedCampaign) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      
      return res.status(200).json({
        message: "Campagne succesvol bijgewerkt",
        campaign: updatedCampaign
      });
    } catch (error) {
      console.error("Error updating campaign:", error);
      return res.status(500).json({ message: "Fout bij het bijwerken van de campagne" });
    }
  });
  
  app.put("/api/campaigns/:id/status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['draft', 'scheduled', 'sent', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Ongeldige status. Gebruik: draft, scheduled, sent, of cancelled" });
      }
      
      const updatedCampaign = await storage.updateCampaignStatus(campaignId, status);
      
      if (!updatedCampaign) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      
      return res.status(200).json({
        message: "Campagnestatus succesvol bijgewerkt",
        campaign: updatedCampaign
      });
    } catch (error) {
      console.error("Error updating campaign status:", error);
      return res.status(500).json({ message: "Fout bij het bijwerken van de campagnestatus" });
    }
  });
  
  app.post("/api/campaigns/:id/send", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      
      if (campaign.status === 'sent') {
        return res.status(400).json({ message: "Deze campagne is al verzonden" });
      }
      
      if (campaign.status === 'cancelled') {
        return res.status(400).json({ message: "Deze campagne is geannuleerd en kan niet worden verzonden" });
      }
      
      const success = await storage.sendCampaign(campaignId);
      
      if (!success) {
        return res.status(500).json({ message: "Fout bij het verzenden van de campagne" });
      }
      
      // Haal de bijgewerkte campagne op
      const updatedCampaign = await storage.getCampaign(campaignId);
      
      return res.status(200).json({
        message: "Campagne succesvol verzonden",
        campaign: updatedCampaign
      });
    } catch (error) {
      console.error("Error sending campaign:", error);
      return res.status(500).json({ message: "Fout bij het verzenden van de campagne" });
    }
  });
  
  app.delete("/api/campaigns/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const success = await storage.deleteCampaign(campaignId);
      
      if (!success) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      
      return res.status(200).json({ message: "Campagne succesvol verwijderd" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return res.status(500).json({ message: "Fout bij het verwijderen van de campagne" });
    }
  });

  // ----- Automation routes -----
  
  app.get("/api/automations", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const automations = await storage.getAutomations();
      return res.status(200).json(automations);
    } catch (error) {
      console.error("Error fetching automations:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het ophalen van automatiseringen" });
    }
  });

  app.get("/api/automations/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig automatisering ID" });
      }
      
      const automation = await storage.getAutomation(id);
      if (automation) {
        return res.status(200).json(automation);
      } else {
        return res.status(404).json({ message: "Automatisering niet gevonden" });
      }
    } catch (error) {
      console.error("Error fetching automation:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het ophalen van de automatisering" });
    }
  });

  app.post("/api/automations", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const newAutomation = req.body;
      const automation = await storage.createAutomation(newAutomation);
      return res.status(201).json(automation);
    } catch (error) {
      console.error("Error creating automation:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het aanmaken van de automatisering" });
    }
  });

  app.put("/api/automations/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig automatisering ID" });
      }
      
      const automationData = req.body;
      const automation = await storage.updateAutomation(id, automationData);
      if (automation) {
        return res.status(200).json(automation);
      } else {
        return res.status(404).json({ message: "Automatisering niet gevonden" });
      }
    } catch (error) {
      console.error("Error updating automation:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het bijwerken van de automatisering" });
    }
  });

  app.put("/api/automations/:id/status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig automatisering ID" });
      }
      
      const { status } = req.body;
      if (!status || !['active', 'inactive', 'draft'].includes(status)) {
        return res.status(400).json({ message: "Ongeldige status waarde" });
      }
      
      const automation = await storage.updateAutomationStatus(id, status);
      if (automation) {
        return res.status(200).json(automation);
      } else {
        return res.status(404).json({ message: "Automatisering niet gevonden" });
      }
    } catch (error) {
      console.error("Error updating automation status:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het bijwerken van de automatisering status" });
    }
  });

  app.delete("/api/automations/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig automatisering ID" });
      }
      
      const result = await storage.deleteAutomation(id);
      if (result) {
        return res.status(200).json({ message: "Automatisering succesvol verwijderd" });
      } else {
        return res.status(404).json({ message: "Automatisering niet gevonden" });
      }
    } catch (error) {
      console.error("Error deleting automation:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het verwijderen van de automatisering" });
    }
  });

  // Automation Trigger routes
  app.get("/api/automations/:automationId/triggers", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const automationId = parseInt(req.params.automationId);
      if (isNaN(automationId)) {
        return res.status(400).json({ message: "Ongeldig automatisering ID" });
      }
      
      const triggers = await storage.getAutomationTriggers(automationId);
      return res.status(200).json(triggers);
    } catch (error) {
      console.error("Error fetching automation triggers:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het ophalen van de automatisering triggers" });
    }
  });

  app.post("/api/automation-triggers", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const triggerData = req.body;
      const trigger = await storage.createAutomationTrigger(triggerData);
      return res.status(201).json(trigger);
    } catch (error) {
      console.error("Error creating automation trigger:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het aanmaken van de trigger" });
    }
  });

  app.put("/api/automation-triggers/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig trigger ID" });
      }
      
      const triggerData = req.body;
      const trigger = await storage.updateAutomationTrigger(id, triggerData);
      if (trigger) {
        return res.status(200).json(trigger);
      } else {
        return res.status(404).json({ message: "Trigger niet gevonden" });
      }
    } catch (error) {
      console.error("Error updating automation trigger:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het bijwerken van de trigger" });
    }
  });

  app.delete("/api/automation-triggers/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig trigger ID" });
      }
      
      const result = await storage.deleteAutomationTrigger(id);
      if (result) {
        return res.status(200).json({ message: "Trigger succesvol verwijderd" });
      } else {
        return res.status(404).json({ message: "Trigger niet gevonden" });
      }
    } catch (error) {
      console.error("Error deleting automation trigger:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het verwijderen van de trigger" });
    }
  });

  // Automation Action routes
  app.get("/api/automations/:automationId/actions", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const automationId = parseInt(req.params.automationId);
      if (isNaN(automationId)) {
        return res.status(400).json({ message: "Ongeldig automatisering ID" });
      }
      
      const actions = await storage.getAutomationActions(automationId);
      return res.status(200).json(actions);
    } catch (error) {
      console.error("Error fetching automation actions:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het ophalen van de automatisering acties" });
    }
  });

  app.post("/api/automation-actions", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const actionData = req.body;
      const action = await storage.createAutomationAction(actionData);
      return res.status(201).json(action);
    } catch (error) {
      console.error("Error creating automation action:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het aanmaken van de actie" });
    }
  });

  app.put("/api/automation-actions/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig actie ID" });
      }
      
      const actionData = req.body;
      const action = await storage.updateAutomationAction(id, actionData);
      if (action) {
        return res.status(200).json(action);
      } else {
        return res.status(404).json({ message: "Actie niet gevonden" });
      }
    } catch (error) {
      console.error("Error updating automation action:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het bijwerken van de actie" });
    }
  });

  app.delete("/api/automation-actions/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ongeldig actie ID" });
      }
      
      const result = await storage.deleteAutomationAction(id);
      if (result) {
        return res.status(200).json({ message: "Actie succesvol verwijderd" });
      } else {
        return res.status(404).json({ message: "Actie niet gevonden" });
      }
    } catch (error) {
      console.error("Error deleting automation action:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij het verwijderen van de actie" });
    }
  });

  // ----- Leaderboard routes -----
  
  // Get current month leaderboard based on user points (for testing purposes)
  app.get("/api/leaderboard", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get all active employees and use their total points as monthly points for demo
      const users = await storage.getUsers();
      const activeEmployees = users.filter(u => u.role === 'employee' && u.status === 'active');
      
      // Create leaderboard data using total points as monthly points
      const leaderboardData = activeEmployees.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        points: user.points, // Total points
        monthlyPoints: user.points, // Use total points as monthly points for demo
        role: user.role,
        status: user.status
      }));
      
      // Sort by monthly points (highest first) and add ranks
      leaderboardData.sort((a, b) => b.monthlyPoints - a.monthlyPoints);
      const leaderboard = leaderboardData.slice(0, 10).map((user, index) => ({
        ...user,
        rank: index + 1
      }));
      
      console.log('Leaderboard data:', leaderboard);
      
      return res.status(200).json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het ophalen van de ranglijst"
      });
    }
  });

  // Get previous month winner
  app.get("/api/leaderboard/previous-winner", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get start and end of previous month
      const now = new Date();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      
      // Get all point transactions for previous month (earned points only)
      const transactions = await storage.getPointTransactions();
      const prevMonthTransactions = transactions.filter(t => 
        t.type === 'earned' && 
        new Date(t.createdAt) >= startOfPrevMonth && 
        new Date(t.createdAt) <= endOfPrevMonth
      );
      
      // Calculate monthly points per user
      const userMonthlyPoints = new Map<number, number>();
      prevMonthTransactions.forEach(transaction => {
        const currentPoints = userMonthlyPoints.get(transaction.userId) || 0;
        userMonthlyPoints.set(transaction.userId, currentPoints + transaction.amount);
      });
      
      // Find user with most points
      let winnerId = null;
      let maxPoints = 0;
      
      Array.from(userMonthlyPoints.entries()).forEach(([userId, monthlyPoints]) => {
        if (monthlyPoints > maxPoints) {
          maxPoints = monthlyPoints;
          winnerId = userId;
        }
      });
      
      if (winnerId) {
        const winner = await storage.getUser(winnerId);
        if (winner && winner.role === 'employee') {
          return res.status(200).json({
            id: winner.id,
            firstName: winner.firstName,
            lastName: winner.lastName,
            email: winner.email,
            points: winner.points,
            monthlyPoints: maxPoints,
            role: winner.role,
            status: winner.status
          });
        }
      }
      
      return res.status(200).json(null);
    } catch (error) {
      console.error("Error fetching previous winner:", error);
      return res.status(500).json({
        message: "Er is een fout opgetreden bij het ophalen van de vorige winnaar"
      });
    }
  });

  // ----- Push Notification Routes -----
  
  // Get VAPID public key for client-side subscription
  app.get("/api/push/vapid-key", authMiddleware, async (req: Request, res: Response) => {
    try {
      const pushService = getPushNotificationService();
      if (!pushService) {
        return res.status(500).json({ message: "Push notification service niet beschikbaar" });
      }
      
      res.json({ 
        publicKey: pushService.getVapidPublicKey()
      });
    } catch (error) {
      console.error("Error getting VAPID key:", error);
      res.status(500).json({ message: "Fout bij ophalen VAPID key" });
    }
  });

  // Subscribe to push notifications
  app.post("/api/push/subscribe", authMiddleware, async (req: Request, res: Response) => {
    try {
      const pushService = getPushNotificationService();
      if (!pushService) {
        return res.status(500).json({ message: "Push notification service niet beschikbaar" });
      }

      const { endpoint, keys } = req.body;
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ message: "Ongeldige subscription data" });
      }

      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Niet ingelogd" });
      }

      // Save in memory
      pushService.subscribe(userId, { endpoint, keys });

      // Persist to DB (upsert by endpoint)
      console.log(`[PUSH DB] Saving subscription for user ${userId}, endpoint: ${endpoint.slice(0, 40)}...`);
      try {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
        await db.insert(pushSubscriptions).values({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth });
        const count = await db.select().from(pushSubscriptions);
        console.log(`[PUSH DB] Saved OK. Total rows in DB: ${count.length}`);
      } catch (dbErr) {
        console.error(`[PUSH DB] DB save FAILED:`, dbErr);
      }
      
      res.json({ message: "Push notifications ingeschakeld" });
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      res.status(500).json({ message: "Fout bij inschrijven voor push notifications" });
    }
  });

  // Subscribe to basic notifications (Safari fallback)
  app.post("/api/push/subscribe-basic", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { type, userAgent } = req.body;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Niet ingelogd" });
      }

      console.log(`Basic notification subscription for user ${userId}, type: ${type}, userAgent: ${userAgent}`);
      
      // Store basic notification preference (simplified for Safari)
      // For now, just acknowledge the subscription
      res.json({ message: "Basis notificaties ingeschakeld (Safari)" });
    } catch (error) {
      console.error("Error subscribing to basic notifications:", error);
      res.status(500).json({ message: "Fout bij inschrijven voor basis notificaties" });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", authMiddleware, async (req: Request, res: Response) => {
    try {
      const pushService = getPushNotificationService();
      if (!pushService) {
        return res.status(500).json({ message: "Push notification service niet beschikbaar" });
      }

      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint vereist" });
      }

      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Niet ingelogd" });
      }

      pushService.unsubscribe(userId, endpoint);

      // Remove from DB
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
      
      res.json({ message: "Push notifications uitgeschakeld" });
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      res.status(500).json({ message: "Fout bij uitschrijven van push notifications" });
    }
  });

  // Test notification (admin only)
  app.post("/api/push/test", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const pushService = getPushNotificationService();
      if (!pushService) {
        return res.status(500).json({ message: "Push notification service niet beschikbaar" });
      }

      const { userId, type = 'test' } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID vereist" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }

      // Send test notification based on type
      switch (type) {
        case 'achievement':
          await pushService.sendAchievementNotification(user, {
            title: 'Test Achievement',
            points: 100,
            type: 'milestone'
          });
          break;
        case 'challenge':
          await pushService.sendChallengeProgressNotification(user, {
            title: 'Test Challenge',
            currentStep: 2,
            totalSteps: 5,
            nextReward: 50
          });
          break;
        case 'leaderboard':
          await pushService.sendLeaderboardNotification(user, {
            current: 2,
            previous: 5,
            totalUsers: 10
          });
          break;
        default:
          await pushService.sendMotivationNotification(user, {
            type: 'daily',
            message: 'Dit is een test notificatie! Het push notification systeem werkt correct.'
          });
      }
      
      res.json({ message: `Test ${type} notificatie verzonden naar ${user.firstName}` });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Fout bij verzenden test notificatie" });
    }
  });



  const httpServer = createServer(app);
  
  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', function connection(ws, req) {
    console.log('Nieuwe WebSocket verbinding');
    
    // Store client info
    const clientInfo = {
      userId: null,
      userRole: null,
      authenticated: false
    };
    
    ws.on('message', function message(data) {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          // Simple authentication using userId and userRole from client
          if (message.userId && message.userRole) {
            clientInfo.userId = message.userId;
            clientInfo.userRole = message.userRole;
            clientInfo.authenticated = true;
            
            console.log(`WebSocket geauthenticeerd voor gebruiker ${clientInfo.userId}, rol: ${clientInfo.userRole}`);
            
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'WebSocket verbinding geauthenticeerd'
            }));
          }
        }
      } catch (error) {
        console.error('Fout bij verwerken WebSocket bericht:', error);
      }
    });
    
    ws.on('close', function close() {
      console.log('WebSocket verbinding gesloten');
    });
    
    // Store client info on the connection
    (ws as any).clientInfo = clientInfo;
  });
  
  // Broadcast notification function voor real-time synchronisatie
  const broadcastNotification = (type: string, notification: { message: string; data?: any }, targetUserId?: number, targetUserRole?: string) => {
    wss.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN && client.clientInfo?.authenticated) {
        const { userId, userRole } = client.clientInfo;
        
        // Stuur naar specifieke gebruiker, rol, of iedereen
        if (
          (!targetUserId && !targetUserRole) || 
          (targetUserId && userId === targetUserId) || 
          (targetUserRole && userRole === targetUserRole)
        ) {
          client.send(JSON.stringify({
            type,
            message: notification.message,
            timestamp: new Date().toISOString(),
            data: notification.data
          }));
        }
      }
    });
  };
  
  // Store broadcast function globally voor gebruik in routes
  (global as any).broadcastNotification = broadcastNotification;
  
  // =============================================================================
  // MARKETING API ROUTES
  // =============================================================================
  
  // Marketing Templates
  app.get("/api/admin/marketing/templates", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getMarketingTemplates();
      return res.json(templates);
    } catch (error) {
      console.error("Error fetching marketing templates:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van templates" });
    }
  });
  
  app.post("/api/admin/marketing/templates", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validatedData = insertMarketingTemplateSchema.parse(req.body);
      const createdBy = req.session?.userId || 1;
      const template = await storage.createMarketingTemplate({ ...validatedData, createdBy });
      return res.status(201).json(template);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error creating marketing template:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het maken van de template" });
    }
  });
  
  app.get("/api/admin/marketing/templates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getMarketingTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template niet gevonden" });
      }
      return res.json(template);
    } catch (error) {
      console.error("Error fetching marketing template:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de template" });
    }
  });
  
  app.put("/api/admin/marketing/templates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const validatedData = insertMarketingTemplateSchema.partial().parse(req.body);
      const updatedTemplate = await storage.updateMarketingTemplate(templateId, validatedData);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template niet gevonden" });
      }
      return res.json(updatedTemplate);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error updating marketing template:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de template" });
    }
  });
  
  app.delete("/api/admin/marketing/templates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);
      const deleted = await storage.deleteMarketingTemplate(templateId);
      if (!deleted) {
        return res.status(404).json({ message: "Template niet gevonden" });
      }
      return res.json({ message: "Template succesvol verwijderd" });
    } catch (error) {
      console.error("Error deleting marketing template:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de template" });
    }
  });
  
  // Marketing Campaigns
  app.get("/api/admin/marketing/campaigns", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getMarketingCampaigns();
      return res.json(campaigns);
    } catch (error) {
      console.error("Error fetching marketing campaigns:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van campagnes" });
    }
  });
  
  app.post("/api/admin/marketing/campaigns", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validatedData = insertMarketingCampaignSchema.parse(req.body);
      const createdBy = req.session?.userId || 1;
      const campaign = await storage.createMarketingCampaign({ ...validatedData, createdBy });
      return res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error creating marketing campaign:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het maken van de campagne" });
    }
  });
  
  app.get("/api/admin/marketing/campaigns/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getMarketingCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      return res.json(campaign);
    } catch (error) {
      console.error("Error fetching marketing campaign:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de campagne" });
    }
  });
  
  app.put("/api/admin/marketing/campaigns/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const validatedData = insertMarketingCampaignSchema.partial().parse(req.body);
      const updatedCampaign = await storage.updateMarketingCampaign(campaignId, validatedData);
      if (!updatedCampaign) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      return res.json(updatedCampaign);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error updating marketing campaign:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de campagne" });
    }
  });
  
  app.delete("/api/admin/marketing/campaigns/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const deleted = await storage.deleteMarketingCampaign(campaignId);
      if (!deleted) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      return res.json({ message: "Campagne succesvol verwijderd" });
    } catch (error) {
      console.error("Error deleting marketing campaign:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de campagne" });
    }
  });
  
  // Send Marketing Campaign
  app.post("/api/admin/marketing/campaigns/:id/send", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const success = await storage.sendMarketingCampaign(campaignId);
      if (!success) {
        return res.status(404).json({ message: "Campagne niet gevonden" });
      }
      return res.json({ message: "Campagne succesvol verzonden" });
    } catch (error) {
      console.error("Error sending marketing campaign:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verzenden van de campagne" });
    }
  });
  
  // Marketing Campaign Recipients
  app.get("/api/admin/marketing/campaigns/:id/recipients", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const recipients = await storage.getMarketingCampaignRecipients(campaignId);
      return res.json(recipients);
    } catch (error) {
      console.error("Error fetching campaign recipients:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van ontvangers" });
    }
  });
  
  app.post("/api/admin/marketing/campaigns/:id/recipients", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const validatedData = insertMarketingCampaignRecipientSchema.parse({
        ...req.body,
        campaignId
      });
      const recipient = await storage.createMarketingCampaignRecipient(validatedData);
      return res.status(201).json(recipient);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error creating campaign recipient:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het toevoegen van een ontvanger" });
    }
  });
  
  // Marketing Campaign Analytics
  app.get("/api/admin/marketing/campaigns/:id/analytics", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const recipients = await storage.getMarketingCampaignRecipients(campaignId);
      const clicks = await storage.getMarketingCampaignClicks(campaignId);
      
      const analytics = {
        totalRecipients: recipients.length,
        sent: recipients.filter(r => r.status === 'sent').length,
        delivered: recipients.filter(r => r.status === 'delivered').length,
        opened: recipients.filter(r => r.status === 'opened').length,
        clicked: recipients.filter(r => r.status === 'clicked').length,
        bounced: recipients.filter(r => r.status === 'bounced').length,
        failed: recipients.filter(r => r.status === 'failed').length,
        totalClicks: clicks.length,
        uniqueClicks: new Set(clicks.map(c => c.recipientId)).size
      };
      
      return res.json(analytics);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van analytics" });
    }
  });
  






  // Employee app mockup route (mobiele app design - simpele versie)
  app.get("/employee-app", async (req: Request, res: Response) => {
    const fs = await import('fs');
    const path = await import('path');
    const appPath = path.join(process.cwd(), 'dashboard-mockup', 'employee-app.html');
    
    try {
      const html = fs.readFileSync(appPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(404).send('Employee app niet gevonden');
    }
  });

  // Employee app V1 - drukke versie met animaties
  app.get("/employee-app-v1", async (req: Request, res: Response) => {
    const fs = await import('fs');
    const path = await import('path');
    const appPath = path.join(process.cwd(), 'dashboard-mockup', 'employee-app-v1.html');
    
    try {
      const html = fs.readFileSync(appPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(404).send('Employee app V1 niet gevonden');
    }
  });

  // ==========================================
  // PUBLIC CANDIDATE REGISTRATION (Aanmeldflow)
  // ==========================================

  app.post("/api/aanmelden", registrationLimiter, async (req: Request, res: Response) => {
    try {
      const publicRegistrationSchema = z.object({
        firstName: z.string().min(1, "Voornaam is verplicht"),
        lastName: z.string().min(1, "Achternaam is verplicht"),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        birthDate: z.string().optional().nullable(),
        nationality: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        language: z.string().optional().nullable(),
        functionType: z.enum(["housekeeping", "horecamedewerker", "chef", "frontoffice", "logistiek"]),
        horecaExperience: z.string().optional().nullable(),
        needsTwv: z.boolean().optional().default(false),
        interviewDate: z.string().optional().nullable(),
        interviewTime: z.string().optional().nullable(),
        sourceChannel: z.string().optional().default("Website"),
        notes: z.string().optional().nullable(),
        status: z.enum(["in_behandeling", "aangenomen", "afgewezen"]).optional().default("in_behandeling"),
        partial: z.boolean().optional().default(false),
      });

      const validated = publicRegistrationSchema.parse(req.body);

      // Duplicate check: sla over voor @doehetextra.nl zodat testers opnieuw kunnen aanmelden
      const isTestEmail = validated.email?.toLowerCase().endsWith('@doehetextra.nl') ?? false;
      if (validated.email && !isTestEmail) {
        const existingByEmail = await db.select({ id: candidatesTable.id })
          .from(candidatesTable)
          .where(eq(candidatesTable.email, validated.email))
          .limit(1);
        if (existingByEmail.length > 0) {
          return res.status(200).json({
            id: existingByEmail[0].id,
            message: "Bestaande aanmelding gevonden"
          });
        }
      }

      const candidate = await storage.createCandidate({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        birthDate: validated.birthDate || null,
        nationality: validated.nationality || null,
        city: validated.city || null,
        language: validated.language || null,
        functionType: validated.functionType,
        horecaExperience: validated.horecaExperience || null,
        needsTwv: validated.needsTwv || false,
        twvStatus: validated.needsTwv ? 'twv_nodig' : null,
        interviewDate: validated.interviewDate || null,
        interviewTime: validated.interviewTime || null,
        sourceChannel: validated.sourceChannel || "Website",
        notes: validated.notes || null,
        status: validated.status || "in_behandeling",
        retentionUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      } as any);

      await storage.createCandidateAuditLog({
        candidateId: candidate.id,
        action: 'created',
        changedByUserId: null,
        changeData: { description: validated.partial ? 'Kandidaat deels aangemeld (stap 1)' : 'Kandidaat via aanmeldflow op website', status: validated.status },
        ipAddress: req.ip ?? null
      });

      // Genereer cvUploadToken voor partial aanmeldingen zodat de email link direct werkt
      if (validated.partial) {
        const cvToken = randomUUID();
        await storage.updateCandidate(candidate.id, { cvUploadToken: cvToken } as any);
        (candidate as any).cvUploadToken = cvToken;
      }

      // Stuur bevestigingsmail alleen bij voltooide aanmelding met CV
      if (!validated.partial && validated.status !== 'afgewezen' && candidate.hasCv) {
        sendCandidateConfirmationEmail({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          functionType: candidate.functionType,
          nationality: candidate.nationality,
          language: candidate.language,
          interviewDate: candidate.interviewDate,
          interviewTime: candidate.interviewTime,
        }).then((sent) => {
          if (sent) {
            console.log(`Bevestigingsmail verstuurd naar ${candidate.email}`);
          } else {
            console.warn(`Bevestigingsmail NIET verstuurd naar ${candidate.email}`);
          }
        }).catch((err) => {
          console.error("Fout bij versturen bevestigingsmail:", err);
        });
      }

      // Admin-notificatie: met CV (met knoppen) of zonder CV (alleen melding)
      if (!validated.partial && validated.status !== 'afgewezen') {
        (async () => {
          try {
            const requestBaseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
            if (candidate.hasCv) {
              const token = randomUUID();
              await storage.updateCandidate(candidate.id, {
                reviewToken: token,
                reviewTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              } as any);
              const sent = await sendAdminCandidateNotificationEmail({
                id: candidate.id,
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                functionType: candidate.functionType,
                city: candidate.city,
                email: candidate.email,
                birthDate: candidate.birthDate,
                phone: candidate.phone,
                nationality: candidate.nationality,
                cvFilename: candidate.cvFilename,
                reviewToken: token,
                baseUrl: requestBaseUrl,
                sourceChannel: (candidate as any).sourceChannel,
              });
              console.log(`Admin-notificatiemail met CV (POST) ${sent ? 'verstuurd' : 'NIET verstuurd'}`);
            } else {
              const sent = await sendAdminCandidateNoCvEmail({
                id: candidate.id,
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                functionType: candidate.functionType,
                city: candidate.city,
                email: candidate.email,
                birthDate: candidate.birthDate,
                phone: candidate.phone,
                nationality: candidate.nationality,
                baseUrl: requestBaseUrl,
                sourceChannel: (candidate as any).sourceChannel,
              });
              console.log(`Admin-notificatiemail zonder CV (POST) ${sent ? 'verstuurd' : 'NIET verstuurd'}`);
            }
          } catch (err) {
            console.error("Fout bij versturen admin-notificatiemail:", err);
          }
        })();
      }

      // Notify admins on complete submission (not partial)
      if (!validated.partial) {
        try {
          const allUsers = await storage.getUsers();
          const adminUserIds = allUsers.filter((u: any) => u.role === 'admin').map((u: any) => u.id);
          const candidateName = `${candidate.firstName} ${candidate.lastName}`;

          const pushService = getPushNotificationService();
          console.log(`[PUSH] adminUserIds: ${JSON.stringify(adminUserIds)}, pushService: ${!!pushService}`);
          if (pushService && adminUserIds.length > 0) {
            try {
              await pushService.sendNewCandidateAlert(adminUserIds, candidateName, candidate.functionType, candidate.id);
              console.log(`[PUSH] sendNewCandidateAlert voltooid voor ${adminUserIds}`);
            } catch (pushErr) {
              console.error('[PUSH] sendNewCandidateAlert fout:', pushErr);
            }
          } else {
            console.warn(`[PUSH] Geen push verstuurd: pushService=${!!pushService}, admins=${adminUserIds.length}`);
          }

          if (typeof (global as any).broadcastNotification === 'function') {
            (global as any).broadcastNotification(
              'new_candidate',
              {
                message: `📋 Nieuwe aanmelding: ${candidateName} (${candidate.functionType})`,
                data: { candidateId: candidate.id, functionType: candidate.functionType, name: candidateName },
              },
              undefined,
              'admin'
            );
          }
        } catch (notifErr) {
          console.error('Fout bij versturen aanmelding-notificatie:', notifErr);
        }

        // Admin notificatie in DB opslaan
        storage.createAdminNotification({
          type: 'new_candidate',
          title: 'Nieuwe aanmelding',
          message: `${candidate.firstName} ${candidate.lastName} heeft zich aangemeld als ${candidate.functionType}${candidate.city ? ` (${candidate.city})` : ''}.`,
          link: '/dashboard?tab=kandidaten',
          candidateId: candidate.id,
        }).catch((e: any) => console.error('[Notif] Fout bij aanmelding-notificatie:', e));
      }

      // Stuur voltooide aanmelding door naar Jaicob.ai (alleen bij niet-partial, niet-afgewezen)
      if (!validated.partial && validated.status !== 'afgewezen') {
        sendJaicobWebhook({
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          city: candidate.city,
          birthDate: candidate.birthDate,
          nationality: candidate.nationality,
          functionType: candidate.functionType,
          experience: (candidate as any).horecaExperience,
          dutchLevel: (candidate as any).dutchLevel,
          englishLevel: (candidate as any).englishLevel,
          sourceChannel: (candidate as any).sourceChannel,
        }).catch(err => console.error('[Jaicob] Fout na aanmelding:', err));
      }

      return res.status(201).json({ id: candidate.id, message: "Aanmelding ontvangen" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error in public candidate registration:", error);
      return res.status(500).json({ message: "Er is iets misgegaan" });
    }
  });

  // Public PATCH: update kandidaat na gedeeltelijke save (beveiligd via email + id)
  app.patch("/api/aanmelden/:id", registrationLimiter, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });

      const updateSchema = z.object({
        email: z.string().email(),
        status: z.enum(["in_behandeling", "aangenomen", "afgewezen"]).optional(),
        language: z.string().optional().nullable(),
        horecaExperience: z.string().optional().nullable(),
        needsTwv: z.boolean().optional(),
        interviewDate: z.string().optional().nullable(),
        interviewTime: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        rejectionReason: z.string().optional().nullable(),
        partial: z.boolean().optional().default(false),
      });

      const validated = updateSchema.parse(req.body);

      const existing = await storage.getCandidate(id);
      if (!existing) return res.status(404).json({ message: "Kandidaat niet gevonden" });
      if (existing.email !== validated.email) return res.status(403).json({ message: "Geen toegang" });

      const updateData: Record<string, any> = {};
      if (validated.status) updateData.status = validated.status;
      if (validated.language !== undefined) updateData.language = validated.language;
      if (validated.horecaExperience !== undefined) updateData.horecaExperience = validated.horecaExperience;
      if (validated.needsTwv !== undefined) updateData.needsTwv = validated.needsTwv;
      if (validated.interviewDate !== undefined) updateData.interviewDate = validated.interviewDate;
      if (validated.interviewTime !== undefined) updateData.interviewTime = validated.interviewTime;
      if (validated.notes !== undefined) updateData.notes = validated.notes;

      const updated = await storage.updateCandidate(id, updateData);

      await storage.createCandidateAuditLog({
        candidateId: id,
        action: 'updated',
        changedByUserId: null,
        changeData: { description: validated.status === 'afgewezen' ? `Afgewezen: ${validated.rejectionReason || 'onbekend'}` : 'Kandidaat bijgewerkt via aanmeldflow', ...updateData },
        ipAddress: req.ip ?? null
      });

      // Stuur bevestigingsmail en push notificatie bij voltooiing — alleen als er ook een CV is
      if (!validated.partial && validated.status !== 'afgewezen' && updated?.email) {
        const requestBaseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        if (updated.hasCv) {
          // Met CV: stuur bevestigingsmail naar kandidaat + volledige admin-mail met accept/afwijs knoppen
          sendCandidateConfirmationEmail({
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: updated.email,
            functionType: updated.functionType,
            nationality: updated.nationality,
            language: updated.language,
            interviewDate: updated.interviewDate,
            interviewTime: updated.interviewTime,
          }).catch((err) => console.error("Fout bij versturen bevestigingsmail:", err));

          (async () => {
            try {
              let token = (updated as any).reviewToken;
              if (!token) {
                token = randomUUID();
                await storage.updateCandidate(updated.id, {
                  reviewToken: token,
                  reviewTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                } as any);
              }
              const sent = await sendAdminCandidateNotificationEmail({
                id: updated.id,
                firstName: updated.firstName,
                lastName: updated.lastName,
                functionType: updated.functionType,
                city: updated.city,
                email: updated.email,
                birthDate: updated.birthDate,
                phone: updated.phone,
                nationality: updated.nationality,
                cvFilename: (updated as any).cvFilename,
                reviewToken: token,
                baseUrl: requestBaseUrl,
                sourceChannel: (updated as any).sourceChannel,
              });
              console.log(`Admin-notificatiemail met CV (PUT) ${sent ? 'verstuurd' : 'NIET verstuurd'}`);
            } catch (err) {
              console.error("Fout bij versturen admin-notificatiemail:", err);
            }
          })();
        } else {
          // Zonder CV: stuur admin-mail alleen als de cv-reminder die nog niet al heeft verstuurd
          // (de cv-reminder werkt als vangnet en verstuurt de admin-mail ook — vermijd dubbele mail)
          (async () => {
            try {
              const freshCandidate = await storage.getCandidate(updated.id);
              const alreadyNotifiedViaCvReminder = !!(freshCandidate as any)?.cvReminderSentAt;
              if (alreadyNotifiedViaCvReminder) {
                console.log(`Admin-notificatiemail zonder CV (PUT) overgeslagen — al verstuurd via cv-reminder`);
                return;
              }
              const sent = await sendAdminCandidateNoCvEmail({
                id: updated.id,
                firstName: updated.firstName,
                lastName: updated.lastName,
                functionType: updated.functionType,
                city: updated.city,
                email: updated.email,
                birthDate: updated.birthDate,
                phone: updated.phone,
                nationality: updated.nationality,
                baseUrl: requestBaseUrl,
                sourceChannel: (updated as any).sourceChannel,
              });
              console.log(`Admin-notificatiemail zonder CV (PUT) ${sent ? 'verstuurd' : 'NIET verstuurd'}`);
            } catch (err) {
              console.error("Fout bij versturen admin-notificatiemail (geen CV):", err);
            }
          })();
        }

        // Push notification to admins
        try {
          const allUsers = await storage.getUsers();
          const adminUserIds = allUsers.filter((u: any) => u.role === 'admin').map((u: any) => u.id);
          const candidateName = `${updated.firstName} ${updated.lastName}`;
          const pushService = getPushNotificationService();
          if (pushService && adminUserIds.length > 0) {
            await pushService.sendNewCandidateAlert(adminUserIds, candidateName, updated.functionType || 'onbekend', id);
          }
          if (typeof (global as any).broadcastNotification === 'function') {
            (global as any).broadcastNotification(
              'new_candidate',
              { message: `📋 Nieuwe aanmelding: ${candidateName}`, data: { candidateId: id } },
              undefined, 'admin'
            );
          }
        } catch (notifErr) {
          console.error('[PUSH PATCH] Fout bij push notificatie:', notifErr);
        }
      }

      return res.status(200).json({ id, message: "Kandidaat bijgewerkt" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error updating candidate:", error);
      return res.status(500).json({ message: "Er is iets misgegaan" });

    }
  });

  // Stuur cv-upload eerste e-mail voor kandidaat zonder cv
  app.post("/api/aanmelden/:id/cv-reminder", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      let candidate = await storage.getCandidate(id);
      if (!candidate || !candidate.email) return res.status(404).json({ message: "Kandidaat niet gevonden" });
      if (candidate.hasCv) return res.status(200).json({ message: "Kandidaat heeft al een cv" });

      // Genereer cvUploadToken als die nog niet bestaat
      if (!(candidate as any).cvUploadToken) {
        const cvToken = randomUUID();
        await storage.updateCandidate(id, { cvUploadToken: cvToken } as any);
        candidate = await storage.getCandidate(id) as any;
      }

      sendCvUploadFirstEmail({
        firstName: candidate.firstName,
        email: candidate.email,
        id,
        cvUploadToken: (candidate as any).cvUploadToken,
        baseUrl: process.env.BASE_URL || `${req.protocol}://${req.get('host')}`,
      }).catch(console.error);

      // Stuur ook de admin-notificatiemail als die nog niet eerder verstuurd is
      // (vangnet als de PATCH /api/aanmelden/:id de server niet bereikte, bv. bij herstart)
      const alreadyNotified = !!(candidate as any).cvReminderSentAt;
      if (!alreadyNotified) {
        const requestBaseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        sendAdminCandidateNoCvEmail({
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          functionType: candidate.functionType,
          city: candidate.city,
          email: candidate.email,
          birthDate: candidate.birthDate,
          phone: candidate.phone,
          nationality: candidate.nationality,
          baseUrl: requestBaseUrl,
          sourceChannel: (candidate as any).sourceChannel,
        }).then(sent => {
          console.log(`[CV-reminder] Admin-notificatiemail (geen CV) ${sent ? 'verstuurd' : 'NIET verstuurd'} voor kandidaat ${id}`);
        }).catch(err => console.error('[CV-reminder] Fout bij admin-notificatiemail:', err));
      }

      await storage.updateCandidate(id, { cvReminderSentAt: new Date() });
      return res.status(200).json({ message: "Cv-reminder verstuurd" });
    } catch (error) {
      console.error("Fout bij cv-reminder:", error);
      return res.status(500).json({ message: "Er is iets misgegaan" });
    }
  });

  // Calendly webhook: detecteer ingeplande en geannuleerde gesprekken
  app.post("/api/webhooks/calendly", async (req: Request, res: Response) => {
    try {
      const { event, payload } = req.body;

      // Verify signing key if configured
      const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
      if (signingKey) {
        const signature = req.headers['calendly-webhook-signature'] as string;
        if (!signature) {
          return res.status(401).json({ message: "Ontbrekende handtekening" });
        }
        // Calendly uses HMAC-SHA256 with the raw body — skip verification if body already parsed
        // For production, use raw body middleware to verify properly
      }

      // Calendly sends invitee.created and invitee.canceled
      if (event !== "invitee.created" && event !== "invitee.canceled") {
        return res.status(200).json({ message: "Event genegeerd" });
      }

      // Calendly v1/v2 payload structure: payload.invitee.email or payload.email (fallback)
      const inviteeEmail: string | undefined =
        payload?.invitee?.email ||
        payload?.email;

      // Start time can be in multiple places depending on Calendly version
      const eventStartTime: string | undefined =
        payload?.scheduled_event?.start_time ||
        payload?.event?.start_time ||
        payload?.start_time;

      if (!inviteeEmail) {
        console.warn("Calendly webhook: geen email in payload", JSON.stringify(payload).slice(0, 200));
        return res.status(200).json({ message: "Geen email in payload, webhook ontvangen" });
      }

      // Find candidate by email (case-insensitive)
      const { candidates: allCandidates } = await storage.getCandidates({ search: inviteeEmail });
      const candidate = allCandidates.find((c: any) =>
        c.email?.toLowerCase() === inviteeEmail.toLowerCase()
      );

      if (!candidate) {
        console.log(`Calendly webhook: geen kandidaat gevonden voor ${inviteeEmail}`);
        return res.status(200).json({ message: "Geen kandidaat gevonden, webhook ontvangen" });
      }

      if (event === "invitee.canceled") {
        // Remove interview date when appointment is canceled
        await storage.updateCandidate(candidate.id, {
          interviewDate: null as any,
          interviewTime: null as any,
        });
        await storage.createCandidateAuditLog({
          candidateId: candidate.id,
          action: 'updated',
          changedByUserId: null,
          changeData: { description: `Gesprek geannuleerd via Calendly` },
          ipAddress: req.ip ?? null
        });
        console.log(`Calendly: gesprek geannuleerd voor ${inviteeEmail}`);
        return res.status(200).json({ message: "Gesprek verwijderd" });
      }

      // invitee.created: set interview date and time
      if (!eventStartTime) {
        console.warn("Calendly webhook: geen starttijd in payload", JSON.stringify(payload).slice(0, 200));
        return res.status(200).json({ message: "Geen starttijd in payload" });
      }

      // Parse the ISO date string and convert to Amsterdam local time (Europe/Amsterdam)
      const eventDate = new Date(eventStartTime);
      const interviewDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(eventDate);
      const interviewTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hour12: false }).format(eventDate);

      const inviteeName: string = payload?.invitee?.name || payload?.name || '';
      const eventName: string = payload?.event_type?.name || payload?.scheduled_event?.name || 'Intakegesprek';

      await storage.updateCandidate(candidate.id, { interviewDate, interviewTime });

      await storage.createCandidateAuditLog({
        candidateId: candidate.id,
        action: 'interview_scheduled',
        changedByUserId: null,
        changeData: {
          description: `Gesprek ingepland via Calendly: ${eventName} op ${interviewDate} ${interviewTime}`,
          interviewDate,
          interviewTime,
          inviteeName,
          eventName,
        },
        ipAddress: req.ip ?? null
      });

      console.log(`Calendly: gesprek ingepland voor ${inviteeEmail} (${inviteeName}) op ${interviewDate} ${interviewTime}`);
      return res.status(200).json({ message: "Gesprek bijgewerkt", interviewDate, interviewTime });
    } catch (error) {
      console.error("Calendly webhook fout:", error);
      return res.status(500).json({ message: "Er is iets misgegaan" });
    }
  });

  // Tijdelijke email preview route
  app.get("/api/email-preview/kandidaat", (req: Request, res: Response) => {
    const firstName = (req.query.naam as string) || "Sophie";
    const lastName = (req.query.achternaam as string) || "van den Berg";
    const functionType = (req.query.functie as string) || "horecamedewerker";
    const taal = (req.query.taal as string) || "nl";
    const useEnglish = taal === "en";

    const fullName = `${firstName} ${lastName}`;
    const functionLabels: Record<string, string> = {
      housekeeping: "Housekeeping medewerker",
      horecamedewerker: "Horecamedewerker",
      chef: "Chef / Kok",
      frontoffice: "Front office medewerker",
    };
    const functionLabel = functionLabels[functionType] || functionType;

    const CALENDLY_URL = "https://calendly.com/max-_zs/30min";
    const WHATSAPP_URL = "https://wa.me/31854012373";
    const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Je aanmelding is binnen – EXTRA</title></head>
<body style="margin:0;padding:0;background:#f0eff5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 4px 24px rgba(30,10,70,0.10);">
        <tr>
          <td height="200" style="padding:0;overflow:hidden;background:#1a0a3e;">
            <div style="position:relative;overflow:hidden;height:200px;width:600px;background:linear-gradient(135deg, #2e1065 0%, #1a0a3e 48%, #1e1b4b 100%);">
              <div style="position:absolute;top:-60px;left:50%;width:340px;height:280px;margin-left:-170px;background:radial-gradient(ellipse at center, rgba(120,40,210,0.22) 0%, rgba(30,10,80,0) 70%);border-radius:50%;"></div>
              <span style="position:absolute;top:-28px;left:-22px;font-size:170px;font-weight:900;color:rgba(255,255,255,0.055);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-8px;">X</span>
              <span style="position:absolute;bottom:-55px;right:-18px;font-size:195px;font-weight:900;color:rgba(255,255,255,0.055);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-8px;">X</span>
              <span style="position:absolute;top:8px;right:110px;font-size:105px;font-weight:900;color:rgba(255,255,255,0.04);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-4px;">X</span>
              <span style="position:absolute;bottom:2px;left:155px;font-size:88px;font-weight:900;color:rgba(255,255,255,0.038);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-3px;">X</span>
              <span style="position:absolute;top:-14px;left:300px;font-size:76px;font-weight:900;color:rgba(255,255,255,0.032);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-3px;">X</span>
              <span style="position:absolute;bottom:20px;right:270px;font-size:60px;font-weight:900;color:rgba(255,255,255,0.03);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-2px;">X</span>
              <table width="600" height="200" cellpadding="0" cellspacing="0" style="position:absolute;top:0;left:0;">
                <tr><td align="center" valign="middle" style="padding:0;">
                  <span style="font-size:58px;font-weight:900;color:#ffffff;letter-spacing:-2px;font-family:'Arial Black',Arial,sans-serif;line-height:1;display:block;">EXTRA</span>
                </td></tr>
              </table>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 44px 12px;">
            ${useEnglish ? `
            <p style="margin:0 0 20px 0;font-size:17px;color:#1a0a3e;line-height:1.7;">Hi ${firstName},</p>
            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.75;">Great that you've signed up with EXTRA — happy to have you on board! ⚡</p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.75;">We always love meeting new people who are ready to get to work.</p>
            <div style="background:#f5f3ff;border-radius:12px;padding:24px 28px;margin-bottom:28px;border:1px solid #ede9fe;">
              <p style="margin:0 0 10px 0;font-size:16px;color:#1a0a3e;font-weight:700;line-height:1.5;">Haven't scheduled your introduction yet?</p>
              <p style="margin:0 0 18px 0;font-size:15px;color:#4b5563;line-height:1.65;">Book your slot here:</p>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="border-radius:50px;background:#2e1065;padding-right:12px;">
                  <a href="${CALENDLY_URL}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.2px;">Schedule a meeting →</a>
                </td>
                <td style="border-radius:50px;background:#25d366;">
                  <a href="${WHATSAPP_URL}" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.2px;">💬 WhatsApp</a>
                </td>
              </tr></table>
            </div>
            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.75;">You're welcome to visit us at <strong>Herengracht 372</strong> in Amsterdam.</p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.75;">Can't make it? No worries — <a href="${CALENDLY_URL}" style="color:#6d28d9;font-weight:600;text-decoration:none;">reschedule your appointment</a> so we can plan someone else in.</p>
            <p style="margin:0 0 32px 0;font-size:16px;color:#374151;line-height:1.75;">Looking forward to meeting you. See you soon! 🙌</p>
            <p style="margin:0;font-size:16px;color:#374151;line-height:1.75;">Best regards,<br><strong style="color:#1a0a3e;">Team EXTRA</strong></p>
            ` : `
            <p style="margin:0 0 20px 0;font-size:17px;color:#1a0a3e;line-height:1.7;">Hi ${firstName},</p>
            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.75;">Top dat je je hebt aangemeld bij EXTRA, mooi dat je erbij wil horen! ⚡</p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.75;">We vinden het altijd leuk om nieuwe mensen te ontmoeten die zin hebben om lekker aan de slag te gaan.</p>
            <div style="background:#f5f3ff;border-radius:12px;padding:24px 28px;margin-bottom:28px;border:1px solid #ede9fe;">
              <p style="margin:0 0 10px 0;font-size:16px;color:#1a0a3e;font-weight:700;line-height:1.5;">Heb je nog geen datum ingepland voor je kennismaking?</p>
              <p style="margin:0 0 18px 0;font-size:15px;color:#4b5563;line-height:1.65;">Plan 'm dan hier in:</p>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="border-radius:50px;background:#2e1065;padding-right:12px;">
                  <a href="${CALENDLY_URL}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.2px;">Afspraak inplannen →</a>
                </td>
                <td style="border-radius:50px;background:#25d366;">
                  <a href="${WHATSAPP_URL}" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.2px;">💬 WhatsApp</a>
                </td>
              </tr></table>
            </div>
            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.75;">Je bent welkom bij ons op <strong>Herengracht 372</strong> in Amsterdam.</p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.75;">Kun je toch niet? No stress, <a href="${CALENDLY_URL}" style="color:#6d28d9;font-weight:600;text-decoration:none;">pas je afspraak even aan</a> zodat we iemand anders kunnen inplannen.</p>
            <p style="margin:0 0 32px 0;font-size:16px;color:#374151;line-height:1.75;">We kijken ernaar uit om je te ontmoeten. Tot snel! 🙌</p>
            <p style="margin:0;font-size:16px;color:#374151;line-height:1.75;">Groet,<br><strong style="color:#1a0a3e;">Team EXTRA</strong></p>
            `}
          </td>
        </tr>
        <tr>
          <td style="padding:28px 44px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">${useEnglish
              ? `This is an automated email. For questions, contact us at <a href="mailto:max@doehetextra.nl" style="color:#6d28d9;text-decoration:none;">max@doehetextra.nl</a>.`
              : `Dit is een automatisch gegenereerde e-mail. Neem voor vragen contact op via <a href="mailto:max@doehetextra.nl" style="color:#6d28d9;text-decoration:none;">max@doehetextra.nl</a>.`
            }</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  const cvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC and DOCX files are allowed'));
      }
    }
  });

  app.post("/api/aanmelden/cv", cvUpload.single('cv'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const publicUrl = await uploadCvToSupabase(file.buffer, file.mimetype, file.originalname);

      const candidateId = req.body?.candidateId ? parseInt(req.body.candidateId) : null;
      if (candidateId && !isNaN(candidateId)) {
        try {
          await storage.updateCandidate(candidateId, { hasCv: true, cvFilename: publicUrl });
          // Admin notificatie
          const cand = await storage.getCandidate(candidateId);
          if (cand) {
            storage.createAdminNotification({
              type: 'cv_uploaded',
              title: 'CV ontvangen',
              message: `${cand.firstName} ${cand.lastName} heeft een CV geüpload.`,
              link: '/dashboard?tab=kandidaten',
              candidateId: cand.id,
            }).catch((e: any) => console.error('[Notif] CV-notificatie fout:', e));
          }
        } catch (err) {
          console.error("Fout bij markeren hasCv:", err);
        }
      }

      return res.json({ message: "CV uploaded", filename: publicUrl });
    } catch (error) {
      console.error("Error uploading CV:", error);
      return res.status(500).json({ message: "Upload failed" });
    }
  });

  // Directe CV upload via token-link vanuit email
  app.post("/api/cv-upload-token", cvUpload.single('cv'), async (req: Request, res: Response) => {
    try {
      const token = req.body?.token || req.query?.token as string;
      if (!token) return res.status(400).json({ message: "Token ontbreekt" });

      const file = req.file;
      if (!file) return res.status(400).json({ message: "Geen bestand ontvangen" });

      // Zoek kandidaat op token via directe DB query
      const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.cvUploadToken, token)).limit(1);
      if (!candidate) return res.status(404).json({ message: "Ongeldige of verlopen upload-link" });
      if (candidate.hasCv) return res.status(400).json({ message: "CV al ontvangen" });

      const publicUrl = await uploadCvToSupabase(file.buffer, file.mimetype, file.originalname);

      // Sla CV op en wis het token (eenmalig gebruik)
      await storage.updateCandidate(candidate.id, {
        hasCv: true,
        cvFilename: publicUrl,
        cvUploadToken: null,
      } as any);

      await storage.createCandidateAuditLog({
        candidateId: candidate.id,
        action: 'updated',
        changedByUserId: null,
        changeData: { description: `CV geüpload via directe e-mail link: ${publicUrl}` },
        ipAddress: req.ip ?? null,
      });

      // Haal bijgewerkte kandidaat op voor de admin-notificatiemail
      const updated = await storage.getCandidate(candidate.id);
      if (!updated) return res.status(500).json({ message: "Fout bij ophalen kandidaat" });

      // Admin notificatie: CV ontvangen via e-mail link
      storage.createAdminNotification({
        type: 'cv_uploaded',
        title: 'CV ontvangen',
        message: `${updated.firstName} ${updated.lastName} heeft een CV geüpload via de e-mail link.`,
        link: '/dashboard?tab=kandidaten',
        candidateId: updated.id,
      }).catch((e: any) => console.error('[Notif] CV token-notificatie fout:', e));

      const requestBaseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

      // Genereer reviewToken als die nog niet bestaat
      let reviewToken = (updated as any).reviewToken;
      if (!reviewToken) {
        reviewToken = randomUUID();
        await storage.updateCandidate(updated.id, {
          reviewToken,
          reviewTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        } as any);
      }

      // Stuur interne admin-notificatiemail met CV en review knoppen
      sendAdminCandidateNotificationEmail({
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        functionType: updated.functionType,
        city: updated.city,
        email: updated.email,
        birthDate: updated.birthDate,
        phone: updated.phone,
        nationality: updated.nationality,
        cvFilename: publicUrl,
        reviewToken,
        baseUrl: requestBaseUrl,
        sourceChannel: (updated as any).sourceChannel,
      }).catch((err: any) => console.error("Fout bij admin-notificatiemail (cv token upload):", err));

      console.log(`CV geüpload via directe link voor kandidaat ${updated.id} (${updated.firstName} ${updated.lastName})`);

      return res.json({ message: "CV ontvangen", firstName: updated.firstName });
    } catch (error) {
      console.error("Error bij directe CV upload:", error);
      return res.status(500).json({ message: "Upload mislukt" });
    }
  });

  // Valideer cv-upload token (GET voor voorpagina)
  app.get("/api/cv-upload-token", async (req: Request, res: Response) => {
    try {
      const token = req.query?.token as string;
      if (!token) return res.status(400).json({ message: "Token ontbreekt" });
      // Directe DB query — werkt ook als getCandidates limiet wordt bereikt
      const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.cvUploadToken, token)).limit(1);
      if (!candidate) return res.status(404).json({ message: "Ongeldige of verlopen link" });
      if (candidate.hasCv) return res.status(200).json({ valid: false, message: "CV al ontvangen" });
      return res.json({ valid: true, firstName: candidate.firstName });
    } catch (error) {
      return res.status(500).json({ message: "Fout bij valideren" });
    }
  });

  // ==========================================
  // SOLLICITANTEN (Candidates) API Routes
  // ==========================================

  // ─── Admin notificaties ────────────────────────────────────────────────────
  app.get("/api/admin/notifications", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const notifications = await storage.getAdminNotifications(60);
      return res.json(notifications);
    } catch (err) {
      console.error("Fout bij ophalen notificaties:", err);
      return res.status(500).json({ message: "Fout bij ophalen notificaties" });
    }
  });

  app.patch("/api/admin/notifications/read-all", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      await storage.markAllAdminNotificationsRead();
      return res.json({ success: true });
    } catch (err) {
      console.error("Fout bij markeren notificaties:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.patch("/api/admin/notifications/:id/read", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      await storage.markAdminNotificationRead(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("Fout bij markeren notificatie:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // ─── B2B Prospect Contacten ──────────────────────────────────────────────
  app.get("/api/admin/prospect-contacts", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { branche, functie, search, type, status, taal, functiegroep, tag, sort } = req.query as Record<string, string>;
      const contacts = await storage.getProspectContacts({ branche, functie, search, type, status, taal, functiegroep, tag, sort });
      return res.json(contacts);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.get("/api/admin/prospect-contacts/tags", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const [branche, functie] = await Promise.all([
        storage.getAllBrancheTags(),
        storage.getAllFunctieTags(),
      ]);
      return res.json({ branche, functie });
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.get("/api/admin/prospect-contacts/unique-tags", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const tags = await storage.getProspectContactUniqueTags();
      return res.json(tags);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.get("/api/admin/prospect-contacts/:id/campaign-history", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const history = await storage.getProspectContactCampaignHistory(id);
      return res.json(history);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.get("/api/admin/prospect-contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const contact = await storage.getProspectContact(id);
      if (!contact) return res.status(404).json({ message: "Niet gevonden" });
      return res.json(contact);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.post("/api/admin/prospect-contacts", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const {
        voornaam, achternaam, email, telefoon, bedrijf, functietitel, stad,
        branche, functiegroep, type: contactType, taal, tags: customTagsInput, notities,
        // legacy
        name, company, function: fn, brancheTags, functieTags, source,
      } = req.body;
      // Determine name: prefer voornaam+achternaam, fallback to name
      const fullName = voornaam && achternaam ? `${voornaam} ${achternaam}` : (name || voornaam || '');
      const resolvedEmail = email;
      if (!fullName || !resolvedEmail) return res.status(400).json({ message: "Naam en e-mail zijn verplicht" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) return res.status(400).json({ message: "Ongeldig e-mailadres" });
      // Check uniqueness
      const existing = await storage.getProspectContacts({ search: resolvedEmail });
      if (existing.some(e => e.email.toLowerCase() === resolvedEmail.toLowerCase())) {
        return res.status(409).json({ message: "Dit e-mailadres is al in gebruik" });
      }
      const customTags = Array.isArray(customTagsInput) ? JSON.stringify(customTagsInput) : (customTagsInput || '[]');
      const contact = await storage.createProspectContact({
        name: fullName,
        email: resolvedEmail,
        company: bedrijf || company || null,
        function: functietitel || fn || null,
        brancheTags: branche ? [branche] : (brancheTags || []),
        functieTags: functiegroep ? [functiegroep] : (functieTags || []),
        notes: notities || null,
        source: source || 'manual',
        unsubscribed: false,
        unsubscribedAt: null,
        crmContactId: null,
        voornaam: voornaam || null,
        achternaam: achternaam || null,
        telefoon: telefoon || null,
        stad: stad || null,
        taal: taal || 'Nederlands',
        branche: branche || null,
        functiegroep: functiegroep || null,
        contactType: contactType || 'prospect',
        customTags,
        contactStatus: 'actief',
      });
      return res.status(201).json(contact);
    } catch (err) {
      console.error("[ProspectContacts] Aanmaken fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.put("/api/admin/prospect-contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const body = req.body;
      // Handle customTags serialization
      if (Array.isArray(body.customTags)) body.customTags = JSON.stringify(body.customTags);
      if (Array.isArray(body.tags)) body.customTags = JSON.stringify(body.tags);
      // Rebuild name if voornaam/achternaam changed
      if (body.voornaam || body.achternaam) {
        const existing = await storage.getProspectContact(id);
        const vn = body.voornaam ?? existing?.voornaam ?? '';
        const an = body.achternaam ?? existing?.achternaam ?? '';
        if (vn || an) body.name = `${vn} ${an}`.trim();
      }
      const updated = await storage.updateProspectContact(id, body);
      if (!updated) return res.status(404).json({ message: "Niet gevonden" });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.delete("/api/admin/prospect-contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProspectContact(id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  // CSV Import
  app.post("/api/admin/prospect-contacts/import", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const rows: any[] = req.body.contacts || [];
      let aangemaakt = 0, overgeslagen = 0;
      const fouten: string[] = [];
      const existing = await storage.getProspectContacts({});
      const existingEmails = new Set(existing.map(e => e.email.toLowerCase()));
      for (const row of rows) {
        const email = (row.email || '').trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          fouten.push(`Ongeldig e-mail: ${row.email || '(leeg)'}`); continue;
        }
        const name = row.voornaam && row.achternaam ? `${row.voornaam} ${row.achternaam}` : (row.name || row.voornaam || '');
        if (!name) { fouten.push(`Naam ontbreekt voor ${email}`); continue; }
        if (existingEmails.has(email)) { overgeslagen++; continue; }
        const customTags = Array.isArray(row.tags) ? JSON.stringify(row.tags) : (row.tags ? JSON.stringify(row.tags.split(',').map((t: string) => t.trim()).filter(Boolean)) : '[]');
        await storage.createProspectContact({
          name, email,
          company: row.bedrijf || row.company || null,
          function: row.functietitel || null,
          brancheTags: row.branche ? [row.branche] : [],
          functieTags: row.functiegroep ? [row.functiegroep] : [],
          notes: row.notities || null,
          source: 'csv_import',
          unsubscribed: false, unsubscribedAt: null, crmContactId: null,
          voornaam: row.voornaam || null,
          achternaam: row.achternaam || null,
          telefoon: row.telefoon || null,
          stad: row.stad || null,
          taal: row.taal || 'Nederlands',
          branche: row.branche || null,
          functiegroep: row.functiegroep || null,
          contactType: row.type || 'prospect',
          customTags,
          contactStatus: 'actief',
        });
        existingEmails.add(email);
        aangemaakt++;
      }
      return res.json({ aangemaakt, overgeslagen, fouten });
    } catch (err) {
      console.error("[ProspectContacts] Import fout:", err);
      return res.status(500).json({ message: "Fout bij importeren" });
    }
  });

  // Import CRM contacts into prospect contacts list
  app.post("/api/admin/prospect-contacts/import-crm", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const companies = await storage.getCrmCompanies();
      let imported = 0;
      for (const company of companies) {
        const contacts = await storage.getCrmContacts(company.id);
        for (const contact of contacts) {
          if (!contact.email) continue;
          const existing = await storage.getProspectContacts({ search: contact.email });
          if (existing.some(e => e.email.toLowerCase() === contact.email!.toLowerCase())) continue;
          await storage.createProspectContact({
            name: contact.name, email: contact.email,
            company: company.name, function: contact.function || null,
            brancheTags: [], functieTags: contact.function ? [contact.function] : [],
            notes: null, source: 'crm_import', unsubscribed: false, unsubscribedAt: null,
            crmContactId: contact.id,
            voornaam: null, achternaam: null, telefoon: null, stad: null,
            taal: 'Nederlands', branche: null, functiegroep: null,
            contactType: 'prospect', customTags: '[]', contactStatus: 'actief',
          });
          imported++;
        }
      }
      return res.json({ imported });
    } catch (err) {
      console.error("[ProspectContacts] CRM import fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // ─── B2B Prospect E-mail Campagnes ───────────────────────────────────────
  app.get("/api/admin/prospect-campaigns", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { status, type } = req.query as Record<string, string>;
      const campaigns = await storage.getProspectCampaigns({ status, type });
      return res.json(campaigns);
    } catch (err) {
      console.error("[ProspectCampaign] Fout ophalen:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // segment-count MUST be before /:id
  app.get("/api/admin/prospect-campaigns/segment-count", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { branche_filter, functie_filter, type_filter, taal_filter, tag_filter } = req.query as Record<string, string>;
      const brancheFilter = branche_filter ? JSON.parse(branche_filter) : [];
      const functieFilter = functie_filter ? JSON.parse(functie_filter) : [];
      const tagFilter = tag_filter ? JSON.parse(tag_filter) : [];
      const count = await storage.getProspectCampaignSegmentCount({
        brancheFilter, functieFilter,
        typeFilter: type_filter || 'alles',
        taalFilter: taal_filter || 'alles',
        tagFilter,
      });
      return res.json({ count });
    } catch (err) {
      console.error("[ProspectCampaign] Segment-count fout:", err);
      return res.status(500).json({ count: 0 });
    }
  });

  app.post("/api/admin/prospect-campaigns", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const {
        name, subject, campagneType, status,
        brancheFilter, functieFilter, typeFilter, taalFilter, tagFilter,
        contentA, contentB, editorBlocks, htmlContent,
        abTestActief, abSplitPct, abWinnaarOp, abWinnaarNaUren,
        alleenWerkdagen, tijdvensterStart, tijdvensterEind, scheduledAt,
      } = req.body;
      if (!name || !subject) return res.status(400).json({ message: "Naam en onderwerp zijn verplicht" });
      const campaign = await storage.createProspectCampaign({
        name,
        subject,
        campagneType: campagneType || 'bulk',
        status: status || 'concept',
        brancheFilter: brancheFilter || [],
        functieFilter: functieFilter || [],
        typeFilter: typeFilter || 'alles',
        taalFilter: taalFilter || 'alles',
        tagFilter: typeof tagFilter === 'string' ? tagFilter : JSON.stringify(tagFilter || []),
        contentA: contentA || null,
        contentB: contentB || null,
        editorBlocks: editorBlocks || contentA || null,
        htmlContent: htmlContent || '',
        textContent: null,
        abTestActief: abTestActief || false,
        abSplitPct: abSplitPct || 50,
        abWinnaarOp: abWinnaarOp || 'open_rate',
        abWinnaarNaUren: abWinnaarNaUren || 24,
        abWinnaarVariant: null,
        alleenWerkdagen: alleenWerkdagen !== false,
        tijdvensterStart: tijdvensterStart || '08:00',
        tijdvensterEind: tijdvensterEind || '18:00',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sentAt: null,
        sentCount: 0,
        failedCount: 0,
        openCount: 0,
        clickCount: 0,
      });
      return res.status(201).json(campaign);
    } catch (err) {
      console.error("[ProspectCampaign] Fout aanmaken:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.put("/api/admin/prospect-campaigns/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      // Serialize tagFilter if array
      if (Array.isArray(req.body.tagFilter)) req.body.tagFilter = JSON.stringify(req.body.tagFilter);
      // Auto-generate htmlContent from new-format contentA if provided
      if (req.body.contentA && !req.body.htmlContent) {
        try {
          const { generateEmailHTML, generateEmailPlainText } = await import('./emailGenerator');
          const dummyContact = { voornaam: '{{voornaam}}', naam: '{{naam}}', bedrijf: '{{bedrijf}}', taal: 'nl' };
          req.body.htmlContent = generateEmailHTML(req.body.contentA, dummyContact);
          req.body.textContent = generateEmailPlainText(req.body.contentA, dummyContact);
        } catch (genErr) {
          console.warn("[ProspectCampaign] HTML generatie mislukt:", genErr);
        }
      }
      const updated = await storage.updateProspectCampaign(id, req.body);
      if (!updated) return res.status(404).json({ message: "Niet gevonden" });
      return res.json(updated);
    } catch (err) {
      console.error("[ProspectCampaign] Fout bijwerken:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.delete("/api/admin/prospect-campaigns/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      // Only allow delete if concept/draft
      const campaign = await storage.getProspectCampaign(id);
      if (campaign && !['concept', 'draft'].includes(campaign.status)) {
        return res.status(400).json({ message: "Alleen conceptcampagnes kunnen worden verwijderd" });
      }
      await storage.deleteProspectCampaign(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("[ProspectCampaign] Fout verwijderen:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Ontvangers
  app.get("/api/admin/prospect-campaigns/:id/recipients", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const recipients = await storage.getProspectCampaignRecipients(id);
      return res.json(recipients);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.post("/api/admin/prospect-campaigns/:id/recipients", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const { email, name, company } = req.body;
      if (!email) return res.status(400).json({ message: "E-mail is verplicht" });
      const r = await storage.addProspectCampaignRecipient({ campaignId, email, name: name || null, company: company || null, status: 'pending', sentAt: null, errorMessage: null });
      return res.status(201).json(r);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.delete("/api/admin/prospect-campaigns/:campaignId/recipients/:recipientId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.recipientId);
      await storage.deleteProspectCampaignRecipient(id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  // CRM contacts importeren als ontvangers
  app.post("/api/admin/prospect-campaigns/:id/import-crm", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const companies = await storage.getCrmCompanies();
      let imported = 0;
      const existing = await storage.getProspectCampaignRecipients(campaignId);
      const existingEmails = new Set(existing.map(r => r.email.toLowerCase()));
      for (const company of companies) {
        const contacts = await storage.getCrmContacts(company.id);
        for (const contact of contacts) {
          if (contact.email && !existingEmails.has(contact.email.toLowerCase())) {
            await storage.addProspectCampaignRecipient({
              campaignId, email: contact.email,
              name: contact.name || null, company: company.name || null,
              status: 'pending', sentAt: null, errorMessage: null,
            });
            existingEmails.add(contact.email.toLowerCase());
            imported++;
          }
        }
      }
      return res.json({ imported });
    } catch (err) {
      console.error("[ProspectCampaign] Fout CRM import:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Testmail sturen
  app.post("/api/admin/prospect-campaigns/:id/send-test", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getProspectCampaign(campaignId);
      if (!campaign) return res.status(404).json({ message: "Campagne niet gevonden" });

      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "E-mailadres is verplicht" });

      const { sendEmail } = await import('./mail');
      const { generateEmailHTML, generateEmailPlainText } = await import('./emailGenerator');
      const { getInstelling } = await import('./schedulerUtils');

      const fromEmail = await getInstelling('email_from_address', 'max@doehetextra.nl');
      const fromName = await getInstelling('email_from_name', 'EXTRA');

      const testContact = { voornaam: 'Max', naam: 'Max van der Berg', bedrijf: 'EXTRA', taal: 'nl', email };
      const html = generateEmailHTML(campaign.contentA, testContact);
      const text = generateEmailPlainText(campaign.contentA, testContact);

      const ok = await sendEmail({
        to: email,
        from: `${fromName} <${fromEmail}>`,
        subject: `[TEST] ${campaign.subject}`,
        html,
        text,
      });

      if (!ok) return res.status(500).json({ message: "Versturen mislukt" });
      return res.json({ success: true });
    } catch (err) {
      console.error("[ProspectCampaign] Testmail fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Verzenden via emailService (nieuwe tracking infrastructuur)
  app.post("/api/admin/prospect-campaigns/:id/send", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getProspectCampaign(campaignId);
      if (!campaign) return res.status(404).json({ message: "Campagne niet gevonden" });
      if (campaign.status === 'sent' || campaign.status === 'voltooid') {
        return res.status(400).json({ message: "Campagne is al verzonden" });
      }
      if (!campaign.contentA) return res.status(400).json({ message: "Geen e-mailinhoud ingesteld" });

      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

      // Update status to actief
      await storage.updateProspectCampaign(campaignId, { status: 'actief' });

      const { sendCampaignBatch } = await import('./emailService');
      const result = await sendCampaignBatch(campaignId, baseUrl);

      // Update to voltooid
      await storage.updateProspectCampaign(campaignId, {
        status: 'voltooid', sentAt: new Date(),
        sentCount: result.verzonden,
        failedCount: result.mislukt,
      });

      return res.json({ success: true, verzonden: result.verzonden, mislukt: result.mislukt, totaal: result.totaal });
    } catch (err) {
      console.error("[ProspectCampaign] Fout verzenden:", err);
      return res.status(500).json({ message: "Fout bij verzenden" });
    }
  });

  // Statistieken per campagne
  app.get("/api/admin/prospect-campaigns/:id/stats", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const stats = await storage.getCampaignMailStats(id);
      return res.json(stats);
    } catch (err) {
      console.error("[ProspectCampaign] Stats fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // ─── Statistieken Dashboard routes (Stap 7) ──────────────────────────────

  // Helper: parse date filters
  function parsePeriod(vanaf?: string, tot?: string) {
    const nu = new Date();
    const tot_dt = tot ? new Date(tot) : nu;
    tot_dt.setHours(23, 59, 59, 999);
    const vanaf_dt = vanaf ? new Date(vanaf) : new Date(nu.getTime() - 30 * 86400000);
    vanaf_dt.setHours(0, 0, 0, 0);
    const dagVerschil = Math.round((tot_dt.getTime() - vanaf_dt.getTime()) / 86400000);
    const granularity = dagVerschil <= 14 ? 'day' : dagVerschil <= 90 ? 'week' : 'month';
    // previous period of same length
    const prev_tot = new Date(vanaf_dt.getTime() - 1);
    const prev_vanaf = new Date(vanaf_dt.getTime() - (dagVerschil + 1) * 86400000);
    return { vanaf_dt, tot_dt, granularity, prev_vanaf, prev_tot };
  }

  function brancheWhere(alias: string, branches: string[]): string {
    if (!branches || branches.length === 0) return '';
    const quoted = branches.map(b => `'${b.replace(/'/g, "''")}'`).join(',');
    return ` AND (${alias}.branche_filter = '{}' OR ${alias}.branche_filter && ARRAY[${quoted}]::text[])`;
  }

  app.get("/api/admin/stats/overview", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { vanaf, tot, branche } = req.query as Record<string, any>;
      const branches: string[] = branche ? (Array.isArray(branche) ? branche : [branche]) : [];
      const { vanaf_dt, tot_dt, granularity, prev_vanaf, prev_tot } = parsePeriod(vanaf, tot);
      const bWhere = brancheWhere('pc', branches);

      // KPI current period
      const kpiSQL = `
        SELECT
          COUNT(ms.id) FILTER (WHERE ms.status = 'sent') AS totaal_verzonden,
          COUNT(DISTINCT me_open.mail_send_id) AS geopend,
          COUNT(DISTINCT me_click.mail_send_id) AS geklikt,
          COUNT(me_unsub.id) AS uitgeschreven
        FROM mail_sends ms
        JOIN prospect_campaigns pc ON pc.id = ms.campaign_id
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        LEFT JOIN mail_events me_unsub ON me_unsub.mail_send_id = ms.id AND me_unsub.type = 'unsubscribe'
        WHERE ms.verzonden_op >= '${vanaf_dt.toISOString()}' AND ms.verzonden_op <= '${tot_dt.toISOString()}'
        ${bWhere}
      `;

      // KPI previous period
      const kpiPrevSQL = `
        SELECT
          COUNT(ms.id) FILTER (WHERE ms.status = 'sent') AS totaal_verzonden,
          COUNT(DISTINCT me_open.mail_send_id) AS geopend,
          COUNT(DISTINCT me_click.mail_send_id) AS geklikt,
          COUNT(me_unsub.id) AS uitgeschreven
        FROM mail_sends ms
        JOIN prospect_campaigns pc ON pc.id = ms.campaign_id
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        LEFT JOIN mail_events me_unsub ON me_unsub.mail_send_id = ms.id AND me_unsub.type = 'unsubscribe'
        WHERE ms.verzonden_op >= '${prev_vanaf.toISOString()}' AND ms.verzonden_op <= '${prev_tot.toISOString()}'
        ${bWhere}
      `;

      // Tijdlijn (group by period)
      const tijdlijnSQL = `
        SELECT
          DATE_TRUNC('${granularity}', ms.verzonden_op) AS periode,
          COUNT(ms.id) FILTER (WHERE ms.status = 'sent') AS verzonden,
          COUNT(DISTINCT me_open.mail_send_id) AS geopend,
          COUNT(DISTINCT me_click.mail_send_id) AS geklikt
        FROM mail_sends ms
        JOIN prospect_campaigns pc ON pc.id = ms.campaign_id
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        WHERE ms.verzonden_op >= '${vanaf_dt.toISOString()}' AND ms.verzonden_op <= '${tot_dt.toISOString()}'
        ${bWhere}
        GROUP BY DATE_TRUNC('${granularity}', ms.verzonden_op)
        ORDER BY periode
      `;

      // Per branche
      const brancheSQL = `
        SELECT
          UNNEST(pc.branche_filter) AS branche,
          COUNT(DISTINCT pc.id) AS campagnes,
          COUNT(ms.id) FILTER (WHERE ms.status = 'sent') AS bereikt,
          COUNT(DISTINCT me_open.mail_send_id) AS geopend,
          COUNT(DISTINCT me_click.mail_send_id) AS geklikt
        FROM prospect_campaigns pc
        LEFT JOIN mail_sends ms ON ms.campaign_id = pc.id
          AND ms.verzonden_op >= '${vanaf_dt.toISOString()}' AND ms.verzonden_op <= '${tot_dt.toISOString()}'
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        WHERE ARRAY_LENGTH(pc.branche_filter, 1) > 0
        GROUP BY branche
        ORDER BY bereikt DESC
      `;

      const [kpiRows, kpiPrevRows, tijdlijnRows, brancheRows] = await Promise.all([
        db.execute(sql.raw(kpiSQL)),
        db.execute(sql.raw(kpiPrevSQL)),
        db.execute(sql.raw(tijdlijnSQL)),
        db.execute(sql.raw(brancheSQL)),
      ]);

      const k = (kpiRows.rows as any[])[0] || {};
      const kp = (kpiPrevRows.rows as any[])[0] || {};
      const tv = parseInt(k.totaal_verzonden) || 0;
      const tvp = parseInt(kp.totaal_verzonden) || 0;
      const geopend = parseInt(k.geopend) || 0;
      const geklikt = parseInt(k.geklikt) || 0;
      const uitgeschreven = parseInt(k.uitgeschreven) || 0;
      const geopendV = parseInt(kp.geopend) || 0;
      const gekliktV = parseInt(kp.geklikt) || 0;
      const uitgeschrevenV = parseInt(kp.uitgeschreven) || 0;

      const tijdlijn = (tijdlijnRows.rows as any[]).map(r => {
        const v = parseInt(r.verzonden) || 0;
        const g = parseInt(r.geopend) || 0;
        const c = parseInt(r.geklikt) || 0;
        return {
          periode: r.periode,
          verzonden: v,
          open_rate: v > 0 ? Math.round((g / v) * 1000) / 10 : 0,
          click_rate: v > 0 ? Math.round((c / v) * 1000) / 10 : 0,
          geopend: g,
          geklikt: c,
        };
      });

      const per_branche = (brancheRows.rows as any[]).map(r => {
        const ber = parseInt(r.bereikt) || 0;
        const g = parseInt(r.geopend) || 0;
        const c = parseInt(r.geklikt) || 0;
        return {
          branche: r.branche,
          campagnes: parseInt(r.campagnes) || 0,
          bereikt: ber,
          open_rate: ber > 0 ? Math.round((g / ber) * 1000) / 10 : 0,
          click_rate: ber > 0 ? Math.round((c / ber) * 1000) / 10 : 0,
        };
      });

      return res.json({
        kpi: {
          totaal_verzonden: tv,
          totaal_verzonden_vorige: tvp,
          gem_open_rate: tv > 0 ? Math.round((geopend / tv) * 1000) / 10 : 0,
          gem_open_rate_vorige: tvp > 0 ? Math.round((geopendV / tvp) * 1000) / 10 : 0,
          gem_click_rate: tv > 0 ? Math.round((geklikt / tv) * 1000) / 10 : 0,
          gem_click_rate_vorige: tvp > 0 ? Math.round((gekliktV / tvp) * 1000) / 10 : 0,
          uitschrijvingen: uitgeschreven,
          uitschrijvingen_vorige: uitgeschrevenV,
        },
        tijdlijn,
        per_branche,
        granularity,
      });
    } catch (err: any) {
      console.error('[stats/overview]', err);
      return res.status(500).json({ message: err?.message || 'Fout' });
    }
  });

  app.get("/api/admin/stats/campaigns", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { vanaf, tot, branche, sort_by = 'open_rate', sort_dir = 'desc', page = '1', per_page = '10' } = req.query as Record<string, any>;
      const branches: string[] = branche ? (Array.isArray(branche) ? branche : [branche]) : [];
      const { vanaf_dt, tot_dt } = parsePeriod(vanaf, tot);
      const bWhere = brancheWhere('pc', branches);
      const offset = (parseInt(page) - 1) * parseInt(per_page);

      const validSort: Record<string, string> = {
        open_rate: 'open_rate', click_rate: 'click_rate',
        verzonden: 'verzonden', naam: 'pc.name', datum: 'pc.sent_at',
      };
      const sortCol = validSort[sort_by] || 'open_rate';
      const sortDir = sort_dir === 'asc' ? 'ASC' : 'DESC';

      const campagnesSQL = `
        SELECT
          pc.id, pc.name, pc.campagne_type, pc.status, pc.sent_at, pc.branche_filter,
          pc.ab_test_actief,
          COUNT(ms.id) FILTER (WHERE ms.status = 'sent') AS verzonden,
          COUNT(ms.id) FILTER (WHERE ms.status = 'failed') AS mislukt,
          COUNT(DISTINCT me_open.mail_send_id) AS geopend,
          COUNT(DISTINCT me_click.mail_send_id) AS geklikt,
          COUNT(me_unsub.id) AS uitgeschreven,
          CASE WHEN COUNT(ms.id) FILTER (WHERE ms.status='sent') > 0
            THEN ROUND(COUNT(DISTINCT me_open.mail_send_id)::numeric / COUNT(ms.id) FILTER (WHERE ms.status='sent') * 100, 1)
            ELSE 0 END AS open_rate,
          CASE WHEN COUNT(ms.id) FILTER (WHERE ms.status='sent') > 0
            THEN ROUND(COUNT(DISTINCT me_click.mail_send_id)::numeric / COUNT(ms.id) FILTER (WHERE ms.status='sent') * 100, 1)
            ELSE 0 END AS click_rate
        FROM prospect_campaigns pc
        LEFT JOIN mail_sends ms ON ms.campaign_id = pc.id
          AND ms.verzonden_op >= '${vanaf_dt.toISOString()}' AND ms.verzonden_op <= '${tot_dt.toISOString()}'
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        LEFT JOIN mail_events me_unsub ON me_unsub.mail_send_id = ms.id AND me_unsub.type = 'unsubscribe'
        WHERE pc.status NOT IN ('concept', 'draft') OR EXISTS (
          SELECT 1 FROM mail_sends ms2 WHERE ms2.campaign_id = pc.id
            AND ms2.verzonden_op >= '${vanaf_dt.toISOString()}' AND ms2.verzonden_op <= '${tot_dt.toISOString()}'
        )
        ${bWhere}
        GROUP BY pc.id
        ORDER BY ${sortCol} ${sortDir} NULLS LAST
        LIMIT ${parseInt(per_page)} OFFSET ${offset}
      `;

      const countSQL = `
        SELECT COUNT(DISTINCT pc.id) AS total
        FROM prospect_campaigns pc
        LEFT JOIN mail_sends ms ON ms.campaign_id = pc.id
          AND ms.verzonden_op >= '${vanaf_dt.toISOString()}' AND ms.verzonden_op <= '${tot_dt.toISOString()}'
        WHERE pc.status NOT IN ('concept', 'draft') OR ms.id IS NOT NULL
        ${bWhere}
      `;

      const [rows, countRows] = await Promise.all([
        db.execute(sql.raw(campagnesSQL)),
        db.execute(sql.raw(countSQL)),
      ]);

      const campagnes = (rows.rows as any[]).map(r => ({
        id: r.id, naam: r.name, type: r.campagne_type, status: r.status,
        datum: r.sent_at, branche_filter: r.branche_filter || [],
        abTestActief: r.ab_test_actief,
        verzonden: parseInt(r.verzonden) || 0,
        mislukt: parseInt(r.mislukt) || 0,
        geopend: parseInt(r.geopend) || 0,
        geklikt: parseInt(r.geklikt) || 0,
        uitgeschreven: parseInt(r.uitgeschreven) || 0,
        open_rate: parseFloat(r.open_rate) || 0,
        click_rate: parseFloat(r.click_rate) || 0,
      }));

      return res.json({
        campagnes,
        total: parseInt((countRows.rows as any[])[0]?.total) || 0,
        page: parseInt(page),
        per_page: parseInt(per_page),
      });
    } catch (err: any) {
      console.error('[stats/campaigns]', err);
      return res.status(500).json({ message: err?.message || 'Fout' });
    }
  });

  app.get("/api/admin/stats/activity", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { limit = '20', offset = '0' } = req.query as Record<string, any>;

      const activitySQL = `
        SELECT
          me.id, me.type, me.timestamp, me.url,
          ms.email, ms.campaign_id, ms.variant,
          pc.name AS campaign_name, pc.ab_test_actief,
          pc.ab_winnaar_variant, pc.ab_winnaar_bepaald_op,
          pcon.name AS contact_naam, pcon.company AS contact_bedrijf
        FROM mail_events me
        JOIN mail_sends ms ON ms.id = me.mail_send_id
        JOIN prospect_campaigns pc ON pc.id = ms.campaign_id
        LEFT JOIN prospect_contacts pcon ON pcon.id = ms.contact_id
        ORDER BY me.timestamp DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const countSQL = `SELECT COUNT(*) AS total FROM mail_events`;

      const [rows, countRows] = await Promise.all([
        db.execute(sql.raw(activitySQL)),
        db.execute(sql.raw(countSQL)),
      ]);

      const activiteiten = (rows.rows as any[]).map(r => ({
        id: r.id, type: r.type, timestamp: r.timestamp, url: r.url,
        email: r.email,
        campaign_name: r.campaign_name,
        contact_naam: r.contact_naam || null,
        contact_bedrijf: r.contact_bedrijf || null,
        variant: r.variant,
        ab_winnaar: r.ab_test_actief && r.ab_winnaar_variant ? {
          variant: r.ab_winnaar_variant,
          op: r.ab_winnaar_bepaald_op,
        } : null,
      }));

      return res.json({
        activiteiten,
        total: parseInt((countRows.rows as any[])[0]?.total) || 0,
      });
    } catch (err: any) {
      console.error('[stats/activity]', err);
      return res.status(500).json({ message: err?.message || 'Fout' });
    }
  });

  app.get("/api/admin/stats/export/csv", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { vanaf, tot, branche } = req.query as Record<string, any>;
      const branches: string[] = branche ? (Array.isArray(branche) ? branche : [branche]) : [];
      const { vanaf_dt, tot_dt } = parsePeriod(vanaf, tot);
      const bWhere = brancheWhere('pc', branches);

      const exportSQL = `
        SELECT
          pc.name AS naam, pc.campagne_type AS type, pc.status,
          pc.branche_filter,
          pc.sent_at AS verzonden_op,
          COUNT(ms.id) FILTER (WHERE ms.status = 'sent') AS totaal_verzonden,
          COUNT(DISTINCT me_open.mail_send_id) AS geopend,
          CASE WHEN COUNT(ms.id) FILTER (WHERE ms.status='sent') > 0
            THEN ROUND(COUNT(DISTINCT me_open.mail_send_id)::numeric / COUNT(ms.id) FILTER (WHERE ms.status='sent') * 100, 1)
            ELSE 0 END AS open_rate_pct,
          COUNT(DISTINCT me_click.mail_send_id) AS geklikt,
          CASE WHEN COUNT(ms.id) FILTER (WHERE ms.status='sent') > 0
            THEN ROUND(COUNT(DISTINCT me_click.mail_send_id)::numeric / COUNT(ms.id) FILTER (WHERE ms.status='sent') * 100, 1)
            ELSE 0 END AS click_rate_pct,
          COUNT(me_unsub.id) AS uitgeschreven,
          COUNT(ms.id) FILTER (WHERE ms.status = 'failed') AS mislukt
        FROM prospect_campaigns pc
        LEFT JOIN mail_sends ms ON ms.campaign_id = pc.id
          AND ms.verzonden_op >= '${vanaf_dt.toISOString()}' AND ms.verzonden_op <= '${tot_dt.toISOString()}'
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        LEFT JOIN mail_events me_unsub ON me_unsub.mail_send_id = ms.id AND me_unsub.type = 'unsubscribe'
        ${bWhere}
        GROUP BY pc.id
        ORDER BY pc.sent_at DESC NULLS LAST
      `;

      const rows = await db.execute(sql.raw(exportSQL));
      const header = 'Campagnenaam,Type,Status,Branche_filter,Verzonden_op,Totaal_verzonden,Geopend,Open_rate_pct,Geklikt,Click_rate_pct,Uitgeschreven,Mislukt\n';
      const csvRows = (rows.rows as any[]).map(r =>
        [
          `"${(r.naam || '').replace(/"/g, '""')}"`,
          r.type || '', r.status || '',
          `"${(r.branche_filter || []).join('; ')}"`,
          r.verzonden_op ? new Date(r.verzonden_op).toLocaleDateString('nl-NL') : '',
          r.totaal_verzonden || 0, r.geopend || 0, r.open_rate_pct || 0,
          r.geklikt || 0, r.click_rate_pct || 0,
          r.uitgeschreven || 0, r.mislukt || 0,
        ].join(',')
      ).join('\n');

      const datum = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="EXTRA-statistieken-${datum}.csv"`);
      return res.send('\uFEFF' + header + csvRows);
    } catch (err: any) {
      console.error('[stats/export/csv]', err);
      return res.status(500).json({ message: err?.message || 'Fout' });
    }
  });

  // Click-analyse voor individuele campagne
  app.get("/api/admin/prospect-campaigns/:id/click-analyse", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });

      const clickSQL = `
        SELECT
          me.url,
          COUNT(*) AS totaal_kliks,
          COUNT(DISTINCT ms.id) AS unieke_kliks
        FROM mail_events me
        JOIN mail_sends ms ON ms.id = me.mail_send_id
        WHERE ms.campaign_id = ${id} AND me.type = 'click' AND me.url IS NOT NULL
        GROUP BY me.url
        ORDER BY totaal_kliks DESC
      `;

      const openConSQL = `
        SELECT
          pcon.id, pcon.name, pcon.company, pcon.email,
          MIN(me.timestamp) AS geopend_op,
          BOOL_OR(me_click.id IS NOT NULL) AS heeft_geklikt
        FROM mail_sends ms
        JOIN mail_events me ON me.mail_send_id = ms.id AND me.type = 'open'
        LEFT JOIN prospect_contacts pcon ON pcon.id = ms.contact_id
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        WHERE ms.campaign_id = ${id}
        GROUP BY pcon.id, pcon.name, pcon.company, pcon.email
        ORDER BY geopend_op ASC
        LIMIT 100
      `;

      const nietOpenSQL = `
        SELECT
          pcon.id, pcon.name, pcon.company, pcon.email
        FROM mail_sends ms
        LEFT JOIN prospect_contacts pcon ON pcon.id = ms.contact_id
        WHERE ms.campaign_id = ${id} AND ms.status = 'sent'
          AND NOT EXISTS (
            SELECT 1 FROM mail_events me WHERE me.mail_send_id = ms.id AND me.type = 'open'
          )
        LIMIT 200
      `;

      const [clickRows, openConRows, nietOpenRows] = await Promise.all([
        db.execute(sql.raw(clickSQL)),
        db.execute(sql.raw(openConSQL)),
        db.execute(sql.raw(nietOpenSQL)),
      ]);

      return res.json({
        klik_analyse: (clickRows.rows as any[]).map(r => ({
          url: r.url,
          kliks: parseInt(r.totaal_kliks) || 0,
          unieke_kliks: parseInt(r.unieke_kliks) || 0,
        })),
        geopend_door: (openConRows.rows as any[]).map(r => ({
          id: r.id, name: r.name, company: r.company, email: r.email,
          geopend_op: r.geopend_op, heeft_geklikt: r.heeft_geklikt,
        })),
        niet_geopend: (nietOpenRows.rows as any[]).map(r => ({
          id: r.id, name: r.name, company: r.company, email: r.email,
        })),
      });
    } catch (err: any) {
      console.error('[click-analyse]', err);
      return res.status(500).json({ message: err?.message || 'Fout' });
    }
  });

  // ─── Stap 8: Geplande Verzending routes ──────────────────────────────────────

  // Preview (dry-run): bereken werkelijk verzendmoment zonder op te slaan
  app.post("/api/admin/prospect-campaigns/:id/plannen-preview", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const { verzendDirect, verzendOp, alleenWerkdagen, tijdvensterStart, tijdvensterEind } = req.body;
      const { planCampagne } = await import('./campaignScheduler');
      const resultaat = await planCampagne(id, {
        verzendDirect: !!verzendDirect,
        verzendOp: verzendOp ? new Date(verzendOp) : null,
        alleenWerkdagen: alleenWerkdagen !== undefined ? !!alleenWerkdagen : undefined,
        tijdvensterStart: tijdvensterStart || undefined,
        tijdvensterEind: tijdvensterEind || undefined,
        dryRun: true,
      });
      return res.json(resultaat);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Fout bij preview' });
    }
  });

  // Plan campagne definitief in
  app.post("/api/admin/prospect-campaigns/:id/plannen", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const { verzendDirect, verzendOp, alleenWerkdagen, tijdvensterStart, tijdvensterEind } = req.body;
      const { planCampagne } = await import('./campaignScheduler');
      const resultaat = await planCampagne(id, {
        verzendDirect: !!verzendDirect,
        verzendOp: verzendOp ? new Date(verzendOp) : null,
        alleenWerkdagen: alleenWerkdagen !== undefined ? !!alleenWerkdagen : undefined,
        tijdvensterStart: tijdvensterStart || undefined,
        tijdvensterEind: tijdvensterEind || undefined,
        dryRun: false,
      });
      return res.json(resultaat);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Fout bij inplannen' });
    }
  });

  // Verzendtijd bijwerken (voor een al geplande campagne)
  app.put("/api/admin/prospect-campaigns/:id/verzendtijd", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const { verzendOp, alleenWerkdagen, tijdvensterStart, tijdvensterEind } = req.body;
      if (!verzendOp) return res.status(400).json({ message: "verzendOp verplicht" });
      const { planCampagne } = await import('./campaignScheduler');
      const resultaat = await planCampagne(id, {
        verzendDirect: false,
        verzendOp: new Date(verzendOp),
        alleenWerkdagen: alleenWerkdagen !== undefined ? !!alleenWerkdagen : undefined,
        tijdvensterStart: tijdvensterStart || undefined,
        tijdvensterEind: tijdvensterEind || undefined,
        dryRun: false,
      });
      return res.json(resultaat);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Fout bij bijwerken' });
    }
  });

  // Annuleer planning: zet campagne terug naar concept
  app.post("/api/admin/prospect-campaigns/:id/annuleer-planning", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      await db.execute(sql`
        UPDATE prospect_campaigns
        SET status = 'concept',
            scheduled_at = NULL,
            werkelijk_verzend_op = NULL,
            verzend_direct = FALSE,
            updated_at = NOW()
        WHERE id = ${id} AND status = 'gepland'
      `);
      const { logScheduler } = await import('./schedulerUtils');
      await logScheduler('planning_geannuleerd', id, `Planning geannuleerd voor campagne ${id}`);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Fout bij annuleren' });
    }
  });

  // Scheduler status (logs + geplande campagnes)
  app.get("/api/admin/scheduler/status", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const [logsResult, geplandResult] = await Promise.all([
        db.execute(sql`
          SELECT id, type, campaign_id, bericht, timestamp
          FROM scheduler_log
          ORDER BY timestamp DESC LIMIT 50
        `),
        db.execute(sql`
          SELECT id, name, status, scheduled_at, werkelijk_verzend_op, alleen_werkdagen, tijdvenster_start, tijdvenster_eind
          FROM prospect_campaigns
          WHERE status = 'gepland'
          ORDER BY werkelijk_verzend_op ASC
        `),
      ]);
      return res.json({
        logs: logsResult.rows,
        geplandeCampagnes: geplandResult.rows,
        serverTijd: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Fout' });
    }
  });

  // Handmatig scheduler uitvoeren
  app.post("/api/admin/scheduler/run", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const { checkGeplandeCampagnes } = await import('./campaignScheduler');
      const verwerkt = await checkGeplandeCampagnes();
      const { logScheduler } = await import('./schedulerUtils');
      await logScheduler('scheduler_run', null, `Handmatig uitgevoerd: ${verwerkt} campagne(s) verwerkt`);
      return res.json({ success: true, verwerkt });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Fout bij uitvoeren' });
    }
  });

  // Verzend-instellingen ophalen
  app.get("/api/admin/instellingen/verzend", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`SELECT sleutel, waarde FROM instellingen`);
      const kv: Record<string, string> = {};
      for (const row of result.rows as any[]) kv[row.sleutel] = row.waarde;
      return res.json(kv);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Fout' });
    }
  });

  // Verzend-instellingen bijwerken
  app.put("/api/admin/instellingen/verzend", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { setInstelling } = await import('./schedulerUtils');
      const toegestaan = ['verzend_alleen_werkdagen', 'verzend_tijdvenster_start', 'verzend_tijdvenster_eind', 'tijdzone'];
      for (const [k, v] of Object.entries(req.body)) {
        if (toegestaan.includes(k) && typeof v === 'string') {
          await setInstelling(k, v);
        }
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || 'Fout' });
    }
  });

  // ─── A/B Test routes (Stap 6) ────────────────────────────────────────────

  app.get("/api/admin/prospect-campaigns/:id/ab-stats", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const [stats, tijdlijn] = await Promise.all([
        storage.getABStats(id),
        storage.getABTijdlijn(id),
      ]);
      return res.json({ ...stats, tijdlijn });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Fout" });
    }
  });

  app.post("/api/admin/prospect-campaigns/:id/ab-pick-winner", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { variant } = req.body as { variant: 'A' | 'B' | 'auto' };
      const { bepaalABWinnaar, verstuurWinnaarNaarRest } = await import('./abEngine');

      if (variant === 'auto') {
        const result = await bepaalABWinnaar(id, true);
        return res.json(result || { winnaar: 'A', reden: 'Automatisch gekozen (geen data)' });
      } else if (variant === 'A' || variant === 'B') {
        await storage.updateProspectCampaign(id, {
          abWinnaarVariant: variant,
          abWinnaarBepaaldOp: new Date(),
          abTestFase: 'doorgestuurd',
        } as any);
        await verstuurWinnaarNaarRest(id, variant);
        return res.json({ winnaar: variant, reden: 'Handmatig gekozen' });
      } else {
        return res.status(400).json({ message: "Ongeldige variant. Kies A, B of auto." });
      }
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Fout" });
    }
  });

  // ─── Notificaties routes (Stap 6) ─────────────────────────────────────────

  app.get("/api/admin/notificaties", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const [notifs, ongelezen] = await Promise.all([
        storage.getNotificaties(20),
        storage.getOngelezenCount(),
      ]);
      return res.json({ notificaties: notifs, ongelezen });
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.put("/api/admin/notificaties/markeer-gelezen", adminMiddleware, async (req: Request, res: Response) => {
    try {
      await storage.markeerAlleGelezen();
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  // ─── Flow Builder routes (Stap 5) ────────────────────────────────────────

  // GET flow steps voor een campagne
  app.get("/api/admin/prospect-campaigns/:id/flow-steps", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const steps = await storage.getFlowSteps(id);
      return res.json(steps);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  // PUT (vervang) alle flow steps voor een campagne
  app.put("/api/admin/prospect-campaigns/:id/flow-steps", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { steps } = req.body as { steps: any[] };
      if (!Array.isArray(steps)) return res.status(400).json({ message: "steps array vereist" });
      const withCampaignId = steps.map(s => ({ ...s, campaignId: id }));
      const saved = await storage.replaceFlowSteps(id, withCampaignId);
      return res.json(saved);
    } catch (err) {
      console.error("[FlowSteps] Fout opslaan:", err);
      return res.status(500).json({ message: "Fout bij opslaan" });
    }
  });

  // POST flow activeren
  app.post("/api/admin/prospect-campaigns/:id/flow-activate", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { activateFlow } = await import('./flowEngine');
      const result = await activateFlow(id);
      return res.json(result);
    } catch (err: any) {
      console.error("[FlowActivate] Fout:", err);
      return res.status(500).json({ message: err?.message || "Fout" });
    }
  });

  // GET flow voortgang statistieken
  app.get("/api/admin/prospect-campaigns/:id/flow-stats", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [stats, progresses] = await Promise.all([
        storage.getFlowStats(id),
        storage.getFlowContactProgresses(id),
      ]);
      return res.json({ ...stats, contacten: progresses.slice(0, 50) });
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  // ─── Tracking endpoints (public) ─────────────────────────────────────────
  // Open pixel
  app.get("/api/track/open/:token", async (req: Request, res: Response) => {
    try {
      const r = await storage.getProspectCampaignRecipientByToken(req.params.token);
      if (r && !r.openedAt) {
        await storage.updateProspectCampaignRecipient(r.id, { openedAt: new Date() });
        // Increment campaign open count
        const campaign = await storage.getProspectCampaign(r.campaignId);
        if (campaign) await storage.updateProspectCampaign(r.campaignId, { openCount: (campaign.openCount || 0) + 1 });
      }
    } catch (_) {}
    // Return 1x1 transparent GIF
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' });
    return res.send(gif);
  });

  // Click redirect
  app.get("/api/track/click/:token", async (req: Request, res: Response) => {
    try {
      const r = await storage.getProspectCampaignRecipientByToken(req.params.token);
      if (r && !r.clickedAt) {
        await storage.updateProspectCampaignRecipient(r.id, { clickedAt: new Date() });
        const campaign = await storage.getProspectCampaign(r.campaignId);
        if (campaign) await storage.updateProspectCampaign(r.campaignId, { clickCount: (campaign.clickCount || 0) + 1 });
      }
    } catch (_) {}
    return res.redirect('https://doehetextra.nl');
  });

  // Unsubscribe
  app.get("/api/track/unsubscribe/:token", async (req: Request, res: Response) => {
    try {
      const r = await storage.getProspectCampaignRecipientByToken(req.params.token);
      if (r?.contactId) {
        await storage.updateProspectContact(r.contactId, { unsubscribed: true, unsubscribedAt: new Date() });
      }
    } catch (_) {}
    return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Uitgeschreven</h2><p>Je bent succesvol uitgeschreven van onze mailinglijst.</p></body></html>');
  });

  // ─── Verjaardagen opdrachtgevers ─────────────────────────────────────────
  app.get("/api/admin/client-birthdays", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const birthdays = await storage.getClientBirthdays();
      return res.json(birthdays);
    } catch (err) {
      console.error("Fout bij ophalen verjaardagen:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.post("/api/admin/client-birthdays", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { insertClientBirthdaySchema } = await import("@shared/schema");
      const parsed = insertClientBirthdaySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige gegevens", errors: parsed.error.errors });
      const birthday = await storage.createClientBirthday(parsed.data);
      return res.status(201).json(birthday);
    } catch (err) {
      console.error("Fout bij aanmaken verjaardag:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.patch("/api/admin/client-birthdays/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const updated = await storage.updateClientBirthday(id, req.body);
      if (!updated) return res.status(404).json({ message: "Niet gevonden" });
      return res.json(updated);
    } catch (err) {
      console.error("Fout bij bijwerken verjaardag:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.delete("/api/admin/client-birthdays/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      await storage.deleteClientBirthday(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("Fout bij verwijderen verjaardag:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Intake lookup — returns candidates by functionType for admin intake form
  app.get("/api/intake/candidates", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { functionType } = req.query;
      const result = await storage.getCandidates({
        functionType: functionType as string | undefined,
        status: 'in_behandeling',
        page: 1,
        limit: 200
      });
      const slim = result.candidates.map((c: any) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        city: c.city,
        postcode: c.postcode,
        nationality: c.nationality,
        birthDate: c.birthDate,
        functionType: c.functionType,
        language: c.language,
        horecaExperience: c.horecaExperience,
        experienceLevel: c.experienceLevel,
      }));
      return res.json({ candidates: slim });
    } catch (error) {
      console.error("Error fetching intake candidates:", error);
      return res.status(500).json({ message: "Fout bij ophalen kandidaten" });
    }
  });

  // Get all candidates with filters
  app.get("/api/admin/candidates", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { functionType, status, search, page, limit } = req.query;
      const result = await storage.getCandidates({
        functionType: functionType as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25
      });
      return res.json(result);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van sollicitanten" });
    }
  });

  // Get single candidate with details
  app.get("/api/admin/candidates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidate(id);
      if (!candidate) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }
      return res.json(candidate);
    } catch (error) {
      console.error("Error fetching candidate:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de sollicitant" });
    }
  });

  // Create new candidate
  app.post("/api/admin/candidates", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCandidateSchema.parse({
        ...req.body,
        createdByUserId: req.session?.userId
      });
      const candidate = await storage.createCandidate(validatedData);
      
      try {
        await storage.createCandidateAuditLog({
          candidateId: candidate.id,
          action: 'created',
          changedByUserId: req.session?.userId ?? null,
          changeData: { description: 'Sollicitant aangemaakt' },
          ipAddress: req.ip ?? null
        });
      } catch (auditErr) {
        console.warn('Audit log kon niet worden aangemaakt (niet-kritiek):', auditErr);
      }
      
      return res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error creating candidate:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het aanmaken van de sollicitant" });
    }
  });

  // Update candidate
  app.patch("/api/admin/candidates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingCandidate = await storage.getCandidate(id);
      if (!existingCandidate) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }
      
      const updatedCandidate = await storage.updateCandidate(id, req.body);
      
      try {
        await storage.createCandidateAuditLog({
          candidateId: id,
          action: 'updated',
          changedByUserId: req.session?.userId ?? null,
          changeData: { updatedFields: Object.keys(req.body) },
          ipAddress: req.ip ?? null
        });
      } catch (auditErr) {
        console.warn('Audit log kon niet worden aangemaakt (niet-kritiek):', auditErr);
      }
      
      return res.json(updatedCandidate);
    } catch (error) {
      console.error("Error updating candidate:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de sollicitant" });
    }
  });

  // Update candidate status
  app.patch("/api/admin/candidates/:id/status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;
      
      if (!['in_behandeling', 'aangenomen', 'afgewezen'].includes(status)) {
        return res.status(400).json({ message: "Ongeldige status" });
      }
      
      const updatedCandidate = await storage.updateCandidateStatus(id, status, req.session?.userId);
      if (!updatedCandidate) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }

      if (status === 'afgewezen' && updatedCandidate.email && updatedCandidate.firstName) {
        const candidate = { firstName: updatedCandidate.firstName, email: updatedCandidate.email };
        if (rejectionReason === 'cv') {
          sendCandidateRejectionEmailCv(candidate).catch(err =>
            console.error("Fout bij versturen afwijzingsmail (cv):", err)
          );
        } else {
          sendCandidateRejectionEmailDiensten(candidate).catch(err =>
            console.error("Fout bij versturen afwijzingsmail (diensten):", err)
          );
        }
      }
      
      return res.json(updatedCandidate);
    } catch (error) {
      console.error("Error updating candidate status:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de status" });
    }
  });

  // Token-gebaseerde accept/reject links voor in de interne notificatiemail
  app.get("/api/candidates/:id/accept", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const token = req.query.token as string;
      if (!token) return res.status(400).send('Token ontbreekt');
      const candidate = await storage.getCandidate(id);
      if (!candidate) return res.status(404).send('Kandidaat niet gevonden');
      if ((candidate as any).reviewToken !== token) return res.status(403).send('Ongeldig token');
      const tokenExpiry = (candidate as any).reviewTokenExpiresAt;
      if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        return res.status(403).send('Deze link is verlopen. Open het dashboard om de kandidaat te beoordelen.');
      }
      if (candidate.status === 'aangenomen') {
        return res.send(`<html><body style="font-family:Arial;text-align:center;padding:60px;"><h2 style="color:#16a34a;">✅ ${candidate.firstName} ${candidate.lastName} was al geaccepteerd.</h2><p>Er is al een Calendly-link verstuurd.</p></body></html>`);
      }
      await storage.updateCandidateStatus(id, 'aangenomen', undefined);
      if (candidate.email && candidate.firstName) {
        await sendCalendlyInviteEmail({ firstName: candidate.firstName, email: candidate.email });
      }
      const dashboardUrl = `${req.protocol}://${req.get('host')}/dashboard`;
      return res.send(`<html><body style="font-family:Arial;text-align:center;padding:60px;"><h2 style="color:#16a34a;">✅ ${candidate.firstName} ${candidate.lastName} geaccepteerd!</h2><p>Een Calendly-uitnodiging is verstuurd naar ${candidate.email || 'het opgegeven e-mailadres'}.</p><a href="${dashboardUrl}" style="color:#7c3aed;font-weight:bold;">Terug naar dashboard →</a></body></html>`);
    } catch (err) {
      console.error('Accept kandidaat fout:', err);
      return res.status(500).send('Er is iets misgegaan');
    }
  });

  app.get("/api/candidates/:id/reject", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const token = req.query.token as string;
      if (!token) return res.status(400).send('Token ontbreekt');
      const candidate = await storage.getCandidate(id);
      if (!candidate) return res.status(404).send('Kandidaat niet gevonden');
      if ((candidate as any).reviewToken !== token) return res.status(403).send('Ongeldig token');
      const tokenExpiry = (candidate as any).reviewTokenExpiresAt;
      if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        return res.status(403).send('Deze link is verlopen. Open het dashboard om de kandidaat te beoordelen.');
      }
      if (candidate.status === 'afgewezen') {
        return res.send(`<html><body style="font-family:Arial;text-align:center;padding:60px;"><h2 style="color:#dc2626;">❌ ${candidate.firstName} ${candidate.lastName} was al afgewezen.</h2></body></html>`);
      }
      await storage.updateCandidateStatus(id, 'afgewezen', undefined);
      if (candidate.email && candidate.firstName) {
        sendCandidateRejectionEmailDiensten({ firstName: candidate.firstName, email: candidate.email }).catch(err =>
          console.error('Fout bij versturen afwijzingsmail:', err)
        );
      }
      const dashboardUrl = `${req.protocol}://${req.get('host')}/dashboard`;
      return res.send(`<html><body style="font-family:Arial;text-align:center;padding:60px;"><h2 style="color:#dc2626;">❌ ${candidate.firstName} ${candidate.lastName} afgewezen.</h2><p>Een afwijzingsmail is verstuurd naar ${candidate.email || 'het opgegeven e-mailadres'}.</p><a href="${dashboardUrl}" style="color:#7c3aed;font-weight:bold;">Terug naar dashboard →</a></body></html>`);
    } catch (err) {
      console.error('Reject kandidaat fout:', err);
      return res.status(500).send('Er is iets misgegaan');
    }
  });

  app.post("/api/admin/candidates/:id/review", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { action } = req.body as { action: 'accept' | 'reject' };
      if (!action || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Ongeldige actie' });
      }
      const candidate = await storage.getCandidate(id);
      if (!candidate) return res.status(404).json({ message: 'Kandidaat niet gevonden' });
      if (candidate.status === 'aangenomen' || candidate.status === 'afgewezen') {
        return res.status(409).json({ message: 'Kandidaat is al beoordeeld' });
      }
      if (action === 'accept') {
        await storage.updateCandidateStatus(id, 'aangenomen', undefined);
        if (candidate.email && candidate.firstName) {
          sendCalendlyInviteEmail({ firstName: candidate.firstName, email: candidate.email }).catch(err =>
            console.error('Fout bij versturen Calendly-mail:', err)
          );
        }
        return res.json({ message: 'Kandidaat geaccepteerd' });
      } else {
        await storage.updateCandidateStatus(id, 'afgewezen', undefined);
        if (candidate.email && candidate.firstName) {
          sendCandidateRejectionEmailDiensten({ firstName: candidate.firstName, email: candidate.email }).catch(err =>
            console.error('Fout bij versturen afwijzingsmail:', err)
          );
        }
        return res.json({ message: 'Kandidaat afgewezen' });
      }
    } catch (err: any) {
      console.error('Review kandidaat fout:', err);
      return res.status(500).json({ message: 'Er is iets misgegaan' });
    }
  });

  /**
   * CV downloaden — genereert een signed URL via de service-key zodat
   * private buckets en gewijzigde bucket-policies geen probleem zijn.
   */
  app.get("/api/admin/candidates/:id/cv", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidate(id);
      if (!candidate || !candidate.cvFilename) {
        return res.status(404).json({ message: "Geen CV gevonden" });
      }
      if (!candidate.cvFilename.startsWith('http')) {
        return res.status(404).json({ message: "CV niet meer beschikbaar" });
      }

      // preview=1 → inline weergave (geen download-header); anders forceer download
      const isPreview = req.query.preview === '1';

      const storagePath = extractCvStoragePath(candidate.cvFilename);
      if (!storagePath) {
        return res.redirect(candidate.cvFilename);
      }

      const ext = storagePath.split('.').pop()?.toLowerCase() ?? 'bin';
      const mimeType = ext === 'pdf'
        ? 'application/pdf'
        : ext === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/octet-stream';

      // Altijd server-side proxy: haal het bestand op en stuur het zelf door.
      // Dit voorkomt CORS-problemen en geeft ons volledige controle over Content-Disposition.
      const { data: fileBlob, error: dlErr } = await getSupabaseAdmin()
        .storage.from('cvs').download(storagePath);

      if (dlErr || !fileBlob) {
        // Laatste fallback: probeer signed URL
        const { data, error } = await getSupabaseAdmin()
          .storage.from('cvs')
          .createSignedUrl(storagePath, 3600, { download: !isPreview });
        if (error || !data?.signedUrl) {
          console.error("Supabase signed URL fout:", error?.message);
          return res.status(404).json({ message: "CV niet beschikbaar in Supabase" });
        }
        return res.redirect(data.signedUrl);
      }

      const safeName = encodeURIComponent(storagePath.split('/').pop() || 'cv');
      res.setHeader('Content-Type', mimeType);
      if (isPreview) {
        // Inline: laat de browser het bestand tonen i.p.v. downloaden
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      }
      return res.send(Buffer.from(await fileBlob.arrayBuffer()));
    } catch (error) {
      console.error("Error serving CV:", error);
      return res.status(500).json({ message: "Fout bij ophalen CV" });
    }
  });

  // Convert docx CV to HTML for preview
  app.get("/api/admin/candidates/:id/cv-html", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidate(id);
      if (!candidate || !candidate.cvFilename) {
        return res.status(404).json({ message: "Geen CV gevonden" });
      }
      if (!candidate.cvFilename.startsWith('http')) {
        return res.status(404).json({ message: "CV niet meer beschikbaar" });
      }
      const ext = candidate.cvFilename.includes('.') ? '.' + candidate.cvFilename.split('.').pop()!.split('?')[0].toLowerCase() : '';
      if (ext !== '.docx' && ext !== '.doc') {
        return res.status(400).json({ message: "Alleen Word-bestanden kunnen worden omgezet" });
      }

      // Download via Supabase admin client (werkt voor publieke én private buckets)
      const storagePath = extractCvStoragePath(candidate.cvFilename);
      let cvBuffer: Buffer;

      if (storagePath) {
        const { data: fileBlob, error: dlErr } = await getSupabaseAdmin()
          .storage.from('cvs').download(storagePath);
        if (dlErr || !fileBlob) {
          return res.status(404).json({ message: "CV niet beschikbaar in Supabase" });
        }
        cvBuffer = Buffer.from(await fileBlob.arrayBuffer());
      } else {
        // Fallback: probeer publieke URL
        const cvResponse = await fetch(candidate.cvFilename);
        if (!cvResponse.ok) {
          return res.status(404).json({ message: "CV niet beschikbaar" });
        }
        cvBuffer = Buffer.from(await cvResponse.arrayBuffer());
      }

      // Extract and convert docx to HTML using adm-zip
      const zip = new AdmZip(cvBuffer);
      const documentEntry = zip.getEntry("word/document.xml");
      if (!documentEntry) {
        return res.status(500).json({ message: "Ongeldig Word-bestand" });
      }
      const xmlContent = documentEntry.getData().toString("utf-8");

      // Simple XML to HTML conversion
      function docxXmlToHtml(xml: string): string {
        let html = "";
        // Process paragraphs
        const paragraphRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
        const paragraphs = xml.match(paragraphRegex) || [];

        for (const para of paragraphs) {
          // Determine paragraph style
          const styleMatch = para.match(/<w:pStyle w:val="([^"]+)"/);
          const style = styleMatch ? styleMatch[1].toLowerCase() : "";

          // Extract text runs, preserving spaces
          const textRegex = /<w:t(?:[^>]* xml:space="preserve"[^>]*)?>([^<]*)<\/w:t>|<w:t>([^<]*)<\/w:t>/g;
          let text = "";
          let match;
          while ((match = textRegex.exec(para)) !== null) {
            text += (match[1] || match[2] || "");
          }

          // Check for bold
          const isBold = /<w:b(?:\/>| w:val="1")/.test(para) && !/<w:bCs\/>/.test(para);

          if (!text.trim()) {
            html += "<br>";
            continue;
          }

          if (style.startsWith("heading") || style.startsWith("kop") || style === "title") {
            const level = style.match(/\d+/)?.[0] || "2";
            const hNum = Math.min(parseInt(level) + 1, 6);
            html += `<h${hNum}>${escHtml(text)}</h${hNum}>`;
          } else if (isBold && text.trim()) {
            html += `<p><strong>${escHtml(text)}</strong></p>`;
          } else {
            html += `<p>${escHtml(text)}</p>`;
          }
        }
        return html;
      }

      function escHtml(str: string): string {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      const html = docxXmlToHtml(xmlContent);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html || "<p>Geen tekst gevonden in dit document.</p>");
    } catch (error) {
      console.error("Error converting CV to HTML:", error);
      return res.status(500).json({ message: "Fout bij omzetten CV" });
    }
  });

  // Delete candidate
  app.delete("/api/admin/candidates/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCandidate(id);
      if (!deleted) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }
      return res.json({ message: "Sollicitant verwijderd" });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de sollicitant" });
    }
  });

  // Configure multer for candidate photo uploads
  const candidatePhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'candidates');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const candidateId = req.params.id;
      const ext = path.extname(file.originalname);
      const filename = `candidate-${candidateId}-${Date.now()}${ext}`;
      cb(null, filename);
    }
  });

  const candidatePhotoUpload = multer({
    storage: candidatePhotoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Alleen JPEG, PNG en WebP afbeeldingen zijn toegestaan'));
      }
    }
  });

  // Upload candidate photo
  app.post("/api/admin/candidates/:id/photo", adminMiddleware, candidatePhotoUpload.single('photo'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Geen foto geüpload" });
      }

      const candidate = await storage.getCandidate(id);
      if (!candidate) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }

      // Delete old photo if exists
      if (candidate.photoUrl) {
        const oldPath = path.join(process.cwd(), candidate.photoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const photoUrl = `/uploads/candidates/${file.filename}`;
      await storage.updateCandidate(id, { photoUrl });

      return res.json({ 
        message: "Foto succesvol geüpload",
        photoUrl 
      });
    } catch (error) {
      console.error("Error uploading candidate photo:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het uploaden van de foto" });
    }
  });

  // Delete candidate photo
  app.delete("/api/admin/candidates/:id/photo", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidate(id);
      
      if (!candidate) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }

      if (candidate.photoUrl) {
        const photoPath = path.join(process.cwd(), candidate.photoUrl);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
        await storage.updateCandidate(id, { photoUrl: null });
      }

      return res.json({ message: "Foto verwijderd" });
    } catch (error) {
      console.error("Error deleting candidate photo:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de foto" });
    }
  });

  // Anonymize candidate (GDPR)
  app.post("/api/admin/candidates/:id/anonymize", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.anonymizeCandidate(id, req.session?.userId);
      if (!success) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }
      return res.json({ message: "Sollicitant geanonimiseerd conform AVG" });
    } catch (error) {
      console.error("Error anonymizing candidate:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het anonimiseren" });
    }
  });

  // Get candidate audit logs
  app.get("/api/admin/candidates/:id/audit-logs", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const logs = await storage.getCandidateAuditLogs(id);
      return res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de audit logs" });
    }
  });

  // ==========================================
  // Salary Scales API Routes
  // ==========================================

  // Get all salary scales
  app.get("/api/admin/salary-scales", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { functionType } = req.query;
      const scales = await storage.getSalaryScales(functionType as string | undefined);
      return res.json(scales);
    } catch (error) {
      console.error("Error fetching salary scales:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van salarisschalen" });
    }
  });

  // Create salary scale
  app.post("/api/admin/salary-scales", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSalaryScaleSchema.parse(req.body);
      const scale = await storage.createSalaryScale(validatedData);
      return res.status(201).json(scale);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error creating salary scale:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het aanmaken van de salarisschaal" });
    }
  });

  // Update salary scale
  app.patch("/api/admin/salary-scales/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedScale = await storage.updateSalaryScale(id, req.body);
      if (!updatedScale) {
        return res.status(404).json({ message: "Salarisschaal niet gevonden" });
      }
      return res.json(updatedScale);
    } catch (error) {
      console.error("Error updating salary scale:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de salarisschaal" });
    }
  });

  // Delete salary scale
  app.delete("/api/admin/salary-scales/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSalaryScale(id);
      if (!deleted) {
        return res.status(404).json({ message: "Salarisschaal niet gevonden" });
      }
      return res.json({ message: "Salarisschaal verwijderd" });
    } catch (error) {
      console.error("Error deleting salary scale:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de salarisschaal" });
    }
  });

  // Get salary scale by age
  app.get("/api/admin/salary-scales/by-age/:age", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const age = parseInt(req.params.age);
      const { functionType } = req.query;
      const scale = await storage.getSalaryScaleByAge(age, functionType as string | undefined);
      if (!scale) {
        return res.status(404).json({ message: "Geen salarisschaal gevonden voor deze leeftijd" });
      }
      return res.json(scale);
    } catch (error) {
      console.error("Error fetching salary scale by age:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de salarisschaal" });
    }
  });

  // ==========================================
  // Candidate Import API Routes
  // ==========================================

  // Get all imports
  app.get("/api/admin/candidate-imports", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const imports = await storage.getCandidateImports();
      return res.json(imports);
    } catch (error) {
      console.error("Error fetching candidate imports:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van imports" });
    }
  });

  // Create import job
  app.post("/api/admin/candidate-imports", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCandidateImportSchema.parse({
        ...req.body,
        createdByUserId: req.session?.userId
      });
      const importJob = await storage.createCandidateImport(validatedData);
      return res.status(201).json(importJob);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validatiefout", details: error.errors });
      }
      console.error("Error creating candidate import:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het starten van de import" });
    }
  });

  // Get import status
  app.get("/api/admin/candidate-imports/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const importJob = await storage.getCandidateImport(id);
      if (!importJob) {
        return res.status(404).json({ message: "Import niet gevonden" });
      }
      return res.json(importJob);
    } catch (error) {
      console.error("Error fetching candidate import:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van de import" });
    }
  });

  // ==========================================
  // KPI Rapportage endpoint
  app.get("/api/admin/kpi", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      const { candidates: allCandidates } = await storage.getCandidates({ limit: 10000 });

      const filterFrom = from ? new Date(from as string) : null;
      const filterTo = to ? new Date(to as string) : null;

      const filtered = allCandidates.filter((c: any) => {
        const d = new Date(c.createdAt);
        if (filterFrom && d < filterFrom) return false;
        if (filterTo && d > filterTo) return false;
        return true;
      });

      const total = filtered.length;
      const metCv = filtered.filter((c: any) => c.hasCv).length;
      const gesprekGepland = filtered.filter((c: any) => !!c.interviewDate).length;
      const aangenomen = filtered.filter((c: any) => c.status === 'aangenomen').length;
      const afgewezen = filtered.filter((c: any) => c.status === 'afgewezen').length;
      const inBehandeling = filtered.filter((c: any) => c.status === 'in_behandeling').length;

      // Doorlooptijd: aanmeld → gesprek (in days)
      const withInterview = filtered.filter((c: any) => c.interviewDate && c.createdAt);
      const avgDaysToInterview = withInterview.length > 0
        ? Math.round(withInterview.reduce((sum: number, c: any) => {
            const diff = (new Date(c.interviewDate).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return sum + Math.max(0, diff);
          }, 0) / withInterview.length)
        : null;

      // Bron verdeling
      const bronMap: Record<string, number> = {};
      filtered.forEach((c: any) => {
        const bron = c.sourceChannel || 'Onbekend';
        bronMap[bron] = (bronMap[bron] || 0) + 1;
      });
      const bronVerdeling = Object.entries(bronMap)
        .map(([bron, count]) => ({ bron, count }))
        .sort((a, b) => b.count - a.count);

      // Functie verdeling
      const functieMap: Record<string, { total: number; aangenomen: number; afgewezen: number }> = {};
      filtered.forEach((c: any) => {
        const fn = c.functionType || 'Onbekend';
        if (!functieMap[fn]) functieMap[fn] = { total: 0, aangenomen: 0, afgewezen: 0 };
        functieMap[fn].total++;
        if (c.status === 'aangenomen') functieMap[fn].aangenomen++;
        if (c.status === 'afgewezen') functieMap[fn].afgewezen++;
      });
      const functieVerdeling = Object.entries(functieMap)
        .map(([functie, data]) => ({ functie, ...data }))
        .sort((a, b) => b.total - a.total);

      // Nationaliteit verdeling (top 10)
      const natMap: Record<string, number> = {};
      filtered.forEach((c: any) => {
        const nat = c.nationality || 'Onbekend';
        natMap[nat] = (natMap[nat] || 0) + 1;
      });
      const nationaliteitVerdeling = Object.entries(natMap)
        .map(([nationaliteit, count]) => ({ nationaliteit, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

      // Maandelijkse trend (laatste 12 maanden)
      const now = new Date();
      const maandTrend = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const label = d.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' });
        const maandCandidates = allCandidates.filter((c: any) => {
          const cd = new Date(c.createdAt);
          return cd >= d && cd < nextD;
        });
        maandTrend.push({
          label,
          aanmeldingen: maandCandidates.length,
          aangenomen: maandCandidates.filter((c: any) => c.status === 'aangenomen').length,
          gesprekken: maandCandidates.filter((c: any) => !!c.interviewDate).length,
        });
      }

      // Conversieratio's
      const ratioGesprek = total > 0 ? Math.round((gesprekGepland / total) * 100) : 0;
      const ratioCv = total > 0 ? Math.round((metCv / total) * 100) : 0;
      const ratioAangenomen = total > 0 ? Math.round((aangenomen / total) * 100) : 0;
      const ratioAfgewezen = total > 0 ? Math.round((afgewezen / total) * 100) : 0;

      return res.json({
        trechter: { total, metCv, gesprekGepland, aangenomen, afgewezen, inBehandeling },
        ratios: { ratioCv, ratioGesprek, ratioAangenomen, ratioAfgewezen },
        avgDaysToInterview,
        bronVerdeling,
        functieVerdeling,
        nationaliteitVerdeling,
        maandTrend,
      });
    } catch (error) {
      console.error("Error fetching KPI data:", error);
      return res.status(500).json({ message: "Fout bij ophalen KPI-data" });
    }
  });

  // Public Sollicitatie Form API (no auth required)
  // ==========================================
  
  // GET applications for admin
  app.get("/api/admin/applications", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { functionType, interviewer, status, dateFrom, dateTo, search, limit, offset } = req.query;
      const result = await storage.getApplications({
        functionType: functionType as string,
        interviewer: interviewer as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : 10000,
        offset: offset ? parseInt(offset as string) : 0,
      });
      return res.json(result);
    } catch (error) {
      console.error("Error fetching applications:", error);
      return res.status(500).json({ message: "Fout bij ophalen sollicitaties" });
    }
  });

  app.get("/api/admin/applications/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const app = await storage.getApplicationById(parseInt(req.params.id));
      if (!app) return res.status(404).json({ message: "Sollicitatie niet gevonden" });
      return res.json(app);
    } catch (error) {
      console.error("Error fetching application:", error);
      return res.status(500).json({ message: "Fout bij ophalen sollicitatie" });
    }
  });

  app.patch("/api/admin/applications/:id/status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const updated = await storage.updateApplicationStatus(parseInt(req.params.id), status);
      if (!updated) return res.status(404).json({ message: "Sollicitatie niet gevonden" });
      if (status === 'afgewezen' && updated.email && updated.firstName) {
        sendApplicationRejectionEmail({ firstName: updated.firstName, email: updated.email }).catch(err =>
          console.error("Fout bij versturen afwijzingsmail:", err)
        );
      }
      return res.json(updated);
    } catch (error) {
      console.error("Error updating application status:", error);
      return res.status(500).json({ message: "Fout bij bijwerken status" });
    }
  });

  // Update admin notes (referenties) voor een sollicitatie
  app.patch("/api/admin/applications/:id/notes", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { adminNotes } = req.body;
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const [updated] = await db.update(applications)
        .set({ adminNotes })
        .where(eq(applications.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Sollicitatie niet gevonden" });
      return res.json(updated);
    } catch (error) {
      console.error("Error updating application notes:", error);
      return res.status(500).json({ message: "Fout bij opslaan notities" });
    }
  });

  // Bulk delete applications by function type
  app.delete("/api/admin/applications/bulk", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { functionType } = req.body;
      if (!functionType) return res.status(400).json({ message: "functionType vereist" });
      const deleted = await db.delete(applications).where(eq(applications.functionType, functionType)).returning({ id: applications.id });
      return res.json({ deleted: deleted.length });
    } catch (error) {
      console.error("Error bulk deleting applications:", error);
      return res.status(500).json({ message: "Fout bij verwijderen" });
    }
  });

  app.post("/api/sollicitatie", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      
      // Map form data to candidate schema (matching existing column names)
      const candidateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        functionType: data.functionType,
        status: 'in_behandeling' as const,
        city: data.city || null,
        birthDate: data.birthDate || null,
        nationality: data.nationality || null,
        needsTwv: data.needsWorkPermit === 'ja',
        twvStatus: data.needsWorkPermit === 'ja' ? 'twv_nodig' : null,
        language: (data.languages || []).join(', '),
        
        // Experience
        horecaExperience: data.horecaExperience || null,
        previousExperience: (data.experienceTypes || []).join(', '),
        isOnlyJob: !data.otherJob,
        
        // Skills (Horecamedewerker specific)
        canCarryThreePlates: data.canCarry3Plates === 'ja',
        isBarista: data.isBarista === 'ja',
        canMakeCocktails: data.canShakeCocktails === 'ja',
        serviceScore: data.serviceSkills ? data.serviceSkills * 20 : null,  // Convert 1-5 to 0-100
        barScore: data.barSkills ? data.barSkills * 20 : null,
        dinerScore: data.dinerSkills ? data.dinerSkills * 20 : null,
        isAssistantChef: data.isAssistantChef === 'ja',
        canDoWashing: data.canWashDishes === 'ja',
        isPromoter: data.isPromoWorker === 'ja',
        
        // Practical
        hasDriversLicense: data.hasDriversLicense === 'ja',
        hasOvChipkaart: data.hasStudentOV === 'ja',
        workClothing: (data.workClothing || []).join(', '),
        
        // Availability
        availability: data.availableHours || null,
        preferredWorkdays: (data.preferredDays || []).join(', '),
        partOfDayPreference: (data.preferredTimes || []).join(', '),
        
        // Assessment
        assessmentResult: data.assessmentRating || null,
        experienceLevel: data.experienceLevel || null,
        appearance: data.appearance || null,
        attitude: data.attitude || null,
        communicationScore: data.communicationSkills || null,
        overallImpressionScore: data.overallImpression || null,
        softSkillsScore: data.communicationSkills && data.overallImpression 
          ? Math.round((data.communicationSkills * 20 + data.overallImpression * 20) / 2)
          : null,
        
        // Source/channel
        sourceChannel: data.channel || null,
        
        // Remarks
        notes: data.remarks || null,

        // Aangemaakt via intern sollicitatieformulier, niet via website-aanmeldflow
        isInternalInterview: true,
      };

      const candidate = await storage.createCandidate(candidateData as any);

      // Admin notificatie: intern sollicitatieformulier ingestuurd
      storage.createAdminNotification({
        type: 'sollicitatie_form',
        title: 'Sollicitatieformulier ingestuurd',
        message: `Intake van ${candidate.firstName} ${candidate.lastName} (${candidate.functionType}) is opgeslagen.`,
        link: '/dashboard?tab=kandidaten',
        candidateId: candidate.id,
      }).catch((e: any) => console.error('[Notif] Sollicitatie-notificatie fout:', e));

      // Compute scores
      const computeHorecaSkillScore = (rating: number | undefined): number | null => {
        const r = parseInt(String(rating));
        if (!r || r < 1 || r > 5) return null;
        return r * 20;
      };

      const computeSoftskills = (d: any): number | null => {
        const norm1to5 = (v: any): number | null => {
          const n = parseInt(String(v));
          if (!n || n < 1 || n > 5) return null;
          return (n - 1) / 4;
        };
        const appearanceVal = d.appearance === 'verzorgd' ? 0.75 : d.appearance === 'onverzorgd' ? 0 : null;
        const attitudeMap: Record<string, number> = { super_enthousiast: 1, spontaan: 0.75, verlegen: 0.5, ongeinteresseerd: 0 };
        const attitudeVal = d.attitude ? (attitudeMap[d.attitude] ?? null) : null;
        const ratingMap: Record<string, number> = { topper: 1, goede_indruk: 0.75, middelmatig: 0.25 };
        const beoordelingVal = d.assessmentRating ? (ratingMap[d.assessmentRating] ?? null) : null;
        const commVal = norm1to5(d.communicationSkills);
        const indrukVal = norm1to5(d.overallImpression);

        const inputs = [
          { w: 0.30, v: commVal },
          { w: 0.25, v: attitudeVal },
          { w: 0.15, v: appearanceVal },
          { w: 0.20, v: beoordelingVal },
          { w: 0.10, v: indrukVal },
        ];
        const available = inputs.filter(x => x.v !== null);
        if (available.length === 0) return null;
        const totalWeight = available.reduce((s, x) => s + x.w, 0);
        const weighted = available.reduce((s, x) => s + x.w * (x.v as number), 0);
        return Math.round((weighted / totalWeight) * 100);
      };

      const softskillsScore = computeSoftskills(data);
      const barScore = computeHorecaSkillScore(data.barSkills);
      const bedieningScore = computeHorecaSkillScore(data.serviceSkills);
      const dinerScore = computeHorecaSkillScore(data.dinerSkills);

      // Also save as an application record with full form data
      const application = await storage.createApplication({
        candidateId: data.linkedCandidateId || candidate.id,
        functionType: data.functionType,
        interviewer: data.interviewer || null,
        status: "nieuw",
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        city: data.city || null,
        assessmentRating: data.assessmentRating || null,
        salaryScale: data.salaryScale || null,
        formData: data,
        softskillsScore: softskillsScore ?? undefined,
        barScore: barScore ?? undefined,
        bedieningScore: bedieningScore ?? undefined,
        dinerScore: dinerScore ?? undefined,
      });

      // Stuur direct door naar Planbord — iedereen die niet afgewezen wordt, is aangenomen
      sendPlanbordWebhook({
        id: application.id,
        firstName: data.firstName,
        lastName: data.lastName,
        functionType: data.functionType ?? '',
      }).catch(err => console.error('[Webhook] Fout na createApplication:', err));

      return res.status(201).json({ 
        message: "Sollicitatie succesvol opgeslagen",
        candidateId: candidate.id 
      });
    } catch (error) {
      console.error("Error saving sollicitatie:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het opslaan van de sollicitatie" });
    }
  });

  app.post("/api/staffing-request", async (req: Request, res: Response) => {
    try {
      const { staffingRequests } = await import("@shared/schema");
      const body = req.body;
      const data = {
        companyName: body.companyName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        locationType: body.locationType,
        locationTypeOther: body.locationTypeOther || null,
        functions: Array.isArray(body.functions) ? body.functions : [],
        staffCount: body.staffCount ? parseInt(body.staffCount) : null,
        datesPeriod: body.datesPeriod || null,
        locationAddress: body.locationAddress || null,
        locationName: body.locationName || null,
        deploymentType: body.deploymentType || null,
        urgency: body.urgency || null,
        notes: body.notes || null,
        wantsCallback: !!body.wantsCallback,
        wantsFavoritePool: !!body.wantsFavoritePool,
      };
      if (!data.companyName || !data.contactName || !data.email || !data.phone) {
        return res.status(400).json({ message: "Vul alle verplichte velden in." });
      }
      const [result] = await db.insert(staffingRequests).values(data).returning();

      // Admin notificatie: nieuwe aanvraag
      storage.createAdminNotification({
        type: 'staffing_request',
        title: 'Nieuwe personeelsaanvraag',
        message: `${data.companyName} heeft een aanvraag ingediend${data.functions?.length ? ` voor ${data.functions.join(', ')}` : ''}.`,
        link: '/dashboard?tab=aanvragen',
      }).catch((e: any) => console.error('[Notif] Staffing-notificatie fout:', e));

      // Auto-create CRM lead from staffing request
      try {
        const locationTypeToCrmType: Record<string, string> = {
          hotel: 'hotel', restaurant: 'restaurant', eventlocatie: 'eventlocatie',
          cateraar: 'cateraar', catering: 'cateraar', event: 'eventlocatie',
        };
        const crmType = locationTypeToCrmType[data.locationType?.toLowerCase() || ''] || 'hotel';
        const existingCompanies = await storage.getCrmCompanies({ search: data.companyName });
        const existingMatch = existingCompanies.find(
          (c: any) => c.name.toLowerCase().trim() === data.companyName.toLowerCase().trim()
        );
        if (existingMatch) {
          // Update existing company: ensure "Hot lead" tag is added
          const currentTags: string[] = existingMatch.tags || [];
          if (!currentTags.includes('Hot lead')) {
            await storage.updateCrmCompany(existingMatch.id, { tags: [...currentTags, 'Hot lead'] });
          }
        } else {
          // Create new CRM prospect from this staffing request
          const urgencyNote = data.urgency === 'zo_snel_mogelijk'
            ? 'Urgentie: zo snel mogelijk.'
            : data.urgency === 'deze_week' ? 'Urgentie: deze week.'
            : data.urgency === 'volgende_week' ? 'Urgentie: volgende week.' : '';
          const notesText = [
            `Aanvraag via personeelsaanvraagformulier. Contact: ${data.contactName} (${data.email}, ${data.phone}).`,
            data.functions?.length ? `Functies: ${data.functions.join(', ')}.` : '',
            data.staffCount ? `Aantal medewerkers: ${data.staffCount}.` : '',
            data.datesPeriod ? `Periode: ${data.datesPeriod}.` : '',
            urgencyNote,
            data.notes ? `Extra info: ${data.notes}` : '',
          ].filter(Boolean).join(' ');
          await storage.createCrmCompany({
            name: data.companyName,
            type: crmType,
            isClient: false,
            phase: 'nieuw',
            owner: 'max',
            potential: data.urgency === 'zo_snel_mogelijk' ? 'hoog' : 'midden',
            source: 'website',
            tags: ['Hot lead'],
            notes: notesText,
            staffingRequestId: result.id,
          } as any);
        }
        // Create a contact for the person who submitted
        const newCompanies = await storage.getCrmCompanies({ search: data.companyName });
        const company = newCompanies.find((c: any) => c.name.toLowerCase().trim() === data.companyName.toLowerCase().trim());
        if (company) {
          await storage.createCrmContact({ companyId: company.id, name: data.contactName, email: data.email, phone: data.phone, isPrimary: true } as any);
        }
      } catch (crmErr) {
        console.error('CRM auto-create error (non-fatal):', crmErr);
      }

      // Notify admins about new staffing request
      try {
        const allUsers = await storage.getUsers();
        const adminUserIds = allUsers.filter((u: any) => u.role === 'admin').map((u: any) => u.id);

        const pushService = getPushNotificationService();
        if (pushService && adminUserIds.length > 0) {
          pushService.sendStaffingRequestAlert(adminUserIds, data.companyName, data.contactName, data.functions).catch(console.error);
        }

        if (typeof (global as any).broadcastNotification === 'function') {
          (global as any).broadcastNotification(
            'new_staffing_request',
            {
              message: `🏢 Nieuwe personeelsaanvraag van ${data.companyName} (${data.contactName})`,
              data: { requestId: result.id, companyName: data.companyName, functions: data.functions },
            },
            undefined,
            'admin'
          );
        }
      } catch (notifErr) {
        console.error('Fout bij versturen personeelsaanvraag-notificatie:', notifErr);
      }

      // E-mail notificatie naar intern team
      try {
        const { sendEmail } = await import('./mail');
        const urgencyLabel: Record<string, string> = {
          zo_snel_mogelijk: 'Zo snel mogelijk',
          deze_week: 'Deze week',
          volgende_week: 'Volgende week',
          nog_niet_bekend: 'Nog niet bekend',
        };
        const locationTypeLabel: Record<string, string> = {
          hotel: 'Hotel', restaurant: 'Restaurant', eventlocatie: 'Eventlocatie',
          cateraar: 'Cateraar', catering: 'Catering', event: 'Event', anders: 'Anders',
        };
        const rows = [
          ['Bedrijf', data.companyName],
          ['Contactpersoon', data.contactName],
          ['E-mail', data.email],
          ['Telefoon', data.phone],
          ['Type locatie', locationTypeLabel[data.locationType] || data.locationType],
          data.locationTypeOther ? ['Soort locatie (overig)', data.locationTypeOther] : null,
          ['Functies', data.functions.join(', ')],
          data.staffCount ? ['Aantal medewerkers', String(data.staffCount)] : null,
          data.datesPeriod ? ['Periode / data', data.datesPeriod] : null,
          data.locationAddress ? ['Locatieadres', data.locationAddress] : null,
          data.locationName ? ['Locatienaam', data.locationName] : null,
          data.deploymentType ? ['Inzettype', data.deploymentType] : null,
          data.urgency ? ['Urgentie', urgencyLabel[data.urgency] || data.urgency] : null,
          ['Terugbelverzoek', data.wantsCallback ? 'Ja' : 'Nee'],
          ['Favorietenpool', data.wantsFavoritePool ? 'Ja' : 'Nee'],
          data.notes ? ['Opmerkingen', data.notes] : null,
        ].filter(Boolean) as [string, string][];

        const tableRows = rows.map(([label, value]) =>
          `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:180px;white-space:nowrap;">${label}</td><td style="padding:6px 12px;color:#111827;border:1px solid #e5e7eb;">${value}</td></tr>`
        ).join('');

        const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#7c3aed;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;color:#fff;font-size:18px;">🏢 Nieuwe personeelsaanvraag</h2>
    <p style="margin:4px 0 0;color:#ddd6fe;font-size:13px;">Ingediend via doehetextra.nl</p>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${tableRows}</table>
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
      Bekijk de aanvraag in het dashboard: <a href="https://doehetextra.nl/dashboard" style="color:#7c3aed;">dashboard openen</a>
    </p>
  </div>
</div>`;

        await sendEmail({
          to: ['max@doehetextra.nl', 'eveline@doehetextra.nl'],
          from: 'EXTRA Systeem <max@doehetextra.nl>',
          subject: `Nieuwe personeelsaanvraag: ${data.companyName} (${data.contactName})`,
          html,
          text: `Nieuwe personeelsaanvraag van ${data.companyName}.\nContactpersoon: ${data.contactName}\nE-mail: ${data.email}\nTelefoon: ${data.phone}\nFuncties: ${data.functions.join(', ')}\n${data.notes ? `Opmerkingen: ${data.notes}` : ''}`,
        });
        console.log(`[StaffingRequest] E-mail notificatie verzonden voor aanvraag #${result.id} (${data.companyName})`);
      } catch (emailErr) {
        console.error('[StaffingRequest] Fout bij e-mail notificatie:', emailErr);
      }

      return res.status(201).json({ success: true, id: result.id });
    } catch (error) {
      console.error("Error saving staffing request:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het opslaan van de aanvraag" });
    }
  });

  // ─── Staffing requests (admin) ───────────────────────────────────────────
  app.get("/api/admin/staffing-requests", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const { staffingRequests } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      const results = await db.select().from(staffingRequests).orderBy(desc(staffingRequests.createdAt));
      return res.json(results);
    } catch (error) {
      console.error("Error fetching staffing requests:", error);
      return res.status(500).json({ message: "Fout bij ophalen personeelsaanvragen" });
    }
  });

  app.get("/api/admin/staffing-requests/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { staffingRequests } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = parseInt(req.params.id);
      const [result] = await db.select().from(staffingRequests).where(eq(staffingRequests.id, id));
      if (!result) return res.status(404).json({ message: "Aanvraag niet gevonden" });
      return res.json(result);
    } catch (error) {
      console.error("Error fetching staffing request:", error);
      return res.status(500).json({ message: "Fout bij ophalen personeelsaanvraag" });
    }
  });

  app.patch("/api/admin/staffing-requests/:id/status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { staffingRequests } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const [result] = await db.update(staffingRequests).set({ status }).where(eq(staffingRequests.id, id)).returning();
      if (!result) return res.status(404).json({ message: "Aanvraag niet gevonden" });
      return res.json(result);
    } catch (error) {
      console.error("Error updating staffing request status:", error);
      return res.status(500).json({ message: "Fout bij updaten status" });
    }
  });

  // ─── TWV (Tewerkstellingsvergunning) routes ───────────────────────────────

  // Get all TWV candidates (needsTwv = true)
  app.get("/api/admin/twv", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const twvCandidates = await storage.getTwvCandidates();
      return res.json(twvCandidates);
    } catch (error) {
      console.error("Fout bij ophalen TWV kandidaten:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // Update TWV status + dates for a candidate
  app.patch("/api/admin/twv/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const { twvStatus, twvStartDate, twvEndDate, twvNotes, needsTwv } = req.body;
      const updateData: Record<string, any> = {};
      if (twvStatus !== undefined) updateData.twvStatus = twvStatus;
      if (twvStartDate !== undefined) updateData.twvStartDate = twvStartDate;
      if (twvEndDate !== undefined) updateData.twvEndDate = twvEndDate;
      if (twvNotes !== undefined) updateData.twvNotes = twvNotes;
      if (needsTwv !== undefined) updateData.needsTwv = needsTwv;
      const updated = await storage.updateCandidate(id, updateData as any);
      if (!updated) return res.status(404).json({ message: "Kandidaat niet gevonden" });
      return res.json(updated);
    } catch (error) {
      console.error("Fout bij updaten TWV status:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // Handmatig een bestaande kandidaat aan TWV-tracking toevoegen
  app.post("/api/admin/twv/add-candidate", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { candidateId, twvStatus, twvStartDate, twvEndDate, twvNotes } = req.body;
      const id = parseInt(candidateId);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig kandidaat ID" });
      const updateData: Record<string, any> = {
        needsTwv: true,
        twvStatus: twvStatus || 'twv_verstrekt',
      };
      if (twvStartDate) updateData.twvStartDate = twvStartDate;
      if (twvEndDate) updateData.twvEndDate = twvEndDate;
      if (twvNotes) updateData.twvNotes = twvNotes;
      const updated = await storage.updateCandidate(id, updateData as any);
      if (!updated) return res.status(404).json({ message: "Kandidaat niet gevonden" });
      return res.json(updated);
    } catch (error) {
      console.error("Fout bij handmatig toevoegen TWV:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // Nieuwe medewerker aanmaken en direct aan TWV toevoegen
  app.post("/api/admin/twv/create-and-add", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, functionType, email, nationality, twvStatus, twvStartDate, twvEndDate, twvNotes } = req.body;
      if (!firstName || !lastName) return res.status(400).json({ message: "Voornaam en achternaam zijn verplicht" });
      if (!functionType) return res.status(400).json({ message: "Functie is verplicht" });
      const newCandidate = await storage.createCandidate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        functionType: functionType as any,
        email: email?.trim() || null,
        nationality: nationality?.trim() || null,
        needsTwv: true,
        twvStatus: twvStatus || 'twv_verstrekt',
        twvStartDate: twvStartDate || null,
        twvEndDate: twvEndDate || null,
        twvNotes: twvNotes || null,
        status: 'in_behandeling',
        sourceChannel: 'handmatig',
        isInternalInterview: true,
        partialForm: false,
      } as any);
      return res.json(newCandidate);
    } catch (error) {
      console.error("Fout bij aanmaken en toevoegen TWV:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // Bulk import van TWV-gegevens vanuit CSV (frontend parsed → JSON array)
  app.post("/api/admin/twv/import", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const rows: Array<{ email?: string; firstName?: string; lastName?: string; twvStatus?: string; twvStartDate?: string; twvEndDate?: string; twvNotes?: string }> = req.body.rows || [];
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen rijen opgegeven" });
      const result = await storage.getCandidates();
      const allCandidates = Array.isArray(result) ? result : (result as any).candidates ?? [];
      const results: { email: string; status: 'ok' | 'not_found' | 'error' }[] = [];
      for (const row of rows) {
        try {
          const match = allCandidates.find((c: any) =>
            (row.email && c.email?.toLowerCase() === row.email.toLowerCase()) ||
            (row.firstName && row.lastName &&
              c.firstName?.toLowerCase() === row.firstName.toLowerCase() &&
              c.lastName?.toLowerCase() === row.lastName.toLowerCase())
          );
          if (!match) {
            results.push({ email: row.email || `${row.firstName} ${row.lastName}`, status: 'not_found' });
            continue;
          }
          const updateData: Record<string, any> = { needsTwv: true, twvStatus: row.twvStatus || 'twv_verstrekt' };
          if (row.twvStartDate) updateData.twvStartDate = row.twvStartDate;
          if (row.twvEndDate) updateData.twvEndDate = row.twvEndDate;
          if (row.twvNotes) updateData.twvNotes = row.twvNotes;
          await storage.updateCandidate(match.id, updateData as any);
          results.push({ email: row.email || `${row.firstName} ${row.lastName}`, status: 'ok' });
        } catch {
          results.push({ email: row.email || `${row.firstName} ${row.lastName}`, status: 'error' });
        }
      }
      return res.json({ imported: results.filter(r => r.status === 'ok').length, total: rows.length, results });
    } catch (error) {
      console.error("Fout bij TWV import:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij de import" });
    }
  });

  // Export TWV candidates as CSV for arbeidsinspectie
  app.get("/api/admin/twv/export", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const twvCandidates = await storage.getTwvCandidates();
      const statusLabels: Record<string, string> = {
        twv_nodig: 'TWV Nodig',
        twv_aangevraagd: 'TWV Aangevraagd',
        info_nodig: 'Info nodig',
        twv_verstrekt: 'TWV Verstrekt',
        twv_verlopen: 'TWV Verlopen',
      };
      const rows = [
        ['ID', 'Voornaam', 'Achternaam', 'Nationaliteit', 'Functie', 'TWV Status', 'Startdatum TWV', 'Einddatum TWV', 'Aangemeld op'],
        ...twvCandidates.map((c: any) => [
          c.id,
          c.firstName,
          c.lastName,
          c.nationality || '',
          c.functionType || '',
          statusLabels[c.twvStatus] || c.twvStatus || 'Onbekend',
          c.twvStartDate || '',
          c.twvEndDate || '',
          c.createdAt ? new Date(c.createdAt).toLocaleDateString('nl-NL') : '',
        ]),
      ];
      const csv = rows.map(row => row.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="twv-export-${new Date().toISOString().slice(0,10)}.csv"`);
      return res.send('\uFEFF' + csv); // BOM voor Excel
    } catch (error) {
      console.error("Fout bij TWV export:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden bij de export" });
    }
  });

  // Manual trigger: check and send TWV reminders now
  app.post("/api/admin/twv/check-reminders", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const count = await checkTwvReminders();
      return res.json({ success: true, remindersSent: count });
    } catch (error) {
      console.error("Fout bij TWV reminder check:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // ─── TWV reminder scheduler (dagelijks om 9:00) ───────────────────────────
  async function checkTwvReminders(): Promise<number> {
    let remindersSent = 0;
    try {
      const allTwv = await storage.getTwvCandidates();
      const twvCandidates = allTwv.filter((c: any) => c.twvStatus === 'twv_verstrekt' && c.twvEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const candidate of twvCandidates) {
        const endDate = new Date(candidate.twvEndDate!);
        endDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 30 && daysLeft > 0) {
          // Check if reminder was already sent in the last 7 days
          const lastSent = (candidate as any).twvReminderSentAt;
          if (lastSent) {
            const daysSinceSent = Math.round((today.getTime() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceSent < 7) continue; // Skip — already sent this week
          }

          console.log(`[TWV] Herinnering versturen voor ${candidate.firstName} ${candidate.lastName} (${daysLeft} dagen resterend)`);

          // Send email
          await sendTwvExpiryReminderEmail({
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            id: candidate.id,
            twvEndDate: candidate.twvEndDate!,
            daysLeft,
          }).catch((e: Error) => console.error('[TWV] E-mail fout:', e));

          // Send push notification to admins
          const allUsers = await storage.getUsers();
          const adminUserIds = allUsers.filter((u: any) => u.role === 'admin').map((u: any) => u.id);
          const pushService = getPushNotificationService();
          if (pushService && adminUserIds.length > 0) {
            await pushService.sendTwvExpiryAlert(adminUserIds, `${candidate.firstName} ${candidate.lastName}`, daysLeft, candidate.id).catch((e: Error) => console.error('[TWV] Push fout:', e));
          }

          // Mark reminder as sent
          await storage.updateCandidate(candidate.id, { twvReminderSentAt: new Date() } as any);

          // Admin notificatie: TWV dreigt te verlopen
          storage.createAdminNotification({
            type: 'twv_expiry',
            title: 'TWV dreigt te verlopen',
            message: `De TWV van ${candidate.firstName} ${candidate.lastName} verloopt over ${daysLeft} dag${daysLeft === 1 ? '' : 'en'}.`,
            link: '/dashboard?tab=kandidaten',
            candidateId: candidate.id,
          }).catch((e: any) => console.error('[Notif] TWV-notificatie fout:', e));

          remindersSent++;
        }
      }
    } catch (error) {
      console.error('[TWV] Fout bij verwerken herinneringen:', error);
    }
    return remindersSent;
  }

  function scheduleTwvCheck() {
    const now = new Date();
    const next9am = new Date(now);
    next9am.setHours(9, 0, 0, 0);
    if (next9am <= now) next9am.setDate(next9am.getDate() + 1);
    const msUntil = next9am.getTime() - now.getTime();
    const minutesUntil = Math.round(msUntil / 60000);
    console.log(`[TWV] Volgende reminder-check gepland om ${next9am.toLocaleString('nl-NL')} (over ${minutesUntil} minuten)`);
    setTimeout(async () => {
      const sent = await checkTwvReminders();
      console.log(`[TWV] Reminder-check klaar — ${sent} herinneringen verstuurd`);
      scheduleTwvCheck(); // Plan de volgende check
    }, msUntil);
  }

  scheduleTwvCheck();

  // ─── Verjaardag-herinnering opdrachtgevers (dagelijks om 8:00) ─────────────
  async function checkClientBirthdayReminders(): Promise<void> {
    try {
      const birthdays = await storage.getClientBirthdays();
      const today = new Date();
      for (const b of birthdays) {
        const target = new Date(today.getFullYear(), b.birthMonth - 1, b.birthDay);
        if (target < today) target.setFullYear(today.getFullYear() + 1);
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const daysLeft = Math.round((target.getTime() - todayMidnight.getTime()) / 86400000);
        if (daysLeft !== 3) continue;
        // Check if we already sent this notification today for this person
        const existing = await storage.getAdminNotifications(200);
        const alreadySent = existing.some(n =>
          n.type === 'staffing_request' &&
          n.message.includes(`[verjaardag-${b.id}]`) &&
          n.createdAt >= new Date(todayMidnight)
        );
        if (alreadySent) continue;
        const monthNames = ['', 'januari', 'februari', 'maart', 'april', 'mei', 'juni',
          'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
        storage.createAdminNotification({
          type: 'staffing_request',
          title: `🎂 ${b.name} is binnenkort jarig`,
          message: `${b.name}${b.company ? ` (${b.company})` : ''} is over 3 dagen jarig (${b.birthDay} ${monthNames[b.birthMonth]}). Stuur iets leuks! [verjaardag-${b.id}]`,
          link: '/dashboard?tab=bedrijven-verjaardagen',
          candidateId: null,
        }).catch((e: any) => console.error('[Verjaardag] Notificatie fout:', e));
        console.log(`[Verjaardag] Herinnering aangemaakt voor ${b.name}`);
      }
    } catch (err) {
      console.error('[Verjaardag] Fout bij verwerken herinneringen:', err);
    }
  }

  function scheduleClientBirthdayCheck() {
    const now = new Date();
    const next8am = new Date(now);
    next8am.setHours(8, 0, 0, 0);
    if (next8am <= now) next8am.setDate(next8am.getDate() + 1);
    const msUntil = next8am.getTime() - now.getTime();
    setTimeout(async () => {
      await checkClientBirthdayReminders();
      scheduleClientBirthdayCheck();
    }, msUntil);
  }

  scheduleClientBirthdayCheck();

  // ─── Gesprek-herinnering scheduler (dagelijks om 8:00) ─────────────────────
  async function checkInterviewReminders(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const result = await storage.getCandidates({ limit: 500 });
      const allCandidates = Array.isArray(result) ? result : (result as any).candidates ?? [];
      const todayInterviews = allCandidates.filter((c: any) => c.interviewDate === today);
      for (const cand of todayInterviews) {
        const time = cand.interviewTime ? ` om ${cand.interviewTime.slice(0, 5)}` : '';
        storage.createAdminNotification({
          type: 'interview_reminder',
          title: 'Gesprek vandaag',
          message: `${cand.firstName} ${cand.lastName} heeft vandaag${time} een gesprek ingepland.`,
          link: '/dashboard?tab=kandidaten',
          candidateId: cand.id,
        }).catch((e: any) => console.error('[Notif] Interview-notificatie fout:', e));
      }
      if (todayInterviews.length > 0) {
        console.log(`[Interview] ${todayInterviews.length} gesprek-herinnering(en) aangemaakt voor vandaag`);
      }
    } catch (err) {
      console.error('[Interview] Fout bij gesprek-herinneringen:', err);
    }
  }

  function scheduleInterviewReminders() {
    const now = new Date();
    const next8am = new Date(now);
    next8am.setHours(8, 0, 0, 0);
    if (next8am <= now) next8am.setDate(next8am.getDate() + 1);
    const msUntil = next8am.getTime() - now.getTime();
    setTimeout(async () => {
      await checkInterviewReminders();
      scheduleInterviewReminders();
    }, msUntil);
  }
  scheduleInterviewReminders();

  // ─── XLSX Import routes ───────────────────────────────────────────────────
  const xlsxUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
  const { previewImport, commitImport } = await import('./import-xlsx');

  app.post('/api/import/:role/preview', adminMiddleware, xlsxUpload.single('file'), async (req: Request, res: Response) => {
    const { role } = req.params;
    if (!['horeca', 'housekeeping', 'chef'].includes(role)) {
      return res.status(400).json({ error: `Ongeldig role: ${role}` });
    }
    if (!req.file) return res.status(400).json({ error: 'Geen bestand ontvangen' });
    try {
      const result = await previewImport(req.file.buffer, role);
      if ((result as any).error) return res.status(422).json(result);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Parse fout' });
    }
  });

  app.post('/api/import/:role/commit', adminMiddleware, xlsxUpload.single('file'), async (req: Request, res: Response) => {
    const { role } = req.params;
    if (!['horeca', 'housekeeping', 'chef'].includes(role)) {
      return res.status(400).json({ error: `Ongeldig role: ${role}` });
    }
    if (!req.file) return res.status(400).json({ error: 'Geen bestand ontvangen' });
    const batchId = `import_${role}_${Date.now()}`;
    try {
      const result = await commitImport(req.file.buffer, role, batchId);
      if ((result as any).error) return res.status(422).json(result);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Import fout' });
    }
  });

  // ==========================================
  // BLOG API — SEO content systeem
  // ==========================================

  // Public: list published blog posts
  app.get('/api/blog', async (req: Request, res: Response) => {
    try {
      const { category, limit, offset } = req.query;
      const result = await storage.getBlogPosts({
        status: 'published',
        category: category as string | undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public: single published blog post by slug
  app.get('/api/blog/:slug', async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post || post.status !== 'published') return res.status(404).json({ error: 'Niet gevonden' });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: list all blog posts (all statuses)
  app.get('/api/admin/blog', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { status, category, limit, offset } = req.query;
      const result = await storage.getBlogPosts({
        status: status as string | undefined,
        category: category as string | undefined,
        limit: limit ? parseInt(limit as string) : 200,
        offset: offset ? parseInt(offset as string) : 0,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: create blog post
  app.post('/api/admin/blog', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(data);
      res.json(post);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: update blog post
  app.put('/api/admin/blog/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.updateBlogPost(id, req.body);
      if (!post) return res.status(404).json({ error: 'Niet gevonden' });
      res.json(post);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: delete blog post
  app.delete('/api/admin/blog/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteBlogPost(id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: publish a post immediately
  app.post('/api/admin/blog/:id/publish', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.updateBlogPost(id, { status: 'published', publishedAt: new Date() });
      if (!post) return res.status(404).json({ error: 'Niet gevonden' });
      pingGoogleSitemap();
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: AI generate blog post content
  app.post('/api/admin/blog/generate', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { topic, focusKeyword, category, extraContext, referenceUrls, internalLinks, toneOfVoice, targetAudience } = req.body;
      if (!topic) return res.status(400).json({ error: 'Topic is verplicht' });

      let OpenAI: any;
      try {
        OpenAI = (await import('openai')).default;
      } catch {
        return res.status(503).json({ error: 'AI module niet beschikbaar. Activeer de OpenAI integratie.' });
      }

      const client = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? 'unused',
      });

      const slug = topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);
      const keyword = focusKeyword || topic;

      const tone = toneOfVoice || 'Informeel & energiek (EXTRA stijl)';
      const audience = targetAudience || 'Horeca ondernemers';

      const systemPrompt = `Je bent een SEO-content expert voor EXTRA, een horeca uitzendbureau uit Amsterdam. Schrijf content in de gevraagde tone of voice voor de opgegeven doelgroep. Gebruik geen corporate taal. Wees concreet, praktisch en overtuigend.`;

      // Build extra context block
      let contextBlock = '';
      if (extraContext) contextBlock += `\nExtra instructies: ${extraContext}`;
      if (referenceUrls) contextBlock += `\nReferentie artikelen (gebruik als inspiratie voor structuur en diepgang):\n${referenceUrls}`;

      // Build internal links block
      const defaultInternalLinks = '/horeca-uitzendbureau-amsterdam, /werkgevers, /ik-zoek-extra-werk';
      const allInternalLinks = internalLinks
        ? `${internalLinks}\n${defaultInternalLinks}`
        : defaultInternalLinks;
      const internalLinksFormatted = allInternalLinks
        .split(/[\n,]/)
        .map((l: string) => l.trim())
        .filter(Boolean)
        .map((path: string) => {
          const label = path.replace(/^\//, '').replace(/-/g, ' ');
          return `<a href="${path}">${label}</a>`;
        })
        .join(', ');

      const userPrompt = `Schrijf een SEO-geoptimaliseerd blog artikel in het Nederlands over: "${topic}"
Focus keyword: "${keyword}"
Categorie: ${category || 'Blog'}
Tone of voice: ${tone}
Doelgroep: ${audience}
${contextBlock}

Vereisten:
- Lengte: 900-1300 woorden
- Schrijf de volledige HTML content (gebruik <h2>, <p>, <ul>, <li>, <strong> tags)
- Beginnen met een sterke introductie met het focus keyword in de eerste zin
- Structuur: intro, 4-5 H2 secties, conclusie
- Elke H2 sectie: 150-250 woorden
- Voeg minimaal 1 quote toe als <blockquote>
- Voeg minimaal 1 tiptekst toe als <div class="tip">
- Verwerk de volgende interne links op een natuurlijke manier: ${internalLinksFormatted}
- Sluit af met een call-to-action naar EXTRA
- Geef ALLEEN de HTML terug, geen markdown, geen uitleg

Geef ook mee (als JSON commentaar aan het begin van je response, voor het HTML, in formaat <!-- JSON: {...} -->):
- title: SEO-titel (55-65 karakters)
- metaTitle: identiek aan title
- metaDescription: 150-160 karakters
- excerpt: samenvatting van 1-2 zinnen
- readTime: geschatte leestijd (bijv. "5 min")
- imageAlt: alt tekst voor afbeelding
- suggestedInternalLinks: array van 3 aanbevolen interne paginapaden als strings`;

      const response = await client.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 8192,
      });

      const raw = response.choices[0].message.content || '';
      
      // Parse JSON metadata from comment
      let meta: any = { title: topic, metaTitle: topic, metaDescription: '', excerpt: '', readTime: '5 min', imageAlt: keyword };
      const jsonMatch = raw.match(/<!--\s*JSON:\s*(\{[\s\S]*?\})\s*-->/);
      if (jsonMatch) {
        try { meta = { ...meta, ...JSON.parse(jsonMatch[1]) }; } catch {}
      }
      
      // Extract clean HTML (everything after the comment)
      const content = raw.replace(/<!--[\s\S]*?-->\s*/, '').trim();

      res.json({
        title: meta.title,
        slug,
        content,
        excerpt: meta.excerpt || '',
        metaTitle: meta.metaTitle || meta.title,
        metaDescription: meta.metaDescription || '',
        focusKeyword: keyword,
        category: category || 'Blog',
        readTime: meta.readTime || '5 min',
        imageAlt: meta.imageAlt || keyword,
        suggestedInternalLinks: meta.suggestedInternalLinks || [],
        status: 'draft',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Generatie mislukt' });
    }
  });

  // Public: sitemap.xml
  app.get('/sitemap.xml', async (_req: Request, res: Response) => {
    try {
      const { posts } = await storage.getBlogPosts({ status: 'published', limit: 500 });
      const baseUrl = process.env.BASE_URL || 'https://brochure.doehetextra.nl';
      const staticPages = [
        // Hoofdpagina's
        { url: '/', priority: '1.0', changefreq: 'weekly' },
        { url: '/landing', priority: '0.9', changefreq: 'weekly' },
        // SEO pillar pagina's
        { url: '/horeca-uitzendbureau-amsterdam', priority: '1.0', changefreq: 'weekly' },
        { url: '/horeca-uitzendbureau-amsterdam-werkwijze', priority: '0.9', changefreq: 'monthly' },
        { url: '/horeca-personeel-amsterdam', priority: '0.95', changefreq: 'weekly' },
        { url: '/horeca-personeel', priority: '0.9', changefreq: 'weekly' },
        { url: '/flexibel-horeca-personeel', priority: '0.9', changefreq: 'weekly' },
        // Werkgever routes
        { url: '/personeel-gezocht', priority: '0.95', changefreq: 'weekly' },
        { url: '/hotel-personeel-gezocht', priority: '0.95', changefreq: 'weekly' },
        { url: '/event-personeel-gezocht', priority: '0.9', changefreq: 'weekly' },
        { url: '/cateringpersoneel-gezocht', priority: '0.9', changefreq: 'weekly' },
        { url: '/horecapersoneel-gezocht', priority: '0.95', changefreq: 'weekly' },
        { url: '/personeelsaanvraag', priority: '0.9', changefreq: 'monthly' },
        // Kandidaat routes
        { url: '/horeca-vacatures-amsterdam', priority: '0.95', changefreq: 'weekly' },
        { url: '/horeca-werk-amsterdam', priority: '0.9', changefreq: 'weekly' },
        { url: '/horeca-werk', priority: '0.95', changefreq: 'weekly' },
        { url: '/housekeeping-vacatures-amsterdam', priority: '0.9', changefreq: 'weekly' },
        { url: '/housekeeping-werk', priority: '0.95', changefreq: 'weekly' },
        { url: '/chef-vacatures-amsterdam', priority: '0.85', changefreq: 'weekly' },
        { url: '/front-office-vacatures-amsterdam', priority: '0.85', changefreq: 'weekly' },
        { url: '/aanmelden', priority: '0.9', changefreq: 'monthly' },
        // Over EXTRA
        { url: '/over-extra', priority: '0.8', changefreq: 'monthly' },
        { url: '/ons-team', priority: '0.7', changefreq: 'monthly' },
        { url: '/onze-werkwijze', priority: '0.8', changefreq: 'monthly' },
        { url: '/beloningssysteem', priority: '0.8', changefreq: 'monthly' },
        { url: '/klantcases-horeca', priority: '0.75', changefreq: 'monthly' },
        { url: '/contact', priority: '0.8', changefreq: 'monthly' },
        // Blog
        { url: '/blog', priority: '0.9', changefreq: 'daily' },
      ];
      const today = new Date().toISOString().split('T')[0];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${posts.map(p => `  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${(p.publishedAt || p.createdAt)?.toISOString().split('T')[0] || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err: any) {
      res.status(500).send('Sitemap error');
    }
  });

  // ── Vacancy CMS public routes ─────────────────────────────
  app.get('/api/vacatures', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const functionType = req.query.functionType as string | undefined;
      const location = req.query.location as string | undefined;
      const result = await storage.getVacancyPosts({ status: status || 'published', functionType, location });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/vacatures/:slug', async (req: Request, res: Response) => {
    try {
      const post = await storage.getVacancyPostBySlug(req.params.slug);
      if (!post || post.status !== 'published') return res.status(404).json({ message: 'Niet gevonden' });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Vacancy CMS admin routes ───────────────────────────────
  app.get('/api/admin/vacatures', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const functionType = req.query.functionType as string | undefined;
      const location = req.query.location as string | undefined;
      const result = await storage.getVacancyPosts({ status, functionType, location });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/admin/vacatures', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const post = await storage.createVacancyPost(req.body);
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put('/api/admin/vacatures/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.updateVacancyPost(id, req.body);
      if (!post) return res.status(404).json({ message: 'Niet gevonden' });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete('/api/admin/vacatures/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteVacancyPost(id);
      if (!ok) return res.status(404).json({ message: 'Niet gevonden' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/admin/vacatures/:id/publish', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.updateVacancyPost(id, { status: 'published', publishedAt: new Date() });
      if (!post) return res.status(404).json({ message: 'Niet gevonden' });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/admin/vacatures/:id/pause', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.updateVacancyPost(id, { status: 'paused' });
      if (!post) return res.status(404).json({ message: 'Niet gevonden' });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/admin/vacatures/:id/archive', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.updateVacancyPost(id, { status: 'archived' });
      if (!post) return res.status(404).json({ message: 'Niet gevonden' });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/admin/vacatures/:id/duplicate', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.duplicateVacancyPost(id);
      if (!post) return res.status(404).json({ message: 'Niet gevonden' });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── CRM routes ────────────────────────────────────────────────────────────

  // Companies
  app.get("/api/admin/crm/companies", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { isClient, type, owner, phase, abc, search } = req.query;
      const companies = await storage.getCrmCompanies({
        isClient: isClient !== undefined ? isClient === 'true' : undefined,
        type: type as string,
        owner: owner as string,
        phase: phase as string,
        abc: abc as string,
        search: search as string,
      });
      return res.json(companies);
    } catch (error) {
      console.error("Error fetching CRM companies:", error);
      return res.status(500).json({ message: "Fout bij ophalen bedrijven" });
    }
  });

  app.get("/api/admin/crm/companies/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCrmCompanyById(id);
      if (!company) return res.status(404).json({ message: "Bedrijf niet gevonden" });
      const [contacts, notes, reminders, subLocations] = await Promise.all([
        storage.getCrmContacts(id),
        storage.getCrmNotes(id),
        storage.getCrmReminders({ companyId: id }),
        storage.getCrmCompanies({ search: '' }).then(all => all.filter(c => c.parentCompanyId === id)),
      ]);
      return res.json({ ...company, contacts, notes, reminders, subLocations });
    } catch (error) {
      console.error("Error fetching CRM company:", error);
      return res.status(500).json({ message: "Fout bij ophalen bedrijf" });
    }
  });

  app.post("/api/admin/crm/companies", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const company = await storage.createCrmCompany(req.body);
      return res.status(201).json(company);
    } catch (error) {
      console.error("Error creating CRM company:", error);
      return res.status(500).json({ message: "Fout bij aanmaken bedrijf" });
    }
  });

  app.patch("/api/admin/crm/companies/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.updateCrmCompany(id, req.body);
      if (!company) return res.status(404).json({ message: "Bedrijf niet gevonden" });
      return res.json(company);
    } catch (error) {
      console.error("Error updating CRM company:", error);
      return res.status(500).json({ message: "Fout bij bijwerken bedrijf" });
    }
  });

  app.delete("/api/admin/crm/companies/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteCrmCompany(id);
      if (!ok) return res.status(404).json({ message: "Bedrijf niet gevonden" });
      return res.json({ message: "Bedrijf verwijderd" });
    } catch (error) {
      console.error("Error deleting CRM company:", error);
      return res.status(500).json({ message: "Fout bij verwijderen bedrijf" });
    }
  });

  // Contacts
  app.get("/api/admin/crm/contacts/:companyId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const contacts = await storage.getCrmContacts(parseInt(req.params.companyId));
      return res.json(contacts);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij ophalen contactpersonen" });
    }
  });

  app.post("/api/admin/crm/contacts", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const contact = await storage.createCrmContact(req.body);
      return res.status(201).json(contact);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij aanmaken contactpersoon" });
    }
  });

  app.patch("/api/admin/crm/contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const contact = await storage.updateCrmContact(parseInt(req.params.id), req.body);
      if (!contact) return res.status(404).json({ message: "Contactpersoon niet gevonden" });
      return res.json(contact);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij bijwerken contactpersoon" });
    }
  });

  app.delete("/api/admin/crm/contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const ok = await storage.deleteCrmContact(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: "Contactpersoon niet gevonden" });
      return res.json({ message: "Contactpersoon verwijderd" });
    } catch (error) {
      return res.status(500).json({ message: "Fout bij verwijderen contactpersoon" });
    }
  });

  // Notes
  app.get("/api/admin/crm/notes/:companyId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const notes = await storage.getCrmNotes(parseInt(req.params.companyId));
      return res.json(notes);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij ophalen notities" });
    }
  });

  app.post("/api/admin/crm/notes", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const note = await storage.createCrmNote(req.body);
      return res.status(201).json(note);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij aanmaken notitie" });
    }
  });

  app.delete("/api/admin/crm/notes/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const ok = await storage.deleteCrmNote(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: "Notitie niet gevonden" });
      return res.json({ message: "Notitie verwijderd" });
    } catch (error) {
      return res.status(500).json({ message: "Fout bij verwijderen notitie" });
    }
  });

  // Reminders
  app.get("/api/admin/crm/reminders", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { companyId, owner, status } = req.query;
      // Auto-update overdue reminders
      const allOpen = await storage.getCrmReminders({ status: 'open' });
      const today = new Date().toISOString().slice(0, 10);
      for (const r of allOpen) {
        if (r.dueDate < today) {
          await storage.updateCrmReminder(r.id, { status: 'overdue' });
        }
      }
      const reminders = await storage.getCrmReminders({
        companyId: companyId ? parseInt(companyId as string) : undefined,
        owner: owner as string,
        status: status as string,
      });
      // Enrich with company names
      const companies = await storage.getCrmCompanies({});
      const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
      const enriched = reminders.map(r => ({ ...r, companyName: companyMap[r.companyId] || '' }));
      return res.json(enriched);
    } catch (error) {
      console.error("Error fetching CRM reminders:", error);
      return res.status(500).json({ message: "Fout bij ophalen reminders" });
    }
  });

  app.post("/api/admin/crm/reminders", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const reminder = await storage.createCrmReminder(req.body);
      // Send email reminder
      try {
        const company = await storage.getCrmCompanyById(reminder.companyId);
        const ownerEmails: Record<string, string> = {
          max: 'max@doehetextra.nl',
          eveline: 'eveline@doehetextra.nl',
          charlotte: 'charlotte@doehetextra.nl',
          lea: 'lea@doehetextra.nl',
        };
        const toEmail = ownerEmails[reminder.owner];
        if (toEmail) {
          const { sendEmail } = await import('./mail');
          await sendEmail({
            to: toEmail,
            subject: `📅 CRM Reminder: ${reminder.title}`,
            html: `
              <p>Hallo ${reminder.owner.charAt(0).toUpperCase() + reminder.owner.slice(1)},</p>
              <p>Er staat een nieuwe reminder voor je klaar in het CRM:</p>
              <table style="border-collapse:collapse;margin:12px 0">
                <tr><td style="padding:4px 12px 4px 0;color:#666;font-weight:600">Actie</td><td>${reminder.title}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666;font-weight:600">Bedrijf</td><td>${company?.name || ''}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#666;font-weight:600">Datum</td><td>${reminder.dueDate}</td></tr>
                ${reminder.note ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-weight:600">Notitie</td><td>${reminder.note}</td></tr>` : ''}
              </table>
              <p>Open het dashboard voor meer informatie.</p>
            `,
          });
        }
      } catch (mailErr) {
        console.error("CRM reminder email error:", mailErr);
      }
      return res.status(201).json(reminder);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij aanmaken reminder" });
    }
  });

  app.patch("/api/admin/crm/reminders/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const reminder = await storage.updateCrmReminder(parseInt(req.params.id), req.body);
      if (!reminder) return res.status(404).json({ message: "Reminder niet gevonden" });
      return res.json(reminder);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij bijwerken reminder" });
    }
  });

  app.delete("/api/admin/crm/reminders/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const ok = await storage.deleteCrmReminder(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: "Reminder niet gevonden" });
      return res.json({ message: "Reminder verwijderd" });
    } catch (error) {
      return res.status(500).json({ message: "Fout bij verwijderen reminder" });
    }
  });

  // ─── Calendly polling sync ────────────────────────────────────────────────
  // Because the free Calendly plan doesn't support webhooks, we poll the API
  // every 5 minutes to detect new/canceled bookings and link them to candidates.

  const CALENDLY_USER_URI = process.env.CALENDLY_USER_URI || "https://api.calendly.com/users/ac39f79b-cd97-4ef3-bd74-f4b2bc09093f";

  async function syncCalendlyEvents() {
    const token = process.env.CALENDLY_API_TOKEN;
    if (!token) return;

    try {
      // Fetch scheduled events from the past day and next 90 days
      const minStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const maxStart = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      const eventsRes = await fetch(
        `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(CALENDLY_USER_URI)}&min_start_time=${minStart}&max_start_time=${maxStart}&status=active&count=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!eventsRes.ok) {
        console.warn(`Calendly sync: events API returned ${eventsRes.status}`);
        return;
      }

      const eventsData = await eventsRes.json();
      const events = eventsData?.collection ?? [];

      const allCandidatesResult = await storage.getCandidates({ limit: 5000 });
      const candidatesByEmail = new Map<string, any>(
        allCandidatesResult.candidates
          .filter((c: any) => c.email)
          .map((c: any) => [c.email.toLowerCase(), c])
      );

      for (const event of events) {
        const eventUri: string = event.uri;
        const startTime: string = event.start_time;
        if (!eventUri || !startTime) continue;

        // Fetch invitees for this event
        const invRes = await fetch(
          `${eventUri}/invitees?count=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!invRes.ok) continue;

        const invData = await invRes.json();
        const invitees = invData?.collection ?? [];

        for (const invitee of invitees) {
          const email: string = invitee.email;
          if (!email) continue;

          // Find matching candidate
          const candidate = candidatesByEmail.get(email.toLowerCase());
          if (!candidate) continue;

          // Parse and convert to Amsterdam local time (Europe/Amsterdam / CEST)
          const eventDate = new Date(startTime);
          const interviewDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(eventDate);
          const interviewTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hour12: false }).format(eventDate);

          // Only update if changed
          if (candidate.interviewDate !== interviewDate || candidate.interviewTime !== interviewTime) {
            await storage.updateCandidate(candidate.id, { interviewDate, interviewTime });
            await storage.createCandidateAuditLog({
              candidateId: candidate.id,
              action: 'interview_scheduled',
              changedByUserId: null,
              changeData: {
                description: `Gesprek gesynchroniseerd via Calendly: ${interviewDate} ${interviewTime}`,
                interviewDate,
                interviewTime,
                source: 'calendly_poll',
              },
              ipAddress: null,
            });
            console.log(`Calendly sync: gesprek bijgewerkt voor ${email} → ${interviewDate} ${interviewTime}`);
          }
        }
      }

      // Also check for canceled events and clear interviewDate if applicable
      const canceledRes = await fetch(
        `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(CALENDLY_USER_URI)}&min_start_time=${minStart}&max_start_time=${maxStart}&status=canceled&count=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (canceledRes.ok) {
        const canceledData = await canceledRes.json();
        const canceledEvents = canceledData?.collection ?? [];
        for (const event of canceledEvents) {
          const invRes = await fetch(`${event.uri}/invitees?count=50`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!invRes.ok) continue;
          const invData = await invRes.json();
          for (const invitee of invData?.collection ?? []) {
            const email: string = invitee.email;
            if (!email) continue;
            const candidate = candidatesByEmail.get(email.toLowerCase());
            if (!candidate || !candidate.interviewDate) continue;
            await storage.updateCandidate(candidate.id, {
              interviewDate: null as any,
              interviewTime: null as any,
            });
            console.log(`Calendly sync: gesprek geannuleerd voor ${email}`);
          }
        }
      }
    } catch (err) {
      console.error("Calendly sync fout:", err);
    }
  }

  // Manual trigger endpoint for admin
  app.post("/api/admin/calendly/sync", adminMiddleware, async (req: Request, res: Response) => {
    try {
      await syncCalendlyEvents();
      res.json({ message: "Calendly synchronisatie voltooid" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Run sync every 30 seconds for near real-time updates
  if (process.env.CALENDLY_API_TOKEN) {
    syncCalendlyEvents(); // Run immediately on startup
    setInterval(syncCalendlyEvents, 5 * 60 * 1000);
    console.log("Calendly auto-sync gestart (elke 5 minuten)");
  } else {
    console.log("CALENDLY_API_TOKEN niet ingesteld — Calendly sync uitgeschakeld");
  }
  // ─────────────────────────────────────────────────────────────────────────

  console.log('WebSocket server geïnitialiseerd op pad: /ws');

  // ─── WHATSAPP BEHEER (360dialog API) ──────────────────────────────────────
  const WA_BASE_URL = 'https://waba-v2.360dialog.io/v2';
  const WA_360_KEY = process.env.WHATSAPP_360_API_KEY || '';
  const wa360Headers = { 'Content-Type': 'application/json', 'D360-API-KEY': WA_360_KEY };

  // In-memory berichtenopslag
  const waBerichten: any[] = [];

  // GET /api/whatsapp/accounts — altijd één account: WhatsApp Business
  app.get('/api/whatsapp/accounts', adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const r = await fetch(`${WA_BASE_URL}/configs/webhook`, { headers: wa360Headers });
      const data = await r.json().catch(() => ({}));
      res.json([{
        id: 'whatsapp',
        label: 'WhatsApp Business',
        categorie: 'business',
        status: 'connected',
        telefoon: data?.url ? 'Actief' : 'Actief',
        qr: null,
        ongelezen: 0,
      }]);
    } catch {
      res.json([{
        id: 'whatsapp',
        label: 'WhatsApp Business',
        categorie: 'business',
        status: 'connected',
        telefoon: 'Actief',
        qr: null,
        ongelezen: 0,
      }]);
    }
  });

  // POST /api/whatsapp/stuur — bericht sturen via 360dialog
  app.post('/api/whatsapp/stuur', adminMiddleware, async (req: Request, res: Response) => {
    const { nummer, tekst } = req.body;
    if (!nummer || !tekst) return res.status(400).json({ error: 'nummer en tekst zijn verplicht' });
    try {
      const r = await fetch(`${WA_BASE_URL}/messages`, {
        method: 'POST',
        headers: wa360Headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: nummer.replace(/[^0-9]/g, ''),
          type: 'text',
          text: { body: tekst },
        }),
      });
      const data = await r.json();
      const bericht = {
        id: data?.messages?.[0]?.id || `out_${Date.now()}`,
        inkomend: false,
        naam: null,
        van: null,
        tekst,
        tijdstip: new Date().toISOString(),
      };
      waBerichten.unshift(bericht);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/whatsapp/berichten — opgeslagen berichten ophalen
  app.get('/api/whatsapp/berichten', adminMiddleware, (_req: Request, res: Response) => {
    res.json(waBerichten);
  });

  // POST /api/whatsapp/webhook — inkomende berichten van 360dialog
  app.post('/api/whatsapp/webhook', (req: Request, res: Response) => {
    const body = req.body;
    if (body?.messages) {
      for (const msg of body.messages) {
        if (msg.type === 'text') {
          waBerichten.unshift({
            id: msg.id,
            inkomend: true,
            naam: body?.contacts?.[0]?.profile?.name || msg.from,
            van: msg.from,
            tekst: msg.text.body,
            tijdstip: new Date(Number(msg.timestamp) * 1000).toISOString(),
          });
        }
      }
    }
    res.sendStatus(200);
  });

  // GET /api/whatsapp/webhook — verificatie door 360dialog
  app.get('/api/whatsapp/webhook', (req: Request, res: Response) => {
    res.status(200).send(req.query['hub.challenge'] || 'ok');
  });

  // POST /api/whatsapp/registreer-webhook — stel webhook-URL in via 360dialog API
  app.post('/api/whatsapp/registreer-webhook', adminMiddleware, async (req: Request, res: Response) => {
    const webhookUrl = req.body?.url || 'https://doehetextra.nl/api/whatsapp/webhook';
    if (!WA_360_KEY) {
      return res.status(500).json({ error: 'WHATSAPP_360_API_KEY niet ingesteld' });
    }

    // 360dialog v2 — probeer POST, PUT en PATCH met verschillende body-formaten
    const attempts = [
      { method: 'POST', body: { url: webhookUrl, headers: {} } },
      { method: 'PUT',  body: { url: webhookUrl, headers: {} } },
      { method: 'POST', body: { url: webhookUrl } },
      { method: 'PUT',  body: { url: webhookUrl } },
      { method: 'PATCH', body: { url: webhookUrl } },
    ];

    let lastStatus = 0;
    let lastBody = '';

    for (const attempt of attempts) {
      try {
        const r = await fetch(`${WA_BASE_URL}/configs/webhook`, {
          method: attempt.method,
          headers: wa360Headers,
          body: JSON.stringify(attempt.body),
        });
        const text = await r.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}

        console.log(`360dialog webhook ${attempt.method} (body:${JSON.stringify(attempt.body)}): ${r.status} ${text}`);

        if (r.ok) {
          console.log('360dialog webhook geregistreerd:', webhookUrl);
          return res.json({ success: true, url: webhookUrl, method: attempt.method, response: data });
        }
        lastStatus = r.status;
        lastBody = text;
      } catch (err: any) {
        lastBody = err.message;
      }
    }

    console.error('Alle webhook-registratiepogingen mislukt. Laatste fout:', lastStatus, lastBody);
    return res.status(lastStatus || 500).json({ error: `360dialog fout na alle pogingen: ${lastBody}` });
  });

  // GET /api/whatsapp/webhook-status — controleer welke webhook is ingesteld bij 360dialog
  app.get('/api/whatsapp/webhook-status', adminMiddleware, async (_req: Request, res: Response) => {
    if (!WA_360_KEY) return res.json({ configured: false, url: null });
    try {
      const r = await fetch(`${WA_BASE_URL}/configs/webhook`, { headers: wa360Headers });
      const text = await r.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}
      return res.json({ configured: r.ok, url: data?.url || null, raw: data });
    } catch {
      return res.json({ configured: false, url: null });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Indeed Apply webhook ────────────────────────────────────────────────
  // Indeed stuurt POST naar deze URL wanneer iemand via Indeed solliciteert.
  // Stel in je Indeed-werkgeversaccount in:
  //   ATS URL: https://www.doehetextra.nl/api/indeed/apply
  //   Requisition ID per vacature: horecamedewerker / housekeeping / chef / frontoffice / logistiek
  app.post("/api/indeed/apply", async (req: Request, res: Response) => {
    try {
      // Indeed kan data sturen als JSON of als form-encoded veld genaamd `json`
      let payload: any = req.body;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch {}
      }
      // Sommige ATS-integraties sturen payload.json als string
      if (payload && typeof payload.json === 'string') {
        try { payload = JSON.parse(payload.json); } catch {}
      }

      const applicant = payload?.applicant || {};
      const job       = payload?.job       || {};

      // Naam splitsen
      const fullName  = applicant.fullName || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Onbekend';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Onbekend';
      const lastName  = nameParts.slice(1).join(' ') || '';

      const email     = applicant.email        || null;
      const phone     = applicant.phoneNumber  || applicant.phone || null;

      // Bepaal functie op basis van requisitionId of job title
      const FUNCTION_MAP: Record<string, string> = {
        horecamedewerker:  'horecamedewerker',
        horeca:            'horecamedewerker',
        housekeeping:      'housekeeping',
        schoonmaak:        'housekeeping',
        chef:              'chef',
        kok:               'chef',
        'front-office':    'frontoffice',
        frontoffice:       'frontoffice',
        receptie:          'frontoffice',
        logistiek:         'logistiek',
        magazijn:          'logistiek',
        warehouse:         'logistiek',
      };
      const rawFn = (job.requisitionId || job.title || '').toLowerCase().trim();
      let functionType = 'horecamedewerker'; // standaard
      for (const [key, val] of Object.entries(FUNCTION_MAP)) {
        if (rawFn.includes(key)) { functionType = val; break; }
      }

      // Opmerkingen — samengesteld uit beschikbare velden
      const coverLetter = payload?.coverletter || payload?.coverLetter || '';
      const resumeInfo  = payload?.resume?.fileName ? `CV bijlage: ${payload.resume.fileName}` : '';
      const notes       = [
        `Bron: Indeed Apply`,
        job.title ? `Functie op Indeed: ${job.title}` : '',
        job.requisitionId ? `Vacature-ID: ${job.requisitionId}` : '',
        coverLetter ? `Motivatie: ${coverLetter}` : '',
        resumeInfo,
      ].filter(Boolean).join('\n');

      // Kandidaat aanmaken
      const candidate = await storage.createCandidate({
        firstName,
        lastName,
        email,
        phone,
        functionType,
        status:        'in_behandeling',
        sourceChannel: 'Indeed',
        notes,
      } as any);

      // Ook als applicatie opslaan zodat het in het dashboard verschijnt
      await storage.createApplication({
        candidateId:   candidate.id,
        functionType,
        firstName,
        lastName,
        email,
        phone,
        status:        'nieuw',
        formData:      payload,
        assessmentRating: null,
      } as any);

      console.log(`[Indeed] Nieuwe sollicitatie ontvangen: ${firstName} ${lastName} (${functionType})`);

      // Indeed verwacht 200 OK terug; optioneel kun je een redirectURL meegeven
      return res.status(200).json({
        result: {
          status: 'SUCCESS',
          redirectURL: 'https://www.doehetextra.nl/bedankt',
        },
      });
    } catch (error) {
      console.error('[Indeed] Fout bij verwerken sollicitatie:', error);
      return res.status(500).json({ message: 'Verwerking mislukt' });
    }
  });

  // Eenvoudige test-endpoint om te controleren of de koppeling actief is
  app.get("/api/indeed/apply", (_req: Request, res: Response) => {
    res.status(200).json({ status: 'EXTRA Indeed Apply endpoint actief', url: 'https://www.doehetextra.nl/api/indeed/apply' });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // Beveiligde CV-download route — alleen toegankelijk voor ingelogde admins
  app.get("/api/admin/files/cv/:filename", adminMiddleware, (req: Request, res: Response) => {
    const filename = req.params.filename;
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: "Ongeldig bestandsnaam" });
    }
    const filePath = path.join(process.cwd(), 'uploads', 'cv', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Bestand niet gevonden" });
    }
    res.sendFile(filePath);
  });

  // ─── Nieuwe tracking routes (Stap 4) — publiek toegankelijk ────────────────

  // Open-pixel: registreert geopende mail
  app.get("/track/open/:mailSendId", async (req: Request, res: Response) => {
    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    });
    const { TRANSPARENT_GIF } = await import('./emailService');
    res.end(TRANSPARENT_GIF);

    const id = parseInt(req.params.mailSendId);
    if (!isNaN(id)) {
      try {
        const ms = await storage.getMailSend(id);
        if (ms) {
          // Deduplicatie: sla alleen het EERSTE open-event op
          const bestaandeEvents = await storage.getMailEventsByMailSend(id);
          const alOpengeregistreerd = bestaandeEvents.some(e => e.type === 'open');
          if (!alOpengeregistreerd) {
            await storage.createMailEvent({ mailSendId: id, type: 'open', ipAdres: req.ip || null, url: null });
          }
        }
      } catch (e) { /* silent */ }
    }
  });

  // Click-tracking: slaat klik op en redirect naar echte URL
  app.get("/track/click/:mailSendId/:linkIndex", async (req: Request, res: Response) => {
    const id = parseInt(req.params.mailSendId);
    const linkIdx = parseInt(req.params.linkIndex);
    const { url: queryUrl } = req.query as { url?: string };
    let targetUrl = queryUrl || 'https://doehetextra.nl';

    // Probeer URL op te halen uit opgeslagen link_map
    if (!isNaN(id)) {
      try {
        const ms = await storage.getMailSend(id);
        if (ms?.linkMap) {
          const linkMap: Record<string, string> = JSON.parse(ms.linkMap);
          if (linkMap[linkIdx] || linkMap[String(linkIdx)]) {
            targetUrl = linkMap[linkIdx] || linkMap[String(linkIdx)];
          }
        }
      } catch { /* gebruik query param als fallback */ }
    }

    if (!isNaN(id)) {
      try {
        await storage.createMailEvent({
          mailSendId: id, type: 'click',
          ipAdres: req.ip || null,
          url: targetUrl,
        });
      } catch (e) { /* silent */ }
    }

    return res.redirect(302, targetUrl);
  });

  // Uitschrijven — pagina weergeven
  app.get("/unsubscribe/:contactId/:token", async (req: Request, res: Response) => {
    const { unsubscribePageHtml, validateUnsubscribeToken } = await import('./emailService');
    const contactId = parseInt(req.params.contactId);
    const { token } = req.params;

    if (isNaN(contactId) || !validateUnsubscribeToken(contactId, token)) {
      return res.status(400).send(unsubscribePageHtml(true));
    }

    try {
      const contact = await storage.getProspectContact(contactId);
      if (!contact) return res.status(404).send(unsubscribePageHtml(true));

      // Mark as unsubscribed
      await storage.updateProspectContact(contactId, { unsubscribed: true, contactStatus: 'uitgeschreven' });
      return res.send(unsubscribePageHtml(false));
    } catch (e) {
      return res.status(500).send(unsubscribePageHtml(true));
    }
  });

  // ── GA4 Analytics ──────────────────────────────────────────────────────────
  app.get("/api/admin/ga4/status", adminMiddleware, (_req, res) => {
    res.json({ configured: isGa4Configured() });
  });

  app.get("/api/admin/ga4/overview", adminMiddleware, async (req, res) => {
    if (!isGa4Configured()) return res.json({ error: "not_configured" });
    try {
      const days = Number(req.query.days ?? 30);
      const data = await fetchGa4Overview(days);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/ga4/trend", adminMiddleware, async (req, res) => {
    if (!isGa4Configured()) return res.json({ error: "not_configured" });
    try {
      const days = Number(req.query.days ?? 30);
      const data = await fetchGa4Trend(days);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/ga4/sources", adminMiddleware, async (req, res) => {
    if (!isGa4Configured()) return res.json({ error: "not_configured" });
    try {
      const days = Number(req.query.days ?? 30);
      const data = await fetchGa4Sources(days);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/ga4/pages", adminMiddleware, async (req, res) => {
    if (!isGa4Configured()) return res.json({ error: "not_configured" });
    try {
      const days = Number(req.query.days ?? 30);
      const data = await fetchGa4TopPages(days);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/ga4/devices", adminMiddleware, async (req, res) => {
    if (!isGa4Configured()) return res.json({ error: "not_configured" });
    try {
      const days = Number(req.query.days ?? 30);
      const data = await fetchGa4Devices(days);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
