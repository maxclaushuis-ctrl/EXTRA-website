/**
 * Provider-switch voor uitgaand WhatsApp-verkeer — Fase 1 van de migratie
 * 360dialog → directe Meta Cloud API (coexistence).
 *
 * Env: WHATSAPP_PROVIDER = '360dialog' (default) | 'meta'
 *
 * Alle verzend-paden (stuur, stuur-media, bulk-send, auto-reply, templates)
 * lopen via deze module. Bij '360dialog' is het transport byte-voor-byte
 * identiek aan de oude inline fetch-logica (zelfde URL, headers en payloads);
 * bij 'meta' wordt gerouteerd naar metaClient.ts.
 *
 * Uniform resultaat: { ok, waMessageId?, errorCode?, errorMessage?, httpStatus?, provider }
 *   - errorMessage is de "kale" fout (voor de DB, zonder provider-prefix);
 *     routes zetten er zelf `${provider}: ` voor in HTTP-responses,
 *     precies zoals de oude code deed.
 *   - errorCode 'network_error' / 'timeout' → geen httpStatus (transportfout).
 */
import * as metaClient from './metaClient';

export type WhatsAppProviderName = '360dialog' | 'meta';

export interface ProviderSendResult {
  ok: boolean;
  waMessageId?: string | null;
  /** Meta/360dialog-errorcode of HTTP-status als string, of 'network_error'/'timeout'. */
  errorCode?: string;
  /** Kale foutmelding (voor DB en logging). */
  errorMessage?: string;
  /** HTTP-status van de API-call (afwezig bij netwerkfout/timeout). */
  httpStatus?: number;
  provider: WhatsAppProviderName;
}

export interface ProviderUploadResult {
  ok: boolean;
  mediaId?: string;
  errorCode?: string;
  errorMessage?: string;
  httpStatus?: number;
  provider: WhatsAppProviderName;
}

export interface ProviderMediaSpec {
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  id?: string;
  link?: string;
  caption?: string;
  filename?: string;
}

/** Actieve provider volgens env. Onbekende waardes vallen terug op 360dialog. */
export function activeProvider(): WhatsAppProviderName {
  return (process.env.WHATSAPP_PROVIDER || '').trim().toLowerCase() === 'meta' ? 'meta' : '360dialog';
}

// ─── 360dialog transport (ongewijzigd verplaatst uit routes.ts/sendTemplate.ts) ──

function d360BaseUrl(): string {
  return process.env.WHATSAPP_360_BASE_URL || 'https://waba-v2.360dialog.io';
}
function d360Key(): string {
  return process.env.WHATSAPP_360_API_KEY || '';
}
function d360Headers(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'D360-API-KEY': d360Key() };
}

async function d360PostMessages(payload: Record<string, any>): Promise<ProviderSendResult> {
  try {
    const r = await fetch(`${d360BaseUrl()}/messages`, {
      method: 'POST',
      headers: d360Headers(),
      body: JSON.stringify(payload),
    });
    const responseText = await r.text();
    let data: any = {};
    try { data = JSON.parse(responseText); } catch { /* niet-JSON respons */ }

    if (!r.ok || data?.error || data?.meta?.success === false) {
      const errorMsg = data?.meta?.developer_message || data?.error?.message || data?.error || data?.message || responseText.slice(0, 500);
      const errorCode = data?.error?.code ? String(data.error.code) : String(r.status);
      return {
        ok: false,
        provider: '360dialog',
        errorCode,
        errorMessage: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        httpStatus: r.status,
      };
    }

    return { ok: true, provider: '360dialog', waMessageId: data?.messages?.[0]?.id ?? null, httpStatus: r.status };
  } catch (err: any) {
    return { ok: false, provider: '360dialog', errorCode: 'network_error', errorMessage: err?.message || String(err) };
  }
}

