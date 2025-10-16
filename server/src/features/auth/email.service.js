import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (user) => {
  try {
    const response = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: user.email,
      subject: "Verify Your Account",
      html: `<p>Hi ${user.firstName || "User"}, verify your email:
        <a href="http://localhost:4000/verify?token=${user.verificationToken}">
        Verify Email</a></p>`,
    });

    console.log("✅ Resend response:", response);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
};
