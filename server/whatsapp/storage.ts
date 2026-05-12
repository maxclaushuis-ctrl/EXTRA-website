/**
 * Persistentie-laag voor WhatsApp Fase 1: berichten + gesprekken.
 * Bouwt op `whatsapp_messages` + `whatsapp_conversations` tabellen.
 */
import { db } from '../db';
import { whatsappMessages, whatsappConversations, type InsertWhatsappMessage } from '@shared/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { matchPhoneToContact, type MatchCategory } from './matcher';
import { normalizePhone } from './phone';

const PREVIEW_LEN = 100;

function preview(text: string | null | undefined): string {
  const s = (text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > PREVIEW_LEN ? s.slice(0, PREVIEW_LEN - 1) + '…' : s;
}

/**
 * Upsert van een gespreksrij op basis van phone_number.
 * - Bij inbound: verhoog unread_count, update last_inbound_at.
 * - Bij outbound: laat unread_count met rust (operator stuurt zelf).
 */
export async function upsertConversation(args: {
  phoneNumber: string;
  candidateId: number | null;
  prospectContactId: number | null;
  category: MatchCategory;
  displayName: string | null;
  inbound: boolean;
  bodyPreview: string;
  at: Date;
}): Promise<void> {
  const { phoneNumber, candidateId, prospectContactId, category, displayName, inbound, bodyPreview, at } = args;
  const previewText = preview(bodyPreview);

  await db
    .insert(whatsappConversations)
    .values({
      phoneNumber,
      candidateId: candidateId ?? null,
      prospectContactId: prospectContactId ?? null,
      matchCategory: category,
      displayName,
      lastMessageAt: at,
      lastMessagePreview: previewText,
      unreadCount: inbound ? 1 : 0,
      lastInboundAt: inbound ? at : null,
    })
    .onConflictDoUpdate({
      target: whatsappConversations.phoneNumber,
      set: {
        candidateId: candidateId ?? sql`${whatsappConversations.candidateId}`,
        prospectContactId: prospectContactId ?? sql`${whatsappConversations.prospectContactId}`,
        // Handmatige override (manualCategory) wint van auto-match
        matchCategory: sql`COALESCE(${whatsappConversations.manualCategory}, ${category})`,
        displayName: displayName ?? sql`${whatsappConversations.displayName}`,
        lastMessageAt: at,
        lastMessagePreview: previewText,
        unreadCount: inbound
          ? sql`${whatsappConversations.unreadCount} + 1`
          : sql`${whatsappConversations.unreadCount}`,
        lastInboundAt: inbound
          ? sql`GREATEST(${whatsappConversations.lastInboundAt}, ${at})`
          : sql`${whatsappConversations.lastInboundAt}`,
        updatedAt: sql`GREATEST(${whatsappConversations.updatedAt}, ${at})`,
      },
    });
}

/**
 * Insert van inbound bericht. Idempotent op wa_message_id.
 * Geeft `null` terug als wa_message_id al bestaat (duplicate).
 */
export async function insertInboundMessage(msg: InsertWhatsappMessage): Promise<number | null> {
  if (msg.waMessageId) {
    const existing = await db
      .select({ id: whatsappMessages.id })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.waMessageId, msg.waMessageId))
      .limit(1);
    if (existing.length > 0) return null;
  }
  const [row] = await db.insert(whatsappMessages).values(msg).returning({ id: whatsappMessages.id });
  return row?.id ?? null;
}

/**
 * Insert van outbound bericht (begint met status='queued').
 */
export async function insertOutboundQueued(msg: InsertWhatsappMessage): Promise<number> {
  const [row] = await db.insert(whatsappMessages).values({ ...msg, status: 'queued', direction: 'outbound' }).returning({ id: whatsappMessages.id });
  return row.id;
}

/**
 * Update outbound bericht na API-call.
 */
