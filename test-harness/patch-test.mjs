import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:test@localhost:5432/extra_test' });
const db = drizzle(pool);
const b = { label: 'Afspraak ingepland' }; // alléén label — trigger_days (3) moet blijven staan
try {
  const r = await db.execute(sql`
    UPDATE salesflow_phase_rules SET
      label = CASE WHEN ${'label' in b} THEN ${b.label ?? null} ELSE label END,
      trigger_days = CASE WHEN ${'triggerDays' in b} THEN ${b.triggerDays ?? null}::int ELSE trigger_days END,
      trigger_action = CASE WHEN ${'triggerAction' in b} THEN ${b.triggerAction ?? null} ELSE trigger_action END,
      updated_at = now()
    WHERE phase = ${'mailing_verstuurd'} RETURNING phase, label, trigger_days, trigger_action`);
  console.log('RESULTAAT:', r.rows);
} catch (e) { console.log('FOUT:', e.message); }
await pool.end();
