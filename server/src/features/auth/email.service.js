import logger from "../../utils/logger.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import { format } from "date-fns";
import { generateAttendeeToken } from "../../utils/qrcode.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on startup for clearer diagnostics
transporter.verify((err, success) => {
  if (err) {
    logger.error("❌ Email transporter verification failed:", err.message);
  } else {
    logger.info("✅ Email transporter is ready:", success);
  }
});

export const sendRegistrationEmail = async (user) => {
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";

  const mailOptions = {
    from: `${process.env.EMAIL_USER}`, // must match authenticated user for Gmail
    to: user?.email,
    subject: "Welcome to Eventy 🎉",
    html: `
      <h2>Hi ${displayName},</h2>
      <p>Welcome to Eventy! Your registration was successful.</p>
      <p><a href="http://localhost:5000/login">Click here to login</a></p>
      <p>See you soon 👋</p>
    `,
    replyTo: process.env.EMAIL_USER,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("✅ Email send attempt:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      response: info?.response,
      envelope: info?.envelope,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    logger.error("❌ Error sending email:", error?.message || error);
  }
};

export const sendVerificationEmail = async (user) => {
  // Add title prefix for professors
  const namePrefix =
    user?.role?.toLowerCase() === "professor" ? "Professor " : "";
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";
  const fullDisplayName = namePrefix + displayName;

  // Generate verification token (expires in 24 hours)
  const verificationToken = jwt.sign(
    { id: user._id || user.id, email: user.email },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "24h" }
  );

  const verificationUrl = `http://localhost:5000/verify-email/${verificationToken}`;

  // Role-based greeting and description
  const roleDescriptions = {
    professor:
      "As a professor, you'll have access to create workshops, manage academic events, and engage with students.",
    staff:
      "As a staff member, you'll be able to view and manage campus events and activities.",
    ta: "As a teaching assistant, you'll have access to event management and student engagement tools.",
  };
  const roleDescription =
    roleDescriptions[user?.role?.toLowerCase()] ||
    "You'll have access to all the features available for your role.";

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: "Verify Your Eventy Account",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 100px; width: auto; display: block; margin: 0 auto;" />
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Welcome, ${fullDisplayName}! 👋
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Your account has been approved by an administrator. We're excited to have you on board!
                    </p>
                    <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      ${roleDescription}
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verificationUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="48%" strokecolor="#10b981" fillcolor="#10b981">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Verify Email Address</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="${verificationUrl}" 
                             style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39); border: 1px solid rgba(16, 185, 129, 0.2); line-height: 20px; mso-hide: all;">
                            Verify Email Address
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <!-- Alternative Link -->
                    <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px; font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Button not working?
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #4a5568; line-height: 1.6;">
                        <a href="${verificationUrl}" style="color: #667eea; text-decoration: underline; font-weight: 600;">Click here to verify your email address</a>
                      </p>
                    </div>
                    
                    <!-- Security Notice -->
                    <div style="margin-top: 32px; padding: 16px; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 4px;">
                      <p style="margin: 0; font-size: 13px; color: #742a2a; line-height: 1.5;">
                        <strong>⏱️ Time Sensitive:</strong> This verification link will expire in 24 hours for security reasons.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                      If you didn't request this verification, you can safely ignore this email.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                      <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                        © 2025 Eventy Platform. All rights reserved.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                        Campus Event Management System
                      </p>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    replyTo: process.env.EMAIL_USER,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo", // Content ID for embedding in HTML
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("✅ Verification email sent:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return verificationToken; // Return token for testing purposes
  } catch (error) {
    logger.error(
      "❌ Error sending verification email:",
      error?.message || error
    );
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send cancellation notification email to gym session participants
 * @param {Object} user - User object with email and name
 * @param {Object} session - Gym session details
 */
export const sendGymSessionCancellationEmail = async (user, session) => {
  // Add title prefix for professors
  const namePrefix =
    user?.role?.toLowerCase() === "professor" ? "Professor " : "";
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";
  const fullDisplayName = namePrefix + displayName;

  // Format date and time
  const sessionDate = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format session type
  const sessionTypeFormatted = session.type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: `Gym Session Cancelled - ${sessionTypeFormatted}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gym Session Cancelled</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #991b1b; line-height: 1.2;">
                        Session Cancelled
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Hi ${fullDisplayName},
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      We regret to inform you that the following gym session has been cancelled:
                    </p>
                    
                    <!-- Session Details Box with Icon -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #ef4444; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                          Session Details
                        </h3>
                      </div>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Session Type:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">${sessionTypeFormatted}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Date:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${sessionDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Time:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${session.startTime}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Duration:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${session.durationMinutes} minutes</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Instructor:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${session.instructor}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <p style="margin: 24px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      We sincerely apologize for any inconvenience this may cause. Please check our gym schedule to find alternative sessions that fit your schedule.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://localhost:5000/sports" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="48%" strokecolor="#10b981" fillcolor="#10b981">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">View Gym Schedule</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="http://localhost:5000/sports" 
                             style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39); border: 1px solid rgba(16, 185, 129, 0.2); line-height: 20px; mso-hide: all;">
                            View Gym Schedule
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <!-- Alternative Link Fallback -->
                    <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px; font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Button not working?
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #4a5568; line-height: 1.6;">
                        <a href="http://localhost:5000/sports" style="color: #667eea; text-decoration: underline; font-weight: 600;">Click here to view the gym schedule</a>
                      </p>
                    </div>
                    
                    <!-- Info Notice -->
                    <div style="margin-top: 32px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
                        <strong>Tip:</strong> You can register for other available gym sessions through your dashboard or by visiting the sports facilities page.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                      If you have any questions or concerns, please don't hesitate to contact the Events Office.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                      <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                        © 2025 Eventy Platform. All rights reserved.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                        Campus Event Management System
                      </p>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    replyTo: process.env.EMAIL_USER,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo", // Content ID for embedding in HTML
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Cancellation email sent to ${user.email}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    logger.error(
      `❌ Error sending cancellation email to ${user.email}:`,
      error?.message || error
    );
    // Don't throw - log error but don't fail the cancellation
  }
};

/**
 * Send update notification email to gym session participants
 * @param {Object} user - User object with email and name
 * @param {Object} oldSession - Original session details before update
 * @param {Object} newSession - Updated session details
 */
export const sendGymSessionUpdateEmail = async (
  user,
  oldSession,
  newSession
) => {
  // Add title prefix for professors
  const namePrefix =
    user?.role?.toLowerCase() === "professor" ? "Professor " : "";
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";
  const fullDisplayName = namePrefix + displayName;

  // Format dates
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const oldDate = formatDate(oldSession.date);
  const newDate = formatDate(newSession.date);

  // Format session type
  const sessionTypeFormatted = newSession.type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  // Check what changed
  const dateChanged = oldDate !== newDate;
  const timeChanged = oldSession.startTime !== newSession.startTime;
  const durationChanged =
    oldSession.durationMinutes !== newSession.durationMinutes;

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: `Gym Session Update - ${sessionTypeFormatted}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gym Session Updated</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #92400e; line-height: 1.2;">
                        Session Updated
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Hi ${fullDisplayName},
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      We're writing to inform you that a gym session you're registered for has been updated:
                    </p>
                    
                    <!-- Session Type Box -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 20px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                        ${sessionTypeFormatted} with ${newSession.instructor}
                      </h3>
                    </div>
                    
                    <!-- Changes Details -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                          What Changed
                        </h3>
                      </div>
                      <table style="width: 100%; border-collapse: collapse;">
                        ${
                          dateChanged
                            ? `
                        <tr>
                          <td colspan="2" style="padding: 12px 0; font-size: 14px; color: #718096; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            Date:
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 12px; font-size: 14px; color: #ef4444; text-decoration: line-through; width: 50%;">
                            ${oldDate}
                          </td>
                          <td style="padding: 8px 12px; font-size: 15px; color: #10b981; font-weight: 700; width: 50%;">
                            ${newDate}
                          </td>
                        </tr>
                        `
                            : `
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Date:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${newDate}</td>
                        </tr>
                        `
                        }
                        ${
                          timeChanged
                            ? `
                        <tr>
                          <td colspan="2" style="padding: 12px 0; font-size: 14px; color: #718096; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            Time:
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 12px; font-size: 14px; color: #ef4444; text-decoration: line-through; width: 50%;">
                            ${oldSession.startTime}
                          </td>
                          <td style="padding: 8px 12px; font-size: 15px; color: #10b981; font-weight: 700; width: 50%;">
                            ${newSession.startTime}
                          </td>
                        </tr>
                        `
                            : `
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px, color: #718096; font-weight: 600;">
                            Time:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${newSession.startTime}</td>
                        </tr>
                        `
                        }
                        ${
                          durationChanged
                            ? `
                        <tr>
                          <td colspan="2" style="padding: 12px 0; font-size: 14px; color: #718096; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            Duration:
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 12px; font-size: 14px; color: #ef4444; text-decoration: line-through; width: 50%;">
                            ${oldSession.durationMinutes} minutes
                          </td>
                          <td style="padding: 8px 12px; font-size: 15px; color: #10b981; font-weight: 700; width: 50%;">
                            ${newSession.durationMinutes} minutes
                          </td>
                        </tr>
                        `
                            : `
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Duration:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${newSession.durationMinutes} minutes</td>
                        </tr>
                        `
                        }
                      </table>
                    </div>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <p style="margin: 24px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Please make note of these changes. If you can no longer attend, you can unregister from the session through your dashboard.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://localhost:5000/sports" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="48%" strokecolor="#10b981" fillcolor="#10b981">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">View Gym Schedule</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="http://localhost:5000/sports" 
                             style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39); border: 1px solid rgba(16, 185, 129, 0.2); line-height: 20px; mso-hide: all;">
                            View Gym Schedule
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <!-- Alternative Link Fallback -->
                    <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px; font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Button not working?
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #4a5568; line-height: 1.6;">
                        <a href="http://localhost:5000/sports" style="color: #667eea; text-decoration: underline; font-weight: 600;">Click here to view the gym schedule</a>
                      </p>
                    </div>
                    
                    <!-- Info Notice -->
                    <div style="margin-top: 32px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
                        <strong>Note:</strong> Your registration for this session remains active. You'll need to manually unregister if you can no longer attend.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                      If you have any questions or concerns, please don't hesitate to contact the Events Office.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                      <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                        © 2025 Eventy Platform. All rights reserved.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                        Campus Event Management System
                      </p>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    replyTo: process.env.EMAIL_USER,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo", // Content ID for embedding in HTML
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Update email sent to ${user.email}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    logger.error(
      `❌ Error sending update email to ${user.email}:`,
      error?.message || error
    );
    // Don't throw - log error but don't fail the update
  }
};

