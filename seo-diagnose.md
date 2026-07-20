# Technische SEO-diagnose — doehetextra.nl

Datum: 15 juli 2026. Uitgevoerd op de gepushte codebase (repo `maxclaushuis-ctrl/EXTRA-website`, branch `main`, commit `f2b73be`). Geen code gewijzigd.

**Methodologie-opmerking (belangrijk voor hoe je dit rapport moet lezen):** ik heb geprobeerd de live site (`www.doehetextra.nl` en `doehetextra.nl`) rechtstreeks te bevragen (robots.txt, ruwe HTML per route, response-headers) om alles ook live te bevestigen. Dat lukte niet — elke poging strandde op `ConnectError` bij het ophalen van `robots.txt`, terwijl hetzelfde gereedschap een controlesite (`example.com`) wél gewoon ophaalde. Het probleem zit dus specifiek bij het bereiken van dit domein vanuit mijn sandbox, niet bij mijn tooling in het algemeen. Een losse zoekopdracht (`site:doehetextra.nl`) bevestigt wel dat Google de site kent en indexeert — de site is dus niet structureel onbereikbaar, alleen niet bereikbaar vanuit deze sessie. Bevindingen hieronder zijn daarom gebaseerd op **directe code-analyse** (het meest betrouwbare bewijs: dit ís wat er draait) plus wat de Google-zoekresultaten lieten zien. Waar ik iets niet live kon verifiëren, staat dat er expliciet bij — laat dat zo nodig zelf even in de browser/curl bevestigen.

---

## 1. Robots en bot-toegang

### 1.1 robots.txt (bron: `client/public/robots.txt`)

```
User-agent: *
Disallow: /dashboard
Disallow: /profile
Disallow: /rewards
Disallow: /history

Sitemap: https://www.doehetextra.nl/sitemap.xml
```

Dit is de enige robots.txt in de codebase en wordt statisch geserveerd (geen server-side robots.txt-route gevonden die dit zou kunnen overschrijven). Geldt voor `User-agent: *` — er is **geen enkele bot-specifieke regel**.

### 1.2 User-agent-filtering, firewall, rate limiting

Doorzocht: `server/index.ts`, `server/routes.ts`, alle overige `server/*.ts`. Gevonden middleware-stack (in volgorde van registratie):

1. `helmet()` — beveiligingsheaders (X-Frame-Options, HSTS, etc.). CSP staat expliciet uit. Blokkeert niets op user-agent.
2. `compression()` — gzip/brotli, geen filtering.
3. Cache-Control-middleware voor `/assets/*` en afbeeldingen — geen filtering.
4. **CORS-middleware** — wijst cross-origin `fetch`/`XHR`-requests af die geen `Origin`-header hebben op de allowlist. Belangrijk: dit reageert alleen op de `Origin`-header, die browsers sturen bij cross-origin JS-requests. Normale paginabezoeken door bots/crawlers sturen geen `Origin`-header en worden expliciet doorgelaten (`"Geen Origin header: server-to-server, curl, mobile app, etc. — toegestaan"`). **Geen bot-blokkade.**
5. `registerRedirects()` — 301's op basis van het URL-pad, niet op user-agent.
6. Een noindex-middleware die `X-Robots-Tag: noindex, nofollow` zet voor `/dashboard-mockup`, `/employee-app`, `/employee-app-v1`.
7. Express session-middleware, API-routes.

Er is **geen** user-agent-detectie, geen bot-blocklist/allowlist, geen rate limiter (geen `express-rate-limit` of vergelijkbaar package gevonden) en geen WAF-achtige code in deze repo. Ik kan niet garanderen dat er niets op infrastructuurniveau (Replit/Cloudflare/hosting) zit dat ik in code niet zie — dat kon ik door de connectiefout hierboven ook niet live uitsluiten.

### 1.3 Bot-toegangstabel

Omdat er geen enkele bot-specifieke regel bestaat (noch in robots.txt, noch in code), is elke bot in principe **toegestaan** om te crawlen. Het praktische probleem zit niet in toegang, maar in wat een bot te zien krijgt (zie sectie 2) — bots die geen JavaScript uitvoeren krijgen op vrijwel elke pagina alleen de generieke homepage-inhoud.

