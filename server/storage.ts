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
  type Discount, type InsertDiscount,
  type MonthlyLeader, type InsertMonthlyLeader,
  type Challenge, type InsertChallenge,
  type ChallengeStep, type InsertChallengeStep,
  type UserChallengeProgress, type InsertUserChallengeProgress,
  type UserChallengeProgressWithDetails,
  // Plansysteem types
  type Client, type InsertClient,
  type Location, type InsertLocation,
  type Shift, type InsertShift,
  type Assignment, type InsertAssignment,
  type StaffPool, type InsertStaffPool,
  type PoolMember, type InsertPoolMember
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
  updateUserMonthlyPoints(id: number, points: number): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  searchUsers(query: string): Promise<User[]>;
  getUsersByTag(tag: string): Promise<User[]>;
  
  // Leaderboard methods
  getMonthlyLeaderboard(year?: number, month?: number): Promise<(User & { rank: number })[]>;
  getPreviousMonthWinner(): Promise<User | undefined>;
  resetMonthlyPoints(): Promise<number>;
  
  // Challenge methods
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  updateChallenge(id: number, data: Partial<InsertChallenge>): Promise<Challenge | undefined>;
  deleteChallenge(id: number): Promise<boolean>;
  
  createChallengeStep(step: InsertChallengeStep): Promise<ChallengeStep>;
  getChallengeSteps(challengeId: number): Promise<ChallengeStep[]>;
  getChallengeStep(id: number): Promise<ChallengeStep | undefined>;
  updateChallengeStep(id: number, data: Partial<InsertChallengeStep>): Promise<ChallengeStep | undefined>;
  deleteChallengeStep(id: number): Promise<boolean>;
  
  getUserChallengeProgress(userId: number): Promise<(UserChallengeProgress & { challenge: Challenge; currentStep?: ChallengeStep; nextStep?: ChallengeStep })[]>;
  updateUserChallengeProgress(userId: number, challengeId: number, progress: Partial<InsertUserChallengeProgress>): Promise<UserChallengeProgress | undefined>;
  completeUserChallengeStep(userId: number, challengeId: number, stepId: number): Promise<{ progress: UserChallengeProgress; pointsAwarded: number } | undefined>;
  saveMonthlyLeaders(year: number, month: number): Promise<void>;
  
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
  
  // Client (opdrachtgever) methods
  createClient(client: InsertClient): Promise<Client>;
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  searchClients(query: string): Promise<Client[]>;
  
  // Location methods
  createLocation(location: InsertLocation): Promise<Location>;
  getLocations(): Promise<Location[]>;
  getLocationsByClientId(clientId: number): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  updateLocation(id: number, locationData: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  
  // Shift methods
  createShift(shift: InsertShift): Promise<Shift>;
  getShifts(): Promise<Shift[]>;
  getShift(id: number): Promise<Shift | undefined>;
  getShiftsByDate(date: Date): Promise<Shift[]>;
  getShiftsByDateRange(startDate: Date, endDate: Date): Promise<Shift[]>;
  getShiftsByClientId(clientId: number): Promise<Shift[]>;
  updateShift(id: number, shiftData: Partial<InsertShift>): Promise<Shift | undefined>;
  updateShiftStatus(id: number, status: string): Promise<Shift | undefined>;
  updateShiftStaffCount(id: number, assignedStaff: number): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;
  
  // Assignment methods
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignments(): Promise<Assignment[]>;
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByShiftId(shiftId: number): Promise<Assignment[]>;
  getAssignmentsByUserId(userId: number): Promise<Assignment[]>;
  updateAssignment(id: number, assignmentData: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  updateAssignmentStatus(id: number, status: string, reason?: string): Promise<Assignment | undefined>;
  recordCheckInOut(id: number, checkInTime?: Date, checkOutTime?: Date): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // StaffPool methods
  createStaffPool(pool: InsertStaffPool): Promise<StaffPool>;
  getStaffPools(): Promise<StaffPool[]>;
  getStaffPoolsByCreator(userId: number): Promise<StaffPool[]>;
  getStaffPool(id: number): Promise<StaffPool | undefined>;
  updateStaffPool(id: number, poolData: Partial<InsertStaffPool>): Promise<StaffPool | undefined>;
  deleteStaffPool(id: number): Promise<boolean>;
  
  // PoolMember methods
  addPoolMember(poolMember: InsertPoolMember): Promise<PoolMember>;
  getPoolMembers(poolId: number): Promise<PoolMember[]>;
  getPoolMemberships(userId: number): Promise<PoolMember[]>;
  removePoolMember(poolId: number, userId: number): Promise<boolean>;

  // Challenge methods
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  updateChallenge(id: number, challengeData: Partial<InsertChallenge>): Promise<Challenge | undefined>;
  deleteChallenge(id: number): Promise<boolean>;

  // Challenge Step methods
  createChallengeStep(step: InsertChallengeStep): Promise<ChallengeStep>;
  getChallengeSteps(challengeId: number): Promise<ChallengeStep[]>;
  getChallengeStep(id: number): Promise<ChallengeStep | undefined>;
  updateChallengeStep(id: number, stepData: Partial<InsertChallengeStep>): Promise<ChallengeStep | undefined>;
  deleteChallengeStep(id: number): Promise<boolean>;

  // User Challenge Progress methods
  createUserChallengeProgress(progress: InsertUserChallengeProgress): Promise<UserChallengeProgress>;
  getUserChallengeProgress(userId: number): Promise<UserChallengeProgress[]>;
  getUserChallengeProgressWithDetails(userId: number, challengeId: number): Promise<UserChallengeProgress | undefined>;
  getUserChallengeProgressById(id: number): Promise<UserChallengeProgress | undefined>;
  updateUserChallengeProgress(id: number, progressData: Partial<InsertUserChallengeProgress>): Promise<UserChallengeProgress | undefined>;
  deleteUserChallengeProgress(id: number): Promise<boolean>;
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
  private monthlyLeaders: Map<number, MonthlyLeader>;
  private challenges: Map<number, Challenge>;
  private challengeSteps: Map<number, ChallengeStep>;
  private userChallengeProgress: Map<number, UserChallengeProgress>;
  // Plansysteem data
  private clients: Map<number, Client>;
  private locations: Map<number, Location>;
  private shifts: Map<number, Shift>;
  private assignments: Map<number, Assignment>;
  private staffPools: Map<number, StaffPool>;
  private poolMembers: Map<number, PoolMember>;
  
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
    discounts: number;
    monthlyLeaders: number;
    challenges: number;
    challengeSteps: number;
    userChallengeProgress: number;
    // Plansysteem ids
    clients: number;
    locations: number;
    shifts: number;
    assignments: number;
    staffPools: number;
    poolMembers: number;
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
    this.discounts = new Map();
    this.monthlyLeaders = new Map();
    this.challenges = new Map();
    this.challengeSteps = new Map();
    this.userChallengeProgress = new Map();
    
    // Plansysteem maps initialiseren
    this.clients = new Map();
    this.locations = new Map();
    this.shifts = new Map();
    this.assignments = new Map();
    this.staffPools = new Map();
    this.poolMembers = new Map();
    
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
      monthlyLeaders: 1,
      challenges: 1,
      challengeSteps: 1,
      userChallengeProgress: 1,
      // Plansysteem ids
      clients: 1,
      locations: 1,
      shifts: 1,
      assignments: 1,
      staffPools: 1,
      poolMembers: 1,
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
      monthlyPoints: 0,
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
      monthlyPoints: 150,
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
      monthlyPoints: 75,
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
      monthlyPoints: 85,
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
      monthlyPoints: 95,
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
    
    // Initialiseer enkele kortingsacties
    this.createDiscount({
      name: "10% korting bij Pathé",
      description: "Ontvang 10% korting op alle bioscoopkaartjes bij Pathé",
      imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26",
      partner: "Pathé",
      discountCode: "EXTRA10PATH",
      category: "entertainment",
      status: "active"
    });
    
    this.createDiscount({
      name: "Gratis koffie bij Starbucks",
      description: "Ontvang een gratis koffie naar keuze bij Starbucks Amsterdam",
      imageUrl: "https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9",
      partner: "Starbucks",
      discountCode: "EXTRACOFFEE",
      category: "food",
      status: "active"
    });
    
    // Initialiseer enkele klanten (opdrachtgevers)
    const amsterdamMarriott = this.createClient({
      name: "Amsterdam Marriott Hotel",
      logo: "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
      description: "Luxe hotel in het centrum van Amsterdam",
      address: "Stadhouderskade 12",
      city: "Amsterdam",
      postalCode: "1054 ES",
      country: "Nederland",
      primaryContactName: "David Cubillos",
      primaryContactEmail: "david.cubillos@marriott.com",
      primaryContactPhone: "020-6075555",
      rating: 9,
      isActive: true
    });
    
    const nhHotel = this.createClient({
      name: "NH Collection Amsterdam",
      logo: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
      description: "Hotelketen met meerdere locaties in Amsterdam",
      address: "Stadhouderskade 7",
      city: "Amsterdam",
      postalCode: "1054 ES",
      country: "Nederland",
      primaryContactName: "Sandra Meijer",
      primaryContactEmail: "s.meijer@nh-hotels.com",
      primaryContactPhone: "020-5567890",
      rating: 8,
      isActive: true
    });
    
    const pulitzer = this.createClient({
      name: "Pulitzer Amsterdam",
      logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      description: "Boutique hotel bestaande uit 25 grachtenpanden",
      address: "Prinsengracht 315-331",
      city: "Amsterdam",
      postalCode: "1016 GZ",
      country: "Nederland",
      primaryContactName: "Lotte de Vries",
      primaryContactEmail: "lotte.devries@pulitzeramsterdam.com",
      primaryContactPhone: "020-5235235",
      rating: 9,
      isActive: true
    });
    
    // Voeg enkele locaties toe
    const marriottCentrum = this.createLocation({
      clientId: amsterdamMarriott.id,
      name: "Marriott Centrum",
      address: "Stadhouderskade 12",
      city: "Amsterdam",
      postalCode: "1054 ES",
      contactName: "Receptie Marriott",
      contactPhone: "020-6075555"
    });
    
    const nhKrasnapolsky = this.createLocation({
      clientId: nhHotel.id,
      name: "NH Collection Grand Hotel Krasnapolsky",
      address: "Dam 9",
      city: "Amsterdam",
      postalCode: "1012 JS",
      contactName: "Receptie Krasnapolsky",
      contactPhone: "020-5549111"
    });
    
    const nhBarbizon = this.createLocation({
      clientId: nhHotel.id,
      name: "NH Collection Barbizon Palace",
      address: "Prins Hendrikkade 59-72",
      city: "Amsterdam",
      postalCode: "1012 AD",
      contactName: "Receptie Barbizon",
      contactPhone: "020-5564564"
    });
    
    const pulitzerMain = this.createLocation({
      clientId: pulitzer.id,
      name: "Pulitzer Hoofdgebouw",
      address: "Prinsengracht 315-331",
      city: "Amsterdam",
      postalCode: "1016 GZ",
      contactName: "Receptie Pulitzer",
      contactPhone: "020-5235235"
    });
    
    // Voeg enkele diensten toe
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    this.createShift({
      clientId: amsterdamMarriott.id,
      locationId: marriottCentrum.id,
      title: "Breakfast Chef",
      description: "Bereiden van warme en koude ontbijtgerechten voor het buffet",
      date: tomorrow,
      startTime: "05:00",
      endTime: "12:00",
      hoursTotal: 7,
      requiredStaff: 2,
      serviceType: "keuken",
      status: "open",
      hourlyRate: 1450, // in centen
      dress_code: "Chef's uniform, wordt verstrekt",
      isFeatured: true
    });
    
    this.createShift({
      clientId: amsterdamMarriott.id,
      locationId: marriottCentrum.id,
      title: "Breakfast Service",
      description: "Bedienen van gasten tijdens het ontbijt",
      date: tomorrow,
      startTime: "06:00",
      endTime: "13:00",
      hoursTotal: 7,
      requiredStaff: 3,
      serviceType: "bediening",
      status: "open",
      hourlyRate: 1350, // in centen
      dress_code: "Zwarte broek, wit overhemd, zwarte schoenen"
    });
    
    this.createShift({
      clientId: nhHotel.id,
      locationId: nhKrasnapolsky.id,
      title: "Receptionist",
      description: "Check-in en check-out van hotelgasten",
      date: tomorrow,
      startTime: "14:00",
      endTime: "22:00",
      hoursTotal: 8,
      requiredStaff: 1,
      serviceType: "receptie",
      status: "open",
      hourlyRate: 1400, // in centen
      dress_code: "Uniform wordt verstrekt"
    });
    
    this.createShift({
      clientId: pulitzer.id,
      locationId: pulitzerMain.id,
      title: "Allround horeca medewerker",
      description: "Ondersteuning in de bediening en bar tijdens een business event",
      date: dayAfterTomorrow,
      startTime: "16:00",
      endTime: "23:00",
      hoursTotal: 7,
      requiredStaff: 4,
      serviceType: "horeca",
      status: "open",
      hourlyRate: 1375, // in centen
      dress_code: "Zwarte broek, wit overhemd, zwarte schoenen",
      isFeatured: true
    });
    
    this.createShift({
      clientId: nhHotel.id,
      locationId: nhBarbizon.id,
      title: "Barista / barmedewerker",
      description: "Bereiden van koffiespecialiteiten en cocktails in onze hotelbar",
      date: nextWeek,
      startTime: "15:00",
      endTime: "23:00",
      hoursTotal: 8,
      requiredStaff: 2,
      serviceType: "bediening",
      status: "open",
      hourlyRate: 1425, // in centen
      dress_code: "Uniform wordt verstrekt"
    });
    
    // Maak een pool aan met enkele medewerkers
    const horecaPool = this.createStaffPool({
      name: "Horeca Toppers",
      description: "Ervaren horecamedewerkers met minimaal 3 jaar ervaring",
      createdBy: 1, // admin user id
      isPrivate: false
    });
    
    // Voeg enkele medewerkers toe aan de pool
    this.addPoolMember({
      poolId: horecaPool.id,
      userId: 3 // jan
    });
    
    this.addPoolMember({
      poolId: horecaPool.id,
      userId: 4 // maria
    });
    
    this.addPoolMember({
      poolId: horecaPool.id,
      userId: 5 // piet
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

  async updateUserMonthlyPoints(id: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      monthlyPoints: user.monthlyPoints + points
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
  
  // Leaderboard methods
  async getMonthlyLeaderboard(year?: number, month?: number): Promise<(User & { rank: number })[]> {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
    
    // Get all active users sorted by monthly points (descending)
    const users = Array.from(this.users.values())
      .filter(user => user.status === 'active' && user.role === 'employee')
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .slice(0, 10); // Top 10 only
    
    // Add rank to each user
    return users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }

  async getPreviousMonthWinner(): Promise<User | undefined> {
    const currentDate = new Date();
    const previousMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    const year = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    // Find the winner from monthly leaders table
    const winners = Array.from(this.monthlyLeaders.values())
      .filter(leader => leader.year === year && leader.month === previousMonth)
      .sort((a, b) => a.rank - b.rank);
    
    if (winners.length > 0) {
      return this.getUser(winners[0].userId);
    }
    
    return undefined;
  }

  async resetMonthlyPoints(): Promise<number> {
    let resetCount = 0;
    
    for (const [id, user] of this.users.entries()) {
      if (user.role === 'employee' && user.monthlyPoints > 0) {
        const updatedUser = { ...user, monthlyPoints: 0 };
        this.users.set(id, updatedUser);
        resetCount++;
      }
    }
    
    return resetCount;
  }

  async saveMonthlyLeaders(year: number, month: number): Promise<void> {
    // Get current leaderboard
    const leaderboard = await this.getMonthlyLeaderboard(year, month);
    
    // Save top 10 to monthly leaders table
    for (const leader of leaderboard) {
      const monthlyLeader: MonthlyLeader = {
        id: this.currentIds.monthlyLeaders++,
        userId: leader.id,
        year,
        month,
        points: leader.monthlyPoints,
        rank: leader.rank,
        createdAt: new Date()
      };
      
      this.monthlyLeaders.set(monthlyLeader.id, monthlyLeader);
    }
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
      
      // Update monthly points for earned transactions
      if (transaction.type === 'earned') {
        await this.updateUserMonthlyPoints(transaction.userId, transaction.amount);
      }
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
  
  // Discount methods implementatie
  async createDiscount(insertDiscount: InsertDiscount): Promise<Discount> {
    const id = this.currentIds.discounts++;
    const now = new Date();
    
    const discount: Discount = {
      id,
      name: insertDiscount.name,
      description: insertDiscount.description || null,
      imageUrl: insertDiscount.imageUrl || null,
      partner: insertDiscount.partner,
      discountCode: insertDiscount.discountCode,
      category: insertDiscount.category || null,
      status: insertDiscount.status || 'active',
      createdAt: now,
      updatedAt: now
    };
    
    this.discounts.set(id, discount);
    return discount;
  }
  
  async getDiscounts(): Promise<Discount[]> {
    return Array.from(this.discounts.values());
  }
  
  async getDiscount(id: number): Promise<Discount | undefined> {
    return this.discounts.get(id);
  }
  
  async updateDiscount(id: number, discountData: Partial<InsertDiscount>): Promise<Discount | undefined> {
    const discount = await this.getDiscount(id);
    if (!discount) return undefined;
    
    const updatedDiscount: Discount = {
      ...discount,
      ...discountData,
      updatedAt: new Date()
    };
    
    this.discounts.set(id, updatedDiscount);
    return updatedDiscount;
  }
  
  async deleteDiscount(id: number): Promise<boolean> {
    return this.discounts.delete(id);
  }
  
  // Client (opdrachtgever) methods
  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentIds.clients++;
    const now = new Date();
    
    const client: Client = {
      id,
      name: insertClient.name,
      logo: insertClient.logo || null,
      description: insertClient.description || null,
      address: insertClient.address || null,
      city: insertClient.city || null,
      postalCode: insertClient.postalCode || null,
      country: insertClient.country || "Nederland",
      primaryContactName: insertClient.primaryContactName || null,
      primaryContactEmail: insertClient.primaryContactEmail || null,
      primaryContactPhone: insertClient.primaryContactPhone || null,
      notes: insertClient.notes || null,
      rating: insertClient.rating || null,
      isActive: insertClient.isActive !== undefined ? insertClient.isActive : true,
      createdAt: now,
      updatedAt: now
    };
    
    this.clients.set(id, client);
    return client;
  }
  
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;
    
    const now = new Date();
    
    const updatedClient: Client = {
      ...client,
      ...clientData,
      updatedAt: now
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }
  
  async searchClients(query: string): Promise<Client[]> {
    query = query.toLowerCase();
    return Array.from(this.clients.values()).filter(
      (client) => 
        client.name.toLowerCase().includes(query) ||
        (client.description && client.description.toLowerCase().includes(query)) ||
        (client.city && client.city.toLowerCase().includes(query)) ||
        (client.primaryContactName && client.primaryContactName.toLowerCase().includes(query))
    );
  }
  
  // Location methods
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.currentIds.locations++;
    const now = new Date();
    
    const location: Location = {
      id,
      clientId: insertLocation.clientId,
      name: insertLocation.name,
      address: insertLocation.address || null,
      city: insertLocation.city || null,
      postalCode: insertLocation.postalCode || null,
      country: insertLocation.country || "Nederland",
      contactName: insertLocation.contactName || null,
      contactEmail: insertLocation.contactEmail || null,
      contactPhone: insertLocation.contactPhone || null,
      notes: insertLocation.notes || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.locations.set(id, location);
    return location;
  }
  
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }
  
  async getLocationsByClientId(clientId: number): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(
      (location) => location.clientId === clientId
    );
  }
  
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }
  
  async updateLocation(id: number, locationData: Partial<InsertLocation>): Promise<Location | undefined> {
    const location = await this.getLocation(id);
    if (!location) return undefined;
    
    const now = new Date();
    
    const updatedLocation: Location = {
      ...location,
      ...locationData,
      updatedAt: now
    };
    
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }
  
  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }
  
  // Shift methods
  async createShift(insertShift: InsertShift): Promise<Shift> {
    const id = this.currentIds.shifts++;
    const now = new Date();
    
    // Bereken het totaal aantal uren tussen start- en eindtijd
    const startHours = typeof insertShift.startTime === 'string' 
      ? parseInt(insertShift.startTime.split(':')[0], 10) 
      : 0;
    const endHours = typeof insertShift.endTime === 'string' 
      ? parseInt(insertShift.endTime.split(':')[0], 10) 
      : 0;
    const hoursTotal = endHours - startHours;
    
    const shift: Shift = {
      id,
      clientId: insertShift.clientId,
      locationId: insertShift.locationId || null,
      title: insertShift.title,
      description: insertShift.description || null,
      date: insertShift.date,
      startTime: insertShift.startTime,
      endTime: insertShift.endTime,
      hoursTotal: insertShift.hoursTotal || hoursTotal,
      requiredStaff: insertShift.requiredStaff || 1,
      assignedStaff: insertShift.assignedStaff || 0,
      serviceType: insertShift.serviceType,
      status: insertShift.status || 'open',
      hourlyRate: insertShift.hourlyRate || null,
      notes: insertShift.notes || null,
      dress_code: insertShift.dress_code || null,
      isFeatured: insertShift.isFeatured || false,
      isHoliday: insertShift.isHoliday || false,
      createdAt: now,
      updatedAt: now
    };
    
    this.shifts.set(id, shift);
    return shift;
  }
  
  async getShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values());
  }
  
  async getShift(id: number): Promise<Shift | undefined> {
    return this.shifts.get(id);
  }
  
  async getShiftsByDate(date: Date): Promise<Shift[]> {
    const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    return Array.from(this.shifts.values()).filter(shift => {
      const shiftDateString = new Date(shift.date).toISOString().split('T')[0];
      return shiftDateString === dateString;
    });
  }
  
  async getShiftsByDateRange(startDate: Date, endDate: Date): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= startDate && shiftDate <= endDate;
    });
  }
  
  async getShiftsByClientId(clientId: number): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(
      (shift) => shift.clientId === clientId
    );
  }
  
  async updateShift(id: number, shiftData: Partial<InsertShift>): Promise<Shift | undefined> {
    const shift = await this.getShift(id);
    if (!shift) return undefined;
    
    const now = new Date();
    
    const updatedShift: Shift = {
      ...shift,
      ...shiftData,
      updatedAt: now
    };
    
    this.shifts.set(id, updatedShift);
    return updatedShift;
  }
  
  async updateShiftStatus(id: number, status: string): Promise<Shift | undefined> {
    const shift = await this.getShift(id);
    if (!shift) return undefined;
    
    const now = new Date();
    
    const updatedShift: Shift = {
      ...shift,
      status: status as any, // We casten naar 'any' omdat TypeScript anders klaagt over enum types
      updatedAt: now
    };
    
    this.shifts.set(id, updatedShift);
    return updatedShift;
  }
  
  async updateShiftStaffCount(id: number, assignedStaff: number): Promise<Shift | undefined> {
    const shift = await this.getShift(id);
    if (!shift) return undefined;
    
    const now = new Date();
    
    const updatedShift: Shift = {
      ...shift,
      assignedStaff,
      updatedAt: now
    };
    
    this.shifts.set(id, updatedShift);
    return updatedShift;
  }
  
  async deleteShift(id: number): Promise<boolean> {
    return this.shifts.delete(id);
  }
  
  // Assignment methods
  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentIds.assignments++;
    const now = new Date();
    
    const assignment: Assignment = {
      id,
      shiftId: insertAssignment.shiftId,
      userId: insertAssignment.userId,
      status: insertAssignment.status || 'pending',
      assignedAt: now,
      confirmedAt: insertAssignment.confirmedAt || null,
      canceledAt: insertAssignment.canceledAt || null,
      cancelReason: insertAssignment.cancelReason || null,
      notes: insertAssignment.notes || null,
      checkInTime: insertAssignment.checkInTime || null,
      checkOutTime: insertAssignment.checkOutTime || null,
      actualHours: insertAssignment.actualHours || null,
      rating: insertAssignment.rating || null,
      ratingNotes: insertAssignment.ratingNotes || null,
      updatedAt: now
    };
    
    this.assignments.set(id, assignment);
    
    // Update het aantal toegewezen personen voor deze shift
    const shift = await this.getShift(assignment.shiftId);
    if (shift) {
      await this.updateShiftStaffCount(shift.id, shift.assignedStaff + 1);
    }
    
    return assignment;
  }
  
  async getAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values());
  }
  
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }
  
  async getAssignmentsByShiftId(shiftId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.shiftId === shiftId
    );
  }
  
  async getAssignmentsByUserId(userId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.userId === userId
    );
  }
  
  async updateAssignment(id: number, assignmentData: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(id);
    if (!assignment) return undefined;
    
    const now = new Date();
    
    const updatedAssignment: Assignment = {
      ...assignment,
      ...assignmentData,
      updatedAt: now
    };
    
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async updateAssignmentStatus(id: number, status: string, reason?: string): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(id);
    if (!assignment) return undefined;
    
    const now = new Date();
    
    const updatedAssignment: Assignment = {
      ...assignment,
      status: status as any, // Casten naar 'any' vanwege TypeScript type checking
      updatedAt: now
    };
    
    // Afhankelijk van de nieuwe status, update relevante velden
    if (status === 'confirmed') {
      updatedAssignment.confirmedAt = now;
    } else if (status === 'canceled') {
      updatedAssignment.canceledAt = now;
      if (reason) {
        updatedAssignment.cancelReason = reason;
      }
      
      // Als een assignment wordt geannuleerd, update het aantal toegewezen personen
      const shift = await this.getShift(assignment.shiftId);
      if (shift && shift.assignedStaff > 0) {
        await this.updateShiftStaffCount(shift.id, shift.assignedStaff - 1);
      }
    } else if (status === 'completed') {
      // Als een assignment is voltooid, update het checkOutTime als dat nog niet is ingesteld
      if (!updatedAssignment.checkOutTime) {
        updatedAssignment.checkOutTime = now;
      }
    }
    
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async recordCheckInOut(id: number, checkInTime?: Date, checkOutTime?: Date): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(id);
    if (!assignment) return undefined;
    
    const now = new Date();
    
    const updatedAssignment: Assignment = {
      ...assignment,
      updatedAt: now
    };
    
    if (checkInTime) {
      updatedAssignment.checkInTime = checkInTime;
    }
    
    if (checkOutTime) {
      updatedAssignment.checkOutTime = checkOutTime;
      
      // Bereken werkelijke gewerkte uren als beide tijdstippen beschikbaar zijn
      if (updatedAssignment.checkInTime) {
        const startTime = updatedAssignment.checkInTime.getTime();
        const endTime = checkOutTime.getTime();
        const hoursWorked = Math.round((endTime - startTime) / (1000 * 60 * 60));
        updatedAssignment.actualHours = hoursWorked;
      }
    }
    
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async deleteAssignment(id: number): Promise<boolean> {
    const assignment = await this.getAssignment(id);
    if (!assignment) return false;
    
    // Update het aantal toegewezen personen voor deze shift
    const shift = await this.getShift(assignment.shiftId);
    if (shift && shift.assignedStaff > 0) {
      await this.updateShiftStaffCount(shift.id, shift.assignedStaff - 1);
    }
    
    return this.assignments.delete(id);
  }
  
  // StaffPool methods
  async createStaffPool(insertPool: InsertStaffPool): Promise<StaffPool> {
    const id = this.currentIds.staffPools++;
    const now = new Date();
    
    const pool: StaffPool = {
      id,
      name: insertPool.name,
      description: insertPool.description || null,
      createdBy: insertPool.createdBy,
      isPrivate: insertPool.isPrivate || false,
      createdAt: now,
      updatedAt: now
    };
    
    this.staffPools.set(id, pool);
    return pool;
  }
  
  async getStaffPools(): Promise<StaffPool[]> {
    return Array.from(this.staffPools.values());
  }
  
  async getStaffPoolsByCreator(userId: number): Promise<StaffPool[]> {
    return Array.from(this.staffPools.values()).filter(
      (pool) => pool.createdBy === userId
    );
  }
  
  async getStaffPool(id: number): Promise<StaffPool | undefined> {
    return this.staffPools.get(id);
  }
  
  async updateStaffPool(id: number, poolData: Partial<InsertStaffPool>): Promise<StaffPool | undefined> {
    const pool = await this.getStaffPool(id);
    if (!pool) return undefined;
    
    const now = new Date();
    
    const updatedPool: StaffPool = {
      ...pool,
      ...poolData,
      updatedAt: now
    };
    
    this.staffPools.set(id, updatedPool);
    return updatedPool;
  }
  
  async deleteStaffPool(id: number): Promise<boolean> {
    return this.staffPools.delete(id);
  }
  
  // PoolMember methods
  async addPoolMember(insertPoolMember: InsertPoolMember): Promise<PoolMember> {
    const id = this.currentIds.poolMembers++;
    const now = new Date();
    
    const poolMember: PoolMember = {
      id,
      poolId: insertPoolMember.poolId,
      userId: insertPoolMember.userId,
      addedAt: now
    };
    
    this.poolMembers.set(id, poolMember);
    return poolMember;
  }
  
  async getPoolMembers(poolId: number): Promise<PoolMember[]> {
    return Array.from(this.poolMembers.values()).filter(
      (member) => member.poolId === poolId
    );
  }
  
  async getPoolMemberships(userId: number): Promise<PoolMember[]> {
    return Array.from(this.poolMembers.values()).filter(
      (member) => member.userId === userId
    );
  }
  
  async removePoolMember(poolId: number, userId: number): Promise<boolean> {
    const membership = Array.from(this.poolMembers.values()).find(
      (member) => member.poolId === poolId && member.userId === userId
    );
    
    if (!membership) return false;
    
    return this.poolMembers.delete(membership.id);
  }

  // Challenge methods
  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = this.currentIds.challenges++;
    const now = new Date();
    
    const challenge: Challenge = {
      id,
      title: insertChallenge.title,
      description: insertChallenge.description,
      category: insertChallenge.category,
      type: insertChallenge.type || 'doorlopend',
      points: insertChallenge.points || null,
      status: insertChallenge.status || 'active',
      createdAt: now,
      updatedAt: now
    };
    
    this.challenges.set(id, challenge);
    return challenge;
  }

  async getChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values());
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async updateChallenge(id: number, data: Partial<InsertChallenge>): Promise<Challenge | undefined> {
    const challenge = this.challenges.get(id);
    if (!challenge) return undefined;

    const updatedChallenge: Challenge = {
      ...challenge,
      ...data,
      updatedAt: new Date()
    };

    this.challenges.set(id, updatedChallenge);
    return updatedChallenge;
  }

  async deleteChallenge(id: number): Promise<boolean> {
    return this.challenges.delete(id);
  }

  // Challenge Step methods
  async createChallengeStep(insertStep: InsertChallengeStep): Promise<ChallengeStep> {
    const id = this.currentIds.challengeSteps++;
    const now = new Date();
    
    const step: ChallengeStep = {
      id,
      challengeId: insertStep.challengeId,
      stepNumber: insertStep.stepNumber,
      title: insertStep.title || null,
      description: insertStep.description || null,
      targetValue: insertStep.targetValue,
      pointsReward: insertStep.pointsReward,
      badgeTitle: insertStep.badgeTitle || null,
      isCompleted: insertStep.isCompleted || false,
      createdAt: now,
      updatedAt: now
    };
    
    this.challengeSteps.set(id, step);
    return step;
  }

  async getChallengeSteps(challengeId: number): Promise<ChallengeStep[]> {
    return Array.from(this.challengeSteps.values()).filter(
      (step) => step.challengeId === challengeId
    );
  }

  async getChallengeStep(id: number): Promise<ChallengeStep | undefined> {
    return this.challengeSteps.get(id);
  }

  async updateChallengeStep(id: number, stepData: Partial<InsertChallengeStep>): Promise<ChallengeStep | undefined> {
    const step = this.challengeSteps.get(id);
    if (!step) return undefined;

    const updatedStep: ChallengeStep = {
      ...step,
      ...stepData,
      updatedAt: new Date()
    };

    this.challengeSteps.set(id, updatedStep);
    return updatedStep;
  }

  async deleteChallengeStep(id: number): Promise<boolean> {
    return this.challengeSteps.delete(id);
  }

  // User Challenge Progress methods
  async createUserChallengeProgress(insertProgress: InsertUserChallengeProgress): Promise<UserChallengeProgress> {
    const id = this.currentIds.userChallengeProgress++;
    const now = new Date();
    
    const progress: UserChallengeProgress = {
      id,
      userId: insertProgress.userId,
      challengeId: insertProgress.challengeId,
      currentStepId: insertProgress.currentStepId || null,
      currentValue: insertProgress.currentValue || 0,
      completedSteps: insertProgress.completedSteps || [],
      isCompleted: insertProgress.isCompleted || false,
      createdAt: now,
      updatedAt: now
    };
    
    this.userChallengeProgress.set(id, progress);
    return progress;
  }

  async getUserChallengeProgress(userId: number): Promise<UserChallengeProgressWithDetails[]> {
    const userProgress = Array.from(this.userChallengeProgress.values()).filter(
      (progress) => progress.userId === userId
    );

    const progressWithDetails: UserChallengeProgressWithDetails[] = [];

    for (const progress of userProgress) {
      const challenge = await this.getChallenge(progress.challengeId);
      if (!challenge) continue;

      const steps = await this.getChallengeSteps(progress.challengeId);
      const currentStep = progress.currentStepId ? 
        steps.find(s => s.id === progress.currentStepId) : 
        steps.find(s => s.stepNumber === 1);
      
      const nextStepNumber = currentStep ? currentStep.stepNumber + 1 : 1;
      const nextStep = steps.find(s => s.stepNumber === nextStepNumber);

      progressWithDetails.push({
        ...progress,
        challenge,
        currentStep,
        nextStep
      });
    }

    // Add challenges user hasn't started yet
    const allChallenges = await this.getChallenges();
    for (const challenge of allChallenges) {
      if (challenge.status !== 'active') continue;
      
      const hasProgress = userProgress.some(p => p.challengeId === challenge.id);
      if (!hasProgress) {
        const steps = await this.getChallengeSteps(challenge.id);
        const firstStep = steps.find(s => s.stepNumber === 1);
        
        progressWithDetails.push({
          id: 0,
          userId,
          challengeId: challenge.id,
          currentStepId: null,
          currentValue: 0,
          completedSteps: [],
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          challenge,
          currentStep: undefined,
          nextStep: firstStep
        });
      }
    }

    return progressWithDetails;
  }

  async getUserChallengeProgressById(id: number): Promise<UserChallengeProgress | undefined> {
    return this.userChallengeProgress.get(id);
  }

  async updateUserChallengeProgress(id: number, progressData: Partial<InsertUserChallengeProgress>): Promise<UserChallengeProgress | undefined> {
    const progress = this.userChallengeProgress.get(id);
    if (!progress) return undefined;

    const updatedProgress: UserChallengeProgress = {
      ...progress,
      ...progressData,
      updatedAt: new Date()
    };

    this.userChallengeProgress.set(id, updatedProgress);
    return updatedProgress;
  }

  async deleteUserChallengeProgress(id: number): Promise<boolean> {
    return this.userChallengeProgress.delete(id);
  }

  async completeUserChallengeStep(userId: number, challengeId: number, stepId: number): Promise<{
    progress: UserChallengeProgress;
    pointsAwarded: number;
  } | null> {
    const step = this.challengeSteps.get(stepId);
    if (!step || step.challengeId !== challengeId) return null;

    let progress = Array.from(this.userChallengeProgress.values()).find(
      p => p.userId === userId && p.challengeId === challengeId
    );

    if (!progress) {
      // Create new progress
      const id = this.currentIds.userChallengeProgress++;
      progress = {
        id,
        userId,
        challengeId,
        currentStepId: stepId,
        currentValue: step.targetValue,
        completedSteps: [stepId],
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.userChallengeProgress.set(id, progress);
    } else {
      // Update existing progress
      const newCompletedSteps = [...progress.completedSteps, stepId];
      const steps = await this.getChallengeSteps(challengeId);
      const isCompleted = newCompletedSteps.length >= steps.length;
      
      const updatedProgress = {
        ...progress,
        currentStepId: stepId,
        currentValue: step.targetValue,
        completedSteps: newCompletedSteps,
        isCompleted,
        updatedAt: new Date()
      };
      
      this.userChallengeProgress.set(progress.id, updatedProgress);
      progress = updatedProgress;
    }

    // Award points
    await this.addPointTransaction({
      userId,
      amount: step.pointsReward,
      type: 'earned',
      description: `Challenge stap voltooid: ${step.title}`,
      source: 'challenge',
      sourceId: stepId.toString()
    });

    return {
      progress,
      pointsAwarded: step.pointsReward
    };
  }

  private initializeChallenges() {
    // Initialize challenges
    this.challenges.set(1, {
      id: 1,
      title: "Diensten draaien",
      description: "Verdien punten door diensten te werken en jouw ervaring uit te breiden",
      category: "shifts",
      status: "active",
      type: "doorlopend",
      points: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challenges.set(2, {
      id: 2,
      title: "Last-minute inzet",
      description: "Spring bij wanneer het nodig is en verdien extra punten",
      category: "lastminute",
      status: "active",
      type: "doorlopend",
      points: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challenges.set(3, {
      id: 3,
      title: "Vrienden aandragen",
      description: "Deel de EXTRA ervaring met je vrienden en verdien punten",
      category: "referrals",
      status: "active",
      type: "doorlopend",
      points: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challenges.set(4, {
      id: 4,
      title: "Deel een story",
      description: "Deel EXTRA content op social media en tag ons voor extra punten",
      category: "social",
      status: "active",
      type: "doorlopend",
      points: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize challenge steps
    // Diensten draaien steps
    this.challengeSteps.set(1, {
      id: 1,
      challengeId: 1,
      stepNumber: 1,
      title: "Eerste diensten",
      description: "Werk 10 diensten",
      targetValue: 10,
      pointsReward: 200,
      badgeTitle: "Starter",
      isCompleted: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challengeSteps.set(2, {
      id: 2,
      challengeId: 1,
      stepNumber: 2,
      title: "Ervaren werker",
      description: "Werk 25 diensten",
      targetValue: 25,
      pointsReward: 300,
      badgeTitle: "Professional",
      isCompleted: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challengeSteps.set(3, {
      id: 3,
      challengeId: 1,
      stepNumber: 3,
      title: "EXTRA veteraan",
      description: "Werk 50 diensten",
      targetValue: 50,
      pointsReward: 500,
      badgeTitle: "Veteraan",
      isCompleted: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Last-minute inzet steps
    this.challengeSteps.set(4, {
      id: 4,
      challengeId: 2,
      stepNumber: 1,
      title: "Flexibele helper",
      description: "Accepteer 5 last-minute diensten",
      targetValue: 5,
      pointsReward: 150,
      badgeTitle: "Helper",
      isCompleted: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challengeSteps.set(5, {
      id: 5,
      challengeId: 2,
      stepNumber: 2,
      title: "Altijd beschikbaar",
      description: "Accepteer 10 last-minute diensten",
      targetValue: 10,
      pointsReward: 250,
      badgeTitle: "Beschikbaar",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challengeSteps.set(6, {
      id: 6,
      challengeId: 2,
      stepNumber: 3,
      title: "Last-minute held",
      description: "Accepteer 20 last-minute diensten",
      targetValue: 20,
      pointsReward: 400,
      badgeTitle: "Held",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Vrienden aandragen steps
    this.challengeSteps.set(7, {
      id: 7,
      challengeId: 3,
      stepNumber: 1,
      title: "Eerste referral",
      description: "Draag 3 vrienden aan",
      targetValue: 3,
      pointsReward: 300,
      badgeTitle: "Referrer",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challengeSteps.set(8, {
      id: 8,
      challengeId: 3,
      stepNumber: 2,
      title: "Netwerker",
      description: "Draag 5 vrienden aan",
      targetValue: 5,
      pointsReward: 400,
      badgeTitle: "Netwerker",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challengeSteps.set(9, {
      id: 9,
      challengeId: 3,
      stepNumber: 3,
      title: "EXTRA ambassadeur",
      description: "Draag 10 vrienden aan",
      targetValue: 10,
      pointsReward: 600,
      badgeTitle: "Ambassador",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Deel een story steps
    this.challengeSteps.set(10, {
      id: 10,
      challengeId: 4,
      stepNumber: 1,
      title: "Eerste story",
      description: "Deel 1 story met EXTRA content en tag ons",
      targetValue: 1,
      pointsReward: 100,
      badgeTitle: "Storyteller",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challengeSteps.set(11, {
      id: 11,
      challengeId: 4,
      stepNumber: 2,
      title: "Social media fan",
      description: "Deel 5 stories met EXTRA content",
      targetValue: 5,
      pointsReward: 200,
      badgeTitle: "Social Fan",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.challengeSteps.set(12, {
      id: 12,
      challengeId: 4,
      stepNumber: 3,
      title: "EXTRA influencer",
      description: "Deel 10 stories met EXTRA content",
      targetValue: 10,
      pointsReward: 350,
      badgeTitle: "EXTRA Influencer",
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Initialize all default data
  private initializeData() {
    console.log("Initializing challenges...");
    this.initializeChallenges();
    console.log("Challenges initialized successfully");
  }
}

export const storage = new MemStorage();
// Initialize challenges after storage is created
(storage as any).initializeData();
