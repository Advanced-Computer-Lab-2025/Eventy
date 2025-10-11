# University Event Management System

## Overview

UniEvents is a comprehensive university event management platform that enables students, staff, professors, and vendors to discover, create, and manage campus events. The system supports multiple event types including workshops, trips, bazaars, conferences, and sports activities. It features role-based access control, payment processing, event registration, vendor management, and administrative oversight.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query for server state management and caching
- Tailwind CSS with custom design system based on shadcn/ui components

**Design System:**
- Custom theming inspired by Luma, Notion, and Partiful aesthetics
- Light/dark mode support with HSL-based color system
- Plus Jakarta Sans as the primary font family
- Category-specific color coding (academic=blue, social=pink, sports=orange, cultural=purple, career=green)
- Responsive design with mobile-first approach

**Component Architecture:**
- Reusable UI components from shadcn/ui (buttons, cards, dialogs, forms)
- Custom event components (EventCard, EventHero, EventListItem) for consistent event display
- Centralized theme management via ThemeProvider context
- Form handling with react-hook-form and Zod validation

**Routing Strategy:**
- Public routes: Home, SignUp, Login
- Protected routes: Dashboard, CreateWorkshop, CreateTrip, CreateBazaar, MyEvents
- Admin routes: AdminUsers, WorkshopApprovals, VendorRequests
- Vendor routes: VendorDashboard
- Sports routes: SportsFacilities

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Drizzle ORM for database operations
- PostgreSQL database (configured via Neon serverless)
- Session-based authentication architecture (connect-pg-simple for session storage)

**API Design:**
- RESTful API with `/api` prefix for all endpoints
- Centralized error handling middleware
- Request/response logging for debugging
- Storage abstraction layer (IStorage interface) for CRUD operations

**Data Storage Strategy:**
- PostgreSQL as primary database
- Drizzle ORM for type-safe database queries
- Migration system via drizzle-kit
- Current implementation uses in-memory storage (MemStorage) as placeholder

**Authentication & Authorization:**
- Role-based access control (student, staff, ta, professor, admin, event_office, vendor)
- Email verification workflow for new users
- Admin approval required for staff/TA/professor accounts
- GUC email requirement for university members
- User status management (active, blocked, pending)

### Data Models

**User Entity:**
- Core fields: id, email, password, firstName, lastName, role, status, verified
- Student/Staff ID for university members
- Company name for vendors
- Tax card and logo uploads for vendor verification

**Event Entity:**
- Common fields: id, title, category, date, time, location, description, image
- Type-specific fields (workshop, trip, bazaar, conference)
- Capacity and registration deadline tracking
- Price and payment integration
- Attendee count and favorites system

**Event Categories:**
- Academic: Workshops, lectures, seminars
- Social: Festivals, gatherings
- Sports: Championships, gym sessions, court reservations
- Cultural: Cultural events and performances
- Career: Career fairs, networking events

### Key Features Architecture

**Event Management:**
- Event creation with role-specific permissions (professors create workshops, event office creates trips/bazaars)
- Workshop approval workflow (professor submits → event office reviews → publish/reject/request edits)
- Event editing with status-based restrictions
- Search, filter, and sort functionality
- Favorites and registration lists per user

**Payment Processing:**
- Stripe integration for credit/debit card payments (planned)
- Digital wallet system for refunds
- Payment receipt generation via email
- Cancellation policy (2-week advance notice for refunds)

**Vendor Management:**
- Vendor signup with company verification
- Bazaar participation applications
- Booth size and attendee count specification
- Admin approval/rejection workflow
- Document upload for verification

**Sports Facilities:**
- Court reservation system (basketball, tennis, football)
- Gym session registration (yoga, pilates, zumba, crossfit, kickboxing)
- Capacity management and enrollment tracking

**Rating & Comments:**
- Post-event rating system
- Comment functionality for attendees
- Admin moderation with inappropriate content deletion
- Warning system for users whose comments are deleted

**Notification System:**
- Email notifications for:
  - Verification after registration
  - Payment receipts
  - Event certificates
  - Workshop approval status
  - Comment deletion warnings
  - Vendor application status
- In-system notifications for real-time updates

## External Dependencies

**UI Component Library:**
- Radix UI primitives for accessible, unstyled components (dialogs, dropdowns, popovers, etc.)
- shadcn/ui component system built on Radix UI
- Lucide React for iconography

**Data Management:**
- TanStack Query (React Query) for server state caching and synchronization
- Drizzle ORM for database schema and queries
- Zod for runtime validation and schema generation

**Database:**
- PostgreSQL via Neon serverless (@neondatabase/serverless)
- Drizzle Kit for migrations
- connect-pg-simple for PostgreSQL session storage

**Payment Processing:**
- Stripe (referenced in requirements, integration pending)

**Development Tools:**
- Vite with HMR for fast development
- TypeScript for type safety across frontend and backend
- ESBuild for production builds
- Replit-specific plugins for development environment

**Email Service:**
- Email delivery system (implementation pending) for:
  - Verification emails
  - Payment receipts
  - Certificates
  - Notifications

**Authentication:**
- Session-based authentication with Express sessions
- Password hashing (implementation needed)
- Email verification tokens

**Styling:**
- Tailwind CSS for utility-first styling
- PostCSS for CSS processing
- Custom CSS variables for theming