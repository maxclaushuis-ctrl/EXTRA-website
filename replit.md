# EXTRAATJE - Test Environment

## Overview
The EXTRAATJE Test Environment is a replica of the EXTRA Rewards platform, designed for robust testing and development. Its primary goal is to facilitate feature development and integration without affecting the production system. Key capabilities include managing challenges with progress bars, leaderboards, and a comprehensive reward system. The long-term vision involves integrating with external planning systems for automated point allocation and eventual production deployment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design
The application follows a monorepo structure, separating the React frontend (`client/`), Express backend (`server/`), and shared TypeScript schemas (`shared/`).

### Tech Stack
-   **Frontend**: React with TypeScript, Vite, Radix UI, shadcn/ui, Tailwind CSS.
-   **Backend**: Express.js with TypeScript.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Session Management**: Express-session with connect-pg-simple.
-   **Real-time**: WebSockets.

### Key Features
-   **User Management**: Employee roles (admin/employee), TWV tracking, points.
-   **Rewards System**: Physical rewards, partner discounts, and a point transaction audit trail.
-   **Challenges**: Configurable one-time and progressive challenges with visual progress bars.
-   **Leaderboard**: Real-time monthly leaderboard with position badges.
-   **Authentication & Authorization**: Session-based with role-based access control and WebSocket authentication.
-   **Marketing & Communications**: Email template system, campaign management, and automation triggers.
-   **Sollicitanten Import**: XLSX import for candidate data with fuzzy header matching and duplicate detection.
-   **Candidate Management**: Pre-onboarding system including skills assessment, availability, GDPR, CV upload, and admin review flow for acceptance/rejection.
-   **Public Website Pages**: SEO-optimized website structure with employer and candidate-focused pages, including dedicated English pages.
-   **Vacancies System**: Overview and detail pages for job postings with client-side filtering and JobPosting JSON-LD.
-   **Vacancies CMS**: Database-backed CMS for managing job postings with CRUD operations, SEO fields, and publishing workflow.
-   **Client Review System**: Structured display of customer reviews with category filtering.
-   **KPI & Reporting**: Admin dashboard for candidate data analytics, including key metrics, conversion funnel, trends, source distribution, and CSV export.
-   **CRM System (V1)**: B2B CRM for company, contact, note, and reminder management, with email notifications and dashboard widgets.
-   **Prospect Campaigns - Flow Builder**: Visual flow editor based on ReactFlow for defining multi-step campaigns (email, wait, condition).
-   **Prospect Campaigns - A/B Testing**: System for A/B testing email campaigns based on open/click rates, with automated winner determination and reporting.
-   **Prospect Campaigns - Statistieken Dashboard**: Comprehensive campaign performance dashboard (ProspectStatistiekenDashboard.tsx) with KPI cards (verzonden/open/click/uitschrijvingen), period + branch filters, recharts ComposedChart, campaign rankings table, branch horizontal bars, activity feed, and CSV export. Sidebar nav entry at prospect-statistieken. Plus T003 click-analyse extension in campaign detail statistieken tab: URL click table, collapsible "Geopend door" contact list, and "Niet geopend" contact list with follow-up campaign button.
-   **Prospect Campaigns - Geplande Verzending (Stap 8)**: Full scheduled sending infrastructure. Schema additions: `werkelijkVerzendOp`, `verzendDirect`, `tijdzone` columns + new `scheduler_log` and `instellingen` tables. Backend: `server/schedulerUtils.ts` (isWerkdag, berekenWerkelijkVerzendMoment, formatNLDatum, logScheduler, getInstelling/setInstelling), `server/campaignScheduler.ts` (planCampagne with dry-run preview, checkGeplandeCampagnes with DB-lock). Routes: POST /plannen, POST /plannen-preview (dry-run), PUT /verzendtijd, POST /annuleer-planning, GET/POST /api/admin/scheduler/status+run, GET/PUT /api/admin/instellingen/verzend. Frontend: VerzendplanningSection component in ProspectCampagnesTab.tsx (countdown timer, direct/inplannen buttons, inline datetime form, debounced live preview of werkelijk verzendmoment with weekday correction). Campaign list: status filter pills with counts, gepland badge with timestamp, sorted by geplande datum. SchedulerStatusTab.tsx: full scheduler monitoring page (status cards, upcoming campaigns, log history, default send settings editor). Sidebar nav "Scheduler" at /dashboard.
-   **SEO Blog System**: Database-backed CMS for blog posts with content management, scheduling, SEO fields, sitemap generation, and AI content generation integration.

### UI/UX
-   Modern, mobile-optimized UI using shadcn/ui.
-   Visual progress bars and celebration animations.
-   Redesigned Admin Dashboard with sidebar navigation, key stats, and activity feeds.

### Deployment
Configured for Replit autoscale deployment with Vite for frontend builds and `tsx` for development. Environment variables are used for configuration (`DATABASE_URL`, `SENDGRID_API_KEY`, `NODE_ENV`). All email links and sitemap.xml use the `BASE_URL` environment variable for domain configuration.

## External Dependencies
-   **PostgreSQL Database**: Primary data persistence.
-   **SendGrid API**: Email delivery services.
-   **External Planning API**: Integration for workforce planning.
-   **Google Analytics**: User behavior tracking.
-   **Canvas Confetti**: Visual celebration effects.
-   **OpenAI**: AI content generation for the blog system.