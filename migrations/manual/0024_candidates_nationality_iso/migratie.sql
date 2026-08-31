-- 0024 — candidates: landcode en TWV-zone naast de vrije tekst
--
-- Aanleiding: candidates.nationality is vrije tekst en bevat twee soorten
-- waarden door elkaar. Landnamen ("Bangladesh") komen uit het aanmeldformulier,
-- bijvoeglijke naamwoorden ("Bangladeshi") uit de XLSX-import. Daar valt niet
-- betrouwbaar op te filteren, en richting een inspectie of het Planbord is een
-- landcode nodig.
--
-- Deze migratie voegt alleen kolommen toe. Vullen gebeurt apart en pas na
-- akkoord op het matchrapport (npm run twv:nationaliteit-rapport), zodat er
-- nooit een landcode wordt geraden.
--
-- Deze SQL draait ook automatisch bij het opstarten via server/ensureSchema.ts;
-- hij staat hier zodat de reeks migraties compleet blijft.

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS nationality_iso  text,
  ADD COLUMN IF NOT EXISTS nationality_zone text;
