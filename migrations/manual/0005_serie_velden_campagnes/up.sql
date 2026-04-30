-- Migratie 0005: Serie-velden toevoegen aan prospect_campaigns
-- Doel: campagnes groeperen onder een gemeenschappelijke jaarcampagne (bv. "Banqueting jaarcampagne")
--       met een stapnummer (1..N) voor de volgorde binnen die serie.
-- Reversible: down.sql verwijdert beide kolommen.

ALTER TABLE prospect_campaigns
  ADD COLUMN IF NOT EXISTS serie text,
  ADD COLUMN IF NOT EXISTS serie_stap_nr integer;

CREATE INDEX IF NOT EXISTS idx_prospect_campaigns_serie
  ON prospect_campaigns (serie, serie_stap_nr)
  WHERE serie IS NOT NULL;
