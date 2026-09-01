-- 0027 — candidate_audit_action: één actie erbij voor de landcode-backfill
--
-- Aanleiding: 37 van de 72 TWV-rijen hebben een nationaliteit die geen
-- landnaam is ("Bengalese", "Yemen", "Agentinian") en daardoor geen landcode.
-- Een eenmalige backfill vult nationality_iso en nationality_zone op basis van
-- een met de hand goedgekeurde aliaslijst (shared/landenAlias.ts).
--
--   twv_landcode_backfill — die eenmalige opschoning.
--
-- Staat los van 'updated' zodat achteraf te zien is welke landcode uit de
-- backfill komt en welke door een admin is ingevoerd. De vrije tekst in
-- nationality wordt niet aangeraakt; alleen de twee lege kolommen ernaast
-- worden gevuld.
--
-- ADD VALUE is additief en herhaalbaar. Let op: Postgres staat het gebruik van
-- een nieuwe enum-waarde niet toe in dezelfde transactie waarin hij is
-- toegevoegd. Daarom draait dit bij het opstarten, los van elke schrijfactie.

ALTER TYPE candidate_audit_action ADD VALUE IF NOT EXISTS 'twv_landcode_backfill';
