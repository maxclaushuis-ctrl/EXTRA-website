# EXTRA — blogstrategie en contentkalender

Werkdocument voor de wekelijkse blogproductie. Bijwerken zodra er een artikel
live gaat of een cluster verschuift.

*Laatst bijgewerkt: 13 augustus 2026*

---

## 1. De afspraak

- **Elke maandagochtend rond 08:00** draait een geplande taak die het nieuws
  uitzoekt en 3 à 4 korte voorstellen doet, waarvan **minimaal één voor
  opdrachtgevers en één voor werkzoekenden**. Max krijgt daar een melding van.
  De taak schrijft de artikelen volgens de skill `schrijven-van-seo-blogs`.
- Jij kiest welke geschreven worden. In deze opbouwfase mag dat er meer dan twee
  zijn — de site mag voller.
- Pas ná jouw akkoord volgt de volledige SEO-brief en het artikel.

## 2. Wanneer verdient een blog bestaansrecht?

Twee blogs per week zijn ongeveer honderd artikelen per jaar. Dat werkt alleen
als elk artikel een eigen zoekintentie bedient. Een voorstel gaat alleen door
als het alle vier deze vragen met ja beantwoordt:

1. **Andere zoekintentie** dan een bestaande pagina? (zie de inventaris hieronder)
2. **Kan EXTRA hier iets toevoegen** wat de top-10 nu niet doet — praktijk,
   cijfers, een vergelijking, een beslisboom, actuele regelgeving?
3. **Past het in een cluster** en weten we naar welke commerciële pagina het leidt?
4. **Is het onderwerp waar** — geen verzonnen cijfers, wetgeving gecontroleerd bij
   de bron?

Nee op één ervan betekent: niet schrijven, of een bestaande pagina uitbreiden.

## 3. Wat al bestaat

### Gepubliceerde blogs

| Slug | Categorie | Focus |
|---|---|---|
| `housekeeping-personeel-inhuren` | Housekeeping | housekeeping personeel inhuren |
| `housekeeping-standaarden-verhogen` | Housekeeping | housekeeping standaard verhogen |
| `personeelstekort-horeca-2026` | Branche | personeelstekort horeca 2026 |
| `vijf-tips-onvergetelijke-gastervaring` | Hospitality | gastervaring hotel |
| `perfecte-catering-bedrijfsevent` | Events & Catering | catering bedrijfsevent |
| `barista-als-visitekaartje` | Horeca | barista horeca kwaliteit |
| `medewerker-van-de-maand-priya` | EXTRA Nieuws | EXTRAATje beloningssysteem |
| `test-blog-artikel-over-horeca-personeel-amsterdam` | — | testartikel — verwijderd via Blog & SEO |

Categorieën die de site kent: Hospitality · Events & Catering · Horeca ·
Housekeeping · EXTRA Nieuws · Branche. Gebruik altijd één van deze zes.

### Landingspagina's — dit zijn de kannibalisatierisico's én de linkdoelen

**Opdrachtgevers:** `/hotelpersoneel-inhuren` · `/cateringpersoneel-inhuren` ·
`/eventpersoneel-inhuren` · `/evenementen-personeel-inhuren` ·
`/bediening-inhuren` · `/horeca-personeel-inhuren` · `/tijdelijk-horeca-personeel` ·
`/flexibel-horeca-personeel` · `/horeca-uitzendbureau-amsterdam` ·
`/horeca-uitzendbureau-amsterdam-werkwijze` · `/horecapersoneel-restaurants` ·
`/personeelsaanvraag` · `/klantcases-horeca` · `/nen-4400-1-certificering` ·
`/onze-werkwijze`

**Werkzoekenden:** `/horeca-werk` · `/horeca-werk-amsterdam` ·
`/horeca-vacatures-amsterdam` · `/housekeeping-werk` ·
`/housekeeping-vacatures-amsterdam` · `/chef-vacatures-amsterdam` ·
`/front-office-vacatures-amsterdam` · `/bijbaan-amsterdam` ·
`/werken-in-de-horeca` · `/dagbetaling` · `/vacatures` · `/aanmelden` ·
`/extraatje` · `/rewards`

> Regel: een blog **linkt naar** deze pagina's, maar probeert nooit op dezelfde
> transactionele zoekterm te ranken. "Inhuren" en "vacatures" blijven strikt
> gescheiden in titels.

## 4. Clusters

Losse blogs leveren weinig op; clusters wel. Elk cluster heeft een pillar
(meestal een bestaande landingspagina) waar de blogs naartoe linken.

### Opdrachtgevers

**A. Inhuren en uitbesteden** → pillar `/hotelpersoneel-inhuren`
- ✅ Housekeeping personeel inhuren (drie modellen)
- Kamermeisje of room attendant inhuren in Amsterdam
- Bediening inhuren voor een event: per uur of per opdracht
- Wat kost horecapersoneel inhuren per uur, en wat zit erin?

