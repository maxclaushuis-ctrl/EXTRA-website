-- 0009_salesflow_dynamic_phases — rollback
BEGIN;
ALTER TABLE salesflow_phase_rules DROP COLUMN IF EXISTS behavior;
ALTER TABLE salesflow_phase_rules DROP COLUMN IF EXISTS asks_channel;
COMMIT;
