-- Blok 2: Scheduler-dagen en vaste verzendslots per campagne
-- Voegt configureerbare verzenddagen + vaste tijdslots per dag toe.

BEGIN;

-- Verzenddagen: array van weekdagen (1=ma … 7=zo, ISO). NULL = val terug op alleen_werkdagen.
ALTER TABLE prospect_campaigns
  ADD COLUMN IF NOT EXISTS verzend_dagen integer[];

-- Verzendslots: vaste tijdstippen per dag, JSON-array van {dag:int, tijd:"HH:MM"}.
-- Bv. [{"dag":2,"tijd":"14:30"},{"dag":3,"tijd":"10:30"}] voor di 14:30 + wo 10:30.
-- Leeg of NULL = geen vaste slots, val terug op tijdvenster.
ALTER TABLE prospect_campaigns
  ADD COLUMN IF NOT EXISTS verzend_slots jsonb DEFAULT '[]'::jsonb;

-- Default instellingen voor de jaarcampagne en algemene verzendmomenten.
INSERT INTO instellingen (sleutel, waarde) VALUES
  ('verzend_dagen_default', '1,2,3,4,5'),
  ('verzend_slots_jaarcampagne', '[{"dag":2,"tijd":"14:30"},{"dag":3,"tijd":"10:30"}]')
ON CONFLICT (sleutel) DO NOTHING;

COMMIT;
