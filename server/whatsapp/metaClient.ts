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
