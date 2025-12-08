import { Event } from "../events/event.model.js";
import { User } from "../users/user.model.js";
import AIModelService from "./ai.service.js";

// Helper for cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const getRecommendationsForUser = async (userId) => {
  try {
    const now = new Date();

    // 1. Fetch User Data (Views, Favorites, Registrations)
    const user = await User.findById(userId)
      .populate("viewedEvents", "name description eventType agenda")
      .populate("favoriteEvents", "name description eventType agenda");

    const registeredEvents = await Event.find({
      attendees: userId,
    }).select("name description eventType agenda");

    const viewedEvents = user?.viewedEvents || [];
    const favoriteEvents = user?.favoriteEvents || [];

    const totalInteractions =
      viewedEvents.length + favoriteEvents.length + registeredEvents.length;

    // 2. Cold Start / Hidden Logic (Show nothing until 3 interactions, unless registered)
    if (totalInteractions < 3 && registeredEvents.length === 0) {
      return {
        type: "hidden",
        events: [],
        reason: "Not enough history",
      };
    }

    // 3. Check if enough data for AI (Need at least 1 registration OR 5+ interactions)
    const enoughDataForAI =
      registeredEvents.length > 0 || totalInteractions >= 5;

    // 4. Get Candidates (Upcoming, Approved, Not already attending, Registration Open)
    const candidates = await Event.find({
      startDate: { $gte: now },
      registrationDeadline: { $gte: now },
      status: "approved",
      attendees: { $ne: userId },
    }).populate("professors", "firstName lastName name username");

    if (candidates.length === 0) {
      return { type: "hidden", events: [], reason: "No upcoming events" };
    }

    // 5. If NOT enough data for AI, use Popular/Trending Logic
    if (!enoughDataForAI) {
      // Calculate Popularity Score: (Attendees * 5) + (Views * 1)
      const popularEvents = candidates
        .map((event) => ({
          event,
          score:
            (event.attendees?.length || 0) * 5 + (event.viewCount || 0) * 1,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((item) => item.event);

      return {
        type: "popular",
        events: popularEvents,
        reason: "Trending on campus",
      };
    }

    // 6. AI Recommendation Logic (Weighted)
    const extractor = await AIModelService.getInstance();

    // Build Weighted User Profile Text
    // Views = 1x, Favorites = 3x, Registrations = 5x
    let userInterestText = "";

    viewedEvents.forEach((e) => {
      userInterestText += `${e.name} ${e.description || ""} ${e.agenda || ""} ${e.eventType} `;
    });

    favoriteEvents.forEach((e) => {
      userInterestText +=
        `${e.name} ${e.description || ""} ${e.agenda || ""} ${e.eventType} `.repeat(
          3
        );
    });

    registeredEvents.forEach((e) => {
      userInterestText +=
        `${e.name} ${e.description || ""} ${e.agenda || ""} ${e.eventType} `.repeat(
          5
        );
    });

    // Generate embedding for user profile
    const userOutput = await extractor(userInterestText, {
      pooling: "mean",
      normalize: true,
    });
    const userVector = userOutput.data;

    // Score Candidates
    const scoredEvents = [];

    for (const event of candidates) {
      const eventText = `${event.name} ${event.description || ""} ${event.agenda || ""} ${event.eventType}`;

      const eventOutput = await extractor(eventText, {
        pooling: "mean",
        normalize: true,
      });
      const eventVector = eventOutput.data;

      const similarity = cosineSimilarity(userVector, eventVector);

      // Hybrid Boosts
      let finalScore = similarity;

      // Boost if same category as a registered event
      const isSameCategory = registeredEvents.some(
        (h) => h.eventType === event.eventType
      );
      if (isSameCategory) finalScore += 0.1;

      scoredEvents.push({
        event,
        score: finalScore,
        similarity,
      });
    }

    scoredEvents.sort((a, b) => b.score - a.score);

    const topRecommendations = scoredEvents
      .slice(0, 5)
      .filter((item) => item.score > 0.2)
      .map((item) => {
        let reason = "Recommended for you";
        if (item.similarity > 0.5) reason = "Matches your interests perfectly";
        else if (item.similarity > 0.3) reason = "Similar to events you liked";

        return {
          ...item.event.toObject(),
          recommendationReason: reason,
          matchScore: Math.round(item.similarity * 100),
        };
      });

    if (topRecommendations.length === 0) {
      // Fallback to popular
      const popularEvents = candidates
        .map((event) => ({
          event,
          score:
            (event.attendees?.length || 0) * 5 + (event.viewCount || 0) * 1,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((item) => item.event);

      return {
        type: "popular",
        events: popularEvents,
        reason: "Trending on campus",
      };
    }

    return {
      type: "personalized",
      events: topRecommendations,
      reason: "Based on your recent activity",
    };
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return {
      type: "hidden",
      events: [],
      reason: "Service unavailable",
    };
  }
};
