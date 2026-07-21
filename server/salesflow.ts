/**
 * SALESFLOW — trigger-engine voor de persoonsgerichte salespipeline.
 *
 * Kernprincipe: een kaart naar een fase verplaatsen doet drie dingen:
 *   1. de activiteit loggen (activities-tabel);
 *   2. de lopende reminder (trigger) van de vorige fase annuleren;
 *   3. de trigger van de nieuwe fase starten → een crm_reminder met dueDate = nu
 *      + trigger_days (werkdagen), die vanzelf in het bestaande Reminders-scherm
 *      en in /api/sales/mijn-acties verschijnt bij de eigenaar.
 *
 * Eindfases: 'deal' zet het bedrijf op is_client=true (→ Bestaande klanten);
 * 'geen_interesse' kan sluimeren (snooze_until) en keert via de dagelijkse job
 * automatisch terug naar 'selectie'.
 *
 * Alle queries via db.execute(sql`…`), consistent met de bestaande /api/sales/*.
 */
import { sql } from "drizzle-orm";
import { db } from "./db";
import { log } from "./vite";

export type SalesflowPhase =
  | "selectie" | "mailing_verstuurd" | "nagebeld" | "bericht_gestuurd"
  | "info_verstuurd" | "opvolgen" | "deal" | "geen_interesse";

export const PHASE_KEYS: SalesflowPhase[] = [
  "selectie", "mailing_verstuurd", "nagebeld", "bericht_gestuurd",
  "info_verstuurd", "opvolgen", "deal", "geen_interesse",
];

const rows = (r: any): any[] => r.rows ?? r ?? [];
const one = (r: any): any | undefined => rows(r)[0];

/**
 * Zelfherstellend schema: maakt de salesflow-tabellen en -kolommen aan als ze
 * ontbreken en seedt de standaardfases. Volledig idempotent — veilig bij elke
 * start. Hierdoor is de app nooit meer afhankelijk van handmatige migraties.
 */
