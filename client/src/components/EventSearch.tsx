import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

export interface EventSearchFilters {
  type?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  professor?: string;
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

  const API_BASE_URL = getApiBaseUrl();
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
        logger.error("Error fetching events:", err);
        onError?.("Unable to load events. Please try again later.");
      } finally {
        setIsSearching(false);
        onLoading?.(false);
      }
    };

    fetchInitialEvents();
  }, [API_URL, onError, onLoading, onSearchResults, token]);

  const hasSearchQuery = useMemo(() => !!searchQuery.trim(), [searchQuery]);
  const hasFilterParams = useMemo(() => {
    const hasDateRange = Boolean(filters.startDate && filters.endDate);
    const prof = (filters as any).professor;
    const hasValidProfessor = Boolean(
      prof && /^[0-9a-fA-F]{24}$/.test(String(prof))
    );

    return Boolean(
      (filters as any).type ||
      (filters as any).location ||
      hasValidProfessor ||
      hasDateRange
    );
  }, [filters]);

  // Search effect with debouncing (only when user interacts with filters)
  useEffect(() => {
    if (!hasInitiallyFetched.current) return;

    let lastResults: any[] = [];

    const fetchEvents = async () => {
      scrollPositionRef.current = window.scrollY;
      try {
        onError?.("");
        if (!hasSearchQuery && !hasFilterParams) {
          const response = await fetch(API_URL, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) throw new Error("Failed to fetch events");
          const data = await response.json();
          lastResults = data.data || [];
          onSearchResults(lastResults);
        } else {
          setIsSearching(true);
          const searchParams = new URLSearchParams();
          if (searchQuery.trim()) {
            searchParams.append("name", searchQuery.trim());
            if (!filters.type) {
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
          if ((filters as any).professor) {
            const p = (filters as any).professor;
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(p));
            if (isObjectId) searchParams.append("professor", String(p));
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
          if (!response.ok) {
            // Only show error if it's a real server/network error
            logger.error("Error fetching events:", response.statusText);
            onError?.("Unable to load events. Please try again later.");
            // Do NOT clear previous results
            return;
          }
          const data = await response.json();
          lastResults = data.data || [];
          onSearchResults(lastResults);
          // Don't call onError for empty results - let parent handle display
        }
      } catch (err) {
        logger.error("Error fetching events:", err);
        onError?.("Unable to load events. Please try again later.");
        // Do NOT clear previous results
      } finally {
        setIsSearching(false);
      }
    };
    const debounceTimer = setTimeout(() => {
      fetchEvents();
    }, debounceMs);
    return () => clearTimeout(debounceTimer);
  }, [
    searchQuery,
    filters,
    hasSearchQuery,
    hasFilterParams,
    debounceMs,
    token,
    API_URL,
    SEARCH_URL,
    onError,
    onSearchResults,
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
