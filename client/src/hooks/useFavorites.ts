import { useState, useEffect, useCallback } from 'react';
import { favoritesApi, FavoriteEvent } from '../lib/favoritesApi';

type ApiError = Error & {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's favorite events
  const fetchFavorites = useCallback(async () => {
    try {
      setInitialLoading(true);
      const data = await favoritesApi.getFavorites();
      
      // Ensure data is an array before setting it
      const favoritesData = Array.isArray(data) ? data : [];
      setFavorites(favoritesData);
      setError(null);
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage = error?.response?.data?.message || 'Failed to fetch favorites';
      console.error('Error fetching favorites:', errorMessage);
      setError(errorMessage);
      // Don't block the UI if fetching fails
      setFavorites([]);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Add event to favorites
  const addToFavorites = async (eventId: string) => {
    setOperationLoading(eventId);
    try {
      const result = await favoritesApi.addToFavorites(eventId);
      
      // Optimistically update the UI
      setFavorites(prev => {
        // Check if already in favorites to avoid duplicates
        if (prev.some(fav => fav._id === eventId)) {
          return prev;
        }
        // Add a temporary entry (will be replaced by full data on next fetch)
        return [...prev, { 
          _id: eventId,
          name: '',
          description: '',
          location: '',
          startDate: '',
          endDate: '',
          status: ''
        } as FavoriteEvent];
      });
      
      // Optionally refresh to get complete data
      await fetchFavorites();
      
      return { success: true, data: result };
    } catch (err: any) {
      console.error('Error adding to favorites:', err);
      return { 
        success: false, 
        error: err?.response?.data?.message || 'Failed to add to favorites' 
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
      
      // Optimistically update the UI
      setFavorites(prev => prev.filter(event => event._id !== eventId));
      
      return { success: true };
    } catch (err: any) {
      console.error('Error removing from favorites:', err);
      // Revert on error
      await fetchFavorites();
      return { 
        success: false, 
        error: err?.response?.data?.message || 'Failed to remove from favorites' 
      };
    } finally {
      setOperationLoading(null);
    }
  };

  // Check if an event is in favorites
  const isFavorite = useCallback((eventId: string): boolean => {
    return favorites.some(fav => fav._id === eventId);
  }, [favorites]);

  // Check if a specific event operation is loading
  const isEventLoading = useCallback((eventId: string): boolean => {
    return operationLoading === eventId;
  }, [operationLoading]);

  // Toggle favorite status
  const toggleFavorite = async (eventId: string, isCurrentlyFavorite: boolean) => {
    if (isCurrentlyFavorite) {
      return await removeFromFavorites(eventId);
    } else {
      return await addToFavorites(eventId);
    }
  };

  // Load favorites on mount
  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    favorites,
    loading: initialLoading, // Only true on initial load
    error,
    isFavorite,
    isEventLoading, // Use this for individual button loading states
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    fetchFavorites,
  };
};