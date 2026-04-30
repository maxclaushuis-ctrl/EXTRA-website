-- ─── Blok 1: Phase + gestandaardiseerde functietags ──────────────────────────
-- Up-migratie. Reversible via down.sql in dezelfde folder.

BEGIN;

-- ─── 1.1 Phase-kolom op prospect_contacts ────────────────────────────────────
ALTER TABLE prospect_contacts
  ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'nieuw';

-- Bestaande rijen krijgen 'nieuw' via DEFAULT (al door NOT NULL DEFAULT geregeld
-- bij ADD COLUMN). Voor de zekerheid expliciet nogmaals.
UPDATE prospect_contacts SET phase = 'nieuw' WHERE phase IS NULL OR phase = '';

CREATE INDEX IF NOT EXISTS prospect_contacts_phase_idx ON prospect_contacts(phase);

-- ─── 1.2 Tabel function_tags ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS function_tags (
  id          SERIAL PRIMARY KEY,
  naam        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  volgorde    INTEGER NOT NULL DEFAULT 0,
  actief      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed: standaard functietags (idempotent via ON CONFLICT)
INSERT INTO function_tags (naam, slug, volgorde, actief) VALUES
  ('Banqueting',         'banqueting',         10, TRUE),
  ('Housekeeping',       'housekeeping',       20, TRUE),
  ('Chef',               'chef',               30, TRUE),
  ('Keukenbrigade',      'keukenbrigade',      40, TRUE),
  ('F&B Manager',        'fb-manager',         50, TRUE),
  ('F&B Director',       'fb-director',        60, TRUE),
  ('Restaurant Manager', 'restaurant-manager', 70, TRUE),
  ('Floor Manager',      'floor-manager',      80, TRUE),
  ('Receptie',           'receptie',           90, TRUE),
  ('Algemeen Hotel',     'algemeen-hotel',    100, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ─── 1.2 Koppeltabel prospect_contact_function_tags (m2m) ───────────────────
CREATE TABLE IF NOT EXISTS prospect_contact_function_tags (
  contact_id      INTEGER NOT NULL REFERENCES prospect_contacts(id) ON DELETE CASCADE,
  function_tag_id INTEGER NOT NULL REFERENCES function_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, function_tag_id)
);

CREATE INDEX IF NOT EXISTS pcft_contact_idx ON prospect_contact_function_tags(contact_id);
CREATE INDEX IF NOT EXISTS pcft_tag_idx     ON prospect_contact_function_tags(function_tag_id);

-- ─── 1.3 Filter-uitbreiding op prospect_campaigns ────────────────────────────
ALTER TABLE prospect_campaigns
  ADD COLUMN IF NOT EXISTS phase_filter      TEXT[]    NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE prospect_campaigns
  ADD COLUMN IF NOT EXISTS function_tag_ids  INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

COMMIT;
