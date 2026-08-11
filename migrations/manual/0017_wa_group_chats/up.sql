-- 0017_wa_group_chats
--
-- WhatsApp-groepsgesprekken: door EXTRA zelf aangemaakte groepen (max 8
-- deelnemers, de grens van de WhatsApp Groups API) met klanten/medewerkers.
-- Twee nieuwe, op zichzelf staande tabellen — raken geen bestaande data aan
-- en zijn niet hetzelfde als whatsapp_groups/whatsapp_group_members (die
-- zijn interne verzendlijsten voor bulkberichten, geen echte WhatsApp-groep).

DO $$ BEGIN
  CREATE TYPE whatsapp_group_chat_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS whatsapp_group_chats (
  id                     serial PRIMARY KEY,
  provider_group_id      text NOT NULL,
  subject                text NOT NULL,
  description            text,
  invite_link            text,
  join_approval_mode     text NOT NULL DEFAULT 'auto_approve',
  participants           jsonb NOT NULL DEFAULT '[]',
  participant_count      integer NOT NULL DEFAULT 0,
  status                 whatsapp_group_chat_status NOT NULL DEFAULT 'active',
  created_by_user_id     integer REFERENCES users(id) ON DELETE SET NULL,
  created_by_name        text,
  last_message_at        timestamp,
  last_message_preview   text,
  participants_synced_at timestamp,
  created_at             timestamp NOT NULL DEFAULT now(),
  updated_at             timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_group_chat_provider_id_unique ON whatsapp_group_chats (provider_group_id);
CREATE INDEX IF NOT EXISTS wa_group_chat_status_idx ON whatsapp_group_chats (status);

CREATE TABLE IF NOT EXISTS whatsapp_group_messages (
  id                serial PRIMARY KEY,
  group_chat_id     integer NOT NULL REFERENCES whatsapp_group_chats(id) ON DELETE CASCADE,
  direction         whatsapp_direction NOT NULL,
  wa_message_id     text,
  participant_phone text,
  participant_name  text,
  message_type      text NOT NULL DEFAULT 'text',
  body              text,
  raw_payload       jsonb,
  sent_by_user_id   integer REFERENCES users(id) ON DELETE SET NULL,
  sent_by_name      text,
  status            text NOT NULL DEFAULT 'received',
  error_code        text,
  error_message     text,
  created_at        timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wa_group_msg_group_idx ON whatsapp_group_messages (group_chat_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS wa_group_msg_wa_id_unique ON whatsapp_group_messages (wa_message_id);
