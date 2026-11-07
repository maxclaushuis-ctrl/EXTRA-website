-- Terugdraaien van 0031. ALLEEN MET DE HAND en alleen met akkoord van Max:
-- dit verwijdert alle intakes, beoordelingen, checks en de tijdlijn.
-- Normaal terugdraaien is de schakelaar SOLLICITANTEN_V2 uitzetten; de tabellen blijven dan staan.

DROP TABLE IF EXISTS sollicitant_gebeurtenissen;
DROP TABLE IF EXISTS sollicitant_dossiers;
ALTER TABLE job_afspraken DROP COLUMN IF EXISTS bevestigd_at;
