/**
 * Persistentie-laag voor WhatsApp Fase 1: berichten + gesprekken.
 * Bouwt op `whatsapp_messages` + `whatsapp_conversations` tabellen.
 */
import { db } from '../db';
import { whatsappMessages, whatsappConversations, whatsappTasks, whatsappImportedContacts, type InsertWhatsappMessage } from '@shared/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { matchPhoneToContact, type MatchCategory } from './matcher';
import { normalizePhone } from './phone';
import type { AiTaskSuggestion } from './aiClassifier';
import { buildTaskDraft, isDuplicateOfOpenTask } from './taskRules';

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
        // Fase 2: nieuw INKOMEND bericht heft de snooze op zodat het gesprek
        // weer in de actieve lijst verschijnt.
        snoozedUntil: inbound ? null : sql`${whatsappConversations.snoozedUntil}`,
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
 * Insert van een APP-ECHO: een bericht dat vanaf de telefoon zelf is
 * verstuurd, en dat Meta in Coexistence terugstuurt via message_echoes[].
 *
 * Bewust een eigen functie en niet insertOutboundQueued():
 *   - insertOutboundQueued is NIET idempotent (die gaat ervan uit dat wij het
 *     bericht zelf net hebben aangemaakt), en Meta mag een webhook herhalen.
 *   - de status is hier al 'sent' — het bericht is al de deur uit, er komt
 *     geen API-call meer van ons die het op 'sent' zet.
 *   - sent_by_user_id blijft leeg: we weten wél dat een mens het typte, maar
 *     niet wélke. Daarom sent_source='app' als apart signaal.
 *
 * Geeft `null` terug als wa_message_id al bestaat (duplicate webhook).
 */
export async function insertAppEcho(msg: InsertWhatsappMessage): Promise<number | null> {
  if (msg.waMessageId) {
    const existing = await db
      .select({ id: whatsappMessages.id })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.waMessageId, msg.waMessageId))
      .limit(1);
    if (existing.length > 0) return null;
  }
  const [row] = await db
    .insert(whatsappMessages)
    .values({ ...msg, direction: 'outbound', sentSource: 'app', sentByUserId: null })
    .returning({ id: whatsappMessages.id });
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
 * Koppel een gedownload bestand aan een bericht.
 *
 * Raakt media_url NIET aan: daar blijft het ruwe media-id van de provider in
 * staan, ongeacht of de download is gelukt. Alleen media_object_path (en
 * eventueel de bestandsnaam en het definitieve mime-type) wordt gezet, zodat
 * de UI aan één kolom genoeg heeft om te weten of er echt iets te tonen is.
 */
