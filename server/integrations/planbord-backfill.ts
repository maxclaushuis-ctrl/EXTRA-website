/**
 * EXTRA Planbord — eenmalige backfill-export (READ-ONLY).
 *
 * Levert voor alle historisch aangenomen sollicitaties een JSON-array op met
 * exact dezelfde intake-structuur en ervaringsduur-normalisatie als de v2-webhook
 * (hergebruikt buildIntakePayloadBlock). Dit script/endpoint WIJZIGT NIETS.
 *
 * Naast de records wordt een datasamenvatting meegeleverd:
 *  - ervaringsduurDistribution: aantal records per canonieke code (incl. null/onbekend)
 *  - uncertainFieldValues: de daadwerkelijk voorkomende ruwe waarden voor velden
 *    waarvan het formaat aan de ontvangende kant nog onzeker is.
 */

import { storage } from '../storage';
import { buildIntakePayloadBlock, type IntakeBlock } from './planbord-webhook';

// Velden waarvan het echte formaat nog onzeker is — we tonen de ontvangende kant
// welke waarden er feitelijk voorkomen zodat men weet wat verwerkt moet worden.
const UNCERTAIN_FIELDS = [
  'logHeftruckCert',
  'logVCA',
  'logScanEquipment',
  'logPhysicalLoad',
  'logWorkStyle',
  'logPreferredTimes',
] as const;

export interface BackfillRecord extends IntakeBlock {
  applicationId: number;
  candidateId: number | null;
  employeeId: number | null;
}

export interface BackfillSummary {
  ervaringsduurDistribution: Record<string, number>;
  uncertainFieldValues: Record<
    string,
    { values: { value: string; count: number }[]; nullOrAbsent: number }
  >;
}

export interface BackfillExport {
  total: number;
  records: BackfillRecord[];
  summary: BackfillSummary;
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

/**
 * Bouwt de read-only backfill-export. Leest uitsluitend; muteert niets.
 */
export async function buildPlanbordBackfill(): Promise<BackfillExport> {
  // Alle historisch aangenomen sollicitaties.
  const { applications } = await storage.getApplications({ status: 'aangenomen', limit: 1_000_000 });

  // Best-effort koppeling application → employee via candidateId.
  const { employees } = await storage.getEmployees({ limit: 1_000_000 });
  const employeeByCandidate = new Map<number, number>();
  for (const e of employees) {
    if (e.candidateId != null && !employeeByCandidate.has(e.candidateId)) {
      employeeByCandidate.set(e.candidateId, e.id);
    }
  }

  const records: BackfillRecord[] = applications.map((app) => {
    const fd = (app.formData as any) || {};
    const intake = buildIntakePayloadBlock(fd, app.functionType);
    const employeeId =
      app.candidateId != null ? employeeByCandidate.get(app.candidateId) ?? null : null;
    return {
      applicationId: app.id,
      candidateId: app.candidateId ?? null,
      employeeId,
      ...intake, // functionType, interviewer, ervaringsduur {raw,code}|null, experienceLevel, matching + beschikbaarheid
    };
  });

  // Verdeling van de canonieke ervaringsduur-codes (incl. null en onbekend).
  const ervaringsduurDistribution: Record<string, number> = {};
  for (const r of records) {
    const key = r.ervaringsduur ? r.ervaringsduur.code : 'null';
    ervaringsduurDistribution[key] = (ervaringsduurDistribution[key] ?? 0) + 1;
  }

  // Voorkomende ruwe waarden voor de onzekere velden.
  const uncertainFieldValues: BackfillSummary['uncertainFieldValues'] = {};
  for (const field of UNCERTAIN_FIELDS) {
    const counts = new Map<string, number>();
    let nullOrAbsent = 0;
    for (const app of applications) {
      const fd = (app.formData as any) || {};
      const value = fd[field];
      if (isEmpty(value)) {
        nullOrAbsent++;
        continue;
      }
      const key = typeof value === 'string' ? value : JSON.stringify(value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    uncertainFieldValues[field] = {
      values: Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, count })),
      nullOrAbsent,
    };
  }

  return {
    total: records.length,
    records,
    summary: { ervaringsduurDistribution, uncertainFieldValues },
  };
}
