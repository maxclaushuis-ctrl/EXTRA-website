# Sollicitatieformulier versie 2

Het gesprek op kantoor, het beoordelingsdashboard erna en de overdracht naar het
medewerkersdossier. Gebouwd op 10 november 2026, naast versie 1. Versie 1 en alle
bestaande dossiers blijven precies zoals ze waren.

Buiten deze opdracht en niet aangeraakt: het aanmeldformulier op de website, de
vragen en teksten van Job, het cv-scoremodel, Planbord, EXTRAATJE en de
medewerkersapp. Het formulier leest het voortraject alleen (aansluitlaag in
`server/sollicitanten/intakeV2Routes.ts`, functie `voortrajectVan`).

## Waar staat wat

| Wat | Waar |
| --- | --- |
| Hoofdstukken, keuzelijsten, vraagteksten met vast kenmerk, alle afleidingen | `shared/intakeV2.ts` |
| Routes en opslag | `server/sollicitanten/intakeV2Routes.ts` |
| Het formulier (desktop en tablet) | `client/src/pages/dashboard/sollicitanten/IntakeV2.tsx` |
| Het dashboard na het gesprek | `client/src/pages/dashboard/sollicitanten/KaartV2.tsx`, ingehaakt in `Kaart.tsx` |
| Profiel in het medewerkersdossier | `client/src/pages/dashboard/sollicitanten/MedewerkerProfiel.tsx`, tabblad in `MedewerkersTab.tsx` |
| Versie 1, ongewijzigd | `shared/sollicitantRegels.ts` (`ONDERDELEN`), `sollicitanten/Intake.tsx` |
| Tests | `npm run intake:test` (118 regels), `npm run intake:ketentest` (81 stappen tegen de echte routes en database) |

## Schakelaar

`INTAKE_V2`: in de testomgeving vanzelf aan, uit met `INTAKE_V2=0`. Elders alleen
aan met `INTAKE_V2=1`. In productie staat hij dus uit tot Max hem aanzet.

De schakelaar bepaalt alleen met welk formulier een **nieuwe** intake begint.

| Situatie | Wat er gebeurt |
| --- | --- |
| Afgeronde intake van versie 1 | Blijft versie 1, met de oude kaart, de oude scores en de vier schuiven |
| Concept van versie 1 | Wordt in versie 1 afgemaakt, ook met de schakelaar aan |
| Nieuwe intake, schakelaar aan | Versie 2 |
| Intake van versie 2, schakelaar daarna uit | Blijft versie 2: concept gaat verder, afgerond dossier blijft compleet leesbaar |
| Nieuwe intake, schakelaar uit | Versie 1 |

Terugschakelen kost dus geen gegevens. Het versienummer staat per dossier in
`sollicitant_dossiers.intake_versie`.

## Opslag (migratie 0034, alleen toevoegen)

- `sollicitant_dossiers.intake_versie` (standaard 1) en `intake_revisie` (standaard 0).
- Nieuwe tabel `intake_antwoorden`: elke wijziging van een antwoord als eigen regel,
  met vraag, waarde, bron, status, wie en wanneer.

Geen bestaande kolom is hernoemd, gewijzigd of verwijderd. Bestaande rijen krijgen
versie 1. De migratie draait bij het opstarten via `server/ensureSchema.ts` en kan
onbeperkt opnieuw draaien. Lokaal gecontroleerd op een database in de oude vorm met
16 bestaande dossiers: de inhoud was na de migratie byte voor byte gelijk.

De actuele antwoorden staan, net als bij versie 1, in `sollicitant_dossiers.intake`
(met `_versie: 2`). Per antwoord is vastgelegd:

| Gegeven | Hoe |
| --- | --- |
| Vaste identiteit van persoon en sollicitatie | `candidate_id`; er komt geen nieuwe persoon bij |
| Formulierversie | `intake_versie` en `_versie` |
| Vraagkenmerk en oorspronkelijk antwoord | sleutel in `intake`, vraagtekst in `VRAGEN`, elke stand in `intake_antwoorden` |
| Bron | `bronnen` per veld (job, cv, formulier) en `bron` per regel in de historie |
| Bevestigd of aangepast | `bevestigd` per veld (klopt, aangepast) |
| Correctiehistorie | `intake_antwoorden`, alleen toevoegen |
| Onbekend, niet van toepassing, negatief | leeg veld is onbekend; "Geen ervaring", "Nee" en "Niet beschikbaar" zijn eigen waarden |

