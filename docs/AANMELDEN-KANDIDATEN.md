# Aanmeldformulier 3 en Kandidaten 3.0

Gebouwd op 8 november 2026 uit de borden A, A2, B, B2 (formulier) en G, H, H2, H3
(Kandidaten), het ontwerp "Instroom 3.0 fase 1" en het bouwplan "fase 1a".

## Wat er is

| Onderdeel | Wat | Waar |
| --- | --- | --- |
| Formulier | Eén scherm: functie (6 tegels), over jou, contact, hoe gevonden, twee knoppen. Geen cv, geen taalniveau, geen automatische afwijzing | `client/src/pages/d3/AanmeldenNieuw.tsx` |
| Buitenland | "Ik woon nog niet in Nederland" vervangt de postcode door het woonland | idem |
| Server | `POST /api/aanmelding`, plaats bij postcode (`GET /api/postcode`), dubbele personen, Job starten | `server/aanmelding.ts` |
| Bedankpagina | `/aanmelden/ontvangen` en `/en/apply/received` (noindex) | `AanmeldenOntvangen.tsx` |
| Kandidaten | Overzicht met bolletjes per toestand, tabs per branche, filter, dossier met aandachtspunt, profiel, contact, tijdlijn en notities, gesprek met Job | `client/src/pages/dashboard/kandidaten/` |
| Regels | Wie in Kandidaten staat, welk bolletje, welke tekst, sinds wanneer | `shared/kandidaatRegels.ts` (tests: `npm run kandidaat:test`) |
| Knoppen | Accepteren (uitnodigingsmail H3), zelf inplannen, afwijzen (H2), planner toewijzen, dubbel dossier beoordelen | `server/kandidaten/kandidaatRoutes.ts` |
| Mails | Uitnodiging (nieuw), herinnering met twee knoppen, afwijsmail met "je gesprek met Job" en "Groet," | `server/job/jobMails.ts`, `server/sollicitanten/afwijsmail.ts` |

Schema: migratie 0032, alleen nieuwe kolommen op `candidates` (allemaal leeg voor
bestaande kandidaten) en de nieuwe tabel `kandidaat_mogelijke_match`.

## Schakelaars (Secrets in Replit)

| Secret | Wat het doet |
| --- | --- |
| `AANMELDFORMULIER` | `huidig` (standaard): iedereen ziet het huidige formulier. `test`: het nieuwe alleen met `?formulier=nieuw`. `nieuw`: iedereen. In de testomgeving staat hij vanzelf op `nieuw`. |
| `KANDIDATEN_V2=1` | Het nieuwe Kandidaten-scherm. Onderaan staat een link naar de oude weergave. In de testomgeving vanzelf aan. |
| `JOB_ENABLED=1` | Nodig voor het nieuwe formulier: zonder Job vraagt niemand de rest. Zonder Job toont de bedankpagina "We nemen snel contact met je op." |
| `JOB_WA_NUMMER` | Het WhatsApp-nummer van Job (E.164). Voor de knop "Open WhatsApp" op de bedankpagina en "Verder via WhatsApp" in de herinneringsmail. Zonder: alleen de weblink. |

Zet `AANMELDFORMULIER=nieuw` in productie pas als Job aan staat en de
WhatsApp-sjablonen goedgekeurd zijn.

## Keuzes die ik zelf heb gemaakt

1. **Wie in Kandidaten staat:** alleen lopende kandidaten vóór het gesprek. Met een gespreksdatum staan ze in Sollicitanten, afgewezen in het Archief. De groene rijen van bord G vervallen daardoor.
2. **Branche:** bediening en bar is Events; keuken, afwas, housekeeping en front office zijn Hotels. Een ingang via een vacature of branchepagina gaat voor. Dit geldt ook voor de kleuren in Sollicitanten. De banners van bestaande mails zijn niet aangepast.
3. **Afwas** wordt opgeslagen als functie keuken met het vinkje afwas (zodat het Planbord het kent) en als eerste keus `afwas`. Job en de labels lezen die eerste keus; Job vraagt bij afwas naar ervaring in een spoelkeuken.
4. **"Liever door zonder WhatsApp"** gaat na het versturen direct naar het webgesprek met Job. De startmail met dezelfde link gaat ook uit.
5. **Jonger dan 17 en woont in het buitenland:** geen blokkade in het formulier, maar een geel bolletje voor de planner.
6. **Afwijsredenen in Kandidaten:** de acht van bord H2 plus Te jong en Zelf afgehaakt. Er is geen standaardreden; de planner kiest. Afwijzen stopt ook de herinneringen van Job.
7. **Accepteren** zet de kandidaat op uitgenodigd en stuurt de uitnodigingsmail met de knop "Kies een moment". Zonder cv vraagt het dashboard eerst "Toch uitnodigen?". Met een open mogelijk dubbel dossier kan het niet.
8. **Na 48 uur zonder gekozen moment** wordt het bolletje geel. Een automatische herinnering voor die stap is er nog niet.
9. **Dubbele personen:** zelfde telefoon, zelfde e-mail, of zelfde naam met geboortedatum. Het systeem voegt nooit samen; de planner kiest Zelfde persoon of Iemand anders.
10. **Fase, reden en sinds** worden afgeleid, niet opgeslagen. Alleen de planner wordt opgeslagen.
11. **Intakeformulier** staat niet in het dossier van Kandidaten; de intake hoort bij het gesprek in Sollicitanten.
12. **Bericht via Job** opent het gesprek in de WhatsApp-inbox (of het webgesprek). Een bericht namens Job sturen vanuit het dossier komt later.
13. **Subtekst** "Kies je ideale (bij)baan" in plaats van "Kies je de ideale (bij)baan".
14. **AI-melding** onder de knoppen: "Job is onze AI-recruiter. Een collega van EXTRA neemt altijd de beslissing."
15. **Cv bekijken** vanuit het nieuwe dossier kan nog niet; dat staat in de oude weergave.

## SEO

- Titel en omschrijving van `/aanmelden` en `/en/apply` blijven gelijk.
- De H1 wordt "Werken bij EXTRA aanmelden in één minuut" zodra iemand het nieuwe formulier ziet. Het prerender-fragment toont nog het huidige formulier. Bij de overstap naar `nieuw` in productie: prerender opnieuw draaien en de kopwijziging nalopen volgens de werkwijze van de website.
- De Engelse omschrijving ("in three steps") klopt dan niet meer; herschrijven bij de overstap.

## Testen in de testomgeving

1. Open `/aanmelden` (uitgelogd): je ziet het nieuwe formulier. Meld een fictief persoon aan, één keer met en één keer zonder WhatsApp.
2. Meld nog iemand aan met hetzelfde telefoonnummer: in Kandidaten staat die geel met "mogelijk dubbel dossier".
3. Het vulscript zet kandidaten klaar in elke toestand: rood (geen reactie), oranje 1 en 2, geel (werkautorisatie, buitenland, dubbel dossier, geen ervaring).
4. Probeer in het dossier Accepteren, Of plan zelf een moment, Afwijzen, aan mij toewijzen en een notitie. Mails staan in het Mailvenster.

## Terugdraaien

- `AANMELDFORMULIER` op `huidig` of weghalen: iedereen ziet weer het huidige formulier.
- `KANDIDATEN_V2` weghalen: het oude Kandidaten-scherm.
- `migrations/manual/0032_aanmelden_kandidaten/down.sql` alleen met de hand en met akkoord van Max. Keur in Replit nooit een publicatie goed waarin DROP of delete staat.
