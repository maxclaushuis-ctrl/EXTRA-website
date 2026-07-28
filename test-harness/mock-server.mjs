// Mock-backend voor de salesflow-harness: zelfde SQL als server/routes.ts +
// server/salesflow.ts, maar dan met de gewone pg-driver tegen lokale Postgres.
import express from 'express';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:test@localhost:5432/extra_test' });
const app = express();
app.use(express.json());

const q = (text, params = []) => pool.query(text, params);

function addBusinessDays(from, n) {
  const d = new Date(from);
  let added = 0;
  while (added < n) { d.setDate(d.getDate() + 1); const dow = d.getDay(); if (dow !== 0 && dow !== 6) added++; }
  return d.toISOString().slice(0, 10);
}

app.get('/api/sales/flow', async (req, res) => {
  try {
    const rules = await q(`SELECT phase, label, position, trigger_days AS "triggerDays", trigger_action AS "triggerAction", is_end_state AS "isEndState", use_business_days AS "useBusinessDays", behavior, asks_channel AS "asksChannel" FROM salesflow_phase_rules ORDER BY position`);
    const cards = await q(`
      SELECT k.id, k.phase, k.eigenaar_user_id AS "eigenaarUserId", k.position,
             k.next_action_at AS "nextActionAt", k.next_action_type AS "nextActionType",
             k.channel, k.not_reached_count AS "notReachedCount", k.snooze_until AS "snoozeUntil",
             k.notes, k.batch_id AS "batchId", k.created_by_name AS "createdByName",
             ct.name AS "contactNaam", ct.function AS "contactFunctie", ct.email AS "contactEmail",
             co.id AS "companyId", co.name AS "bedrijfNaam", co.categorie, co.city,
             u.first_name AS "eigenaarNaam",
             GREATEST(0, (CURRENT_DATE - k.next_action_at))::int AS "daysOverdue"
      FROM salesflow_cards k
      JOIN crm_contacts ct ON ct.id = k.contact_id
      JOIN crm_companies co ON co.id = k.company_id
      LEFT JOIN users u ON u.id = k.eigenaar_user_id
      ORDER BY k.phase, k.next_action_at ASC NULLS LAST, k.position, k.id`);
    res.json({ rules: rules.rows, cards: cards.rows });
  } catch (e) { console.error('FLOW FOUT:', e.message); res.status(500).json({ message: e.message }); }
});

