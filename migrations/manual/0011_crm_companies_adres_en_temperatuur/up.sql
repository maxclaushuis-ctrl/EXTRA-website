-- 0011_crm_companies_adres_en_temperatuur
--
-- Kolommen die in commit 6aec652 aan shared/schema.ts zijn toegevoegd maar
-- nooit in de database zijn aangekomen. Gevolg: `select()` op crm_companies
-- mislukte volledig met "column does not exist", waardoor Leads & Prospects
-- op 4 augustus 2026 "0 van 0 bedrijven" toonde terwijl er 965 in stonden.
--
-- Uitsluitend additief: bestaande rijen blijven ongemoeid en krijgen NULL.
-- Dezelfde SQL staat in server/ensureSchema.ts en draait bij elke serverstart,
-- dus deze migratie is de vastlegging — handmatig draaien is niet nodig.
ALTER TABLE crm_companies
  ADD COLUMN IF NOT EXISTS address     text,   -- straat + huisnummer, bijv. "Herengracht 100"
  ADD COLUMN IF NOT EXISTS postal_code text,   -- bijv. "1015 BS"
  ADD COLUMN IF NOT EXISTS latitude    real,   -- WGS84 — gevuld via PDOK-geocoding
  ADD COLUMN IF NOT EXISTS longitude   real,   -- WGS84 — gevuld via PDOK-geocoding
  ADD COLUMN IF NOT EXISTS temperature text;   -- 'hot' | 'warm' | 'cold' | NULL
