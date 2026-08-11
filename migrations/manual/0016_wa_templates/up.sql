-- 0016_wa_templates
--
-- WhatsApp-templates: aanmaken, indienen bij Meta/360dialog en statussync.
-- Nieuwe, op zichzelf staande tabel — raakt geen bestaande data aan.
-- Versturen van een goedgekeurd template naar ontvangers loopt bewust via de
-- bestaande whatsapp_groups/whatsapp_group_members + whatsapp_bulk_sends
-- (zie de laatste stap hieronder), niet via een nieuw opt-in-systeem.

DO $$ BEGIN
  CREATE TYPE whatsapp_template_category AS ENUM ('UTILITY', 'MARKETING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_template_status AS ENUM ('concept', 'in_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id                 serial PRIMARY KEY,
  key                text NOT NULL,
  name               text NOT NULL,
  description        text,
  category           whatsapp_template_category NOT NULL DEFAULT 'UTILITY',
  language           text NOT NULL DEFAULT 'nl',
  body_preview       text NOT NULL DEFAULT '',
  variables          jsonb NOT NULL DEFAULT '[]',
  status             whatsapp_template_status NOT NULL DEFAULT 'concept',
  cta_signup         boolean NOT NULL DEFAULT false,
  button_text        text,
  button_url         text,
  button_dynamic     boolean NOT NULL DEFAULT false,
  button_example     text,
  example_values     jsonb NOT NULL DEFAULT '{}',
  meta_status_reason text,
  meta_status_raw    text,
  submitted_at       timestamp,
  status_synced_at   timestamp,
  created_at         timestamp NOT NULL DEFAULT now(),
  updated_at         timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_template_key_unique ON whatsapp_templates (key);
CREATE INDEX IF NOT EXISTS wa_template_status_idx ON whatsapp_templates (status);

-- Verzendhistorie: template-verzendingen lopen door dezelfde tabel als
-- vrije-tekst bulkverzendingen, alleen met deze twee kolommen extra gezet.
ALTER TABLE whatsapp_bulk_sends
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS reason       text;
