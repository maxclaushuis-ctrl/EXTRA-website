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
  type Badge, type InsertBadge,
  type UserBadge, type InsertUserBadge,
  type UserBadgeWithDetails,
  // Marketing types
  type MarketingTemplate, type InsertMarketingTemplate,
  type MarketingCampaign, type InsertMarketingCampaign,
  type MarketingCampaignRecipient, type InsertMarketingCampaignRecipient,
  type MarketingCampaignClick, type InsertMarketingCampaignClick,
  // Plansysteem types
  type Client, type InsertClient,
  type Location, type InsertLocation,
  type Shift, type InsertShift,
  type Assignment, type InsertAssignment,
  type StaffPool, type InsertStaffPool,
  type PoolMember, type InsertPoolMember,
  // Sollicitanten types
  candidates as candidatesTable,
  salaryScales as salaryScalesTable,
  candidateAuditLog as candidateAuditLogTable,
  candidateImports as candidateImportsTable,
  type Candidate, type InsertCandidate,
  type CandidateFunctionProfile, type InsertCandidateFunctionProfile,
  type SalaryScale, type InsertSalaryScale,
  type CandidateAuditLog, type InsertCandidateAuditLog,
  type CandidateImport, type InsertCandidateImport,
  type CandidateWithDetails,
  applications as applicationsTable,
  type Application, type InsertApplication,
  blogPosts as blogPostsTable,
  type BlogPost, type InsertBlogPost,
  vacancyPosts as vacancyPostsTable,
  type VacancyPost, type InsertVacancyPost,
  crmCompanies as crmCompaniesTable,
  crmContacts as crmContactsTable,
  crmNotes as crmNotesTable,
  crmReminders as crmRemindersTable,
  type CrmCompany, type InsertCrmCompany,
  type CrmContact, type InsertCrmContact,
  type CrmNote, type InsertCrmNote,
  type CrmReminder, type InsertCrmReminder,
} from "@shared/schema";
import { createHash } from "crypto";
import { db } from "./db";
import { eq, ilike, or, desc, asc, sql, and, gte, lte } from "drizzle-orm";

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
  
  // Overloaded methods for getUserChallengeProgress
  getUserChallengeProgress(userId: number): Promise<(UserChallengeProgress & { challenge: Challenge; currentStep?: ChallengeStep; nextStep?: ChallengeStep })[]>;
  getUserChallengeProgress(userId: number, challengeId: number): Promise<UserChallengeProgress | undefined>;
  getUserChallengeProgress(userId: number, challengeId?: number): Promise<any>;
  
  createUserChallengeProgress(progress: InsertUserChallengeProgress): Promise<UserChallengeProgress>;
  updateUserChallengeProgress(progressId: number, progress: Partial<InsertUserChallengeProgress>): Promise<UserChallengeProgress | undefined>;
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
  
  // Additional user methods
  getAllUsers(): Promise<User[]>;
  
  // Challenge request methods
  createChallengeRequest(request: any): Promise<any>;
  getChallengeRequests(): Promise<any[]>;
  updateChallengeRequest(id: number, data: any): Promise<any>;
  
  // Challenge completion methods
  completeChallengeStep(userId: number, challengeId: number, stepNumber: number, reason: string): Promise<void>;
  
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

  // Marketing Template methods
  createMarketingTemplate(template: InsertMarketingTemplate): Promise<MarketingTemplate>;
  getMarketingTemplates(): Promise<MarketingTemplate[]>;
  getMarketingTemplate(id: number): Promise<MarketingTemplate | undefined>;
  updateMarketingTemplate(id: number, templateData: Partial<InsertMarketingTemplate>): Promise<MarketingTemplate | undefined>;
  deleteMarketingTemplate(id: number): Promise<boolean>;

  // Marketing Campaign methods
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  getMarketingCampaigns(): Promise<MarketingCampaign[]>;
  getMarketingCampaign(id: number): Promise<MarketingCampaign | undefined>;
  updateMarketingCampaign(id: number, campaignData: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign | undefined>;
  deleteMarketingCampaign(id: number): Promise<boolean>;
  sendMarketingCampaign(id: number): Promise<boolean>;

  // Marketing Campaign Recipient methods
  createMarketingCampaignRecipient(recipient: InsertMarketingCampaignRecipient): Promise<MarketingCampaignRecipient>;
  getMarketingCampaignRecipients(campaignId: number): Promise<MarketingCampaignRecipient[]>;
  updateMarketingCampaignRecipient(id: number, recipientData: Partial<InsertMarketingCampaignRecipient>): Promise<MarketingCampaignRecipient | undefined>;
  deleteMarketingCampaignRecipient(id: number): Promise<boolean>;

  // Marketing Campaign Click methods
  createMarketingCampaignClick(click: InsertMarketingCampaignClick): Promise<MarketingCampaignClick>;
  getMarketingCampaignClicks(campaignId: number): Promise<MarketingCampaignClick[]>;
  getMarketingCampaignClicksByRecipient(recipientId: number): Promise<MarketingCampaignClick[]>;

  // ==========================================
  // SOLLICITANTEN (Candidates) methods
  // ==========================================
  
  // Candidate CRUD
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidates(filters?: {
    functionType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ candidates: Candidate[]; total: number }>;
  getCandidate(id: number): Promise<CandidateWithDetails | undefined>;
  updateCandidate(id: number, candidateData: Partial<InsertCandidate>): Promise<Candidate | undefined>;
  deleteCandidate(id: number): Promise<boolean>;
  updateCandidateStatus(id: number, status: string, changedByUserId?: number): Promise<Candidate | undefined>;
  anonymizeCandidate(id: number, changedByUserId?: number): Promise<boolean>;
  
  // Salary Scale methods
  createSalaryScale(scale: InsertSalaryScale): Promise<SalaryScale>;
  getSalaryScales(functionType?: string): Promise<SalaryScale[]>;
  getSalaryScale(id: number): Promise<SalaryScale | undefined>;
  getSalaryScaleByAge(age: number, functionType?: string): Promise<SalaryScale | undefined>;
  updateSalaryScale(id: number, scaleData: Partial<InsertSalaryScale>): Promise<SalaryScale | undefined>;
  deleteSalaryScale(id: number): Promise<boolean>;
  
  // Candidate Audit Log methods
  createCandidateAuditLog(log: InsertCandidateAuditLog): Promise<CandidateAuditLog>;
  getCandidateAuditLogs(candidateId: number): Promise<CandidateAuditLog[]>;
  
  // Candidate Import methods
  createCandidateImport(importData: InsertCandidateImport): Promise<CandidateImport>;
  getCandidateImport(id: number): Promise<CandidateImport | undefined>;
  updateCandidateImport(id: number, importData: Partial<InsertCandidateImport>): Promise<CandidateImport | undefined>;
  getCandidateImports(): Promise<CandidateImport[]>;

  // ==========================================
  // SOLLICITATIES (Applications) methods
  // ==========================================
  createApplication(app: InsertApplication): Promise<Application>;
  getApplications(filters?: {
    functionType?: string;
    interviewer?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: Application[]; total: number }>;
  getApplicationById(id: number): Promise<Application | undefined>;
  updateApplicationStatus(id: number, status: string): Promise<Application | undefined>;

  // Blog post methods
  getBlogPosts(filters?: { status?: string; category?: string; limit?: number; offset?: number }): Promise<{ posts: BlogPost[]; total: number }>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  publishScheduledBlogPosts(): Promise<number>;

  // Vacancy CMS methods
  getVacancyPosts(filters?: { status?: string; functionType?: string; location?: string; limit?: number; offset?: number }): Promise<{ posts: VacancyPost[]; total: number }>;
  getVacancyPostBySlug(slug: string): Promise<VacancyPost | undefined>;
  getVacancyPostById(id: number): Promise<VacancyPost | undefined>;
  createVacancyPost(post: InsertVacancyPost): Promise<VacancyPost>;
  updateVacancyPost(id: number, data: Partial<InsertVacancyPost>): Promise<VacancyPost | undefined>;
  deleteVacancyPost(id: number): Promise<boolean>;
  duplicateVacancyPost(id: number): Promise<VacancyPost | undefined>;

  // CRM methods
  getCrmCompanies(filters?: { isClient?: boolean; type?: string; owner?: string; phase?: string; abc?: string; search?: string }): Promise<CrmCompany[]>;
  getCrmCompanyById(id: number): Promise<CrmCompany | undefined>;
  createCrmCompany(data: InsertCrmCompany): Promise<CrmCompany>;
  updateCrmCompany(id: number, data: Partial<InsertCrmCompany>): Promise<CrmCompany | undefined>;
  deleteCrmCompany(id: number): Promise<boolean>;
  getCrmContacts(companyId: number): Promise<CrmContact[]>;
  createCrmContact(data: InsertCrmContact): Promise<CrmContact>;
  updateCrmContact(id: number, data: Partial<InsertCrmContact>): Promise<CrmContact | undefined>;
  deleteCrmContact(id: number): Promise<boolean>;
  getCrmNotes(companyId: number): Promise<CrmNote[]>;
  createCrmNote(data: InsertCrmNote): Promise<CrmNote>;
  deleteCrmNote(id: number): Promise<boolean>;
  getCrmReminders(filters?: { companyId?: number; owner?: string; status?: string }): Promise<CrmReminder[]>;
  createCrmReminder(data: InsertCrmReminder): Promise<CrmReminder>;
  updateCrmReminder(id: number, data: Partial<InsertCrmReminder>): Promise<CrmReminder | undefined>;
  deleteCrmReminder(id: number): Promise<boolean>;
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
  // Marketing data
  private marketingTemplates: Map<number, MarketingTemplate>;
  private marketingCampaigns: Map<number, MarketingCampaign>;
  private marketingCampaignRecipients: Map<number, MarketingCampaignRecipient>;
  private marketingCampaignClicks: Map<number, MarketingCampaignClick>;
  // Plansysteem data
  private clients: Map<number, Client>;
  private locations: Map<number, Location>;
  private shifts: Map<number, Shift>;
  private assignments: Map<number, Assignment>;
  private staffPools: Map<number, StaffPool>;
  private poolMembers: Map<number, PoolMember>;
  private challengeRequests: Map<number, any>;
  private applicationRecords: Map<number, Application>;
  
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
    // Marketing ids
    marketingTemplates: number;
    marketingCampaigns: number;
    marketingCampaignRecipients: number;
    marketingCampaignClicks: number;
    // Plansysteem ids
    clients: number;
    locations: number;
    shifts: number;
    assignments: number;
    staffPools: number;
    poolMembers: number;
    challengeRequests: number;
    applicationRecords: number;
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
    
    // Marketing maps initialiseren
    this.marketingTemplates = new Map();
    this.marketingCampaigns = new Map();
    this.marketingCampaignRecipients = new Map();
    this.marketingCampaignClicks = new Map();
    
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
      // Marketing ids
      marketingTemplates: 1,
      marketingCampaigns: 1,
      marketingCampaignRecipients: 1,
      marketingCampaignClicks: 1,
      // Plansysteem ids
      clients: 1,
      locations: 1,
      shifts: 1,
      assignments: 1,
      staffPools: 1,
      poolMembers: 1,
      challengeRequests: 1,
      applicationRecords: 1
    };
    this.applicationRecords = new Map();
    
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
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "dark"
      },
      tags: ["intern"],
    });
    
    // Testgebruikers voor rewards functionaliteit
    this.createUser({
      email: "jan@extra.nl",
      password: this.hashPassword("password123"),
      firstName: "Jan",
      lastName: "Bakker",
      role: "employee",
      status: "active",
      points: 100,
      monthlyPoints: 75,
      phone: "0612345678",
      profileImage: "",
      apiId: "EXT001",
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "light"
      },
      tags: ["actief"],
    });
    
    this.createUser({
      email: "maria@extra.nl",
      password: this.hashPassword("password123"),
      firstName: "Maria",
      lastName: "de Vries",
      role: "employee",
      status: "active",
      points: 150,
      monthlyPoints: 85,
      phone: "0612345679",
      profileImage: "",
      apiId: "EXT002",
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "light"
      },
      tags: ["ervaren"],
    });
    
    this.createUser({
      email: "piet@extra.nl",
      password: this.hashPassword("password123"),
      firstName: "Piet",
      lastName: "Jansen",
      role: "employee",
      status: "active",
      points: 200,
      monthlyPoints: 95,
      phone: "0612345670",
      profileImage: "",
      apiId: "EXT003",
      settings: {
        notifications: true,
        emailAlerts: true,
        theme: "light"
      },
      tags: ["loyaal"],
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
      redemptionType: "code",
      discountCode: "EXTRA10PATH",
      category: "entertainment",
      status: "active"
    });
    
    this.createDiscount({
      name: "Gratis koffie bij Starbucks",
      description: "Ontvang een gratis koffie naar keuze bij Starbucks Amsterdam",
      imageUrl: "https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9",
      partner: "Starbucks",
      redemptionType: "code",
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
      monthlyPoints: insertUser.monthlyPoints !== undefined ? insertUser.monthlyPoints : 0,
      profileImage: insertUser.profileImage || null,
      apiId: insertUser.apiId || null,
      tags: insertUser.tags || [],
      settings: insertUser.settings || null,


      dateJoined: now,
    };
    
    this.users.set(id, user);
    
    // Automatisch challenge progress aanmaken voor alle bestaande challenges
    const challenges = Array.from(this.challenges.values());
    for (const challenge of challenges) {
      const progressId = this.currentIds.userChallengeProgress++;
      const progress: UserChallengeProgress = {
        id: progressId,
        userId: user.id,
        challengeId: challenge.id,
        currentStepId: null,
        currentValue: 0,
        completedSteps: [],
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.userChallengeProgress.set(progressId, progress);
    }
    
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
      redemptionType: insertDiscount.redemptionType || 'code',
      discountCode: insertDiscount.discountCode || null,
      qrImageUrl: insertDiscount.qrImageUrl || null,
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
    
    // Automatisch challenge progress aanmaken voor alle bestaande gebruikers
    const users = Array.from(this.users.values());
    for (const user of users) {
      const progressId = this.currentIds.userChallengeProgress++;
      const progress: UserChallengeProgress = {
        id: progressId,
        userId: user.id,
        challengeId: challenge.id,
        currentStepId: null,
        currentValue: 0,
        completedSteps: [],
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.userChallengeProgress.set(progressId, progress);
    }
    
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

  // Overloaded implementation for getUserChallengeProgress
  async getUserChallengeProgress(userId: number): Promise<UserChallengeProgressWithDetails[]>;
  async getUserChallengeProgress(userId: number, challengeId: number): Promise<UserChallengeProgress | undefined>;
  async getUserChallengeProgress(userId: number, challengeId?: number): Promise<UserChallengeProgressWithDetails[] | UserChallengeProgress | undefined> {
    if (challengeId !== undefined) {
      // Return specific challenge progress
      return Array.from(this.userChallengeProgress.values()).find(
        (progress) => progress.userId === userId && progress.challengeId === challengeId
      );
    }
    
    // Return all challenge progress for user (original implementation)
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

  // New method to create user challenge progress
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
      lastSyncAt: insertProgress.lastSyncAt || null,
      planworksData: insertProgress.planworksData || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.userChallengeProgress.set(id, progress);
    return progress;
  }

  async getUserChallengeProgressById(id: number): Promise<UserChallengeProgress | undefined> {
    return this.userChallengeProgress.get(id);
  }

  // Updated method to use progressId instead of compound key
  async updateUserChallengeProgress(progressId: number, progressData: Partial<InsertUserChallengeProgress>): Promise<UserChallengeProgress | undefined> {
    const progress = this.userChallengeProgress.get(progressId);
    if (!progress) return undefined;

    const updatedProgress: UserChallengeProgress = {
      ...progress,
      ...progressData,
      updatedAt: new Date()
    };

    this.userChallengeProgress.set(progressId, updatedProgress);
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

  // Marketing Template methods
  async createMarketingTemplate(template: InsertMarketingTemplate): Promise<MarketingTemplate> {
    const id = this.currentIds.marketingTemplates++;
    const now = new Date();
    const newTemplate: MarketingTemplate = {
      id,
      ...template,
      type: template.type || 'email',
      createdAt: now,
      updatedAt: now
    };
    this.marketingTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async getMarketingTemplates(): Promise<MarketingTemplate[]> {
    return Array.from(this.marketingTemplates.values());
  }

  async getMarketingTemplate(id: number): Promise<MarketingTemplate | undefined> {
    return this.marketingTemplates.get(id);
  }

  async updateMarketingTemplate(id: number, templateData: Partial<InsertMarketingTemplate>): Promise<MarketingTemplate | undefined> {
    const template = this.marketingTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...templateData, updatedAt: new Date() };
    this.marketingTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteMarketingTemplate(id: number): Promise<boolean> {
    return this.marketingTemplates.delete(id);
  }

  // Marketing Campaign methods
  async createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const id = this.currentIds.marketingCampaigns++;
    const now = new Date();
    const newCampaign: MarketingCampaign = {
      id,
      ...campaign,
      createdAt: now,
      updatedAt: now
    };
    this.marketingCampaigns.set(id, newCampaign);
    return newCampaign;
  }

  async getMarketingCampaigns(): Promise<MarketingCampaign[]> {
    return Array.from(this.marketingCampaigns.values());
  }

  async getMarketingCampaign(id: number): Promise<MarketingCampaign | undefined> {
    return this.marketingCampaigns.get(id);
  }

  async updateMarketingCampaign(id: number, campaignData: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign | undefined> {
    const campaign = this.marketingCampaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...campaignData, updatedAt: new Date() };
    this.marketingCampaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteMarketingCampaign(id: number): Promise<boolean> {
    return this.marketingCampaigns.delete(id);
  }

  async sendMarketingCampaign(id: number): Promise<boolean> {
    const campaign = this.marketingCampaigns.get(id);
    if (!campaign) return false;
    
    // Update campaign status to 'sent'
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.updatedAt = new Date();
    this.marketingCampaigns.set(id, campaign);
    
    return true;
  }

  // Marketing Campaign Recipient methods
  async createMarketingCampaignRecipient(recipient: InsertMarketingCampaignRecipient): Promise<MarketingCampaignRecipient> {
    const id = this.currentIds.marketingCampaignRecipients++;
    const now = new Date();
    const newRecipient: MarketingCampaignRecipient = {
      id,
      ...recipient,
      createdAt: now,
      updatedAt: now
    };
    this.marketingCampaignRecipients.set(id, newRecipient);
    return newRecipient;
  }

  async getMarketingCampaignRecipients(campaignId: number): Promise<MarketingCampaignRecipient[]> {
    return Array.from(this.marketingCampaignRecipients.values()).filter(r => r.campaignId === campaignId);
  }

  async updateMarketingCampaignRecipient(id: number, recipientData: Partial<InsertMarketingCampaignRecipient>): Promise<MarketingCampaignRecipient | undefined> {
    const recipient = this.marketingCampaignRecipients.get(id);
    if (!recipient) return undefined;
    
    const updatedRecipient = { ...recipient, ...recipientData, updatedAt: new Date() };
    this.marketingCampaignRecipients.set(id, updatedRecipient);
    return updatedRecipient;
  }

  async deleteMarketingCampaignRecipient(id: number): Promise<boolean> {
    return this.marketingCampaignRecipients.delete(id);
  }

  // Marketing Campaign Click methods
  async createMarketingCampaignClick(click: InsertMarketingCampaignClick): Promise<MarketingCampaignClick> {
    const id = this.currentIds.marketingCampaignClicks++;
    const now = new Date();
    const newClick: MarketingCampaignClick = {
      id,
      ...click,
      createdAt: now,
      updatedAt: now
    };
    this.marketingCampaignClicks.set(id, newClick);
    return newClick;
  }

  async getMarketingCampaignClicks(campaignId: number): Promise<MarketingCampaignClick[]> {
    return Array.from(this.marketingCampaignClicks.values()).filter(c => c.campaignId === campaignId);
  }

  async getMarketingCampaignClicksByRecipient(recipientId: number): Promise<MarketingCampaignClick[]> {
    return Array.from(this.marketingCampaignClicks.values()).filter(c => c.recipientId === recipientId);
  }

  // ==========================================
  // SOLLICITANTEN (Candidates) methods
  // ==========================================
  
  private candidatesMap: Map<number, Candidate> = new Map();
  private salaryScalesMap: Map<number, SalaryScale> = new Map();
  private candidateAuditLogsMap: Map<number, CandidateAuditLog> = new Map();
  private candidateImportsMap: Map<number, CandidateImport> = new Map();
  private candidateIdCounter = 1;
  private salaryScaleIdCounter = 1;
  private candidateAuditLogIdCounter = 1;
  private candidateImportIdCounter = 1;

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db.insert(candidatesTable).values({
      ...candidate,
      status: candidate.status || 'in_behandeling',
    }).returning();
    return newCandidate;
  }

  async getCandidates(filters?: {
    functionType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ candidates: Candidate[]; total: number }> {
    const conditions: any[] = [];
    
    if (filters?.functionType) {
      conditions.push(eq(candidatesTable.functionType, filters.functionType as any));
    }
    if (filters?.status) {
      conditions.push(eq(candidatesTable.status, filters.status as any));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(candidatesTable.firstName, searchPattern),
          ilike(candidatesTable.lastName, searchPattern),
          ilike(candidatesTable.email, searchPattern),
          ilike(candidatesTable.phone, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(candidatesTable)
      .where(whereClause);
    
    const total = Number(countResult?.count || 0);
    const page = filters?.page || 1;
    const limitVal = filters?.limit || 25;
    const offset = (page - 1) * limitVal;

    const candidates = await db
      .select()
      .from(candidatesTable)
      .where(whereClause)
      .orderBy(desc(candidatesTable.createdAt))
      .limit(limitVal)
      .offset(offset);
    
    return { candidates, total };
  }

  async getCandidate(id: number): Promise<CandidateWithDetails | undefined> {
    const [candidate] = await db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.id, id));
    
    if (!candidate) return undefined;
    
    const createdBy = candidate.createdByUserId 
      ? this.users.get(candidate.createdByUserId) 
      : undefined;
    
    let salaryScale: SalaryScale | undefined;
    if (candidate.salaryScaleId) {
      [salaryScale] = await db
        .select()
        .from(salaryScalesTable)
        .where(eq(salaryScalesTable.id, candidate.salaryScaleId));
    }
    
    return { ...candidate, createdBy, salaryScale };
  }

  async updateCandidate(id: number, candidateData: Partial<InsertCandidate>): Promise<Candidate | undefined> {
    const [updated] = await db
      .update(candidatesTable)
      .set({ ...candidateData, updatedAt: new Date() })
      .where(eq(candidatesTable.id, id))
      .returning();
    return updated;
  }

  async deleteCandidate(id: number): Promise<boolean> {
    const result = await db
      .delete(candidatesTable)
      .where(eq(candidatesTable.id, id))
      .returning();
    return result.length > 0;
  }

  async updateCandidateStatus(id: number, status: string, changedByUserId?: number): Promise<Candidate | undefined> {
    const [candidate] = await db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.id, id));
    
    if (!candidate) return undefined;
    
    const oldStatus = candidate.status;
    const [updated] = await db
      .update(candidatesTable)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(candidatesTable.id, id))
      .returning();
    
    try {
      await this.createCandidateAuditLog({
        candidateId: id,
        action: 'status_changed',
        changedByUserId: changedByUserId ?? null,
        changeData: { fieldName: 'status', oldValue: oldStatus, newValue: status },
        ipAddress: null
      });
    } catch (auditErr) {
      console.warn('Audit log kon niet worden aangemaakt (niet-kritiek):', auditErr);
    }
    
    return updated;
  }

  async anonymizeCandidate(id: number, changedByUserId?: number): Promise<boolean> {
    const [candidate] = await db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.id, id));
    
    if (!candidate) return false;
    
    await db
      .update(candidatesTable)
      .set({
        firstName: 'Geanonimiseerd',
        lastName: 'Kandidaat',
        email: null,
        phone: null,
        birthDate: null,
        nationality: null,
        city: null,
        photoUrl: null,
        notes: null,
        anonymizedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(candidatesTable.id, id));
    
    try {
      await this.createCandidateAuditLog({
        candidateId: id,
        action: 'anonymized',
        changedByUserId: changedByUserId ?? null,
        changeData: { description: 'Kandidaat geanonimiseerd conform AVG' },
        ipAddress: null
      });
    } catch (auditErr) {
      console.warn('Audit log kon niet worden aangemaakt (niet-kritiek):', auditErr);
    }
    
    return true;
  }

  async createSalaryScale(scale: InsertSalaryScale): Promise<SalaryScale> {
    const [newScale] = await db.insert(salaryScalesTable).values(scale).returning();
    return newScale;
  }

  async getSalaryScales(functionType?: string): Promise<SalaryScale[]> {
    const conditions: any[] = [eq(salaryScalesTable.isActive, true)];
    if (functionType) {
      conditions.push(
        or(
          eq(salaryScalesTable.functionType, functionType),
          sql`${salaryScalesTable.functionType} IS NULL`
        )
      );
    }
    return db.select().from(salaryScalesTable).where(and(...conditions));
  }

  async getSalaryScale(id: number): Promise<SalaryScale | undefined> {
    const [scale] = await db.select().from(salaryScalesTable).where(eq(salaryScalesTable.id, id));
    return scale;
  }

  async getSalaryScaleByAge(age: number, functionType?: string): Promise<SalaryScale | undefined> {
    const conditions: any[] = [
      eq(salaryScalesTable.isActive, true),
      lte(salaryScalesTable.ageMin, age),
      or(
        sql`${salaryScalesTable.ageMax} IS NULL`,
        gte(salaryScalesTable.ageMax, age)
      )
    ];
    if (functionType) {
      conditions.push(
        or(
          eq(salaryScalesTable.functionType, functionType),
          sql`${salaryScalesTable.functionType} IS NULL`
        )
      );
    }
    const [scale] = await db.select().from(salaryScalesTable).where(and(...conditions)).limit(1);
    return scale;
  }

  async updateSalaryScale(id: number, scaleData: Partial<InsertSalaryScale>): Promise<SalaryScale | undefined> {
    const [updated] = await db
      .update(salaryScalesTable)
      .set({ ...scaleData, updatedAt: new Date() })
      .where(eq(salaryScalesTable.id, id))
      .returning();
    return updated;
  }

  async deleteSalaryScale(id: number): Promise<boolean> {
    const result = await db.delete(salaryScalesTable).where(eq(salaryScalesTable.id, id)).returning();
    return result.length > 0;
  }

  async createCandidateAuditLog(log: InsertCandidateAuditLog): Promise<CandidateAuditLog> {
    const [newLog] = await db.insert(candidateAuditLogTable).values(log).returning();
    return newLog;
  }

  async getCandidateAuditLogs(candidateId: number): Promise<CandidateAuditLog[]> {
    return db
      .select()
      .from(candidateAuditLogTable)
      .where(eq(candidateAuditLogTable.candidateId, candidateId))
      .orderBy(desc(candidateAuditLogTable.createdAt));
  }

  async createCandidateImport(importData: InsertCandidateImport): Promise<CandidateImport> {
    const [newImport] = await db.insert(candidateImportsTable).values(importData).returning();
    return newImport;
  }

  async getCandidateImport(id: number): Promise<CandidateImport | undefined> {
    const [importRecord] = await db.select().from(candidateImportsTable).where(eq(candidateImportsTable.id, id));
    return importRecord;
  }

  async updateCandidateImport(id: number, importData: Partial<InsertCandidateImport>): Promise<CandidateImport | undefined> {
    const [updated] = await db
      .update(candidateImportsTable)
      .set(importData)
      .where(eq(candidateImportsTable.id, id))
      .returning();
    return updated;
  }

  async getCandidateImports(): Promise<CandidateImport[]> {
    return db.select().from(candidateImportsTable).orderBy(desc(candidateImportsTable.createdAt));
  }

  private async initializeChallenges() {
    // Skip initialization if challenges already exist
    if (this.challenges.size > 0) {
      return;
    }
    
    // Import and run Planworks seed
    try {
      const { seedPlanworksChallenges } = await import('./planworks-seed');
      await seedPlanworksChallenges();
    } catch (error) {
      console.error('Failed to seed Planworks challenges:', error);
      // Fall back to basic challenges for development
      this.initializeBasicChallenges();
    }
  }

  private initializeBasicChallenges() {
    console.log('Initializing basic challenges as fallback...');
    
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
      category: "social_media",
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
  private async initializeData() {
    console.log("Initializing challenges...");
    await this.initializeChallenges();
    console.log("Challenges initialized successfully");
  }

  // Additional user methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Challenge request methods
  async createChallengeRequest(request: any): Promise<any> {
    const id = this.currentIds.challengeRequests || 1;
    this.currentIds.challengeRequests = id + 1;
    
    const challengeRequest = {
      id,
      challengeId: request.challengeId,
      userId: request.userId,
      message: request.message || '',
      evidence: request.evidence || null,
      status: request.status || 'pending',
      adminNote: null,
      processedAt: null,
      createdAt: new Date()
    };

    // Store in a temporary map (in production this would be database)
    if (!this.challengeRequests) {
      this.challengeRequests = new Map();
    }
    this.challengeRequests.set(id, challengeRequest);
    return challengeRequest;
  }

  async getChallengeRequests(): Promise<any[]> {
    if (!this.challengeRequests) return [];
    return Array.from(this.challengeRequests.values());
  }

  async updateChallengeRequest(id: number, data: any): Promise<any> {
    if (!this.challengeRequests) return undefined;
    
    const request = this.challengeRequests.get(id);
    if (!request) return undefined;

    const updatedRequest = {
      ...request,
      ...data,
      processedAt: data.status !== 'pending' ? new Date() : request.processedAt
    };

    this.challengeRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // ==========================================
  // SOLLICITATIES (Applications) implementation — backed by PostgreSQL
  // ==========================================
  async createApplication(app: InsertApplication): Promise<Application> {
    const [record] = await db.insert(applicationsTable).values({
      candidateId: app.candidateId ?? null,
      functionType: app.functionType,
      interviewer: app.interviewer ?? null,
      status: app.status ?? "nieuw",
      firstName: app.firstName ?? null,
      lastName: app.lastName ?? null,
      email: app.email ?? null,
      phone: app.phone ?? null,
      city: app.city ?? null,
      assessmentRating: app.assessmentRating ?? null,
      salaryScale: app.salaryScale ?? null,
      formData: app.formData ?? null,
      softskillsScore: app.softskillsScore ?? null,
      barScore: app.barScore ?? null,
      bedieningScore: app.bedieningScore ?? null,
      dinerScore: app.dinerScore ?? null,
    }).returning();
    return record;
  }

  async getApplications(filters?: {
    functionType?: string;
    interviewer?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: Application[]; total: number }> {
    let all = await db.select().from(applicationsTable).orderBy(desc(applicationsTable.createdAt));

    if (filters?.functionType && filters.functionType !== 'alle') {
      all = all.filter(a => a.functionType === filters.functionType);
    }
    if (filters?.interviewer && filters.interviewer !== 'alle') {
      all = all.filter(a => a.interviewer === filters.interviewer);
    }
    if (filters?.status && filters.status !== 'alle') {
      all = all.filter(a => a.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      all = all.filter(a =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
      );
    }
    if (filters?.dateFrom) {
      const from = new Date(filters.dateFrom);
      all = all.filter(a => new Date(a.createdAt!) >= from);
    }
    if (filters?.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      all = all.filter(a => new Date(a.createdAt!) <= to);
    }
    const total = all.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 10000;
    return { applications: all.slice(offset, offset + limit), total };
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    const [record] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
    return record;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    const [updated] = await db
      .update(applicationsTable)
      .set({ status })
      .where(eq(applicationsTable.id, id))
      .returning();
    return updated;
  }

  // Challenge completion methods
  async completeChallengeStep(userId: number, challengeId: number, stepNumber: number, reason: string): Promise<void> {
    // This would normally interact with the challenge progress system
    console.log(`Completing challenge step for user ${userId}, challenge ${challengeId}, step ${stepNumber}: ${reason}`);
    
    // Award points if step exists
    const steps = await this.getChallengeSteps(challengeId);
    const step = steps.find(s => s.stepNumber === stepNumber);
    
    if (step) {
      await this.createPointTransaction({
        userId,
        amount: step.pointsReward,
        type: 'earned',
        description: `Challenge voltooid: ${step.title || `Step ${stepNumber}`}`,
        source: 'challenge_manual',
        metadata: {
          challengeId,
          stepId: step.id,
          stepNumber,
          adminReason: reason
        }
      });

      // Update user points
      const user = await this.getUser(userId);
      if (user) {
        await this.updateUser(userId, {
          points: user.points + step.pointsReward,
          monthlyPoints: user.monthlyPoints + step.pointsReward
        });
      }
    }
  }

  // ==========================================
  // BLOG POSTS — PostgreSQL backed
  // ==========================================

  async getBlogPosts(filters?: { status?: string; category?: string; limit?: number; offset?: number }): Promise<{ posts: BlogPost[]; total: number }> {
    const conditions: any[] = [];
    if (filters?.status) conditions.push(eq(blogPostsTable.status, filters.status));
    if (filters?.category) conditions.push(eq(blogPostsTable.category, filters.category));
    const all = conditions.length > 0
      ? await db.select().from(blogPostsTable).where(and(...conditions)).orderBy(desc(blogPostsTable.publishedAt), desc(blogPostsTable.createdAt))
      : await db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.publishedAt), desc(blogPostsTable.createdAt));
    const total = all.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 100;
    return { posts: all.slice(offset, offset + limit), total };
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.slug, slug));
    return post;
  }

  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, id));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db.insert(blogPostsTable).values({ ...post, updatedAt: new Date() }).returning();
    return created;
  }

  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPostsTable).set({ ...data, updatedAt: new Date() }).where(eq(blogPostsTable.id, id)).returning();
    return updated;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async publishScheduledBlogPosts(): Promise<number> {
    const now = new Date();
    const result = await db.update(blogPostsTable)
      .set({ status: 'published', publishedAt: now, updatedAt: now })
      .where(and(eq(blogPostsTable.status, 'scheduled'), sql`${blogPostsTable.scheduledAt} <= ${now}`));
    return result.rowCount ?? 0;
  }

  // ── Vacancy CMS ──────────────────────────────────────────────
  async getVacancyPosts(filters?: { status?: string; functionType?: string; location?: string; limit?: number; offset?: number }): Promise<{ posts: VacancyPost[]; total: number }> {
    const conditions: any[] = [];
    if (filters?.status) conditions.push(eq(vacancyPostsTable.status, filters.status));
    if (filters?.functionType) conditions.push(eq(vacancyPostsTable.functionType, filters.functionType));
    if (filters?.location) conditions.push(eq(vacancyPostsTable.location, filters.location));
    const all = conditions.length > 0
      ? await db.select().from(vacancyPostsTable).where(and(...conditions)).orderBy(desc(vacancyPostsTable.updatedAt))
      : await db.select().from(vacancyPostsTable).orderBy(desc(vacancyPostsTable.updatedAt));
    const total = all.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 200;
    return { posts: all.slice(offset, offset + limit), total };
  }

  async getVacancyPostBySlug(slug: string): Promise<VacancyPost | undefined> {
    const [post] = await db.select().from(vacancyPostsTable).where(eq(vacancyPostsTable.slug, slug));
    return post;
  }

  async getVacancyPostById(id: number): Promise<VacancyPost | undefined> {
    const [post] = await db.select().from(vacancyPostsTable).where(eq(vacancyPostsTable.id, id));
    return post;
  }

  async createVacancyPost(post: InsertVacancyPost): Promise<VacancyPost> {
    const [created] = await db.insert(vacancyPostsTable).values({ ...post, updatedAt: new Date() }).returning();
    return created;
  }

  async updateVacancyPost(id: number, data: Partial<InsertVacancyPost>): Promise<VacancyPost | undefined> {
    const [updated] = await db.update(vacancyPostsTable).set({ ...data, updatedAt: new Date() }).where(eq(vacancyPostsTable.id, id)).returning();
    return updated;
  }

  async deleteVacancyPost(id: number): Promise<boolean> {
    const result = await db.delete(vacancyPostsTable).where(eq(vacancyPostsTable.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async duplicateVacancyPost(id: number): Promise<VacancyPost | undefined> {
    const original = await this.getVacancyPostById(id);
    if (!original) return undefined;
    const { id: _id, createdAt, updatedAt, publishedAt, ...rest } = original;
    const newSlug = `${rest.slug}-kopie-${Date.now().toString(36)}`;
    const [created] = await db.insert(vacancyPostsTable).values({
      ...rest,
      slug: newSlug,
      internalTitle: rest.internalTitle ? `${rest.internalTitle} (kopie)` : `${rest.title} (kopie)`,
      status: 'draft',
      publishedAt: null,
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  // ── CRM methods ──────────────────────────────────────────────────────────

  async getCrmCompanies(filters?: { isClient?: boolean; type?: string; owner?: string; phase?: string; abc?: string; search?: string }): Promise<CrmCompany[]> {
    let query = db.select().from(crmCompaniesTable).$dynamic();
    const conditions = [];
    if (filters?.isClient !== undefined) conditions.push(eq(crmCompaniesTable.isClient, filters.isClient));
    if (filters?.type && filters.type !== 'alle') conditions.push(eq(crmCompaniesTable.type, filters.type));
    if (filters?.owner && filters.owner !== 'alle') conditions.push(eq(crmCompaniesTable.owner, filters.owner));
    if (filters?.phase && filters.phase !== 'alle') conditions.push(eq(crmCompaniesTable.phase, filters.phase));
    if (filters?.abc && filters.abc !== 'alle') conditions.push(eq(crmCompaniesTable.abc, filters.abc));
    if (filters?.search) {
      conditions.push(or(
        ilike(crmCompaniesTable.name, `%${filters.search}%`),
        ilike(crmCompaniesTable.city, `%${filters.search}%`),
        ilike(crmCompaniesTable.region, `%${filters.search}%`),
      ) as any);
    }
    if (conditions.length > 0) query = query.where(and(...conditions) as any) as any;
    return query.orderBy(desc(crmCompaniesTable.createdAt));
  }

  async getCrmCompanyById(id: number): Promise<CrmCompany | undefined> {
    const [company] = await db.select().from(crmCompaniesTable).where(eq(crmCompaniesTable.id, id));
    return company;
  }

  async createCrmCompany(data: InsertCrmCompany): Promise<CrmCompany> {
    const [company] = await db.insert(crmCompaniesTable).values({ ...data, updatedAt: new Date() }).returning();
    return company;
  }

  async updateCrmCompany(id: number, data: Partial<InsertCrmCompany>): Promise<CrmCompany | undefined> {
    const [company] = await db.update(crmCompaniesTable).set({ ...data, updatedAt: new Date() }).where(eq(crmCompaniesTable.id, id)).returning();
    return company;
  }

  async deleteCrmCompany(id: number): Promise<boolean> {
    const result = await db.delete(crmCompaniesTable).where(eq(crmCompaniesTable.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCrmContacts(companyId: number): Promise<CrmContact[]> {
    return db.select().from(crmContactsTable).where(eq(crmContactsTable.companyId, companyId)).orderBy(desc(crmContactsTable.isPrimary));
  }

  async createCrmContact(data: InsertCrmContact): Promise<CrmContact> {
    const [contact] = await db.insert(crmContactsTable).values(data).returning();
    return contact;
  }

  async updateCrmContact(id: number, data: Partial<InsertCrmContact>): Promise<CrmContact | undefined> {
    const [contact] = await db.update(crmContactsTable).set(data).where(eq(crmContactsTable.id, id)).returning();
    return contact;
  }

  async deleteCrmContact(id: number): Promise<boolean> {
    const result = await db.delete(crmContactsTable).where(eq(crmContactsTable.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCrmNotes(companyId: number): Promise<CrmNote[]> {
    return db.select().from(crmNotesTable).where(eq(crmNotesTable.companyId, companyId)).orderBy(desc(crmNotesTable.createdAt));
  }

  async createCrmNote(data: InsertCrmNote): Promise<CrmNote> {
    const [note] = await db.insert(crmNotesTable).values(data).returning();
    return note;
  }

  async deleteCrmNote(id: number): Promise<boolean> {
    const result = await db.delete(crmNotesTable).where(eq(crmNotesTable.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCrmReminders(filters?: { companyId?: number; owner?: string; status?: string }): Promise<CrmReminder[]> {
    let query = db.select().from(crmRemindersTable).$dynamic();
    const conditions = [];
    if (filters?.companyId) conditions.push(eq(crmRemindersTable.companyId, filters.companyId));
    if (filters?.owner && filters.owner !== 'alle') conditions.push(eq(crmRemindersTable.owner, filters.owner));
    if (filters?.status && filters.status !== 'alle') conditions.push(eq(crmRemindersTable.status, filters.status));
    if (conditions.length > 0) query = query.where(and(...conditions) as any) as any;
    return query.orderBy(asc(crmRemindersTable.dueDate));
  }

  async createCrmReminder(data: InsertCrmReminder): Promise<CrmReminder> {
    const [reminder] = await db.insert(crmRemindersTable).values(data).returning();
    return reminder;
  }

  async updateCrmReminder(id: number, data: Partial<InsertCrmReminder>): Promise<CrmReminder | undefined> {
    const [reminder] = await db.update(crmRemindersTable).set(data).where(eq(crmRemindersTable.id, id)).returning();
    return reminder;
  }

  async deleteCrmReminder(id: number): Promise<boolean> {
    const result = await db.delete(crmRemindersTable).where(eq(crmRemindersTable.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new MemStorage();
// Initialize challenges after storage is created
(storage as any).initializeData();