async function d360UploadMedia(args: { buffer: Buffer | Uint8Array; mimeType: string; filename?: string }): Promise<ProviderUploadResult> {
  try {
    const fd = new FormData();
    fd.append('messaging_product', 'whatsapp');
    fd.append('type', args.mimeType);
    fd.append('file', new Blob([args.buffer], { type: args.mimeType }), args.filename || 'upload');

    const uploadResp = await fetch(`${d360BaseUrl()}/media`, {
      method: 'POST',
      headers: { 'D360-API-KEY': d360Key() }, // geen Content-Type — fetch zet multipart-boundary zelf
      body: fd,
    });
    const uploadText = await uploadResp.text();
    let uploadData: any = {};
    try { uploadData = JSON.parse(uploadText); } catch { /* niet-JSON */ }

    if (!uploadResp.ok || !uploadData?.id) {
      const errMsg = uploadData?.error?.message || uploadData?.message || uploadText.slice(0, 500);
      return {
        ok: false,
        provider: '360dialog',
        errorCode: String(uploadResp.status),
        errorMessage: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
        httpStatus: uploadResp.status,
      };
    }
    return { ok: true, provider: '360dialog', mediaId: String(uploadData.id), httpStatus: uploadResp.status };
  } catch (err: any) {
    return { ok: false, provider: '360dialog', errorCode: 'network_error', errorMessage: err?.message || String(err) };
  }
}

// ─── Meta-resultaat → uniform resultaat ─────────────────────────────────────

function fromMetaResult(res: metaClient.MetaSendResult): ProviderSendResult {
  if (res.ok) return { ok: true, provider: 'meta', waMessageId: res.waMessageId ?? null };
  const e = res.error!;
  const errorMessage = e.details ? `${e.message} — ${e.details}` : e.message;
  return { ok: false, provider: 'meta', errorCode: e.code, errorMessage, httpStatus: e.httpStatus };
}

// ─── Publieke API ───────────────────────────────────────────────────────────

/** Is de actieve provider voldoende geconfigureerd om te kunnen versturen? */
export function isSendConfigured(): boolean {
  return activeProvider() === 'meta' ? metaClient.isMetaConfigured() : !!d360Key();
}

/**
 * Config-foutmelding voor de actieve provider, of null als alles is ingesteld.
 * Voor 360dialog identiek aan de oude melding ('WHATSAPP_360_API_KEY niet ingesteld').
 */
export function configErrorMessage(): string | null {
  if (isSendConfigured()) return null;
  return activeProvider() === 'meta'
    ? 'META_WA_BOT_ACCESS_TOKEN of META_WA_BOT_PHONE_NUMBER_ID niet ingesteld'
    : 'WHATSAPP_360_API_KEY niet ingesteld';
}

/** Stuur een tekstbericht via de actieve provider. */
export async function sendText(to: string, body: string): Promise<ProviderSendResult> {
  if (activeProvider() === 'meta') {
    return fromMetaResult(await metaClient.sendTextMessage(to, body));
  }
  return d360PostMessages({ messaging_product: 'whatsapp', to, type: 'text', text: { body } });
}

/** Stuur een template-bericht via de actieve provider. */
export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components?: any[],
): Promise<ProviderSendResult> {
  if (activeProvider() === 'meta') {
    return fromMetaResult(await metaClient.sendTemplateMessage(to, templateName, languageCode, components));
  }
  const template: Record<string, any> = { name: templateName, language: { code: languageCode } };
  if (components && components.length > 0) template.components = components;
  return d360PostMessages({ messaging_product: 'whatsapp', to, type: 'template', template });
}

/**
 * Plaats (of verwijder, bij emoji='') onze eigen reactie-emoji op een eerder
 * bericht via de actieve provider — zelfde `type: 'reaction'`-berichtvorm bij
 * beide providers, alleen het transport verschilt (net als sendText/sendMedia).
 */
export async function sendReaction(to: string, waMessageId: string, emoji: string): Promise<ProviderSendResult> {
  if (activeProvider() === 'meta') {
    return fromMetaResult(await metaClient.sendReactionMessage(to, waMessageId, emoji));
  }
  return d360PostMessages({
    messaging_product: 'whatsapp',
    to,
    type: 'reaction',
    reaction: { message_id: waMessageId, emoji },
  });
}

