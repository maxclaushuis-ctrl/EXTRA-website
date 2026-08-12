-- Terugdraaien van 0019.
--
-- ⚠️ Verwijdert alle door het team vastgelegde assistent-kennisregels
-- definitief. Alleen draaien met expliciet akkoord. Haal ook de
-- bijbehorende stap in server/ensureSchema.ts weg, anders maakt de
-- eerstvolgende serverstart de (lege) tabel gewoon weer aan.

DROP TABLE IF EXISTS assistant_kennis;
