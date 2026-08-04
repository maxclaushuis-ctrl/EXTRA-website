-- Terugdraaien van 0011.
--
-- ⚠️ DESTRUCTIEF: dit verwijdert de kolommen mét de adressen, coördinaten en
-- temperatuur die er inmiddels in staan. Alleen draaien met expliciet akkoord,
-- en let op dat server/ensureSchema.ts ze bij de eerstvolgende start gewoon
-- weer aanmaakt (leeg). Haal die stap daar eerst weg als je dit echt wilt.
ALTER TABLE crm_companies
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS postal_code,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS temperature;
