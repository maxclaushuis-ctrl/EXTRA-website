# EXTRA Vacature-format

Stuur Claude de antwoorden op onderstaande vragen (chat is genoeg, halve zinnen mogen).
Claude genereert daarna de **complete vacature** met alle CMS-velden ingevuld,
klaar om te plakken in Dashboard → Marketing & SEO → Vacatures & SEO.

---

## Wat jij aanlevert (2 minuten)

1. **Functie** — bijv. Bediening / Bartender / Chef / Banqueting / Housekeeping / Front-office / Logistiek
2. **Locatie** — stad of regio (bijv. Amsterdam, Utrecht, Het Gooi)
3. **Type werkplek + opdrachtgever** — Hotel / Restaurant / Eventlocatie / Catering, en de naam
   van de opdrachtgever of "diverse" (bijv. "diverse tophotels Amsterdam")
4. **Dienstverband** — Oproep / Parttime / Fulltime / Bijbaan
5. **All-in uurloon** — bedrag (bijv. €18,50) of range; evt. "vanaf 21 jaar" e.d.
6. **Afwijkende eisen** *(optioneel)* — alleen als anders dan standaard
   (minimumleeftijd, ervaring verplicht, taaleisen, rijbewijs, …)
7. **Bijzonderheden / USP's** *(optioneel)* — wat deze vacature uniek maakt
   (bekende locatie, doorgroeikansen, team, seizoen, …)

> Vraag 6 en 7 mag je weglaten — dan gebruikt Claude de EXTRA-standaarden.

**Voorbeeld van een complete aanlevering:**
> "Nieuwe vacature: banqueting, Amsterdam, diverse 5-sterrenhotels, oproep, €19,20 all-in, minimaal 18 jaar, veel avond/weekend, USP: werken op de mooiste events van de stad"

---

## Wat Claude genereert

**Content (SEO-geoptimaliseerd, EXTRA tone-of-voice):**
- Titel volgens rankstructuur: `[Functie] [Stad] – [zoekterm] gezocht`
- Slug (kort, met focus-zoekwoord)
- Korte omschrijving (voor vacature-overzicht en meta-fallback)
- Introductietekst + Over de rol + Werkomgeving (samen 200–350 woorden, zoekwoord-gedekt)
- 6 taken ("Wat ga je doen?")
- 5–6 eisen ("Wat wij zoeken")
- 6 aanbod-punten ("Wat wij bieden" — altijd incl. dagbetaling, EXTRAATJE, loondienst, NEN 4400-1)
- 4–5 FAQ's met antwoorden (als JSON, klaar voor het CMS-veld)
- CTA-tekst

**SEO-velden:**
- Focus-zoekwoord (op basis van zoekvolume-logica: "[functie] vacature [stad]" e.d.)
- Meta title (≤60 tekens) en meta description (≤155 tekens, met CTA)
- OG-title en OG-description
- Canonical URL

**Automatisch door de pagina geregeld (geen actie nodig):**
- JobPosting structured data incl. all-in uurloon (baseSalary), directApply,
  rollende validThrough van 90 dagen
- FAQPage structured data (extra ruimte in zoekresultaten)
- BreadcrumbList structured data
- Lichte EXTRA-huisstijl: paarse hero, witte content, all-in loon prominent

---

## Vaste redactionele regels

- Titels en koppen in Poppins-stijl tone: energiek, direct, "jij"-vorm
- Zoekwoord in: titel, H1, eerste alinea, meta title, meta description, slug
- All-in uurloon altijd benoemen in de tekst én in de hero
- Nooit een salaris van €0 of placeholder-bedragen in structured data
- Standaard-aanbodpunten altijd aanwezig: dagbetaling mogelijk, EXTRAATJE
  beloningssysteem, iedereen in loondienst bij EXTRA, NEN 4400-1 gecertificeerd
- Publiceren op status "published" zet de vacature live op /vacatures/[slug]
