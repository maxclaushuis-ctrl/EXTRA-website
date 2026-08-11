/**
 * Directe Meta WhatsApp Cloud API-client (Graph API) — Fase 1 van de migratie
 * weg van 360dialog. Wordt alleen actief gebruikt als WHATSAPP_PROVIDER=meta
 * (zie provider.ts); tot de cutover blijft 360dialog het transport.
 *
 * Env-variabelen:
 *   META_WA_BOT_ACCESS_TOKEN     — System-user token met whatsapp_business_messaging
 *   META_WA_BOT_PHONE_NUMBER_ID  — Phone Number ID uit Meta Business Manager
 *   META_WA_BOT_WABA_ID          — WhatsApp Business Account ID (voor templates/beheer)
 *   META_WA_BOT_APP_SECRET       — App secret (webhook signature-verificatie)
 *   META_WA_BOT_VERIFY_TOKEN     — Zelfgekozen verify-token voor de GET-handshake
 *
 * Alle send-functies geven een uniform resultaat terug:
 *   { ok: true, waMessageId }  of  { ok: false, error: { code, title, message, details, httpStatus } }
 */

export const META_GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0';
const REQUEST_TIMEOUT_MS = 15_000;

// Env wordt per call gelezen (niet op module-niveau gecached) zodat tests en
// runtime-configuratie zonder herstart/re-import werken.
function accessToken(): string {
  return process.env.META_WA_BOT_ACCESS_TOKEN || '';
}
function phoneNumberId(): string {
  return process.env.META_WA_BOT_PHONE_NUMBER_ID || '';
}
export function wabaId(): string {
  return process.env.META_WA_BOT_WABA_ID || '';
}

/** True als de minimale config voor versturen aanwezig is. */
export function isMetaConfigured(): boolean {
  return !!(accessToken() && phoneNumberId());
}

export interface MetaError {
  /** Meta-errorcode (bv. 131047) of 'network_error' / 'timeout' / HTTP-status. */
  code: string;
  title?: string;
  message: string;
  /** error_data.details uit het Meta error-object. */
  details?: string;
  httpStatus?: number;
}

export interface MetaSendResult {
  ok: boolean;
  waMessageId?: string | null;
  error?: MetaError;
}

export interface MetaMediaSpec {
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  /** Publieke URL van de media (óf `id`, niet beide nodig). */
  link?: string;
  /** Eerder geüpload media-id (óf `link`). */
  id?: string;
  caption?: string;
  /** Alleen voor documents. */
  filename?: string;
}

/** Vertaal een Meta Graph error-respons naar ons uniforme MetaError-object. */
function parseMetaError(data: any, httpStatus: number, rawText: string): MetaError {
  const e = data?.error;
  if (e && typeof e === 'object') {
    return {
      code: e.code != null ? String(e.code) : String(httpStatus),
      title: e.title || e.type || undefined,
      message: e.message || `HTTP ${httpStatus}`,
      details: e.error_data?.details || undefined,
      httpStatus,
    };
  }
  return {
    code: String(httpStatus),
    message: (rawText || `HTTP ${httpStatus}`).slice(0, 500),
    httpStatus,
  };
}

/** Interne helper: POST naar /{PHONE_NUMBER_ID}/messages met timeout + nette fouten. */
async function postMessages(payload: Record<string, any>): Promise<MetaSendResult> {
  if (!isMetaConfigured()) {
    return {
      ok: false,
      error: { code: 'not_configured', message: 'META_WA_BOT_ACCESS_TOKEN of META_WA_BOT_PHONE_NUMBER_ID niet ingesteld' },
    };
  }

  const url = `${META_GRAPH_BASE_URL}/${phoneNumberId()}/messages`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken()}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON respons */ }

    if (!r.ok || data?.error) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }

    return { ok: true, waMessageId: data?.messages?.[0]?.id ?? null };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Stuur een tekstbericht naar een groep (i.p.v. een los contact) — zie groups-sectie onderin dit bestand. */
