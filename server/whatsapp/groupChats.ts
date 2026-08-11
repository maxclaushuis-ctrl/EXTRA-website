/**
 * WhatsApp-groepsgesprekken: aanmaken bij de actieve provider (Meta/
 * 360dialog — zie provider.ts), berichten versturen/ontvangen, deelnemers
 * beheren.
 *
 * ONTWERPPRINCIPES:
 * - Een groep wordt UITSLUITEND door EXTRA zelf aangemaakt (WhatsApp Groups
 *   API, max 8 deelnemers) — er is geen manier om aan een bestaande,
 *   door een klant/medewerker zelf gestarte groep "mee te kijken". Zie de
 *   toelichting die aan Max is gegeven vóór de bouw hiervan.
 * - Deelnemers komen NIET automatisch binnen via een webhook: het exacte
 *   schema van group_participants_update kon ik niet met zekerheid
 *   vaststellen. In plaats daarvan een handmatige "ververs deelnemers"-actie
 *   (refreshParticipants) die de canonieke lijst bij de provider ophaalt.
 * - Berichten in een groep lopen NIET door de matcher/AI-classificatie/
 *   taken-pijplijn van whatsapp_conversations — een groepsgesprek heeft geen
 *   kandidaat/prospect-eigenaar en de AI reageert er niet automatisch in.
 * - Elke medewerker met toegang tot het dashboard kan elk groepsgesprek zien
 *   en erin versturen — dat is precies het doel (monitorbaar door collega's,
 *   niet gebonden aan wie de groep heeft aangemaakt).
 */
import { db } from '../db';
import {
  whatsappGroupChats, whatsappGroupMessages,
  type WhatsappGroupChat, type InsertWhatsappGroupChat,
  type WhatsappGroupChatMessage,
} from '@shared/schema';
import { eq, desc, asc } from 'drizzle-orm';
import * as waProvider from './provider';
import { normalizePhone } from './phone';
import {
  MAX_GROUP_PARTICIPANTS, type ValidationError,
  type GroupParticipantInput, type NormalizedGroupParticipant,
  normalizeParticipants, validateBeforeCreate, validateBeforeSend,
} from './groupChatLogic';

export {
  MAX_GROUP_PARTICIPANTS, type ValidationError,
  type GroupParticipantInput, type NormalizedGroupParticipant,
  normalizeParticipants, validateBeforeCreate, validateBeforeSend,
} from './groupChatLogic';

// ─── Lezen ───────────────────────────────────────────────────────────────────

export async function listGroupChats(): Promise<WhatsappGroupChat[]> {
  return db.select().from(whatsappGroupChats)
    .where(eq(whatsappGroupChats.status, 'active'))
    .orderBy(desc(whatsappGroupChats.lastMessageAt), desc(whatsappGroupChats.createdAt));
}

