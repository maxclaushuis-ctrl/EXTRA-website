-- Terugdraaien van 0023.
--
-- Let op: hiermee verdwijnen ook de berichten die inmiddels zijn binnengekomen.
-- Maak eerst een export als je die wilt bewaren.

DROP INDEX IF EXISTS contact_berichten_created_at_idx;
DROP TABLE IF EXISTS contact_berichten;

-- De enumwaarde 'contact_bericht' blijft bestaan: Postgres kan een waarde niet
-- uit een enum verwijderen zonder het type opnieuw op te bouwen, en een
-- ongebruikte waarde doet geen kwaad.