/**
/**
 * Send application status notification email to vendor
 * @param {Object} vendor - Vendor user object with email and companyName
 * @param {Object} application - Application object with type, status, and event details
 */
export const sendVendorApplicationStatusEmail = async (vendor, application) => {
  const displayName =
    vendor?.companyName ||
    vendor?.name ||
    [vendor?.firstName, vendor?.lastName].filter(Boolean).join(" ") ||
    "Vendor";

  const applicationType = application.type === "bazaar" ? "Bazaar" : "Booth";
  const applicationTypeLower =
    application.type === "bazaar" ? "bazaar" : "booth";
  const eventName = application.event?.name || null;

  const isApproved = application.status === "approved";
  const statusText = isApproved ? "Approved" : "Rejected";
  const statusColor = isApproved ? "#10b981" : "#ef4444";
  const statusBgGradient = isApproved
    ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
    : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
  const statusTextColor = isApproved ? "#065f46" : "#991b1b";

  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  let applicationDetailsHtml = `
    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid ${statusColor}; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
          Application Details
        </h3>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Application Type:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">${applicationType}</td>
        </tr>
  `;

  if (application.type === "bazaar") {
    applicationDetailsHtml += `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Bazaar Name:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${eventName}</td>
        </tr>
    `;
  }

  applicationDetailsHtml += `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Booth Size:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${
            application.boothSize || "N/A"
          }</td>
        </tr>
  `;

  if (application.type === "booth" && application.durationWeeks) {
    applicationDetailsHtml += `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Duration:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${
            application.durationWeeks
          } week${application.durationWeeks > 1 ? "s" : ""}</td>
        </tr>
    `;
  }

  if (application.type === "booth" && application.locationPreference) {
    applicationDetailsHtml += `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Location:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${application.locationPreference}</td>
        </tr>
    `;
  }

  applicationDetailsHtml += `
      </table>
    </div>
  `;

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: vendor?.email,
    subject:
      `${applicationType} Application ${statusText}` +
      (eventName ? ` - ${eventName}` : ""),
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Application ${statusText}</title></head>
      <body style="margin:0;padding:0;background:linear-gradient(135deg,#f0f9ff 0%,#e0e7ff 50%,#fce7f3 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <table role="presentation" style="width:100%;border-collapse:collapse;margin:0;padding:0;">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#dbeafe 0%,#e0e7ff 50%,#fce7f3 100%);padding:48px 40px;text-align:center;border-radius:16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height:140px;width:auto;display:block;margin:0 auto 16px;" />
                    <div style="margin-top:20px;padding:8px 16px;background:${statusBgGradient};border-radius:10px;display:inline-block;box-shadow:0 4px 12px ${statusColor}40;">
                      <h1 style="margin:0;font-size:16px;font-weight:700;color:${statusTextColor};line-height:1.2;">Application ${statusText}</h1>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:50px 40px 40px;">
                    <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a202c;line-height:1.3;">Hi ${displayName},</h2>
                    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4a5568;">
                      ${
                        isApproved
                          ? `Great news. Your ${applicationTypeLower} application has been <strong style="color:${statusColor};">${statusText.toLowerCase()}</strong>.`
                          : `We regret to inform you that your ${applicationTypeLower} application has been <strong style="color:${statusColor};">${statusText.toLowerCase()}</strong>.`
                      }
                    </p>
                    ${applicationDetailsHtml}
                    ${
                      isApproved
                        ? `
                    <div style="margin:32px 0;border-top:1px solid #e2e8f0;"></div>
                    <p style="margin:24px 0 20px;font-size:16px;line-height:1.6;color:#4a5568;">
                      Your application has been reviewed and approved. You can view details in your vendor dashboard.
                    </p>
                    <table role="presentation" style="width:100%;margin:32px 0;">
                      <tr>
                        <td align="center">
                          <a href="http://localhost:5000/vendor/dashboard"
                             style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;text-decoration:none;border-radius:25px;font-weight:600;font-size:16px;box-shadow:0 4px 14px 0 rgba(16,185,129,0.39);border:1px solid rgba(16,185,129,0.2);">
                            View Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    `
                        : `
                    <div style="margin:32px 0;border-top:1px solid #e2e8f0;"></div>
                    <p style="margin:24px 0 20px;font-size:16px;line-height:1.6;color:#4a5568;">
                      Thank you for applying. You may reapply from your dashboard or contact the Events Office for questions.
                    </p>
                    <table role="presentation" style="width:100%;margin:32px 0;">
                      <tr>
                        <td align="center">
                          <a href="http://localhost:5000/vendor/dashboard"
                             style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;text-decoration:none;border-radius:25px;font-weight:600;font-size:16px;box-shadow:0 4px 14px 0 rgba(16,185,129,0.39);border:1px solid rgba(16,185,129,0.2);">
                            Reapply
                          </a>
                        </td>
                      </tr>
                    </table>
                    `
                    }
                    <div style="margin:32px 0;border-top:1px solid #e2e8f0;"></div>
                    <div style="background-color:#f7fafc;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
                      <p style="margin:0;font-size:14px;color:#4a5568;line-height:1.6;">
                        Need help? <a href="mailto:events@guc.edu.eg" style="color:#667eea;text-decoration:underline;font-weight:600;">Contact the Events Office</a>
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#f7fafc;padding:32px 40px;border-top:1px solid #e2e8f0;">
                    <p style="margin:0 0 16px;font-size:13px;color:#718096;line-height:1.6;text-align:center;">If you have any questions or concerns please contact the Events Office.</p>
                    <div style="text-align:center;margin:20px 0;">
                      <p style="margin:0;font-size:12px;color:#a0aec0;">© 2025 Eventy Platform. All rights reserved.</p>
                      <p style="margin:8px 0 0;font-size:11px;color:#cbd5e0;">Campus Event Management System</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    replyTo: process.env.EMAIL_USER,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `✅ Vendor application status email sent to ${vendor?.email}:`,
      {
        messageId: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
        applicationType: application.type,
        status: application.status,
      }
    );

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    logger.error(
      `❌ Error sending vendor application status email to ${vendor?.email}:`,
      error?.message || error
    );
    // Do not throw
  }
};

