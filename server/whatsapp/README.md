# WhatsApp-integratie — Fase 1

Persistente WhatsApp-laag bovenop **360dialog Cloud API v1**.
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

⚠️ Zonder `WHATSAPP_WEBHOOK_SECRET` accepteert de webhook **geen** inkomende
berichten. Zonder `WHATSAPP_360_API_KEY` werkt versturen niet.

## Webhook bij 360dialog instellen

De webhook-URL die je bij 360dialog moet zetten is:

```
https://doehetextra.nl/api/whatsapp/webhook/<WHATSAPP_WEBHOOK_SECRET>
```

(de hele waarde van het secret achter de schuine streep)

Twee opties:

1. **Via de admin-UI** — open *Dashboard → WhatsApp* en klik op
   *Webhook registreren*. Werkt op de meeste 360dialog accounts.
2. **Via 360dialog support** — als optie 1 een 400/permission-error
   teruggeeft, mail support@360dialog.com en vraag:
   > Please set webhook URL for our channel to:
   > `https://doehetextra.nl/api/whatsapp/webhook/<SECRET>`

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

## Endpoints

| Methode | Pad | Auth |
|---|---|---|
| GET  | `/api/whatsapp/accounts` | admin |
| POST | `/api/whatsapp/stuur` | admin + rate-limit |
| GET  | `/api/whatsapp/conversations?category=candidate\|prospect\|unmatched&limit=50&offset=0` | admin |
| GET  | `/api/whatsapp/conversations/:phone/messages?limit=50` | admin |
| POST | `/api/whatsapp/conversations/:phone/mark-read` | admin |
| GET  | `/api/whatsapp/stats` | admin |
| GET  | `/api/whatsapp/webhook/:secret` | secret-check |
| POST | `/api/whatsapp/webhook/:secret` | secret-check |
| POST | `/api/whatsapp/registreer-webhook` | admin |
| GET  | `/api/whatsapp/webhook-status` | admin |

## Tests

```bash
# unit-tests phone-normalisatie
npx tsx server/whatsapp/__tests__/phone.test.ts

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
