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

### Secure Login & Authentication

User authentication system supporting multi-role access (Student, Vendor, Admin) with secure session management.

<img src="https://github.com/user-attachments/assets/ef1ba7fd-10ab-4469-9cd6-1405eeed070b" width="800" alt="Login Page" />

<br>

### Event Registration & Stripe Payment

Secure, integrated checkout experience supporting card payments and digital wallets.

<img src="https://github.com/user-attachments/assets/09256220-ef2e-4ca0-9b51-3172c8858be1" width="800" alt="Stripe Payment Modal" />
<br><br>
<img src="https://github.com/user-attachments/assets/effdb07f-5090-45fd-b5b7-3600f34e9fdc" width="800" alt="Payment Method Selection" />

<br>

### Interactive Platform Booth Booking

Visual map interface for vendors to select and book specific booth locations.

<img src="https://github.com/user-attachments/assets/dc728c6f-dc89-4974-935f-c4617926bd7c" width="800" alt="Platform Booth Booking Map" />

<br>

### Vendor Dashboard

Comprehensive analytics for vendors to track application status and performance.

<img src="https://github.com/user-attachments/assets/010e2071-1bbe-4ec4-acbb-5d32b2f55d3b" width="800" alt="Vendor Dashboard" />

<br>

### Custom 404 Page

User-friendly error handling to guide lost users back home.

<img src="https://github.com/user-attachments/assets/ac076c25-028d-41ba-99fc-cb7925968975" width="800" alt="404 Error Page" />

### Event Details & Agenda

Users can view comprehensive event information, including descriptions, locations, and detailed agendas before registering.

<img src="https://github.com/user-attachments/assets/83e071cc-a0a0-46e1-ad00-7c51ba001135" width="800" alt="Event Details View 1" />
<br><br>
<img src="https://github.com/user-attachments/assets/f43d3204-f0b2-4b42-abf2-942a12789c29" width="800" alt="Event Details View 2" />

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

### User Management & Authentication

- **Domain-Restricted Sign Up**: Mandatory GUC email (`@guc.edu.eg`) for Students, Staff, TAs, and Professors.
- **Role Verification Workflow**:
  - Students: Auto-verified via email link.
  - Staff/TAs/Professors: Request an account → **Admin manually verifies role** → Verification email sent.
- **Admin Management**: Root Admin can create and delete other Admin and Event Office accounts.
- **Account Status**: View active/blocked status; Admin can block users.

### Event Management

- **Conference Creation**: Events Office creates conferences with agendas, website links, and funding sources.
- **Workshop Workflow**:
  - Professors submit proposals (details, budget, funding source).
  - Events Office reviews: **Accept, Reject, or Request Edits**.
  - Professor tracks status and edits if necessary.
- **Trip Organization**: Events Office creates trips with itineraries, pricing, and capacity limits.
- **Bazaar Management**: Events Office sets schedules and location details for upcoming bazaars.
- **Advanced Search & Filtering**: Sort by date; Filter by type, category, location, and **Professor Name** (for workshops/conferences).
- **Event Archival**: Auto-archive past events; manual deletion allowed only if 0 registrants.
- **Access Control**: Restrict specific events to specific roles (e.g., "Students Only").

### Vendor & Application System

- **Application Workflows**:
  - **Bazaars**: Apply with booth size (2x2, 4x4) and team details.
  - **Platform Booths**: Apply with duration (1-4 weeks), location preference, and booth size.
- **Document Management**: Upload Tax Card, Company Logo, and **IDs of all attending team members**.
- **Payment Rules**:
  - Integrated Stripe payment.
  - **Strict Deadline**: Vendors must pay within **3 days** of acceptance or application is void.
- **Visitor Management**: Vendors receive QR codes for their registered staff/visitors.

### Sports, Gym & Facilities

- **Facility Booking (Students)**: View availability and reserve courts (Tennis, Football, Basketball).
- **Gym Session Management (Events Office)**:
  - **Create Sessions**: Define type (Yoga, Zumba, etc.), instructor, time, and capacity.
  - **Edit/Cancel**: Modify times or cancel sessions (triggers auto-notification to registrants).
- **Session Registration**: Users book spots in specific gym classes.

### Wallet & Payment System

- **Digital Wallet**: Store refunded credit for future use.
- **Payment Processing**: Credit/Debit card (Stripe) or Wallet balance.
- **Refund Policy**:
  - Users can cancel registration.
  - **Constraint**: Refund is only processed if cancelled **at least 2 weeks** before the event.

### Social, Feedback & Moderation

