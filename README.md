# Eventy - Campus Events Management System

## Project Overview

**Eventy** is a comprehensive web-based platform designed to streamline event management for the GUC campus. The system enables students, professors, staff, and administrators to create, manage, and participate in various campus events including conferences, workshops, trips, bazaars, and sports facilities bookings.

## Motivation

Managing campus events traditionally involves scattered communication, manual registrations, and limited visibility into available activities. Eventy addresses these challenges by providing:

- **Centralized Event Management**: A single platform for all campus events and activities
- **Role-Based Access Control**: Different interfaces and permissions for students, professors, staff, and administrators
- **Automated Workflows**: Streamlined approval processes, notifications, and payment handling
- **Enhanced Engagement**: Features like favorites, feedback, loyalty programs, and event ratings
- **Data-Driven Insights**: Comprehensive reports and analytics for event organizers

The platform was built to modernize campus event management, reduce administrative overhead, and improve student engagement with campus activities.

## Build Status

### Current Issues & Limitations

1. **Testing Coverage**: Limited automated tests - currently relies mainly on manual Postman testing
2. **Email Service**: Email verification may experience delays depending on the email service provider's rate limits
3. **File Upload Size**: Large document uploads (>5MB) may timeout on slower connections
4. **Mobile Responsiveness**: Some admin dashboard components need optimization for smaller screens
5. **Date Timezone Handling**: Timezone conversions may cause inconsistencies for events spanning different time zones
6. **QR Code Generation**: QR codes for event attendance are generated but scanning functionality needs enhancement
7. **Real-time Notifications**: Push notifications are not implemented; users must check the notifications panel manually
8. **Payment Integration**: Stripe integration is in sandbox mode and requires production configuration
9. **Search Performance**: Full-text search may slow down with large event datasets (>1000 events)
10. **Certificate Generation**: Automated certificate generation works but PDF customization is limited

## Code Style

### Naming Conventions

- **camelCase**: Used for variables, functions, and methods
  ```javascript
  const eventController = new EventsController();
  const userService = new UserService();
  ```
- **PascalCase**: Used for React components, classes, and TypeScript types
  ```typescript
  export class EventsController {}
  export default function SalesReport() {}
  ```
- **UPPER_SNAKE_CASE**: Used for environment variables and constants
  ```javascript
  const API_BASE_URL = process.env.API_BASE_URL;
  const JWT_SECRET = process.env.JWT_SECRET;
  ```
- **kebab-case**: Used for file names and routes
  ```
  event.controller.js, auth.middleware.js
  /api/events/workshops, /api/loyalty-partners
  ```

### Code Organization

- **Feature-based structure**: Code organized by features (auth, events, users, etc.)
- **Separation of concerns**: Controllers, services, routes, and models are separated
- **Validation layers**: Joi schemas for input validation
- **Error handling**: Centralized error middleware with ApiError utility class

### Formatting

- **ESLint**: Enforced code quality rules
- **Prettier**: Automated code formatting for consistent style
- **Husky**: Pre-commit hooks ensure code is linted and formatted before commits

## Screenshots

### 1. Login & Authentication

