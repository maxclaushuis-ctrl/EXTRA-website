import { pgTable, text, serial, integer, boolean, timestamp, json, date, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// TWV-specifieke enumeraties
export const userRoleEnum = pgEnum('user_role', ['admin', 'hr', 'viewer']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);
export const twvStatusEnum = pgEnum('twv_status', ['none', 'required', 'pending', 'approved', 'rejected', 'expired']);
export const twvTypeEnum = pgEnum('twv_type', ['general', 'specific', 'seasonal']);
export const nationalityEnum = pgEnum('nationality', ['EU', 'non_EU']);

// Hoofdgebruikers tabel (admins, HR medewerkers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").default('viewer').notNull(),
  status: userStatusEnum("status").default('active').notNull(),
  dateJoined: timestamp("date_joined").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  settings: json("settings").$type<{
    notifications: boolean,
    emailAlerts: boolean,
    theme: string
  }>(),
});

// Werknemers die een TWV nodig hebben
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  birthDate: date("birth_date"),
  nationality: nationalityEnum("nationality").notNull(),
  bsn: text("bsn").unique(), // Burgerservicenummer
  idNumber: text("id_number"), // Paspoort/ID nummer
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country"),
  employmentStartDate: date("employment_start_date"),
  contractType: text("contract_type"), // tijdelijk, vast, uitzending
  departmentId: integer("department_id"),
  positionTitle: text("position_title"),
  hourlyWage: integer("hourly_wage"), // in cents
  apiId: text("api_id"), // ID van extern plansysteem
  notes: text("notes"),
  status: userStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TWV aanvragen en statussen
export const twvApplications = pgTable("twv_applications", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  twvType: twvTypeEnum("twv_type").default('general').notNull(),
  status: twvStatusEnum("status").default('required').notNull(),
  applicationDate: timestamp("application_date"),
  submissionDate: timestamp("submission_date"), // Wanneer ingediend bij UWV
  responseDate: timestamp("response_date"), // Wanneer reactie ontvangen
  approvalDate: timestamp("approval_date"),
  rejectionDate: timestamp("rejection_date"),
  expiryDate: date("expiry_date"),
  twvNumber: text("twv_number"), // Officieel TWV nummer van UWV
  uwvReference: text("uwv_reference"), // UWV referentienummer
  rejectionReason: text("rejection_reason"),
  applicationNotes: text("application_notes"),
  internalNotes: text("internal_notes"),
  documentsChecked: boolean("documents_checked").default(false),
  documentsComplete: boolean("documents_complete").default(false),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bedrijfsafdelingen
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TWV documenten en bijlagen
export const twvDocuments = pgTable("twv_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => twvApplications.id),
  documentType: text("document_type").notNull(), // paspoort, contract, cv, diploma, etc.
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  isRequired: boolean("is_required").default(false),
  isApproved: boolean("is_approved").default(false),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// TWV herinneringen en deadlines
export const twvReminders = pgTable("twv_reminders", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => twvApplications.id),
  reminderType: text("reminder_type").notNull(), // expiry_warning, renewal_due, document_missing
  reminderDate: timestamp("reminder_date").notNull(),
  message: text("message").notNull(),
  isSent: boolean("is_sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit log voor alle TWV acties
export const twvAuditLog = pgTable("twv_audit_log", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => twvApplications.id),
  employeeId: integer("employee_id").references(() => employees.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // created, updated, approved, rejected, etc.
  previousValue: json("previous_value"),
  newValue: json("new_value"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Reports en statistieken
export const twvReports = pgTable("twv_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(), // monthly, quarterly, annual
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  data: json("data").$type<{
    totalApplications: number,
    approved: number,
    rejected: number,
    pending: number,
    averageProcessingTime: number,
    byDepartment: Record<string, number>,
    byNationality: Record<string, number>
  }>(),
  generatedBy: integer("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// Zod schemas voor validatie
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  dateJoined: true, 
  lastLogin: true 
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertTwvApplicationSchema = createInsertSchema(twvApplications).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertTwvDocumentSchema = createInsertSchema(twvDocuments).omit({ 
  id: true, 
  uploadedAt: true 
});

// Types voor TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type TwvApplication = typeof twvApplications.$inferSelect;
export type InsertTwvApplication = z.infer<typeof insertTwvApplicationSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type TwvDocument = typeof twvDocuments.$inferSelect;
export type InsertTwvDocument = z.infer<typeof insertTwvDocumentSchema>;

export type TwvReminder = typeof twvReminders.$inferSelect;
export type TwvAuditLog = typeof twvAuditLog.$inferSelect;
export type TwvReport = typeof twvReports.$inferSelect;