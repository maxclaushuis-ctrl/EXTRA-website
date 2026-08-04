-- Terugdraaien van 0013.
--
-- ⚠️ DESTRUCTIEF: dit verwijdert alle geïmporteerde contactnamen. WhatsApp-
-- nummers zonder echte match tonen daarna weer kaal het telefoonnummer.
-- Alleen draaien met expliciet akkoord, en let op dat server/ensureSchema.ts
-- de tabel bij de eerstvolgende start gewoon weer leeg aanmaakt. Haal die
-- stap daar eerst weg als je dit echt wilt.
DROP TABLE IF EXISTS whatsapp_imported_contacts;