export async function updateMessageMedia(
  id: number,
  media: { objectPath: string; mimeType?: string | null; filename?: string | null },
): Promise<void> {
  const set: Record<string, unknown> = {
    mediaObjectPath: media.objectPath,
    updatedAt: new Date(),
  };
  if (media.mimeType) set.mediaMimeType = media.mimeType;
  if (media.filename) set.mediaFilename = media.filename;
  await db.update(whatsappMessages).set(set).where(eq(whatsappMessages.id, id));
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
 * Fase 3: afgeleide weergavestatus van een gesprek. Bewust AFGELEID en niet
 * opgeslagen — er is dus geen tweede statusveld dat uit de pas kan gaan lopen.
 */
export type ConversationDisplayStatus =
  | 'wacht_op_planner'
  | 'afgehandeld_ai'
  | 'gesnoozed'
  | 'opgelost'
  | 'spam'
  | 'open';

/**
 * Lijst gesprekken, eventueel gefilterd op categorie.
 *
 * Fase 3 voegt afgeleide velden `aiHandledLast` en `displayStatus` per rij toe.
 *
 * Sortering is puur op laatste bericht (nieuwste eerst), zoals een gewone
 * chat-app. Eerder pinden we gesprekken die op de planner wachten (escalatie)
 * altijd bovenaan, los van het laatste bericht — dat maakte de volgorde
 * onvoorspelbaar zodra het bijbehorende ESCALATIE-label niet meer in de lijst
 * stond (zie ConversationList.tsx), en is op verzoek losgelaten. Een gesprek
 * dat op de planner wacht blijft gewoon vindbaar via displayStatus/filters —
 * alleen de positie in de lijst is niet langer los van de berichttijd.
 */
export async function listConversations(args: {
  category?: 'candidate' | 'prospect' | 'unmatched';
  limit?: number;
  offset?: number;
  /**
   * Fase 2 snooze-filter:
   *  - 'exclude' (default): verberg gesprekken met snoozed_until in de toekomst
   *  - 'only':    toon alléén gesnoozede gesprekken
   *  - 'all':     geen snooze-filter
   */
  snoozed?: 'exclude' | 'only' | 'all';
}) {
  const { category, limit = 50, offset = 0, snoozed = 'exclude' } = args;
  const conds = [];
  if (category) conds.push(eq(whatsappConversations.matchCategory, category));
  if (snoozed === 'exclude') {
    conds.push(sql`(${whatsappConversations.snoozedUntil} IS NULL OR ${whatsappConversations.snoozedUntil} <= NOW())`);
  } else if (snoozed === 'only') {
    conds.push(sql`${whatsappConversations.snoozedUntil} > NOW()`);
  }
  const whereCond = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

  // "Afgehandeld door AI" = het laatste bericht in het gesprek is uitgaand én
  // heeft geen menselijke afzender (sent_by_user_id IS NULL). Live afgeleid uit
  // whatsapp_messages, zodat het niet kan verouderen.
  //
  // Fase 3D: sent_source='app' er expliciet uit. Een bericht dat vanaf de
  // telefoon is getypt komt via de echo binnen zonder sent_by_user_id (we
  // weten niet wie het typte), en zou dus als "AI-afgehandeld" tellen. Het
  // gesprek zou daarmee uit de inbox verdwijnen zodra iemand op de telefoon
  // antwoordt — precies andersom dan bedoeld. IS DISTINCT FROM, niet <>, want
  // alle bestaande rijen hebben hier null staan.
  const aiHandledLast = sql<boolean>`(
    SELECT m.direction = 'outbound'
       AND m.sent_by_user_id IS NULL
       AND m.sent_source IS DISTINCT FROM 'app'
    FROM whatsapp_messages m
    WHERE m.from_number = ${whatsappConversations.phoneNumber}
       OR m.to_number   = ${whatsappConversations.phoneNumber}
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  )`;

  const rows = await db
    .select({
      conv: whatsappConversations,
      aiHandledLast,
    })
    .from(whatsappConversations)
    .where(whereCond as any)
    .orderBy(desc(whatsappConversations.lastMessageAt))
    .limit(limit)
    .offset(offset);

  const resultaat = rows.map(r => {
    const c = r.conv;
    const aiLast = r.aiHandledLast === true;
    const gesnoozed = !!c.snoozedUntil && new Date(c.snoozedUntil).getTime() > Date.now();
    let displayStatus: ConversationDisplayStatus;
    if (c.inboxStatus === 'spam') displayStatus = 'spam';
    else if (c.inboxStatus === 'resolved') displayStatus = 'opgelost';
    else if (c.escalatedAt) displayStatus = 'wacht_op_planner';
    else if (gesnoozed) displayStatus = 'gesnoozed';
    else if (aiLast) displayStatus = 'afgehandeld_ai';
    else displayStatus = 'open';
    return { ...c, aiHandledLast: aiLast, displayStatus, importedContactName: null as string | null };
  });

  // Eenmalige contactenimport (augustus 2026) als laatste redmiddel voor een
  // naam: alléén opgezocht voor gesprekken zonder échte match (geen
  // display_name). Raakt display_name/match_category/manual_category nooit
  // aan — bestaande matches blijven dus altijd ongemoeid. Zie
  // shared/schema.ts (whatsappImportedContacts) en scripts/import-contacten.ts.
  const zonderEchteNaam = resultaat.filter(c => !c.displayName);
  if (zonderEchteNaam.length > 0) {
    const genormaliseerd = new Map<string, string>(); // genormaliseerd nummer -> phoneNumber van de rij
    for (const c of zonderEchteNaam) {
      const n = normalizePhone(c.phoneNumber);
      if (n) genormaliseerd.set(n, c.phoneNumber);
    }
    if (genormaliseerd.size > 0) {
      const gevonden = await db
        .select({ phone: whatsappImportedContacts.phone, name: whatsappImportedContacts.name })
        .from(whatsappImportedContacts)
        .where(inArray(whatsappImportedContacts.phone, Array.from(genormaliseerd.keys())));
      const naamPerNummer = new Map(gevonden.map(g => [g.phone, g.name]));
      for (const c of resultaat) {
        if (c.displayName) continue;
        const n = normalizePhone(c.phoneNumber);
        if (n) c.importedContactName = naamPerNummer.get(n) ?? null;
      }
    }
  }

  return resultaat;
}

/**
 * Fase 3: schrijf het AI-label weg. Respecteert een handmatige keuze — als een
 * planner de categorie zelf heeft gezet, laat de AI die staan.
 */
export async function setAiCategory(
  phoneNumber: string,
  category: string,
  source: 'ai' | 'handmatig',
): Promise<void> {
  if (source === 'handmatig') {
    await db.update(whatsappConversations)
      .set({ aiCategory: category, aiCategorySource: 'handmatig', updatedAt: new Date() })
      .where(eq(whatsappConversations.phoneNumber, phoneNumber));
    return;
  }
  await db.update(whatsappConversations)
    .set({ aiCategory: category, aiCategorySource: 'ai', updatedAt: new Date() })
    .where(and(
      eq(whatsappConversations.phoneNumber, phoneNumber),
      sql`${whatsappConversations.aiCategorySource} IS DISTINCT FROM 'handmatig'`,
    ));
}

/**
 * Fase 3: markeer een gesprek als geëscaleerd naar een mens.
 *
 * escalated_at wordt NIET ververst wanneer het gesprek al als escalatie
 * openstaat: anders springt het bij elk volgend bericht weer bovenaan en
 * verlies je de "langst wachtende onderaan"-volgorde van de wachtrij.
 */
export async function markEscalated(phoneNumber: string, reason: string): Promise<void> {
  await db.update(whatsappConversations)
    .set({
      escalationReason: reason,
      escalatedAt: sql`COALESCE(${whatsappConversations.escalatedAt}, NOW())`,
      updatedAt: new Date(),
    })
    .where(eq(whatsappConversations.phoneNumber, phoneNumber));
}

/**
 * Fase 3: escalatie opheffen. Wordt aangeroepen zodra een MENS antwoordt of het
 * gesprek op opgelost/spam wordt gezet — dan wacht er niets meer op de planner.
 */
export async function clearEscalation(phoneNumber: string): Promise<void> {
  await db.update(whatsappConversations)
    .set({ escalationReason: null, escalatedAt: null, updatedAt: new Date() })
    .where(and(
      eq(whatsappConversations.phoneNumber, phoneNumber),
      sql`${whatsappConversations.escalatedAt} IS NOT NULL`,
    ));
}

// ─── Fase 3B: taken ─────────────────────────────────────────────────────────

/**
 * Maak een taak aan uit een AI-suggestie. Geeft de nieuwe taak-id terug, of
 * null als er (bewust) geen taak is aangemaakt.
 *
 * Drie beveiligingen tegen dubbele of lege taken:
 *  1. buildTaskDraft weigert lege/onzinnige samenvattingen
 *  2. isDuplicateOfOpenTask vangt hetzelfde verzoek in een tweede bericht
 *  3. de unieke index op source_message_id vangt een dubbel bezorgde webhook
 *     (onConflictDoNothing, dus dat is geen fout maar een no-op)
 */
export async function createTaskFromAi(args: {
  phoneNumber: string;
  suggestion: AiTaskSuggestion | null | undefined;
  sourceMessageId: number | null;
}): Promise<number | null> {
  const draft = buildTaskDraft(args.suggestion);
  if (!draft) return null;

  const convRows = await db
    .select({
      id: whatsappConversations.id,
      assignedToId: whatsappConversations.assignedToId,
      assignedToName: whatsappConversations.assignedToName,
    })
    .from(whatsappConversations)
    .where(eq(whatsappConversations.phoneNumber, args.phoneNumber))
    .limit(1);
  const conv = convRows[0];
  // Geen gesprek = geen taak. Kan alleen bij een race; het volgende bericht
  // levert dan gewoon opnieuw een suggestie op.
  if (!conv) return null;

  const openTasks = await db
    .select({ summary: whatsappTasks.summary })
    .from(whatsappTasks)
    .where(and(eq(whatsappTasks.conversationId, conv.id), eq(whatsappTasks.status, 'open')));
  if (isDuplicateOfOpenTask(draft.summary, openTasks.map(t => t.summary))) {
    return null;
  }

  const inserted = await db
    .insert(whatsappTasks)
    .values({
      conversationId: conv.id,
      phoneNumber: args.phoneNumber,
      summary: draft.summary,
      category: draft.category,
      // Erft de toegewezene van het gesprek; is die leeg, dan komt de taak in
      // de algemene bak en kan iemand hem naar zichzelf trekken.
      assignedToId: conv.assignedToId ?? null,
      assignedToName: conv.assignedToName ?? null,
      status: 'open',
      sourceMessageId: args.sourceMessageId,
    })
    .onConflictDoNothing({ target: whatsappTasks.sourceMessageId })
    .returning({ id: whatsappTasks.id });

  return inserted[0]?.id ?? null;
}

export interface TaskListFilter {
  /** 'open' (default) | 'klaar' | 'alle' */
  status?: 'open' | 'klaar' | 'alle';
  /** Alleen taken van deze gebruiker; 'niemand' = taken zonder toegewezene. */
  assignedToId?: number | 'niemand';
  limit?: number;
}

/**
 * Takenlijst voor de sidebar. Open taken eerst en daarbinnen oudste bovenaan:
 * een taak die er al twee dagen staat is dringender dan die van vijf minuten
 * geleden — precies andersom dan bij een berichtenlijst.
 */
export async function listTasks(filter: TaskListFilter = {}) {
  const { status = 'open', assignedToId, limit = 100 } = filter;
  const conds = [];
  if (status !== 'alle') conds.push(eq(whatsappTasks.status, status));
  if (assignedToId === 'niemand') conds.push(sql`${whatsappTasks.assignedToId} IS NULL`);
  else if (typeof assignedToId === 'number') conds.push(eq(whatsappTasks.assignedToId, assignedToId));
  const whereCond = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

  const rows = await db
    .select({
      task: whatsappTasks,
      displayName: whatsappConversations.displayName,
      // Nodig voor de doorklik: de UI moet weten in welke tab (Medewerkers /
      // Kandidaten / Klanten) het gesprek staat, anders opent hij een leeg
      // scherm als de taak bij een andere tab hoort dan de actieve.
      matchCategory: whatsappConversations.matchCategory,
    })
    .from(whatsappTasks)
    .leftJoin(whatsappConversations, eq(whatsappTasks.conversationId, whatsappConversations.id))
    .where(whereCond as any)
    .orderBy(
      sql`CASE WHEN ${whatsappTasks.status} = 'open' THEN 0 ELSE 1 END`,
      sql`${whatsappTasks.createdAt} ASC`,
    )
    .limit(limit);

  return rows.map(r => ({
    ...r.task,
    contactName: r.displayName ?? null,
    matchCategory: r.matchCategory ?? null,
  }));
}

/** Aantal open taken, eventueel voor één persoon. Voor de teller in de sidebar. */
export async function countOpenTasks(assignedToId?: number): Promise<number> {
  const conds = [eq(whatsappTasks.status, 'open')];
  if (typeof assignedToId === 'number') conds.push(eq(whatsappTasks.assignedToId, assignedToId));
  const rows = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(whatsappTasks)
    .where(and(...conds));
  return rows[0]?.n ?? 0;
}

/**
 * Taak afvinken of weer openzetten. Raakt het GESPREK niet aan — dat is de
 * hele reden dat taken een eigen tabel hebben.
 */
export async function setTaskStatus(
  taskId: number,
  status: 'open' | 'klaar',
  door: { id: number | null; naam: string | null },
): Promise<boolean> {
  const rows = await db
    .update(whatsappTasks)
    .set(
      status === 'klaar'
        ? { status, completedAt: new Date(), completedById: door.id ?? null, completedByName: door.naam ?? null }
        : { status, completedAt: null, completedById: null, completedByName: null },
    )
    .where(eq(whatsappTasks.id, taskId))
    .returning({ id: whatsappTasks.id });
  return rows.length > 0;
}

/** Taak aan iemand anders toewijzen (of vrijgeven met null). */
export async function setTaskAssignee(
  taskId: number,
  assignee: { id: number | null; naam: string | null },
): Promise<boolean> {
  const rows = await db
    .update(whatsappTasks)
    .set({ assignedToId: assignee.id, assignedToName: assignee.naam })
    .where(eq(whatsappTasks.id, taskId))
    .returning({ id: whatsappTasks.id });
  return rows.length > 0;
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
    case 'reaction': {
      const emoji = msg?.reaction?.emoji;
      return emoji ? `reageerde met ${emoji}` : '[reactie verwijderd]';
    }
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
