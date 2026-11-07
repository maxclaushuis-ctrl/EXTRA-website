-- 0030 Job, de AI-recruiter: gesprekken, berichten, afspraken en werktijden.
--
-- Vier nieuwe tabellen en één extra meldingstype. Puur additief: er bestond
-- nog niets met deze namen, en geen bestaande tabel of kolom wordt gewijzigd.
-- Deze stap draait ook automatisch via server/ensureSchema.ts.

ALTER TYPE admin_notification_type ADD VALUE IF NOT EXISTS 'job_planner';

CREATE TABLE IF NOT EXISTS job_gesprekken (
  id                    serial PRIMARY KEY,
  candidate_id          integer NOT NULL UNIQUE,
  token                 text NOT NULL UNIQUE,
  kanaal                text NOT NULL DEFAULT 'web',
  taal                  text NOT NULL DEFAULT 'nl',
  status                text NOT NULL DEFAULT 'bezig',
  velden                jsonb NOT NULL DEFAULT '{}'::jsonb,
  laatste_onderwerp     text,
  twijfels              jsonb NOT NULL DEFAULT '[]'::jsonb,
  herinneringen         integer NOT NULL DEFAULT 0,
  herinnering_at        timestamp,
  laatste_inkomend_at   timestamp,
  laatste_activiteit_at timestamp NOT NULL DEFAULT now(),
  gestart_at            timestamp NOT NULL DEFAULT now(),
  afgerond_at           timestamp,
  bijgewerkt_at         timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_gesprekken_status_idx ON job_gesprekken (status);

CREATE TABLE IF NOT EXISTS job_berichten (
  id            serial PRIMARY KEY,
  gesprek_id    integer NOT NULL,
  richting      text NOT NULL,
  tekst         text NOT NULL DEFAULT '',
  keuzes        jsonb,
  extra         text,
  bijlage       text,
  kanaal        text NOT NULL DEFAULT 'web',
  aangemaakt_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_berichten_gesprek_idx ON job_berichten (gesprek_id);

CREATE TABLE IF NOT EXISTS job_afspraken (
  id                       serial PRIMARY KEY,
  candidate_id             integer NOT NULL,
  gesprek_id               integer,
  interviewer              text NOT NULL,
  datum                    date NOT NULL,
  tijd                     text NOT NULL,
  status                   text NOT NULL DEFAULT 'gepland',
  herinnering_verstuurd_at timestamp,
  aangemaakt_at            timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS job_afspraken_vrij_idx ON job_afspraken (interviewer, datum, tijd) WHERE status = 'gepland';
CREATE INDEX IF NOT EXISTS job_afspraken_kandidaat_idx ON job_afspraken (candidate_id);

CREATE TABLE IF NOT EXISTS job_interviewers (
  id            serial PRIMARY KEY,
  naam          text NOT NULL UNIQUE,
  dagen         text NOT NULL DEFAULT '1,2,3,4,5',
  van           text NOT NULL,
  tot           text NOT NULL,
  pauze_van     text,
  pauze_tot     text,
  actief        boolean NOT NULL DEFAULT true,
  bijgewerkt_at timestamp NOT NULL DEFAULT now()
);
