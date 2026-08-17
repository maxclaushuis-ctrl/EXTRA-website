-- Terugdraaien verwijdert de handmatig toegevoegde ontvangers van alle
-- campagnes. Alleen draaien als je zeker weet dat dat de bedoeling is.
ALTER TABLE prospect_campaigns
  DROP COLUMN IF EXISTS extra_contact_ids;
