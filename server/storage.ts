import { applicants, type Applicant, type InsertApplicant } from "@shared/schema";

// Storage interface
export interface IStorage {
  createApplicant(applicant: InsertApplicant): Promise<Applicant>;
  getApplicants(): Promise<Applicant[]>;
  getApplicant(id: number): Promise<Applicant | undefined>;
  getApplicantByEmail(email: string): Promise<Applicant | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private applicants: Map<number, Applicant>;
  private currentId: number;

  constructor() {
    this.applicants = new Map();
    this.currentId = 1;
  }

  async createApplicant(insertApplicant: InsertApplicant): Promise<Applicant> {
    const id = this.currentId++;
    const now = new Date();
    
    const applicant: Applicant = {
      id,
      ...insertApplicant,
      dateApplied: now,
      status: "pending",
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
}

export const storage = new MemStorage();