Onderscheid dat het formulier bewaart: kunnen (taken met niveau, volgens de
kandidaat) en willen (prioriteiten, keuzefactoren); voorkeur en harde grens
(`niet_terug_soort`); gewenste uren en beschikbaarheid; weekpatroon en concrete
datums (die komen uit de app); zelfrapportage (bron per taal en taak), observatie
van de interviewer (beoordeling, werkprofiel) en controle (`controle`);
profielindicatie en geschiktheid. Jixbee (`uitbetaling`), EXTRAATJE (`extraatje`),
contactvoorkeuren (`contact`, `kanaal`) en bindingsfactoren (`binding`) staan apart.

Typt dezelfde persoon binnen twee minuten door in hetzelfde veld, dan is dat één
regel in de historie. Een regel uit een andere bron of van iemand anders blijft
altijd staan.

## Veldmapping versie 1 naar versie 2

Bestaande dossiers worden **niet** omgezet. Ze blijven versie 1 en worden met de
oude kaart getoond. De tabel laat zien welk veld in versie 2 dezelfde vraag dekt.

| Bestaand veld (v1) | Betekenis | Veld in v2 | Omzettingsregel | Afnemers |
| --- | --- | --- | --- | --- |
| `id_gezien` | ID getoond bij de intake | `id_gezien` | Zelfde veld, zelfde waarden | Ref. en doc. check, Documentcheck |
| `nationaliteit` ("TWV nodig") | Werkrecht | `werkrecht` | Niet omgezet; de TWV-controle leest beide velden | `candidates.needs_twv`, ref. en doc. check, TWV |
| `talen`, `talen_anders` | Talen, zonder niveau | `talen` met niveau en bron | Niet omgezet: v1 kent geen niveau | Intake bekijken |
| `ervaring_soort`, `ervaring_werk` | Soort ervaring | `ervaring_dienst`, `taken` | Niet omgezet: andere vraag | Kaart Ervaring |
| `ervaring_jaren` | Jaren ervaring | `ervaring_duur` | Niet omgezet: andere indeling | Kaart Ervaring |
| `alleen_dienst`, `drie_borden`, `cocktails`, `barista`, `vaardigheden` | Zelfinschatting en proefvragen | `taken` met niveau, alleen relevante taken | Niet omgezet: geen gelijke betekenis | Uit de intake (v1) |
| `bijbaan` | Ander werk of studie | geen: staat al bij Job (`werkvorm`) | Vervalt | Uit de intake (v1) |
| `stellingen`, `belangrijkst` | Motivatiescore 0 tot 100 | `prioriteiten`, `keuzefactoren`, `binding` | **Niet omgezet.** Oude scores blijven historisch | Kaart Motivatie (v1) |
| `woordparen` | DISC uit 12 woordparen | `werkprofiel` | **Niet omgezet.** Oude uitkomst houdt zijn eigen methode | Kaart Werkstijl (v1) |
| `vervoer`, `studenten_ov` | Vervoer | `vervoer`, `reistijd_min`, `reisafstand_km`, `laat_thuis` | Niet omgezet | Uit de intake |
| `rijbewijzen` | Rijbewijzen | `rijbewijs`, `voertuig` (apart) | Niet omgezet | Uit de intake |
| `kleding` | Aanwezige kledingstukken | `kleding` (aanwezig, regelen, bespreken) | Niet omgezet | Uit de intake |
| `ehbo`, `ehbo_geldig` | EHBO | `certificaten` met geldigheid | Niet omgezet | Uit de intake |
| `uren` | Gewenste uren | `uren`, `uren_min`, `uren_max` | Zelfde betekenis | Kaart inzet |
| `raster` | Weekraster | `raster` (zelfde vorm) en `tijden` | Zelfde vorm; leeg is in v2 uitdrukkelijk onbekend | Beschikbaarheid |
| `referentie` (naam, telefoon, geen) | Referentie | `referentie` met relatie, toestemming, later, geen | Niet omgezet; de check werkt voor beide | Referentiecheck |
| `vragen` | Vraag van de kandidaat | `vragen` | Zelfde betekenis | Intake bekijken |
| `job` (klopt, aanpassen) | Bevestiging van wat Job wist | `bronnen`, `bevestigd` | Niet omgezet | Intake |
| Beoordeling: `communicatief`, `representatief`, `indruk` | Schuiven 0 tot 100 | Zelfde namen, 1 tot 100, leeg mag | Niet omgezet | Beoordeling |
| Beoordeling: `extravert` | Introvert of extravert | Vervalt | Blijft staan in oude dossiers, telt in v2 nergens mee | Beoordeling (v1) |
| `foto`, `foto_overgeslagen` | Pasfoto | Ongewijzigd | Zelfde kolommen | Kop van de kaart |

