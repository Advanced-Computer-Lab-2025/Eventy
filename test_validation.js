// Quick test to verify validation schemas work correctly
import {
  validateBazaarApplication,
  validateBoothApplication,
} from "./server/src/features/applications/application.validation.js";

import { logger } from "./server/src/utils/logger.js";

logger.info("Testing validation schemas...");

// Test bazaar validation
const bazaarData = {
  attendees: [{ name: "John Doe", email: "john@example.com" }],
  boothSize: "2x2",
};

const bazaarResult = validateBazaarApplication.validate(bazaarData);
logger.info(
  "Bazaar validation result:",
  bazaarResult.error ? bazaarResult.error.message : "Valid"
);

// Test booth validation
const boothData = {
  attendees: [{ name: "Jane Doe", email: "jane@example.com" }],
  boothSize: "4x4",
  durationWeeks: 2,
  locationPreference: "Main Hall",
};

const boothResult = validateBoothApplication.validate(boothData);
logger.info(
  "Booth validation result:",
  boothResult.error ? boothResult.error.message : "Valid"
);

logger.info("Validation test completed!");
