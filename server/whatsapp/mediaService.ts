/**
 * Media uit WhatsApp-berichten binnenhalen en bewaren.
 *
 * Meta stuurt in de webhook alleen een media-ID, nooit een directe link. Om
 * de bytes te krijgen moet je dat ID eerst omzetten in een tijdelijke CDN-url
 * en die vervolgens ophalen (zie provider.downloadMedia). Die url leeft maar
 * een paar minuten, dus dit moet gebeuren op het moment dat de webhook
 * binnenkomt — niet pas wanneer een planner het gesprek opent.
 *
 * Deze module is bewust een dun laagje boven drie bestaande dingen:
 *   provider.downloadMedia  → de bytes
 *   uploadWaMedia           → Replit Object Storage (zelfde pad als CV's)
 *   storage.updateMessageMedia → media_object_path bij het bericht zetten
 *
 * Faalt nooit hard: als de download misgaat blijft het bericht gewoon staan
 * met zijn tekstbeschrijving, en het ruwe media-id blijft in media_url zitten
 * zodat je achteraf kunt zien wát er niet is opgehaald.
 */

import * as waProvider from './provider';
import { uploadWaMedia } from '../objectStorageFiles';

/** Extensie raden op basis van het mime-type, voor een nette bestandsnaam. */
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/3gpp': '3gp',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/amr': 'amr',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
};

export function extensieVoorMime(mimeType?: string | null): string {
  if (!mimeType) return 'bin';
  // 'image/jpeg; codecs=…' → 'image/jpeg'
  const kaal = mimeType.split(';')[0].trim().toLowerCase();
  return MIME_EXT[kaal] || kaal.split('/')[1] || 'bin';
}

/**
 * Bestandsnaam bepalen. Documenten dragen hun eigen naam mee (die wil een
 * planner terugzien in de downloadlink); voor foto's, audio en video verzint
 * WhatsApp niets, dus maken we er zelf iets leesbaars van.
 */
export function bestandsnaamVoor(args: {
  type: string;
  meegegeven?: string | null;
  mimeType?: string | null;
  waMessageId?: string | null;
}): string {
  if (args.meegegeven) return args.meegegeven;
  const ext = extensieVoorMime(args.mimeType);
  const staart = (args.waMessageId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'bestand';
  return `${args.type}-${staart}.${ext}`;
}

export interface MediaBewaarResultaat {
  ok: boolean;
  objectPath?: string;
  mimeType?: string;
  filename?: string;
  fout?: string;
}

/**
 * Haal de media achter een media-ID op en zet hem in Object Storage.
 * Schrijft zelf niets naar de database — dat doet de aanroeper, zodat deze
 * functie ook bruikbaar is buiten de webhook.
 */
export async function haalMediaOpEnBewaar(args: {
  mediaId: string;
  type: string;
  mimeTypeUitPayload?: string | null;
  filenameUitPayload?: string | null;
  waMessageId?: string | null;
}): Promise<MediaBewaarResultaat> {
  const download = await waProvider.downloadMedia(args.mediaId);
  if (!download.ok || !download.buffer) {
    return { ok: false, fout: download.errorMessage || 'onbekende fout bij downloaden' };
  }

  const mimeType = download.mimeType || args.mimeTypeUitPayload || 'application/octet-stream';
  const filename = bestandsnaamVoor({
    type: args.type,
    // Meta's eigen filename wint van die uit de payload; bij documenten zijn
    // ze gelijk, bij de rest levert Meta er meestal geen.
    meegegeven: download.filename || args.filenameUitPayload,
    mimeType,
    waMessageId: args.waMessageId,
  });

  try {
    const objectPath = await uploadWaMedia(download.buffer, filename, mimeType);
    return { ok: true, objectPath, mimeType, filename };
  } catch (err: any) {
    return { ok: false, fout: err?.message || String(err) };
  }
}
