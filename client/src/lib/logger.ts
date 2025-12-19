/**
 * Production-ready logger using Consola
 * Automatically adjusts log levels based on environment
 * Usage: import { logger } from '@/lib/logger'
 *
 * Available methods:
 * - logger.info() - General information
 * - logger.success() - Success messages
 * - logger.warn() - Warnings
 * - logger.error() - Errors
 * - logger.debug() - Debug info (only in development)
 * - logger.trace() - Trace info (only in development)
 */

import { createConsola } from "consola";

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Create logger instance with environment-specific configuration
export const logger = createConsola({
  level: isDevelopment ? 5 : 3, // 5=trace in dev, 3=info in prod
  formatOptions: {
    colors: isDevelopment,
    compact: isProduction,
    date: isProduction,
  },
});

// In production, reduce verbosity and sanitize output
if (isProduction) {
  // Only show warnings and errors in production
  logger.level = 2; // 0=silent, 1=error, 2=warn, 3=info, 4=debug, 5=trace

  // Override logger methods to sanitize sensitive data in production
  const originalError = logger.error.bind(logger) as any;
  const originalWarn = logger.warn.bind(logger) as any;

  (logger as any).error = (...args: any[]) => {
    const sanitized = args.map((arg) =>
      typeof arg === "object" && arg !== null ? "[Object]" : arg
    );
    originalError.apply(originalError, sanitized as any);
  };

  (logger as any).warn = (...args: any[]) => {
    const sanitized = args.map((arg) =>
      typeof arg === "object" && arg !== null ? "[Object]" : arg
    );
    originalWarn.apply(originalWarn, sanitized as any);
  };
}

// Add context methods for common use cases
export const apiLogger = logger.withTag("api");
export const authLogger = logger.withTag("auth");
export const eventLogger = logger.withTag("events");
export const paymentLogger = logger.withTag("payments");

// Export for backward compatibility (if needed)
export default logger;
