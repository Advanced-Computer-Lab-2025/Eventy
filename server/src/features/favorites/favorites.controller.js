import { User } from '../users/user.model.js';
import { Event } from '../events/event.model.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

/**
 * Add an event to user's favorites
 * @route POST /users/:userId/favorites
 */
export const addToFavorites = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { eventId } = req.body;

    if (!eventId) {
      throw new BadRequestError('Event ID is required');
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if already in favorites
    if (user.favorites.includes(eventId)) {
      return res.status(200).json({
        success: true,
        message: 'Event already in favorites',
        data: user.favorites
      });
    }

    // Add to favorites
    user.favorites.push(eventId);
    await user.save();

    // Populate the favorites for the response
    await user.populate('favorites');

    res.status(200).json({
      success: true,
      message: 'Event added to favorites',
      data: user.favorites
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's favorite events
 * @route GET /users/:userId/favorites
 */
export const getUserFavorites = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Find user and populate favorites
    const user = await User.findById(userId)
      .populate({
        path: 'favorites',
        select: 'title description startDate endDate location imageUrl'
      });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: user.favorites
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an event from user's favorites
 * @route DELETE /users/:userId/favorites/:eventId
 */
export const removeFromFavorites = async (req, res, next) => {
  try {
    const { userId, eventId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if event is in favorites
    const eventIndex = user.favorites.indexOf(eventId);
    if (eventIndex === -1) {
      return res.status(200).json({
        success: true,
        message: 'Event not in favorites',
        data: user.favorites
      });
    }

    // Remove from favorites
    user.favorites.splice(eventIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Event removed from favorites',
      data: user.favorites
    });
  } catch (error) {
    next(error);
  }
};
