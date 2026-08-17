# SEO-onderbouwing — /blog/betrouwbaar-horeca-uitzendbureau-kiezen

Opgesteld volgens de skill `schrijven-van-seo-blogs`, op basis van de briefing
van Max (blog 1 van twee). De strategie hieronder is die van de briefing; de
feiten zijn opnieuw gecontroleerd en op drie punten gecorrigeerd — zie §6.

---

## 1. SEO-strategie

**Primaire zoekterm:** betrouwbaar horeca-uitzendbureau kiezen

**Secundair:** wtta uitzendbureau · toelatingsplicht inlener · temper uitspraak
uitzendbureau · nen 4400-1 uitzendbureau · inlenersaansprakelijkheid horeca

**Zoekintentie:** commercial investigation met een informationele kern. Mensen
willen eerst snappen wat er verandert, pas daarna kiezen.

**Doelgroep:** hotelmanagers, F&B-managers en HR/inkoop bij horecaketens en
eventlocaties in Amsterdam die nu inlenen via een uitzendbureau of platform.

**Contenthoek:** de twee juridische ontwikkelingen vertaald naar één praktische
vraag aan je leverancier. Bestaansrecht: de SERP bestaat uit generieke
"kies een betrouwbaar uitzendbureau"-checklists (KHN, Unique) en
juridisch-technische Wtta-stukken voor HR-professionals in bredere sectoren.
Niets koppelt het aan horeca, en — belangrijker — vrijwel niets zet de datums
goed op een rij.

**Waar dit artikel information gain toevoegt:**

1. **De datums kloppen, en het artikel legt uit welke datum van wie is.** De
   berichtgeving schuift structureel een jaar. De datum die er voor een inlener
   het eerst toe doet (31 december 2026) ligt bovendien niet bij hemzelf maar
   bij zijn leverancier. Dat heb ik nergens anders zo geformuleerd gezien.
2. **De koppeling SNA/NEN 4400-1 → toelatingsaanvraag.** Een geldig
   SNA-keurmerk mag bij de aanvraag in de plaats komen van een apart
   inspectierapport. Dat maakt het certificaat nú al relevant in plaats van pas
   in 2027, en het is een controleerbaar feit in plaats van een verkoopargument.
3. **De vijf vragen zijn geformuleerd als vragen met een controleerbaar
   antwoord** ("vraag om het registratienummer, niet om een logo"), niet als
   algemene aandachtspunten.

**Cannibalisatie:** laag. `/nen-4400-1-certificering` blijft de bestemming voor
de zoekterm rond het keurmerk zelf; deze blog legt uit wat er verandert en
verwijst door. Ten opzichte van `/blog/zzp-inhuren-horeca` is de scheiding
scherp: dat artikel gaat over zzp'ers die je zelf inhuurt, dit gaat over de
partij van wie je inleent. Ze linken naar elkaar in plaats van te concurreren.

De briefing noemde ook een blog `personeelstekort-horeca-2026`. Dat artikel
bestaat niet in de productiedatabase; de verwijzing is daarom niet overgenomen.

**Bewust níét behandeld:** een volledige vergelijking met Temper. De uitspraak
staat er als nieuwsanker, zodat een eventuele latere Temper-alternatiefpagina
niet overlapt.

---

## 2. SEO-metadata

**URL:** `/blog/betrouwbaar-horeca-uitzendbureau-kiezen`

**SEO title — voorkeur:** Betrouwbaar horeca-uitzendbureau kiezen: dit verandert *(54 tekens)*

**Alternatief 2:** Horecapersoneel inlenen: wat de Wtta en Temper betekenen

**Alternatief 3:** Uitzendbureau kiezen voor horecapersoneel: waar let je op?

**Meta description** *(157 tekens)*: De Temper-uitspraak en de Wtta veranderen
wat je van een uitzendbureau mag verwachten. De data die kloppen, en de vijf
vragen die je je leverancier nu stelt.

---

## 3. Afbeeldingen

De briefing vroeg om drie foto's, waaronder een accountmanager in gesprek met
een hotelmanager. Die fotografie bestaat niet in de repository en is niet te
verzinnen, dus het zijn drie eigen visuals in huisstijl geworden. Komt er later
echte fotografie, dan is de hero het eerste dat vervangen mag worden — een foto
van mensen is daar sterker dan een symbool.

| Positie | Bestand | Wat het toevoegt |
|---|---|---|
| Hero | `betrouwbaar-horeca-uitzendbureau-kiezen.webp` (1200×630) | Keurmerkschild met vinkje. Bewust zonder tekst: de pagina legt er een donkere gradient overheen en zet de titel eronder. |
| Bij "De Wtta: welke datum wanneer geldt" | `wtta-tijdlijn-horeca.webp` (1200×500) | De vier momenten naast elkaar. De eerste en de laatste zijn zwart uitgelicht: dat zijn de twee die je moet onthouden. |
| Bij de vijf vragen | `checklist-uitzendbureau-kiezen-horeca.webp` (1200×640) | Maakt de lijst scanbaar en deelbaar — de meest waarschijnlijke passage om door te sturen naar een collega. |

