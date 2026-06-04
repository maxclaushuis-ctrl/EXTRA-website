// Onboarding-bijlagen opslag via Replit Object Storage (App Storage).
// Vervangt de oude Supabase-opslag. Bestanden worden server-side (vanuit een
// multer memory-buffer) rechtstreeks naar de private bucket geschreven en
// server-side weer opgehaald om als e-mailbijlage mee te sturen.

import { objectStorageClient } from './replit_integrations/object_storage';

const PRIVATE_DIR = (process.env.PRIVATE_OBJECT_DIR || '').replace(/\/+$/, '');
const ONBOARDING_PREFIX = 'onboarding-bijlagen';
const UPLOAD_TIMEOUT_MS = 30_000;

/** Faalt luid na een time-out i.p.v. oneindig te blijven hangen (bv. trage Object Storage in deploy). */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} duurde langer dan ${ms / 1000}s (time-out)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Splitst een volledig object-pad (/<bucket>/<object>) in bucket + objectnaam. */
function parseObjectPath(fullPath: string): { bucketName: string; objectName: string } {
  let p = fullPath;
  if (!p.startsWith('/')) p = `/${p}`;
  const parts = p.split('/');
  const bucketName = parts[1];
  const objectName = parts.slice(2).join('/');
  return { bucketName, objectName };
}

/** Detecteert of een opgeslagen bestandspad in Object Storage staat (vs lokaal pad). */
export function isOnboardingBijlageUrl(bestandspad: string): boolean {
  if (!bestandspad) return false;
  return bestandspad.includes(`/${ONBOARDING_PREFIX}/`) && bestandspad.startsWith('/replit-objstore-');
}

/** Upload een onboarding-bijlage (PDF) naar Object Storage. Retourneert het object-pad. */
export async function uploadOnboardingBijlage(
  buffer: Buffer,
  originalFilename: string,
): Promise<string> {
  if (!PRIVATE_DIR) {
    throw new Error('PRIVATE_OBJECT_DIR ontbreekt — Object Storage is niet geconfigureerd.');
  }
  const safe = (originalFilename || 'bijlage.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fullPath = `${PRIVATE_DIR}/${ONBOARDING_PREFIX}/${Date.now()}-${safe}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const file = objectStorageClient.bucket(bucketName).file(objectName);
  // resumable: false → één enkele upload-request i.p.v. een resumable sessie met
  // meerdere round-trips. Resumable uploads kunnen in de deploy-omgeving blijven
  // hangen; voor deze kleine PDF's is een single-shot upload sneller en betrouwbaarder.
  await withTimeout(
    file.save(buffer, {
      contentType: 'application/pdf',
      metadata: { contentType: 'application/pdf' },
      resumable: false,
    }),
    UPLOAD_TIMEOUT_MS,
    'Uploaden naar Object Storage',
  );
  return fullPath;
}

/** Download een onboarding-bijlage uit Object Storage. Geeft null als niet gevonden. */
export async function downloadOnboardingBijlageBuffer(path: string): Promise<Buffer | null> {
  if (!isOnboardingBijlageUrl(path)) return null;
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

/** Verwijder een onboarding-bijlage uit Object Storage. */
export async function deleteOnboardingBijlageStorage(path: string): Promise<boolean> {
  if (!isOnboardingBijlageUrl(path)) return false;
  try {
    const { bucketName, objectName } = parseObjectPath(path);
    await objectStorageClient.bucket(bucketName).file(objectName).delete();
    return true;
  } catch {
    return false;
  }
}
