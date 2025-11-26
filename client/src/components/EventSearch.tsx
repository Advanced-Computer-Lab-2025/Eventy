import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface EventSearchFilters {
  type?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

interface EventSearchProps {
  onSearchResults: (events: any[]) => void;
  onLoading?: (isLoading: boolean) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  filters?: EventSearchFilters;
}

export default function EventSearch({
  onSearchResults,
  onLoading,
  onError,
  placeholder = "Search by event name, professor, location, or type...",
  debounceMs = 1000,
  className = "",
  filters = {},
}: EventSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const hasInitiallyFetched = useRef(false);
  const scrollPositionRef = useRef(0);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  const API_URL = `${API_BASE_URL}/api/events/upcoming`;
  const SEARCH_URL = `${API_BASE_URL}/api/events/search`;
  const token = localStorage.getItem("token");

  // Initial fetch on mount only
  useEffect(() => {
    const fetchInitialEvents = async () => {
      if (hasInitiallyFetched.current) return;

      try {
        setIsSearching(true);
        onLoading?.(true);
        onError?.("");

        const response = await fetch(API_URL, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        onSearchResults(data.data || []);
        hasInitiallyFetched.current = true;
      } catch (err) {
        console.error("Error fetching events:", err);
        onError?.("Unable to load events. Please try again later.");
      } finally {
        setIsSearching(false);
        onLoading?.(false);
      }
    };

    fetchInitialEvents();
  }, []); // Only run once on mount

  const hasSearchQuery = useMemo(() => !!searchQuery.trim(), [searchQuery]);
  const hasFilterParams = useMemo(() => {
    const hasDateRange = Boolean(filters.startDate && filters.endDate);
    return Boolean(filters.type || filters.location || hasDateRange);
  }, [filters]);

  // Search effect with debouncing (only when user interacts with filters)
  useEffect(() => {
    // Skip if we haven't done the initial fetch yet
    if (!hasInitiallyFetched.current) return;

    const fetchEvents = async () => {
      // Always save scroll position after initial load (for any search interaction)
      scrollPositionRef.current = window.scrollY;

      try {
        // Don't trigger the loading overlay for searches after initial load
        onError?.("");

        // If no filters are active and no search query, fetch all upcoming events
        if (!hasSearchQuery && !hasFilterParams) {
          const response = await fetch(API_URL, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) throw new Error("Failed to fetch events");
          const data = await response.json();
          onSearchResults(data.data || []);
        } else {
          // Search with the applied filters
          setIsSearching(true);
          const searchParams = new URLSearchParams();

          if (searchQuery.trim()) {
            searchParams.append("name", searchQuery.trim());
            if (!filters.type) {
              // Allow searching by type keyword when dropdown is unset
              searchParams.append("type", searchQuery.trim());
            }
          }

          if (filters.type) {
            searchParams.set("type", filters.type);
          }

          if (filters.location) {
            searchParams.append("location", filters.location);
          }

          if (filters.startDate && filters.endDate) {
            searchParams.append("startDate", filters.startDate);
            searchParams.append("endDate", filters.endDate);
          }

          const response = await fetch(
            `${SEARCH_URL}?${searchParams.toString()}`,
            {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) throw new Error("Search failed");
          const data = await response.json();
          onSearchResults(data.data || []);

          if (data.data?.length === 0) {
            onError?.("No events found matching your search criteria.");
          }
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        onError?.("Unable to load events. Please try again later.");
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce: wait after user stops typing/changing filters
    const debounceTimer = setTimeout(() => {
      fetchEvents();
    }, debounceMs);

    // Cleanup: cancel the timer if filters change before timeout
    return () => clearTimeout(debounceTimer);
  }, [
    searchQuery,
    filters,
    hasSearchQuery,
    hasFilterParams,
    debounceMs,
    token,
  ]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {isSearching ? (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : searchQuery ? (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