Nieuw in versie 2, zonder voorganger: `aanleiding`, `start_hulp`, `locaties`,
`samenwerken`, `contact`, `kanaal`, `niet_terug`, `acties`, `patroon`, `startdatum`,
`aankondiging`, `lastminute`, `samenvatting`, `app_uitleg`, `uitbetaling`,
`extraatje`, `notities`.

## Statussen

Bestaande codes, er is er geen bijgekomen.

| Status uit de opdracht | Bestaande code | Voorwaarde | Wie en wanneer vastgelegd | Volgende eigenaar |
| --- | --- | --- | --- | --- |
| Concept | stap `gesprek_gepland`, `intake_status` concept | Eerste bewaring | `intake_door`, tijdlijn | Interviewer |
| Afgerond, beoordeling nodig | stap `beoordelen` | Intake afronden (kan één keer) | `intake_afgerond_at`, tijdlijn | Interviewer |
| Twijfel | stap `extra_check` | Drie schuiven en onderbouwing | `twijfel_door`, `twijfel_at` | Collega bij EXTRA check |
| Positief, controles open | stap `ref_doc_check` | Drie schuiven en onderbouwing | `beoordeeld_door`, `beoordeeld_at` | Wie de check doet |
| Controles afgerond | stap `onboarding` | ID gezien en referentie in orde | `geaccepteerd_door`, `geaccepteerd_at` | Onboarding |
| Onboarding | stap `onboarding`, medewerker `nieuw` | Knop Medewerker aanmaken | tijdlijn | Onboarding |
| Inzetbaar | medewerker `actief` | Zetten in Medewerkers | bestaand | Planner |
| Afgewezen of gearchiveerd | stap `archief` | Reden kiezen | `gearchiveerd_door`, `gearchiveerd_at`, reden | Niemand; terugzetten kan |

Een positief gesprek maakt niemand inzetbaar. Afwijzen (nagegaan in de code)
verplaatst het dossier naar het archief, zet de kandidaat op afgewezen met een
bewaartermijn van zes maanden, annuleert geplande afspraken, stopt Job en stuurt
alleen een mail als de afwijzer dat aanvinkt. Er wordt niets verwijderd;
Terugzetten herstelt de stap en de status.

Dubbele uitvoering: afronden en Medewerker aanmaken zijn getest met twee
verzoeken tegelijk en gebeuren één keer. Twee mensen in dezelfde intake: de
tweede krijgt een melding en de laatste stand, er wordt niets overschreven.

## Werkprofiel en kleuren: methode en beperkingen

Het bestaande kleurmodel (versie 1): twaalf woordparen, elke keuze telt één punt
voor D, I, S of C; de twee hoogste vormen het profiel, bij gelijke stand in de
volgorde I, S, C, D. Kleuren: D rood, I geel, S groen, C blauw. Die uitkomst
blijft bij oude dossiers staan met die methode.

Versie 2 rekent **geen** kleur uit. Er is geen beschreven en getoetste methode om
van gespreksantwoorden naar een kleur te komen, en gewichten verzinnen mocht niet.
Daarom:

1. Het systeem zet de uitgesproken voorkeuren op een rij, elk met het antwoord
   waar het uit komt (`werkvoorkeuren`).
2. De interviewer kiest zelf hoogstens twee kleuren, als herkenbare samenvatting,
   en schrijft erbij waarop dat rust.
3. De status zegt hoe zeker het is: voorlopig, bevestigd (de kandidaat herkent
   zich erin), gemengd of onvoldoende informatie.

