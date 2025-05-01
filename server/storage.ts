import { 
  applicants, type Applicant, type InsertApplicant,
  type User, type InsertUser, 
  type Reward, type InsertReward,
  type PointTransaction, type InsertPointTransaction,
  type Redemption, type InsertRedemption,
  type Rule, type InsertRule,
  type Setting, type InsertSetting,
  type EmailTemplate, type InsertEmailTemplate,
  type Campaign, type InsertCampaign,
  type Automation, type InsertAutomation,
  type AutomationTrigger, type InsertAutomationTrigger,
  type AutomationAction, type InsertAutomationAction,
  type Discount, type InsertDiscount
} from "@shared/schema";
import { createHash } from "crypto";

// Storage interface
export interface IStorage {
  // Applicant methods (legacy)
  createApplicant(applicant: InsertApplicant): Promise<Applicant>;
  getApplicants(): Promise<Applicant[]>;
  getApplicant(id: number): Promise<Applicant | undefined>;
  getApplicantByEmail(email: string): Promise<Applicant | undefined>;
  
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByApiId(apiId: string): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPoints(id: number, points: number): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  searchUsers(query: string): Promise<User[]>;
  getUsersByTag(tag: string): Promise<User[]>;
  
  // Reward methods
  createReward(reward: InsertReward): Promise<Reward>;
  getRewards(): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  updateReward(id: number, rewardData: Partial<InsertReward>): Promise<Reward | undefined>;
  deleteReward(id: number): Promise<boolean>;
  
  // Transaction methods
  createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  getPointTransactions(): Promise<PointTransaction[]>;
  getPointTransactionsByUserId(userId: number): Promise<PointTransaction[]>;
  getPointTransaction(id: number): Promise<PointTransaction | undefined>;
  
  // Analytics methods
  getTransactionsPerDay(fromDate?: Date, toDate?: Date): Promise<any[]>;
  getPopularRewards(fromDate?: Date, toDate?: Date): Promise<any[]>;
  getPointsAwardedBySource(source: string, fromDate?: Date, toDate?: Date): Promise<number>;
  getPointsAwardedPreviousPeriod(fromDate?: Date, toDate?: Date): Promise<number>;
  getRedemptionsPreviousPeriod(fromDate?: Date, toDate?: Date): Promise<number>;
  
  // Redemption methods
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  getRedemptions(): Promise<Redemption[]>;
  getRedemptionsByUserId(userId: number): Promise<Redemption[]>;
  getRedemption(id: number): Promise<Redemption | undefined>;
  updateRedemptionStatus(id: number, status: string): Promise<Redemption | undefined>;
  
  // Rule methods
  createRule(rule: InsertRule): Promise<Rule>;
  getRules(): Promise<Rule[]>;
  getRule(id: number): Promise<Rule | undefined>;
  updateRule(id: number, ruleData: Partial<InsertRule>): Promise<Rule | undefined>;
  toggleRuleStatus(id: number): Promise<Rule | undefined>;
  deleteRule(id: number): Promise<boolean>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  getSettingsByCategory(category: string): Promise<Setting[]>;
  upsertSetting(key: string, setting: Partial<InsertSetting>): Promise<Setting>;
  
