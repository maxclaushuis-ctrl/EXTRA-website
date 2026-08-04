-- Terugdraaien van 0014.
--
-- ⚠️ DESTRUCTIEF: dit verwijdert de verwijzingen naar gedownloade media-
-- bestanden. De bestanden zelf in Object Storage blijven bestaan, maar de
-- WhatsApp-inbox kan ze niet meer tonen/serveren. Alleen draaien met
-- expliciet akkoord, en let op dat server/ensureSchema.ts de kolommen bij
-- de eerstvolgende start gewoon weer aanmaakt (leeg). Haal die stap daar
-- eerst weg als je dit echt wilt.
ALTER TABLE whatsapp_messages
  DROP COLUMN IF EXISTS media_object_path,
  DROP COLUMN IF EXISTS media_filename;
