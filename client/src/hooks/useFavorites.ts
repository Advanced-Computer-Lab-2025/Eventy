import { useState, useEffect, useCallback } from "react";
import { favoritesApi, FavoriteEvent } from "../lib/favoritesApi";

type ApiError = Error & {
  response?: {
    data?: {
      message?: string;
    };
  };
};

// Shared state across all hook instances
let sharedFavorites: FavoriteEvent[] = [];
let isFetching = false; // Add this flag
const listeners: Set<(favorites: FavoriteEvent[]) => void> = new Set();

// Notify all listeners of state change
const notifyListeners = () => {
  listeners.forEach((listener) => listener([...sharedFavorites]));
};

// Update shared favorites
const updateSharedFavorites = (favorites: FavoriteEvent[]) => {
  sharedFavorites = favorites;
  notifyListeners();
};

// Add this reset function at the module level
export const resetFavoritesCache = () => {
  sharedFavorites = [];
  isFetching = false;
  updateSharedFavorites([]);
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>(sharedFavorites);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to shared state changes
  useEffect(() => {
    const listener = (updatedFavorites: FavoriteEvent[]) => {
      setFavorites(updatedFavorites);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Fetch user's favorite events
  const fetchFavorites = useCallback(async () => {
    if (isFetching) {
      console.log("Already fetching favorites, skipping...");
      return;
    }

    try {
      isFetching = true;
      setInitialLoading(true);
      const data = await favoritesApi.getFavorites();

      const favoritesData = Array.isArray(data) ? data : [];
      updateSharedFavorites(favoritesData);
      setError(null);
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage =
        error?.response?.data?.message || "Failed to fetch favorites";
      console.error("Error fetching favorites:", errorMessage);
      setError(errorMessage);
      updateSharedFavorites([]);
    } finally {
      setInitialLoading(false);
      isFetching = false;
    }
  }, []);

  // Add event to favorites
  const addToFavorites = async (eventId: string) => {
    setOperationLoading(eventId);
    try {
      const result = await favoritesApi.addToFavorites(eventId);

      // Optimistically update shared state
      const newFavorites = sharedFavorites.some((fav) => fav._id === eventId)
        ? sharedFavorites
        : [
            ...sharedFavorites,
            {
              _id: eventId,
              name: "",
              description: "",
              location: "",
              startDate: "",
              endDate: "",
              status: "",
            } as FavoriteEvent,
          ];

      updateSharedFavorites(newFavorites);

      // Refresh to get complete data
      await fetchFavorites();

      return { success: true, data: result };
    } catch (err: any) {
      console.error("Error adding to favorites:", err);
      return {
        success: false,
        error: err?.response?.data?.message || "Failed to add to favorites",
      };
    } finally {
      setOperationLoading(null);
    }
  };

  // Remove event from favorites
  const removeFromFavorites = async (eventId: string) => {
    setOperationLoading(eventId);
    try {
      await favoritesApi.removeFromFavorites(eventId);

      // Immediately update shared state - this will notify all listeners
      const newFavorites = sharedFavorites.filter(
        (event) => event._id !== eventId
      );
      updateSharedFavorites(newFavorites);

      return { success: true };
    } catch (err: any) {
      console.error("Error removing from favorites:", err);
      // Revert on error
      await fetchFavorites();
      return {
        success: false,
        error:
          err?.response?.data?.message || "Failed to remove from favorites",
      };
    } finally {
      setOperationLoading(null);
    }
  };

  // Check if an event is in favorites
  const isFavorite = useCallback(
    (eventId: string): boolean => {
      return favorites.some((fav) => fav._id === eventId);
    },
    [favorites]
  );

  // Check if a specific event operation is loading
  const isEventLoading = useCallback(
    (eventId: string): boolean => {
      return operationLoading === eventId;
    },
    [operationLoading]
  );

  // Toggle favorite status
  const toggleFavorite = async (
    eventId: string,
    isCurrentlyFavorite: boolean
  ) => {
    if (isCurrentlyFavorite) {
      return await removeFromFavorites(eventId);
    } else {
      return await addToFavorites(eventId);
    }
  };

  // Load favorites on mount (only once globally)
  useEffect(() => {
    // Only fetch if we don't have data yet and this is the first listener
    if (sharedFavorites.length === 0 && listeners.size <= 1) {
      fetchFavorites();
    } else if (sharedFavorites.length > 0) {
      // If we already have data, just set it and mark as loaded
      setFavorites(sharedFavorites);
      setInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    favorites,
    loading: initialLoading,
    error,
    isFavorite,
    isEventLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    fetchFavorites,
  };
};
