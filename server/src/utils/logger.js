/**
 * Production-ready server logger using Consola
 * Automatically adjusts log levels based on NODE_ENV
 *
 * Usage: import { logger } from '../utils/logger.js'
 *
 * Available methods:
 * - logger.info() - General information
 * - logger.success() - Success messages
 * - logger.warn() - Warnings
 * - logger.error() - Errors (includes stack traces)
 * - logger.debug() - Debug info (only in development)
 * - logger.trace() - Trace info (only in development)
 *
 * Tagged loggers for specific domains:
 * - apiLogger, authLogger, dbLogger, emailLogger, paymentLogger
 */

import * as consolaImport from "consola";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const consolaDefault = consolaImport?.default;
const consolaInstance = consolaImport.consola ?? consolaDefault;
const createConsolaFn =
  consolaImport.createConsola ?? consolaDefault?.createConsola ?? null;

// Create logger instance with environment-specific configuration.
// In some Azure/Oryx installs, consola may be resolved as a CommonJS module
// where `createConsola` isn't exposed as a named export. In that case, fall
// back to the default consola instance so the server can still boot.
export const logger =
  (typeof createConsolaFn === "function"
    ? createConsolaFn({
        level: isDevelopment ? 5 : 3, // 5=trace in dev, 3=info in prod
        fancy: isDevelopment, // Colored output in development
        formatOptions: {
          colors: isDevelopment,
          compact: isProduction,
          date: true, // Always include timestamps on server
        },
      })
    : consolaInstance) ?? console;

if (!logger || typeof logger.info !== "function") {
  // Extremely defensive fallback
  // eslint-disable-next-line no-console
  console.warn("Logger initialization fell back to console");
}

if (typeof logger.withTag !== "function") {
  // Provide a minimal shim so existing code can keep calling withTag.
  logger.withTag = () => logger;
}

// If we're using the consola instance fallback, apply some of the same config.
if (logger?.options && typeof logger.options === "object") {
  logger.options.level = isDevelopment ? 5 : 3;
}

/*
// Previous code (kept for reference):
export const logger = createConsola({
  level: isDevelopment ? 5 : 3, // 5=trace in dev, 3=info in prod
  fancy: isDevelopment, // Colored output in development
  formatOptions: {
    colors: isDevelopment,
    compact: isProduction,
    date: true, // Always include timestamps on server
  },
});
*/

// In production, be more conservative with logging and sanitize output
if (isProduction) {
  logger.level = 3; // info, warn, error only

  // Override logger methods to sanitize sensitive data in production
  const originalError = logger.error.bind(logger);
  const originalWarn = logger.warn.bind(logger);
  const originalInfo = logger.info.bind(logger);

  // Sanitize function to remove sensitive data
  const sanitize = (arg) => {
    if (typeof arg === "object" && arg !== null) {
      // Don't log full objects in production - could contain passwords, tokens, etc.
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`; // Only log error name and message
      }
      return "[Object]";
    }
    return arg;
  };

  logger.error = (...args) => originalError(...args.map(sanitize));
  logger.warn = (...args) => originalWarn(...args.map(sanitize));
  logger.info = (...args) => originalInfo(...args.map(sanitize));
}

// Tagged loggers for different domains
export const apiLogger = logger.withTag("API");
export const authLogger = logger.withTag("AUTH");
export const dbLogger = logger.withTag("DB");
export const emailLogger = logger.withTag("EMAIL");
export const paymentLogger = logger.withTag("PAYMENT");
export const calendarLogger = logger.withTag("CALENDAR");
export const eventLogger = logger.withTag("EVENT");

// Export default
export default logger;
