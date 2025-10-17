import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // your App Password
  },
});

export const sendRegistrationEmail = async (user) => {
  const mailOptions = {
    from: `"Eventy" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Welcome to Eventy 🎉",
    html: `
      <h2>Hi ${user.name},</h2>
      <p>Welcome to Eventy! Your registration was successful.</p>
      <p><a href="http://localhost:5173/login">Click here to login</a></p>
      <p>See you soon 👋</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully via Gmail");
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};