/** Stuur media (per media-id of link) via de actieve provider. */
export async function sendMedia(to: string, media: ProviderMediaSpec): Promise<ProviderSendResult> {
  if (activeProvider() === 'meta') {
    return fromMetaResult(await metaClient.sendMediaMessage(to, media));
  }
  const mediaPayload: Record<string, any> = {};
  if (media.id) mediaPayload.id = media.id;
  else if (media.link) mediaPayload.link = media.link;
  if (media.caption && (media.type === 'image' || media.type === 'video' || media.type === 'document')) {
    mediaPayload.caption = media.caption;
  }
  if (media.type === 'document' && media.filename) mediaPayload.filename = media.filename;
  return d360PostMessages({ messaging_product: 'whatsapp', to, type: media.type, [media.type]: mediaPayload });
}

/** Upload een bestand naar de media-storage van de actieve provider. */
export async function uploadMedia(args: { buffer: Buffer | Uint8Array; mimeType: string; filename?: string }): Promise<ProviderUploadResult> {
  if (activeProvider() === 'meta') {
    const res = await metaClient.uploadMedia(args);
    if (res.ok) return { ok: true, provider: 'meta', mediaId: res.mediaId };
    const e = res.error!;
    return {
      ok: false,
      provider: 'meta',
      errorCode: e.code,
      errorMessage: e.details ? `${e.message} — ${e.details}` : e.message,
      httpStatus: e.httpStatus,
    };
  }
  return d360UploadMedia(args);
}

/**
 * HTTP-statuscode voor een mislukte send/upload, met exact dezelfde mapping als
 * de oude inline code: API-fout → r.ok ? 400 : r.status; netwerkfout → 500.
 */
export function httpStatusForFailure(result: { httpStatus?: number }): number {
  if (result.httpStatus == null) return 500; // netwerkfout / timeout
  return result.httpStatus >= 400 ? result.httpStatus : 400;
}

export interface ProviderMediaDownload {
  ok: boolean;
  buffer?: Buffer;
  mimeType?: string;
  filename?: string;
  errorCode?: string;
  errorMessage?: string;
  provider: WhatsAppProviderName;
}

/** Zelfde praktische limiet als bij Meta (metaClient.MEDIA_MAX_BYTES). */
const D360_MEDIA_MAX_BYTES = 25 * 1024 * 1024;

/**
 * 360dialog-media ophalen — twee stappen, zie
 * docs.360dialog.com/docs/messaging/media/upload-retrieve-or-delete-media:
 *   1. GET /{media-id} met D360-API-KEY → JSON met url/mime_type/file_size.
 *      De `url` wijst naar Meta's eigen CDN (lookaside.fbsbx.com).
 *   2. Die host vervangen door het 360dialog-endpoint en met dezelfde
 *      D360-API-KEY ophalen — de link is daarna maar 5 minuten geldig, dus
 *      dit moet direct bij binnenkomst gebeuren (zie bewaarMedia() in
 *      inboundProcessor.ts).
 */
