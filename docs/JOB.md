# Job, de AI-recruiter

Job voert het eerste gesprek met een kandidaat na de aanmelding op de site. Hij
vraagt naar ervaring, werkvergunning (alleen bij een nationaliteit buiten de
EU), diensten per week, werkgebied, talen en het cv, en laat de kandidaat zelf
een kennismaking op kantoor plannen. Job wijst nooit af: twijfel gaat naar een
collega, met de reden erbij.

Ontwerp: borden A tot en met D op het canvas. Bouwplan: "Bouwplan Job en
testomgeving" (6 november 2026).

## Waar het staat

| Wat | Bestand |
| --- | --- |
| Regels van het gesprek (wat Job vraagt, wanneer een collega moet kijken, alle teksten) | `shared/jobRegels.ts` |
| Antwoorden uitlezen zonder AI, en controle van wat de AI teruggeeft | `shared/jobLezen.ts` |
| Vrije momenten, werktijden, herinnering voor de afspraak | `shared/jobPlanning.ts` |
| AI-aanroep (gpt-4o-mini, dezelfde sleutel als de WhatsApp-AI) | `server/job/jobAi.ts` |
| Opslaan, versturen, boeken, herinneringen | `server/job/jobService.ts` |
| Mails (start, herinnering, bevestiging, cv) | `server/job/jobMails.ts` |
| Routes | `server/job/jobRoutes.ts` |
| Webgesprek voor kandidaten | `client/src/pages/JobGesprek.tsx` (`/job-gesprek?token=...`) |
| Dashboard: tabblad Job en het gesprek bij de kandidaat | `client/src/pages/dashboard/JobBeheer.tsx` |
| Tabellen | `job_gesprekken`, `job_berichten`, `job_afspraken`, `job_interviewers` (migratie 0030) |
| Tests | `npm run job:test` |

## Schakelaars (Secrets in Replit)

| Secret | Wat het doet |
| --- | --- |
| `JOB_ENABLED=1` | Job start na elke voltooide aanmelding en de herinneringen lopen elk uur. Zonder deze schakelaar doet Job niets uit zichzelf. |
| `TESTOMGEVING=1` | Alleen in de testomgeving: Job mag met de hand gestart worden (simulator) en de klok mag vooruit. |
| `JOB_WA_NUMMER` | Optioneel. Het nummer voor de wa.me-links in de mails. Zonder deze Secret haalt Job het nummer zelf op bij Meta. |
| `JOB_WA_SJABLOON_START`, `_HERINNERING`, `_AFSPRAAK` | Optioneel. Alleen nodig als een sjabloon een andere naam heeft dan `job_start_v3`, `job_herinnering` of `job_afspraak`. Zonder deze Secrets gebruikt Job vanzelf het sjabloon zodra Meta het heeft goedgekeurd. |

### Job 3.0, fase 1 (staan standaard aan)

Elke stap kan los uit door het Secret op `0` te zetten; dan geldt weer het oude gedrag.

