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
-   **Marketing Automation (Prospect Campaigns)**: Features a visual flow builder, A/B testing, performance dashboards, scheduled sending, and integrations for contact import (Apollo.io CSV, vCard). It also includes smart flow management for auto-stopping campaigns and advanced segmentation.
-   **WhatsApp Integration**: Provides a team inbox with conversation management, assignment, labeling, internal notes, and bulk messaging capabilities. It includes AI-powered reply suggestions, auto-reply functionality, media sending, and contact linking for unknown senders. **Fase 1 Contacten + STOP-detectie**: dedicated Contacten-pagina (sollicitanten/kandidaten/medewerkers), per-contact opt-in status (`actief`/`opt_out`/`verzending_faalt`), automatische STOP-keyword detectie in inkomende berichten en automatische opt-out bij Meta "user blocked"-errors. Berichten zelf bevatten geen unsubscribe-tekst.
-   **SEO Blog System**: Database-backed CMS with content management, scheduling, SEO fields, sitemap generation, and AI content generation.
-   **KPI & Reporting**: Admin dashboard for analytics, conversion funnels, trends, source distribution, and CSV export.
-   **Brochure Pages**: Slide-based presentation pages for various purposes (general, English, events, specific clients) with fullscreen design, animation, and navigation.

### UI/UX
-   Modern, mobile-optimized UI utilizing shadcn/ui.
-   Visual progress bars and celebration animations.
-   Redesigned Admin Dashboard with sidebar navigation, key statistics, and activity feeds.

### Deployment
Configured for Replit autoscale deployment, using Vite for frontend builds and `tsx` for development. Environment variables manage configuration.

## External Dependencies
-   **PostgreSQL Database**: Primary data persistence.
-   **SendGrid API**: Email delivery services and webhook processing.
-   **360dialog Cloud API**: WhatsApp Business messaging.
-   **External Planning API**: Integration for workforce planning.
-   **Google Analytics**: User behavior tracking.
-   **Canvas Confetti**: Visual celebration effects.
-   **OpenAI**: AI content generation for the blog system and WhatsApp reply suggestions.