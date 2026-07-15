-- Rollback migratie 0006: Salesdashboard datafundament

DROP INDEX IF EXISTS crm_reminders_company_due_idx;
DROP INDEX IF EXISTS activities_company_created_idx;
DROP INDEX IF EXISTS crm_companies_eigenaar_volgende_actie_idx;
DROP INDEX IF EXISTS crm_companies_categorie_eigenaar_phase_idx;

DROP TABLE IF EXISTS activities;

ALTER TABLE crm_companies
  DROP COLUMN IF EXISTS notities,
  DROP COLUMN IF EXISTS volgende_actie_datum,
  DROP COLUMN IF EXISTS potentie,
  DROP COLUMN IF EXISTS eigenaar_user_id,
  DROP COLUMN IF EXISTS categorie;

DROP TYPE IF EXISTS crm_potentie;
DROP TYPE IF EXISTS crm_categorie;
