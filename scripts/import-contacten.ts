/**
 * npm run contacten:import
 *
 * Eenmalige import van telefooncontacten uit Object Storage, om een naam te
 * kunnen tonen bij WhatsApp-nummers die (nog) niet matchen met een kandidaat,
 * medewerker, klant of prospect. Schrijft UITSLUITEND naar de nieuwe, kleine
 * tabel whatsapp_imported_contacts (phone, name, imported_at) — dit is geen
 * kandidaat/medewerker/klant-record en telt nergens in mee.
 *
 * Bron: bucket repl-default-bucket-7c5eba1c-3949-42fa-9952-c5ed7cbbea1d,
 * een .xlsx-bestand onder Objects/ met kolommen Country Code, Country Name,
 * Phone Number, Formatted Phone, Saved Name, Public Name. De exacte
 * bestandsnaam wordt zelf opgezocht (spaties/underscores kunnen afwijken),
 * niet hardcoded.
 *
 * Telefoonnummer-opbouw per rij:
 *   - "Phone Number" begint met "+"  → direct gebruiken.
 *   - begint niet met "+"            → "Country Code" van dezelfde rij ervoor
 *                                       plakken (een eventuele voorloop-0 in
 *                                       Phone Number wordt daarbij weggehaald,
 *                                       zelfde conventie als server/whatsapp/
 *                                       phone.ts voor het NL-standaardpad —
 *                                       anders ontstaat een extra 0 ná de
 *                                       landcode).
 *   - daarna altijd door normalizePhoneDetailed() — nooit een aanname over
 *     het land, altijd de landcode uit die specifieke rij.
 * Naam: kolom "Saved Name". Rijen zonder bruikbaar nummer of zonder naam
 * worden overgeslagen en per reden geteld.
 *
 * Upsert op phone: bestaand nummer krijgt de naam bijgewerkt, nieuw nummer
 * wordt toegevoegd. Herhaald draaien is dus veilig.
 *
 * Draaien: npm run contacten:import  (eenmalig, in de Shell — geen endpoint)
 */
import ExcelJS from "exceljs";
import { sql } from "drizzle-orm";
import { objectStorageClient } from "../server/replit_integrations/object_storage";
import { db, pool } from "../server/db";
import { whatsappImportedContacts } from "@shared/schema";
import { normalizePhoneDetailed, type NormalizationFailure } from "../server/whatsapp/phone";

const BUCKET_NAME = "repl-default-bucket-7c5eba1c-3949-42fa-9952-c5ed7cbbea1d";
const OBJECT_PREFIX = "Objects/";
// Losse spaties/underscores/hoofdletters genegeerd bij het zoeken naar het bestand.
const VERWACHTE_NAAM_FRAGMENT = "individuelecontacten";

const BATCH_SIZE = 500;

type SkipReden = NormalizationFailure | "geen_landcode" | "geen_naam";

function normaliseerVoorVergelijking(naam: string): string {
  return naam.toLowerCase().replace(/[\s_]+/g, "");
}

async function vindBestand(): Promise<string> {
  const bucket = objectStorageClient.bucket(BUCKET_NAME);
  const [files] = await bucket.getFiles({ prefix: OBJECT_PREFIX });
  const xlsxBestanden = files.filter(f => f.name.toLowerCase().endsWith(".xlsx"));

  if (xlsxBestanden.length === 0) {
    throw new Error(
      `Geen .xlsx-bestanden gevonden onder "${OBJECT_PREFIX}" in bucket ${BUCKET_NAME}.`,
    );
  }

  const treffer = xlsxBestanden.find(f =>
    normaliseerVoorVergelijking(f.name).includes(VERWACHTE_NAAM_FRAGMENT),
  );
  if (treffer) return treffer.name;

  if (xlsxBestanden.length === 1) {
    console.log(
      `Let op: bestandsnaam wijkt af van het verwachte patroon, maar er is precies één ` +
        `.xlsx-bestand gevonden — die wordt gebruikt: ${xlsxBestanden[0].name}`,
    );
    return xlsxBestanden[0].name;
  }

  throw new Error(
    `Kan niet automatisch bepalen welk bestand het is — meerdere .xlsx-bestanden gevonden ` +
      `onder "${OBJECT_PREFIX}" en geen ervan bevat "${VERWACHTE_NAAM_FRAGMENT}":\n` +
      xlsxBestanden.map(f => `  - ${f.name}`).join("\n") +
      `\nPas VERWACHTE_NAAM_FRAGMENT in dit script aan, of geef het pad hardcoded op.`,
  );
}