export async function getGroupChatById(id: number): Promise<WhatsappGroupChat | null> {
  const rows = await db.select().from(whatsappGroupChats).where(eq(whatsappGroupChats.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getGroupChatByProviderGroupId(providerGroupId: string): Promise<WhatsappGroupChat | null> {
  const rows = await db.select().from(whatsappGroupChats)
    .where(eq(whatsappGroupChats.providerGroupId, providerGroupId)).limit(1);
  return rows[0] ?? null;
}

export async function listGroupMessages(groupChatId: number, limit = 200): Promise<WhatsappGroupChatMessage[]> {
  return db.select().from(whatsappGroupMessages)
    .where(eq(whatsappGroupMessages.groupChatId, groupChatId))
    .orderBy(asc(whatsappGroupMessages.createdAt))
    .limit(limit);
}

// ─── Aanmaken ────────────────────────────────────────────────────────────────

export interface CreateGroupChatInput {
  subject: string;
  description?: string | null;
  participants?: GroupParticipantInput[];
  createdByUserId?: number | null;
  createdByName?: string | null;
}

export interface CreateGroupChatResult {
  ok: boolean;
  groupChat?: WhatsappGroupChat;
  errors?: ValidationError[];
  providerError?: string;
}

/**
 * Maakt de groep aan bij de provider en slaat 'm lokaal op. `participants` in
 * de input is alleen een lokale wenslijst voor weergave/documentatie — mensen
 * worden hier NIET automatisch lid van: dat gaat via de invite_link die deze
 * functie teruggeeft (WhatsApp staat geen "direct toevoegen" toe voor
 * zakelijke groepen, alleen joinen via link).
 */
export async function createGroupChat(input: CreateGroupChatInput): Promise<CreateGroupChatResult> {
  const { participants, errors: participantErrors } = normalizeParticipants(input.participants);
  const errors = [
    ...participantErrors,
    ...validateBeforeCreate({ subject: input.subject, description: input.description, participants }),
  ];
  if (errors.length > 0) return { ok: false, errors };

  const created = await waProvider.createGroup({
    subject: input.subject.trim(),
    description: input.description?.trim() || undefined,
  });
  if (!created.ok || !created.groupId) {
    return { ok: false, providerError: created.errorMessage || 'Onbekende providerfout bij aanmaken van de groep' };
  }

  // Sommige providerresponsen geven de invite-link niet meteen mee bij het
  // aanmaken — dan apart ophalen. Lukt ook dat niet, dan de groep toch
  // bewaren (hij bestaat al bij de provider) met een lege link; de "ververs
  // deelnemers"-actie kan de link later alsnog ophalen.
  let inviteLink = created.inviteLink ?? null;
  if (!inviteLink) {
    const linkRes = await waProvider.getGroupInviteLink(created.groupId);
    if (linkRes.ok) inviteLink = linkRes.inviteLink ?? null;
  }

  const values: InsertWhatsappGroupChat = {
    providerGroupId: created.groupId,
    subject: input.subject.trim(),
    description: input.description?.trim() || null,
    inviteLink,
    participants,
    participantCount: participants.length,
    createdByUserId: input.createdByUserId ?? null,
    createdByName: input.createdByName ?? null,
  };
  const [row] = await db.insert(whatsappGroupChats).values(values).returning();
  return { ok: true, groupChat: row };
}

// ─── Deelnemers ──────────────────────────────────────────────────────────────

export interface RefreshResult {
  ok: boolean;
  groupChat?: WhatsappGroupChat;
  providerError?: string;
}

/**
 * Handmatige ververs-actie: haalt de canonieke deelnemerslijst + status op
 * bij de provider (GET .../groups/:id) en werkt de lokale kopie bij. Dit is
 * de enige manier waarop deze tabel weet wie er inmiddels via de
 * uitnodigingslink is toegetreden — er is geen automatische webhook-sync.
 */
export async function refreshParticipants(id: number): Promise<RefreshResult> {
  const existing = await getGroupChatById(id);
  if (!existing) throw new Error(`Groepsgesprek ${id} niet gevonden`);

  const info = await waProvider.getGroupInfo(existing.providerGroupId);
  if (!info.ok) return { ok: false, providerError: info.errorMessage || 'Onbekende providerfout' };

  const participants = (info.participants || []).map(p => ({ phone: p.phone, naam: p.name || null }));
  const [row] = await db.update(whatsappGroupChats).set({
    participants,
    participantCount: info.participantCount ?? participants.length,
    status: info.suspended ? 'suspended' : (existing.status === 'suspended' ? 'active' : existing.status),
    subject: info.subject || existing.subject,
    description: info.description !== undefined ? (info.description ?? existing.description) : existing.description,
    participantsSyncedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(whatsappGroupChats.id, id)).returning();

  return { ok: true, groupChat: row };
}

export interface RemoveParticipantResult {
  ok: boolean;
  groupChat?: WhatsappGroupChat;
  providerError?: string;
}

export async function removeParticipant(id: number, phone: string): Promise<RemoveParticipantResult> {
  const existing = await getGroupChatById(id);
  if (!existing) throw new Error(`Groepsgesprek ${id} niet gevonden`);
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, providerError: `Ongeldig telefoonnummer: "${phone}"` };

  const res = await waProvider.removeGroupParticipants(existing.providerGroupId, [normalized]);
  if (!res.ok) return { ok: false, providerError: res.errorMessage || 'Onbekende providerfout' };

  const bestaandeDeelnemers = Array.isArray(existing.participants) ? (existing.participants as NormalizedGroupParticipant[]) : [];
  const participants = bestaandeDeelnemers.filter(p => p.phone !== normalized);
  const [row] = await db.update(whatsappGroupChats).set({
    participants,
    participantCount: participants.length,
    updatedAt: new Date(),
  }).where(eq(whatsappGroupChats.id, id)).returning();

  return { ok: true, groupChat: row };
}

// ─── Berichten versturen ─────────────────────────────────────────────────────

export interface SendResult {
  ok: boolean;
  message?: WhatsappGroupChatMessage;
  errors?: ValidationError[];
  providerError?: string;
}

export async function sendGroupChatMessage(
  id: number,
  body: string,
  sender: { userId?: number | null; name?: string | null },
): Promise<SendResult> {
  const existing = await getGroupChatById(id);
  if (!existing) throw new Error(`Groepsgesprek ${id} niet gevonden`);

  const errors = validateBeforeSend({ status: existing.status, body });
  if (errors.length > 0) return { ok: false, errors };

  const res = await waProvider.sendGroupText(existing.providerGroupId, body.trim());
  if (!res.ok) return { ok: false, providerError: res.errorMessage || 'Onbekende providerfout' };

  const [row] = await db.insert(whatsappGroupMessages).values({
    groupChatId: id,
    direction: 'outbound',
    waMessageId: res.waMessageId ?? null,
    messageType: 'text',
    body: body.trim(),
    sentByUserId: sender.userId ?? null,
    sentByName: sender.name ?? null,
    status: 'sent',
  }).returning();

  await db.update(whatsappGroupChats).set({
    lastMessageAt: new Date(),
    lastMessagePreview: body.trim().slice(0, 200),
    updatedAt: new Date(),
  }).where(eq(whatsappGroupChats.id, id));

  return { ok: true, message: row };
}

// ─── Inbound (aangeroepen vanuit inboundProcessor.ts) ───────────────────────

export interface InsertInboundGroupMessageArgs {
  providerGroupId: string;
  waMessageId: string | null;
  participantPhone: string | null;
  participantName: string | null;
  messageType: string;
  body: string;
  rawPayload: any;
}

/**
 * Idempotente insert (uniek op wa_message_id, net als whatsapp_messages).
 * Geeft `null` terug als de groep onbekend is (nooit door ons aangemaakt —
 * zou niet moeten gebeuren, maar de webhook mag hier nooit op crashen) of bij
 * een duplicate.
 */
export async function insertInboundGroupMessage(args: InsertInboundGroupMessageArgs): Promise<number | null> {
  const chat = await getGroupChatByProviderGroupId(args.providerGroupId);
  if (!chat) return null;

  try {
    const [row] = await db.insert(whatsappGroupMessages).values({
      groupChatId: chat.id,
      direction: 'inbound',
      waMessageId: args.waMessageId,
      participantPhone: args.participantPhone,
      participantName: args.participantName,
      messageType: args.messageType,
      body: args.body,
      rawPayload: args.rawPayload,
      status: 'received',
    }).returning({ id: whatsappGroupMessages.id });

    await db.update(whatsappGroupChats).set({
      lastMessageAt: new Date(),
      lastMessagePreview: args.body.slice(0, 200),
      updatedAt: new Date(),
    }).where(eq(whatsappGroupChats.id, chat.id));

    return row.id;
  } catch (e: any) {
    // Unieke-index-schending op wa_message_id → duplicate webhook-aflevering.
    if (e?.code === '23505') return null;
    throw e;
  }
}