export async function sendGroupTextMessage(groupId: string, body: string): Promise<MetaSendResult> {
  return postMessages({
    messaging_product: 'whatsapp',
    recipient_type: 'group',
    to: groupId,
    type: 'text',
    text: { body },
  });
}

/** Stuur een gewoon tekstbericht (binnen het 24-uurs customer-care window). */
export async function sendTextMessage(to: string, body: string): Promise<MetaSendResult> {
  return postMessages({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body },
  });
}

/** Stuur een (approved) template-bericht — verplicht buiten het 24-uurs window. */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  components?: any[],
): Promise<MetaSendResult> {
  const template: Record<string, any> = {
    name: templateName,
    language: { code: languageCode },
  };
  if (components && components.length > 0) template.components = components;
  return postMessages({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template,
  });
}

/** Stuur media (per link of eerder geüpload media-id). */
export async function sendMediaMessage(to: string, media: MetaMediaSpec): Promise<MetaSendResult> {
  const mediaObject: Record<string, any> = {};
  if (media.id) mediaObject.id = media.id;
  else if (media.link) mediaObject.link = media.link;
  else return { ok: false, error: { code: 'invalid_media', message: 'media.link of media.id is verplicht' } };

  if (media.caption && (media.type === 'image' || media.type === 'video' || media.type === 'document')) {
    mediaObject.caption = media.caption;
  }
  if (media.type === 'document' && media.filename) mediaObject.filename = media.filename;

  return postMessages({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: media.type,
    [media.type]: mediaObject,
  });
}

/**
 * Plaats (of verwijder, bij emoji='') onze eigen reactie-emoji op een eerder
 * bericht — hetzelfde gebaar als lang-indrukken in de WhatsApp-app zelf.
 * Net als sendTextMessage alleen mogelijk binnen het 24-uurs service-window.
 */
export async function sendReactionMessage(to: string, waMessageId: string, emoji: string): Promise<MetaSendResult> {
  return postMessages({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'reaction',
    reaction: { message_id: waMessageId, emoji },
  });
}

/** Markeer een inkomend bericht als gelezen (blauwe vinkjes bij de afzender). */
export async function markAsRead(waMessageId: string): Promise<MetaSendResult> {
  return postMessages({
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: waMessageId,
  });
}

export interface MetaUploadResult {
  ok: boolean;
  mediaId?: string;
  error?: MetaError;
}

/**
 * Upload een bestand naar Meta media-storage; geeft een media-id terug dat je
 * daarna met sendMediaMessage({ id }) kunt versturen.
 */
