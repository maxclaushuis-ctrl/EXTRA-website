# Sollicitanten 3.0 (Hotels)

De flow van gesprek tot Onboarding of Archief, uit de borden I tot en met J2 en
de bouwstappen D1 tot en met D10 van het bouwplan. Gebouwd op 7 november 2026.

## Wat er is

| Stap | Wat | Waar |
| --- | --- | --- |
| D1 | Menu: Sollicitanten, Onboarding (was Medewerkers) en Archief, boven TWV | `DashboardMockup.tsx` |
| D2 | Gesprekken per week of dag, kleur per branche, vinkje als de kandidaat bij Job "Ik kom" tikte | `sollicitanten/Overzicht.tsx` |
| D3 | Sollicitantenkaart vóór de intake: Intakeformulier, Niet verschenen, Verzetten, Persoonsgegevens aanpassen, gesprek met Job | `sollicitanten/Kaart.tsx` |
| D4 | Intake op de iPad, negen onderdelen; elk antwoord wordt meteen als concept bewaard | `sollicitanten/Intake.tsx`, vragen in `shared/sollicitantRegels.ts` |
| D5 | Foto: camera, achtergrond weghalen op de iPad zelf, branchekleur; overslaan kan altijd | `sollicitanten/Intake.tsx` |
| D6 | Beoordeling: vier schuiven, Afwijzen, Twijfel, Ref. en doc. checken | `sollicitanten/Kaart.tsx` |
| D7 | Ref. en doc. check: lijst met dagen open, kaart met Besluit, Documentcheck en Referentiecheck (met goedkeuren zonder referentie) | `Overzicht.tsx`, `Kaart.tsx` |
| D8 | EXTRA check: lijst achter de knop EXTRA check, kaart met Afwijzen en Onboarden | `Overzicht.tsx`, `Kaart.tsx` |
| D9 | Onboarding (namenlijst) en Archief met Terugzetten | `sollicitanten/index.tsx` |
| D10 | Afwijzen met reden en mail vooraf zien, ook vanuit Kandidaten | `sollicitanten/Afwijzen.tsx`, `server/sollicitanten/afwijsmail.ts` |
| | Beoordelen-lijst (was nog niet ontworpen): wie op de beoordeling wacht | `Overzicht.tsx` |

Server: `server/sollicitanten/sollicitantRoutes.ts`. Tabellen: `sollicitant_dossiers`
en `sollicitant_gebeurtenissen` (migratie 0031, alleen nieuw). Tests:
`npm run sollicitant:test` en `npm run testdata:test`.

## Schakelaars (Secrets in Replit)

| Secret | Wat het doet |
| --- | --- |
| `SOLLICITANTEN_V2=1` | Zet het nieuwe menu en de nieuwe schermen aan. Zonder: het dashboard blijft zoals het was. In de testomgeving staat het vanzelf aan met `TESTOMGEVING=1`. |
| `SOLLICITANTEN_AFWIJSMAIL=0` | Zet de afwijsmail uit. Afwijzen werkt dan gewoon, zonder mail. |

Het oude sollicitatieformulier en het oude overzicht Medewerkers blijven
bestaan; onderaan Gesprekken en Onboarding staat een link naar de oude weergave.

## Keuzes die ik zelf heb gemaakt

Max gaf op 7 november akkoord om alles in één keer te bouwen. Waar de borden
niets zeiden, koos ik dit:

1. **Beoordelen-lijst**: een tabel zoals Ref. en doc. check: sollicitant, branche, intake afgerond, dagen in de stap, interviewer.
2. **EXTRA check** telt niet mee in het getal van Ref. en doc. check; het is een eigen stap met een eigen getal op de knop.
3. **Onboarden vanuit EXTRA check** kan pas als het ID (en bij TWV het verblijfsdocument) gezien is. De referentie mag open staan, maar niet negatief zijn. Op de EXTRA check-kaart staan daarom de invoerkaarten van de check.
4. **Accepteren** kan alleen met ID gezien en een positieve of overgeslagen referentie (bij TWV ook het verblijfsdocument).
5. **Afwijsredenen**: de zeven uit bord H2, plus Referentie negatief, ID niet getoond, Te jong, Zelf afgehaakt (standaard zonder mail) en Past nu niet bij de functie. Elke reden heeft een eigen mailtekst in `shared/sollicitantRegels.ts`. Bij Anders vul je zelf een reden in; de mail is dan algemeen, of je past hem aan met Mail aanpassen.
6. **Niet verschenen** loopt via dezelfde dialoog, met Niet komen opdagen al gekozen. De mail kun je uitvinken.
7. **Negatieve referentie** opent meteen Afwijzen met Referentie negatief. Annuleer je, dan blijft Negatief staan en is Accepteren niet mogelijk.
8. **Twee keer geen gehoor**: de kaart zegt dat je het nog eens kunt proberen, kunt goedkeuren zonder referentie of Twijfel kunt kiezen.
9. **DISC**: de verdeling van de woorden volgt de regel dat elke stijl twee keer tegenover elk van de andere drie staat. Bij gelijke stand gaat I voor S voor C voor D.
10. **Functies zonder eigen script** (keuken, housekeeping, front office, logistiek) krijgen het script Algemeen: alle gedeelde onderdelen, met een korte ervaring en praktische zaken. Afwas krijgt het horecascript zonder cocktails, barista en de score Bar.
11. **Verplichte velden**: geen. Bij Intake afronden zie je welke vragen leeg zijn en kies je Terug of Toch afronden.
12. **Terugzetten** zet de stap terug en begint de teller van dagen opnieuw. De status in Kandidaten gaat terug naar wat hij was. Een verstuurde afwijsmail is niet terug te halen.
13. **Bewaartermijn**: 6 maanden na archiveren, opgeslagen in het bestaande veld `retention_until`. Er wordt niets automatisch verwijderd.
14. **Geen gendervormen**: teksten gebruiken de voornaam of "de sollicitant".
15. **Foto**: de uitgeknipte foto wordt als kleine jpeg in het dossier bewaard, niet in de opslag van cv's.

## De foto en het uitknippen

Na Gebruik foto haalt de iPad zelf de achtergrond weg met MediaPipe. De iPad
downloadt daarvoor eenmalig de code (cdn.jsdelivr.net) en het model van Google
(storage.googleapis.com). De foto zelf gaat nergens heen. Lukt het downloaden
niet, dan wordt de foto bewaard zonder uitknippen en staat dat op het scherm.

Getest in deze werkomgeving: de camera, het samenvoegen op de branchekleur en het
terugvallen. Het officiële model kon hier niet geladen worden; test het
uitknippen daarom op een echte iPad in de testomgeving (bouwplan D5).

## Testen in de testomgeving

1. `npm run testdata:vullen` vult ook dossiers in elke stap: drie op Beoordelen,
   vier bij de Ref. en doc. check (waarvan één met TWV en één met eerste baan),
   één op EXTRA check, één in Onboarding en drie in het Archief.
2. Lisa de Vries en de andere gesprekken van deze week staan vóór de intake.
   Open Lisa in het weekoverzicht en neem de intake af op een iPad.
3. Mails staan in het Mailvenster in de gele balk.

## Terugdraaien

- `SOLLICITANTEN_V2` uit de Secrets halen en opnieuw publiceren. Het menu en de
  schermen zijn dan weer zoals vroeger; de tabellen blijven staan.
- `migrations/manual/0031_sollicitanten/down.sql` verwijdert de tabellen, maar
  alleen met de hand en met akkoord van Max. Keur in Replit nooit een publicatie
  goed waarin DROP of delete staat.