app.get('/api/sales/flow/owners', async (_req, res) => {
  try {
    const r = await q(`SELECT id, first_name AS "naam", email FROM users WHERE role='admin' AND status='active' ORDER BY first_name`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/sales/flow/batches', async (_req, res) => {
  try {
    const r = await q(`SELECT b.id, b.name, b.categorie, b.description, b.created_at AS "createdAt", COALESCE(c.cnt,0)::int AS "cardCount"
      FROM salesflow_batches b LEFT JOIN (SELECT batch_id, count(*) cnt FROM salesflow_cards GROUP BY batch_id) c ON c.batch_id = b.id ORDER BY b.created_at DESC`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/sales/flow/contacts', async (req, res) => {
  try {
    const s = (req.query.search || '').trim(); const like = `%${s}%`;
    const r = await q(`SELECT ct.id, ct.name, ct.function, ct.email, co.id AS "companyId", co.name AS "bedrijfNaam", co.categorie, (sc.id IS NOT NULL) AS "opBord"
      FROM crm_contacts ct JOIN crm_companies co ON co.id = ct.company_id LEFT JOIN salesflow_cards sc ON sc.contact_id = ct.id
      WHERE ($1 = '' OR ct.name ILIKE $2 OR co.name ILIKE $2) ORDER BY (sc.id IS NOT NULL), co.name, ct.name LIMIT 40`, [s, like]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/sales/flow/batches', async (req, res) => {
  try {
    const { name, categorie } = req.body;
    const r = await q(`INSERT INTO salesflow_batches (name, categorie, description, created_by_user_id)
      VALUES ($1, $2::crm_categorie, NULL, (SELECT id FROM users WHERE id = $3)) RETURNING id, name, categorie, description, created_at AS "createdAt"`, [name, categorie ?? null, 999]);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error('BATCH FOUT:', e.message); res.status(500).json({ message: e.message }); }
});

app.post('/api/sales/flow/cards', async (req, res) => {
  try {
    const { contactId, batchId, createdByName } = req.body;
    const contact = (await q(`SELECT id, company_id FROM crm_contacts WHERE id = $1`, [contactId])).rows[0];
    if (!contact) return res.status(404).json({ message: 'Contact niet gevonden' });
    const firstPhase = (await q(`SELECT phase FROM salesflow_phase_rules ORDER BY position LIMIT 1`)).rows[0]?.phase ?? 'selectie';
    const r = await q(`INSERT INTO salesflow_cards (contact_id, company_id, batch_id, eigenaar_user_id, phase, created_by_name)
      VALUES ($1, $2, $3, (SELECT id FROM users WHERE id = 1), $4, $5) RETURNING id`, [contactId, contact.company_id, batchId ?? null, firstPhase, createdByName ?? null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error('KAART FOUT:', e.message); res.status(500).json({ message: e.message }); }
});

// Exacte replicatie van moveCardToPhase uit server/salesflow.ts
app.patch('/api/sales/flow/cards/:id/move', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { phase, channel, snoozeUntil } = req.body;
    console.log(`[move] kaart ${id} → ${phase} (channel=${channel}, snooze=${snoozeUntil})`);
    const card = (await q(`SELECT * FROM salesflow_cards WHERE id = $1`, [id])).rows[0];
    if (!card) return res.status(500).json({ message: `kaart ${id} niet gevonden` });
    const rule = (await q(`SELECT * FROM salesflow_phase_rules WHERE phase = $1`, [phase])).rows[0];
    if (!rule) return res.status(400).json({ message: 'Onbekende fase' });
    if (card.reminder_id) await q(`UPDATE crm_reminders SET status='completed' WHERE id=$1 AND status<>'completed'`, [card.reminder_id]);
    const persoon = (await q(`SELECT name FROM crm_contacts WHERE id=$1`, [card.contact_id])).rows[0]?.name ?? 'contact';
    await q(`INSERT INTO activities (crm_company_id, type, description, created_by_user_id) VALUES ($1,'note',$2,(SELECT id FROM users WHERE id=$3))`,
      [card.company_id, `Salesflow: ${persoon} → ${rule.label}`, 999]);
    let nextActionAt = null, nextActionType = null, newReminderId = null;
    if (!rule.is_end_state && rule.trigger_days != null) {
      nextActionAt = addBusinessDays(new Date(), rule.trigger_days);
      nextActionType = rule.trigger_action ?? null;
      const owner = (await q(`SELECT split_part(email,'@',1) AS p FROM users WHERE id=$1`, [card.eigenaar_user_id])).rows[0]?.p ?? '';
      const note = (await q(`SELECT name FROM crm_companies WHERE id=$1`, [card.company_id])).rows[0]?.name ?? null;
      const rem = (await q(`INSERT INTO crm_reminders (company_id, contact_id, title, due_date, owner, note, status) VALUES ($1,$2,$3,$4::date,$5,$6,'open') RETURNING id`,
        [card.company_id, card.contact_id, `Actie — ${persoon}`, nextActionAt, owner, note])).rows[0];
      newReminderId = rem?.id ?? null;
    }
    if (rule.behavior === 'deal') await q(`UPDATE crm_companies SET is_client=true, updated_at=now() WHERE id=$1`, [card.company_id]);
    const snooze = rule.behavior === 'snooze' ? (snoozeUntil ?? null) : null;
    const updated = (await q(`UPDATE salesflow_cards SET phase=$1, next_action_at=$2::date, next_action_type=$3, reminder_id=$4, channel=$5, snooze_until=$6::date, not_reached_count=$7, entered_phase_at=now(), updated_at=now() WHERE id=$8 RETURNING *`,
      [phase, nextActionAt, nextActionType, newReminderId, channel ?? card.channel ?? null, snooze, phase !== 'nagebeld' ? 0 : card.not_reached_count, id])).rows[0];
    console.log(`[move] OK → kaart ${id} staat nu in ${updated.phase}`);
    res.json(updated);
  } catch (e) { console.error('MOVE FOUT:', e.message); res.status(500).json({ message: e.message }); }
});

// Kaart van het bord verwijderen — zelfde semantiek als routes.ts
app.delete('/api/sales/flow/cards/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const card = (await q(`SELECT * FROM salesflow_cards WHERE id=$1`, [id])).rows[0];
    if (!card) return res.status(404).json({ message: 'Kaart niet gevonden' });
    if (card.reminder_id) await q(`UPDATE crm_reminders SET status='completed' WHERE id=$1 AND status<>'completed'`, [card.reminder_id]);
    await q(`INSERT INTO activities (crm_company_id, type, description) VALUES ($1,'note','Salesflow: kaart verwijderd')`, [card.company_id]);
    await q(`DELETE FROM salesflow_cards WHERE id=$1`, [id]);
    console.log(`[delete] kaart ${id} verwijderd`);
    res.json({ deleted: id });
  } catch (e) { console.error('DELETE FOUT:', e.message); res.status(500).json({ message: e.message }); }
});

// Fase-instellingen — zelfde semantiek als routes.ts
app.patch('/api/sales/flow/rules/:phase', async (req, res) => {
  try {
    const phase = req.params.phase;
    const b = req.body;
    console.log('[rules-patch]', phase, JSON.stringify(b));
    const bestaat = (await q(`SELECT 1 FROM salesflow_phase_rules WHERE phase=$1`, [phase])).rows.length > 0;
    if (!bestaat) return res.status(404).json({ message: 'Onbekende fase' });
    const r = await q(`
      UPDATE salesflow_phase_rules SET
        label = CASE WHEN $1 THEN $2 ELSE label END,
        trigger_days = CASE WHEN $3 THEN $4::int ELSE trigger_days END,
        trigger_action = CASE WHEN $5 THEN $6 ELSE trigger_action END,
        updated_at = now()
      WHERE phase = $7 RETURNING *`,
      ['label' in b, b.label ?? null, 'triggerDays' in b, b.triggerDays ?? null, 'triggerAction' in b, b.triggerAction ?? null, phase]);
    res.json(r.rows[0]);
  } catch (e) { console.error('RULES-PATCH FOUT:', e.message); res.status(500).json({ message: e.message }); }
});

app.post('/api/sales/flow/rules/reorder', async (req, res) => {
  try {
    let pos = 1;
    for (const phase of req.body.order) { await q(`UPDATE salesflow_phase_rules SET position=$1 WHERE phase=$2`, [pos++, phase]); }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// CRM-reminders — zelfde vorm als /api/admin/crm/reminders in routes.ts
app.get('/api/admin/crm/reminders', async (_req, res) => {
  try {
    const r = await q(`
      SELECT r.id, r.title, r.due_date::text AS "dueDate", r.owner, r.status, r.note,
             r.company_id AS "companyId", COALESCE(co.name,'') AS "companyName",
             EXISTS(SELECT 1 FROM salesflow_cards sc WHERE sc.reminder_id = r.id) AS "viaSalesflow"
      FROM crm_reminders r LEFT JOIN crm_companies co ON co.id = r.company_id
      ORDER BY r.due_date, r.id`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.patch('/api/admin/crm/reminders/:id', async (req, res) => {
  try {
    const { dueDate, status } = req.body;
    const r = await q(`UPDATE crm_reminders SET due_date = COALESCE($1::date, due_date), status = COALESCE($2, status) WHERE id = $3 RETURNING *`,
      [dueDate ?? null, status ?? null, parseInt(req.params.id, 10)]);
    console.log('[reminders-patch]', req.params.id, JSON.stringify(req.body));
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/admin/crm/reminders/:id', async (req, res) => {
  try { await q(`DELETE FROM crm_reminders WHERE id=$1`, [parseInt(req.params.id, 10)]); res.json({ message: 'Reminder verwijderd' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// Website Statistieken — mockdata voor de stijl-harness
app.get('/api/admin/candidates', (_req, res) => {
  const cands = [];
  const maanden = [['2026-04', 204], ['2026-05', 79], ['2026-06', 56], ['2026-07', 58]];
  let id = 1;
  for (const [maand, n] of maanden) {
    for (let i = 0; i < n; i++) {
      const functies = ['horecamedewerker', 'horecamedewerker', 'housekeeping', 'chef', 'overig'];
      const statussen = ['afgewezen', 'afgewezen', 'afgewezen', 'in_behandeling', 'aangenomen', 'nieuw'];
      cands.push({
        id: id++, firstName: 'Test', lastName: `#${id}`, status: statussen[i % statussen.length],
        functionType: functies[i % functies.length], hasCv: i % 2 === 0,
        createdAt: `${maand}-${String((i % 27) + 1).padStart(2, '0')}T10:00:00Z`,
      });
    }
  }
  res.json({ candidates: cands });
});
app.get('/api/admin/blog', (_req, res) => {
  res.json({ posts: [1,2,3,4,5,6,7].map(i => ({ id: i, title: `Artikel ${i}`, slug: `artikel-${i}`, status: 'published', category: 'Horeca', author: 'Max', readTime: '4 min', createdAt: '2026-02-01', publishedAt: '2026-02-0' + i, focusKeyword: 'horeca' })), total: 7 });
});
app.get('/api/admin/staffing-requests', (_req, res) => res.json([1,2,3,4,5].map(i => ({ id: i, companyName: `Bedrijf ${i}`, status: 'open', createdAt: '2026-07-01' }))));
app.get('/api/admin/ga4/status', (_req, res) => res.json({ configured: true, werkt: true, heeftData: false }));
app.get('/api/admin/ga4/overview', (_req, res) => res.json({}));
app.get('/api/admin/ga4/trend', (_req, res) => res.json([]));
app.get('/api/admin/ga4/sources', (_req, res) => res.json([]));
app.get('/api/admin/ga4/pages', (_req, res) => res.json([]));
app.get('/api/admin/ga4/devices', (_req, res) => res.json([]));

app.listen(5099, () => console.log('mock-backend op :5099'));
