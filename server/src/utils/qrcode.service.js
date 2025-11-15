import QRCode from "qrcode";
import jwt from "jsonwebtoken";

/**
 * Generate QR code data URL for an attendee
 * @param {Object} attendeeData - Attendee data to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Data URL of the QR code
 */
export const generateQRCodeDataURL = async (attendeeData, options = {}) => {
  const defaultOptions = {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  };

  const qrOptions = { ...defaultOptions, ...options };

  // Convert data to JSON string
  const dataString = JSON.stringify(attendeeData);

  // Generate QR code
  const dataUrl = await QRCode.toDataURL(dataString, qrOptions);

  return dataUrl;
};

/**
 * Generate QR code buffer for an attendee (for attachments)
 * @param {Object} attendeeData - Attendee data to encode
 * @param {Object} options - QR code options
 * @returns {Promise<Buffer>} Buffer of the QR code image
 */
export const generateQRCodeBuffer = async (attendeeData, options = {}) => {
  const defaultOptions = {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  };

  const qrOptions = { ...defaultOptions, ...options };

  // Convert data to JSON string
  const dataString = JSON.stringify(attendeeData);

  // Generate QR code buffer
  const buffer = await QRCode.toBuffer(dataString, qrOptions);

  return buffer;
};

/**
 * Generate a secure token for attendee verification
 * @param {Object} attendeeInfo - Attendee information
 * @param {string} applicationId - Application ID
 * @returns {string} JWT token
 */
export const generateAttendeeToken = (attendeeInfo, applicationId) => {
  const payload = {
    attendeeEmail: attendeeInfo.email,
    attendeeName: attendeeInfo.name,
    applicationId: applicationId,
    type: "attendee_verification",
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "90d" } // Valid for 90 days
  );
};

/**
 * Create attendee data object for QR code
 * @param {Object} attendee - Attendee object
 * @param {Object} application - Application object
 * @param {Object} vendor - Vendor object
 * @param {Object} event - Event object (optional)
 * @param {string} verificationUrl - URL to verify/display attendee details
 * @returns {Object} Attendee data object
 */
export const createAttendeeQRData = (
  attendee,
  application,
  vendor,
  event,
  verificationUrl
) => {
  const applicationType =
    application.type === "bazaar" ? "Bazaar" : "Platform Booth";
  const eventName = event?.name || "Platform Booth";
  const location = event?.location || application.locationPreference || "N/A";

  // Calculate duration
  let durationText = "";
  if (application.type === "booth" && application.durationWeeks) {
    durationText = `${application.durationWeeks} week${application.durationWeeks > 1 ? "s" : ""}`;
  } else if (event && event.startDate && event.endDate) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    durationText = `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  } else {
    durationText = "N/A";
  }

  return {
    // URL that opens when QR code is scanned
    url: verificationUrl,
    // Attendee information
    attendeeName: attendee.name,
    attendeeEmail: attendee.email,
    // Application information
    companyName: vendor?.companyName || "N/A",
    applicationType: applicationType,
    eventName: eventName,
    location: location,
    duration: durationText,
    boothSize: application.boothSize || "N/A",
    applicationId: application._id.toString(),
    // Timestamp
    generatedAt: new Date().toISOString(),
  };
};
