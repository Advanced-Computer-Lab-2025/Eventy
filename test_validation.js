// Quick test to verify validation schemas work correctly
import { validateBazaarApplication, validateBoothApplication } from './server/src/features/applications/application.validation.js';

console.log('Testing validation schemas...');

// Test bazaar validation
const bazaarData = {
  attendees: [
    { name: "John Doe", email: "john@example.com" }
  ],
  boothSize: "2x2"
};

const bazaarResult = validateBazaarApplication.validate(bazaarData);
console.log('Bazaar validation result:', bazaarResult.error ? bazaarResult.error.message : 'Valid');

// Test booth validation
const boothData = {
  attendees: [
    { name: "Jane Doe", email: "jane@example.com" }
  ],
  boothSize: "4x4",
  durationWeeks: 2,
  locationPreference: "Main Hall"
};

const boothResult = validateBoothApplication.validate(boothData);
console.log('Booth validation result:', boothResult.error ? boothResult.error.message : 'Valid');

console.log('Validation test completed!');

