-- 0008_salesflow — rollback
BEGIN;
DROP TABLE IF EXISTS salesflow_cards;
DROP TABLE IF EXISTS salesflow_phase_rules;
DROP TABLE IF EXISTS salesflow_batches;
COMMIT;
