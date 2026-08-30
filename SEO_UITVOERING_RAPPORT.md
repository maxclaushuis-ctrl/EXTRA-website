> **ARCHIEF — niet gebruiken als bron van afspraken.**
>
> Dit document beschrijft een momentopname en is sindsdien op meerdere punten
> achterhaald. De geldende regels staan in `shared/routeMeta.ts`,
> `scripts/check-seo.ts`, `docs/PAGINA-REGISTER.md` en de skill
> `extra-website`. Bewaard voor de historie: het legt vast waarom de site is
> zoals hij is.
>
> Concreet achterhaald: "62 indexeerbare routes" is nu 57, "54 geprerenderde
> routes" is nu 60, en de titelgrens is met P17 verlaagd van 62 naar 60
> tekens. Ook de beschreven `/landing`-canonical is anders uitgevoerd: `/`
> rendert de landingscontent en `/landing` 301't daarheen.

# SEO-uitvoeringsrapport — P1 t/m P10 (Wrkt Digital-audit, juli 2026)

Uitgevoerd door Claude (Cowork) op de codebase, in drie blokken gepusht naar GitHub (commits `4770f34`, `8adb759`, `d931bfc`). **Nog niet live**: pull + publish in Replit nodig.

## Wat is er gebouwd

**Blok 1 — Fundament (P1+P2+P5-deels).** De kernbevinding van de audit (elke URL = zelfde lege shell) is opgelost met een hybride aanpak: een centrale metadata-config (`shared/routeMeta.ts`, 62 indexeerbare routes met unieke title/description/canonical), server-side injectie daarvan in de initiële HTML (`server/seo.ts`), en build-time prerendering van de volledige paginacontent (54 routes, fragmenten gecommit in `client/public/prerender/`). Crawlers zonder JavaScript — GPTBot, ClaudeBot, PerplexityBot — zien nu per pagina de echte tekst, H1 en schema's in de eerste HTML-respons. Onbekende paden geven een echte 404 (einde soft-404's), 21 client-side/verdwenen redirects zijn echte 301's geworden, de sitemap komt uit dezelfde config (incl. vacatures, zonder redirect-URL's) en de gevaarlijke `brochure.doehetextra.nl`-fallback is weg. Een build-check (`npm run seo:check`) faalt voortaan op te lange/dubbele titles, kapotte canonicals en fragmenten zonder H1; een testsuite (11 checks) draait met `npx tsx scripts/test-seo-server.ts`.

**Blok 2 — Structured data (P3+P4).** Sitewide `Organization` is geüpgraded naar `EmploymentAgency` met volledige NAP (Herengracht 372, 1016 CH Amsterdam, +31 85 130 5915, info@doehetextra.nl). De ongeldige property `serviceType` op Organization — die op élke pagina stond en vrijwel zeker Ahrefs' "85 pagina's met validatiefout" veroorzaakte — is vervangen. Twee kapotte assets ontdekt en gefixt: `logo.png` en `og-image.jpg` werden overal gerefereerd maar bestonden niet; nu gegenereerd uit echte brand-assets. `BreadcrumbList` wordt server-side op elke pagina behalve home geïnjecteerd. De ongeldige `employmentType: "OPROEP"` op de vacature-lijstpagina is gefixt. Alle 21 JSON-LD-blokken in de prerendered output zijn gevalideerd: 0 fouten.

**Blok 3 — Content en verrijking (P6-P10).** Zeven nieuwe landingspagina's (740–1007 woorden uniek Nederlands per pagina, FAQ + FAQPage-schema, Service-schema op inlenerspagina's, CTA's voor beide doelgroepen, interne links, prerendered): `/horeca-personeel-inhuren`, `/bediening-inhuren`, `/evenementen-personeel-inhuren`, `/tijdelijk-horeca-personeel`, `/bijbaan-amsterdam`, `/dagbetaling` en `/werken-in-de-horeca`. `/hoe-werkt-dagbetaling` 301't naar `/dagbetaling` (jouw keuze: nieuwe URL wint). `/llms.txt` en `/llms-full.txt` worden dynamisch geserveerd volgens de llmstxt.org-conventie. De footer linkt niet langer naar 301-URL's, dekt de orphan-pagina's en de kapotte links naar het niet-bestaande `/voorwaarden` en `/cookiebeleid` zijn verwijderd. Een centrale hook houdt titles/canonicals ná JavaScript-hydratatie in sync met de config (bron van "Page and SERP titles do not match"). H1 toegevoegd op `/aanmelden`.