De kleuren heten in versie 2 Daadkrachtig, Sociaal, Stabiel en Nauwkeurig. Het is
geen gevalideerde DISC-test en zo wordt het ook nergens genoemd. De kleur is geen
selectiecriterium, staat los van de beoordeling en van de match, heeft geen
percentages en mag leeg blijven. Hij houdt de intake nooit tegen.

Beperkingen: twee interviewers kunnen bij dezelfde antwoorden een andere kleur
kiezen; de kleur zegt niets over geschiktheid; bij weinig antwoorden hoort de
status onvoldoende informatie.

## Beoordeling door de interviewer

Drie schuiven van 1 tot 100: communicatieve vaardigheden, representatief,
algehele indruk. Ze beginnen op niet beoordeeld; leeg blijft leeg, geen 0 en geen
50. Een exact cijfer kan getypt worden. Eén tekstveld: wat onderbouwt jouw
beoordeling? Beoordelaar, tijdstip en elke wijziging worden bewaard. De vaste
instructie staat in `BEOORDEEL_INSTRUCTIE`. Introvert of extravert bestaat in
versie 2 niet meer. Een laag cijfer wijst niemand af: afwijzen is altijd een
handeling van een mens.

## Eigen toevoegingen

Max vroeg om een eigen draai waar die iets toevoegt.

- **Zo zet je [naam] goed in**: doen, liever niet (voorkeur) en harde grens, voor
  de planner. Elke regel komt rechtstreeks uit een antwoord.
- **Later op inspelen**: bij elke uitgesproken behoefte een concreet moment om
  erop terug te komen. Vaste regels in `laterInspelen`, geen AI. Er wordt niets
  verstuurd; het is een geheugensteun en de basis voor latere opvolging.
- **Voorbereiding** als eerste scherm, met hoogstens twee bespreekpunten en de
  bron bij elk gegeven.
- **Bron per taal**: zegt de kandidaat zelf, of gehoord in dit gesprek.

## Testresultaten (10 november 2026)

Echt getest betekent: tegen de echte routes en een echte Postgres-database, of in
een echte browser tegen de draaiende site. Dat was de lokale kopie van de
testomgeving. In EXTRA-test in Replit moet Max het na het binnenhalen zelf zien;
`npm run intake:ketentest` draait daar dezelfde 81 stappen.

| Nr | Onderwerp | Uitkomst | Hoe |
| --- | --- | --- | --- |
| 1 | Oude afgeronde intake ongewijzigd | Geslaagd | Echt: vingerafdruk van alle bestaande dossiers voor en na; migratie op database in oude vorm |
| 2 | Oud concept afmaken in oude versie | Geslaagd | Echt, ketentest |
| 3 | Nieuwe intake: juiste versie en persoon | Geslaagd | Echt, ketentest |
| 4 | Gegevens uit Job en cv getoond | Geslaagd | Echt, ketentest en browser. De cv-analyse was een klaargezette rij, niet door de AI gelezen |
| 5 | Ontbrekend blijft onbekend | Geslaagd | Echt, ketentest |
| 6 | Correcties houden historie | Geslaagd | Echt, ketentest en browser |
| 7 | Bekende antwoorden niet opnieuw vragen | Geslaagd | Echt, ketentest en browser |
| 8 | Functievelden alleen bij de functie | Geslaagd | Regeltests en ketentest |
| 9 | Schuiven beginnen leeg, exact cijfer | Geslaagd | Echt, ketentest en browser |
| 10 | Onderbouwing, interviewer, tijdstip | Geslaagd | Echt, ketentest |
| 11 | Uren, patroon en samenvatting gelijk | Geslaagd | Echt, ketentest |
| 12 | Opslaan, verversen, verbinding kwijt | Geslaagd | Echt, browser: verbinding uit en aan, verversen met niet verstuurd werk |
| 13 | Positief is nog niet inzetbaar | Geslaagd | Echt, ketentest |
| 14 | Twijfel en open acties met eigenaar | Geslaagd | Echt, ketentest |
| 15 | Afwijzen zonder andere dossiers te raken | Geslaagd | Echt, ketentest |
| 16 | Referentie en documentcheck sluiten aan | Geslaagd | Echt, ketentest en browser |
| 17 | Onboarding: juiste gegevens, geen dubbelen | Geslaagd | Echt, ketentest en browser |
| 18 | Terugschakelen zonder verlies | Geslaagd | Echt, ketentest |
| 19 | Cv, intake en gesprek met Job bereikbaar | Deels | Knoppen en panelen echt getest; het cv-bestand zelf niet, lokaal is er geen bestandsopslag |
| 20 | Rechten en geen berichten | Geslaagd | Echt: zonder inloggen 403 op de draaiende site; geen bericht verstuurd |
| 21 | Desktop en tablet | Geslaagd | Echt, browser op 1440 breed en 820 breed |
| 22 | Volledig proefgesprek binnen de tijd | **Niet getest** | Alleen gesimuleerd: doorklikken kost 25 seconden. De hoofdstukken tellen op tot 17 minuten; of dat klopt, weet je pas na een echt gesprek |

