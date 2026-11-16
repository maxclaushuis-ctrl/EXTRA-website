/**
 * Controle vóór en na de overstap naar de nieuwe aanmeldprocedure. ALLEEN LEZEN:
 * het script voert uitsluitend SELECT-query's uit en toont alleen aantallen, geen namen.
 *
 *   npx tsx scripts/controle-overgang.ts            database van deze omgeving (DATABASE_URL)
 *   npx tsx scripts/controle-overgang.ts --prod     productiedatabase (PROD_DATABASE_URL)
 *
 * Draai het vóór de livegang en de dag erna, en vergelijk de twee uitkomsten. De totalen
 * van kandidaten, medewerkers en oude intakes mogen alleen gelijk blijven of stijgen.
 */
import { sql } from "drizzle-orm";

const naarProd = process.argv.includes("--prod");
if (naarProd) {
  if (!process.env.PROD_DATABASE_URL) { console.error("PROD_DATABASE_URL is niet gezet."); process.exit(1); }
  process.env.DATABASE_URL = process.env.PROD_DATABASE_URL;
}
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is niet gezet."); process.exit(1); }

async function bestaat(db: any, tabel: string): Promise<boolean> {
  const r = await db.execute(sql`select to_regclass(${"public." + tabel}) is not null as er`);
  return !!(r.rows ?? r)[0]?.er;
}
async function getal(db: any, q: any): Promise<number | string> {
  try { const r = await db.execute(q); const rij = (r.rows ?? r)[0] || {}; return Number(Object.values(rij)[0] ?? 0); }
  catch (e: any) { return `fout: ${String(e?.message || e).slice(0, 60)}`; }
}

