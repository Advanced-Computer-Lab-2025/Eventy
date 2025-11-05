import { ApplicationService } from "./application.service.js";
import {
  validateBazaarApplication,
  validateBoothApplication,
} from "./application.validation.js";
import ApiError from "../../utils/ApiError.js";
import { sendVisitorQRCodesEmail, sendAttendeeQRCodeEmail } from "../auth/email.service.js";
import Application from "./application.model.js";
import jwt from "jsonwebtoken";
import { generateAttendeeToken } from "../../utils/qrcode.service.js";

export class ApplicationController {
  async applyToBazaar(req, res, next) {
    try {
      const vendorId = req.user._id;
      const eventId = req.params.eventId; // Get eventId from the path
      const user = req.user;

      // Validate input (body should NOT include event)
      // Expects: { attendees: [{ name, email, individualID (URL from /api/upload) }], boothSize }
      const { error } = validateBazaarApplication.validate(req.body);
      if (error)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });

      const applicationDetails = {
        ...req.body, // Includes attendees with individualID URLs
        event: eventId, // Set event from path param
        type: "bazaar",
        createdBy: vendorId,
      };

      const newApplication = await ApplicationService.createApplication(
        applicationDetails
      );

      res.status(201).json({
        success: true,
        message: "Bazaar application submitted successfully!",
        data: newApplication,
      });
    } catch (error) {
      // Handle duplicate application errors specifically
      if (error.message && error.message.includes("already applied")) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      
      // Handle other validation errors
      if (error.message && error.message.includes("Could not create application")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      
      // Fallback for any other errors
      next(error);
    }
  }

  async applyToBooth(req, res, next) {
    try {
      const vendorId = req.user._id;
      const user = req.user;

      // Validate input
      // Expects: { attendees: [{ name, email, individualID (URL from /api/upload) }], boothSize, durationWeeks, locationPreference }
      const { error } = validateBoothApplication.validate(req.body);
      if (error)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });

      const applicationDetails = {
        ...req.body, // Includes attendees with individualID URLs
        event: null, // Platform booths don't need a specific event reference
        type: "booth",
        createdBy: vendorId,
      };

      const newApplication = await ApplicationService.createApplication(
        applicationDetails
      );

      res.status(201).json({
        success: true,
        message: "Booth application submitted successfully!",
        data: newApplication,
      });
    } catch (error) {
      console.error("Error in applyToBooth:", error);
      
      // Handle booth availability errors specifically
      if (error.message && (error.message.includes("already reserved") || (error.message.includes("booth") && error.message.includes("reserved")))) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      
      // Handle other validation errors
      if (error.message && error.message.includes("Could not create application")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      
      // Fallback for any other errors
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const vendorId = req.user._id;
      const filters = req.query; // Get filters from query string (e.g., ?status=approved)

      const applications = await ApplicationService.findVendorApplications(
        vendorId,
        filters
      );

      res.status(200).json({
        success: true,
        message: "Applications retrieved successfully.",
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }
  async updateApplicationStatus(req, res, next) {
    
    try {
      const { applicationId } = req.params;
      const { status } = req.body;
        if (!["admin", "events_office"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admins or Events Office can update status.",
      });
    }

      // Only allow 'approved' or 'rejected'
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value. Must be 'approved' or 'rejected'.",
        });
      }

      const updatedApplication =
        await ApplicationService.updateApplicationStatus(applicationId, status);

      if (!updatedApplication) {
        return res.status(404).json({
          success: false,
          message: "Application not found.",
        });
      }

      // If application is approved, send QR code emails to each attendee
      if (status === "approved") {
        try {
          // Populate the application with vendor and event info
          const populatedApplication = await Application.findById(applicationId)
            .populate({
              path: "createdBy",
              select: "companyName email name firstName lastName"
            })
            .populate({
              path: "event",
              select: "name location startDate endDate"
            });

          if (populatedApplication && populatedApplication.createdBy) {
            // Send individual QR code emails to each attendee asynchronously
            populatedApplication.attendees.forEach((attendee) => {
              sendAttendeeQRCodeEmail(
                attendee,
                populatedApplication,
                populatedApplication.createdBy,
                populatedApplication.event || null
              ).catch(err => {
                console.error(`Failed to send QR code email to ${attendee.email}:`, err);
                // Don't fail the request if email fails
              });
            });
          }
        } catch (emailError) {
          console.error("Error preparing QR code emails:", emailError);
          // Don't fail the request if email preparation fails
        }
      }

      res.status(200).json({
        success: true,
        message: `Application status updated to ${status}.`,
        data: updatedApplication,
      });
    } catch (error) {
      if (error.message === "Application not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  static async getAllApplications(req, res, next) {
    try {
      // Optional: Only allow Events Office or Admin
      if (!req.user || !["events_office", "admin"].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      const applications = await ApplicationService.getAllApplications();

      res.status(200).json({
        success: true,
        message: "All applications fetched successfully",
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelApplication(req, res, next) {
    try {
      // Check for unauthorized access (401 Unauthorized)
      if (!req.user) {
        throw new ApiError(401, "Unauthorized");
      }

      // Check for wrong role (403 Forbidden)
      if (req.user.role !== "vendor") {
        throw new ApiError(403, "Only Vendors can cancel their applications.");
      }

      const { applicationId } = req.params;
      const vendorId = req.user._id;

      const cancelledApplication = await ApplicationService.cancelApplication(
        applicationId,
        vendorId
      );

      res.status(200).json({
        success: true,
        message: "Application cancelled successfully",
        data: cancelledApplication,
      });
    } catch (error) {
      // Handle ApiError instances (401, 403, etc.)
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      // Handle specific error cases
      if (
        error.message === "Application not found" ||
        error.message === "You can only cancel your own applications"
      ) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message.includes("Payment has already been made") ||
        error.message.includes("Application has already been cancelled")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      next(error);
    }
  }

  /**
   * Get attendee details by verification token (for QR code scanning)
   * @route GET /api/applications/attendee/:token
   */
  async getAttendeeByToken(req, res, next) {
    try {
      const { token } = req.params;
      console.log(`🔍 Received request for attendee token: ${token?.substring(0, 20)}...`);

      // Verify the token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
        console.log("✅ Token verified successfully:", { 
          attendeeEmail: decoded.attendeeEmail, 
          applicationId: decoded.applicationId,
          type: decoded.type 
        });
      } catch (error) {
        console.error("❌ Token verification failed:", error.message);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      // Check if token is for attendee verification
      if (decoded.type !== "attendee_verification") {
        return res.status(400).json({
          success: false,
          message: "Invalid token type",
        });
      }

      // Find the application
      const application = await Application.findById(decoded.applicationId)
        .populate({
          path: "createdBy",
          select: "companyName email name firstName lastName"
        })
        .populate({
          path: "event",
          select: "name location startDate endDate"
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // Find the attendee
      const attendee = application.attendees.find(
        (a) => a.email === decoded.attendeeEmail
      );

      if (!attendee) {
        return res.status(404).json({
          success: false,
          message: "Attendee not found",
        });
      }

      // Determine application type and details
      const applicationType = application.type === "bazaar" ? "Bazaar" : "Platform Booth";
      const eventName = application.event?.name || "Platform Booth";
      const location = application.event?.location || application.locationPreference || "N/A";
      
      // Calculate duration
      let durationText = "";
      if (application.type === "booth" && application.durationWeeks) {
        durationText = `${application.durationWeeks} week${application.durationWeeks > 1 ? 's' : ''}`;
      } else if (application.event && application.event.startDate && application.event.endDate) {
        const startDate = new Date(application.event.startDate);
        const endDate = new Date(application.event.endDate);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        durationText = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else {
        durationText = "N/A";
      }

      // Return attendee details
      res.status(200).json({
        success: true,
        data: {
          attendee: {
            name: attendee.name,
            email: attendee.email,
            individualID: attendee.individualID,
          },
          application: {
            type: applicationType,
            eventName: eventName,
            location: location,
            duration: durationText,
            boothSize: application.boothSize,
            status: application.status,
          },
          vendor: {
            companyName: application.createdBy?.companyName || "N/A",
            email: application.createdBy?.email || "N/A",
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/applications/attendee/verify/:token
   * @desc    Display attendee details as HTML page (for QR code scanning)
   * @access  Public (via token)
   */
  async getAttendeeByTokenHTML(req, res, next) {
    try {
      const { token } = req.params;

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "supersecretkey"
      );

      if (!decoded) {
        return res.status(401).send(`
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invalid Token</title></head>
          <body style="font-family:-apple-system,sans-serif;text-align:center;padding:40px;background:#f7fafc">
            <h1 style="color:#e53e3e">❌ Invalid or Expired Token</h1>
            <p>This QR code is invalid or has expired.</p>
          </body>
          </html>
        `);
      }

      // Check if token is for attendee verification
      if (decoded.type !== "attendee_verification") {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invalid Token</title></head>
          <body style="font-family:-apple-system,sans-serif;text-align:center;padding:40px;background:#f7fafc">
            <h1 style="color:#e53e3e">❌ Invalid Token Type</h1>
            <p>This QR code is not valid for attendee verification.</p>
          </body>
          </html>
        `);
      }

      // Find the application
      const application = await Application.findById(decoded.applicationId)
        .populate({
          path: "createdBy",
          select: "companyName email name firstName lastName"
        })
        .populate({
          path: "event",
          select: "name location startDate endDate"
        });

      if (!application) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not Found</title></head>
          <body style="font-family:-apple-system,sans-serif;text-align:center;padding:40px;background:#f7fafc">
            <h1 style="color:#e53e3e">❌ Application Not Found</h1>
            <p>The application associated with this QR code could not be found.</p>
          </body>
          </html>
        `);
      }

      // Find the attendee
      const attendee = application.attendees.find(
        (a) => a.email === decoded.attendeeEmail
      );

      if (!attendee) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not Found</title></head>
          <body style="font-family:-apple-system,sans-serif;text-align:center;padding:40px;background:#f7fafc">
            <h1 style="color:#e53e3e">❌ Attendee Not Found</h1>
            <p>The attendee information could not be found.</p>
          </body>
          </html>
        `);
      }

      // Determine application type and details
      const applicationType = application.type === "bazaar" ? "Bazaar" : "Platform Booth";
      const eventName = application.event?.name || "Platform Booth";
      const location = application.event?.location || application.locationPreference || "N/A";
      
      // Calculate duration
      let durationText = "";
      if (application.type === "booth" && application.durationWeeks) {
        durationText = `${application.durationWeeks} week${application.durationWeeks > 1 ? 's' : ''}`;
      } else if (application.event && application.event.startDate && application.event.endDate) {
        const startDate = new Date(application.event.startDate);
        const endDate = new Date(application.event.endDate);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        durationText = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else {
        durationText = "N/A";
      }

      // Escape HTML
      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      // Return HTML page
      res.status(200).send(`<!DOCTYPE html><html><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Attendee Verification</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#f0f9ff,#e0e7ff,#fce7f3);min-height:100vh;padding:20px}.c{max-width:500px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.1);overflow:hidden}.h{background:linear-gradient(135deg,#dbeafe,#e0e7ff,#fce7f3);padding:25px;text-align:center}.h h1{font-size:22px;font-weight:700;color:#1a202c;margin:0 0 5px}.h p{color:#4a5568;font-size:13px;margin:0}.co{padding:20px}.s{background:#f7fafc;border-radius:6px;padding:15px;margin-bottom:12px;border-left:3px solid #667eea}.s h2{font-size:15px;font-weight:700;color:#2d3748;margin:0 0 10px}.r{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e2e8f0}.r:last-child{border-bottom:none}.l{font-size:12px;color:#718096;font-weight:600}.v{font-size:12px;color:#1a202c;text-align:right}.b{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;background:#10b981;color:#fff}.f{background:#f7fafc;padding:15px;text-align:center;border-top:1px solid #e2e8f0;color:#718096;font-size:10px}${attendee.individualID ? '.id{max-width:100%;margin-top:10px;border-radius:6px;border:2px solid #e2e8f0}' : ''}</style></head><body><div class=c><div class=h><h1>✅ Verified</h1><p>QR Code Verification</p></div><div class=co><div class=s><h2>👤 Attendee</h2><div class=r><span class=l>Name:</span><span class=v>${escapeHtml(attendee.name)}</span></div><div class=r><span class=l>Email:</span><span class=v>${escapeHtml(attendee.email)}</span></div>${attendee.individualID ? `<div style="margin-top:10px"><img src="${escapeHtml(attendee.individualID)}" alt="ID Card" class=id /></div>` : ''}</div><div class=s><h2>📅 Event</h2><div class=r><span class=l>Type:</span><span class=v>${escapeHtml(applicationType)}</span></div><div class=r><span class=l>Event:</span><span class=v>${escapeHtml(eventName)}</span></div><div class=r><span class=l>Location:</span><span class=v>${escapeHtml(location)}</span></div><div class=r><span class=l>Duration:</span><span class=v>${escapeHtml(durationText)}</span></div><div class=r><span class=l>Booth:</span><span class=v>${escapeHtml(application.boothSize)}</span></div><div class=r><span class=l>Status:</span><span class=v><span class=b>Approved</span></span></div></div><div class=s><h2>🏢 Vendor</h2><div class=r><span class=l>Company:</span><span class=v>${escapeHtml(application.createdBy?.companyName || "N/A")}</span></div></div></div><div class=f><p>© 2025 Eventy Platform</p></div></div></body></html>`);
    } catch (error) {
      next(error);
    }
  }
}
