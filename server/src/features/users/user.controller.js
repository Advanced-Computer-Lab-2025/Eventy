import { User } from "./user.model.js";
import {
  UserValidation,
  createManagementAccountSchema,
} from "./user.validation.js";
import {
  sendRegistrationEmail,
  sendVerificationEmail,
} from "../auth/email.service.js";

import UserService from "./user.service.js";

// Controller class — import this and call its static methods in routes
export default class UserController {
  static async createManagementAccount(req, res) {
    try {
      const userData = req.body;

      // Validate incoming data
      const { error } = createManagementAccountSchema.validate(userData);
      if (error) {
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      }

      // Create the account
      const user = await UserService.createManagementAccount(userData);

      return res.status(201).json({
        success: true,
        message: "Management account created successfully",
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
  // GET /api/users/pending --> The users that are not assigned a role yet
  static async getPendingUsers(req, res) {
    try {
      const pending = await User.find({ status: "pending", role: null }).select(
        "-password"
      );
      return res.status(200).json({ success: true, data: pending });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // PATCH /api/users/:id/assign-role
  static async assignRole(req, res) {
    try {
      const payload = {
        ...req.body,
        userId: req.params.id,
      };
      const { error } = UserValidation.assignRole.validate(payload);
      if (error) {
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      }

      const { role } = req.body;
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      if (!(user.status === "pending" && user.role === null)) {
        return res.status(400).json({
          success: false,
          message:
            "User cannot be assigned a role at this stage (must be pending & unassigned)",
        });
      }

      user.role = role;
      await user.save();

      // Send verification email for staff, TA, and professor roles
      if (role === "staff" || role === "ta" || role === "professor") {
        await sendVerificationEmail(user);
      } else {
        await sendRegistrationEmail(user);
      }

      return res.status(200).json({
        success: true,
        message: `Role '${role}' assigned successfully`,
        data: { userId: user._id, role: user.role },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // make this static so routes can call UserController.deleteManagementAccount
  static async deleteManagementAccount(req, res, next) {
    try {
      const targetUserId = req.params.id;
      const currentAdminId = req.user._id;

      // Service will throw ApiError(403) for self-delete or ApiError(404) for not found.
      await UserService.deleteManagementAccount(currentAdminId, targetUserId);

      // 204 No Content is the appropriate response for successful deletion
      return res.status(204).send();
    } catch (err) {
      // Pass errors to the central error middleware
      return next(err);
    }
  }
  // GET /api/admin/users — List all users (Admin only)
  static async getAllUsers(req, res, next) {
    try {
      const users = await UserService.getAllUsers(req); // ✅ Pass req here
      res.status(200).json({ status: "success", data: users });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/users/me - update current user's profile (companyLogoUrl, taxCardUrl, companyName)
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user && req.user._id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const allowed = {};
      const { companyLogoUrl, taxCardUrl, companyName, firstName, lastName } = req.body;
      if (companyLogoUrl) allowed.companyLogoUrl = companyLogoUrl;
      if (taxCardUrl) allowed.taxCardUrl = taxCardUrl;
      if (companyName) allowed.companyName = companyName;
      if (firstName) allowed.firstName = firstName;
      if (lastName) allowed.lastName = lastName;

      const updated = await User.findByIdAndUpdate(userId, { $set: allowed }, { new: true }).select("-password");

      return res.status(200).json({ success: true, message: "Profile updated", data: updated });
    } catch (err) {
      return next(err);
    }
  }
}
