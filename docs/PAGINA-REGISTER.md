# Pagina-register

Wie bezit welk zoekwoordcluster, welke intentie bedient een pagina, en wat moet
de bezoeker er doen. Dit legt vast wat de code **niet** weet.

Alles wat wél afleidbaar is — URL, title, description, canonical, taal,
indexatiestatus, hreflang-partner, H1, interne links, laatste wijziging — staat
in `shared/routeMeta.ts`, in de prerender-fragmenten en in git. Dat hoort hier
niet nog eens te staan, want twee bronnen lopen altijd uit elkaar.

## De regel

**Eén zoekintentie heeft één eigenaar.** Claimt een nieuwe pagina een cluster
dat hieronder al eigendom is, dan is het geen nieuwe pagina maar een wijziging
aan de bestaande — tenzij aantoonbaar een andere intentie wordt bediend.
Schrijf die afweging op in de kolom Opmerkingen.

## Onderhoud

- Bijwerken in dezelfde commit als de wijziging.
- `npm run register:check` faalt als een indexeerbare route hier ontbreekt.
- Intentie: **T** transactioneel · **C** commercieel (vergelijkt) ·
  **I** informatief · **N** navigerend · **L** lokaal.
- Doelgroep: **WG** werkgever/opdrachtgever · **WZ** werkzoekende ·
  **B** beide.

Laatst volledig nagelopen: 25 augustus 2026.

---

## Kern en merk

| URL | Intentie | Keywordcluster (eigenaar) | Doel | CTA | Opmerkingen |
|---|---|---|---|---|---|
| `/` | T+N | horeca uitzendbureau amsterdam | WG | Personeel aanvragen | **Botst met `/horeca-uitzendbureau-amsterdam`** — beide op sitemapprioriteit 1.0, zelfde kernterm. Uit te zoeken met Search Console. Bedient nu twee doelgroepen even zwaar; de conversieaudit adviseert werkgever primair. |
| `/horeca-uitzendbureau-amsterdam` | C | horeca uitzendbureau amsterdam (waarom EXTRA) | WG | Personeel aanvragen | Zie hierboven. Als hij blijft, moet hij duidelijk de *vergelijkende* intentie bedienen ("waarom dit bureau") en niet de generieke. |
| `/horeca-uitzendbureau-amsterdam-werkwijze` | I | werkwijze uitzendbureau horeca | B | Personeel aanvragen | **Overlapt met `/onze-werkwijze`** — zelfde stappenplan. Eén moet 301'en. |
| `/onze-werkwijze` | I | hoe werkt het / werkwijze | B | Personeel aanvragen | Zie hierboven. Deze URL is korter en generieker; voorkeur om deze te houden. |
| `/over-extra` | N | over extra uitzendbureau | B | Contact | Merkpagina. E-E-A-T-drager: hier horen oprichtingsjaar en SNA-nummer te komen. |
| `/ons-team` | N | team extra | B | Contact | Ondersteunt E-E-A-T. Wordt nu nergens vanaf commerciële pagina's gelinkt. |
| `/contact` | N | contact extra | B | Bellen / formulier | Formulier werkte tot 24-08 niet; gerepareerd in de branch `contactfix`. |
| `/klantcases-horeca` | C | klantcases horeca / referenties | WG | Personeel aanvragen | Bevat quotes, geen echte cases met resultaat. Grootste bewijskans van de site. |
| `/nen-4400-1-certificering` | I | nen 4400-1 uitzendbureau | WG | Personeel aanvragen | Sterkste juridische argument tegenover zzp-platforms. Verdient een link vanaf elke sectorpagina. |
| `/extraatje` | I | extraatje beloningssysteem | B | Aanmelden | Publieke tegenhanger van het interne `/rewards`. Blogs linken hierheen, nooit naar `/rewards`. |
| `/blog` | N | blog / kennisbank | B | — | Overzicht. Individuele artikelen staan niet in dit register; die volgen de blogskill en `docs/BLOG-KALENDER.md`. |

## Werkgevers — sector