async function d360DownloadMedia(mediaId: string): Promise<ProviderMediaDownload> {
  if (!d360Key()) {
    return { ok: false, provider: '360dialog', errorCode: 'not_configured', errorMessage: 'WHATSAPP_360_API_KEY niet ingesteld' };
  }
  if (!mediaId) {
    return { ok: false, provider: '360dialog', errorCode: 'invalid_media', errorMessage: 'media-id ontbreekt' };
  }

  try {
    const metaResp = await fetch(`${d360BaseUrl()}/${encodeURIComponent(mediaId)}`, {
      method: 'GET',
      headers: { 'D360-API-KEY': d360Key() },
    });
    const metaText = await metaResp.text();
    let metaData: any = {};
    try { metaData = JSON.parse(metaText); } catch { /* niet-JSON respons */ }

    if (!metaResp.ok || !metaData?.url) {
      const errMsg = metaData?.error?.message || metaData?.message || metaText.slice(0, 500);
      return {
        ok: false,
        provider: '360dialog',
        errorCode: String(metaResp.status),
        errorMessage: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
      };
    }

    const mimeType: string = metaData.mime_type || 'application/octet-stream';
    const gemeld = Number(metaData.file_size || 0);
    if (gemeld > D360_MEDIA_MAX_BYTES) {
      return {
        ok: false,
        provider: '360dialog',
        errorCode: 'media_too_large',
        errorMessage: `Bestand is ${Math.round(gemeld / 1024 / 1024)} MB en daarmee groter dan de limiet van ${D360_MEDIA_MAX_BYTES / 1024 / 1024} MB`,
      };
    }

    let downloadUrl: string;
    try {
      const parsed = new URL(String(metaData.url));
      downloadUrl = `${d360BaseUrl()}${parsed.pathname}${parsed.search}`;
    } catch {
      downloadUrl = String(metaData.url);
    }

    const binResp = await fetch(downloadUrl, {
      method: 'GET',
      headers: { 'D360-API-KEY': d360Key() },
    });
    if (!binResp.ok) {
      const tekst = await binResp.text().catch(() => '');
      return {
        ok: false,
        provider: '360dialog',
        errorCode: String(binResp.status),
        errorMessage: tekst.slice(0, 500) || `HTTP ${binResp.status}`,
      };
    }

    const arrayBuffer = await binResp.arrayBuffer();
    if (arrayBuffer.byteLength > D360_MEDIA_MAX_BYTES) {
      return {
        ok: false,
        provider: '360dialog',
        errorCode: 'media_too_large',
        errorMessage: `Bestand is ${Math.round(arrayBuffer.byteLength / 1024 / 1024)} MB en daarmee groter dan de limiet van ${D360_MEDIA_MAX_BYTES / 1024 / 1024} MB`,
      };
    }

    return {
      ok: true,
      provider: '360dialog',
      buffer: Buffer.from(arrayBuffer),
      mimeType,
      filename: metaData.filename || undefined,
    };
  } catch (err: any) {
    return { ok: false, provider: '360dialog', errorCode: 'network_error', errorMessage: err?.message || String(err) };
  }
}

/** Haal de bytes achter een media-id op bij de actieve provider. */
export async function downloadMedia(mediaId: string): Promise<ProviderMediaDownload> {
  if (activeProvider() !== 'meta') {
    return d360DownloadMedia(mediaId);
  }
  const res = await metaClient.downloadMedia(mediaId);
  if (res.ok) {
    return { ok: true, provider: 'meta', buffer: res.buffer, mimeType: res.mimeType, filename: res.filename };
  }
  const e = res.error!;
  return {
    ok: false,
    provider: 'meta',
    errorCode: e.code,
    errorMessage: e.details ? `${e.message} — ${e.details}` : e.message,
  };
}

// ─── Template-beheer (aanmaken/indienen, opvragen, verwijderen) ────────────
// Zelfde provider-switch als hierboven, maar deze drie calls gaan naar de
// WABA-scoped templates-endpoints i.p.v. het messages-endpoint. Payload-vorm
// is voor beide providers identiek (zie server/whatsapp/templates.ts); alleen
// het transport wisselt.

export interface ProviderTemplateResult {
  ok: boolean;
  id?: string;
  status?: string;
  category?: string;
  errorCode?: string;
  errorMessage?: string;
  provider: WhatsAppProviderName;
}

export interface ProviderTemplateListItem {
  name: string;
  language: string;
  status: string;
  category?: string;
  rejectedReason?: string;
}

export interface ProviderTemplateListResult {
  ok: boolean;
  templates?: ProviderTemplateListItem[];
  errorCode?: string;
  errorMessage?: string;
  provider: WhatsAppProviderName;
}

function d360TemplatesBaseUrl(): string {
  return `${d360BaseUrl()}/v1/configs/templates`;
}

async function d360SubmitTemplate(args: {
  name: string;
  language: string;
  category: 'UTILITY' | 'MARKETING';
  components: any[];
}): Promise<ProviderTemplateResult> {
  try {
    const r = await fetch(d360TemplatesBaseUrl(), {
      method: 'POST',
      headers: d360Headers(),
      body: JSON.stringify({
        name: args.name,
        language: args.language,
        category: args.category,
        components: args.components,
      }),
    });
    const responseText = await r.text();
    let data: any = {};
    try { data = JSON.parse(responseText); } catch { /* niet-JSON respons */ }

    if (!r.ok || data?.error) {
      const errorMsg = data?.error?.message || data?.message || responseText.slice(0, 500);
      return {
        ok: false,
        provider: '360dialog',
        errorCode: data?.error?.code ? String(data.error.code) : String(r.status),
        errorMessage: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
      };
    }
    return { ok: true, provider: '360dialog', id: data?.id != null ? String(data.id) : undefined, status: data?.status, category: data?.category };
  } catch (err: any) {
    return { ok: false, provider: '360dialog', errorCode: 'network_error', errorMessage: err?.message || String(err) };
  }
}

