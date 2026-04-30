-- ─── Down-migratie: Apollo "Hotels" → "Hospitality" terugzetten ─────────────
-- LET OP: deze down werkt alleen op contacten met source = 'apollo_import'.
-- Toekomstige imports na deze rollback kunnen nieuwe "Hotels"-rijen creëren
-- die niet door deze rollback gedekt zijn — dat is een bewuste afweging
-- (zelfde scope als up.sql).

BEGIN;

UPDATE prospect_contacts
SET branche = 'Hospitality'
WHERE source = 'apollo_import'
  AND branche IS NOT NULL
  AND LOWER(TRIM(branche)) = 'hotels';

UPDATE prospect_contacts pc
SET branche_tags = sub.nieuw_tags
FROM (
  SELECT
    id,
    ARRAY(
      SELECT DISTINCT CASE
        WHEN LOWER(TRIM(t)) = 'hotels' THEN 'Hospitality'
        ELSE t
      END
      FROM UNNEST(branche_tags) AS t
    ) AS nieuw_tags
  FROM prospect_contacts
  WHERE source = 'apollo_import'
    AND branche_tags IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM UNNEST(branche_tags) AS t
      WHERE LOWER(TRIM(t)) = 'hotels'
    )
) AS sub
WHERE pc.id = sub.id;

COMMIT;