## Bewuste afwijkingen van de prompts

1. **Prerendering via gecommitte fragmenten i.p.v. build-time browser-rendering** — de Replit-deployomgeving heeft geen Chromium; fragmenten worden hier gegenereerd (`npm run prerender`) en meegecommit. Consequentie: **na grote contentwijzigingen aan publieke pagina's moet `npm run prerender` opnieuw draaien** (vraag het mij gewoon). Meta/canonicals/404's werken altijd, ook met verouderde fragmenten.
2. **Geen JobPosting op functiegroep-pagina's (P3.2)** — Google staat JobPosting alleen toe op pagina's met één concrete vacature; op categoriepagina's riskeert het een structured-data-penalty. Echte vacatures hebben al volledige JobPosting-markup.
3. **Geen bulk `loading="lazy"` (P7)** — blind toevoegen op 149 afbeeldingen riskeert LCP-regressie op hero-beelden. Alt-teksten bleken in de huidige code al 100% aanwezig (de Ahrefs-finding stamt van een oudere versie).
4. **Homepage-constructie ongewijzigd gelaten** — `/` is client-side een redirect naar `/landing` (zelfde content, twee URL's). Ik heb `/landing` een canonical naar `/` gegeven zodat de homepage consolideert. De échte fix is `/` de landingscontent direct laten renderen, maar dat verandert gedrag voor ingelogde gebruikers — jouw call, hoor ik graag.
5. **Openingstijden ontbreken in het EmploymentAgency-schema** — niet aangeleverd; laat weten of ik ma–vr-tijden moet toevoegen.

## Nu te doen (jij)

1. **Replit: Pull → Publish.** Alles staat op GitHub; pas na deploy is het live.
2. **Verifieer na deploy** (of laat mij het proberen): `curl -s https://www.doehetextra.nl/horeca-uitzendbureau-amsterdam | grep '<h1'` moet content tonen; `/dit-bestaat-niet` moet HTTP 404 geven; `/llms.txt` moet platte tekst geven.
3. **Google Search Console**: vraag herindexering aan voor de belangrijkste URL's (homepage, pillarpagina's, de 7 nieuwe pagina's) en monitor de indexdekking ~2 weken, zoals de audit adviseert. Koppel GSC ook aan het Ahrefs-project (stond als "manueel" in de audit).
4. **Ahrefs**: draai een nieuwe Site Audit na deploy — verwachting: schema-validatiefouten van 85 → ~0, soft-404's weg, unieke titles/descriptions overal.

## Metadata (steekproef — volledige tabel in `shared/routeMeta.ts`)

| Route | Title (nieuw) | Tekens |
|---|---|---|
| / | Horeca uitzendbureau Amsterdam \| EXTRA | 38 |
| /horeca-personeel-inhuren | Horeca personeel inhuren \| Snel geregeld \| EXTRA | 48 |
| /bijbaan-amsterdam | Bijbaan Amsterdam \| Kies je eigen shifts \| EXTRA | 48 |
| /dagbetaling | Dagbetaling \| Vandaag werken, morgen betaald | 44 |
| /werken-in-de-horeca | Werken in de horeca \| Leeftijd, loon & starten | 46 |
| /hotelpersoneel-inhuren | Hotelpersoneel inhuren \| Housekeeping & F&B \| EXTRA | 51 |

Alle 62 titles ≤ 62 tekens, alle descriptions 110–160, geen duplicaten (door de build-check afgedwongen).
