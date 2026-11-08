# Meta-koppeling voor Job

Dit is het enige wat nog met de hand moet om Job via WhatsApp te laten praten.
Alles daarna (sjablonen indienen, nummer ophalen, berichten lezen) doet het
dashboard zelf. Zet sleutels alleen in de Secrets van Replit, nooit in de chat.

**Let op:** `WHATSAPP_PROVIDER=meta` zet al het uitgaande WhatsApp-verkeer van
die omgeving over van 360dialog naar Meta. Doe dit eerst in EXTRA-test. In
productie pas na een apart besluit, want dan verandert de bestaande koppeling.

## 1. In Meta (business.facebook.com en developers.facebook.com)

1. Open de Meta-app met het product WhatsApp. Gebruik het nummer dat Job moet
   gebruiken (bij voorkeur een eigen nummer voor Job, niet het kantoornummer
   zolang 360dialog daar nog op draait).
2. Bedrijfsinstellingen, Systeemgebruikers: maak een systeemgebruiker (beheerder),
   wijs de app en het WhatsApp-account toe en genereer een token zonder
   vervaldatum met de rechten `whatsapp_business_messaging` en
   `whatsapp_business_management`.
3. WhatsApp, API-instellingen: noteer het **telefoonnummer-ID** en het
   **WhatsApp Business-account-ID (WABA-ID)**.
4. App-instellingen, Basis: noteer het **app-geheim**.
5. Bedenk zelf een **verify token**: een willekeurige lange tekst.

## 2. In Replit, Secrets

| Secret | Waarde |
| --- | --- |
| `WHATSAPP_PROVIDER` | `meta` |
| `META_WA_BOT_ACCESS_TOKEN` | het token van de systeemgebruiker |
| `META_WA_BOT_PHONE_NUMBER_ID` | het telefoonnummer-ID |
| `META_WA_BOT_WABA_ID` | het WABA-ID |
| `META_WA_BOT_APP_SECRET` | het app-geheim |
| `META_WA_BOT_VERIFY_TOKEN` | je zelfbedachte verify token |
| `JOB_ENABLED` | `1` |

`JOB_WA_NUMMER` en `JOB_WA_SJABLOON_*` zijn niet nodig. Daarna op ▶ (of
publiceren).

## 3. Webhook in Meta

1. WhatsApp, Configuratie, Webhook, Bewerken.
2. Callback-URL: `<adres van de omgeving>/api/whatsapp/meta-webhook`. Het
   dashboard (tabblad Job, kaart WhatsApp-sjablonen bij Meta) toont de juiste
   URL.
3. Verify token: dezelfde tekst als `META_WA_BOT_VERIFY_TOKEN`. Klik
   Verifiëren en opslaan.
4. Bij Webhookvelden: abonneer op **messages**.

## 4. In het dashboard

1. Tabblad Job, kaart **WhatsApp-sjablonen bij Meta**. Controleer: nummer van
   Job staat erbij, verify token en app secret zijn groen.
2. Klik **Indienen bij Meta**. De zes sjablonen staan dan op "in behandeling".
3. Wacht tot ze op "goedgekeurd" staan (meestal minuten, soms een dag). Ververs
   de pagina om de stand te zien. Afgewezen? De reden staat erbij.

## 5. Testen

1. Meld je aan via het aanmeldformulier met je eigen WhatsApp-nummer.
2. Je krijgt het startbericht van Job. Antwoord, typ ook eens MENS en ENGLISH.
3. Controleer in Kandidaten dat het gesprek in het dossier staat.

## Terugdraaien

`JOB_ENABLED` weghalen stopt Job. `WHATSAPP_PROVIDER` weghalen (of op
`360dialog`) zet het verkeer terug naar 360dialog. Er wordt niets verwijderd.
