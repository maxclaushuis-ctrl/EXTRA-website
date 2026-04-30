#!/bin/bash
set -e

npm install

# Apply schema changes via raw SQL to avoid interactive db:push prompts.
# Only adds missing columns; safe to run multiple times (idempotent).
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  \"ALTER TABLE candidates ADD COLUMN IF NOT EXISTS review_token_expires_at TIMESTAMP\",
  \"ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'\",
  \"ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS staffing_request_id INTEGER\",
  // 0005: serie-velden voor jaarcampagne-groepering
  \"ALTER TABLE prospect_campaigns ADD COLUMN IF NOT EXISTS serie TEXT\",
  \"ALTER TABLE prospect_campaigns ADD COLUMN IF NOT EXISTS serie_stap_nr INTEGER\",
  \"CREATE INDEX IF NOT EXISTS idx_prospect_campaigns_serie ON prospect_campaigns (serie, serie_stap_nr) WHERE serie IS NOT NULL\"
];

(async () => {
  for (const sql of migrations) {
    try {
      await pool.query(sql);
      console.log('OK:', sql.substring(0, 60));
    } catch (e) {
      console.error('FAILED:', sql.substring(0, 60), e.message);
      process.exit(1);
    }
  }
  await pool.end();
  console.log('All migrations applied.');
})();
"
