---
name: Planbord applicant.ready contract v2
description: Conventies voor de v2-uitbreiding van de Planbord-webhook (payloadVersion, intake-blok, ervaringsduur-normalisatie)
---

# Planbord `applicant.ready` contract v2

De webhook is uitgebreid van v1 naar v2 **zonder** bestaande v1-velden te wijzigen/verwijderen (puur additief).

## Regels waar alle toekomstige code consistent mee moet zijn
- Top-level `payloadVersion` in de envelope; bron van waarheid = `PLANBORD_PAYLOAD_VERSION` constante.
- `data.intake` is **plat**: alle matching- en beschikbaarheidsvelden staan als directe sleutels onder `intake`, niet genest in sub-objecten.
  - **Why:** de contractspec somt de velden plat op; nesten was een eigen aanname en gaf contractrisico met de ontvangende Planbord-kant.
- Lege-waarde-conventie: sleutels zijn **altijd aanwezig**; ontbrekend / lege string / lege array → `null`.
- Ervaringsduur = `{ raw, code }`. Ontbrekend → `null`; niet-mapbaar → `{ raw, code: 'onbekend' }` + error-log. **Nooit gokken.**
  - Normalisatie mapt beide streepjesvarianten (`-` en `–`) én spatievarianten naar dezelfde code (key = lowercase, `–`→`-`, alle witruimte verwijderd).
  - Twee schalen: Horeca/Logistiek (`geen,m0_6,m6_12,j1_2,j2_3,j3_5,j5_plus`) en Chef/Housekeeping (`j1_3,j3_5,j5_10,j10_plus`).
- Bewust **niet** meesturen in intake: `appearance`, `attitude`, `assessmentRating` (blijven lokaal).

## Hergebruik
`buildIntakePayloadBlock(fd, functionType)` en `normalizeErvaringsduur(...)` zijn de gedeelde helpers; de backfill-export (stap 3) moet exact dezelfde structuur/normalisatie hergebruiken.

## Productie-data lezen in deze repl
- De app draait op een externe Neon-DB via `DATABASE_URL`; `checkDatabase()` (Replit-ingebouwde DB) meldt daarom "not provisioned" — dat is geen fout.
- Productie-data is tóch read-only te lezen via `executeSql({ environment: "production" })` (alleen SELECT). Dev-workspace en productie hebben aparte databases/data.
- Voor de backfill-samenvatting: haal ruwe `function_type` + `form_data` op via de prod-replica, en draai die lokaal door `buildIntakePayloadBlock` (TS-normalisatie kan niet in SQL). Verwijder tijdelijke exportbestanden daarna — `form_data` bevat PII (naam/e-mail/telefoon).
