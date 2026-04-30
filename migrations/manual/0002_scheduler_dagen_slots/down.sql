-- Revert Blok 2: scheduler-dagen + verzendslots
BEGIN;

DELETE FROM instellingen WHERE sleutel IN ('verzend_dagen_default', 'verzend_slots_jaarcampagne');

ALTER TABLE prospect_campaigns DROP COLUMN IF EXISTS verzend_slots;
ALTER TABLE prospect_campaigns DROP COLUMN IF EXISTS verzend_dagen;

COMMIT;