async function d360ListTemplates(): Promise<ProviderTemplateListResult> {
  try {
    const r = await fetch(`${d360TemplatesBaseUrl()}?limit=1000`, { headers: d360Headers() });
    const responseText = await r.text();
    let data: any = {};
    try { data = JSON.parse(responseText); } catch { /* niet-JSON respons */ }

    if (!r.ok || data?.error) {
      const errorMsg = data?.error?.message || data?.message || responseText.slice(0, 500);
      return {
        ok: false,
        provider: '360dialog',
        errorCode: data?.error?.code ? String(data.error.code) : String(r.status),
        errorMessage: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
      };
    }
    const rows: any[] = Array.isArray(data?.waba_templates) ? data.waba_templates : [];
    const templates: ProviderTemplateListItem[] = rows.map((t: any) => ({
      name: String(t?.name ?? ''),
      language: String(t?.language ?? ''),
      status: String(t?.status ?? ''),
      category: t?.category ?? undefined,
      rejectedReason: t?.rejected_reason ?? undefined,
    }));
    return { ok: true, provider: '360dialog', templates };
  } catch (err: any) {
    return { ok: false, provider: '360dialog', errorCode: 'network_error', errorMessage: err?.message || String(err) };
  }
}

async function d360DeleteTemplate(name: string): Promise<ProviderTemplateResult> {
  try {
    const r = await fetch(`${d360TemplatesBaseUrl()}/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: d360Headers(),
    });
    const responseText = await r.text();
    let data: any = {};
    try { data = JSON.parse(responseText); } catch { /* niet-JSON respons */ }

    if (!r.ok || data?.error) {
      const errorMsg = data?.error?.message || data?.message || responseText.slice(0, 500);
      return {
        ok: false,
        provider: '360dialog',
        errorCode: data?.error?.code ? String(data.error.code) : String(r.status),
        errorMessage: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
      };
    }
    return { ok: true, provider: '360dialog' };
  } catch (err: any) {
    return { ok: false, provider: '360dialog', errorCode: 'network_error', errorMessage: err?.message || String(err) };
  }
}

/** Dien een nieuw template in bij de actieve provider. */
export async function submitTemplate(args: {
  name: string;
  language: string;
  category: 'UTILITY' | 'MARKETING';
  components: any[];
}): Promise<ProviderTemplateResult> {
  if (activeProvider() === 'meta') {
    const res = await metaClient.submitTemplate(args);
    if (res.ok) return { ok: true, provider: 'meta', id: res.id, status: res.status, category: res.category };
    const e = res.error!;
    return { ok: false, provider: 'meta', errorCode: e.code, errorMessage: e.details ? `${e.message} — ${e.details}` : e.message };
  }
  return d360SubmitTemplate(args);
}

/** Haal alle bij de actieve provider geregistreerde templates op (voor statussync). */
export async function listTemplates(): Promise<ProviderTemplateListResult> {
  if (activeProvider() === 'meta') {
    const res = await metaClient.listTemplates();
    if (res.ok) return { ok: true, provider: 'meta', templates: res.templates };
    const e = res.error!;
    return { ok: false, provider: 'meta', errorCode: e.code, errorMessage: e.details ? `${e.message} — ${e.details}` : e.message };
  }
  return d360ListTemplates();
}

/** Verwijder een template bij de actieve provider (op naam). */
export async function deleteTemplate(name: string): Promise<ProviderTemplateResult> {
  if (activeProvider() === 'meta') {
    const res = await metaClient.deleteTemplate(name);
    if (res.ok) return { ok: true, provider: 'meta' };
    const e = res.error!;
    return { ok: false, provider: 'meta', errorCode: e.code, errorMessage: e.details ? `${e.message} — ${e.details}` : e.message };
  }
  return d360DeleteTemplate(name);
}
