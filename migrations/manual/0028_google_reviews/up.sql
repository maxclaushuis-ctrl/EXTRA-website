-- 0028 — google_koppeling en google_reviews: koppeling met Google Business Profile
--
-- De score (4,8) en het aantal reviews (237) stonden met de hand in
-- shared/reviews.ts. Vanaf nu haalt de server ze elke dag zelf op bij Google,
-- samen met de reviews. shared/reviews.ts blijft het vangnet als Google niet
-- reageert of de koppeling nog niet is gemaakt.
--
-- Puur additief. Deze stap draait ook automatisch via server/ensureSchema.ts.

CREATE TABLE IF NOT EXISTS google_koppeling (
  id             integer PRIMARY KEY,
  refresh_token  text,
  account        text,
  locatie        text,
  locatie_naam   text,
  gemiddelde     real,
  totaal         integer,
  gekoppeld_door integer,
  gekoppeld_op   timestamp,
  laatste_sync   timestamp,
  laatste_fout   text
);

CREATE TABLE IF NOT EXISTS google_reviews (
  id            serial PRIMARY KEY,
  review_id     text NOT NULL UNIQUE,
  auteur        text NOT NULL,
  auteur_foto   text,
  sterren       integer,
  tekst         text NOT NULL DEFAULT '',
  reactie       text,
  categorie     text NOT NULL DEFAULT 'onbekend',
  geplaatst_op  timestamp,
  bijgewerkt_op timestamp,
  opgehaald_op  timestamp DEFAULT now()
);
