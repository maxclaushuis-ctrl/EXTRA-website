-- 0023 — contact_berichten: de berichten uit het contactformulier bewaren
--
-- Het formulier op /contact deed bij verzenden uitsluitend een console.log()
-- in de browser. De bezoeker kreeg wel de melding "Bericht verzonden — We
-- nemen zo snel mogelijk contact met je op". Er werd niets opgeslagen, niets
-- gemaild en niemand geïnformeerd; elk bericht dat daar ooit is achtergelaten
-- is verloren gegaan.
--
-- Vanaf nu gaat elk bericht twee kanten op: een mail naar kantoor én een rij
-- in deze tabel. De mail is de werkstroom, de tabel het vangnet — als de
-- mailservice een storing heeft, staat het bericht er nog steeds.
--
-- Nummering: 0022 is gereserveerd voor de Engelse-vacatures-migratie die nog
-- niet is toegepast. Deze staat daarom bewust op 0023, zodat de volgorde
-- klopt ongeacht welke van de twee als eerste binnenkomt.

CREATE TABLE IF NOT EXISTS contact_berichten (
  id          serial PRIMARY KEY,
  naam        text NOT NULL,
  email       text NOT NULL,
  bericht     text NOT NULL,
  pagina      text,
  afgehandeld boolean NOT NULL DEFAULT false,
  created_at  timestamp DEFAULT now()
);

-- Voor het overzicht in het dashboard: nieuwste eerst, onafgehandelde bovenaan.
CREATE INDEX IF NOT EXISTS contact_berichten_created_at_idx
  ON contact_berichten (created_at DESC);
