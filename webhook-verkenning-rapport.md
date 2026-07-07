# Verkenningsrapport — `applicant.ready` webhook & intake-formulier

> Doel: exact documenteren hoe de data van het interne intake-/sollicitatieformulier
> is opgebouwd en hoe die in de `applicant.ready`-webhook terechtkomt, zodat een
> ander project deze webhook foutloos kan verwerken.
>
> Dit is een **verkenningsrapport**. Er is geen code gewijzigd. Waar iets niet met
> zekerheid uit de code te lezen was, staat het expliciet als **ONBEKEND** vermeld.

Onderzochte bestanden:
- `client/src/pages/SollicitatieFormulier.tsx` (het intake-formulier)
- `server/routes.ts` — `POST /api/sollicitatie` (opslaan) en `POST /api/admin/applications/:id/aannemen` (webhook)
- `server/integrations/planbord-webhook.ts` (de webhook-verzender)
- `shared/schema.ts` (database-kolommen)

---

## 0. Kernconclusies (lees dit eerst)

1. **Waar wordt de webhook verstuurd?**
   Uitsluitend vanuit `POST /api/admin/applications/:id/aannemen` in `server/routes.ts`
   (de "Aannemen als medewerker"-actie). Het insturen van het intake-formulier
   (`POST /api/sollicitatie`) verstuurt **géén** webhook — het slaat alleen data op.

2. **Is de payload een 1-op-1 kopie van het formulier?**
   **Nee.** De payload is een sterk **uitgedunde, hernoemde en deels omgerekende**
   selectie. Het volledige ruwe formulier wordt wél opgeslagen in de database
   (`applications.formData`), maar het overgrote deel daarvan gaat **niet** mee in de
   webhook.

3. **Belangrijk voor het ontvangende project:** vrijwel alle detailvragen uit de
   intake — inclusief **de 4 duur-/ervaringsvragen** en de meeste
   interviewer-beoordelingsvelden (Ervaring, Beoordeling, uiterlijke verzorging,
   houding) — zitten **NIET** in de webhook-payload. Alleen:
   - basis-identiteit (naam, e-mail, telefoon, geboortedatum, woonplaats, nationaliteit),
   - twee ruwe sterscores (`communicatie`, `algemeneIndruk`, schaal 1–5),
   - berekende scores (`softskills`, `bar`, `bediening`, `diner`, schaal 0–100),
   - talen + vaardigheden als tags,
   - opmerking, referentie, en velden die de admin bij aannemen invult
     (branche, opdrachtgever, contractType, startDate, language, referralCode).

