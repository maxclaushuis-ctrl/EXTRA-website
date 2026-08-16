# SEO-onderbouwing — /blog/zzp-inhuren-horeca

Opgesteld volgens de skill `schrijven-van-seo-blogs`. Dit bestand hoort bij
`zzp-inhuren-horeca.json` en `.html` en wordt niet gepubliceerd; het legt vast
waaróm het artikel is zoals het is, zodat een volgende bewerking niet opnieuw
begint.

**Vervangt:** het bestaande artikel op `/blog/minimumuurtarief-van-36-voor-zzp-ers`.

---

## 1. SEO-strategie

**Primaire zoekterm:** zzp'ers inhuren horeca

**Secundair:** schijnzelfstandigheid horeca · rechtsvermoeden uurtarief ·
minimumtarief zzp · zzp'er onder 38 euro · Wet DBA horeca

**Zoekintentie:** gemengd — informational (wat verandert er?) met een duidelijke
commercial-investigation-staart (hoe blijf ik flexibel zonder dit risico?). De
SERP bevestigt dat: bijna uitsluitend uitleggende pagina's van accountants,
advocaten en brancheorganisaties, geen productpagina's.

**Doelgroep:** eigenaren, F&B-managers en HR van hotels, restaurants, cateraars
en eventlocaties die vandaag met zzp'ers werken.

**Probleem dat ze willen oplossen:** "Mag ik dit nog, en zo ja, hoe?"

**Gewenste vervolgstap:** personeelsaanvraag of contact.

**Contenthoek:** de SERP legt de wet uit; dit artikel begint met het misverstand
wegnemen ("er komt géén minimumtarief") en vertaalt de regel daarna naar
horecapraktijk. Twee dingen die de meeste concurrerende pagina's niet doen:

1. **Uitleggen dat het tarief niet de test is.** De meeste pagina's zetten €38
   centraal en laten de lezer achter met het idee dat hij daarmee klaar is. Het
   citaat van KHN over bediening, bar, keuken en afwas als "ingebedde"
   werkzaamheden maakt concreet waarom dat in de horeca juist níét opgaat.
2. **Het verschil tussen €36 en €38 uitleggen.** Vrijwel alle pagina's noemen
   één van beide bedragen zonder te vertellen waar het andere vandaan komt. Dat
   levert precies de verwarring op waar het oude artikel in trapte.

**Waarom deze pagina bestaansrecht heeft:** EXTRA werkt uitsluitend met mensen
in loondienst. Dat is geen marketinghoek maar het uitgangspunt van het bedrijf,
en het maakt de commerciële vervolgstap inhoudelijk verdiend in plaats van
opgeplakt. De landingspagina's roepen al "geen zzp-risico"; dit artikel is de
onderbouwing waar die claim tot nu toe naar moest verwijzen.

**Cannibalisatie:** geen. Er staat geen enkele bestaande blog over zzp of
schijnzelfstandigheid. De landingspagina's noemen "geen zzp-risico" alleen als
verkoopargument in een opsomming en bedienen een andere (transactionele)
intentie. Geen samenvoeging nodig.

---

## 2. SEO-metadata

**URL:** `/blog/zzp-inhuren-horeca`

Kort, zonder jaartal en zonder bedrag — bewust, omdat het drempelbedrag jaarlijks
meebeweegt en dit artikel bedoeld is om bijgewerkt te worden in plaats van
vervangen. Precies dáár ging de oude slug (`…van-36…`) op stuk.

**SEO title — voorkeur:** Zzp'ers inhuren in de horeca: de regels vanaf 2026 *(50 tekens)*

**Alternatief 2:** Zzp'er inhuren in de horeca? Dit verandert per 2026

**Alternatief 3:** Geen minimumtarief, wel een rechtsvermoeden: zzp in de horeca

**Meta description** *(153 tekens)*: Geen minimumtarief, wél een rechtsvermoeden
vanaf 31 december 2026. Wat de nieuwe wet betekent als je in de horeca met
zzp'ers werkt — en wat je nu doet.

Let op: deze tekst staat óók zichtbaar als cursieve intro onder de H1
(`NieuwsArtikel.tsx`), dus geschreven als gewone zin.

---

## 3. Afbeeldingen

| Positie | Bestand | Wat het toevoegt |
|---|---|---|
| Hero | `zzp-inhuren-horeca.webp` (1200×630) | De datum is de kern van het nieuws. Bewust zonder kleine tekst: de pagina legt er zelf een donkere gradient overheen en zet de titel eronder. |
| Na "Wat het rechtsvermoeden wél doet" | `rechtsvermoeden-uurtarief-bewijslast.webp` (1200×620) | Twee kolommen, onder en boven het drempelbedrag. Maakt in één blik zichtbaar dat er bóven het bedrag ook iets overblijft — de nuance die in tekst vaak wordt weggelezen. |
| Bij "Wat de Belastingdienst nu al kan doen" | `tijdlijn-handhaving-schijnzelfstandigheid.webp` (1200×480) | Vier data, vier gevolgen. De handhaving is in stappen veranderd en juist die volgorde verklaart waarom "er wordt toch niet gehandhaafd" niet klopt. |

