import bcrypt from "bcryptjs";
import { User } from "./user.model.js";
import ApiError from "../../utils/ApiError.js"

class UserService {
    // Service to create admin or events office account
    async createManagementAccount(data) {
        const { firstName, lastName, email, password, role } = data;

        //  Validate role
        if (!["admin", "events_office"].includes(role)) {
            throw new Error("Invalid role. Only admin or events_office accounts can be created using this endpoint.");
        }

        //  Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            //  Throw the ApiError with 409 status code
            throw new ApiError(409, "Email already exists."); 
         }


        //  Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //  Create user
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            status: "active", // directly active
        });

        return newUser;
    };
    async deleteManagementAccount(currentAdminId, targetUserId) {
    if (currentAdminId.toString() === targetUserId.toString()) {
        throw new ApiError(403, "You cannot delete your own account.");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new ApiError(404, "Target user not found.");

    const allowedRoles = ["admin", "events_office"];
    if (!allowedRoles.includes(targetUser.role)) {
        throw new ApiError(403, "Cannot delete non-management accounts using this endpoint.");
    }

    if (!targetUser.deletedAt) {
        targetUser.deletedAt = new Date();
        targetUser.status = "deleted";
        await targetUser.save();
    }

    return targetUser;
    }


  // 🧩 Get all users (Admin only)
  async getAllUsers(req) {
    try {
      // Ensure only admins can access this
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Access denied. Admins only.");
      }

      const users = await User.find(
      { status: { $in: ["active", "blocked"] } }, // ✅ Filter condition
      "-password" // Exclude password
     )  // exclude password
        .sort({ createdAt: -1 })                    // newest first
        .select("firstName lastName email role status deletedAt createdAt updatedAt");

      if (!users || users.length === 0) {
        throw new ApiError(404, "No users found.");
      }

      return users;

    } catch (err) {
      // Re-throw known ApiErrors, wrap others
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, `Error retrieving users: ${err.message}`);
    }
  }
}
export default new UserService();