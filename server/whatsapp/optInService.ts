/**
 * WhatsApp opt-in / opt-out service — Fase 1.
 *
 * Verantwoordelijkheden:
 *   1. STOP-detectie op inkomende tekstberichten (uitbreidbaar woordenlijstje).
 *   2. Meta delivery-error → opt-out (bv. error code 131026/131047 of "user blocked").
 *   3. Handmatig opt-in status wijzigen vanuit de Contacten-pagina.
 *   4. Interne notities aanmaken in de WhatsApp-thread zodat planners zien
 *      dat iemand zich heeft afgemeld (geen auto-reply naar de afzender).
 *
 * Belangrijk: berichten die naar de ontvanger gaan worden NIET aangepast —
 * we voegen geen "stuur STOP"-tekst of unsubscribe-link toe.
 */
import { db } from '../db';
import { candidates, employees, prospectContacts, whatsappConversations, whatsappInternalNotes } from '@shared/schema';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { normalizePhone } from './phone';

export type OptInStatus = 'actief' | 'opt_out' | 'verzending_faalt';
export type ContactType = 'sollicitant' | 'kandidaat' | 'medewerker' | 'prospect';

// ─── STOP-keyword detectie ───────────────────────────────────────────────────
// Lijst van triggers (case-insensitive, na trim). Gemakkelijk uit te breiden
// door entry's toe te voegen — exact-match én substring-match worden gecheckt.
const STOP_KEYWORDS_EXACT = [
  'stop',
  'stop berichten',
  'stop bericht',
  'geen berichten',
  'geen bericht',
  'unsubscribe',
  'afmelden',
  'uitschrijven',
];

// Patronen waar de tekst de STOP-keyword bevat (los woord). Voorkomt dat
// "ik stopte gisteren met werk" als opt-out wordt gezien.
const STOP_KEYWORDS_WORD_BOUNDARY = ['stop', 'unsubscribe', 'afmelden', 'uitschrijven'];

export function isStopMessage(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  if (STOP_KEYWORDS_EXACT.includes(normalized)) return true;
  // Korte berichten (max 25 tekens) waarin een keyword als los woord voorkomt
  if (normalized.length <= 25) {
    for (const kw of STOP_KEYWORDS_WORD_BOUNDARY) {
      const re = new RegExp(`\\b${kw}\\b`, 'i');
      if (re.test(normalized)) return true;
    }
  }
  // Specifieke meerwoorden-frases
  if (normalized.includes('stop berichten') || normalized.includes('geen berichten')) return true;
  return false;
}

// ─── Meta error → opt-out detectie ───────────────────────────────────────────
// 360dialog/Meta error codes voor "user blocked" / "out of allowed window":
//   131026 = Message undeliverable (often blocked)
//   131047 = Re-engagement message
//   131051 = Unsupported message type
//   470    = Re-engagement message (legacy)
// Daarnaast string-matching op "user blocked" / "blocked" voor robustheid.
const BLOCKED_ERROR_CODES = new Set(['131026', '131047', '470']);

export function isBlockedByUserError(errorCode?: string | null, errorMessage?: string | null): boolean {
  if (errorCode && BLOCKED_ERROR_CODES.has(String(errorCode))) return true;
  const msg = (errorMessage || '').toLowerCase();
  if (msg.includes('user blocked') || msg.includes('blocked the business')) return true;
  return false;
}

