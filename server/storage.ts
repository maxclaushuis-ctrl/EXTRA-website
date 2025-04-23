import { 
  applicants, type Applicant, type InsertApplicant,
  type User, type InsertUser, 
  type Reward, type InsertReward,
  type PointTransaction, type InsertPointTransaction,
  type Redemption, type InsertRedemption,
  type Rule, type InsertRule,
  type Setting, type InsertSetting
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
  
  private currentIds: {
    applicants: number;
    users: number;
    rewards: number;
    pointTransactions: number;
    redemptions: number;
    rules: number;
    settings: number;
  };

  constructor() {
    this.applicants = new Map();
    this.users = new Map();
    this.rewards = new Map();
    this.pointTransactions = new Map();
    this.redemptions = new Map();
    this.rules = new Map();
    this.settings = new Map();
    
    this.currentIds = {
      applicants: 1,
      users: 1,
      rewards: 1,
      pointTransactions: 1,
      redemptions: 1,
      rules: 1,
      settings: 1,
    };
    
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
      ...insertUser,
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
    
    const updatedUser: User = {
      ...user,
      points: user.points + points
    };
    
    this.users.set(id, updatedUser);
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
      ...insertReward,
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
      ...insertTransaction,
      createdAt: now
    };
    
    this.pointTransactions.set(id, transaction);
    
    // Update user points
    await this.updateUserPoints(transaction.userId, transaction.amount);
    
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
  
  // Redemption methods
  async createRedemption(insertRedemption: InsertRedemption): Promise<Redemption> {
    const id = this.currentIds.redemptions++;
    const now = new Date();
    
    const redemption: Redemption = {
      id,
      ...insertRedemption,
      createdAt: now,
      updatedAt: now
    };
    
    this.redemptions.set(id, redemption);
    
    // Create a transaction for this redemption (negative points)
    await this.createPointTransaction({
      userId: redemption.userId,
      amount: -redemption.pointsCost,
      type: "redeemed",
      description: `Verzilvering: Reward #${redemption.rewardId}`,
      source: "reward_redemption",
      sourceId: id.toString(),
      metadata: {}
    });
    
    // Update reward stock if applicable
    const reward = await this.getReward(redemption.rewardId);
    if (reward && reward.stock !== null && reward.stock !== undefined) {
      await this.updateReward(redemption.rewardId, {
        stock: reward.stock - 1,
        status: reward.stock <= 1 ? "outofstock" : "available"
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
      ...insertRule,
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
      ...ruleData,
      updatedAt: new Date()
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
        updatedAt: now
      };
      
      this.settings.set(key, updated);
      return updated;
    } else {
      const id = this.currentIds.settings++;
      
      const setting: Setting = {
        id,
        key,
        ...settingData as InsertSetting,
        updatedAt: now
      };
      
      this.settings.set(key, setting);
      return setting;
    }
  }
}

export const storage = new MemStorage();
