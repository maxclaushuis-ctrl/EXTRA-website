import { pgTable, text, serial, integer, boolean, timestamp, json, date, pgEnum } from "drizzle-orm/pg-core";
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
  profileImage: text("profile_image"),
  apiId: text("api_id"), // ID van medewerker in extern plansysteem
  tags: text("tags").array(), // Labels/tags voor medewerkers
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
  updatedAt: true
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

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