Extra gevallen: kandidaat zonder cv, tegenstrijdige gegevens, meer gewenste
functies en wisselende beschikbaarheid zijn echt getest in de ketentest.

Niet getest: de foto op een echte iPad (stond al open), het voorlezen van een echt
cv door de AI in dit formulier, en gebruik door twee mensen op twee apparaten (wel
nagebootst met twee gebruikers).

## Activeren en terugdraaien

In de testomgeving staat versie 2 aan zodra de code binnen is.

In productie:

1. Publiceren met `INTAKE_V2` niet gezet. Er verandert dan niets zichtbaars; de
   migratie voegt alleen de twee kolommen en de tabel toe.
2. Aanzetten: Secret `INTAKE_V2=1`, opnieuw starten. Nieuwe intakes beginnen in
   versie 2.
3. Terug: Secret weghalen of op `0`, opnieuw starten. Nieuwe intakes beginnen
   weer in versie 1. Intakes van versie 2 blijven bestaan en leesbaar.

De code terugdraaien kan ook: de extra kolommen en de tabel storen de oude code
niet. Intakes van versie 2 toont de oude code dan niet goed; zet daarom liever de
schakelaar uit dan de code terug. `migrations/manual/0034_intake_v2/down.sql` is
niet nodig en staat uitgeschakeld.

## Besluiten (Max, 11 november 2026)

Versie 2 is akkoord. Hij wordt de standaard via de schakelaar (`INTAKE_V2=1` in
productie), zonder codewijziging; versie 1 blijft in de code zodat terug altijd kan.

| Nr | Onderwerp | Besluit | Stand |
| --- | --- | --- | --- |
| 1 | Onderbouwing | Verplicht | Zo gebouwd |
| 2 | Medewerker aanmaken | Met een knop in Onboarding | Zo gebouwd |
| 3 | Inzetbaar en doorzetten | Bij Onboarding: onboardingmail en doorzetten naar Planboard via de bestaande webhook | Uitwerking volgt na akkoord op het voorstel |
| 4 | Profiel naar Planbord | Pas als alles definitief is | Uitwerking volgt |
| 5 | Wat helpt bij de start | Een duidelijke briefing, een vast aanspreekpunt, samen met iemand anders van EXTRA, plus drie herschreven keuzes (`START_HULP`) | Gebouwd |
| 6 | Werkkleding | Per functie, zie `KLEDING_PER_FUNCTIE`; banqueting zoals bediening | Gebouwd |
| 7 | Certificaten | Vaste lijst (`CERTIFICATEN`) met Anders | Gebouwd |
| 8 | Later op inspelen | Een melding om in te checken, op basis van het aantal diensten | Voorstel volgt |
| 9 | Bewaartermijn | Historie volgt het dossier | Akkoord, zie hieronder |
| 10 | Events en logistiek | Taken per functie nalopen met iemand van de vloer | Gebeurt |

**AVG-opschoning.** De historie per antwoord staat in `intake_antwoorden`. Wie de
AVG-opschoning van sollicitantdossiers bouwt of aanpast, moet deze tabel meenemen
(rijen met hetzelfde `candidate_id`). Er staat geen automatische opschoning aan.

**Oude keuzes.** Dossiers met een oude startkeuze of een vrij getypt certificaat
blijven ongewijzigd; het formulier toont die waarde gewoon (als extra keuze of als
Anders).
