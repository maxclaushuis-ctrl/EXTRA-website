-- 0035: openingen van een pitchdeck weghalen uit de cijfers (eigen controles van EXTRA).
-- Alleen toevoegen: twee lege kolommen. Er wordt niets gewist; een weggehaalde opening
-- staat er nog en kan in het dashboard worden teruggezet.
-- Wordt bij het opstarten ook uitgevoerd door server/ensureSchema.ts (idempotent).

ALTER TABLE pitchdeck_openingen ADD COLUMN IF NOT EXISTS weggehaald_op timestamp;
ALTER TABLE pitchdeck_openingen ADD COLUMN IF NOT EXISTS weggehaald_door text;
