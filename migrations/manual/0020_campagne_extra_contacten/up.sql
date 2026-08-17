-- 0020 — handmatig toegevoegde contacten per campagne
--
-- Tegenhanger van excluded_contact_ids: contacten die de mail óók krijgen als
-- ze niet aan de filters van de campagne voldoen. Nodig omdat de doelgroep tot
-- nu toe alleen bij het aanmaken kon worden bepaald; wie er later bij moest,
-- kon er niet bij.
--
-- Additief en herhaalbaar. Draait ook automatisch via server/ensureSchema.ts.
ALTER TABLE prospect_campaigns
  ADD COLUMN IF NOT EXISTS extra_contact_ids integer[] DEFAULT '{}';
