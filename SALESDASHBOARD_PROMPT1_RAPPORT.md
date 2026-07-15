# Salesdashboard — Prompt 1: Datafundament (rapport)

Datum: 15 juli 2026 · Omgeving: **dev-database** (test-repl EXTRAATJE). Productie is niet aangeraakt; de migratie draait daar pas mee bij een deploy.

## 1. Wat is er gebouwd

### Database (migratie `migrations/manual/0006_salesdashboard_datafundament/`)
- Nieuwe enums: `crm_categorie` (Hotel | Logistiek | Events) en `crm_potentie` (Laag | Medio | Hoog).
- Nieuwe kolommen op `crm_companies`: `categorie`, `eigenaar_user_id` (FK → users.id), `potentie`, `volgende_actie_datum`, `notities`.
- Nieuwe tabel `activities` (activiteitenlog per bedrijf) + `insertActivitySchema` in `shared/schema.ts`.
- 4 indexen: `crm_companies_categorie_idx`, `crm_companies_eigenaar_idx`, `crm_companies_volgende_actie_idx`, `crm_reminders_company_due_idx`.
- `down.sql` aanwezig voor terugdraaien.

### Migratie-/backfillscript (`scripts/salesdashboard-datafundament.ts`)
Herhaalbaar en idempotent; mapt bestaande `type`-waarden naar `categorie` en vult `potentie` en `volgende_actie_datum` waar mogelijk.

### API (in `server/routes.ts`)
- `salesMiddleware`: toegang voor admins + allowlist `max@doehetextra.nl` / `tommy@doehetextra.nl`. Bewust géén nieuwe rol in het user_role-enum; Tommy blijft `employee`.
- `GET /api/sales/pipeline?categorie=&eigenaar=` — pipeline-overzicht incl. aantal activiteiten per bedrijf.
- `GET /api/sales/mijn-acties?eigenaar=` — achterstallige/vandaag-acties uit bedrijven (volgende_actie_datum) én open reminders.
- `PATCH /api/sales/companies/:id` — alléén de sales-velden (strict schema, onbekende velden → 400). Permissie: eigenaar van de deal of admin.
- **Eigenaar-parameterkeuze**: numeriek = user-id; anders wordt het als e-mailprefix gelezen (`max` → `max@doehetextra.nl`).

### Gebruiker Tommy
- Aangemaakt in de `users`-tabel: id 21, `tommy@doehetextra.nl`, rol `employee`, achternaam voorlopig "TBD".
- **Let op (belangrijke bevinding)**: de app gebruikt voor inloggen een in-memory gebruikerslijst die in code wordt geseed (test-omgevingspatroon, net als admin@extra.nl). Max (id 19) en Tommy (id 21) zijn daarom óók als seed-gebruikers toegevoegd met dezelfde id's als in de database, zodat de deal-eigenaarcheck klopt.
- Wachtwoorden staan **niet** in code of git: ze komen uit de development-omgevingsvariabelen `SALES_MAX_PASSWORD` en `SALES_TOMMY_PASSWORD` (Secrets/Env-paneel). Zonder deze variabelen wordt het account niet geseed. De actuele tijdelijke wachtwoorden staan in de chat.

## 2. Datatellingen na backfill (dev, 287 bedrijven)

| Categorie | Aantal |
|---|---|
| Hotel | 7 |
| Events | 3 |
| (leeg/NULL) | 277 |

Bronwaarden die tot NULL leidden: `logistiek` **274×**, `restaurant` 2×, `cateraar` 1×.

> **Spec-afwijking, expliciet gemeld:** de prompt gaf geen mapping voor de bronwaarde `logistiek` (kleine letters) naar de categorie `Logistiek`. Conform de prompt is deze dus NIET gemapt en op NULL gelaten — dit betreft wel 274 van de 287 records. Eén regel toevoegen aan het script lost dit op als dat gewenst is.

| Potentie | Aantal |
|---|---|
| Hoog | 6 |
| Medio | 5 |
| Laag | 2 |
| (leeg) | 274 |

- `volgende_actie_datum` gevuld: **2,1%** (0 datums konden uit reminders worden afgeleid).
- Legacy `phase`-waarden gevonden: `in_gesprek` 1× en NULL 5× — ongewijzigd gelaten (non-destructief).

## 3. Curl-tests (alle geslaagd, 15 juli 2026)

| Test | Verwacht | Resultaat |
|---|---|---|
| Login Tommy | 200 | ✅ 200, sessie voor user 21 |
| GET /api/sales/pipeline (zonder login) | 401 | ✅ 401 "Niet ingelogd" |
| GET /api/sales/pipeline (Tommy) | 200 | ✅ 200, lijst met categorie/potentie/eigenaar/activiteiten-teller |
| GET /api/sales/pipeline?categorie=Hotel&eigenaar=tommy | 200 | ✅ 200, alleen Van der Valk Almere (id 4, eigenaar 21) |
| GET /api/sales/mijn-acties?eigenaar=tommy | 200 | ✅ 200; leeg bij toekomstige datum, 1 item met `daysOverdue: 1` bij datum gisteren |
| PATCH eigen deal (id 4) | 200 | ✅ 200, phase/datum/notities bijgewerkt |
| PATCH andermans deal (id 1) als Tommy | 403 | ✅ 403 "Alleen de eigenaar of een admin" |
| PATCH met verboden veld `owner` | 400 | ✅ 400 "Unrecognized key(s): 'owner'" |
| GET /api/admin/crm/companies als Tommy | 403 | ✅ 403 (admin-routes blijven afgeschermd) |
| PATCH andermans deal als Max (admin) | 200 | ✅ 200 |

Regressiecheck bestaande CRM als admin: `/api/admin/crm/companies`, `/contacts`, `/reminders` → allemaal 200. Bestaande CRM-routes zijn ongewijzigd.

## 4. Openstaand / vervolg
- Beslissen of bronwaarde `logistiek` alsnog naar categorie `Logistiek` gemapt moet worden (274 records).
- Achternaam Tommy invullen (nu "TBD").
- Bij deploy: migratie 0006 + backfillscript op productie draaien.
