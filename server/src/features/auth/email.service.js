import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

export const sendVerificationEmail = async (user) => {
 const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // expires in 1 day
  );

  const verificationLink = `http://localhost:5000/api/auth/verify?token=${token}`;

 const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

  const mailOptions = {
    from: `"Eventy Verification" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Verify Your Eventy Account",
    html: `
      <h2>Account Verification</h2>
      <p>Your admin has approved your role. Please click the link below to verify your account:</p>
      <a href="${verificationLink}" target="_blank">Verify My Account</a>
    `,
  };

  await transporter.sendMail(mailOptions);
};
