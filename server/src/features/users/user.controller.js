import { User } from "../users/User.model.js";
import { sendVerificationEmail } from "../auth/email.service.js";

export const verifyStaffByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only Staff, TA, or Professor
    if (!["staff", "ta", "professor"].includes(user.role)) {
      return res.status(400).json({ message: "Only staff, TA, or professor can be verified by admin." });
    }

    // Mark as admin-verified (user still needs to click email)
    user.roleVerifiedByAdmin = true;
    await user.save();

    // Send verification email with JWT
    await sendVerificationEmail(user);

    res.json({ message: `Verification email sent to ${user.email}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
