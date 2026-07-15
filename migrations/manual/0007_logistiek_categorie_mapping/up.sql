-- 0007: Bronwaarde 'logistiek' alsnog mappen naar categorie 'Logistiek'.
-- Alleen rijen waar categorie nog NULL is; handmatig gezette categorieën blijven onaangetast.
UPDATE crm_companies
SET categorie = 'Logistiek'
WHERE type = 'logistiek'
  AND categorie IS NULL;
