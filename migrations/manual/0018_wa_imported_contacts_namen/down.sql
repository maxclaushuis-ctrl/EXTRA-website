-- Terugdraaien van 0018.
--
-- ⚠️ Verwijdert alle (automatisch gegokte én handmatig gecorrigeerde)
-- voornaam/achternaam-gegevens van de geïmporteerde contacten definitief.
-- Alleen draaien met expliciet akkoord. Haal ook de bijbehorende stap in
-- server/ensureSchema.ts weg, anders maakt de eerstvolgende serverstart de
-- kolommen gewoon weer (leeg) aan.

ALTER TABLE whatsapp_imported_contacts
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name;
