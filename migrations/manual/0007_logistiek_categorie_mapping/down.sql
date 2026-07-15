-- 0007 rollback (pragmatisch): zet categorie terug naar NULL voor rijen die via
-- deze migratie gezet zijn (type = 'logistiek' en categorie = 'Logistiek').
UPDATE crm_companies
SET categorie = NULL
WHERE type = 'logistiek'
  AND categorie = 'Logistiek';
