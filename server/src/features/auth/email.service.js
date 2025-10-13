// server/src/features/auth/email.service.js
import { Resend } from "resend";

const resend = new Resend("re_MF5gwFkP_5c8hsV5JJxo8Y7BUgBdU4jhG");

export const sendVerificationEmail = async (user) => {
  // You can customize this as needed
  const email = user.email;
  const name = user.firstName || user.companyName || "User";

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Verify Your Account",
    html: `<p>Hi ${name}, please verify your email by clicking this link: <a href="http://localhost:4000/verify?token=${user.verificationToken}">Verify Email</a></p>`,
  });

  return true;
};
