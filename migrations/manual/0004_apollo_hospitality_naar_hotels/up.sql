-- ─── Blok 4: Apollo "Hospitality" → "Hotels" hernoemen ──────────────────────
-- Apollo.io zet hotel-contacten standaard onder de generieke industrie
-- "Hospitality". Voor EXTRA willen we deze contacten onder de specifieke
-- branche "Hotels" hebben zodat segmentering op hotel-campagnes werkt.
--
-- Scope: alleen contacten met source = 'apollo_import' om te voorkomen dat
-- handmatig of via andere bronnen ingevoerde "Hospitality"-waardes worden
-- aangetast. Reversible via down.sql.

BEGIN;

-- 1) branche-kolom: exact 'Hospitality' (case-insensitive) → 'Hotels'
UPDATE prospect_contacts
SET branche = 'Hotels'
WHERE source = 'apollo_import'
  AND branche IS NOT NULL
  AND LOWER(TRIM(branche)) = 'hospitality';

-- 2) brancheTags-array: vervang elke 'Hospitality'-element door 'Hotels'.
--    Dedup door SELECT DISTINCT in een subquery zodat dubbele 'Hotels' na
--    vervanging samengevoegd worden.
UPDATE prospect_contacts pc
SET branche_tags = sub.nieuw_tags
FROM (
  SELECT
    id,
    ARRAY(
      SELECT DISTINCT CASE
        WHEN LOWER(TRIM(t)) = 'hospitality' THEN 'Hotels'
        ELSE t
      END
      FROM UNNEST(branche_tags) AS t
    ) AS nieuw_tags
  FROM prospect_contacts
  WHERE source = 'apollo_import'
    AND branche_tags IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM UNNEST(branche_tags) AS t
      WHERE LOWER(TRIM(t)) = 'hospitality'
    )
) AS sub
WHERE pc.id = sub.id;

COMMIT;
