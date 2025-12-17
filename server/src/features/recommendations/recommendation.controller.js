import { getRecommendationsForUser } from "./recommendation.service.js";

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming auth middleware populates req.user
    const recommendations = await getRecommendationsForUser(userId);

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
      error: error.message,
    });
  }
};

/*
export const resetRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Clear User fields (views and favorites only)
    await User.findByIdAndUpdate(userId, {
      $set: {
        viewedEvents: [],
        favoriteEvents: [],
      },
    });

    // 2. Remove from Event attendees
    // COMMENTED OUT: This was unregistering users from all events
    // Only clearing recommendation history, not actual registrations
    // await Event.updateMany(
    //   { attendees: userId },
    //   { $pull: { attendees: userId } }
    // );

    res.status(200).json({
      success: true,
      message: "Recommendation history reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset recommendations",
      error: error.message,
    });
  }
};
*/

// Stubbed endpoint while reset is disabled
export const resetRecommendations = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Reset recommendations endpoint is temporarily disabled",
  });
};
