-- 0025 — candidate_audit_action: twee acties erbij voor TWV
--
-- Aanleiding: geen van de TWV-endpoints schreef een auditregel, terwijl acht
-- andere plekken in server/routes.ts dat wel doen. Vanaf onderdeel B doen ze
-- dat wel. Twee van die schrijvers zijn geen mens:
--
--   twv_auto_expired    — de nachtelijke taak die een verstrekte vergunning met
--                         een verstreken einddatum op twv_verlopen zet.
--   twv_status_backfill — de eenmalige opschoning die een lege twv_status op
--                         twv_nodig zet.
--
-- Ze staan los van 'status_changed' zodat later te zien is welke verlopen-status
-- automatisch kwam en welke door een admin is beoordeeld.
--
-- ADD VALUE is additief en herhaalbaar. Let op: Postgres staat het gebruik van
-- een nieuwe enum-waarde niet toe in dezelfde transactie waarin hij is
-- toegevoegd. Daarom draait dit bij het opstarten, los van elke schrijfactie.

ALTER TYPE candidate_audit_action ADD VALUE IF NOT EXISTS 'twv_auto_expired';
ALTER TYPE candidate_audit_action ADD VALUE IF NOT EXISTS 'twv_status_backfill';