/** Bouwt het te normaliseren kandidaat-nummer op uit Phone Number + Country Code van dezelfde rij. */
function bouwKandidaatNummer(phoneNumberRaw: string, countryCodeRaw: string): { kandidaat: string | null; reden?: "geen_landcode" } {
  const phone = phoneNumberRaw.trim();
  if (phone.startsWith("+")) return { kandidaat: phone };

  const ccDigits = countryCodeRaw.replace(/\D+/g, "");
  if (!ccDigits) return { kandidaat: null, reden: "geen_landcode" };

  const phoneDigits = phone.replace(/\D+/g, "");

  // "Phone Number bevat meestal al een landcode" (zie scriptkop) — als de
  // cijferreeks al met de landcode van deze rij begint, NIET nogmaals plakken,
  // anders ontstaat bijv. landcode "31" + nummer "31612345678" =
  // "3131612345678" (landcode dubbel). Dit kwam in een losse test met
  // voorbeeldgetallen aan het licht, dus expliciet afgevangen.
  if (phoneDigits.startsWith(ccDigits)) {
    return { kandidaat: `+${phoneDigits}` };
  }

  // Voorloop-0 van het lokale nummer weghalen vóór het plakken van de landcode —
  // anders ontstaat bijv. "31" + "0612345678" = "310612345678" (extra 0 ná de
  // landcode, een ongeldig nummer). Zelfde conventie als phone.ts hanteert voor
  // het NL-standaardpad.
  const lokaalDigits = phoneDigits.replace(/^0/, "");
  return { kandidaat: `+${ccDigits}${lokaalDigits}` };
}

async function main() {
  console.log("=== Contactenimport (eenmalig) ===\n");

  const objectName = await vindBestand();
  console.log(`Bestand gevonden: ${objectName}`);

  const file = objectStorageClient.bucket(BUCKET_NAME).file(objectName);
  const [buffer] = await file.download();
  console.log(`Opgehaald (${(buffer.length / 1024).toFixed(0)} KB), inlezen...\n`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Werkblad niet gevonden in het xlsx-bestand.");

  const headerRow = sheet.getRow(1);
  const kolomIndex: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    kolomIndex[String(cell.value ?? "").trim()] = colNumber;
  });

  const verplichteKolommen = ["Country Code", "Phone Number", "Saved Name"];
  for (const kolom of verplichteKolommen) {
    if (!kolomIndex[kolom]) {
      throw new Error(
        `Verwachte kolom "${kolom}" niet gevonden. Gevonden kolommen: ${Object.keys(kolomIndex).join(", ")}`,
      );
    }
  }

  function cel(row: ExcelJS.Row, kolomNaam: string): string {
    const col = kolomIndex[kolomNaam];
    if (!col) return "";
    const raw = row.getCell(col).value;
    if (raw == null) return "";
    if (typeof raw === "object" && "text" in (raw as any)) return String((raw as any).text ?? "");
    if (typeof raw === "object" && "result" in (raw as any)) return String((raw as any).result ?? "");
    return String(raw).trim();
  }

  let verwerktTotaal = 0;
  const overgeslagen: Record<SkipReden, number> = {
    empty: 0,
    no_digits: 0,
    too_short: 0,
    too_long: 0,
    invalid_country: 0,
    geen_landcode: 0,
    geen_naam: 0,
  };
  const uniekeNummers = new Set<string>();
  let batch: { phone: string; name: string }[] = [];

  async function batchWegschrijven() {
    if (batch.length === 0) return;
    await db
      .insert(whatsappImportedContacts)
      .values(batch)
      .onConflictDoUpdate({
        target: whatsappImportedContacts.phone,
        set: { name: sql`excluded.name` },
      });
    batch = [];
  }

  const totaalRijen = sheet.rowCount - 1;
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (row.cellCount === 0) continue;

    const phoneNumberRaw = cel(row, "Phone Number");
    const countryCodeRaw = cel(row, "Country Code");
    const savedName = cel(row, "Saved Name");

    if (!phoneNumberRaw) {
      overgeslagen.empty++;
      continue;
    }

    const { kandidaat, reden } = bouwKandidaatNummer(phoneNumberRaw, countryCodeRaw);
    if (!kandidaat) {
      overgeslagen[reden!]++;
      continue;
    }

    const { normalized, reason } = normalizePhoneDetailed(kandidaat);
    if (!normalized) {
      overgeslagen[reason ?? "invalid_country"]++;
      continue;
    }

    if (!savedName) {
      overgeslagen.geen_naam++;
      continue;
    }

    uniekeNummers.add(normalized);
    batch.push({ phone: normalized, name: savedName });
    verwerktTotaal++;

    if (batch.length >= BATCH_SIZE) {
      await batchWegschrijven();
      process.stdout.write(`\r${verwerktTotaal} / ${totaalRijen} verwerkt...`);
    }
  }
  await batchWegschrijven();

  const totaalOvergeslagen = Object.values(overgeslagen).reduce((a, b) => a + b, 0);

  console.log("\n\n=== Rapport ===");
  console.log(`Totaal aantal regels in het bestand: ${totaalRijen}`);
  console.log(`Verwerkt (upsert gedaan):            ${verwerktTotaal}`);
  console.log(`  waarvan unieke telefoonnummers:     ${uniekeNummers.size} (dubbele regels overschrijven elkaar, laatste wint)`);
  console.log(`Overgeslagen:                         ${totaalOvergeslagen}`);
  for (const [reden, aantal] of Object.entries(overgeslagen)) {
    if (aantal > 0) console.log(`  - ${reden}: ${aantal}`);
  }
  console.log("\nKlaar. Nummers zonder echte match tonen nu, waar bekend, een naam in de WhatsApp-inbox.");
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async err => {
    console.error("\nImport mislukt:", err?.message || err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
