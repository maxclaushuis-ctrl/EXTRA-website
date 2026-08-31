# WhatsApp-integratie — Fase 1

Persistente WhatsApp-laag bovenop **360dialog Cloud API v1**, met een
**provider-switch naar de directe Meta Cloud API** (zie
[Meta Cloud API (Coexistence)](#meta-cloud-api-coexistence) hieronder).
Berichten + gesprekken in `whatsapp_messages` + `whatsapp_conversations`,
auto-koppeling aan `candidates` / `prospect_contacts`.

## Architectuur

```
360dialog Cloud  ──webhook──▶  /api/whatsapp/webhook/<SECRET>
       ▲                              │
       │ POST /messages               ▼
       │                       matcher.ts (telefoon → candidate/prospect)
       │                              │
       │                              ▼
   /api/whatsapp/stuur ─────▶  whatsapp_messages + whatsapp_conversations
                                      │
                                      ▼
                       /api/whatsapp/conversations[/...]
                                      │
                                      ▼
                            client/.../WhatsAppBeheer.tsx
```

## Vereiste environment-variabelen

| Naam | Doel | Hoe te genereren |
|---|---|---|
| `WHATSAPP_360_API_KEY` | API-key voor 360dialog Cloud API | Krijg je van 360dialog na onboarding |
| `WHATSAPP_WEBHOOK_SECRET` | Geheime tokenwaarde in webhook-URL | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `WHATSAPP_PROVIDER` | Verzend-provider: `360dialog` (default) of `meta` | Zet pas op `meta` bij de cutover — zie livegang-checklist |

⚠️ Gebruik altijd de **www**-hostnaam. De apex `doehetextra.nl` stuurt sinds
17 augustus met een 301 door naar www, en een webhook-verzender volgt geen
redirect: die ziet een 3xx, telt het als mislukte aflevering en stopt na zijn
retry-window. `/api` is inmiddels uitgezonderd van die redirect
(`server/wwwRedirect.ts`), maar registreer hem toch op www.

⚠️ Zonder `WHATSAPP_WEBHOOK_SECRET` accepteert de webhook **geen** inkomende
berichten. Zonder `WHATSAPP_360_API_KEY` werkt versturen niet.

## Webhook bij 360dialog instellen

De webhook-URL die je bij 360dialog moet zetten is:

```
https://www.doehetextra.nl/api/whatsapp/webhook/<WHATSAPP_WEBHOOK_SECRET>
```

(de hele waarde van het secret achter de schuine streep)

Twee opties:

1. **Via de admin-UI** — open *Dashboard → WhatsApp* en klik op
   *Webhook registreren*. Werkt op de meeste 360dialog accounts.
2. **Via 360dialog support** — als optie 1 een 400/permission-error
   teruggeeft, mail support@360dialog.com en vraag:
   > Please set webhook URL for our channel to:
   > `https://www.doehetextra.nl/api/whatsapp/webhook/<SECRET>`

## Bij rotatie van het secret

1. Genereer een nieuwe waarde
2. Zet `WHATSAPP_WEBHOOK_SECRET` om naar de nieuwe waarde (env)
3. Restart de app
4. Open de admin-UI → klik *Webhook registreren* (of mail 360dialog support
   met de nieuwe URL)
5. Verifieer met een test-bericht

⚠️ Tussen stap 3 en stap 4 zal 360dialog blijven proberen te POSTen naar de
oude URL → 401 → ze stoppen na hun retry-window. Plan de rotatie buiten
piekuren.

## Meta Cloud API (Coexistence)

Fase 1 van de migratie 360dialog → directe Meta Cloud API. Beide providers
bestaan naast elkaar; `WHATSAPP_PROVIDER` bepaalt via welke het **uitgaande**
verkeer loopt (`server/whatsapp/provider.ts`). De 360dialog-webhook blijft
gewoon werken tot de cutover; de Meta-webhook kan er parallel naast draaien.

### Env-variabelen (Meta)

| Naam | Doel |
|---|---|
| `META_WA_BOT_ACCESS_TOKEN` | System-user access token (permanent) met `whatsapp_business_messaging` |
| `META_WA_BOT_PHONE_NUMBER_ID` | Phone Number ID (App → WhatsApp → API Setup) |
| `META_WA_BOT_WABA_ID` | WhatsApp Business Account ID |
| `META_WA_BOT_APP_SECRET` | App Secret (App → Settings → Basic) — webhook signature-verificatie |
| `META_WA_BOT_VERIFY_TOKEN` | Zelfgekozen string voor de GET verify-handshake |
| `WHATSAPP_PROVIDER` | `meta` om uitgaand verkeer via Meta te sturen (default: `360dialog`) |

### Webhook registreren in Meta Business Manager

App → WhatsApp → Configuration → Webhook:

```
Callback URL:  https://www.doehetextra.nl/api/whatsapp/meta-webhook
Verify token:  <waarde van META_WA_BOT_VERIFY_TOKEN>
```

Subscribe daarna op het webhook-field **`messages`** (dekt zowel inkomende
berichten als status-updates). De POST-events worden geverifieerd via
`X-Hub-Signature-256` (HMAC-SHA256 over de raw body met het App Secret);
ongeldige signatures krijgen 403, en zonder `META_WA_BOT_APP_SECRET` weigert
het endpoint alles met 503. De verwerking (matching, idempotentie, STOP,
opt-out, auto-reply) is exact dezelfde als bij de 360dialog-webhook
(`server/whatsapp/inboundProcessor.ts`).

### Livegang-checklist (cutover naar Meta)

1. Zet `META_WA_BOT_ACCESS_TOKEN`, `META_WA_BOT_PHONE_NUMBER_ID`,
   `META_WA_BOT_WABA_ID` en `META_WA_BOT_APP_SECRET` in de env.
2. Kies een `META_WA_BOT_VERIFY_TOKEN` (random string, bv.
   `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`)
   en zet die ook in de env. Restart de app.
3. Registreer de webhook in Meta Business Manager (zie hierboven) — de GET
   verify-handshake moet direct slagen — en subscribe op **messages**.
4. Test inbound: stuur een WhatsApp-bericht naar het nummer en controleer dat
   het in de inbox verschijnt (log: `[WA meta-webhook] inbound …`).
5. Zet `WHATSAPP_PROVIDER=meta` en restart. Uitgaand verkeer (stuur,
   stuur-media, bulk, auto-reply, templates) loopt nu via de Graph API.
6. Test outbound: verstuur een testbericht vanuit de admin-inbox en controleer
   status-updates (sent → delivered → read) via de Meta-webhook.
7. Rollback nodig? Zet `WHATSAPP_PROVIDER` terug op `360dialog` en restart —
   de 360dialog-code is onaangetast.

⚠️ Let op bij coexistence: zolang het nummer nog bij 360dialog gehost wordt,
kan hetzelfde nummer niet tegelijk bij Meta direct actief zijn — de webhook-
registratie en handshake kunnen wél alvast, maar echte inbound-events komen
pas na de nummer-migratie bij Meta binnen.

## Endpoints

| Methode | Pad | Auth |
|---|---|---|
| GET  | `/api/whatsapp/accounts` | admin |
| POST | `/api/whatsapp/stuur` | admin + rate-limit |
| GET  | `/api/whatsapp/conversations?category=candidate\|prospect\|unmatched&limit=50&offset=0` | admin |
| GET  | `/api/whatsapp/conversations/:phone/messages?limit=50` | admin |
| POST | `/api/whatsapp/conversations/:phone/mark-read` | admin |
| GET  | `/api/whatsapp/stats` | admin |
| GET  | `/api/whatsapp/webhook/:secret` | secret-check (360dialog) |
| POST | `/api/whatsapp/webhook/:secret` | secret-check (360dialog) |
| GET  | `/api/whatsapp/meta-webhook` | verify-handshake (Meta) |
| POST | `/api/whatsapp/meta-webhook` | X-Hub-Signature-256 (Meta) |
| POST | `/api/whatsapp/registreer-webhook` | admin |
| GET  | `/api/whatsapp/webhook-status` | admin |

## Tests

```bash
# unit-tests phone-normalisatie
npx tsx server/whatsapp/__tests__/phone.test.ts

# unit-tests Meta-webhook (signature, handshake, payload-verwerking; geen DB nodig)
npx tsx server/whatsapp/__tests__/metaWebhook.test.ts

# unit-tests Meta-client + provider-switch (fetch gemockt; geen DB nodig)
npx tsx server/whatsapp/__tests__/metaClient.test.ts

# integration-tests webhook (vereist draaiende server + WHATSAPP_WEBHOOK_SECRET)
npm run dev   # in andere terminal
npx tsx server/whatsapp/__tests__/webhook.test.ts
```

## Migratie bestaande telefoonnummers

```bash
# rapport zonder schrijven
npx tsx server/whatsapp/migrate-phones.ts

# echt uitvoeren
npx tsx server/whatsapp/migrate-phones.ts --apply
```

Maakt backup van originele waardes in `candidates.phone_original` /
`prospect_contacts.telefoon_original`. Ongeldige nummers worden gelogd in
`phone_normalization_issues` (`SELECT * FROM phone_normalization_issues`).

## Niet in deze fase

- Templates (Fase 2)
- Bot / Claude integratie (Fase 3)
- Koppeling met diensten/planning (Fase 3)
- Inkomende media downloaden (alleen het media-id wordt opgeslagen)

## Gearchiveerd

`_archived/baileys-manager.ts.bak` — de oude zelf-gehoste Baileys-poging.
Werkte niet op cloud-IP's (WhatsApp 405). Bewaard voor referentie.
