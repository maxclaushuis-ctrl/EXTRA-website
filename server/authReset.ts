/**
 * WACHTWOORD-INSTEL-FLOW voor admin-accounts.
 *
 * Veilig ontwerp (geen wachtwoorden in e-mail):
 *  1. Admin vraagt op de loginpagina "Wachtwoord vergeten?" aan met zijn e-mailadres.
 *  2. Server genereert een eenmalig token (24 uur geldig), slaat alleen de HASH
 *     ervan op, en mailt een instel-link naar het account.
 *  3. Via de link kiest de admin zelf een sterk wachtwoord (min. 12 tekens,
 *     letters én cijfers) — opgeslagen als bcrypt-hash in de database.
 *
 * Het token zelf staat nooit in de database (alleen de sha256-hash) en kan
 * maar één keer gebruikt worden.
 */
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { log } from "./vite";
import { sendEmail } from "./mail";

const rows = (r: any): any[] => r.rows ?? r ?? [];
const one = (r: any): any | undefined => rows(r)[0];

/** Idempotent: tabel voor eenmalige wachtwoord-tokens. */
export async function ensureAuthResetSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id          serial PRIMARY KEY,
      user_id     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  text NOT NULL UNIQUE,
      expires_at  timestamp NOT NULL,
      used_at     timestamp,
      created_at  timestamp NOT NULL DEFAULT now()
    )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id)`);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function wachtwoordSterkGenoeg(pw: string): string | null {
  if (!pw || pw.length < 12) return "Wachtwoord moet minimaal 12 tekens lang zijn";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Gebruik minimaal één letter en één cijfer";
  return null;
}

/**
 * Start de flow: maakt een token aan en mailt de instel-link.
 * Geeft altijd stilletjes 'ok' terug richting de aanvrager (geen e-mail-enumeratie);
 * de daadwerkelijke uitkomst staat in de serverlog.
 */
export async function verstuurWachtwoordInstelLink(email: string): Promise<void> {
  const user = one(await db.execute(sql`
    SELECT id, email, first_name AS "firstName" FROM users
    WHERE lower(email) = ${email.toLowerCase()} AND role = 'admin' AND status = 'active'
    LIMIT 1`));
  if (!user) {
    log(`[auth] wachtwoord-instel-link aangevraagd voor onbekend/inactief adres: ${email}`);
    return;
  }
  const token = randomBytes(32).toString("base64url");
  await db.execute(sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${hashToken(token)}, now() + interval '24 hours')`);
  const baseUrl = (process.env.BASE_URL || "https://www.doehetextra.nl").replace(/\/$/, "");
  const link = `${baseUrl}/wachtwoord-instellen?token=${token}`;
  const ok = await sendEmail({
    to: user.email,
    from: "EXTRA <max@doehetextra.nl>",
    subject: "Stel je wachtwoord in voor het EXTRA dashboard",
    html: `
      <p>Hoi ${user.firstName ?? ""},</p>
      <p>Via onderstaande link stel je een (nieuw) wachtwoord in voor je admin-account op het EXTRA dashboard.</p>
      <p><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Wachtwoord instellen</a></p>
      <p style="color:#666;font-size:13px">De link is 24 uur geldig en kan één keer gebruikt worden. Niet zelf aangevraagd? Dan kun je deze mail negeren — er is niets gewijzigd.</p>
      <p>— EXTRA dashboard</p>`,
    text: `Hoi ${user.firstName ?? ""},\n\nStel je wachtwoord in via: ${link}\n\nDe link is 24 uur geldig en eenmalig bruikbaar. Niet zelf aangevraagd? Negeer deze mail.`,
  });
  log(`[auth] wachtwoord-instel-link naar ${user.email}: ${ok ? "verzonden" : "VERZENDEN MISLUKT"}`);
}

/** Rondt de flow af: valideert token + wachtwoord en slaat de bcrypt-hash op. */
export async function stelWachtwoordIn(token: string, password: string): Promise<{ ok: boolean; message: string }> {
  const zwak = wachtwoordSterkGenoeg(password);
  if (zwak) return { ok: false, message: zwak };
  if (!token) return { ok: false, message: "Ongeldige link" };
  const rij = one(await db.execute(sql`
    SELECT id, user_id AS "userId" FROM password_reset_tokens
    WHERE token_hash = ${hashToken(token)} AND used_at IS NULL AND expires_at > now()
    LIMIT 1`));
  if (!rij) return { ok: false, message: "Deze link is verlopen of al gebruikt. Vraag een nieuwe aan via 'Wachtwoord vergeten?'" };
  const hash = await bcrypt.hash(password, 12);
  await db.execute(sql`UPDATE users SET password = ${hash} WHERE id = ${rij.userId}`);
  await db.execute(sql`UPDATE password_reset_tokens SET used_at = now() WHERE id = ${rij.id}`);
  log(`[auth] wachtwoord ingesteld voor user ${rij.userId}`);
  return { ok: true, message: "Wachtwoord ingesteld — je kunt nu inloggen" };
}
