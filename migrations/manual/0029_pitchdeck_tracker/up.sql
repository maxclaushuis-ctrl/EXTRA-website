-- 0029 pitchdeck_links en pitchdeck_openingen: de pitchdeck-tracker
--
-- Per ontvanger een link met een willekeurige code, en per opening het
-- apparaat, de kijktijd en de verste slide. Geen IP-adressen.
--
-- Puur additief. Deze stap draait ook automatisch via server/ensureSchema.ts.

CREATE TABLE IF NOT EXISTS pitchdeck_links (
  id              serial PRIMARY KEY,
  deck            text NOT NULL,
  code            text NOT NULL UNIQUE,
  ontvanger       text NOT NULL,
  bedrijf         text,
  actief          boolean NOT NULL DEFAULT true,
  aangemaakt_door integer,
  aangemaakt_op   timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pitchdeck_openingen (
  id            serial PRIMARY KEY,
  deck          text NOT NULL,
  link_id       integer,
  sleutel       text NOT NULL,
  apparaat      text NOT NULL DEFAULT 'Onbekend',
  aantal_slides integer NOT NULL DEFAULT 0,
  max_slide     integer NOT NULL DEFAULT 0,
  kijktijd_sec  integer NOT NULL DEFAULT 0,
  geopend_op    timestamp DEFAULT now(),
  laatst_gezien timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pitchdeck_openingen_link_idx ON pitchdeck_openingen (link_id);
CREATE INDEX IF NOT EXISTS pitchdeck_openingen_geopend_idx ON pitchdeck_openingen (geopend_op);
