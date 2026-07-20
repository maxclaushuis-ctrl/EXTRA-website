-- 0008_salesflow — persoonsgerichte salespipeline (direct-mailing opvolging)
-- Los van crm_companies.phase (bedrijfsniveau). Werkbord op persoonsniveau.
-- Idempotent geschreven: veilig meerdere keren te draaien.

BEGIN;

-- ── Batches (mailing-rondes) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salesflow_batches (
  id                  serial PRIMARY KEY,
  name                text NOT NULL,
  categorie           crm_categorie,
  description         text,
  created_by_user_id  integer REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamp NOT NULL DEFAULT now()
);

-- ── Instelbare trigger-regels per fase ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS salesflow_phase_rules (
  id                  serial PRIMARY KEY,
  phase               text NOT NULL UNIQUE,
  label               text NOT NULL,
  position            integer NOT NULL,
  trigger_days        integer,
  trigger_action      text,
  use_business_days   boolean NOT NULL DEFAULT true,
  is_end_state        boolean NOT NULL DEFAULT false,
  updated_at          timestamp NOT NULL DEFAULT now()
);

-- Seed de 8 fases met de afgesproken termijnen (Max: goed startpunt, instelbaar).
INSERT INTO salesflow_phase_rules (phase, label, position, trigger_days, trigger_action, is_end_state) VALUES
  ('selectie',          'Selectie',                    1, NULL, NULL,           false),
  ('mailing_verstuurd', 'Mailing verstuurd',           2, 3,    'bellen',       false),
  ('nagebeld',          'Nagebeld',                    3, 2,    'opnieuw_bellen',false),
  ('bericht_gestuurd',  'Bericht gestuurd',            4, 4,    'opvolgen',     false),
  ('info_verstuurd',    'Info verstuurd',              5, 5,    'opvolgen',     false),
  ('opvolgen',          'Opvolgen',                    6, 7,    'opvolgen',     false),
  ('deal',              'Deal',                        7, NULL, NULL,           true),
  ('geen_interesse',    'Geen interesse / Later',      8, NULL, NULL,           true)
ON CONFLICT (phase) DO NOTHING;

-- ── Kaarten (één persoon in de pipeline) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS salesflow_cards (
  id                  serial PRIMARY KEY,
  contact_id          integer NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id          integer NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  batch_id            integer REFERENCES salesflow_batches(id) ON DELETE SET NULL,
  phase               text NOT NULL DEFAULT 'selectie',
  eigenaar_user_id    integer REFERENCES users(id) ON DELETE SET NULL,
  position            real NOT NULL DEFAULT 0,
  next_action_at      date,
  next_action_type    text,
  reminder_id         integer REFERENCES crm_reminders(id) ON DELETE SET NULL,
  channel             text,
  not_reached_count   integer NOT NULL DEFAULT 0,
  snooze_until        date,
  notes               text,
  entered_phase_at    timestamp NOT NULL DEFAULT now(),
  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS salesflow_cards_phase_idx    ON salesflow_cards (phase, position);
CREATE INDEX IF NOT EXISTS salesflow_cards_batch_idx    ON salesflow_cards (batch_id);
CREATE INDEX IF NOT EXISTS salesflow_cards_eigenaar_idx ON salesflow_cards (eigenaar_user_id);
-- Eén actieve kaart per contact (geen dubbele kaarten voor dezelfde persoon).
CREATE UNIQUE INDEX IF NOT EXISTS salesflow_cards_contact_uniq ON salesflow_cards (contact_id);

COMMIT;