export async function uploadMedia(args: {
  buffer: Buffer | Uint8Array;
  mimeType: string;
  filename?: string;
}): Promise<MetaUploadResult> {
  if (!isMetaConfigured()) {
    return {
      ok: false,
      error: { code: 'not_configured', message: 'META_WA_BOT_ACCESS_TOKEN of META_WA_BOT_PHONE_NUMBER_ID niet ingesteld' },
    };
  }

  const url = `${META_GRAPH_BASE_URL}/${phoneNumberId()}/media`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const fd = new FormData();
    fd.append('messaging_product', 'whatsapp');
    fd.append('type', args.mimeType);
    fd.append('file', new Blob([args.buffer], { type: args.mimeType }), args.filename || 'upload');

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken()}` }, // geen Content-Type — fetch zet multipart-boundary zelf
      body: fd,
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error || !data?.id) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }
    return { ok: true, mediaId: String(data.id) };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Media downloaden ────────────────────────────────────────────────────────

/** Maximale bestandsgrootte die we binnenhalen. Gelijk aan het documentplafond
 *  van WhatsApp zelf; groter kan de Cloud API niet eens afleveren. */
export const MEDIA_MAX_BYTES = 25 * 1024 * 1024;

export interface MetaMediaDownload {
  ok: boolean;
  buffer?: Buffer;
  mimeType?: string;
  /** Bestandsnaam zoals Meta hem kent; vaak alleen aanwezig bij documenten. */
  filename?: string;
  fileSize?: number;
  error?: MetaError;
}

/**
 * Haal de bytes achter een media-ID op.
 *
 * Meta levert in de webhook alleen een ID. Daar zijn twee stappen voor nodig:
 *
 *   1. GET /{media-id}  → JSON met een tijdelijke CDN-url (lookaside.fbsbx.com),
 *      het mime_type en de bestandsgrootte. Die url leeft maar een paar minuten.
 *   2. GET <die url>    → de bytes zelf. LET OP: ook deze tweede call heeft het
 *      Bearer-token nodig. Zonder Authorization-header antwoordt de CDN met 401,
 *      wat de klassieke valkuil is bij deze API.
 *
 * Daarom moet dit direct bij binnenkomst gebeuren en niet pas wanneer iemand
 * het gesprek opent — dan is de url allang verlopen.
 */
export async function downloadMedia(mediaId: string): Promise<MetaMediaDownload> {
  if (!isMetaConfigured()) {
    return {
      ok: false,
      error: { code: 'not_configured', message: 'META_WA_BOT_ACCESS_TOKEN of META_WA_BOT_PHONE_NUMBER_ID niet ingesteld' },
    };
  }
  if (!mediaId) {
    return { ok: false, error: { code: 'invalid_media', message: 'media-id ontbreekt' } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Stap 1: ID → tijdelijke CDN-url.
    const metaResp = await fetch(`${META_GRAPH_BASE_URL}/${encodeURIComponent(mediaId)}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken()}` },
      signal: controller.signal,
    });
    const metaText = await metaResp.text();
    let metaData: any = {};
    try { metaData = JSON.parse(metaText); } catch { /* niet-JSON respons */ }

    if (!metaResp.ok || metaData?.error || !metaData?.url) {
      return { ok: false, error: parseMetaError(metaData, metaResp.status, metaText) };
    }

    const mimeType: string = metaData.mime_type || 'application/octet-stream';
    const gemeld = Number(metaData.file_size || 0);
    if (gemeld > MEDIA_MAX_BYTES) {
      return {
        ok: false,
        error: {
          code: 'media_too_large',
          message: `Bestand is ${Math.round(gemeld / 1024 / 1024)} MB en daarmee groter dan de limiet van ${MEDIA_MAX_BYTES / 1024 / 1024} MB`,
        },
      };
    }

    // Stap 2: de bytes zelf — mét hetzelfde token.
    const binResp = await fetch(String(metaData.url), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken()}` },
      signal: controller.signal,
    });
    if (!binResp.ok) {
      const tekst = await binResp.text().catch(() => '');
      return { ok: false, error: parseMetaError(null, binResp.status, tekst) };
    }

    const arrayBuffer = await binResp.arrayBuffer();
    if (arrayBuffer.byteLength > MEDIA_MAX_BYTES) {
      // Meta's file_size kan ontbreken of afwijken; hier weten we het zeker.
      return {
        ok: false,
        error: {
          code: 'media_too_large',
          message: `Bestand is ${Math.round(arrayBuffer.byteLength / 1024 / 1024)} MB en daarmee groter dan de limiet van ${MEDIA_MAX_BYTES / 1024 / 1024} MB`,
        },
      };
    }

    return {
      ok: true,
      buffer: Buffer.from(arrayBuffer),
      mimeType,
      filename: metaData.filename || undefined,
      fileSize: arrayBuffer.byteLength,
    };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Template-beheer (aanmaken/indienen, opvragen, verwijderen) ────────────
// Deze drie calls gaan naar de WABA (/{WABA_ID}/message_templates), NIET naar
// de phone-number-id-scoped /messages-endpoint hierboven — vandaar wabaId()
// i.p.v. phoneNumberId() en een aparte configuratiecheck.

function templatesConfigured(): boolean {
  return !!(accessToken() && wabaId());
}

function templatesNotConfiguredError(): MetaError {
  return { code: 'not_configured', message: 'META_WA_BOT_ACCESS_TOKEN of META_WA_BOT_WABA_ID niet ingesteld' };
}

