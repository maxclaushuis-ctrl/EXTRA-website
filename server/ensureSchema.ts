/**
 * Centrale schema-aanvulling bij het opstarten van de server.
 *
 * WAAROM DIT BESTAAT
 * ------------------
 * Op 4 augustus 2026 stond Leads & Prospects op "0 van 0 bedrijven" terwijl er
 * gewoon 965 bedrijven in de database zaten. Oorzaak: de kolommen `address`,
 * `postal_code`, `latitude`, `longitude` en `temperature` waren wel aan
 * shared/schema.ts toegevoegd (commit 6aec652), maar nooit aan de database.
 * De server selecteert die kolommen expliciet, Postgres kapte de hele query af
 * met "column does not exist", en de pagina toonde een lege lijst.
 *
 * Het pijnlijke is dat dit patroon al bestond — ensureSalesflowSchema() en
 * ensureAuthResetSchema() doen precies dit — maar niet consequent werd
 * toegepast. Dit bestand is de plek waar het voortaan wél gebeurt: één lijst
 * met additieve stappen die bij elke start draait, in dev en in productie,
 * zonder handwerk in de SQL-console.
 *
 * ⚠️ HARDE REGEL — DIT BESTAND VOEGT UITSLUITEND TOE.
 * Geen DROP, geen RENAME, geen TRUNCATE, geen DELETE, geen typewijziging op
 * een bestaande kolom. Alles hieronder moet `IF NOT EXISTS` gebruiken en
 * onbeperkt vaak herhaald kunnen worden zonder effect. Een stap die bestaande
 * data kan aanraken hoort hier niet thuis, maar in een migratie in
 * migrations/manual/ die met de hand en met akkoord wordt gedraaid.
 *
 * Nieuwe kolom nodig? Voeg hem toe aan shared/schema.ts, zet er hieronder één
 * ALTER TABLE ... ADD COLUMN IF NOT EXISTS bij, en leg dezelfde SQL vast in
 * migrations/manual/ zodat de reeks compleet blijft.
 */
import { sql, is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "@shared/schema";
import { db } from "./db";

type Aanvulling = {
  /** Korte omschrijving, verschijnt in het log als de stap mislukt. */
  omschrijving: string;
  uitvoeren: () => Promise<unknown>;
};

const AANVULLINGEN: Aanvulling[] = [
  {
    // Migratie 0011 — zie migrations/manual/0011_crm_companies_adres_en_temperatuur/
    omschrijving: "crm_companies: adres-, coördinaat- en temperatuurkolommen",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TABLE crm_companies
          ADD COLUMN IF NOT EXISTS address     text,
          ADD COLUMN IF NOT EXISTS postal_code text,
          ADD COLUMN IF NOT EXISTS latitude    real,
          ADD COLUMN IF NOT EXISTS longitude   real,
          ADD COLUMN IF NOT EXISTS temperature text
      `),
  },
  {
    // Migratie 0012 — zie migrations/manual/0012_wa_conversations_manual_category/
    //
    // manual_category is op 5 mei 2026 (commit ec282e3) aan shared/schema.ts
    // toegevoegd, vóórdat dit bestand bestond — en dus nooit in een
    // ensure*Schema-stap terechtgekomen. Zelfde risico als de crm_companies-
    // storing van 4 augustus: de kolom staat in de code (en de dropdown in het
    // WhatsApp-profielpaneel gebruikt hem al), maar niemand heeft ooit
    // gecontroleerd of hij ook echt in de database staat.
    omschrijving: "whatsapp_conversations: manual_category (handmatige tab-override)",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TABLE whatsapp_conversations
          ADD COLUMN IF NOT EXISTS manual_category whatsapp_match_category
      `),
  },
];

