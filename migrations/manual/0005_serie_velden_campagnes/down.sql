-- Rollback migratie 0005

DROP INDEX IF EXISTS idx_prospect_campaigns_serie;

ALTER TABLE prospect_campaigns
  DROP COLUMN IF EXISTS serie_stap_nr,
  DROP COLUMN IF EXISTS serie;