4. **Mogelijk configuratieprobleem (feit, geen aanname):**
   `server/integrations/planbord-webhook.ts` leest `process.env.WEBHOOK_SECRET`.
   In de omgeving bestaat wél `PLANBORD_WEBHOOK_URL` en `WHATSAPP_WEBHOOK_SECRET`,
   maar **geen** `WEBHOOK_SECRET`. Als `WEBHOOK_SECRET` niet gezet is, wordt de call
   volgens de code **overgeslagen** (regel 64–69: "url of secret ontbreekt — call
   overgeslagen"). Of `WEBHOOK_SECRET` elders/in productie tóch gezet is, is vanuit
   deze code **ONBEKEND** en moet apart geverifieerd worden.

---

## 1. Structuur van de webhook (envelope)

Verzonden door `sendPlanbordWebhook()` (`planbord-webhook.ts`) via `POST` naar
`PLANBORD_WEBHOOK_URL`, met header `x-webhook-secret: <WEBHOOK_SECRET>`.

Body:

```json
{
  "event": "applicant.ready",
  "timestamp": "<ISO-8601, bijv. 2026-07-07T10:30:00.000Z>",
  "source": "EXTRA Horecapersoneel",
  "data": { /* zie sectie 4 */ }
}
```

- `event` is altijd de letterlijke string `"applicant.ready"`.
- `source` is altijd de letterlijke string `"EXTRA Horecapersoneel"`.
- Timeout op de call: 8 seconden. De call is "fire-and-forget": faalt hij, dan gaat
  het aannemen gewoon door en wordt er alleen gelogd.

---

## 2. Het intake-formulier: functies en secties

Het formulier kent **4 zichtbare functies** (veld `functionType`):

| UI-label          | `functionType`-waarde |
|-------------------|-----------------------|
| Horecamedewerker  | `horecamedewerker`    |
| Chef              | `chef`                |
| Housekeeping      | `housekeeping`        |
| Logistiek         | `logistiek`           |

> Let op: het zod-schema staat óók `"frontoffice"` toe, maar die keuze is uit de UI
> verwijderd (zie versiegeschiedenis, sectie 6). In de code volgt de front-office-tak
> steeds dezelfde takken als "horeca / niet-housekeeping/chef/logistiek".

Interviewers (veld `interviewer`, keuzelijst): `Eveline`, `Isa`, `Charlotte`, `Max`, `Lea`.

Het formulier heeft 9 secties (index 0–8). Niet-logistieke functies **slaan sectie
index 3** (Certificaten & Rijbewijzen) over; logistiek toont alle 9.

---

## 3. Per-functie veldtabellen

Legenda kolommen: **Label** = zichtbaar op scherm · **JSON-key** = sleutel in
`formData` (en request body van `/api/sollicitatie`) · **Waarden** = exacte,
letterlijke opgeslagen waarden · **Verpl.** = door de app verplicht gemaakt
(ja/nee). "Verplicht" hieronder komt uit het zod-schema + de score-validatie
(`getRequiredScoreFields`). Een `*` in de UI betekent doorgaans verplicht.

### 3.0 Gedeeld — Start & Basis (alle functies)

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Gesprek afgenomen door | `interviewer` | een van: `Eveline`, `Isa`, `Charlotte`, `Max`, `Lea` | **ja** (`min(1)`) |
| Functie | `functionType` | `horecamedewerker` / `chef` / `housekeeping` / `logistiek` (schema staat ook `frontoffice` toe) | **ja** (enum) |
| Voornaam | `firstName` | vrije tekst | **ja** |
| Achternaam | `lastName` | vrije tekst | **ja** |
| Telefoon | `phone` | vrije tekst | nee |
| E-mail | `email` | e-mailadres of leeg | nee (wel e-mailformaat als ingevuld) |
| Geboortedatum | `birthDate` | datumstring | nee |
| Woonplaats | `city` | vrije tekst | nee |
| Aanmeldkanaal / bron | `channel` | vrije tekst | nee |

### 3.0b Gedeeld — Achtergrond (alle functies)

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Talen | `languages` | array van vrije strings (bv. `Nederlands`, `Engels`) | nee (default `[]`) |
| Werkvergunning nodig? | `needsWorkPermit` | `ja` / `nee` | nee |
| Nationaliteit | `nationality` | vrije tekst | nee |
| Voertaal | `voertaal` | `nederlands` / `engels` | nee |

### 3.1 Horecamedewerker (functie `horecamedewerker`)

Ervaring & Vaardigheden (sectie 4):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Andere bijbaan? | `otherJob` | vrije tekst | nee |
| Type ervaring | `experienceTypes` | array uit: `Festival`, `Fine dining`, `Hotel`, `Restaurant`, `Café/bar`, `High-end events` | nee |
| **Horeca ervaring** *(duurvraag)* | `horecaExperience` | `Geen ervaring`, `<6 maanden`, `6-12 maanden`, `1-2 jaar`, `2-3 jaar`, `3-5 jaar`, `5+ jaar` | **ja** (`*` in UI) |
| Zelfstandig een dienst draaien? | `canWorkIndependently` | `ja` / `nee` | ja (`*`) |
| 3 borden lopen | `canCarry3Plates` | `ja` / `nee` | ja (`*`) |
| Barista | `isBarista` | `ja` / `nee` | nee |
| Cocktailshaker | `canShakeCocktails` | `ja` / `nee` | nee |
| Bediening vaardigheden | `serviceSkills` | getal 1–5 (sterren) | **ja** (score-validatie) |
| Bar vaardigheden | `barSkills` | getal 1–5 (sterren) | **ja** (score-validatie) |
| Diner vaardigheden | `dinerSkills` | getal 1–5 (sterren) | **ja** (score-validatie) |
| Assistent chef | `isAssistantChef` | `ja` / `nee` | nee |
| Afwas | `canWashDishes` | `ja` / `nee` | nee |
| Promotiemedewerker | `isPromoWorker` | `ja` / `nee` | nee |

Praktisch (sectie 5) + Beschikbaarheid (sectie 6):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Rijbewijs | `hasDriversLicense` | `ja` / `nee` | nee |
| Studenten OV-Chipkaart | `hasStudentOV` | `ja` / `nee` | nee |
| Week of weekend OV? (alleen bij OV=ja) | `ovType` | `week` / `weekend` | nee |
| Werkkleding | `workClothing` | array uit: `Wit hemd`, `Zwarte pantalon`, `Nette zwarte schoenen` | nee |
| Beschikbaarheid per week (uren) | `availableHours` | vrije tekst (bv. `16-24 uur`) | nee |
| Voorkeur werkdagen | `preferredDays` | array uit: `Maandag`…`Zondag`, `N.v.t.` | nee |
| Voorkeur moment van de dag | `preferredTimes` | array uit: `Ochtend`, `Middag`, `Avond`, `N.v.t.` | nee |

### 3.2 Chef (functie `chef`)

Ervaring & Vaardigheden (sectie 4):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Soorten keuken met ervaring | `chefKitchenTypes` | array uit: `Ontbijt`, `Lunch`, `Fine dining`, `Banqueting`, `Mise-en-place` | nee |
| Diploma's of certificaten | `chefDiplomas` | array uit: `Koksdiploma`, `HACCP`, `SVH` | nee |
| **Jaren ervaring als kok** *(duurvraag)* | `chefYearsAsKok` | `1-3 jaar ervaring`, `3-5 jaar ervaring`, `5-10 jaar ervaring`, `10> jaar ervaring` | **ja** (`*` in UI) |
| Leidinggevende ervaring | `chefLeadershipExp` | `1-2 jaar ervaring`, `3-5 jaar ervaring`, `5> jaar ervaring`, `Geen` | nee |
| Meeste ervaring in welke keuken? | `chefMainKitchen` | vrije tekst | nee |
| Bij welke bedrijven gewerkt? | `chefCompanies` | vrije tekst | nee |

Praktisch (sectie 5) + Kleding (sectie 6):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Beschikbaarheid per week (dagen) | `availableHours` | vrije tekst | nee |
| Vanaf wanneer kan je starten? | `chefStartDate` | datumstring | ja (`*`) |
| Voorkeur werkdagen | `preferredDays` | array `Maandag`…`Zondag`, `N.v.t.` | nee |
| Voorkeur moment van de dag | `preferredTimes` | array `Ochtend`, `Middag`, `Avond`, `N.v.t.` | nee |
| Heb je een auto? | `hasCar` | `ja` / `nee` | nee |
| Beschikt de chef over de juiste kleding? | `chefClothing` | array uit: `Koksbroek`, `Koksbuis`, `Veiligheidsschoenen`, `Messenset` | nee |

Chef-specifieke sterren staan in sectie 7 — zie sectie 3.5 hieronder.

### 3.3 Housekeeping (functie `housekeeping`)

Ervaring (sectie 4):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Welke taken heb je eerder gedaan? | `hkTasks` | vrije tekst | nee |
| **Jaren ervaring in housekeeping** *(duurvraag)* | `hkYearsExperience` | `1-3 jaar ervaring`, `3-5 jaar ervaring`, `5-10 jaar ervaring`, `10> jaar ervaring` | **ja** (`*` in UI) |
| Type locatie | `hkLocationTypes` | array uit: `Hotel`, `Hostel`, `Ziekenhuis`, `Kantoor`, `Verzorgingstehuis`, `Particulier/ bij mensen thuis`, `Anders` | nee |
| Hoeveel sterren hotels? | `hkHotelStars` | array uit: `1 Ster`, `2 Sterren`, `3 Sterren`, `4 Sterren`, `5 Sterren` | nee |
| Bij welke bedrijven gewerkt? | `hkCompanies` | vrije tekst | nee |
| Referentie opvragen bij? | `hkReference` | vrije tekst | nee |

Praktisch (sectie 5) + Beschikbaarheid (sectie 6, sterrenblok):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Beschikbaarheid per week (dagen) | `availableHours` | vrije tekst | nee |
| Voorkeur werkdagen | `preferredDays` | array `Maandag`…`Zondag`, `N.v.t.` | nee |
| Voorkeur moment van de dag | `preferredTimes` | array `Ochtend`, `Middag`, `Avond`, `N.v.t.` | nee |
| Heb je een auto? | `hasCar` | `ja` / `nee` | nee |
| Betrouwbaarheid en werkhouding | `hkBetrouwbaarheid` | getal 1–5 (sterren) | **ja** (score-validatie) |
| Communicatieve vaardigheden (HK) | `hkCommunicatie` | getal 1–5 (sterren) | **ja** (score-validatie) |
| Representativiteit & houding | `hkRepresentativiteit` | getal 1–5 (sterren) | **ja** (score-validatie) |

### 3.4 Logistiek (functie `logistiek`)

Certificaten & Rijbewijzen (sectie 3, alleen logistiek) + Ervaring (sectie 4):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Rijbewijs B | `logLicenseB` | `ja` / `nee` | nee |
| Rijbewijs C/CE | `logLicenseCCE` | `ja` / `nee` | nee |
| Heftruckcertificaat | `logHeftruckCert` | vrije tekst | nee |
| VCA | `logVCA` | vrije tekst | nee |
| Overige certificaten | `logOtherCertificates` | vrije tekst | nee |
| **Logistieke werkervaring** *(duurvraag)* | `logExperience` | `Geen ervaring`, `< 6 maanden`, `6–12 maanden`, `1–2 jaar`, `2–3 jaar`, `3–5 jaar`, `5+ jaar` — **let op: en-streepjes (–), niet hetzelfde als de horeca-variant met gewone streepjes (-)** | ja (`*`) |
| Werkomgevingen | `logWorkEnvironments` | array (waarden ONBEKEND — buiten gelezen bereik) | nee |
| Scanapparatuur ervaring | `logScanEquipment` | `ja` / `nee` | nee |
| Fysieke belasting | `logPhysicalLoad` | vrije tekst/keuze (ONBEKEND) | nee |
| Zelfstandig of in team | `logWorkStyle` | `Zelfstandig`, `In teamverband`, `Beide` | nee |
| Andere bijbaan? | `logOtherJob` | vrije tekst | nee |
| Referentie laatste werkgever? | `logReference` | `ja` / `nee` | nee |
| Naam referentie (bij ja) | `logReferenceContact` | vrije tekst | nee |
| Telefoon referentie (bij ja) | `logReferencePhone` | vrije tekst | nee |

Praktisch (sectie 5) + Beschikbaarheid (sectie 6):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Eigen vervoer | `logTransport` | array uit: `Auto`, `Brommer / scooter`, `Fiets`, `OV`, `Geen` | nee |
| Maximale reistijd (enkel) | `logMaxTravelTime` | `< 30 min`, `30–45 min`, `45–60 min`, `60+ min` | nee |
| Werkkleding aanwezig | `logWorkClothing` | array uit: `Veiligheidsschoenen`, `Werkbroek`, `Reflecterend vest`, `Handschoenen` | nee |
| Beschikbaarheid per week (uren) | `logAvailableHours` | vrije tekst | nee |
| Beschikbaar vanaf | `logAvailableFrom` | datumstring | nee |
| Voorkeur werkdagen | `logPreferredDays` | array `Maandag`…`Zondag`, `N.v.t.` | nee |
| Voorkeur dagdeel | `logPreferredTimes` | array uit: `Ochtend (06:00–14:00)`, `Middag (14:00–22:00)`, `Nacht (22:00–06:00)`, `Flexibel` | nee |
| Nachtdiensten akkoord? | `logNightShifts` | `ja`, `nee`, `soms` | ja (`*`) |

Logistiek-specifieke beoordeling (sectie 7):

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Betrouwbaarheidsindruk | `logReliabilityImpression` | `stipt_serieus`, `twijfelachtig`, `zorgelijk` | nee |
| Fysieke indruk | `logPhysicalImpression` | `fit_sterk`, `gemiddeld`, `fragiel` | nee |

### 3.5 Interviewer-stap "Beoordeling" (sectie 7) — geldt voor alle functies

Dit is het blok waar de interviewer de kandidaat scoort. **Let op de exacte
letterlijke waarden** (met underscores).

| Label (UI) | JSON-key | Waarden (letterlijk) | Verpl. | Voor welke functie zichtbaar |
|---|---|---|---|---|
| Beoordeling | `assessmentRating` | `topper`, `goede_indruk`, `middelmatig` | **ja** (score-validatie) | alle |
| Ervaring | `experienceLevel` | `veel`, `beperkt`, `geen` | nee | alle |
| Uiterlijke verzorging | `appearance` | `verzorgd`, `onverzorgd` | nee | alle |
| Houding | `attitude` | `super_enthousiast`, `spontaan`, `verlegen`, `ongeinteresseerd` | nee | alle |
| Communicatieve vaardigheden | `communicationSkills` | getal 1–5 (sterren) | **ja** | alle (voor chef in eigen 3-koloms blok) |
| Algehele indruk | `overallImpression` | getal 1–5 (sterren) | **ja** | alle |
| Professionele uitstraling (chef) | `chefProfessioneleUitstraling` | getal 1–5 (sterren) | **ja** (alleen chef) | alleen chef |
| Betrouwbaarheidsindruk (log) | `logReliabilityImpression` | zie 3.4 | nee | alleen logistiek |
| Fysieke indruk (log) | `logPhysicalImpression` | zie 3.4 | nee | alleen logistiek |

### 3.6 Afronden (sectie 8) — alle functies

| Label (UI) | JSON-key | Waarden | Verpl. |
|---|---|---|---|
| Afgesproken Salaris | `salaryScale` | **housekeeping:** `17`,`18`,`19`,`20`,`21` · **chef:** `assistent_chef`,`zwk_licht`,`zwk_goed`,`zwk_zwaar` · **overig (horeca/frontoffice):** `15`,`16`,`17`,`18`,`19`,`20`,`21` | ja (`*`) |
| Overige opmerkingen of bijzonderheden | `remarks` | vrije tekst | nee |

> De `salaryScale`-waarde is dus alleen een **code**; het euro-bedrag staat in het
> label en wordt niet apart opgeslagen (bv. `zwk_goed` = "ZWK goed ervaren (5-12 jaar): €22,50").

---

## 4. Hoe de `applicant.ready`-payload (`data`) wordt opgebouwd

Opgebouwd in `POST /api/admin/applications/:id/aannemen` (`server/routes.ts`,
ca. regel 7492–7528). Bronnen:
- `application` = de opgeslagen sollicitatie (kolommen + `formData`),
- `fd` = `application.formData` (het ruwe formulier),
- `candidate` = eventueel gekoppelde kandidaat,
- `employee` = de zojuist aangemaakte medewerker,
- `req.body` = wat de admin invult bij aannemen (functie, branche, opdrachtgever, contractType, startDate, language).

Volledige lijst van `data`-velden en hun herkomst:

| Payload-key | Type | Herkomst / transformatie |
|---|---|---|
| `id` | string | `String(employee.id)` |
| `applicationId` | number | `application.id` |
| `candidateId` | number? | `application.candidateId` ?? `candidate.id` |
| `employeeId` | number | `employee.id` |
| `firstName` | string | `employee.firstName` (← application/candidate) |
| `lastName` | string | `employee.lastName` |
| `function` | string | `employee.functie` ?? mapping ?? `application.functionType` |
| `email` | string\|null | `employee.email` |
| `phone` | string\|null | `employee.phone` (← application/candidate/`fd.phone`/`fd.telefoon`) |
| `birthDate` | string\|null | `employee.birthDate` ?? `candidate.birthDate` |
| `city` | string\|null | `employee.city` ?? `candidate.city` |
| `nationality` | string\|null | `candidate.nationality` ?? `fd.nationality` |
| `tags.talen` | string[]? | `fd.languages` (alleen als array) |
| `tags.vaardigheden` | string[]? | `fd.experienceTypes` (alleen als array) |
| `sterren.communicatie` | number? | `fd.communicationSkills` (**ruwe 1–5**) ?? `candidate.communicationScore` |
| `sterren.algemeneIndruk` | number? | `fd.overallImpression` (**ruwe 1–5**) ?? `candidate.overallImpressionScore` |
| `scores.softskills` | number? | `application.softskillsScore` (**0–100, gewogen berekend**) ?? `candidate.softSkillsScore` |
| `scores.bar` | number? | `application.barScore` (**0–100 = sterren×20**) ?? `candidate.barScore` |
| `scores.bediening` | number? | `application.bedieningScore` (**0–100**) ?? `candidate.serviceScore` |
| `scores.diner` | number? | `application.dinerScore` (**0–100**) ?? `candidate.dinerScore` |
| `opmerking` | string\|null | `fd.remarks` ?? `candidate.notes` |
| `referentie` | object? | `{ naam: application.adminNotes }` — **alleen** als `adminNotes` bestaat |
| `branche` | string\|null | `employee.branche` ?? branche-mapping op functie |
| `opdrachtgever` | string\|null | `employee.opdrachtgever` (uit `req.body` bij aannemen) |
| `contractType` | string\|null | `employee.contractType` (uit `req.body`) |
| `startDate` | string\|null | `employee.startDate` (uit `req.body`) |
| `language` | string\|null | `employee.language` ?? `'Nederlands'` |
| `referralCode` | string\|null | `application.referralCode` ?? `candidate.referralCode` |

Belangrijke transformatie-details:
- **`sterren.*` zijn ruwe waarden 1–5.** `scores.*` zijn **0–100** (bediening/bar/diner
  = sterren×20; `softskills` = gewogen gemiddelde over communicatie, houding,
  verzorging, beoordeling en algehele indruk — berekend in `/api/sollicitatie`
  bij het opslaan en opgeslagen op de application).
- `scores.bar` / `scores.bediening` / `scores.diner` worden alleen berekend uit
  `barSkills` / `serviceSkills` / `dinerSkills`, die **alleen bij
  horecamedewerker** bestaan. Voor chef/housekeeping/logistiek zijn deze
  `undefined` en vallen ze uit de JSON (zie voorbeelden).
- Waarden die `undefined` zijn, verdwijnen uit de JSON (via `JSON.stringify`).
  Waarden die expliciet `null` zijn, blijven als `null` staan.

### Typedefinitie vs. werkelijkheid (belangrijk voor de ontvanger)

`PlanbordPayloadData` in `planbord-webhook.ts` declareert méér optionele velden dan
er daadwerkelijk gevuld worden. Deze staan wél in het type maar worden door de
aannemen-handler **nooit gevuld** (komen dus niet in de payload voor):
- `region`
- `tags.profiel`
- `sterren.ervaringsniveau`, `sterren.verschijning`, `sterren.attitude`
- `referentie.relatie`, `referentie.telefoon` (alleen `referentie.naam` wordt gezet)

De ontvanger moet deze dus als "kan ontbreken" behandelen.

---

## 5. Voorbeeld-payloads per functie (dummy data)

> Dit zijn realistische voorbeelden op basis van de bovenstaande opbouw. De exacte
> aanwezigheid van optionele velden hangt af van wat is ingevuld en van wat de admin
> bij aannemen meegeeft.

### 5.1 Horecamedewerker

```json
{
  "event": "applicant.ready",
  "timestamp": "2026-07-07T10:30:00.000Z",
  "source": "EXTRA Horecapersoneel",
  "data": {
    "id": "1234",
    "applicationId": 501,
    "candidateId": 88,
    "employeeId": 1234,
    "firstName": "Sanne",
    "lastName": "de Vries",
    "function": "Horecamedewerker",
    "email": "sanne.devries@example.com",
    "phone": "+31612345678",
    "birthDate": "2004-03-15",
    "city": "Utrecht",
    "nationality": "Nederlandse",
    "tags": {
      "talen": ["Nederlands", "Engels"],
      "vaardigheden": ["Restaurant", "Fine dining"]
    },
    "sterren": {
      "communicatie": 4,
      "algemeneIndruk": 5
    },
    "scores": {
      "softskills": 82,
      "bar": 60,
      "bediening": 80,
      "diner": 100
    },
    "opmerking": "Sterke indruk, direct inzetbaar in het weekend.",
    "branche": "Horeca",
    "opdrachtgever": null,
    "contractType": "oproep",
    "startDate": "2026-07-15",
    "language": "Nederlands",
    "referralCode": null
  }
}
```

### 5.2 Chef

```json
{
  "event": "applicant.ready",
  "timestamp": "2026-07-07T10:31:00.000Z",
  "source": "EXTRA Horecapersoneel",
  "data": {
    "id": "1235",
    "applicationId": 502,
    "candidateId": 89,
    "employeeId": 1235,
    "firstName": "Tom",
    "lastName": "Bakker",
    "function": "Chef",
    "email": "tom.bakker@example.com",
    "phone": "+31698765432",
    "birthDate": "1990-11-02",
    "city": "Amsterdam",
    "nationality": "Nederlandse",
    "tags": {
      "talen": ["Nederlands"],
      "vaardigheden": []
    },
    "sterren": {
      "communicatie": 4,
      "algemeneIndruk": 4
    },
    "scores": {
      "softskills": 78
    },
    "opmerking": "Ervaren zelfstandig werkend kok.",
    "branche": "Horeca",
    "opdrachtgever": "Hotel Central",
    "contractType": "bepaalde tijd",
    "startDate": "2026-08-01",
    "language": "Nederlands",
    "referralCode": "ABX9F2"
  }
}
```

> Let op: bij chef ontbreken `scores.bar/bediening/diner` (die bestaan alleen voor
> horecamedewerker). De chef-sterren `chefProfessioneleUitstraling`,
> `chefYearsAsKok`, diploma's enz. zitten **niet** in de payload.

### 5.3 Housekeeping

```json
{
  "event": "applicant.ready",
  "timestamp": "2026-07-07T10:32:00.000Z",
  "source": "EXTRA Horecapersoneel",
  "data": {
    "id": "1236",
    "applicationId": 503,
    "candidateId": 90,
    "employeeId": 1236,
    "firstName": "Maria",
    "lastName": "Silva",
    "function": "Housekeeping",
    "email": "maria.silva@example.com",
    "phone": "+31611223344",
    "birthDate": "1988-06-20",
    "city": "Rotterdam",
    "nationality": "Portugese",
    "tags": {
      "talen": ["Engels", "Portugees"],
      "vaardigheden": []
    },
    "sterren": {
      "communicatie": 3,
      "algemeneIndruk": 4
    },
    "scores": {
      "softskills": 70
    },
    "opmerking": "Ruime hotelervaring, spreekt goed Engels.",
    "branche": "Housekeeping",
    "opdrachtgever": null,
    "contractType": "oproep",
    "startDate": "2026-07-20",
    "language": "Engels",
    "referralCode": null
  }
}
```

> Let op: `hkYearsExperience`, `hkBetrouwbaarheid`, `hkCommunicatie`,
> `hkRepresentativiteit`, `hkHotelStars` enz. zitten **niet** in de payload.
> `tags.vaardigheden` is voor housekeeping doorgaans leeg (dat veld wordt uit
> `experienceTypes` gevuld, dat alleen op het horeca-scherm bestaat).

### 5.4 Logistiek

```json
{
  "event": "applicant.ready",
  "timestamp": "2026-07-07T10:33:00.000Z",
  "source": "EXTRA Horecapersoneel",
  "data": {
    "id": "1237",
    "applicationId": 504,
    "candidateId": 91,
    "employeeId": 1237,
    "firstName": "Kevin",
    "lastName": "Jansen",
    "function": "Logistiek",
    "email": "kevin.jansen@example.com",
    "phone": "+31655667788",
    "birthDate": "1999-01-10",
    "city": "Tilburg",
    "nationality": "Nederlandse",
    "tags": {
      "talen": ["Nederlands"],
      "vaardigheden": []
    },
    "sterren": {
      "communicatie": 3,
      "algemeneIndruk": 3
    },
    "scores": {
      "softskills": 65
    },
    "opmerking": "Beschikbaar voor nachtdiensten.",
    "branche": "Logistiek",
    "opdrachtgever": null,
    "contractType": "oproep",
    "startDate": "2026-07-14",
    "language": "Nederlands",
    "referralCode": null
  }
}
```

> Let op: `logExperience`, `logNightShifts`, `logReliabilityImpression`,
> `logPhysicalImpression`, certificaten, vervoer enz. zitten **niet** in de payload.

---

## 6. Formuliervelden die NIET in de payload zitten (met reden)

De volgende velden worden wél in de intake ingevuld en opgeslagen (in
`applications.formData` en/of de `candidates`-tabel), maar gaan **niet** mee in de
`applicant.ready`-webhook. Reden voor alle: **de aannemen-handler kopieert alleen de
in sectie 4 genoemde selectie; deze velden staan niet in dat mapping-blok.** Ze
blijven dus alleen in de EXTRAATJE-database beschikbaar.

**Start / achtergrond**
- `interviewer` — wel opgeslagen op de application, niet in payload.
- `channel` (aanmeldkanaal) — alleen naar `candidates.sourceChannel`, niet in payload.
- `needsWorkPermit` — naar `candidates.needsTwv`/`twvStatus`, niet in payload.
- `voertaal` — niet in payload (de payload gebruikt `language`, gezet bij aannemen).

**De 4 duur-/ervaringsvragen (belangrijk!)**
- `horecaExperience` (Horeca), `chefYearsAsKok` (Chef), `hkYearsExperience`
  (Housekeeping), `logExperience` (Logistiek) — **geen van deze zit in de payload.**
  Ervaring wordt richting Planbord alleen indirect uitgedrukt via de berekende
  `scores`/`sterren`, niet als de letterlijke duur-tekst.

**Interviewer-beoordeling (sectie 7)**
- `assessmentRating` (`topper`/`goede_indruk`/`middelmatig`) — niet in payload
  (gaat wél mee in de berekening van `scores.softskills`).
- `experienceLevel` (`veel`/`beperkt`/`geen`) — niet in payload.
- `appearance` (`verzorgd`/`onverzorgd`) — niet als losse waarde (telt mee in `softskills`).
- `attitude` (`super_enthousiast`/…) — niet als losse waarde (telt mee in `softskills`).
- `chefProfessioneleUitstraling`, `hkBetrouwbaarheid`, `hkCommunicatie`,
  `hkRepresentativiteit` — niet in payload (alleen `communicationSkills` en
  `overallImpression` gaan mee als `sterren`).
- `logReliabilityImpression`, `logPhysicalImpression` — niet in payload.

**Vaardigheden / ja-nee vlaggen (horeca)**
- `canWorkIndependently`, `canCarry3Plates`, `isBarista`, `canShakeCocktails`,
  `isAssistantChef`, `canWashDishes`, `isPromoWorker` — niet in payload (deels wel
  in `candidates`-kolommen, bv. `isBarista`).

**Praktisch / beschikbaarheid (alle functies)**
- `hasDriversLicense`, `hasStudentOV`, `ovType`, `workClothing`, `hasCar`,
  `availableHours`, `preferredDays`, `preferredTimes` — niet in payload.
- `salaryScale` (afgesproken salaris) — **niet in payload** (alleen opgeslagen op de
  application/candidate). Dit is opvallend als het ontvangende systeem loon nodig heeft.

**Chef-detailvelden**
- `chefKitchenTypes`, `chefDiplomas`, `chefLeadershipExp`, `chefMainKitchen`,
  `chefCompanies`, `chefClothing`, `chefStartDate` — niet in payload.

**Housekeeping-detailvelden**
- `hkTasks`, `hkLocationTypes`, `hkHotelStars`, `hkCompanies`, `hkReference` — niet in payload.

**Logistiek-detailvelden**
- `logLicenseB`, `logLicenseCCE`, `logHeftruckCert`, `logVCA`,
  `logOtherCertificates`, `logWorkEnvironments`, `logScanEquipment`,
  `logPhysicalLoad`, `logWorkStyle`, `logOtherJob`, `logReference`,
  `logReferenceContact`, `logReferencePhone`, `logTransport`, `logMaxTravelTime`,
  `logWorkClothing`, `logAvailableHours`, `logAvailableFrom`, `logPreferredDays`,
  `logPreferredTimes`, `logNightShifts` — niet in payload.

**Wat wél nieuw ontstaat bij aannemen (niet uit intake):**
- `opdrachtgever`, `contractType`, `startDate`, `language`, en de definitieve
  `branche`/`function` — deze komen uit `req.body` van de aannemen-actie (de admin
  vult ze in), niet uit het intake-formulier.
- `referentie.naam` = `application.adminNotes` (admin-notitie), niet een intake-veld.

---

## 7. Versiegeschiedenis van veldnamen/-waarden (uit git)

Relevante commits die de intake-veldstructuur hebben gewijzigd
(`client/src/pages/SollicitatieFormulier.tsx`):

- **Eerste versie van het formulier** (commit `6ca66204`, 21 jan 2026): introduceerde
  o.a. de horeca-duurvraag met exact deze waarden:
  `["Geen ervaring", "<6 maanden", "6-12 maanden", "1-2 jaar", "2-3 jaar", "3-5 jaar", "5+ jaar"]`
  en de salarisschalen (`15`…`21`). Deze horeca-waarden zijn sindsdien **ongewijzigd**.
- **Housekeeping-tak toegevoegd** (commit `3c655e23`): introduceerde
  `hkYearsExperience` met waarden `1-3 / 3-5 / 5-10 / 10> jaar ervaring`.
- **Chef-tak toegevoegd** (commit `da9e6639`): introduceerde `chefYearsAsKok`
  (zelfde waardenset als housekeeping) + de chef-sterren en chef-salarisschalen
  (`assistent_chef`/`zwk_*`).
- **Logistiek-tak toegevoegd** (commit `eac09494`): introduceerde `logExperience`
  met waarden `["Geen ervaring", "< 6 maanden", "6–12 maanden", "1–2 jaar", "2–3 jaar", "3–5 jaar", "5+ jaar"]`.
  **Belangrijk verschil:** logistiek gebruikt **en-streepjes (–)** en **spaties rond
  streepjes**, terwijl horeca gewone koppeltekens (`-`) zonder spaties gebruikt. De
  twee lijsten zijn dus **niet identiek** en niet uitwisselbaar bij string-matching.
- **Front-office uit de UI verwijderd** (commit `8177f58c`): de waarde `frontoffice`
  bestaat nog in het zod-schema maar is niet meer kiesbaar in de UI.
- **Auto-opslaan toegevoegd** (commit `256f680f`): raakt niet de veldnamen/-waarden.

Geen commits gevonden waarin bestaande duur-waarden of de letterlijke
beoordelingswaarden (`topper`/`goede_indruk`/`middelmatig`, `veel`/`beperkt`/`geen`,
enz.) **hernoemd** zijn na introductie. Voor zover uit git zichtbaar zijn deze
letterlijke waarden stabiel gebleven sinds hun introductie.

> ONBEKEND: de volledige git-historie van `server/routes.ts` en
> `planbord-webhook.ts` is niet regel-voor-regel doorlopen; er kunnen kleine
> wijzigingen in de payload-opbouw zijn geweest die hier niet expliciet zijn
> getraceerd. De payload-opbouw zoals beschreven in sectie 4 is de **huidige** stand.

---

## 8. Aandachtspunten & onbekenden (samengevat)

1. **`WEBHOOK_SECRET` vs `WHATSAPP_WEBHOOK_SECRET`.** De Planbord-webhook leest
   `process.env.WEBHOOK_SECRET`. Die naam komt niet voor in de bekende
   omgevingsvariabelen (wel `PLANBORD_WEBHOOK_URL` en `WHATSAPP_WEBHOOK_SECRET`).
   Als `WEBHOOK_SECRET` nergens gezet is, wordt de webhook overgeslagen. **Verifieer
   dit in de daadwerkelijke omgeving.**
2. **Ervaringsduur staat niet in de payload.** Wil het ontvangende project de
   letterlijke ervaringsduur of het salaris (`salaryScale`) weten, dan zit dat nu
   **niet** in de webhook. Dat zou een uitbreiding van de payload vereisen.
3. **Twee verschillende streepjes-conventies** in de duur-waarden (horeca `-` vs.
   logistiek `–`). Bij matching op tekst hiermee rekening houden.
4. **Type declareert meer dan wordt verstuurd** (`region`, `tags.profiel`,
   `sterren.ervaringsniveau/verschijning/attitude`, `referentie.relatie/telefoon`).
   Behandel al deze als optioneel/afwezig.
5. **`scores.bar/bediening/diner` alleen bij horecamedewerker.** Andere functies
   sturen enkel `scores.softskills`.
6. **`sterren` = 1–5, `scores` = 0–100.** Verschillende schalen; niet door elkaar halen.
7. **Onbekend gebleven letterlijke waarden:** `logWorkEnvironments`,
   `logPhysicalLoad`, `logHeftruckCert`, `logVCA` optielijsten (buiten het gelezen
   bereik / vrije tekst). Deze zitten hoe dan ook niet in de payload.
