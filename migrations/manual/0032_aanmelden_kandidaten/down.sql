-- Terugdraaien van 0032. ALLEEN MET DE HAND en alleen met akkoord van Max:
-- dit verwijdert de gegevens van het nieuwe formulier en de mogelijke dubbele personen.
-- Normaal terugdraaien is de schakelaar AANMELDFORMULIER op huidig zetten.

DROP TABLE IF EXISTS kandidaat_mogelijke_match;
DROP INDEX IF EXISTS candidates_aanmeld_sleutel_idx;
ALTER TABLE candidates DROP COLUMN IF EXISTS aanmeld_versie, DROP COLUMN IF EXISTS functie_eerste_keus, DROP COLUMN IF EXISTS postcode, DROP COLUMN IF EXISTS woonland, DROP COLUMN IF EXISTS whatsapp_nummer, DROP COLUMN IF EXISTS gesprekstaal, DROP COLUMN IF EXISTS bron_details, DROP COLUMN IF EXISTS whatsapp_toestemming_op, DROP COLUMN IF EXISTS whatsapp_toestemming_versie, DROP COLUMN IF EXISTS aanmeld_sleutel, DROP COLUMN IF EXISTS planner_user_id, DROP COLUMN IF EXISTS planner_sinds;
