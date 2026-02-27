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
-   **Candidate Management**: Comprehensive pre-onboarding system for candidates, including skills assessment, availability, and GDPR compliance features.

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