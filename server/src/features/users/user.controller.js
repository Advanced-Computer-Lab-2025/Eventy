import mongoose from 'mongoose';
import { User } from "./user.model.js";
import {
  UserValidation,
  createManagementAccountSchema,
  toggleBlockUserSchema,
  favoriteEventSchema,
} from "./user.validation.js";
import { sendRegistrationEmail, sendVerificationEmail } from "../auth/email.service.js";
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
      if (role === 'staff' || role === 'ta' || role === 'professor') {
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

  /**
   * Toggle user block status
   * PATCH /api/users/:userId/block-status
   * Body: { action: 'block' | 'unblock' }
   */
  static async toggleBlockStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { action } = req.body;

      // Validate request
      const { error } = toggleBlockUserSchema.validate({ userId, action });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      // Call service to handle the block/unblock logic
      const result = await UserService.toggleBlockStatus(
        req.user._id, // current admin's ID
        userId,       // target user's ID
        action        // 'block' or 'unblock'
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          status: result.status,
        },
      });
    } catch (err) {
      // Pass the error to the error handling middleware
      next(err);
    }
  }

  /**
   * Add an event to user's favorites
   * POST /api/users/favorites
   * Body: { eventId: string }
   */
  static async addToFavorites(req, res, next) {
    try {
      const { eventId } = req.body;
      const userId = req.user._id;

      console.log('Adding to favorites:', { userId, eventId });

      // Validate request
      const { error } = favoriteEventSchema.validate({ eventId });
      if (error) {
        console.error('Validation error:', error);
        return res.status(400).json({
          success: false,
          message: `Invalid event ID: ${error.details[0].message}`,
        });
      }

      // Check if user is allowed to add to favorites
      const allowedRoles = ['student', 'staff', 'ta', 'professor'];
      if (!allowedRoles.includes(req.user.role)) {
        console.error('Unauthorized role:', req.user.role);
        return res.status(403).json({
          success: false,
          message: 'Only students, staff, TAs, and professors can add events to favorites',
        });
      }

      // Import the Event model
      const { Event } = await import('../events/event.model.js');
      
      // Verify the event exists and is not deleted
      const event = await Event.findOne({ _id: eventId, deletedAt: null });
      
      if (!event) {
        console.log('Event not found or deleted:', eventId);
        return res.status(404).json({
          success: false,
          message: 'Event not found or has been deleted',
        });
      }

      // Add to favorites if not already added
      console.log('Finding user:', userId);
      const user = await User.findById(userId);
      
      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Convert both to strings for comparison to avoid ObjectId issues
      const eventIdStr = eventId.toString();
      const favoriteIds = user.favoriteEvents.map(id => id.toString());
      
      console.log('Current user favorites:', favoriteIds);
      
      if (!favoriteIds.includes(eventIdStr)) {
        console.log('Adding event to favorites');
        user.favoriteEvents.push(eventId);
        try {
          await user.save();
          console.log('Successfully saved user with updated favorites');
        } catch (saveError) {
          console.error('Error saving user:', saveError);
          if (saveError.name === 'ValidationError') {
            return res.status(400).json({
              success: false,
              message: 'Validation error',
              error: saveError.message
            });
          }
          throw saveError;
        }
      } else {
        console.log('Event already in favorites');
        return res.status(200).json({
          success: true,
          message: 'Event already in favorites',
          data: {
            eventId,
            favoritesCount: user.favoriteEvents.length,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event added to favorites',
        data: {
          eventId,
          favoritesCount: user.favoriteEvents.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove an event from user's favorites
   * DELETE /api/users/favorites/:eventId
   */
  static async removeFromFavorites(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.user._id;

      // Validate request
      const { error } = favoriteEventSchema.validate({ eventId });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      // Check if user is allowed to remove from favorites
      const allowedRoles = ['student', 'staff', 'ta', 'professor'];
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only students, staff, TAs, and professors can manage favorites',
        });
      }

      // Remove from favorites
      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { favoriteEvents: eventId } },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Event removed from favorites',
        data: {
          eventId,
          favoritesCount: user.favoriteEvents.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get user's favorite events
   * GET /api/users/favorites
   */
  static async getFavoriteEvents(req, res, next) {
    try {
      console.log('[getFavoriteEvents] Request received');
      console.log('[getFavoriteEvents] User ID:', req.user?._id);
      console.log('[getFavoriteEvents] User role:', req.user?.role);

      const userId = req.user._id;

      // Check if user is allowed to view favorites
      const allowedRoles = ['student', 'staff', 'ta', 'professor'];
      if (!allowedRoles.includes(req.user.role)) {
        console.log('[getFavoriteEvents] User role not allowed:', req.user.role);
        return res.status(403).json({
          success: false,
          message: 'Only students, staff, TAs, and professors can view favorite events',
        });
      }

      // Get user with populated favorite events
      console.log('[getFavoriteEvents] Fetching user and populating favorite events...');
      const user = await User.findById(userId).populate({
        path: 'favoriteEvents',
        select: 'name description location startDate endDate bannerImage status',
        match: { deletedAt: null } // Only include non-deleted events
      });

      if (!user) {
        console.log('[getFavoriteEvents] User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      console.log('[getFavoriteEvents] User found, favorite events count:', user.favoriteEvents?.length || 0);
      console.log('[getFavoriteEvents] Favorite events:', user.favoriteEvents);

      return res.status(200).json({
        success: true,
        data: user.favoriteEvents,
      });
    } catch (err) {
      console.error('[getFavoriteEvents] Error:', err);
      next(err);
    }
  }
}
