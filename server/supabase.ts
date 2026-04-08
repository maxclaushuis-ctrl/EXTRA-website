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
