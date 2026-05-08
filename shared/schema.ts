import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, date, pgEnum, time, real, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Gebruikersstatus enumeratie
export const userRoleEnum = pgEnum('user_role', ['admin', 'employee']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);
export const rewardStatusEnum = pgEnum('reward_status', ['available', 'outofstock', 'hidden']);
export const transactionTypeEnum = pgEnum('transaction_type', ['earned', 'redeemed']);
export const ruleTypeEnum = pgEnum('rule_type', ['fixed', 'multiplication', 'custom']);
export const redemptionStatusEnum = pgEnum('redemption_status', ['pending', 'processing', 'shipped', 'completed', 'cancelled']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'scheduled', 'sent', 'cancelled']);
export const emailTemplateTypeEnum = pgEnum('email_template_type', ['general', 'welcome', 'birthday', 'marketing', 'review', 'reward']);

export const automationStatusEnum = pgEnum('automation_status', ['active', 'inactive', 'draft']);
export const automationTriggerTypeEnum = pgEnum('automation_trigger_type', ['birthday', 'new_account', 'points_threshold', 'custom']);
export const discountStatusEnum = pgEnum('discount_status', ['active', 'inactive', 'hidden']);
export const discountRedemptionTypeEnum = pgEnum('discount_redemption_type', ['code', 'qr']);
export const badgeTypeEnum = pgEnum('badge_type', ['points', 'challenge', 'milestone', 'special']);

// Challenge request enumeraties
export const challengeRequestStatusEnum = pgEnum('challenge_request_status', ['pending', 'approved', 'rejected']);

// Marketing campaign enumeraties
export const marketingCampaignStatusEnum = pgEnum('marketing_campaign_status', ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled']);
export const marketingCampaignTypeEnum = pgEnum('marketing_campaign_type', ['one_time', 'recurring', 'automated']);
export const marketingTemplateTypeEnum = pgEnum('marketing_template_type', ['email', 'sms', 'push']);
export const marketingRecipientStatusEnum = pgEnum('marketing_recipient_status', ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']);

// Plansysteem enumeraties
export const shiftStatusEnum = pgEnum('shift_status', ['open', 'filled', 'cancelled']);
export const serviceTypeEnum = pgEnum('service_type', ['horeca', 'bediening', 'keuken', 'receptie', 'schoonmaak', 'other']);
export const assignmentStatusEnum = pgEnum('assignment_status', ['pending', 'confirmed', 'canceled', 'completed', 'no_show']);

// Gebruikers schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  birthDate: date("birth_date"),
  dateJoined: timestamp("date_joined").defaultNow().notNull(),
  role: userRoleEnum("role").default('employee').notNull(),
  status: userStatusEnum("status").default('active').notNull(),
  points: integer("points").default(0).notNull(),
  monthlyPoints: integer("monthly_points").default(0).notNull(),
  profileImage: text("profile_image"),
  apiId: text("api_id"), // ID van medewerker in extern plansysteem
  tags: text("tags").array(), // Labels/tags voor medewerkers
  lastActivityDate: timestamp("last_activity_date"), // Laatste dienst/activiteit
  inactivityResetOverride: boolean("inactivity_reset_override").default(false), // Admin override
  employeeType: text("employee_type").default('general'), // 'chef', 'horecamedewerker', 'general'

  settings: json("settings").$type<{
    notifications: boolean,
    emailAlerts: boolean,
    theme: string
  }>(),
});

// Beloningen schema
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  extraDescription: text("extra_description"), // Uitgebreide beschrijving voor detail pop-up
  imageUrl: text("image_url"),
  pointsCost: integer("points_cost").notNull(),
  stock: integer("stock"), // Optioneel, alleen als beperkte voorraad
  status: rewardStatusEnum("status").default('available').notNull(),
  dateCreated: timestamp("date_created").defaultNow().notNull(),
  dateUpdated: timestamp("date_updated").defaultNow().notNull(),
});

// Puntentransacties schema
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Positief voor verdiend, negatief voor uitgegeven
  type: transactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(), // 'api', 'manual', 'reward_redemption', 'rule', etc.
  sourceId: text("source_id"), // ID van bron, bijvoorbeeld rule_id of reward_id
  metadata: json("metadata").$type<Record<string, any>>(), // Extra informatie zoals shift details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Beloningsverzilvering schema
export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  pointsCost: integer("points_cost").notNull(), // Historische waarde op moment van verzilvering
  status: redemptionStatusEnum("status").default('pending').notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maandelijkse toppers schema
