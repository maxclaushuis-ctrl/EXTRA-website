-- 0010_salesflow_created_by_name — naam van de toevoegende gebruiker op de kaart
-- (vrije tekst, want de admin logt in via een in-memory account zonder users-rij).
ALTER TABLE salesflow_cards ADD COLUMN IF NOT EXISTS created_by_name text;
