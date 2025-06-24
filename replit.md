# EXTRA Rewards System

## Overview

This is a comprehensive employee rewards platform called "EXTRA" that combines a points-based reward system with shift planning functionality. The application targets the hospitality industry in Amsterdam, providing flexible work opportunities with immediate rewards after shifts.

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

## Changelog

Changelog:
- June 24, 2025. Initial setup