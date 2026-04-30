-- Blok 3: SendGrid event-webhook + inbound parse
-- Reversible: zie down.sql

BEGIN;

-- 1) mail_sends: SendGrid Message-ID + delivery/bounce/spam/dropped tijdstempels
ALTER TABLE mail_sends
  ADD COLUMN IF NOT EXISTS sg_message_id text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamp,
  ADD COLUMN IF NOT EXISTS bounced_at timestamp,
  ADD COLUMN IF NOT EXISTS bounce_type text,         -- bounce | blocked
  ADD COLUMN IF NOT EXISTS bounce_reason text,
  ADD COLUMN IF NOT EXISTS spam_reported_at timestamp,
  ADD COLUMN IF NOT EXISTS dropped_at timestamp,
  ADD COLUMN IF NOT EXISTS dropped_reason text,
  ADD COLUMN IF NOT EXISTS reply_at timestamp;

CREATE INDEX IF NOT EXISTS mail_sends_sg_message_id_idx ON mail_sends (sg_message_id);
CREATE INDEX IF NOT EXISTS mail_sends_email_idx ON mail_sends (email);

-- 2) prospect_campaigns: aggregated tellers voor delivered/bounce/spam/reply
ALTER TABLE prospect_campaigns
  ADD COLUMN IF NOT EXISTS delivered_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bounce_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spam_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count integer DEFAULT 0;

-- 3) prospect_contacts: bounce-status + spam-flag voor auto-uitsluiting
ALTER TABLE prospect_contacts
  ADD COLUMN IF NOT EXISTS bounce_status text DEFAULT 'geen',  -- geen | soft | hard
  ADD COLUMN IF NOT EXISTS last_bounce_at timestamp,
  ADD COLUMN IF NOT EXISTS bounce_reden text,
  ADD COLUMN IF NOT EXISTS spam_reported boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS spam_reported_at timestamp,
  ADD COLUMN IF NOT EXISTS last_reply_at timestamp;

CREATE INDEX IF NOT EXISTS prospect_contacts_bounce_status_idx ON prospect_contacts (bounce_status);

-- 4) sendgrid_event_log: raw audit + dedup van inkomende events
CREATE TABLE IF NOT EXISTS sendgrid_event_log (
  id serial PRIMARY KEY,
  sg_event_id text NOT NULL UNIQUE,
  sg_message_id text,
  event text NOT NULL,                 -- delivered|open|click|bounce|spamreport|dropped|deferred|processed|unsubscribe|group_unsubscribe
  email text,
  mail_send_id integer REFERENCES mail_sends(id) ON DELETE SET NULL,
  campaign_id integer REFERENCES prospect_campaigns(id) ON DELETE SET NULL,
  contact_id integer REFERENCES prospect_contacts(id) ON DELETE SET NULL,
  payload jsonb,
  occurred_at timestamp,               -- event timestamp van SendGrid
  received_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS sendgrid_event_log_event_idx ON sendgrid_event_log (event);
CREATE INDEX IF NOT EXISTS sendgrid_event_log_message_idx ON sendgrid_event_log (sg_message_id);
CREATE INDEX IF NOT EXISTS sendgrid_event_log_received_at_idx ON sendgrid_event_log (received_at DESC);

-- 5) prospect_replies: ingekomen antwoorden op campagne-mails
CREATE TABLE IF NOT EXISTS prospect_replies (
  id serial PRIMARY KEY,
  contact_id integer REFERENCES prospect_contacts(id) ON DELETE SET NULL,
  campaign_id integer REFERENCES prospect_campaigns(id) ON DELETE SET NULL,
  mail_send_id integer REFERENCES mail_sends(id) ON DELETE SET NULL,
  from_email text NOT NULL,
  from_name text,
  subject text,
  body_text text,
  body_html text,
  in_reply_to text,
  raw_envelope jsonb,
  received_at timestamp DEFAULT now() NOT NULL,
  handled boolean DEFAULT false NOT NULL,
  handled_at timestamp,
  handled_by integer
);
CREATE INDEX IF NOT EXISTS prospect_replies_contact_idx ON prospect_replies (contact_id);
CREATE INDEX IF NOT EXISTS prospect_replies_campaign_idx ON prospect_replies (campaign_id);
CREATE INDEX IF NOT EXISTS prospect_replies_handled_idx ON prospect_replies (handled, received_at DESC);
CREATE INDEX IF NOT EXISTS prospect_replies_received_at_idx ON prospect_replies (received_at DESC);

-- 6) Default-instellingen: ECDSA public key + optionele inbound-secret
INSERT INTO instellingen (sleutel, waarde) VALUES
  ('sendgrid_webhook_public_key', ''),
  ('sendgrid_inbound_secret', '')
ON CONFLICT (sleutel) DO NOTHING;

COMMIT;
