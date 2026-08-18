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
import { sendEmail } from "./mail";
import { beoordeelReminder, faseRegelUitRij } from "./salesflowLogic";
import { syncOpAchtergrond } from './crmSync';

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
  // Afspraakfase: kolommen met asks_appointment vragen bij het verslepen om een
  // datum + tijd, en maken juist géén reminder aan (migratie 0011).
  await db.execute(sql`ALTER TABLE salesflow_phase_rules ADD COLUMN IF NOT EXISTS asks_appointment boolean NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE salesflow_cards ADD COLUMN IF NOT EXISTS appointment_at timestamp`);
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

  // ── Zelfherstel: "Geen actie" mag nooit een reminder opleveren ─────────────
  //
  // Tot en met v8 gold de voorwaarde `trigger_days != null` voor het aanmaken
  // van een reminder. Wie in "Fases instellen" de actie op "Geen actie" zette
  // maar het aantal werkdagen op 0 liet staan, kreeg daardoor tóch een reminder
  // — met vervaldatum vandaag en zonder actietype, dus met de nietszeggende
  // titel "Actie". Die stond de volgende dag meteen als "te laat" op het bord
  // én in de ochtendmail. Precies wat "Geen actie" hoort te voorkomen.
  //
  // De code hieronder maakt de bestaande gegevens weer kloppend. Idempotent:
  // na de eerste keer vindt hij niets meer.

  // 1. Werkdagen horen leeg te zijn zonder actie — anders blijft de instelling
  //    in de UI verwarrend ("0" leest als een termijn).
  await db.execute(sql`
    UPDATE salesflow_phase_rules SET trigger_days = NULL, updated_at = now()
    WHERE is_end_state = false AND trigger_action IS NULL AND trigger_days IS NOT NULL`);

  // 2. Reminders die bij zo'n fase horen afsluiten. Alleen reminders die aan
  //    een kaart hangen die nú in een actieloze fase staat — reminders uit de
  //    historie blijven ongemoeid.
  const opgeruimd = await db.execute(sql`
    UPDATE crm_reminders SET status = 'completed'
    WHERE status <> 'completed' AND id IN (
      SELECT k.reminder_id FROM salesflow_cards k
      JOIN salesflow_phase_rules r ON r.phase = k.phase
      WHERE k.reminder_id IS NOT NULL
        AND (r.trigger_action IS NULL OR r.asks_appointment = true)
    )
    RETURNING id`);

  // 3. En de kaart zelf weer schoon: geen openstaande actie meer.
  await db.execute(sql`
    UPDATE salesflow_cards k SET
      reminder_id = NULL, next_action_at = NULL, next_action_type = NULL, updated_at = now()
    FROM salesflow_phase_rules r
    WHERE r.phase = k.phase
      AND (r.trigger_action IS NULL OR r.asks_appointment = true)
      AND (k.reminder_id IS NOT NULL OR k.next_action_at IS NOT NULL)`);

  const n = rows(opgeruimd).length;
  if (n > 0) log(`[salesflow] ${n} onterechte reminder(s) opgeruimd bij fases zonder actie`);

  log("[salesflow] schema gecontroleerd en up-to-date (code-versie v9)");
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
  appointmentAt?: string | null; // bij een fase met asks_appointment
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

  // Of er een reminder komt, staat in één pure functie — zie
  // server/salesflowLogic.ts voor de voorwaarden en het waarom.
  const oordeel = beoordeelReminder(faseRegelUitRij(rule));

  if (oordeel.maakt) {
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
    // Het bedrijf verhuist hiermee van Leads & Prospects naar Bestaande
    // klanten. De contactpersonen moeten mee, anders staan ze in een campagne
    // voor klanten nog steeds als prospect. Zie server/crmSync.ts.
    syncOpAchtergrond(card.company_id);
  }

  const snooze = rule.behavior === "snooze" ? (opts.snoozeUntil ?? null) : null;
  const notReached = opts.resetNotReached ? 0 : card.not_reached_count;

  // Afspraakdatum: alleen overschrijven als de fase erom vraagt én er een
  // waarde is meegegeven. Bij het wegslepen naar een andere fase blijft de
  // oude datum staan — sleep je per ongeluk mis, dan ben je hem niet kwijt.
  const afspraak =
    rule.asks_appointment && opts.appointmentAt !== undefined
      ? opts.appointmentAt
      : (card.appointment_at ?? null);

  // 5. Werk de kaart bij.
  const updated = one(await db.execute(sql`
    UPDATE salesflow_cards SET
      phase = ${opts.phase},
      next_action_at = ${nextActionAt}::date,
      next_action_type = ${nextActionType},
      reminder_id = ${newReminderId},
      channel = ${opts.channel ?? card.channel ?? null},
      snooze_until = ${snooze}::date,
      appointment_at = ${afspraak}::timestamp,
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmtDatum(d: any): string {
  try { return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }); } catch { return String(d); }
}

/**
 * Ochtendmail per eigenaar: één overzichtsmail met alle open salesacties die
 * vandaag gepland staan of al te laat zijn. Alleen de eigenaar van de reminder
 * ontvangt de mail (koppeling: reminder.owner = e-mailprefix van het
 * admin-account, bv. 'max' → max@doehetextra.nl). Geen acties = geen mail.
 * Te late acties worden dagelijks herhaald totdat ze zijn afgerond.
 */
export async function sendSalesflowDailyDigest(): Promise<void> {
  try {
    const due = rows(await db.execute(sql`
      SELECT r.id, r.title, r.due_date, lower(r.owner) AS owner, r.note,
             co.name AS company_name,
             (r.due_date < CURRENT_DATE) AS te_laat
      FROM crm_reminders r
      LEFT JOIN crm_companies co ON co.id = r.company_id
      WHERE r.status = 'open' AND r.due_date <= CURRENT_DATE AND COALESCE(r.owner, '') <> ''
      ORDER BY lower(r.owner), r.due_date, r.id`));
    if (due.length === 0) return;

    const perOwner = new Map<string, any[]>();
    for (const r of due) {
      if (!perOwner.has(r.owner)) perOwner.set(r.owner, []);
      perOwner.get(r.owner)!.push(r);
    }

    for (const [owner, items] of Array.from(perOwner.entries())) {
      const u = one(await db.execute(sql`
        SELECT email, first_name AS "firstName" FROM users
        WHERE lower(split_part(email, '@', 1)) = ${owner} AND role = 'admin'
        LIMIT 1`));
      if (!u?.email) {
        log(`[salesflow] ochtendmail: geen admin-account gevonden voor eigenaar '${owner}' — overgeslagen`);
        continue;
      }
      const teLaat = items.filter((i: any) => i.te_laat);
      const vandaag = items.filter((i: any) => !i.te_laat);
      const regel = (i: any) =>
        `<li style="margin:4px 0">${i.te_laat ? '<strong style="color:#d6453d">[Te laat — ' + fmtDatum(i.due_date) + ']</strong> ' : ''}` +
        `${escapeHtml(i.title)}${i.company_name ? ` — ${escapeHtml(i.company_name)}` : ""}</li>`;
      const tekstregel = (i: any) => `- ${i.te_laat ? `[TE LAAT ${fmtDatum(i.due_date)}] ` : ""}${i.title}${i.company_name ? ` — ${i.company_name}` : ""}`;
      const onderwerp = teLaat.length > 0
        ? `${vandaag.length} salesactie(s) vandaag · ${teLaat.length} te laat`
        : `${vandaag.length} salesactie(s) voor vandaag`;
      const html = `
        <p>Hoi ${escapeHtml(u.firstName ?? "")},</p>
        <p>Dit staat er vandaag voor je klaar in de salesflow:</p>
        ${vandaag.length ? `<p><strong>Vandaag</strong></p><ul>${vandaag.map(regel).join("")}</ul>` : ""}
        ${teLaat.length ? `<p><strong>Nog open (te laat)</strong></p><ul>${teLaat.map(regel).join("")}</ul>` : ""}
        <p>Afvinken kan in het dashboard bij <em>Reminders</em> of op het Salesflow-bord.</p>
        <p>— EXTRA dashboard</p>`;
      const text = `Hoi ${u.firstName ?? ""},\n\nDit staat er vandaag voor je klaar:\n${[...vandaag, ...teLaat].map(tekstregel).join("\n")}\n\nAfvinken kan in het dashboard bij Reminders of op het Salesflow-bord.`;
      const ok = await sendEmail({ to: u.email, from: "EXTRA <max@doehetextra.nl>", subject: onderwerp, html, text });
      log(`[salesflow] ochtendmail naar ${u.email}: ${items.length} actie(s) — ${ok ? "verzonden" : "MISLUKT"}`);
    }
  } catch (err) {
    console.error("[salesflow] ochtendmail fout:", err);
  }
}

/**
 * Dagelijkse job: laat gesluimerde kaarten (geen_interesse met snooze_until <=
 * vandaag) automatisch terugkeren naar 'selectie'. Draait om 08:00.
 * Verstuurt daarna de ochtendmail per eigenaar.
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
  await sendSalesflowDailyDigest();
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
