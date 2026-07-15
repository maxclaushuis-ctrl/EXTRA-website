-- Migratie 0006: Salesdashboard datafundament
-- Doel: genormaliseerde sales-kolommen op crm_companies (categorie, eigenaar, potentie,
--       volgende actie, notities), nieuwe activities-tabel en indexen voor de pipeline.
-- Bestaande kolommen (type, owner, account_owner, phase, potential, notes) blijven ONGEWIJZIGD.
-- Reversible: down.sql verwijdert alles weer.

-- 1. Enum-types (idempotent)
DO $$ BEGIN
  CREATE TYPE crm_categorie AS ENUM ('Hotel', 'Logistiek', 'Events');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crm_potentie AS ENUM ('Laag', 'Medio', 'Hoog');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Nieuwe kolommen op crm_companies
ALTER TABLE crm_companies
  ADD COLUMN IF NOT EXISTS categorie crm_categorie,
  ADD COLUMN IF NOT EXISTS eigenaar_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS potentie crm_potentie,
  ADD COLUMN IF NOT EXISTS volgende_actie_datum date,
  ADD COLUMN IF NOT EXISTS notities text;

-- 3. Nieuwe tabel activities
CREATE TABLE IF NOT EXISTS activities (
  id serial PRIMARY KEY,
  crm_company_id integer NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note')),
  description text,
  created_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

-- 4. Indexen
CREATE INDEX IF NOT EXISTS crm_companies_categorie_eigenaar_phase_idx
  ON crm_companies (categorie, eigenaar_user_id, phase);
CREATE INDEX IF NOT EXISTS crm_companies_eigenaar_volgende_actie_idx
  ON crm_companies (eigenaar_user_id, volgende_actie_datum);
CREATE INDEX IF NOT EXISTS activities_company_created_idx
  ON activities (crm_company_id, created_at);
CREATE INDEX IF NOT EXISTS crm_reminders_company_due_idx
  ON crm_reminders (company_id, due_date);
