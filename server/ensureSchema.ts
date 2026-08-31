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
  {
    // Migratie 0013 — zie migrations/manual/0013_wa_imported_contacts/
    omschrijving: "whatsapp_imported_contacts: tabel voor geïmporteerde telefooncontacten",
    uitvoeren: () =>
      db.execute(sql`
        CREATE TABLE IF NOT EXISTS whatsapp_imported_contacts (
          id          serial PRIMARY KEY,
          phone       text NOT NULL,
          name        text NOT NULL,
          imported_at timestamp NOT NULL DEFAULT now()
        )
      `),
  },
  {
    omschrijving: "whatsapp_imported_contacts: unieke index op phone",
    uitvoeren: () =>
      db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS wa_imported_contacts_phone_unique
          ON whatsapp_imported_contacts (phone)
      `),
  },
  {
    // Migratie 0014 — zie migrations/manual/0014_wa_messages_media/
    //
    // media_object_path en media_filename komen uit de wa-media-branch, die
    // net als manual_category ouder is dan dit bestand — dus nooit in een
    // ensure*Schema-stap vastgelegd. Zelfde risico als eerder: de kolommen
    // staan in de code (ChatView en de media-serveerroute gebruiken ze al),
    // maar zonder deze stap is nooit gegarandeerd dat ze ook in de database
    // staan.
    omschrijving: "whatsapp_messages: media_object_path en media_filename",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TABLE whatsapp_messages
          ADD COLUMN IF NOT EXISTS media_object_path text,
          ADD COLUMN IF NOT EXISTS media_filename     text
      `),
  },
  {
    // Migratie 0015 — zie migrations/manual/0015_wa_own_reaction/
    //
    // own_reaction_emoji: de emoji waarmee wij vanuit het dashboard op een
    // bericht reageren (nieuwe functie). Uitsluitend additief.
    omschrijving: "whatsapp_messages: own_reaction_emoji",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TABLE whatsapp_messages
          ADD COLUMN IF NOT EXISTS own_reaction_emoji text
      `),
  },
  {
    // Migratie 0016 — zie migrations/manual/0016_wa_templates/
    omschrijving: "whatsapp_templates: enums (category, status)",
    uitvoeren: () =>
      db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE whatsapp_template_category AS ENUM ('UTILITY', 'MARKETING');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
      `).then(() => db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE whatsapp_template_status AS ENUM ('concept', 'in_review', 'approved', 'rejected');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
      `)),
  },
  {
    // Migratie 0016 — zie migrations/manual/0016_wa_templates/
    omschrijving: "whatsapp_templates: tabel voor templates-beheer (aanmaken/indienen/statussync)",
    uitvoeren: () =>
      db.execute(sql`
        CREATE TABLE IF NOT EXISTS whatsapp_templates (
          id                 serial PRIMARY KEY,
          key                text NOT NULL,
          name               text NOT NULL,
          description        text,
          category           whatsapp_template_category NOT NULL DEFAULT 'UTILITY',
          language           text NOT NULL DEFAULT 'nl',
          body_preview       text NOT NULL DEFAULT '',
          variables          jsonb NOT NULL DEFAULT '[]',
          status             whatsapp_template_status NOT NULL DEFAULT 'concept',
          cta_signup         boolean NOT NULL DEFAULT false,
          button_text        text,
          button_url         text,
          button_dynamic     boolean NOT NULL DEFAULT false,
          button_example     text,
          example_values     jsonb NOT NULL DEFAULT '{}',
          meta_status_reason text,
          meta_status_raw    text,
          submitted_at       timestamp,
          status_synced_at   timestamp,
          created_at         timestamp NOT NULL DEFAULT now(),
          updated_at         timestamp NOT NULL DEFAULT now()
        )
      `),
  },
  {
    omschrijving: "whatsapp_templates: unieke index op key + index op status",
    uitvoeren: () =>
      db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS wa_template_key_unique ON whatsapp_templates (key)
      `).then(() => db.execute(sql`
        CREATE INDEX IF NOT EXISTS wa_template_status_idx ON whatsapp_templates (status)
      `)),
  },
  {
    // Templates versturen loopt via de bestaande groepen/bulkverzending —
    // deze twee kolommen onderscheiden een template-verzending van vrije tekst.
    omschrijving: "whatsapp_bulk_sends: template_key en reason (voor template-verzendingen)",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TABLE whatsapp_bulk_sends
          ADD COLUMN IF NOT EXISTS template_key text,
          ADD COLUMN IF NOT EXISTS reason       text
      `),
  },
  {
    // Migratie 0017 — zie migrations/manual/0017_wa_group_chats/
    omschrijving: "whatsapp_group_chat_status: enum",
    uitvoeren: () =>
      db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE whatsapp_group_chat_status AS ENUM ('active', 'suspended', 'deleted');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
      `),
  },
  {
    // Migratie 0017 — zie migrations/manual/0017_wa_group_chats/
    omschrijving: "whatsapp_group_chats: tabel voor door EXTRA zelf aangemaakte WhatsApp-groepen (max 8 deelnemers)",
    uitvoeren: () =>
      db.execute(sql`
        CREATE TABLE IF NOT EXISTS whatsapp_group_chats (
          id                     serial PRIMARY KEY,
          provider_group_id      text NOT NULL,
          subject                text NOT NULL,
          description            text,
          invite_link            text,
          join_approval_mode     text NOT NULL DEFAULT 'auto_approve',
          participants           jsonb NOT NULL DEFAULT '[]',
          participant_count      integer NOT NULL DEFAULT 0,
          status                 whatsapp_group_chat_status NOT NULL DEFAULT 'active',
          created_by_user_id     integer REFERENCES users(id) ON DELETE SET NULL,
          created_by_name        text,
          last_message_at        timestamp,
          last_message_preview   text,
          participants_synced_at timestamp,
          created_at             timestamp NOT NULL DEFAULT now(),
          updated_at             timestamp NOT NULL DEFAULT now()
        )
      `),
  },
  {
    omschrijving: "whatsapp_group_chats: unieke index op provider_group_id + index op status",
    uitvoeren: () =>
      db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS wa_group_chat_provider_id_unique ON whatsapp_group_chats (provider_group_id)
      `).then(() => db.execute(sql`
        CREATE INDEX IF NOT EXISTS wa_group_chat_status_idx ON whatsapp_group_chats (status)
      `)),
  },
  {
    // Migratie 0017 — zie migrations/manual/0017_wa_group_chats/
    omschrijving: "whatsapp_group_messages: tabel voor berichten binnen groepsgesprekken",
    uitvoeren: () =>
      db.execute(sql`
        CREATE TABLE IF NOT EXISTS whatsapp_group_messages (
          id                serial PRIMARY KEY,
          group_chat_id     integer NOT NULL REFERENCES whatsapp_group_chats(id) ON DELETE CASCADE,
          direction         whatsapp_direction NOT NULL,
          wa_message_id     text,
          participant_phone text,
          participant_name  text,
          message_type      text NOT NULL DEFAULT 'text',
          body              text,
          raw_payload       jsonb,
          sent_by_user_id   integer REFERENCES users(id) ON DELETE SET NULL,
          sent_by_name      text,
          status            text NOT NULL DEFAULT 'received',
          error_code        text,
          error_message     text,
          created_at        timestamp NOT NULL DEFAULT now()
        )
      `),
  },
  {
    omschrijving: "whatsapp_group_messages: index op groep+tijd, unieke index op wa_message_id",
    uitvoeren: () =>
      db.execute(sql`
        CREATE INDEX IF NOT EXISTS wa_group_msg_group_idx ON whatsapp_group_messages (group_chat_id, created_at)
      `).then(() => db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS wa_group_msg_wa_id_unique ON whatsapp_group_messages (wa_message_id)
      `)),
  },
  {
    // Migratie 0018 — zie migrations/manual/0018_wa_imported_contacts_namen/
    //
    // first_name/last_name op de eenmalige contactenimport: nodig voor
    // {voornaam}-variabelen in templates. Gevuld via een eenmalig
    // backfillscript (scripts/split-imported-contact-names.ts, best-effort
    // gok op basis van het bestaande name-veld) en daarna per contact vrij
    // te corrigeren — zie server/whatsapp/nameLogic.ts.
    omschrijving: "whatsapp_imported_contacts: first_name en last_name",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TABLE whatsapp_imported_contacts
          ADD COLUMN IF NOT EXISTS first_name text,
          ADD COLUMN IF NOT EXISTS last_name  text
      `),
  },
  {
    // Migratie 0019 — zie migrations/manual/0019_assistant_kennis/
    //
    // Kennisbank van de dashboard-AI-assistent: door het team vastgelegde
    // begrippen/werkafspraken die bij elke vraag in de systeemprompt
    // meegaan. Zie shared/schema.ts (assistantKennis) en
    // server/assistant/assistent.ts.
    omschrijving: "assistant_kennis: kennisbank voor de dashboard-AI-assistent",
    uitvoeren: () =>
      db.execute(sql`
        CREATE TABLE IF NOT EXISTS assistant_kennis (
          id         serial PRIMARY KEY,
          titel      text NOT NULL,
          tekst      text NOT NULL,
          enabled    boolean NOT NULL DEFAULT true,
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        )
      `),
  },
  {
    // Migratie 0020 — zie migrations/manual/0020_campagne_extra_contacten/
    //
    // Tegenhanger van excluded_contact_ids: contacten die handmatig aan een
    // campagne zijn toegevoegd en de mail ook krijgen als ze buiten de filters
    // vallen. Zie server/campagneDoelgroep.ts voor de voorrangsregels.
    omschrijving: "prospect_campaigns: handmatig toegevoegde contacten",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TABLE prospect_campaigns
          ADD COLUMN IF NOT EXISTS extra_contact_ids integer[] DEFAULT '{}'
      `),
  },
  {
    // Migratie 0021a — zie migrations/manual/0021_crm_maillijst_koppeling/
    //
    // Moet vóór 0021b: de oude route /api/admin/prospect-contacts/import-crm
    // vulde crm_contact_id al, zonder enige bescherming tegen duplicaten. Staat
    // er nog zo'n duplicaat, dan mislukt het aanmaken van de unieke index — en
    // dat zou alleen als een regel in het log te zien zijn, waarna het hele
    // vangnet stilletjes ontbreekt.
    //
    // De oudste rij houdt de koppeling; de rest raakt hem kwijt en wordt bij de
    // eerstvolgende synchronisatie opnieuw beoordeeld.
    omschrijving: "prospect_contacts: dubbele CRM-koppelingen opruimen",
    uitvoeren: () =>
      db.execute(sql`
        UPDATE prospect_contacts p
           SET crm_contact_id = NULL
         WHERE p.crm_contact_id IS NOT NULL
           AND p.id <> (
             SELECT MIN(q.id) FROM prospect_contacts q
              WHERE q.crm_contact_id = p.crm_contact_id
           )
      `),
  },
  {
    // Migratie 0021b — zie migrations/manual/0021_crm_maillijst_koppeling/
    //
    // Het CRM is sinds de samenvoeging de bron van de verzendlijst. De koppeling
    // loopt via prospect_contacts.crm_contact_id; deze index zorgt dat één
    // CRM-contactpersoon nooit twee verzendrijen krijgt. Zonder dat vangnet
    // krijgt iemand alles dubbel — ook iemand die zich bij de ene rij afmeldde.
    omschrijving: "prospect_contacts: unieke koppeling met crm_contacts",
    uitvoeren: () =>
      db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS prospect_contacts_crm_contact_id_uidx
          ON prospect_contacts (crm_contact_id)
          WHERE crm_contact_id IS NOT NULL
      `),
  },
  {
    // Migratie 0023 — zie migrations/manual/0023_contact_berichten/
    //
    // Het contactformulier op /contact deed bij verzenden alleen een
    // console.log() in de browser, terwijl de bezoeker "Bericht verzonden" te
    // zien kreeg. Alles wat daar ooit is ingevuld, is verloren gegaan. Elk
    // bericht gaat nu naar kantoor én in deze tabel: de mail is de werkstroom,
    // de tabel het vangnet bij een storing van de mailservice.
    //
    // 0022 is bewust overgeslagen: dat nummer hoort bij de Engelse-vacatures-
    // migratie die nog niet is toegepast.
    omschrijving: "contact_berichten: berichten uit het contactformulier bewaren",
    uitvoeren: () =>
      db.execute(sql`
        CREATE TABLE IF NOT EXISTS contact_berichten (
          id          serial PRIMARY KEY,
          naam        text NOT NULL,
          email       text NOT NULL,
          bericht     text NOT NULL,
          pagina      text,
          afgehandeld boolean NOT NULL DEFAULT false,
          created_at  timestamp DEFAULT now()
        )
      `),
  },
  {
    // Zonder deze stap mislukt het aanmaken van de dashboardmelding bij een
    // nieuw contactbericht: Postgres kent de enumwaarde dan nog niet en
    // weigert de insert. Dat zou stil gebeuren (de aanroep heeft een .catch),
    // dus juist hier hoort het vangnet.
    omschrijving: "admin_notification_type: waarde contact_bericht toevoegen",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TYPE admin_notification_type ADD VALUE IF NOT EXISTS 'contact_bericht'
      `),
  },
  {
    omschrijving: "contact_berichten: index op created_at",
    uitvoeren: () =>
      db.execute(sql`
        CREATE INDEX IF NOT EXISTS contact_berichten_created_at_idx
          ON contact_berichten (created_at DESC)
      `),
  },
  {
    // Migratie 0024 — zie migrations/manual/0024_candidates_nationality_iso/
    // Twee nieuwe kolommen naast het bestaande vrije-tekstveld nationality.
    // Puur additief: geen bestaande waarde wordt aangeraakt, beide kolommen
    // beginnen leeg en worden alleen gevuld waar de naam exact matcht.
    omschrijving: "candidates: nationality_iso en nationality_zone",
    uitvoeren: () =>
      db.execute(sql`
        ALTER TABLE candidates
          ADD COLUMN IF NOT EXISTS nationality_iso  text,
          ADD COLUMN IF NOT EXISTS nationality_zone text
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