export async function ensureSalesflowSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS salesflow_batches (
      id                  serial PRIMARY KEY,
      name                text NOT NULL,
      categorie           crm_categorie,
      description         text,
      created_by_user_id  integer REFERENCES users(id) ON DELETE SET NULL,
      created_at          timestamp NOT NULL DEFAULT now()
    )`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS salesflow_phase_rules (
      id                  serial PRIMARY KEY,
      phase               text NOT NULL UNIQUE,
      label               text NOT NULL,
      position            integer NOT NULL,
      trigger_days        integer,
      trigger_action      text,
      use_business_days   boolean NOT NULL DEFAULT true,
      is_end_state        boolean NOT NULL DEFAULT false,
      updated_at          timestamp NOT NULL DEFAULT now()
    )`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS salesflow_cards (
      id                  serial PRIMARY KEY,
      contact_id          integer NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
      company_id          integer NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
      batch_id            integer REFERENCES salesflow_batches(id) ON DELETE SET NULL,
      phase               text NOT NULL DEFAULT 'selectie',
      eigenaar_user_id    integer REFERENCES users(id) ON DELETE SET NULL,
      position            real NOT NULL DEFAULT 0,
      next_action_at      date,
      next_action_type    text,
      reminder_id         integer REFERENCES crm_reminders(id) ON DELETE SET NULL,
      channel             text,
      not_reached_count   integer NOT NULL DEFAULT 0,
      snooze_until        date,
      notes               text,
      entered_phase_at    timestamp NOT NULL DEFAULT now(),
      created_at          timestamp NOT NULL DEFAULT now(),
      updated_at          timestamp NOT NULL DEFAULT now()
    )`);
  // Latere kolommen (migraties 0009/0010) — idempotent bijwerken.
  await db.execute(sql`ALTER TABLE salesflow_phase_rules ADD COLUMN IF NOT EXISTS behavior text NOT NULL DEFAULT 'normal'`);
  await db.execute(sql`ALTER TABLE salesflow_phase_rules ADD COLUMN IF NOT EXISTS asks_channel boolean NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE salesflow_cards ADD COLUMN IF NOT EXISTS created_by_name text`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS salesflow_cards_phase_idx ON salesflow_cards (phase, position)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS salesflow_cards_batch_idx ON salesflow_cards (batch_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS salesflow_cards_eigenaar_idx ON salesflow_cards (eigenaar_user_id)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS salesflow_cards_contact_uniq ON salesflow_cards (contact_id)`);
  // Seed de standaardfases als het bord nog leeg is.
  const aantal = Number(one(await db.execute(sql`SELECT count(*)::int AS n FROM salesflow_phase_rules`))?.n ?? 0);
  if (aantal === 0) {
    await db.execute(sql`
      INSERT INTO salesflow_phase_rules (phase, label, position, trigger_days, trigger_action, is_end_state, behavior, asks_channel) VALUES
        ('selectie',          'Selectie',               1, NULL, NULL,             false, 'normal', false),
        ('mailing_verstuurd', 'Mailing verstuurd',      2, 3,    'bellen',         false, 'normal', false),
        ('nagebeld',          'Nagebeld',               3, 2,    'opnieuw_bellen', false, 'normal', false),
        ('bericht_gestuurd',  'Bericht gestuurd',       4, 4,    'opvolgen',       false, 'normal', true),
        ('info_verstuurd',    'Info verstuurd',         5, 5,    'opvolgen',       false, 'normal', false),
        ('opvolgen',          'Opvolgen',               6, 7,    'opvolgen',       false, 'normal', false),
        ('deal',              'Deal',                   7, NULL, NULL,             true,  'deal',   false),
        ('geen_interesse',    'Geen interesse / Later', 8, NULL, NULL,             true,  'snooze', false)
      ON CONFLICT (phase) DO NOTHING`);
  } else {
    // Bestaande installatie: gedrag-vlaggen zetten als die nog op 'normal' staan
    // (situatie waarin 0008 wél maar 0009 níet is gedraaid).
    await db.execute(sql`UPDATE salesflow_phase_rules SET behavior = 'deal'   WHERE phase = 'deal'           AND behavior = 'normal'`);
    await db.execute(sql`UPDATE salesflow_phase_rules SET behavior = 'snooze' WHERE phase = 'geen_interesse' AND behavior = 'normal'`);
    await db.execute(sql`UPDATE salesflow_phase_rules SET asks_channel = true WHERE phase = 'bericht_gestuurd' AND asks_channel = false`);
  }
  log("[salesflow] schema gecontroleerd en up-to-date (code-versie v5)");
}

