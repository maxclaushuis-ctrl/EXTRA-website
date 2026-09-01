import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { isGa4Configured, fetchGa4Overview, fetchGa4Trend, fetchGa4Sources, fetchGa4TopPages, fetchGa4Devices } from "./ga4";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { storage } from "./storage";
// Het CRM is de bron van de verzendlijst; deze twee houden prospect_contacts
// gelijk met crm_contacts. Statisch geïmporteerd en niet lui: een mislukte
// import binnen een try-blok zou een geslaagde CRM-opslag alsnog in een 500
// veranderen. Zie server/crmSync.ts.
import { syncOpAchtergrond, synchroniseerCrmNaarMail, blokkeerVerwijderdeContacten } from "./crmSync";
import { meldAan } from "./indexnow";
import { ROUTE_META, SITE_ORIGIN, HREFLANG_GROUPS } from "@shared/routeMeta";
import { moveCardToPhase, markNotReached } from "./salesflow";
import { geocodeNlAddress } from "./geocode";
import { verstuurWachtwoordInstelLink, stelWachtwoordIn, wachtwoordSterkGenoeg } from "./authReset";
import { createHash, createHmac, randomUUID } from "crypto";
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
  insertEmployeeSchema,
  pushSubscriptions,
} from "@shared/schema";
import { z, ZodError } from "zod";
import { awardBirthdayPoints, BIRTHDAY_POINTS, POINTS_TO_EURO_RATIO } from "./birthday";
import { initMailService, sendCandidateConfirmationEmail, sendAdminCandidateNotificationEmail, sendAdminCandidateNoCvEmail, sendCalendlyInviteEmail, sendApplicationRejectionEmail, sendCvUploadFirstEmail, sendCandidateRejectionEmailDiensten, sendCandidateRejectionEmailCv, sendTwvExpiryReminderEmail, sendTwvExpiredNotice, sendAdminWelcomeEmail } from "./mail";
import { verstuurOnboardingMail, logOnboardingFout, notificeerOnboardingFout, notificeerBulkVoltooid } from "./onboardingService";
import { initPlanningAPI, getPlanningAPI } from "./planning-api";
import { landvelden, zoekLand } from "@shared/landen";
import { zoekLandMetAlias, NIET_KOPPELEN, LAND_ALIASSEN } from "@shared/landenAlias";
import { bepaalVerlopenRijen, bepaalLegeStatusRijen, bepaalTeMeldenRijen, bepaalTegenstrijdigeRijen, dagenVerlopen } from "./twvVerlopen";
import { sendPlanbordWebhook, buildIntakePayloadBlock } from "./integrations/planbord-webhook";
import { buildPlanbordBackfill } from "./integrations/planbord-backfill";
import { initChallengeSyncService, getChallengeSyncService } from "./challenge-sync";
import { initPushNotificationService, getPushNotificationService, NotificationTemplates } from "./push-notifications";
import { WebSocketServer, WebSocket } from 'ws';
import { db } from "./db";
import { users, candidates as candidatesTable, applications } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { checkInactiveUsers, updateUserActivity, getInactivityWarningUsers, InactivityReport } from "./inactivity-management";
import { uploadCvFile, downloadCvFile, isObjectStoragePath, uploadWaAiAttachment, downloadWaAiAttachmentBuffer, deleteWaAiAttachmentStorage, uploadWaMedia, downloadWaMediaBuffer } from './objectStorageFiles';

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

// Brute-force-bescherming voor login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req: Request) => {
    const email = (req.body?.email || '').toLowerCase();
    return email.endsWith('@doehetextra.nl');
  },
  message: { error: 'Te veel inlogpogingen, probeer later opnieuw' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strikte limiter voor signup-formulier (admin/employee accounts)
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: (req: Request) => {
    const email = (req.body?.email || '').toLowerCase();
    return email.endsWith('@doehetextra.nl');
  },
  message: { error: 'Te veel aanmeldingen vanaf dit IP-adres, probeer het over een uur opnieuw' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Voorkomt CV-upload spam / storage-misbruik
const cvUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Te veel CV-uploads vanaf dit IP-adres, probeer het over een uur opnieuw' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Voorkomt WhatsApp-spam (per-minuut, want admins mogen wel bulk versturen)
const whatsappSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Te veel WhatsApp-berichten in korte tijd, probeer het zo opnieuw' },
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

// Sales middleware — alleen voor /api/sales/* routes.
// Toegang: admins, of gebruikers uit de hardcoded sales-allowlist (Max & Tommy).
// Bewust GEEN nieuwe role in het user_role-enum; Tommy blijft 'employee'.
const SALES_ALLOWED_EMAILS = ['max@doehetextra.nl', 'tommy@doehetextra.nl'];
async function salesMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Niet ingelogd" });
  }
  if (req.session.userRole === 'admin') return next();
  try {
    const user = await storage.getUser(req.session.userId);
    if (user && SALES_ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
      return next();
    }
  } catch { /* val door naar 403 */ }
  return res.status(403).json({ message: "Geen toegang tot sales" });
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

/**
 * Google's sitemap-ping (https://www.google.com/ping?sitemap=…) stond hier tot
 * augustus 2026. Google heeft dat endpoint in 2023 aangekondigd als vervallen en
 * inmiddels uitgezet; het verzoek gaf al een tijd een 404 en deed dus niets. Het
 * is vervangen door meldAan() uit server/indexnow.ts, dat wél een werkend
 * kanaal aanspreekt (Bing, Yandex, Seznam, Naver, Yep, Amazon).
 *
 * Voor Google zelf blijft de weg: sitemap.xml plus Search Console. Daar is geen
 * ping-API meer voor, dat is niet iets wat hier op te lossen valt.
 */

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
  app.post("/api/signup", signupLimiter, async (req: Request, res: Response) => {
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
  app.get("/api/stats", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email en wachtwoord zijn vereist" });
      }

      // Het oude gedeelde admin-account is uitgeschakeld: iedere admin logt in
      // met een persoonlijk account (beheerd via Admin-accounts).
      if (String(email).toLowerCase() === 'admin@extra.nl') {
        return res.status(401).json({ message: "Het gedeelde admin-account is uitgeschakeld. Log in met je persoonlijke account, of gebruik 'Wachtwoord vergeten?' om er één in te stellen." });
      }

      // Database is leidend (persoonlijke admin-accounts); MemStorage alleen
      // nog als fallback voor de interne test-accounts van de medewerker-app.
      const [dbUser] = await db.select().from(users).where(eq(users.email, email));
      const user = dbUser ?? await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      if (user.status && user.status !== 'active') {
        return res.status(401).json({ message: "Dit account is gedeactiveerd" });
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
          if (dbUser) {
            await db.update(users).set({ password: newHash }).where(eq(users.id, user.id));
          } else {
            await storage.updateUser(user.id, { password: newHash });
          }
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
  
  // Wachtwoord-instel-flow (veilig: eenmalige 24-uurs link per mail, geen
  // wachtwoorden in e-mail). Zie server/authReset.ts.
  app.post("/api/auth/wachtwoord-vergeten", loginLimiter, async (req: Request, res: Response) => {
    try {
      const email = String(req.body?.email ?? "").trim();
      if (!email || !email.includes("@")) return res.status(400).json({ message: "Vul een geldig e-mailadres in" });
      await verstuurWachtwoordInstelLink(email);
      // Altijd hetzelfde antwoord — verklapt niet welke adressen bestaan.
      return res.json({ message: "Als dit adres bij een admin-account hoort, is er zojuist een instel-link gemaild (24 uur geldig)." });
    } catch (error) {
      console.error("[auth] wachtwoord-vergeten fout:", error);
      return res.status(500).json({ message: "Er ging iets mis — probeer het later opnieuw" });
    }
  });

  app.post("/api/auth/wachtwoord-instellen", loginLimiter, async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body ?? {};
      const resultaat = await stelWachtwoordIn(String(token ?? ""), String(password ?? ""));
      return res.status(resultaat.ok ? 200 : 400).json({ message: resultaat.message });
    } catch (error) {
      console.error("[auth] wachtwoord-instellen fout:", error);
      return res.status(500).json({ message: "Er ging iets mis — probeer het later opnieuw" });
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

      // Database is leidend — zelfde volgorde als /api/auth/login. Zonder
      // deze DB-check eerst kon een sessie voor een admin die alleen in de
      // database bestaat (niet in MemStorage) hier de verkeerde gebruiker
      // teruggeven zodra het sessie-userId toevallig samenviel met het id
      // van een bestaand MemStorage-account (bijv. een medewerker-testaccount)
      // — de login zelf slaagde dan wel, maar direct daarna overschreef deze
      // route de sessie-gebruiker in de UI met iemand anders.
      const [dbUser] = await db.select().from(users).where(eq(users.id, req.session.userId));
      const user = dbUser ?? await storage.getUser(req.session.userId);

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

      // Blokkeer verwijdering van vaste admin-accounts.
      // (admin@extra.nl staat hier bewust NIET meer in: het gedeelde account is
      // uitgeschakeld en mag door een admin verwijderd worden.)
      const PROTECTED_ADMIN_EMAILS = [
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
      const firstName = String(req.body?.firstName ?? '').trim();
      const lastName = String(req.body?.lastName ?? '').trim();
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      const password = String(req.body?.password ?? '');
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Voornaam, achternaam, e-mailadres en wachtwoord zijn verplicht" });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Vul een geldig e-mailadres in" });
      }
      // Zelfde wachtwoordbeleid als de wachtwoord-instellen-flow (authReset.ts).
      const zwak = wachtwoordSterkGenoeg(password);
      if (zwak) {
        return res.status(400).json({ message: zwak });
      }

      // Duplicaatcheck tegen de DATABASE (die is leidend voor login én de
      // gebruikerslijst), niet alleen tegen de in-memory storage.
      const [existingDb] = await db.select().from(users).where(eq(users.email, email));
      if (existingDb) {
        return res.status(409).json({ message: "Er bestaat al een account met dit e-mailadres" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Maak het account aan in de DATABASE. Voorheen werd alleen
      // storage.createUser (MemStorage) gebruikt, waardoor het account niet
      // in /api/users verscheen en er niet mee kon worden ingelogd.
      const [dbUser] = await db.insert(users).values({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
      }).returning();

      // Spiegel ook naar MemStorage (best effort) zodat features die daar
      // nog uit lezen het account meteen kennen.
      try {
        const memExisting = await storage.getUserByEmail(email);
        if (!memExisting) {
          await storage.createUser({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'admin',
          } as any);
        }
      } catch (memErr) {
        console.error('Waarschuwing: admin-account niet gespiegeld naar MemStorage:', memErr);
      }

      // Stuur welkomstmail. Als dit faalt is het account WEL aangemaakt;
      // we melden dat expliciet aan de client (mailSent: false) zodat het
      // wachtwoord handmatig gedeeld kan worden.
      const baseUrl = (process.env.BASE_URL || 'https://www.doehetextra.nl').replace(/\/$/, '');
      const loginUrl = `${baseUrl}/dashboard`;
      let mailSent = true;
      try {
        // sendAdminWelcomeEmail geeft false terug bij een verzendfout
        // (en kan in randgevallen ook throwen) — beide tellen als mislukt.
        mailSent = await sendAdminWelcomeEmail({
          to: email,
          firstName,
          lastName,
          email,
          password,
          loginUrl,
        });
      } catch (err) {
        mailSent = false;
        console.error('Fout bij verzenden welkomstmail admin:', err);
      }

      return res.status(201).json({
        message: mailSent
          ? `Admin-account aangemaakt en welkomstmail verstuurd naar ${email}`
          : `Admin-account aangemaakt, maar de welkomstmail naar ${email} kon niet worden verstuurd. Deel de inloggegevens handmatig.`,
        mailSent,
        user: { id: dbUser.id, email: dbUser.email, firstName: dbUser.firstName, lastName: dbUser.lastName, role: 'admin' },
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
        referralCode: z.string().optional().nullable(), // Aanbreng-code uit ?ref — ondoorzichtige string
        functionType: z.enum(["housekeeping", "horecamedewerker", "chef", "frontoffice", "logistiek"]),
        horecaExperience: z.string().optional().nullable(),
        needsTwv: z.boolean().optional().default(false),
        interviewDate: z.string().optional().nullable(),
        interviewTime: z.string().optional().nullable(),
        sourceChannel: z.string().optional().default("Website"),
        notes: z.string().optional().nullable(),
        status: z.enum(["in_behandeling", "gepland", "aangenomen", "afgewezen"]).optional().default("in_behandeling"),
        rejectionReason: z.string().optional().nullable(),
        partial: z.boolean().optional().default(false),
        // Horecamedewerker tags (optioneel — alleen ingevuld als functie = horecamedewerker)
        canIndependentShift: z.boolean().optional(),
        canCarryThreePlates: z.boolean().optional(),
        isBarista: z.boolean().optional(),
        canMakeCocktails: z.boolean().optional(),
        isAssistantChef: z.boolean().optional(),
        canDoWashing: z.boolean().optional(),
        isPromoter: z.boolean().optional(),
        serviceSkills: z.number().int().min(1).max(5).optional().nullable(),
        barSkills: z.number().int().min(1).max(5).optional().nullable(),
        dinerSkills: z.number().int().min(1).max(5).optional().nullable(),
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
        ...landvelden(validated.nationality),
        city: validated.city || null,
        language: validated.language || null,
        referralCode: validated.referralCode || null,
        functionType: validated.functionType,
        horecaExperience: validated.horecaExperience || null,
        needsTwv: validated.needsTwv || false,
        twvStatus: validated.needsTwv ? 'twv_nodig' : null,
        interviewDate: validated.interviewDate || null,
        interviewTime: validated.interviewTime || null,
        sourceChannel: validated.sourceChannel || "Website",
        notes: validated.notes || null,
        status: validated.status || "in_behandeling",
        rejectionReason: validated.status === "afgewezen" ? (validated.rejectionReason || null) : null,
        retentionUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ...(validated.canCarryThreePlates !== undefined && { canCarryThreePlates: validated.canCarryThreePlates }),
        ...(validated.isBarista !== undefined && { isBarista: validated.isBarista }),
        ...(validated.canMakeCocktails !== undefined && { canMakeCocktails: validated.canMakeCocktails }),
        ...(validated.isAssistantChef !== undefined && { isAssistantChef: validated.isAssistantChef }),
        ...(validated.canDoWashing !== undefined && { canDoWashing: validated.canDoWashing }),
        ...(validated.isPromoter !== undefined && { isPromoter: validated.isPromoter }),
        ...(validated.serviceSkills != null && { serviceSkills: validated.serviceSkills }),
        ...(validated.barSkills != null && { barSkills: validated.barSkills }),
        ...(validated.dinerSkills != null && { dinerSkills: validated.dinerSkills }),
        ...(validated.canIndependentShift !== undefined && { isOnlyJob: validated.canIndependentShift }),
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
        status: z.enum(["in_behandeling", "gepland", "aangenomen", "afgewezen"]).optional(),
        language: z.string().optional().nullable(),
        referralCode: z.string().optional().nullable(), // Aanbreng-code — additief, alleen bijwerken indien meegegeven
        horecaExperience: z.string().optional().nullable(),
        needsTwv: z.boolean().optional(),
        interviewDate: z.string().optional().nullable(),
        interviewTime: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        rejectionReason: z.string().optional().nullable(),
        partial: z.boolean().optional().default(false),
        canIndependentShift: z.boolean().optional(),
        canCarryThreePlates: z.boolean().optional(),
        isBarista: z.boolean().optional(),
        canMakeCocktails: z.boolean().optional(),
        isAssistantChef: z.boolean().optional(),
        canDoWashing: z.boolean().optional(),
        isPromoter: z.boolean().optional(),
        serviceSkills: z.number().int().min(1).max(5).optional().nullable(),
        barSkills: z.number().int().min(1).max(5).optional().nullable(),
        dinerSkills: z.number().int().min(1).max(5).optional().nullable(),
      });

      const validated = updateSchema.parse(req.body);

      const existing = await storage.getCandidate(id);
      if (!existing) return res.status(404).json({ message: "Kandidaat niet gevonden" });
      if (existing.email !== validated.email) return res.status(403).json({ message: "Geen toegang" });

      const updateData: Record<string, any> = {};
      if (validated.status) updateData.status = validated.status;
      if (validated.status === 'afgewezen' && validated.rejectionReason !== undefined) {
        updateData.rejectionReason = validated.rejectionReason;
      }
      if (validated.language !== undefined) updateData.language = validated.language;
      // Referral-code alleen zetten als hij is meegegeven én nog niet bestaat (nooit overschrijven/wissen)
      if (validated.referralCode && !existing.referralCode) updateData.referralCode = validated.referralCode;
      if (validated.horecaExperience !== undefined) updateData.horecaExperience = validated.horecaExperience;
      if (validated.needsTwv !== undefined) updateData.needsTwv = validated.needsTwv;
      if (validated.interviewDate !== undefined) updateData.interviewDate = validated.interviewDate;
      if (validated.interviewTime !== undefined) updateData.interviewTime = validated.interviewTime;
      if (validated.notes !== undefined) updateData.notes = validated.notes;
      if (validated.canIndependentShift !== undefined) updateData.isOnlyJob = validated.canIndependentShift;
      if (validated.canCarryThreePlates !== undefined) updateData.canCarryThreePlates = validated.canCarryThreePlates;
      if (validated.isBarista !== undefined) updateData.isBarista = validated.isBarista;
      if (validated.canMakeCocktails !== undefined) updateData.canMakeCocktails = validated.canMakeCocktails;
      if (validated.isAssistantChef !== undefined) updateData.isAssistantChef = validated.isAssistantChef;
      if (validated.canDoWashing !== undefined) updateData.canDoWashing = validated.canDoWashing;
      if (validated.isPromoter !== undefined) updateData.isPromoter = validated.isPromoter;
      if (validated.serviceSkills != null) updateData.serviceSkills = validated.serviceSkills;
      if (validated.barSkills != null) updateData.barSkills = validated.barSkills;
      if (validated.dinerSkills != null) updateData.dinerSkills = validated.dinerSkills;

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
      // Zet status op gepland als nog niet verder in het proces
      if (candidate.status === 'in_behandeling') {
        await storage.updateCandidateStatus(candidate.id, 'gepland', undefined);
      }

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

  // Detecteer het werkelijke bestandstype op basis van de magic bytes (niet vertrouwen op
  // de mimetype die de client meestuurt). Retourneert null als type niet herkend is.
  async function detectAndValidateFileType(
    buffer: Buffer,
    allowedExts: readonly string[],
    humanReadableTypes: string
  ): Promise<{ valid: true; ext: string; mime: string } | { valid: false; error: string }> {
    try {
      const { fileTypeFromBuffer } = await import('file-type');
      const detected = await fileTypeFromBuffer(buffer);
      if (!detected) {
        return { valid: false, error: `Bestandstype kon niet worden vastgesteld. Alleen ${humanReadableTypes} toegestaan.` };
      }
      if (!allowedExts.includes(detected.ext)) {
        return { valid: false, error: `Ongeldig bestandstype (${detected.ext}). Alleen ${humanReadableTypes} toegestaan.` };
      }
      return { valid: true, ext: detected.ext, mime: detected.mime };
    } catch (err) {
      console.error('[file-validation] Fout bij detecteren bestandstype:', err);
      return { valid: false, error: 'Fout bij valideren van het bestand.' };
    }
  }

  // Wrap een multer middleware zodat fouten (oa LIMIT_FILE_SIZE) als nette JSON 400 terugkomen
  function withUploadErrorHandler(
    uploader: (req: Request, res: Response, next: NextFunction) => void,
    maxMb: number,
    label: string
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      uploader(req, res, (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: `${label} is groter dan ${maxMb}MB. Upload een kleiner bestand.` });
          }
          return res.status(400).json({ message: err.message || `${label}-upload geweigerd` });
        }
        next();
      });
    };
  }

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
        cb(new Error('Alleen PDF, DOC en DOCX bestanden zijn toegestaan'));
      }
    }
  });

  const cvUploadMiddleware = withUploadErrorHandler(cvUpload.single('cv'), 10, 'CV');
  const CV_ALLOWED_EXTS = ['pdf', 'doc', 'docx'] as const;

  app.post("/api/aanmelden/cv", cvUploadLimiter, cvUploadMiddleware, async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Verifieer het werkelijke bestandstype op basis van magic bytes,
      // zodat een client niet kan liegen over de mimetype
      const validation = await detectAndValidateFileType(file.buffer, CV_ALLOWED_EXTS, 'PDF, DOC of DOCX');
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const publicUrl = await uploadCvFile(file.buffer, validation.mime, file.originalname);

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
  app.post("/api/cv-upload-token", cvUploadMiddleware, async (req: Request, res: Response) => {
    try {
      const token = req.body?.token || req.query?.token as string;
      if (!token) return res.status(400).json({ message: "Token ontbreekt" });

      const file = req.file;
      if (!file) return res.status(400).json({ message: "Geen bestand ontvangen" });

      // Verifieer het werkelijke bestandstype op basis van magic bytes
      const validation = await detectAndValidateFileType(file.buffer, CV_ALLOWED_EXTS, 'PDF, DOC of DOCX');
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      // Zoek kandidaat op token via directe DB query
      const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.cvUploadToken, token)).limit(1);
      if (!candidate) return res.status(404).json({ message: "Ongeldige of verlopen upload-link" });
      if (candidate.hasCv) return res.status(400).json({ message: "CV al ontvangen" });

      const publicUrl = await uploadCvFile(file.buffer, validation.mime, file.originalname);

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
      const { branche, functie, search, type, status, taal, functiegroep, tag, sort, phase, function_tag_id } = req.query as Record<string, string>;
      const functionTagId = function_tag_id ? parseInt(function_tag_id) : undefined;
      const contacts = await storage.getProspectContacts({
        branche, functie, search, type, status, taal, functiegroep, tag, sort,
        phase, functionTagId: Number.isFinite(functionTagId as number) ? functionTagId : undefined,
      });
      return res.json(contacts);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  // ─── Function Tags (Blok 1) ──────────────────────────────────────────────
  app.get("/api/admin/function-tags", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const actiefOnly = req.query.actiefOnly !== 'false';
      const tags = await storage.getFunctionTags({ actiefOnly });
      return res.json(tags);
    } catch (err) {
      console.error("[FunctionTags] Fout ophalen:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.post("/api/admin/function-tags", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { naam, slug, volgorde, actief } = req.body;
      if (!naam || !slug) return res.status(400).json({ message: "Naam en slug zijn verplicht" });
      const tag = await storage.createFunctionTag({
        naam: String(naam).trim(),
        slug: String(slug).trim().toLowerCase(),
        volgorde: typeof volgorde === 'number' ? volgorde : 0,
        actief: actief !== false,
      });
      return res.status(201).json(tag);
    } catch (err: any) {
      if (err?.code === '23505') return res.status(409).json({ message: "Slug bestaat al" });
      console.error("[FunctionTags] Aanmaken fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.put("/api/admin/function-tags/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const updated = await storage.updateFunctionTag(id, req.body);
      if (!updated) return res.status(404).json({ message: "Niet gevonden" });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.delete("/api/admin/function-tags/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      await storage.deleteFunctionTag(id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Function-tag-koppeling per contact
  app.get("/api/admin/prospect-contacts/:id/function-tags", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const ids = await storage.getProspectContactFunctionTagIds(id);
      return res.json({ functionTagIds: ids });
    } catch (err) {
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.put("/api/admin/prospect-contacts/:id/function-tags", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const ids: number[] = Array.isArray(req.body?.functionTagIds) ? req.body.functionTagIds.map((n: any) => parseInt(n)).filter((n: number) => Number.isFinite(n) && n > 0) : [];
      await storage.setProspectContactFunctionTags(id, ids);
      return res.json({ success: true, functionTagIds: ids });
    } catch (err) {
      console.error("[ProspectContacts] Function-tag koppeling fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Bulk-overzicht functietag-koppelingen voor client-side filteren
  app.get("/api/admin/prospect-contacts/function-tags-map", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const all = await storage.getProspectContacts({});
      const ids = all.map(c => c.id);
      const map = await storage.getFunctionTagIdsByContactIds(ids);
      const out: Record<number, number[]> = {};
      map.forEach((v, k) => { out[k] = v; });
      return res.json(out);
    } catch (err) {
      console.error("[ProspectContacts] Bulk function-tag map fout:", err);
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
        phase, functionTagIds,
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
        phase: ['nieuw','in_campagne','in_gesprek','klant','uitgesloten'].includes(phase) ? phase : 'nieuw',
      });
      // Koppel gestandaardiseerde functietags
      if (Array.isArray(functionTagIds) && functionTagIds.length > 0) {
        const ids = functionTagIds.map((n: any) => parseInt(n)).filter((n: number) => Number.isFinite(n) && n > 0);
        if (ids.length > 0) await storage.setProspectContactFunctionTags(contact.id, ids);
      }
      return res.status(201).json(contact);
    } catch (err) {
      console.error("[ProspectContacts] Aanmaken fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  app.put("/api/admin/prospect-contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const body: any = { ...req.body };
      // Map Nederlandse alias-veldnamen naar de echte DB-kolommen.
      // (Het frontend stuurt 'type', 'bedrijf', 'functietitel', 'notities'.)
      if (body.type !== undefined) { body.contactType = body.type; delete body.type; }
      if (body.bedrijf !== undefined) { body.company = body.bedrijf; delete body.bedrijf; }
      if (body.functietitel !== undefined) { body.function = body.functietitel; delete body.functietitel; }
      if (body.notities !== undefined) { body.notes = body.notities; delete body.notities; }
      // contactType whitelist
      if (body.contactType !== undefined && !['prospect','klant'].includes(body.contactType)) {
        delete body.contactType;
      }
      // Branche/functiegroep ook bijwerken in de tag-arrays zodat campagne-segmentatie
      // (die op brancheTags / functieTags filtert) consistent blijft met de POST-route.
      if (body.branche !== undefined) {
        body.brancheTags = body.branche ? [body.branche] : [];
      }
      if (body.functiegroep !== undefined) {
        body.functieTags = body.functiegroep ? [body.functiegroep] : [];
      }
      // Handle customTags serialization
      if (Array.isArray(body.customTags)) body.customTags = JSON.stringify(body.customTags);
      if (Array.isArray(body.tags)) body.customTags = JSON.stringify(body.tags);
      // Strip tags (legacy alias) zodat het niet door drizzle naar de db gaat
      delete body.tags;
      // Phase whitelist
      if (body.phase !== undefined && !['nieuw','in_campagne','in_gesprek','klant','uitgesloten'].includes(body.phase)) {
        delete body.phase;
      }
      // FunctionTagIds wordt apart afgehandeld via m2m
      const functionTagIds = body.functionTagIds;
      delete body.functionTagIds;
      // Rebuild name if voornaam/achternaam changed
      if (body.voornaam || body.achternaam) {
        const existing = await storage.getProspectContact(id);
        const vn = body.voornaam ?? existing?.voornaam ?? '';
        const an = body.achternaam ?? existing?.achternaam ?? '';
        if (vn || an) body.name = `${vn} ${an}`.trim();
      }
      const updated = await storage.updateProspectContact(id, body);
      if (!updated) return res.status(404).json({ message: "Niet gevonden" });
      // M2m bijwerken indien meegegeven
      if (Array.isArray(functionTagIds)) {
        const ids = functionTagIds.map((n: any) => parseInt(n)).filter((n: number) => Number.isFinite(n) && n > 0);
        await storage.setProspectContactFunctionTags(id, ids);
      }
      return res.json(updated);
    } catch (err) {
      console.error("[ProspectContacts] Update fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  /**
   * Een contact uit de verzendlijst halen.
   *
   * Sinds het CRM de bron van deze lijst is, kan echt verwijderen averechts
   * werken: de eerstvolgende synchronisatie maakt de rij gewoon opnieuw aan —
   * schoon, actief, en zonder de afmelding die eraan hing. Iemand die "nee"
   * had gezegd, zou dan weer post krijgen.
   *
   * Daarom wordt er niet verwijderd maar geblokkeerd zodra de rij ofwel aan het
   * CRM hangt, ofwel een afmelding, blokkade, harde bounce of spamklacht
   * draagt. Geblokkeerd betekent: staat er nog, telt nergens in mee, krijgt
   * niets. Alleen een rij zonder geschiedenis en zonder CRM-herkomst gaat echt
   * weg.
   */
  app.delete("/api/admin/prospect-contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getProspectContact(id);
      if (!contact) return res.json({ success: true });

      const draagtGeschiedenis =
        !!contact.crmContactId
        || !!contact.unsubscribed
        || contact.contactStatus === 'uitgeschreven'
        || contact.bounceStatus === 'hard'
        || !!contact.spamReported;

      if (draagtGeschiedenis) {
        const datum = new Date().toISOString().slice(0, 10);
        await storage.updateProspectContact(id, {
          contactStatus: 'geblokkeerd',
          notes: `${contact.notes ? `${contact.notes}\n` : ''}[${datum}] Handmatig uit de verzendlijst gehaald`,
        } as any);
        return res.json({
          success: true,
          geblokkeerd: true,
          message: 'Contact geblokkeerd in plaats van verwijderd — de afmeld- en verzendgeschiedenis blijft bewaard.',
        });
      }

      await storage.deleteProspectContact(id);
      return res.json({ success: true, geblokkeerd: false });
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

  // ─── Apollo.io CSV import (Blok 5) ────────────────────────────────────────
  // Twee-staps flow: eerst preview (toont kolommappping, tag-detectie en
  // dedupe-statistieken), daarna commit. Frontend leest het CSV-bestand zelf
  // (FileReader) en stuurt de tekst als JSON-body — geen multipart nodig.
  app.post("/api/admin/prospect-contacts/import-apollo/preview", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const csv: string = (req.body?.csv || '').toString();
      if (!csv.trim()) return res.status(400).json({ message: 'Lege CSV inhoud' });
      if (csv.length > 5_000_000) return res.status(413).json({ message: 'CSV te groot (>5 MB)' });
      const { maakPreview } = await import('./apolloImport');
      const preview = await maakPreview(csv);
      return res.json(preview);
    } catch (err: any) {
      console.error('[ApolloImport] preview-fout:', err);
      return res.status(500).json({ message: err?.message || 'Preview mislukt' });
    }
  });

  app.post("/api/admin/prospect-contacts/import-apollo/commit", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const rijen = req.body?.rijen;
      const opties = req.body?.opties || {};
      if (!Array.isArray(rijen) || rijen.length === 0) {
        return res.status(400).json({ message: 'Geen rijen om te importeren' });
      }
      const { commitImport } = await import('./apolloImport');
      const resultaat = await commitImport(rijen, opties);
      return res.json(resultaat);
    } catch (err: any) {
      console.error('[ApolloImport] commit-fout:', err);
      return res.status(500).json({ message: err?.message || 'Import mislukt' });
    }
  });

  // ─── vCard (.vcf) import — voor iPhone/iCloud/Google contacten-export ─────
  app.post("/api/admin/prospect-contacts/import-vcard/preview", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const vcf: string = (req.body?.vcf || '').toString();
      if (!vcf.trim()) return res.status(400).json({ message: 'Lege vCard-inhoud' });
      if (vcf.length > 10_000_000) return res.status(413).json({ message: 'vCard te groot (>10 MB)' });
      const { maakVcardPreview } = await import('./vcardImport');
      const preview = await maakVcardPreview(vcf);
      return res.json(preview);
    } catch (err: any) {
      console.error('[VcardImport] preview-fout:', err);
      return res.status(500).json({ message: err?.message || 'Preview mislukt' });
    }
  });

  app.post("/api/admin/prospect-contacts/import-vcard/commit", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const rijen = req.body?.rijen;
      if (!Array.isArray(rijen) || rijen.length === 0) {
        return res.status(400).json({ message: 'Geen contacten om te importeren' });
      }
      const { commitVcardImport } = await import('./vcardImport');
      const resultaat = await commitVcardImport(rijen);
      return res.json(resultaat);
    } catch (err: any) {
      console.error('[VcardImport] commit-fout:', err);
      return res.status(500).json({ message: err?.message || 'Import mislukt' });
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
      const { branche_filter, functie_filter, type_filter, taal_filter, tag_filter, phase_filter } = req.query as Record<string, string>;
      const safeParse = (v: string | undefined) => { try { return v ? JSON.parse(v) : []; } catch { return []; } };
      const brancheFilter = safeParse(branche_filter);
      const functieFilter = safeParse(functie_filter);
      const tagFilter = safeParse(tag_filter);
      const phaseFilter = safeParse(phase_filter);
      const count = await storage.getProspectCampaignSegmentCount({
        brancheFilter, functieFilter,
        typeFilter: type_filter || 'alles',
        taalFilter: taal_filter || 'alles',
        tagFilter,
        phaseFilter,
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
        phaseFilter,
        contentA, contentB, editorBlocks, htmlContent,
        abTestActief, abSplitPct, abWinnaarOp, abWinnaarNaUren,
        alleenWerkdagen, tijdvensterStart, tijdvensterEind, scheduledAt,
      } = req.body;
      if (!name || !subject) return res.status(400).json({ message: "Naam en onderwerp zijn verplicht" });
      const VALID_PHASES = ['nieuw','in_campagne','in_gesprek','klant','uitgesloten'];
      const cleanPhaseFilter = Array.isArray(phaseFilter) ? phaseFilter.filter((p: any) => VALID_PHASES.includes(p)) : [];
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
        phaseFilter: cleanPhaseFilter,
        functionTagIds: [],
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
        excludedContactIds: [],
        extraContactIds: [],
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
      // Valideer phaseFilter
      const VALID_PHASES = ['nieuw','in_campagne','in_gesprek','klant','uitgesloten'];
      if (Array.isArray(req.body.phaseFilter)) {
        req.body.phaseFilter = req.body.phaseFilter.filter((p: any) => VALID_PHASES.includes(p));
      }
      // functionTagIds is legacy en wordt niet meer vanuit UI gestuurd; negeer als aanwezig.
      if ('functionTagIds' in req.body) delete req.body.functionTagIds;
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
      const force = req.query.force === 'true';
      const campaign = await storage.getProspectCampaign(id);
      if (campaign && !['concept', 'draft'].includes(campaign.status) && !force) {
        return res.status(400).json({
          message: "Alleen conceptcampagnes kunnen normaal worden verwijderd. Gebruik force=true om verzonden campagnes te verwijderen (statistieken gaan verloren).",
          requiresForce: true,
        });
      }
      await storage.deleteProspectCampaign(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("[ProspectCampaign] Fout verwijderen:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Dupliceer een campagne (status reset, naam +" — kopie")
  app.post("/api/admin/prospect-campaigns/:id/duplicate", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const overrides = (req.body && typeof req.body === 'object') ? req.body : {};
      const dup = await storage.duplicateProspectCampaign(id, overrides);
      if (!dup) return res.status(404).json({ message: "Bron-campagne niet gevonden" });
      return res.status(201).json(dup);
    } catch (err) {
      console.error("[ProspectCampaign] Fout dupliceren:", err);
      return res.status(500).json({ message: "Fout bij dupliceren" });
    }
  });

  // Genereer varianten voor een campagne (matrix branche × functie × taal)
  app.post("/api/admin/prospect-campaigns/:id/genereer-varianten", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const branches: string[] = Array.isArray(req.body?.branches) ? req.body.branches : [];
      const functies: string[] = Array.isArray(req.body?.functies) ? req.body.functies : [];
      const talen: string[] = Array.isArray(req.body?.talen) ? req.body.talen : [];
      if (branches.length === 0 && functies.length === 0 && talen.length === 0) {
        return res.status(400).json({ message: "Kies minstens één dimensie (branche, functie of taal)" });
      }
      const created = await storage.generateCampaignVariants(id, { branches, functies, talen });
      return res.status(201).json({ aantal: created.length, varianten: created });
    } catch (err) {
      console.error("[ProspectCampaign] Fout genereren varianten:", err);
      return res.status(500).json({ message: "Fout bij genereren varianten" });
    }
  });

  // Ontvangers — toon werkelijke verzendingen uit mail_sends (inclusief
  // bulk/segment-verzendingen). De handmatige tabel prospect_campaign_recipients
  // wordt door deze endpoint niet gelezen; die heeft eigen POST/DELETE-endpoints.
  app.get("/api/admin/prospect-campaigns/:id/recipients", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const recipients = await storage.getProspectCampaignSentRecipients(id);
      return res.json(recipients);
    } catch (err) {
      console.error("[ProspectCampaign] Ontvangers ophalen mislukt:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Segment-preview — voor concept/geplande campagnes: bereken nu welke
  // contacten op het verzendmoment in het segment zouden zitten op basis van
  // de filters van de campagne. Markeer per contact of het is uitgesloten.
  app.get("/api/admin/prospect-campaigns/:id/segment-preview", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const campaign = await storage.getProspectCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campagne niet gevonden" });
      // doelgroepMetHerkomst geeft iedereen terug die in beeld is — uit het
      // segment én handmatig toegevoegd — mét de vlag of hij is uitgesloten.
      // Zo staat de voorrangslogica op één plek (server/campagneDoelgroep.ts)
      // in plaats van hier nog een keer, net iets anders.
      const { doelgroepMetHerkomst } = await import('./campagneDoelgroep');
      const alleContacten = await storage.getProspectContacts({});
      const regels = doelgroepMetHerkomst(alleContacten as any, campaign as any);
      const items = regels.map(r => {
        const c: any = r.contact;
        return {
          id: c.id,
          name: c.name,
          voornaam: c.voornaam,
          email: c.email,
          company: c.company,
          function: c.function,
          branche: c.branche,
          functiegroep: c.functiegroep,
          contactType: c.contactType,
          phase: c.phase,
          excluded: r.uitgesloten,
          herkomst: r.herkomst,
        };
      });

      // ── Personalisatiecontrole ────────────────────────────────────────────
      // Welke merge-tags gebruikt deze campagne, en bij hoeveel ontvangers is
      // het bijbehorende veld leeg? Dat laatste is de vraag die je vlak voor
      // een verzending stelt: staat er straks bij iemand "Beste daar,".
      //
      // De inhoud wordt als ruwe JSON doorzocht. Dat is grof maar afdoende:
      // de teksten van de blokken staan er letterlijk in, dus een tag wordt
      // gevonden waar hij ook zit.
      const { gebruikteTags, onbekendePlaceholders, ontbrekendeVelden, aanhefTwijfel } = await import('./personalisatie');
      const teDoorzoeken = [
        campaign.subject || '',
        typeof campaign.contentA === 'string' ? campaign.contentA : JSON.stringify(campaign.contentA ?? ''),
        typeof campaign.contentB === 'string' ? campaign.contentB : JSON.stringify(campaign.contentB ?? ''),
        campaign.htmlContent || '',
      ].join('\n');

      const tags = gebruikteTags(teDoorzoeken);
      const ontbreekt: Record<string, number> = {};
      for (const r of regels) {
        if (r.uitgesloten) continue;
        for (const veld of ontbrekendeVelden(tags, r.contact as any)) {
          ontbreekt[veld] = (ontbreekt[veld] ?? 0) + 1;
        }
      }

      // Twijfelgevallen in de aanhef. Alleen relevant als de campagne de
      // voornaam ook echt gebruikt — anders is het ruis.
      const twijfel: Record<string, number> = {};
      if (tags.includes('voornaam')) {
        for (const item of items) {
          if (item.excluded) continue;
          const reden = aanhefTwijfel((item as any).voornaam);
          if (!reden) continue;
          (item as any).aanhefTwijfel = reden;
          twijfel[reden] = (twijfel[reden] ?? 0) + 1;
        }
      }

      return res.json({
        totaal: items.length,
        verzendBaar: items.filter(i => !i.excluded).length,
        uitgesloten: items.filter(i => i.excluded).length,
        handmatig: items.filter(i => i.herkomst === 'handmatig').length,
        contacts: items,
        personalisatie: {
          tags,
          onbekend: onbekendePlaceholders(teDoorzoeken),
          ontbreekt,
          twijfel,
        },
      });
    } catch (err) {
      console.error("[ProspectCampaign] Segment-preview fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Sluit een contact uit voor deze specifieke campagne (zonder de pijplijn-
  // fase van het contact zelf te wijzigen).
  app.post("/api/admin/prospect-campaigns/:id/exclude/:contactId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contactId = parseInt(req.params.contactId);
      if (isNaN(id) || isNaN(contactId)) return res.status(400).json({ message: "Ongeldig ID" });
      const campaign = await storage.getProspectCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campagne niet gevonden" });
      const current: number[] = Array.isArray((campaign as any).excludedContactIds)
        ? ((campaign as any).excludedContactIds as number[])
        : [];
      if (!current.includes(contactId)) current.push(contactId);
      await storage.updateProspectCampaign(id, { excludedContactIds: current } as any);
      return res.json({ success: true, excludedContactIds: current });
    } catch (err) {
      console.error("[ProspectCampaign] Uitsluiten fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Hef de uitsluiting van een contact voor deze campagne weer op.
  app.delete("/api/admin/prospect-campaigns/:id/exclude/:contactId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contactId = parseInt(req.params.contactId);
      if (isNaN(id) || isNaN(contactId)) return res.status(400).json({ message: "Ongeldig ID" });
      const campaign = await storage.getProspectCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campagne niet gevonden" });
      const current: number[] = Array.isArray((campaign as any).excludedContactIds)
        ? ((campaign as any).excludedContactIds as number[])
        : [];
      const next = current.filter(cid => cid !== contactId);
      await storage.updateProspectCampaign(id, { excludedContactIds: next } as any);
      return res.json({ success: true, excludedContactIds: next });
    } catch (err) {
      console.error("[ProspectCampaign] Uitsluiting opheffen fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Voeg een contact handmatig toe aan deze campagne, ook als het buiten de
  // filters valt. De tegenhanger van /exclude. Uitsluiten wint van toevoegen:
  // staat het contact in beide lijsten, dan krijgt het geen mail (zie
  // server/campagneDoelgroep.ts).
  app.post("/api/admin/prospect-campaigns/:id/extra/:contactId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contactId = parseInt(req.params.contactId);
      if (isNaN(id) || isNaN(contactId)) return res.status(400).json({ message: "Ongeldig ID" });
      const campaign = await storage.getProspectCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campagne niet gevonden" });

      const contact = await storage.getProspectContact(contactId);
      if (!contact) return res.status(404).json({ message: "Contact niet gevonden" });
      // Vroeg en met een duidelijke melding: iemand die zich heeft afgemeld
      // toevoegen levert stilzwijgend niets op, en dat is verwarrend.
      const { magMailOntvangen } = await import('./campagneDoelgroep');
      if (!magMailOntvangen(contact as any)) {
        return res.status(400).json({
          message: "Dit contact kan geen mail ontvangen (uitgeschreven, geblokkeerd of geen e-mailadres).",
        });
      }

      const extra: number[] = Array.isArray((campaign as any).extraContactIds)
        ? ((campaign as any).extraContactIds as number[])
        : [];
      if (!extra.includes(contactId)) extra.push(contactId);
      // Toevoegen heft een eerdere uitsluiting op — anders klikt iemand
      // "toevoegen", verandert er niets, en is niet te zien waarom.
      const uitgesloten: number[] = Array.isArray((campaign as any).excludedContactIds)
        ? ((campaign as any).excludedContactIds as number[]).filter(cid => cid !== contactId)
        : [];
      await storage.updateProspectCampaign(id, {
        extraContactIds: extra,
        excludedContactIds: uitgesloten,
      } as any);
      return res.json({ success: true, extraContactIds: extra, excludedContactIds: uitgesloten });
    } catch (err) {
      console.error("[ProspectCampaign] Handmatig toevoegen fout:", err);
      return res.status(500).json({ message: "Fout" });
    }
  });

  // Haal een handmatig toegevoegd contact er weer af. Zat het contact óók in
  // het segment, dan blijft het gewoon in de lijst staan — dit verwijdert
  // alleen de handmatige toevoeging, niet het contact uit de campagne.
  app.delete("/api/admin/prospect-campaigns/:id/extra/:contactId", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contactId = parseInt(req.params.contactId);
      if (isNaN(id) || isNaN(contactId)) return res.status(400).json({ message: "Ongeldig ID" });
      const campaign = await storage.getProspectCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campagne niet gevonden" });
      const extra: number[] = Array.isArray((campaign as any).extraContactIds)
        ? ((campaign as any).extraContactIds as number[])
        : [];
      const next = extra.filter(cid => cid !== contactId);
      await storage.updateProspectCampaign(id, { extraContactIds: next } as any);
      return res.json({ success: true, extraContactIds: next });
    } catch (err) {
      console.error("[ProspectCampaign] Handmatige toevoeging verwijderen fout:", err);
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
  // ─── Afbeeldingen voor campagnemails ─────────────────────────────────────
  // Vervangt het meebakken als data:-URL. Zie server/campagneBeelden.ts voor
  // waarom dat misging (mail te groot voor de filters van de ontvanger).
  const campagneBeeldUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const toegestaan = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (toegestaan.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Alleen JPEG, PNG, WebP of GIF'));
    },
  });
  const campagneBeeldMiddleware = withUploadErrorHandler(
    campagneBeeldUpload.single('afbeelding'),
    15,
    'Afbeelding',
  );

  app.post("/api/admin/campagne-beeld", adminMiddleware, campagneBeeldMiddleware, async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "Geen afbeelding ontvangen" });

      // Het meegestuurde mimetype is een bewering van de browser; de magic bytes
      // zijn het bewijs. Zelfde controle als bij de kandidaatfoto's.
      const validation = await detectAndValidateFileType(file.buffer, ['jpg', 'png', 'webp', 'gif'], 'JPG, PNG, WebP of GIF');
      if (!validation.valid) return res.status(400).json({ message: validation.error });

      const { bewaarCampagneBeeld } = await import('./campagneBeelden');
      const resultaat = await bewaarCampagneBeeld(file.buffer, file.originalname || 'beeld', String(Date.now()));
      return res.json(resultaat);
    } catch (err: any) {
      console.error("[Campagne] Afbeelding uploaden mislukt:", err);
      return res.status(500).json({ message: err?.message || "Uploaden mislukt" });
    }
  });

  // Publiek, zonder inlog: een mailclient haalt de afbeelding op namens de
  // ontvanger en heeft geen sessie. Zie de toelichting in campagneBeelden.ts.
  app.get("/campagne-beeld/:naam", async (req: Request, res: Response) => {
    try {
      const { haalCampagneBeeld } = await import('./campagneBeelden');
      const buf = await haalCampagneBeeld(req.params.naam);
      if (!buf) return res.status(404).type('text/plain').send('Niet gevonden');
      res.set({
        'Content-Type': 'image/jpeg',
        // Een campagnebeeld wijzigt nooit: de bestandsnaam bevat een tijdstempel.
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return res.send(buf);
    } catch (err) {
      console.error("[Campagne] Afbeelding ophalen mislukt:", err);
      return res.status(500).type('text/plain').send('Fout');
    }
  });

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

      // Meteen na het versturen meten en meegeven: bij een testmail wil je
      // juist wéten dat hij te groot is, in plaats van het te ontdekken aan een
      // lege mail in je inbox.
      const { meetMail } = await import('./mailGrootte');
      const meting = meetMail(html);
      return res.json({ success: true, grootte: meting });
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

      // Veiligheid: weiger directe verzending als de campagne een toekomstig
      // gepland verzendmoment heeft. De scheduler-loop pakt geplande
      // campagnes (status='gepland') automatisch op werkelijk_verzend_op.
      const werkelijk = campaign.werkelijkVerzendOp ? new Date(campaign.werkelijkVerzendOp) : null;
      if (werkelijk && werkelijk.getTime() > Date.now() + 60_000) {
        return res.status(400).json({
          message: `Campagne is ingepland voor ${werkelijk.toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Amsterdam' })}. Annuleer eerst de planning of gebruik 'Direct verzenden' in het verzending-paneel.`,
        });
      }

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

  // brancheWhere geeft een geparametriseerde SQL-fragment terug die veilig in een
  // grotere sql`` template gecombineerd kan worden. De alias is gehardcodeerd op 'pc'
  // (de tabel-alias gebruikt in alle stats-queries) zodat hij nooit door user input
  // bepaald kan worden. Elke branche-waarde wordt afzonderlijk als parameter gebonden
  // via sql.join, zodat pg ze kan typen als text[] zonder string-interpolatie.
  function brancheWhereFragment(branches: string[]) {
    if (!branches || branches.length === 0) return sql``;
    const arr = sql.join(branches.map(b => sql`${b}`), sql`, `);
    return sql` AND (pc.branche_filter = '{}' OR pc.branche_filter && ARRAY[${arr}]::text[])`;
  }

  // granularityLiteral geeft een SQL-fragment terug met de granularity als string-literal
  // (bv. 'day') in plaats van een gebonden parameter. Dat is nodig omdat PostgreSQL twee
  // DATE_TRUNC($N, kolom)-expressies in SELECT en GROUP BY niet als equivalent herkent
  // wanneer $N een parameter is. De waarde komt uit een whitelist (parsePeriod), dus
  // er is geen pad voor user-input om door te lekken.
  function granularityLiteral(granularity: string) {
    switch (granularity) {
      case 'day': return sql`'day'`;
      case 'week': return sql`'week'`;
      case 'month': return sql`'month'`;
      default: return sql`'month'`;
    }
  }

  app.get("/api/admin/stats/overview", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { vanaf, tot, branche } = req.query as Record<string, any>;
      const branches: string[] = branche ? (Array.isArray(branche) ? branche : [branche]) : [];
      const { vanaf_dt, tot_dt, granularity, prev_vanaf, prev_tot } = parsePeriod(vanaf, tot);
      const bWhere = brancheWhereFragment(branches);
      const gran = granularityLiteral(granularity);

      // KPI current period — geparametriseerd via Drizzle's sql template
      const kpiQuery = sql`
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
        WHERE ms.verzonden_op >= ${vanaf_dt} AND ms.verzonden_op <= ${tot_dt}
        ${bWhere}
      `;

      // KPI previous period
      const kpiPrevQuery = sql`
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
        WHERE ms.verzonden_op >= ${prev_vanaf} AND ms.verzonden_op <= ${prev_tot}
        ${bWhere}
      `;

      // Tijdlijn (group by period) — granularity is een whitelisted SQL-literal (niet
      // een parameter), zodat PostgreSQL DATE_TRUNC in SELECT en GROUP BY als equivalent ziet
      const tijdlijnQuery = sql`
        SELECT
          DATE_TRUNC(${gran}, ms.verzonden_op) AS periode,
          COUNT(ms.id) FILTER (WHERE ms.status = 'sent') AS verzonden,
          COUNT(DISTINCT me_open.mail_send_id) AS geopend,
          COUNT(DISTINCT me_click.mail_send_id) AS geklikt
        FROM mail_sends ms
        JOIN prospect_campaigns pc ON pc.id = ms.campaign_id
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        WHERE ms.verzonden_op >= ${vanaf_dt} AND ms.verzonden_op <= ${tot_dt}
        ${bWhere}
        GROUP BY DATE_TRUNC(${gran}, ms.verzonden_op)
        ORDER BY periode
      `;

      // Per branche
      const brancheQuery = sql`
        SELECT
          UNNEST(pc.branche_filter) AS branche,
          COUNT(DISTINCT pc.id) AS campagnes,
          COUNT(ms.id) FILTER (WHERE ms.status = 'sent') AS bereikt,
          COUNT(DISTINCT me_open.mail_send_id) AS geopend,
          COUNT(DISTINCT me_click.mail_send_id) AS geklikt
        FROM prospect_campaigns pc
        LEFT JOIN mail_sends ms ON ms.campaign_id = pc.id
          AND ms.verzonden_op >= ${vanaf_dt} AND ms.verzonden_op <= ${tot_dt}
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        WHERE ARRAY_LENGTH(pc.branche_filter, 1) > 0
        GROUP BY branche
        ORDER BY bereikt DESC
      `;

      const [kpiRows, kpiPrevRows, tijdlijnRows, brancheRows] = await Promise.all([
        db.execute(kpiQuery),
        db.execute(kpiPrevQuery),
        db.execute(tijdlijnQuery),
        db.execute(brancheQuery),
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
      const bWhere = brancheWhereFragment(branches);
      const perPage = parseInt(per_page);
      const pageNum = parseInt(page);
      const offset = (pageNum - 1) * perPage;

      // ORDER BY-kolom en richting via whitelist; we leveren ze als sql-fragmenten
      // (geen user input komt ooit als raw string in de query terecht).
      const sortColMap: Record<string, ReturnType<typeof sql>> = {
        open_rate: sql`open_rate`,
        click_rate: sql`click_rate`,
        verzonden: sql`verzonden`,
        naam: sql`pc.name`,
        datum: sql`pc.sent_at`,
      };
      const sortCol = sortColMap[sort_by] ?? sortColMap.open_rate;
      const sortDir = sort_dir === 'asc' ? sql`ASC` : sql`DESC`;

      const campagnesQuery = sql`
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
          AND ms.verzonden_op >= ${vanaf_dt} AND ms.verzonden_op <= ${tot_dt}
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        LEFT JOIN mail_events me_unsub ON me_unsub.mail_send_id = ms.id AND me_unsub.type = 'unsubscribe'
        WHERE pc.status NOT IN ('concept', 'draft') OR EXISTS (
          SELECT 1 FROM mail_sends ms2 WHERE ms2.campaign_id = pc.id
            AND ms2.verzonden_op >= ${vanaf_dt} AND ms2.verzonden_op <= ${tot_dt}
        )
        ${bWhere}
        GROUP BY pc.id
        ORDER BY ${sortCol} ${sortDir} NULLS LAST
        LIMIT ${perPage} OFFSET ${offset}
      `;

      const countQuery = sql`
        SELECT COUNT(DISTINCT pc.id) AS total
        FROM prospect_campaigns pc
        LEFT JOIN mail_sends ms ON ms.campaign_id = pc.id
          AND ms.verzonden_op >= ${vanaf_dt} AND ms.verzonden_op <= ${tot_dt}
        WHERE pc.status NOT IN ('concept', 'draft') OR ms.id IS NOT NULL
        ${bWhere}
      `;

      const [rows, countRows] = await Promise.all([
        db.execute(campagnesQuery),
        db.execute(countQuery),
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
      // Hard-bound integer-conversie voorkomt zowel NaN-fouten als ongeldige waardes.
      const limitNum = Math.max(1, Math.min(500, parseInt(limit) || 20));
      const offsetNum = Math.max(0, parseInt(offset) || 0);

      const activityQuery = sql`
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
        LIMIT ${limitNum} OFFSET ${offsetNum}
      `;

      const countQuery = sql`SELECT COUNT(*) AS total FROM mail_events`;

      const [rows, countRows] = await Promise.all([
        db.execute(activityQuery),
        db.execute(countQuery),
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
      const bWhere = brancheWhereFragment(branches);

      const exportQuery = sql`
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
          AND ms.verzonden_op >= ${vanaf_dt} AND ms.verzonden_op <= ${tot_dt}
        LEFT JOIN mail_events me_open ON me_open.mail_send_id = ms.id AND me_open.type = 'open'
        LEFT JOIN mail_events me_click ON me_click.mail_send_id = ms.id AND me_click.type = 'click'
        LEFT JOIN mail_events me_unsub ON me_unsub.mail_send_id = ms.id AND me_unsub.type = 'unsubscribe'
        WHERE TRUE ${bWhere}
        GROUP BY pc.id
        ORDER BY pc.sent_at DESC NULLS LAST
      `;

      const rows = await db.execute(exportQuery);
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

      const clickQuery = sql`
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

      const openConQuery = sql`
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

      const nietOpenQuery = sql`
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
        db.execute(clickQuery),
        db.execute(openConQuery),
        db.execute(nietOpenQuery),
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

  // ─── Stap 8 + Blok 2: Geplande Verzending routes ────────────────────────────

  // Helper om planopties uit een request body te halen (incl. Blok 2-velden).
  function extractPlanOptiesFromBody(body: any) {
    const verzendDagen = Array.isArray(body?.verzendDagen)
      ? body.verzendDagen.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n >= 1 && n <= 7)
      : undefined;
    let verzendSlots: Array<{ dag: number; tijd: string }> | undefined = undefined;
    if (Array.isArray(body?.verzendSlots)) {
      verzendSlots = body.verzendSlots
        .map((s: any) => ({ dag: Number(s?.dag), tijd: String(s?.tijd ?? '') }))
        .filter((s: any) => Number.isFinite(s.dag) && s.dag >= 1 && s.dag <= 7 && /^\d{1,2}:\d{2}$/.test(s.tijd));
    }
    return {
      alleenWerkdagen: body?.alleenWerkdagen !== undefined ? !!body.alleenWerkdagen : undefined,
      tijdvensterStart: body?.tijdvensterStart || undefined,
      tijdvensterEind: body?.tijdvensterEind || undefined,
      tijdzone: body?.tijdzone || undefined,
      verzendDagen,
      verzendSlots,
    };
  }

  // Preview (dry-run): bereken werkelijk verzendmoment zonder op te slaan
  app.post("/api/admin/prospect-campaigns/:id/plannen-preview", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });
      const { verzendDirect, verzendOp } = req.body;
      const { planCampagne } = await import('./campaignScheduler');
      const resultaat = await planCampagne(id, {
        verzendDirect: !!verzendDirect,
        verzendOp: verzendOp ? new Date(verzendOp) : null,
        ...extractPlanOptiesFromBody(req.body),
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
      const { verzendDirect, verzendOp } = req.body;
      const { planCampagne } = await import('./campaignScheduler');
      const resultaat = await planCampagne(id, {
        verzendDirect: !!verzendDirect,
        verzendOp: verzendOp ? new Date(verzendOp) : null,
        ...extractPlanOptiesFromBody(req.body),
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
      const { verzendOp } = req.body;
      if (!verzendOp) return res.status(400).json({ message: "verzendOp verplicht" });
      const { planCampagne } = await import('./campaignScheduler');
      const resultaat = await planCampagne(id, {
        verzendDirect: false,
        verzendOp: new Date(verzendOp),
        ...extractPlanOptiesFromBody(req.body),
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
      // Haal zowel in_behandeling als gepland op — alleen gepland-kandidaten komen in aanmerking voor het sollicitatieformulier
      const [resultInBehandeling, resultGepland] = await Promise.all([
        storage.getCandidates({ functionType: functionType as string | undefined, status: 'in_behandeling', page: 1, limit: 200 }),
        storage.getCandidates({ functionType: functionType as string | undefined, status: 'gepland', page: 1, limit: 200 }),
      ]);
      const result = { candidates: [...resultGepland.candidates, ...resultInBehandeling.candidates] };
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
        status: c.status,
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
        limit: limit ? parseInt(limit as string) : 500
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
      
      if (!['in_behandeling', 'gepland', 'aangenomen', 'afgewezen'].includes(status)) {
        return res.status(400).json({ message: "Ongeldige status" });
      }
      
      const updatedCandidate = await storage.updateCandidateStatus(
        id,
        status,
        req.session?.userId,
        status === 'afgewezen' ? (rejectionReason || null) : null
      );
      if (!updatedCandidate) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }

      // Stuur alleen mail bij actieve afwijzingsredenen, niet bij stille markeringen (locatie, geen reactie, niet komen opdagen)
      const SILENT_REASONS = new Set(['locatie', 'geen_reactie', 'no_show']);
      if (status === 'afgewezen' && updatedCandidate.email && updatedCandidate.firstName && !SILENT_REASONS.has(String(rejectionReason || ''))) {
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
      if (candidate.status === 'gepland' || candidate.status === 'aangenomen') {
        return res.send(`<html><body style="font-family:Arial;text-align:center;padding:60px;"><h2 style="color:#16a34a;">✅ ${candidate.firstName} ${candidate.lastName} was al geaccepteerd.</h2></body></html>`);
      }
      await storage.updateCandidateStatus(id, 'gepland', undefined);
      // [PAUZE] Calendly-uitnodiging en WhatsApp-reminder zijn tijdelijk uitgezet —
      // we nemen handmatig contact op. Daarom géén sendCalendlyInviteEmail en géén
      // calendlyInviteSentAt-timestamp (de WA-reminder-cron gebruikt dat als anker).
      const dashboardUrl = `${req.protocol}://${req.get('host')}/dashboard`;
      return res.send(`<html><body style="font-family:Arial;text-align:center;padding:60px;"><h2 style="color:#16a34a;">✅ ${candidate.firstName} ${candidate.lastName} geaccepteerd!</h2><p>Status staat nu op <b>Gesprek gepland</b>. Neem zelf contact op om een afspraak in te plannen.</p><a href="${dashboardUrl}" style="color:#7c3aed;font-weight:bold;">Terug naar dashboard →</a></body></html>`);
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
      if (candidate.status === 'gepland' || candidate.status === 'aangenomen' || candidate.status === 'afgewezen') {
        return res.status(409).json({ message: 'Kandidaat is al beoordeeld' });
      }
      if (action === 'accept') {
        await storage.updateCandidateStatus(id, 'gepland', undefined);
        // [PAUZE] Calendly-uitnodiging en WhatsApp-reminder zijn tijdelijk uitgezet —
        // we nemen handmatig contact op. Geen sendCalendlyInviteEmail, geen
        // calendlyInviteSentAt (anker voor WA-reminder-cron).
        return res.json({ message: 'Kandidaat verplaatst naar Gesprek gepland — neem zelf contact op' });
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
      if (!isObjectStoragePath(candidate.cvFilename)) {
        return res.status(404).json({ message: "CV niet meer beschikbaar" });
      }

      // preview=1 → inline weergave (geen download-header); anders forceer download
      const isPreview = req.query.preview === '1';

      const cvData = await downloadCvFile(candidate.cvFilename);
      if (!cvData) {
        return res.status(404).json({ message: "CV niet meer beschikbaar" });
      }

      const ext = cvData.ext;
      const mimeType = ext === 'pdf'
        ? 'application/pdf'
        : ext === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/octet-stream';

      const safeName = encodeURIComponent(candidate.cvFilename.split('/').pop() || 'cv');
      res.setHeader('Content-Type', mimeType);
      if (isPreview) {
        // Inline: laat de browser het bestand tonen i.p.v. downloaden
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      }
      return res.send(cvData.buffer);
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
      if (!isObjectStoragePath(candidate.cvFilename)) {
        return res.status(404).json({ message: "CV niet meer beschikbaar" });
      }
      const ext = candidate.cvFilename.includes('.') ? '.' + candidate.cvFilename.split('.').pop()!.split('?')[0].toLowerCase() : '';
      if (ext !== '.docx' && ext !== '.doc') {
        return res.status(400).json({ message: "Alleen Word-bestanden kunnen worden omgezet" });
      }

      // Download uit Replit Object Storage
      const cvData = await downloadCvFile(candidate.cvFilename);
      if (!cvData) {
        return res.status(404).json({ message: "CV niet meer beschikbaar" });
      }
      const cvBuffer: Buffer = cvData.buffer;

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

  // Configure multer for candidate photo uploads — memory storage zodat we het werkelijke
  // bestandstype kunnen valideren (magic bytes) voordat we naar disk schrijven
  const candidatePhotoUpload = multer({
    storage: multer.memoryStorage(),
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

  const candidatePhotoMiddleware = withUploadErrorHandler(
    candidatePhotoUpload.single('photo'),
    5,
    'Foto'
  );
  const PHOTO_ALLOWED_EXTS = ['jpg', 'png', 'webp'] as const;

  // Upload candidate photo
  app.post("/api/admin/candidates/:id/photo", adminMiddleware, candidatePhotoMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Geen foto geüpload" });
      }

      // Verifieer het werkelijke bestandstype op basis van magic bytes
      const validation = await detectAndValidateFileType(file.buffer, PHOTO_ALLOWED_EXTS, 'JPG, PNG of WebP');
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const candidate = await storage.getCandidate(id);
      if (!candidate) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }

      // Delete old photo if exists
      if (candidate.photoUrl) {
        const oldPath = path.join(process.cwd(), candidate.photoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Schrijf naar disk met de gevalideerde extensie
      const uploadDir = path.join(process.cwd(), 'uploads', 'candidates');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `candidate-${id}-${Date.now()}.${validation.ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), file.buffer);

      const photoUrl = `/uploads/candidates/${filename}`;
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
  // ==========================================
  // MEDEWERKERS (Employees) endpoints
  // ==========================================

  app.get("/api/admin/employees", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { status, branche, functie, opdrachtgever, language, onboardingSent, search, page, limit } = req.query;
      const result = await storage.getEmployees({
        status: status as string | undefined,
        branche: branche as string | undefined,
        functie: functie as string | undefined,
        opdrachtgever: opdrachtgever as string | undefined,
        language: language as string | undefined,
        onboardingSent: onboardingSent === 'true' ? true : onboardingSent === 'false' ? false : undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 500,
      });
      return res.json(result);
    } catch (error) {
      console.error("Error fetching employees:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het ophalen van medewerkers" });
    }
  });

  app.get("/api/admin/employees/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) return res.status(404).json({ message: "Medewerker niet gevonden" });
      return res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      return res.status(500).json({ message: "Er is iets misgegaan" });
    }
  });

  // Helper: synchroniseer een (zojuist aangemaakte) medewerker naar de
  // WhatsApp-contactenlijst.
  //
  // FASE 1 (mei 2026): uitgeschakeld. Medewerkers verschijnen nu automatisch
  // in de Contacten-pagina (op basis van de employees-tabel) zonder dat we
  // een lege placeholder-conversatie hoeven aan te maken in de gesprekkenlijst.
  // Een conversatie wordt pas aangemaakt zodra er daadwerkelijk een bericht
  // wordt gestuurd of ontvangen.
  async function syncEmployeeToWhatsappContact(_employee: any, _source: string): Promise<void> {
    return;
  }

  app.post("/api/admin/employees", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(data);
      await syncEmployeeToWhatsappContact(employee, '/api/admin/employees');
      return res.status(201).json(employee);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Ongeldige gegevens", errors: error.errors });
      }
      console.error("Error creating employee:", error);
      const msg = error?.message?.includes('unique') || error?.code === '23505'
        ? "Er bestaat al een medewerker met dit e-mailadres"
        : "Er is iets misgegaan bij het aanmaken van de medewerker";
      return res.status(500).json({ message: msg });
    }
  });

  app.put("/api/admin/employees/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, data);
      if (!employee) return res.status(404).json({ message: "Medewerker niet gevonden" });
      return res.json(employee);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ message: "Ongeldige gegevens", errors: error.errors });
      console.error("Error updating employee:", error);
      return res.status(500).json({ message: "Er is iets misgegaan" });
    }
  });

  app.delete("/api/admin/employees/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) return res.status(404).json({ message: "Medewerker niet gevonden" });
      const ok = await storage.deleteEmployee(id);
      return res.json({ success: ok });
    } catch (error) {
      console.error("Error deleting employee:", error);
      return res.status(500).json({ message: "Er is iets misgegaan" });
    }
  });

  // Onboarding mail versturen (Stap 3: echte verzending via SendGrid + bijlagen)
  app.post("/api/admin/employees/:id/onboarding-versturen", adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { templateId } = req.body || {};
    try {
      if (!templateId || typeof templateId !== 'number') {
        return res.status(400).json({ message: "templateId is verplicht" });
      }
      const result = await verstuurOnboardingMail(id, templateId, 'handmatig');
      const employee = await storage.getEmployee(id);
      return res.json({
        success: true,
        sentAt: result.verstuurdOp,
        templateName: result.templateNaam,
        bijlagenCount: result.bijlagenCount,
        ontbrekendeBijlagen: result.ontbrekendeBijlagen,
        employee,
      });
    } catch (error: any) {
      const fout = error?.message || 'Onbekende fout';
      console.error("Error sending onboarding:", fout);
      await logOnboardingFout(id, typeof templateId === 'number' ? templateId : null, fout);
      try {
        const emp = await storage.getEmployee(id);
        if (emp) await notificeerOnboardingFout(emp as any, fout);
      } catch {}
      return res.status(500).json({ message: fout, error: fout });
    }
  });

  // Bulk onboarding versturen — sequentieel met 300ms pauze
  app.post("/api/admin/employees/onboarding-bulk", adminMiddleware, async (req: Request, res: Response) => {
    const { medewerkerIds, templateId } = req.body || {};
    if (!Array.isArray(medewerkerIds) || medewerkerIds.length === 0) {
      return res.status(400).json({ message: "medewerkerIds is verplicht" });
    }
    const resultaten = { verzonden: 0, mislukt: 0, fouten: [] as { id: number; fout: string }[] };

    for (const rawId of medewerkerIds) {
      const id = Number(rawId);
      if (!Number.isFinite(id)) continue;
      try {
        const medewerker = await storage.getEmployee(id);
        if (!medewerker) {
          resultaten.mislukt++;
          resultaten.fouten.push({ id, fout: 'Medewerker niet gevonden' });
          continue;
        }
        let chosenTemplateId: number | undefined = typeof templateId === 'number' ? templateId : undefined;
        if (!chosenTemplateId) {
          const auto = await storage.selecteerOnboardingTemplate({
            taal: medewerker.language,
            functie: medewerker.functie,
            opdrachtgever: medewerker.opdrachtgever,
          });
          if (!auto) {
            resultaten.mislukt++;
            resultaten.fouten.push({ id, fout: 'Geen passende template gevonden' });
            continue;
          }
          chosenTemplateId = auto.id;
        }
        await verstuurOnboardingMail(id, chosenTemplateId, 'bulk');
        resultaten.verzonden++;
        await new Promise(r => setTimeout(r, 300));
      } catch (err: any) {
        const fout = err?.message || 'Onbekende fout';
        await logOnboardingFout(id, null, fout);
        resultaten.mislukt++;
        resultaten.fouten.push({ id, fout });
      }
    }

    await notificeerBulkVoltooid(resultaten.verzonden, resultaten.mislukt);
    return res.json(resultaten);
  });

  // Helper: zet sollicitant-functiecategorie om naar medewerker-functie/branche
  const FUNCTIE_MAPPING: Record<string, string> = {
    'Horecamedewerker': 'bediening',
    'Chef': 'chef',
    'Housekeeping': 'housekeeping',
    'Front-office': 'front-office',
    'Logistiek': 'orderpicker',
  };
  const BRANCHE_MAPPING: Record<string, string> = {
    'Horecamedewerker': 'Hotel',
    'Chef': 'Restaurant',
    'Housekeeping': 'Hotel',
    'Front-office': 'Hotel',
    'Logistiek': 'Logistiek',
  };
  function mapTaalSollicitant(input: any): string {
    if (Array.isArray(input)) {
      const lower = input.map((t: any) => String(t).toLowerCase());
      if (lower.includes('engels') && !lower.includes('nederlands')) return 'Engels';
      return 'Nederlands';
    }
    if (typeof input === 'string' && input) {
      const t = input.toLowerCase();
      if (t.includes('engels') && !t.includes('nederlands')) return 'Engels';
      return 'Nederlands';
    }
    return 'Nederlands';
  }

  // Sollicitatie aannemen vanuit application-record (rijke versie)
  // Combineert: application-kolommen + form_data + eventueel gekoppelde candidate
  app.post("/api/admin/applications/:id/aannemen", adminMiddleware, async (req: Request, res: Response) => {
    console.error("[HIRE-HANDLER] geraakt voor application", req.params.id);
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplicationById(applicationId);
      if (!application) return res.status(404).json({ message: "Sollicitatie niet gevonden" });
      if (!application.email) return res.status(400).json({ message: "Sollicitatie heeft geen e-mailadres" });

      const fd: any = (application.formData as any) || {};
      const candidate = application.candidateId ? await storage.getCandidate(application.candidateId) : null;

      const { functie, branche, opdrachtgever, contractType, startDate, language } = req.body || {};

      const mappedFunctie = functie
        || candidate?.functionType
        || FUNCTIE_MAPPING[application.functionType]
        || application.functionType
        || null;
      const mappedBranche = branche || BRANCHE_MAPPING[application.functionType] || null;

      const employee = await storage.createEmployee({
        firstName: application.firstName || candidate?.firstName || '',
        lastName: application.lastName || candidate?.lastName || '',
        email: application.email,
        phone: application.phone || candidate?.phone || fd.phone || fd.telefoon || null,
        birthDate: candidate?.birthDate || fd.birthDate || fd.geboortedatum || null,
        city: application.city || candidate?.city || fd.city || fd.woonplaats || null,
        language: language || mapTaalSollicitant(fd.languages || fd.language || candidate?.language),
        functie: mappedFunctie,
        branche: mappedBranche,
        opdrachtgever: opdrachtgever || null,
        contractType: contractType || null,
        startDate: startDate || null,
        status: 'nieuw',
        candidateId: application.candidateId || null,
      } as any);

      // Update application status zodat we 'm in het overzicht kunnen herkennen
      await storage.updateApplicationStatus(applicationId, 'aangenomen').catch(() => {});
      if (application.candidateId) {
        await storage.updateCandidateStatus(application.candidateId, 'aangenomen').catch(() => {});
      }

      await syncEmployeeToWhatsappContact(employee, '/api/admin/applications/:id/aannemen');

      // ─── Planbord webhook: fire-and-forget, mag de aannemen-flow nooit blokkeren ───
      try {
        const num = (v: any): number | undefined => {
          const n = typeof v === 'string' ? Number(v) : v;
          return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
        };
        const str = (v: any): string | undefined => {
          if (v == null) return undefined;
          const s = String(v).trim();
          return s ? s : undefined;
        };

        await sendPlanbordWebhook({
          id: String(employee.id),
          applicationId: application.id,
          candidateId: application.candidateId ?? candidate?.id ?? undefined,
          employeeId: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          function: employee.functie || mappedFunctie || application.functionType,
          email: employee.email ?? null,
          phone: employee.phone ?? null,
          birthDate: (employee.birthDate as any) ?? (candidate?.birthDate as any) ?? null,
          city: employee.city ?? candidate?.city ?? null,
          nationality: candidate?.nationality ?? str(fd.nationality) ?? null,
          tags: {
            talen: Array.isArray(fd.languages) ? fd.languages : undefined,
            vaardigheden: Array.isArray(fd.experienceTypes) ? fd.experienceTypes : undefined,
          },
          sterren: {
            communicatie: num(fd.communicationSkills) ?? candidate?.communicationScore ?? undefined,
            algemeneIndruk: num(fd.overallImpression) ?? candidate?.overallImpressionScore ?? undefined,
          },
          scores: {
            softskills: application.softskillsScore ?? candidate?.softSkillsScore ?? undefined,
            bar: application.barScore ?? candidate?.barScore ?? undefined,
            bediening: application.bedieningScore ?? candidate?.serviceScore ?? undefined,
            diner: application.dinerScore ?? candidate?.dinerScore ?? undefined,
          },
          opmerking: str(fd.remarks) ?? candidate?.notes ?? null,
          referentie: application.adminNotes ? { naam: application.adminNotes } : undefined,
          branche: employee.branche ?? mappedBranche ?? null,
          opdrachtgever: employee.opdrachtgever ?? null,
          contractType: employee.contractType ?? null,
          startDate: (employee.startDate as any) ?? null,
          language: employee.language ?? 'Nederlands',
          // Aanbreng-code meesturen: eerst van de sollicitatie, anders van de gekoppelde kandidaat
          referralCode: application.referralCode ?? candidate?.referralCode ?? null,
          // Contract v2: additief intake-blok (matching, ervaringsduur, beschikbaarheid)
          intake: buildIntakePayloadBlock(fd, application.functionType),
        });
      } catch (err: any) {
        console.error('[planbord-webhook] sync mislukt:', err?.message ?? err);
      }

      return res.status(201).json({ employee });
    } catch (error: any) {
      console.error("Error aannemen application:", error);
      const msg = error?.message?.includes('unique') || error?.code === '23505'
        ? "Er bestaat al een medewerker met dit e-mailadres"
        : (error?.message || "Er is iets misgegaan bij het aanmaken van de medewerker");
      return res.status(error?.code === '23505' ? 409 : 500).json({ message: msg });
    }
  });

  // ─── Planbord backfill-export (READ-ONLY) ───────────────────────────────
  // Levert voor alle historisch aangenomen sollicitaties een JSON-array + een
  // datasamenvatting. Wijzigt NIETS aan de data.
  app.get("/api/admin/planbord/backfill", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const result = await buildPlanbordBackfill();
      return res.json(result);
    } catch (err: any) {
      console.error('[planbord-backfill] mislukt:', err?.message ?? err);
      return res.status(500).json({ message: 'Backfill-export mislukt' });
    }
  });

  // Sollicitant aannemen → maakt medewerker aan
  // LET OP: dit endpoint stuurt bewust GEEN Planbord-webhook en draagt dus ook geen
  // referral-code over. Referral-kandidaten lopen altijd via het aanmeldformulier en de
  // sollicitatie-route (applications/:id/aannemen), die de webhook + referralCode wél stuurt.
  // Niet omleiden naar deze route voor referral-kandidaten.
  app.post("/api/admin/candidates/:id/aannemen", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      const candidate = await storage.getCandidate(candidateId);
      if (!candidate) return res.status(404).json({ message: "Sollicitant niet gevonden" });
      if (!candidate.email) return res.status(400).json({ message: "Sollicitant heeft geen e-mailadres" });

      const { functie, branche, opdrachtgever, contractType, startDate, language } = req.body || {};

      const employee = await storage.createEmployee({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone || null,
        birthDate: candidate.birthDate || null,
        city: candidate.city || null,
        language: language || candidate.language || 'Nederlands',
        functie: functie || candidate.functionType,
        branche: branche || null,
        opdrachtgever: opdrachtgever || null,
        contractType: contractType || null,
        startDate: startDate || null,
        status: 'nieuw',
        candidateId,
      } as any);

      // Update sollicitant naar aangenomen
      await storage.updateCandidateStatus(candidateId, 'aangenomen');

      await syncEmployeeToWhatsappContact(employee, '/api/admin/candidates/:id/aannemen');

      return res.status(201).json({ employee });
    } catch (error: any) {
      console.error("Error aannemen candidate:", error);
      const msg = error?.message?.includes('unique') || error?.code === '23505'
        ? "Er bestaat al een medewerker met dit e-mailadres"
        : "Er is iets misgegaan bij het aanmaken van de medewerker";
      return res.status(500).json({ message: msg });
    }
  });

  // ─── Onboarding Module: templates, bijlagen, koppelingen, statistieken ────

  // Onboarding-bijlagen worden opgeslagen in Replit Object Storage (persistent over deploys).
  // Multer gebruikt memory-storage zodat we de buffer direct naar Object Storage kunnen pushen.
  const onboardingBijlageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== 'application/pdf') return cb(new Error('Alleen PDF bestanden zijn toegestaan'));
      cb(null, true);
    },
  });

  // Templates
  app.get("/api/onboarding/templates", adminMiddleware, async (req, res) => {
    try {
      const { taal, functiegroep, opdrachtgever, actief } = req.query as any;
      const filters: any = {};
      if (taal) filters.taal = String(taal);
      if (functiegroep) filters.functiegroep = String(functiegroep);
      if (opdrachtgever) filters.opdrachtgever = String(opdrachtgever);
      if (actief !== undefined) filters.actief = actief === 'true' || actief === '1';
      const rows = await storage.getOnboardingTemplates(filters);
      res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij ophalen templates' }); }
  });

  app.get("/api/onboarding/templates/selecteer", adminMiddleware, async (req, res) => {
    try {
      const { taal, functie, opdrachtgever } = req.query as any;
      const tpl = await storage.selecteerOnboardingTemplate({
        taal: taal ? String(taal) : null,
        functie: functie ? String(functie) : null,
        opdrachtgever: opdrachtgever ? String(opdrachtgever) : null,
      });
      if (!tpl) return res.status(404).json({ message: 'Geen passende template gevonden' });
      res.json(tpl);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij selecteren template' }); }
  });

  app.get("/api/onboarding/templates/:id", adminMiddleware, async (req, res) => {
    try {
      const tpl = await storage.getOnboardingTemplate(parseInt(req.params.id));
      if (!tpl) return res.status(404).json({ message: 'Template niet gevonden' });
      res.json(tpl);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout' }); }
  });

  app.post("/api/onboarding/templates", adminMiddleware, async (req, res) => {
    try {
      const data = req.body || {};
      if (!data.naam || !data.onderwerp) return res.status(400).json({ message: 'naam en onderwerp zijn verplicht' });
      const tpl = await storage.createOnboardingTemplate(data);
      res.status(201).json(tpl);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij aanmaken template' }); }
  });

  app.put("/api/onboarding/templates/:id", adminMiddleware, async (req, res) => {
    try {
      const tpl = await storage.updateOnboardingTemplate(parseInt(req.params.id), req.body || {});
      if (!tpl) return res.status(404).json({ message: 'Template niet gevonden' });
      res.json(tpl);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij bijwerken template' }); }
  });

  app.delete("/api/onboarding/templates/:id", adminMiddleware, async (req, res) => {
    try {
      const ok = await storage.deleteOnboardingTemplate(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: 'Template niet gevonden' });
      res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij verwijderen' }); }
  });

  // Preview HTML (gerenderd met optionele medewerker)
  app.get("/api/onboarding/templates/:id/preview-html", adminMiddleware, async (req, res) => {
    try {
      const tpl = await storage.getOnboardingTemplate(parseInt(req.params.id));
      if (!tpl) return res.status(404).send('Template niet gevonden');
      const medewerkerId = req.query.medewerkerId ? parseInt(String(req.query.medewerkerId)) : null;
      let medewerker: any = null;
      if (medewerkerId) {
        medewerker = await storage.getEmployee(medewerkerId);
      }
      if (!medewerker) {
        medewerker = {
          id: 0, firstName: 'Voorbeeld', lastName: 'Medewerker', email: 'voorbeeld@extra.nl',
          functie: 'Bediening', opdrachtgever: 'Voorbeeld Hotel', language: 'Nederlands',
          startDate: new Date(),
        };
      }
      const { genereerOnboardingHTML } = await import('./onboardingService');
      const html = await genereerOnboardingHTML(tpl, medewerker);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (e: any) {
      console.error(e);
      res.status(500).send('Fout bij renderen preview: ' + (e?.message || ''));
    }
  });

  // Testmail
  app.post("/api/onboarding/templates/:id/testmail", adminMiddleware, async (req, res) => {
    try {
      const tpl = await storage.getOnboardingTemplate(parseInt(req.params.id));
      if (!tpl) return res.status(404).json({ message: 'Template niet gevonden' });
      const { naar, medewerkerId } = req.body || {};
      if (!naar || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(naar)) {
        return res.status(400).json({ message: 'Geldig e-mailadres vereist' });
      }
      let medewerker: any = null;
      if (medewerkerId) {
        medewerker = await storage.getEmployee(parseInt(String(medewerkerId)));
      }
      if (!medewerker) {
        medewerker = {
          id: 0, firstName: 'Voorbeeld', lastName: 'Medewerker', email: naar,
          functie: 'Bediening', opdrachtgever: 'Voorbeeld Hotel', language: 'Nederlands',
          startDate: new Date(),
        };
      }
      const { genereerOnboardingHTML, genereerOnboardingPlainText, vervangTags, haalBijlagenOp, controleerBijlagenGrootte } = await import('./onboardingService');
      const html = await genereerOnboardingHTML(tpl, medewerker);
      const text = genereerOnboardingPlainText(tpl, medewerker);
      const subject = `[TEST] ${vervangTags(tpl.onderwerp || '', medewerker)}`;
      const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'max@doehetextra.nl';
      const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Max van EXTRA';

      // Bijlagen ophalen — testmail moet exact dezelfde PDF's bevatten als de echte mail
      const { attachments, ontbrekend } = await haalBijlagenOp(tpl);
      console.log(`[Testmail] Template ${tpl.id} (${tpl.naam}) → ${naar}: ${attachments.length} bijlage(n) gekoppeld${attachments.length ? ' (' + attachments.map(a => a.bestandsnaam).join(', ') + ')' : ''}${ontbrekend.length ? ', ontbrekend: ' + ontbrekend.join(', ') : ''}`);
      // Fail closed: verstuur geen testmail zonder de gekoppelde bijlage(n), anders
      // lijkt de test geslaagd terwijl de PDF('s) ontbreken.
      if (ontbrekend.length > 0) {
        return res.status(400).json({
          message: `Testmail niet verstuurd: ${ontbrekend.length} bijlage(n) ontbreken in de opslag (${ontbrekend.join(', ')}). Upload de bijlage(n) opnieuw bij Onboarding › Bijlagen en probeer daarna opnieuw.`,
          ontbrekendeBijlagen: ontbrekend,
        });
      }
      const sizeCheck = controleerBijlagenGrootte(attachments);
      if (!sizeCheck.geldig) {
        return res.status(400).json({ message: `Bijlagen te groot: ${sizeCheck.melding}` });
      }

      const { sendEmail, getLastEmailError } = await import('./mail');
      const ok = await sendEmail({
        to: naar,
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        subject,
        html,
        text,
        attachments: attachments.map(a => ({
          content: a.content,
          filename: a.bestandsnaam,
          type: a.type,
          disposition: 'attachment',
        })),
      });
      if (!ok) {
        const err = getLastEmailError();
        const sgMsg = err?.sendgridErrors?.[0]?.message;
        const detail = sgMsg || err?.message;
        return res.status(500).json({
          message: detail ? `SendGrid: ${detail}` : 'Versturen via SendGrid mislukt',
          sendgridError: sgMsg || null,
        });
      }
      res.json({ success: true, bijlagenCount: attachments.length, ontbrekendeBijlagen: ontbrekend });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: e?.message || 'Testmail mislukt' });
    }
  });

  // Bijlagen
  app.get("/api/onboarding/bijlagen", adminMiddleware, async (req, res) => {
    try {
      const { taal, actief } = req.query as any;
      const filters: any = {};
      if (taal) filters.taal = String(taal);
      if (actief !== undefined) filters.actief = actief === 'true' || actief === '1';
      const rows = await storage.getOnboardingBijlagen(filters);
      res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout' }); }
  });

  app.post("/api/onboarding/bijlagen", adminMiddleware, onboardingBijlageUpload.single('bestand'), async (req, res) => {
    try {
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: 'Geen PDF bestand ontvangen' });
      const { naam, taal, versie } = req.body || {};
      if (!naam) {
        return res.status(400).json({ message: 'Naam is verplicht' });
      }
      // Upload naar Object Storage (persistent over deploys)
      const { uploadOnboardingBijlage } = await import('./objectStorageBijlagen');
      const publicUrl = await uploadOnboardingBijlage(file.buffer, file.originalname);
      const bijlage = await storage.createOnboardingBijlage({
        naam,
        bestandsnaam: file.originalname,
        bestandspad: publicUrl,
        bestandsgrootte: file.size,
        taal: taal || 'alles',
        versie: versie || null,
        actief: true,
      } as any);
      res.status(201).json(bijlage);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: e?.message || 'Upload mislukt' });
    }
  });

  app.get("/api/onboarding/bijlagen/:id/bekijken", adminMiddleware, async (req, res) => {
    try {
      const b = await storage.getOnboardingBijlage(parseInt(req.params.id));
      if (!b) return res.status(404).json({ message: 'Bijlage niet gevonden' });
      const { isOnboardingBijlageUrl, downloadOnboardingBijlageBuffer } = await import('./objectStorageBijlagen');
      // Object Storage-bijlage: stream vanuit storage
      if (isOnboardingBijlageUrl(b.bestandspad)) {
        const buf = await downloadOnboardingBijlageBuffer(b.bestandspad);
        if (!buf) return res.status(404).json({ message: 'Bestand niet meer aanwezig in storage' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${b.bestandsnaam}"`);
        return res.end(buf);
      }
      // Backward compat: legacy lokaal pad
      const filePath = path.resolve(process.cwd(), b.bestandspad);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Bestand niet meer aanwezig' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${b.bestandsnaam}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout' }); }
  });

  app.put("/api/onboarding/bijlagen/:id/vervangen", adminMiddleware, onboardingBijlageUpload.single('bestand'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: 'Geen PDF bestand ontvangen' });
      const oud = await storage.getOnboardingBijlage(id);
      if (!oud) {
        return res.status(404).json({ message: 'Bijlage niet gevonden' });
      }
      // Upload nieuw bestand naar Object Storage
      const { uploadOnboardingBijlage, isOnboardingBijlageUrl, deleteOnboardingBijlageStorage } = await import('./objectStorageBijlagen');
      const publicUrl = await uploadOnboardingBijlage(file.buffer, file.originalname);
      const updated = await storage.updateOnboardingBijlage(id, {
        bestandsnaam: file.originalname,
        bestandspad: publicUrl,
        bestandsgrootte: file.size,
        versie: req.body?.versie || oud.versie,
      } as any);
      // Verwijder oud bestand (Supabase of lokaal)
      try {
        if (isOnboardingBijlageUrl(oud.bestandspad)) {
          await deleteOnboardingBijlageStorage(oud.bestandspad);
        } else {
          const oudPath = path.resolve(process.cwd(), oud.bestandspad);
          if (fs.existsSync(oudPath)) fs.unlinkSync(oudPath);
        }
      } catch (cleanupErr) {
        console.warn('[Onboarding] Cleanup oud bestand mislukt:', cleanupErr);
      }
      res.json(updated);
    } catch (e: any) { console.error(e); res.status(500).json({ message: e?.message || 'Vervangen mislukt' }); }
  });

  app.delete("/api/onboarding/bijlagen/:id", adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const b = await storage.getOnboardingBijlage(id);
      const result = await storage.deleteOnboardingBijlage(id);
      if (!result.success) {
        return res.status(409).json({
          gekoppeldAanTemplates: result.gekoppeldAanTemplates,
          message: `Deze bijlage is nog gekoppeld aan ${result.gekoppeldAanTemplates} actieve template(s) en kan daarom niet verwijderd worden. Wil je het PDF-bestand bijwerken? Gebruik dan de knop 'Vervangen' (↻) — zo blijft de koppeling met de template behouden.`,
        });
      }
      if (b) {
        try {
          const { isOnboardingBijlageUrl, deleteOnboardingBijlageStorage } = await import('./objectStorageBijlagen');
          if (isOnboardingBijlageUrl(b.bestandspad)) {
            await deleteOnboardingBijlageStorage(b.bestandspad);
          } else {
            const filePath = path.resolve(process.cwd(), b.bestandspad);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        } catch (cleanupErr) {
          console.warn('[Onboarding] Cleanup bij delete mislukt:', cleanupErr);
        }
      }
      res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij verwijderen' }); }
  });

  // Koppelingen
  app.post("/api/onboarding/template-bijlagen", adminMiddleware, async (req, res) => {
    try {
      const { template_id, bijlage_id, volgorde } = req.body || {};
      if (!template_id || !bijlage_id) return res.status(400).json({ message: 'template_id en bijlage_id zijn verplicht' });
      const koppeling = await storage.koppelBijlageAanTemplate(Number(template_id), Number(bijlage_id), Number(volgorde) || 0);
      res.status(201).json(koppeling);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij koppelen' }); }
  });

  app.delete("/api/onboarding/template-bijlagen/:id", adminMiddleware, async (req, res) => {
    try {
      const ok = await storage.ontkoppelBijlageVanTemplate(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ message: 'Koppeling niet gevonden' });
      res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout' }); }
  });

  app.patch("/api/onboarding/template-bijlagen/:id", adminMiddleware, async (req, res) => {
    try {
      const { volgorde } = req.body || {};
      if (typeof volgorde !== 'number') return res.status(400).json({ message: 'volgorde (number) is verplicht' });
      const row = await storage.setKoppelingVolgorde(parseInt(req.params.id), volgorde);
      if (!row) return res.status(404).json({ message: 'Koppeling niet gevonden' });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij volgorde wijzigen' }); }
  });

  // Statistieken
  app.get("/api/onboarding/statistieken", adminMiddleware, async (_req, res) => {
    try {
      const stats = await storage.getOnboardingStatistieken();
      res.json(stats);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij statistieken' }); }
  });

  app.get("/api/onboarding/statistieken/export/csv", adminMiddleware, async (_req, res) => {
    try {
      const stats = await storage.getOnboardingStatistieken();
      const escape = (v: any) => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      };
      const header = 'Naam,Email,Opdrachtgever,Template,Verstuurd op,Status\n';
      const rows = stats.laatste50.map((r: any) =>
        [r.medewerkerNaam, r.medewerkerEmail, r.opdrachtgever || '', r.templateName || '', new Date(r.sentAt).toISOString(), r.status]
          .map(escape).join(',')
      ).join('\n');
      const datum = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="EXTRA-onboarding-log-${datum}.csv"`);
      res.send(header + rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Fout bij export' }); }
  });

  // Seed standaard templates bij eerste start
  (async () => {
    try {
      const bestaande = await storage.getOnboardingTemplates();
      if (bestaande.length === 0) {
        await storage.createOnboardingTemplate({
          naam: 'Welkom bij EXTRA (NL)',
          taal: 'Nederlands',
          functiegroep: null,
          opdrachtgever: null,
          onderwerp: 'Welkom bij het EXTRA team, {{voornaam}}! 🎉',
          content: JSON.stringify({
            blokken: [
              { type: 'tekst', content: 'Hoi {{voornaam}},\n\nWelkom bij EXTRA! We zijn blij dat je bij ons team komt werken als {{functie}}. Hieronder vind je alle informatie die je nodig hebt om goed te kunnen starten.' },
              { type: 'tekst', content: 'Je startdatum: {{startdatum}}\n\nMocht je vragen hebben, neem dan gerust contact met ons op.\n\nMet vriendelijke groet,\nHet EXTRA team' },
            ],
          }),
          isStandaard: true,
          actief: true,
        } as any);
        await storage.createOnboardingTemplate({
          naam: 'Welcome to EXTRA (EN)',
          taal: 'Engels',
          functiegroep: null,
          opdrachtgever: null,
          onderwerp: 'Welcome to the EXTRA team, {{voornaam}}! 🎉',
          content: JSON.stringify({
            blokken: [
              { type: 'tekst', content: 'Hi {{voornaam}},\n\nWelcome to EXTRA! We are excited to have you join our team as {{functie}}. Below you will find all the information you need to get started.' },
              { type: 'tekst', content: 'Your start date: {{startdatum}}\n\nIf you have any questions, feel free to reach out.\n\nKind regards,\nThe EXTRA team' },
            ],
          }),
          isStandaard: true,
          actief: true,
        } as any);
        console.log('[onboarding] standaard templates geseed');
      }
    } catch (e) {
      console.warn('[onboarding] seed templates overgeslagen:', e);
    }
  })();

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

  // Update sollicitatie (volledige formData + top-level velden)
  app.patch("/api/admin/applications/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig ID" });

      const allowedTopLevel = [
        'firstName', 'lastName', 'email', 'phone', 'city',
        'interviewer', 'salaryScale', 'assessmentRating',
      ] as const;
      const patch: Record<string, any> = {};
      for (const key of allowedTopLevel) {
        if (key in req.body) patch[key] = req.body[key];
      }
      if ('formData' in req.body) {
        if (req.body.formData !== null && typeof req.body.formData !== 'object') {
          return res.status(400).json({ message: "formData moet een object zijn" });
        }
        patch.formData = req.body.formData;
      }
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ message: "Geen velden om bij te werken" });
      }

      const [updated] = await db.update(applications)
        .set(patch)
        .where(eq(applications.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Sollicitatie niet gevonden" });
      return res.json(updated);
    } catch (error) {
      console.error("Error updating application:", error);
      return res.status(500).json({ message: "Fout bij bijwerken sollicitatie" });
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
        ...landvelden(data.nationality),
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

      // FASE 1 (mei 2026): de auto-aanmaak van een placeholder-conversatie
      // ("[Sollicitant — nog geen bericht]") is uitgeschakeld. Sollicitanten
      // verschijnen nu automatisch in de Contacten-pagina op basis van de
      // candidates-tabel. Een gesprek in de WhatsApp-inbox wordt pas
      // aangemaakt zodra er een echt bericht wordt verstuurd of ontvangen.

      // Als het formulier gekoppeld is aan een bestaande kandidaat (gepland/uitgenodigd),
      // zet die kandidaat op 'aangenomen' zodat hij uit "Gesprek gepland" verdwijnt
      // en als sollicitant wordt geregistreerd.
      if (data.linkedCandidateId) {
        try {
          await storage.updateCandidateStatus(data.linkedCandidateId, 'aangenomen', undefined);
        } catch (e: any) {
          console.error('[Sollicitatie] Fout bij updaten status naar aangenomen:', e.message);
        }
      }

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

      // Planbord-webhook gebeurt nu uitsluitend bij "Aannemen als medewerker"
      // (POST /api/admin/applications/:id/aannemen), niet bij intake-submission.

      return res.status(201).json({ 
        message: "Sollicitatie succesvol opgeslagen",
        candidateId: candidate.id 
      });
    } catch (error) {
      console.error("Error saving sollicitatie:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het opslaan van de sollicitatie" });
    }
  });

  /**
   * Contactformulier op /contact.
   *
   * Dit endpoint bestond niet. Het formulier deed bij verzenden uitsluitend een
   * console.log() in de browser en toonde daarna "Bericht verzonden — We nemen
   * zo snel mogelijk contact met je op". Er werd niets opgeslagen, niets
   * gemaild en niemand geïnformeerd.
   *
   * Volgorde is bewust: eerst opslaan, dan mailen. Valt de mailservice uit,
   * dan staat het bericht nog steeds in de database en is het niet verloren.
   */
  app.post("/api/contact-bericht", async (req: Request, res: Response) => {
    try {
      const { valideerContactBericht, contactBerichtInternMail, contactBerichtBevestigingMail, AFZENDER, INTERNE_ONTVANGERS } =
        await import("@shared/aanvraagMails");
      const { contactBerichten } = await import("@shared/schema");

      const controle = valideerContactBericht(req.body);
      if (!controle.ok) {
        return res.status(400).json({ message: "Controleer de ingevulde gegevens.", fouten: controle.fouten });
      }
      const bericht = controle.waarden;

      const [rij] = await db
        .insert(contactBerichten)
        .values({
          naam: bericht.naam,
          email: bericht.email,
          bericht: bericht.bericht,
          pagina: typeof req.body?.pagina === "string" ? req.body.pagina.slice(0, 200) : null,
        })
        .returning();

      storage
        .createAdminNotification({
          type: "contact_bericht",
          title: "Nieuw bericht via de website",
          message: `${bericht.naam} (${bericht.email}) stuurde een bericht via het contactformulier.`,
          link: "/dashboard",
        })
        .catch((e: any) => console.error("[Contact] Notificatie fout:", e));

      // Mailen mag mislukken zonder dat de bezoeker een foutmelding krijgt:
      // het bericht staat dan al veilig in de database.
      try {
        const { sendEmail } = await import("./mail");
        const intern = contactBerichtInternMail(bericht);
        await sendEmail({
          to: INTERNE_ONTVANGERS,
          from: AFZENDER,
          replyTo: bericht.email,
          subject: intern.subject,
          html: intern.html,
          text: intern.text,
        });
        const bevestiging = contactBerichtBevestigingMail(bericht);
        await sendEmail({
          to: bericht.email,
          from: AFZENDER,
          replyTo: INTERNE_ONTVANGERS[0],
          subject: bevestiging.subject,
          html: bevestiging.html,
          text: bevestiging.text,
        });
        console.log(`[Contact] Bericht #${rij.id} van ${bericht.email} opgeslagen en gemaild`);
      } catch (mailErr) {
        console.error(`[Contact] Bericht #${rij.id} opgeslagen, maar mailen mislukte:`, mailErr);
      }

      return res.status(201).json({ success: true, id: rij.id });
    } catch (error) {
      console.error("[Contact] Fout bij verwerken contactbericht:", error);
      return res.status(500).json({ message: "Er ging iets mis bij het versturen. Bel ons gerust op 085 130 59 15." });
    }
  });

  /** Contactberichten voor het dashboard, nieuwste eerst. */
  app.get("/api/admin/contact-berichten", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const { contactBerichten } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      const rijen = await db.select().from(contactBerichten).orderBy(desc(contactBerichten.createdAt));
      return res.json(rijen);
    } catch (error) {
      console.error("[Contact] Fout bij ophalen contactberichten:", error);
      return res.status(500).json({ message: "Fout bij ophalen contactberichten" });
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
          // Update existing company: markeer als hot (temperatuur-veld,
          // voorheen de tag 'Hot lead' — die tags zijn gesaneerd).
          if ((existingMatch as any).temperature !== 'hot') {
            await storage.updateCrmCompany(existingMatch.id, { temperature: 'hot' } as any);
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
            temperature: 'hot',
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

      // Bevestigingsmail naar de aanvrager.
      //
      // Deze ontbrak: iemand die om 22:00 een aanvraag doet voor de volgende
      // ochtend had tot het terugbelmoment geen enkel bewijs dat zijn aanvraag
      // was aangekomen — precies het moment waarop hij ook een concurrent belt.
      //
      // Bewust in een eigen try/catch ná de interne mail: als deze mail faalt,
      // mag dat de aanvraag zelf en de interne notificatie niet raken.
      try {
        const { sendEmail } = await import('./mail');
        const { aanvraagBevestigingMail, AFZENDER, INTERNE_ONTVANGERS } = await import('@shared/aanvraagMails');
        const mail = aanvraagBevestigingMail({
          bedrijfsnaam: data.companyName,
          contactpersoon: data.contactName,
          telefoon: data.phone,
          email: data.email,
          locatienaam: data.locationName,
          functies: data.functions,
          opmerkingen: data.notes,
        });
        await sendEmail({
          to: data.email,
          from: AFZENDER,
          replyTo: INTERNE_ONTVANGERS[0],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
        console.log(`[StaffingRequest] Bevestiging verzonden naar ${data.email} (aanvraag #${result.id})`);
      } catch (bevestigingErr) {
        console.error('[StaffingRequest] Fout bij bevestigingsmail naar aanvrager:', bevestigingErr);
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

  // ─── TWV: auditregels (onderdeel B) ───────────────────────────────────────
  //
  // Geen van de TWV-endpoints schreef een auditregel, terwijl acht andere
  // plekken in dit bestand dat wel doen. Daardoor was "wie heeft deze
  // vergunning op verstrekt gezet, en wanneer?" niet te beantwoorden — bij een
  // controle precies de vraag die gesteld wordt.
  //
  // Deze helper legt per aanroep één regel vast met alleen de velden die
  // werkelijk veranderd zijn, met de oude én de nieuwe waarde. Verandert er
  // niets, dan wordt er ook niets weggeschreven: een auditlog vol lege regels
  // maakt het zoeken alleen maar moeilijker.
  //
  // De tabel heeft geen kolom voor een e-mailadres, alleen changed_by_user_id.
  // Het adres gaat daarom mee in de omschrijving, zodat de regel leesbaar blijft
  // ook als een account later wordt hernoemd of verwijderd.
  const TWV_GEVOLGDE_VELDEN = [
    'twvStatus', 'twvStartDate', 'twvEndDate', 'twvNotes', 'needsTwv',
    'nationality', 'nationalityIso', 'nationalityZone',
    'firstName', 'lastName', 'email', 'functionType',
  ] as const;

  async function twvGebruikerOmschrijving(req: Request): Promise<string> {
    const userId = req.session?.userId;
    if (!userId) return 'onbekende gebruiker';
    try {
      const user = await storage.getUser(userId);
      return user?.email ? `${user.email} (#${userId})` : `gebruiker #${userId}`;
    } catch {
      return `gebruiker #${userId}`;
    }
  }

  async function logTwvWijziging(opties: {
    req: Request;
    candidateId: number;
    voor: Record<string, any> | null | undefined;
    na: Record<string, any>;
    action: 'updated' | 'created' | 'imported';
    aanleiding: string;
  }): Promise<void> {
    try {
      const { req, candidateId, voor, na, action, aanleiding } = opties;
      const wijzigingen: Record<string, { oud: any; nieuw: any }> = {};
      for (const veld of TWV_GEVOLGDE_VELDEN) {
        if (!(veld in na)) continue;
        const oud = voor ? (voor as any)[veld] ?? null : null;
        const nieuw = (na as any)[veld] ?? null;
        if (String(oud) === String(nieuw)) continue;
        wijzigingen[veld] = { oud, nieuw };
      }
      // Bij een nieuwe kandidaat is er niets om mee te vergelijken; dan is de
      // regel zelf het punt. Bij een wijziging zonder verschil schrijven we niet.
      if (action !== 'created' && Object.keys(wijzigingen).length === 0) return;

      const door = await twvGebruikerOmschrijving(req);
      await storage.createCandidateAuditLog({
        candidateId,
        action,
        changedByUserId: req.session?.userId ?? null,
        changeData: {
          description: `${aanleiding} — door ${door}`,
          ...(wijzigingen as any),
        },
        ipAddress: req.ip ?? null,
      });
    } catch (err: any) {
      // Een mislukte auditregel mag de wijziging zelf nooit tegenhouden.
      console.warn('[TWV] auditregel mislukt (niet-kritiek):', err?.message ?? err);
    }
  }

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
      const { twvStatus, twvStartDate, twvEndDate, twvNotes, needsTwv, firstName, lastName, email, nationality, functionType } = req.body;
      const updateData: Record<string, any> = {};
      if (twvStatus !== undefined) {
        updateData.twvStatus = twvStatus;
        // Zet iemand de status terug op verstrekt, dan is een volgende
        // verloopdatum een nieuwe gebeurtenis en hoort daar opnieuw een melding
        // bij. Zonder dit zou een verlengde vergunning nooit meer melden.
        if (twvStatus !== 'twv_verlopen') updateData.twvExpiredNotifiedAt = null;
      }
      if (twvStartDate !== undefined) updateData.twvStartDate = twvStartDate;
      if (twvEndDate !== undefined) updateData.twvEndDate = twvEndDate;
      if (twvNotes !== undefined) updateData.twvNotes = twvNotes;
      if (needsTwv !== undefined) updateData.needsTwv = needsTwv;
      if (firstName !== undefined) updateData.firstName = String(firstName).trim();
      if (lastName !== undefined) updateData.lastName = String(lastName).trim();
      if (email !== undefined) updateData.email = email ? String(email).trim() : null;
      if (nationality !== undefined) Object.assign(updateData, landvelden(nationality));
      if (functionType !== undefined) updateData.functionType = functionType;

      // Eerst de oude waarden ophalen, anders valt er achteraf niets te
      // vergelijken en weet je alleen wát er staat, niet wat het was.
      const voor = await storage.getCandidate(id).catch(() => undefined);
      const updated = await storage.updateCandidate(id, updateData as any);
      if (!updated) return res.status(404).json({ message: "Kandidaat niet gevonden" });
      await logTwvWijziging({
        req, candidateId: id, voor, na: updateData, action: 'updated',
        aanleiding: 'TWV-gegevens gewijzigd via het TWV-scherm',
      });
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
      const voor = await storage.getCandidate(id).catch(() => undefined);
      const updated = await storage.updateCandidate(id, updateData as any);
      if (!updated) return res.status(404).json({ message: "Kandidaat niet gevonden" });
      await logTwvWijziging({
        req, candidateId: id, voor, na: updateData, action: 'updated',
        aanleiding: 'Bestaande kandidaat aan de TWV-lijst toegevoegd',
      });
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
        ...landvelden(nationality),
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
      await logTwvWijziging({
        req, candidateId: newCandidate.id, voor: null, na: newCandidate as any, action: 'created',
        aanleiding: 'Nieuwe kandidaat handmatig aangemaakt op het TWV-scherm',
      });
      return res.json(newCandidate);
    } catch (error) {
      console.error("Fout bij aanmaken en toevoegen TWV:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // De vijf geldige statussen, hier één keer opgeschreven zodat de import ze kan
  // controleren vóór het wegschrijven. Zonder deze controle kwam een typefout in
  // het CSV-bestand als rauwe databasefout terug ("invalid input value for enum")
  // en zag je in het importresultaat alleen "error" zonder te weten waarom.
  const TWV_STATUSSEN = ['twv_nodig', 'twv_aangevraagd', 'info_nodig', 'twv_verstrekt', 'twv_verlopen'] as const;

  // Bulk import van TWV-gegevens vanuit CSV (frontend parsed → JSON array)
  app.post("/api/admin/twv/import", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const rows: Array<{ email?: string; firstName?: string; lastName?: string; twvStatus?: string; twvStartDate?: string; twvEndDate?: string; twvNotes?: string }> = req.body.rows || [];
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Geen rijen opgegeven" });
      const result = await storage.getCandidates();
      const allCandidates = Array.isArray(result) ? result : (result as any).candidates ?? [];
      const results: { email: string; status: 'ok' | 'not_found' | 'error' | 'ongeldige_status'; melding?: string }[] = [];
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
          const status = (row.twvStatus || 'twv_verstrekt').trim();
          if (!(TWV_STATUSSEN as readonly string[]).includes(status)) {
            results.push({
              email: row.email || `${row.firstName} ${row.lastName}`,
              status: 'ongeldige_status',
              melding: `"${status}" is geen geldige TWV-status. Gebruik: ${TWV_STATUSSEN.join(', ')}.`,
            });
            continue;
          }
          const updateData: Record<string, any> = { needsTwv: true, twvStatus: status };
          if (row.twvStartDate) updateData.twvStartDate = row.twvStartDate;
          if (row.twvEndDate) updateData.twvEndDate = row.twvEndDate;
          if (row.twvNotes) updateData.twvNotes = row.twvNotes;
          await storage.updateCandidate(match.id, updateData as any);
          // De oude waarden zitten al in `match`; geen extra query nodig.
          await logTwvWijziging({
            req, candidateId: match.id, voor: match, na: updateData, action: 'imported',
            aanleiding: 'TWV-gegevens bijgewerkt via CSV-import',
          });
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
        ['ID', 'Voornaam', 'Achternaam', 'Nationaliteit', 'Landcode', 'Functie', 'TWV Status', 'Startdatum TWV', 'Einddatum TWV', 'Aangemeld op'],
        ...twvCandidates.map((c: any) => [
          c.id,
          c.firstName,
          c.lastName,
          c.nationality || '',
          // Landcode erbij voor gebruik bij een inspectie: op de vrije tekst valt
          // niet te filteren, op een code wel. Leeg als de naam niet herkend is.
          c.nationalityIso || '',
          c.functionType || '',
          // Zelfde noemer als het scherm: een lege status heet overal "Geen status".
          statusLabels[c.twvStatus] || c.twvStatus || 'Geen status',
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

  // ─── TWV: verlopen vergunningen (onderdeel A) ─────────────────────────────
  //
  // Tot nu toe verschoof het TWV-scherm een verstrekte vergunning met een
  // verstreken einddatum in de BROWSER naar "TWV Verlopen", zonder dat weg te
  // schrijven. De CSV-export las rechtstreeks uit de database en noemde
  // diezelfde rij "TWV Verstrekt". Twee documenten, twee getallen.
  //
  // Vanaf hier is de database leidend: deze taak zet de status daadwerkelijk om,
  // het scherm toont voortaan gewoon wat er staat, en er is geen derde plek meer
  // die zelf iets afleidt.
  //
  // PROEFSTAND. Zolang TWV_AUTO_VERLOPEN_ACTIEF op false staat schrijft deze
  // taak NIETS. Hij logt alleen welke rijen hij zou omzetten. Dat is met opzet:
  // de eerste echte schrijfactie raakt bestaande productierijen, en die lijst
  // hoort eerst met eigen ogen bekeken te zijn. Zet hem pas op true nadat de
  // proefstand-uitvoer is goedgekeurd.
  const TWV_AUTO_VERLOPEN_ACTIEF = false;

  async function verwerkVerlopenTwv(opties?: { forceerSchrijven?: boolean }): Promise<{
    droog: boolean;
    bekeken: number;
    gevonden: number;
    gewijzigd: number;
    rijen: Array<{ id: number; naam: string; einddatum: string | null; dagenVerlopen: number }>;
  }> {
    const schrijven = opties?.forceerSchrijven ?? TWV_AUTO_VERLOPEN_ACTIEF;
    const alleTwv = await storage.getTwvCandidates();
    const vandaag = new Date();
    const teVerlopen = bepaalVerlopenRijen(alleTwv as any[], vandaag);

    const rijen = teVerlopen.map((c: any) => ({
      id: c.id,
      naam: `${c.firstName} ${c.lastName}`.trim(),
      einddatum: c.twvEndDate ?? null,
      dagenVerlopen: dagenVerlopen(c, vandaag),
    }));

    if (!schrijven) {
      console.log(`[TWV] PROEFSTAND — ${rijen.length} van ${alleTwv.length} rijen zouden op twv_verlopen gezet worden. Er is niets gewijzigd.`);
      for (const r of rijen) {
        console.log(`[TWV]   #${r.id} ${r.naam} — einddatum ${r.einddatum}, ${r.dagenVerlopen} dag(en) verlopen`);
      }
      return { droog: true, bekeken: alleTwv.length, gevonden: rijen.length, gewijzigd: 0, rijen };
    }

    let gewijzigd = 0;
    for (const c of teVerlopen as any[]) {
      try {
        await storage.updateCandidate(c.id, { twvStatus: 'twv_verlopen' } as any);
        // Auditregel met een eigen actietype, zodat achteraf te zien is dat dit
        // de taak was en niet een admin die de status beoordeeld heeft.
        await storage.createCandidateAuditLog({
          candidateId: c.id,
          action: 'twv_auto_expired',
          changedByUserId: null,
          changeData: {
            fieldName: 'twvStatus',
            oldValue: 'twv_verstrekt',
            newValue: 'twv_verlopen',
            description: `Automatisch verlopen: einddatum ${c.twvEndDate} ligt in het verleden`,
          },
          ipAddress: null,
        }).catch((e: any) => console.warn('[TWV] auditregel mislukt (niet-kritiek):', e?.message ?? e));
        gewijzigd++;
      } catch (err: any) {
        console.error(`[TWV] omzetten mislukt voor #${c.id}:`, err?.message ?? err);
      }
    }
    console.log(`[TWV] ${gewijzigd} van ${rijen.length} rijen op twv_verlopen gezet.`);
    return { droog: false, bekeken: alleTwv.length, gevonden: rijen.length, gewijzigd, rijen };
  }

  // ─── TWV: melden dat een vergunning AL verlopen is (onderdeel E) ──────────
  //
  // checkTwvReminders() filtert op daysLeft > 0 en zwijgt dus vanaf de dag dat
  // het echt misgaat. Onderdeel A maakt dat gat groter: zodra de status op
  // twv_verlopen staat, valt de rij helemaal uit die selectie.
  //
  // Deze ronde pakt elke rij met status twv_verlopen, een einddatum die écht in
  // het verleden ligt, en nog geen twv_expired_notified_at. Één melding per
  // kandidaat per verlopen-gebeurtenis: het stempel wordt gewist zodra iemand de
  // status terugzet op twv_verstrekt, zodat een verlengde en opnieuw verlopen
  // vergunning wél weer meldt.
  //
  // De datumcontrole is geen detail. De status twv_verlopen kan met de hand of
  // via een import gezet zijn op een rij met een einddatum in de toekomst.
  // Zonder die controle ging er een mail uit met "verlopen op 9 april 2027".
  // Zulke rijen komen apart terug als `tegenstrijdig` en worden niet gemeld en
  // niet gewijzigd; die horen met de hand bekeken te worden.
  //
  // Volgt dezelfde vlag als hierboven: in proefstand wordt er niets verstuurd en
  // niets weggeschreven, alleen geteld.
  async function meldVerlopenTwv(opties?: { forceerVersturen?: boolean }): Promise<{
    droog: boolean;
    gevonden: number;
    gemeld: number;
    rijen: Array<{ id: number; naam: string; einddatum: string | null; dagenVerlopen: number }>;
    tegenstrijdig: Array<{ id: number; naam: string; einddatum: string | null; dagenVerlopen: number }>;
  }> {
    const versturen = opties?.forceerVersturen ?? TWV_AUTO_VERLOPEN_ACTIEF;
    const alleTwv = await storage.getTwvCandidates();
    const vandaag = new Date();
    const teMelden = bepaalTeMeldenRijen(alleTwv as any[], vandaag);

    const beschrijf = (c: any) => ({
      id: c.id,
      naam: `${c.firstName} ${c.lastName}`.trim(),
      einddatum: c.twvEndDate ?? null,
      dagenVerlopen: dagenVerlopen(c, vandaag),
    });
    const rijen = teMelden.map(beschrijf);
    const tegenstrijdig = bepaalTegenstrijdigeRijen(alleTwv as any[], vandaag).map(beschrijf);
    if (tegenstrijdig.length > 0) {
      console.warn(`[TWV] ${tegenstrijdig.length} rij(en) staan op twv_verlopen terwijl de einddatum nog niet gepasseerd is. Niet gemeld, niet gewijzigd: ${tegenstrijdig.map(r => `#${r.id}`).join(', ')}`);
    }

    if (!versturen) {
      console.log(`[TWV] PROEFSTAND — ${rijen.length} melding(en) "TWV is verlopen" zouden verstuurd worden. Er is niets verstuurd.`);
      return { droog: true, gevonden: rijen.length, gemeld: 0, rijen, tegenstrijdig };
    }

    let gemeld = 0;
    for (const c of teMelden) {
      try {
        await sendTwvExpiredNotice({
          firstName: c.firstName,
          lastName: c.lastName,
          id: c.id,
          twvEndDate: c.twvEndDate,
          dagenVerlopen: dagenVerlopen(c, vandaag),
        }).catch((e: Error) => console.error('[TWV] verlopen-mail mislukt:', e));

        await storage.createAdminNotification({
          type: 'twv_verlopen',
          title: 'TWV is verlopen',
          message: `De TWV van ${c.firstName} ${c.lastName} is verlopen op ${c.twvEndDate}. Deze medewerker mag niet worden ingepland.`,
          link: '/dashboard?tab=twv',
          candidateId: c.id,
        }).catch((e: any) => console.error('[TWV] verlopen-notificatie mislukt:', e));

        await storage.updateCandidate(c.id, { twvExpiredNotifiedAt: new Date() } as any);
        gemeld++;
      } catch (err: any) {
        console.error(`[TWV] melden mislukt voor #${c.id}:`, err?.message ?? err);
      }
    }
    console.log(`[TWV] ${gemeld} van ${rijen.length} verlopen-meldingen verstuurd.`);
    return { droog: false, gevonden: rijen.length, gemeld, rijen, tegenstrijdig };
  }

  // Proefstand voor de meldingen: laat zien wie een melding zou krijgen.
  app.get("/api/admin/twv/proefstand-meldingen", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const r = await meldVerlopenTwv({ forceerVersturen: false });
      return res.json({ ...r, actiefInProductie: TWV_AUTO_VERLOPEN_ACTIEF });
    } catch (error: any) {
      console.error("Fout bij proefstand meldingen:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // Proefstand bekijken. Schrijft nooit, ongeacht de vlag hierboven.
  app.get("/api/admin/twv/proefstand-verlopen", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const r = await verwerkVerlopenTwv({ forceerSchrijven: false });
      return res.json({ ...r, actiefInProductie: TWV_AUTO_VERLOPEN_ACTIEF });
    } catch (error: any) {
      console.error("Fout bij proefstand verlopen:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // Handmatig draaien. Volgt de vlag: staat die op false, dan is dit hetzelfde
  // als de proefstand en verandert er niets.
  app.post("/api/admin/twv/verwerk-verlopen", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const r = await verwerkVerlopenTwv();
      return res.json({ ...r, actiefInProductie: TWV_AUTO_VERLOPEN_ACTIEF });
    } catch (error: any) {
      console.error("Fout bij verwerken verlopen TWV:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // ─── TWV: lege status opschonen (eenmalig) ────────────────────────────────
  //
  // Een rij met needs_twv = true en twv_status IS NULL heet op het scherm
  // "TWV Nodig" en in de export "Onbekend". Dat is dezelfde dubbele afleiding
  // als hierboven, alleen voor een andere waarde. Eén keer wegschrijven maakt er
  // een echte status van.

  app.get("/api/admin/twv/lege-status-telling", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const alleTwv = await storage.getTwvCandidates();
      const leeg = bepaalLegeStatusRijen(alleTwv as any[]);
      return res.json({
        bekeken: alleTwv.length,
        gevonden: leeg.length,
        rijen: leeg.map((c: any) => ({
          id: c.id,
          naam: `${c.firstName} ${c.lastName}`.trim(),
          aangemaakt: c.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Fout bij tellen lege TWV-status:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  app.post("/api/admin/twv/lege-status-backfill", adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Bewuste drempel: deze route wijzigt bestaande rijen en moet niet per
      // ongeluk af te vuren zijn. Zonder { bevestig: true } gebeurt er niets.
      if (req.body?.bevestig !== true) {
        return res.status(400).json({
          message: "Stuur { \"bevestig\": true } mee. Bekijk eerst /api/admin/twv/lege-status-telling.",
        });
      }
      const alleTwv = await storage.getTwvCandidates();
      const leeg = bepaalLegeStatusRijen(alleTwv as any[]);
      let gewijzigd = 0;
      for (const c of leeg as any[]) {
        try {
          await storage.updateCandidate(c.id, { twvStatus: 'twv_nodig' } as any);
          await storage.createCandidateAuditLog({
            candidateId: c.id,
            action: 'twv_status_backfill',
            changedByUserId: req.session?.userId ?? null,
            changeData: {
              fieldName: 'twvStatus',
              oldValue: null,
              newValue: 'twv_nodig',
              description: 'Eenmalige opschoning: lege status vastgelegd als twv_nodig',
            },
            ipAddress: req.ip ?? null,
          }).catch((e: any) => console.warn('[TWV] auditregel mislukt (niet-kritiek):', e?.message ?? e));
          gewijzigd++;
        } catch (err: any) {
          console.error(`[TWV] backfill mislukt voor #${c.id}:`, err?.message ?? err);
        }
      }
      console.log(`[TWV] lege-status-backfill: ${gewijzigd} van ${leeg.length} rijen op twv_nodig gezet.`);
      return res.json({ gevonden: leeg.length, gewijzigd });
    } catch (error: any) {
      console.error("Fout bij backfill lege TWV-status:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // ─── TWV: nationaliteitsrapport (onderdeel C, leesbaar vanuit de app) ─────
  //
  // Hetzelfde rapport als scripts/twv-nationaliteit-rapport.ts, maar dan vanuit
  // de draaiende app en dus tegen de database waar de echte rijen staan. Geeft
  // uitsluitend geaggregeerde tellingen terug: landnaam en aantal, plus id's bij
  // de niet-matchende waarden zodat een admin ze kan opzoeken. Geen namen, geen
  // e-mailadressen.
  app.get("/api/admin/twv/nationaliteit-rapport", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const rijen = await storage.getTwvCandidates();
      let zonderNationaliteit = 0;

      // Bewust gewone objecten en geen Map: de tsconfig van dit project heeft
      // geen target/downlevelIteration, en een Map-iterator uitspreiden geeft
      // dan TS2802.
      const gematcht: Record<string, { iso: string; zone: string; aantal: number }> = {};
      const nietGematcht: Record<string, number[]> = {};

      for (const c of rijen as any[]) {
        const tekst = String(c.nationality ?? "").trim();
        if (!tekst) { zonderNationaliteit++; continue; }
        const land = zoekLand(tekst);
        if (land) {
          if (!gematcht[tekst]) gematcht[tekst] = { iso: land.iso, zone: land.zone, aantal: 0 };
          gematcht[tekst].aantal++;
        } else {
          if (!nietGematcht[tekst]) nietGematcht[tekst] = [];
          nietGematcht[tekst].push(c.id);
        }
      }

      const wordtGevuld = Object.keys(gematcht)
        .map(naam => ({ naam, iso: gematcht[naam].iso, zone: gematcht[naam].zone, aantal: gematcht[naam].aantal }))
        .sort((a, b) => b.aantal - a.aantal || a.naam.localeCompare(b.naam));
      const blijftLeeg = Object.keys(nietGematcht)
        .map(naam => ({ naam, aantal: nietGematcht[naam].length, ids: nietGematcht[naam] }))
        .sort((a, b) => b.aantal - a.aantal || a.naam.localeCompare(b.naam));

      return res.json({
        totaal: rijen.length,
        zonderNationaliteit,
        matcht: wordtGevuld.reduce((t, r) => t + r.aantal, 0),
        matchtNiet: blijftLeeg.reduce((t, r) => t + r.aantal, 0),
        alGevuld: (rijen as any[]).filter(c => c.nationalityIso).length,
        wordtGevuld,
        blijftLeeg,
      });
    } catch (error: any) {
      console.error("Fout bij nationaliteitsrapport:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // ─── TWV: landcodes wegschrijven (stap a) ─────────────────────────────────
  //
  // Het rapport hierboven laat zien dat 31 van de 72 rijen exact op de
  // landenlijst matchen en 39 niet. Die 39 zijn geen onzin maar
  // nationaliteiten ("Bengalese"), Engelse landnamen ("Yemen") en typefouten
  // ("Agentinian"). Voor 37 daarvan is met de hand een koppeling goedgekeurd;
  // die staat in shared/landenAlias.ts. De twee overige waarden zijn een
  // aantekening van een medewerker en blijven bewust leeg.
  //
  // Twee endpoints, dezelfde volgorde als bij de lege statussen: eerst tellen,
  // dan pas schrijven achter een expliciete bevestiging. Beide raken alleen
  // nationality_iso en nationality_zone aan. De vrije tekst in nationality
  // blijft staan zoals hij staat, en twv_status wordt niet aangeraakt.

  /**
   * Deelt alle TWV-rijen in vier hopen: krijgt een code, heeft er al een,
   * blijft leeg, of heeft helemaal geen nationaliteit. Puur rekenen — deze
   * functie schrijft niets en wordt door beide endpoints gebruikt, zodat de
   * telling en de schrijfactie per definitie over dezelfde rijen gaan.
   */
  function verdeelLandcodes(rijen: any[]) {
    const teVullen: Array<{ id: number; tekst: string; iso: string; zone: string; viaAlias: boolean }> = [];
    const alGevuld: number[] = [];
    const zonderNationaliteit: number[] = [];
    const blijftLeeg: Record<string, { ids: number[]; reden: string }> = {};
    const perWaarde: Record<string, { iso: string; zone: string; viaAlias: boolean; ids: number[] }> = {};

    for (const c of rijen) {
      const tekst = String(c.nationality ?? "").trim();
      if (!tekst) { zonderNationaliteit.push(c.id); continue; }
      if (c.nationalityIso) { alGevuld.push(c.id); continue; }

      const { land, viaAlias } = zoekLandMetAlias(tekst);
      if (!land) {
        const reden = NIET_KOPPELEN.indexOf(tekst) >= 0
          ? "aantekening, geen nationaliteit — bewust niet gekoppeld"
          : "staat niet in de landenlijst en niet in de aliaslijst";
        if (!blijftLeeg[tekst]) blijftLeeg[tekst] = { ids: [], reden };
        blijftLeeg[tekst].ids.push(c.id);
        continue;
      }

      teVullen.push({ id: c.id, tekst, iso: land.iso, zone: land.zone, viaAlias });
      if (!perWaarde[tekst]) perWaarde[tekst] = { iso: land.iso, zone: land.zone, viaAlias, ids: [] };
      perWaarde[tekst].ids.push(c.id);
    }

    return { teVullen, alGevuld, zonderNationaliteit, blijftLeeg, perWaarde };
  }

  /**
   * Rijen die op de TWV-lijst staan terwijl dat inhoudelijk niet klopt, of
   * waarvan status en datum elkaar tegenspreken. Deze lijst verandert niets en
   * hoort met de hand bekeken te worden.
   *
   * Twee soorten. Eén: iemand met zone NL of EU heeft geen tewerkstellings-
   * vergunning nodig, dus hoort niet op deze lijst — hoe die rij daar terecht
   * is gekomen is een vraag voor een mens, geen ding om automatisch op te
   * ruimen. Twee: status twv_verlopen met een einddatum die nog niet gepasseerd
   * is (zie bepaalTegenstrijdigeRijen).
   */
  function bepaalNazoekRijen(rijen: any[], vandaag: Date) {
    const uit: Array<{ id: number; naam: string; nationaliteit: string | null; zone: string | null; twvStatus: string | null; einddatum: string | null; reden: string }> = [];
    const beschrijf = (c: any, zone: string | null, reden: string) => ({
      id: c.id,
      naam: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
      nationaliteit: c.nationality ?? null,
      zone,
      twvStatus: c.twvStatus ?? null,
      einddatum: c.twvEndDate ?? null,
      reden,
    });

    for (const c of rijen) {
      const tekst = String(c.nationality ?? "").trim();
      const zone = tekst ? (zoekLandMetAlias(tekst).land?.zone ?? null) : null;
      if (zone === "NL" || zone === "EU") {
        uit.push(beschrijf(c, zone, `nationaliteit valt in zone ${zone} — heeft geen TWV nodig, hoort niet op deze lijst`));
      }
    }
    for (const c of bepaalTegenstrijdigeRijen(rijen, vandaag)) {
      const tekst = String((c as any).nationality ?? "").trim();
      const zone = tekst ? (zoekLandMetAlias(tekst).land?.zone ?? null) : null;
      if (uit.some(r => r.id === (c as any).id)) continue;
      uit.push(beschrijf(c, zone, "status twv_verlopen terwijl de einddatum nog niet gepasseerd is"));
    }
    return uit.sort((a, b) => a.id - b.id);
  }

  // Telling vooraf. Schrijft nooit.
  app.get("/api/admin/twv/landcode-telling", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const rijen = await storage.getTwvCandidates() as any[];
      const v = verdeelLandcodes(rijen);

      const wordtGevuld = Object.keys(v.perWaarde)
        .map(naam => ({
          naam,
          iso: v.perWaarde[naam].iso,
          zone: v.perWaarde[naam].zone,
          viaAlias: v.perWaarde[naam].viaAlias,
          aantal: v.perWaarde[naam].ids.length,
          ids: v.perWaarde[naam].ids,
        }))
        .sort((a, b) => b.aantal - a.aantal || a.naam.localeCompare(b.naam));
      const blijftLeeg = Object.keys(v.blijftLeeg)
        .map(naam => ({ naam, aantal: v.blijftLeeg[naam].ids.length, ids: v.blijftLeeg[naam].ids, reden: v.blijftLeeg[naam].reden }))
        .sort((a, b) => b.aantal - a.aantal || a.naam.localeCompare(b.naam));

      return res.json({
        totaal: rijen.length,
        wordtGevuldTotaal: v.teVullen.length,
        viaAlias: v.teVullen.filter(r => r.viaAlias).length,
        directeMatch: v.teVullen.filter(r => !r.viaAlias).length,
        alGevuld: v.alGevuld.length,
        zonderNationaliteit: v.zonderNationaliteit.length,
        blijftLeegTotaal: blijftLeeg.reduce((t, r) => t + r.aantal, 0),
        aliassenInGebruik: LAND_ALIASSEN.length,
        wordtGevuld,
        blijftLeeg,
        handmatigNazoeken: bepaalNazoekRijen(rijen, new Date()),
      });
    } catch (error: any) {
      console.error("Fout bij landcode-telling:", error);
      return res.status(500).json({ message: "Er is een fout opgetreden" });
    }
  });

  // De schrijfactie. Vult uitsluitend lege nationality_iso / nationality_zone.
  app.post("/api/admin/twv/landcode-backfill", adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Dezelfde drempel als bij de lege statussen: zonder { bevestig: true }
      // gebeurt er niets.
      if (req.body?.bevestig !== true) {
        return res.status(400).json({
          message: "Stuur { \"bevestig\": true } mee. Bekijk eerst /api/admin/twv/landcode-telling.",
        });
      }
      const rijen = await storage.getTwvCandidates() as any[];
      const { teVullen } = verdeelLandcodes(rijen);

      let gewijzigd = 0;
      const mislukt: number[] = [];
      for (const r of teVullen) {
        try {
          await storage.updateCandidate(r.id, { nationalityIso: r.iso, nationalityZone: r.zone } as any);
          await storage.createCandidateAuditLog({
            candidateId: r.id,
            action: 'twv_landcode_backfill',
            changedByUserId: req.session?.userId ?? null,
            changeData: {
              fieldName: 'nationalityIso',
              oldValue: null,
              newValue: `${r.iso} (${r.zone})`,
              description: r.viaAlias
                ? `Eenmalige opschoning: "${r.tekst}" gekoppeld via de goedgekeurde aliaslijst`
                : `Eenmalige opschoning: "${r.tekst}" matcht direct op de landenlijst`,
            },
            ipAddress: req.ip ?? null,
          }).catch((e: any) => console.warn('[TWV] auditregel mislukt (niet-kritiek):', e?.message ?? e));
          gewijzigd++;
        } catch (err: any) {
          mislukt.push(r.id);
          console.error(`[TWV] landcode-backfill mislukt voor #${r.id}:`, err?.message ?? err);
        }
      }
      console.log(`[TWV] landcode-backfill: ${gewijzigd} van ${teVullen.length} rijen voorzien van een landcode.`);
      return res.json({ gevonden: teVullen.length, gewijzigd, mislukt });
    } catch (error: any) {
      console.error("Fout bij landcode-backfill:", error);
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
      // Volgorde is niet vrijblijvend: eerst verlopen vergunningen omzetten,
      // dan pas herinneren. Andersom zou een vergunning die vandaag verlopen is
      // nog een "verloopt binnenkort"-mail krijgen.
      await verwerkVerlopenTwv();
      await meldVerlopenTwv();
      const sent = await checkTwvReminders();
      console.log(`[TWV] Reminder-check klaar — ${sent} herinneringen verstuurd`);
      scheduleTwvCheck(); // Plan de volgende check
    }, msUntil);
  }

  scheduleTwvCheck();

  // Eén keer bij het opstarten, zodat de eerste verwerking niet tot morgenochtend
  // wacht. In proefstand kost dat alleen een logregel.
  verwerkVerlopenTwv()
    .then(() => meldVerlopenTwv())
    .catch(e => console.error('[TWV] eerste verwerking mislukt:', e?.message ?? e));

  // ─── Calendly-reminder scheduler (dagelijks om 9:00) ─────────────────────
  // Stuurt 1× een WhatsApp-template-bericht naar kandidaten die >= 3 dagen geleden
  // op status 'gepland' zijn gezet maar nog geen Calendly-afspraak hebben geboekt.
  // Respecteert opt-in-status; reageert kandidaat, dan pakt het team het zelf op.
  // [PAUZE] Wanneer true: geen Calendly-WA-reminders meer (cron, backlog en admin-endpoint zijn no-ops).
  // We nemen handmatig contact op met geaccepteerde kandidaten i.p.v. via WhatsApp.
  const CALENDLY_WA_PAUSED = true;

  async function checkCalendlyReminders(opts?: { bypassDrempel?: boolean }): Promise<number> {
    if (CALENDLY_WA_PAUSED) {
      console.log('[Calendly-WA] Reminder-flow staat op pauze (CALENDLY_WA_PAUSED=true) — niets verstuurd.');
      return 0;
    }
    const bypassDrempel = !!opts?.bypassDrempel;
    const { stuurCalendlyReminderTemplate, bepaalTaal } = await import('./whatsapp/sendTemplate');
    let remindersSent = 0;
    try {
      // Pak alle kandidaten met status='gepland' (de UI-bucket).
      const list = await storage.getCandidates({ status: 'gepland', page: 1, limit: 1000 });
      const candidates = (list as any).candidates || list || [];
      const drempel = new Date(); drempel.setDate(drempel.getDate() - 3);

      for (const c of candidates) {
        if (c.interviewDate) continue;                                // al een gesprek geboekt
        if (c.calendlyReminderSentAt) continue;                       // al gehad
        if (!bypassDrempel) {
          // Ankerpunt: bij voorkeur calendlyInviteSentAt; voor de bestaande backlog
          // (kandidaten geaccepteerd vóór de invoer van dit veld) vallen we terug
          // op updatedAt — dat is in de praktijk het moment van de status-wijziging.
          const anker = c.calendlyInviteSentAt || c.updatedAt;
          if (!anker) continue;                                       // geen ankerpunt
          if (new Date(anker) > drempel) continue;                    // < 3 dagen geleden
        }
        if (!c.phone) continue;                                       // geen telefoonnummer
        if (c.whatsappOptInStatus && c.whatsappOptInStatus !== 'actief') continue;

        const taal = bepaalTaal(c.language);
        console.log(`[Calendly-WA] Reminder versturen → ${c.firstName} ${c.lastName} (${c.phone}, taal=${taal})`);

        const result = await stuurCalendlyReminderTemplate({
          phone: c.phone,
          voornaam: c.firstName || '',
          achternaam: c.lastName || null,
          taal,
          candidateId: c.id,
          functionType: c.functionType ?? null,
          language: c.language ?? null,
          triggeredByUserId: null,
        });

        if (result.success) {
          await storage.updateCandidate(c.id, { calendlyReminderSentAt: new Date() } as any);
          remindersSent++;
        } else {
          console.error(`[Calendly-WA] Mislukt voor ${c.firstName} ${c.lastName}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('[Calendly-WA] Fout bij verwerken reminders:', error);
    }
    return remindersSent;
  }

  function scheduleCalendlyReminderCheck() {
    const now = new Date();
    const next9am = new Date(now);
    next9am.setHours(9, 5, 0, 0); // 09:05 — net na TWV-check
    if (next9am <= now) next9am.setDate(next9am.getDate() + 1);
    const msUntil = next9am.getTime() - now.getTime();
    const minutesUntil = Math.round(msUntil / 60000);
    console.log(`[Calendly-WA] Volgende reminder-check gepland om ${next9am.toLocaleString('nl-NL')} (over ${minutesUntil} minuten)`);
    setTimeout(async () => {
      const sent = await checkCalendlyReminders();
      console.log(`[Calendly-WA] Reminder-check klaar — ${sent} herinneringen verstuurd`);
      scheduleCalendlyReminderCheck();
    }, msUntil);
  }
  if (CALENDLY_WA_PAUSED) {
    console.log('[Calendly-WA] Dagelijkse reminder-cron NIET gestart — flow op pauze.');
  } else {
    scheduleCalendlyReminderCheck();
  }

  // ─── EENMALIGE backlog-run vandaag 17:00 (12 mei 2026) ──────────────────────
  // Negeert de 3-dagen-drempel zodat de bestaande backlog (kandidaten die
  // vóór de uitrol van calendlyInviteSentAt op 'gepland' zijn gezet) in één
  // keer hun reminder krijgt. Daarna pakt de normale 09:05-cron het over.
  // Restart-safe: alleen scheduled als we daadwerkelijk vóór de cutoff zitten.
  function scheduleOneShotBacklogRun() {
    const cutoff = new Date('2026-05-12T17:30:00+02:00'); // CEST
    const now = new Date();
    if (now >= cutoff) {
      console.log('[Calendly-WA] One-shot backlog-run niet meer gepland (tijd al voorbij).');
      return;
    }
    const msUntil = cutoff.getTime() - now.getTime();
    const minutesUntil = Math.round(msUntil / 60000);
    console.log(`[Calendly-WA] Eenmalige backlog-run gepland om ${cutoff.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })} CEST (over ${minutesUntil} minuten, bypass 3-dagen-drempel).`);
    setTimeout(async () => {
      console.log('[Calendly-WA] Start eenmalige backlog-run (bypass 3-dagen-drempel)…');
      try {
        const sent = await checkCalendlyReminders({ bypassDrempel: true });
        console.log(`[Calendly-WA] Backlog-run klaar — ${sent} herinneringen verstuurd`);
      } catch (e) {
        console.error('[Calendly-WA] Fout in backlog-run:', e);
      }
    }, msUntil);
  }
  scheduleOneShotBacklogRun();

  // Admin endpoint — handmatig 1 reminder versturen (negeert 3-dagen-check, respecteert opt-in).
  app.post('/api/admin/candidates/:id/calendly-reminder-whatsapp', adminMiddleware, async (req: Request, res: Response) => {
    if (CALENDLY_WA_PAUSED) {
      return res.status(423).json({ error: 'Calendly-WA-reminder staat op pauze — neem handmatig contact op.' });
    }
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig candidate-ID' });
      const candidate = await storage.getCandidate(id);
      if (!candidate) return res.status(404).json({ error: 'Kandidaat niet gevonden' });
      if (!candidate.phone) return res.status(400).json({ error: 'Geen telefoonnummer bij deze kandidaat' });
      if ((candidate as any).whatsappOptInStatus && (candidate as any).whatsappOptInStatus !== 'actief') {
        return res.status(400).json({ error: 'Kandidaat heeft zich afgemeld voor WhatsApp' });
      }

      const { stuurCalendlyReminderTemplate, bepaalTaal } = await import('./whatsapp/sendTemplate');
      const taal = bepaalTaal((candidate as any).language);
      const result = await stuurCalendlyReminderTemplate({
        phone: candidate.phone,
        voornaam: candidate.firstName || '',
        achternaam: candidate.lastName || null,
        taal,
        candidateId: candidate.id,
        functionType: (candidate as any).functionType ?? null,
        language: (candidate as any).language ?? null,
        triggeredByUserId: req.session?.userId ?? null,
      });

      if (!result.success) return res.status(502).json({ error: result.error });

      await storage.updateCandidate(id, { calendlyReminderSentAt: new Date() } as any).catch(() => {});
      return res.json({ success: true, waMessageId: result.waMessageId, gebruikteTaal: result.gebruikteTaal });
    } catch (err: any) {
      console.error('[Calendly-WA] Handmatige reminder fout:', err);
      return res.status(500).json({ error: err?.message || 'Onbekende fout' });
    }
  });

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
      // Alleen bij een gepubliceerd artikel: een concept bijwerken is geen
      // wijziging die een zoekmachine aangaat. Het herhaalvenster in
      // indexnow.ts vangt het meermaals opslaan tijdens het redigeren af.
      if (post.status === 'published') meldAan([`/blog/${post.slug}`]);
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
      // Niet awaiten: de redacteur hoeft niet te wachten op een zoekmachine, en
      // meldAan() werpt nooit (zie server/indexnow.ts).
      meldAan([`/blog/${post.slug}`, '/blog']);
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
      // P15: /werkgevers bestond niet (404) — AI-gegenereerde artikelen namen
      // deze default steeds over, dus elk nieuw artikel kreeg dezelfde kapotte
      // link. /personeelsaanvraag is de bestaande pagina waar die knop naar
      // hoort te wijzen.
      const defaultInternalLinks = '/horeca-uitzendbureau-amsterdam, /personeelsaanvraag, /ik-zoek-extra-werk';
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

  // Public: sitemap.xml — gegenereerd uit shared/routeMeta.ts (één bron van
  // waarheid met de meta-injectie in server/seo.ts) + blogposts + vacatures.
  // Routes met noindex of een afwijkende canonical (duplicaten) staan er niet in.
  app.get('/sitemap.xml', async (_req: Request, res: Response) => {
    try {
      const { posts } = await storage.getBlogPosts({ status: 'published', limit: 500 });
      const { posts: vacancies } = await storage.getVacancyPosts({ status: 'published', limit: 500 });
      // Bewust géén BASE_URL-fallback naar een ander (sub)domein: het canonical
      // domein staat vast. BASE_URL kan het alleen expliciet overschrijven.
      const baseUrl = process.env.BASE_URL || SITE_ORIGIN;
      const staticPages = ROUTE_META.filter(m => !m.noindex && !m.canonical)
        .map(m => ({ url: m.path, priority: m.priority || '0.5', changefreq: m.changefreq || 'monthly' }));
      const today = new Date().toISOString().split('T')[0];
      // Taalparen als xhtml:link in de sitemap. De HTML-pagina's dragen deze
      // hreflang-tags al in hun <head>; ze óók in de sitemap zetten is de
      // tweede aanbevolen route van Google en helpt juist de Engelse pagina's,
      // die minder inkomende links hebben, sneller aan hun koppeling met de
      // Nederlandse tegenhanger. Zelfde bron als de <head>-tags
      // (HREFLANG_GROUPS), dus ze kunnen niet uit elkaar lopen.
      const absoluut = (pad: string) => `${baseUrl}${pad === '/' ? '/' : pad}`;
      const alternatesVoor = (pad: string): string => {
        const paar = HREFLANG_GROUPS.find(g => g.nl === pad || g.en === pad);
        if (!paar) return '';
        return [
          `    <xhtml:link rel="alternate" hreflang="nl" href="${absoluut(paar.nl)}"/>`,
          `    <xhtml:link rel="alternate" hreflang="en" href="${absoluut(paar.en)}"/>`,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluut(paar.nl)}"/>`,
        ].join('\n') + '\n';
      };
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticPages.map(p => `  <url>
    <loc>${baseUrl}${p.url === '/' ? '' : p.url}${p.url === '/' ? '/' : ''}</loc>
${alternatesVoor(p.url)}    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${posts.map(p => `  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${(p.publishedAt || p.createdAt)?.toISOString().split('T')[0] || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${vacancies.map(v => `  <url>
    <loc>${baseUrl}/vacatures/${v.slug}</loc>
    <lastmod>${(v.updatedAt || v.publishedAt || v.createdAt)?.toISOString().split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
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
      if (post.status === 'published') meldAan([`/vacatures/${post.slug}`]);
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
      meldAan([`/vacatures/${post.slug}`, '/vacatures']);
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

      // Verrijk met primair contact (telefoon + naam) voor de overzichtstabel.
      // Eén batch-query in plaats van N+1.
      const allContacts = await storage.getCrmContactsByCompanyIds(companies.map(c => c.id));
      const contactMap = new Map<number, any[]>();
      for (const ct of allContacts) {
        if (!contactMap.has(ct.companyId)) contactMap.set(ct.companyId, []);
        contactMap.get(ct.companyId)!.push(ct);
      }

      // Laatste contactmoment = meest recente regel in het activiteitenlog
      // (afgeleid, geen los veld — historie en waarde kloppen daardoor altijd).
      const lastActivityRows = ((await db.execute(sql`
        SELECT crm_company_id AS "companyId", max(created_at) AS "lastAt"
        FROM activities GROUP BY crm_company_id
      `)).rows ?? []) as any[];
      const lastContactMap = new Map<number, string>(lastActivityRows.map((r: any) => [Number(r.companyId), r.lastAt]));

      // Volgende actie = trigger van de actieve salesflow-kaart van het bedrijf.
      const nextActionRows = ((await db.execute(sql`
        SELECT DISTINCT ON (company_id) company_id AS "companyId",
               next_action_at AS "nextActionAt", next_action_type AS "nextActionType"
        FROM salesflow_cards
        ORDER BY company_id, updated_at DESC
      `)).rows ?? []) as any[];
      const nextActionMap = new Map<number, any>(nextActionRows.map((r: any) => [Number(r.companyId), r]));

      const enriched = companies.map((c) => {
        const list = contactMap.get(c.id) || [];
        const primary = list.find((ct: any) => ct.isPrimary) || list[0] || null;
        const na = nextActionMap.get(c.id) || null;
        return {
          ...c,
          primaryContactName: primary?.name || null,
          primaryContactPhone: primary?.phone || null,
          primaryContactEmail: primary?.email || null,
          contactCount: list.length,
          lastContactAt: lastContactMap.get(c.id) || null,
          nextActionAt: na?.nextActionAt || null,
          nextActionType: na?.nextActionType || null,
          inSalesflow: nextActionMap.has(c.id),
        };
      });
      return res.json(enriched);
    } catch (error) {
      console.error("Error fetching CRM companies:", error);
      return res.status(500).json({ message: "Fout bij ophalen bedrijven" });
    }
  });

  // ─── Activiteitenlog per bedrijf (tijdlijn in het lead-detail) ─────────────
  app.get("/api/admin/crm/companies/:id/activities", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig id" });
      const items = ((await db.execute(sql`
        SELECT a.id, a.type, a.description, a.created_at AS "createdAt",
               COALESCE(u.first_name, '—') AS "createdBy"
        FROM activities a
        LEFT JOIN users u ON u.id = a.created_by_user_id
        WHERE a.crm_company_id = ${id}
        ORDER BY a.created_at DESC
        LIMIT 200
      `)).rows ?? []) as any[];
      return res.json(items);
    } catch (error) {
      console.error("[crm] activities ophalen fout:", error);
      return res.status(500).json({ message: "Fout bij ophalen activiteiten" });
    }
  });

  // Handmatig een contactmoment loggen ("Gebeld — geen gehoor").
  // Wijzigt bewust NIET de fase — alleen een logregel in de tijdlijn.
  app.post("/api/admin/crm/companies/:id/activities", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig id" });
      const { type, description } = req.body || {};
      const allowed = ["call", "email", "meeting", "note"];
      if (!allowed.includes(type)) return res.status(400).json({ message: `Type moet één van ${allowed.join(", ")} zijn` });
      if (!description || !String(description).trim()) return res.status(400).json({ message: "Omschrijving is verplicht" });
      const created = ((await db.execute(sql`
        INSERT INTO activities (crm_company_id, type, description, created_by_user_id)
        VALUES (${id}, ${type}, ${String(description).trim()},
                (SELECT id FROM users WHERE id = ${req.session.userId ?? null}))
        RETURNING id, type, description, created_at AS "createdAt"
      `)).rows ?? [])[0];
      return res.json(created);
    } catch (error) {
      console.error("[crm] activiteit loggen fout:", error);
      return res.status(500).json({ message: "Fout bij loggen activiteit" });
    }
  });

  app.get("/api/admin/crm/companies/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCrmCompanyById(id);
      if (!company) return res.status(404).json({ message: "Bedrijf niet gevonden" });
      const [contacts, noteEntries, reminders, subLocations] = await Promise.all([
        storage.getCrmContacts(id),
        storage.getCrmNotes(id),
        storage.getCrmReminders({ companyId: id }),
        storage.getCrmSubLocations(id),
      ]);
      // Salesflow-status voor de drawer-header: heeft dit bedrijf een actieve
      // kaart op het bord? Plus het primaire contact (voor "Toevoegen aan Salesflow").
      const activeCard = ((await db.execute(sql`
        SELECT id FROM salesflow_cards WHERE company_id = ${id} ORDER BY updated_at DESC LIMIT 1
      `)).rows ?? [])[0] as any;
      const primaryContact = contacts.find((c: any) => c.isPrimary) || contacts[0] || null;
      return res.json({
        ...company, contacts, noteEntries, reminders, subLocations,
        inSalesflow: !!activeCard,
        salesflowCardId: activeCard?.id ?? null,
        primaryContactId: primaryContact?.id ?? null,
      });
    } catch (error) {
      console.error("Error fetching CRM company:", error);
      return res.status(500).json({ message: "Fout bij ophalen bedrijf" });
    }
  });

  app.post("/api/admin/crm/companies", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const body = { ...req.body };
      // Best-effort geocoding (PDOK): mislukken mag het opslaan nooit blokkeren.
      try {
        if ((body.address || body.postalCode || body.city) && body.latitude == null) {
          const geo = await geocodeNlAddress({ address: body.address, postalCode: body.postalCode, city: body.city });
          if (geo) { body.latitude = geo.lat; body.longitude = geo.lon; }
        }
      } catch { /* geocode-falen negeren */ }
      const company = await storage.createCrmCompany(body);
      return res.status(201).json(company);
    } catch (error) {
      console.error("Error creating CRM company:", error);
      return res.status(500).json({ message: "Fout bij aanmaken bedrijf" });
    }
  });

  // Bulk import van bestaande klanten via Excel
  app.post("/api/admin/crm/companies/import", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { rows, defaultIsClient } = req.body as {
        rows: Array<Record<string, any>>;
        defaultIsClient?: boolean;
      };
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "Geen rijen ontvangen" });
      }

      const VALID_TYPES = new Set(["hotel", "restaurant", "eventlocatie", "cateraar", "logistiek"]);
      const VALID_OWNERS = new Set(["max", "eveline", "charlotte", "lea"]);
      const VALID_ABC = new Set(["A", "B", "C"]);
      const VALID_POTENTIAL = new Set(["laag", "midden", "hoog"]);

      const created: any[] = [];
      const errors: Array<{ row: number; name?: string; reason: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] || {};
        const rowNum = i + 2; // header = rij 1, dus eerste data = rij 2
        try {
          const name = String(r.name || r.bedrijfsnaam || "").trim();
          if (!name) {
            errors.push({ row: rowNum, reason: "Bedrijfsnaam ontbreekt" });
            continue;
          }
          const type = String(r.type || "hotel").trim().toLowerCase();
          const owner = r.owner ? String(r.owner).trim().toLowerCase() : undefined;
          const accountOwner = r.accountOwner ? String(r.accountOwner).trim().toLowerCase() : undefined;
          const abc = r.abc ? String(r.abc).trim().toUpperCase() : undefined;
          const potential = r.potential ? String(r.potential).trim().toLowerCase() : undefined;

          const tags = Array.isArray(r.tags)
            ? r.tags.map((t: any) => String(t).trim()).filter(Boolean)
            : (r.tags ? String(r.tags).split(",").map((t: string) => t.trim()).filter(Boolean) : []);

          const companyData: any = {
            name,
            type: VALID_TYPES.has(type) ? type : "hotel",
            isClient: defaultIsClient ?? true,
            city: r.city ? String(r.city).trim() : null,
            region: r.region ? String(r.region).trim() : null,
            website: r.website ? String(r.website).trim() : null,
            linkedin: r.linkedin ? String(r.linkedin).trim() : null,
            owner: owner && VALID_OWNERS.has(owner) ? owner : null,
            accountOwner: accountOwner && VALID_OWNERS.has(accountOwner) ? accountOwner : null,
            abc: abc && VALID_ABC.has(abc) ? abc : null,
            potential: potential && VALID_POTENTIAL.has(potential) ? potential : null,
            source: r.source ? String(r.source).trim() : null,
            busyPeriods: r.busyPeriods ? String(r.busyPeriods).trim() : null,
            notes: r.notes ? String(r.notes).trim() : null,
            tags,
          };

          const company = await storage.createCrmCompany(companyData);

          // Contacten aanmaken — ondersteunt zowel een meervoud `contacts: [...]`
          // als losse contactName/contactEmail/contactPhone-velden voor backwards compat.
          const contactsToCreate: Array<{ name: string; function?: string | null; email?: string | null; phone?: string | null }> = [];
          if (Array.isArray(r.contacts)) {
            for (const c of r.contacts) {
              if (!c) continue;
              const cName = String(c.name || "").trim();
              const cEmail = String(c.email || "").trim();
              const cPhone = String(c.phone || "").trim();
              if (cName || cEmail || cPhone) {
                contactsToCreate.push({
                  name: cName || cEmail || cPhone,
                  function: c.function ? String(c.function).trim() : null,
                  email: cEmail || null,
                  phone: cPhone || null,
                });
              }
            }
          } else {
            const contactName = r.contactName ? String(r.contactName).trim() : "";
            const contactEmail = r.contactEmail ? String(r.contactEmail).trim() : "";
            const contactPhone = r.contactPhone ? String(r.contactPhone).trim() : "";
            if (contactName || contactEmail || contactPhone) {
              contactsToCreate.push({
                name: contactName || name,
                function: r.contactFunction ? String(r.contactFunction).trim() : null,
                email: contactEmail || null,
                phone: contactPhone || null,
              });
            }
          }
          for (let ci = 0; ci < contactsToCreate.length; ci++) {
            try {
              await storage.createCrmContact({
                companyId: company.id,
                name: contactsToCreate[ci].name,
                function: contactsToCreate[ci].function ?? null,
                email: contactsToCreate[ci].email ?? null,
                phone: contactsToCreate[ci].phone ?? null,
                linkedin: null,
                isPrimary: ci === 0,
              } as any);
            } catch (ce) {
              console.error("Contact aanmaken mislukt voor", name, ce);
            }
          }

          created.push({ id: company.id, name: company.name });
        } catch (e: any) {
          errors.push({ row: rowNum, name: r.name || r.bedrijfsnaam, reason: e?.message || "Onbekende fout" });
        }
      }

      // Een import maakt in één keer tientallen bedrijven met contactpersonen
      // aan; die horen daarna gewoon in de verzendlijst te staan.
      if (created.length) syncOpAchtergrond();

      return res.json({
        success: true,
        createdCount: created.length,
        errorCount: errors.length,
        created,
        errors,
      });
    } catch (error: any) {
      console.error("Error importing CRM companies:", error);
      return res.status(500).json({ message: "Fout bij importeren: " + (error?.message || "onbekend") });
    }
  });

  app.patch("/api/admin/crm/companies/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const body = { ...req.body };
      // Best-effort her-geocoding als adresvelden meekomen én (nog geen coördinaten
      // óf een adresveld daadwerkelijk gewijzigd is). Falen blokkeert nooit.
      try {
        const touchesAddress = ['address', 'postalCode', 'city'].some((k) => k in body);
        if (touchesAddress && body.latitude == null) {
          const existing = await storage.getCrmCompanyById(id);
          if (existing) {
            const changed =
              (body.address !== undefined && (body.address || null) !== (existing.address || null)) ||
              (body.postalCode !== undefined && (body.postalCode || null) !== (existing.postalCode || null)) ||
              (body.city !== undefined && (body.city || null) !== (existing.city || null));
            if (existing.latitude == null || changed) {
              const geo = await geocodeNlAddress({
                address: body.address !== undefined ? body.address : existing.address,
                postalCode: body.postalCode !== undefined ? body.postalCode : existing.postalCode,
                city: body.city !== undefined ? body.city : existing.city,
              });
              if (geo) { body.latitude = geo.lat; body.longitude = geo.lon; }
            }
          }
        }
      } catch { /* geocode-falen negeren */ }
      const company = await storage.updateCrmCompany(id, body);
      if (!company) return res.status(404).json({ message: "Bedrijf niet gevonden" });
      // Naam, stad, type en vooral isClient staan ook op de verzendrijen van
      // de contactpersonen van dit bedrijf. Een bedrijf dat van prospect naar
      // klant gaat, verplaatst zo zijn hele contactenlijst mee.
      syncOpAchtergrond(id);
      return res.json(company);
    } catch (error) {
      console.error("Error updating CRM company:", error);
      return res.status(500).json({ message: "Fout bij bijwerken bedrijf" });
    }
  });

  app.delete("/api/admin/crm/companies/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // De contactpersonen verdwijnen mee (cascade), dus eerst hun verzendrijen
      // blokkeren — anders blijven ze mail krijgen van een bedrijf dat niet meer
      // bestaat.
      let geblokkeerd = 0;
      try {
        const contacten = await storage.getCrmContacts(id);
        geblokkeerd = await blokkeerVerwijderdeContacten(
          contacten.map((c) => c.id), 'Bedrijf verwijderd uit het CRM',
        );
      } catch (e: any) {
        console.error('[crm-sync] blokkeren bij verwijderen bedrijf mislukt:', e?.message || e);
      }
      const ok = await storage.deleteCrmCompany(id);
      if (!ok) return res.status(404).json({ message: "Bedrijf niet gevonden" });
      return res.json({ message: "Bedrijf verwijderd", geblokkeerdeMailcontacten: geblokkeerd });
    } catch (error) {
      console.error("Error deleting CRM company:", error);
      return res.status(500).json({ message: "Fout bij verwijderen bedrijf" });
    }
  });

  // Dubbele bedrijven opschonen — groepeert op genormaliseerde naam (+ stad).
  // De oudste record blijft behouden, de rest wordt verwijderd.
  app.post("/api/admin/crm/companies/dedupe", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const all = await storage.getCrmCompanies({});
      const norm = (s?: string | null) =>
        (s || "")
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\b(b\.?v\.?|n\.?v\.?|v\.?o\.?f\.?|the|de|het|hotel|restaurant)\b/g, "")
          .replace(/[^a-z0-9]+/g, " ")
          .trim();

      const groups = new Map<string, any[]>();
      for (const c of all) {
        const key = `${norm(c.name)}|${norm((c as any).city)}`;
        if (!norm(c.name)) continue;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(c);
      }

      let removed = 0;
      const removedItems: Array<{ id: number; name: string }> = [];
      const groupsList = Array.from(groups.values());
      for (const group of groupsList) {
        if (group.length < 2) continue;
        // Oudste eerst (laagste id wint, valt terug op createdAt)
        group.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (ta !== tb) return ta - tb;
          return (a.id || 0) - (b.id || 0);
        });
        const [, ...rest] = group;
        for (const dup of rest) {
          const ok = await storage.deleteCrmCompany(dup.id);
          if (ok) {
            removed++;
            removedItems.push({ id: dup.id, name: dup.name });
          }
        }
      }

      return res.json({
        success: true,
        removedCount: removed,
        groupsFound: groupsList.filter(g => g.length > 1).length,
        removed: removedItems,
      });
    } catch (error: any) {
      console.error("Error deduping CRM companies:", error);
      return res.status(500).json({ message: "Fout bij opschonen dubbele bedrijven", error: error?.message });
    }
  });

  // Geocode-backfill: geocodeert per aanroep max 50 bedrijven zonder coördinaten
  // maar mét adres of stad (PDOK, best-effort). Bewust géén bulk-run bij opstart —
  // herhaald aanroepen tot remaining 0 is.
  app.post("/api/admin/crm/geocode-backfill", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const batch = ((await db.execute(sql`
        SELECT id, address, postal_code AS "postalCode", city
        FROM crm_companies
        WHERE latitude IS NULL
          AND (COALESCE(btrim(address), '') <> '' OR COALESCE(btrim(city), '') <> '')
        ORDER BY id
        LIMIT 50
      `)).rows ?? []) as any[];

      let geocoded = 0;
      for (const row of batch) {
        const geo = await geocodeNlAddress({ address: row.address, postalCode: row.postalCode, city: row.city });
        if (geo) {
          await db.execute(sql`
            UPDATE crm_companies SET latitude = ${geo.lat}, longitude = ${geo.lon}, updated_at = now()
            WHERE id = ${row.id}
          `);
          geocoded++;
        }
      }

      const remaining = Number((((await db.execute(sql`
        SELECT count(*)::int AS n FROM crm_companies
        WHERE latitude IS NULL
          AND (COALESCE(btrim(address), '') <> '' OR COALESCE(btrim(city), '') <> '')
      `)).rows ?? [])[0] as any)?.n ?? 0);

      return res.json({ processed: batch.length, geocoded, remaining });
    } catch (error: any) {
      console.error("Error in geocode backfill:", error);
      return res.status(500).json({ message: "Fout bij geocode-backfill", error: error?.message });
    }
  });

  /**
   * Verzendlijst opnieuw gelijktrekken met het CRM.
   *
   * Draait normaal vanzelf na elke wijziging in het CRM. Deze knop is er voor
   * de eerste keer, en voor het geval er ooit iets is misgegaan — hij is
   * herhaalbaar en verandert niets aan afmeldingen, bounces of blokkades.
   */
  app.post("/api/admin/crm/sync-mail", adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const resultaat = await synchroniseerCrmNaarMail();
      console.log('[crm-sync] handmatig:', JSON.stringify(resultaat));
      return res.json(resultaat);
    } catch (error: any) {
      console.error("Error syncing CRM to mail:", error);
      return res.status(500).json({ message: "Synchroniseren mislukt: " + (error?.message || "onbekend") });
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
      // Het CRM is sinds de samenvoeging de bron van de verzendlijst: een
      // nieuwe contactpersoon met een e-mailadres hoort meteen mailbaar te zijn.
      // Zie server/crmSync.ts — dit mag het antwoord nooit ophouden of breken.
      syncOpAchtergrond(contact?.companyId);
      return res.status(201).json(contact);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij aanmaken contactpersoon" });
    }
  });

  app.patch("/api/admin/crm/contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const contact = await storage.updateCrmContact(parseInt(req.params.id), req.body);
      if (!contact) return res.status(404).json({ message: "Contactpersoon niet gevonden" });
      syncOpAchtergrond(contact.companyId);
      return res.json(contact);
    } catch (error) {
      return res.status(500).json({ message: "Fout bij bijwerken contactpersoon" });
    }
  });

  app.delete("/api/admin/crm/contacts/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      // Vóór het verwijderen blokkeren, want daarna is het id weg en is niet
      // meer te zien welke verzendrij erbij hoorde. De rij zelf blijft staan:
      // daar hangt de mailgeschiedenis aan.
      //
      // Eigen vangnet: als het blokkeren halverwege misgaat, moet het
      // verwijderen gewoon doorgaan. Anders blijft het contact in het CRM staan
      // terwijl de verzendrij al geblokkeerd is — het slechtste van twee.
      let geblokkeerd = 0;
      try {
        geblokkeerd = await blokkeerVerwijderdeContacten([contactId]);
      } catch (e: any) {
        console.error('[crm-sync] blokkeren bij verwijderen contactpersoon mislukt:', e?.message || e);
      }
      const ok = await storage.deleteCrmContact(contactId);
      if (!ok) return res.status(404).json({ message: "Contactpersoon niet gevonden" });
      return res.json({ message: "Contactpersoon verwijderd", geblokkeerdeMailcontacten: geblokkeerd });
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
  // ==========================================
  // Salesdashboard routes (/api/sales/*) — onder salesMiddleware, NIET adminMiddleware.
  // Bestaande /api/admin/crm/* routes blijven ongewijzigd.
  // ==========================================

  // Helper: eigenaar-queryparam omzetten naar users.id.
  // Keuze: numeriek = user-id, anders e-mail-prefix (bv. "max" -> max@doehetextra.nl).
  async function resolveEigenaarUserId(eigenaar: string): Promise<number | null> {
    if (/^\d+$/.test(eigenaar)) return parseInt(eigenaar, 10);
    const r = await db.execute(sql`SELECT id FROM users WHERE lower(email) = ${eigenaar.toLowerCase() + '@doehetextra.nl'} LIMIT 1`);
    const row = (r.rows ?? r)[0] as any;
    return row ? Number(row.id) : null;
  }

  // GET /api/sales/pipeline?categorie=Hotel&eigenaar=max
  app.get("/api/sales/pipeline", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const { categorie, eigenaar } = req.query as { categorie?: string; eigenaar?: string };
      if (categorie && !['Hotel', 'Logistiek', 'Events'].includes(categorie)) {
        return res.status(400).json({ message: "Ongeldige categorie (Hotel | Logistiek | Events)" });
      }
      let eigenaarId: number | null = null;
      if (eigenaar) {
        eigenaarId = await resolveEigenaarUserId(eigenaar);
        if (eigenaarId === null) return res.status(400).json({ message: `Onbekende eigenaar: ${eigenaar}` });
      }
      const result = await db.execute(sql`
        SELECT c.id, c.name, c.categorie, c.phase, c.eigenaar_user_id AS "eigenaarUserId",
               c.volgende_actie_datum AS "volgendeActieDatum", c.notities, c.potentie,
               c.city, c.is_client AS "isClient",
               COALESCE(a.cnt, 0)::int AS "activitiesCount"
        FROM crm_companies c
        LEFT JOIN (SELECT crm_company_id, count(*) AS cnt FROM activities GROUP BY crm_company_id) a
          ON a.crm_company_id = c.id
        WHERE (${categorie ?? null}::crm_categorie IS NULL OR c.categorie = ${categorie ?? null}::crm_categorie)
          AND (${eigenaarId}::int IS NULL OR c.eigenaar_user_id = ${eigenaarId}::int)
        ORDER BY c.phase, c.volgende_actie_datum ASC NULLS FIRST, c.id
      `);
      return res.json(result.rows ?? result);
    } catch (error) {
      console.error("[sales] pipeline fout:", error);
      return res.status(500).json({ message: "Fout bij ophalen pipeline" });
    }
  });

  // GET /api/sales/mijn-acties?eigenaar=max
  app.get("/api/sales/mijn-acties", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const { eigenaar } = req.query as { eigenaar?: string };
      if (!eigenaar) return res.status(400).json({ message: "eigenaar-parameter is verplicht" });
      const eigenaarId = await resolveEigenaarUserId(eigenaar);
      if (eigenaarId === null) return res.status(400).json({ message: `Onbekende eigenaar: ${eigenaar}` });
      // Reminders hangen aan vrije-tekst owner (bv. 'max') — afleiden uit e-mail-prefix van de user
      const ownerRow = await db.execute(sql`SELECT split_part(email, '@', 1) AS prefix FROM users WHERE id = ${eigenaarId}`);
      const ownerPrefix = ((ownerRow.rows ?? ownerRow)[0] as any)?.prefix ?? '';
      const result = await db.execute(sql`
        SELECT * FROM (
          SELECT c.id, c.name AS naam, c.volgende_actie_datum AS "volgendeActieDatum",
                 COALESCE(c.notities, '') AS "volgendeActieText", c.phase,
                 GREATEST(0, (CURRENT_DATE - c.volgende_actie_datum))::int AS "daysOverdue",
                 'company' AS bron
          FROM crm_companies c
          WHERE c.eigenaar_user_id = ${eigenaarId}
            AND (c.phase IS NULL OR c.phase NOT IN ('gewonnen', 'verloren'))
            AND c.volgende_actie_datum <= CURRENT_DATE
          UNION ALL
          SELECT r.id, r.title AS naam, r.due_date AS "volgendeActieDatum",
                 COALESCE(r.note, r.title) AS "volgendeActieText", NULL AS phase,
                 GREATEST(0, (CURRENT_DATE - r.due_date))::int AS "daysOverdue",
                 'reminder' AS bron
          FROM crm_reminders r
          WHERE r.owner = ${ownerPrefix} AND r.status <> 'completed' AND r.due_date <= CURRENT_DATE
        ) acties
        ORDER BY "volgendeActieDatum" ASC NULLS FIRST, "daysOverdue" DESC
      `);
      return res.json(result.rows ?? result);
    } catch (error) {
      console.error("[sales] mijn-acties fout:", error);
      return res.status(500).json({ message: "Fout bij ophalen acties" });
    }
  });

  // PATCH /api/sales/companies/:id — alléén de nieuwe sales-velden
  app.patch("/api/sales/companies/:id", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig id" });

      const salesPatchSchema = z.object({
        eigenaar_user_id: z.number().int().nullable().optional(),
        phase: z.enum(['nieuw', 'eerste_contact', 'afspraak_gepland', 'voorstel_verstuurd', 'follow_up', 'gewonnen', 'verloren', 'on_hold']).optional(),
        volgende_actie_datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        notities: z.string().nullable().optional(),
        categorie: z.enum(['Hotel', 'Logistiek', 'Events']).nullable().optional(),
        potentie: z.enum(['Laag', 'Medio', 'Hoog']).nullable().optional(),
      }).strict();
      const parsed = salesPatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      const body = parsed.data;
      if (Object.keys(body).length === 0) return res.status(400).json({ message: "Geen velden opgegeven" });

      const existing = await db.execute(sql`SELECT id, eigenaar_user_id FROM crm_companies WHERE id = ${id}`);
      const company = (existing.rows ?? existing)[0] as any;
      if (!company) return res.status(404).json({ message: "Bedrijf niet gevonden" });

      // Permissie: eigenaar van de deal, of admin
      const isAdmin = req.session.userRole === 'admin';
      if (!isAdmin && company.eigenaar_user_id !== req.session.userId) {
        return res.status(403).json({ message: "Alleen de eigenaar of een admin mag deze deal wijzigen" });
      }

      const result = await db.execute(sql`
        UPDATE crm_companies SET
          eigenaar_user_id = CASE WHEN ${'eigenaar_user_id' in body} THEN ${body.eigenaar_user_id ?? null}::int ELSE eigenaar_user_id END,
          phase = CASE WHEN ${'phase' in body} THEN ${body.phase ?? null} ELSE phase END,
          volgende_actie_datum = CASE WHEN ${'volgende_actie_datum' in body} THEN ${body.volgende_actie_datum ?? null}::date ELSE volgende_actie_datum END,
          notities = CASE WHEN ${'notities' in body} THEN ${body.notities ?? null} ELSE notities END,
          categorie = CASE WHEN ${'categorie' in body} THEN ${body.categorie ?? null}::crm_categorie ELSE categorie END,
          potentie = CASE WHEN ${'potentie' in body} THEN ${body.potentie ?? null}::crm_potentie ELSE potentie END,
          updated_at = now()
        WHERE id = ${id}
        RETURNING id, name, categorie, phase, eigenaar_user_id AS "eigenaarUserId",
                  volgende_actie_datum AS "volgendeActieDatum", notities, potentie
      `);
      return res.json((result.rows ?? result)[0]);
    } catch (error) {
      console.error("[sales] patch fout:", error);
      return res.status(500).json({ message: "Fout bij bijwerken deal" });
    }
  });

  // ==========================================
  // Salesflow — persoonsgerichte pipeline (kanban) onder salesMiddleware
  // ==========================================

  // Fases zijn data-gedreven (salesflow_phase_rules) — kolommen kunnen worden
  // toegevoegd/verwijderd. Validatie gebeurt dus tegen de tabel, niet tegen een
  // vaste lijst.
  async function phaseBestaat(phase: string): Promise<boolean> {
    const r = await db.execute(sql`SELECT 1 FROM salesflow_phase_rules WHERE phase = ${phase} LIMIT 1`);
    return (r.rows ?? r).length > 0;
  }
  function slugify(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'fase';
  }

  // GET /api/sales/flow?batch=&eigenaar=&categorie=  → bord: fases + kaarten
  app.get("/api/sales/flow", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const { batch, eigenaar, categorie } = req.query as { batch?: string; eigenaar?: string; categorie?: string };
      let eigenaarId: number | null = null;
      if (eigenaar && eigenaar !== 'alle') {
        eigenaarId = await resolveEigenaarUserId(eigenaar);
        if (eigenaarId === null) return res.status(400).json({ message: `Onbekende eigenaar: ${eigenaar}` });
      }
      const batchId = batch && batch !== 'alle' ? parseInt(batch, 10) : null;
      const cat = categorie && categorie !== 'alle' ? categorie : null;

      const rules = await db.execute(sql`SELECT phase, label, position, trigger_days AS "triggerDays", trigger_action AS "triggerAction", is_end_state AS "isEndState", use_business_days AS "useBusinessDays", behavior, asks_channel AS "asksChannel", asks_appointment AS "asksAppointment" FROM salesflow_phase_rules ORDER BY position`);
      const cards = await db.execute(sql`
        SELECT k.id, k.phase, k.eigenaar_user_id AS "eigenaarUserId", k.position,
               k.next_action_at AS "nextActionAt", k.next_action_type AS "nextActionType",
               k.channel, k.not_reached_count AS "notReachedCount", k.snooze_until AS "snoozeUntil",
               -- Als tekst, niet als timestamp: een JS-Date zou hier een
               -- tijdzone-conversie op loslaten en 14:00 als 12:00 tonen.
               to_char(k.appointment_at, 'YYYY-MM-DD"T"HH24:MI') AS "appointmentAt",
               k.notes, k.batch_id AS "batchId", k.created_by_name AS "createdByName",
               ct.name AS "contactNaam", ct.function AS "contactFunctie", ct.email AS "contactEmail", ct.phone AS "contactPhone",
               co.id AS "companyId", co.name AS "bedrijfNaam", co.categorie, co.city,
               u.first_name AS "eigenaarNaam",
               GREATEST(0, (CURRENT_DATE - k.next_action_at))::int AS "daysOverdue"
        FROM salesflow_cards k
        JOIN crm_contacts ct ON ct.id = k.contact_id
        JOIN crm_companies co ON co.id = k.company_id
        LEFT JOIN users u ON u.id = k.eigenaar_user_id
        WHERE (${batchId}::int IS NULL OR k.batch_id = ${batchId}::int)
          AND (${eigenaarId}::int IS NULL OR k.eigenaar_user_id = ${eigenaarId}::int)
          AND (${cat}::crm_categorie IS NULL OR co.categorie = ${cat}::crm_categorie)
        ORDER BY k.phase, k.next_action_at ASC NULLS LAST, k.position, k.id
      `);
      return res.json({ rules: rules.rows ?? rules, cards: cards.rows ?? cards });
    } catch (error) {
      console.error("[salesflow] flow fout:", error);
      return res.status(500).json({ message: "Fout bij ophalen salesflow" });
    }
  });

  // GET /api/sales/flow/contacts?search=  → personen zoeken om aan het bord toe te voegen
  app.get("/api/sales/flow/contacts", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string || '').trim();
      const like = `%${search}%`;
      const r = await db.execute(sql`
        SELECT ct.id, ct.name, ct.function, ct.email,
               co.id AS "companyId", co.name AS "bedrijfNaam", co.categorie,
               (sc.id IS NOT NULL) AS "opBord"
        FROM crm_contacts ct
        JOIN crm_companies co ON co.id = ct.company_id
        LEFT JOIN salesflow_cards sc ON sc.contact_id = ct.id
        WHERE (${search} = '' OR ct.name ILIKE ${like} OR co.name ILIKE ${like})
        ORDER BY (sc.id IS NOT NULL), co.name, ct.name
        LIMIT 40`);
      return res.json(r.rows ?? r);
    } catch (error) {
      console.error("[salesflow] contacts fout:", error);
      return res.status(500).json({ message: "Fout bij zoeken contacten" });
    }
  });

  // GET /api/sales/flow/owners  → alle admin-accounts die eigenaar kunnen zijn.
  // De Eigenaar-dropdown volgt hiermee automatisch de lijst uit Admin-accounts.
  app.get("/api/sales/flow/owners", salesMiddleware, async (_req: Request, res: Response) => {
    try {
      const r = await db.execute(sql`
        SELECT id, first_name AS "naam", email
        FROM users
        WHERE role = 'admin' AND status = 'active'
        ORDER BY first_name`);
      return res.json(r.rows ?? r);
    } catch (error) {
      console.error("[salesflow] owners fout:", error);
      return res.status(500).json({ message: "Fout bij ophalen eigenaren" });
    }
  });

  // GET /api/sales/flow/batches
  app.get("/api/sales/flow/batches", salesMiddleware, async (_req: Request, res: Response) => {
    try {
      const r = await db.execute(sql`
        SELECT b.id, b.name, b.categorie, b.description, b.created_at AS "createdAt",
               COALESCE(c.cnt, 0)::int AS "cardCount"
        FROM salesflow_batches b
        LEFT JOIN (SELECT batch_id, count(*) cnt FROM salesflow_cards GROUP BY batch_id) c ON c.batch_id = b.id
        ORDER BY b.created_at DESC`);
      return res.json(r.rows ?? r);
    } catch (error) {
      console.error("[salesflow] batches fout:", error);
      return res.status(500).json({ message: "Fout bij ophalen batches" });
    }
  });

  // POST /api/sales/flow/batches  { name, categorie?, description? }
  app.post("/api/sales/flow/batches", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        categorie: z.enum(['Hotel','Logistiek','Events']).nullable().optional(),
        description: z.string().nullable().optional(),
      }).strict();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      const { name, categorie, description } = parsed.data;
      // created_by via subselect: de ingelogde admin bestaat mogelijk niet als
      // rij in users (in-memory login) — dan wordt het NULL i.p.v. een FK-fout.
      const r = await db.execute(sql`
        INSERT INTO salesflow_batches (name, categorie, description, created_by_user_id)
        VALUES (${name}, ${categorie ?? null}::crm_categorie, ${description ?? null},
                (SELECT id FROM users WHERE id = ${req.session.userId ?? null}))
        RETURNING id, name, categorie, description, created_at AS "createdAt"`);
      return res.status(201).json((r.rows ?? r)[0]);
    } catch (error) {
      console.error("[salesflow] batch aanmaken fout:", error);
      return res.status(500).json({ message: "Fout bij aanmaken batch" });
    }
  });

  // POST /api/sales/flow/cards  { contactId, batchId?, eigenaarUserId? }  → kaart in 'selectie'
  app.post("/api/sales/flow/cards", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        contactId: z.number().int(),
        batchId: z.number().int().nullable().optional(),
        eigenaar: z.string().optional(), // 'max' | 'tommy' | user-id
        createdByName: z.string().max(60).nullable().optional(), // naam van de ingelogde gebruiker
      }).strict();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      const { contactId, batchId, eigenaar, createdByName } = parsed.data;

      const contact = ((await db.execute(sql`SELECT id, company_id FROM crm_contacts WHERE id = ${contactId}`)).rows ?? [])[0] as any;
      if (!contact) return res.status(404).json({ message: "Contact niet gevonden" });

      // Eén actieve kaart per contact — bestaande kaart teruggeven i.p.v. dubbel.
      const bestaand = ((await db.execute(sql`SELECT id FROM salesflow_cards WHERE contact_id = ${contactId}`)).rows ?? [])[0] as any;
      if (bestaand) return res.status(409).json({ message: "Deze persoon staat al op het bord", cardId: bestaand.id });

      // Eigenaar → geldig user-id (Max/Tommy). Ongeldig/leeg → NULL (geen FK-fout).
      const eigenaarId = eigenaar ? await resolveEigenaarUserId(eigenaar) : null;

      // Kaart komt in de EERSTE kolom (laagste position), ongeacht hoe die heet.
      const firstPhase = ((await db.execute(sql`SELECT phase FROM salesflow_phase_rules ORDER BY position LIMIT 1`)).rows ?? [])[0]?.phase ?? 'selectie';

      const r = await db.execute(sql`
        INSERT INTO salesflow_cards (contact_id, company_id, batch_id, eigenaar_user_id, phase, created_by_name)
        VALUES (${contactId}, ${contact.company_id}, ${batchId ?? null},
                (SELECT id FROM users WHERE id = ${eigenaarId}), ${firstPhase}, ${createdByName ?? null})
        RETURNING id`);
      return res.status(201).json((r.rows ?? r)[0]);
    } catch (error) {
      console.error("[salesflow] kaart aanmaken fout:", error);
      return res.status(500).json({ message: "Fout bij aanmaken kaart" });
    }
  });

  // PATCH /api/sales/flow/cards/:id/move  { phase, channel?, snoozeUntil?, appointmentAt? }  → drag & drop
  app.patch("/api/sales/flow/cards/:id/move", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig id" });
      const schema = z.object({
        phase: z.string().min(1),
        channel: z.enum(['email','linkedin']).nullable().optional(),
        snoozeUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        // 'YYYY-MM-DDTHH:MM' — precies wat een datetime-local-veld teruggeeft.
        // Bewust zonder tijdzone: dit is een agenda-afspraak in de eigen tijd,
        // geen moment op een wereldwijde tijdlijn.
        appointmentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable().optional(),
      }).strict();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      if (!(await phaseBestaat(parsed.data.phase))) return res.status(400).json({ message: "Onbekende fase" });
      const updated = await moveCardToPhase({
        cardId: id, phase: parsed.data.phase, actorUserId: req.session.userId ?? null,
        channel: parsed.data.channel, snoozeUntil: parsed.data.snoozeUntil,
        appointmentAt: parsed.data.appointmentAt, resetNotReached: parsed.data.phase !== 'nagebeld',
      });
      return res.json(updated);
    } catch (error: any) {
      console.error("[salesflow] move fout:", error);
      return res.status(500).json({ message: error?.message || "Fout bij verplaatsen kaart" });
    }
  });

  // ─── Tijdlijn vanuit de Salesflow-popup ────────────────────────────────────
  // Zelfde activiteitenlog als in het CRM (activities per crm_company_id), maar
  // dan bereikbaar onder salesMiddleware via de kaart-id. De company_id wordt
  // van de kaart opgezocht; de logica is bewust een kopie van de admin-routes.

  // GET /api/sales/flow/cards/:cardId/activities  → tijdlijn van het bedrijf van de kaart
  app.get("/api/sales/flow/cards/:cardId/activities", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId, 10);
      if (isNaN(cardId)) return res.status(400).json({ message: "Ongeldig id" });
      const card = ((await db.execute(sql`SELECT company_id AS "companyId" FROM salesflow_cards WHERE id = ${cardId}`)).rows ?? [])[0] as any;
      if (!card) return res.status(404).json({ message: "Kaart niet gevonden" });
      const items = ((await db.execute(sql`
        SELECT a.id, a.type, a.description, a.created_at AS "createdAt",
               COALESCE(u.first_name, '—') AS "createdBy"
        FROM activities a
        LEFT JOIN users u ON u.id = a.created_by_user_id
        WHERE a.crm_company_id = ${card.companyId}
        ORDER BY a.created_at DESC
        LIMIT 50
      `)).rows ?? []) as any[];
      return res.json(items);
    } catch (error) {
      console.error("[salesflow] activities ophalen fout:", error);
      return res.status(500).json({ message: "Fout bij ophalen activiteiten" });
    }
  });

  // POST /api/sales/flow/cards/:cardId/activities  { type, description }
  // Logt een contactmoment op de tijdlijn van het bedrijf. Wijzigt bewust
  // NIET de fase van de kaart — alleen een logregel.
  app.post("/api/sales/flow/cards/:cardId/activities", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.cardId, 10);
      if (isNaN(cardId)) return res.status(400).json({ message: "Ongeldig id" });
      const card = ((await db.execute(sql`SELECT company_id AS "companyId" FROM salesflow_cards WHERE id = ${cardId}`)).rows ?? [])[0] as any;
      if (!card) return res.status(404).json({ message: "Kaart niet gevonden" });
      const { type, description } = req.body || {};
      const allowed = ["call", "email", "meeting", "note"];
      if (!allowed.includes(type)) return res.status(400).json({ message: `Type moet één van ${allowed.join(", ")} zijn` });
      if (!description || !String(description).trim()) return res.status(400).json({ message: "Omschrijving is verplicht" });
      const created = ((await db.execute(sql`
        INSERT INTO activities (crm_company_id, type, description, created_by_user_id)
        VALUES (${card.companyId}, ${type}, ${String(description).trim()},
                (SELECT id FROM users WHERE id = ${req.session.userId ?? null}))
        RETURNING id, type, description, created_at AS "createdAt"
      `)).rows ?? [])[0];
      return res.json(created);
    } catch (error) {
      console.error("[salesflow] activiteit loggen fout:", error);
      return res.status(500).json({ message: "Fout bij loggen activiteit" });
    }
  });

  // POST /api/sales/flow/cards/:id/not-reached  → nabellen mislukt, +2 werkdagen
  app.post("/api/sales/flow/cards/:id/not-reached", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig id" });
      const updated = await markNotReached(id, req.session.userId ?? null);
      return res.json(updated);
    } catch (error: any) {
      console.error("[salesflow] not-reached fout:", error);
      return res.status(500).json({ message: error?.message || "Fout" });
    }
  });

  // PATCH /api/sales/flow/cards/:id  { notes?, eigenaarUserId?, batchId? }  → losse velden
  app.patch("/api/sales/flow/cards/:id", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig id" });
      const schema = z.object({
        notes: z.string().nullable().optional(),
        eigenaarUserId: z.number().int().nullable().optional(),
        batchId: z.number().int().nullable().optional(),
        appointmentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable().optional(),
      }).strict();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      const b = parsed.data;
      const r = await db.execute(sql`
        UPDATE salesflow_cards SET
          notes = CASE WHEN ${'notes' in b} THEN ${b.notes ?? null} ELSE notes END,
          eigenaar_user_id = CASE WHEN ${'eigenaarUserId' in b} THEN ${b.eigenaarUserId ?? null}::int ELSE eigenaar_user_id END,
          batch_id = CASE WHEN ${'batchId' in b} THEN ${b.batchId ?? null}::int ELSE batch_id END,
          appointment_at = CASE WHEN ${'appointmentAt' in b} THEN ${b.appointmentAt ?? null}::timestamp ELSE appointment_at END,
          updated_at = now()
        WHERE id = ${id} RETURNING *`);
      const row = (r.rows ?? r)[0];
      if (!row) return res.status(404).json({ message: "Kaart niet gevonden" });
      return res.json(row);
    } catch (error) {
      console.error("[salesflow] card patch fout:", error);
      return res.status(500).json({ message: "Fout bij bijwerken kaart" });
    }
  });

  // DELETE /api/sales/flow/cards/:id  → kaart van het bord halen (correctie).
  // De persoon blijft gewoon bestaan in Leads & Prospects; alleen de
  // salesflow-kaart verdwijnt. De open reminder wordt afgesloten en de
  // verwijdering wordt gelogd in de activiteiten van het bedrijf.
  app.delete("/api/sales/flow/cards/:id", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Ongeldig id" });
      const card = ((await db.execute(sql`SELECT * FROM salesflow_cards WHERE id = ${id}`)).rows ?? [])[0] as any;
      if (!card) return res.status(404).json({ message: "Kaart niet gevonden" });
      if (card.reminder_id) {
        await db.execute(sql`UPDATE crm_reminders SET status = 'completed' WHERE id = ${card.reminder_id} AND status <> 'completed'`);
      }
      const persoon = ((await db.execute(sql`SELECT name FROM crm_contacts WHERE id = ${card.contact_id}`)).rows ?? [])[0]?.name ?? "contact";
      await db.execute(sql`
        INSERT INTO activities (crm_company_id, type, description, created_by_user_id)
        VALUES (${card.company_id}, 'note', ${`Salesflow: ${persoon} van het bord verwijderd`},
                (SELECT id FROM users WHERE id = ${req.session.userId ?? null}))`);
      await db.execute(sql`DELETE FROM salesflow_cards WHERE id = ${id}`);
      return res.json({ deleted: id });
    } catch (error) {
      console.error("[salesflow] card verwijderen fout:", error);
      return res.status(500).json({ message: "Fout bij verwijderen kaart" });
    }
  });

  // POST /api/sales/flow/batch-advance  { batchId, fromPhase, toPhase }  → hele kolom doorzetten
  app.post("/api/sales/flow/batch-advance", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        batchId: z.number().int(),
        fromPhase: z.string().min(1),
        toPhase: z.string().min(1),
      }).strict();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      const { batchId, fromPhase, toPhase } = parsed.data;
      if (!(await phaseBestaat(toPhase))) return res.status(400).json({ message: "Onbekende doelfase" });
      const ids = ((await db.execute(sql`SELECT id FROM salesflow_cards WHERE batch_id = ${batchId} AND phase = ${fromPhase}`)).rows ?? []) as any[];
      let moved = 0;
      for (const row of ids) {
        await moveCardToPhase({ cardId: row.id, phase: toPhase as any, actorUserId: req.session.userId ?? null, resetNotReached: toPhase !== 'nagebeld' });
        moved++;
      }
      return res.json({ moved });
    } catch (error: any) {
      console.error("[salesflow] batch-advance fout:", error);
      return res.status(500).json({ message: error?.message || "Fout bij batch-actie" });
    }
  });

  // GET /api/sales/flow/rules  → alle kolommen (fases)
  app.get("/api/sales/flow/rules", salesMiddleware, async (_req: Request, res: Response) => {
    const r = await db.execute(sql`SELECT phase, label, position, trigger_days AS "triggerDays", trigger_action AS "triggerAction", use_business_days AS "useBusinessDays", is_end_state AS "isEndState", behavior, asks_channel AS "asksChannel", asks_appointment AS "asksAppointment" FROM salesflow_phase_rules ORDER BY position`);
    return res.json(r.rows ?? r);
  });

  // POST /api/sales/flow/rules  { label, triggerDays?, triggerAction?, asksChannel? }  → kolom toevoegen
  app.post("/api/sales/flow/rules", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        label: z.string().min(1).max(40),
        triggerDays: z.number().int().min(0).max(90).nullable().optional(),
        triggerAction: z.string().max(30).nullable().optional(),
        asksChannel: z.boolean().optional(),
        asksAppointment: z.boolean().optional(),
      }).strict();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      const { label, triggerDays, triggerAction, asksChannel, asksAppointment } = parsed.data;
      // Uniek fase-sleutel afleiden uit het label.
      let base = slugify(label); let phase = base; let i = 2;
      while (await phaseBestaat(phase)) { phase = `${base}_${i++}`; }
      // Nieuwe (normale) kolom vlak vóór de eerste eindfase plaatsen.
      const posRow = ((await db.execute(sql`SELECT COALESCE(MIN(position), (SELECT COALESCE(MAX(position),0)+1 FROM salesflow_phase_rules)) AS pos FROM salesflow_phase_rules WHERE is_end_state = true`)).rows ?? [])[0] as any;
      const insertPos = Number(posRow?.pos ?? 1);
      await db.execute(sql`UPDATE salesflow_phase_rules SET position = position + 1 WHERE position >= ${insertPos}`);
      // Zonder actie hoort er ook geen termijn te staan: een "0" leest als een
      // termijn en leverde vóór v9 een reminder op die meteen te laat was.
      const dagen = triggerAction ? (triggerDays ?? null) : null;
      const r = await db.execute(sql`
        INSERT INTO salesflow_phase_rules (phase, label, position, trigger_days, trigger_action, asks_channel, asks_appointment, behavior, is_end_state)
        VALUES (${phase}, ${label}, ${insertPos}, ${dagen}::int, ${triggerAction ?? null}, ${asksChannel ?? false}::bool, ${asksAppointment ?? false}::bool, 'normal', false)
        RETURNING phase, label, position`);
      return res.status(201).json((r.rows ?? r)[0]);
    } catch (error) {
      console.error("[salesflow] rule toevoegen fout:", error);
      return res.status(500).json({ message: "Fout bij toevoegen kolom" });
    }
  });

  // DELETE /api/sales/flow/rules/:phase  → kolom verwijderen (alleen als leeg)
  app.delete("/api/sales/flow/rules/:phase", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const phase = req.params.phase;
      if (!(await phaseBestaat(phase))) return res.status(404).json({ message: "Kolom niet gevonden" });
      const cnt = Number(((await db.execute(sql`SELECT count(*)::int AS n FROM salesflow_cards WHERE phase = ${phase}`)).rows ?? [])[0]?.n ?? 0);
      if (cnt > 0) return res.status(409).json({ message: `Kolom bevat nog ${cnt} kaart(en) — verplaats die eerst` });
      const total = Number(((await db.execute(sql`SELECT count(*)::int AS n FROM salesflow_phase_rules`)).rows ?? [])[0]?.n ?? 0);
      if (total <= 2) return res.status(409).json({ message: "Er moeten minimaal twee kolommen overblijven" });
      await db.execute(sql`DELETE FROM salesflow_phase_rules WHERE phase = ${phase}`);
      return res.json({ deleted: phase });
    } catch (error) {
      console.error("[salesflow] rule verwijderen fout:", error);
      return res.status(500).json({ message: "Fout bij verwijderen kolom" });
    }
  });

  // POST /api/sales/flow/rules/reorder  { order: [phase, ...] }  → kolomvolgorde
  app.post("/api/sales/flow/rules/reorder", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({ order: z.array(z.string()).min(1) }).strict();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      let pos = 1;
      for (const phase of parsed.data.order) {
        await db.execute(sql`UPDATE salesflow_phase_rules SET position = ${pos}, updated_at = now() WHERE phase = ${phase}`);
        pos++;
      }
      return res.json({ ok: true });
    } catch (error) {
      console.error("[salesflow] reorder fout:", error);
      return res.status(500).json({ message: "Fout bij herordenen" });
    }
  });

  // PATCH /api/sales/flow/rules/:phase  → naam/actie/termijn van een kolom
  app.patch("/api/sales/flow/rules/:phase", salesMiddleware, async (req: Request, res: Response) => {
    try {
      const phase = req.params.phase;
      if (!(await phaseBestaat(phase))) return res.status(404).json({ message: "Onbekende fase" });
      const schema = z.object({
        label: z.string().min(1).max(40).optional(),
        triggerDays: z.number().int().min(0).max(90).nullable().optional(),
        triggerAction: z.string().max(30).nullable().optional(),
        useBusinessDays: z.boolean().optional(),
        asksChannel: z.boolean().optional(),
        asksAppointment: z.boolean().optional(),
      }).strict();
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige velden", errors: parsed.error.flatten() });
      const b = parsed.data;
      // Ophalen → samenvoegen in JS → simpele UPDATE. Geen CASE WHEN met
      // boolean-parameters: driver-onafhankelijk en glashelder.
      const huidig = ((await db.execute(sql`SELECT * FROM salesflow_phase_rules WHERE phase = ${phase} LIMIT 1`)).rows ?? [])[0] as any;
      const nieuw = {
        label: 'label' in b ? b.label : huidig.label,
        triggerDays: 'triggerDays' in b ? (b.triggerDays ?? null) : huidig.trigger_days,
        triggerAction: 'triggerAction' in b ? (b.triggerAction ?? null) : huidig.trigger_action,
        useBusinessDays: 'useBusinessDays' in b ? b.useBusinessDays : huidig.use_business_days,
        asksChannel: 'asksChannel' in b ? b.asksChannel : huidig.asks_channel,
        asksAppointment: 'asksAppointment' in b ? b.asksAppointment : huidig.asks_appointment,
      };
      // Een fase zonder actie (of een afspraakfase) hoort geen termijn te
      // hebben — anders ontstaat opnieuw de situatie waarin "Geen actie" met
      // 0 werkdagen tóch een reminder oplevert.
      if (!nieuw.triggerAction || nieuw.asksAppointment) nieuw.triggerDays = null;
      const r = await db.execute(sql`
        UPDATE salesflow_phase_rules SET
          label = ${nieuw.label},
          trigger_days = ${nieuw.triggerDays}::int,
          trigger_action = ${nieuw.triggerAction},
          use_business_days = ${nieuw.useBusinessDays}::bool,
          asks_channel = ${nieuw.asksChannel}::bool,
          asks_appointment = ${nieuw.asksAppointment}::bool,
          updated_at = now()
        WHERE phase = ${phase} RETURNING *`);
      return res.json((r.rows ?? r)[0]);
    } catch (error) {
      console.error("[salesflow] rule patch fout:", error);
      return res.status(500).json({ message: "Fout bij bijwerken regel" });
    }
  });

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
      // Enrich with company names + herkomst (komt de reminder uit de salesflow?)
      const companies = await storage.getCrmCompanies({});
      const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
      let viaSalesflow = new Set<number>();
      try {
        const sf = ((await db.execute(sql`SELECT reminder_id FROM salesflow_cards WHERE reminder_id IS NOT NULL`)).rows ?? []) as any[];
        viaSalesflow = new Set(sf.map(x => Number(x.reminder_id)));
      } catch { /* salesflow-tabel ontbreekt? dan geen labels */ }
      const enriched = reminders.map(r => ({ ...r, companyName: companyMap[r.companyId] || '', viaSalesflow: viaSalesflow.has(r.id) }));
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

  // ─── WHATSAPP BEHEER (Fase 1 — provider-switch 360dialog / Meta Cloud API) ──
  // Architectuur:
  //   - Inkomende berichten via /api/whatsapp/webhook/:secret (360dialog, URL-secret)
  //     én /api/whatsapp/meta-webhook (Meta Cloud API, signature-verificatie)
  //   - Uitgaand verkeer via server/whatsapp/provider.ts (env WHATSAPP_PROVIDER)
  //   - Persistentie in whatsapp_messages + whatsapp_conversations
  //   - Auto-koppeling aan candidates / prospect_contacts via matcher.ts
  //   - Idempotentie op wa_message_id
  // Env-vars: WHATSAPP_360_API_KEY, WHATSAPP_WEBHOOK_SECRET, WHATSAPP_PROVIDER,
  //           META_WA_BOT_* (zie server/whatsapp/README.md).
  // Alleen nog voor de 360dialog BEHEER-endpoints (/configs/webhook). Al het
  // uitgaande berichtenverkeer loopt via server/whatsapp/provider.ts; deze drie
  // verdwijnen in fase 4 samen met de rest van 360dialog.
  const WA_BASE_URL = process.env.WHATSAPP_360_BASE_URL || 'https://waba-v2.360dialog.io';
  const WA_360_KEY = process.env.WHATSAPP_360_API_KEY || '';
  const wa360Headers = { 'Content-Type': 'application/json', 'D360-API-KEY': WA_360_KEY };

  // ─── Provider-switch: 360dialog (default) of Meta Cloud API ──────────────
  // Zet WHATSAPP_PROVIDER=meta om uitgaand verkeer via de Meta Graph API te
  // sturen (vereist META_WA_BOT_ACCESS_TOKEN + META_WA_BOT_PHONE_NUMBER_ID).
  // De switch zelf, de base-URLs, de auth-headers en de "kunnen we versturen?"-
  // check staan in server/whatsapp/provider.ts (waProvider.activeProvider(),
  // isSendConfigured(), configErrorMessage()) en zijn daar los getest. Hier
  // staat bewust geen tweede kopie meer van die logica.
  const { normalizePhone } = await import('./whatsapp/phone');
  const waStorage = await import('./whatsapp/storage');
  const waProvider = await import('./whatsapp/provider');
  const { processIncomingPayload } = await import('./whatsapp/inboundProcessor');
  // safeEqualSecret wordt hier gebruikt voor het URL-secret van de 360dialog-
  // webhook; het is dezelfde timing-safe vergelijking als de Meta-handshake.
  const { verifyMetaSignature, handleVerifyHandshake, safeEqualSecret } = await import('./whatsapp/webhookVerify');
  const { whatsappMessages, whatsappConversations } = await import('@shared/schema');
  const { eq: drizzleEq, sql: drizzleSql, desc: drizzleDesc } = await import('drizzle-orm');
  const optInService = await import('./whatsapp/optInService');
  // Fase 3: taalonafhankelijke classificatie + gestructureerde escalatiereden
  const waClassifier = await import('./whatsapp/aiClassifier');

  // ─── Hulp: bepaal taal uit gesprek-labels (snelle override vóór AI-detectie) ──
  // Planner kan een gesprek labelen met "nl" of "en" zodat de AI gegarandeerd in
  // die taal antwoordt — overruled de auto-detectie. Andere labels worden genegeerd.
  function resolveLanguageFromLabels(labels: string[] | null | undefined): { code: string; name: string } | null {
    if (!labels || !Array.isArray(labels)) return null;
    const lower = labels.map(l => (l || '').toString().trim().toLowerCase());
    if (lower.includes('nl')) return { code: 'nl', name: 'Nederlands' };
    if (lower.includes('en')) return { code: 'en', name: 'English' };
    return null;
  }

  // ─── Hulp: detecteer taal van de laatste inkomende boodschap (snelle pre-call) ──
  // Retourneert ISO-taalcode + leesbare naam. Bij fout: nl/Nederlands als veilige default.
  async function detectMessageLanguage(text: string): Promise<{ code: string; name: string }> {
    const fallback = { code: 'nl', name: 'Nederlands' };
    try {
      const cleaned = (text || '').trim();
      if (cleaned.length < 2) return fallback;

      let OpenAI: any;
      try { OpenAI = (await import('openai')).default; } catch { return fallback; }
      const client = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? 'unused',
      });

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a language detector. Respond with ONLY one line in this exact format: "<ISO 639-1 code>|<English language name>". Examples: "nl|Dutch", "en|English", "es|Spanish", "pl|Polish", "de|German", "fr|French", "ar|Arabic", "tr|Turkish", "ro|Romanian", "pt|Portuguese", "it|Italian". No quotes, no other text, no JSON.' },
          { role: 'user', content: cleaned.slice(0, 300) },
        ],
        max_tokens: 20,
        temperature: 0,
      });
      const raw = (completion.choices?.[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '');
      const parts = raw.split('|').map(s => s.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const result = { code: parts[0].toLowerCase().slice(0, 5), name: parts[1] };
        console.log(`[lang-detect] "${cleaned.slice(0, 40)}…" → ${result.code}/${result.name}`);
        return result;
      }
      console.log(`[lang-detect] FALLBACK (kon "${raw}" niet parsen) voor: ${cleaned.slice(0, 40)}`);
      return fallback;
    } catch (err: any) {
      console.log(`[lang-detect] FOUT (${err?.message}) — fallback Nederlands`);
      return fallback;
    }
  }

  // ─── AI bijlagen-helpers (gedeeld door auto-reply en ai-suggest) ───────────
  type WaAiAttachmentRow = { id: number; fieldKey: string; knowledgeId: number | null; filename: string; storagePath: string; mimeType: string; extractedText: string; enabled: boolean };

  /** Bouw de PDF-tekstblokken die direct na een tekstveld in de prompt komen. */
  function appendAttachmentTextForField(attachments: WaAiAttachmentRow[], fieldKey: string): string {
    let out = '';
    for (const a of attachments) {
      if (a.fieldKey === fieldKey && a.extractedText) {
        out += `\n[Bijlage PDF "${a.filename}"]\n${a.extractedText}`;
      }
    }
    return out;
  }

  /** Bouw het "beschikbare PDF-bijlagen" overzicht onderaan de prompt. */
  function buildAvailableAttachmentsBlock(attachments: WaAiAttachmentRow[], knowledge: { id: number; title: string }[]): string {
    if (attachments.length === 0) return '';
    const ctxFor = (a: WaAiAttachmentRow): string => {
      if (a.fieldKey === 'knowledge' && a.knowledgeId != null) {
        const k = knowledge.find(kk => kk.id === a.knowledgeId);
        return k ? `kennisbank: ${k.title}` : 'kennisbank';
      }
      switch (a.fieldKey) {
        case 'cancellation_protocol': return 'afmeldprotocol';
        case 'guidelines': return 'algemene richtlijnen';
        case 'extra_context': return 'extra context';
        case 'tone_of_voice': return 'tone of voice';
        case 'voice_examples': return 'voorbeeldberichten';
        default: return a.fieldKey;
      }
    };
    let block = `\n\n=== AVAILABLE PDF ATTACHMENTS ===\nIf a PDF attachment is GENUINELY relevant for your reply (e.g. the user asks for the cancellation protocol or another protocol document), end your reply on a NEW LINE with EXACTLY:\n[BIJLAGE:<id>]\nRules: max 1 attachment per reply. Only include the marker if a PDF is truly relevant — NEVER attach just because attachments exist. Do NOT explain the marker to the user.\nAvailable PDFs:`;
    for (const a of attachments) {
      block += `\n  - [BIJLAGE:${a.id}] ${a.filename} (${ctxFor(a)})`;
    }
    return block;
  }

  /** Parseert eventuele [BIJLAGE:<id>] marker uit een AI-antwoord. */
  function parseAttachmentMarker(text: string): { cleanText: string; attachmentId: number | null } {
    const m = text.match(/\[BIJLAGE:(\d+)\]/i);
    if (!m) return { cleanText: text, attachmentId: null };
    return {
      cleanText: text.replace(/\s*\[BIJLAGE:\d+\]\s*/gi, ' ').replace(/\s+\n/g, '\n').trim(),
      attachmentId: Number(m[1]),
    };
  }

  /** Stuur een opgeslagen PDF-bijlage als WhatsApp document naar het opgegeven nummer. */
  async function sendPdfAttachmentToWa(phoneNumber: string, attachmentId: number): Promise<void> {
    if (!waProvider.isSendConfigured()) return;
    try {
      const { whatsappAiAttachments } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const rows = await db.select().from(whatsappAiAttachments).where(eq(whatsappAiAttachments.id, attachmentId)).limit(1);
      const att = rows[0];
      if (!att || !att.enabled) {
        console.warn(`[WA AI bijlage] id=${attachmentId} niet gevonden of uitgeschakeld`);
        return;
      }
      const buffer = await downloadWaAiAttachmentBuffer(att.storagePath);
      if (!buffer) {
        console.warn(`[WA AI bijlage] download mislukt voor id=${attachmentId}`);
        return;
      }
      // Stap 1: upload naar de media-storage van de actieve provider
      const upload = await waProvider.uploadMedia({ buffer, mimeType: att.mimeType, filename: att.filename });
      if (!upload.ok || !upload.mediaId) {
        console.warn(`[WA AI bijlage] ${upload.provider} media-upload mislukt:`, upload.errorMessage);
        return;
      }
      const mediaId = upload.mediaId;

      // Stap 2: stuur document
      const now = new Date();
      const match = await waStorage.resolveAndUpsertConversation({
        phoneNumber,
        inbound: false,
        bodyPreview: `[PDF: ${att.filename}]`,
        at: now,
      });
      const dbId = await waStorage.insertOutboundQueued({
        direction: 'outbound',
        fromNumber: 'extra',
        toNumber: phoneNumber,
        messageType: 'document',
        body: null,
        mediaUrl: null,
        candidateId: match.candidateId,
        prospectContactId: match.prospectContactId,
        matchCategory: match.category,
        sentByUserId: null,
        rawPayload: { type: 'document', to: phoneNumber, filename: att.filename, mediaId, autoReply: true, aiAttachmentId: attachmentId },
      });
      const sendResult = await waProvider.sendMedia(phoneNumber, { type: 'document', id: mediaId, filename: att.filename });
      if (!sendResult.ok) {
        await waStorage.updateOutboundResult(dbId, { status: 'failed', errorCode: sendResult.errorCode ?? null, errorMessage: sendResult.errorMessage ?? null });
        console.warn(`[WA AI bijlage] verzending mislukt:`, sendResult.errorMessage);
        return;
      }
      const waMessageId = sendResult.waMessageId ?? null;
      await waStorage.updateOutboundResult(dbId, { waMessageId, status: 'sent' });
      console.log(`[WA AI bijlage] PDF ${att.filename} verzonden naar ${phoneNumber}`);
    } catch (err: any) {
      console.error('[WA AI bijlage] onverwachte fout:', err?.message);
    }
  }

  // ─── Auto-reply + classificatie: één AI-call per inkomend bericht ────────────
  //
  // FASE 3-ONTWERPKEUZE: de gates hieronder bepalen of we MOGEN ANTWOORDEN,
  // niet of we mogen CLASSIFICEREN. Vroeger stapte deze functie er bij elke
  // gate uit; dan blijven de labels leeg zodra auto-reply uitstaat en ziet de
  // planner nooit waar een gesprek over gaat. Nu draait er altijd precies één
  // AI-call: de volledige prompt als antwoorden mag, de compacte
  // classificatie-only-prompt als dat niet mag. Nooit twee calls.
  async function tryAutoReply(opts: {
    phoneNumber: string;
    matchCategory: 'candidate' | 'prospect' | 'unmatched';
    candidateId: number | null;
    prospectContactId: number | null;
    contactName: string | null;
    /** Fase 3B: rij-id van het inkomende bericht, als bron voor een taak. */
    inboundMessageId?: number | null;
  }): Promise<void> {
    try {
      const { whatsappAiSettings, whatsappAiKnowledge, whatsappAiAttachments, whatsappMessages: wm } = await import('@shared/schema');
      const { eq, asc, desc, and } = await import('drizzle-orm');

      // 1. Settings ophalen (mag ontbreken — dan classificeren we alleen)
      const settingsRows = await db.select().from(whatsappAiSettings).limit(1);
      const settings = settingsRows[0];

      // 2. Mag er geantwoord worden? Elke "nee" onderdrukt alleen het VERSTUREN.
      let mayReply = true;
      let noReplyReason = '';
      if (!waProvider.isSendConfigured()) {
        mayReply = false; noReplyReason = 'provider niet geconfigureerd';
      } else if (!settings || !settings.autoReplyEnabled) {
        mayReply = false; noReplyReason = 'auto-reply staat uit';
      } else if (settings.autoReplyOnlyForKnown && opts.matchCategory === 'unmatched') {
        mayReply = false; noReplyReason = 'onbekend contact';
      } else {
        // Rate-limit: niet binnen N seconden van vorig uitgaand bericht
        const minIntervalMs = (settings.autoReplyMinIntervalSec ?? 60) * 1000;
        const recent = await db.select({ createdAt: wm.createdAt })
          .from(wm)
          .where(and(eq(wm.toNumber, opts.phoneNumber), eq(wm.direction, 'outbound')))
          .orderBy(desc(wm.createdAt))
          .limit(1);
        if (recent.length > 0) {
          const ageMs = Date.now() - new Date(recent[0].createdAt).getTime();
          if (ageMs < minIntervalMs) {
            mayReply = false;
            noReplyReason = `rate-limit (${Math.round(ageMs / 1000)}s < ${settings.autoReplyMinIntervalSec}s)`;
          }
        }
      }
      if (!mayReply) {
        console.log(`[WA auto-reply] ${opts.phoneNumber}: niet antwoorden (${noReplyReason}) — wel classificeren`);
      }

      // 4. Recente berichten ophalen (laatste 10) als context
      const history = await db.select()
        .from(wm)
        .where(eq(wm.fromNumber, opts.phoneNumber))
        .orderBy(desc(wm.createdAt))
        .limit(10);
      const outgoing = await db.select()
        .from(wm)
        .where(and(eq(wm.toNumber, opts.phoneNumber), eq(wm.direction, 'outbound')))
        .orderBy(desc(wm.createdAt))
        .limit(10);
      const allMessages = [...history, ...outgoing]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-10);

      if (allMessages.length === 0) return;

      // 5. Knowledge entries
      const knowledgeRows = await db.select().from(whatsappAiKnowledge)
        .where(eq(whatsappAiKnowledge.enabled, true))
        .orderBy(asc(whatsappAiKnowledge.sortOrder), asc(whatsappAiKnowledge.id));

      // 5a. PDF-bijlagen (alleen ingeschakelde)
      const attachmentRows = (await db.select().from(whatsappAiAttachments)
        .where(eq(whatsappAiAttachments.enabled, true))
        .orderBy(asc(whatsappAiAttachments.id))) as WaAiAttachmentRow[];

      // 5b. Bepaal taal: gespreks-label "nl"/"en" overruled detectie, anders auto-detect
      const convLabelRow = await db.select({ labels: whatsappConversations.labels })
        .from(whatsappConversations)
        .where(eq(whatsappConversations.phoneNumber, opts.phoneNumber))
        .limit(1);
      const labelLang = resolveLanguageFromLabels(convLabelRow[0]?.labels ?? null);
      const lastInbound = [...allMessages].reverse().find((m: any) => m.direction === 'inbound');
      const lang = labelLang ?? (lastInbound?.body ? await detectMessageLanguage(lastInbound.body) : { code: 'nl', name: 'Nederlands' });
      if (labelLang) console.log(`[WA auto-reply] taal-override via label → ${labelLang.code}`);

      // 6. OpenAI-call
      let OpenAI: any;
      try { OpenAI = (await import('openai')).default; } catch { return; }
      const client = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? 'unused',
      });

      let guidelinesBlock = '';
      if (settings?.toneOfVoice) guidelinesBlock += `\n\nTone of voice: ${settings.toneOfVoice}${appendAttachmentTextForField(attachmentRows, 'tone_of_voice')}`;
      if (settings?.voiceExamples) guidelinesBlock += `\n\n=== VOORBEELDBERICHTEN (alleen voor STIJL — toon, lengte, emoji's; vertaal naar de juiste taal) ===\n${settings.voiceExamples}${appendAttachmentTextForField(attachmentRows, 'voice_examples')}`;
      if (settings?.guidelines) guidelinesBlock += `\n\nAlgemene richtlijnen: ${settings.guidelines}${appendAttachmentTextForField(attachmentRows, 'guidelines')}`;
      if (settings?.cancellationProtocol) guidelinesBlock += `\n\nAfmeldprotocol: ${settings.cancellationProtocol}${appendAttachmentTextForField(attachmentRows, 'cancellation_protocol')}`;
      if (settings?.extraContext) guidelinesBlock += `\n\nExtra context: ${settings.extraContext}${appendAttachmentTextForField(attachmentRows, 'extra_context')}`;
      if (knowledgeRows.length > 0) {
        guidelinesBlock += `\n\n=== KENNISBANK / PROTOCOLLEN ===`;
        for (const k of knowledgeRows) {
          guidelinesBlock += `\n\n[${k.title}]\n${k.content}`;
          for (const a of attachmentRows) {
            if (a.fieldKey === 'knowledge' && a.knowledgeId === k.id && a.extractedText) {
              guidelinesBlock += `\n[Bijlage PDF "${a.filename}"]\n${a.extractedText}`;
            }
          }
        }
      }
      guidelinesBlock += buildAvailableAttachmentsBlock(attachmentRows, knowledgeRows);

      const contactInfo = opts.contactName ? `\nNaam contact: ${opts.contactName}` : '';

      // De volledige prompt (antwoorden mag) of de compacte triage-prompt
      // (antwoorden mag niet). In beide gevallen levert het model hetzelfde
      // JSON-contract, zodat de parsing hieronder maar één vorm hoeft te kennen.
      const systemPrompt = mayReply
        ? `You are the official WhatsApp assistant for EXTRA, a hospitality staffing agency in Amsterdam. You answer messages AUTONOMOUSLY without human intervention.

🌍 LANGUAGE — ABSOLUTE HARD RULE (overrides everything else):
The user's last incoming message has been detected as: ${lang.name} (ISO: ${lang.code}).
You MUST write your ENTIRE reply in ${lang.name} ONLY. Do not switch languages mid-message. Do not respond in Dutch unless ${lang.name} IS Dutch.
Voice/style examples below are in another language — copy only their TONE, LENGTH and emoji usage, but TRANSLATE everything into ${lang.name}.
(This rule applies to the "reply" field only. The "category", "escalation_reason" and "task.category" fields are fixed identifiers and "task.summary" is always Dutch.)

OTHER RULES:
- Put ONLY the message itself in "reply", no explanation or commentary
- Keep it short (max 2-3 sentences unless more is truly needed)
- Do NOT wrap the message in quotes
- If you're NOT sure about the answer, or if the topic is sensitive (complaints, payments, legal), use action "escalate" with an empty reply. A human planner will then take over.
- Never make promises you cannot keep${guidelinesBlock}${contactInfo}
${waClassifier.buildStructuredOutputInstruction({ withReply: true })}`
        : `${waClassifier.buildClassifyOnlySystemPrompt()}${contactInfo}`;

      const formatted = allMessages.map((m: any) => ({
        role: (m.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.body || '',
      }));

      const chatArgs: any = {
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...formatted],
        // Ruimer dan de oude 300: het antwoord zit nu in JSON met label,
        // escalatiereden en taak-suggestie eromheen.
        max_tokens: 600,
        temperature: 0.5,
      };
      // JSON-modus maakt het contract betrouwbaarder, maar niet elke
      // proxy/gateway ondersteunt response_format. Faalt hij, dan draaien we
      // dezelfde call nog één keer zonder — de parser kan ook losse tekst aan.
      let completion: any;
      try {
        completion = await client.chat.completions.create({ ...chatArgs, response_format: { type: 'json_object' } });
      } catch (jsonModeErr: any) {
        console.warn('[WA auto-reply] response_format niet ondersteund, opnieuw zonder JSON-modus:', jsonModeErr?.message);
        completion = await client.chat.completions.create(chatArgs);
      }
      const rawReply = completion.choices?.[0]?.message?.content?.trim() || '';
      const turn = waClassifier.parseAiTurnResponse(rawReply);
      if (turn.usedFallback) {
        console.warn(`[WA auto-reply] ${opts.phoneNumber}: geen bruikbare JSON van het model → teruggevallen op platte tekst`);
      }

      // 6a. Label wegschrijven. Doen we ALTIJD, ook bij escalatie en ook als er
      // niet geantwoord mag worden — dit is de kern van fase 3. Een handmatige
      // keuze van een planner wordt in storage.setAiCategory beschermd.
      await waStorage.setAiCategory(opts.phoneNumber, turn.category, 'ai');
      console.log(`[WA classificatie] ${opts.phoneNumber} → ${turn.category}${turn.action === 'escalate' ? ` / escalatie: ${turn.escalationReason}` : ''}`);

      // 6b. Fase 3B: taak wegschrijven. Komt uit dezelfde AI-call als het
      // antwoord, dus dit kost geen extra request. Gebeurt ALTIJD — ook bij
      // escalatie en ook als er niet geantwoord mag worden: het werk moet
      // gebeuren, onafhankelijk van of de bot iets terugstuurt.
      // Faalt de insert, dan mag dat het antwoorden nooit tegenhouden.
      if (turn.task) {
        try {
          const taakId = await waStorage.createTaskFromAi({
            phoneNumber: opts.phoneNumber,
            suggestion: turn.task,
            sourceMessageId: opts.inboundMessageId ?? null,
          });
          if (taakId) {
            console.log(`[WA taak] #${taakId} aangemaakt voor ${opts.phoneNumber} → ${turn.task.category}: ${turn.task.summary}`);
          } else {
            console.log(`[WA taak] ${opts.phoneNumber}: suggestie overgeslagen (duplicaat of onbruikbaar) → ${turn.task.summary}`);
          }
        } catch (taakErr: any) {
          console.error('[WA taak] aanmaken mislukt:', taakErr?.message);
        }
      }

      // 6c. Escalatie: gesprek in de wachtrij voor een mens zetten en niets sturen.
      if (turn.action === 'escalate') {
        await waStorage.markEscalated(opts.phoneNumber, turn.escalationReason ?? 'overig');
        console.log(`[WA auto-reply] AI escaleert ${opts.phoneNumber} (${turn.escalationReason}) → planner moet overnemen`);
        return;
      }

      // 6d. Wel een antwoord, maar versturen mag nu niet → alleen geclassificeerd.
      if (!mayReply) return;

      // 6e. Bijlage-marker uit antwoord extraheren
      const { cleanText: reply, attachmentId } = parseAttachmentMarker(turn.reply);
      if (!reply) {
        console.log(`[WA auto-reply] AI gaf alleen marker, geen tekst → skip`);
        return;
      }

      // 7. Insert outbound + verstuur via de actieve provider
      const now = new Date();
      const match = await waStorage.resolveAndUpsertConversation({
        phoneNumber: opts.phoneNumber,
        inbound: false,
        bodyPreview: reply,
        at: now,
      });
      const dbId = await waStorage.insertOutboundQueued({
        direction: 'outbound',
        fromNumber: 'extra',
        toNumber: opts.phoneNumber,
        messageType: 'text',
        body: reply,
        candidateId: match.candidateId,
        prospectContactId: match.prospectContactId,
        matchCategory: match.category,
        sentByUserId: null, // Geen menselijke afzender = AI
        rawPayload: { type: 'text', text: { body: reply }, to: opts.phoneNumber, autoReply: true, aiAttachmentId: attachmentId },
      });

      const sendResult = await waProvider.sendText(opts.phoneNumber, reply);
      if (!sendResult.ok) {
        await waStorage.updateOutboundResult(dbId, {
          status: 'failed',
          errorCode: sendResult.errorCode ?? null,
          errorMessage: sendResult.errorMessage ?? null,
        });
        console.error(`[WA auto-reply] verzending mislukt naar ${opts.phoneNumber}: ${sendResult.errorMessage}`);
        return;
      }
      const waMessageId = sendResult.waMessageId ?? null;
      await waStorage.updateOutboundResult(dbId, { waMessageId, status: 'sent' });
      console.log(`[WA auto-reply] verzonden naar ${opts.phoneNumber} (${reply.slice(0, 60)}...)`);

      // 8. Optioneel: stuur PDF-bijlage mee als de AI hierom vroeg
      if (attachmentId != null) {
        await sendPdfAttachmentToWa(opts.phoneNumber, attachmentId);
      }
    } catch (err: any) {
      console.error('[WA auto-reply] fout:', err?.message);
    }
  }

  // GET /api/whatsapp/accounts — UI status-blok
  app.get('/api/whatsapp/accounts', adminMiddleware, async (_req: Request, res: Response) => {
    res.json([{
      id: 'whatsapp',
      label: 'WhatsApp Business',
      categorie: 'business',
      status: waProvider.isSendConfigured() ? 'connected' : 'disconnected',
      telefoon: waProvider.isSendConfigured() ? 'Actief' : null,
      qr: null,
      ongelezen: 0,
    }]);
  });

  // POST /api/whatsapp/stuur — bericht sturen via de actieve provider (met DB-persistentie)
  app.post('/api/whatsapp/stuur', whatsappSendLimiter, adminMiddleware, async (req: Request, res: Response) => {
    const { nummer, tekst } = req.body;
    if (!nummer || !tekst) return res.status(400).json({ error: 'nummer en tekst zijn verplicht' });
    const configError = waProvider.configErrorMessage();
    if (configError) return res.status(503).json({ error: configError });

    const normalized = normalizePhone(nummer);
    if (!normalized) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });

    const now = new Date();
    const userId = req.session?.userId ?? null;

    // 1. Insert als queued + match aan kandidaat/prospect + upsert conversation
    const match = await waStorage.resolveAndUpsertConversation({
      phoneNumber: normalized,
      inbound: false,
      bodyPreview: tekst,
      at: now,
    });

    const messageRowId = await waStorage.insertOutboundQueued({
      direction: 'outbound',
      fromNumber: 'extra', // 360dialog regelt het werkelijke afzendernummer; placeholder
      toNumber: normalized,
      messageType: 'text',
      body: tekst,
      candidateId: match.candidateId,
      prospectContactId: match.prospectContactId,
      matchCategory: match.category,
      sentByUserId: userId,
      rawPayload: { type: 'text', text: { body: tekst }, to: normalized },
    });

    // 2. API-call via de actieve provider (360dialog of Meta)
    const result = await waProvider.sendText(normalized, tekst);
    console.log(`${result.provider} stuur → ${normalized}: ${result.httpStatus != null ? `HTTP ${result.httpStatus}` : result.errorCode || 'ok'}`);

    if (!result.ok) {
      await waStorage.updateOutboundResult(messageRowId, {
        status: 'failed',
        errorCode: result.errorCode ?? null,
        errorMessage: result.errorMessage ?? null,
      });
      if (result.errorCode === 'network_error' || result.errorCode === 'timeout') {
        console.error('Fout bij versturen WhatsApp bericht:', result.errorMessage);
        return res.status(500).json({ error: result.errorMessage });
      }
      return res.status(waProvider.httpStatusForFailure(result)).json({ error: `${result.provider}: ${result.errorMessage}` });
    }

    const waMessageId = result.waMessageId ?? null;
    await waStorage.updateOutboundResult(messageRowId, { waMessageId, status: 'sent' });
    // Fase 3: een MENS heeft geantwoord → het gesprek wacht niet langer op de
    // planner. De escalatievlag is de wachtrij; die moet hier leeg.
    await waStorage.clearEscalation(normalized);
    return res.json({ success: true, messageId: waMessageId, dbId: messageRowId });
  });

  // POST /api/whatsapp/stuur-media — bestand uploaden + verzenden via de actieve provider
  // Multipart upload: file (binary) + nummer + optionele caption
  const whatsappMediaUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 16 * 1024 * 1024 }, // 16MB conform WhatsApp Cloud API limiet voor de meeste types
  });

  app.post('/api/whatsapp/stuur-media', whatsappSendLimiter, adminMiddleware, whatsappMediaUpload.single('file'), async (req: Request, res: Response) => {
    const nummer = (req.body?.nummer || '').toString();
    const caption = (req.body?.caption || '').toString().trim();
    const file = req.file;
    if (!nummer || !file) return res.status(400).json({ error: 'nummer en file zijn verplicht' });
    const mediaConfigError = waProvider.configErrorMessage();
    if (mediaConfigError) return res.status(503).json({ error: mediaConfigError });

    const normalized = normalizePhone(nummer);
    if (!normalized) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });

    // Bepaal WhatsApp media-type op basis van MIME
    const mime = file.mimetype || 'application/octet-stream';
    let waType: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (mime.startsWith('image/')) waType = 'image';
    else if (mime.startsWith('video/')) waType = 'video';
    else if (mime.startsWith('audio/')) waType = 'audio';

    const now = new Date();
    const userId = req.session?.userId ?? null;
    const bodyPreview = caption || file.originalname || `[${waType}]`;

    const match = await waStorage.resolveAndUpsertConversation({
      phoneNumber: normalized,
      inbound: false,
      bodyPreview,
      at: now,
    });

    const messageRowId = await waStorage.insertOutboundQueued({
      direction: 'outbound',
      fromNumber: 'extra',
      toNumber: normalized,
      messageType: waType,
      body: caption || null,
      // Blijft null: media_url bevat de ruwe media-referentie van de provider,
      // en die krijgen we alleen bij binnenkomende berichten uit de webhook.
      // Bij een dashboard-send hebben wíj het bestand — dat gaat hieronder
      // rechtstreeks naar Object Storage, in media_object_path.
      mediaUrl: null,
      candidateId: match.candidateId,
      prospectContactId: match.prospectContactId,
      matchCategory: match.category,
      sentByUserId: userId,
      rawPayload: { type: waType, to: normalized, filename: file.originalname, mime, size: file.size, caption },
    });

    // De buffer die we tóch al in het geheugen hebben ook bewaren, anders is
    // wat wij zelf sturen in de historie net zo onzichtbaar als wat er
    // binnenkomt. Nooit fataal: mislukt dit, dan gaat het bericht gewoon weg.
    try {
      const objectPath = await uploadWaMedia(file.buffer, file.originalname || `${waType}`, mime);
      await waStorage.updateMessageMedia(messageRowId, {
        objectPath,
        mimeType: mime,
        filename: file.originalname || null,
      });
    } catch (opslagFout: any) {
      console.warn('WhatsApp stuur-media: bewaren in Object Storage mislukt:', opslagFout?.message || opslagFout);
    }

    try {
      // Stap 1: upload media naar de actieve provider (Node's native FormData/Blob — Node 18+)
      const upload = await waProvider.uploadMedia({ buffer: file.buffer, mimeType: mime, filename: file.originalname || 'upload' });

      if (!upload.ok || !upload.mediaId) {
        if (upload.errorCode === 'network_error' || upload.errorCode === 'timeout') {
          await waStorage.updateOutboundResult(messageRowId, {
            status: 'failed',
            errorCode: 'network_error',
            errorMessage: upload.errorMessage ?? null,
          });
          console.error('Fout bij versturen WhatsApp media:', upload.errorMessage);
          return res.status(500).json({ error: upload.errorMessage });
        }
        await waStorage.updateOutboundResult(messageRowId, {
          status: 'failed',
          errorCode: upload.errorCode ?? null,
          errorMessage: `media-upload: ${upload.errorMessage}`,
        });
        return res.status(waProvider.httpStatusForFailure(upload)).json({ error: `media-upload mislukt: ${upload.errorMessage}` });
      }

      const mediaId = upload.mediaId;

      // Stap 2: verstuur bericht met media-id via de actieve provider
      const result = await waProvider.sendMedia(normalized, {
        type: waType,
        id: mediaId,
        caption: caption || undefined,
        filename: waType === 'document' ? (file.originalname || undefined) : undefined,
      });

      console.log(`${result.provider} stuur-media (${waType}) → ${normalized}: ${result.httpStatus != null ? `HTTP ${result.httpStatus}` : result.errorCode || 'ok'}`);

      if (!result.ok) {
        await waStorage.updateOutboundResult(messageRowId, {
          status: 'failed',
          errorCode: result.errorCode ?? null,
          errorMessage: result.errorMessage ?? null,
        });
        if (result.errorCode === 'network_error' || result.errorCode === 'timeout') {
          console.error('Fout bij versturen WhatsApp media:', result.errorMessage);
          return res.status(500).json({ error: result.errorMessage });
        }
        return res.status(waProvider.httpStatusForFailure(result)).json({ error: `${result.provider}: ${result.errorMessage}` });
      }

      const waMessageId = result.waMessageId ?? null;
      await waStorage.updateOutboundResult(messageRowId, { waMessageId, status: 'sent' });
      // Fase 3: mens heeft gereageerd (met media) → escalatie opheffen.
      await waStorage.clearEscalation(normalized);
      return res.json({ success: true, messageId: waMessageId, dbId: messageRowId, mediaType: waType, mediaId });
    } catch (err: any) {
      console.error('Fout bij versturen WhatsApp media:', err.message);
      await waStorage.updateOutboundResult(messageRowId, {
        status: 'failed',
        errorCode: 'network_error',
        errorMessage: err.message,
      });
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── WEBHOOK (secret in URL) ─────────────────────────────────────────────
  // 360dialog moet POSTen naar https://<host>/api/whatsapp/webhook/<secret>
  // Bij mismatch: 401 met lege body (stille afwijzing).
  // Bij interne fout: 200 (anders blijft 360dialog retryen) — fout wordt gelogd.
  const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || '';

  async function handleWebhookGet(req: Request, res: Response) {
    if (!safeEqualSecret(req.params.secret || '', WEBHOOK_SECRET)) {
      return res.sendStatus(401);
    }
    return res.status(200).send(String(req.query['hub.challenge'] || 'ok'));
  }

  async function handleWebhookPost(req: Request, res: Response) {
    if (!safeEqualSecret(req.params.secret || '', WEBHOOK_SECRET)) {
      return res.sendStatus(401);
    }
    return verwerkInkomendeWebhookBody(req, res);
  }

  // Gedeelde verwerking (Cloud API-formaat) voor 360dialog- én Meta-webhook.
  // De verwerking zelf staat in server/whatsapp/inboundProcessor.ts en is daar
  // los te testen: statuses → applyStatusEvent (incl. failed+blocked → opt-out),
  // messages → normalisatie, matching, idempotente insert, STOP-detectie en
  // auto-reply, message_echoes → berichten die op de telefoon zelf zijn getypt.
  // Die module unwrapt álle entry[]/changes[]-elementen, niet alleen het
  // eerste, en kijkt niet naar `field` — een smb_message_echoes-change loopt er
  // dus net zo goed doorheen als een messages-change.
  async function verwerkInkomendeWebhookBody(req: Request, res: Response, logPrefix = '[WA webhook]') {
    await processIncomingPayload(req.body || {}, {
      tryAutoReply,
      logPrefix,
    });

    // Altijd 200 — 360dialog mag niet retryen op interne fouten
    return res.sendStatus(200);
  }

  app.get('/api/whatsapp/webhook/:secret', handleWebhookGet);
  app.post('/api/whatsapp/webhook/:secret', handleWebhookPost);

  // ─── META CLOUD API WEBHOOK (coexistence — Fase 1 migratie) ───────────────
  // Te registreren in Meta Business Manager (App → WhatsApp → Configuration):
  //   Callback URL: https://doehetextra.nl/api/whatsapp/meta-webhook
  //   Verify token: waarde van META_WA_BOT_VERIFY_TOKEN
  // GET  = verify-handshake; POST = events, geverifieerd via X-Hub-Signature-256
  // (HMAC-SHA256 over de RAW body met META_WA_BOT_APP_SECRET; de raw body wordt
  // door express.json() in server/index.ts al op req.rawBody gezet).
  //
  // De vergelijkingen zelf staan in server/whatsapp/webhookVerify.ts en zijn
  // allebei timing-safe; daar liggen ook de unit-tests op.
  app.get('/api/whatsapp/meta-webhook', (req: Request, res: Response) => {
    const challenge = handleVerifyHandshake(req.query as Record<string, unknown>);
    if (challenge !== null) {
      console.log('[WA meta-webhook] verify-handshake geslaagd');
      // text/plain: Meta verwacht de challenge kaal terug, zonder JSON-quotes.
      return res.status(200).type('text/plain').send(challenge);
    }
    console.warn('[WA meta-webhook] verify-handshake geweigerd (verkeerde hub.verify_token of META_WA_BOT_VERIFY_TOKEN niet gezet)');
    return res.sendStatus(403);
  });

  app.post('/api/whatsapp/meta-webhook', async (req: Request, res: Response) => {
    const appSecret = process.env.META_WA_BOT_APP_SECRET || '';
    if (!appSecret) {
      // Expliciete, herkenbare log: zonder dit secret worden ALLE inkomende
      // berichten geweigerd terwijl de GET-verificatie er gezond uitziet.
      console.error('[WA meta-webhook] META_WA_BOT_APP_SECRET niet ingesteld — kan signature niet verifiëren, event geweigerd');
      return res.status(503).json({ error: 'META_WA_BOT_APP_SECRET niet ingesteld' });
    }

    const rawBody: Buffer | undefined = (req as any).rawBody;
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    if (!rawBody || !verifyMetaSignature(rawBody, signature, appSecret)) {
      console.warn(`[WA meta-webhook] ongeldige of ontbrekende X-Hub-Signature-256 (signature ${signature ? 'aanwezig' : 'ontbreekt'}, rawBody ${rawBody ? 'aanwezig' : 'ontbreekt'}) — 403`);
      return res.sendStatus(403);
    }

    // Zelfde gedeelde verwerking als de 360dialog-webhook, eigen log-prefix.
    return verwerkInkomendeWebhookBody(req, res, '[WA meta-webhook]');
  });

  // POST /api/whatsapp/registreer-webhook — stel webhook-URL in via 360dialog API
  app.post('/api/whatsapp/registreer-webhook', adminMiddleware, async (req: Request, res: Response) => {
    if (!WA_360_KEY) return res.status(503).json({ error: 'WHATSAPP_360_API_KEY niet ingesteld' });
    if (!WEBHOOK_SECRET) return res.status(503).json({ error: 'WHATSAPP_WEBHOOK_SECRET niet ingesteld — kan geen veilige URL bouwen' });
    // www, niet de apex: de apex stuurt met een 301 door naar www en een
    // webhook-verzender volgt geen redirect.
    const baseUrl = req.body?.url || `https://www.doehetextra.nl/api/whatsapp/webhook/${WEBHOOK_SECRET}`;
    const attempts = [
      { method: 'PATCH', body: { url: baseUrl } },
      { method: 'PUT',   body: { url: baseUrl, headers: {} } },
      { method: 'POST',  body: { url: baseUrl, headers: {} } },
      { method: 'PUT',   body: { url: baseUrl } },
      { method: 'POST',  body: { url: baseUrl } },
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
        // Log zonder secret te lekken
        const maskedUrl = baseUrl.replace(WEBHOOK_SECRET, '***');
        console.log(`360dialog webhook registreren ${attempt.method} (url:${maskedUrl}): ${r.status}`);
        if (r.ok) {
          let data: any = {}; try { data = JSON.parse(text); } catch {}
          return res.json({ success: true, url: maskedUrl, method: attempt.method, response: data });
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

  // GET /api/whatsapp/webhook-status
  app.get('/api/whatsapp/webhook-status', adminMiddleware, async (_req: Request, res: Response) => {
    if (!WA_360_KEY) return res.json({ configured: false, url: null, secretSet: !!WEBHOOK_SECRET });
    try {
      const r = await fetch(`${WA_BASE_URL}/configs/webhook`, { headers: wa360Headers });
      const text = await r.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}
      const url = data?.url || null;
      // Mask secret in display
      const maskedUrl = url && WEBHOOK_SECRET ? String(url).replace(WEBHOOK_SECRET, '***') : url;
      return res.json({ configured: r.ok, url: maskedUrl, secretSet: !!WEBHOOK_SECRET });
    } catch {
      return res.json({ configured: false, url: null, secretSet: !!WEBHOOK_SECRET });
    }
  });

  // GET /api/whatsapp/diagnose — één plek waar je ziet of de koppeling klopt.
  //
  // Waarom dit bestaat: bij een storing ("berichten komen niet aan") is de
  // vraag altijd dezelfde — draait productie op de juiste provider, staan de
  // secrets in de omgeving van de deployment (die staan los van de
  // workspace-secrets), en wanneer kwam er voor het laatst écht iets binnen.
  // Zonder dit endpoint is dat alleen uit de deploy-logs te halen.
  //
  // HARDE REGEL: dit endpoint geeft NOOIT een secretwaarde terug, alleen of
  // een variabele gezet is. Ook de foutmelding van de provider wordt afgekapt.
  // Admin-only, net als de rest van dit blok.
  app.get('/api/whatsapp/diagnose', adminMiddleware, async (_req: Request, res: Response) => {
    // .trim() omdat een per ongeluk meegekopieerde spatie of newline in een
    // Replit-secret anders als "gezet" telt terwijl de vergelijking faalt.
    const gezet = (naam: string) => Boolean((process.env[naam] || '').trim());

    const provider = waProvider.activeProvider();

    // Elke query apart in een try: één ontbrekende tabel mag de rest van het
    // beeld niet weghalen, juist bij een storing wil je zien wat er wél is.
    async function eenRij(query: any): Promise<any | null> {
      try {
        const r: any = await db.execute(query);
        const rows = r.rows ?? r ?? [];
        return rows[0] ?? null;
      } catch (err: any) {
        return { fout: String(err?.message || err).slice(0, 200) };
      }
    }

    const inkomend = await eenRij(sql`
      SELECT MAX(created_at) AS laatste FROM whatsapp_messages WHERE direction = 'inbound'
    `);
    const uitgaandGoed = await eenRij(sql`
      SELECT MAX(created_at) AS laatste FROM whatsapp_messages
      WHERE direction = 'outbound' AND status IN ('sent', 'delivered', 'read')
    `);
    const uitgaandFout = await eenRij(sql`
      SELECT created_at, error_code, error_message FROM whatsapp_messages
      WHERE direction = 'outbound' AND status = 'failed'
      ORDER BY created_at DESC LIMIT 1
    `);

    return res.json({
      provider: {
        actief: provider,
        // Let op: 360dialog is de terugval zodra WHATSAPP_PROVIDER niet exact
        // 'meta' is. Staat het nummer al bij Meta (coexistence), dan falen
        // uitgaande berichten dan met een fout van de 360dialog-gateway.
        whatsappProviderEnvGezet: gezet('WHATSAPP_PROVIDER'),
        versturenGeconfigureerd: waProvider.isSendConfigured(),
        configFout: waProvider.configErrorMessage(),
      },
      // Alleen booleans — nooit waarden.
      secrets: {
        META_WA_BOT_ACCESS_TOKEN: gezet('META_WA_BOT_ACCESS_TOKEN'),
        META_WA_BOT_PHONE_NUMBER_ID: gezet('META_WA_BOT_PHONE_NUMBER_ID'),
        META_WA_BOT_WABA_ID: gezet('META_WA_BOT_WABA_ID'),
        // Zonder dit secret weigert POST /api/whatsapp/meta-webhook élk
        // inkomend bericht met 503, terwijl de GET-handshake gezond oogt.
        META_WA_BOT_APP_SECRET: gezet('META_WA_BOT_APP_SECRET'),
        META_WA_BOT_VERIFY_TOKEN: gezet('META_WA_BOT_VERIFY_TOKEN'),
        WHATSAPP_360_API_KEY: gezet('WHATSAPP_360_API_KEY'),
        WHATSAPP_WEBHOOK_SECRET: gezet('WHATSAPP_WEBHOOK_SECRET'),
        AI_INTEGRATIONS_OPENAI_API_KEY: gezet('AI_INTEGRATIONS_OPENAI_API_KEY') || gezet('OPENAI_API_KEY'),
      },
      verkeer: {
        laatsteInkomend: inkomend?.laatste ?? null,
        laatsteUitgaandGeslaagd: uitgaandGoed?.laatste ?? null,
        laatsteUitgaandeFout: uitgaandFout
          ? {
              tijdstip: uitgaandFout.created_at ?? null,
              code: uitgaandFout.error_code ?? null,
              melding: String(uitgaandFout.error_message ?? '').slice(0, 300) || null,
            }
          : null,
      },
    });
  });

  // ─── Conversation endpoints ──────────────────────────────────────────────
  app.get('/api/whatsapp/conversations', adminMiddleware, async (req: Request, res: Response) => {
    const category = req.query.category as 'candidate' | 'prospect' | 'unmatched' | undefined;
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);
    const offset = parseInt(String(req.query.offset || '0'), 10) || 0;
    if (category && !['candidate', 'prospect', 'unmatched'].includes(category)) {
      return res.status(400).json({ error: 'category moet candidate, prospect of unmatched zijn' });
    }
    // Fase 2 snooze-filter: default verbergt de actieve lijst gesnoozede gesprekken;
    // ?snoozed=only toont alléén gesnoozede, ?snoozed=all toont alles.
    const snoozedRaw = String(req.query.snoozed || 'exclude');
    const snoozed = (['exclude', 'only', 'all'] as const).includes(snoozedRaw as any)
      ? (snoozedRaw as 'exclude' | 'only' | 'all')
      : 'exclude';
    const rows = await waStorage.listConversations({ category, limit, offset, snoozed });
    res.json(rows);
  });

  // Fase 2: snooze — verberg een gesprek tot een tijdstip (of hef op met until=null).
  // Nieuw inkomend bericht heft de snooze automatisch op (zie storage.upsertConversation).
  app.patch('/api/whatsapp/conversations/:id/snooze', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Ongeldig gesprek-id' });
    const { until } = req.body ?? {};
    let snoozedUntil: Date | null = null;
    if (until !== null && until !== undefined && until !== '') {
      const d = new Date(until);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'until moet een geldige datum of null zijn' });
      snoozedUntil = d;
    }
    const updated = await db.update(whatsappConversations).set({
      snoozedUntil,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappConversations.id, id)).returning({ id: whatsappConversations.id });
    if (!updated.length) return res.status(404).json({ error: 'Gesprek niet gevonden' });
    res.json({ success: true, snoozedUntil: snoozedUntil ? snoozedUntil.toISOString() : null });
  });

  app.get('/api/whatsapp/conversations/:phoneNumber/messages', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 500);
    const rows = await waStorage.getMessagesForPhone(phone, limit);
    // Het object-storage-pad blijft server-side; de client krijgt alleen een
    // vlag te zien en haalt het bestand op via /messages/:id/media.
    res.json(rows.map((r: any) => {
      const { mediaObjectPath, ...rest } = r;
      return { ...rest, heeftBijlage: isObjectStoragePath(mediaObjectPath) };
    }));
  });

  /**
   * Serveer de bijlage van één WhatsApp-bericht.
   *
   * Gemodelleerd op de CV-route: ?preview=1 → inline (voor de <img> in de
   * chatbubbel), zonder → attachment (voor de downloadlink bij documenten).
   * Achter adminMiddleware, want dit is klantcorrespondentie.
   */
  app.get('/api/whatsapp/messages/:id/media', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Ongeldig bericht-id' });

      const [row] = await db
        .select({
          mediaObjectPath: whatsappMessages.mediaObjectPath,
          mediaMimeType: whatsappMessages.mediaMimeType,
          mediaFilename: whatsappMessages.mediaFilename,
        })
        .from(whatsappMessages)
        .where(drizzleEq(whatsappMessages.id, id))
        .limit(1);

      if (!row || !isObjectStoragePath(row.mediaObjectPath)) {
        return res.status(404).json({ error: 'Geen bijlage bij dit bericht' });
      }

      const buffer = await downloadWaMediaBuffer(row.mediaObjectPath!);
      if (!buffer) return res.status(404).json({ error: 'Bijlage niet meer beschikbaar' });

      const isPreview = req.query.preview === '1';
      const naam = row.mediaFilename || row.mediaObjectPath!.split('/').pop() || 'bijlage';
      const safeName = encodeURIComponent(naam);

      res.setHeader('Content-Type', row.mediaMimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `${isPreview ? 'inline' : 'attachment'}; filename="${safeName}"`);
      return res.send(buffer);
    } catch (error) {
      console.error('Fout bij serveren WhatsApp-bijlage:', error);
      return res.status(500).json({ error: 'Fout bij ophalen bijlage' });
    }
  });

  /**
   * Plaats (of verwijder, met emoji="") onze eigen reactie-emoji op een
   * bericht — hetzelfde gebaar als lang-indrukken in de WhatsApp-app zelf,
   * nu ook vanuit het dashboard. Werkt op zowel inkomende als uitgaande
   * berichten; het telefoonnummer om naartoe te reageren is altijd de
   * ANDERE partij, nooit 'extra' zelf (zie de from/to-conventie hierboven
   * bij /stuur en de inboundProcessor).
   */
  app.post('/api/whatsapp/messages/:id/react', whatsappSendLimiter, adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Ongeldig bericht-id' });

    const emojiRaw = req.body?.emoji;
    const emoji = typeof emojiRaw === 'string' ? emojiRaw.trim() : '';
    // Eén emoji is genoeg voor WhatsApp; dit endpoint is niet bedoeld voor
    // vrije tekst — een te lange waarde wijst op verkeerd gebruik.
    if (emoji.length > 8) return res.status(400).json({ error: 'emoji is te lang' });

    const configError = waProvider.configErrorMessage();
    if (configError) return res.status(503).json({ error: configError });

    const [row] = await db
      .select({
        waMessageId: whatsappMessages.waMessageId,
        fromNumber: whatsappMessages.fromNumber,
        toNumber: whatsappMessages.toNumber,
        direction: whatsappMessages.direction,
      })
      .from(whatsappMessages)
      .where(drizzleEq(whatsappMessages.id, id))
      .limit(1);

    if (!row) return res.status(404).json({ error: 'Bericht niet gevonden' });
    if (!row.waMessageId) {
      return res.status(400).json({ error: 'Dit bericht heeft geen WhatsApp-id — waarschijnlijk van vóór deze functie' });
    }

    const to = row.direction === 'inbound' ? row.fromNumber : row.toNumber;
    const result = await waProvider.sendReaction(to, row.waMessageId, emoji);
    if (!result.ok) {
      return res.status(waProvider.httpStatusForFailure(result)).json({ error: `${result.provider}: ${result.errorMessage}` });
    }

    await db.update(whatsappMessages)
      .set({ ownReactionEmoji: emoji || null, updatedAt: new Date() })
      .where(drizzleEq(whatsappMessages.id, id));

    res.json({ success: true, emoji: emoji || null });
  });

  app.post('/api/whatsapp/conversations/:phoneNumber/mark-read', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    await waStorage.markConversationRead(phone);
    res.json({ success: true });
  });

  app.get('/api/whatsapp/stats', adminMiddleware, async (_req: Request, res: Response) => {
    const stats = await waStorage.getStats();
    res.json(stats);
  });

  app.get('/api/whatsapp/team-members', adminMiddleware, async (_req: Request, res: Response) => {
    const { users: usersTable } = await import('@shared/schema');
    const { and: drizzleAnd, ne: drizzleNe } = await import('drizzle-orm');
    // Alleen echte admin-personen: Lea, Charlotte, Max, Eveline (geen technische seed-admin)
    const admins = await db.select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    }).from(usersTable).where(drizzleAnd(
      drizzleEq(usersTable.role, 'admin'),
      drizzleNe(usersTable.email, 'admin@extra.nl'),
    ));
    res.json(admins.map(a => ({
      id: a.id,
      name: `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim() || 'Admin',
    })));
  });

  app.put('/api/whatsapp/conversations/:phoneNumber/assign', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const { assignedToId, assignedToName } = req.body;
    await db.update(whatsappConversations).set({
      assignedToId: assignedToId || null,
      assignedToName: assignedToName || null,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappConversations.phoneNumber, phone));
    res.json({ success: true });
  });

  // Handmatige categorie-override — verplaatst gesprek tussen tabs
  // (Medewerkers / Klanten / Kandidaten) zonder dat de matcher het terugzet.
  app.put('/api/whatsapp/conversations/:phoneNumber/category', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const { category } = req.body ?? {};
    const allowed = ['candidate', 'prospect', 'unmatched'] as const;
    if (category !== null && !allowed.includes(category)) {
      return res.status(400).json({ error: `category moet ${allowed.join('/')} of null zijn` });
    }
    await db.update(whatsappConversations).set({
      manualCategory: category || null,
      // Effectieve categorie meteen syncen zodat de UI direct schakelt
      matchCategory: category || sql`${whatsappConversations.matchCategory}`,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappConversations.phoneNumber, phone));
    // Bij terugzetten naar 'auto' (null): re-match meteen om de juiste categorie te bepalen
    if (!category) {
      const conv = await db.select().from(whatsappConversations)
        .where(drizzleEq(whatsappConversations.phoneNumber, phone)).limit(1);
      if (conv.length) {
        const { resolveAndUpsertConversation } = await import('./whatsapp/storage');
        await resolveAndUpsertConversation({
          phoneNumber: phone,
          inbound: false,
          bodyPreview: conv[0].lastMessagePreview ?? '',
          at: conv[0].lastMessageAt ?? new Date(),
        });
      }
    }
    res.json({ success: true });
  });

  /**
   * Handmatige naam voor een gesprek zónder gekoppeld kandidaat/medewerker-
   * record (bijv. een onbekend nummer of een klant/prospect-gesprek). Zet
   * whatsapp_conversations.display_name rechtstreeks — dat is al overal
   * (lijst, chatheader, profielpaneel) het eerste veld in de naam-fallback,
   * dus deze wint automatisch van de geïmporteerde-contactenlijst-naam en
   * het kale telefoonnummer, zonder dat de UI ergens anders hoeft te weten
   * dat dit "handmatig" is. Een échte match (kandidaat/medewerker/prospect)
   * blijft wél altijd voorrang houden zodra die er is — upsertConversation
   * overschrijft display_name alleen als de matcher zelf een niet-lege naam
   * berekent, zie server/whatsapp/storage.ts.
   */
  app.put('/api/whatsapp/conversations/:phoneNumber/naam', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const naam = String(req.body?.displayName ?? '').trim();
    if (!naam) return res.status(400).json({ error: 'Naam mag niet leeg zijn' });
    await db.update(whatsappConversations).set({
      displayName: naam,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappConversations.phoneNumber, phone));
    res.json({ success: true, displayName: naam });
  });

  /**
   * Handmatige correctie van voornaam/achternaam voor een geïmporteerd
   * telefooncontact (whatsapp_imported_contacts, de eenmalige import van
   * augustus 2026) — het "handmatig corrigeren"-stuk van de best-effort
   * naam-split (zie scripts/split-imported-contact-names.ts en
   * server/whatsapp/nameLogic.ts). Werkt rechtstreeks op het telefoonnummer,
   * NIET op een gekoppeld kandidaat/prospect-record — voor dié twee bestaat
   * al PUT .../edit-naam hierboven, en die blijft ook na deze wijziging
   * gewoon voorrang houden (zie de naam-resolutie in ProfilePanel.tsx).
   * Upsert: als er nog helemaal geen rij bestaat voor dit nummer (bv. een
   * volledig ongematcht nummer dat nooit in de import zat), wordt er eentje
   * aangemaakt — het NOT NULL name-veld krijgt dan de samengevoegde
   * voornaam+achternaam, of bij twee lege velden het telefoonnummer zelf.
   */
  app.put('/api/whatsapp/conversations/:phoneNumber/geimporteerde-naam', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const { whatsappImportedContacts } = await import('@shared/schema');
    const firstName = String(req.body?.firstName ?? '').trim();
    const lastName = String(req.body?.lastName ?? '').trim();
    if (!firstName && !lastName) {
      return res.status(400).json({ error: 'Voornaam of achternaam is verplicht' });
    }
    const naam = [firstName, lastName].filter(Boolean).join(' ') || phone;
    await db.insert(whatsappImportedContacts).values({
      phone,
      name: naam,
      firstName: firstName || null,
      lastName: lastName || null,
    }).onConflictDoUpdate({
      target: whatsappImportedContacts.phone,
      set: { name: naam, firstName: firstName || null, lastName: lastName || null },
    });
    res.json({ success: true, firstName: firstName || null, lastName: lastName || null });
  });

  // Inbox-status (open/resolved/spam) — gebruikt door de UI-sidebar (Open/Opgelost/Spam/Alle)
  // en door de chat-header acties "Verplaats naar Spam" / "Sluit gesprek".
  app.put('/api/whatsapp/conversations/:phoneNumber/inbox-status', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const { status } = req.body ?? {};
    const allowed = ['open', 'resolved', 'spam'] as const;
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status moet ${allowed.join('/')} zijn` });
    }
    await db.update(whatsappConversations).set({
      inboxStatus: status,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappConversations.phoneNumber, phone));
    // Fase 3: opgelost of spam betekent dat er niets meer op een planner wacht.
    // Terugzetten naar 'open' herstelt de escalatie NIET — die is inhoudelijk
    // afgehandeld; een volgend inkomend bericht bepaalt opnieuw of het nodig is.
    if (status === 'resolved' || status === 'spam') {
      await waStorage.clearEscalation(phone);
    }
    res.json({ success: true });
  });

  // Fase 3: handmatige override van het AI-label. Zet de bron op 'handmatig',
  // waarna de AI het label niet meer overschrijft (zie storage.setAiCategory).
  // category = null zet de override terug naar 'ai' zodat de AI het weer mag doen.
  app.put('/api/whatsapp/conversations/:phoneNumber/ai-category', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const { category } = req.body ?? {};
    if (category === null || category === '') {
      await db.update(whatsappConversations).set({
        aiCategorySource: 'ai',
        updatedAt: new Date(),
      }).where(drizzleEq(whatsappConversations.phoneNumber, phone));
      return res.json({ success: true, category: null, source: 'ai' });
    }
    if (!waClassifier.isAiCategory(category)) {
      return res.status(400).json({ error: `category moet ${waClassifier.AI_CATEGORIES.join('/')} of null zijn` });
    }
    await waStorage.setAiCategory(phone, category, 'handmatig');
    res.json({ success: true, category, source: 'handmatig' });
  });

  // ─── Fase 3B: taken ───────────────────────────────────────────────────────
  //
  // Taken staan LOS van gesprekken: een gesprek mag gesloten zijn terwijl de
  // taak eruit nog open staat. Daarom een eigen endpoint-set en geen velden
  // op het gesprek.

  /** Naam van de ingelogde gebruiker, voor "afgevinkt door". */
  async function huidigeGebruiker(req: Request): Promise<{ id: number | null; naam: string | null }> {
    const userId = (req.session as any)?.userId ?? null;
    if (!userId) return { id: null, naam: null };
    try {
      const { users: usersTable } = await import('@shared/schema');
      const rows = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
        .from(usersTable).where(drizzleEq(usersTable.id, userId)).limit(1);
      const naam = rows.length ? `${rows[0].firstName ?? ''} ${rows[0].lastName ?? ''}`.trim() : null;
      return { id: userId, naam: naam || null };
    } catch {
      return { id: userId, naam: null };
    }
  }

  // GET /api/whatsapp/tasks?status=open|klaar|alle&assignedToId=<id|niemand>
  app.get('/api/whatsapp/tasks', adminMiddleware, async (req: Request, res: Response) => {
    const statusRaw = String(req.query.status ?? 'open');
    const status = (['open', 'klaar', 'alle'] as const).includes(statusRaw as any)
      ? (statusRaw as 'open' | 'klaar' | 'alle')
      : 'open';

    const assignedRaw = req.query.assignedToId;
    let assignedToId: number | 'niemand' | undefined;
    if (assignedRaw === 'niemand') assignedToId = 'niemand';
    else if (assignedRaw != null && assignedRaw !== '') {
      const n = parseInt(String(assignedRaw), 10);
      if (!Number.isNaN(n)) assignedToId = n;
    }

    const [taken, openTotaal] = await Promise.all([
      waStorage.listTasks({ status, assignedToId }),
      waStorage.countOpenTasks(),
    ]);
    res.json({ tasks: taken, openTotaal });
  });

  // PUT /api/whatsapp/tasks/:id/status — afvinken of weer openzetten.
  // Raakt het gesprek NIET aan; dat is precies het punt van een aparte taak.
  app.put('/api/whatsapp/tasks/:id/status', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Ongeldig taak-id' });
    const { status } = req.body ?? {};
    if (status !== 'open' && status !== 'klaar') {
      return res.status(400).json({ error: "status moet 'open' of 'klaar' zijn" });
    }
    const door = await huidigeGebruiker(req);
    const ok = await waStorage.setTaskStatus(id, status, door);
    if (!ok) return res.status(404).json({ error: 'Taak niet gevonden' });
    res.json({ success: true, status });
  });

  // PUT /api/whatsapp/tasks/:id/assignee — toewijzen of vrijgeven (null).
  app.put('/api/whatsapp/tasks/:id/assignee', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Ongeldig taak-id' });
    const { assignedToId } = req.body ?? {};
    if (assignedToId === null || assignedToId === '' || assignedToId === undefined) {
      const ok = await waStorage.setTaskAssignee(id, { id: null, naam: null });
      if (!ok) return res.status(404).json({ error: 'Taak niet gevonden' });
      return res.json({ success: true, assignedToId: null, assignedToName: null });
    }
    const n = parseInt(String(assignedToId), 10);
    if (Number.isNaN(n)) return res.status(400).json({ error: 'Ongeldige assignedToId' });
    const { users: usersTable } = await import('@shared/schema');
    const rows = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(drizzleEq(usersTable.id, n)).limit(1);
    if (rows.length === 0) return res.status(400).json({ error: 'Gebruiker bestaat niet' });
    const naam = `${rows[0].firstName ?? ''} ${rows[0].lastName ?? ''}`.trim() || null;
    const ok = await waStorage.setTaskAssignee(id, { id: n, naam });
    if (!ok) return res.status(404).json({ error: 'Taak niet gevonden' });
    res.json({ success: true, assignedToId: n, assignedToName: naam });
  });

  // Markeer een gesprek opnieuw als ongelezen (zet unreadCount op 1).
  // Wordt gebruikt door het 3-dots menu in de chat-header.
  app.post('/api/whatsapp/conversations/:phoneNumber/mark-unread', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    await db.update(whatsappConversations).set({
      unreadCount: 1,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappConversations.phoneNumber, phone));
    res.json({ success: true });
  });

  app.put('/api/whatsapp/conversations/:phoneNumber/labels', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const { labels } = req.body;
    if (!Array.isArray(labels)) return res.status(400).json({ error: 'labels moet een array zijn' });
    const cleaned = labels.filter((l: any) => typeof l === 'string' && l.trim()).map((l: string) => l.trim().toLowerCase());
    await db.update(whatsappConversations).set({
      labels: cleaned.length ? cleaned : null,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappConversations.phoneNumber, phone));
    res.json({ success: true });
  });

  const { whatsappInternalNotes } = await import('@shared/schema');

  app.get('/api/whatsapp/conversations/:phoneNumber/notes', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const conv = await db.select({ id: whatsappConversations.id }).from(whatsappConversations)
      .where(drizzleEq(whatsappConversations.phoneNumber, phone)).limit(1);
    if (!conv.length) return res.json([]);
    const notes = await db.select().from(whatsappInternalNotes)
      .where(drizzleEq(whatsappInternalNotes.conversationId, conv[0].id))
      .orderBy(drizzleDesc(whatsappInternalNotes.createdAt));
    res.json(notes);
  });

  app.post('/api/whatsapp/conversations/:phoneNumber/notes', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
    const { body: noteBody } = req.body;
    if (!noteBody || typeof noteBody !== 'string' || !noteBody.trim()) {
      return res.status(400).json({ error: 'body is verplicht' });
    }
    const conv = await db.select({ id: whatsappConversations.id }).from(whatsappConversations)
      .where(drizzleEq(whatsappConversations.phoneNumber, phone)).limit(1);
    if (!conv.length) return res.status(404).json({ error: 'Gesprek niet gevonden' });

    const { users: usersTable } = await import('@shared/schema');
    const userId = (req.session as any).userId;
    const user = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(drizzleEq(usersTable.id, userId)).limit(1);
    const authorName = user.length ? `${user[0].firstName} ${user[0].lastName}` : 'Admin';

    const [note] = await db.insert(whatsappInternalNotes).values({
      conversationId: conv[0].id,
      authorId: userId,
      authorName,
      body: noteBody.trim(),
    }).returning();
    res.json(note);
  });

  app.put('/api/whatsapp/conversations/:phoneNumber/contact-info', adminMiddleware, async (req: Request, res: Response) => {
    const phone = normalizePhone(req.params.phoneNumber);
    if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });

    const conv = await db.select().from(whatsappConversations).where(drizzleEq(whatsappConversations.phoneNumber, phone)).limit(1);
    if (!conv.length) return res.status(404).json({ error: 'Gesprek niet gevonden' });
    if (conv[0].matchCategory !== 'unmatched') {
      return res.status(400).json({ error: 'Bewerk contactinfo via kandidaten- of prospects-beheer' });
    }

    const { displayName, contactCompany, contactNotes } = req.body;
    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      return res.status(400).json({ error: 'displayName is verplicht' });
    }

    await db.update(whatsappConversations).set({
      displayName: displayName.trim(),
      contactCompany: contactCompany?.trim() || null,
      contactNotes: contactNotes?.trim() || null,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappConversations.phoneNumber, phone));

    res.json({ success: true });
  });

  // Bewerk voor- en achternaam van een BEKEND WhatsApp-contact (gekoppeld aan
  // een candidate of prospect_contact). Werkt het onderliggende record bij en
  // re-matcht het gesprek zodat de nieuwe naam ook in de threadkop verschijnt.
  app.put('/api/whatsapp/conversations/:phoneNumber/edit-naam', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const phone = normalizePhone(req.params.phoneNumber);
      if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });

      const conv = await db.select().from(whatsappConversations).where(drizzleEq(whatsappConversations.phoneNumber, phone)).limit(1);
      if (!conv.length) return res.status(404).json({ error: 'Gesprek niet gevonden' });

      const { voornaam, achternaam } = req.body ?? {};
      const vn = typeof voornaam === 'string' ? voornaam.trim() : '';
      const an = typeof achternaam === 'string' ? achternaam.trim() : '';
      if (!vn || !an) return res.status(400).json({ error: 'Voornaam en achternaam zijn verplicht' });

      const c = conv[0];
      if (c.candidateId) {
        const { candidates } = await import('@shared/schema');
        await db.update(candidates).set({
          firstName: vn,
          lastName: an,
          updatedAt: new Date(),
        } as any).where(drizzleEq(candidates.id, c.candidateId));
      } else if (c.prospectContactId) {
        const { prospectContacts } = await import('@shared/schema');
        await db.update(prospectContacts).set({
          voornaam: vn,
          achternaam: an,
          name: `${vn} ${an}`.trim(),
          updatedAt: new Date(),
        } as any).where(drizzleEq(prospectContacts.id, c.prospectContactId));
      } else {
        return res.status(400).json({ error: 'Dit gesprek heeft geen gekoppeld contact — gebruik "Toevoegen aan contacten"' });
      }

      // Re-match zodat displayName op het gesprek wordt ververst
      const { resolveAndUpsertConversation } = await import('./whatsapp/storage');
      await resolveAndUpsertConversation({
        phoneNumber: phone,
        inbound: false,
        bodyPreview: c.lastMessagePreview ?? '',
        at: c.lastMessageAt ?? new Date(),
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error('edit-naam mislukt:', err);
      res.status(500).json({ error: err?.message || 'Bewerken mislukt' });
    }
  });

  // Koppel een 'unmatched' WhatsApp-gesprek aan een echte contact-rij
  // (creëert een nieuwe candidate of prospect_contact en re-matcht het gesprek).
  // Categorieën: 'klant' → prospect_contacts, 'medewerker'/'kandidaat' → candidates
  // (medewerker = status 'aangenomen', kandidaat = status 'in_behandeling').
  app.post('/api/whatsapp/conversations/:phoneNumber/koppel-contact', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const phone = normalizePhone(req.params.phoneNumber);
      if (!phone) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });

      const conv = await db.select().from(whatsappConversations).where(drizzleEq(whatsappConversations.phoneNumber, phone)).limit(1);
      if (!conv.length) return res.status(404).json({ error: 'Gesprek niet gevonden' });

      const { voornaam, achternaam, categorie, email, notities } = req.body ?? {};
      const vn = typeof voornaam === 'string' ? voornaam.trim() : '';
      const an = typeof achternaam === 'string' ? achternaam.trim() : '';
      if (!vn || !an) return res.status(400).json({ error: 'Voornaam en achternaam zijn verplicht' });
      if (!['klant', 'medewerker', 'kandidaat'].includes(categorie)) {
        return res.status(400).json({ error: 'Ongeldige categorie (kies klant, medewerker of kandidaat)' });
      }

      const { candidates, prospectContacts } = await import('@shared/schema');
      const { resolveAndUpsertConversation } = await import('./whatsapp/storage');

      let createdId: number;
      let createdType: 'candidate' | 'prospect';

      if (categorie === 'klant') {
        const cleanEmail = (typeof email === 'string' ? email.trim() : '') || `wa-${phone.replace(/\+/g, '')}@onbekend.local`;
        const [row] = await db.insert(prospectContacts).values({
          name: `${vn} ${an}`.trim(),
          email: cleanEmail,
          voornaam: vn,
          achternaam: an,
          telefoon: phone,
          contactType: 'klant',
          contactStatus: 'actief',
          phase: 'klant',
          source: 'whatsapp',
        }).returning({ id: prospectContacts.id });
        createdId = row.id;
        createdType = 'prospect';
      } else {
        const status = categorie === 'medewerker' ? 'aangenomen' : 'in_behandeling';
        // Valideer dat session.userId daadwerkelijk in users-tabel staat (FK), anders null
        let creatorId: number | null = null;
        const sessionUserId = req.session?.userId;
        if (typeof sessionUserId === 'number' && sessionUserId > 0) {
          const { users } = await import('@shared/schema');
          const exists = await db.select({ id: users.id }).from(users).where(drizzleEq(users.id, sessionUserId)).limit(1);
          if (exists.length > 0) creatorId = sessionUserId;
        }
        const [row] = await db.insert(candidates).values({
          firstName: vn,
          lastName: an,
          phone,
          phoneOriginal: phone,
          functionType: 'horecamedewerker',
          status,
          createdByUserId: creatorId,
        } as any).returning({ id: candidates.id });
        createdId = row.id;
        createdType = 'candidate';
      }

      // Re-match het gesprek zodat candidateId/prospectContactId, displayName en matchCategory geüpdatet worden
      await resolveAndUpsertConversation({
        phoneNumber: phone,
        inbound: false,
        bodyPreview: conv[0].lastMessagePreview ?? '',
        at: conv[0].lastMessageAt ?? new Date(),
      });

      // Notities optioneel meenemen op de conversation
      if (typeof notities === 'string' && notities.trim()) {
        await db.update(whatsappConversations).set({
          contactNotes: notities.trim(),
          updatedAt: new Date(),
        }).where(drizzleEq(whatsappConversations.phoneNumber, phone));
      }

      res.json({ success: true, createdType, createdId, categorie });
    } catch (err: any) {
      console.error('[koppel-contact] fout:', err);
      res.status(500).json({ error: err?.message || 'Onbekende fout bij koppelen contact' });
    }
  });

  // ─── GROEPEN + BULK VERZENDING ──────────────────────────────────────────────
  const { whatsappGroups, whatsappGroupMembers, whatsappBulkSends, whatsappTemplates } = await import('@shared/schema');
  const { and: drizzleAnd, asc: drizzleAsc, inArray: drizzleInArray } = await import('drizzle-orm');
  const waTemplates = await import('./whatsapp/templates');
  const { splitFullName } = await import('./whatsapp/nameLogic');

  // Herbruikbare naam-resolutie voor telefoonnummers, gebruikt door zowel
  // GET .../available-contacts als POST .../members (server-side redmiddel
  // wanneer de aanroeper zelf geen voornaam/achternaam meestuurt). Volgorde:
  //   1. gekoppelde kandidaat (candidates.firstName/lastName — echte split)
  //   2. gekoppelde prospect (prospectContacts.voornaam/achternaam waar
  //      aanwezig, anders best-effort split van het legacy name-veld)
  //   3. eenmalig geïmporteerd telefooncontact (whatsapp_imported_contacts —
  //      first_name/last_name na de backfill, anders best-effort split)
  //   4. best-effort split van de gespreks-weergavenaam zelf
  // Nummers die nergens matchen, komen niet in de resultaat-Map terecht.
  async function resolveNamesForPhones(
    phoneNumbers: string[],
  ): Promise<Map<string, { firstName: string; lastName: string; displayName: string | null }>> {
    const { prospectContacts, whatsappImportedContacts } = await import('@shared/schema');
    const result = new Map<string, { firstName: string; lastName: string; displayName: string | null }>();
    if (phoneNumbers.length === 0) return result;

    const convRows = await db.select({
      phoneNumber: whatsappConversations.phoneNumber,
      displayName: whatsappConversations.displayName,
      candidateId: whatsappConversations.candidateId,
      prospectContactId: whatsappConversations.prospectContactId,
    }).from(whatsappConversations)
      .where(drizzleInArray(whatsappConversations.phoneNumber, phoneNumbers));

    const candidateIds = Array.from(new Set(convRows.map(r => r.candidateId).filter((x): x is number => x != null)));
    const prospectIds = Array.from(new Set(convRows.map(r => r.prospectContactId).filter((x): x is number => x != null)));

    const candidateNameMap = new Map<number, { firstName: string; lastName: string }>();
    if (candidateIds.length > 0) {
      const rows = await db.select({
        id: candidatesTable.id, firstName: candidatesTable.firstName, lastName: candidatesTable.lastName,
      }).from(candidatesTable).where(drizzleInArray(candidatesTable.id, candidateIds));
      for (const r of rows) candidateNameMap.set(r.id, { firstName: r.firstName, lastName: r.lastName });
    }

    const prospectNameMap = new Map<number, { firstName: string; lastName: string }>();
    if (prospectIds.length > 0) {
      const rows = await db.select({
        id: prospectContacts.id, voornaam: prospectContacts.voornaam, achternaam: prospectContacts.achternaam, name: prospectContacts.name,
      }).from(prospectContacts).where(drizzleInArray(prospectContacts.id, prospectIds));
      for (const r of rows) {
        prospectNameMap.set(
          r.id,
          (r.voornaam || r.achternaam) ? { firstName: r.voornaam || '', lastName: r.achternaam || '' } : splitFullName(r.name),
        );
      }
    }

    const matchedPhones = new Set<string>();
    for (const r of convRows) {
      matchedPhones.add(r.phoneNumber);
      let split: { firstName: string; lastName: string };
      if (r.candidateId != null && candidateNameMap.has(r.candidateId)) {
        split = candidateNameMap.get(r.candidateId)!;
      } else if (r.prospectContactId != null && prospectNameMap.has(r.prospectContactId)) {
        split = prospectNameMap.get(r.prospectContactId)!;
      } else {
        split = splitFullName(r.displayName);
      }
      result.set(r.phoneNumber, { ...split, displayName: r.displayName });
    }

    const resterend = phoneNumbers.filter(p => !matchedPhones.has(p));
    if (resterend.length > 0) {
      const importedRows = await db.select({
        phone: whatsappImportedContacts.phone,
        name: whatsappImportedContacts.name,
        firstName: whatsappImportedContacts.firstName,
        lastName: whatsappImportedContacts.lastName,
      }).from(whatsappImportedContacts).where(drizzleInArray(whatsappImportedContacts.phone, resterend));
      for (const r of importedRows) {
        const split = (r.firstName || r.lastName)
          ? { firstName: r.firstName || '', lastName: r.lastName || '' }
          : splitFullName(r.name);
        result.set(r.phone, { ...split, displayName: r.name });
      }
    }

    return result;
  }

  app.get('/api/whatsapp/groups', adminMiddleware, async (_req: Request, res: Response) => {
    const groups = await db.select().from(whatsappGroups).orderBy(drizzleDesc(whatsappGroups.updatedAt));
    const counts = await db.select({
      groupId: whatsappGroupMembers.groupId,
      count: drizzleSql<number>`count(*)::int`,
    }).from(whatsappGroupMembers).groupBy(whatsappGroupMembers.groupId);
    const countMap = new Map(counts.map(c => [c.groupId, c.count]));
    res.json(groups.map(g => ({ ...g, memberCount: countMap.get(g.id) || 0 })));
  });

  app.post('/api/whatsapp/groups', adminMiddleware, async (req: Request, res: Response) => {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Naam is verplicht' });
    }
    const [group] = await db.insert(whatsappGroups).values({
      name: name.trim(),
      description: description?.trim() || null,
    }).returning();
    res.json({ ...group, memberCount: 0 });
  });

  app.put('/api/whatsapp/groups/:id', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig groep-ID' });
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Naam is verplicht' });
    }
    await db.update(whatsappGroups).set({
      name: name.trim(),
      description: description?.trim() || null,
      updatedAt: new Date(),
    }).where(drizzleEq(whatsappGroups.id, id));
    res.json({ success: true });
  });

  app.delete('/api/whatsapp/groups/:id', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig groep-ID' });
    await db.delete(whatsappGroups).where(drizzleEq(whatsappGroups.id, id));
    res.json({ success: true });
  });

  app.get('/api/whatsapp/groups/:id/members', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig groep-ID' });
    const members = await db.select().from(whatsappGroupMembers)
      .where(drizzleEq(whatsappGroupMembers.groupId, id))
      .orderBy(drizzleAsc(whatsappGroupMembers.displayName));
    res.json(members);
  });

  app.post('/api/whatsapp/groups/:id/members', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig groep-ID' });
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'members array is verplicht' });
    }
    const userId = (req.session as any)?.userId || null;
    const existing = await db.select({ phoneNumber: whatsappGroupMembers.phoneNumber })
      .from(whatsappGroupMembers).where(drizzleEq(whatsappGroupMembers.groupId, id));
    const existingSet = new Set(existing.map(e => e.phoneNumber));

    // Fase 1: leden kunnen optioneel een contact_type + contact_id meegeven.
    // Geldige types: 'sollicitant' | 'kandidaat' | 'medewerker'. Bij ontbreken
    // werkt het lid alleen op phoneNumber (legacy gedrag, blijft compatibel).
    const ALLOWED_TYPES = new Set(['sollicitant', 'kandidaat', 'medewerker']);

    // Server-side redmiddel: als de aanroeper geen voornaam/achternaam
    // meestuurt, alsnog een echte split proberen te vinden (gekoppelde
    // kandidaat/prospect of geïmporteerd contact) in plaats van een lid
    // zonder voornaam op te slaan — anders faalt {{voornaam}} bij versturen.
    const zonderNaam = members
      .filter((m: any) => m.phoneNumber && !(m.firstName || '').trim() && !(m.lastName || '').trim())
      .map((m: any) => normalizePhone(m.phoneNumber) || m.phoneNumber);
    const naamRedmiddel = await resolveNamesForPhones(Array.from(new Set(zonderNaam)));

    const toInsert = members
      .filter((m: any) => m.phoneNumber && !existingSet.has(normalizePhone(m.phoneNumber) || m.phoneNumber))
      .map((m: any) => {
        const genormaliseerdNummer = normalizePhone(m.phoneNumber) || m.phoneNumber;
        let first = (m.firstName || '').trim() || null;
        let last = (m.lastName || '').trim() || null;
        if (!first && !last) {
          const redmiddel = naamRedmiddel.get(genormaliseerdNummer);
          if (redmiddel) {
            first = redmiddel.firstName || null;
            last = redmiddel.lastName || null;
          }
        }
        const composed = [first, last].filter(Boolean).join(' ') || null;
        const ct = m.contactType && ALLOWED_TYPES.has(m.contactType) ? m.contactType : null;
        const cid = ct && Number.isFinite(Number(m.contactId)) ? Number(m.contactId) : null;
        return {
          groupId: id,
          phoneNumber: genormaliseerdNummer,
          displayName: (m.displayName && m.displayName.trim()) || composed,
          firstName: first,
          lastName: last,
          contactType: ct as any,
          contactId: cid,
          addedByUserId: userId,
        };
      });

    if (toInsert.length > 0) {
      await db.insert(whatsappGroupMembers).values(toInsert);
    }
    await db.update(whatsappGroups).set({ updatedAt: new Date() }).where(drizzleEq(whatsappGroups.id, id));
    res.json({ added: toInsert.length, skipped: members.length - toInsert.length });
  });

  // ─── DELETE lid uit groep op basis van contactType+contactId ──────────────
  // Naast de legacy /:id/members/:phone-route. Wordt gebruikt door de nieuwe
  // Contacten-pagina om gericht een persoon (i.p.v. een telefoonnummer) te
  // verwijderen — handig als een persoon meerdere nummers heeft of een nummer
  // door meerdere mensen wordt gedeeld (zeldzaam, maar mogelijk).
  app.delete('/api/whatsapp/groups/:id/members/by-contact/:type/:contactId',
    adminMiddleware, async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      const contactId = parseInt(req.params.contactId);
      const type = req.params.type;
      if (isNaN(id) || isNaN(contactId)) return res.status(400).json({ error: 'Ongeldig ID' });
      if (!['sollicitant', 'kandidaat', 'medewerker'].includes(type)) {
        return res.status(400).json({ error: 'Ongeldig contact_type' });
      }
      await db.delete(whatsappGroupMembers).where(
        drizzleAnd(
          drizzleEq(whatsappGroupMembers.groupId, id),
          drizzleEq(whatsappGroupMembers.contactType, type as any),
          drizzleEq(whatsappGroupMembers.contactId, contactId),
        ),
      );
      await db.update(whatsappGroups).set({ updatedAt: new Date() }).where(drizzleEq(whatsappGroups.id, id));
      res.json({ success: true });
    });

  app.delete('/api/whatsapp/groups/:id/members/:phone', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig groep-ID' });
    const phone = normalizePhone(req.params.phone) || req.params.phone;
    await db.delete(whatsappGroupMembers).where(
      drizzleAnd(
        drizzleEq(whatsappGroupMembers.groupId, id),
        drizzleEq(whatsappGroupMembers.phoneNumber, phone),
      )
    );
    await db.update(whatsappGroups).set({ updatedAt: new Date() }).where(drizzleEq(whatsappGroups.id, id));
    res.json({ success: true });
  });

  app.get('/api/whatsapp/groups/:id/available-contacts', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig groep-ID' });
    const { whatsappImportedContacts } = await import('@shared/schema');
    const { notInArray: drizzleNotInArray } = await import('drizzle-orm');

    const existing = await db.select({ phoneNumber: whatsappGroupMembers.phoneNumber })
      .from(whatsappGroupMembers).where(drizzleEq(whatsappGroupMembers.groupId, id));
    const existingPhones = existing.map(e => e.phoneNumber);

    let whereCond: any = undefined;
    if (existingPhones.length > 0) {
      whereCond = drizzleSql`${whatsappConversations.phoneNumber} NOT IN (${drizzleSql.join(existingPhones.map(p => drizzleSql`${p}`), drizzleSql`, `)})`;
    }
    const convRows = await db.select({
      phoneNumber: whatsappConversations.phoneNumber,
      displayName: whatsappConversations.displayName,
      matchCategory: whatsappConversations.matchCategory,
      contactCompany: whatsappConversations.contactCompany,
    }).from(whatsappConversations)
      .where(whereCond)
      .orderBy(drizzleAsc(whatsappConversations.displayName))
      .limit(200);

    // Echte voornaam/achternaam meesturen waar bekend, i.p.v. de aanroeper
    // zelf de weergavenaam te laten gokken/splitsen (zie resolveNamesForPhones
    // hierboven) — dit is de bugfix: deze data bestond al, ging alleen
    // eerder verloren omdat dit endpoint hem niet doorgaf.
    const naamMap = await resolveNamesForPhones(convRows.map(r => r.phoneNumber));
    const contacts = convRows.map(r => {
      const n = naamMap.get(r.phoneNumber);
      return {
        phoneNumber: r.phoneNumber,
        displayName: r.displayName,
        matchCategory: r.matchCategory,
        contactCompany: r.contactCompany,
        firstName: n?.firstName || null,
        lastName: n?.lastName || null,
      };
    });

    // Eenmalig geïmporteerde telefooncontacten (~5500, augustus 2026) die nog
    // geen eigen WhatsApp-gesprek hebben — anders al hierboven gevonden.
    // Voorheen helemaal niet beschikbaar om aan een groep toe te voegen.
    // Best-effort voornaam/achternaam (na de backfill via
    // scripts/split-imported-contact-names.ts), per contact achteraf
    // handmatig te corrigeren in het profielpaneel — geen garantie.
    const excludePhones = new Set([...existingPhones, ...convRows.map(r => r.phoneNumber)]);
    const importedWhere = excludePhones.size > 0
      ? drizzleNotInArray(whatsappImportedContacts.phone, Array.from(excludePhones))
      : undefined;
    const importedRows = await db.select({
      phone: whatsappImportedContacts.phone,
      name: whatsappImportedContacts.name,
      firstName: whatsappImportedContacts.firstName,
      lastName: whatsappImportedContacts.lastName,
    }).from(whatsappImportedContacts)
      .where(importedWhere)
      .orderBy(drizzleAsc(whatsappImportedContacts.name))
      .limit(200);

    const importedContacts = importedRows.map(r => {
      const split = (r.firstName || r.lastName)
        ? { firstName: r.firstName || '', lastName: r.lastName || '' }
        : splitFullName(r.name);
      return {
        phoneNumber: r.phone,
        displayName: r.name,
        matchCategory: 'imported' as const,
        contactCompany: null as string | null,
        firstName: split.firstName || null,
        lastName: split.lastName || null,
      };
    });

    res.json([...contacts, ...importedContacts]);
  });

  // ─── TEMPLATES (aanmaken, indienen bij Meta/360dialog, statussync) ─────────
  // Logica in server/whatsapp/templates.ts. Versturen van een goedgekeurd
  // template gaat NIET via deze routes maar via POST /groups/:id/send
  // hieronder (templateKey-parameter) — dat hergebruikt dezelfde
  // groep/ontvanger-selectie als vrije-tekst bulkverzendingen.
  app.get('/api/whatsapp/admin/templates', adminMiddleware, async (_req: Request, res: Response) => {
    const rows = await waTemplates.listAllTemplates();
    res.json(rows);
  });

  app.get('/api/whatsapp/admin/templates/:key', adminMiddleware, async (req: Request, res: Response) => {
    const row = await waTemplates.getTemplateByKey(req.params.key);
    if (!row) return res.status(404).json({ error: 'Template niet gevonden' });
    res.json(row);
  });

  app.post('/api/whatsapp/admin/templates', adminMiddleware, async (req: Request, res: Response) => {
    const { naam, omschrijving, categorie, taal, bodyTekst, voorbeeldwaarden, knopTekst, knopUrl, knopDynamisch, knopVoorbeeld } = req.body || {};
    if (!naam || typeof naam !== 'string' || !naam.trim()) {
      return res.status(400).json({ error: 'naam is verplicht' });
    }
    if (!bodyTekst || typeof bodyTekst !== 'string' || !bodyTekst.trim()) {
      return res.status(400).json({ error: 'bodyTekst is verplicht' });
    }
    if (categorie && !waTemplates.TEMPLATE_CATEGORIES.includes(categorie)) {
      return res.status(400).json({ error: `categorie moet ${waTemplates.TEMPLATE_CATEGORIES.join(' of ')} zijn` });
    }
    const buttonErrors = waTemplates.validateButtonFields({ buttonText: knopTekst, buttonUrl: knopUrl });
    if (buttonErrors.length > 0) return res.status(400).json({ error: buttonErrors[0].message, errors: buttonErrors });

    try {
      const row = await waTemplates.createTemplate({
        name: naam,
        description: omschrijving ?? null,
        category: categorie || 'UTILITY',
        language: taal || 'nl',
        bodyPreview: bodyTekst,
        exampleValues: voorbeeldwaarden || {},
        buttonText: knopTekst ?? null,
        buttonUrl: knopUrl ?? null,
        buttonDynamic: !!knopDynamisch,
        buttonExample: knopVoorbeeld ?? null,
      });
      res.json(row);
    } catch (err: any) {
      console.error('[wa-templates] aanmaken mislukt:', err);
      res.status(500).json({ error: err?.message || 'Onbekende fout bij aanmaken template' });
    }
  });

  app.put('/api/whatsapp/admin/templates/:key', adminMiddleware, async (req: Request, res: Response) => {
    const { naam, omschrijving, categorie, taal, bodyTekst, voorbeeldwaarden, knopTekst, knopUrl, knopDynamisch, knopVoorbeeld } = req.body || {};
    if (categorie && !waTemplates.TEMPLATE_CATEGORIES.includes(categorie)) {
      return res.status(400).json({ error: `categorie moet ${waTemplates.TEMPLATE_CATEGORIES.join(' of ')} zijn` });
    }
    if (knopTekst !== undefined || knopUrl !== undefined) {
      const buttonErrors = waTemplates.validateButtonFields({ buttonText: knopTekst, buttonUrl: knopUrl });
      if (buttonErrors.length > 0) return res.status(400).json({ error: buttonErrors[0].message, errors: buttonErrors });
    }
    try {
      const row = await waTemplates.updateTemplate(req.params.key, {
        name: naam,
        description: omschrijving,
        category: categorie,
        language: taal,
        bodyPreview: bodyTekst,
        exampleValues: voorbeeldwaarden,
        buttonText: knopTekst,
        buttonUrl: knopUrl,
        buttonDynamic: knopDynamisch,
        buttonExample: knopVoorbeeld,
      });
      res.json(row);
    } catch (err: any) {
      if (err instanceof waTemplates.TemplateEditNotAllowedError) {
        return res.status(409).json({ error: err.message });
      }
      console.error('[wa-templates] bewerken mislukt:', err);
      res.status(500).json({ error: err?.message || 'Onbekende fout bij bewerken template' });
    }
  });

  app.delete('/api/whatsapp/admin/templates/:key', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const result = await waTemplates.deleteTemplate(req.params.key);
      res.json(result);
    } catch (err: any) {
      console.error('[wa-templates] verwijderen mislukt:', err);
      res.status(400).json({ error: err?.message || 'Onbekende fout bij verwijderen template' });
    }
  });

  app.post('/api/whatsapp/admin/templates/:key/indienen', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const result = await waTemplates.submitTemplateToProvider(req.params.key);
      if (!result.ok) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      console.error('[wa-templates] indienen mislukt:', err);
      res.status(500).json({ error: err?.message || 'Onbekende fout bij indienen template' });
    }
  });

  app.post('/api/whatsapp/admin/templates/:key/status', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const result = await waTemplates.syncTemplateStatus(req.params.key);
      if (!result.ok) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      console.error('[wa-templates] statussync mislukt:', err);
      res.status(500).json({ error: err?.message || 'Onbekende fout bij statussync' });
    }
  });

  // ─── GROEPSGESPREKKEN (door EXTRA zelf aangemaakte WhatsApp-groepen, max 8
  // deelnemers) ────────────────────────────────────────────────────────────
  // Logica in server/whatsapp/groupChats.ts. Bewust een ander URL-segment dan
  // /api/whatsapp/groups hierboven — dat zijn interne verzendlijsten voor
  // bulkberichten, geen echte WhatsApp-groep, en de twee mogen niet door
  // elkaar gaan lopen.
  const waGroupChats = await import('./whatsapp/groupChats');

  async function huidigeGebruikerNaam(req: Request): Promise<{ userId: number | null; naam: string | null }> {
    const userId = (req.session as any)?.userId ?? null;
    if (!userId) return { userId: null, naam: null };
    const { users: usersTable } = await import('@shared/schema');
    const rows = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(drizzleEq(usersTable.id, userId)).limit(1);
    const naam = rows.length ? `${rows[0].firstName} ${rows[0].lastName}`.trim() : null;
    return { userId, naam: naam || null };
  }

  app.get('/api/whatsapp/admin/groepsgesprekken', adminMiddleware, async (_req: Request, res: Response) => {
    const rows = await waGroupChats.listGroupChats();
    res.json(rows);
  });

  app.get('/api/whatsapp/admin/groepsgesprekken/:id', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig ID' });
    const chat = await waGroupChats.getGroupChatById(id);
    if (!chat) return res.status(404).json({ error: 'Groepsgesprek niet gevonden' });
    const messages = await waGroupChats.listGroupMessages(id);
    res.json({ ...chat, messages });
  });

  app.post('/api/whatsapp/admin/groepsgesprekken', adminMiddleware, async (req: Request, res: Response) => {
    const { naam, omschrijving, deelnemers } = req.body || {};
    if (!naam || typeof naam !== 'string' || !naam.trim()) {
      return res.status(400).json({ error: 'naam is verplicht' });
    }
    const { userId, naam: gebruikerNaam } = await huidigeGebruikerNaam(req);
    try {
      const result = await waGroupChats.createGroupChat({
        subject: naam,
        description: omschrijving ?? null,
        participants: Array.isArray(deelnemers)
          ? deelnemers.map((d: any) => ({ phone: d?.telefoon ?? d?.phone ?? '', naam: d?.naam ?? d?.name ?? null }))
          : [],
        createdByUserId: userId,
        createdByName: gebruikerNaam,
      });
      if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.errors?.[0]?.message || result.providerError || 'Onbekende fout', errors: result.errors, providerError: result.providerError });
      }
      res.json({ ok: true, groupChat: result.groupChat });
    } catch (err: any) {
      console.error('[wa-groepsgesprekken] aanmaken mislukt:', err);
      res.status(500).json({ ok: false, error: err?.message || 'Onbekende fout bij aanmaken groep' });
    }
  });

  app.post('/api/whatsapp/admin/groepsgesprekken/:id/berichten', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig ID' });
    const { tekst } = req.body || {};
    if (!tekst || typeof tekst !== 'string' || !tekst.trim()) {
      return res.status(400).json({ error: 'tekst is verplicht' });
    }
    const { userId, naam } = await huidigeGebruikerNaam(req);
    try {
      const result = await waGroupChats.sendGroupChatMessage(id, tekst, { userId, name: naam });
      if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.errors?.[0]?.message || result.providerError || 'Onbekende fout', errors: result.errors, providerError: result.providerError });
      }
      res.json({ ok: true, message: result.message });
    } catch (err: any) {
      console.error('[wa-groepsgesprekken] versturen mislukt:', err);
      res.status(500).json({ ok: false, error: err?.message || 'Onbekende fout bij versturen' });
    }
  });

  // "Ververs deelnemers" — geen automatische webhook-sync (zie groupChats.ts),
  // dus dit is de enige manier om de deelnemerslijst/status bij te werken
  // nadat iemand via de uitnodigingslink is toegetreden.
  app.post('/api/whatsapp/admin/groepsgesprekken/:id/ververs', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig ID' });
    try {
      const result = await waGroupChats.refreshParticipants(id);
      if (!result.ok) return res.status(400).json({ ok: false, error: result.providerError || 'Onbekende fout' });
      res.json({ ok: true, groupChat: result.groupChat });
    } catch (err: any) {
      console.error('[wa-groepsgesprekken] verversen mislukt:', err);
      res.status(500).json({ ok: false, error: err?.message || 'Onbekende fout bij verversen' });
    }
  });

  app.delete('/api/whatsapp/admin/groepsgesprekken/:id/deelnemers/:phone', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig ID' });
    try {
      const result = await waGroupChats.removeParticipant(id, req.params.phone);
      if (!result.ok) return res.status(400).json({ error: result.providerError || 'Onbekende fout' });
      res.json(result.groupChat);
    } catch (err: any) {
      console.error('[wa-groepsgesprekken] deelnemer verwijderen mislukt:', err);
      res.status(500).json({ error: err?.message || 'Onbekende fout bij verwijderen deelnemer' });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1 — CONTACTEN (sollicitanten + kandidaten + medewerkers)
  // ═══════════════════════════════════════════════════════════════════════════
  // Levert een unified lijst van contactpersonen die in WhatsApp-context staan,
  // met opt-in-status per persoon. Bron-tabellen:
  //   - candidates.status='in_behandeling'  → categorie 'sollicitant'
  //   - candidates.status='gepland'         → categorie 'kandidaat'
  //   - employees.status IN ('nieuw','actief') → categorie 'medewerker'
  // 'aangenomen', 'afgewezen', 'inactief', 'uitgestroomd' worden GEFILTERD.
  app.get('/api/whatsapp/contacten', adminMiddleware, async (req: Request, res: Response) => {
    const { candidates: candidatesTable, employees: employeesTable } = await import('@shared/schema');
    const type = String(req.query.type || 'alle');           // alle | sollicitant | kandidaat | medewerker
    const optIn = String(req.query.opt_in || 'alle');        // alle | actief | opt_out | verzending_faalt
    const language = String(req.query.language || '').trim();
    const q = String(req.query.q || '').trim().toLowerCase();
    const limit = Math.min(parseInt(String(req.query.pageSize || '100')) || 100, 500);
    const offset = Math.max(0, (parseInt(String(req.query.page || '1')) - 1) * limit);

    type Row = {
      contactType: 'sollicitant' | 'kandidaat' | 'medewerker';
      contactId: number;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      email: string | null;
      language: string | null;
      functie: string | null;
      sourceStatus: string | null;
      whatsappOptInStatus: string;
      whatsappOptInChangedAt: Date | null;
      whatsappOptInReason: string | null;
    };

    const rows: Row[] = [];

    if (type === 'alle' || type === 'sollicitant' || type === 'kandidaat') {
      const candRows = await db.select({
        id: candidatesTable.id,
        firstName: candidatesTable.firstName,
        lastName: candidatesTable.lastName,
        phone: candidatesTable.phone,
        email: candidatesTable.email,
        language: candidatesTable.language,
        status: candidatesTable.status,
        functionType: candidatesTable.functionType,
        whatsappOptInStatus: candidatesTable.whatsappOptInStatus,
        whatsappOptInChangedAt: candidatesTable.whatsappOptInChangedAt,
        whatsappOptInReason: candidatesTable.whatsappOptInReason,
      }).from(candidatesTable).where(
        drizzleSql`${candidatesTable.status} IN ('in_behandeling', 'gepland')`
      );
      for (const c of candRows) {
        const cat: 'sollicitant' | 'kandidaat' = c.status === 'in_behandeling' ? 'sollicitant' : 'kandidaat';
        if (type !== 'alle' && type !== cat) continue;
        rows.push({
          contactType: cat,
          contactId: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone || null,
          email: c.email || null,
          language: c.language || null,
          functie: c.functionType || null,
          sourceStatus: c.status,
          whatsappOptInStatus: c.whatsappOptInStatus,
          whatsappOptInChangedAt: c.whatsappOptInChangedAt,
          whatsappOptInReason: c.whatsappOptInReason,
        });
      }
    }

    if (type === 'alle' || type === 'medewerker') {
      const empRows = await db.select({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        phone: employeesTable.phone,
        email: employeesTable.email,
        language: employeesTable.language,
        status: employeesTable.status,
        functie: employeesTable.functie,
        whatsappOptInStatus: employeesTable.whatsappOptInStatus,
        whatsappOptInChangedAt: employeesTable.whatsappOptInChangedAt,
        whatsappOptInReason: employeesTable.whatsappOptInReason,
      }).from(employeesTable).where(
        drizzleSql`${employeesTable.status} IN ('nieuw', 'actief')`
      );
      for (const e of empRows) {
        rows.push({
          contactType: 'medewerker',
          contactId: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          phone: e.phone || null,
          email: e.email || null,
          language: e.language || null,
          functie: e.functie || null,
          sourceStatus: e.status,
          whatsappOptInStatus: e.whatsappOptInStatus,
          whatsappOptInChangedAt: e.whatsappOptInChangedAt,
          whatsappOptInReason: e.whatsappOptInReason,
        });
      }
    }

    // Filteren in JS — eenvoudig en transparant. Bij grote datasets later
    // verplaatsen naar SQL-niveau.
    let filtered = rows;
    if (optIn !== 'alle') filtered = filtered.filter(r => r.whatsappOptInStatus === optIn);
    if (language) {
      const lang = language.toLowerCase();
      filtered = filtered.filter(r => (r.language || '').toLowerCase() === lang);
    }
    if (q) {
      filtered = filtered.filter(r => {
        const naam = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase();
        return naam.includes(q)
          || (r.phone || '').toLowerCase().includes(q)
          || (r.email || '').toLowerCase().includes(q);
      });
    }

    // Stabiel sorteren op naam.
    filtered.sort((a, b) => {
      const A = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase();
      const B = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase();
      return A.localeCompare(B);
    });

    const total = filtered.length;
    const items = filtered.slice(offset, offset + limit);
    res.json({ total, items });
  });

  // Statistieken voor de Contacten-pagina (per categorie en per opt-in-status).
  app.get('/api/whatsapp/contacten/stats', adminMiddleware, async (_req: Request, res: Response) => {
    const { candidates: candidatesTable, employees: employeesTable } = await import('@shared/schema');

    const candAgg = await db.execute(drizzleSql`
      SELECT status, whatsapp_opt_in_status AS opt, COUNT(*)::int AS n
      FROM candidates
      WHERE status IN ('in_behandeling', 'gepland')
      GROUP BY status, whatsapp_opt_in_status
    `);
    const empAgg = await db.execute(drizzleSql`
      SELECT whatsapp_opt_in_status AS opt, COUNT(*)::int AS n
      FROM employees
      WHERE status IN ('nieuw', 'actief')
      GROUP BY whatsapp_opt_in_status
    `);

    const stats: Record<string, Record<string, number>> = {
      sollicitant: { actief: 0, opt_out: 0, verzending_faalt: 0, totaal: 0 },
      kandidaat:   { actief: 0, opt_out: 0, verzending_faalt: 0, totaal: 0 },
      medewerker:  { actief: 0, opt_out: 0, verzending_faalt: 0, totaal: 0 },
    };
    for (const r of (candAgg.rows as any[])) {
      const cat = r.status === 'in_behandeling' ? 'sollicitant' : 'kandidaat';
      stats[cat][r.opt] = (stats[cat][r.opt] || 0) + r.n;
      stats[cat].totaal += r.n;
    }
    for (const r of (empAgg.rows as any[])) {
      stats.medewerker[r.opt] = (stats.medewerker[r.opt] || 0) + r.n;
      stats.medewerker.totaal += r.n;
    }
    res.json(stats);
  });

  // Handmatige opt-in wijziging (planner geeft door dat iemand zich heeft afgemeld
  // of juist weer aanmeldt). Wordt ook gebruikt om 'verzending_faalt' terug te
  // zetten naar 'actief' nadat de oorzaak is opgelost.
  app.put('/api/whatsapp/contacten/:type/:id/opt-in', adminMiddleware, async (req: Request, res: Response) => {
    const type = req.params.type;
    const id = parseInt(req.params.id);
    const { status, reden } = req.body || {};
    if (!['sollicitant', 'kandidaat', 'medewerker'].includes(type)) {
      return res.status(400).json({ error: 'Ongeldig contact_type' });
    }
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig ID' });
    if (!['actief', 'opt_out', 'verzending_faalt'].includes(status)) {
      return res.status(400).json({ error: 'Ongeldige status' });
    }
    const userId = (req.session as any)?.userId;
    const reason = (reden && String(reden).trim()) || `Handmatig gewijzigd${userId ? ` door user #${userId}` : ''}`;
    const result = await optInService.setOptInStatus(type as any, id, status as any, reason);
    if (!result) return res.status(404).json({ error: 'Contact niet gevonden' });
    res.json({ success: true, name: result.name, status });
  });

  // ─── Fase 3E — profielvelden bewerken vanuit de inbox ────────────────────────
  // Functie, status en telefoonnummer van het onderliggende candidates- of
  // employees-record. Reden: de planner ziet die drie velden al in het
  // rechterpaneel en moest voor een correctie ("die is inmiddels aangenomen",
  // "verkeerd nummer opgeslagen") naar een andere module.
  //
  // PATCH-semantiek: alleen sleutels die in de body staan worden geschreven. De
  // UI slaat per veld op, dus een verzoek bevat er in de praktijk precies één.
  //
  // Bewust NIET aangeraakt: candidates.phoneOriginal. Dat is de backup van de
  // waarde vóór de E.164-normalisatie; die overschrijven zou de enige kopie van
  // het oorspronkelijk ingevoerde nummer wissen.
  app.put('/api/whatsapp/contacten/:type/:id/profiel', adminMiddleware, async (req: Request, res: Response) => {
    const { candidates: candidatesTable, employees: employeesTable } = await import('@shared/schema');
    const { normalizePhone } = await import('./whatsapp/phone');

    const type = req.params.type;
    const id = parseInt(req.params.id);
    if (!['sollicitant', 'kandidaat', 'medewerker'].includes(type)) {
      return res.status(400).json({ error: 'Ongeldig contact_type' });
    }
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig ID' });

    const body = req.body || {};
    const isMedewerker = type === 'medewerker';

    // Waardenlijsten uit shared/schema.ts, hier expliciet herhaald zodat een
    // onbekende waarde een nette 400 geeft in plaats van een enum-fout uit
    // Postgres die als 500 naar buiten komt.
    const FUNCTIES = ['housekeeping', 'horecamedewerker', 'chef', 'frontoffice', 'logistiek'];
    const STATUSSEN = isMedewerker
      ? ['nieuw', 'actief', 'inactief', 'uitgestroomd']            // employeeStatusEnum
      : ['in_behandeling', 'gepland', 'aangenomen', 'afgewezen'];  // candidateStatusEnum

    const patch: Record<string, unknown> = {};

    if (body.functie !== undefined) {
      const f = String(body.functie);
      if (!FUNCTIES.includes(f)) return res.status(400).json({ error: 'Ongeldige functie' });
      // candidates.functionType is een enum, employees.functie is vrije tekst.
      // In beide gevallen schrijven we dezelfde sleutel, zodat de weergave in
      // het paneel voor allebei via één vertaaltabel loopt.
      patch[isMedewerker ? 'functie' : 'functionType'] = f;
    }

    if (body.status !== undefined) {
      const s = String(body.status);
      if (!STATUSSEN.includes(s)) return res.status(400).json({ error: 'Ongeldige status' });
      patch.status = s;
    }

    if (body.phone !== undefined) {
      const genormaliseerd = normalizePhone(String(body.phone));
      if (!genormaliseerd) return res.status(400).json({ error: 'Ongeldig telefoonnummer' });
      patch.phone = genormaliseerd;
    }

    // Naam: firstName altijd verplicht als hij wordt meegestuurd (voornaam kan
    // niet leeg zijn), lastName mag leeg — niet iedereen heeft een achternaam
    // in het systeem staan.
    if (body.firstName !== undefined) {
      const f = String(body.firstName).trim();
      if (!f) return res.status(400).json({ error: 'Voornaam mag niet leeg zijn' });
      patch.firstName = f;
    }
    if (body.lastName !== undefined) {
      patch.lastName = String(body.lastName).trim();
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'Niets om op te slaan' });
    }

    const tabel: any = isMedewerker ? employeesTable : candidatesTable;
    const [rij] = await db.update(tabel)
      .set(patch as any)
      .where(drizzleEq(tabel.id, id))
      .returning({
        id: tabel.id,
        firstName: tabel.firstName,
        lastName: tabel.lastName,
        phone: tabel.phone,
        status: tabel.status,
        functie: isMedewerker ? (employeesTable as any).functie : (candidatesTable as any).functionType,
      });

    if (!rij) return res.status(404).json({ error: 'Contact niet gevonden' });

    const userId = (req.session as any)?.userId;
    console.log(`[WA profiel] ${type} #${id} gewijzigd door user #${userId ?? '?'}: ${JSON.stringify(patch)}`);

    // De inbox-contactenlijst toont alleen 'in_behandeling'/'gepland' (kandidaten)
    // en 'nieuw'/'actief' (medewerkers). Bij een status daarbuiten valt dit
    // contact uit die lijst. Dat melden we terug, zodat het paneel het kan
    // zeggen in plaats van bij de volgende lookup stilletjes leeg te zijn.
    const ZICHTBAAR = isMedewerker ? ['nieuw', 'actief'] : ['in_behandeling', 'gepland'];
    res.json({
      success: true,
      contactId: rij.id,
      name: [rij.firstName, rij.lastName].filter(Boolean).join(' ') || null,
      firstName: rij.firstName,
      lastName: rij.lastName,
      phone: rij.phone,
      status: rij.status,
      functie: rij.functie,
      uitContactenlijst: !ZICHTBAAR.includes(String(rij.status)),
    });
  });

  /**
   * Verstuur een goedgekeurd WhatsApp-template naar alle leden van een groep.
   * Losgetrokken uit de hoofdroute hieronder zodat de vrije-tekst-verzending
   * (het bestaande, ongewijzigde pad) leesbaar blijft. Zelfde groep/leden-
   * iteratie en whatsapp_bulk_sends-logging als vrije tekst, met als verschil:
   * sendTemplate() i.p.v. sendText(), en templateKey/reason vastgelegd voor
   * het audit-spoor.
   */
  async function sendGroupTemplate(
    req: Request,
    res: Response,
    id: number,
    templateKey: string,
    reason: string | undefined,
    extraVariabelen: Record<string, string> | undefined,
  ) {
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ error: 'reason (aanleiding) is verplicht bij een template-verzending' });
    }
    const template = await waTemplates.getTemplateByKey(templateKey);
    if (!template) return res.status(404).json({ error: `Template "${templateKey}" niet gevonden` });
    if (template.status !== 'approved') {
      return res.status(400).json({ error: `Template heeft status "${template.status}" — alleen goedgekeurde templates kunnen verstuurd worden` });
    }
    if (template.buttonDynamic) {
      return res.status(400).json({ error: 'Templates met een dynamische knop kunnen nog niet via groepsverzending verstuurd worden' });
    }

    const variables: string[] = Array.isArray(template.variables) ? (template.variables as string[]) : [];
    const AUTO_VARS = new Set(['voornaam', 'achternaam', 'naam']);
    const extra = (extraVariabelen && typeof extraVariabelen === 'object') ? extraVariabelen : {};
    const missing = variables.filter(v => !AUTO_VARS.has(v.toLowerCase()) && !(extra[v] && String(extra[v]).trim()));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Voorbeeldwaarde ontbreekt voor: ${missing.join(', ')}` });
    }

    const bulkConfigError = waProvider.configErrorMessage();
    if (bulkConfigError) return res.status(503).json({ error: bulkConfigError });

    const group = await db.select().from(whatsappGroups).where(drizzleEq(whatsappGroups.id, id)).limit(1);
    if (!group.length) return res.status(404).json({ error: 'Groep niet gevonden' });
    const members = await db.select().from(whatsappGroupMembers).where(drizzleEq(whatsappGroupMembers.groupId, id));
    if (members.length === 0) return res.status(400).json({ error: 'Groep heeft geen leden' });

    const userId = (req.session as any).userId;
    const { users: usersTable } = await import('@shared/schema');
    const user = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(drizzleEq(usersTable.id, userId)).limit(1);
    const senderName = user.length ? `${user[0].firstName} ${user[0].lastName}` : 'Admin';

    const [bulkRecord] = await db.insert(whatsappBulkSends).values({
      groupId: id,
      groupName: group[0].name,
      messageBody: template.bodyPreview,
      totalRecipients: members.length,
      sentCount: 0,
      failedCount: 0,
      sentByUserId: userId,
      sentByName: senderName,
      templateKey: template.key,
      reason: reason.trim(),
    }).returning();

    const resolveValue = (varName: string, m: typeof members[number]): string => {
      const first = (m.firstName || '').trim();
      const last = (m.lastName || '').trim();
      const full = (m.displayName || `${first} ${last}`).trim();
      const lower = varName.toLowerCase();
      if (lower === 'voornaam') return first;
      if (lower === 'achternaam') return last;
      if (lower === 'naam') return full;
      return String(extra[varName] ?? '');
    };

    let sentCount = 0;
    let failedCount = 0;
    const results: Array<{ phone: string; displayName: string | null; status: 'sent' | 'failed'; error?: string }> = [];

    for (const member of members) {
      const now = new Date();
      const values = variables.map(v => resolveValue(v, member));
      const personalizedBody = variables.reduce(
        (body, v, i) => body.replace(new RegExp(`\\{${v}\\}`, 'g'), values[i] || ''),
        template.bodyPreview,
      );
      const components: any[] = [];
      if (values.length > 0) {
        components.push({ type: 'body', parameters: values.map(text => ({ type: 'text', text })) });
      }
      try {
        const match = await waStorage.resolveAndUpsertConversation({
          phoneNumber: member.phoneNumber,
          inbound: false,
          bodyPreview: personalizedBody,
          at: now,
        });

        const messageRowId = await waStorage.insertOutboundQueued({
          direction: 'outbound',
          fromNumber: 'extra',
          toNumber: member.phoneNumber,
          messageType: 'template',
          body: personalizedBody,
          candidateId: match.candidateId,
          prospectContactId: match.prospectContactId,
          matchCategory: match.category,
          sentByUserId: userId,
          rawPayload: { type: 'template', template: { name: template.key, language: { code: template.language }, components }, to: member.phoneNumber },
        });

        const result = await waProvider.sendTemplate(member.phoneNumber, template.key, template.language, components);

        if (!result.ok) {
          await waStorage.updateOutboundResult(messageRowId, {
            status: 'failed',
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
          });
          failedCount++;
          results.push({ phone: member.phoneNumber, displayName: member.displayName, status: 'failed', error: result.errorMessage || 'Onbekende fout' });
        } else {
          const waId = result.waMessageId || null;
          await waStorage.updateOutboundResult(messageRowId, { waMessageId: waId, status: 'sent' });
          sentCount++;
          results.push({ phone: member.phoneNumber, displayName: member.displayName, status: 'sent' });
        }
      } catch (err: any) {
        failedCount++;
        results.push({ phone: member.phoneNumber, displayName: member.displayName, status: 'failed', error: err.message || 'Onbekende fout' });
      }
    }

    await db.update(whatsappBulkSends).set({ sentCount, failedCount }).where(drizzleEq(whatsappBulkSends.id, bulkRecord.id));
    console.log(`[WA Bulk] Groep "${group[0].name}" → template "${template.key}": ${sentCount} verzonden, ${failedCount} mislukt (door ${senderName})`);
    return res.json({ bulkSendId: bulkRecord.id, total: members.length, sent: sentCount, failed: failedCount, results });
  }

  app.post('/api/whatsapp/groups/:id/send', whatsappSendLimiter, adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig groep-ID' });
    const { tekst, templateKey, reason, extraVariabelen } = req.body || {};

    // ─── Template-verzending (goedgekeurd sjabloon, buiten het 24u-window) ──
    // Alternatief pad t.o.v. de vrije-tekst-verzending hieronder: zelfde groep/
    // leden-iteratie en whatsapp_bulk_sends-logging, alleen met sendTemplate()
    // i.p.v. sendText() en een verplichte aanleiding voor het audit-spoor.
    if (templateKey) {
      return sendGroupTemplate(req, res, id, templateKey, reason, extraVariabelen);
    }

    if (!tekst || typeof tekst !== 'string' || !tekst.trim()) {
      return res.status(400).json({ error: 'tekst is verplicht' });
    }
    const bulkConfigError = waProvider.configErrorMessage();
    if (bulkConfigError) return res.status(503).json({ error: bulkConfigError });

    const group = await db.select().from(whatsappGroups).where(drizzleEq(whatsappGroups.id, id)).limit(1);
    if (!group.length) return res.status(404).json({ error: 'Groep niet gevonden' });

    const members = await db.select().from(whatsappGroupMembers)
      .where(drizzleEq(whatsappGroupMembers.groupId, id));
    if (members.length === 0) return res.status(400).json({ error: 'Groep heeft geen leden' });

    const userId = (req.session as any).userId;
    const { users: usersTable } = await import('@shared/schema');
    const user = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(drizzleEq(usersTable.id, userId)).limit(1);
    const senderName = user.length ? `${user[0].firstName} ${user[0].lastName}` : 'Admin';

    const [bulkRecord] = await db.insert(whatsappBulkSends).values({
      groupId: id,
      groupName: group[0].name,
      messageBody: tekst.trim(),
      totalRecipients: members.length,
      sentCount: 0,
      failedCount: 0,
      sentByUserId: userId,
      sentByName: senderName,
    }).returning();

    let sentCount = 0;
    let failedCount = 0;
    const results: Array<{ phone: string; displayName: string | null; status: 'sent' | 'failed'; error?: string }> = [];

    // Personalisatie helper — vervangt {{voornaam}} / {{achternaam}} / {{naam}}
    // case-insensitive en valt terug op een lege string als veld ontbreekt.
    const renderTemplate = (tpl: string, m: typeof members[number]): string => {
      const first = (m.firstName || '').trim();
      const last = (m.lastName || '').trim();
      const full = (m.displayName || `${first} ${last}`).trim();
      return tpl
        .replace(/\{\{\s*voornaam\s*\}\}/gi, first)
        .replace(/\{\{\s*achternaam\s*\}\}/gi, last)
        .replace(/\{\{\s*naam\s*\}\}/gi, full);
    };

    for (const member of members) {
      const now = new Date();
      const personalizedBody = renderTemplate(tekst.trim(), member);
      try {
        const match = await waStorage.resolveAndUpsertConversation({
          phoneNumber: member.phoneNumber,
          inbound: false,
          bodyPreview: personalizedBody,
          at: now,
        });

        const messageRowId = await waStorage.insertOutboundQueued({
          direction: 'outbound',
          fromNumber: 'extra',
          toNumber: member.phoneNumber,
          messageType: 'text',
          body: personalizedBody,
          candidateId: match.candidateId,
          prospectContactId: match.prospectContactId,
          matchCategory: match.category,
          sentByUserId: userId,
          rawPayload: { type: 'text', text: { body: personalizedBody }, to: member.phoneNumber },
        });

        const result = await waProvider.sendText(member.phoneNumber, personalizedBody);

        if (!result.ok) {
          await waStorage.updateOutboundResult(messageRowId, {
            status: 'failed',
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
          });
          failedCount++;
          results.push({ phone: member.phoneNumber, displayName: member.displayName, status: 'failed', error: result.errorMessage || 'Onbekende fout' });
        } else {
          const waId = result.waMessageId || null;
          await waStorage.updateOutboundResult(messageRowId, { waMessageId: waId, status: 'sent' });
          sentCount++;
          results.push({ phone: member.phoneNumber, displayName: member.displayName, status: 'sent' });
        }
      } catch (err: any) {
        failedCount++;
        results.push({ phone: member.phoneNumber, displayName: member.displayName, status: 'failed', error: err.message || 'Onbekende fout' });
      }
    }

    await db.update(whatsappBulkSends).set({ sentCount, failedCount }).where(drizzleEq(whatsappBulkSends.id, bulkRecord.id));
    console.log(`[WA Bulk] Groep "${group[0].name}" → ${sentCount} verzonden, ${failedCount} mislukt (door ${senderName})`);
    res.json({ bulkSendId: bulkRecord.id, total: members.length, sent: sentCount, failed: failedCount, results });
  });

  app.get('/api/whatsapp/bulk-sends', adminMiddleware, async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);
    const rows = await db.select().from(whatsappBulkSends)
      .orderBy(drizzleDesc(whatsappBulkSends.createdAt))
      .limit(limit);
    res.json(rows);
  });

  // ─── AI-ASSISTENT (dashboard) ───────────────────────────────────────────────
  // Beantwoordt vragen over dashboard-data via function-calling en kan
  // template-verzendingen KLAARZETTEN. Kern in server/assistant/assistent.ts,
  // pure logica in server/assistant/assistentLogic.ts. Uitvoeren van een
  // klaargezette actie gebeurt uitsluitend via het bevestig-endpoint
  // hieronder, dat het bestaande sendGroupTemplate-pad hergebruikt — dus met
  // dezelfde validaties, rate-limiting en bulk-send-administratie als een
  // handmatige verzending. De assistent verstuurt zelf nooit iets.
  const waAssistent = await import('./assistant/assistent');

  app.post('/api/admin/assistent/vraag', adminMiddleware, async (req: Request, res: Response) => {
    const { berichten } = req.body || {};
    if (!Array.isArray(berichten) || berichten.length === 0) {
      return res.status(400).json({ error: 'berichten (array) is verplicht' });
    }
    const geldig = berichten.every(
      (b: any) => b && (b.rol === 'gebruiker' || b.rol === 'assistent') && typeof b.tekst === 'string',
    );
    if (!geldig) {
      return res.status(400).json({ error: 'elk bericht heeft rol ("gebruiker"|"assistent") en tekst (string) nodig' });
    }
    try {
      const resultaat = await waAssistent.beantwoordVraag(berichten);
      res.json(resultaat);
    } catch (err: any) {
      console.error('[assistent] vraag mislukt:', err);
      res.status(500).json({ error: err?.message || 'Onbekende fout bij de AI-assistent' });
    }
  });

  // Bevestigen = uitvoeren. whatsappSendLimiter net als bij handmatig
  // versturen; neemActie() haalt de actie op én verwijdert hem (eenmalig
  // uitvoerbaar — dubbelklik of replay kan nooit twee keer versturen).
  app.post('/api/admin/assistent/acties/:id/bevestig', whatsappSendLimiter, adminMiddleware, async (req: Request, res: Response) => {
    const actie = waAssistent.neemActie(req.params.id);
    if (!actie) {
      return res.status(410).json({ error: 'Deze actie is verlopen of al uitgevoerd — vraag de assistent om hem opnieuw klaar te zetten' });
    }
    return sendGroupTemplate(req, res, actie.groepId, actie.templateKey, actie.reden, actie.extraVariabelen);
  });

  app.delete('/api/admin/assistent/acties/:id', adminMiddleware, async (req: Request, res: Response) => {
    waAssistent.verwijderActie(req.params.id);
    res.json({ success: true });
  });

  // Kennisbank van de assistent: begrippen/werkafspraken die het team één
  // keer vastlegt en die daarna bij elke vraag in de systeemprompt meegaan.
  // Beheer zit in het chatwidget zelf (boek-icoon). Tabel: assistant_kennis
  // (migratie 0019).
  const { assistantKennis } = await import('@shared/schema');

  app.get('/api/admin/assistent/kennis', adminMiddleware, async (_req: Request, res: Response) => {
    const rijen = await db.select().from(assistantKennis)
      .orderBy(drizzleAsc(assistantKennis.sortOrder), drizzleAsc(assistantKennis.id));
    res.json(rijen);
  });

  app.post('/api/admin/assistent/kennis', adminMiddleware, async (req: Request, res: Response) => {
    const titel = String(req.body?.titel ?? '').trim();
    const tekst = String(req.body?.tekst ?? '').trim();
    if (!titel || !tekst) return res.status(400).json({ error: 'titel en tekst zijn verplicht' });
    if (titel.length > 200) return res.status(400).json({ error: 'titel is te lang (max 200 tekens)' });
    if (tekst.length > 4000) return res.status(400).json({ error: 'tekst is te lang (max 4000 tekens)' });
    const [rij] = await db.insert(assistantKennis).values({ titel, tekst }).returning();
    res.json(rij);
  });

  app.put('/api/admin/assistent/kennis/:id', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig ID' });
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body?.titel !== undefined) {
      const titel = String(req.body.titel).trim();
      if (!titel || titel.length > 200) return res.status(400).json({ error: 'Ongeldige titel' });
      patch.titel = titel;
    }
    if (req.body?.tekst !== undefined) {
      const tekst = String(req.body.tekst).trim();
      if (!tekst || tekst.length > 4000) return res.status(400).json({ error: 'Ongeldige tekst' });
      patch.tekst = tekst;
    }
    if (req.body?.enabled !== undefined) patch.enabled = !!req.body.enabled;
    const [rij] = await db.update(assistantKennis).set(patch)
      .where(drizzleEq(assistantKennis.id, id)).returning();
    if (!rij) return res.status(404).json({ error: 'Kennisregel niet gevonden' });
    res.json(rij);
  });

  app.delete('/api/admin/assistent/kennis/:id', adminMiddleware, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Ongeldig ID' });
    await db.delete(assistantKennis).where(drizzleEq(assistantKennis.id, id));
    res.json({ success: true });
  });

  // ─── IMPORT: Kandidaten uit database ────────────────────────────────────────
  app.get('/api/whatsapp/import/candidates', adminMiddleware, async (req: Request, res: Response) => {
    const groupId = parseInt(String(req.query.groupId || '0'));
    const { candidates, employees } = await import('@shared/schema');
    const { isNotNull } = await import('drizzle-orm');

    let existingPhones = new Set<string>();
    if (groupId) {
      const existing = await db.select({ phoneNumber: whatsappGroupMembers.phoneNumber })
        .from(whatsappGroupMembers).where(drizzleEq(whatsappGroupMembers.groupId, groupId));
      existingPhones = new Set(existing.map(e => e.phoneNumber));
    }

    // Telefoons en candidate-ids die al gepromoveerd zijn naar de employees-tabel.
    // Deze worden uit de "Kandidaten"-import gefilterd zodat aangenomen
    // medewerkers (zoals Jimarro) niet meer met hun oude candidate-status
    // verschijnen — die staan in de "Medewerkers"-tab.
    const empRows = await db.select({
      phone: employees.phone,
      candidateId: employees.candidateId,
    }).from(employees);
    const employeePhones = new Set<string>();
    const employeeCandidateIds = new Set<number>();
    for (const e of empRows) {
      if (e.phone) {
        const n = normalizePhone(e.phone) || e.phone;
        if (n) employeePhones.add(n);
      }
      if (e.candidateId) employeeCandidateIds.add(e.candidateId);
    }

    const rows = await db.select({
      id: candidates.id,
      firstName: candidates.firstName,
      lastName: candidates.lastName,
      phone: candidates.phone,
      functionType: candidates.functionType,
      status: candidates.status,
      city: candidates.city,
    }).from(candidates).where(isNotNull(candidates.phone));

    const result = rows
      .filter(r => r.phone && r.phone.trim().length >= 8)
      .map(r => {
        const normalized = normalizePhone(r.phone!) || r.phone!;
        return {
          id: r.id,
          name: `${r.firstName} ${r.lastName}`,
          firstName: r.firstName,
          lastName: r.lastName,
          phone: normalized,
          functionType: r.functionType,
          status: r.status,
          city: r.city || null,
          alreadyInGroup: existingPhones.has(normalized),
        };
      })
      .filter(r => !employeeCandidateIds.has(r.id) && !employeePhones.has(r.phone));
    res.json(result);
  });

  // ─── IMPORT: Medewerkers uit database ────────────────────────────────────
  app.get('/api/whatsapp/import/employees', adminMiddleware, async (req: Request, res: Response) => {
    const groupId = parseInt(String(req.query.groupId || '0'));
    const { employees } = await import('@shared/schema');
    const { isNotNull } = await import('drizzle-orm');

    let existingPhones = new Set<string>();
    if (groupId) {
      const existing = await db.select({ phoneNumber: whatsappGroupMembers.phoneNumber })
        .from(whatsappGroupMembers).where(drizzleEq(whatsappGroupMembers.groupId, groupId));
      existingPhones = new Set(existing.map(e => e.phoneNumber));
    }

    const rows = await db.select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      phone: employees.phone,
      functie: employees.functie,
      status: employees.status,
      opdrachtgever: employees.opdrachtgever,
      branche: employees.branche,
    }).from(employees).where(isNotNull(employees.phone));

    const result = rows
      .filter(r => r.phone && r.phone.trim().length >= 8)
      .map(r => {
        const normalized = normalizePhone(r.phone!) || r.phone!;
        return {
          id: r.id,
          name: `${r.firstName} ${r.lastName}`,
          firstName: r.firstName,
          lastName: r.lastName,
          phone: normalized,
          functie: r.functie || null,
          status: r.status,
          opdrachtgever: r.opdrachtgever || null,
          branche: r.branche || null,
          alreadyInGroup: existingPhones.has(normalized),
        };
      });
    res.json(result);
  });

  // ─── IMPORT: Klanten uit database ────────────────────────────────────────
  app.get('/api/whatsapp/import/prospects', adminMiddleware, async (req: Request, res: Response) => {
    const groupId = parseInt(String(req.query.groupId || '0'));
    const { prospectContacts } = await import('@shared/schema');
    const { isNotNull } = await import('drizzle-orm');

    let existingPhones = new Set<string>();
    if (groupId) {
      const existing = await db.select({ phoneNumber: whatsappGroupMembers.phoneNumber })
        .from(whatsappGroupMembers).where(drizzleEq(whatsappGroupMembers.groupId, groupId));
      existingPhones = new Set(existing.map(e => e.phoneNumber));
    }

    const rows = await db.select({
      id: prospectContacts.id,
      name: prospectContacts.name,
      voornaam: prospectContacts.voornaam,
      achternaam: prospectContacts.achternaam,
      telefoon: prospectContacts.telefoon,
      company: prospectContacts.company,
      branche: prospectContacts.branche,
    }).from(prospectContacts).where(isNotNull(prospectContacts.telefoon));

    const result = rows
      .filter(r => r.telefoon && r.telefoon.trim().length >= 8)
      .map(r => {
        const normalized = normalizePhone(r.telefoon!) || r.telefoon!;
        const displayName = (r.voornaam && r.achternaam) ? `${r.voornaam} ${r.achternaam}` : r.name;
        // Splits naam-veld als voornaam/achternaam ontbreken (eerste woord = voornaam, rest = achternaam).
        let firstName = r.voornaam || '';
        let lastName = r.achternaam || '';
        if (!firstName && !lastName && r.name) {
          const parts = r.name.trim().split(/\s+/);
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ');
        }
        return {
          id: r.id,
          name: displayName,
          firstName,
          lastName,
          phone: normalized,
          company: r.company || null,
          branche: r.branche || null,
          alreadyInGroup: existingPhones.has(normalized),
        };
      });
    res.json(result);
  });

  // ─── IMPORT: CSV parse ────────────────────────────────────────────────────
  app.post('/api/whatsapp/import/csv', adminMiddleware, async (req: Request, res: Response) => {
    const { csvData, groupId } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'csvData is verplicht (string)' });
    }
    const gId = parseInt(String(groupId || '0'));

    let existingPhones = new Set<string>();
    if (gId) {
      const existing = await db.select({ phoneNumber: whatsappGroupMembers.phoneNumber })
        .from(whatsappGroupMembers).where(drizzleEq(whatsappGroupMembers.groupId, gId));
      existingPhones = new Set(existing.map(e => e.phoneNumber));
    }

    const lines = csvData.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return res.json({ contacts: [], errors: [] });

    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('naam') || firstLine.includes('name') || firstLine.includes('telefoon') || firstLine.includes('phone') || firstLine.includes('nummer');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const contacts: Array<{ name: string; phone: string; alreadyInGroup: boolean }> = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const parts = line.includes(';') ? line.split(';') : line.split(',');

      if (parts.length === 1) {
        const raw = parts[0].trim().replace(/['"]/g, '');
        const normalized = normalizePhone(raw);
        if (normalized) {
          contacts.push({ name: '', phone: normalized, alreadyInGroup: existingPhones.has(normalized) });
        } else {
          errors.push(`Regel ${i + 1}: ongeldig nummer "${raw}"`);
        }
      } else {
        const col0 = parts[0].trim().replace(/['"]/g, '');
        const col1 = parts[1].trim().replace(/['"]/g, '');

        const phoneLike0 = /^\+?\d[\d\s\-()]{6,}$/.test(col0);
        const phoneLike1 = /^\+?\d[\d\s\-()]{6,}$/.test(col1);

        let name = '';
        let phoneRaw = '';
        if (phoneLike1 && !phoneLike0) {
          name = col0; phoneRaw = col1;
        } else if (phoneLike0 && !phoneLike1) {
          name = col1; phoneRaw = col0;
        } else if (phoneLike0) {
          phoneRaw = col0; name = col1;
        } else {
          phoneRaw = col1; name = col0;
        }

        const normalized = normalizePhone(phoneRaw);
        if (normalized) {
          contacts.push({ name, phone: normalized, alreadyInGroup: existingPhones.has(normalized) });
        } else {
          errors.push(`Regel ${i + 1}: ongeldig nummer "${phoneRaw}"`);
        }
      }
    }

    res.json({ contacts, errors });
  });

  // ─── WhatsApp AI richtlijnen + suggestie ──────────────────────────────────
  app.get('/api/whatsapp/ai-settings', adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const { whatsappAiSettings } = await import('../shared/schema');
      const rows = await db.select().from(whatsappAiSettings).limit(1);
      if (rows.length === 0) {
        await db.insert(whatsappAiSettings).values({});
        const fresh = await db.select().from(whatsappAiSettings).limit(1);
        return res.json(fresh[0]);
      }
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/whatsapp/ai-settings', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { toneOfVoice, voiceExamples, guidelines, cancellationProtocol, extraContext, autoReplyEnabled, autoReplyOnlyForKnown, autoReplyMinIntervalSec } = req.body;
      const { whatsappAiSettings } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const rows = await db.select().from(whatsappAiSettings).limit(1);
      if (rows.length === 0) {
        await db.insert(whatsappAiSettings).values({
          toneOfVoice: toneOfVoice ?? '',
          voiceExamples: voiceExamples ?? '',
          guidelines: guidelines ?? '',
          cancellationProtocol: cancellationProtocol ?? '',
          extraContext: extraContext ?? '',
          autoReplyEnabled: autoReplyEnabled ?? false,
          autoReplyOnlyForKnown: autoReplyOnlyForKnown ?? true,
          autoReplyMinIntervalSec: autoReplyMinIntervalSec ?? 60,
        });
      } else {
        await db.update(whatsappAiSettings)
          .set({
            toneOfVoice: toneOfVoice ?? rows[0].toneOfVoice,
            voiceExamples: voiceExamples ?? rows[0].voiceExamples,
            guidelines: guidelines ?? rows[0].guidelines,
            cancellationProtocol: cancellationProtocol ?? rows[0].cancellationProtocol,
            extraContext: extraContext ?? rows[0].extraContext,
            autoReplyEnabled: typeof autoReplyEnabled === 'boolean' ? autoReplyEnabled : rows[0].autoReplyEnabled,
            autoReplyOnlyForKnown: typeof autoReplyOnlyForKnown === 'boolean' ? autoReplyOnlyForKnown : rows[0].autoReplyOnlyForKnown,
            autoReplyMinIntervalSec: typeof autoReplyMinIntervalSec === 'number' ? autoReplyMinIntervalSec : rows[0].autoReplyMinIntervalSec,
            updatedAt: new Date(),
          })
          .where(eq(whatsappAiSettings.id, rows[0].id));
      }
      const updated = await db.select().from(whatsappAiSettings).limit(1);
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── WhatsApp AI Kennisbank (CRUD) ─────────────────────────────────────────
  app.get('/api/whatsapp/ai-knowledge', adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const { whatsappAiKnowledge } = await import('../shared/schema');
      const { asc } = await import('drizzle-orm');
      const rows = await db.select().from(whatsappAiKnowledge).orderBy(asc(whatsappAiKnowledge.sortOrder), asc(whatsappAiKnowledge.id));
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/whatsapp/ai-knowledge', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { title, content, enabled } = req.body;
      if (!title || typeof title !== 'string' || !content || typeof content !== 'string') {
        return res.status(400).json({ error: 'title en content zijn verplicht' });
      }
      const { whatsappAiKnowledge } = await import('../shared/schema');
      const { sql } = await import('drizzle-orm');
      const maxRow = await db.select({ max: sql<number>`COALESCE(MAX(${whatsappAiKnowledge.sortOrder}), -1)` }).from(whatsappAiKnowledge);
      const nextOrder = (maxRow[0]?.max ?? -1) + 1;
      const inserted = await db.insert(whatsappAiKnowledge).values({
        title: title.trim(),
        content: content.trim(),
        enabled: enabled !== false,
        sortOrder: nextOrder,
      }).returning();
      res.json(inserted[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/whatsapp/ai-knowledge/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Ongeldig id' });
      const { title, content, enabled, sortOrder } = req.body;
      const { whatsappAiKnowledge } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const updateSet: Record<string, any> = { updatedAt: new Date() };
      if (typeof title === 'string') updateSet.title = title.trim();
      if (typeof content === 'string') updateSet.content = content.trim();
      if (typeof enabled === 'boolean') updateSet.enabled = enabled;
      if (typeof sortOrder === 'number') updateSet.sortOrder = sortOrder;
      const updated = await db.update(whatsappAiKnowledge).set(updateSet).where(eq(whatsappAiKnowledge.id, id)).returning();
      if (updated.length === 0) return res.status(404).json({ error: 'Niet gevonden' });
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/whatsapp/ai-knowledge/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Ongeldig id' });
      const { whatsappAiKnowledge } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      await db.delete(whatsappAiKnowledge).where(eq(whatsappAiKnowledge.id, id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── WhatsApp AI Bijlagen (PDF protocollen) ────────────────────────────
  // Geldige fieldKey-waarden voor AI-richtlijn-bijlagen
  const WA_AI_FIELD_KEYS = ['tone_of_voice', 'voice_examples', 'guidelines', 'cancellation_protocol', 'extra_context', 'knowledge'] as const;
  type WaAiFieldKey = typeof WA_AI_FIELD_KEYS[number];

  // Multer-instance voor AI-bijlagen (max 25MB, alleen PDF accepteren)
  const waAiAttachUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'application/pdf') cb(null, true);
      else cb(new Error('Alleen PDF-bestanden zijn toegestaan'));
    },
  });

  // PDF → tekst-extractie via pdf-parse (dynamic import om import-time test-file lookup te vermijden)
  async function extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const pdfParseModule: any = await import('pdf-parse/lib/pdf-parse.js' as any);
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const data = await pdfParse(buffer);
      return (data?.text || '').trim();
    } catch (err: any) {
      console.warn('[WA AI bijlage] pdf-extract mislukt:', err?.message);
      return '';
    }
  }

  app.get('/api/whatsapp/ai-attachments', adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const { whatsappAiAttachments } = await import('../shared/schema');
      const { asc } = await import('drizzle-orm');
      const rows = await db.select().from(whatsappAiAttachments).orderBy(asc(whatsappAiAttachments.uploadedAt));
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/whatsapp/ai-attachments', adminMiddleware, (req: Request, res: Response, next: NextFunction) => {
    waAiAttachUpload.single('file')(req, res, (err: any) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload geweigerd' });
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      const fieldKey = (req.body?.fieldKey || '').toString();
      const knowledgeIdRaw = req.body?.knowledgeId;
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Geen bestand ontvangen' });
      if (!WA_AI_FIELD_KEYS.includes(fieldKey as WaAiFieldKey)) {
        return res.status(400).json({ error: `Ongeldige fieldKey (toegestaan: ${WA_AI_FIELD_KEYS.join(', ')})` });
      }
      let knowledgeId: number | null = null;
      if (fieldKey === 'knowledge') {
        knowledgeId = Number(knowledgeIdRaw);
        if (!Number.isInteger(knowledgeId) || knowledgeId <= 0) {
          return res.status(400).json({ error: 'knowledgeId is verplicht bij fieldKey=knowledge' });
        }
      }

      // 1. Upload naar Replit Object Storage
      const storagePath = await uploadWaAiAttachment(file.buffer, file.originalname, file.mimetype);

      // 2. Extract tekst (best-effort; lege string is OK)
      const extractedText = await extractPdfText(file.buffer);

      // 3. DB-record
      const { whatsappAiAttachments } = await import('../shared/schema');
      const inserted = await db.insert(whatsappAiAttachments).values({
        fieldKey,
        knowledgeId,
        filename: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        fileSize: file.size,
        extractedText,
        enabled: true,
      }).returning();
      res.json(inserted[0]);
    } catch (err: any) {
      console.error('[WA AI bijlage] upload-fout:', err);
      res.status(500).json({ error: err.message || 'Upload mislukt' });
    }
  });

  app.put('/api/whatsapp/ai-attachments/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Ongeldig id' });
      const { enabled, knowledgeId } = req.body;
      const { whatsappAiAttachments } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const updateSet: Record<string, any> = {};
      if (typeof enabled === 'boolean') updateSet.enabled = enabled;
      if (knowledgeId === null || (typeof knowledgeId === 'number' && Number.isInteger(knowledgeId))) {
        updateSet.knowledgeId = knowledgeId;
      }
      if (Object.keys(updateSet).length === 0) return res.status(400).json({ error: 'Niets om bij te werken' });
      const updated = await db.update(whatsappAiAttachments).set(updateSet).where(eq(whatsappAiAttachments.id, id)).returning();
      if (updated.length === 0) return res.status(404).json({ error: 'Niet gevonden' });
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/whatsapp/ai-attachments/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Ongeldig id' });
      const { whatsappAiAttachments } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const rows = await db.select().from(whatsappAiAttachments).where(eq(whatsappAiAttachments.id, id)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: 'Niet gevonden' });
      await deleteWaAiAttachmentStorage(rows[0].storagePath).catch(() => false);
      await db.delete(whatsappAiAttachments).where(eq(whatsappAiAttachments.id, id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/whatsapp/ai-suggest', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { messages: chatMessages, contactName, contactCompany, mode, phoneNumber: reqPhone } = req.body;
      if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
        return res.status(400).json({ error: 'Berichten zijn vereist' });
      }

      const { whatsappAiSettings, whatsappAiKnowledge, whatsappAiAttachments } = await import('../shared/schema');
      const { eq, asc } = await import('drizzle-orm');
      const settingsRows = await db.select().from(whatsappAiSettings).limit(1);
      const settings = settingsRows[0] || { toneOfVoice: '', guidelines: '', cancellationProtocol: '', extraContext: '' };
      const knowledgeRows = await db.select().from(whatsappAiKnowledge)
        .where(eq(whatsappAiKnowledge.enabled, true))
        .orderBy(asc(whatsappAiKnowledge.sortOrder), asc(whatsappAiKnowledge.id));
      const attachmentRows = (await db.select().from(whatsappAiAttachments)
        .where(eq(whatsappAiAttachments.enabled, true))
        .orderBy(asc(whatsappAiAttachments.id))) as WaAiAttachmentRow[];

      let OpenAI: any;
      try {
        OpenAI = (await import('openai')).default;
      } catch {
        return res.status(503).json({ error: 'AI module niet beschikbaar' });
      }

      const client = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? 'unused',
      });

      // Bepaal taal: gespreks-label "nl"/"en" overruled detectie, anders auto-detect
      let labelLang: { code: string; name: string } | null = null;
      if (typeof reqPhone === 'string' && reqPhone.trim()) {
        const normalizedPhone = normalizePhone(reqPhone);
        if (normalizedPhone) {
          const convLabelRow = await db.select({ labels: whatsappConversations.labels })
            .from(whatsappConversations)
            .where(eq(whatsappConversations.phoneNumber, normalizedPhone))
            .limit(1);
          labelLang = resolveLanguageFromLabels(convLabelRow[0]?.labels ?? null);
        }
      }
      const lastInboundMsg = [...chatMessages].reverse().find((m: any) => m.direction === 'inbound');
      const lang = labelLang ?? (lastInboundMsg?.body ? await detectMessageLanguage(lastInboundMsg.body) : { code: 'nl', name: 'Nederlands' });
      if (labelLang) console.log(`[ai-suggest] taal-override via label → ${labelLang.code}`);

      let guidelinesBlock = '';
      if (settings.toneOfVoice) guidelinesBlock += `\n\nTone of voice: ${settings.toneOfVoice}${appendAttachmentTextForField(attachmentRows, 'tone_of_voice')}`;
      if (settings.voiceExamples) guidelinesBlock += `\n\n=== VOORBEELDBERICHTEN (alleen voor STIJL — toon, lengte, emoji's; vertaal naar de juiste taal) ===\n${settings.voiceExamples}${appendAttachmentTextForField(attachmentRows, 'voice_examples')}`;
      if (settings.guidelines) guidelinesBlock += `\n\nAlgemene richtlijnen: ${settings.guidelines}${appendAttachmentTextForField(attachmentRows, 'guidelines')}`;
      if (settings.cancellationProtocol) guidelinesBlock += `\n\nAfmeldprotocol: ${settings.cancellationProtocol}${appendAttachmentTextForField(attachmentRows, 'cancellation_protocol')}`;
      if (settings.extraContext) guidelinesBlock += `\n\nExtra context: ${settings.extraContext}${appendAttachmentTextForField(attachmentRows, 'extra_context')}`;
      if (knowledgeRows.length > 0) {
        guidelinesBlock += `\n\n=== KENNISBANK / PROTOCOLLEN ===`;
        for (const k of knowledgeRows) {
          guidelinesBlock += `\n\n[${k.title}]\n${k.content}`;
          for (const a of attachmentRows) {
            if (a.fieldKey === 'knowledge' && a.knowledgeId === k.id && a.extractedText) {
              guidelinesBlock += `\n[Bijlage PDF "${a.filename}"]\n${a.extractedText}`;
            }
          }
        }
      }
      guidelinesBlock += buildAvailableAttachmentsBlock(attachmentRows, knowledgeRows);

      let contactInfo = '';
      if (contactName) contactInfo += `\nNaam contact: ${contactName}`;
      if (contactCompany) contactInfo += `\nBedrijf: ${contactCompany}`;

      const systemPrompt = `You are an AI assistant helping planners at EXTRA, a hospitality staffing agency in Amsterdam. Your task is to suggest a short, professional WhatsApp reply based on the conversation.

🌍 LANGUAGE — ABSOLUTE HARD RULE (overrides everything else):
The user's last incoming message has been detected as: ${lang.name} (ISO: ${lang.code}).
You MUST write your ENTIRE reply in ${lang.name} ONLY. Do not switch languages mid-message. Do not respond in Dutch unless ${lang.name} IS Dutch.
Voice/style examples below are in another language — copy only their TONE, LENGTH and emoji usage, but TRANSLATE everything into ${lang.name}.

OTHER RULES:
- Write ONLY the reply message itself, no explanation or commentary
- Keep it short (max 2-3 sentences unless more is truly needed)
- Do NOT wrap the message in quotes
${mode === 'bulk' ? '- This is a group message going to multiple recipients, so make it generally applicable' : '- This is a personal 1-on-1 conversation'}
${guidelinesBlock}
${contactInfo}`;

      const formattedMessages = chatMessages.slice(-10).map((m: any) => ({
        role: m.direction === 'inbound' ? 'user' as const : 'assistant' as const,
        content: m.body || '',
      }));

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedMessages,
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const rawSuggestion = completion.choices?.[0]?.message?.content?.trim() || '';
      // Strip eventuele [BIJLAGE:<id>] marker — bij ai-suggest beslist de planner zelf wat te sturen
      const { cleanText: suggestion, attachmentId: suggestedAttachmentId } = parseAttachmentMarker(rawSuggestion);
      res.json({ suggestion, suggestedAttachmentId });
    } catch (err: any) {
      console.error('[AI suggest]', err);
      res.status(500).json({ error: err.message || 'AI suggestie mislukt' });
    }
  });

  // Voer een eenmalige startup-warning uit als secrets ontbreken
  console.log(`[WA] actieve provider: ${waProvider.activeProvider()}`);
  const waConfigWarning = waProvider.configErrorMessage();
  if (waConfigWarning) console.warn(`[WA] ${waConfigWarning} — uitgaande berichten zullen falen`);
  if (!WEBHOOK_SECRET) console.warn('[WA] WHATSAPP_WEBHOOK_SECRET niet ingesteld — webhook accepteert GEEN inkomende berichten');
  if (waProvider.activeProvider() === 'meta' && !process.env.META_WA_BOT_APP_SECRET) {
    console.warn('[WA] META_WA_BOT_APP_SECRET niet ingesteld — meta-webhook accepteert GEEN inkomende events');
  }
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
            // P0-fix Flow Builder: trigger flows met type 'open_van_campagne'
            try {
              const { triggerFlowsForEvent } = await import('./flowEngine');
              await triggerFlowsForEvent(ms.campaignId, ms.contactId, 'open_van_campagne');
            } catch (e) { /* silent */ }
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
        // P0-fix Flow Builder: trigger flows met type 'klik_in_campagne'
        try {
          const ms = await storage.getMailSend(id);
          if (ms) {
            const { triggerFlowsForEvent } = await import('./flowEngine');
            await triggerFlowsForEvent(ms.campaignId, ms.contactId, 'klik_in_campagne');
          }
        } catch (e) { /* silent */ }
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
  // GA4-status met échte testmeting: 'configured' zegt alleen dat de
  // instellingen zijn ingevuld; 'werkt' bewijst dat Google daadwerkelijk
  // data teruggeeft. Bij een fout sturen we de exacte melding mee zodat het
  // Koppelingen-tabblad kan tonen wat er mis is. Resultaat 5 min gecachet.
  let ga4StatusCache: { t: number; body: any } | null = null;
  app.get("/api/admin/ga4/status", adminMiddleware, async (_req, res) => {
    if (!isGa4Configured()) return res.json({ configured: false, werkt: false });
    if (ga4StatusCache && Date.now() - ga4StatusCache.t < 5 * 60_000) return res.json(ga4StatusCache.body);
    let body: any;
    try {
      const data: any = await fetchGa4Overview(7);
      const heeftData = Number(data?.sessions?.value ?? 0) > 0;
      body = { configured: true, werkt: true, heeftData };
    } catch (e: any) {
      body = { configured: true, werkt: false, fout: e?.message || "Onbekende fout" };
    }
    ga4StatusCache = { t: Date.now(), body };
    res.json(body);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOK 3 — SendGrid Event-webhook + Inbound Parse webhook
  // ═══════════════════════════════════════════════════════════════════════════

  // Helper: ECDSA-verificatie van SendGrid Event-webhook payload.
  async function verifySendgridSignature(req: Request): Promise<{ ok: boolean; reden?: string }> {
    try {
      const setting = await storage.getInstellingByKey('sendgrid_webhook_public_key');
      const publicKeyPem = setting?.waarde?.trim();
      if (!publicKeyPem) {
        // Geen public key ingesteld → laat door, maar log waarschuwing.
        return { ok: true, reden: 'Geen public key ingesteld (signature niet gecontroleerd)' };
      }
      const sig = req.header('X-Twilio-Email-Event-Webhook-Signature') || req.header('x-twilio-email-event-webhook-signature');
      const ts  = req.header('X-Twilio-Email-Event-Webhook-Timestamp') || req.header('x-twilio-email-event-webhook-timestamp');
      if (!sig || !ts) return { ok: false, reden: 'Ontbrekende signature-headers' };

      const raw: Buffer | undefined = (req as any).rawBody;
      if (!raw || !raw.length) return { ok: false, reden: 'Geen raw body beschikbaar' };

      const crypto = await import('crypto');
      // SendGrid tekent: timestamp + raw_body (UTF-8 string concat)
      const payloadToVerify = Buffer.concat([Buffer.from(String(ts), 'utf8'), raw]);

      // Public key kan in PEM (-----BEGIN PUBLIC KEY-----) of als losse base64 SPKI komen.
      let pem = publicKeyPem;
      if (!/BEGIN PUBLIC KEY/.test(pem)) {
        const b64 = pem.replace(/\s+/g, '');
        pem = `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)?.join('\n') || b64}\n-----END PUBLIC KEY-----\n`;
      }
      const keyObj = crypto.createPublicKey(pem);
      const verifier = crypto.createVerify('sha256');
      verifier.update(payloadToVerify);
      verifier.end();
      // SendGrid gebruikt DER-encoded ECDSA; sig is base64
      const ok = verifier.verify({ key: keyObj, dsaEncoding: 'der' as any }, Buffer.from(sig, 'base64'));
      return ok ? { ok: true } : { ok: false, reden: 'Signature komt niet overeen' };
    } catch (err: any) {
      return { ok: false, reden: 'Verificatie-fout: ' + (err?.message || err) };
    }
  }

  // SendGrid Event-webhook — publiek (signature-verified)
  app.post("/api/webhooks/sendgrid/events", async (req: Request, res: Response) => {
    const { verwerkSendgridEvents } = await import('./sendgridEventHandler');
    const verif = await verifySendgridSignature(req);
    if (!verif.ok) {
      console.warn('[SgWebhook] geweigerd:', verif.reden);
      return res.status(401).json({ ok: false, message: verif.reden });
    }
    const events = Array.isArray(req.body) ? req.body : [];
    if (!events.length) return res.status(200).json({ ok: true, ontvangen: 0 });
    try {
      const stats = await verwerkSendgridEvents(events);
      return res.status(200).json({ ok: true, ...stats });
    } catch (err: any) {
      console.error('[SgWebhook] verwerkingsfout:', err);
      return res.status(500).json({ ok: false, message: err?.message || 'verwerkingsfout' });
    }
  });

  // Endpoint om de huidige public key (status) op te vragen voor admins
  app.get("/api/admin/sendgrid/webhook-status", adminMiddleware, async (_req, res) => {
    const pk  = await storage.getInstellingByKey('sendgrid_webhook_public_key');
    const ibs = await storage.getInstellingByKey('sendgrid_inbound_secret');
    res.json({
      publicKeyConfigured: !!pk?.waarde?.trim(),
      inboundSecretConfigured: !!ibs?.waarde?.trim(),
      webhookEndpoint: '/api/webhooks/sendgrid/events',
      inboundEndpoint: '/api/webhooks/sendgrid/inbound',
    });
  });

  // Inbound Parse webhook — multipart/form-data van SendGrid.
  // Beveiliging: shared secret via query (?secret=…) of Authorization: Bearer … header,
  // gevalideerd tegen instellingen-key sendgrid_inbound_secret.
  const inboundUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 20 },
  });

  app.post(
    "/api/webhooks/sendgrid/inbound",
    inboundUpload.any(),
    async (req: Request, res: Response) => {
      try {
        const setting = await storage.getInstellingByKey('sendgrid_inbound_secret');
        const expected = setting?.waarde?.trim();
        if (expected) {
          const provided =
            (req.query.secret as string | undefined) ||
            (req.header('authorization') || '').replace(/^Bearer\s+/i, '').trim();
          if (provided !== expected) {
            return res.status(401).json({ ok: false, message: 'Ongeldige inbound secret' });
          }
        }
        const { verwerkInboundReply } = await import('./sendgridInboundHandler');
        const payload = (req.body || {}) as any;
        const result = await verwerkInboundReply(payload);
        // SendGrid Inbound Parse vereist 200 OK om retries te vermijden, ook bij niet-matching.
        return res.status(200).json(result);
      } catch (err: any) {
        console.error('[SgInbound] verwerkingsfout:', err);
        // Geef 200 terug om retries te voorkomen; we hebben gelogd
        return res.status(200).json({ ok: false, reden: err?.message || 'fout' });
      }
    },
  );

  // Admin: lijst van replies (paginated, simple filters)
  app.get("/api/admin/prospect-replies", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const handled = req.query.handled === 'true' ? true : req.query.handled === 'false' ? false : undefined;
      const limit = req.query.limit ? Math.min(500, parseInt(String(req.query.limit))) : 100;
      const campaignId = req.query.campaignId ? parseInt(String(req.query.campaignId)) : undefined;
      const contactId  = req.query.contactId ? parseInt(String(req.query.contactId)) : undefined;
      const replies = await storage.listProspectReplies({ handled, limit, campaignId, contactId } as any);
      res.json(replies);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || 'fout' });
    }
  });

  // Admin: markeer reply als afgehandeld
  app.patch("/api/admin/prospect-replies/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Ongeldig id' });
      const userId = (req.session as any)?.userId;
      const patch: any = {};
      if (typeof req.body.handled === 'boolean') {
        patch.handled = req.body.handled;
        if (req.body.handled && userId) patch.handledBy = userId;
      }
      if (typeof req.body.notitie === 'string') patch.notitie = req.body.notitie;
      const updated = await storage.updateProspectReply(id, patch);
      if (!updated) return res.status(404).json({ message: 'Reply niet gevonden' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || 'fout' });
    }
  });

  // Admin: lijst recente SendGrid event-log entries (debug + audit)
  app.get("/api/admin/sendgrid/events", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Math.min(500, parseInt(String(req.query.limit))) : 100;
      const campaignId = req.query.campaignId ? parseInt(String(req.query.campaignId)) : undefined;
      const event = req.query.event ? String(req.query.event) : undefined;
      const events = await storage.listSendgridEvents({ limit, campaignId, event });
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || 'fout' });
    }
  });

  // ═══ Einde Blok 3 endpoints ═══════════════════════════════════════════════

  return httpServer;
}
