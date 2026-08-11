/**
 * WhatsApp-templates: aanmaken, indienen bij de actieve provider (Meta/
 * 360dialog — zie provider.ts) voor goedkeuring, statussync en verwijderen.
 *
 * Versturen van een goedgekeurd template naar ontvangers loopt bewust NIET
 * via dit bestand: dat hergebruikt de bestaande groepen/bulk-send-flow in
 * server/routes.ts (POST /api/whatsapp/groups/:id/send), zodat er geen
 * tweede opt-in/ontvanger-systeem naast whatsapp_groups hoeft te bestaan.
 *
 * De DB-loze logica (slug, variabelen, validatie, provider-payload) staat in
 * templateLogic.ts en wordt hier alleen doorgegeven — dit bestand voegt de
 * database-laag (CRUD + status-persistentie) en de provider-calls toe.
 *
 * ONTWERPPRINCIPES (zie ook shared/schema.ts bij whatsappTemplates):
 * - status komt UITSLUITEND van de provider (mapProviderStatus) — er is
 *   bewust geen handmatig "goedgekeurd"-vinkje, dat zou een niet-goedgekeurd
 *   template verstuurbaar kunnen maken.
 * - bodyPreview gebruikt leesbare {variabele}-placeholders; de omzetting naar
 *   Meta's {{1}}, {{2}}, ... gebeurt pas bij het indienen (toProviderBodyText),
 *   zodat UI en logs altijd de leesbare vorm tonen.
 * - extractVariables() is de ENIGE bron van waarheid voor variabele-volgorde
 *   (= positionele mapping naar {{n}}) — nergens anders opnieuw afleiden.
 */
import { db } from '../db';
import { whatsappTemplates, type WhatsappTemplate, type InsertWhatsappTemplate } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import * as waProvider from './provider';
import {
  TEMPLATE_CATEGORIES, type TemplateCategory,
  slugify, extractVariables, mapProviderStatus,
  type ValidationError, validateButtonFields, validateBeforeSubmit,
  buildTemplateComponents,
} from './templateLogic';

export {
  TEMPLATE_CATEGORIES, type TemplateCategory,
  slugify, extractVariables, toProviderBodyText, mapProviderStatus,
  type ValidationError, validateButtonFields, validateBeforeSubmit,
  buildTemplateComponents,
} from './templateLogic';

/** Alleen in deze statussen mag een template bewerkt worden (in_review = bij de provider in behandeling, niet aan te passen). */
const EDITABLE_STATUSES = new Set(['concept', 'rejected']);

/** Voegt _2, _3, ... toe totdat de key niet meer botst met een bestaande rij (excludeId = eigen rij bij bewerken). */
export async function uniqueKey(base: string, excludeId?: number): Promise<string> {
  const slug = slugify(base);
  let candidate = slug;
  let n = 2;
  for (;;) {
    const rows = await db.select({ id: whatsappTemplates.id }).from(whatsappTemplates)
      .where(eq(whatsappTemplates.key, candidate)).limit(1);
    const hit = rows[0];
    if (!hit || hit.id === excludeId) return candidate;
    const suffix = `_${n}`;
    candidate = `${slug.slice(0, 60 - suffix.length)}${suffix}`;
    n++;
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function listAllTemplates(): Promise<WhatsappTemplate[]> {
  return db.select().from(whatsappTemplates).orderBy(desc(whatsappTemplates.createdAt));
}

export async function getTemplateByKey(key: string): Promise<WhatsappTemplate | null> {
  const rows = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.key, key)).limit(1);
  return rows[0] ?? null;
}

export interface TemplateInput {
  name: string;
  description?: string | null;
  category: TemplateCategory;
  language?: string;
  bodyPreview: string;
  exampleValues?: Record<string, string>;
  buttonText?: string | null;
  buttonUrl?: string | null;
  buttonDynamic?: boolean;
  buttonExample?: string | null;
}

export async function createTemplate(input: TemplateInput): Promise<WhatsappTemplate> {
  const key = await uniqueKey(input.name);
  const variables = extractVariables(input.bodyPreview);
  const values: InsertWhatsappTemplate = {
    key,
    name: input.name.trim(),
    description: input.description ?? null,
    category: input.category,
    language: input.language || 'nl',
    bodyPreview: input.bodyPreview,
    variables,
    exampleValues: input.exampleValues ?? {},
    buttonText: input.buttonText ?? null,
    buttonUrl: input.buttonUrl ?? null,
    buttonDynamic: !!input.buttonDynamic,
    buttonExample: input.buttonExample ?? null,
    status: 'concept',
  };
  const [row] = await db.insert(whatsappTemplates).values(values).returning();
  return row;
}

export class TemplateEditNotAllowedError extends Error {}

/**
 * Bewerken mag alleen in concept/afgewezen — een template dat bij de provider
 * in behandeling is (in_review) of al goedgekeurd is, moet je als nieuw
 * template opnieuw indienen. Bewerken van een afgewezen template zet de
 * status terug naar concept en wist de afwijzingsreden.
 */
