-- Rollback Blok 3
BEGIN;

DROP TABLE IF EXISTS prospect_replies CASCADE;
DROP TABLE IF EXISTS sendgrid_event_log CASCADE;

ALTER TABLE prospect_contacts
  DROP COLUMN IF EXISTS bounce_status,
  DROP COLUMN IF EXISTS last_bounce_at,
  DROP COLUMN IF EXISTS bounce_reden,
  DROP COLUMN IF EXISTS spam_reported,
  DROP COLUMN IF EXISTS spam_reported_at,
  DROP COLUMN IF EXISTS last_reply_at;

ALTER TABLE prospect_campaigns
  DROP COLUMN IF EXISTS delivered_count,
  DROP COLUMN IF EXISTS bounce_count,
  DROP COLUMN IF EXISTS spam_count,
  DROP COLUMN IF EXISTS reply_count;

ALTER TABLE mail_sends
  DROP COLUMN IF EXISTS sg_message_id,
  DROP COLUMN IF EXISTS delivered_at,
  DROP COLUMN IF EXISTS bounced_at,
  DROP COLUMN IF EXISTS bounce_type,
  DROP COLUMN IF EXISTS bounce_reason,
  DROP COLUMN IF EXISTS spam_reported_at,
  DROP COLUMN IF EXISTS dropped_at,
  DROP COLUMN IF EXISTS dropped_reason,
  DROP COLUMN IF EXISTS reply_at;

DELETE FROM instellingen WHERE sleutel IN ('sendgrid_webhook_public_key', 'sendgrid_inbound_secret');

COMMIT;
