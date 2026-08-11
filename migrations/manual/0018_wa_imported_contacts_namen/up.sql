-- 0018_wa_imported_contacts_namen
--
-- first_name/last_name op whatsapp_imported_contacts (de eenmalige
-- telefooncontacten-import van augustus 2026, ~5500 rijen). Nodig voor
-- {voornaam}-variabelen in WhatsApp-templates — het bestaande `name`-veld
-- komt rechtstreeks uit iemands telefoon-adresboek en is niet gesplitst.
--
-- Alleen kolommen toevoegen; de daadwerkelijke vulling gebeurt via het
-- eenmalige script scripts/split-imported-contact-names.ts (best-effort
-- gok, per contact achteraf te corrigeren), niet via deze migratie.

ALTER TABLE whatsapp_imported_contacts
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;