  // Email template methods
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplatesByType(type: string): Promise<EmailTemplate[]>;
  updateEmailTemplate(id: number, templateData: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  
  // Campaign methods
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  updateCampaign(id: number, campaignData: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  updateCampaignStatus(id: number, status: string): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  sendCampaign(id: number): Promise<boolean>;
  
  // Automation methods
  createAutomation(automation: InsertAutomation): Promise<Automation>;
  getAutomations(): Promise<Automation[]>;
  getAutomation(id: number): Promise<Automation | undefined>;
  updateAutomation(id: number, automationData: Partial<InsertAutomation>): Promise<Automation | undefined>;
  updateAutomationStatus(id: number, status: string): Promise<Automation | undefined>;
  deleteAutomation(id: number): Promise<boolean>;
  
  // Automation Trigger methods
  createAutomationTrigger(trigger: InsertAutomationTrigger): Promise<AutomationTrigger>;
  getAutomationTriggers(automationId: number): Promise<AutomationTrigger[]>;
  updateAutomationTrigger(id: number, triggerData: Partial<InsertAutomationTrigger>): Promise<AutomationTrigger | undefined>;
  deleteAutomationTrigger(id: number): Promise<boolean>;
  
  // Automation Action methods
  createAutomationAction(action: InsertAutomationAction): Promise<AutomationAction>;
  getAutomationActions(automationId: number): Promise<AutomationAction[]>;
  updateAutomationAction(id: number, actionData: Partial<InsertAutomationAction>): Promise<AutomationAction | undefined>;
  deleteAutomationAction(id: number): Promise<boolean>;
  
  // Discount methods
  createDiscount(discount: InsertDiscount): Promise<Discount>;
  getDiscounts(): Promise<Discount[]>;
  getDiscount(id: number): Promise<Discount | undefined>;
  updateDiscount(id: number, discountData: Partial<InsertDiscount>): Promise<Discount | undefined>;
  deleteDiscount(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private applicants: Map<number, Applicant>;
  private users: Map<number, User>;
  private rewards: Map<number, Reward>;
  private pointTransactions: Map<number, PointTransaction>;
  private redemptions: Map<number, Redemption>;
  private rules: Map<number, Rule>;
  private settings: Map<string, Setting>;
  private emailTemplates: Map<number, EmailTemplate>;
  private campaigns: Map<number, Campaign>;
  private automations: Map<number, Automation>;
  private automationTriggers: Map<number, AutomationTrigger>;
  private automationActions: Map<number, AutomationAction>;
  private discounts: Map<number, Discount>;
  
  private currentIds: {
    applicants: number;
    users: number;
    rewards: number;
    pointTransactions: number;
    redemptions: number;
    rules: number;
    settings: number;
    emailTemplates: number;
    campaigns: number;
    automations: number;
    automationTriggers: number;
    automationActions: number;
  };

  constructor() {
    this.applicants = new Map();
    this.users = new Map();
    this.rewards = new Map();
    this.pointTransactions = new Map();
    this.redemptions = new Map();
    this.rules = new Map();
    this.settings = new Map();
    this.emailTemplates = new Map();
    this.campaigns = new Map();
    this.automations = new Map();
    this.automationTriggers = new Map();
    this.automationActions = new Map();
    
    this.currentIds = {
      applicants: 1,
      users: 1,
      rewards: 1,
      pointTransactions: 1,
      redemptions: 1,
      rules: 1,
      settings: 1,
      emailTemplates: 1,
      campaigns: 1,
      automations: 1,
      automationTriggers: 1,
      automationActions: 1,
      discounts: 1,
    };
    
    this.discounts = new Map();
    
    // Initialiseer een admin gebruiker
    this.createUser({
      email: "admin@extra.nl",
      password: this.hashPassword("admin123"),
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      status: "active",
      points: 0,
      phone: "",
      profileImage: "",
      apiId: "",
      needsTwv: false,
      twvStatus: "none",
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "light"
      },
      tags: [],
    });
    
    // Medewerker account met standaard inloggegevens
    this.createUser({
      email: "medewerker@extra.nl",
      password: this.hashPassword("medewerker123"),
      firstName: "Extra",
      lastName: "Medewerker",
      role: "employee",
      status: "active",
      points: 500,
      phone: "0687654321",
      profileImage: "",
      apiId: "EXT000",
      needsTwv: false,
      twvStatus: "none",
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "dark"
      },
      tags: ["intern"],
    });
    
    // Testgebruikers voor TWV functionaliteit
    this.createUser({
      email: "jan@extra.nl",
      password: this.hashPassword("password123"),
      firstName: "Jan",
      lastName: "Buitenlands",
      role: "employee",
      status: "active",
      points: 100,
      phone: "0612345678",
      profileImage: "",
      apiId: "EXT001",
      needsTwv: true,
      twvStatus: "required",
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "light"
      },
      tags: ["internationaal"],
    });
    
    this.createUser({
      email: "maria@extra.nl",
      password: this.hashPassword("password123"),
      firstName: "Maria",
      lastName: "International",
      role: "employee",
      status: "active",
      points: 150,
      phone: "0612345679",
      profileImage: "",
      apiId: "EXT002",
      needsTwv: true,
      twvStatus: "pending",
      twvRequestDate: new Date(2025, 3, 15),
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "light"
      },
      tags: ["internationaal"],
    });
    
