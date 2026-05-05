import { createClient } from '@supabase/supabase-js';

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    let url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_KEY || '').trim();
    if (!url || !key) throw new Error('SUPABASE_URL en SUPABASE_SERVICE_KEY zijn vereist');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (!url.includes('.')) {
      url = url + '.supabase.co';
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

/**
 * Haalt de Supabase storage-path op uit een opgeslagen CV-URL.
 * Voorbeeld: https://xxx.supabase.co/storage/v1/object/public/cvs/cv-123.docx → cv-123.docx
 */
export function extractCvStoragePath(cvFilename: string): string | null {
  const match = cvFilename.match(/\/storage\/v1\/object\/(?:public|sign|upload)\/cvs\/([^?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Download een CV via de service-key — werkt voor zowel publieke als private buckets.
 * Geeft null terug als het bestand niet gevonden kan worden.
 */
export async function downloadCvBuffer(cvFilename: string): Promise<{ buffer: Buffer; ext: string } | null> {
  if (!cvFilename?.startsWith('http')) return null;
  const storagePath = extractCvStoragePath(cvFilename);
  if (!storagePath) return null;
  try {
    const { data: fileBlob, error } = await getSupabaseAdmin()
      .storage.from('cvs')
      .download(storagePath);
    if (error || !fileBlob) return null;
    const ext = storagePath.split('.').pop()?.toLowerCase() ?? 'docx';
    return { buffer: Buffer.from(await fileBlob.arrayBuffer()), ext };
  } catch {
    return null;
  }
}

// ───────────────────────── Onboarding-bijlagen ─────────────────────────
const ONBOARDING_BUCKET = 'onboarding-bijlagen';
let _onboardingBucketEnsured = false;

async function ensureOnboardingBucket() {
  if (_onboardingBucketEnsured) return;
  try {
    const sb = getSupabaseAdmin();
    const { data: buckets } = await sb.storage.listBuckets();
    const exists = (buckets || []).some((b: any) => b.name === ONBOARDING_BUCKET);
    if (!exists) {
      await sb.storage.createBucket(ONBOARDING_BUCKET, {
        public: true,
        fileSizeLimit: 25 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf'],
      });
      console.log(`[Supabase] Bucket '${ONBOARDING_BUCKET}' aangemaakt`);
    }
    _onboardingBucketEnsured = true;
  } catch (e) {
    console.warn('[Supabase] Kon bucket niet controleren/aanmaken:', e);
  }
}

/** Haalt de Supabase storage-path op uit een opgeslagen onboarding-bijlage URL. */
export function extractOnboardingBijlageStoragePath(url: string): string | null {
  if (!url) return null;
  const re = new RegExp(`/storage/v1/object/(?:public|sign|upload)/${ONBOARDING_BUCKET}/([^?#]+)`);
  const match = url.match(re);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Upload een onboarding-bijlage PDF naar Supabase Storage. Retourneert de publieke URL. */
export async function uploadOnboardingBijlage(
  buffer: Buffer,
  originalFilename: string
): Promise<string> {
  await ensureOnboardingBucket();
  const safe = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${Date.now()}-${safe}`;
  const sb = getSupabaseAdmin();
  const { error } = await sb.storage
    .from(ONBOARDING_BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });
  if (error) throw new Error(`Supabase upload mislukt: ${error.message}`);
  const { data } = sb.storage.from(ONBOARDING_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Download een onboarding-bijlage uit Supabase Storage. Geeft null als niet gevonden. */
export async function downloadOnboardingBijlageBuffer(url: string): Promise<Buffer | null> {
  const storagePath = extractOnboardingBijlageStoragePath(url);
  if (!storagePath) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(ONBOARDING_BUCKET)
      .download(storagePath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

/** Verwijder een onboarding-bijlage uit Supabase Storage. */
export async function deleteOnboardingBijlageStorage(url: string): Promise<boolean> {
  const storagePath = extractOnboardingBijlageStoragePath(url);
  if (!storagePath) return false;
  try {
    const { error } = await getSupabaseAdmin()
      .storage.from(ONBOARDING_BUCKET)
      .remove([storagePath]);
    return !error;
  } catch {
    return false;
  }
}

/** Helper: detecteert of het opgeslagen bestandspad een Supabase URL is (vs lokaal pad). */
export function isOnboardingBijlageUrl(bestandspad: string): boolean {
  return /^https?:\/\//.test(bestandspad) && bestandspad.includes(`/${ONBOARDING_BUCKET}/`);
}

// ───────────────────────── WhatsApp AI bijlagen (PDF protocollen) ─────────────────────────
const WA_AI_BUCKET = 'whatsapp-ai-protocollen';
let _waAiBucketEnsured = false;

async function ensureWaAiBucket() {
  if (_waAiBucketEnsured) return;
  try {
    const sb = getSupabaseAdmin();
    const { data: buckets } = await sb.storage.listBuckets();
    const exists = (buckets || []).some((b: any) => b.name === WA_AI_BUCKET);
    if (!exists) {
      await sb.storage.createBucket(WA_AI_BUCKET, {
        public: false,
        fileSizeLimit: 25 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf'],
      });
      console.log(`[Supabase] Bucket '${WA_AI_BUCKET}' aangemaakt`);
    }
    _waAiBucketEnsured = true;
  } catch (e) {
    console.warn('[Supabase] Kon WA-AI bucket niet controleren/aanmaken:', e);
  }
}

/** Upload een WhatsApp AI bijlage (PDF) naar Supabase Storage. Retourneert de storage-path. */
export async function uploadWaAiAttachment(buffer: Buffer, originalFilename: string, mimeType: string): Promise<string> {
  await ensureWaAiBucket();
  const safe = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${Date.now()}-${safe}`;
  const sb = getSupabaseAdmin();
  const { error } = await sb.storage
    .from(WA_AI_BUCKET)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
  if (error) throw new Error(`Supabase upload mislukt: ${error.message}`);
  return storagePath;
}

/** Download een WA-AI bijlage uit Supabase Storage op basis van storage-path. */
export async function downloadWaAiAttachmentBuffer(storagePath: string): Promise<Buffer | null> {
  if (!storagePath) return null;
  try {
    const { data, error } = await getSupabaseAdmin().storage.from(WA_AI_BUCKET).download(storagePath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

/** Verwijder een WA-AI bijlage uit Supabase Storage. */
export async function deleteWaAiAttachmentStorage(storagePath: string): Promise<boolean> {
  if (!storagePath) return false;
  try {
    const { error } = await getSupabaseAdmin().storage.from(WA_AI_BUCKET).remove([storagePath]);
    return !error;
  } catch {
    return false;
  }
}
