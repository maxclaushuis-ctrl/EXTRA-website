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
-   **Contact-info**: `PUT /api/whatsapp/conversations/:phone/contact-info` — displayName/contactCompany/contactNotes voor unmatched contacten. Schema kolommen: `contact_company`, `contact_notes`.
-   **Frontend**: Tweekolommen UI in admin-dashboard tab "WhatsApp" met tabs kandidaat/prospect/onbekend, zoek, thread-view, 24u-venster check, status-indicators. Webhook-instellingen achter ⚙-icoon (niet standaard zichtbaar). Unmatched-contacten: inline bewerk-formulier voor naam/bedrijf/notities via ✏️-knop in thread header.
-   **Phone-normalisatie**: `server/whatsapp/phone.ts` (NL 06→+31, strips whitespace/dashes, E.164 zonder +).
-   **Migratie**: `npx tsx server/whatsapp/migrate-phones.ts` (dry-run default, `--apply` voor schrijven). Backup in `phone_original` / `telefoon_original` kolommen.
-   **Env-vars**: `WHATSAPP_360_API_KEY`, `WHATSAPP_WEBHOOK_SECRET`.
-   **Docs**: `server/whatsapp/README.md`.
-   **Niet in Fase 1**: templates, bot/Claude, diensten-koppeling, media-download.

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
-   **OpenAI**: AI content generation for the blog system.