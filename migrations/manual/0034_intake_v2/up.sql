-- 0034: sollicitatieformulier versie 2 (shared/intakeV2.ts).
-- Alleen toevoegen. Bestaande dossiers krijgen intake_versie 1 en blijven precies zoals ze zijn.
-- Wordt bij het opstarten ook uitgevoerd door server/ensureSchema.ts (idempotent).

ALTER TABLE sollicitant_dossiers ADD COLUMN IF NOT EXISTS intake_versie integer NOT NULL DEFAULT 1;
ALTER TABLE sollicitant_dossiers ADD COLUMN IF NOT EXISTS intake_revisie integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS intake_antwoorden (
  id            serial PRIMARY KEY,
  candidate_id  integer NOT NULL,
  versie        integer NOT NULL DEFAULT 2,
  onderdeel     text NOT NULL DEFAULT 'intake',
  vraag         text NOT NULL,
  waarde        jsonb,
  bron          text NOT NULL,
  status        text NOT NULL,
  door          text,
  door_user_id  integer,
  at            timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS intake_antwoorden_kandidaat_idx ON intake_antwoorden (candidate_id);
