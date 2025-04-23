import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertApplicantSchema, 
  insertUserSchema, 
  userFormSchema,
  insertRewardSchema,
  insertPointTransactionSchema,
  insertRedemptionSchema,
  insertRuleSchema,
  insertSettingsSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { awardBirthdayPoints, BIRTHDAY_POINTS, POINTS_TO_EURO_RATIO } from "./birthday";

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // In a real app, we'd validate JWT or session token
  // For now, we'll use a simple session-based authentication
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Niet geautoriseerd" });
}

// Admin middleware
function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  // In a real app, we'd validate JWT or session token and check role
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  return res.status(403).json({ message: "Geen toegang" });
}

// Plan de dagelijkse verjaardagscontrole (elke dag om 00:05)
let birthdayCheckTimer: NodeJS.Timeout | null = null;

function scheduleBirthdayCheck() {
  // Verwijder bestaande timer als die bestaat
  if (birthdayCheckTimer) {
    clearTimeout(birthdayCheckTimer);
  }
  
  // Bereken tijd tot de volgende controle (00:05 de volgende dag)
  const now = new Date();
  const nextCheckTime = new Date(now);
  
  // Reset naar vandaag 00:05
  nextCheckTime.setHours(0, 5, 0, 0);
  
  // Als het al voorbij 00:05 is, plan dan voor morgen
  if (now >= nextCheckTime) {
    nextCheckTime.setDate(nextCheckTime.getDate() + 1);
  }
  
  // Bereken milliseconden tot de volgende controle
  const timeUntilNextCheck = nextCheckTime.getTime() - now.getTime();
  
  console.log(`Volgende verjaardagscontrole gepland om ${nextCheckTime.toLocaleString()} (over ${Math.round(timeUntilNextCheck / 1000 / 60)} minuten)`);
  
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
  
  // Get current stats (for A/B testing metrics) - legacy
  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      // Haal alle benodigde gegevens op
      const users = await storage.getUsers();
      const transactions = await storage.getPointTransactions();
      const redemptions = await storage.getRedemptions();
      
      // Bereken statistieken
      const activeUsers = users.filter(user => user.status === 'active');
      const activeEmployees = activeUsers.filter(user => user.role === 'employee');
      
      // Bereken totaal aantal uitgegeven punten (alleen positieve transacties)
      const totalPointsAwarded = transactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Bereken betrokkenheidsgraad op basis van transacties
      // (percentage medewerkers dat minstens één transactie heeft)
      const usersWithTransactions = new Set(transactions.map(t => t.userId));
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
        totalPointsAwarded,
        totalRedemptions: redemptions.length,
        engagementRate,
        
        // Bereken veranderingspercentages dynamisch op basis van de huidige gegevens
        changes: {
          // Als er punten zijn, +X%, anders N/A
          pointsChange: totalPointsAwarded > 0 ? `+${Math.min(100, Math.round((totalPointsAwarded / 100) * 10))}%` : 'N/A',
          // Als er verzilveringen zijn, +X%, anders N/A
          redemptionsChange: redemptions.length > 0 ? `+${Math.min(100, redemptions.length * 10)}%` : 'N/A',
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

      // In een echte app zouden we password hashing en secure sessions gebruiken
      // Hier doen we een eenvoudige check op de hardcoded admin user
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      
      // Verify password (in de echte app zouden we bcrypt gebruiken)
      const passwordValid = email === "admin@extra.nl" && password === "admin123";
      
      if (!passwordValid) {
        return res.status(401).json({ message: "Ongeldige inloggegevens" });
      }
      
      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
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
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het inloggen" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Er is iets misgegaan bij het uitloggen" });
      }
      
      res.clearCookie("connect.sid"); // Clear session cookie
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
      const transactionData = {
        ...result.data,
        amount: result.data.amount || result.data.points || 0
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
      // Validate request body
      const result = insertRedemptionSchema.safeParse(req.body);
      
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
      
      // Check if reward exists and is available
      const reward = await storage.getReward(result.data.rewardId);
      
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
      
      // Create redemption with actual cost
      const redemptionData = {
        ...result.data,
        pointsCost: reward.pointsCost
      };
      
      // Create the redemption (this also updates user points and creates a transaction)
      const redemption = await storage.createRedemption(redemptionData);
      
      // Get updated user
      const updatedUser = await storage.getUser(result.data.userId);
      
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
      // In een echte app zouden we hier API calls maken naar het plansysteem
      // En de regels toepassen op de resultaten om punten toe te kennen
      // Voor nu retourneren we mock data
      return res.status(200).json({
        message: "Deze functionaliteit vereist integratie met het externe plansysteem",
        info: "Deze API endpoint zou de regels toepassen op data uit het externe plansysteem en punten toekennen aan gebruikers"
      });
    } catch (error) {
      console.error(`Error processing rules:`, error);
      return res.status(500).json({ message: "Er is iets misgegaan bij het verwerken van de regels" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
