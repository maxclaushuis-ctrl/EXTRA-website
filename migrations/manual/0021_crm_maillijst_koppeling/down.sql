-- Terugdraaien haalt alleen het vangnet weg, niet de koppeling zelf.
-- De waarden in crm_contact_id blijven staan; die zijn hierna alleen niet
-- meer beschermd tegen duplicaten.
DROP INDEX IF EXISTS prospect_contacts_crm_contact_id_uidx;