export const monthlyLeaders = pgTable("monthly_leaders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  points: integer("points").notNull(),
  rank: integer("rank").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Challenge categorieën enum voor Planworks integratie
export const challengeCategoryEnum = pgEnum('challenge_category', [
  'shifts', // Totaal aantal gedraaide diensten
  'overtime', // Overwerk uren 
  'lastminute', // Last-minute diensten
  'punctuality', // Stiptheid (op tijd komen)
  'availability', // Beschikbaarheid percentages
  'client_rating', // Klantbeoordelingen
  'training_completion', // Training voltooiing
  'referrals', // Vrienden werven
  'social_media', // Social media activiteit
  'special_events' // Speciale evenementen
]);

// Challenges system met Planworks integratie
export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: challengeCategoryEnum('category').notNull(),
  type: text('type').notNull().default('doorlopend'), // 'eenmalig', 'doorlopend'
  points: integer('points'), // Voor eenmalige challenges
  status: text('status').notNull().default('active'), // 'active', 'inactive'
  planworksField: text('planworks_field'), // Welk veld uit Planworks data (bijv. 'shiftsCompleted')
  autoSync: boolean('auto_sync').default(true), // Automatisch syncen met Planworks
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const challengeSteps = pgTable('challenge_steps', {
  id: serial('id').primaryKey(),
  challengeId: integer('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  stepNumber: integer('step_number').notNull(),
  title: text('title'),
  description: text('description'),
  targetValue: integer('target_value').notNull(), // aantal diensten, referrals, etc.
  pointsReward: integer('points_reward').notNull(),
  badgeTitle: text('badge_title'), // optionele badge naam
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Challenge verzoeken schema (voor handmatige challenges)
export const challengeRequests = pgTable("challenge_requests", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message"),
  evidence: text("evidence"), // URL naar foto/bewijs
  status: challengeRequestStatusEnum("status").default('pending').notNull(),
  adminNote: text("admin_note"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});;

export const userChallengeProgress = pgTable('user_challenge_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  challengeId: integer('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  currentStepId: integer('current_step_id').references(() => challengeSteps.id),
  currentValue: integer('current_value').notNull().default(0), // huidige voortgang
  completedSteps: integer('completed_steps').array().notNull().default([]), // array van voltooide step IDs
  isCompleted: boolean('is_completed').notNull().default(false),
  lastSyncAt: timestamp('last_sync_at'), // Laatste sync met Planworks
  planworksData: json('planworks_data').$type<{
    shiftsCompleted?: number;
    overtimeHours?: number;
    lastMinuteShifts?: number;
    punctualityScore?: number;
    availabilityPercentage?: number;
    clientRating?: number;
    trainingsCompleted?: number;
    lastUpdated?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Regels voor het verdienen van punten
export const rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: ruleTypeEnum("type").notNull(), // fixed, multiplication, custom
  condition: json("condition").notNull().$type<{
    type: string, // 'shifts', 'rating', 'anniversary', etc.
    value: number | string, // Waarde om te vergelijken (bijv. aantal shifts)
    operator?: string, // '>', '>=', '=', etc.
  }>(),
  pointsValue: integer("points_value").notNull(), // Punten die worden toegekend
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Applicatieinstellingen schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  type: text("type").notNull(), // 'string', 'number', 'boolean', 'json', 'color'
  category: text("category").notNull(), // 'appearance', 'notifications', 'api', etc.
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// E-mail sjablonen schema
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: emailTemplateTypeEnum("type").default('general').notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Marketing campagnes schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  templateId: integer("template_id").references(() => emailTemplates.id),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(), 
  status: campaignStatusEnum("status").default('draft').notNull(),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  sentToCount: integer("sent_to_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Automatiserings-flows schema
export const automations = pgTable("automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: automationStatusEnum("status").default('draft').notNull(),
  flowData: json("flow_data").notNull().$type<{
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: Record<string, any>;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type?: string;
    }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
});

// Automatiserings-triggers schema
export const automationTriggers = pgTable("automation_triggers", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id").notNull().references(() => automations.id),
  triggerType: automationTriggerTypeEnum("trigger_type").notNull(),
  config: json("config").notNull().$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Automatiserings-acties schema
export const automationActions = pgTable("automation_actions", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id").notNull().references(() => automations.id),
  actionType: text("action_type").notNull(), // 'send_email', 'add_points', etc.
  config: json("config").notNull().$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Kortingsacties schema
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  partner: text("partner").notNull(), // Bedrijf/Organisatie die de korting aanbiedt
  redemptionType: discountRedemptionTypeEnum("redemption_type").default('code').notNull(), // Type verzilvering: code of qr
  discountCode: text("discount_code"), // De kortingscode (alleen voor type 'code')
  qrImageUrl: text("qr_image_url"), // Uploaded QR-afbeelding URL (alleen voor type 'qr')
  category: text("category"), // Categorie van de kortingsactie (bijv. 'food', 'shopping', 'entertainment')
  status: discountStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Marketing campagne tabellen
export const marketingTemplates = pgTable("marketing_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject"),
  type: marketingTemplateTypeEnum("type").default('email').notNull(),
  htmlContent: text("html_content"), // HTML inhoud van de e-mail
  textContent: text("text_content"), // Plain text versie
  grapesjsData: json("grapesjs_data"), // GrapesJS editor data
  previewImage: text("preview_image"), // Preview afbeelding URL
  placeholders: json("placeholders").$type<string[]>().default([]), // Gebruikte placeholders zoals %FIRSTNAME%
  isTemplate: boolean("is_template").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  templateId: integer("template_id").references(() => marketingTemplates.id),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  type: marketingCampaignTypeEnum("type").default('one_time').notNull(),
  status: marketingCampaignStatusEnum("status").default('draft').notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientFilters: json("recipient_filters").$type<{
    roles?: string[];
    status?: string[];
    tags?: string[];
    customFilter?: string;
  }>().default({}),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  bounceCount: integer("bounce_count").default(0),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketingCampaignRecipients = pgTable("marketing_campaign_recipients", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  email: text("email").notNull(),
  status: marketingRecipientStatusEnum("status").default('pending').notNull(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bounceReason: text("bounce_reason"),
  errorMessage: text("error_message"),
  trackingId: text("tracking_id").unique(), // Unique identifier for tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketingCampaignClicks = pgTable("marketing_campaign_clicks", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id).notNull(),
  recipientId: integer("recipient_id").references(() => marketingCampaignRecipients.id).notNull(),
  url: text("url").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Opdrachtgevers (klanten) schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"), // URL naar logo afbeelding
  description: text("description"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Nederland"),
  primaryContactName: text("primary_contact_name"),
  primaryContactEmail: text("primary_contact_email"),
  primaryContactPhone: text("primary_contact_phone"),
  notes: text("notes"),
  rating: integer("rating"), // 1-10 beoordeling van de opdrachtgever
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Locaties schema (bijv. verschillende vestigingen van een client)
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Nederland"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Diensten/shifts schema
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  locationId: integer("location_id").references(() => locations.id),
  title: text("title").notNull(), // Bijv. "Breakfast Chef", "Allround horeca medewerker"
  description: text("description"),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  hoursTotal: integer("hours_total").notNull(), // Berekende uren tussen start/eind
  requiredStaff: integer("required_staff").default(1).notNull(), // Aantal benodigde medewerkers
  assignedStaff: integer("assigned_staff").default(0), // Aantal toegewezen medewerkers
  serviceType: serviceTypeEnum("service_type").notNull(),
  status: shiftStatusEnum("status").default('open').notNull(),
  hourlyRate: integer("hourly_rate"), // Uurtarief in centen
  notes: text("notes"),
  dress_code: text("dress_code"), // Kledingvoorschriften
  isFeatured: boolean("is_featured").default(false), // Hoofdshift (visueel onderscheiden)
  isHoliday: boolean("is_holiday").default(false), // Is het een feestdag (visueel onderscheiden)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Toewijzingen van personeel aan shifts
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull().references(() => shifts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: assignmentStatusEnum("status").default('pending').notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  canceledAt: timestamp("canceled_at"),
  cancelReason: text("cancel_reason"), // Reden van annulering indien geannuleerd
  notes: text("notes"),
  checkInTime: timestamp("check_in_time"), // Tijdstip van inchecken op locatie
  checkOutTime: timestamp("check_out_time"), // Tijdstip van uitchecken op locatie
  actualHours: integer("actual_hours"), // Werkelijk gewerkte uren (kan afwijken van geplande uren)
  rating: integer("rating"), // 1-5 beoordeling voor de medewerker
  ratingNotes: text("rating_notes"), // Feedback over de medewerker
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Groepen/pools van personeel
export const staffPools = pgTable("staff_pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leden van pools
export const poolMembers = pgTable("pool_members", {
  id: serial("id").primaryKey(),
  poolId: integer("pool_id").notNull().references(() => staffPools.id),
  userId: integer("user_id").notNull().references(() => users.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Insert schema's
export const insertUserSchema = createInsertSchema(users).omit({
  id: true, 
  dateJoined: true
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  dateCreated: true,
  dateUpdated: true
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true
});

export const insertRedemptionSchema = createInsertSchema(redemptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pointsCost: true // We halen de pointsCost uit de reward tijdens het aanmaken
});

export const insertRuleSchema = createInsertSchema(rules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  sentAt: true,
  sentToCount: true,
  openCount: true,
  clickCount: true,
  createdAt: true,
  updatedAt: true
});

export const insertDiscountSchema = createInsertSchema(discounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Marketing insert schemas
export const insertMarketingTemplateSchema = createInsertSchema(marketingTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  sentAt: true,
  sentCount: true,
  deliveredCount: true,
  openCount: true,
  clickCount: true,
  bounceCount: true,
  createdAt: true,
  updatedAt: true
});

export const insertMarketingCampaignRecipientSchema = createInsertSchema(marketingCampaignRecipients).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  bounceReason: true,
  errorMessage: true,
  createdAt: true
});

export const insertMarketingCampaignClickSchema = createInsertSchema(marketingCampaignClicks).omit({
  id: true,
  clickedAt: true
});

// Formulier validatie schemas
export const userFormSchema = insertUserSchema.extend({
  password: z.string().min(8, { message: "Wachtwoord moet minstens 8 tekens bevatten" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

// Type definities
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;

export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;
export type Redemption = typeof redemptions.$inferSelect;

export type InsertRule = z.infer<typeof insertRuleSchema>;
export type Rule = typeof rules.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingsSchema>;
export type Setting = typeof settings.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
export type Discount = typeof discounts.$inferSelect;

// Marketing type definities
export type InsertMarketingTemplate = z.infer<typeof insertMarketingTemplateSchema>;
export type MarketingTemplate = typeof marketingTemplates.$inferSelect;

export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;

export type InsertMarketingCampaignRecipient = z.infer<typeof insertMarketingCampaignRecipientSchema>;
export type MarketingCampaignRecipient = typeof marketingCampaignRecipients.$inferSelect;

export type InsertMarketingCampaignClick = z.infer<typeof insertMarketingCampaignClickSchema>;
export type MarketingCampaignClick = typeof marketingCampaignClicks.$inferSelect;

// Automation insert schema's
export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
  nextRun: true
});

export const insertAutomationTriggerSchema = createInsertSchema(automationTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAutomationActionSchema = createInsertSchema(automationActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Automation type definities
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type Automation = typeof automations.$inferSelect;

export type InsertAutomationTrigger = z.infer<typeof insertAutomationTriggerSchema>;
export type AutomationTrigger = typeof automationTriggers.$inferSelect;

export type InsertAutomationAction = z.infer<typeof insertAutomationActionSchema>;
export type AutomationAction = typeof automationActions.$inferSelect;

// Behouden van bestaande applicant schema voor backward compatibility
export const applicants = pgTable("applicants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  dateApplied: timestamp("date_applied").defaultNow().notNull(),
  variant: text("variant"), // Which variant the user saw (A/B testing)
  status: text("status").default("pending").notNull(), // pending, contacted, hired, rejected
});

export const insertApplicantSchema = createInsertSchema(applicants).pick({
  name: true,
  email: true,
  phone: true,
  variant: true,
});

export const applicantFormSchema = insertApplicantSchema.extend({
  phone: z.string().min(10, { message: "Telefoonnummer moet minstens 10 cijfers bevatten" }),
  consent: z.boolean().refine(val => val === true, {
    message: "Je moet akkoord gaan met de voorwaarden"
  }),
});



export type InsertApplicant = z.infer<typeof insertApplicantSchema>;
export type ApplicantForm = z.infer<typeof applicantFormSchema>;
export type Applicant = typeof applicants.$inferSelect;

// Plansysteem insert schema's
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  assignedAt: true,
  updatedAt: true
});

export const insertStaffPoolSchema = createInsertSchema(staffPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPoolMemberSchema = createInsertSchema(poolMembers).omit({
  id: true,
  addedAt: true
});

// Plansysteem type definities
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertStaffPool = z.infer<typeof insertStaffPoolSchema>;
export type StaffPool = typeof staffPools.$inferSelect;

export type InsertPoolMember = z.infer<typeof insertPoolMemberSchema>;
export type PoolMember = typeof poolMembers.$inferSelect;

export const insertMonthlyLeaderSchema = createInsertSchema(monthlyLeaders).omit({
  id: true,
  createdAt: true
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertChallengeStepSchema = createInsertSchema(challengeSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserChallengeProgressSchema = createInsertSchema(userChallengeProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertMonthlyLeader = z.infer<typeof insertMonthlyLeaderSchema>;
export type MonthlyLeader = typeof monthlyLeaders.$inferSelect;

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

export type InsertChallengeStep = z.infer<typeof insertChallengeStepSchema>;
export type ChallengeStep = typeof challengeSteps.$inferSelect;

export type InsertUserChallengeProgress = z.infer<typeof insertUserChallengeProgressSchema>;
export type UserChallengeProgress = typeof userChallengeProgress.$inferSelect;

export type UserChallengeProgressWithDetails = UserChallengeProgress & {
  challenge: Challenge;
  currentStep?: ChallengeStep;
  nextStep?: ChallengeStep;
};

// Badges systeem
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: badgeTypeEnum("type").notNull(),
  icon: text("icon").notNull(), // emoji of icon naam
  color: text("color").notNull(), // hex color voor badge
  requirement: integer("requirement"), // bijv. aantal punten nodig
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User badges - welke badges een gebruiker heeft verdiend
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  badgeId: integer("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas voor badges
export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  createdAt: true,
  earnedAt: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

export type UserBadgeWithDetails = UserBadge & {
  badge: Badge;
};

// ==========================================
// SOLLICITANTEN MODULE (Pre-onboarding)
// ==========================================

// Sollicitant status enum
export const candidateStatusEnum = pgEnum('candidate_status', ['in_behandeling', 'gepland', 'aangenomen', 'afgewezen']);

// Functie types voor sollicitanten
export const candidateFunctionEnum = pgEnum('candidate_function', ['housekeeping', 'horecamedewerker', 'chef', 'frontoffice', 'logistiek']);

// ─── WhatsApp Fase 1 enums (vooruitgeschoven omdat candidates/employees ze gebruiken) ─
// Per-contact WhatsApp opt-in status. Wordt gebruikt om bulk-broadcasts te
// filteren (alleen 'actief' ontvangt berichten). 'opt_out' wordt automatisch
// gezet door STOP-detectie of Meta 'user blocked' error; 'verzending_faalt'
// is gereserveerd voor toekomstige delivery-failure tracking (Fase 2).
export const whatsappOptInStatusEnum = pgEnum('whatsapp_opt_in_status', ['actief', 'opt_out', 'verzending_faalt']);

// Categorie-label voor groep-leden. Drie categorieën komen uit drie tabellen:
//   sollicitant → candidates (status='in_behandeling')
//   kandidaat   → candidates (status='gepland')
//   medewerker  → employees  (status='nieuw' of 'actief')
// Snapshot bij toevoegen — verandert niet automatisch als de status wijzigt.
export const whatsappContactTypeEnum = pgEnum('whatsapp_contact_type', ['sollicitant', 'kandidaat', 'medewerker']);

// Audit action types
export const candidateAuditActionEnum = pgEnum('candidate_audit_action', ['created', 'updated', 'status_changed', 'imported', 'anonymized', 'deleted', 'photo_uploaded', 'interview_scheduled']);

// TWV (Tewerkstellingsvergunning) status enum
export const twvStatusEnum = pgEnum('twv_status', ['twv_nodig', 'twv_aangevraagd', 'info_nodig', 'twv_verstrekt', 'twv_verlopen']);

// Import status enum
export const candidateImportStatusEnum = pgEnum('candidate_import_status', ['pending', 'processing', 'completed', 'failed']);

// Sollicitanten (candidates) tabel - hoofdtabel voor alle sollicitanten
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  
  // Basis persoonsgegevens
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  phoneOriginal: text("phone_original"), // backup van originele waarde vóór WhatsApp E.164-normalisatie
  birthDate: date("birth_date"),
  nationality: text("nationality"),
  city: text("city"),
  language: text("language"), // Taal die ze spreken
  
  // Functie en status
  functionType: candidateFunctionEnum("function_type").notNull(),
  status: candidateStatusEnum("status").default('in_behandeling').notNull(),
  rejectionReason: text("rejection_reason"), // korte code, bv. "te_jong", "geen_taal", "cv", "geen_reactie"
  
  // TWV (Tewerkstellingsvergunning)
  needsTwv: boolean("needs_twv").default(false),
  twvStatus: twvStatusEnum("twv_status"),
  twvStartDate: date("twv_start_date"),
  twvEndDate: date("twv_end_date"),
  twvReminderSentAt: timestamp("twv_reminder_sent_at"),
  twvNotes: text("twv_notes"),
  
  // Gesprek planning
  interviewDate: date("interview_date"),
  interviewTime: time("interview_time"),
  interviewLocation: text("interview_location").default("Kantoor EXTRA"),
  calendlyInviteSentAt: timestamp("calendly_invite_sent_at"),       // Wanneer de Calendly-uitnodiging (mail) is verstuurd na CV-goedkeuring
  calendlyReminderSentAt: timestamp("calendly_reminder_sent_at"),   // Wanneer de WhatsApp-reminder na 3 dagen is verstuurd
  
  // Foto
  photoUrl: text("photo_url"),
  
  // Salaris
  desiredSalary: integer("desired_salary"), // In eurocenten per uur
  salaryScaleApplied: boolean("salary_scale_applied").default(false),
  salaryScaleId: integer("salary_scale_id"),
  
  // Scores en beoordelingen (1-5 of percentage)
  softSkillsScore: integer("soft_skills_score"), // percentage
  barScore: integer("bar_score"), // percentage
  serviceScore: integer("service_score"), // Bedieningscore percentage
  dinerScore: integer("diner_score"), // percentage
  overallImpressionScore: integer("overall_impression_score"), // 1-5
  communicationScore: integer("communication_score"), // 1-5
  
  // Vaardigheden (1-5 schaal)
  serviceSkills: integer("service_skills"), // Bediening vaardigheden
  barSkills: integer("bar_skills"), // Bar vaardigheden
  dinerSkills: integer("diner_skills"), // Diner vaardigheden
  
  // Specifieke skills (ja/nee)
  canCarryThreePlates: boolean("can_carry_three_plates").default(false), // 3 borden lopen
  isBarista: boolean("is_barista").default(false),
  canMakeCocktails: boolean("can_make_cocktails").default(false), // Cocktailshaker
  canDoWashing: boolean("can_do_washing").default(false), // Afwas
  isPromoter: boolean("is_promoter").default(false), // Promotiemedewerker
  isAssistantChef: boolean("is_assistant_chef").default(false), // Assistent chef
  
  // Praktische zaken
  hasDriversLicense: boolean("has_drivers_license").default(false),
  hasOvChipkaart: boolean("has_ov_chipkaart").default(false),
  workClothing: text("work_clothing"), // Werkkleding beschrijving
  
  // Beschikbaarheid
  availability: text("availability"), // Bijv. "Weekenden, 1x in de week"
  preferredWorkdays: text("preferred_workdays"), // Bijv. "Vrijdag, Zaterdag, Zondag"
  partOfDayPreference: text("part_of_day_preference"), // hint van de dag
  
  // Ervaring
  horecaExperience: text("horeca_experience"), // Bijv. "6 - 12 maanden"
  isOnlyJob: boolean("is_only_job"), // Enige bijbaan?
  previousExperience: text("previous_experience"), // erkervaring
  
  // Beoordeling na gesprek
  assessmentResult: text("assessment_result"), // Goede indruk, Topper, etc.
  experienceLevel: text("experience_level"), // Beperkte ervaring, Veel ervaring
  appearance: text("appearance"), // Nette kleding, verzorgd
  attitude: text("attitude"), // Spontaan, Verlegen
  
  // Herkomst
  sourceChannel: text("source_channel"), // Kanaal: Via ADE, Google, etc.
  isInternalInterview: boolean("is_internal_interview").default(false), // Aangemaakt via intern sollicitatieformulier (niet via website)
  
  // Opmerkingen
  notes: text("notes"),
  
  // CV status
  hasCv: boolean("has_cv").default(false),
  cvFilename: text("cv_filename"),
  cvReminderSentAt: timestamp("cv_reminder_sent_at"),
  cvReminderCount: integer("cv_reminder_count").default(0),
  reviewToken: text("review_token"),
  reviewTokenExpiresAt: timestamp("review_token_expires_at"),
  cvUploadToken: text("cv_upload_token"),
  
  // Wie heeft aangemaakt
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  
  // AVG/GDPR
  retentionUntil: date("retention_until"), // Datum tot wanneer data bewaard mag worden
  anonymizedAt: timestamp("anonymized_at"), // Wanneer geanonimiseerd
  
  // WhatsApp opt-in status — Fase 1 Contacten + STOP-detectie
  whatsappOptInStatus: whatsappOptInStatusEnum("whatsapp_opt_in_status").default('actief').notNull(),
  whatsappOptInChangedAt: timestamp("whatsapp_opt_in_changed_at"),
  whatsappOptInReason: text("whatsapp_opt_in_reason"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Functie-specifieke profielen (voor extra velden per functie type)
export const candidateFunctionProfiles = pgTable("candidate_function_profiles", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: 'cascade' }).notNull(),
  functionType: candidateFunctionEnum("function_type").notNull(),
  extraFields: json("extra_fields").$type<Record<string, any>>(), // Functie-specifieke velden
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Salarisschalen per leeftijd
export const salaryScales = pgTable("salary_scales", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Bijv. "21 jaar en ouder"
  functionType: candidateFunctionEnum("function_type"), // null = voor alle functies
  ageMin: integer("age_min").notNull(),
  ageMax: integer("age_max"), // null = geen maximum
  hourlyRate: integer("hourly_rate").notNull(), // In eurocenten
  currency: text("currency").default("EUR").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit log voor kandidaten (AVG compliance)
export const candidateAuditLog = pgTable("candidate_audit_log", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: 'set null' }),
  action: candidateAuditActionEnum("action").notNull(),
  changedByUserId: integer("changed_by_user_id").references(() => users.id),
  changeData: json("change_data").$type<{
    fieldName?: string;
    oldValue?: any;
    newValue?: any;
    description?: string;
  }>(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Import jobs voor Google Sheets
export const candidateImports = pgTable("candidate_imports", {
  id: serial("id").primaryKey(),
  source: text("source").notNull().default("google_sheets"),
  sheetId: text("sheet_id"),
  sheetTab: text("sheet_tab"), // Welke tab geïmporteerd
  status: candidateImportStatusEnum("status").default('pending').notNull(),
  totalRows: integer("total_rows").default(0),
  importedRows: integer("imported_rows").default(0),
  skippedRows: integer("skipped_rows").default(0),
  errorLog: json("error_log").$type<Array<{
    row: number;
    error: string;
    data?: Record<string, any>;
  }>>(),
  mappingConfig: json("mapping_config").$type<Record<string, string>>(), // Kolom mappings
  deduplicationStrategy: text("deduplication_strategy").default("skip"), // skip, update, duplicate
  createdByUserId: integer("created_by_user_id").references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas voor sollicitanten
export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  anonymizedAt: true,
});

export const insertCandidateFunctionProfileSchema = createInsertSchema(candidateFunctionProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalaryScaleSchema = createInsertSchema(salaryScales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCandidateAuditLogSchema = createInsertSchema(candidateAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertCandidateImportSchema = createInsertSchema(candidateImports).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

// Type definities voor sollicitanten
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertCandidateFunctionProfile = z.infer<typeof insertCandidateFunctionProfileSchema>;
export type CandidateFunctionProfile = typeof candidateFunctionProfiles.$inferSelect;

export type InsertSalaryScale = z.infer<typeof insertSalaryScaleSchema>;
export type SalaryScale = typeof salaryScales.$inferSelect;

export type InsertCandidateAuditLog = z.infer<typeof insertCandidateAuditLogSchema>;
export type CandidateAuditLog = typeof candidateAuditLog.$inferSelect;

export type InsertCandidateImport = z.infer<typeof insertCandidateImportSchema>;
export type CandidateImport = typeof candidateImports.$inferSelect;

// Extended types met relaties
export type CandidateWithDetails = Candidate & {
  createdBy?: User;
  functionProfiles?: CandidateFunctionProfile[];
  salaryScale?: SalaryScale;
};

export type CandidateAuditLogWithUser = CandidateAuditLog & {
  changedBy?: User;
};

export const staffingRequestStatusEnum = pgEnum('staffing_request_status', ['new', 'contacted', 'in_progress', 'completed', 'cancelled']);

export const staffingRequests = pgTable("staffing_requests", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  locationType: text("location_type").notNull(),
  locationTypeOther: text("location_type_other"),
  functions: text("functions").array().notNull(),
  staffCount: integer("staff_count"),
  datesPeriod: text("dates_period"),
  locationAddress: text("location_address"),
  locationName: text("location_name"),
  deploymentType: text("deployment_type"),
  urgency: text("urgency"),
  notes: text("notes"),
  wantsCallback: boolean("wants_callback").default(false),
  wantsFavoritePool: boolean("wants_favorite_pool").default(false),
  status: staffingRequestStatusEnum("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffingRequestSchema = createInsertSchema(staffingRequests).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertStaffingRequest = z.infer<typeof insertStaffingRequestSchema>;
export type StaffingRequest = typeof staffingRequests.$inferSelect;

// ==========================================
// SOLLICITATIES (Submitted application forms)
// ==========================================

export const applicationStatusEnum = pgEnum('application_status', ['nieuw', 'beoordeeld', 'aangenomen', 'afgewezen']);

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id"),
  functionType: text("function_type").notNull(),
  interviewer: text("interviewer"),
  status: text("status").default("nieuw"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  assessmentRating: text("assessment_rating"),
  salaryScale: text("salary_scale"),
  formData: json("form_data"),
  softskillsScore: integer("softskills_score"),
  barScore: integer("bar_score"),
  bedieningScore: integer("bediening_score"),
  dinerScore: integer("diner_score"),
  source: text("source").default("form"),
  importBatchId: text("import_batch_id"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// ==========================================
// PUSH SUBSCRIPTIONS (persistent web push)
// ==========================================

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;

// ==========================================
// BLOG POSTS (SEO content systeem)
// ==========================================

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  focusKeyword: text("focus_keyword"),
  category: text("category").notNull().default("Blog"),
  status: text("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  author: text("author").default("EXTRA Redactie"),
  readTime: text("read_time"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export const vacancyPosts = pgTable("vacancy_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  internalTitle: text("internal_title"),
  functionType: text("function_type").notNull().default("Bediening"),
  serviceType: text("service_type").notNull().default("Oproep"),
  location: text("location").notNull().default("Amsterdam"),
  region: text("region").notNull().default("Amsterdam"),
  workplace: text("workplace").notNull().default("Hotel"),
  client: text("client"),
  salaryMin: text("salary_min"),
  shortDescription: text("short_description").notNull().default(""),
  introductionText: text("introduction_text"),
  aboutRole: text("about_role"),
  responsibilities: text("responsibilities").array(),
  requirements: text("requirements").array(),
  offer: text("offer").array(),
  workEnvironment: text("work_environment"),
  faqItems: text("faq_items"),
  ctaText: text("cta_text"),
  focusKeyword: text("focus_keyword"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  canonicalUrl: text("canonical_url"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  featuredImage: text("featured_image"),
  featuredImageAlt: text("featured_image_alt"),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVacancyPostSchema = createInsertSchema(vacancyPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVacancyPost = z.infer<typeof insertVacancyPostSchema>;
export type VacancyPost = typeof vacancyPosts.$inferSelect;

// ==========================================
// CRM Tables
// ==========================================

export const crmCompanies = pgTable("crm_companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("hotel"), // eventlocatie | hotel | restaurant | cateraar
  isClient: boolean("is_client").default(false).notNull(), // false = prospect/lead, true = bestaande klant
  phase: text("phase").default("nieuw"), // prospects: nieuw | toegewezen | eerste_contact | in_gesprek | afspraak_gepland | voorstel_verstuurd | follow_up | gewonnen | verloren | on_hold
  abc: text("abc"), // clients: A | B | C
  owner: text("owner"), // max | eveline | charlotte | lea
  accountOwner: text("account_owner"), // same options
  city: text("city"),
  region: text("region"),
  website: text("website"),
  linkedin: text("linkedin"),
  potential: text("potential"), // laag | midden | hoog
  source: text("source"), // linkedin | referral | website | inbound | netwerk | anders
  parentCompanyId: integer("parent_company_id"), // for sub-locations
  attentionNeeded: boolean("attention_needed").default(false),
  risk: boolean("risk").default(false),
  busyPeriods: text("busy_periods"),
  planningNotes: text("planning_notes"),
  notes: text("notes"), // general notes field
  tags: text("tags").array().default([]), // hot_lead | warm_lead | cold_lead | vip | urgent | follow_up | etc.
  functions: text("functions").array().default([]), // horecamedewerker | chef | housekeeping | logistiek
  staffingRequestId: integer("staffing_request_id"), // link to original staffing request if created from form
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const crmContacts = pgTable("crm_contacts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => crmCompanies.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  function: text("function"),
  email: text("email"),
  phone: text("phone"),
  linkedin: text("linkedin"),
  isPrimary: boolean("is_primary").default(false),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crmNotes = pgTable("crm_notes", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => crmCompanies.id, { onDelete: 'cascade' }).notNull(),
  owner: text("owner").notNull(), // max | eveline | charlotte | lea
  text: text("text").notNull(),
  type: text("type").default("note"), // note | call | email | meeting | follow_up
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crmReminders = pgTable("crm_reminders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => crmCompanies.id, { onDelete: 'cascade' }).notNull(),
  contactId: integer("contact_id").references(() => crmContacts.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  dueDate: date("due_date").notNull(),
  owner: text("owner").notNull(), // max | eveline | charlotte | lea
  note: text("note"),
  status: text("status").default("open").notNull(), // open | completed | overdue
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrmCompanySchema = createInsertSchema(crmCompanies).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrmCompany = z.infer<typeof insertCrmCompanySchema>;
export type CrmCompany = typeof crmCompanies.$inferSelect;

export const insertCrmContactSchema = createInsertSchema(crmContacts).omit({ id: true, createdAt: true });
export type InsertCrmContact = z.infer<typeof insertCrmContactSchema>;
export type CrmContact = typeof crmContacts.$inferSelect;

export const insertCrmNoteSchema = createInsertSchema(crmNotes).omit({ id: true, createdAt: true });
export type InsertCrmNote = z.infer<typeof insertCrmNoteSchema>;
export type CrmNote = typeof crmNotes.$inferSelect;

export const insertCrmReminderSchema = createInsertSchema(crmReminders).omit({ id: true, createdAt: true });
export type InsertCrmReminder = z.infer<typeof insertCrmReminderSchema>;
export type CrmReminder = typeof crmReminders.$inferSelect;

// ─── WhatsApp sessie-opslag ───────────────────────────────────────────────────
// DEPRECATED: deze tabel was voor de Baileys (zelf-gehoste) implementatie die
// per 2026-05 is gearchiveerd. Niet verwijderen zolang er nog data in zou
// kunnen zitten. Nieuwe WhatsApp-integratie gebruikt 360dialog Cloud API +
// whatsapp_messages / whatsapp_conversations hieronder.
export const whatsappSessions = pgTable("whatsapp_sessions", {
  accountId: text("account_id").primaryKey(),
  credentialsJson: text("credentials_json").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── WhatsApp Fase 1: berichten + gesprekken (360dialog Cloud API) ───────────
export const whatsappDirectionEnum = pgEnum('whatsapp_direction', ['inbound', 'outbound']);
export const whatsappMatchCategoryEnum = pgEnum('whatsapp_match_category', ['candidate', 'prospect', 'unmatched']);
export const whatsappInboxStatusEnum = pgEnum('whatsapp_inbox_status', ['open', 'resolved', 'spam']);

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  direction: whatsappDirectionEnum("direction").notNull(),
  waMessageId: text("wa_message_id"), // 360dialog message-id; uniek wanneer aanwezig
  fromNumber: text("from_number").notNull(), // E.164 zonder +
  toNumber: text("to_number").notNull(),     // E.164 zonder +
  messageType: text("message_type").notNull(), // text|image|audio|document|video|location|sticker|contacts|interactive|unknown
  body: text("body"),                          // platte tekst, of beschrijving voor media
  mediaUrl: text("media_url"),
  mediaMimeType: text("media_mime_type"),
  rawPayload: jsonb("raw_payload"),            // volledige 360dialog payload voor debugging
  status: text("status").notNull().default('received'), // received|queued|sent|delivered|read|failed
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: 'set null' }),
  prospectContactId: integer("prospect_contact_id").references(() => prospectContacts.id, { onDelete: 'set null' }),
  matchCategory: whatsappMatchCategoryEnum("match_category").notNull().default('unmatched'),
  sentByUserId: integer("sent_by_user_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  fromIdx: index("wa_msg_from_created_idx").on(table.fromNumber, table.createdAt),
  toIdx: index("wa_msg_to_created_idx").on(table.toNumber, table.createdAt),
  candidateIdx: index("wa_msg_candidate_idx").on(table.candidateId),
  prospectIdx: index("wa_msg_prospect_idx").on(table.prospectContactId),
  waIdIdx: uniqueIndex("wa_msg_wa_id_unique").on(table.waMessageId),
}));

export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: 'set null' }),
  prospectContactId: integer("prospect_contact_id").references(() => prospectContacts.id, { onDelete: 'set null' }),
  matchCategory: whatsappMatchCategoryEnum("match_category").notNull().default('unmatched'),
  // Handmatige override: wanneer gezet, blijft matchCategory hieraan vastzitten
  // ondanks wat de matcher op basis van candidates/prospect_contacts vindt.
  manualCategory: whatsappMatchCategoryEnum("manual_category"),
  displayName: text("display_name"),
  contactCompany: text("contact_company"),
  contactNotes: text("contact_notes"),
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: 'set null' }),
  assignedToName: text("assigned_to_name"),
  labels: text("labels").array(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  lastMessagePreview: text("last_message_preview"),
  unreadCount: integer("unread_count").default(0).notNull(),
  lastInboundAt: timestamp("last_inbound_at"),
  // Inbox-status voor Open/Opgelost/Spam-filter in de UI.
  inboxStatus: whatsappInboxStatusEnum("inbox_status").notNull().default('open'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  phoneIdx: uniqueIndex("wa_conv_phone_unique").on(table.phoneNumber),
  lastMsgIdx: index("wa_conv_last_msg_idx").on(table.lastMessageAt),
  categoryIdx: index("wa_conv_category_idx").on(table.matchCategory),
  inboxStatusIdx: index("wa_conv_inbox_status_idx").on(table.inboxStatus),
}));

// Telefoonnummer-normalisatie issues — losse tabel zodat we ongeldige
// nummers handmatig kunnen nakijken zonder de bron-tabel te vervuilen.
export const phoneNormalizationIssues = pgTable("phone_normalization_issues", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),     // 'candidates' | 'prospect_contacts'
  recordId: integer("record_id").notNull(),
  originalValue: text("original_value"),
  reason: text("reason").notNull(),            // 'empty' | 'too_short' | 'too_long' | 'no_digits' | 'invalid_country'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const whatsappInternalNotes = pgTable("whatsapp_internal_notes", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => whatsappConversations.id, { onDelete: 'cascade' }).notNull(),
  authorId: integer("author_id"),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  convIdx: index("wa_note_conv_idx").on(table.conversationId),
}));

export const whatsappGroups = pgTable("whatsapp_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappGroupMembers = pgTable("whatsapp_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => whatsappGroups.id, { onDelete: 'cascade' }).notNull(),
  phoneNumber: text("phone_number").notNull(),
  displayName: text("display_name"),
  // Apart opgeslagen voor gebruik in groepsbericht-variabelen ({{voornaam}}/{{achternaam}}).
  firstName: text("first_name"),
  lastName: text("last_name"),
  // Fase 1: optionele koppeling aan een contact-record.
  // Legacy-leden (toegevoegd vóór deze migratie) hebben beide velden NULL en
  // werken alleen op phoneNumber. Nieuwe leden (toegevoegd via Contacten-pagina)
  // krijgen contactType + contactId zodat we groep-membership per persoon
  // kunnen tonen in "in welke groepen zit deze persoon".
  contactType: whatsappContactTypeEnum("contact_type"),
  contactId: integer("contact_id"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedByUserId: integer("added_by_user_id").references(() => users.id),
}, (table) => ({
  groupPhoneIdx: index("wa_grp_member_idx").on(table.groupId, table.phoneNumber),
  contactIdx: index("wa_grp_member_contact_idx").on(table.contactType, table.contactId),
}));

export const whatsappBulkSends = pgTable("whatsapp_bulk_sends", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => whatsappGroups.id, { onDelete: 'set null' }),
  groupName: text("group_name").notNull(),
  messageBody: text("message_body").notNull(),
  totalRecipients: integer("total_recipients").notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  sentByUserId: integer("sent_by_user_id"),
  sentByName: text("sent_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;
export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappConversation = typeof whatsappConversations.$inferInsert;
export type WhatsappInternalNote = typeof whatsappInternalNotes.$inferSelect;
export type InsertWhatsappInternalNote = typeof whatsappInternalNotes.$inferInsert;
export const whatsappAiSettings = pgTable("whatsapp_ai_settings", {
  id: serial("id").primaryKey(),
  toneOfVoice: text("tone_of_voice").default('').notNull(),
  voiceExamples: text("voice_examples").default('').notNull(),
  guidelines: text("guidelines").default('').notNull(),
  cancellationProtocol: text("cancellation_protocol").default('').notNull(),
  extraContext: text("extra_context").default('').notNull(),
  autoReplyEnabled: boolean("auto_reply_enabled").default(false).notNull(),
  autoReplyOnlyForKnown: boolean("auto_reply_only_for_known").default(true).notNull(),
  autoReplyMinIntervalSec: integer("auto_reply_min_interval_sec").default(60).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappAiKnowledge = pgTable("whatsapp_ai_knowledge", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappAiAttachments = pgTable("whatsapp_ai_attachments", {
  id: serial("id").primaryKey(),
  fieldKey: text("field_key").notNull(),
  knowledgeId: integer("knowledge_id"),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").default(0).notNull(),
  extractedText: text("extracted_text").default('').notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export type WhatsappGroup = typeof whatsappGroups.$inferSelect;
export type WhatsappGroupMember = typeof whatsappGroupMembers.$inferSelect;
export type WhatsappBulkSend = typeof whatsappBulkSends.$inferSelect;
export type WhatsappAiSettings = typeof whatsappAiSettings.$inferSelect;
export type WhatsappAiKnowledge = typeof whatsappAiKnowledge.$inferSelect;
export type InsertWhatsappAiKnowledge = typeof whatsappAiKnowledge.$inferInsert;
export type WhatsappAiAttachment = typeof whatsappAiAttachments.$inferSelect;
export type InsertWhatsappAiAttachment = typeof whatsappAiAttachments.$inferInsert;

// ─── Admin notificaties ───────────────────────────────────────────────────────
export const adminNotificationTypeEnum = pgEnum("admin_notification_type", [
  "new_candidate",       // Nieuwe aanmelding
  "cv_uploaded",         // CV opgestuurd
  "sollicitatie_form",   // Intern sollicitatieformulier ingestuurd
  "twv_expiry",          // TWV dreigt te verlopen
  "staffing_request",    // Nieuwe aanvraag van een bedrijf
  "interview_reminder",  // Gesprek vandaag
]);

export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  type: adminNotificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  candidateId: integer("candidate_id"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({ id: true, createdAt: true });
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;

// ─── B2B Prospect Contacten ──────────────────────────────────────────────────
// Aparte prospectlijst (los van CRM) voor B2B e-mail campagnes
export const prospectContacts = pgTable("prospect_contacts", {
  id: serial("id").primaryKey(),
  // Legacy velden (behouden voor achterwaartse compatibiliteit met campagnes)
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  function: text("function"),
  brancheTags: text("branche_tags").array().default([]),
  functieTags: text("functie_tags").array().default([]),
  unsubscribed: boolean("unsubscribed").default(false),
  unsubscribedAt: timestamp("unsubscribed_at"),
  source: text("source").default("manual"),
  crmContactId: integer("crm_contact_id"),
  // Nieuwe velden voor uitgebreid contactenbeheer
  voornaam: text("voornaam"),
  achternaam: text("achternaam"),
  telefoon: text("telefoon"),
  telefoonOriginal: text("telefoon_original"), // backup van originele waarde vóór WhatsApp E.164-normalisatie
  stad: text("stad"),
  taal: text("taal").default("Nederlands"),
  branche: text("branche"),                            // Hotel | Restaurant | Cateraar | Evenementenlocatie | Logistiek
  functiegroep: text("functiegroep"),                  // Bediening | Chef | Housekeeping | Logistiek (zie FUNCTIEGROEPEN)
  contactType: text("contact_type").default("prospect"), // prospect | klant
  customTags: text("custom_tags").default("[]"),       // JSON array van strings bijv. ["VIP","Warme lead"]
  contactStatus: text("contact_status").default("actief"), // actief | uitgeschreven | geblokkeerd
  // Pijplijn-fase voor mailcampagnes — Blok 1
  // nieuw | in_campagne | in_gesprek | klant | uitgesloten
  phase: text("phase").default("nieuw").notNull(),
  // Blok 3: bounce/spam/reply tracking voor auto-uitsluiting en fase-overgang
  bounceStatus: text("bounce_status").default("geen"), // geen | soft | hard
  lastBounceAt: timestamp("last_bounce_at"),
  bounceReden: text("bounce_reden"),
  spamReported: boolean("spam_reported").default(false),
  spamReportedAt: timestamp("spam_reported_at"),
  lastReplyAt: timestamp("last_reply_at"),
  notes: text("notes"),
  // WhatsApp opt-in status — Fase 1 Contacten + STOP-detectie (los van e-mail unsubscribe)
  whatsappOptInStatus: whatsappOptInStatusEnum("whatsapp_opt_in_status").default('actief').notNull(),
  whatsappOptInChangedAt: timestamp("whatsapp_opt_in_changed_at"),
  whatsappOptInReason: text("whatsapp_opt_in_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  phaseIdx: index("prospect_contacts_phase_idx").on(table.phase),
  bounceStatusIdx: index("prospect_contacts_bounce_status_idx").on(table.bounceStatus),
}));

// ─── Gestandaardiseerde functietags — Blok 1 ──────────────────────────────────
// Master-lijst van functietags die in dropdowns/multi-selects gebruikt wordt.
// Gekoppeld aan prospect_contacts via prospectContactFunctionTags (m2m).
export const functionTags = pgTable("function_tags", {
  id: serial("id").primaryKey(),
  naam: text("naam").notNull(),
  slug: text("slug").notNull().unique(),
  volgorde: integer("volgorde").default(0).notNull(),
  actief: boolean("actief").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prospectContactFunctionTags = pgTable("prospect_contact_function_tags", {
  contactId: integer("contact_id").references(() => prospectContacts.id, { onDelete: 'cascade' }).notNull(),
  functionTagId: integer("function_tag_id").references(() => functionTags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.contactId, table.functionTagId] }),
  contactIdx: index("pcft_contact_idx").on(table.contactId),
  tagIdx: index("pcft_tag_idx").on(table.functionTagId),
}));

export const insertFunctionTagSchema = createInsertSchema(functionTags).omit({ id: true, createdAt: true });
export type InsertFunctionTag = z.infer<typeof insertFunctionTagSchema>;
export type FunctionTag = typeof functionTags.$inferSelect;

// ─── B2B Prospect E-mail Campagnes ───────────────────────────────────────────
export const prospectCampaigns = pgTable("prospect_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  // Campagne type
  campagneType: text("campagne_type").default("bulk"),  // bulk | flow
  // Visual editor: stored as JSON blocks; htmlContent derived on send
  editorBlocks: text("editor_blocks"),               // JSON string of visual blocks (legacy / variant A)
  htmlContent: text("html_content").notNull().default(""),
  textContent: text("text_content"),
  // Content variants
  contentA: text("content_a"),                       // JSON blocks variant A
  contentB: text("content_b"),                       // JSON blocks variant B (A/B test)
  // Targeting filters (legacy array — vrije strings, deprecated)
  // Behouden voor backwards compatibility met bestaande campagnes.
  // Nieuwe code gebruikt functionTagIds (gestandaardiseerde m2m via function_tags).
  brancheFilter: text("branche_filter").array().default([]),
  functieFilter: text("functie_filter").array().default([]),
  // Extended targeting filters
  typeFilter: text("type_filter").default("alles"),  // alles | prospect | klant
  taalFilter: text("taal_filter").default("alles"),  // alles | Nederlands | Engels | Anders
  tagFilter: text("tag_filter").default("[]"),       // JSON array
  // Blok 1: Pijplijn-fase filter + gestandaardiseerde functietag-IDs
  phaseFilter: text("phase_filter").array().default([]),         // [] = alle fases
  functionTagIds: integer("function_tag_ids").array().default([]), // [] = alle functietags
  // Status: concept | gepland | actief | voltooid | gestopt | draft | sent | scheduled
  status: text("status").default("concept").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  // Blok 3: SendGrid event-aggregaties
  deliveredCount: integer("delivered_count").default(0),
  bounceCount: integer("bounce_count").default(0),
  spamCount: integer("spam_count").default(0),
  replyCount: integer("reply_count").default(0),
  // A/B test
  abTestActief: boolean("ab_test_actief").default(false),
  abSplitPct: integer("ab_split_pct").default(50),
  abWinnaarOp: text("ab_winnaar_op").default("open_rate"),  // open_rate | click_rate
  abWinnaarNaUren: integer("ab_winnaar_na_uren").default(24),
  abWinnaarVariant: text("ab_winnaar_variant"),              // A | B | null
  abWinnaarBepaaldOp: timestamp("ab_winnaar_bepaald_op"),    // wanneer winnaar is gekozen
  abTestFase: text("ab_test_fase").default("concept"),       // concept | test | doorgestuurd | voltooid | gestopt
  // Verzendvenster
  alleenWerkdagen: boolean("alleen_werkdagen").default(true),
  tijdvensterStart: text("tijdvenster_start").default("08:00"),
  tijdvensterEind: text("tijdvenster_eind").default("18:00"),
  tijdzone: text("tijdzone").default("Europe/Amsterdam"),
  // Blok 2: Scheduler-dagen (ISO 1=ma..7=zo) en vaste verzendslots per campagne
  verzendDagen: integer("verzend_dagen").array(),
  verzendSlots: jsonb("verzend_slots").$type<Array<{ dag: number; tijd: string }>>().default([]),
  // Geplande verzending
  verzendDirect: boolean("verzend_direct").default(false),
  werkelijkVerzendOp: timestamp("werkelijk_verzend_op"),
  // Serie-velden voor groepering (bv. "Banqueting jaarcampagne", stap 1..8)
  serie: text("serie"),
  serieStapNr: integer("serie_stap_nr"),
  // Per-campagne uitgesloten contacten — losse blokkering van individuele
  // contacten zonder dat ze uit het hele segment hoeven (zie Ontvangers-tab).
  excludedContactIds: integer("excluded_contact_ids").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const prospectCampaignRecipients = pgTable("prospect_campaign_recipients", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => prospectCampaigns.id, { onDelete: 'cascade' }).notNull(),
  contactId: integer("contact_id").references(() => prospectContacts.id, { onDelete: 'set null' }),
  email: text("email").notNull(),
  name: text("name"),
  company: text("company"),
  functieTags: text("functie_tags").array().default([]),
  status: text("status").default("pending").notNull(), // pending | sent | failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  // Tracking
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  trackingToken: text("tracking_token"),              // unique UUID per recipient
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProspectContactSchema = createInsertSchema(prospectContacts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProspectContact = z.infer<typeof insertProspectContactSchema>;
export type ProspectContact = typeof prospectContacts.$inferSelect;

// ─── Functiegroepen — vaste lijst ─────────────────────────────────────────────
// Bron van waarheid voor zowel het contact-form, de campagne-targeting,
// als de Apollo-import mapping. Bewust kort gehouden om beheer simpel te
// houden voor de gebruiker.
export const FUNCTIEGROEPEN = ['Bediening', 'Chef', 'Housekeeping', 'Logistiek'] as const;
export type Functiegroep = typeof FUNCTIEGROEPEN[number];

export const insertProspectCampaignSchema = createInsertSchema(prospectCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProspectCampaign = z.infer<typeof insertProspectCampaignSchema>;
export type ProspectCampaign = typeof prospectCampaigns.$inferSelect;

export const insertProspectCampaignRecipientSchema = createInsertSchema(prospectCampaignRecipients).omit({ id: true, createdAt: true });
export type InsertProspectCampaignRecipient = z.infer<typeof insertProspectCampaignRecipientSchema>;
export type ProspectCampaignRecipient = typeof prospectCampaignRecipients.$inferSelect;

// ─── Verjaardagen opdrachtgevers ─────────────────────────────────────────────
export const clientBirthdays = pgTable("client_birthdays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role"),
  birthDay: integer("birth_day").notNull(),
  birthMonth: integer("birth_month").notNull(),
  birthYear: integer("birth_year"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientBirthdaySchema = createInsertSchema(clientBirthdays).omit({ id: true, createdAt: true });
export type InsertClientBirthday = z.infer<typeof insertClientBirthdaySchema>;
export type ClientBirthday = typeof clientBirthdays.$inferSelect;

// ─── Mail Tracking Tables ─────────────────────────────────────────────────────

export const mailSends = pgTable("mail_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => prospectCampaigns.id, { onDelete: 'cascade' }).notNull(),
  contactId: integer("contact_id").references(() => prospectContacts.id, { onDelete: 'set null' }),
  email: text("email").notNull(),
  variant: text("variant").default('A').notNull(), // A | B
  isAbTestSend: integer("is_ab_test_send").default(1), // 1 = AB test split, 0 = winnaar verzending
  verzondenOp: timestamp("verzonden_op"),
  status: text("status").default('pending').notNull(), // pending | sent | failed
  foutMelding: text("fout_melding"),
  linkMap: text("link_map"), // JSON: { [index]: url }
  // Blok 3: SendGrid event tracking
  sgMessageId: text("sg_message_id"),
  deliveredAt: timestamp("delivered_at"),
  bouncedAt: timestamp("bounced_at"),
  bounceType: text("bounce_type"),       // bounce | blocked
  bounceReason: text("bounce_reason"),
  spamReportedAt: timestamp("spam_reported_at"),
  droppedAt: timestamp("dropped_at"),
  droppedReason: text("dropped_reason"),
  replyAt: timestamp("reply_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mailEvents = pgTable("mail_events", {
  id: serial("id").primaryKey(),
  mailSendId: integer("mail_send_id").references(() => mailSends.id, { onDelete: 'cascade' }).notNull(),
  // Blok 3: uitgebreid met delivered/bounce/spamreport/dropped/deferred/processed/reply
  type: text("type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  url: text("url"), // for click events: the original URL
  ipAdres: text("ip_adres"),
});

// ─── Blok 3: SendGrid event audit-log + ingekomen replies ─────────────────────

export const sendgridEventLog = pgTable("sendgrid_event_log", {
  id: serial("id").primaryKey(),
  sgEventId: text("sg_event_id").notNull().unique(),
  sgMessageId: text("sg_message_id"),
  event: text("event").notNull(), // delivered|open|click|bounce|spamreport|dropped|deferred|processed|unsubscribe|group_unsubscribe
  email: text("email"),
  mailSendId: integer("mail_send_id").references(() => mailSends.id, { onDelete: 'set null' }),
  campaignId: integer("campaign_id").references(() => prospectCampaigns.id, { onDelete: 'set null' }),
  contactId: integer("contact_id").references(() => prospectContacts.id, { onDelete: 'set null' }),
  payload: jsonb("payload"),
  occurredAt: timestamp("occurred_at"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export const prospectReplies = pgTable("prospect_replies", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => prospectContacts.id, { onDelete: 'set null' }),
  campaignId: integer("campaign_id").references(() => prospectCampaigns.id, { onDelete: 'set null' }),
  mailSendId: integer("mail_send_id").references(() => mailSends.id, { onDelete: 'set null' }),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  subject: text("subject"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  inReplyTo: text("in_reply_to"),
  rawEnvelope: jsonb("raw_envelope"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  handled: boolean("handled").default(false).notNull(),
  handledAt: timestamp("handled_at"),
  handledBy: integer("handled_by"),
});

export const unsubscribeTokens = pgTable("unsubscribe_tokens", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => prospectContacts.id, { onDelete: 'cascade' }).notNull().unique(),
  token: text("token").notNull().unique(),
  aangemaaaktOp: timestamp("aangemaakt_op").defaultNow().notNull(),
});

export const insertMailSendSchema = createInsertSchema(mailSends).omit({ id: true, createdAt: true });
export type InsertMailSend = z.infer<typeof insertMailSendSchema>;
export type MailSend = typeof mailSends.$inferSelect;

export const insertMailEventSchema = createInsertSchema(mailEvents).omit({ id: true });
export type InsertMailEvent = z.infer<typeof insertMailEventSchema>;
export type MailEvent = typeof mailEvents.$inferSelect;

// Blok 3
export const insertSendgridEventLogSchema = createInsertSchema(sendgridEventLog).omit({ id: true, receivedAt: true });
export type InsertSendgridEventLog = z.infer<typeof insertSendgridEventLogSchema>;
export type SendgridEventLog = typeof sendgridEventLog.$inferSelect;

export const insertProspectReplySchema = createInsertSchema(prospectReplies).omit({ id: true, receivedAt: true, handledAt: true });
export type InsertProspectReply = z.infer<typeof insertProspectReplySchema>;
export type ProspectReply = typeof prospectReplies.$inferSelect;

export const insertUnsubscribeTokenSchema = createInsertSchema(unsubscribeTokens).omit({ id: true });
export type InsertUnsubscribeToken = z.infer<typeof insertUnsubscribeTokenSchema>;
export type UnsubscribeToken = typeof unsubscribeTokens.$inferSelect;

// ─── Flow Builder — Stap 5 ────────────────────────────────────────────────────

// De stappen binnen een flow-campagne
export const flowSteps = pgTable("flow_steps", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => prospectCampaigns.id, { onDelete: 'cascade' }).notNull(),
  stapId: text("stap_id").notNull(),           // unieke string ID binnen de flow, bijv. "stap_1"
  type: text("type").notNull(),                // trigger | email | wait | condition | tag_action | end
  label: text("label"),
  config: text("config").default('{}'),        // JSON met stap-specifieke instellingen
  nextStapId: text("next_stap_id"),            // volgende stap (lineair of conditie=nee)
  nextStapIdYes: text("next_stap_id_yes"),     // volgende stap bij conditie=ja
  volgorde: integer("volgorde").default(0),
  posX: real("pos_x").default(0),             // canvas X positie
  posY: real("pos_y").default(0),             // canvas Y positie
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// De voortgang van elk contact door een flow
export const flowContactProgress = pgTable("flow_contact_progress", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => prospectCampaigns.id, { onDelete: 'cascade' }).notNull(),
  contactId: integer("contact_id").references(() => prospectContacts.id, { onDelete: 'cascade' }).notNull(),
  huidigeStapId: text("huidige_stap_id").notNull(),
  status: text("status").default('actief').notNull(),  // actief | voltooid | gestopt | error
  wachtTot: timestamp("wacht_tot"),
  foutMelding: text("fout_melding"),
  aangemaaktOp: timestamp("aangemaakt_op").defaultNow().notNull(),
  bijgewerktOp: timestamp("bijgewerkt_op").defaultNow().notNull(),
}, (table) => ({
  uniqueProgress: uniqueIndex("unique_campaign_contact_progress").on(table.campaignId, table.contactId),
}));

export const insertFlowStepSchema = createInsertSchema(flowSteps).omit({ id: true, createdAt: true });
export type InsertFlowStep = z.infer<typeof insertFlowStepSchema>;
export type FlowStep = typeof flowSteps.$inferSelect;

export const insertFlowContactProgressSchema = createInsertSchema(flowContactProgress).omit({ id: true, aangemaaktOp: true });
export type InsertFlowContactProgress = z.infer<typeof insertFlowContactProgressSchema>;
export type FlowContactProgress = typeof flowContactProgress.$inferSelect;

// ─── Notificaties — Stap 6 ─────────────────────────────────────────────────────

export const notificaties = pgTable("notificaties", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),          // ab_winnaar | campagne_voltooid | etc.
  titel: text("titel").notNull(),
  bericht: text("bericht").notNull(),
  link: text("link"),                    // bijv. /campaigns/123
  gelezen: integer("gelezen").default(0),
  aangemaaktOp: timestamp("aangemaakt_op").defaultNow().notNull(),
});

export const insertNotificatieSchema = createInsertSchema(notificaties).omit({ id: true, aangemaaktOp: true });
export type InsertNotificatie = z.infer<typeof insertNotificatieSchema>;
export type Notificatie = typeof notificaties.$inferSelect;

// ─── Scheduler log ─────────────────────────────────────────────────────────
export const schedulerLog = pgTable("scheduler_log", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),          // campaign_check | flow_check | ab_check | verzending_gestart | verzending_fout | scheduler_run | scheduler_error
  campaignId: integer("campaign_id"),
  bericht: text("bericht"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
export type SchedulerLog = typeof schedulerLog.$inferSelect;

// ─── Instellingen (key-value store) ─────────────────────────────────────────
export const instellingen = pgTable("instellingen", {
  sleutel: text("sleutel").primaryKey(),
  waarde: text("waarde").notNull(),
  bijgewerktOp: timestamp("bijgewerkt_op").defaultNow().notNull(),
});

// ==========================================
// MEDEWERKERS MODULE (Onboarding Stap 1)
// ==========================================

export const employeeStatusEnum = pgEnum('employee_status', ['nieuw', 'actief', 'inactief', 'uitgestroomd']);
export const employeeContractEnum = pgEnum('employee_contract', ['oproepkracht', 'parttimer', 'fulltimer']);

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),

  // Persoonlijk
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  birthDate: date("birth_date"),
  city: text("city"),
  language: text("language").default('Nederlands'),

  // Werk
  functie: text("functie"),
  branche: text("branche"),
  opdrachtgever: text("opdrachtgever"),
  contractType: employeeContractEnum("contract_type"),
  startDate: date("start_date"),

  // Status
  status: employeeStatusEnum("status").default('nieuw').notNull(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),

  // Onboarding
  onboardingSent: boolean("onboarding_sent").default(false).notNull(),
  onboardingSentAt: timestamp("onboarding_sent_at"),
  onboardingTemplateId: integer("onboarding_template_id"),

  // Koppeling
  candidateId: integer("candidate_id").references(() => candidates.id),

  // WhatsApp opt-in status — Fase 1 Contacten + STOP-detectie
  whatsappOptInStatus: whatsappOptInStatusEnum("whatsapp_opt_in_status").default('actief').notNull(),
  whatsappOptInChangedAt: timestamp("whatsapp_opt_in_changed_at"),
  whatsappOptInReason: text("whatsapp_opt_in_reason"),

  // Meta
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const onboardingLogs = pgTable("onboarding_logs", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  templateId: integer("template_id").notNull(),
  templateName: text("template_name"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  sentBy: text("sent_by").default('handmatig'),
  status: text("status").default('verzonden'),
  errorMessage: text("error_message"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  onboardingSent: true,
  onboardingSentAt: true,
  onboardingTemplateId: true,
});
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export const insertOnboardingLogSchema = createInsertSchema(onboardingLogs).omit({ id: true, sentAt: true });
export type InsertOnboardingLog = z.infer<typeof insertOnboardingLogSchema>;
export type OnboardingLog = typeof onboardingLogs.$inferSelect;

export type EmployeeWithLogs = Employee & { onboardingLogs?: OnboardingLog[] };

// ============================================================================
// Onboarding Module (Stap 2): templates, bijlagen en koppelingen
// ============================================================================

export const onboardingTemplates = pgTable("onboarding_templates", {
  id: serial("id").primaryKey(),
  naam: text("naam").notNull(),
  taal: text("taal").default('Nederlands').notNull(),
  functiegroep: text("functiegroep"),
  opdrachtgever: text("opdrachtgever"),
  onderwerp: text("onderwerp").notNull(),
  content: text("content"),
  isStandaard: boolean("is_standaard").default(false).notNull(),
  actief: boolean("actief").default(true).notNull(),
  aangemaaktOp: timestamp("aangemaakt_op").defaultNow().notNull(),
  bijgewerktOp: timestamp("bijgewerkt_op").defaultNow().notNull(),
});

export const onboardingBijlagen = pgTable("onboarding_bijlagen", {
  id: serial("id").primaryKey(),
  naam: text("naam").notNull(),
  bestandsnaam: text("bestandsnaam").notNull(),
  bestandspad: text("bestandspad").notNull(),
  bestandsgrootte: integer("bestandsgrootte"),
  taal: text("taal").default('alles').notNull(),
  versie: text("versie"),
  actief: boolean("actief").default(true).notNull(),
  geuploadOp: timestamp("geupload_op").defaultNow().notNull(),
  bijgewerktOp: timestamp("bijgewerkt_op").defaultNow().notNull(),
});

export const onboardingTemplateBijlagen = pgTable("onboarding_template_bijlagen", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => onboardingTemplates.id, { onDelete: 'cascade' }),
  bijlageId: integer("bijlage_id").notNull().references(() => onboardingBijlagen.id, { onDelete: 'cascade' }),
  volgorde: integer("volgorde").default(0).notNull(),
});

export const insertOnboardingTemplateSchema = createInsertSchema(onboardingTemplates).omit({
  id: true,
  aangemaaktOp: true,
  bijgewerktOp: true,
});
export type InsertOnboardingTemplate = z.infer<typeof insertOnboardingTemplateSchema>;
export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;

export const insertOnboardingBijlageSchema = createInsertSchema(onboardingBijlagen).omit({
  id: true,
  geuploadOp: true,
  bijgewerktOp: true,
});
export type InsertOnboardingBijlage = z.infer<typeof insertOnboardingBijlageSchema>;
export type OnboardingBijlage = typeof onboardingBijlagen.$inferSelect;

export const insertOnboardingTemplateBijlageSchema = createInsertSchema(onboardingTemplateBijlagen).omit({ id: true });
export type InsertOnboardingTemplateBijlage = z.infer<typeof insertOnboardingTemplateBijlageSchema>;
export type OnboardingTemplateBijlage = typeof onboardingTemplateBijlagen.$inferSelect;

export type OnboardingTemplateMetBijlagen = OnboardingTemplate & {
  bijlagen?: (OnboardingBijlage & { koppelingId: number; volgorde: number })[];
};