// ─── Opt-in status zetten ────────────────────────────────────────────────────
async function updateContactOptIn(
  contactType: ContactType,
  contactId: number,
  status: OptInStatus,
  reason: string,
): Promise<{ name: string | null } | null> {
  const now = new Date();
  if (contactType === 'prospect') {
    const r = await db.update(prospectContacts).set({
      whatsappOptInStatus: status,
      whatsappOptInChangedAt: now,
      whatsappOptInReason: reason,
      updatedAt: now,
    }).where(eq(prospectContacts.id, contactId)).returning({
      name: prospectContacts.name,
      voornaam: prospectContacts.voornaam,
      achternaam: prospectContacts.achternaam,
    });
    if (!r.length) return null;
    const display = [r[0].voornaam, r[0].achternaam].filter(Boolean).join(' ').trim() || r[0].name;
    return { name: display };
  }
  if (contactType === 'medewerker') {
    const r = await db.update(employees).set({
      whatsappOptInStatus: status,
      whatsappOptInChangedAt: now,
      whatsappOptInReason: reason,
      updatedAt: now,
    }).where(eq(employees.id, contactId)).returning({
      firstName: employees.firstName,
      lastName: employees.lastName,
    });
    if (!r.length) return null;
    return { name: `${r[0].firstName} ${r[0].lastName}`.trim() || null };
  }
  // sollicitant / kandidaat → candidates tabel
  const r = await db.update(candidates).set({
    whatsappOptInStatus: status,
    whatsappOptInChangedAt: now,
    whatsappOptInReason: reason,
    updatedAt: now,
  }).where(eq(candidates.id, contactId)).returning({
    firstName: candidates.firstName,
    lastName: candidates.lastName,
  });
  if (!r.length) return null;
  return { name: `${r[0].firstName} ${r[0].lastName}`.trim() || null };
}

export async function setOptInStatus(
  contactType: ContactType,
  contactId: number,
  status: OptInStatus,
  reason: string,
): Promise<{ name: string | null } | null> {
  return updateContactOptIn(contactType, contactId, status, reason);
}

// ─── Interne notitie aanmaken ────────────────────────────────────────────────
async function addInternalStopNote(phoneNumber: string, body: string): Promise<void> {
  const conv = await db.select({ id: whatsappConversations.id })
    .from(whatsappConversations)
    .where(eq(whatsappConversations.phoneNumber, phoneNumber))
    .limit(1);
  if (!conv.length) return;
  await db.insert(whatsappInternalNotes).values({
    conversationId: conv[0].id,
    authorId: null,
    authorName: 'Systeem',
    body,
  });
}

// ─── High-level handlers (worden vanuit webhook aangeroepen) ─────────────────

/**
 * Handelt een binnenkomend STOP-bericht af.
 * - Zet opt-in op 'opt_out' voor candidate of prospect (afhankelijk van match).
 * - Voegt interne notitie toe ("STOP ontvangen van …").
 * - Stuurt GEEN auto-reply.
 */
export async function handleIncomingStop(args: {
  phoneNumber: string;
  candidateId: number | null;
  prospectContactId: number | null;
  matchCategory: 'candidate' | 'prospect' | 'unmatched';
  contactName: string | null;
  rawBody: string;
}): Promise<void> {
  const reason = `Auto-gedetecteerd uit STOP-bericht: "${args.rawBody.slice(0, 80)}"`;
  const result = await optOutByPhoneAndIds({
    phoneNumber: args.phoneNumber,
    candidateId: args.candidateId,
    prospectContactId: args.prospectContactId,
    reason,
  });

  const naam = result.displayName || args.contactName || args.phoneNumber;
  const noot = result.touchedRecords > 0
    ? `🛑 STOP ontvangen van ${naam} — opt-in automatisch op "opt_out" gezet (${result.touchedRecords} record${result.touchedRecords === 1 ? '' : 's'}).`
    : `🛑 STOP ontvangen van onbekend nummer ${args.phoneNumber} — geen contact gevonden om te markeren.`;

  await addInternalStopNote(args.phoneNumber, noot);
  console.log(`[WA opt-out] ${noot}`);
}

/**
 * Zet opt_out op alle contact-rijen die bij deze persoon horen:
 *   - Bekende candidate-id (van matcher)
 *   - Bekende prospect-id (van matcher)
 *   - Alle employees met hetzelfde genormaliseerde telefoonnummer
 *   - Alle candidates met hetzelfde genormaliseerde telefoonnummer
 *     (vangst voor het geval matcher het al miste)
 *
 * Hierdoor is de opt-out altijd zichtbaar in de Contacten-pagina, ongeacht
 * welke categorie de persoon op dit moment heeft.
 */
