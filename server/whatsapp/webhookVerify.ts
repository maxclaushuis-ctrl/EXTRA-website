/**
 * Verificatie-helpers voor de Meta Cloud API webhook (/api/whatsapp/meta-webhook).
 *
 * 1. POST-verificatie: X-Hub-Signature-256 header = HMAC-SHA256 over de RAW
 *    request-body, gesigneerd met het App Secret. Timing-safe vergelijking.
 * 2. GET-handshake: Meta stuurt hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 *    en verwacht de challenge letterlijk terug bij een geldige token.
 */
import crypto from 'crypto';

/**
 * Verifieer de X-Hub-Signature-256 header tegen de raw body.
 * Header-formaat: "sha256=<hex>". Timing-safe (lengte-check eerst, daarna
 * crypto.timingSafeEqual) zodat er geen byte-voor-byte timing-leak ontstaat.
 */
export function verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!rawBody || !signatureHeader || !appSecret) return false;

  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Dummy-compare tegen zichzelf om ook het lengte-pad qua timing gelijk te houden.
    try { crypto.timingSafeEqual(b, b); } catch { /* ignore */ }
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/**
 * Timing-safe string-vergelijking voor secrets.
 * Bij ongelijke lengte doen we alsnog een dummy-compare, zodat de functie
 * ongeveer even lang duurt als bij gelijke lengte en er geen lengte-orakel
 * ontstaat. Overgenomen uit de origin/main-implementatie (safeEqualSecret).
 */
export function safeEqualSecret(provided: string, expected: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    try { crypto.timingSafeEqual(a, Buffer.alloc(a.length)); } catch { /* ignore */ }
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/**
 * Handel de GET verify-handshake af.
 * Geeft de challenge-string terug bij een geldige subscribe + verify-token,
 * anders null (caller stuurt dan 403).
 *
 * De token-vergelijking is timing-safe (safeEqualSecret) en de env-waarde wordt
 * getrimd: een per ongeluk meegekopieerde spatie of newline in het Replit-secret
 * zou de handshake anders stilzwijgend laten falen.
 */
export function handleVerifyHandshake(
  query: Record<string, unknown>,
  verifyToken: string = (process.env.META_WA_BOT_VERIFY_TOKEN || '').trim(),
): string | null {
  if (!verifyToken) return null; // geen token geconfigureerd → nooit accepteren
  const mode = String(query['hub.mode'] ?? '');
  const token = String(query['hub.verify_token'] ?? '');
  if (mode === 'subscribe' && safeEqualSecret(token, verifyToken)) {
    return String(query['hub.challenge'] ?? '');
  }
  return null;
}