export async function updateOutboundResult(
  id: number,
  result: { waMessageId?: string | null; status: string; errorCode?: string | null; errorMessage?: string | null },
): Promise<void> {
  await db
    .update(whatsappMessages)
    .set({
      waMessageId: result.waMessageId ?? null,
      status: result.status,
      errorCode: result.errorCode ?? null,
      errorMessage: result.errorMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(whatsappMessages.id, id));
}

/**
 * Update status op basis van wa_message_id (vanuit 360dialog statuses[]).
 * Geeft true terug als een rij is geüpdatet.
 */
export async function applyStatusEvent(waMessageId: string, status: string, errorCode?: string, errorMessage?: string): Promise<boolean> {
  const r = await db
    .update(whatsappMessages)
    .set({
      status,
      errorCode: errorCode ?? null,
      errorMessage: errorMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(whatsappMessages.waMessageId, waMessageId))
    .returning({ id: whatsappMessages.id });
  return r.length > 0;
}

/**
 * Markeer een nummer als 'gelezen' — zet unread_count op 0.
 */
export async function markConversationRead(phoneNumber: string): Promise<void> {
  await db
    .update(whatsappConversations)
    .set({ unreadCount: 0, updatedAt: new Date() })
    .where(eq(whatsappConversations.phoneNumber, phoneNumber));
}

/**
 * Lijst gesprekken, eventueel gefilterd op categorie.
 */
export async function listConversations(args: {
  category?: 'candidate' | 'prospect' | 'unmatched';
  limit?: number;
  offset?: number;
}) {
  const { category, limit = 50, offset = 0 } = args;
  const whereCond = category ? eq(whatsappConversations.matchCategory, category) : undefined;
  const rows = await db
    .select()
    .from(whatsappConversations)
    .where(whereCond as any)
    .orderBy(desc(whatsappConversations.lastMessageAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

/**
 * Berichten voor één telefoonnummer chronologisch (oudste eerst).
 */
export async function getMessagesForPhone(phoneNumber: string, limit = 50) {
  // Berichten waar phoneNumber óf de from óf de to is (in/out).
  const rows = await db
    .select()
    .from(whatsappMessages)
    .where(
      sql`${whatsappMessages.fromNumber} = ${phoneNumber} OR ${whatsappMessages.toNumber} = ${phoneNumber}`,
    )
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(limit);
  // Geef chronologisch (oudste eerst) terug
  return rows.reverse();
}

/**
 * Stats per categorie + totale ongelezen.
 */
export async function getStats() {
  const rows = await db
    .select({
      category: whatsappConversations.matchCategory,
      total: sql<number>`count(*)::int`,
      unread: sql<number>`coalesce(sum(case when ${whatsappConversations.unreadCount} > 0 then 1 else 0 end), 0)::int`,
    })
    .from(whatsappConversations)
    .groupBy(whatsappConversations.matchCategory);

  const out = {
    candidate: { total: 0, unread: 0 },
    prospect: { total: 0, unread: 0 },
    unmatched: { total: 0, unread: 0 },
    totalUnread: 0,
  };
  for (const r of rows) {
    out[r.category as 'candidate' | 'prospect' | 'unmatched'] = { total: r.total, unread: r.unread };
    out.totalUnread += r.unread;
  }
  return out;
}

/**
 * Helper: bouw een beschrijvende `body` voor niet-text berichten.
 */
export function describeNonTextMessage(type: string, msg: any): string {
  const caption = msg?.[type]?.caption || msg?.[type]?.body || '';
  const filename = msg?.[type]?.filename || '';
  switch (type) {
    case 'image':       return `[afbeelding${caption ? ': ' + caption : ''}]`;
    case 'video':       return `[video${caption ? ': ' + caption : ''}]`;
    case 'audio':       return `[audio]`;
    case 'document':    return `[document${filename ? ': ' + filename : caption ? ': ' + caption : ''}]`;
    case 'sticker':     return `[sticker]`;
    case 'location':    return `[locatie ${msg?.location?.latitude ?? '?'}, ${msg?.location?.longitude ?? '?'}]`;
    case 'contacts':    return `[contact gedeeld]`;
    case 'interactive': return `[interactief antwoord: ${msg?.interactive?.button_reply?.title || msg?.interactive?.list_reply?.title || 'onbekend'}]`;
    default:            return `[${type}]`;
  }
}

/**
 * Match phone aan candidate/prospect EN upsert conversation in één call.
 * Hergebruikt door zowel inbound als outbound.
 */
export async function resolveAndUpsertConversation(args: {
  phoneNumber: string;
  inbound: boolean;
  bodyPreview: string;
  at: Date;
}) {
  const m = await matchPhoneToContact(args.phoneNumber);
  await upsertConversation({
    phoneNumber: args.phoneNumber,
    candidateId: m.candidateId,
    prospectContactId: m.prospectContactId,
    category: m.category,
    displayName: m.displayName,
    inbound: args.inbound,
    bodyPreview: args.bodyPreview,
    at: args.at,
  });
  return m;
}

// ─── Sollicitanten + Medewerkers → WhatsApp contact ────────────────────────
// Wordt aangeroepen vanuit /api/sollicitatie en /api/admin/employees-flows:
// zet de persoon direct als contact in de WhatsApp-lijst zodat planners hem
// kunnen aanschrijven, met de juiste functie- en taal-labels al ingevuld.

// Mapping van alle bekende functie-strings (sollicitant-categorieën én
// medewerker-functies) naar één van de 4 conversatie-functie-labels.
const FUNCTIE_TO_LABEL: Record<string, string> = {
  // sollicitant categorieën
  horecamedewerker: 'horeca',
  chef: 'chef',
  housekeeping: 'housekeeping',
  logistiek: 'logistiek',
  frontoffice: 'frontoffice',
  // medewerker functie-waarden
  bediening: 'horeca',
  'front-office': 'frontoffice',
  orderpicker: 'logistiek',
  // alias-veiligheid
  horeca: 'horeca',
};

const TAAL_GROUP_LABELS = new Set(['nl', 'en']);
const FUNCTIE_GROUP_LABELS = new Set(['horeca', 'chef', 'housekeeping', 'logistiek', 'frontoffice']);

function functieToLabel(functie: string | null | undefined): string | null {
  if (!functie) return null;
  return FUNCTIE_TO_LABEL[String(functie).trim().toLowerCase()] || null;
}

// Accepteert zowel een array (sollicitatieformulier) als een string
// ("Nederlands" / "Engels" / "Engels, Nederlands").
function languageToTaalLabel(input: unknown): string | null {
  let parts: string[] = [];
  if (Array.isArray(input)) {
    parts = input.map((l) => (typeof l === 'string' ? l : ''));
  } else if (typeof input === 'string') {
    parts = input.split(/[,;]/);
  }
  const lower = parts.map((l) => l.trim().toLowerCase()).filter(Boolean);
  if (lower.includes('nederlands') || lower.includes('nl')) return 'nl';
  if (lower.includes('engels') || lower.includes('en') || lower.includes('english')) return 'en';
  return null;
}

export interface UpsertContactResult {
  ok: boolean;
  reason?: 'invalid_phone';
  conversationId?: number;
  phoneNumber?: string;
  labels?: string[];
  created?: boolean;
}

// Lage-niveau upsert die de feitelijke insert/update + label-merge doet.
async function upsertContactWithLabels(args: {
  rawPhone: string | null | undefined;
  candidateId: number | null;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  functieLabel: string | null;
  taalLabel: string | null;
  newPreview: string;
  // 'candidate' = Medewerkers-tab, 'unmatched' = Kandidaten-tab.
  // Sollicitanten/kandidaten horen op Kandidaten; pas bij 'aangenomen' op Medewerkers.
  targetCategory: MatchCategory;
}): Promise<UpsertContactResult> {
  const phoneNumber = normalizePhone(args.rawPhone || '');
  if (!phoneNumber) return { ok: false, reason: 'invalid_phone' };

  const displayName = `${args.firstName ?? ''} ${args.lastName ?? ''}`.trim() || null;

  const existing = await db
    .select({ id: whatsappConversations.id, labels: whatsappConversations.labels })
    .from(whatsappConversations)
    .where(eq(whatsappConversations.phoneNumber, phoneNumber))
    .limit(1);

  const existingLabels = (existing[0]?.labels ?? []) as string[];
  const preserved = existingLabels.filter(
    (l) => !TAAL_GROUP_LABELS.has(l) && !FUNCTIE_GROUP_LABELS.has(l),
  );
  const merged = [...preserved];
  if (args.taalLabel) merged.push(args.taalLabel);
  if (args.functieLabel) merged.push(args.functieLabel);
  const finalLabels = Array.from(new Set(merged));

  const now = new Date();
  const targetCategory: MatchCategory = args.targetCategory;

  if (existing.length === 0) {
    const [row] = await db
      .insert(whatsappConversations)
      .values({
        phoneNumber,
        candidateId: args.candidateId,
        matchCategory: targetCategory,
        displayName,
        labels: finalLabels.length ? finalLabels : null,
        lastMessageAt: now,
        lastMessagePreview: args.newPreview,
        unreadCount: 0,
      })
      .returning({ id: whatsappConversations.id });
    return {
      ok: true,
      conversationId: row?.id,
      phoneNumber,
      labels: finalLabels,
      created: true,
    };
  }

  await db
    .update(whatsappConversations)
    .set({
      // Alleen overschrijven als we daadwerkelijk een candidate-link hebben.
      candidateId: args.candidateId
        ? args.candidateId
        : sql`${whatsappConversations.candidateId}`,
      matchCategory: sql`COALESCE(${whatsappConversations.manualCategory}, ${targetCategory})`,
      displayName: sql`COALESCE(${whatsappConversations.displayName}, ${displayName})`,
      labels: finalLabels.length ? finalLabels : null,
      updatedAt: now,
    })
    .where(eq(whatsappConversations.id, existing[0].id));

  return {
    ok: true,
    conversationId: existing[0].id,
    phoneNumber,
    labels: finalLabels,
    created: false,
  };
}

export async function upsertSollicitantContact(args: {
  rawPhone: string | null | undefined;
  candidateId: number;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  functionType: string | null | undefined;
  languages: unknown;
}): Promise<UpsertContactResult> {
  return upsertContactWithLabels({
    rawPhone: args.rawPhone,
    candidateId: args.candidateId,
    firstName: args.firstName,
    lastName: args.lastName,
    functieLabel: functieToLabel(args.functionType),
    taalLabel: languageToTaalLabel(args.languages),
    newPreview: '[Sollicitant — nog geen bericht]',
    targetCategory: 'unmatched', // Sollicitant/kandidaat → Kandidaten-tab
  });
}

export async function upsertEmployeeContact(args: {
  rawPhone: string | null | undefined;
  candidateId?: number | null;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  functie: string | null | undefined;
  language: string | null | undefined;
}): Promise<UpsertContactResult> {
  return upsertContactWithLabels({
    rawPhone: args.rawPhone,
    candidateId: args.candidateId ?? null,
    firstName: args.firstName,
    lastName: args.lastName,
    functieLabel: functieToLabel(args.functie),
    taalLabel: languageToTaalLabel(args.language),
    newPreview: '[Medewerker — nog geen bericht]',
    targetCategory: 'candidate', // Aangenomen → Medewerkers-tab
  });
}