async function optOutByPhoneAndIds(args: {
  phoneNumber: string;
  candidateId: number | null;
  prospectContactId: number | null;
  reason: string;
}): Promise<{ touchedRecords: number; displayName: string | null }> {
  let touched = 0;
  let displayName: string | null = null;
  const now = new Date();
  const normalized = normalizePhone(args.phoneNumber) || args.phoneNumber;

  // Candidate-rijen: per id én per phone (overlap is OK, idempotent)
  const candRows = await db.update(candidates).set({
    whatsappOptInStatus: 'opt_out',
    whatsappOptInChangedAt: now,
    whatsappOptInReason: args.reason,
    updatedAt: now,
  }).where(
    args.candidateId
      ? sql`${candidates.id} = ${args.candidateId} OR ${candidates.phone} = ${normalized}`
      : eq(candidates.phone, normalized)
  ).returning({ firstName: candidates.firstName, lastName: candidates.lastName });
  touched += candRows.length;
  if (candRows.length > 0 && !displayName) {
    displayName = `${candRows[0].firstName} ${candRows[0].lastName}`.trim() || null;
  }

  // Employee-rijen: per phone
  const empRows = await db.update(employees).set({
    whatsappOptInStatus: 'opt_out',
    whatsappOptInChangedAt: now,
    whatsappOptInReason: args.reason,
    updatedAt: now,
  }).where(eq(employees.phone, normalized))
    .returning({ firstName: employees.firstName, lastName: employees.lastName });
  touched += empRows.length;
  if (empRows.length > 0 && !displayName) {
    displayName = `${empRows[0].firstName} ${empRows[0].lastName}`.trim() || null;
  }

  // Prospect-rijen: per id (per phone is m2m unsafe — kan veel rijen raken)
  if (args.prospectContactId) {
    const prosRows = await db.update(prospectContacts).set({
      whatsappOptInStatus: 'opt_out',
      whatsappOptInChangedAt: now,
      whatsappOptInReason: args.reason,
      updatedAt: now,
    }).where(eq(prospectContacts.id, args.prospectContactId))
      .returning({ name: prospectContacts.name, voornaam: prospectContacts.voornaam, achternaam: prospectContacts.achternaam });
    touched += prosRows.length;
    if (prosRows.length > 0 && !displayName) {
      const r = prosRows[0];
      displayName = [r.voornaam, r.achternaam].filter(Boolean).join(' ').trim() || r.name;
    }
  }

  return { touchedRecords: touched, displayName };
}

/**
 * Handelt een delivery-failure af waarbij Meta aangeeft dat de gebruiker geblokkeerd heeft.
 * Wordt aangeroepen vanuit de status-event-handler (applyStatusEvent → resultaat 'failed').
 */
export async function handleBlockedByUser(args: {
  phoneNumber: string;
  candidateId: number | null;
  prospectContactId: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  const reason = `Meta: user blocked${args.errorCode ? ` (code ${args.errorCode})` : ''}`;

  let updated: { name: string | null } | null = null;
  if (args.candidateId) {
    updated = await setOptInStatus('kandidaat', args.candidateId, 'opt_out', reason);
  } else if (args.prospectContactId) {
    updated = await setOptInStatus('prospect', args.prospectContactId, 'opt_out', reason);
  }

  const naam = updated?.name || args.phoneNumber;
  const noot = `🛑 ${naam} heeft de business geblokkeerd (Meta-error). Opt-in op "opt_out" gezet.`;
  await addInternalStopNote(args.phoneNumber, noot);
  console.log(`[WA opt-out] ${noot}`);
}

// ─── Lookup: contactType uit conversation (voor Meta error-flow) ─────────────
export async function findConversationContact(phoneNumber: string): Promise<{
  candidateId: number | null;
  prospectContactId: number | null;
}> {
  const r = await db.select({
    candidateId: whatsappConversations.candidateId,
    prospectContactId: whatsappConversations.prospectContactId,
  }).from(whatsappConversations).where(eq(whatsappConversations.phoneNumber, phoneNumber)).limit(1);
  if (!r.length) return { candidateId: null, prospectContactId: null };
  return { candidateId: r[0].candidateId, prospectContactId: r[0].prospectContactId };
}