![Login Page](https://via.placeholder.com/800x450?text=Login+Page)
_User authentication with email verification support_

### 2. Student Dashboard

![Student Dashboard](https://via.placeholder.com/800x450?text=Student+Dashboard)
_Browse and register for events, view favorites, check notifications_

### 3. Events Office Dashboard

![Events Office Dashboard](https://via.placeholder.com/800x450?text=Events+Office+Dashboard)
_Manage all events, approve workshops, review vendor applications_

### 4. Event Creation Form

![Event Creation](https://via.placeholder.com/800x450?text=Event+Creation+Form)
_Create conferences, trips, bazaars with detailed information_

### 5. Sales Report

![Sales Report](https://via.placeholder.com/800x450?text=Sales+Report+Dashboard)
_Comprehensive analytics with filtering and export capabilities_

### 6. Workshop Management

![Workshop Management](https://via.placeholder.com/800x450?text=Workshop+Management)
_Professors can create and manage workshops, track participants_

## Tech Stack & Frameworks

### Frontend

- **React 18** with **TypeScript** - Component-based UI development
- **Vite** - Fast build tool and development server
- **Wouter** - Lightweight routing library
- **TanStack Query (React Query)** - Data fetching and caching
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **XLSX** - Excel file generation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend

- **Node.js** with **Express.js** - REST API server
- **MongoDB** with **Mongoose** - NoSQL database and ODM
- **JWT (jsonwebtoken)** - Authentication and authorization
- **Joi** - Server-side validation
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **QRCode** - QR code generation for event attendance
- **PDFKit** - PDF generation for certificates
- **ExcelJS** - Excel report generation
- **Stripe** - Payment processing
- **Nodemailer** - Email service
- **Node-cron** - Scheduled tasks
- **Firebase Admin SDK** - Additional services integration

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Nodemon** - Development auto-reload
- **TypeScript** - Type safety
- **Drizzle ORM** - Type-safe database queries (PostgreSQL)

## Features

### User Management

- **Multi-role Authentication**: Support for Students, Professors, Staff, TAs, Events Office, Vendors, and Admins
- **Email Verification**: Secure account activation via email links
- **Wallet System**: Digital wallet for event payments and loyalty rewards
- **Favorites**: Bookmark favorite events for quick access

### Event Management

- **Conference Creation**: Events Office can create and manage conferences
- **Workshop System**: Professors create workshops; Events Office approves them
- **Trip Organization**: Create trips with itineraries, pricing, and capacity limits
- **Bazaar Management**: Organize bazaars with vendor booth applications
- **Event Filtering & Search**: Filter by type, date, category, location and participating professors(if any)
- **Event Registration**: Students can register and pay for events
- **QR Code Attendance**: Generate QR codes for event check-ins
- **Event Archival**: Archiving of past events by Events Office

### Vendor & Application System

- **Vendor Applications**: Apply for bazaar booths or platform booth spaces
- **Application Approval Workflow**: Events Office reviews and approves applications
- **Document Upload**: Vendors upload required documentation
- **Payment Processing**: Integrated Stripe payment for applications

### Sports & Facilities

- **Facility Booking**: Browse and book sports facilities (gym, courts, etc.)
- **Gym Schedule Viewer**: View available time slots and sessions

### Feedback & Ratings

- **Event Feedback**: Attendees can view and provide feedback after events
- **Rating System**: Rate events and workshops

### Loyalty & Rewards

- **Loyalty Program**: Partner businesses offer discounts & promotion codes to students

### Notifications

- **In-App Notifications**: Real-time updates for applications, events, approvals
- **Email Notifications**: Event confirmations, reminders, and updates
- **Notification Center**: View all notifications in one place

### Reporting & Analytics

- **Sales Reports**: Revenue analytics with filtering and export
- **Attendee Reports**: Track event attendance and participation
- **Export to Excel/CSV**: Download reports in multiple formats
- **Certificate Generation**: Automated certificates for workshop completion

### Polling System

- **Create Polls**: Events Office creates polls for booth competitions
- **Vote on Booths**: Students vote for their favorite platform booths
- **Poll Results**: Events Office can view real-time poll results and winners

### Access Control

- **Role-Based Permissions**: Different capabilities based on user roles
- **Event Access Restriction**: Limit events to specific roles (students only, staff only, etc.)
- **Admin Controls**: Block/unblock users, manage system settings

## Code Examples

### 1. Edit Bazaar Service

```javascript
// server/src/features/events/event.service.js
export async function editBazaar(id, updates) {
  const bazaar = await Event.findById(id);
  if (!bazaar) throw new ApiError(404, "Bazaar not found");

  if (bazaar.eventType !== "bazaar")
    throw new ApiError(400, "This event is not a bazaar");

  // Check if the bazaar has already started
  const now = new Date();
  if (new Date(bazaar.startDate) <= now)
    throw new ApiError(400, "Cannot edit a bazaar that has already started");

  // Build update object with only allowed fields
  const allowedUpdates = {};
  if (updates.name !== undefined) allowedUpdates.name = updates.name;
  if (updates.description !== undefined)
    allowedUpdates.description = updates.description;
  if (updates.location !== undefined)
    allowedUpdates.location = updates.location;
  if (updates.startDate !== undefined)
    allowedUpdates.startDate = updates.startDate;
  if (updates.endDate !== undefined) allowedUpdates.endDate = updates.endDate;

  const updatedBazaar = await Event.findByIdAndUpdate(id, allowedUpdates, {
    new: true,
    runValidators: true,
  });

  return updatedBazaar;
}
```

### 2. Update Trip Service

```javascript
// server/src/features/events/event.service.js
export const updateTripService = async (tripId, updateData, user) => {
  // 1. Fetch trip
  const trip = await Event.findById(tripId);
  if (!trip || trip.eventType !== "trip") {
    throw new ApiError(404, "Trip not found");
  }

  // 2. Prevent editing if start date passed
  const now = new Date();
  if (trip.startDate <= now) {
    throw new ApiError(403, "Cannot edit a trip that has already started");
  }

  // 3. Apply updates dynamically
  Object.keys(updateData).forEach((key) => {
    trip[key] = updateData[key];
  });

  // 4. Validate before saving
  await trip.validate();

  // 5. Save updated trip
  const savedTrip = await trip.save();
  return savedTrip;
};
```

### 3. Edit Workshop Service

```javascript
// server/src/features/events/event.service.js
export async function editWorkshop(workshopId, updateData, user) {
  const workshop = await Event.findById(workshopId);
  if (!workshop) {
    throw new ApiError(404, "Workshop not found");
  }

  if (workshop.eventType !== "workshop") {
    throw new ApiError(400, "This event is not a workshop");
  }

  const userId = user._id || user.id;
  if (workshop.createdBy.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You can only edit your own workshops");
  }

  if (workshop.status !== "pending" && workshop.status !== "needs_revision") {
    throw new ApiError(
      403,
      "Forbidden: Workshop can only be edited if its status is 'pending' or 'needs_revision'"
    );
  }

  // Check if workshop has already started
  const now = new Date();
  const workshopStartDateTime = new Date(workshop.startDate);

  if (workshopStartDateTime <= now) {
    throw new ApiError(
      403,
      "Forbidden: Cannot edit workshop that has already started"
    );
  }

  Object.assign(workshop, updateData);
  workshop.status = "pending";
  await workshop.save();

  return workshop;
}
```

### 4. Create Workshop Service

```javascript
// server/src/features/events/event.service.js
export const createWorkshop = async (workshopData, professorId) => {
  const workshop = await Event.create({
    ...workshopData,
    eventType: "workshop",
    createdBy: professorId,
    status: "pending",
    restrictedRoles: workshopData.restrictedRoles || [],
  });

  // Send notification about new workshop
  try {
    await NotificationService.notifyNewEvent(workshop, "workshop");
  } catch (error) {
    console.error("Error sending workshop notification:", error);
    // Don't fail the request if notification fails
  }

  return workshop;
};
```

### 5. Get Upcoming Events Service

```javascript
// server/src/features/events/event.service.js
export const getUpcomingEventsService = async (
  includeVendors = false,
  userRole = null
) => {
  // Use start of today for comparison
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filter = {
    status: "approved",
    deletedAt: null,
    startDate: { $gte: now },
  };

  // Filter out events where the user's role is restricted
  if (userRole && userRole !== "admin" && userRole !== "events_office") {
    filter.restrictedRoles = { $ne: userRole };
  }

  const events = await Event.find(filter)
    .populate("professors", "firstName lastName email")
    .populate("createdBy", "name email companyName")
    .lean();

  return events;
};
```

## Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/Advanced-Computer-Lab-2025/Eventy.git
   cd Eventy
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server
   npm install
   cd ..
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # JWT
   JWT_SECRET=your_jwt_secret_key

   # Email Service
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # Server
   PORT=4000
   NODE_ENV=development

   # Frontend URL
   CLIENT_URL=http://localhost:5000
   ```

4. **Run the application**

   ```bash
   # Run separately:
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:4000

## API References

### Authentication Routes

#### POST `/api/auth/signup`

Register a new user account

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@guc.edu.eg",
  "password": "SecurePass123",
  "role": "student"
}
```

#### POST `/api/auth/login`

Authenticate and receive JWT token

```json
{
  "email": "john.doe@guc.edu.eg",
  "password": "SecurePass123"
}
```

### Event Routes

#### GET `/api/events?eventType=workshop&status=approved`

Retrieve filtered list of events

- Query params: `eventType`, `status`, `startDate`, `endDate`, `page`, `limit`

#### POST `/api/events/workshops`

Create a new workshop (Professor only)

```json
{
  "name": "Advanced Machine Learning Concepts",
  "location": "GUC Cairo",
  "startDate": "2025-11-10T09:00:00.000Z",
  "endDate": "2025-11-12T17:00:00.000Z",
  "description": "A deep dive into advanced topics in machine learning, including transformers, reinforcement learning, and generative models.",
  "agenda": "Day 1: Attention Mechanisms & Transformers.\nDay 2: Deep Reinforcement Learning.\nDay 3: Generative Adversarial Networks (GANs).",
  "faculty": "IET",
  "professors": ["6331a7e58832a0977626a3e1", "6331a7e58832a0977626a3e2"],
  "requiredBudget": 7500,
  "fundingSource": "guc",
  "extraResources": "Access to high-performance computing cluster and specific Python libraries pre-installed.",
  "capacity": 40,
  "registrationDeadline": "2025-11-01T23:59:59.000Z"
}
```

#### PATCH `/api/events/:id/accept`

Approve a workshop (Events Office only)

### User Routes

#### GET `/api/users/pending`

Get all pending user accounts awaiting role assignment (Admin only)

#### PATCH `/api/users/:id/assign-role`

Assign role to a pending user

```json
{
  "role": "student"
}
```

### Transaction Routes

#### POST `/api/transactions/top-up`

Add funds to user wallet

```json
{
  "amount": 50.0,
  "paymentMethodId": "pm_1234567890"
}
```

#### GET `/api/transactions/wallet-balance`

Get current wallet balance for authenticated user

### Facility Routes

#### GET `/api/facilities/courts`

Get all available court bookings

#### POST `/api/facilities/sessions`

Create a gym session

```json
{
  "facilityId": "facility123",
  "startTime": "2025-01-20T09:00:00Z",
  "endTime": "2025-01-20T10:00:00Z",
  "capacity": 20
}
```

## Tests

### Postman Testing

We use Postman for API endpoint testing. Below are test cases for the code examples:

#### 1. Edit Bazaar Test

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/dbf4ddd5-75c8-4020-9aa1-4a0695f27b81" />


#### 2. Update Trip Test

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/438250e5-632b-454a-b2a6-43818865dd1c" />

#### 3. Edit Workshop Test

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/61ca6393-2292-4b8c-acd5-9049dbbf6d95" />


#### 4. Create Workshop Test

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/5ea13be0-03bc-47be-b245-62dd6cf57e55" />


#### 5. Get Upcoming Events Test

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/2009f3c6-16e6-4ae3-bd7d-a603ac4e0648" />


### Validation Testing

```javascript
// test_validation.js - Testing Joi validation schemas
import {
  validateBazaarApplication,
  validateBoothApplication,
} from "./server/src/features/applications/application.validation.js";

const bazaarResult = validateBazaarApplication.validate(bazaarData);
console.log("Bazaar validation:", bazaarResult.error ? "Failed" : "Passed");
```

## How to Contribute

We welcome contributions from the community! Here are areas where you can help:

### High Priority Improvements

1. **Implement Real-time Notifications**: Use WebSockets or Server-Sent Events for live updates
2. **Mobile App Development**: Create React Native or Flutter mobile applications
3. **Advanced Search**: Implement Elasticsearch for better search performance
4. **Automated Testing**: Add Jest unit tests and integration tests
5. **Accessibility**: Improve ARIA labels and keyboard navigation

### Medium Priority

6. **Multi-language Support**: Add i18n for Arabic and other languages
7. **Dark Mode Enhancement**: Complete dark mode theming across all components
8. **Analytics Dashboard**: More detailed charts and metrics using Chart.js or Recharts
9. **Calendar Integration**: Export events to Google Calendar, Outlook, etc.
10. **Advanced Filters**: Add more granular filtering options

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Follow the existing code style and naming conventions
4. Write clear commit messages
5. Add tests for new features (when possible)
6. Update documentation as needed
7. Submit a pull request with a detailed description

### Code Review Process

- All PRs must pass ESLint and Prettier checks
- At least one approval from a maintainer is required
- CI/CD checks must pass before merging
- Address all review comments before merging

## Credits & Resources

### Documentation References

- [MongoDB Docs](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- **Stripe Integration**: [Stripe Official Documentation](https://stripe.com/docs/payments/accept-a-payment)
- [Radix UI](https://www.radix-ui.com/)

### External Libraries & Tools

- [date-fns](https://date-fns.org/) - Date manipulation
- [Joi](https://joi.dev/) - Data validation
- [QRCode.js](https://github.com/soldair/node-qrcode) - QR code generation
- [PDFKit](https://pdfkit.org/) - PDF generation
- [ExcelJS](https://github.com/exceljs/exceljs) - Excel file manipulation

### Team Acknowledgments

Special thanks to all contributors and the Advanced Computer Lab 2025 team for their dedication and hard work on this project.

## License

This project is licensed under the **Apache License 2.0**. See the [LICENSE.md](LICENSE.md) file for full details.

### Third-Party Licenses

#### Stripe - Apache 2.0 License

This application uses Stripe for payment processing. Stripe's API libraries are licensed under the Apache 2.0 License.

#### Other Dependencies

- **React** - MIT License
- **Express.js** - MIT License
- **MongoDB Node Driver** - Apache 2.0 License
- **Radix UI** - MIT License
- **Tailwind CSS** - MIT License

For a complete list of dependencies and their licenses, see `package.json` and `server/package.json`.

---

**Eventy** © 2025 - Advanced Computer Lab Project
