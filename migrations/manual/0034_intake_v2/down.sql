-- Terugdraaien van 0034. NIET NODIG om terug te gaan naar formulier versie 1:
-- daarvoor is de schakelaar INTAKE_V2=0 genoeg, en dan blijft alles bewaard.
--
-- Dit bestand staat er alleen voor de volledigheid. ALLEEN MET DE HAND en alleen met
-- akkoord van Max: het verwijdert de historie per antwoord en het versienummer per dossier,
-- waarna intakes van versie 2 niet meer als versie 2 te herkennen zijn.

-- DROP TABLE IF EXISTS intake_antwoorden;
-- ALTER TABLE sollicitant_dossiers DROP COLUMN IF EXISTS intake_revisie;
-- ALTER TABLE sollicitant_dossiers DROP COLUMN IF EXISTS intake_versie;