async function main() {
  const { db, pool } = await import("../server/db");
  try {
    const uit: [string, number | string][] = [];
    const zet = async (label: string, q: any) => uit.push([label, await getal(db, q)]);

    await zet("Kandidaten totaal", sql`select count(*) from candidates`);
    for (const s of ["in_behandeling", "gepland", "aangenomen", "afgewezen"]) await zet(`  status ${s}`, sql`select count(*) from candidates where status = ${s}`);
    await zet("  geanonimiseerd", sql`select count(*) from candidates where anonymized_at is not null`);
    await zet("  met cv", sql`select count(*) from candidates where has_cv = true`);
    const v3 = await bestaat(db, "job_gesprekken");
    if (v3) {
      await zet("  via het nieuwe formulier (versie 3)", sql`select count(*) from candidates where aanmeld_versie = '3'`);
      await zet("Zou de nachtelijke opschoning WISSEN (in_behandeling, geen cv, ouder dan 30 dagen), nieuw formulier", sql`select count(*) from candidates where status = 'in_behandeling' and has_cv = false and created_at < now() - interval '30 days' and aanmeld_versie = '3'`);
    }
    await zet("Zou de nachtelijke opschoning WISSEN, oude formulier", sql`select count(*) from candidates where status = 'in_behandeling' and has_cv = false and created_at < now() - interval '30 days' and coalesce(aanmeld_versie, '') <> '3'`);
    await zet("Komt in het nieuwe scherm Kandidaten (in_behandeling, of gepland zonder datum)", sql`select count(*) from candidates where status = 'in_behandeling' or (status = 'gepland' and interview_date is null)`);
    await zet("  waarvan ouder dan 90 dagen", sql`select count(*) from candidates where (status = 'in_behandeling' or (status = 'gepland' and interview_date is null)) and created_at < now() - interval '90 days'`);
    await zet("Gesprek gepland vanaf vandaag", sql`select count(*) from candidates where status = 'gepland' and interview_date >= current_date`);
    await zet("Gesprek gepland in het verleden, nog niet afgerond", sql`select count(*) from candidates where status = 'gepland' and interview_date < current_date`);

    await zet("Medewerkers totaal", sql`select count(*) from employees`);
    await zet("  gekoppeld aan een kandidaat", sql`select count(*) from employees where candidate_id is not null`);
    await zet("Aangenomen kandidaten zonder gekoppelde medewerker", sql`select count(*) from candidates c where c.status = 'aangenomen' and not exists (select 1 from employees e where e.candidate_id = c.id)`);
    await zet("  waarvan met een medewerker op hetzelfde e-mailadres", sql`select count(*) from candidates c where c.status = 'aangenomen' and not exists (select 1 from employees e where e.candidate_id = c.id) and exists (select 1 from employees e where lower(e.email) = lower(c.email))`);
    await zet("Oude intakes (applications)", sql`select count(*) from applications`);
    if (await bestaat(db, "sollicitant_dossiers")) {
      await zet("Dossiers nieuwe Sollicitanten", sql`select count(*) from sollicitant_dossiers`);
      await zet("  met intake versie 2", sql`select count(*) from sollicitant_dossiers where intake_versie = 2`);
    } else uit.push(["Dossiers nieuwe Sollicitanten", "tabel bestaat nog niet"]);
    if (v3) {
      await zet("Gesprekken met Job", sql`select count(*) from job_gesprekken`);
      await zet("Afspraken via Job", sql`select count(*) from job_afspraken`);
    } else uit.push(["Gesprekken met Job", "tabel bestaat nog niet"]);
    await zet("WhatsApp-berichten in de inbox", sql`select count(*) from whatsapp_messages`);

    // Trechter van de laatste 90 dagen: de nulmeting voor de nieuwe flow. Alleen aantallen.
    const trechter: [string, number | string][] = [];
    const t = async (label: string, q: any) => trechter.push([label, await getal(db, q)]);
    const sinds = sql`created_at >= now() - interval '90 days'`;
    await t("Aanmeldingen", sql`select count(*) from candidates where ${sinds}`);
    await t("  met een gespreksdatum (nu of ooit gepland)", sql`select count(*) from candidates where ${sinds} and interview_date is not null`);
    await t("  aangenomen", sql`select count(*) from candidates where ${sinds} and status = 'aangenomen'`);
    await t("  afgewezen", sql`select count(*) from candidates where ${sinds} and status = 'afgewezen'`);
    await t("  afgewezen zonder gespreksdatum", sql`select count(*) from candidates where ${sinds} and status = 'afgewezen' and interview_date is null`);
    await t("  nog in behandeling", sql`select count(*) from candidates where ${sinds} and status = 'in_behandeling'`);
    const lijst = async (q: any): Promise<any[]> => { try { const r: any = await db.execute(q); return r.rows ?? r; } catch { return []; } };
    const redenen = await lijst(sql`select coalesce(nullif(rejection_reason, ''), '(geen reden)') as naam, count(*)::int as n from candidates where ${sinds} and status = 'afgewezen' group by 1 order by 2 desc limit 10`);
    const bronnen = await lijst(sql`select coalesce(nullif(source_channel, ''), '(onbekend)') as naam, count(*)::int as n, count(*) filter (where status = 'aangenomen')::int as aangenomen from candidates where ${sinds} group by 1 order by 2 desc limit 12`);
    const functies = await lijst(sql`select function_type::text as naam, count(*)::int as n, count(*) filter (where status = 'aangenomen')::int as aangenomen from candidates where ${sinds} group by 1 order by 2 desc`);

    console.log(`\nControle overgang, ${new Date().toLocaleString("nl-NL")}, database: ${naarProd ? "PRODUCTIE" : "deze omgeving"} (alleen gelezen)\n`);
    const breed = Math.max(...uit.map(([l]) => l.length));
    for (const [l, n] of uit) console.log(`${l.padEnd(breed)}  ${n}`);
    console.log("\nTrechter, aanmeldingen van de laatste 90 dagen\n");
    const breed2 = Math.max(...trechter.map(([l]) => l.length));
    const totaal = typeof trechter[0][1] === "number" ? (trechter[0][1] as number) : 0;
    for (const [l, n] of trechter) console.log(`${l.padEnd(breed2)}  ${String(n).padStart(5)}${typeof n === "number" && totaal > 0 ? `  ${Math.round((n / totaal) * 100)}%` : ""}`);
    if (redenen.length) { console.log("\nAfwijsredenen (laatste 90 dagen)"); for (const r of redenen) console.log(`  ${String(r.naam).slice(0, 50).padEnd(50)}  ${r.n}`); }
    if (bronnen.length) { console.log("\nPer bron: aanmeldingen en aangenomen"); for (const r of bronnen) console.log(`  ${String(r.naam).slice(0, 50).padEnd(50)}  ${String(r.n).padStart(4)}  ${String(r.aangenomen).padStart(3)}`); }
    if (functies.length) { console.log("\nPer functie: aanmeldingen en aangenomen"); for (const r of functies) console.log(`  ${String(r.naam).padEnd(50)}  ${String(r.n).padStart(4)}  ${String(r.aangenomen).padStart(3)}`); }
    console.log("\nEr is niets gewijzigd. Bewaar deze uitkomst en vergelijk hem met de controle na de livegang.");
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((e) => { console.error("Mislukt:", e?.message || e); process.exit(1); });
