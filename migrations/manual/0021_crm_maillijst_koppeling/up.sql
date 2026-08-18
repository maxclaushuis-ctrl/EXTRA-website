-- 0021 — koppeling tussen het CRM en de verzendlijst
--
-- prospect_contacts.crm_contact_id bestond al als kolom, maar werd nergens
-- gevuld of gelezen. Sinds server/crmSync.ts is dit de sleutel waarmee een
-- verzendrij bij een CRM-contactpersoon hoort.
--
-- De unieke index is het vangnet: zonder die index kan een tweede rij voor
-- dezelfde contactpersoon ontstaan, en dan krijgt iemand alles dubbel — ook
-- iemand die zich bij de ene rij had afgemeld.
--
-- Partieel (WHERE ... IS NOT NULL) omdat de meeste rijen geen CRM-herkomst
-- hebben: handmatig ingevoerd, via Apollo of via een CSV. Die mogen allemaal
-- naast elkaar bestaan met crm_contact_id NULL.
--
-- Eerst opruimen: de oude route /api/admin/prospect-contacts/import-crm vulde
-- crm_contact_id al, zonder bescherming tegen duplicaten. Staat er nog zo'n
-- duplicaat, dan mislukt het aanmaken van de index hieronder. De oudste rij
-- houdt de koppeling; de rest wordt bij de eerstvolgende synchronisatie opnieuw
-- beoordeeld.
UPDATE prospect_contacts p
   SET crm_contact_id = NULL
 WHERE p.crm_contact_id IS NOT NULL
   AND p.id <> (
     SELECT MIN(q.id) FROM prospect_contacts q
      WHERE q.crm_contact_id = p.crm_contact_id
   );

-- Additief en herhaalbaar. Draait ook automatisch via server/ensureSchema.ts.
CREATE UNIQUE INDEX IF NOT EXISTS prospect_contacts_crm_contact_id_uidx
  ON prospect_contacts (crm_contact_id)
  WHERE crm_contact_id IS NOT NULL;
