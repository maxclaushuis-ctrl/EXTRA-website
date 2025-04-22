import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Applicant schema
export const applicants = pgTable("applicants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  dateApplied: timestamp("date_applied").defaultNow().notNull(),
  variant: text("variant"), // Which variant the user saw (A/B testing)
  status: text("status").default("pending").notNull(), // pending, contacted, hired, rejected
});

// Insert schema
export const insertApplicantSchema = createInsertSchema(applicants).pick({
  name: true,
  email: true,
  phone: true,
  variant: true,
});

// Custom validator for phone number
export const applicantFormSchema = insertApplicantSchema.extend({
  phone: z.string().min(10, { message: "Telefoonnummer moet minstens 10 cijfers bevatten" }),
  consent: z.boolean().refine(val => val === true, {
    message: "Je moet akkoord gaan met de voorwaarden"
  }),
});

// Define types
export type InsertApplicant = z.infer<typeof insertApplicantSchema>;
export type ApplicantForm = z.infer<typeof applicantFormSchema>;
export type Applicant = typeof applicants.$inferSelect;
