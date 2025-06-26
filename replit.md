# EXTRAATJE - Test Environment

## Overview

This is the EXTRAATJE test environment - a complete copy of the EXTRA Rewards platform for safe testing and development. This environment allows testing changes without affecting the main production system. All functionality is identical to the main system including the challenges with progress bars, leaderboard, and reward systems.

## System Architecture

### Tech Stack
- **Frontend**: React with TypeScript, Vite build system
- **UI Components**: Radix UI with shadcn/ui design system, Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express-session with connect-pg-simple
- **Email Service**: SendGrid (with mock mode for development)
- **Real-time**: WebSocket for live notifications
- **Deployment**: Configured for Replit autoscale

### Architecture Pattern
The application follows a monorepo structure with clear separation between client, server, and shared components:
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Common TypeScript schemas and types

## Key Components

### Database Schema (Drizzle)
- **Users**: Employee management with roles (admin/employee), TWV tracking, points system
- **Rewards**: Physical rewards that can be redeemed with points
- **Discounts**: Percentage-based discounts from partners
- **Point Transactions**: Complete audit trail of all point movements
- **Redemptions**: Tracking of reward claims and fulfillment
- **Rules**: Configurable point-earning rules
- **Email Templates & Campaigns**: Marketing automation system
- **Shift Planning**: Complete workforce planning with clients, locations, shifts, and assignments

### Authentication & Authorization
- Session-based authentication using express-session
- Role-based access control (admin/employee)
- WebSocket authentication for real-time features
- Cookie-based session persistence

### Points System
- Configurable point-earning rules (fixed, multiplication, custom)
- Automatic birthday bonuses (100 points default)
- Point-to-Euro conversion (20 points = €1)
- Transaction history and audit trails

### TWV (Work Permit) Management
- Comprehensive tracking of work permit statuses
- Automated status updates and notifications
- Integration with external planning systems via API IDs

### Marketing & Communications
- Email template system with variable substitution
- Campaign management with scheduling
- Automation triggers (birthday, new account, point thresholds)
- SendGrid integration with fallback mock service

## Data Flow

### User Journey
1. **Registration/Login**: Session-based authentication with role assignment
2. **Points Earning**: Automated point allocation based on configurable rules
3. **Rewards**: Browse and redeem physical rewards or discounts
4. **Planning**: View and accept shift assignments (if applicable)
5. **Tracking**: Complete history of points, redemptions, and activities

### Admin Workflow
1. **User Management**: Create/update employees, manage TWV status
2. **Reward Configuration**: Add/edit rewards and discount partnerships
3. **Rule Management**: Configure point-earning rules and thresholds
4. **Analytics**: View comprehensive statistics and reports
5. **Marketing**: Create campaigns and automated communications

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage
- **SendGrid API**: Email delivery (optional, falls back to mock)
- **External Planning API**: Integration via user.apiId field

### Optional Integrations
- **Google Analytics**: A/B testing and user behavior tracking
- **Canvas Confetti**: Celebration animations for milestones

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Session persistence across server restarts
- Mock services for external dependencies

### Production
- Static asset building with Vite
- ESM bundle compilation with esbuild
- PostgreSQL connection via DATABASE_URL
- Autoscale deployment on Replit

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SENDGRID_API_KEY`: Email service API key (optional)
- `NODE_ENV`: Environment mode (development/production)

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **June 26, 2025**: Simplified system to focus purely on rewards functionality
  - Removed all planning system integration and TWV management features
  - Cleaned up navigation to show only reward-related sections
  - Added "Challenges" and "Kortingsacties" tabs to admin dashboard with full CRUD functionality
  - System now purely focused on employee rewards, challenges, discounts, and leaderboard
  - Removed unnecessary complexity for streamlined reward system experience

- **June 26, 2025**: Created EXTRAATJE test environment as complete system copy
  - Independent testing environment created from main EXTRA system
  - All functionality preserved: rewards, leaderboard, challenges with progress bars
  - Safe environment for testing changes without affecting main system
  - Port configuration may need adjustment to avoid conflicts

- **June 26, 2025**: Created complete system backup for testing purposes
  - Full backup created at `/home/runner/extra-rewards-backup/`
  - Compressed backup: `extra-rewards-backup-YYYYMMDD_HHMM.tar.gz`
  - Backup includes all functionality: rewards, leaderboard, challenges with progress bars
  - Complete restore instructions provided in `RESTORE_INSTRUCTIONS.md`
  - System ready for deployment with backup safety net for testing

- **June 25, 2025**: Enhanced Challenges system with progressive steps and visual progress tracking
  - Implemented fourth tab "Challenges" in employee dashboard with mobile-optimized layout
  - Created complete database schema for challenges, steps, and user progress tracking
  - Built admin panel for creating/managing challenges with step-by-step progression
  - Added 4 default challenge categories with specific progressive targets:
    - "Diensten draaien": Steps at 10, 25, 50, 100 services (250-1500 points)
    - "Last-minute inzet": Steps at 5, 10, 20 shifts (300-1200 points)
    - "Vrienden aandragen": Steps at 3, 5, 10 referrals (400-1000 points)
    - "Deel een story": Steps at 1, 5, 10 stories (150-600 points)
  - Added visual progress bars showing completion percentage for each challenge step
  - Challenges now display specific numbered targets (e.g. "Draai 10 diensten") instead of generic descriptions
  - Each step shows points reward and current progress (e.g. "7/10")
  - Challenge progress persists indefinitely (unlike monthly leaderboard resets)
  - Real-time progress tracking with visual progress bars and completion animations

- **June 24, 2025**: Implemented realtime leaderboard functionality
  - Added monthly points tracking system with database schema
  - Created leaderboard API endpoints (/api/leaderboard, /api/leaderboard/previous-winner)
  - Built mobile-optimized leaderboard component with realtime WebSocket updates
  - Integrated leaderboard as third tab in employee dashboard ("Ranglijst")
  - Added automatic monthly points tracking for all earned point transactions
  - Displays top 10 employees with rankings, previous month winner, and live updates

## Changelog

- June 24, 2025. Initial setup and leaderboard implementation