**B. Wet- en regelgeving** → pillar `/nen-4400-1-certificering`
- Inlenersaansprakelijkheid: wanneer ben je als hotel aansprakelijk?
- Zzp of uitzendkracht in de horeca na het Temper-arrest
- Gelijkwaardige arbeidsvoorwaarden: wat lever je aan bij je uitzendbureau?

**C. Planning en kwaliteit** → pillar `/onze-werkwijze`
- Housekeeping plannen op bezettingsgraad
- Cleanliness score verhogen met een vaste poule
- Bezetting plannen rond de Amsterdamse evenementenkalender

### Werkzoekenden

**D. Beginnen in de horeca** → pillar `/horeca-werk-amsterdam`
- Zonder ervaring beginnen in de horeca: welke functies kunnen dat?
- Wat verdien je als room attendant in Amsterdam?
- Werken naast je studie: hoeveel uur mag en loont?

**E. Het vak** → pillar `/vacatures`
- Wat doet een room attendant precies op een dag?
- Van bediening naar leidinggevende: hoe ziet dat pad eruit?
- Werken bij hotels versus events: wat past bij jou?

**F. Voorwaarden en zekerheid** → pillar `/dagbetaling` en `/extraatje`
- Loondienst versus zzp als horecamedewerker in 2026
- Hoe werkt dagbetaling, en waar moet je op letten?

## 5. Ideeën die zijn afgevallen

*(hier bijhouden wat is voorgesteld en afgewezen, met reden — voorkomt dat
hetzelfde idee over drie maanden terugkomt)*

| Datum | Idee | Reden afwijzing |
|---|---|---|
| | | |

## 6. Publiceren

**Dev en productie draaien op twee verschillende databases.** Een deploy
("Republish") zet alleen code live; rijen in `blog_posts` verhuizen niet mee.
Een artikel dat je in de testomgeving aanmaakt staat dus nooit vanzelf op
doehetextra.nl. Dat is de valkuil waar de eerste blog op stukliep.

### Eenmalig instellen

1. Replit → **Deployments → Settings → Production app secrets** → kopieer de
   waarde van `DATABASE_URL`.
2. Replit → **Secrets** → nieuwe secret `PROD_DATABASE_URL`, plak de waarde.
3. Open een **nieuwe shell** — secrets worden alleen bij het opstarten geladen.

### Daarna, per artikel

```
npm run publish:blog <slug>        # direct live op doehetextra.nl
npm run publish:blog:dev <slug>    # eerst bekijken in de testomgeving
npm run publish:blog               # toont welke artikelen klaarstaan
```

Geen deploy nodig na afloop: dit is data, geen code. Twee keer draaien is
veilig — het script werkt een bestaande slug bij in plaats van een duplicaat te
maken.

Uitzondering: als een artikel een **nieuwe afbeelding** meebrengt, moet die wél
mee in een deploy, want dat is code. Dus eerst de patch mergen en republishen,
daarna pas `publish:blog`.

### Waar een artikel vandaan komt

Twee bestanden in `content/blog/`:

- `<slug>.json` — titel, slug, excerpt, meta-titel, meta-omschrijving,
  focuskeyword, categorie, afbeelding, auteur, leestijd, tags. Velden die met
  een underscore beginnen (`_notities`, `_feitencontrole`) zijn documentatie en
  gaan niet naar de database.
- `<slug>.html` — de body van het artikel.

Het script controleert vóórdat het schrijft: verplichte velden, of de categorie
bestaat, of de genoemde afbeeldingen echt in `client/public/images/` staan, en
of er minstens drie interne links in zitten. Ontbreekt er iets, dan schrijft het
niets weg en zegt het wat er mis is.

### Aandachtspunten

- De **meta-omschrijving** staat ook zichtbaar op de pagina, als cursieve intro
  onder de titel. Schrijf hem dus als leesbare zin.
- **Afbeeldingen** in `client/public/images/`, verwijzen als `/images/naam.webp`.
  Geen tekst in de hero — de pagina legt daar zelf een donkere waas overheen en
  zet de titel eronder.
- **Interne links:** 3 à 8 per artikel, altijd naar bestaande pagina's uit de
  lijst hierboven. Noteer per artikel ook welke bestaande pagina's ernaartoe
  moeten linken.
- **Prerender** (`npm run build && npm run prerender`) maakt een statisch
  fragment voor crawlers zonder JavaScript. Optioneel; Google indexeert de
  pagina ook zonder. Vereist eenmalig `npx playwright-core install chromium` —
  let op: `npx playwright install` haalt een verkeerde versie op.

Publiceren via het dashboard (**Blog & SEO → nieuw artikel**) kan ook, mits je
op de live site bent ingelogd en niet in de testomgeving.