| URL | Intentie | Keywordcluster (eigenaar) | Doel | CTA | Opmerkingen |
|---|---|---|---|---|---|
| `/hotelpersoneel-inhuren` | T | hotelpersoneel inhuren | WG | Personeel aanvragen | Sterkste sectorpagina. Zwaartepunt housekeeping en front office. |
| `/eventpersoneel-inhuren` | T | eventpersoneel inhuren | WG | Personeel aanvragen | **Bezit dit cluster.** Zie `/evenementen-personeel-inhuren`. |
| `/cateringpersoneel-inhuren` | T | cateringpersoneel inhuren | WG | Personeel aanvragen | |
| `/horecapersoneel-restaurants` | T | restaurantpersoneel inhuren | WG | Personeel aanvragen | Claimt ook "bediening inhuren" — overlapt met `/bediening-inhuren`. |
| `/horeca-personeel-gezocht` | T | horeca personeel gezocht | WG | Personeel aanvragen | 1094 regels, echte inhoud. Hreflang-partner van `/en/hospitality-staff-amsterdam`. |
| `/personeelsaanvraag` | T | personeel aanvragen (conversie) | WG | Bel mij terug | **De conversiepagina.** Geen SEO-doel; mag nooit een keyword van een landingspagina afsnoepen. |

## Werkgevers — overig en dubbel

| URL | Intentie | Keywordcluster (eigenaar) | Doel | CTA | Opmerkingen |
|---|---|---|---|---|---|
| `/horeca-personeel-amsterdam` | T+L | horeca personeel amsterdam | WG | Personeel aanvragen | **Voorgestelde eigenaar** van het cluster "horeca personeel". `/horeca-personeel` en `/flexibel-horeca-personeel` zouden hierheen moeten 301'en — pas na controle in Search Console. |
| `/horeca-personeel` | T | — (kandidaat voor samenvoeging) | WG | Personeel aanvragen | Scaffold van ~230 woorden, zelfde template als de twee hieronder. |
| `/flexibel-horeca-personeel` | T | — (kandidaat voor samenvoeging) | WG | Personeel aanvragen | Idem. |
| `/horeca-personeel-inhuren` | T | horeca personeel inhuren | WG | Personeel aanvragen | Ligt dicht tegen `/horeca-personeel-amsterdam` aan; scheiding is "inhuren" versus "personeel". Zwak onderscheid, in de gaten houden. |
| `/bediening-inhuren` | T | bediening inhuren | WG | Personeel aanvragen | Cluster wordt ook geclaimd door `/horecapersoneel-restaurants` en `/eventpersoneel-inhuren`. |
| `/evenementen-personeel-inhuren` | T | — (dubbel) | WG | Personeel aanvragen | **Kannibaliseert `/eventpersoneel-inhuren`.** Scaffold van ~180 regels tegenover ~920. Voorstel: 301 naar de sectorpagina. |
| `/tijdelijk-horeca-personeel` | T | tijdelijk horecapersoneel | WG | Personeel aanvragen | Eigen intentie (tijdelijkheid), verdedigbaar naast de rest. |

## Werkzoekenden

| URL | Intentie | Keywordcluster (eigenaar) | Doel | CTA | Opmerkingen |
|---|---|---|---|---|---|
| `/horeca-vacatures-amsterdam` | T | horeca vacatures amsterdam | WZ | Aanmelden | |
| `/horeca-werk-amsterdam` | T+L | horeca werk amsterdam | WZ | Aanmelden | |
| `/horeca-werk` | T | horeca werk | WZ | Aanmelden | Landelijke variant naast de Amsterdamse. Zwak onderscheid. |
| `/housekeeping-vacatures-amsterdam` | T | housekeeping vacatures | WZ | Aanmelden | |
| `/housekeeping-werk` | T | housekeeping werk | WZ | Aanmelden | Naast de vacaturevariant; scheiding "vacatures" versus "werk" is dun maar bestaat sitebreed. |
| `/chef-vacatures-amsterdam` | T | chef vacatures amsterdam | WZ | Aanmelden | |
| `/front-office-vacatures-amsterdam` | T | front office vacatures | WZ | Aanmelden | |
| `/vacatures` | T | horeca vacatures (overzicht) | WZ | Solliciteren | Overzicht plus `/vacatures/:slug`. Detailpagina's krijgen 4 ringlinks. |
| `/aanmelden` | T | aanmelden uitzendbureau (conversie) | WZ | Aanmelden | Conversiepagina, geen SEO-doel. Engelse ingang via `?lang=en`. |
| `/sollicitatieformulier` | T | sollicitatieformulier (conversie) | WZ | Versturen | Conversiepagina. |
| `/bijbaan-amsterdam` | T+L | bijbaan amsterdam | WZ | Aanmelden | |
| `/dagbetaling` | I | dagbetaling horeca | WZ | Aanmelden | Sterk onderscheidend onderwerp; ook bruikbaar als blogcluster-pillar. |
| `/werken-in-de-horeca` | I | werken in de horeca | WZ | Aanmelden | Brede informatieve instap. |