/** Voegt N werkdagen (ma–vr) toe aan een datum en geeft 'YYYY-MM-DD'. */
export function addBusinessDays(from: Date, n: number): string {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

function addCalendarDays(from: Date, n: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** E-mail-prefix van een user (bv. 'max') — crm_reminders.owner is vrije tekst. */
async function ownerPrefix(userId: number | null): Promise<string> {
  if (!userId) return "";
  const r = await db.execute(sql`SELECT split_part(email,'@',1) AS p FROM users WHERE id = ${userId}`);
  return one(r)?.p ?? "";
}

async function getRule(phase: string): Promise<any | undefined> {
  return one(await db.execute(sql`SELECT * FROM salesflow_phase_rules WHERE phase = ${phase} LIMIT 1`));
}

/** Menselijke omschrijving voor reminder-titel en activiteit. */
function actionLabel(action: string | null | undefined): string {
  switch (action) {
    case "bellen": return "Bellen";
    case "opnieuw_bellen": return "Opnieuw bellen (niet bereikt)";
    case "opvolgen": return "Opvolgen";
    case "mailen": return "Mailen";
    case "appen": return "Appen";
    case "langsgaan": return "Langsgaan";
    default: return action ? action.charAt(0).toUpperCase() + action.slice(1) : "Actie";
  }
}

/** Annuleert de open reminder die bij een kaart hoort (bij fase-wissel). */
async function cancelReminder(reminderId: number | null | undefined): Promise<void> {
  if (!reminderId) return;
  // Alleen als hij nog niet is afgerond — een afgehandelde reminder laten we staan voor de historie.
  await db.execute(sql`UPDATE crm_reminders SET status = 'completed' WHERE id = ${reminderId} AND status <> 'completed'`);
}

/**
 * Plaatst een kaart in een fase en voert de trigger-logica uit.
 * Gebruikt voor drag & drop, batch-acties en het aanmaken van een kaart.
 */
export async function moveCardToPhase(opts: {
  cardId: number;
  phase: string; // fase-sleutel (dynamisch: kolommen zijn beheerbaar)
  actorUserId?: number | null;
  channel?: string | null;      // bij 'bericht_gestuurd'
  snoozeUntil?: string | null;  // bij 'geen_interesse'
  resetNotReached?: boolean;    // reset teller bij fase-wissel weg van 'nagebeld'
}): Promise<any> {
  const card = one(await db.execute(sql`SELECT * FROM salesflow_cards WHERE id = ${opts.cardId} LIMIT 1`));
  if (!card) throw new Error(`salesflow-kaart ${opts.cardId} niet gevonden`);

  const rule = await getRule(opts.phase);
  if (!rule) throw new Error(`onbekende fase: ${opts.phase}`);

  const eigenaarId: number | null = card.eigenaar_user_id ?? null;

  // 1. Annuleer de lopende trigger van de vorige fase.
  await cancelReminder(card.reminder_id);

  // 2. Log de activiteit (activities hangt op bedrijfsniveau).
  const persoon = one(await db.execute(sql`SELECT name FROM crm_contacts WHERE id = ${card.contact_id}`))?.name ?? "contact";
  await db.execute(sql`
    INSERT INTO activities (crm_company_id, type, description, created_by_user_id)
    VALUES (${card.company_id}, 'note', ${`Salesflow: ${persoon} → ${rule.label}`},
            (SELECT id FROM users WHERE id = ${opts.actorUserId ?? null}))
  `);

  // 3. Bepaal de nieuwe trigger.
  let nextActionAt: string | null = null;
  let nextActionType: string | null = null;
  let newReminderId: number | null = null;

  if (!rule.is_end_state && rule.trigger_days != null) {
    const base = new Date();
    nextActionAt = rule.use_business_days
      ? addBusinessDays(base, rule.trigger_days)
      : addCalendarDays(base, rule.trigger_days);
    nextActionType = rule.trigger_action ?? null;

    const owner = await ownerPrefix(eigenaarId);
    const title = `${actionLabel(rule.trigger_action)} — ${persoon}`;
    const note = one(await db.execute(sql`SELECT name FROM crm_companies WHERE id = ${card.company_id}`))?.name ?? null;
    const rem = one(await db.execute(sql`
      INSERT INTO crm_reminders (company_id, contact_id, title, due_date, owner, note, status)
      VALUES (${card.company_id}, ${card.contact_id}, ${title}, ${nextActionAt}::date, ${owner}, ${note}, 'open')
      RETURNING id
    `));
    newReminderId = rem?.id ?? null;
  }

  // 4. Eindfase-effecten (gedrag-gedreven, niet op fase-sleutel — zodat kolommen
  //    vrij toegevoegd/verwijderd kunnen worden zonder deze logica te breken).
  if (rule.behavior === "deal") {
    await db.execute(sql`UPDATE crm_companies SET is_client = true, updated_at = now() WHERE id = ${card.company_id}`);
  }

  const snooze = rule.behavior === "snooze" ? (opts.snoozeUntil ?? null) : null;
  const notReached = opts.resetNotReached ? 0 : card.not_reached_count;

  // 5. Werk de kaart bij.
  const updated = one(await db.execute(sql`
    UPDATE salesflow_cards SET
      phase = ${opts.phase},
      next_action_at = ${nextActionAt}::date,
      next_action_type = ${nextActionType},
      reminder_id = ${newReminderId},
      channel = ${opts.channel ?? card.channel ?? null},
      snooze_until = ${snooze}::date,
      not_reached_count = ${notReached},
      entered_phase_at = now(),
      updated_at = now()
    WHERE id = ${opts.cardId}
    RETURNING *
  `));
  return updated;
}

/** 'Niet bereikt' bij het nabellen: teller ophogen, trigger 2 werkdagen vooruit. */
export async function markNotReached(cardId: number, actorUserId?: number | null): Promise<any> {
  const card = one(await db.execute(sql`SELECT * FROM salesflow_cards WHERE id = ${cardId} LIMIT 1`));
  if (!card) throw new Error(`kaart ${cardId} niet gevonden`);
  await cancelReminder(card.reminder_id);
  const rule = await getRule("nagebeld");
  const days = rule?.trigger_days ?? 2;
  const nextActionAt = addBusinessDays(new Date(), days);
  const persoon = one(await db.execute(sql`SELECT name FROM crm_contacts WHERE id = ${card.contact_id}`))?.name ?? "contact";
  const owner = await ownerPrefix(card.eigenaar_user_id ?? null);
  const rem = one(await db.execute(sql`
    INSERT INTO crm_reminders (company_id, contact_id, title, due_date, owner, note, status)
    VALUES (${card.company_id}, ${card.contact_id}, ${`Opnieuw bellen — ${persoon}`}, ${nextActionAt}::date, ${owner}, NULL, 'open')
    RETURNING id
  `));
  await db.execute(sql`
    INSERT INTO activities (crm_company_id, type, description, created_by_user_id)
    VALUES (${card.company_id}, 'call', ${`Salesflow: ${persoon} niet bereikt (poging ${card.not_reached_count + 1})`},
            (SELECT id FROM users WHERE id = ${actorUserId ?? null}))
  `);
  return one(await db.execute(sql`
    UPDATE salesflow_cards SET
      phase = 'nagebeld',
      not_reached_count = not_reached_count + 1,
      next_action_at = ${nextActionAt}::date,
      next_action_type = 'opnieuw_bellen',
      reminder_id = ${rem?.id ?? null},
      updated_at = now()
    WHERE id = ${cardId}
    RETURNING *
  `));
}

/**
 * Dagelijkse job: laat gesluimerde kaarten (geen_interesse met snooze_until <=
 * vandaag) automatisch terugkeren naar 'selectie'. Draait om 08:00.
 */
export async function runSalesflowDailyJob(): Promise<void> {
  try {
    const woken = await db.execute(sql`
      UPDATE salesflow_cards SET
        phase = 'selectie', snooze_until = NULL, next_action_at = NULL,
        next_action_type = NULL, reminder_id = NULL, entered_phase_at = now(), updated_at = now()
      WHERE phase = 'geen_interesse' AND snooze_until IS NOT NULL AND snooze_until <= CURRENT_DATE
      RETURNING id
    `);
    const n = rows(woken).length;
    if (n > 0) log(`[salesflow] ${n} gesluimerde kaart(en) teruggezet naar Selectie`);
  } catch (err) {
    console.error("[salesflow] dagelijkse job fout:", err);
  }
}

export function scheduleSalesflowDailyJob(): void {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const next = new Date(now);
  next.setHours(8, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(() => {
    runSalesflowDailyJob();
    setInterval(runSalesflowDailyJob, MS_PER_DAY);
  }, next.getTime() - now.getTime());
  log(`[salesflow] dagelijkse sluimer-check gepland om ${next.toLocaleString("nl-NL")}`);
}