    this.createUser({
      email: "piet@extra.nl",
      password: this.hashPassword("password123"),
      firstName: "Piet",
      lastName: "Lokaal",
      role: "employee",
      status: "active",
      points: 200,
      phone: "0612345670",
      profileImage: "",
      apiId: "EXT003",
      needsTwv: false,
      twvStatus: "none",
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "light"
      },
      tags: [],
    });
    
    // Initialiseer enkele beloningen
    this.createReward({
      name: "Apple AirPods Pro",
      description: "Draadloze oordopjes met noise cancelling",
      imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434",
      pointsCost: 4450,
      stock: 5,
      status: "available"
    });
    
    this.createReward({
      name: "Museumjaarkaart",
      description: "Een jaar lang toegang tot meer dan 400 musea in Nederland",
      imageUrl: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2",
      pointsCost: 1500,
      stock: 10,
      status: "available"
    });
    
    // Initialiseer enkele regels
    this.createRule({
      name: "6 shifts",
      description: "Verdien punten na 6 shifts",
      type: "fixed",
      condition: {
        type: "shifts",
        value: 6,
        operator: ">="
      },
      pointsValue: 300,
      isActive: true
    });
    
    this.createRule({
      name: "Rating x 5",
      description: "Verdien 5x je rating in punten",
      type: "multiplication",
      condition: {
        type: "rating",
        value: 1,
        operator: ">="
      },
      pointsValue: 5,
      isActive: true
    });
  }
  
  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }
  
  private verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    return this.hashPassword(plainPassword) === hashedPassword;
  }

  // Applicant methods (legacy)
  async createApplicant(insertApplicant: InsertApplicant): Promise<Applicant> {
    const id = this.currentIds.applicants++;
    const now = new Date();
    
    const applicant: Applicant = {
      id,
      ...insertApplicant,
      dateApplied: now,
      status: "pending",
      variant: insertApplicant.variant || null,
    };
    
    this.applicants.set(id, applicant);
    return applicant;
  }

  async getApplicants(): Promise<Applicant[]> {
    return Array.from(this.applicants.values());
  }

  async getApplicant(id: number): Promise<Applicant | undefined> {
    return this.applicants.get(id);
  }

  async getApplicantByEmail(email: string): Promise<Applicant | undefined> {
    return Array.from(this.applicants.values()).find(
      (applicant) => applicant.email === email
    );
  }
  
  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      phone: insertUser.phone || null,
      birthDate: insertUser.birthDate || null,
      role: insertUser.role || 'employee',
      status: insertUser.status || 'active',
      points: insertUser.points !== undefined ? insertUser.points : 0,
      profileImage: insertUser.profileImage || null,
      apiId: insertUser.apiId || null,
      tags: insertUser.tags || [],
      settings: insertUser.settings || null,
      needsTwv: insertUser.needsTwv !== undefined ? insertUser.needsTwv : false,
      twvStatus: insertUser.twvStatus || 'none',
      twvRequestDate: insertUser.twvRequestDate || null,
      twvApprovalDate: insertUser.twvApprovalDate || null,
      twvExpiryDate: insertUser.twvExpiryDate || null,
      twvNotes: insertUser.twvNotes || null,
      dateJoined: now,
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getUserByApiId(apiId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.apiId === apiId
    );
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPoints(id: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    // Voeg punten toe aan het bestaande puntensaldo
    // Sta ook negatieve punten toe (min-punten)
    const newPoints = user.points + points;
    
    // Maak een kopie van de gebruiker met bijgewerkte punten
    const updatedUser: User = {
      ...user,
      points: newPoints
    };
    
    this.users.set(id, updatedUser);
    
    console.log(`Punten voor gebruiker ${id} bijgewerkt: ${user.points} -> ${newPoints} (${points > 0 ? '+' : ''}${points})`);
    
    // Stuur een realtime notificatie via WebSocket als die functie beschikbaar is
    if (typeof global.sendNotification === 'function') {
      global.sendNotification({
        type: 'points_update',
        userId: id,
        message: `Je puntensaldo is bijgewerkt: ${points > 0 ? '+' : ''}${points} punten`,
        data: {
          userId: id,
          points: newPoints,
          change: points,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async searchUsers(query: string): Promise<User[]> {
    query = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      (user) => 
        user.email.toLowerCase().includes(query) ||
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        (user.phone && user.phone.includes(query))
    );
  }
  
  async getUsersByTag(tag: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.tags && user.tags.includes(tag)
    );
  }
  
  // Reward methods
  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = this.currentIds.rewards++;
    const now = new Date();
    
    const reward: Reward = {
      id,
      name: insertReward.name,
      description: insertReward.description || null,
      imageUrl: insertReward.imageUrl || null,
      pointsCost: insertReward.pointsCost,
      stock: insertReward.stock || null,
      status: insertReward.status || 'available',
      dateCreated: now,
      dateUpdated: now
    };
    
    this.rewards.set(id, reward);
    return reward;
  }
  
  async getRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }
  
  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }
  
  async updateReward(id: number, rewardData: Partial<InsertReward>): Promise<Reward | undefined> {
    const reward = await this.getReward(id);
    if (!reward) return undefined;
    
    const updatedReward: Reward = {
      ...reward,
      ...rewardData,
      dateUpdated: new Date()
    };
    
    this.rewards.set(id, updatedReward);
    return updatedReward;
  }
  
  async deleteReward(id: number): Promise<boolean> {
    return this.rewards.delete(id);
  }
  
  // Transaction methods
  async createPointTransaction(insertTransaction: InsertPointTransaction): Promise<PointTransaction> {
    const id = this.currentIds.pointTransactions++;
    const now = new Date();
    
    const transaction: PointTransaction = {
      id,
      userId: insertTransaction.userId,
      amount: insertTransaction.amount,
      type: insertTransaction.type,
      description: insertTransaction.description,
      source: insertTransaction.source,
      sourceId: insertTransaction.sourceId || null,
      metadata: insertTransaction.metadata || null,
      createdAt: now
    };
    
    this.pointTransactions.set(id, transaction);
    
    // Verjaardagsbonus-updating wordt al gedaan in de birthday.ts, dus als dit een birthday transactie is, update dan niet hier
    if (transaction.source !== 'birthday') {
      // Update user points voor alle andere transacties
      await this.updateUserPoints(transaction.userId, transaction.amount);
    }
    
    return transaction;
  }
  
  async getPointTransactions(): Promise<PointTransaction[]> {
    return Array.from(this.pointTransactions.values());
  }
  
  async getPointTransactionsByUserId(userId: number): Promise<PointTransaction[]> {
    return Array.from(this.pointTransactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
  }
  
  async getPointTransaction(id: number): Promise<PointTransaction | undefined> {
    return this.pointTransactions.get(id);
  }
  
  // Analytics methods implementation
  async getTransactionsPerDay(fromDate?: Date, toDate?: Date): Promise<any[]> {
    const transactions = Array.from(this.pointTransactions.values());
    
    // Filter transactions by date range if specified
    const filteredTransactions = transactions.filter(t => {
      if (!fromDate && !toDate) return true;
      const txDate = new Date(t.createdAt);
      return (!fromDate || txDate >= fromDate) && (!toDate || txDate <= toDate);
    });
    
    // Group transactions by day
    const transactionsByDay = new Map<string, { date: string, naam: string, earned: number, redeemed: number }>();
    
    filteredTransactions.forEach(tx => {
      // Format date as YYYY-MM-DD for grouping
      const date = new Date(tx.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      
      // Get or initialize day entry
      const dayEntry = transactionsByDay.get(dateKey) || { 
        date: dateKey, 
        naam: new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'short' }).format(date),
        earned: 0, 
        redeemed: 0 
      };
      
      // Update points based on transaction type
      if (tx.type === 'earned') {
        dayEntry.earned += tx.amount;
      } else if (tx.type === 'redeemed') {
        dayEntry.redeemed += Math.abs(tx.amount);
      }
      
      // Save updated entry
      transactionsByDay.set(dateKey, dayEntry);
    });
    
    // Convert map to array and sort by date
    return Array.from(transactionsByDay.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  async getPopularRewards(fromDate?: Date, toDate?: Date): Promise<any[]> {
    const redemptions = Array.from(this.redemptions.values());
    
    // Filter redemptions by date range if specified
    const filteredRedemptions = redemptions.filter(r => {
      if (!fromDate && !toDate) return true;
      const txDate = new Date(r.createdAt);
      return (!fromDate || txDate >= fromDate) && (!toDate || txDate <= toDate);
    });
    
    // Count redemptions per reward
    const rewardCounts = new Map<number, number>();
    
    filteredRedemptions.forEach(redemption => {
      const count = rewardCounts.get(redemption.rewardId) || 0;
      rewardCounts.set(redemption.rewardId, count + 1);
    });
    
    // Get reward details and create final array
    const result = [];
    
    for (const [rewardId, count] of rewardCounts.entries()) {
      const reward = await this.getReward(rewardId);
      if (reward) {
        result.push({
          name: reward.name,
          value: count
        });
      }
    }
    
    // Sort by count (descending) and take top 5
    return result
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }
  
  async getPointsAwardedBySource(source: string, fromDate?: Date, toDate?: Date): Promise<number> {
    const transactions = Array.from(this.pointTransactions.values());
    
    // Filter transactions by date range if specified
    const filteredTransactions = transactions.filter(t => {
      if (!fromDate && !toDate) return true;
      const txDate = new Date(t.createdAt);
      return (!fromDate || txDate >= fromDate) && (!toDate || txDate <= toDate);
    });
    
    // Sum points awarded from the specified source
    return filteredTransactions
      .filter(tx => tx.type === 'earned' && tx.source === source)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }
  
  async getPointsAwardedPreviousPeriod(fromDate?: Date, toDate?: Date): Promise<number> {
    if (!fromDate || !toDate) return 0;
    
    // Calculate previous period with same duration
    const periodDuration = toDate.getTime() - fromDate.getTime();
    const previousPeriodEnd = new Date(fromDate.getTime() - 1); // One millisecond before current period starts
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration);
    
    const transactions = Array.from(this.pointTransactions.values());
    
    // Filter transactions for previous period
    const filteredTransactions = transactions.filter(t => {
      const txDate = new Date(t.createdAt);
      return txDate >= previousPeriodStart && txDate <= previousPeriodEnd;
    });
    
    // Sum awarded points in previous period
    return filteredTransactions
      .filter(tx => tx.type === 'earned')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }
  
  async getRedemptionsPreviousPeriod(fromDate?: Date, toDate?: Date): Promise<number> {
    if (!fromDate || !toDate) return 0;
    
    // Calculate previous period with same duration
    const periodDuration = toDate.getTime() - fromDate.getTime();
    const previousPeriodEnd = new Date(fromDate.getTime() - 1); // One millisecond before current period starts
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration);
    
    const redemptions = Array.from(this.redemptions.values());
    
    // Count redemptions in previous period
    return redemptions.filter(r => {
      const txDate = new Date(r.createdAt);
      return txDate >= previousPeriodStart && txDate <= previousPeriodEnd;
    }).length;
  }
  
  // Redemption methods
  async createRedemption(insertRedemption: InsertRedemption): Promise<Redemption> {
    const id = this.currentIds.redemptions++;
    const now = new Date();
    
    // Haal de reward op om de pointsCost te bepalen
    const selectedReward = await this.getReward(insertRedemption.rewardId);
    if (!selectedReward) {
      throw new Error(`Reward with id ${insertRedemption.rewardId} not found`);
    }
    
    const redemption: Redemption = {
      id,
      userId: insertRedemption.userId,
      rewardId: insertRedemption.rewardId,
      pointsCost: selectedReward.pointsCost, // Gebruik de kosten van de reward
      status: insertRedemption.status || 'pending',
      notes: insertRedemption.notes || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.redemptions.set(id, redemption);
    
    // Create a transaction for this redemption (negative points)
    const metadata: Record<string, any> = { rewardId: redemption.rewardId };
    await this.createPointTransaction({
      userId: redemption.userId,
      amount: -redemption.pointsCost,
      type: "redeemed",
      description: `Verzilvering: Reward #${redemption.rewardId}`,
      source: "reward_redemption",
      sourceId: id.toString(),
      metadata
    });
    
    // Update reward stock if applicable
    if (selectedReward.stock !== null && selectedReward.stock !== undefined) {
      await this.updateReward(redemption.rewardId, {
        stock: selectedReward.stock - 1,
        status: selectedReward.stock <= 1 ? "outofstock" : "available"
      });
    }
    
    return redemption;
  }
  
  async getRedemptions(): Promise<Redemption[]> {
    return Array.from(this.redemptions.values());
  }
  
  async getRedemptionsByUserId(userId: number): Promise<Redemption[]> {
    return Array.from(this.redemptions.values()).filter(
      (redemption) => redemption.userId === userId
    );
  }
  
  async getRedemption(id: number): Promise<Redemption | undefined> {
    return this.redemptions.get(id);
  }
  
  async updateRedemptionStatus(id: number, status: string): Promise<Redemption | undefined> {
    const redemption = await this.getRedemption(id);
    if (!redemption) return undefined;
    
    const updatedRedemption: Redemption = {
      ...redemption,
      status: status as any,
      updatedAt: new Date()
    };
    
    this.redemptions.set(id, updatedRedemption);
    return updatedRedemption;
  }
  
  // Rule methods
  async createRule(insertRule: InsertRule): Promise<Rule> {
    const id = this.currentIds.rules++;
    const now = new Date();
    
    const rule: Rule = {
      id,
      name: insertRule.name,
      description: insertRule.description || null,
      type: insertRule.type,
      condition: {
        type: insertRule.condition.type,
        value: insertRule.condition.value,
        operator: insertRule.condition.operator || undefined
      },
      pointsValue: insertRule.pointsValue,
      isActive: insertRule.isActive !== undefined ? insertRule.isActive : true,
      createdAt: now,
      updatedAt: now
    };
    
    this.rules.set(id, rule);
    return rule;
  }
  
  async getRules(): Promise<Rule[]> {
    return Array.from(this.rules.values());
  }
  
  async getRule(id: number): Promise<Rule | undefined> {
    return this.rules.get(id);
  }
  
  async updateRule(id: number, ruleData: Partial<InsertRule>): Promise<Rule | undefined> {
    const rule = await this.getRule(id);
    if (!rule) return undefined;
    
    const updatedRule: Rule = {
      ...rule,
      name: ruleData.name || rule.name,
      description: ruleData.description !== undefined ? ruleData.description || null : rule.description,
      type: ruleData.type || rule.type,
      condition: ruleData.condition ? {
        type: ruleData.condition.type || rule.condition.type,
        value: ruleData.condition.value !== undefined ? ruleData.condition.value : rule.condition.value,
        operator: ruleData.condition.operator || rule.condition.operator
      } : rule.condition,
      pointsValue: ruleData.pointsValue !== undefined ? ruleData.pointsValue : rule.pointsValue,
      isActive: ruleData.isActive !== undefined ? ruleData.isActive : rule.isActive,
      updatedAt: new Date(),
      createdAt: rule.createdAt,
      id: rule.id
    };
    
    this.rules.set(id, updatedRule);
    return updatedRule;
  }
  
  async toggleRuleStatus(id: number): Promise<Rule | undefined> {
    const rule = await this.getRule(id);
    if (!rule) return undefined;
    
    const updatedRule: Rule = {
      ...rule,
      isActive: !rule.isActive,
      updatedAt: new Date()
    };
    
    this.rules.set(id, updatedRule);
    return updatedRule;
  }
  
  async deleteRule(id: number): Promise<boolean> {
    return this.rules.delete(id);
  }
  
  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }
  
  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(
      (setting) => setting.category === category
    );
  }
  
  async upsertSetting(key: string, settingData: Partial<InsertSetting>): Promise<Setting> {
    const existing = await this.getSetting(key);
    const now = new Date();
    
    if (existing) {
      const updated: Setting = {
        ...existing,
        ...settingData,
        updatedAt: now,
        value: settingData.value !== undefined ? settingData.value : existing.value
      };
      
      this.settings.set(key, updated);
      return updated;
    } else {
      const id = this.currentIds.settings++;
      
      // Zorg ervoor dat waarden zijn ingesteld
      const defaultValue = settingData.value !== undefined ? settingData.value : null;
      const defaultType = settingData.type || 'string';
      const defaultCategory = settingData.category || 'general';
      
      const setting: Setting = {
        id,
        key,
        value: defaultValue,
        type: defaultType,
        category: defaultCategory,
        updatedAt: now
      };
      
      this.settings.set(key, setting);
      return setting;
    }
  }
  
  // Email template methods
  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.currentIds.emailTemplates++;
    const now = new Date();
    
    const template: EmailTemplate = {
      id,
      name: insertTemplate.name,
      type: insertTemplate.type || 'general',
      subject: insertTemplate.subject,
      htmlContent: insertTemplate.htmlContent,
      textContent: insertTemplate.textContent,
      createdAt: now,
      updatedAt: now
    };
    
    this.emailTemplates.set(id, template);
    return template;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values());
  }
  
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }
  
  async getEmailTemplatesByType(type: string): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values()).filter(
      (template) => template.type === type
    );
  }
  
  async updateEmailTemplate(id: number, templateData: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = await this.getEmailTemplate(id);
    if (!template) return undefined;
    
    const updatedTemplate: EmailTemplate = {
      ...template,
      ...templateData,
      updatedAt: new Date()
    };
    
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteEmailTemplate(id: number): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }
  
  // Campaign methods
  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentIds.campaigns++;
    const now = new Date();
    
    const campaign: Campaign = {
      id,
      name: insertCampaign.name,
      description: insertCampaign.description || null,
      templateId: insertCampaign.templateId || null,
      subject: insertCampaign.subject,
      htmlContent: insertCampaign.htmlContent,
      textContent: insertCampaign.textContent,
      status: insertCampaign.status || 'draft',
      scheduledFor: insertCampaign.scheduledFor || null,
      sentAt: null,
      sentToCount: 0,
      openCount: 0,
      clickCount: 0,
      createdAt: now,
      updatedAt: now
    };
    
    this.campaigns.set(id, campaign);
    return campaign;
  }
  
  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }
  
  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }
  
  async updateCampaign(id: number, campaignData: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const campaign = await this.getCampaign(id);
    if (!campaign) return undefined;
    
    const updatedCampaign: Campaign = {
      ...campaign,
      ...campaignData,
      updatedAt: new Date()
    };
    
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }
  
  async updateCampaignStatus(id: number, status: string): Promise<Campaign | undefined> {
    const campaign = await this.getCampaign(id);
    if (!campaign) return undefined;
    
    const updatedCampaign: Campaign = {
      ...campaign,
      status: status as any,
      updatedAt: new Date()
    };
    
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }
  
  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }
  
  async sendCampaign(id: number): Promise<boolean> {
    const campaign = await this.getCampaign(id);
    if (!campaign) return false;
    
    // Hier zou in werkelijkheid de e-mail verzending plaatsvinden
    // Voor nu doen we een mock-implementatie
    
    const activeUsers = Array.from(this.users.values()).filter(
      user => user.status === 'active' && user.role === 'employee'
    );
    
    const updatedCampaign: Campaign = {
      ...campaign,
      status: 'sent',
      sentAt: new Date(),
      sentToCount: activeUsers.length,
      updatedAt: new Date()
    };
    
    this.campaigns.set(id, updatedCampaign);
    
    console.log(`Campagne "${campaign.name}" is verzonden naar ${activeUsers.length} actieve medewerkers`);
    
    return true;
  }
  
  // Automation methods
  async createAutomation(insertAutomation: InsertAutomation): Promise<Automation> {
    const id = this.currentIds.automations++;
    const now = new Date();
    
    const automation: Automation = {
      id,
      name: insertAutomation.name,
      description: insertAutomation.description || null,
      status: insertAutomation.status || 'draft',
      flowData: insertAutomation.flowData,
      createdAt: now,
      updatedAt: now,
      lastRun: null,
      nextRun: null
    };
    
    this.automations.set(id, automation);
    return automation;
  }
  
  async getAutomations(): Promise<Automation[]> {
    return Array.from(this.automations.values());
  }
  
  async getAutomation(id: number): Promise<Automation | undefined> {
    return this.automations.get(id);
  }
  
  async updateAutomation(id: number, automationData: Partial<InsertAutomation>): Promise<Automation | undefined> {
    const automation = await this.getAutomation(id);
    if (!automation) return undefined;
    
    const updatedAutomation: Automation = {
      ...automation,
      ...automationData,
      updatedAt: new Date()
    };
    
    this.automations.set(id, updatedAutomation);
    return updatedAutomation;
  }
  
  async updateAutomationStatus(id: number, status: string): Promise<Automation | undefined> {
    const automation = await this.getAutomation(id);
    if (!automation) return undefined;
    
    // Controleer of status geldig is
    if (!['active', 'inactive', 'draft'].includes(status)) {
      throw new Error(`Ongeldige automation status: ${status}`);
    }
    
    const updatedAutomation: Automation = {
      ...automation,
      status: status as 'active' | 'inactive' | 'draft',
      updatedAt: new Date()
    };
    
    this.automations.set(id, updatedAutomation);
    return updatedAutomation;
  }
  
  async deleteAutomation(id: number): Promise<boolean> {
    // Verwijder eerst alle gerelateerde triggers en acties
    const triggers = await this.getAutomationTriggers(id);
    for (const trigger of triggers) {
      await this.deleteAutomationTrigger(trigger.id);
    }
    
    const actions = await this.getAutomationActions(id);
    for (const action of actions) {
      await this.deleteAutomationAction(action.id);
    }
    
    return this.automations.delete(id);
  }
  
  // Automation Trigger methods
  async createAutomationTrigger(insertTrigger: InsertAutomationTrigger): Promise<AutomationTrigger> {
    const id = this.currentIds.automationTriggers++;
    const now = new Date();
    
    const trigger: AutomationTrigger = {
      id,
      automationId: insertTrigger.automationId,
      triggerType: insertTrigger.triggerType,
      config: insertTrigger.config,
      createdAt: now,
      updatedAt: now
    };
    
    this.automationTriggers.set(id, trigger);
    return trigger;
  }
  
  async getAutomationTriggers(automationId: number): Promise<AutomationTrigger[]> {
    return Array.from(this.automationTriggers.values()).filter(
      trigger => trigger.automationId === automationId
    );
  }
  
  async updateAutomationTrigger(id: number, triggerData: Partial<InsertAutomationTrigger>): Promise<AutomationTrigger | undefined> {
    const trigger = this.automationTriggers.get(id);
    if (!trigger) return undefined;
    
    const updatedTrigger: AutomationTrigger = {
      ...trigger,
      ...triggerData,
      updatedAt: new Date()
    };
    
    this.automationTriggers.set(id, updatedTrigger);
    return updatedTrigger;
  }
  
  async deleteAutomationTrigger(id: number): Promise<boolean> {
    return this.automationTriggers.delete(id);
  }
  
  // Automation Action methods
  async createAutomationAction(insertAction: InsertAutomationAction): Promise<AutomationAction> {
    const id = this.currentIds.automationActions++;
    const now = new Date();
    
    const action: AutomationAction = {
      id,
      automationId: insertAction.automationId,
      actionType: insertAction.actionType,
      config: insertAction.config,
      createdAt: now,
      updatedAt: now
    };
    
    this.automationActions.set(id, action);
    return action;
  }
  
  async getAutomationActions(automationId: number): Promise<AutomationAction[]> {
    return Array.from(this.automationActions.values()).filter(
      action => action.automationId === automationId
    );
  }
  
  async updateAutomationAction(id: number, actionData: Partial<InsertAutomationAction>): Promise<AutomationAction | undefined> {
    const action = this.automationActions.get(id);
    if (!action) return undefined;
    
    const updatedAction: AutomationAction = {
      ...action,
      ...actionData,
      updatedAt: new Date()
    };
    
    this.automationActions.set(id, updatedAction);
    return updatedAction;
  }
  
  async deleteAutomationAction(id: number): Promise<boolean> {
    return this.automationActions.delete(id);
  }
}

export const storage = new MemStorage();