## Juridisch

| URL | Intentie | Keywordcluster (eigenaar) | Doel | CTA | Opmerkingen |
|---|---|---|---|---|---|
| `/privacybeleid` | N | — | B | — | Geen SEO-doel. |
| `/voorwaarden` | N | — | B | — | Geen SEO-doel. |
| `/cookiebeleid` | N | — | B | — | Moet bijgewerkt worden zodra de cookiebanner live gaat. |

## Engels

De Engelse pagina's spiegelen de Nederlandse via `HREFLANG_GROUPS`. Het cluster
is steeds de Engelse zoekterm, niet de vertaling van de Nederlandse.

| URL | Intentie | Keywordcluster (eigenaar) | Doel | CTA | Opmerkingen |
|---|---|---|---|---|---|
| `/en` | T+N | hospitality staffing agency amsterdam | WG | Request staff | Engelse homepage. |
| `/en/hospitality-staff-amsterdam` | T | hospitality staff amsterdam | WG | Request staff | Partner van `/horeca-personeel-gezocht`. |
| `/en/hotel-staffing-amsterdam` | T | hotel staff amsterdam | WG | Request staff | |
| `/en/event-staff-amsterdam` | T | event staff amsterdam | WG | Request staff | |
| `/en/catering-staff-amsterdam` | T | catering staff amsterdam | WG | Request staff | |
| `/en/restaurant-staff-amsterdam` | T | restaurant staff amsterdam | WG | Request staff | |
| `/en/about` | N | about extra | B | Contact | |
| `/en/our-team` | N | extra team | B | Contact | |
| `/en/contact` | N | contact extra amsterdam | B | Contact | Dient nu ook als "request staff"-bestemming; `/en/request-staff` is gebouwd maar niet toegepast. |
| `/en/client-stories` | C | hospitality staffing client stories | WG | Request staff | |
| `/en/how-we-work` | I | how hospitality staffing works | B | Request staff | |
| `/en/rewards` | I | hospitality staff rewards | WZ | Apply | Partner van `/extraatje`. |
| `/en/hospitality-jobs` | T | hospitality jobs amsterdam | WZ | Apply | |
| `/en/hospitality-work` | T | hospitality work amsterdam | WZ | Apply | |
| `/en/housekeeping-jobs` | T | housekeeping jobs amsterdam | WZ | Apply | |
| `/en/chef-jobs` | T | chef jobs amsterdam | WZ | Apply | |
| `/en/front-office-jobs` | T | front office jobs amsterdam | WZ | Apply | |

---

## Clusters zonder eigenaar

Zoekvraag die commercieel relevant is en nu door geen enkele pagina wordt
bediend. Dit is de kandidatenlijst voor nieuwe pagina's — mét de
pre-flight-check erbij.

| Cluster | Intentie | Waarom relevant |
|---|---|---|
| housekeeping personeel inhuren | T | Grootste dienst van EXTRA; geen enkele pagina voor werkgevers. Concurrenten hebben die wel. |
| banqueting personeel inhuren | T | Hoge marge, piekgedreven, nu alleen een bullet binnen de hotelpagina. |
| front office personeel inhuren | T | Idem — de bestaande front-office-URL is voor werkzoekenden. |
| wat kost horecapersoneel inhuren | I/C | Hoge koopintentie, volledig onbediend, en concurrenten winnen deze zoekvraag. |
| uitzendkracht versus zzp'er inhuren | I/C | Sluit aan op het sterkste argument van EXTRA (loondienst, NEN 4400-1). |
| hotelpersoneel schiphol | T+L | Alleen doen als daar echt geleverd wordt; Radisson Blu Schiphol is al klant. |
| afwassers en keukenhulp inhuren | T | Longtail, lage marge, instap naar meer. |

## Bewust niet in het register

`/BHG-group`, `/xebia` (klantpagina's, `noindex, follow`), `/cv-upload`,
`/aanvraag-ontvangen`, de brochures en alle dashboard- en app-routes. Die
hebben geen zoekdoel en dus geen cluster.
