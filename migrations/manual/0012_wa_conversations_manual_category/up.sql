-- 0012_wa_conversations_manual_category
--
-- Op 5 mei 2026 (commit ec282e3) is manual_category aan shared/schema.ts
-- toegevoegd om een gesprek handmatig naar een ander tabblad (Medewerkers /
-- Klanten / Kandidaten) te kunnen verplaatsen, zonder dat de automatische
-- matcher het terugzet. De dropdown en de PUT /api/whatsapp/conversations/
-- :phoneNumber/category-route bestaan al en gebruiken deze kolom.
--
-- Deze migratie bestond alleen nog niet: manual_category is toegevoegd vóór
-- server/ensureSchema.ts bestond, dus nooit vastgelegd. Zelfde patroon als de
-- storing van 4 augustus 2026 (crm_companies) — een kolom die in de code
-- staat maar mogelijk nooit in de database is aangemaakt.
--
-- Uitsluitend additief: bestaande rijen blijven ongemoeid en krijgen NULL
-- (= geen override, automatische matching blijft gelden).
-- Dezelfde SQL staat in server/ensureSchema.ts en draait bij elke serverstart,
-- dus deze migratie is de vastlegging — handmatig draaien is niet nodig.
ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS manual_category whatsapp_match_category;