Alt-teksten staan in de HTML en beschrijven wat er te zien is, zonder keywords
erin te duwen. Bronbestanden: `scripts/blog-visuals/zzp-*.svg`, gerenderd naar
WebP op 2× en teruggeschaald.

---

## 4. Interne links in het artikel

| Anchor | URL | Reden |
|---|---|---|
| NEN 4400-1-certificering | `/nen-4400-1-certificering` | Staat in de alinea over inlenersaansprakelijkheid — daar is het certificaat het bewijsstuk, dus de link is inhoudelijk verdiend. |
| onze werkwijze | `/onze-werkwijze` | Voor wie na "dan maar inlenen" wil weten hoe dat loopt. |
| horeca uitzendbureau Amsterdam | `/horeca-uitzendbureau-amsterdam` | Lokale commerciële pagina, aangeboden aan wie specifiek in Amsterdam zoekt. |
| Vraag personeel aan | `/personeelsaanvraag` | De money page, in de slot-CTA. |
| contact | `/contact` | Lagedrempelig alternatief voor wie eerst wil sparren. |

Vijf links, allemaal gecontroleerd tegen `client/src/App.tsx`. Geen enkele link
is in een zin gedrukt waar hij niet hoort.

---

## 5. Bestaande pagina's die naar dit artikel zouden moeten linken

Nog niet uitgevoerd — dit zijn codewijzigingen in `client/src`, die horen in een
eigen commit met de build-check erlangs.

| Pagina | URL | Voorgestelde anchor | Positie |
|---|---|---|---|
| Horeca uitzendbureau Amsterdam | `/horeca-uitzendbureau-amsterdam` | wat de nieuwe zzp-regels betekenen | Bij de FAQ-vraag "Is het personeel van EXTRA in loondienst of zijn het ZZP'ers?" — daar staat het antwoord al, dit is de verdieping. |
| Horeca personeel inhuren | `/horeca-personeel-inhuren` | zzp'ers inhuren in de horeca | Bij het blok "Geen ZZP-risico". |
| Hotelpersoneel gezocht | `/hotelpersoneel-inhuren` | de regels rond schijnzelfstandigheid | Bij "Volledig in loondienst". |
| Blogoverzicht | `/blog` | — | Komt automatisch. |

Dit is meteen het antwoord op de Ahrefs-melding "Page has only one dofollow
incoming internal link": een nieuw artikel begint met precies één inlink vanaf
`/blog`, tenzij je er bewust een paar bij zet.

---

## 6. Externe bronnen

Alleen gebruikt voor de feitencheck, niet als uitgaande link in de tekst.

| Bron | Waarvoor |
|---|---|
| eerstekamer.nl — wetsvoorstel 36.783 | Titel van de wet, stemdata, Staatsblad |
| zzpnieuws.nl | Het verschil tussen de €36 in de wettekst en de €38 in de praktijk, en dat dat afgeronde bedrag nog bij ministeriële regeling moet worden vastgesteld |
| dezaak.nl en zipconomy.nl | Handhaving 2026: geen verzuimboetes, wél vergrijpboetes, naheffing vanaf 1-1-2025 |
| khn.nl | Ingebedde werkzaamheden in de horeca |
| zipconomy.nl (SZW / Zelfstandigen Enquête Arbeid, TNO-CBS) | Het aandeel zzp'ers onder het drempelbedrag |

Volledige verantwoording per claim staat in `_feitencontrole` in de JSON,
inclusief wat er bewust **niet** in staat: er zijn geen horeca-uurtarieven
genoemd, want daar is geen betrouwbare openbare bron voor.

---

## 7. Structured data

Al aanwezig en automatisch: `BreadcrumbList` per blogpagina (`server/seo.ts`),
`EmploymentAgency` en `WebSite` in de shell, en sinds augustus een server-side
fragment met de volledige tekst voor crawlers zonder JavaScript
(`server/contentFragment.ts`). Aanvullende markup is niet nodig. `BlogPosting`
zou kunnen, maar dan moeten `datePublished`, `dateModified` en `author` uit de
database komen — dat is een aparte wijziging in `seo.ts`, geen onderdeel van dit
artikel.

---

## 8. Vervolgkansen

Alleen ideeën die een aantoonbaar andere zoekintentie bedienen.

1. **Wat kost een uitzendkracht in de horeca per uur?** — zoekterm "kosten
   uitzendkracht horeca", commercial investigation. Iedereen die dit artikel
   leest, komt bij de vraag "en wat kost het alternatief dan?" Linkt naar
   `/personeelsaanvraag`.
2. **Inlenersaansprakelijkheid: waar ben je als horecabedrijf voor
   aansprakelijk?** — zoekterm "inlenersaansprakelijkheid horeca",
   informational. Nu één alinea in dit artikel; het onderwerp draagt een eigen
   pagina. Linkt naar `/nen-4400-1-certificering`.
3. **Personeelsplanning bij schommelende bezetting** — zoekterm "flexibele
   schil horeca", commercial investigation. Sluit aan op het slot van dit
   artikel en op de bestaande housekeeping-blog.

Niet doen: een tweede artikel over hetzelfde onderwerp met "2027" in de titel.
Dit artikel wordt bijgewerkt, niet gedupliceerd.
