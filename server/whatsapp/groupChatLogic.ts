/**
 * Pure logica voor WhatsApp-groepsgesprekken: geen database, geen
 * provider-calls. Losgetrokken uit groupChats.ts zodat dit bestand zonder
 * DATABASE_URL unit-test-baar is — zelfde aanpak als templateLogic.ts.
 */
import { normalizePhone } from './phone';

/** Harde grens van de WhatsApp Groups API — niet instelbaar, geen ontsnapping via de UI. */
export const MAX_GROUP_PARTICIPANTS = 8;
/** Meta-limiet voor group `subject`. */
export const MAX_SUBJECT_LENGTH = 128;
/** Meta-limiet voor group `description`. */
export const MAX_DESCRIPTION_LENGTH = 2048;

export interface ValidationError { field: string; message: string; }

export interface GroupParticipantInput {
  phone: string;
  naam?: string | null;
}

export interface NormalizedGroupParticipant {
  phone: string;
  naam: string | null;
}

/**
 * Normaliseert en dedupliceert een lijst deelnemers-input. Geeft zowel de
 * schone lijst als eventuele fouten terug — de aanroeper (route) beslist of
 * fouten blokkerend zijn.
 */
export function normalizeParticipants(input: GroupParticipantInput[] | undefined | null): {
  participants: NormalizedGroupParticipant[];
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const seen = new Set<string>();
  const participants: NormalizedGroupParticipant[] = [];

  for (const raw of input || []) {
    const normalized = normalizePhone(raw?.phone);
    if (!normalized) {
      errors.push({ field: 'participants', message: `Ongeldig telefoonnummer: "${raw?.phone ?? ''}"` });
      continue;
    }
    if (seen.has(normalized)) continue; // stille dedupe — geen fout, gewoon geen dubbele rij
    seen.add(normalized);
    participants.push({ phone: normalized, naam: raw?.naam?.trim() || null });
  }

  return { participants, errors };
}

/**
 * Validatie vóór het aanmaken van een groep bij de provider. Server is hier
 * altijd de autoriteit — de UI doet alleen een voorcheck.
 */
export function validateBeforeCreate(args: {
  subject: string;
  description?: string | null;
  participants: NormalizedGroupParticipant[];
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const subject = (args.subject || '').trim();
  if (!subject) {
    errors.push({ field: 'subject', message: 'Naam van de groep is verplicht' });
  } else if (subject.length > MAX_SUBJECT_LENGTH) {
    errors.push({ field: 'subject', message: `Naam mag maximaal ${MAX_SUBJECT_LENGTH} tekens zijn` });
  }

  if (args.description && args.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push({ field: 'description', message: `Omschrijving mag maximaal ${MAX_DESCRIPTION_LENGTH} tekens zijn` });
  }

  if (args.participants.length > MAX_GROUP_PARTICIPANTS) {
    errors.push({
      field: 'participants',
      message: `Maximaal ${MAX_GROUP_PARTICIPANTS} deelnemers per groep (WhatsApp-limiet) — nu ${args.participants.length}`,
    });
  }

  return errors;
}

/**
 * Validatie vóór het versturen van een bericht in een groep: alleen een
 * actieve (niet-verwijderde/opgeschorte) groep, en niet-lege tekst.
 */
export function validateBeforeSend(args: {
  status: string;
  body: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  if (args.status !== 'active') {
    errors.push({ field: 'status', message: 'Deze groep is niet meer actief (verwijderd of opgeschort)' });
  }
  if (!args.body?.trim()) {
    errors.push({ field: 'body', message: 'Bericht mag niet leeg zijn' });
  }
  return errors;
}
