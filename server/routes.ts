import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { createHash } from "crypto";
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
} from "@shared/schema";
import { z, ZodError } from "zod";
import { awardBirthdayPoints, BIRTHDAY_POINTS, POINTS_TO_EURO_RATIO } from "./birthday";
import { initMailService, sendCandidateConfirmationEmail } from "./mail";
import { initPlanningAPI, getPlanningAPI } from "./planning-api";
import { initChallengeSyncService, getChallengeSyncService } from "./challenge-sync";
import { initPushNotificationService, getPushNotificationService, NotificationTemplates } from "./push-notifications";
import { WebSocketServer, WebSocket } from 'ws';
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { checkInactiveUsers, updateUserActivity, getInactivityWarningUsers, InactivityReport } from "./inactivity-management";
import { calculateRoleBasedPoints, awardWorkSessionPoints, getEmployeeTypeRules, updateEmployeeType, WorkSession } from "./role-based-points";

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
  // Debug logging voor sessiegegevens
  console.log("Sessie in authMiddleware:", req.session);
  
  // In productie zou je hier JWT of een robuustere sessieverificatie gebruiken
  if (req.session && req.session.userId) {
    console.log("Toegang verleend voor gebruiker door sessie:", req.session.userId);
    return next();
  }
  
  // Als er geen sessie is, controleer dan de headers voor speciale interne verzoeken
  // Dit is een workaround voor bepaalde situaties waar sessies niet correct worden doorgegeven
  const specialAuthHeader = req.headers['x-internal-auth'];
  if (specialAuthHeader === 'employee_access' || specialAuthHeader === 'admin_access') {
    console.log("Toegang verleend via speciale header:", specialAuthHeader);
    
    // Maak een tijdelijke sessie aan voor dit verzoek
    if (!req.session) {
      console.log("Geen sessie gevonden, kan geen tijdelijke sessie aanmaken");
    } else {
      req.session.userId = specialAuthHeader === 'employee_access' ? 2 : 1; // employee of admin id
      req.session.userRole = specialAuthHeader === 'employee_access' ? 'employee' : 'admin';
      console.log("Tijdelijke sessie aangemaakt:", req.session);
    }
    
    return next();
  }
  
  console.log("Toegang geweigerd: Geen geldige gebruikerssessie of auth header gevonden");
  return res.status(401).json({ message: "Niet ingelogd" });
}

