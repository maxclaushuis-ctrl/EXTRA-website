/**
 * Matcht een (genormaliseerd) telefoonnummer aan een kandidaat of prospect-contact.
 * Volgorde: candidates → prospect_contacts → unmatched.
 *
 * Belangrijk: ook de DB-waarden worden genormaliseerd vóór vergelijking, want
 * legacy-data staat in gemengde formaten. Na de one-time normalisation-migratie
 * is dit dubbel veilig.
 */
import { db } from '../db';
import { candidates, prospectContacts } from '@shared/schema';
import { isNotNull, sql } from 'drizzle-orm';
import { normalizePhone } from './phone';

export type MatchCategory = 'candidate' | 'prospect' | 'unmatched';

export interface MatchResult {
  candidateId: number | null;
  prospectContactId: number | null;
  category: MatchCategory;
  displayName: string | null;
}

const UNMATCHED: MatchResult = {
  candidateId: null,
  prospectContactId: null,
  category: 'unmatched',
  displayName: null,
};

export async function matchPhoneToContact(normalizedPhone: string): Promise<MatchResult> {
  if (!normalizedPhone) return UNMATCHED;

  // 1. Kandidaten — vergelijk tegen genormaliseerde phone
  // Snelle path: exact match op phone-veld (ervan uitgaande dat migratie heeft gedraaid).
  const candidateRows = await db
    .select({
      id: candidates.id,
      phone: candidates.phone,
      firstName: candidates.firstName,
      lastName: candidates.lastName,
    })
    .from(candidates)
    .where(isNotNull(candidates.phone));

  for (const row of candidateRows) {
    if (normalizePhone(row.phone) === normalizedPhone) {
      return {
        candidateId: row.id,
        prospectContactId: null,
        category: 'candidate',
        displayName: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || null,
      };
    }
  }

  // 2. Prospect-contacten — vergelijk tegen genormaliseerde telefoon
  const prospectRows = await db
    .select({
      id: prospectContacts.id,
      telefoon: prospectContacts.telefoon,
      name: prospectContacts.name,
      voornaam: prospectContacts.voornaam,
      achternaam: prospectContacts.achternaam,
    })
    .from(prospectContacts)
    .where(isNotNull(prospectContacts.telefoon));

  for (const row of prospectRows) {
    if (normalizePhone(row.telefoon) === normalizedPhone) {
      const fullName = `${row.voornaam ?? ''} ${row.achternaam ?? ''}`.trim();
      return {
        candidateId: null,
        prospectContactId: row.id,
        category: 'prospect',
        displayName: fullName || row.name || null,
      };
    }
  }

  return UNMATCHED;
}

/**
 * Variant die voor een lijst nummers in batch matcht (toekomstige perf-optimalisatie).
 * Voor Fase 1 nog niet gebruikt — placeholder.
 */
export async function matchPhonesBatch(_phones: string[]): Promise<Map<string, MatchResult>> {
  const out = new Map<string, MatchResult>();
  for (const p of _phones) out.set(p, await matchPhoneToContact(p));
  return out;
}
