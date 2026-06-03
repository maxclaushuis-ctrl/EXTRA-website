// Generieke bestandsopslag via Replit Object Storage (App Storage).
// Vervangt de oude Supabase-opslag voor CV's en WhatsApp-AI bijlagen.
// Bestanden worden server-side (vanuit een multer memory-buffer) rechtstreeks
// naar de private bucket geschreven en weer opgehaald.

import { objectStorageClient } from './replit_integrations/object_storage';

const PRIVATE_DIR = (process.env.PRIVATE_OBJECT_DIR || '').replace(/\/+$/, '');

export const CV_PREFIX = 'cvs';
export const WA_AI_PREFIX = 'wa-ai-attachments';

/** Splitst een volledig object-pad (/<bucket>/<object>) in bucket + objectnaam. */
function parseObjectPath(fullPath: string): { bucketName: string; objectName: string } {
  let p = fullPath;
  if (!p.startsWith('/')) p = `/${p}`;
  const parts = p.split('/');
  const bucketName = parts[1];
  const objectName = parts.slice(2).join('/');
  return { bucketName, objectName };
}

/** True als het pad in Replit Object Storage staat (vs. een oude Supabase-URL of leeg). */
export function isObjectStoragePath(p?: string | null): boolean {
  return !!p && p.startsWith('/replit-objstore-');
}

/** Upload een bestand naar Object Storage onder het opgegeven prefix. Retourneert het object-pad. */
export async function uploadFileToObjectStorage(
  buffer: Buffer,
  prefix: string,
  originalFilename: string,
  contentType: string,
): Promise<string> {
  if (!PRIVATE_DIR) {
    throw new Error('PRIVATE_OBJECT_DIR ontbreekt — Object Storage is niet geconfigureerd.');
  }
  const safe = (originalFilename || 'bestand').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fullPath = `${PRIVATE_DIR}/${prefix}/${Date.now()}-${safe}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  await objectStorageClient.bucket(bucketName).file(objectName).save(buffer, {
    contentType,
    metadata: { contentType },
  });
  return fullPath;
}

/** Download een bestand uit Object Storage. Geeft null als het pad niet (meer) bestaat. */
export async function downloadFileBuffer(path: string): Promise<Buffer | null> {
  if (!isObjectStoragePath(path)) return null;
  try {
    const { bucketName, objectName } = parseObjectPath(path);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [data] = await file.download();
    return data;
  } catch {
    return null;
  }
}

/** Verwijder een bestand uit Object Storage. */
export async function deleteFileFromObjectStorage(path: string): Promise<boolean> {
  if (!isObjectStoragePath(path)) return false;
  try {
    const { bucketName, objectName } = parseObjectPath(path);
    await objectStorageClient.bucket(bucketName).file(objectName).delete();
    return true;
  } catch {
    return false;
  }
}

// ─── CV's ──────────────────────────────────────────────────────────────────

/** Upload een CV naar Object Storage. Retourneert het object-pad (op te slaan in cvFilename). */
export function uploadCvFile(buffer: Buffer, mimetype: string, originalName: string): Promise<string> {
  return uploadFileToObjectStorage(buffer, CV_PREFIX, originalName, mimetype);
}

/** Download een CV uit Object Storage. Geeft { buffer, ext } of null (bv. oude Supabase-URL). */
export async function downloadCvFile(cvFilename: string): Promise<{ buffer: Buffer; ext: string } | null> {
  if (!isObjectStoragePath(cvFilename)) return null;
  const buffer = await downloadFileBuffer(cvFilename);
  if (!buffer) return null;
  const ext = (cvFilename.split('.').pop() || 'bin').toLowerCase();
  return { buffer, ext };
}

// ─── WhatsApp AI bijlagen ────────────────────────────────────────────────────

export function uploadWaAiAttachment(buffer: Buffer, originalFilename: string, mimeType: string): Promise<string> {
  return uploadFileToObjectStorage(buffer, WA_AI_PREFIX, originalFilename, mimeType);
}

export function downloadWaAiAttachmentBuffer(storagePath: string): Promise<Buffer | null> {
  return downloadFileBuffer(storagePath);
}

export function deleteWaAiAttachmentStorage(storagePath: string): Promise<boolean> {
  return deleteFileFromObjectStorage(storagePath);
}
