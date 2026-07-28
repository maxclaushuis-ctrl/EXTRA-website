// Test van de wachtwoord-instel-flow: zelfde SQL als server/authReset.ts.
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:test@localhost:5432/extra_test' });
const q = (t, p = []) => pool.query(t, p);
const hashToken = (t) => createHash('sha256').update(t).digest('hex');

// Schema (zoals ensureAuthResetSchema)
await q(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, expires_at timestamp NOT NULL, used_at timestamp, created_at timestamp NOT NULL DEFAULT now())`);

// 1. Link aanvragen voor max (rol admin, actief)
const user = (await q(`SELECT id, email FROM users WHERE lower(email)='max@doehetextra.nl' AND role='admin' AND status='active'`)).rows[0];
console.log('[test] admin gevonden:', user.email);
const token = randomBytes(32).toString('base64url');
await q(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '24 hours')`, [user.id, hashToken(token)]);

// 2. Wachtwoord instellen met het token
const rij = (await q(`SELECT id, user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()`, [hashToken(token)])).rows[0];
console.log('[test] token geldig:', !!rij);
const nieuwWachtwoord = 'VeiligW8woord2026x';
await q(`UPDATE users SET password=$1 WHERE id=$2`, [await bcrypt.hash(nieuwWachtwoord, 12), rij.user_id]);
await q(`UPDATE password_reset_tokens SET used_at=now() WHERE id=$1`, [rij.id]);

// 3. Zelfde token nogmaals → moet geweigerd worden
const opnieuw = (await q(`SELECT id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()`, [hashToken(token)])).rows[0];
console.log('[test] token tweede keer geweigerd:', !opnieuw);

// 4. Inloggen met nieuw wachtwoord (bcrypt-pad van de login-route)
const dbUser = (await q(`SELECT * FROM users WHERE email='max@doehetextra.nl'`)).rows[0];
console.log('[test] login met nieuw wachtwoord:', await bcrypt.compare(nieuwWachtwoord, dbUser.password));
console.log('[test] login met fout wachtwoord:', await bcrypt.compare('verkeerd123456', dbUser.password));

// 5. Gedeactiveerde admin@extra.nl-check (zoals ensureAdminAccounts)
await q(`INSERT INTO users (email,password,first_name,last_name,role,status) VALUES ('admin@extra.nl','x','Admin','EXTRAATJE','admin','active') ON CONFLICT DO NOTHING`);
const anderen = (await q(`SELECT email FROM users WHERE role='admin' AND status='active' AND lower(email) <> 'admin@extra.nl'`)).rows;
if (anderen.length > 0) await q(`UPDATE users SET status='inactive' WHERE lower(email)='admin@extra.nl' AND status='active'`);
const gedeeld = (await q(`SELECT status FROM users WHERE email='admin@extra.nl'`)).rows[0];
console.log('[test] gedeeld account na startup-guard:', gedeeld.status, `(${anderen.length} persoonlijke admins actief)`);
await pool.end();