| Bot | Toegestaan door robots.txt/server | Voert JS uit? | Krijgt in praktijk bruikbare content |
|---|---|---|---|
| Googlebot | Ja | Ja (met vertraagde 2e renderpas) | Ja, met vertraging |
| Bingbot | Ja | Beperkt/vertraagd | Deels, onbetrouwbaar |
| GPTBot | Ja | Nee | **Nee** — alleen homepage-shell |
| OAI-SearchBot | Ja | Nee | **Nee** |
| ChatGPT-User | Ja | Nee | **Nee** |
| ClaudeBot | Ja | Nee | **Nee** |
| Claude-User | Ja | Nee | **Nee** |
| PerplexityBot | Ja | Nee | **Nee** |
| Perplexity-User | Ja | Nee | **Nee** |
| Google-Extended | Ja | Nee (los van Googlebot) | **Nee** |
| CCBot | Ja | Nee | **Nee** |
| Applebot-Extended | Ja | Nee | **Nee** |

---

## 2. Rendering per route

### 2.1 Architectuur

- Frontend: Vite + React, client-side gerouteerd met `wouter` (`client/src/App.tsx`).
- Backend: Express. In productie (`server/vite.ts`, functie `serveStatic`): `express.static(distPath)` gevolgd door een catch-all (`app.use("*", (_req, res) => res.sendFile(index.html))`).
- Er is **geen** SSR-, SSG- of prerender-tooling in `package.json` (geen Next.js, geen vite-plugin-ssr, geen react-snap/prerender-plugin). `landing-server.js` in de repo-root is een ongebruikt losstaand Express-scriptje (poort 3001, niet aangesloten op de hoofd-app of op productie).

**Gevolg: elke route, zonder uitzondering, krijgt exact dezelfde eerste HTML-respons** — de statische `client/index.html`-shell met een lege `<div id="root">`. Titel, meta-description, canonical en de twee JSON-LD-blokken in die shell zijn hardcoded voor de **homepage** en dus identiek op elke andere URL totdat JavaScript draait. Per-pagina titel/meta/canonical/JSON-LD/H1 worden pas gezet ná React-hydratatie, via `document.title = ...` (bevestigd in 44 pagina-bestanden) en een handmatige `setMeta`/`setLink`/`<script type="application/ld+json">`-injectie in de DOM (bevestigd o.a. in `EventPersoneelGezocht.tsx`). H1's staan in 43 pagina-componenten, allemaal React-JSX — dus ook pas zichtbaar ná JS-executie.

### 2.2 Oordeel per route

Gegeven bovenstaande architectuur is het oordeel voor **alle ~90 routes** in `App.tsx` identiek en mechanisch afleidbaar, niet per route verschillend: in de eerste server-respons ontbreekt alle route-specifieke tekst, headings en meta. Representatieve steekproef:

| Route | Component | Content in eerste HTML-respons? | Oordeel |
|---|---|---|---|
| `/` | Home | Ja (enige route met overeenkomende hardcoded meta) — bodytekst zelf ook client-side | **NIET CRAWLBAAR** (JS-afhankelijk) |
| `/horeca-uitzendbureau-amsterdam` | HorecaUitzendbureau | Nee — generieke homepage-titel/meta i.p.v. eigen | **NIET CRAWLBAAR** |
| `/hotelpersoneel-inhuren` | HotelPersoneelGezocht | Nee | **NIET CRAWLBAAR** |
| `/horeca-vacatures-amsterdam` | IkZoekExtraWerk | Nee | **NIET CRAWLBAAR** |
| `/en/hospitality-staff-amsterdam` | HospitalityStaffAmsterdam | Nee | **NIET CRAWLBAAR** |
| `/blog` | NieuwsPage | Nee, en de artikelenlijst zelf komt ook via een client-side data-fetch | **NIET CRAWLBAAR** |
| `/blog/:slug` | NieuwsArtikel | Nee — dubbel JS-afhankelijk (CSR-template + client-side API-call voor het artikel zelf) | **NIET CRAWLBAAR** |
| `/vacatures/:slug` | VacatureDetail | Nee — zelfde dubbele afhankelijkheid | **NIET CRAWLBAAR** |
| `/over-extra` | OverExtra | Nee | **NIET CRAWLBAAR** |
| `/privacybeleid` | Privacybeleid | Nee | **NIET CRAWLBAAR** |
| `/personeel-gezocht` | (inline `window.location.replace`, client-side) | Nee — server geeft de homepage-shell, browser redirect gebeurt pas na JS | **NIET CRAWLBAAR + geen serverside redirect** (zie 3.4) |
| `/dashboard`, `/profile`, `/rewards`, `/history` | — | N.v.t. (terecht uitgesloten via robots.txt) | Correct geblokkeerd |

