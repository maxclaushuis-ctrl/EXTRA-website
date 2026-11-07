-- 0031 Sollicitanten (Hotels): dossier per kandidaat en de tijdlijn.
--
-- Twee nieuwe tabellen en één nieuwe kolom op job_afspraken (uit 0030).
-- Puur additief: geen bestaande tabel of kolom wordt gewijzigd of gevuld.
-- Deze stap draait ook automatisch via server/ensureSchema.ts.

ALTER TABLE job_afspraken ADD COLUMN IF NOT EXISTS bevestigd_at timestamp;

CREATE TABLE IF NOT EXISTS sollicitant_dossiers (
          id                  serial PRIMARY KEY,
          candidate_id        integer NOT NULL,
          stap                text NOT NULL DEFAULT 'gesprek_gepland',
          stap_sinds          timestamp NOT NULL DEFAULT now(),
          branche             text,
          interviewer         text,
          intake_status       text NOT NULL DEFAULT 'niet_gestart',
          intake_stap         integer NOT NULL DEFAULT 1,
          intake              jsonb NOT NULL DEFAULT '{}'::jsonb,
          intake_door         text,
          intake_afgerond_at  timestamp,
          beoordeling         jsonb NOT NULL DEFAULT '{}'::jsonb,
          beoordeeld_door     text,
          beoordeeld_at       timestamp,
          controle            jsonb NOT NULL DEFAULT '{}'::jsonb,
          twijfel_van         text,
          twijfel_door        text,
          twijfel_at          timestamp,
          geaccepteerd_door   text,
          geaccepteerd_at     timestamp,
          geaccepteerd_via    text,
          gearchiveerd_uit    text,
          archief_reden       text,
          archief_reden_tekst text,
          gearchiveerd_door   text,
          gearchiveerd_at     timestamp,
          vorige_status       text,
          afwijsmail_at       timestamp,
          foto                text,
          foto_overgeslagen   boolean NOT NULL DEFAULT false,
          aangemaakt_at       timestamp NOT NULL DEFAULT now(),
          bijgewerkt_at       timestamp NOT NULL DEFAULT now()
        );

CREATE UNIQUE INDEX IF NOT EXISTS sollicitant_dossiers_kandidaat_idx ON sollicitant_dossiers (candidate_id);
CREATE INDEX IF NOT EXISTS sollicitant_dossiers_stap_idx ON sollicitant_dossiers (stap);

CREATE TABLE IF NOT EXISTS sollicitant_gebeurtenissen (
          id            serial PRIMARY KEY,
          candidate_id  integer NOT NULL,
          soort         text NOT NULL,
          tekst         text NOT NULL,
          door          text,
          door_user_id  integer,
          data          jsonb,
          at            timestamp NOT NULL DEFAULT now()
        );

CREATE INDEX IF NOT EXISTS sollicitant_gebeurtenissen_kandidaat_idx ON sollicitant_gebeurtenissen (candidate_id);
