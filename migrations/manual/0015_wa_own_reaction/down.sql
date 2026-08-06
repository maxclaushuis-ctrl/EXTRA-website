-- Terugdraaien van 0015.
--
-- ⚠️ Verwijdert alle opgeslagen reacties die vanuit het dashboard zijn
-- geplaatst (alleen de administratie hiervan — de reactie blijft gewoon
-- zichtbaar in WhatsApp zelf bij de andere partij). Alleen draaien met
-- expliciet akkoord, en let op dat server/ensureSchema.ts de kolom bij de
-- eerstvolgende start gewoon weer aanmaakt (leeg). Haal die stap daar eerst
-- weg als je dit echt wilt.
ALTER TABLE whatsapp_messages
  DROP COLUMN IF EXISTS own_reaction_emoji;
