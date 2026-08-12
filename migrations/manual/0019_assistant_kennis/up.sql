-- 0019_assistant_kennis
--
-- Kennisbank van de dashboard-AI-assistent: door het team vastgelegde
-- begrippen en werkafspraken ("sollicitanten = de ingevulde
-- intakeformulieren") die de assistent bij elke vraag als context meekrijgt.
-- Zie shared/schema.ts (assistantKennis) en server/assistant/assistent.ts.
-- Bewust een eigen tabel naast whatsapp_ai_knowledge: die stuurt
-- klantgesprekken, deze stuurt interne data-interpretatie.

CREATE TABLE IF NOT EXISTS assistant_kennis (
  id         serial PRIMARY KEY,
  titel      text NOT NULL,
  tekst      text NOT NULL,
  enabled    boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
