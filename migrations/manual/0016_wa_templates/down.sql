-- Terugdraaien van 0015.
--
-- ⚠️ DESTRUCTIEF: dit verwijdert alle aangemaakte/ingediende WhatsApp-
-- templates definitief, inclusief hun goedkeuringsstatus. Alleen draaien met
-- expliciet akkoord. Haal ook de bijbehorende stappen in
-- server/ensureSchema.ts weg, anders maakt de eerstvolgende serverstart de
-- tabel gewoon weer (leeg) aan.

ALTER TABLE whatsapp_bulk_sends
  DROP COLUMN IF EXISTS template_key,
  DROP COLUMN IF EXISTS reason;

DROP TABLE IF EXISTS whatsapp_templates;
DROP TYPE IF EXISTS whatsapp_template_status;
DROP TYPE IF EXISTS whatsapp_template_category;