/**
 * Voert alle aanvullingen uit. Elke stap heeft een eigen vangnet, zodat één
 * mislukte stap de volgende niet tegenhoudt en de server hoe dan ook opstart —
 * een schemaprobleem mag de site niet plat leggen. Het mag alleen nooit meer
 * stil gebeuren, vandaar het [schema]-voorvoegsel in het log.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  for (const stap of AANVULLINGEN) {
    try {
      await stap.uitvoeren();
    } catch (err: any) {
      console.error(
        `[schema] aanvulling mislukt — ${stap.omschrijving}:`,
        err?.message || err,
      );
    }
  }
}

export type SchemaAfwijking =
  | { soort: "tabel"; tabel: string; kolom?: undefined }
  | { soort: "kolom"; tabel: string; kolom: string };

/**
 * Vergelijkt shared/schema.ts met de database.
 *
 * Bewust géén handmatig bijgehouden lijst van kolomnamen: de tabellen worden
 * rechtstreeks uit de Drizzle-definities gelezen, dus deze controle veroudert
 * niet als er morgen een kolom bijkomt. Alleen-lezen — er wordt niets gewijzigd.
 *
 * Let op: dit meldt wat de code verwacht en de database mist, niet andersom.
 * Een kolom die alleen in de database bestaat is geen fout (oude velden mogen
 * blijven staan), een kolom die de code verwacht en mist wél — dat is precies
 * de storing van 4 augustus.
 */
export async function bepaalSchemaDrift(): Promise<SchemaAfwijking[]> {
  const tabelRijen = ((await db.execute(sql`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `)).rows ?? []) as any[];
  const aanwezigeTabellen = new Set<string>(tabelRijen.map(r => String(r.table_name)));

  const kolomRijen = ((await db.execute(sql`
    SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'
  `)).rows ?? []) as any[];
  const aanwezigeKolommen = new Set<string>(
    kolomRijen.map(r => `${r.table_name}.${r.column_name}`),
  );

  const afwijkingen: SchemaAfwijking[] = [];
  for (const waarde of Object.values(schema as Record<string, unknown>)) {
    if (!is(waarde, PgTable)) continue;
    const config = getTableConfig(waarde as PgTable);
    if (!aanwezigeTabellen.has(config.name)) {
      afwijkingen.push({ soort: "tabel", tabel: config.name });
      continue;
    }
    for (const kolom of config.columns) {
      if (!aanwezigeKolommen.has(`${config.name}.${kolom.name}`)) {
        afwijkingen.push({ soort: "kolom", tabel: config.name, kolom: kolom.name });
      }
    }
  }

  afwijkingen.sort((a, b) =>
    a.tabel === b.tabel
      ? (a.kolom || "").localeCompare(b.kolom || "")
      : a.tabel.localeCompare(b.tabel),
  );
  return afwijkingen;
}

/**
 * Logt de drift bij het opstarten. Had dit er in juli gestaan, dan was
 * "[schema] ontbrekende kolom: crm_companies.address" al bij de eerste publish
 * in de deploy-logs verschenen, in plaats van een week later als een lege
 * leadslijst.
 */
export async function logSchemaDrift(): Promise<void> {
  try {
    const afwijkingen = await bepaalSchemaDrift();
    if (afwijkingen.length === 0) {
      console.log("[schema] database loopt gelijk met shared/schema.ts");
      return;
    }
    console.error(
      `[schema] LET OP — ${afwijkingen.length} afwijking(en) tussen shared/schema.ts en de database:`,
    );
    for (const a of afwijkingen) {
      console.error(
        a.soort === "tabel"
          ? `[schema]   ontbrekende tabel:  ${a.tabel}`
          : `[schema]   ontbrekende kolom:  ${a.tabel}.${a.kolom}`,
      );
    }
    console.error(
      "[schema] Elke query die zo'n kolom aanraakt mislukt volledig. " +
        "Draai `npm run db:drift` voor het volledige rapport en vul aan via server/ensureSchema.ts.",
    );
  } catch (err: any) {
    console.error("[schema] driftcontrole mislukt (niet-kritiek):", err?.message || err);
  }
}
