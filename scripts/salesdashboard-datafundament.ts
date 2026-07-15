/**
 * Salesdashboard Prompt 1 — herhaalbaar datamigratiescript.
 *
 * Doet (idempotent, alleen NULL-velden invullen — draait veilig meerdere keren):
 *  1. Controleert of Max (max@doehetextra.nl) bestaat; maakt Tommy (tommy@doehetextra.nl)
 *     aan als die nog niet bestaat (role 'employee', bcrypt 12 rounds).
 *     Het tijdelijke wachtwoord wordt ALLEEN naar stdout geprint, nooit opgeslagen.
 *  2. categorie  <- type    : hotel -> 'Hotel', eventlocatie -> 'Events', overig -> NULL (gelogd)
 *  3. potentie   <- potential: laag -> 'Laag', midden -> 'Medio', hoog -> 'Hoog', overig -> NULL (gelogd)
 *  4. eigenaar_user_id       : blijft NULL (bewuste keuze — geen automatische mapping van owner)
 *  5. volgende_actie_datum   : waar leeg, eerstvolgende meeting-activiteit of open reminder-datum
 *  6. Rapporteert tellingen incl. legacy phase-waardes.
 *
 * Draaien: npx tsx scripts/salesdashboard-datafundament.ts
 */
import { pool } from "../server/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function main() {
  const q = (sql: string, params: any[] = []) => pool.query(sql, params);

  console.log("=== Salesdashboard datafundament — datamigratie ===\n");

  // 1. Users
  const max = await q(`SELECT id, email, role FROM users WHERE email = 'max@doehetextra.nl'`);
  console.log(max.rows.length ? `Max bestaat (id ${max.rows[0].id}, role ${max.rows[0].role})` : "LET OP: Max (max@doehetextra.nl) NIET gevonden!");

  const tommy = await q(`SELECT id, email, role FROM users WHERE email = 'tommy@doehetextra.nl'`);
  if (tommy.rows.length) {
    console.log(`Tommy bestaat al (id ${tommy.rows[0].id}, role ${tommy.rows[0].role}) — niets gedaan.`);
  } else {
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    const hash = await bcrypt.hash(tempPassword, 12);
    const ins = await q(
      `INSERT INTO users (email, password, first_name, last_name, role, status)
       VALUES ('tommy@doehetextra.nl', $1, 'Tommy', 'TBD', 'employee', 'active') RETURNING id`,
      [hash]
    );
    console.log(`Tommy aangemaakt (id ${ins.rows[0].id}, role employee, achternaam 'TBD' — placeholder, graag corrigeren).`);
    console.log(`TIJDELIJK WACHTWOORD TOMMY (alleen hier zichtbaar, niet opgeslagen): ${tempPassword}`);
  }

  // 2. categorie <- type (alleen waar categorie nog NULL is)
  const catMap: Record<string, string> = { hotel: "Hotel", eventlocatie: "Events" };
  const typeCounts = await q(`SELECT type, count(*)::int AS n FROM crm_companies WHERE categorie IS NULL GROUP BY type ORDER BY n DESC`);
  console.log("\n--- categorie <- type (bronwaardes waar categorie nog NULL is) ---");
  for (const r of typeCounts.rows) {
    const doel = catMap[r.type] ?? null;
    console.log(`  type='${r.type}': ${r.n} records -> ${doel ?? "NULL (niet gemapt, gelogd)"}`);
  }
  for (const [src, doel] of Object.entries(catMap)) {
    const res = await q(`UPDATE crm_companies SET categorie = $1::crm_categorie WHERE categorie IS NULL AND type = $2`, [doel, src]);
    console.log(`  gezet: ${res.rowCount} x '${doel}' (uit type='${src}')`);
  }

  // 3. potentie <- potential (alleen waar potentie nog NULL is)
  const potMap: Record<string, string> = { laag: "Laag", midden: "Medio", hoog: "Hoog" };
  const potCounts = await q(`SELECT potential, count(*)::int AS n FROM crm_companies WHERE potentie IS NULL GROUP BY potential ORDER BY n DESC`);
  console.log("\n--- potentie <- potential (bronwaardes waar potentie nog NULL is) ---");
  for (const r of potCounts.rows) {
    const doel = r.potential ? (potMap[r.potential] ?? null) : null;
    console.log(`  potential='${r.potential}': ${r.n} records -> ${doel ?? "NULL (niet gemapt, gelogd)"}`);
  }
  for (const [src, doel] of Object.entries(potMap)) {
    const res = await q(`UPDATE crm_companies SET potentie = $1::crm_potentie WHERE potentie IS NULL AND potential = $2`, [doel, src]);
    console.log(`  gezet: ${res.rowCount} x '${doel}' (uit potential='${src}')`);
  }

  // 4. eigenaar_user_id: bewust NULL laten. Alleen referentie-telling.
  const ownerRef = await q(`SELECT owner, count(*)::int AS n FROM crm_companies WHERE owner IS NOT NULL AND owner <> '' GROUP BY owner`);
  console.log("\n--- eigenaar_user_id: blijft NULL (referentie: huidige vrije-tekst owner) ---");
  ownerRef.rows.forEach((r: any) => console.log(`  owner='${r.owner}': ${r.n}`));

  // 5. volgende_actie_datum: eerstvolgende meeting-activiteit of open reminder
  const vad = await q(`
    UPDATE crm_companies c SET volgende_actie_datum = sub.datum
    FROM (
      SELECT company_id AS cid, MIN(datum) AS datum FROM (
        SELECT crm_company_id AS company_id, created_at::date AS datum
          FROM activities WHERE type = 'meeting' AND created_at::date >= CURRENT_DATE
        UNION ALL
        SELECT company_id, due_date FROM crm_reminders WHERE status <> 'completed'
      ) x GROUP BY company_id
    ) sub
    WHERE c.id = sub.cid AND c.volgende_actie_datum IS NULL`);
  console.log(`\n--- volgende_actie_datum: ${vad.rowCount} records gevuld vanuit activities/reminders ---`);

  // 6. Eindrapportage
  const rpt = async (label: string, sql: string) => {
    const r = await q(sql);
    console.log(`\n${label}`);
    r.rows.forEach((row: any) => console.log("  " + JSON.stringify(row)));
  };
  await rpt("Records per categorie:", `SELECT COALESCE(categorie::text,'NULL') AS categorie, count(*)::int AS n FROM crm_companies GROUP BY 1 ORDER BY n DESC`);
  await rpt("Nog NULL, uitgesplitst naar bron-type:", `SELECT type, count(*)::int AS n FROM crm_companies WHERE categorie IS NULL GROUP BY type ORDER BY n DESC`);
  await rpt("Records per potentie:", `SELECT COALESCE(potentie::text,'NULL') AS potentie, count(*)::int AS n FROM crm_companies GROUP BY 1 ORDER BY n DESC`);
  await rpt("Legacy phase-waardes (buiten de 8 bekende):", `SELECT COALESCE(phase,'NULL') AS phase, count(*)::int AS n FROM crm_companies WHERE phase IS NULL OR phase NOT IN ('nieuw','eerste_contact','afspraak_gepland','voorstel_verstuurd','follow_up','gewonnen','verloren','on_hold') GROUP BY 1`);
  await rpt("Percentage met volgende_actie_datum:", `SELECT round(100.0 * count(*) FILTER (WHERE volgende_actie_datum IS NOT NULL) / NULLIF(count(*),0), 1) AS pct FROM crm_companies`);

  await pool.end();
  console.log("\nKlaar.");
}

main().catch((e) => { console.error(e); process.exit(1); });