// Admin middleware
async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  // Debug logging voor sessiegegevens
  console.log("Sessie in adminMiddleware:", req.session);
  
  // Normale sessie validatie
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    console.log("Toegang verleend voor admin-gebruiker door sessie:", req.session.userId);
    return next();
  }
  
  // Check voor x-ws-auth header als fallback authenticatiemethode
  const wsAuth = req.headers['x-ws-auth'];
  if (wsAuth === 'admin_authenticated') {
    console.log("WebSocket authenticatie header gedetecteerd");
    
    // We gaan ervan uit dat dit een admin request is als de header correct is
    // In een productie-omgeving zou je hier extra validaties willen doen
    console.log("Admin toegang verleend via WebSocket auth header");
    return next();
  }
  
  // Als de gebruiker niet is ingelogd via sessie of ws header, stuur 403
  console.log("Admin toegang geweigerd, geen geldige sessie of ws auth");
  return res.status(403).json({ 
    message: "Geen toegang", 
    sessionInfo: { 
      hasSession: !!req.session,
      hasUserId: !!req.session?.userId,
      role: req.session?.userRole || 'none',
      wsAuth: wsAuth || 'none'
    } 
  });
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize mail service
  const mailServiceInitialized = initMailService();
  console.log(`Mail service geïnitialiseerd: ${mailServiceInitialized ? 'Ja' : 'Nee'}`);
  
  // Initialize push notification service
  const pushService = initPushNotificationService();
  console.log('Push notification service geïnitialiseerd');
  
  // Start de verjaardagscontrole planning
  scheduleBirthdayCheck();
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

      console.log("Login poging:", email);

      // Hardcode admin toegang om te testen
      if (email === "admin@extra.nl" && password === "admin123") {
        console.log("Admin login poging gedetecteerd");
        
        // Test of de user aangemaakt is of al bestaat
        const existingUser = await storage.getUserByEmail("admin@extra.nl");
        
        let adminUser = existingUser;
        
        if (!adminUser) {
          console.log("Admin gebruiker bestaat niet, aanmaken...");
          // Admin user bestaat nog niet, aanmaken
          adminUser = await storage.createUser({
            email: "admin@extra.nl",
            password: "admin123",
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            status: "active",
            points: 0
          });
          console.log("Admin gebruiker aangemaakt met id:", adminUser.id);
        } else {
          console.log("Admin gebruiker gevonden met id:", adminUser.id);
        }
        
        // Expliciete sessie aanmaken
        req.session.userId = adminUser.id;
        req.session.userRole = "admin";
        
        console.log("Sessie ingesteld, nu opslaan...");
        console.log("Sessie inhoud:", req.session);
        
        // Sessie forceren om op te slaan voordat we response sturen
        req.session.save((err) => {
          if (err) {
            console.error("Fout bij opslaan sessie:", err);
            return res.status(500).json({ message: "Fout bij opslaan sessie" });
          }
          
          console.log("Sessie succesvol opgeslagen");
          return res.status(200).json({
            message: "Login succesvol",
            user: {
              id: adminUser.id,
              email: adminUser.email,
              firstName: adminUser.firstName,
              lastName: adminUser.lastName,
              role: "admin"
            }
          });
        });
        
        return; // Belangrijk: stoppen na sessie opslaan om dubbele responses te voorkomen
      }
      
      // Voor reguliere users (niet admin)
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      
      // Debug logging
      console.log("Wachtwoord hash in database:", user.password.substring(0, 30) + "...");
      console.log("Ingevoerd wachtwoord:", password);
      
      // Controleer wachtwoord met SHA256 (zoals opgeslagen in database)
      const hashedInputPassword = createHash('sha256').update(password).digest('hex');
      const isValidPassword = hashedInputPassword === user.password;
      
      console.log("Finale wachtwoord verificatie resultaat:", isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      
      console.log("Medewerker login poging gedetecteerd");
      
      // Sessie instellen
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      console.log("Medewerker sessie ingesteld, nu opslaan...");
      console.log("Sessie inhoud voor medewerker:", req.session);
      
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
  
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Niet ingelogd" });
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
      const users = await storage.getUsers();
      
      // Strip sensitive info
      const sanitizedUsers = users.map(user => ({
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
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Gebruiker niet gevonden" });
      }
      
      // Delete user
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de gebruiker" });
      }
      
      return res.status(200).json({ message: "Gebruiker succesvol verwijderd" });
    } catch (error) {
      console.error(`Error deleting user ${req.params.id}:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwijderen van de gebruiker" });
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

      pushService.subscribe(userId, { endpoint, keys });
      
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

  app.post("/api/aanmelden", async (req: Request, res: Response) => {
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
        functionType: z.enum(["housekeeping", "horecamedewerker", "chef", "frontoffice"]),
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
        interviewDate: validated.interviewDate || null,
        interviewTime: validated.interviewTime || null,
        sourceChannel: validated.sourceChannel || "Website",
        notes: validated.notes || null,
        status: validated.status || "in_behandeling",
      } as any);

      await storage.createCandidateAuditLog({
        candidateId: candidate.id,
        action: 'created',
        changedByUserId: null,
        changeData: { description: validated.partial ? 'Kandidaat deels aangemeld (stap 1)' : 'Kandidaat via aanmeldflow op website', status: validated.status },
        ipAddress: req.ip ?? null
      });

      // Stuur bevestigingsmail alleen bij voltooide aanmelding
      if (!validated.partial && validated.status !== 'afgewezen') {
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

      // Notify admins on complete submission (not partial)
      if (!validated.partial) {
        try {
          const allUsers = await storage.getUsers();
          const adminUserIds = allUsers.filter((u: any) => u.role === 'admin').map((u: any) => u.id);
          const candidateName = `${candidate.firstName} ${candidate.lastName}`;

          const pushService = getPushNotificationService();
          if (pushService && adminUserIds.length > 0) {
            pushService.sendNewCandidateAlert(adminUserIds, candidateName, candidate.functionType, candidate.id).catch(console.error);
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
  app.patch("/api/aanmelden/:id", async (req: Request, res: Response) => {
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

      // Stuur bevestigingsmail bij voltooiing
      if (!validated.partial && validated.status !== 'afgewezen' && updated?.email) {
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

  // Calendly webhook: detecteer ingeplande gesprekken
  app.post("/api/webhooks/calendly", async (req: Request, res: Response) => {
    try {
      const { event, payload } = req.body;

      if (event !== "invitee.created") {
        return res.status(200).json({ message: "Event genegeerd" });
      }

      const inviteeEmail = payload?.email;
      const eventStartTime = payload?.event?.start_time || payload?.scheduled_event?.start_time;

      if (!inviteeEmail || !eventStartTime) {
        return res.status(400).json({ message: "Ontbrekende Calendly data" });
      }

      const { candidates: allCandidates } = await storage.getCandidates({ search: inviteeEmail });
      const candidate = allCandidates.find((c: any) => c.email === inviteeEmail);

      if (!candidate) {
        console.log(`Calendly webhook: geen kandidaat gevonden voor ${inviteeEmail}`);
        return res.status(200).json({ message: "Geen kandidaat gevonden, webhook ontvangen" });
      }

      const eventDate = new Date(eventStartTime);
      const interviewDate = eventDate.toISOString().split('T')[0];
      const hours = eventDate.getHours().toString().padStart(2, '0');
      const minutes = eventDate.getMinutes().toString().padStart(2, '0');
      const interviewTime = `${hours}:${minutes}`;

      await storage.updateCandidate(candidate.id, { interviewDate, interviewTime });

      await storage.createCandidateAuditLog({
        candidateId: candidate.id,
        action: 'updated',
        changedByUserId: null,
        changeData: { description: `Gesprek ingepland via Calendly: ${interviewDate} ${interviewTime}`, interviewDate, interviewTime },
        ipAddress: req.ip ?? null
      });

      console.log(`Calendly: gesprek ingepland voor ${inviteeEmail} op ${interviewDate} ${interviewTime}`);
      return res.status(200).json({ message: "Gesprek bijgewerkt" });
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

  const cvUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'cv');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `cv-${Date.now()}${ext}`;
      cb(null, filename);
    }
  });

  const cvUpload = multer({
    storage: cvUploadStorage,
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
      return res.json({ message: "CV uploaded", filename: file.filename });
    } catch (error) {
      console.error("Error uploading CV:", error);
      return res.status(500).json({ message: "Upload failed" });
    }
  });

  // ==========================================
  // SOLLICITANTEN (Candidates) API Routes
  // ==========================================

  // Intake lookup — returns candidates by functionType for admin intake form
  app.get("/api/intake/candidates", async (req: Request, res: Response) => {
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
      
      // Log creation
      await storage.createCandidateAuditLog({
        candidateId: candidate.id,
        action: 'created',
        changedByUserId: req.session?.userId ?? null,
        changeData: { description: 'Sollicitant aangemaakt' },
        ipAddress: req.ip ?? null
      });
      
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
      
      // Log update
      await storage.createCandidateAuditLog({
        candidateId: id,
        action: 'updated',
        changedByUserId: req.session?.userId ?? null,
        changeData: { updatedFields: Object.keys(req.body) },
        ipAddress: req.ip ?? null
      });
      
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
      const { status } = req.body;
      
      if (!['in_behandeling', 'aangenomen', 'afgewezen'].includes(status)) {
        return res.status(400).json({ message: "Ongeldige status" });
      }
      
      const updatedCandidate = await storage.updateCandidateStatus(id, status, req.session?.userId);
      if (!updatedCandidate) {
        return res.status(404).json({ message: "Sollicitant niet gevonden" });
      }
      
      return res.json(updatedCandidate);
    } catch (error) {
      console.error("Error updating candidate status:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het bijwerken van de status" });
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
        limit: limit ? parseInt(limit as string) : 200,
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
      return res.json(updated);
    } catch (error) {
      console.error("Error updating application status:", error);
      return res.status(500).json({ message: "Fout bij bijwerken status" });
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
      };

      const candidate = await storage.createCandidate(candidateData as any);

      // Also save as an application record with full form data
      await storage.createApplication({
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
      });

      // Notify admins via push + WebSocket
      try {
        const allUsers = await storage.getUsers();
        const adminUserIds = allUsers.filter((u: any) => u.role === 'admin').map((u: any) => u.id);
        const candidateName = `${data.firstName} ${data.lastName}`;

        const pushService = getPushNotificationService();
        if (pushService && adminUserIds.length > 0) {
          pushService.sendNewCandidateAlert(adminUserIds, candidateName, data.functionType, candidate.id).catch(console.error);
        }

        if (typeof (global as any).broadcastNotification === 'function') {
          (global as any).broadcastNotification(
            'new_candidate',
            {
              message: `📋 Nieuw formulier: ${candidateName} (${data.functionType})`,
              data: { candidateId: candidate.id, functionType: data.functionType, name: candidateName },
            },
            undefined,
            'admin'
          );
        }
      } catch (notifErr) {
        console.error('Fout bij versturen kandidaat-notificatie:', notifErr);
      }

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
      if (!data.companyName || !data.contactName || !data.email || !data.phone || !data.locationType || data.functions.length === 0) {
        return res.status(400).json({ message: "Vul alle verplichte velden in." });
      }
      const [result] = await db.insert(staffingRequests).values(data).returning();

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

      return res.status(201).json({ success: true, id: result.id });
    } catch (error) {
      console.error("Error saving staffing request:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het opslaan van de aanvraag" });
    }
  });

  console.log('WebSocket server geïnitialiseerd op pad: /ws');
  return httpServer;
}