**Conclusie sectie 2:** 0 van de ~90 publieke routes leveren bruikbare content in de eerste server-respons. Voor Googlebot/Bingbot betekent dit een indexeer-vertraging (tweede renderpas) en risico op gemiste content bij client-fetched data (blog/vacatures). Voor alle AI-crawlers uit de tabel in sectie 1 betekent dit vrijwel zeker: geen enkele paginaspecifieke content, alleen de generieke homepage-metadata.

---

## 3. Technische basis

### 3.1 Sitemap.xml — twee losse bronnen, en een domeinrisico

Er bestaan **twee verschillende sitemap.xml-implementaties**:

1. **Statisch bestand** `client/public/sitemap.xml` — 5 URL's (`/landing`, `/personeel-gezocht`, `/aanmelden`, `/personeelsaanvraag`, `/nieuws`).
2. **Dynamische route** `app.get('/sitemap.xml', ...)` in `server/routes.ts` (regel ~9364) — genereert een sitemap met ~29 vaste pagina's + gepubliceerde blogposts uit de database.

Omdat de dynamische route vóór `serveStatic()`/`express.static` wordt geregistreerd, **wint de dynamische versie in productie** en is het statische bestand dode code — maar verwarrend om te laten staan, en risicovol als de registratievolgorde ooit verandert.

**Domeinrisico (hoge prioriteit):** de dynamische sitemap gebruikt:
```js
const baseUrl = process.env.BASE_URL || 'https://brochure.doehetextra.nl';
```
Als de environment-variabele `BASE_URL` in productie niet (of verkeerd) is gezet, wijst **elke `<loc>` in de sitemap naar `brochure.doehetextra.nl`** — een ander domein dan het canonical domein (`www.doehetextra.nl`) dat overal elders wordt gebruikt (robots.txt, canonical-tags, OG-tags). Ik kon dit niet live verifiëren (zie methodologie hierboven); controleer of `BASE_URL` in Replit Secrets/Deploy staat en exact `https://www.doehetextra.nl` is.

**Volledigheid:** de dynamische sitemap bevat ~29 URL's tegenover ~90 routes in `App.tsx`. Ontbrekend: alle `/en/*`-pagina's, `/vacatures` en elke `/vacatures/:slug`, individuele `/blog/:slug`-posts (alleen de bloglijst zelf staat erin), `/sollicitatieformulier`, `/cv-upload`, `/privacybeleid`, `/klantcases-horeca`, `/beloningssysteem`/`/extraatje`, e.a.

**Bevat een dode URL:** `/personeel-gezocht` staat in beide sitemaps, maar is een pure client-side-redirect-stub zonder eigen content (zie 3.4).

Sitemap wordt wel correct gerefereerd vanuit robots.txt (`Sitemap: https://www.doehetextra.nl/sitemap.xml`).

### 3.2 Title / meta description / canonical / H1 per route

Zoals in sectie 2 vastgesteld: in de **ruwe serverrespons** is dit voor elke route identiek (de homepage-waarden uit `client/index.html`):

- Title: "EXTRA – Flexibel horecapersoneel in Amsterdam | Uitzendbureau horeca"
- Description: "EXTRA levert flexibel en representatief horecapersoneel..."
- Canonical: `https://www.doehetextra.nl/` (dus **elke** route claimt de homepage als canonical in de raw HTML)
- H1: geen — de `<body>` bevat alleen een lege `<div id="root">`

