-- 0033 Kandidaatmatch (Job 3.0, fase 4).
--
-- Alleen twee nieuwe tabellen. Geen bestaande tabel of kolom wijzigt.
-- Draait ook automatisch via server/ensureSchema.ts.

CREATE TABLE IF NOT EXISTS cv_analyses (
  id            serial PRIMARY KEY,
  candidate_id  integer NOT NULL,
  bestand       text NOT NULL,
  soort         text NOT NULL,
  status        text NOT NULL,
  tekens        integer,
  periodes      jsonb NOT NULL DEFAULT '[]'::jsonb,
  certificaten  jsonb NOT NULL DEFAULT '[]'::jsonb,
  model         text,
  fout          text,
  aangemaakt_op timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cv_analyses_kandidaat_idx ON cv_analyses (candidate_id);
CREATE TABLE IF NOT EXISTS kandidaat_matches (
  id             serial PRIMARY KEY,
  candidate_id   integer NOT NULL,
  cv_analyse_id  integer,
  functie        text NOT NULL,
  toestand       text NOT NULL,
  score          integer,
  laag           integer,
  hoog           integer,
  dekking        integer NOT NULL,
  voorlopig      boolean NOT NULL DEFAULT false,
  onzekerheid    text NOT NULL,
  eis            text NOT NULL,
  label          text NOT NULL,
  invoer         jsonb NOT NULL,
  aangemaakt_op  timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kandidaat_matches_kandidaat_idx ON kandidaat_matches (candidate_id);
