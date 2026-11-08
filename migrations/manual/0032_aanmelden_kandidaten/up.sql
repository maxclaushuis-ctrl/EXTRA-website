-- 0032 Aanmeldformulier 3 en Kandidaten 3.0.
--
-- Alleen nieuwe kolommen op candidates (allemaal leeg voor bestaande kandidaten)
-- en één nieuwe tabel. Geen bestaande kolom wijzigt.
-- Draait ook automatisch via server/ensureSchema.ts.

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS aanmeld_versie text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS functie_eerste_keus text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS woonland text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS whatsapp_nummer text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS gesprekstaal text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS bron_details jsonb;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS whatsapp_toestemming_op timestamp;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS whatsapp_toestemming_versie text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS aanmeld_sleutel text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS planner_user_id integer;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS planner_sinds timestamp;
CREATE UNIQUE INDEX IF NOT EXISTS candidates_aanmeld_sleutel_idx ON candidates (aanmeld_sleutel) WHERE aanmeld_sleutel IS NOT NULL;
CREATE TABLE IF NOT EXISTS kandidaat_mogelijke_match (
  id              serial PRIMARY KEY,
  candidate_id    integer NOT NULL,
  soort           text NOT NULL,
  match_id        integer NOT NULL,
  redenen         jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'open',
  beoordeeld_door integer,
  beoordeeld_op   timestamp,
  aangemaakt_op   timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kandidaat_mogelijke_match_kandidaat_idx ON kandidaat_mogelijke_match (candidate_id);;