- **Ratings & Comments**: Users can rate and comment on attended events.
- **Moderation System**:
  - Admins can **delete inappropriate comments**.
  - **Auto-Warning**: System sends a warning email to the user whose comment was deleted.
- **Favorites**: Bookmark events for quick access.

### Loyalty Program

- **Vendor Partnership**: Vendors apply to become loyalty partners.
- **Offer Management**: Vendors submit discount rates, promo codes, and terms for approval.
- **Public Listing**: Users browse a list of all active loyalty partners and codes.

### Polling System

- **Booth Competitions**: Events Office creates polls for conflicting vendor slots.
- **Student Voting**: Students vote for their preferred vendor/booth.
- **Real-time Results**: Events Office views results to decide the winner.

### Notifications

- **In-App & Email**:
  - **Registration**: Confirmations and QR codes.
  - **Reminders**: Sent **1 day** and **1 hour** prior to event.
  - **Updates**: Alerts for gym cancellations, workshop approvals, or loyalty additions.
- **Warning System**: Alerts for policy violations (comments).

### Reporting & Analytics

- **Sales Reports**: Revenue analytics filtered by event type/date; sortable by revenue amount.
- **Attendance Reports**: Track participant numbers and remaining spots.
- **Data Export**: Events Office can export registrant names to **.xlsx (Excel)**.
- **Certificate Generation**: Automated certificates emailed upon workshop completion.

## Code Examples

### 1. Edit Bazaar Service Function

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

### 2. Update Trip Service Function

```javascript
// server/src/features/events/event.service.js
export const createTrip = async (tripData, createdBy) => {
  if (isNaN(tripData.price)) {
    throw new ApiError(400, "Price must be a valid number");
  }

  // Validate required fields
  if (!tripData.startTime) {
    throw new ApiError(400, "Start time is required");
  }

  if (!tripData.endTime) {
    throw new ApiError(400, "End time is required");
  }

  // Extract date and time fields
  const startDateTime = new Date(tripData.startDate);
  const endDateTime = new Date(tripData.endDate);

  // Validate date format
  if (isNaN(startDateTime.getTime())) {
    throw new ApiError(400, "Invalid start date format");
  }

  if (isNaN(endDateTime.getTime())) {
    throw new ApiError(400, "Invalid end date format");
  }

  // Ensure end date is after start date
  if (endDateTime <= startDateTime) {
    throw new ApiError(400, "End date must be after start date");
  }

  const newTrip = await Event.create({
    ...tripData,
    eventType: "trip",
    createdBy,
    restrictedRoles: tripData.restrictedRoles || [],
  });

  // Send notification about new trip
  try {
    await NotificationService.notifyNewEvent(newTrip, "trip");
  } catch (error) {
    console.error("Error sending trip notification:", error);
    // Don't fail the request if notification fails
  }

  return newTrip;
};
```

### 3. Edit Workshop Service Function

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

### 4. Create Workshop Service Function

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

### 5. Get Upcoming Events Service Function

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

   Create a `.env` file in the server directory:

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

   Create a `.env` file in the client directory:

   ```env
   # Backend Connection
   VITE_API_BASE_URL=http://localhost:4000
   VITE_WS_BASE_URL=ws://localhost:4000

   # Stripe Payment
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxx
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
  "studentStaffId": "20270001",
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

#### GET `/api/events/search?professor=68f6a06399af7c0983e76535`

Retrieve filtered list of events

- Query params: `eventType`, `professor`, `startDate`, `endDate`, `location`, `name`

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

#### POST `/api/transactions/pay/:eventId`

Pay for a workshop or a trip

```json
{
  "paymentMethod": "credit_card"
}
```

#### GET `/api/transactions/me`

Get all transactions for authenticated user

### Facility Routes

#### GET `/api/facilities/courts`

Get all available court bookings

#### PATCH `/api/facilities/gym/sessions/:id/cancel`

Cancel a gym session

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

## 🤝 How to Contribute

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or suggesting enhancements, your help is appreciated.

### Quick Start

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Commit with clear messages (`git commit -m 'feat: add amazing feature'`)
5. Push to your branch (`git push origin feat/amazing-feature`)
6. Open a Pull Request

### Areas We Need Help With

- Real-time notifications implementation
- Mobile app development
- Automated testing
- Accessibility improvements
- Multi-language support
- Performance optimizations

For detailed guidelines on contributing, including code style, issue creation, and the review process, please see our [**Contributing Guide**](CONTRIBUTING.md).

## 🙏 Credits & Resources

### Documentation References

- [MongoDB Docs](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe Documentation](https://stripe.com/docs/payments/accept-a-payment)
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
