import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // App Password (requires 2FA)
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
  const displayName = (user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")).trim() || "there";

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
  const namePrefix = user?.role?.toLowerCase() === 'professor' ? 'Professor ' : '';
  const displayName = (user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ")).trim() || "there";
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
    professor: "As a professor, you'll have access to create workshops, manage academic events, and engage with students.",
    staff: "As a staff member, you'll be able to view and manage campus events and activities.",
    ta: "As a teaching assistant, you'll have access to event management and student engagement tools."
  };
  const roleDescription = roleDescriptions[user?.role?.toLowerCase()] || "You'll have access to all the features available for your role.";

  // Path to logo image
  const logoPath = path.resolve(__dirname, '../../../../client/public/images/logo-light.png');

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
                  <td style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #fce7f3 100%); padding: 48px 40px; text-align: center; position: relative;">
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
        filename: 'logo-light.png',
        path: logoPath,
        cid: 'logo' // Content ID for embedding in HTML
      }
    ]
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
    console.error("❌ Error sending verification email:", error?.message || error);
    throw new Error("Failed to send verification email");
  }
};
