import nodemailer from "nodemailer";
import dotenv from "dotenv";

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
