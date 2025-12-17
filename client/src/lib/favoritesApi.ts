import api from "./api";

export interface FavoriteEvent {
  _id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  bannerImage?: string;
  status: string;
  eventType?: string;
  durationWeeks?: number;
  locationPreference?: string;
  attendeesCount?: number;
}

export const favoritesApi = {
  // Get user's favorite events
  getFavorites: async (): Promise<FavoriteEvent[]> => {
    try {
      const response = await api.get("/users/favorites");

      if (response.data.success) {
        return response.data.data || [];
      }

      logger.error("Failed to fetch favorites:", response.data);
      return [];
    } catch (error: any) {
      logger.error("Error fetching favorites:", error?.response?.data || error);
      // Don't throw - return empty array to prevent UI blocking
      return [];
    }
  },

  // Add event to favorites
  addToFavorites: async (
    eventId: string
  ): Promise<{ eventId: string; favoritesCount: number }> => {
    try {
      const response = await api.post("/users/favorites", { eventId });

      if (response.data.success) {
        return response.data.data || { eventId, favoritesCount: 0 };
      }

      throw new Error(response.data.message || "Failed to add to favorites");
    } catch (error: any) {
      logger.error(
        "Error adding to favorites:",
        error?.response?.data || error
      );
      throw error;
    }
  },

  // Remove event from favorites
  removeFromFavorites: async (
    eventId: string
  ): Promise<{ eventId: string; favoritesCount: number }> => {
    try {
      const response = await api.delete(`/users/favorites/${eventId}`);

      if (response.data.success) {
        return response.data.data || { eventId, favoritesCount: 0 };
      }

      throw new Error(
        response.data.message || "Failed to remove from favorites"
      );
    } catch (error: any) {
      logger.error(
        "Error removing from favorites:",
        error?.response?.data || error
      );
      throw error;
    }
  },

  // Check if an event is in favorites (optional - you can use the hook's isFavorite instead)
  isFavorite: async (eventId: string): Promise<boolean> => {
    try {
      const favorites = await favoritesApi.getFavorites();
      return favorites.some((event) => event._id === eventId);
    } catch (error) {
      logger.error("Error checking favorite status:", error);
      return false;
    }
  },
};