| Secret | Wat het doet |
| --- | --- |
| `JOB_V3_PRIVACY` | BSN, IBAN, paspoort- of ID-nummers en adressen in een bericht worden vervangen door `[verwijderd]` voordat Job het bewaart of aan de AI geeft. Job vraagt zulke gegevens niet via de chat te sturen. Let op: de gewone WhatsApp-inbox bewaart het oorspronkelijke bericht nog wel. |
| `JOB_V3_STOP` | Na STOP stuurt Job één bevestiging en pauzeert alles. Schrijft de kandidaat later zelf, dan gaat Job alleen verder bij een duidelijke wens (of een antwoord op de open vraag); anders vraagt hij of de kandidaat verder wil. Bij verder gaat de WhatsApp-toestemming weer aan, maar automatische herinneringen blijven uit. |
| `JOB_V3_BIJLAGEN` | Een spraakbericht: Job vraagt om te typen. Een foto of document telt alleen als cv bij de cv-vraag; tijdens de andere vragen vraagt Job eerst "Is dit je cv?". |
| `JOB_V3_TIMEOUT` | Job wacht hooguit 12 seconden op de AI; daarna leest de reserve-lezer het antwoord. |
| `JOB_V3_BEGRIJPEN` | Fase 2, begrijpen: de AI leest elk antwoord met het hele gesprek erbij, vult alleen velden die het antwoord echt draagt (met citaat, `bewijsCheck`), mag één logische doorvraag stellen (hoogstens 2 per veld, 5 per gesprek) en markeert vragen die vervallen (zoals sterren zonder hotelervaring). Welke velden nodig zijn en de volgorde blijven vaste regels. In de testomgeving vanzelf aan, uit met `0`; elders alleen met `1`. `JOB_AI_MODEL` kiest een ander model (standaard gpt-4o-mini). |
| `JOB_V3_FORMULEREN` | De AI herformuleert elke standaardvraag zodat hij aansluit op het laatste antwoord. Zelfde invulveld, zelfde knoppen; de vraag moet aantoonbaar over hetzelfde gaan (`herformuleringGoed`), anders of na 6 seconden blijft de standaardvraag. Werken in Nederland en de cv-vraag blijven altijd letterlijk. In de testomgeving vanzelf aan, uit met `0`; elders alleen met `1`. |
| `JOB_WA_BUNDELEN` | WhatsApp: berichten kort na elkaar krijgen samen één antwoord. Na een getypt bericht wacht Job 6 seconden op een volgend bericht; een aangetikte knop of lijstregel gaat meteen door, samen met wat er nog wacht. Wat binnenkomt terwijl Job nadenkt, gaat mee in het volgende antwoord. Elk bericht blijft los zichtbaar. Alleen in het geheugen van de server (`shared/jobBundel.ts`). In de testomgeving vanzelf aan, uit met `0`; elders alleen met `1`. |
| `JOB_V4` | Job 4: één AI-beurt per bericht (`server/job/jobBeurt.ts`). De AI bepaalt wat het bericht is (antwoord, eigen vraag, correctie, verwarring, frustratie, bedankje, mens, grensoverschrijdend), welke velden het met citaat draagt en welke vraag logisch volgt; de controle in `shared/jobBeurt.ts` slaat alleen gedragen velden op, haalt feiten alleen uit `shared/jobKennis.ts`, laat de vraag alleen door als hij over het veld gaat dat de regels aanwijzen (hooguit twee zinnen, één vraag). Geen of onbruikbare AI: gecontroleerde terugval, na drie onduidelijke antwoorden staat een vraag als onbekend. Vervangt in deze stand het oude lezen plus herformuleren. In de testomgeving vanzelf aan, uit met `0`; elders alleen met `1`. |
| `JOB_V3_MATCH` | Fase 4, kandidaatmatch: een binnengekomen cv (pdf of docx) wordt uitgelezen, afgeschermd en door de AI tot werkperiodes gemaakt; de score rekent `shared/kandidaatMatch.ts` uit met vaste regels. In de testomgeving vanzelf aan, uit met `0`; elders alleen met `1`. Foto's, oude .doc-bestanden en scans worden niet uitgelezen. Na het cv stuurt Job eerst "Ik kijk er even naar"; zodra het cv gelezen is volgen hoogstens twee cv-vragen (`shared/cvVragen.ts`), daarna het slotbericht. Een antwoord laat het cv opnieuw lezen met die aanvulling. Tabellen `cv_analyses` en `kandidaat_matches` (migratie 0033, alleen nieuw). |

Zonder goedgekeurd startsjabloon praat Job via het webgesprek en krijgt de
kandidaat de link per mail. Zonder herinneringssjabloon gaat de herinnering
alleen per mail.

De AI gebruikt `AI_INTEGRATIONS_OPENAI_BASE_URL` en `AI_INTEGRATIONS_OPENAI_API_KEY`,
dezelfde als de bestaande WhatsApp-AI. Zonder AI leest Job de antwoorden met
vaste regels; dat werkt, maar grover.

Staat Job aan, dan krijgt de kandidaat na de aanmelding niet meer de oude
bevestigingsmail maar de bevestiging van Job na het plannen. De mail naar
kantoor blijft gelijk.

## De drie WhatsApp-sjablonen voor Meta

Categorie: **Utility** (gaat over een aanmelding die de kandidaat zelf deed).
Maak elk sjabloon in het Nederlands (taal `nl`) en in het Engels (taal `en`),
met precies deze tekst. Job vult de variabelen zelf in.

### 1. Start: `job_start_v3`

Nederlands (witregel na de naam en voor de vraag):

> Hi {{1}},
>
> Ik ben Job, de AI-recruiter van EXTRA. Leuk dat je je hebt aangemeld voor {{2}}! Ik stel je een paar korte vragen.
>
> Vertel eens: hoeveel jaar ervaring heb je {{3}} tot nu toe?

