-- ─── Blok 1: Phase + gestandaardiseerde functietags — DOWN ──────────────────
-- Verwijdert alle wijzigingen uit up.sql. Dropt zowel de koppeltabel als de
-- master-tabel function_tags en de phase-kolom + filter-kolommen op campagnes.

BEGIN;

-- 1.3 Campagne-filter kolommen
ALTER TABLE prospect_campaigns DROP COLUMN IF EXISTS function_tag_ids;
ALTER TABLE prospect_campaigns DROP COLUMN IF EXISTS phase_filter;

-- 1.2 Koppeltabel + master-tabel
DROP TABLE IF EXISTS prospect_contact_function_tags;
DROP TABLE IF EXISTS function_tags;

-- 1.1 Phase-kolom
DROP INDEX IF EXISTS prospect_contacts_phase_idx;
ALTER TABLE prospect_contacts DROP COLUMN IF EXISTS phase;

COMMIT;
