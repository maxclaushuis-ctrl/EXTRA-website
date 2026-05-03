/**
 * One-time migratie: normaliseer candidates.phone en prospect_contacts.telefoon
 * naar E.164 zonder '+'. Backup gaat naar phone_original / telefoon_original.
 *
 * Gebruik:
 *   npx tsx server/whatsapp/migrate-phones.ts            # dry-run rapport
 *   npx tsx server/whatsapp/migrate-phones.ts --apply    # daadwerkelijk schrijven
 *
 * Idempotent: records met phone_original IS NOT NULL worden overgeslagen.
 * Ongeldige nummers worden gelogd in phone_normalization_issues.
 */
import { db } from '../db';
import { candidates, prospectContacts, phoneNormalizationIssues } from '@shared/schema';
import { isNull, isNotNull, sql, eq } from 'drizzle-orm';
import { normalizePhoneDetailed } from './phone';

interface Bucket {
  total: number;
  alreadyMigrated: number;
  unchanged: number;
  changed: number;
  invalid: number;
  examplesChanged: { id: number; from: string; to: string }[];
  examplesInvalid: { id: number; original: string; reason: string }[];
}

function emptyBucket(): Bucket {
  return { total: 0, alreadyMigrated: 0, unchanged: 0, changed: 0, invalid: 0, examplesChanged: [], examplesInvalid: [] };
}

async function processBucket(args: {
  apply: boolean;
  tableName: 'candidates' | 'prospect_contacts';
  rows: { id: number; phone: string | null; phoneOriginal: string | null }[];
}): Promise<Bucket> {
  const b = emptyBucket();
  for (const row of args.rows) {
    b.total++;
    if (row.phoneOriginal) {
      b.alreadyMigrated++;
      continue;
    }
    if (!row.phone || row.phone.trim() === '') {
      b.unchanged++;
      continue;
    }
    const r = normalizePhoneDetailed(row.phone);
    if (!r.normalized) {
      b.invalid++;
      if (b.examplesInvalid.length < 20) {
        b.examplesInvalid.push({ id: row.id, original: row.phone, reason: r.reason || 'unknown' });
      }
      if (args.apply) {
        await db.insert(phoneNormalizationIssues).values({
          tableName: args.tableName,
          recordId: row.id,
          originalValue: row.phone,
          reason: r.reason || 'unknown',
        });
      }
      continue;
    }
    if (r.normalized === row.phone) {
      // Al in goede vorm — toch backup zetten zodat 2e run skip-pad neemt
      b.unchanged++;
      if (args.apply) {
        if (args.tableName === 'candidates') {
          await db.update(candidates).set({ phoneOriginal: row.phone }).where(eq(candidates.id, row.id));
        } else {
          await db.update(prospectContacts).set({ telefoonOriginal: row.phone }).where(eq(prospectContacts.id, row.id));
        }
      }
      continue;
    }
    b.changed++;
    if (b.examplesChanged.length < 20) {
      b.examplesChanged.push({ id: row.id, from: row.phone, to: r.normalized });
    }
    if (args.apply) {
      if (args.tableName === 'candidates') {
        await db.update(candidates)
          .set({ phoneOriginal: row.phone, phone: r.normalized })
          .where(eq(candidates.id, row.id));
      } else {
        await db.update(prospectContacts)
          .set({ telefoonOriginal: row.phone, telefoon: r.normalized })
          .where(eq(prospectContacts.id, row.id));
      }
    }
  }
  return b;
}

function printBucket(name: string, b: Bucket) {
  console.log(`\n=== ${name} ===`);
  console.log(`Totaal records         : ${b.total}`);
  console.log(`Al gemigreerd (skip)   : ${b.alreadyMigrated}`);
  console.log(`Ongewijzigd            : ${b.unchanged}`);
  console.log(`Gewijzigd              : ${b.changed}`);
  console.log(`Ongeldig (logged)      : ${b.invalid}`);
  if (b.examplesChanged.length > 0) {
    console.log(`\nVoorbeelden gewijzigd (top ${b.examplesChanged.length}):`);
    for (const e of b.examplesChanged) {
      console.log(`  #${e.id}: "${e.from}" → "${e.to}"`);
    }
  }
  if (b.examplesInvalid.length > 0) {
    console.log(`\nVoorbeelden ongeldig (top ${b.examplesInvalid.length}):`);
    for (const e of b.examplesInvalid) {
      console.log(`  #${e.id}: "${e.original}" — reden: ${e.reason}`);
    }
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`\n📞 Phone-normalisatie migratie ${apply ? '— APPLY MODE (writes!)' : '— DRY-RUN'}\n`);

  const candRows = await db.select({
    id: candidates.id,
    phone: candidates.phone,
    phoneOriginal: candidates.phoneOriginal,
  }).from(candidates);

  const prospRows = await db.select({
    id: prospectContacts.id,
    phone: prospectContacts.telefoon,
    phoneOriginal: prospectContacts.telefoonOriginal,
  }).from(prospectContacts);

  const candBucket = await processBucket({ apply, tableName: 'candidates', rows: candRows });
  const prospBucket = await processBucket({ apply, tableName: 'prospect_contacts', rows: prospRows });

  printBucket('candidates.phone', candBucket);
  printBucket('prospect_contacts.telefoon', prospBucket);

  if (!apply) {
    console.log(`\n💡 Dit was een dry-run. Run met --apply om de wijzigingen daadwerkelijk weg te schrijven.\n`);
  } else {
    console.log(`\n✅ Migratie voltooid. Ongeldige nummers staan in tabel phone_normalization_issues.\n`);
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
