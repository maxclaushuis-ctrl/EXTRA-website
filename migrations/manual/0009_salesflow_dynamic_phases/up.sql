-- 0009_salesflow_dynamic_phases — kolommen (fases) volledig beheerbaar maken.
-- Speciale acties worden nu gestuurd door vlaggen op de fase-regel i.p.v.
-- hardgecodeerde fase-sleutels, zodat toevoegen/verwijderen van kolommen
-- de deal-/sluimer-/kanaal-logica intact laat.
BEGIN;

ALTER TABLE salesflow_phase_rules ADD COLUMN IF NOT EXISTS behavior     text NOT NULL DEFAULT 'normal';  -- 'normal' | 'deal' | 'snooze'
ALTER TABLE salesflow_phase_rules ADD COLUMN IF NOT EXISTS asks_channel boolean NOT NULL DEFAULT false;  -- vraagt e-mail/LinkedIn bij binnenkomst

-- Bestaande fases voorzien van hun gedrag.
UPDATE salesflow_phase_rules SET behavior = 'deal'   WHERE phase = 'deal';
UPDATE salesflow_phase_rules SET behavior = 'snooze' WHERE phase = 'geen_interesse';
UPDATE salesflow_phase_rules SET asks_channel = true WHERE phase = 'bericht_gestuurd';

COMMIT;
