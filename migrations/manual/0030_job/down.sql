-- Terugdraaien van 0030. Alleen met de hand en met akkoord van Max.
--
-- Let op: hiermee verdwijnen alle gesprekken met Job, de geboekte
-- kennismakingen in job_afspraken en de ingestelde werktijden. De kandidaten
-- zelf blijven staan, net als interview_date en interview_time op de kaart.
-- De server maakt de tabellen bij de volgende start weer leeg aan
-- (server/ensureSchema.ts); zet daarom ook JOB_ENABLED uit.

DROP TABLE IF EXISTS job_interviewers;
DROP TABLE IF EXISTS job_afspraken;
DROP TABLE IF EXISTS job_berichten;
DROP TABLE IF EXISTS job_gesprekken;

-- De meldingswaarde 'job_planner' blijft bestaan: Postgres kan een
-- enumwaarde niet los verwijderen, en een ongebruikte waarde kan geen kwaad.