→ Dit is voor niet-JS-crawlers een sitewide title/description/canonical-duplicatie over alle ~90 routes heen, plus een canonical die op bijna elke pagina naar de verkeerde URL wijst.

Voor volledigheid: wat de pagina's **client-side** wél correct instellen (dus zichtbaar voor browsers en JS-renderende bots) is over het algemeen goed opgezet — unieke titles, descriptions, canonicals en OG-tags per pagina, consistent per patroon (`setMeta`/`setLink`-helper). Dat werk is dus niet verloren; het staat alleen op de verkeerde plek (client i.p.v. server) om door de meeste crawlers gezien te worden.

Eén concrete inconsistentie gevonden: `client/src/pages/HorecaPersoneelGezocht.tsx` zet canonical naar `/horecapersoneel-gezocht` (aan elkaar), maar dit component is **nergens aan een `<Route>` gekoppeld** in `App.tsx` — dode code, geen actief risico, wel op te ruimen.

### 3.3 JSON-LD structured data

- **Global, in raw HTML (dus zichtbaar voor alle bots):** twee blokken in `client/index.html` — `Organization` en `WebSite`. Beide syntactisch geldig JSON, correcte `@context`/`@type`.
- **Per pagina, alleen client-side (21 pagina's, o.a. `EventPersoneelGezocht.tsx`, `Vacatures.tsx`, `VacatureDetail.tsx`, `NieuwsArtikel.tsx`, de Engelse variants):** extra JSON-LD (waarschijnlijk Service/JobPosting/Article-achtige types, geïnjecteerd via een `document.createElement('script')`-helper). Dit is voor niet-JS-bots onzichtbaar — zelfde grondoorzaak als sectie 2.

### 3.4 Redirects, 404's en hoofdlettergevoelige routes

- **Server-side 301's:** `server/redirects.ts` bevat een nette, expliciete `REDIRECT_MAP` (~30 entries) voor oude Wix-URL's, met case-insensitieve matching (`normalizePath` lowercased het inkomend pad) naar een exact-case doel. Dit mechanisme werkt goed voor wat erin staat.
- **Client-only "redirects" (probleem):** minstens 8 routes in `App.tsx` zijn geen server-redirect maar een inline `window.location.replace(...)` die pas ná JS-executie afgaat: `/personeel-gezocht`, `/horecapersoneel-gezocht`, `/horeca-personeel-gezocht`, `/hotel-personeel-gezocht`, `/hotel-personeel-amsterdam`, `/event-personeel-gezocht`, `/evenementen-personeel-amsterdam`, `/cateringpersoneel-gezocht`, `/catering-personeel-amsterdam`, `/restaurant-personeel-gezocht`, `/restaurant-personeel-amsterdam`, `/ik-zoek-extra-werk/*`, `/ik-zoek-extra-werk`. Voor niet-JS-bots: HTTP 200 met de generieke shell, geen redirect-signaal. `/personeel-gezocht` is bovendien een van de meest intern-gelinkte URL's op de site (homepage, `/over-extra`, navigatiemenu).
- **Orphaned/verdwenen URL's die Google nog kent (gevonden via live zoekopdracht, niet in de huidige codebase):** `/en/uitzendbureau-hilversum`, `/en/uitzendbureau-utrecht`, `/en/werk-zoeken`, `/werken-bij-extra`, `/krijg-direct-uitbetaald`, `/bijbaan-utrecht`. Geen van deze paden staat in `App.tsx`, en geen ervan (op `/contact-bedrijven` en `/werk-zoeken` na, die wél in `REDIRECT_MAP` zitten) staat in `server/redirects.ts`. Praktisch gevolg volgens de code: de Express-catch-all stuurt de generieke SPA-shell terug met **HTTP 200**, waarna de client-router niets vindt en de `NotFound`-component toont. Resultaat: Google heeft deze URL's geïndexeerd met eigen titel/beschrijving, maar een bezoeker/crawler die er nu op landt krijgt een lege/verkeerde pagina met status 200 — een klassieke soft-404 na een site-migratie.
- **Geen server-side 404-status:** de catch-all (`app.use("*", (_req, res) => res.sendFile(index.html))`) geeft voor **elk** niet-gematcht pad HTTP 200 terug — inclusief typo's en hoofdletter-varianten zoals het door jou genoemde `/PRIVACYBELEID` vs `/privacybeleid`. `wouter`'s route-matching is standaard hoofdlettergevoelig, dus `/PRIVACYBELEID` matcht geen enkele `<Route>` en toont client-side `NotFound` — maar de server blijft 200 melden. Dit kon ik niet live bevestigen (zie methodologie), maar volgt direct en ondubbelzinnig uit de code.

### 3.5 HTTP-headers: caching, compressie, prestaties

Uit `server/index.ts` (kon niet live gemeten worden, zie methodologie — dit zijn de geconfigureerde waarden):

- **Compressie:** `compression({ level: 6, threshold: 1024 })` — gzip/brotli aan voor responses > 1KB. Prima standaardinstelling.
- **Caching gehashte assets** (`/assets/*.js|css|woff2|...`): `Cache-Control: public, max-age=31536000, immutable` — correct voor Vite's content-hashed bestanden.
- **Caching afbeeldingen** (losse `.webp/.png/.jpg/.svg/.gif` buiten `/assets/`): `Cache-Control: public, max-age=86400` (1 dag) — redelijk, zou langer + `stale-while-revalidate` mogen.
- **HTML-document zelf (`index.html`) en API-JSON-responses:** geen expliciete Cache-Control gevonden — Express' default (geen expliciete caching-header) betekent waarschijnlijk browser-heuristiek i.p.v. een bewuste keuze. Voor een SPA-shell is dat acceptabel, maar een korte `max-age` + `must-revalidate` zou net iets sneller herhaalbezoek geven.
- **Beveiligingsheaders:** `helmet()` staat aan (X-Frame-Options, HSTS etc.), CSP bewust uitgeschakeld.
- **Laadprestaties (TTFB/LCP/CLS):** kon ik niet meten — vereist een live requests, wat in deze sessie niet lukte (zie methodologie). Wel positief in de code: LCP-hero-afbeelding wordt gepreload (`<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">`), en Google Fonts worden async/non-render-blocking geladen. Gezien de 100%-CSR-architectuur (sectie 2) is de reële bottleneck vrijwel zeker **niet** deze headers, maar de tijd tot React hydrateert en de content toont — dat is precies wat niet-JS-crawlers missen.

---

## 4. Conclusie — Top 10 bevindingen op SEO/GEO-impact

| # | Bevinding | Exacte fix |
|---|---|---|
| 1 | **100% client-side rendering, geen SSR/prerendering.** Elke route levert dezelfde lege HTML-shell; AI-crawlers die geen JS uitvoeren (GPTBot, ClaudeBot, PerplexityBot, CCBot, Google-Extended, Applebot-Extended, e.a.) zien op elke pagina alleen de generieke homepage-content. | Voeg build-time prerendering toe voor alle publieke marketingroutes (bv. `vite-plugin-ssg`/`vite-plugin-prerender`, of een eigen prerender-script met Puppeteer dat per route in `App.tsx` een statische HTML genereert met de juiste `<title>/<meta>/<h1>/JSON-LD`). Dit is de wortel van bevindingen #2 en #9 ook. |
| 2 | **Title, meta description en canonical zijn identiek (en fout) op elke route** in de ruwe HTML — allemaal de homepage-waarden uit `client/index.html`, inclusief canonical die overal naar `/` wijst. | Zelfde fix als #1; als tussenstap: laat de Express-catch-all per `req.path` een routetabel raadplegen en de juiste `<title>/<meta>/<link rel=canonical>` server-side in de HTML injecteren vóórdat React laadt. |
| 3 | **Sitemap-domein kan silently fout zijn**: `server/routes.ts` valt terug op `https://brochure.doehetextra.nl` als `BASE_URL` niet gezet is — een ander domein dan het canonical domein overal elders. | Verwijder de fallback; laat de app bij ontbrekende `BASE_URL` hard falen bij het opstarten (zoals nu al gebeurt voor `SESSION_SECRET`/`UNSUBSCRIBE_SECRET`), of hardcode `https://www.doehetextra.nl` direct in de sitemap-route. |
| 4 | **Sitemap is onvolledig**: ~29 van de ~90 routes staan erin; alle `/en/*`-pagina's, `/vacatures/:slug`, losse blogposts en meerdere kernpagina's ontbreken. | Genereer de sitemap uit dezelfde route-bron als `App.tsx` (of een gedeeld routes-manifest), plus een loop over gepubliceerde vacatures/blogposts voor de detailpagina's. |
| 5 | **Twee conflicterende sitemap.xml-bronnen**: een verouderd statisch bestand (`client/public/sitemap.xml`, 5 URL's) naast de dynamische serverroute; alleen de laatste wordt geserveerd maar het is fragiel or registratievolgorde. | Verwijder `client/public/sitemap.xml`. |
| 6 | **Interne "redirects" via client-side `window.location.replace()`** op minstens 8 routes (o.a. `/personeel-gezocht`, een van de meest intern-gelinkte URL's op de site) geven niet-JS-bots geen content én geen redirect-signaal. | Verplaats deze mappings naar `REDIRECT_MAP` in `server/redirects.ts` als echte HTTP 301's, zoals al gebeurt voor de oude Wix-URL's. |
| 7 | **Orphaned, nog wél door Google geïndexeerde URL's** (`/en/uitzendbureau-hilversum`, `/en/uitzendbureau-utrecht`, `/en/werk-zoeken`, `/werken-bij-extra`, `/krijg-direct-uitbetaald`, `/bijbaan-utrecht`) bestaan niet meer in de code en niet in `REDIRECT_MAP` → serveren nu een soft-404 (HTTP 200, generieke shell) i.p.v. een 301 of 404. | Voeg elk pad toe aan `REDIRECT_MAP` met een 301 naar het dichtstbijzijnde huidige equivalent (bv. `/en/uitzendbureau-hilversum` → `/en/hospitality-staff-amsterdam` of een regiopagina), of geef een expliciete 410 als de content echt vervallen is. |
| 8 | **Geen echte HTTP 404-status voor onbekende/foutieve paden** (typo's, hoofdletter-varianten zoals `/PRIVACYBELEID`, vervallen URL's) — de catch-all geeft altijd 200. | Laat de catch-all-route in `server/vite.ts` (`serveStatic`) controleren of `req.path` in de bekende routetabel voorkomt; zo niet, stuur de SPA-shell alsnog maar met status 404. |
| 9 | **Pagina-specifieke JSON-LD (21 pagina's) is alleen client-side aanwezig**, dus onzichtbaar voor niet-JS-crawlers — gemiste kans voor rich results en GEO-citaties. | Onderdeel van fix #1: laat structured data meekomen in de geprerenderde HTML. |
| 10 | **robots.txt en de X-Robots-Tag-noindex-middleware dekken niet dezelfde lijst**: robots.txt blokkeert `/dashboard`, `/profile`, `/rewards`, `/history`; de X-Robots-Tag-middleware dekt apart `/dashboard-mockup`, `/employee-app`, `/employee-app-v1`. Routes als `/extraatje-dashboard`, `/extraatje-admin`, `/leaderboard` zitten in geen van beide. | Breng beide mechanismen samen in één lijst (bij voorkeur `NOINDEX_PATHS` in `server/index.ts`, die zowel de `X-Robots-Tag` zet als naar robots.txt-`Disallow`-regels vertaalt), en vul `/extraatje-dashboard`, `/extraatje-admin`, `/leaderboard` aan. |

---

*Niets in de codebase is gewijzigd voor dit rapport. Wil je dat ik voor een van deze 10 punten een apart, scherp afgebakend bouwprompt-je klaarzet (zoals we ook voor het salesdashboard deden), zeg dan welke — te beginnen bij #1 zou het meeste verschil maken, maar #3, #5, #6 en #7 zijn losse, snelle fixes die weinig risico dragen.*