export interface MetaTemplateResult {
  ok: boolean;
  id?: string;
  status?: string;
  category?: string;
  error?: MetaError;
}

/**
 * Dien een nieuw template in voor goedkeuring bij Meta. `components` volgt
 * exact de Graph API-vorm: [{ type:'BODY', text, example:{body_text:[[...]]} },
 * optioneel { type:'BUTTONS', buttons:[{type:'URL',text,url,example?:[...]}] }].
 * Geeft het door Meta toegekende `status` terug (meestal 'PENDING' direct na
 * indienen) — zie mapProviderStatus() in templates.ts voor de vertaling.
 */
export async function submitTemplate(args: {
  name: string;
  language: string;
  category: 'UTILITY' | 'MARKETING';
  components: any[];
}): Promise<MetaTemplateResult> {
  if (!templatesConfigured()) return { ok: false, error: templatesNotConfiguredError() };

  const url = `${META_GRAPH_BASE_URL}/${wabaId()}/message_templates`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken()}` },
      body: JSON.stringify({
        name: args.name,
        language: args.language,
        category: args.category,
        components: args.components,
      }),
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }
    return { ok: true, id: data?.id ? String(data.id) : undefined, status: data?.status, category: data?.category };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface MetaTemplateListItem {
  name: string;
  language: string;
  status: string;
  category?: string;
  id?: string;
  rejectedReason?: string;
}

export interface MetaTemplateListResult {
  ok: boolean;
  templates?: MetaTemplateListItem[];
  error?: MetaError;
}

/** Haal alle templates op die bij deze WABA geregistreerd staan (voor statussync). */
export async function listTemplates(): Promise<MetaTemplateListResult> {
  if (!templatesConfigured()) return { ok: false, error: templatesNotConfiguredError() };

  const url = `${META_GRAPH_BASE_URL}/${wabaId()}/message_templates?fields=name,language,status,category,id,rejected_reason&limit=200`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken()}` },
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }
    const templates: MetaTemplateListItem[] = Array.isArray(data?.data)
      ? data.data.map((t: any) => ({
          name: String(t?.name ?? ''),
          language: String(t?.language ?? ''),
          status: String(t?.status ?? ''),
          category: t?.category ?? undefined,
          id: t?.id != null ? String(t.id) : undefined,
          rejectedReason: t?.rejected_reason ?? undefined,
        }))
      : [];
    return { ok: true, templates };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Verwijder een template bij Meta (op naam — geldt voor alle taalvarianten van die naam). */
export async function deleteTemplate(name: string): Promise<MetaTemplateResult> {
  if (!templatesConfigured()) return { ok: false, error: templatesNotConfiguredError() };

  const url = `${META_GRAPH_BASE_URL}/${wabaId()}/message_templates?name=${encodeURIComponent(name)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken()}` },
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }
    return { ok: true };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Groepsbeheer (WhatsApp Groups API, max 8 deelnemers) ──────────────────
// Aanmaken/lijst gaan via /{PHONE_NUMBER_ID}/groups (net als /messages
// hierboven); invite-link/info/deelnemers zijn group-id-scoped
// (/{GROUP_ID}/...). Vereist een Official Business Account (OBA) bij Meta —
// dat kan ik niet zelf verifiëren, dus een ontbrekende OBA-status komt
// gewoon als een gewone MetaError terug (meestal een permission-fout), niet
// als een aparte "not eligible"-tak.

export interface MetaGroupCreateResult {
  ok: boolean;
  groupId?: string;
  inviteLink?: string;
  error?: MetaError;
}

