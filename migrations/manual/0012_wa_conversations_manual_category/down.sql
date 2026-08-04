-- Terugdraaien van 0012.
--
-- ⚠️ DESTRUCTIEF: dit verwijdert alle handmatige tab-indelingen die gebruikers
-- inmiddels hebben gezet. Elk gesprek valt terug op de automatische matching.
-- Alleen draaien met expliciet akkoord, en let op dat server/ensureSchema.ts
-- de kolom bij de eerstvolgende start gewoon weer aanmaakt (leeg). Haal die
-- stap daar eerst weg als je dit echt wilt.
ALTER TABLE whatsapp_conversations
  DROP COLUMN IF EXISTS manual_category;
