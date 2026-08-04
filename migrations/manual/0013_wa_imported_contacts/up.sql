-- 0013_wa_imported_contacts
--
-- Nieuwe, kleine tabel voor de eenmalige import van telefooncontacten
-- (augustus 2026): alleen phone + name, puur om een naam te tonen bij
-- WhatsApp-nummers die niet matchen met een kandidaat, medewerker, klant of
-- prospect. GEEN kandidaat/medewerker/klant-record — telt niet mee in die
-- lijsten of tellers.
--
-- Gevuld door scripts/import-contacten.ts (npm run contacten:import), dat
-- eenmalig handmatig in de Shell wordt gedraaid — dit is geen doorlopend
-- upload-endpoint.
--
-- Dezelfde SQL staat in server/ensureSchema.ts en draait bij elke serverstart,
-- dus deze migratie is de vastlegging — handmatig draaien is niet nodig.
CREATE TABLE IF NOT EXISTS whatsapp_imported_contacts (
  id          serial PRIMARY KEY,
  phone       text NOT NULL,
  name        text NOT NULL,
  imported_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_imported_contacts_phone_unique
  ON whatsapp_imported_contacts (phone);
