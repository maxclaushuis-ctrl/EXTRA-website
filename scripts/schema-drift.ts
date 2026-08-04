/**
 * npm run db:drift
 *
 * Vergelijkt shared/schema.ts met de database waar DATABASE_URL naar wijst en
 * meldt wat de code verwacht maar de database mist. Alleen-lezen: dit script
 * wijzigt niets, het rapporteert alleen.
 *
 * Aanleiding: op 4 augustus 2026 stond Leads & Prospects op "0 van 0 bedrijven"
 * omdat vijf kolommen wel in het codeschema stonden en niet in de database. Met
 * deze controle is dat in twee seconden zichtbaar in plaats van na een week.
 *
 * Afsluitcode 1 bij afwijkingen, zodat het ook in een pipeline bruikbaar is.
 */
import { bepaalSchemaDrift } from "../server/ensureSchema";
import { pool } from "../server/db";

async function main() {
  const afwijkingen = await bepaalSchemaDrift();

  if (afwijkingen.length === 0) {
    console.log("✓ De database loopt gelijk met shared/schema.ts — geen ontbrekende tabellen of kolommen.");
    return 0;
  }

  const tabellen = afwijkingen.filter(a => a.soort === "tabel");
  const kolommen = afwijkingen.filter(a => a.soort === "kolom");

  console.log(`✗ ${afwijkingen.length} afwijking(en) gevonden.\n`);

  if (tabellen.length > 0) {
    console.log(`Ontbrekende tabellen (${tabellen.length}):`);
    for (const a of tabellen) console.log(`  • ${a.tabel}`);
    console.log("");
  }

  if (kolommen.length > 0) {
    console.log(`Ontbrekende kolommen (${kolommen.length}):`);
    for (const a of kolommen) console.log(`  • ${a.tabel}.${a.kolom}`);
    console.log("");
  }

  console.log(
    "Let op: elke query die zo'n kolom aanraakt mislukt volledig — Postgres geeft\n" +
      '"column does not exist" en de hele route valt om, niet alleen dat ene veld.\n\n' +
      "Aanvullen doe je in server/ensureSchema.ts (één ALTER TABLE ... ADD COLUMN\n" +
      "IF NOT EXISTS erbij) en met dezelfde SQL in migrations/manual/, zodat de\n" +
      "reeks compleet blijft. Bij de eerstvolgende serverstart is het opgelost.",
  );
  return 1;
}

main()
  .then(async code => {
    await pool.end();
    process.exit(code);
  })
  .catch(async err => {
    console.error("Driftcontrole mislukt:", err?.message || err);
    await pool.end().catch(() => {});
    process.exit(2);
  });