Bronbestanden: `scripts/blog-visuals/wtta-*.svg`, gerenderd op 2× en
teruggeschaald naar WebP.

---

## 4. Interne links in het artikel

| Anchor | URL | Reden |
|---|---|---|
| zzp'ers inhuren in de horeca | `/blog/zzp-inhuren-horeca` | Gerelateerd artikel; geeft dat artikel meteen een tweede inkomende link. |
| NEN 4400-1-certificering | `/nen-4400-1-certificering` | Twee keer, allebei in een passage waar het certificaat het bewijsstuk is. |
| onze werkwijze | `/horeca-uitzendbureau-amsterdam-werkwijze` | Vervolgstap voor wie wil zien hoe het in de praktijk loopt. |
| hoe horecapersoneel inhuren bij ons werkt | `/horeca-personeel-inhuren` | Commerciële pagina, in de slotalinea. |
| plaats vrijblijvend een personeelsaanvraag | `/personeelsaanvraag` | Money page, eind-CTA. |

Alle URL's gecontroleerd tegen `client/src/App.tsx` en de blogslugs in de
productiedatabase. Relatief geschreven, niet absoluut zoals in de briefing — dat
is de siteconventie en het maakt de links narekenbaar voor
`npm run content:links`.

---

## 5. Bestaande pagina's die naar dit artikel zouden moeten linken

Nog niet uitgevoerd; dit zijn codewijzigingen in `client/src` en die horen in een
eigen commit met de build-check erlangs.

| Pagina | URL | Voorgestelde anchor | Positie |
|---|---|---|---|
| NEN 4400-1-certificering | `/nen-4400-1-certificering` | wat er met de Wtta verandert | Onderaan, bij een sectie over actuele regelgeving |
| Onze werkwijze | `/horeca-uitzendbureau-amsterdam-werkwijze` | waarom de keuze van je uitzendbureau nu zwaarder weegt | Bij de uitleg over kwaliteitswaarborgen |
| Horeca uitzendbureau Amsterdam | `/horeca-uitzendbureau-amsterdam` | de regels rond inlenen | Bij de FAQ over loondienst versus zzp |

---

## 6. Externe bronnen en feitencheck

Drie dingen uit de briefing klopten niet. Ze staan hier expliciet, omdat het
soort fout is dat je twee keer maakt als je het niet opschrijft.

| Claim in de briefing | Wat er klopt | Bron |
|---|---|---|
| "Wtta sinds 1 juli 2026 deels van kracht" | De wet treedt in werking op **1 januari 2027** | Nederlandse Arbeidsinspectie, ABU, Ondernemersplein |
| "Vanaf 1 januari 2027 mag je alleen nog inlenen bij toegelaten bureaus" | Dat is **1 januari 2028**; een jaar later | idem |
| "Temper overweegt cassatie" | Temper is in **juli 2026** daadwerkelijk in cassatie gegaan | ZiPconomy, Flexmarkt |
| "94% van de beroepsgroepen krap" | **87 van de 93** beroepsgroepen (94%) krap **of zeer krap**, eerste kwartaal 2026 | UWV via HRMorgen |

Verder gebruikt: gerechtshof Amsterdam 16 juni 2026, aangespannen door FNV en
CNV, getoetst aan de Deliveroo- en Helpling-lijn (ZiPconomy, NOS); en de regel
dat een SNA-keurmerk bij de toelatingsaanvraag in de plaats mag komen van een
inspectierapport (ABU).

**Niet ingevuld:** de hoogte van de boetes onder de Wtta. Die staat in geen van
de geraadpleegde bronnen, dus er staat geen bedrag in het artikel.

---

## 7. Structured data

`BreadcrumbList` wordt al automatisch per blogpagina geïnjecteerd
(`server/seo.ts`), plus `EmploymentAgency` en `WebSite` in de shell. Geen
`FAQPage` — er is geen FAQ-sectie. `BlogPosting` zou kloppen maar vraagt een
aparte wijziging in `seo.ts` om `datePublished`, `dateModified` en `author` uit
de database te halen; dat is geen onderdeel van dit artikel.

Werk `dateModified` alleen bij als de cassatie of een verschuiving in de
Wtta-tijdlijn het artikel inhoudelijk verandert.

---

## 8. Vervolgkansen

1. **Wat is een G-rekening en waarom vraag je ernaar?** — "g-rekening
   uitzendbureau", informational. Verdiept checklistpunt 5. Linkt naar
   `/nen-4400-1-certificering`.
2. **Inlenersaansprakelijkheid: waar ben je als horecabedrijf voor
   aansprakelijk?** — "inlenersaansprakelijkheid horeca", informational met
   commerciële staart. Nu twee alinea's; draagt een eigen pagina.
3. **Zzp'er of uitzendkracht: het verschil in de praktijk** — "zzp of
   uitzendkracht horeca". Let op de scheiding met `/blog/zzp-inhuren-horeca`;
   pas doen als die overlap scherp te maken is, anders liever dat artikel
   uitbreiden.