export async function updateTemplate(key: string, input: Partial<TemplateInput>): Promise<WhatsappTemplate> {
  const existing = await getTemplateByKey(key);
  if (!existing) throw new Error(`Template "${key}" niet gevonden`);
  if (!EDITABLE_STATUSES.has(existing.status)) {
    throw new TemplateEditNotAllowedError(
      `Template "${key}" heeft status "${existing.status}" en kan niet meer bewerkt worden — maak een nieuw template aan`,
    );
  }

  const bodyPreview = input.bodyPreview ?? existing.bodyPreview;
  const variables = extractVariables(bodyPreview);
  const wasRejected = existing.status === 'rejected';

  const [row] = await db.update(whatsappTemplates).set({
    name: input.name?.trim() ?? existing.name,
    description: input.description !== undefined ? input.description : existing.description,
    category: input.category ?? existing.category,
    language: input.language ?? existing.language,
    bodyPreview,
    variables,
    exampleValues: input.exampleValues ?? existing.exampleValues,
    buttonText: input.buttonText !== undefined ? input.buttonText : existing.buttonText,
    buttonUrl: input.buttonUrl !== undefined ? input.buttonUrl : existing.buttonUrl,
    buttonDynamic: input.buttonDynamic !== undefined ? input.buttonDynamic : existing.buttonDynamic,
    buttonExample: input.buttonExample !== undefined ? input.buttonExample : existing.buttonExample,
    status: wasRejected ? 'concept' : existing.status,
    metaStatusReason: wasRejected ? null : existing.metaStatusReason,
    updatedAt: new Date(),
  }).where(eq(whatsappTemplates.key, key)).returning();
  return row;
}

export interface DeleteResult {
  ok: boolean;
  providerError?: string;
}

/**
 * Verwijderen mag nooit voor 'approved' (dan moet je 'm eerst bij de provider
 * laten uitfaseren via de UI). Als het ooit is ingediend (submittedAt gezet),
 * wordt 'm ook bij de provider verwijderd om de naam vrij te maken — lukt die
 * call niet, dan blijft de lokale rij toch verwijderd (provider-fout wordt
 * teruggegeven zodat de UI het kan tonen, maar blokkeert niet).
 */
export async function deleteTemplate(key: string): Promise<DeleteResult> {
  const existing = await getTemplateByKey(key);
  if (!existing) throw new Error(`Template "${key}" niet gevonden`);
  if (existing.status === 'approved') {
    throw new Error('Een goedgekeurd template kan niet verwijderd worden');
  }

  let providerError: string | undefined;
  if (existing.submittedAt) {
    const res = await waProvider.deleteTemplate(existing.key);
    if (!res.ok) providerError = res.errorMessage || 'Onbekende providerfout';
  }

  await db.delete(whatsappTemplates).where(eq(whatsappTemplates.key, key));
  return { ok: true, providerError };
}

// ─── Indienen bij de provider ────────────────────────────────────────────────

export interface SubmitResult {
  ok: boolean;
  template?: WhatsappTemplate;
  errors?: ValidationError[];
  providerError?: string;
}

/** Dient het template in voor goedkeuring. Zet bij succes direct de door de provider teruggegeven status + submittedAt. */
export async function submitTemplateToProvider(key: string): Promise<SubmitResult> {
  const existing = await getTemplateByKey(key);
  if (!existing) throw new Error(`Template "${key}" niet gevonden`);
  if (!EDITABLE_STATUSES.has(existing.status)) {
    return { ok: false, providerError: `Template heeft al status "${existing.status}" en kan niet opnieuw ingediend worden` };
  }

  const errors = validateBeforeSubmit(existing);
  if (errors.length > 0) return { ok: false, errors };

  const components = buildTemplateComponents(existing);
  const res = await waProvider.submitTemplate({
    name: existing.key,
    language: existing.language,
    category: existing.category as TemplateCategory,
    components,
  });
  if (!res.ok) return { ok: false, providerError: res.errorMessage || 'Onbekende providerfout' };

  const status = mapProviderStatus(res.status);
  const [row] = await db.update(whatsappTemplates).set({
    status,
    metaStatusRaw: res.status ?? null,
    submittedAt: new Date(),
    statusSyncedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(whatsappTemplates.key, key)).returning();

  return { ok: true, template: row };
}

// ─── Statussync ──────────────────────────────────────────────────────────────

export interface SyncResult {
  ok: boolean;
  template?: WhatsappTemplate;
  error?: string;
}

/**
 * Handmatige "Status verversen" — geen polling/webhook voor templatestatus.
 * Haalt de volledige templatelijst bij de provider op en matcht op naam +
 * taal (lowercased). Niet gevonden → duidelijke fout, bestaande status blijft
 * ongewijzigd (status wordt nooit verzonnen).
 */
export async function syncTemplateStatus(key: string): Promise<SyncResult> {
  const existing = await getTemplateByKey(key);
  if (!existing) throw new Error(`Template "${key}" niet gevonden`);
  if (existing.status === 'concept') {
    return { ok: false, error: 'Template is nog niet ingediend — er is nog geen status om te verversen' };
  }

  const res = await waProvider.listTemplates();
  if (!res.ok) return { ok: false, error: res.errorMessage || 'Onbekende providerfout' };

  const match = (res.templates || []).find(
    t => t.name.toLowerCase() === existing.key.toLowerCase() && t.language.toLowerCase() === existing.language.toLowerCase(),
  );
  if (!match) {
    return { ok: false, error: 'Template nog niet gevonden bij de provider — probeer het later opnieuw' };
  }

  const status = mapProviderStatus(match.status);
  const [row] = await db.update(whatsappTemplates).set({
    status,
    metaStatusRaw: match.status,
    metaStatusReason: match.rejectedReason ?? null,
    statusSyncedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(whatsappTemplates.key, key)).returning();

  return { ok: true, template: row };
}
