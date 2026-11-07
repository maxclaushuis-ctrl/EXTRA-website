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
| `JOB_WA_SJABLOON_START` | Naam van het goedgekeurde startsjabloon. Zonder dit sjabloon praat Job via het webgesprek en krijgt de kandidaat de link per mail. |
| `JOB_WA_SJABLOON_HERINNERING` | Naam van het herinneringssjabloon. Zonder: herinnering alleen per mail. |
| `JOB_WA_SJABLOON_AFSPRAAK` | Naam van het sjabloon voor de herinnering de dag voor de kennismaking. |

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

### 1. Start: `job_start`

Nederlands:

> Hoi {{1}}, ik ben Job, de AI-recruiter van EXTRA. Leuk dat je je hebt aangemeld voor {{2}}! Ik stel je een paar korte vragen; typ MENS als je liever een collega spreekt. Eerste vraag: {{3}} Je kunt hier gewoon antwoorden.

Engels:

> Hi {{1}}, I'm Job, the AI recruiter of EXTRA. Thanks for signing up for {{2}}! I have a few quick questions; type HUMAN if you'd rather talk to a colleague. First question: {{3}} You can simply reply here.

Voorbeeldwaarden voor Meta: `Lisa`, `bediening en bar`, `Vertel eens: waar heb je tot nu toe in de horeca gewerkt?`

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

Na goedkeuring: zet de namen in de Secrets (`JOB_WA_SJABLOON_START=job_start`
enzovoort) en publiceer opnieuw.

Binnen een gesprek heeft Job geen sjabloon nodig: zolang de kandidaat binnen 24
uur iets stuurde, antwoordt Job met gewone berichten.

## Inplannen

- Een half uur per gesprek, vanaf morgen, twee weken vooruit, nooit binnen 12 uur.
- Standaard: Charlotte maandag tot en met vrijdag 10:30 tot 15:30, niet 12:00 tot 13:00; Lea maandag tot en met vrijdag 13:00 tot 17:00.
- Aan te passen in het dashboard, tabblad Job, Werktijden. Uitzetten kan; verwijderen niet.
- De kandidaat ziet tijden, niet wie er vrij is. Kiezen twee kandidaten tegelijk hetzelfde moment, dan krijgt de tweede de andere interviewer als die vrij is, en anders de melding dat het moment net weg is.
- Bij het boeken: status `gepland`, `interview_date` en `interview_time` op de kandidaat, bevestigingsmail met agenda-bestand en verzetlink.
- Verzetten: de oude afspraak krijgt status `verzet`, er wordt niets verwijderd.

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
- De tabellen laten staan. `migrations/manual/0030_job/down.sql` verwijdert ze,
  maar alleen met de hand en met akkoord van Max.