export async function createGroup(args: {
  subject: string;
  description?: string;
  joinApprovalMode?: 'auto_approve' | 'approval_required';
}): Promise<MetaGroupCreateResult> {
  if (!isMetaConfigured()) {
    return { ok: false, error: { code: 'not_configured', message: 'META_WA_BOT_ACCESS_TOKEN of META_WA_BOT_PHONE_NUMBER_ID niet ingesteld' } };
  }

  const url = `${META_GRAPH_BASE_URL}/${phoneNumberId()}/groups`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken()}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        subject: args.subject,
        ...(args.description ? { description: args.description } : {}),
        ...(args.joinApprovalMode ? { join_approval_mode: args.joinApprovalMode } : {}),
      }),
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }
    // Meta's documentatie is niet consistent over of group-id en invite_link
    // meteen in de create-respons zitten of pas via aparte calls opgehaald
    // moeten worden — dus beide vormen tolereren en, bij ontbrekende
    // invite_link, de aanroepende laag (groupChats.ts) die apart laten ophalen.
    const groupId = data?.id ?? data?.group_id ?? undefined;
    return {
      ok: true,
      groupId: groupId != null ? String(groupId) : undefined,
      inviteLink: data?.invite_link ?? undefined,
    };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface MetaGroupInviteLinkResult {
  ok: boolean;
  inviteLink?: string;
  error?: MetaError;
}

/** Haal de (bestaande) uitnodigingslink van een groep op. */
export async function getGroupInviteLink(groupId: string): Promise<MetaGroupInviteLinkResult> {
  if (!isMetaConfigured()) {
    return { ok: false, error: { code: 'not_configured', message: 'META_WA_BOT_ACCESS_TOKEN niet ingesteld' } };
  }

  const url = `${META_GRAPH_BASE_URL}/${encodeURIComponent(groupId)}/invite_link`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken()}` },
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }
    return { ok: true, inviteLink: data?.invite_link ?? undefined };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface MetaGroupParticipant {
  phone: string;
  name?: string;
}

export interface MetaGroupInfoResult {
  ok: boolean;
  subject?: string;
  description?: string;
  participants?: MetaGroupParticipant[];
  participantCount?: number;
  suspended?: boolean;
  error?: MetaError;
}

/** Actuele groepsinfo + deelnemerslijst — gebruikt door de "ververs deelnemers"-actie. */
export async function getGroupInfo(groupId: string): Promise<MetaGroupInfoResult> {
  if (!isMetaConfigured()) {
    return { ok: false, error: { code: 'not_configured', message: 'META_WA_BOT_ACCESS_TOKEN niet ingesteld' } };
  }

  const fields = 'subject,description,participants,join_approval_mode,suspended,total_participant_count';
  const url = `${META_GRAPH_BASE_URL}/${encodeURIComponent(groupId)}?fields=${fields}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken()}` },
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }
    const participants: MetaGroupParticipant[] = Array.isArray(data?.participants)
      ? data.participants.map((p: any) => ({
          phone: String(p?.user ?? p?.wa_id ?? p?.phone ?? ''),
          name: p?.name ?? undefined,
        })).filter((p: MetaGroupParticipant) => !!p.phone)
      : [];
    return {
      ok: true,
      subject: data?.subject ?? undefined,
      description: data?.description ?? undefined,
      participants,
      participantCount: typeof data?.total_participant_count === 'number' ? data.total_participant_count : participants.length,
      suspended: !!data?.suspended,
    };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface MetaGroupActionResult {
  ok: boolean;
  error?: MetaError;
}

/** Verwijder één of meer deelnemers uit een groep. */
export async function removeGroupParticipants(groupId: string, phones: string[]): Promise<MetaGroupActionResult> {
  if (!isMetaConfigured()) {
    return { ok: false, error: { code: 'not_configured', message: 'META_WA_BOT_ACCESS_TOKEN niet ingesteld' } };
  }
  if (phones.length === 0) return { ok: true };

  const url = `${META_GRAPH_BASE_URL}/${encodeURIComponent(groupId)}/participants`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken()}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        participants: phones.map(user => ({ user })),
      }),
      signal: controller.signal,
    });
    const rawText = await r.text();
    let data: any = {};
    try { data = JSON.parse(rawText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error) {
      return { ok: false, error: parseMetaError(data, r.status, rawText) };
    }
    return { ok: true };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'timeout' : 'network_error',
        message: isAbort ? `Meta API timeout na ${REQUEST_TIMEOUT_MS / 1000}s` : (err?.message || String(err)),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
