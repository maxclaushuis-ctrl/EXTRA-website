# EXTRAATJE - Test Environment

## Overview
The EXTRAATJE Test Environment is a replica of the EXTRA Rewards platform, designed for robust testing and development. Its primary goal is to facilitate feature development and integration without affecting the production system. Key capabilities include managing challenges with progress bars, leaderboards, a comprehensive reward system, and advanced CRM and marketing automation functionalities. The long-term vision involves integrating with external planning systems for automated point allocation and eventual production deployment, aiming to enhance employee engagement and streamline recruitment processes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design
The application employs a monorepo structure, separating the React frontend (`client/`), Express backend (`server/`), and shared TypeScript schemas (`shared/`). The architecture emphasizes modularity, scalability, and maintainability.

### Tech Stack
-   **Frontend**: React with TypeScript, Vite, Radix UI, shadcn/ui, Tailwind CSS.
-   **Backend**: Express.js with TypeScript.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Session Management**: Express-session with connect-pg-simple.
-   **Real-time**: WebSockets.

### Key Features
-   **User & Rewards Management**: Employee roles, points tracking, physical rewards, partner discounts, and an audit trail for point transactions.
-   **Challenges & Leaderboard**: Configurable one-time and progressive challenges with visual progress bars and a real-time monthly leaderboard.
-   **Authentication & Authorization**: Session-based with role-based access control and WebSocket authentication.
-   **Recruitment & Candidate Management**: XLSX import for candidate data, pre-onboarding system with skills assessment, CV upload, and admin review workflows.
-   **Job Vacancy System**: Public-facing vacancy pages with client-side filtering and a database-backed CMS for managing job postings, including SEO optimization.
-   **CRM System**: B2B CRM for managing companies, contacts, notes, and reminders, with email notifications and dashboard widgets.
-   **Marketing Automation (Prospect Campaigns)**:
    -   **Flow Builder**: Visual editor for multi-step campaigns (email, wait, condition).
    -   **A/B Testing**: System for A/B testing email campaigns with automated winner determination.
    -   **Performance Dashboard**: Comprehensive analytics with KPIs, charts, and export options.
    -   **Scheduled Sending**: Timezone-aware scheduling infrastructure with flexible sending slots and workday considerations.
    -   **Apollo.io CSV Import**: One-click import with AI-powered header mapping and deduplication.
    -   **vCard (.vcf) Import**: iPhone/iCloud/Google contacten-export rechtstreeks importeren als prospect-contacten. Parser ondersteunt vCard 2.1/3.0/4.0 (incl. quoted-printable, line-folding, mobiel-voorrang bij meerdere TEL's). Telefoon-only contacten krijgen een `wa+<nr>@no-email.local` placeholder zodat ze de WhatsApp-matcher voeden. Dedupe op email + genormaliseerd telefoonnummer.
    -   **WhatsApp Categorie-override**: In de gespreks-header staat naast "Toegewezen aan" een dropdown om gesprekken handmatig tussen de tabs Medewerkers/Klanten/Kandidaten te verplaatsen. De keuze wordt opgeslagen in `whatsapp_conversations.manual_category` en wint via `COALESCE(manual_category, auto_match)` van de matcher, zodat nieuwe inkomende berichten de override niet terugzetten. Endpoint: `PUT /api/whatsapp/conversations/:phone/category` (`null` = override wissen + re-matchen).
    -   **Smart Flow Management**: Auto-stopping campaigns based on contact activity (replies, bounces, unsubscribes) and intelligent wait calculations respecting campaign sending windows.
    -   **SendGrid Integration**: Webhook handling for email events (deliveries, opens, clicks, bounces, spam reports) and inbound replies, updating contact status and campaign metrics.
    -   **Pipelining & Segmentation**: Contact phasing (new, in-campaign, in-conversation, client) and function-tag based segmentation for targeted campaigns.
    -   **Series & Variant Generation**: Campagnes kunnen worden gegroepeerd in een `serie` (bv. jaarcampagne van 8 stappen) met `serieStapNr`. Sidebar toont collapsible groepen per serie met mini-statusbalk; campagnes zonder serie staan onder "Losse campagnes". Filters bovenaan voor serie/branche/functie/taal. "Dupliceren" maakt direct een gereset concept-kopie; "Genereer varianten" wizard maakt in 1 klik een matrix van branches × functies × talen aan met juiste filters.
-   **SEO Blog System**: Database-backed CMS with content management, scheduling, SEO fields, sitemap generation, and AI content generation.
-   **KPI & Reporting**: Admin dashboard for analytics, conversion funnels, trends, source distribution, and CSV export.

### UI/UX
-   Modern, mobile-optimized UI utilizing shadcn/ui.
-   Visual progress bars and celebration animations.
-   Redesigned Admin Dashboard with sidebar navigation, key statistics, and activity feeds.

### Deployment
Configured for Replit autoscale deployment, using Vite for frontend builds and `tsx` for development. Environment variables (`DATABASE_URL`, `SENDGRID_API_KEY`, `NODE_ENV`, `BASE_URL`) manage configuration.

### WhatsApp Integration (Fase 1 — 360dialog Cloud API)
-   **Webhook**: `POST /api/whatsapp/webhook/:secret` — inkomende berichten van 360dialog. Secret in URL-pad met `timingSafeEqual`, gemaskeerd in logs (`/api/whatsapp/webhook/***`).
-   **Persistentie**: `whatsapp_messages` + `whatsapp_conversations` tabellen met auto-koppeling aan `candidates` / `prospect_contacts` via phone-normalisatie.
-   **Idempotentie**: duplicate `wa_message_id` wordt genegeerd.
-   **Status-events**: `statuses[]` van 360dialog (sent/delivered/read/failed) updaten het bericht in DB.
-   **Outbound**: `POST /api/whatsapp/stuur` — slaat op als queued → sent/failed, koppelt aan candidate/prospect.
-   **Endpoints**: `/conversations`, `/conversations/:phone/messages`, `/conversations/:phone/mark-read`, `/stats`.
-   **Contact-info**: `PUT /api/whatsapp/conversations/:phone/contact-info` — displayName/contactCompany/contactNotes voor unmatched contacten.
-   **Team inbox**: Gedeelde inbox met toewijzing, interne notities, labels en filters.
    -   `GET /api/whatsapp/team-members` — lijst admin-users voor toewijzing.
    -   `PUT /api/whatsapp/conversations/:phone/assign` — wijs gesprek toe aan teamlid (`assigned_to_id`, `assigned_to_name`).
    -   `PUT /api/whatsapp/conversations/:phone/labels` — labels als text[] op conversatie.
    -   `GET/POST /api/whatsapp/conversations/:phone/notes` — interne notities (tabel `whatsapp_internal_notes`).
    -   Frontend: filter-dropdowns (ongelezen/toegewezen/label), toewijzing-dropdown in thread header, labels met + knop, Berichten/Interne notities toggle-tabs.
-   **Groepen + Bulk verzending**: Contactgroepen aanmaken en berichten naar alle leden sturen als individuele 1-op-1 berichten.
    -   `GET/POST /api/whatsapp/groups` — groepen ophalen/aanmaken.
    -   `PUT/DELETE /api/whatsapp/groups/:id` — groep bewerken/verwijderen.
    -   `GET/POST /api/whatsapp/groups/:id/members` — leden ophalen/toevoegen.
    -   `DELETE /api/whatsapp/groups/:id/members/:phone` — lid verwijderen.
    -   `GET /api/whatsapp/groups/:id/available-contacts` — beschikbare contacten (niet al lid).
    -   `POST /api/whatsapp/groups/:id/send` — bulk verzending naar alle leden.
    -   `GET /api/whatsapp/bulk-sends` — verzendgeschiedenis.
    -   Tabellen: `whatsapp_groups`, `whatsapp_group_members`, `whatsapp_bulk_sends`.
    -   **Contact import (3 bronnen + handmatig)**:
        -   `GET /api/whatsapp/import/candidates?groupId=X` — kandidaten met telefoon uit DB, gefilterd op functie/status.
        -   `GET /api/whatsapp/import/prospects?groupId=X` — klanten/prospects met telefoon uit DB, gefilterd op branche.
        -   `POST /api/whatsapp/import/csv` — CSV-parser: naam;telefoon of alleen telefoon per regel, auto-detectie kolommen, NL 06→+31 normalisatie.
        -   Handmatig: enkel nummer + naam toevoegen.
        -   Frontend: 5-tabs overlay (WhatsApp / Kandidaten / Klanten / CSV Upload / Handmatig) met zoeken, filters, selecteer-alles, en multi-select toevoegen.
    -   Frontend: toggle "Gesprekken" / "Groepen" in WhatsApp beheer; groepenbeheer met leden-picker, bulk-verzending met bevestigingsstap, verzendgeschiedenis.
-   **Frontend**: Tweekolommen UI in admin-dashboard tab "WhatsApp" met tabs Medewerkers/Klanten/Kandidaten, zoek, thread-view, 24u-venster check, status-indicators. Webhook-instellingen achter ⚙-icoon (niet standaard zichtbaar). Unmatched-contacten: inline bewerk-formulier voor naam/bedrijf/notities via ✏️-knop in thread header.
-   **Phone-normalisatie**: `server/whatsapp/phone.ts` (NL 06→+31, strips whitespace/dashes, E.164 zonder +).
-   **Migratie**: `npx tsx server/whatsapp/migrate-phones.ts` (dry-run default, `--apply` voor schrijven). Backup in `phone_original` / `telefoon_original` kolommen.
-   **Env-vars**: `WHATSAPP_360_API_KEY`, `WHATSAPP_WEBHOOK_SECRET`.
-   **Docs**: `server/whatsapp/README.md`.
-   **AI Reply Suggestions + Auto-reply**: AI-powered antwoordsuggesties én volledig autonome bot-modus voor WhatsApp-berichten, aangedreven door OpenAI (gpt-4o-mini).
    -   `GET/PUT /api/whatsapp/ai-settings` — AI-richtlijnen (tone of voice, voorbeeldberichten van eigen schrijfstijl, algemene richtlijnen, afmeldprotocol, extra context) + auto-reply config (`autoReplyEnabled`, `autoReplyOnlyForKnown`, `autoReplyMinIntervalSec`).
    -   `POST /api/whatsapp/ai-suggest` — AI-suggestie genereren op basis van gespreksgeschiedenis, contactinfo, richtlijnen, kennisbank en voorbeeldberichten.
    -   `GET/POST/PUT/DELETE /api/whatsapp/ai-knowledge` — CRUD op kennisbank-entries (genoemde protocollen die de AI als context krijgt).
    -   `POST /api/whatsapp/stuur-media` — Multipart-upload voor foto's, video's, audio en documenten (max 16MB). Server uploadt eerst naar 360dialog `/media`, daarna verstuurt het bericht met media-id; mime → WhatsApp-type-mapping (image/video/audio/document) automatisch.
    -   `POST /api/whatsapp/conversations/:phone/koppel-contact` — Koppel een onbekende WhatsApp-afzender aan een echte contact-rij. Body: `{voornaam, achternaam, categorie, email?, notities?}` met categorie `klant`/`medewerker`/`kandidaat`. Maakt rij in `prospect_contacts` (klant, met placeholder-email als geen email) of `candidates` (medewerker → status `aangenomen`, kandidaat → status `in_behandeling`, default functionType `horecamedewerker`), en re-matcht het gesprek (zet candidateId/prospectContactId, matchCategory en displayName). Validatie: voornaam+achternaam verplicht, categorie whitelist, FK-check op session.userId.
    -   Tabellen: `whatsapp_ai_settings` (config + auto-reply flags + `voiceExamples`), `whatsapp_ai_knowledge` (titel, content, enabled, sortOrder).
    -   **Tone-of-voice + voorbeeldberichten**: planner plakt eigen WhatsApp-berichten in `voiceExamples`-veld; AI bootst toon, lengte en emoji-gebruik na maar VERTAALT die stijl naar de juiste taal.
    -   **Multi-language detection**: Helper `detectMessageLanguage()` doet een snelle gpt-4o-mini call (max_tokens=20, temperature=0) voor de laatste inkomende boodschap, retourneert ISO-code + naam. Beide endpoints (auto-reply en suggest) injecteren de gedetecteerde taal HARD in het system prompt zodat het model gegarandeerd in dezelfde taal antwoordt (NL/EN/ES/PL/DE/FR/AR/TR/RO/PT/IT etc.) — onafhankelijk van de taal van de voorbeeldberichten/protocollen. Fallback bij detectie-fout = Nederlands.
    -   Auto-reply: Bij ingeschakelde modus genereert/verstuurt de bot zelfstandig antwoorden op inkomende tekstberichten. Veiligheidsmaatregelen: alleen-bekende-contacten toggle, rate-limit (min interval), AI-escalatie naar planner bij twijfel/gevoelige onderwerpen (model retourneert "ESCALATE"). Geactiveerd via webhook handler `tryAutoReply()` in `server/routes.ts`.
    -   Frontend: Automatische AI-suggestie bij nieuw inbound bericht, ✨-knop voor handmatig opvragen, suggestiebalk met Overnemen/Bewerken/Opnieuw. AI-knop ook bij groepsberichten. AI-richtlijnen panel achter "✨ AI" knop in header met voorbeeldberichten-veld, kennisbank-beheer (add/edit/delete protocollen) en auto-antwoord toggle met safety opties. **+** knop in chat-input opent file-picker (foto/video/audio/PDF/Office) met preview-balk en bijschrift-veld. Bij **onbekende afzenders** ✏️-knop opent inline formulier "Toevoegen aan contacten": voornaam + achternaam (gescheiden velden), categorie-knoppen (Klant/Medewerker/Kandidaat), optionele email (alleen bij Klant) en notitieveld; opslaan creëert de echte contact-rij en herclassificeert het gesprek direct in de juiste tab.
-   **Niet in Fase 1**: templates, diensten-koppeling, inbound media-download.

### Brochure Pages (Slide-based Presentations)
-   **`/brochure`** → `Brochure.tsx` — Algemene NL brochure.
-   **`/brochures`** → `BrochureEN.tsx` — English brochure.
-   **`/events`** → `BrochureEvents.tsx` — Brochure voor evenementenlocaties (Scheepvaartmuseum, H'ART, etc.).
-   **`/lofi`** → `BrochureLofi.tsx` — Gepersonaliseerde brochure voor Lofi (evenementenlocatie). Focus op vaste gezichten/continuïteit. 11 slides: Hero (EXTRA × Lofi) → Waarom vaste gezichten → Diensten → Dezelfde gezichten → Kwaliteit → Kwalificatieproces → EXTRAATJE → Beoordelingen → Compliance → Persoonlijk contact → CTA.
-   **`/BHG-group`** → `BHGGroupPage.tsx` — Brochure voor BHG Group.
-   Format: fullscreen, framer-motion AnimatePresence, keyboard nav, progress dots, click-to-advance, Poppins font, dark gradient.
-   Lofi logo asset: `client/src/assets/pitch/logo-lofi.png` (background removed).

## External Dependencies
-   **PostgreSQL Database**: Primary data persistence.
-   **SendGrid API**: Email delivery services and webhook processing.
-   **360dialog Cloud API**: WhatsApp Business messaging (Fase 1).
-   **External Planning API**: Integration for workforce planning.
-   **Google Analytics**: User behavior tracking.
-   **Canvas Confetti**: Visual celebration effects.
-   **OpenAI**: AI content generation for the blog system and WhatsApp reply suggestions.