import bcrypt from "bcryptjs";
import { User } from "./user.model.js";
import ApiError from "../../utils/ApiError.js";
import { sendRegistrationEmail } from "../auth/email.service.js"; // ✅ add this line
import { favoriteEventSchema } from "./user.validation.js";

class UserService {
  async createManagementAccount(data) {
    const { firstName, lastName, email, password, role } = data;

    if (!["admin", "events_office"].includes(role)) {
      throw new Error(
        "Invalid role. Only admin or events_office accounts can be created using this endpoint."
      );
    }

    // Look up any account with this email (even if soft-deleted)
    const existingUser = await User.findOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser;

    if (existingUser) {
      if (!existingUser.deletedAt && existingUser.status !== "deleted") {
        throw new ApiError(409, "Email already exists.");
      }

      // Revive soft-deleted account so we avoid unique index conflicts
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.status = "active";
      existingUser.deletedAt = null;
      existingUser.isVerified = true;
      await existingUser.save();
      newUser = existingUser;
    } else {
      newUser = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        status: "active",
      });
    }

    // ✅ Send email after creating the account
    await sendRegistrationEmail({
      name: `${newUser.firstName} ${newUser.lastName}`,
      email: newUser.email,
    });

    return newUser;
  }

  async deleteManagementAccount(currentAdminId, targetUserId) {
    if (currentAdminId.toString() === targetUserId.toString()) {
      throw new ApiError(403, "You cannot delete your own account.");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new ApiError(404, "Target user not found.");

    const allowedRoles = ["admin", "events_office"];
    if (!allowedRoles.includes(targetUser.role)) {
      throw new ApiError(
        403,
        "Cannot delete non-management accounts using this endpoint."
      );
    }

    // Set deletedAt timestamp to allow account recreation
    targetUser.deletedAt = new Date();
    targetUser.status = "deleted";
    await targetUser.save();

    return targetUser;
  }

  async getAllUsers(req) {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Access denied. Admins only.");
      }

      const currentUserId = req.user.id || req.user._id;

      const users = await User.find(
        { status: { $in: ["active", "blocked"] } },
        "-password"
      )
        .sort({ createdAt: -1 })
        .select(
          "firstName lastName email role status deletedAt createdAt updatedAt studentStaffId companyName"
        )
        .lean();

      if (!users || users.length === 0) {
        throw new ApiError(404, "No users found.");
      }

      // Move current user to the front
      const currentUserIndex = users.findIndex(
        (u) => u._id.toString() === currentUserId.toString()
      );

      if (currentUserIndex > 0) {
        const [currentUser] = users.splice(currentUserIndex, 1);
        users.unshift(currentUser);
      }

      return users;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, `Error retrieving users: ${err.message}`);
    }
  }

  async toggleBlockStatus(currentAdminId, userId, action) {
    // Prevent blocking self
    if (currentAdminId.toString() === userId.toString()) {
      throw new ApiError(403, "You cannot block or unblock yourself");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Update user status
    user.status = action === "block" ? "blocked" : "active";
    await user.save();

    return {
      userId: user._id,
      status: user.status,
      message: `User ${action === "block" ? "blocked" : "unblocked"} successfully`,
    };
  }

  // Favorites methods (moved from controller, same logic)
  async addToFavorites(userId, eventId, role) {
    try {
      console.log("Service addToFavorites called:", { userId, eventId, role });

      // --- Validate eventId ---
      const { error } = favoriteEventSchema.validate({ eventId });
      if (error) {
        console.error("Validation error:", error);
        throw new ApiError(
          400,
          `Invalid event ID: ${error.details[0].message}`
        );
      }

      // Check if user is allowed to add to favorites
      const allowedRoles = ["student", "staff", "ta", "professor"];
      if (!allowedRoles.includes(role)) {
        console.error("Unauthorized role:", role);
        throw new ApiError(
          403,
          "Only students, staff, TAs, and professors can add events to favorites"
        );
      }

      // Import the Event model
      const { Event } = await import("../events/event.model.js");

      // --- Verify event exists, is approved, and not deleted ---
      const eventExists = await Event.findOne({
        _id: eventId,
        deletedAt: null,
        status: "approved",
      }).lean();

      if (!eventExists) {
        throw new ApiError(404, "Event not found, deleted, or not approved");
      }

      // --- Fetch user favorites only ---
      const oldUser = await User.findById(userId, { favoriteEvents: 1 });
      if (!oldUser) {
        throw new ApiError(404, "User not found");
      }

      // --- Check if already in favorites ---
      if (oldUser.favoriteEvents.includes(eventId)) {
        return {
          message: "Event already in favorites",
          data: { eventId, favoritesCount: oldUser.favoriteEvents.length },
        };
      }

      // --- Atomic add to favorites ---
      const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { favoriteEvents: eventId } },
        { new: true, fields: { favoriteEvents: 1 } } // Return only favoriteEvents
      );

      console.log("[Service] Updated user favorites:", user.favoriteEvents);

      return {
        message: "Event added to favorites",
        data: { eventId, favoritesCount: user.favoriteEvents.length },
      };
    } catch (err) {
      console.error("[Service] addToFavorites error:", err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, err.message || "Error in addToFavorites");
    }
  }

  async removeFromFavorites(userId, eventId, role) {
    try {
      // Validate request
      const { error } = favoriteEventSchema.validate({ eventId });
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      // Check if user is allowed to remove from favorites
      const allowedRoles = ["student", "staff", "ta", "professor"];
      if (!allowedRoles.includes(role)) {
        throw new ApiError(
          403,
          "Only students, staff, TAs, and professors can manage favorites"
        );
      }

      // Fetch user first to check favorites
      const user = await User.findById(userId, { favoriteEvents: 1 });
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Check if event is in favorites
      if (!user.favoriteEvents.includes(eventId)) {
        throw new ApiError(404, "Event is not in favorites");
      }

      // Remove from favorites
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { favoriteEvents: eventId } },
        { new: true }
      );

      return {
        message: "Event removed from favorites",
        data: { eventId, favoritesCount: updatedUser.favoriteEvents.length },
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, err.message || "Error in removeFromFavorites");
    }
  }

  async getFavoriteEvents(userId, role) {
    try {
      console.log(
        "[getFavoriteEvents] Service called for user:",
        userId,
        "role:",
        role
      );

      // Check if user is allowed to view favorites
      const allowedRoles = ["student", "staff", "ta", "professor"];
      if (!allowedRoles.includes(role)) {
        throw new ApiError(
          403,
          "Only students, staff, TAs, and professors can view favorite events"
        );
      }

      // Get user with populated favorite events (include eventType for proper display)
      const user = await User.findById(userId, { favoriteEvents: 1 })
        .populate({
          path: "favoriteEvents",
          select:
            "name description location locationPreference startDate endDate bannerImage status eventType type category durationWeeks attendees attendeesCount application archivedAt", // Added archivedAt
          match: {
            deletedAt: null,
            archivedAt: null, // ✅ Exclude archived events
            status: { $ne: "archived" }, // ✅ Exclude archived status
          },
        })
        .lean();

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Import Application model for booth attendee counting
      const { default: Application } = await import(
        "../applications/application.model.js"
      );

      // Calculate attendee counts for booth events
      const eventsWithAttendees = await Promise.all(
        user.favoriteEvents.map(async (event) => {
          // For booth events, count attendees from the application
          if (event.eventType === "platform_booth" && event.application) {
            const application = await Application.findById(
              event.application
            ).lean();
            if (application && application.attendees) {
              event.attendeesCount = Array.isArray(application.attendees)
                ? application.attendees.length
                : 0;
            } else {
              event.attendeesCount = 0;
            }
          } else {
            // For other events, use existing attendeesCount or calculate from attendees array
            event.attendeesCount =
              event.attendeesCount ||
              (Array.isArray(event.attendees) ? event.attendees.length : 0);
          }
          return event;
        })
      );

      console.log(
        "[getFavoriteEvents] favorites count:",
        eventsWithAttendees.length
      );

      return { data: eventsWithAttendees };
    } catch (err) {
      console.error("[getFavoriteEvents] Error:", err);
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, err.message || "Error in getFavoriteEvents");
    }
  }
}

export default new UserService();
