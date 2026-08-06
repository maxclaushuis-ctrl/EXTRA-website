-- 0015_wa_own_reaction
--
-- own_reaction_emoji komt uit de "reageer zelf op een bericht"-feature
-- (dezelfde emoji-reactie als lang-indrukken in de WhatsApp-app zelf, nu ook
-- vanuit het dashboard). Dezelfde SQL staat in server/ensureSchema.ts en
-- draait bij elke serverstart, dus deze migratie is de vastlegging —
-- handmatig draaien is niet nodig.
--
-- Uitsluitend additief: bestaande rijen blijven ongemoeid en krijgen NULL.
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS own_reaction_emoji text;