/**
 * Send QR codes for all registered visitors(attendees) to the vendor
 * @param {Object} application - Application object (populated with createdBy and event)
 * @param {Object} vendor - Vendor user object
 * @param {Object|null} event - Event object or null for platform booth
 */
export const sendVisitorQRCodesEmail = async (
  application,
  vendor,
  event = null
) => {
  try {
    const vendorName = vendor?.companyName || vendor?.name || "Vendor";
    const vendorEmail = vendor?.email;

    if (!vendorEmail) {
      logger.error("❌ Vendor email not found");
      return;
    }

    // Determine application type and details
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

    // Generate QR codes for each attendee
    const qrCodeAttachments = [];
    const qrCodeDataUrls = [];

    for (let i = 0; i < application.attendees.length; i++) {
      const attendee = application.attendees[i];

      // Create QR code data object
      const qrData = {
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        companyName: vendor?.companyName || "N/A",
        applicationType,
        eventName,
        location,
        duration: durationText,
        boothSize: application.boothSize || "N/A",
        applicationId: application._id?.toString?.() || String(application._id),
        attendeeIndex: i + 1,
      };

      const qrDataString = JSON.stringify(qrData);

      const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      qrCodeDataUrls.push({ dataUrl: qrCodeDataUrl, attendee, qrData });

      const qrCodeBuffer = await QRCode.toBuffer(qrDataString, {
        width: 300,
        margin: 2,
      });

      qrCodeAttachments.push({
        filename: `QR_${attendee.name.replace(/\s+/g, "_")}_${application._id}.png`,
        content: qrCodeBuffer,
        cid: `qrcode_${i}`,
      });
    }

    const logoPath = path.resolve(
      __dirname,
      "../../../../client/public/images/logo-light.png"
    );

    const qrCodesHTML = qrCodeDataUrls
      .map(
        (item, index) => `
      <div style="margin:24px 0;padding:24px;background:linear-gradient(135deg,#f7fafc 0%,#edf2f7 100%);border-radius:12px;border-left:4px solid #667eea;">
        <h3 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#2d3748;">
          Visitor ${index + 1}: ${item.attendee.name}
        </h3>
        <div style="text-align:center;margin:20px 0;">
          <img src="${item.dataUrl}" alt="QR Code for ${item.attendee.name}" style="width:250px;height:250px;border:4px solid #ffffff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
        </div>
        <div style="margin-top:16px;padding:16px;background-color:#ffffff;border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Name:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${item.attendee.name}</td></tr>
            <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Email:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${item.attendee.email}</td></tr>
            <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Company:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${item.qrData.companyName}</td></tr>
          </table>
        </div>
      </div>
    `
      )
      .join("");

    const mailOptions = {
      from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
      to: vendorEmail,
      subject: `Visitor QR Codes - ${applicationType} Application`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Visitor QR Codes</title></head>
        <body style="margin:0;padding:0;background:linear-gradient(135deg,#f0f9ff 0%,#e0e7ff 50%,#fce7f3 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <table role="presentation" style="width:100%;border-collapse:collapse;margin:0;padding:0;">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#dbeafe 0%,#e0e7ff 50%,#fce7f3 100%);padding:48px 40px;text-align:center;border-radius:16px 16px 0 0;">
                      <img src="cid:logo" alt="Eventy Logo" style="height:100px;width:auto;display:block;margin:0 auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:50px 40px 40px;">
                      <h2 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#1a202c;line-height:1.3;">Visitor QR Codes 📱</h2>
                      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4a5568;">Hi ${vendorName},</p>
                      <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#4a5568;">
                        Your ${applicationType.toLowerCase()} application has been approved. Below are the QR codes for all registered visitors.
                      </p>
                      <div style="background:linear-gradient(135deg,#f7fafc 0%,#edf2f7 100%);border-radius:12px;padding:24px;margin:32px 0;border-left:4px solid #667eea;">
                        <h3 style="margin:0 0 20px;font-size:18px;font-weight:700;color:#2d3748;">Application Details</h3>
                        <table style="width:100%;border-collapse:collapse;">
                          <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Type:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${applicationType}</td></tr>
                          <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Event/Booth:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${eventName}</td></tr>
                          <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Location:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${location}</td></tr>
                          <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Duration:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${durationText}</td></tr>
                          <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Booth Size:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${application.boothSize || "N/A"}</td></tr>
                          <tr><td style="padding:8px 0;font-size:14px;color:#718096;font-weight:600;">Number of Visitors:</td><td style="padding:8px 0;font-size:14px;color:#1a202c;text-align:right;">${application.attendees?.length || 0}</td></tr>
                        </table>
                      </div>
                      <div style="margin:32px 0;">
                        <h3 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#2d3748;text-align:center;">Visitor QR Codes</h3>
                      <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                        Your ${applicationType.toLowerCase()} application has been approved! Below are the QR codes for all registered visitors. Each QR code contains the visitor's information and can be used for verification at the event.
                      </p>
                      
                      <!-- QR Codes Section -->
                      <div style="margin: 32px 0;">
                        <h3 style="margin: 0 0 24px; font-size: 20px; font-weight: 700; color: #2d3748; text-align: center;">
                          Visitor QR Codes
                        </h3>
                        ${qrCodesHTML}
                      </div>
                      <div style="margin-top:32px;padding:20px;background-color:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;">
                        <p style="margin:0 0 12px;font-size:14px;color:#1e40af;font-weight:600;">Instructions:</p>
                        <ul style="margin:0;padding-left:20px;font-size:14px;color:#1e40af;line-height:1.8;">
                          <li>Each QR code is unique to a specific visitor</li>
                          <li>Save or print these QR codes before the event</li>
                          <li>Scan at the entrance to verify visitor identity</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#f7fafc;padding:32px 40px;border-top:1px solid #e2e8f0;">
                      <p style="margin:0 0 16px;font-size:13px;color:#718096;line-height:1.6;text-align:center;">If you have any questions please contact the Events Office.</p>
                      <div style="text-align:center;margin:20px 0;">
                        <p style="margin:0;font-size:12px;color:#a0aec0;">© 2025 Eventy Platform. All rights reserved.</p>
                        <p style="margin:8px 0 0;font-size:11px;color:#cbd5e0;">Campus Event Management System</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      replyTo: process.env.EMAIL_USER,
      attachments: [
        { filename: "logo-light.png", path: logoPath, cid: "logo" },
        ...qrCodeAttachments,
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ QR codes email sent to ${vendorEmail}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      attendeesCount: application.attendees?.length || 0,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    logger.error(`❌ Error sending QR codes email:`, error?.message || error);
    // Do not throw
  }
};

/**
 * Send individual QR code email to an attendee
 * @param {Object} attendee - Attendee object with name, email, individualID
 * @param {Object} application - Application object
 * @param {Object} vendor - Vendor user object
 * @param {Object} event - Event object (optional, may be null for booth)
 */
export const sendAttendeeQRCodeEmail = async (
  attendee,
  application,
  vendor,
  event = null
) => {
  try {
    const attendeeEmail = attendee?.email;
    const attendeeName = attendee?.name || "Visitor";

    if (!attendeeEmail) {
      logger.error("❌ Attendee email not found");
      return;
    }

    // Determine application type and details
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

    // Generate JWT token for attendee verification
    const token = generateAttendeeToken(attendee, application._id.toString());

    // Use frontend route URL for QR code (opens the React page)
    // Get base URL from environment variable or default to localhost:5000
    const baseUrl =
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5000";
    const verificationUrl = `${baseUrl}/attendee/${token}`;

    let qrCodeBuffer;
    let qrCodeDataUrl;
    try {
      // Generate QR code as buffer (for attachment)
      qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "M", // Medium error correction for reliability
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Also generate as data URL for direct embedding in email HTML (backup)
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Verify buffer is valid
      if (!qrCodeBuffer || qrCodeBuffer.length === 0) {
        throw new Error("QR code buffer is empty");
      }
    } catch (qrError) {
      logger.error(`❌ Error generating QR code:`, qrError);
      throw new Error(`Failed to generate QR code: ${qrError.message}`);
    }

    // Path to logo image
    const logoPath = path.resolve(
      __dirname,
      "../../../../client/public/images/logo-light.png"
    );

    const mailOptions = {
      from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
      to: attendeeEmail,
      subject: `Your QR Code - ${applicationType} Access`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your QR Code</title>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                  
                  <!-- Header with Logo and Gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                      <img src="cid:logo" alt="Eventy Logo" style="height: 100px; width: auto; display: block; margin: 0 auto;" />
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 50px 40px 40px;">
                      <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                        Your QR Code is Ready! 📱
                      </h2>
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                        Hi ${attendeeName},
                      </p>
                      <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                        Your ${applicationType.toLowerCase()} application has been approved! Below is your personal QR code. Scan this code at the event entrance to verify your identity and access details.
                      </p>
                      
                      <!-- QR Code Display -->
                      <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center; border-left: 4px solid #667eea;">
                        <h3 style="margin: 0 0 24px; font-size: 20px; font-weight: 700; color: #2d3748;">
                          Your Personal QR Code
                        </h3>
                        <div style="display: inline-block; padding: 20px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                          <!-- Use CID attachment for QR code (more reliable than data URLs) -->
                          <img src="cid:qrcode" alt="QR Code for ${attendeeName}" style="width: 300px; height: 300px; display: block; border: 4px solid #ffffff; border-radius: 8px; margin: 0 auto;" />
                        </div>
                        <p style="margin: 16px 0 0; font-size: 12px; color: #718096; text-align: center;">
                          <a href="${verificationUrl}" style="color: #667eea; text-decoration: none;">Or click here to view details</a>
                        </p>
                        <p style="margin: 24px 0 0; font-size: 14px; color: #718096; line-height: 1.6;">
                          Scan this QR code to view your attendee details
                        </p>
                      </div>
                      
                      <!-- Instructions -->
                      <div style="margin-top: 32px; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                        <p style="margin: 0 0 12px; font-size: 14px; color: #1e40af; font-weight: 600;">
                          📋 How to Use Your QR Code:
                        </p>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e40af; line-height: 1.8;">
                          <li>Save this QR code to your phone or print it</li>
                          <li>Present it at the event entrance for verification</li>
                          <li>When scanned, it will display your attendee details</li>
                          <li>Keep this QR code secure - it's unique to you</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                        If you have any questions, please contact the Events Office or your vendor.
                      </p>
                      <div style="text-align: center; margin: 20px 0;">
                        <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                          © 2025 Eventy Platform. All rights reserved.
                        </p>
                        <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                          Campus Event Management System
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      replyTo: process.env.EMAIL_USER,
      attachments: [
        {
          filename: "logo-light.png",
          path: logoPath,
          cid: "logo",
        },
        {
          filename: `QR_Code_${attendeeName.replace(/\s+/g, "_")}.png`,
          content: qrCodeBuffer,
          cid: "qrcode",
          contentType: "image/png",
          contentDisposition: "inline",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ QR code email sent to ${attendeeEmail}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      attendeeName: attendeeName,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    logger.error(
      `❌ Error sending QR code email to ${attendee?.email}:`,
      error?.message || error
    );
    // Don't throw - log error but don't fail the approval process
  }
};
export const sendPaymentReceipt = async (user, transaction, event) => {
  const namePrefix =
    user?.role?.toLowerCase() === "professor" ? "Professor " : "";
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "Valued Customer";
  const fullDisplayName = namePrefix + displayName;

  const formattedDate = format(
    new Date(transaction.createdAt),
    "MMMM d, yyyy h:mm a"
  );
  const formattedAmount = (transaction.amount || 0).toFixed(2);
  const paymentMethodDisplay =
    transaction.paymentMethod === "wallet"
      ? "Eventy Wallet"
      : "Credit/Debit Card";

  const eventName = event?.name || "Wallet Top-Up";
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: `Payment Receipt - ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #065f46; line-height: 1.2;">
                        Payment Confirmed ✓
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Thank you, ${fullDisplayName}! 🎉
                    </h2>
                    <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Your payment has been successfully processed. Below are the details of your transaction.
                    </p>
                    
                    <!-- Amount Box -->
                    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; padding: 28px; margin: 32px 0; text-align: center; border-left: 4px solid #10b981; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #065f46;">
                        Amount Paid
                      </p>
                      <div style="font-size: 48px; font-weight: 700; color: #047857; line-height: 1.2;">
                        $${formattedAmount}
                      </div>
                    </div>
                    
                    <!-- Transaction Details Box -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                          Transaction Details
                        </h3>
                      </div>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 12px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Transaction ID:
                          </td>
                          <td style="padding: 12px 0; font-size: 14px; color: #1a202c; text-align: right; font-family: monospace; word-break: break-all;">
                            ${transaction._id}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Date:
                          </td>
                          <td style="padding: 12px 0; font-size: 15px; color: #1a202c; text-align: right;">${formattedDate}</td>
                        </tr>
                        ${
                          event
                            ? `<tr>
                          <td style="padding: 12px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Event:
                          </td>
                          <td style="padding: 12px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">${eventName}</td>
                        </tr>`
                            : ""
                        }
                        <tr>
                          <td style="padding: 12px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Payment Method:
                          </td>
                          <td style="padding: 12px 0; font-size: 15px; color: #1a202c; text-align: right;">${paymentMethodDisplay}</td>
                        </tr>
                        <tr style="border-top: 2px solid #e2e8f0;">
                          <td style="padding: 16px 0 0; font-size: 16px; color: #1a202c; font-weight: 700;">
                            Total Paid:
                          </td>
                          <td style="padding: 16px 0 0; font-size: 18px; font-weight: 700; color: #10b981; text-align: right;">
                            $${formattedAmount}
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <p style="margin: 24px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      ${
                        event
                          ? `Your registration for <strong>${eventName}</strong> is now confirmed. We look forward to seeing you at the event!`
                          : `Your wallet has been successfully topped up. You can now use your balance for future event payments.`
                      }
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://localhost:5000/my-events" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="48%" strokecolor="#10b981" fillcolor="#10b981">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">View My Events</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="http://localhost:5000/my-events" 
                             style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39); border: 1px solid rgba(16, 185, 129, 0.2); line-height: 20px; mso-hide: all;">
                            View My Events
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <!-- Alternative Link Fallback -->
                    <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px; font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Button not working?
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #4a5568; line-height: 1.6;">
                        <a href="http://localhost:5000/my-events" style="color: #667eea; text-decoration: underline; font-weight: 600;">Click here to view your events</a>
                      </p>
                    </div>
                    
                    <!-- Info Notice -->
                    <div style="margin-top: 32px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
                        <strong>Need Help?</strong> If you have any questions about this transaction, please contact our support team or visit your dashboard.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                      This is an automated receipt for your records. Please keep this email for your reference.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                      <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                        © 2025 Eventy Platform. All rights reserved.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                        Campus Event Management System
                      </p>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    replyTo: process.env.EMAIL_USER,
    attachments: [{ filename: "logo-light.png", path: logoPath, cid: "logo" }],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `✅ Payment receipt sent to ${user.email} for transaction ${transaction._id}:`,
      {
        messageId: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
      }
    );
    if (info?.rejected?.length)
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
  } catch (error) {
    logger.error(
      `❌ Error sending payment receipt to ${user.email}:`,
      error?.message || error
    );
  }
};

export const sendStudentEmailVerification = async (user) => {
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";

  // Generate email verification token (expires in 24 hours)
  const verificationToken = jwt.sign(
    { id: user._id || user.id, email: user.email },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "24h" }
  );

  const verificationUrl = `http://localhost:5000/verify-email/${verificationToken}`;

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: "Verify Your Eventy Account",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 100px; width: auto; display: block; margin: 0 auto;" />
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Welcome, ${displayName}! 👋
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Thanks for signing up to Eventy! To activate your student account and start exploring campus events, please verify your email address.
                    </p>
                    <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      As a student, you'll have access to browse events, book tickets, manage registrations, and participate in all campus activities.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verificationUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="48%" strokecolor="#10b981" fillcolor="#10b981">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Verify Email Address</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="${verificationUrl}" 
                             style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39); border: 1px solid rgba(16, 185, 129, 0.2); line-height: 20px; mso-hide: all;">
                            Verify Email Address
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <!-- Alternative Link -->
                    <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px; font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Button not working?
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #4a5568; line-height: 1.6;">
                        <a href="${verificationUrl}" style="color: #667eea; text-decoration: underline; font-weight: 600;">Click here to verify your email address</a>
                      </p>
                    </div>
                    
                    <!-- Security Notice -->
                    <div style="margin-top: 32px; padding: 16px; background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 4px;">
                      <p style="margin: 0; font-size: 13px; color: #742a2a; line-height: 1.5;">
                        <strong>⏱️ Time Sensitive:</strong> This verification link will expire in 24 hours for security reasons.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                      If you didn't request this verification, you can safely ignore this email.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                      <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                        © 2025 Eventy Platform. All rights reserved.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                        Campus Event Management System
                      </p>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    replyTo: process.env.EMAIL_USER,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo", // Content ID for embedding in HTML
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("✅ Student verification email sent:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return verificationToken; // Return token for testing purposes
  } catch (error) {
    logger.error(
      "❌ Error sending student verification email:",
      error?.message || error
    );
    throw new Error("Failed to send student verification email");
  }
};
/**
 * Send payment receipt email to vendor with Stripe receipt URL
 * @param {Object} vendor - Vendor user object with email and companyName
 * @param {Object} transaction - Transaction object with payment details
 * @param {Object} application - Application object with type and event details
 * @param {string} stripeReceiptUrl - Stripe receipt URL from the payment intent
 */
export const sendVendorPaymentReceipt = async (
  vendor,
  transaction,
  application,
  stripeReceiptUrl
) => {
  // Get vendor display name (company name for vendors)
  const displayName =
    vendor?.companyName ||
    vendor?.name ||
    [vendor?.firstName, vendor?.lastName].filter(Boolean).join(" ") ||
    "Vendor";

  // Determine application type display name
  const applicationType = application.type === "bazaar" ? "Bazaar" : "Booth";
  const applicationTypeLower =
    application.type === "bazaar" ? "bazaar" : "booth";

  // Get event/bazaar name
  const eventName = application.event?.name || "Platform Booth";

  const formattedDate = format(
    new Date(transaction.createdAt),
    "MMMM d, yyyy h:mm a"
  );
  const formattedAmount = (transaction.amount || 0).toFixed(2);

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  // Build application details HTML
  let applicationDetailsHtml = `
    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #10b981; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
          Application Details
        </h3>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Application Type:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">${applicationType}</td>
        </tr>
  `;

  if (application.type === "bazaar") {
    applicationDetailsHtml += `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Bazaar Name:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${eventName}</td>
        </tr>
    `;
  }

  applicationDetailsHtml += `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Booth Size:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${
            application.boothSize || "N/A"
          }</td>
        </tr>
  `;

  if (application.type === "booth" && application.durationWeeks) {
    applicationDetailsHtml += `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Duration:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${
            application.durationWeeks
          } week${application.durationWeeks > 1 ? "s" : ""}</td>
        </tr>
    `;
  }

  if (application.type === "booth" && application.locationPreference) {
    applicationDetailsHtml += `
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
            Location:
          </td>
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${application.locationPreference}</td>
        </tr>
    `;
  }

  applicationDetailsHtml += `
      </table>
    </div>
  `;

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: vendor?.email,
    subject: `Payment Receipt - ${applicationType} Application Payment`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #065f46; line-height: 1.2;">
                        Payment Confirmed ✓
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Thank you, ${displayName}! 🎉
                    </h2>
                    <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Your payment for your ${applicationTypeLower} application has been successfully processed. Below are the details of your transaction.
                    </p>
                    
                    <!-- Amount Box -->
                    <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 12px; padding: 28px; margin: 32px 0; text-align: center; border-left: 4px solid #6366f1; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #4338ca;">
                        Amount Paid
                      </p>
                      <div style="font-size: 48px; font-weight: 700; color: #4f46e5; line-height: 1.2;">
                        $${formattedAmount}
                      </div>
                    </div>
                    
                    <!-- Stripe Receipt Section -->
                    ${
                      stripeReceiptUrl
                        ? `
                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #3b82f6; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <div style="margin-bottom: 16px;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                          Stripe Receipt
                        </h3>
                        <p style="margin: 8px 0 0; font-size: 14px; color: #4a5568; line-height: 1.6;">
                          Your official payment receipt from Stripe is available below. Please save this for your records.
                        </p>
                      </div>
                      <table role="presentation" style="width: 100%; margin: 20px 0 0;">
                        <tr>
                          <td align="center">
                            <a href="${stripeReceiptUrl}" 
                               style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                              View Stripe Receipt
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>
                    `
                        : ""
                    }
                    
                    ${applicationDetailsHtml}
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <p style="margin: 24px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Your ${applicationTypeLower} application payment has been confirmed. Your participation is now fully processed. You can view all your application details through your vendor dashboard.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://localhost:5000/vendor/dashboard" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="48%" strokecolor="#10b981" fillcolor="#10b981">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">View Dashboard</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="http://localhost:5000/vendor/dashboard" 
                             style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39); border: 1px solid rgba(16, 185, 129, 0.2); line-height: 20px; mso-hide: all;">
                            View Dashboard
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <!-- Info Notice -->
                    <div style="margin-top: 32px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;">
                        <strong>Need Help?</strong> If you have any questions about this transaction, please contact our support team or visit your vendor dashboard.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                      This is an automated receipt for your records. Please keep this email for your reference.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                      <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                        © 2025 Eventy Platform. All rights reserved.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                        Campus Event Management System
                      </p>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    replyTo: process.env.EMAIL_USER,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo", // Content ID for embedding in HTML
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Vendor payment receipt sent to ${vendor.email}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      applicationType: application.type,
      transactionId: transaction._id,
      stripeReceiptUrl: stripeReceiptUrl ? "included" : "not available",
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    logger.error(
      `❌ Error sending vendor payment receipt to ${vendor.email}:`,
      error?.message || error
    );
    // Don't throw - log error but don't fail the payment confirmation
  }
};

/**
 * Send workshop attendance certificate email to a participant
 * @param {Object} attendee - Attendee user object with email, name/firstName/lastName, and role
 * @param {Object} workshop - Workshop event object with name, startDate, endDate, professors, etc.
 */
export const sendWorkshopCertificateEmail = async (attendee, workshop) => {
  try {
    // Add title prefix for professors
    const namePrefix =
      attendee?.role?.toLowerCase() === "professor" ? "Professor " : "";
    const displayName =
      (
        attendee?.name ||
        [attendee?.firstName, attendee?.lastName].filter(Boolean).join(" ")
      ).trim() || "Participant";
    const fullDisplayName = namePrefix + displayName;

    const attendeeEmail = attendee?.email;
    if (!attendeeEmail) {
      logger.error("❌ Attendee email not found");
      return;
    }

    // Format workshop dates
    const startDate = new Date(workshop.startDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const endDate = new Date(workshop.endDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Get professor names
    const professorNames =
      workshop.professors && workshop.professors.length > 0
        ? workshop.professors
            .map(
              (prof) =>
                prof?.name ||
                [prof?.firstName, prof?.lastName].filter(Boolean).join(" ")
            )
            .join(", ")
        : "N/A";

    // Path to logo image
    const logoPath = path.resolve(
      __dirname,
      "../../../../client/public/images/logo-light.png"
    );

    const mailOptions = {
      from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
      to: attendeeEmail,
      subject: `Certificate of Attendance - ${workshop.name}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate of Attendance</title>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 700px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                  
                  <!-- Header with Logo and Gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                      <img src="cid:logo" alt="Eventy Logo" style="height: 120px; width: auto; display: block; margin: 0 auto 20px;" />
                      <div style="margin-top: 20px; padding: 10px 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);">
                        <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #92400e; line-height: 1.2;">
                          🎓 Certificate of Attendance
                        </h1>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Certificate Content -->
                  <tr>
                    <td style="padding: 50px 40px;">
                      
                      <!-- Congratulatory Message at Top -->
                      <div style="margin-bottom: 32px; padding: 20px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 8px; border-left: 4px solid #10b981;">
                        <p style="margin: 0; font-size: 15px; color: #065f46; line-height: 1.6; text-align: center;">
                          <strong>Congratulations!</strong> Your commitment to professional development is commendable. We hope this workshop has enriched your knowledge and skills.
                        </p>
                      </div>
                      
                      <!-- Decorative Border -->
                      <div style="border: 4px solid #6366f1; border-radius: 12px; padding: 40px 30px; background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);">
                        
                        <h2 style="margin: 0 0 24px; font-size: 22px; font-weight: 700; color: #1f2937; text-align: center; letter-spacing: 0.5px; text-transform: uppercase;">
                          This Certifies That
                        </h2>
                        
                        <!-- Attendee Name - Large and Prominent -->
                        <div style="margin: 32px 0; text-align: center; padding: 24px 20px; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 8px; border-left: 4px solid #6366f1;">
                          <h3 style="margin: 0; font-size: 32px; font-weight: 700; color: #4338ca; font-family: Georgia, serif; letter-spacing: 1px;">
                            ${fullDisplayName}
                          </h3>
                        </div>
                        
                        <p style="margin: 24px 0; font-size: 16px; line-height: 1.8; color: #374151; text-align: center;">
                          has successfully attended and completed
                        </p>
                        
                        <!-- Workshop Name - Highlighted -->
                        <div style="margin: 24px 0; text-align: center; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; border-left: 4px solid #f59e0b;">
                          <h4 style="margin: 0; font-size: 24px; font-weight: 700; color: #92400e; font-family: Georgia, serif;">
                            ${workshop.name}
                          </h4>
                        </div>
                        
                        <!-- Workshop Details -->
                        <div style="margin: 32px 0; padding: 24px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 10px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                                Workshop Duration:
                              </td>
                              <td style="padding: 10px 0; font-size: 15px; color: #1f2937; text-align: right;">
                                ${startDate} - ${endDate}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                                Location:
                              </td>
                              <td style="padding: 10px 0; font-size: 15px; color: #1f2937; text-align: right;">
                                ${workshop.location || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                                Faculty:
                              </td>
                              <td style="padding: 10px 0; font-size: 15px; color: #1f2937; text-align: right;">
                                ${workshop.faculty || "N/A"}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                                Instructors:
                              </td>
                              <td style="padding: 10px 0; font-size: 15px; color: #1f2937; text-align: right;">
                                ${professorNames}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; font-size: 14px; color: #6b7280; font-weight: 600;">
                                Issued Date:
                              </td>
                              <td style="padding: 10px 0; font-size: 15px; color: #1f2937; text-align: right;">
                                ${new Date().toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </td>
                            </tr>
                          </table>
                        </div>
                        
                        <!-- Signature Section -->
                        <div style="margin-top: 40px; padding-top: 24px; border-top: 2px solid #e5e7eb; text-align: center;">
                          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 600;">
                            Issued by
                          </p>
                          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1f2937; font-family: Georgia, serif;">
                            Eventy Platform
                          </p>
                          <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">
                            Campus Event Management System
                          </p>
                        </div>
                        
                      </div>
                      
                      <!-- Action Button -->
                      <table role="presentation" style="width: 100%; margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="http://localhost:5000/my-events" 
                               style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4); border: 1px solid rgba(99, 102, 241, 0.2); line-height: 20px;">
                              View My Events
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280; line-height: 1.6; text-align: center;">
                        This is an official certificate of attendance. Please save this email for your records.
                      </p>
                      <div style="text-align: center; margin: 20px 0;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                          © 2025 Eventy Platform. All rights reserved.
                        </p>
                        <p style="margin: 8px 0 0; font-size: 11px; color: #d1d5db;">
                          Campus Event Management System
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      replyTo: process.env.EMAIL_USER,
      attachments: [
        {
          filename: "logo-light.png",
          path: logoPath,
          cid: "logo",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `✅ Workshop certificate sent to ${attendeeEmail} for workshop "${workshop.name}":`,
      {
        messageId: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
        workshopName: workshop.name,
        attendeeName: fullDisplayName,
      }
    );

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return true;
  } catch (error) {
    logger.error(
      `❌ Error sending certificate email to ${attendee?.email}:`,
      error?.message || error
    );
    return false;
  }
};

/**
 * Send comment deletion warning email to user
 * @param {Object} params - Email parameters
 * @param {string} params.userName - Full name of the user
 * @param {string} params.userEmail - User's email address
 * @param {string} params.eventName - Name of the event
 * @param {string} params.commentBody - The deleted comment text
 */
export const sendCommentDeletionWarning = async ({
  userName,
  userEmail,
  eventName,
  commentBody,
}) => {
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "⚠️ Comment Removed - Content Policy Violation",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comment Removed</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Warning Badge -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #991b1b; line-height: 1.2;">
                        ⚠️ Comment Removed
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Dear ${userName},
                    </h2>
                    
                    <!-- Warning Box -->
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 24px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 15px; color: #991b1b; line-height: 1.6; font-weight: 600;">
                        ⚠️ Warning: One of your comments has been removed by our admin team for violating our community guidelines.
                      </p>
                    </div>
                    
                    <!-- Event Info -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 20px; margin: 32px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <p style="margin: 0 0 8px; font-size: 14px; color: #718096; font-weight: 600;">
                        Event:
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #1a202c; font-weight: 700;">
                        ${eventName}
                      </p>
                    </div>
                    
                    <!-- Deleted Comment Box -->
                    <div style="background-color: #ffffff; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px; font-size: 13px; color: #991b1b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Your Comment:
                      </p>
                      <p style="margin: 0; font-size: 15px; color: #6b7280; font-style: italic; line-height: 1.6; padding: 12px; background-color: #f9fafb; border-radius: 4px;">
                        "${commentBody}"
                      </p>
                    </div>
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <!-- Guidelines -->
                    <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #1a202c;">
                      Community Guidelines
                    </h3>
                    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #4a5568;">
                      Please ensure your future comments comply with our community standards:
                    </p>
                    <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 15px; line-height: 1.8; color: #4a5568;">
                      <li style="margin-bottom: 8px;">Be respectful and courteous to others</li>
                      <li style="margin-bottom: 8px;">Avoid offensive or inappropriate language</li>
                      <li style="margin-bottom: 8px;">Stay on topic and provide constructive feedback</li>
                      <li style="margin-bottom: 8px;">Do not spam or post promotional content</li>
                    </ul>
                    
                    <!-- Important Notice -->
                    <div style="background-color: #fff5f5; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
                        <strong>Important:</strong> Repeated violations may result in account restrictions or suspension.
                      </p>
                    </div>
                    
                   
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <p style="margin: 24px 0 0; font-size: 15px; line-height: 1.6; color: #4a5568;">
                      If you believe this was a mistake, please contact our support team at <a href="mailto:${process.env.EMAIL_USER}" style="color: #667eea; text-decoration: underline; font-weight: 600;">${process.env.EMAIL_USER}</a>.
                    </p>
                    
                    <p style="margin: 20px 0 0; font-size: 15px; line-height: 1.6; color: #4a5568;">
                      Best regards,<br>
                      <strong>The Eventy Team</strong>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                      This is an automated message. Please do not reply to this email.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                      <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                        © ${new Date().getFullYear()} Eventy Platform. All rights reserved.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                        Campus Event Management System
                      </p>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    replyTo: process.env.EMAIL_USER,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Comment deletion warning email sent to ${userEmail}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return true;
  } catch (error) {
    logger.error(
      `❌ Error sending comment deletion warning email to ${userEmail}:`,
      error?.message || error
    );
    return false;
  }
};

/**
 * Send event registration confirmation email with calendar invite
 * @param {Object} user - User object with email and name
 * @param {Object} event - Event details
 */
export const sendEventRegistrationWithCalendar = async (user, event) => {
  try {
    const {
      generateICSFile,
      generateGoogleCalendarLink,
      generateOutlookCalendarLink,
    } = await import("../../utils/ics-generator.js");

    const namePrefix =
      user?.role?.toLowerCase() === "professor" ? "Professor " : "";
    const displayName =
      (
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ")
      ).trim() || "there";
    const fullDisplayName = namePrefix + displayName;

    // Format dates
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const formattedStartDate = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedStartTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate calendar links
    const googleCalendarLink = generateGoogleCalendarLink({
      name: event.name,
      description:
        event.description || "Event details available on Eventy platform",
      location: event.location || "TBD",
      startDate: event.startDate,
      endDate: event.endDate,
    });

    const outlookCalendarLink = generateOutlookCalendarLink({
      name: event.name,
      description:
        event.description || "Event details available on Eventy platform",
      location: event.location || "TBD",
      startDate: event.startDate,
      endDate: event.endDate,
    });

    // Generate ICS file for attachment
    const icsContent = generateICSFile({
      name: event.name,
      description:
        event.description || "Event details available on Eventy platform",
      location: event.location || "TBD",
      startDate: event.startDate,
      endDate: event.endDate,
      url: `http://localhost:5000/events/${event._id}`,
    });

    // Path to logo image
    const logoPath = path.resolve(
      __dirname,
      "../../../../client/public/images/logo-light.png"
    );

    const mailOptions = {
      from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
      to: user?.email,
      subject: `✅ Registration Confirmed - ${event.name}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Registration Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                  
                  <!-- Header with Logo and Gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center;">
                      <img src="cid:logo" alt="Eventy Logo" style="height: 100px; width: auto; display: block; margin: 0 auto;" />
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 50px 40px 40px;">
                      <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                        🎉 You're Registered!
                      </h2>
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                        Hi ${fullDisplayName},
                      </p>
                      <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                        Your registration for <strong>${event.name}</strong> has been confirmed!
                      </p>
                      
                      <!-- Event Details Card -->
                      <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border-left: 4px solid #667eea;">
                        <h3 style="margin: 0 0 24px; font-size: 20px; font-weight: 700; color: #2d3748;">
                          📅 Event Details
                        </h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #718096; font-size: 14px; font-weight: 600;">Event:</td>
                            <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 700;">${event.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #718096; font-size: 14px; font-weight: 600;">Date:</td>
                            <td style="padding: 8px 0; color: #2d3748; font-size: 14px;">${formattedStartDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #718096; font-size: 14px; font-weight: 600;">Time:</td>
                            <td style="padding: 8px 0; color: #2d3748; font-size: 14px;">${formattedStartTime}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #718096; font-size: 14px; font-weight: 600;">Location:</td>
                            <td style="padding: 8px 0; color: #2d3748; font-size: 14px;">${event.location || "TBD"}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Add to Calendar Buttons -->
                      <div style="margin: 32px 0; padding: 24px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
                        <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #065f46;">
                          📆 Add to Your Calendar
                        </h3>
                        <p style="margin: 0 0 20px; font-size: 14px; color: #047857;">
                          Don't miss this event! Click below to add it to your calendar:
                        </p>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0;">
                              <a href="${googleCalendarLink}" style="display: inline-block; width: 100%; padding: 12px 24px; background: linear-gradient(135deg, #4285f4 0%, #34a853 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">
                                📅 Add to Google Calendar
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <a href="${outlookCalendarLink}" style="display: inline-block; width: 100%; padding: 12px 24px; background: linear-gradient(135deg, #0078d4 0%, #00bcf2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);">
                                📅 Add to Outlook Calendar
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 16px 0 0; font-size: 12px; color: #047857;">
                          💡 An .ics file is attached to this email. You can also import it directly to any calendar app.
                        </p>
                      </div>
                      
                      <!-- Important Information -->
                      <div style="margin-top: 32px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <p style="margin: 0 0 12px; font-size: 14px; color: #92400e; font-weight: 600;">
                          ⚠️ Important:
                        </p>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #92400e; line-height: 1.8;">
                          <li>Please arrive 15 minutes early</li>
                          <li>Check your email for any updates</li>
                          <li>Bring your student ID for verification</li>
                        </ul>
                      </div>
                      
                      <!-- Call to Action -->
                      <div style="text-align: center; margin: 40px 0 0;">
                        <a href="http://localhost:5000/my-events" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                          View My Events
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 16px; font-size: 13px; color: #718096; line-height: 1.6; text-align: center;">
                        If you have any questions, please contact the Events Office.
                      </p>
                      <div style="text-align: center; margin: 20px 0;">
                        <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                          © 2025 Eventy Platform. All rights reserved.
                        </p>
                        <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e0;">
                          Campus Event Management System
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      replyTo: process.env.EMAIL_USER,
      attachments: [
        {
          filename: "logo-light.png",
          path: logoPath,
          cid: "logo",
        },
        {
          filename: `${event.name.replace(/[^a-z0-9]/gi, "_")}.ics`,
          content: icsContent,
          contentType: "text/calendar; charset=utf-8; method=REQUEST",
        },
      ],
      // This header helps Gmail show the "Add to Calendar" prompt
      icalEvent: {
        filename: "invite.ics",
        method: "request",
        content: icsContent,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `✅ Event registration email with calendar invite sent to ${user?.email}:`,
      {
        messageId: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
      }
    );

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return true;
  } catch (error) {
    logger.error(
      `❌ Error sending event registration email:`,
      error?.message || error
    );
    return false;
  }
};

/**
 * Send waitlist autopay success email - when user is automatically registered via autopay
 * @param {Object} user - User object with email and name
 * @param {Object} event - Event object with details
 * @param {number} amount - Amount charged (0 for free events)
 */
export const sendWaitlistAutopaySuccessEmail = async (
  user,
  event,
  amount = 0
) => {
  const namePrefix =
    user?.role?.toLowerCase() === "professor" ? "Professor " : "";
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";
  const fullDisplayName = namePrefix + displayName;

  // Format event date
  const eventDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBA";

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: `✅ Auto-Registered: ${event.name}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auto-Registered for Event</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #065f46; line-height: 1.2;">
                        ✅ Auto-Registered
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Hi ${fullDisplayName},
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Great news! A spot became available for an event you were on the waitlist for, and you've been automatically registered!
                    </p>
                    
                    <!-- Event Details Box -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #10b981; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                          Event Details
                        </h3>
                      </div>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Event Name:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">${event.name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Date:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${eventDate}</td>
                        </tr>
                        ${
                          amount > 0
                            ? `
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Amount Charged:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #10b981; font-weight: 700; text-align: right;">$${amount.toFixed(2)}</td>
                        </tr>
                        `
                            : ""
                        }
                      </table>
                    </div>
                    
                    <p style="margin: 32px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      ${amount > 0 ? `Payment has been automatically processed from your selected payment method. ` : ""}You're all set! We look forward to seeing you at the event.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/events/${event._id}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                        View Event Details
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background: #f7fafc; text-align: center; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.6;">
                      This is an automated notification from Eventy Platform.<br>
                      If you have any questions, please contact support.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.warn("✅ Waitlist autopay success email sent:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return true;
  } catch (error) {
    logger.error(
      "❌ Error sending waitlist autopay success email:",
      error?.message || error
    );
    return false;
  }
};

/**
 * Send waitlist spot available email - when a spot becomes available but no autopay
 * @param {Object} user - User object with email and name
 * @param {Object} event - Event object with details
 */
export const sendWaitlistSpotAvailableEmail = async (user, event) => {
  const namePrefix =
    user?.role?.toLowerCase() === "professor" ? "Professor " : "";
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";
  const fullDisplayName = namePrefix + displayName;

  // Format event date
  const eventDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBA";

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: `🎟️ Spot Available: ${event.name}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Spot Available</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #92400e; line-height: 1.2;">
                        🎟️ Spot Available
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Hi ${fullDisplayName},
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Great news! A spot has become available for an event you were on the waitlist for. Register now to secure your place!
                    </p>
                    
                    <!-- Event Details Box -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #f59e0b; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                          Event Details
                        </h3>
                      </div>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Event Name:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">${event.name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Date:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${eventDate}</td>
                        </tr>
                        ${
                          event.price > 0
                            ? `
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Price:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">$${event.price.toFixed(2)}</td>
                        </tr>
                        `
                            : ""
                        }
                      </table>
                    </div>
                    
                    <p style="margin: 32px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      <strong>Hurry!</strong> Spots are limited and available on a first-come, first-served basis. Register now to secure your place.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/events/${event._id}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                        Register Now
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background: #f7fafc; text-align: center; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.6;">
                      This is an automated notification from Eventy Platform.<br>
                      If you have any questions, please contact support.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.warn("✅ Waitlist spot available email sent:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return true;
  } catch (error) {
    logger.error(
      "❌ Error sending waitlist spot available email:",
      error?.message || error
    );
    return false;
  }
};

/**
 * Send waitlist autopay failed email - when autopay fails
 * @param {Object} user - User object with email and name
 * @param {Object} event - Event object with details
 * @param {string} reason - Reason for failure
 */
export const sendWaitlistAutopayFailedEmail = async (user, event, reason) => {
  const namePrefix =
    user?.role?.toLowerCase() === "professor" ? "Professor " : "";
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";
  const fullDisplayName = namePrefix + displayName;

  // Format event date
  const eventDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBA";

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: `⚠️ Autopay Failed: ${event.name}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Autopay Failed</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #991b1b; line-height: 1.2;">
                        ⚠️ Autopay Failed
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Hi ${fullDisplayName},
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      A spot became available for an event you were on the waitlist for, but automatic payment failed. Please register manually to secure your spot.
                    </p>
                    
                    <!-- Event Details Box -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #ef4444; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                          Event Details
                        </h3>
                      </div>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Event Name:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">${event.name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Date:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${eventDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Reason:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #ef4444; text-align: right;">${reason}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="margin: 32px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      <strong>Action Required:</strong> Please register manually to secure your spot. Spots are limited and available on a first-come, first-served basis.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/events/${event._id}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                        Register Now
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background: #f7fafc; text-align: center; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.6;">
                      This is an automated notification from Eventy Platform.<br>
                      If you have any questions, please contact support.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.warn("✅ Waitlist autopay failed email sent:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return true;
  } catch (error) {
    logger.error(
      "❌ Error sending waitlist autopay failed email:",
      error?.message || error
    );
    return false;
  }
};

/**
 * Send waitlist payment required email - when card payment needs to be completed
 * @param {Object} user - User object with email and name
 * @param {Object} event - Event object with details
 */
export const sendWaitlistPaymentRequiredEmail = async (user, event) => {
  const namePrefix =
    user?.role?.toLowerCase() === "professor" ? "Professor " : "";
  const displayName =
    (
      user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    ).trim() || "there";
  const fullDisplayName = namePrefix + displayName;

  // Format event date
  const eventDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBA";

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  const mailOptions = {
    from: `"Eventy Platform" <${process.env.EMAIL_USER}>`,
    to: user?.email,
    subject: `💳 Complete Payment: ${event.name}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Payment</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden;">
                
                <!-- Header with Logo and Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative; border-radius: 16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height: 140px; width: auto; display: block; margin: 0 auto 16px;" />
                    <div style="margin-top: 20px; padding: 8px 16px; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: #3730a3; line-height: 1.2;">
                        💳 Payment Required
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Hi ${fullDisplayName},
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      A spot became available for an event you were on the waitlist for. Please complete your card payment to finalize your registration.
                    </p>
                    
                    <!-- Event Details Box -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #6366f1; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #2d3748;">
                          Event Details
                        </h3>
                      </div>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Event Name:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">${event.name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Date:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${eventDate}</td>
                        </tr>
                        ${
                          event.price > 0
                            ? `
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
                            Amount:
                          </td>
                          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; font-weight: 700; text-align: right;">$${event.price.toFixed(2)}</td>
                        </tr>
                        `
                            : ""
                        }
                      </table>
                    </div>
                    
                    <p style="margin: 32px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      <strong>Action Required:</strong> Complete your card payment to secure your spot. Your registration will be finalized once payment is confirmed.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/events/${event._id}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                        Complete Payment
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background: #f7fafc; text-align: center; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.6;">
                      This is an automated notification from Eventy Platform.<br>
                      If you have any questions, please contact support.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: "logo-light.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.warn("✅ Waitlist payment required email sent:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      logger.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return true;
  } catch (error) {
    logger.error(
      "❌ Error sending waitlist payment required email:",
      error?.message || error
    );
    return false;
  }
};
