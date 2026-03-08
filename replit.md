# EXTRAATJE - Test Environment

## Overview
This project is the EXTRAATJE test environment, a complete replica of the EXTRA Rewards platform. Its primary purpose is to provide a safe space for testing and development without impacting the production system. It includes all core functionalities of the main system, such as challenges with progress bars, leaderboards, and a comprehensive reward system. The vision is to enable robust feature development and integration, eventually leading to production deployment with features like automated point allocation based on external planning systems.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design
The application utilizes a monorepo structure, organizing code into `client/` for the React frontend, `server/` for the Express backend, and `shared/` for common TypeScript schemas.

### Tech Stack
-   **Frontend**: React with TypeScript, Vite
-   **UI**: Radix UI, shadcn/ui, Tailwind CSS
-   **Backend**: Express.js with TypeScript
-   **Database**: PostgreSQL with Drizzle ORM
-   **Session Management**: Express-session with connect-pg-simple
-   **Real-time**: WebSockets

### Key Features
-   **User Management**: Employee roles (admin/employee), TWV (Work Permit) tracking, points.
-   **Rewards System**: Physical rewards, partner discounts (QR-code or discount code based), and a comprehensive point transaction audit trail.
-   **Challenges**: Configurable challenges including one-time and progressive types with step-by-step progression and visual progress bars.
-   **Leaderboard**: Real-time monthly leaderboard with position badges for top performers.
-   **Authentication & Authorization**: Session-based with role-based access control and WebSocket authentication.
-   **Marketing & Communications**: Email template system, campaign management, and automation triggers (e.g., birthdays).
-   **Sollicitanten Import**: XLSX import feature per function tab (Horecamedewerker, Chef, Housekeeping). Accessible via green "Import .xlsx" button in the tab header. Modal with dry-run preview, column-mapping summary, and commit. Backend in `server/import-xlsx.ts` with fuzzy header matching, score parsing (%, 0-1 floats, integers), duplicate detection (email/phone/name+date), and upsert. Scores stored in `softskills_score`, `bar_score`, `bediening_score`, `diner_score` columns. Applications tagged with `source='xlsx_import'` and `import_batch_id`.
-   **Candidate Management**: Comprehensive pre-onboarding system for candidates, including skills assessment, availability, and GDPR compliance features. Aanmeldflow (step 2 Skills) now uses Dutch/English proficiency radio buttons (Niet/Basis/Redelijk/Goed) with conditional English question, CV upload required in step 2 before proceeding to Calendly. Candidates without CV receive an initial email + daily reminders until CV is uploaded (`hasCv`, `cvReminderSentAt` fields on candidates table).
-   **Public Website Pages**: Complete SEO-geoptimaliseerde websitestructuur met gedeelde `PublicNav` (dropdown navigatie) en `PublicFooter` (4-kolom). Werkgever routes: `/horeca-personeel-inhuren`, `/hotel-personeel-amsterdam`, `/evenementen-personeel-amsterdam`, `/catering-personeel-amsterdam`, `/restaurant-personeel-amsterdam`. **Personeel-gezocht pagina's (5 stuks)**: `/personeel-gezocht` (algemene hub met 4 branch cards), `/hotel-personeel-gezocht`, `/event-personeel-gezocht`, `/cateringpersoneel-gezocht`, `/restaurant-personeel-gezocht`. PublicNav "Ik zoek extra personeel" linkt naar `/personeel-gezocht`; subnavigatie naar branchepagina's. Kandidaat routes: `/horeca-vacatures-amsterdam`, `/horeca-werk-amsterdam`, `/housekeeping-vacatures-amsterdam`, `/chef-vacatures-amsterdam`, `/front-office-vacatures-amsterdam`. SEO pillar pagina's (900-1200+ woorden): `/horeca-uitzendbureau-amsterdam` (hoofdpillar), `/horeca-personeel-amsterdam`, `/horeca-personeel`, `/flexibel-horeca-personeel`. Werkwijze pagina: `/horeca-uitzendbureau-amsterdam-werkwijze` (WerkwijzePage.tsx) — 10 secties: hero, intro, werkgever-stappen (4), selectieproces, data+technologie, favorietenpoule, wetgeving, medewerker-stappen (4), social proof logo's, CTA. Overige: `/klantcases-horeca`, `/contact`. Aliassen: `/blog`=NieuwsPage, `/onze-werkwijze`=HoeExtraWerkt, `/beloningssysteem`=Extraatje, `/ons-team`=OnsTeam. Legacy: `/landing`, `/over-extra`, `/hoe-extra-werkt`, `/ik-zoek-extra-werk`, `/extraatje`.
-   **SEO Blog Systeem**: Volledig DB-backed CMS voor SEO artikelen. Tabel `blog_posts` met titel, slug, content (HTML), excerpt, meta_title, meta_description, focus_keyword, category, status (draft/scheduled/published), scheduled_at, published_at, image_url, image_alt, author, read_time, tags. Admin beheer via "Blog & SEO" tab in dashboard sidebar onder "Marketing & SEO". Auto-publish scheduler (elk uur). Sitemap via `/sitemap.xml`. Article JSON-LD structured data op artikelpagina's. AI-generatie via OpenAI (blueprint: javascript_openai_ai_integrations). Publieke pagina's: `/nieuws` (lijst, DB + statische fallback) en `/nieuws/:slug` (artikel, DB-first met HTML rendering).

### UI/UX
-   Modern UI built with shadcn/ui.
-   Mobile-optimized layouts for dashboards and leaderboards.
-   Visual progress bars for challenges and celebration animations for milestones.
-   **Admin Dashboard**: Redesigned with sidebar navigation, stats cards (Totaal Gebruikers, Actieve Gebruikers, Uitgegeven Punten, Gebruikersgroei), Top Presteerders widget, Inactieve Gebruikers panel, Te doen action items, and Recente Activiteit feed.

### Deployment
Configured for Replit autoscale deployment, utilizing Vite for frontend builds and `tsx` for development. Environment variables are used for configuration (`DATABASE_URL`, `SENDGRID_API_KEY`, `NODE_ENV`).

### Important Technical Notes
-   **queryClient (`client/src/lib/queryClient.ts`)**: Has a `defaultQueryFn` that uses `queryKey[0]` as the URL and returns parsed JSON. All `useQuery` calls in DashboardMockup rely on this — do NOT remove it.
-   **apiRequest**: Supports 3 calling patterns: `(url, options)`, `(method, url, body)`, `(url, method, body)`. Returns parsed JSON (not a Response object).
-   **Candidate flow**: Step 1 "Ga verder" triggers `POST /api/aanmelden` with `partial:true`. This creates the candidate immediately in the DB as `status='in_behandeling'`. The admin Kandidaten tab shows them under "In proces". The "Vernieuwen" button and 30-second auto-refresh keep the list current.

## External Dependencies
-   **PostgreSQL Database**: Main data store.
-   **SendGrid API**: Email delivery service (with mock mode for development).
-   **External Planning API**: Integration for workforce planning via `user.apiId` field.
-   **Google Analytics**: (Optional) For A/B testing and user behavior.
-   **Canvas Confetti**: (Optional) For celebration animations.