Engels:

> Hi {{1}},
>
> I'm Job, the AI recruiter at EXTRA. Great that you signed up for {{2}}! I have a few quick questions for you.
>
> Tell me: how many years of experience do you have {{3}} so far?

Voorbeeldwaarden voor Meta: `Lisa`, `housekeeping`, `in de housekeeping`.
In {{3}} staat alleen het werk (bijvoorbeeld `in een keuken`); de vraag zelf staat in het sjabloon,
omdat Meta geen sjabloon goedkeurt dat met een variabele eindigt (ook niet met alleen een vraagteken erachter).

Zolang `job_start_v3` nog niet in beide talen is goedgekeurd, gebruikt Job het eerste startsjabloon `job_start`.

### 2. Herinnering: `job_herinnering`

Nederlands, met twee snelle-antwoordknoppen **Verder** en **Liever bellen**:

> Hoi {{1}}, je aanmelding bij EXTRA is nog niet af. Nog een paar korte vragen, dan kun je meteen een kennismaking plannen. Zullen we verder?

Engels, knoppen **Continue** en **Call me instead**:

> Hi {{1}}, your application at EXTRA isn't finished yet. A few more quick questions, then you can book a meeting right away. Shall we continue?

Voorbeeldwaarde: `Noor`

### 3. Afspraak morgen: `job_afspraak`

Nederlands, knoppen **Ik kom** en **Verzetten**:

> Hoi {{1}}, morgen om {{2}} is je kennismaking met {{3}} bij EXTRA, Herengracht 372 in Amsterdam. Neem je paspoort of ID-kaart mee. Lukt het?

Engels, knoppen **I'll be there** en **Reschedule**:

> Hi {{1}}, tomorrow at {{2}} you have your meeting with {{3}} at EXTRA, Herengracht 372 in Amsterdam. Bring your passport or ID card. Does that still work?

Voorbeeldwaarden: `Lisa`, `14:00`, `Charlotte`

Indienen hoeft niet met de hand: in het dashboard, tabblad Job, staat de kaart
**WhatsApp-sjablonen bij Meta** met per sjabloon de stand (niet ingediend, in
behandeling, goedgekeurd, afgewezen) en de knop **Indienen bij Meta**. Die
dient alle zes in (drie sjablonen, Nederlands en Engels) met precies de tekst
hierboven. Meta keurt meestal binnen een paar minuten tot een dag goed; daarna
gebruikt Job ze vanzelf. De kaart laat ook het nummer van Job, de webhook-URL
en of de verify token en app secret gezet zijn zien. Stappen voor de koppeling:
`docs/META-KOPPELING.md`.

Binnen een gesprek heeft Job geen sjabloon nodig: zolang de kandidaat binnen 24
uur iets stuurde, antwoordt Job met gewone berichten.

## Gesprekstest met de echte AI

`npm run job:gesprekstest` (in de testomgeving, de AI-sleutel staat in de Secrets) voert de vaste testgesprekken uit `scripts/jobGesprekken.ts` volledig uit via dezelfde weg als echte berichten, zonder database, WhatsApp of mail. Per gesprek wordt gecontroleerd wat er is opgeslagen, wat er nooit opgeslagen mag worden, welke vragen wel of niet gesteld zijn, het aantal vragen, de taal en de reactie op lastige berichten; een tweede AI (rechter, standaard `gpt-4o`, uit met `JOB_TEST_RECHTER=0`) beoordeelt per beurt of Job aansluit. Modellen vergelijken: `npm run job:gesprekstest -- gpt-4o-mini,gpt-4.1-mini`. Het volledige verslag staat daarna in `job-gesprekstest.txt`.

## Taal

Regels in `shared/jobTaal.ts` (getest in `shared/jobTaal.test.ts`).

Starttaal: paspoort of ID-kaart (of nationaliteit) plus landnummer.

| Paspoort | Nummer +31 | Buitenlands nummer |
|---|---|---|
| Nederlands | nl | nl |
| Ander EU-land of buiten de EU | taal van het formulier | en |
| Niet bekend | nl | en |

