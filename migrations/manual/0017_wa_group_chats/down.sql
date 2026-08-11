-- Terugdraaien van 0017.
--
-- ⚠️ DESTRUCTIEF: dit verwijdert alle groepsgesprekken en hun berichten
-- definitief. Alleen draaien met expliciet akkoord. Haal ook de bijbehorende
-- stappen in server/ensureSchema.ts weg, anders maakt de eerstvolgende
-- serverstart de tabellen gewoon weer (leeg) aan.
--
-- Let op: dit verwijdert alleen de lokale kopie. Groepen die al bij de
-- provider (Meta/360dialog) zijn aangemaakt, blijven daar gewoon bestaan en
-- moeten apart via de provider zelf worden opgeruimd.

DROP TABLE IF EXISTS whatsapp_group_messages;
DROP TABLE IF EXISTS whatsapp_group_chats;
DROP TYPE IF EXISTS whatsapp_group_chat_status;
