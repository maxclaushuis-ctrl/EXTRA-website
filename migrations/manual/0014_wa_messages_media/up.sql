-- 0014_wa_messages_media
--
-- media_object_path en media_filename komen uit de wa-media-feature (foto's,
-- video, audio en documenten in de WhatsApp-inbox tonen/serveren). Deze
-- kolommen zijn ouder dan server/ensureSchema.ts en stonden daardoor nergens
-- vastgelegd — zelfde risicopatroon als manual_category en de
-- crm_companies-storing van 4 augustus.
--
-- Uitsluitend additief: bestaande rijen blijven ongemoeid en krijgen NULL.
-- Dezelfde SQL staat in server/ensureSchema.ts en draait bij elke serverstart,
-- dus deze migratie is de vastlegging — handmatig draaien is niet nodig.
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS media_object_path text,
  ADD COLUMN IF NOT EXISTS media_filename     text;
