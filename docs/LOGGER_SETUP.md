# 📝 Professional Logging Setup Guide

## ✅ What We've Installed

**Consola** - Production-ready universal logger for Node.js and Browser

- Auto-detects environment (dev/prod)
- Colored output in development
- Structured logging
- Log levels: trace, debug, info, warn, error
- Tagged loggers for different domains
- Zero configuration needed

---

## 📦 Setup Complete

### Client Logger: `client/src/lib/logger.ts`

```typescript
import { logger } from "@/lib/logger";

// Basic logging
logger.info("User logged in successfully");
logger.warn("API rate limit approaching");
logger.error("Payment processing failed", error);
logger.debug("Component state:", state); // Only in dev

// Tagged loggers for specific domains
import {
  apiLogger,
  authLogger,
  eventLogger,
  paymentLogger,
} from "@/lib/logger";

apiLogger.info("Fetching events from API");
authLogger.success("User authenticated");
paymentLogger.error("Stripe payment failed", error);
```

### Server Logger: `server/src/utils/logger.js`

```javascript
import { logger, emailLogger, dbLogger } from "../utils/logger.js";

// Basic logging
logger.info("Server started on port 4000");
logger.warn("Database connection slow");
logger.error("Email send failed", error);

// Tagged loggers
emailLogger.success("Verification email sent to", user.email);
dbLogger.error("MongoDB connection failed", error);
calendarLogger.info("Google Calendar event created");
```

---

## 🎯 Log Levels by Environment

### Development (auto-detected):

- ✅ trace - Detailed debugging
- ✅ debug - Debug information
- ✅ info - General information
- ✅ warn - Warnings
- ✅ error - Errors

### Production (auto-detected):

- ❌ trace - Disabled
- ❌ debug - Disabled
- ✅ info - Important information
- ✅ warn - Warnings
- ✅ error - Errors (with stack traces)

---

## 🔄 Migration Examples

### ❌ Before (console.log):

```typescript
console.log("User registered:", user);
console.error("Failed to fetch:", error);
```

### ✅ After (logger):

```typescript
logger.info("User registered:", user.email);
logger.error("Failed to fetch events:", error);
```

---

## 📋 Tagged Loggers Available

### Client:

- `apiLogger` - API requests/responses
- `authLogger` - Authentication/authorization
- `eventLogger` - Event-related operations
- `paymentLogger` - Payment processing

### Server:

- `apiLogger` - API endpoints
- `authLogger` - Auth operations
- `dbLogger` - Database operations
- `emailLogger` - Email sending
- `paymentLogger` - Payment processing
- `calendarLogger` - Google Calendar integration
- `eventLogger` - Event management

---

## ✅ Benefits

1. **Production Ready**: Automatically reduces verbosity in production
2. **Structured**: Easy to parse logs for monitoring tools
3. **Contextual**: Tagged loggers show which part of app logged
4. **Performance**: No performance impact in production
5. **Standards**: Industry-standard logging practices
6. **Debugging**: Rich debug info in development only

---

## 🚀 Quick Replace Pattern

Use VS Code Find & Replace (Ctrl+Shift+H):

**Find:** `console\.log\((.*?)\)`
**Replace:** `logger.info($1)`

**Find:** `console\.error\((.*?)\)`  
**Replace:** `logger.error($1)`

**Find:** `console\.warn\((.*?)\)`
**Replace:** `logger.warn($1)`

Then add at top of file:

```typescript
import { logger } from "@/lib/logger";
```

---

## 📊 Setup Complete

✅ `client/src/lib/logger.ts` - Client logger utility created
✅ `server/src/utils/logger.js` - Server logger utility created  
✅ ESLint config updated (console warnings disabled)
✅ Consola package installed and ready

### Example Files Updated:

- ✅ `client/src/components/BazaarList.tsx` (fully migrated)
- ✅ `server/src/features/calendar/calendar.service.js` (error logging)

**Ready to use**: Import and use logger in any file as needed
**Remaining**: ~50+ files with console.log can be migrated gradually