Het nummer wordt eerst naar E.164 gezet (06 wordt +316, 0031 wordt +31); in de database verandert niets. Welke landnummers als Nederlands tellen, staat in het Secret `JOB_NL_LANDCODES` (standaard `31`, meerdere gescheiden door komma's).

Het openingsbericht en de herinneringen gaan met de taalcode van het gesprek. Is een sjabloon in het Engels (nog) niet goedgekeurd, dan gaat de Nederlandse versie en staat er een regel in de log; bij de start loopt het gesprek dan in het Nederlands.

Wisselen: alleen bij een duidelijke zin in de andere taal (minstens drie woorden, namen en plaatsen tellen niet), niet bij ok, ja, een getal of een knop. Hooguit één automatische wissel per gesprek; ENGLISH of NEDERLANDS typen kan altijd. Een andere taal (Pools, Spaans): Job antwoordt in het Engels dat hij Nederlands en Engels spreekt en stelt de vraag opnieuw; blijft iemand in die taal schrijven, dan geldt de bestaande regel (naar een collega). De taal staat bij het gesprek (`job_gesprekken.taal`), in het dossier ("Taal gesprek") en in de melding voor de planner.

## Inplannen

- Een half uur per gesprek, vanaf morgen, twee weken vooruit, nooit binnen 12 uur.
- Standaard: Charlotte maandag tot en met vrijdag 10:30 tot 15:30, niet 12:00 tot 13:00; Lea maandag tot en met vrijdag 13:00 tot 17:00.
- Aan te passen in het dashboard, tabblad Job, Werktijden. Uitzetten kan; verwijderen niet.
- De kandidaat ziet tijden, niet wie er vrij is. Kiezen twee kandidaten tegelijk hetzelfde moment, dan krijgt de tweede de andere interviewer als die vrij is, en anders de melding dat het moment net weg is.
- Bij het boeken: status `gepland`, `interview_date` en `interview_time` op de kandidaat, bevestigingsmail met agenda-bestand en verzetlink.
- Nog geen moment gekozen na de uitnodiging: Job stuurt na een dag een herinnering (mail plus WhatsApp) en na nog twee dagen een tweede. Daarna kleurt de kandidaat geel in Kandidaten.
- Verzetten: de oude afspraak krijgt status `verzet`, er wordt niets verwijderd.
- Via WhatsApp blijft het plannen in WhatsApp: Job stuurt een keuzelijst ("Kies een moment") met de eerste vrije momenten, hoogstens drie per dag en negen in totaal, plus "Geen tijd die past". Een gekozen moment wordt meteen geboekt; de bevestiging komt in WhatsApp met een agendalink en een knop Verzetten. "Geen tijd die past" gaat naar een collega (status planner). Is een moment intussen weg, dan komt de lijst opnieuw. Zijn er geen vrije momenten of komt de lijst niet aan, dan stuurt Job zoals eerder de planlink.

## Wanneer een collega moet kijken

Job zet het gesprek op "Collega moet kijken" en maakt een melding in het
dashboard bij:

- werkvergunning anders dan "arbeid vrij toegestaan";
- chef of front office zonder ervaring;
- een antwoord waar de AI aan twijfelt;
- de kandidaat typt MENS of kiest "Liever bellen";
- geen Nederlands en geen Engels: harde no-go, de collega wijst af met die reden.

Geen reactie: herinnering na 22 uur, een tweede 48 uur later, en nog eens 48
uur later "Geen reactie" (rood) voor de planner. Wie daarna toch antwoordt,
gaat verder waar hij was.

## Testen in de testomgeving

1. Dashboard, tabblad Job, blok Simulator: kies een testkandidaat en klik
   **Start Job**. Het webgesprek opent; speel de kandidaat.
2. Mails (start, cv, bevestiging, herinnering) staan in het **Mailvenster** in
   de gele balk.
3. Herinneringen: klik **+22 uur**, **+70 uur** en **+120 uur** om de klok
   vooruit te zetten.
4. WhatsApp: pas als het Meta-testnummer en de sjablonen klaar zijn, en alleen
   met de telefoons die op de testlijst van Meta staan.

## Terugdraaien

- Job uitzetten: `JOB_ENABLED` uit de Secrets halen en opnieuw publiceren. Lopende
  webgesprekken blijven bereikbaar; er gaan geen herinneringen meer uit.
- Een stap van Job 3.0 terugdraaien: zet `JOB_V3_PRIVACY`, `JOB_V3_STOP`,
  `JOB_V3_BIJLAGEN` of `JOB_V3_TIMEOUT` op `0` en publiceer opnieuw. Er is
  geen schemawijziging; gegevens blijven staan.
- De tabellen laten staan. `migrations/manual/0030_job/down.sql` verwijdert ze,
  maar alleen met de hand en met akkoord van Max.
