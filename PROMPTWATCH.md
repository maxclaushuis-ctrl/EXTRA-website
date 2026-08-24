# Promptwatch — installatie en verificatie

Opzet volgens de briefing en bouwopdracht van Wrkt Digital (Sebastian,
20-08-2026). Twee onderdelen:

1. **Browserscript** in `client/index.html` — meet echte bezoekers.
   Project-ID `5730fb42-85a9-4270-8ba6-1f96120c1d22` (specifiek voor EXTRA,
   niet aanpassen). Staat sitebreed: de hele site is één SPA-template, dus
   elke pagina — ook landingspagina's en blogs — laadt dezelfde `<head>`.
2. **Logdoorstuur** in `server/promptwatchLogs.ts` — maakt AI-crawlers
   zichtbaar die geen JavaScript uitvoeren. Gekozen route: **applicatie-
   middleware** (optie c uit de bouwopdracht). De site draait op Replit
   zonder eigen CDN-laag of toegang tot serverlogs buiten de app, dus
   CDN/edge (a) en een log-shipper (b) zijn hier niet mogelijk. HTML wordt
   door de eigen Express-app geserveerd (geen externe cache ervoor), dus de
   middleware ziet al het crawlerverkeer dat we willen meten.

## Deploystappen

1. Zet de API-key als **Replit Secret** met de naam
   `PROMPTWATCH_LOGS_API_KEY` (Tools → Secrets). De key komt via een apart,
   veilig kanaal van Wrkt Digital — nooit in code, chat of mail plakken.
   Zonder deze secret is de doorstuur een no-op en logt de server bij het
   opstarten: `Promptwatch logdoorstuur uit`.
2. Deploy (Republish). Bij het opstarten hoort in de logs te staan:
   `Promptwatch logdoorstuur actief`.

## Verificatie

- **Endpoint + key**: `npm run promptwatch:test` verstuurt één
  voorbeeld-event en drukt de response af. Verwacht: HTTP 200 met
  `"success": true`. Dat het event als `dropped` telt is normaal (het is
  geen echt crawlerverkeer); het gaat om bereikbaarheid en de key.
- **Browserscript**: open drie verschillende pagina's, bekijk de broncode
  (het script staat in de `<head>`) en check in het netwerk-tabblad dat er
  requests naar `ingest.promptwatch.com` gaan.
- **Doorstuur live**: in de deploy-logs verschijnt per flush (elke 60 s bij
  verkeer) een regel als
  `[promptwatch] flush wachtrij: 42 events, received=42 accepted=0 dropped=42 (HTTP 200)`.
  `dropped` is verwacht voor gewoon bezoekersverkeer; `accepted` loopt op
  zodra er een AI-crawler (GPTBot, ClaudeBot, PerplexityBot, …) langskomt.
- **Housetests**: `npm run promptwatchlogs:test` (draait zonder database).

## Gedrag van de doorstuur

- Alle requests worden doorgestuurd (herkenning gebeurt bij Promptwatch);
  batches van max 1000 events, flush elke 60 s of bij 500 events.
- Volledig buiten het request-pad: een trage of onbereikbare endpoint kan
  de site nooit vertragen.
- Netwerkfout of 5xx → batch naar disk-spool + retry met exponential
  backoff (5 s → 5 min). 4xx → loggen en laten vallen, geen retry.
- De spool is begrensd (5 MB); op Replit overleeft hij een procescrash,
  niet een redeploy.
- Geen succesvolle flush gedurende een uur terwijl er wel verkeer is →
  één `[promptwatch] ALERT`-regel per uur in de logs.

## Overige punten uit de briefing

- **robots.txt** (punt 3): al in orde — `client/public/robots.txt` blokkeert
  GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot en Google-Extended niet
  (alleen `/dashboard`, `/profile`, `/rewards` en `/history` staan dicht
  voor iedereen) en de sitemap-verwijzing staat erin.
- **Sitemap** (punt 6): één sitemap op
  `https://www.doehetextra.nl/sitemap.xml` (geen index; bevat alle
  pagina's, blogartikelen en vacatures, inclusief hreflang-alternates voor
  de Engelse versies). Geen subdomeinen of verborgen sitemaps.
- **Privacy**: `client_ip` is een persoonsgegeven. Neem de doorstuur op in
  het verwerkingsregister en controleer dat de verwerkersovereenkomst met
  Promptwatch rond is voordat de secret wordt gezet.
