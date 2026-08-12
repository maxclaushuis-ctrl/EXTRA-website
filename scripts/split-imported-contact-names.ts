/**
 * npm run contacten:split-namen
 *
 * Eenmalige backfill: vult first_name/last_name op alle bestaande rijen in
 * whatsapp_imported_contacts (de ~5500 geïmporteerde telefooncontacten, zie
 * scripts/import-contacten.ts) die deze velden nog niet hebben.
 *
 * Gebruikt de best-effort splitsregel uit server/whatsapp/nameLogic.ts
 * (eerste woord = voornaam, de rest = achternaam) — zie de doc-comment
 * daar voor de bekende beperkingen (bijv. "Chef Jan", namen van één woord).
 * GEEN garantie dat dit voor elk contact klopt; bedoeld als startpunt dat
 * per contact handmatig te corrigeren blijft (ProfilePanel), niet als
 * eindstation.
 *
 * Idempotent en veilig herhaald te draaien: raakt UITSLUITEND rijen waar
 * first_name EN last_name allebei nog NULL zijn. Een eerdere handmatige
 * correctie (of een latere run die al iets invulde) wordt dus nooit
 * overschreven — ook niet als dit script per ongeluk twee keer draait.
 *
 * Draaien: npm run contacten:split-namen  (eenmalig, in de Shell — geen endpoint)
 */
import { and, isNull, sql } from "drizzle-orm";
import { db, pool } from "../server/db";
import { whatsappImportedContacts } from "@shared/schema";
import { splitFullName } from "../server/whatsapp/nameLogic";

const BATCH_SIZE = 500;

async function main() {
  console.log("=== Backfill voornaam/achternaam geïmporteerde contacten (eenmalig) ===\n");

  const rijen = await db
    .select({
      id: whatsappImportedContacts.id,
      name: whatsappImportedContacts.name,
    })
    .from(whatsappImportedContacts)
    .where(
      and(
        isNull(whatsappImportedContacts.firstName),
        isNull(whatsappImportedContacts.lastName),
      ),
    );

  const totaalRijen = rijen.length;
  console.log(`Rijen zonder voornaam/achternaam gevonden: ${totaalRijen}`);
  if (totaalRijen === 0) {
    console.log("Niets te doen — alle rijen hebben al een voornaam/achternaam.");
    return;
  }

  let verwerktTotaal = 0;
  let eenWoordTotaal = 0;
  let legeNaamTotaal = 0;

  type BatchItem = { id: number; firstName: string; lastName: string };
  let batch: BatchItem[] = [];

  async function batchWegschrijven() {
    if (batch.length === 0) return;
    await Promise.all(
      batch.map((item) =>
        db
          .update(whatsappImportedContacts)
          .set({ firstName: item.firstName, lastName: item.lastName })
          .where(
            and(
              sql`${whatsappImportedContacts.id} = ${item.id}`,
              isNull(whatsappImportedContacts.firstName),
              isNull(whatsappImportedContacts.lastName),
            ),
          ),
      ),
    );
    batch = [];
  }

  for (const rij of rijen) {
    const { firstName, lastName } = splitFullName(rij.name);

    if (!firstName) {
      legeNaamTotaal++;
    } else if (!lastName) {
      eenWoordTotaal++;
    }

    batch.push({ id: rij.id, firstName, lastName });
    verwerktTotaal++;

    if (batch.length >= BATCH_SIZE) {
      await batchWegschrijven();
      process.stdout.write(`\r${verwerktTotaal} / ${totaalRijen} verwerkt...`);
    }
  }
  await batchWegschrijven();
  process.stdout.write(`\r${verwerktTotaal} / ${totaalRijen} verwerkt...\n`);

  console.log("\n=== Rapport ===");
  console.log(`Totaal bijgewerkt:                    ${verwerktTotaal}`);
  console.log(
    `  waarvan naam van één woord (last_name leeg): ${eenWoordTotaal} — minst betrouwbare split, extra aandacht bij handmatige controle waard`,
  );
  if (legeNaamTotaal > 0) {
    console.log(
      `  waarvan geheel lege naam:           ${legeNaamTotaal} — first_name/last_name blijven dan beide leeg`,
    );
  }
  console.log(
    "\nKlaar. Dit is een best-effort gok — per contact achteraf handmatig te corrigeren in het profielpaneel.",
  );
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\nFout tijdens backfill:", err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
