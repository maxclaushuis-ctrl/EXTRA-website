-- 0026 — melding voor een TWV die al verlopen is
--
-- Aanleiding: checkTwvReminders() filtert op daysLeft > 0 en stopt dus precies
-- op het moment dat het probleem ontstaat. Een vergunning die gisteren afliep
-- kreeg geen enkele actie meer. Onderdeel A maakt dat gat groter, want zodra de
-- status op twv_verlopen staat valt de rij helemaal uit die selectie.
--
-- twv_expired_notified_at staat bewust naast twv_reminder_sent_at en niet in
-- plaats daarvan. Het ene veld hoort bij "verloopt binnenkort", het andere bij
-- "is al verlopen". Op één veld zouden ze elkaar overschrijven en was achteraf
-- niet te bewijzen welke waarschuwing wanneer is verstuurd.
--
-- Het notificatietype staat om dezelfde reden los van twv_expiry.

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS twv_expired_notified_at timestamp;

ALTER TYPE admin_notification_type ADD VALUE IF NOT EXISTS 'twv_verlopen';
