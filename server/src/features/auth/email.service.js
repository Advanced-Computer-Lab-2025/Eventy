import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { format } from "date-fns";

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
    console.error("❌ Email transporter verification failed:", err.message);
  } else {
    console.log("✅ Email transporter is ready:", success);
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
    console.log("✅ Email send attempt:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      response: info?.response,
      envelope: info?.envelope,
    });

    if (info?.rejected && info.rejected.length > 0) {
      console.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    console.error("❌ Error sending email:", error?.message || error);
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
    console.log("✅ Verification email sent:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      console.error("⚠️ Some recipients were rejected:", info.rejected);
    }

    return verificationToken; // Return token for testing purposes
  } catch (error) {
    console.error(
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
    console.log(`✅ Cancellation email sent to ${user.email}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      console.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    console.error(
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
                          <td style="padding: 10px 0; font-size: 14px; color: #718096; font-weight: 600;">
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
    console.log(`✅ Update email sent to ${user.email}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    if (info?.rejected && info.rejected.length > 0) {
      console.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    console.error(
      `❌ Error sending update email to ${user.email}:`,
      error?.message || error
    );
    // Don't throw - log error but don't fail the update
  }
};

/**
 * Send application status notification email to vendor
 * @param {Object} vendor - Vendor user object with email and companyName
 * @param {Object} application - Application object with type, status, and event details
 */
export const sendVendorApplicationStatusEmail = async (vendor, application) => {
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
  const eventName = application.event?.name || null;

  // Determine status display
  const isApproved = application.status === "approved";
  const statusText = isApproved ? "Approved" : "Rejected";
  const statusColor = isApproved ? "#10b981" : "#ef4444";
  const statusBgGradient = isApproved
    ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
    : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
  const statusTextColor = isApproved ? "#065f46" : "#991b1b";

  // Path to logo image
  const logoPath = path.resolve(
    __dirname,
    "../../../../client/public/images/logo-light.png"
  );

  // Build application details HTML
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
          <td style="padding: 10px 0; font-size: 15px; color: #1a202c; text-align: right;">${application.durationWeeks} week${application.durationWeeks > 1 ? "s" : ""}</td>
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
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application ${statusText}</title>
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
                    <div style="margin-top: 20px; padding: 8px 16px; background: ${statusBgGradient}; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px ${statusColor}40;">
                      <h1 style="margin: 0; font-size: 16px; font-weight: 700; color: ${statusTextColor}; line-height: 1.2;">
                        Application ${statusText}
                      </h1>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 50px 40px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a202c; line-height: 1.3;">
                      Hi ${displayName},
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      ${
                        isApproved
                          ? `Great news! Your ${applicationTypeLower} application has been <strong style="color: ${statusColor};">${statusText.toLowerCase()}</strong>. We're excited to have you participate!`
                          : `We regret to inform you that your ${applicationTypeLower} application has been <strong style="color: ${statusColor};">${statusText.toLowerCase()}</strong>.`
                      }
                    </p>
                    
                    ${applicationDetailsHtml}
                    
                    ${
                      isApproved
                        ? `
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    <p style="margin: 24px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      Your application has been reviewed and approved. We are excited to have you join us ! You can view all your application details through your vendor dashboard.
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
                    `
                        : `
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    <p style="margin: 24px 0 20px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                      We sincerely apologize for any inconvenience this may cause. We appreciate your interest in participating. If you have any questions about this decision or would like to apply for other events, please don't hesitate to contact the Events Office.
                    </p>
                    
                    <!-- Reapply CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://localhost:5000/vendor/dashboard" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="48%" strokecolor="#10b981" fillcolor="#10b981">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Reapply</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="http://localhost:5000/vendor/dashboard" 
                             style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39); border: 1px solid rgba(16, 185, 129, 0.2); line-height: 20px; mso-hide: all;">
                            Reapply
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                    `
                    }
                    
                    <!-- Divider -->
                    <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>
                    
                    <!-- Alternative Link Fallback -->
                    <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px; font-size: 13px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${isApproved ? "Button not working?" : "Need help?"}
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #4a5568; line-height: 1.6;">
                        ${
                          isApproved
                            ? `<a href="http://localhost:5000/vendor/dashboard" style="color: #667eea; text-decoration: underline; font-weight: 600;">Click here to view your dashboard</a>`
                            : `<a href="http://localhost:5000/vendor/dashboard" style="color: #667eea; text-decoration: underline; font-weight: 600;">Click here to reapply</a> or contact the <a href="mailto:events@guc.edu.eg" style="color: #667eea; text-decoration: underline; font-weight: 600;">Events Office</a>`
                        }
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
    console.log(`✅ Vendor application status email sent to ${vendor.email}:`, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      applicationType: application.type,
      status: application.status,
    });

    if (info?.rejected && info.rejected.length > 0) {
      console.error("⚠️ Some recipients were rejected:", info.rejected);
    }
  } catch (error) {
    console.error(
      `❌ Error sending vendor application status email to ${vendor.email}:`,
      error?.message || error
    );
    // Don't throw - log error but don't fail the status update
  }
};
/**
 * Sends a payment receipt email to the user
 * @param {Object} user - User object with email and name
 * @param {Object} transaction - Transaction details
 * @param {Object|null} event - Event details (null for wallet top-ups)
 */
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
        <style>
          body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background:linear-gradient(135deg,#f0f9ff 0%,#e0e7ff 50%,#fce7f3 100%); color:#1a202c; }
          .text-secondary { color:#4a5568; }
          .card { background-color:#fff; border-radius:16px; }
          .amount-box { background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%); border-radius:12px; padding:28px; text-align:center; border-left:4px solid #10b981; }
          .transaction-box { background:linear-gradient(135deg,#f7fafc 0%,#edf2f7 100%); border-radius:12px; padding:28px; }
          a.button { display:inline-block; padding:16px 48px; background:linear-gradient(135deg,#10b981 0%,#059669 100%); color:#fff; text-decoration:none; border-radius:25px; font-weight:600; font-size:16px; }
        </style>
      </head>
      <body>
        <table role="presentation" style="width:100%;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" style="max-width:600px;width:100%;" class="card">
                <tr>
                  <td style="background:linear-gradient(135deg,#dbeafe 0%,#e0e7ff 50%,#fce7f3 100%);padding:48px 40px;text-align:center;border-radius:16px 16px 0 0;">
                    <img src="cid:logo" alt="Eventy Logo" style="height:140px;width:auto;margin:0 auto 16px;display:block;" />
                    <h1 style="margin:0;font-size:16px;font-weight:700;color:#065f46;">Payment Confirmed ✓</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:50px 40px 40px;">
                    <h2 style="margin:0 0 16px;font-size:28px;font-weight:700;">Thank you, ${fullDisplayName}! 🎉</h2>
                    <p class="text-secondary">Your payment has been successfully processed. Below are the details of your transaction.</p>
                    <div class="amount-box">
                      <p style="margin:0 0 8px;font-size:14px;font-weight:600;text-transform:uppercase;">Amount Paid</p>
                      <div style="font-size:36px;font-weight:700;color:#047857;">$${formattedAmount}</div>
                    </div>
                    <div class="transaction-box">
                      <table style="width:100%;border-collapse:collapse;">
                        <tr>
                          <td style="padding:12px 0;font-weight:600;">Transaction ID:</td>
                          <td style="padding:12px 0;text-align:right;font-family:monospace;">${transaction._id}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;font-weight:600;">Date:</td>
                          <td style="padding:12px 0;text-align:right;">${formattedDate}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;font-weight:600;">Event:</td>
                          <td style="padding:12px 0;font-weight:700;text-align:right;">${eventName}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;font-weight:600;">Payment Method:</td>
                          <td style="padding:12px 0;text-align:right;">${paymentMethodDisplay}</td>
                        </tr>
                        <tr>
                          <td style="padding:16px 0 0;font-weight:700;">Total Paid:</td>
                          <td style="padding:16px 0 0;font-weight:700;color:#10b981;text-align:right;">${formattedAmount}</td>
                        </tr>
                      </table>
                    </div>
                    <p>
                      ${
                        event
                          ? `Your registration for <strong>${eventName}</strong> is now confirmed. We look forward to seeing you at the event!`
                          : `Your wallet has been successfully topped up. You can now use your balance for future event payments.`
                      }
                    </p>
                    <a href="http://localhost:5000/my-events" class="button">View My Events</a>
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
    console.log(
      `✅ Payment receipt sent to ${user.email} for transaction ${transaction._id}:`,
      {
        messageId: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
      }
    );
    if (info?.rejected?.length)
      console.error("⚠ Some recipients were rejected:", info.rejected);
  } catch (error) {
    console.error(
      `❌ Error sending payment receipt to ${user.email}:`,
      error?.message || error
    );
  }
};
