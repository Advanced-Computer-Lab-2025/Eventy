import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EventSearchProps {
  onSearchResults: (events: any[]) => void;
  onLoading?: (isLoading: boolean) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export default function EventSearch({
  onSearchResults,
  onLoading,
  onError,
  placeholder = "Search by event name, professor name, or event type...",
  debounceMs = 500,
  className = "",
}: EventSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const hasInitiallyFetched = useRef(false);
  const scrollPositionRef = useRef(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
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

  // Search effect with debouncing (only when user types)
  useEffect(() => {
    // Skip if we haven't done the initial fetch yet
    if (!hasInitiallyFetched.current) return;

    const fetchEvents = async () => {
      // Always save scroll position after initial load (for any search interaction)
      scrollPositionRef.current = window.scrollY;

      try {
        setIsSearching(true);
        // Don't trigger the loading overlay for searches after initial load
        onError?.("");

        // If search query is empty, fetch all upcoming events
        if (!searchQuery.trim()) {
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
          // Search with the query
          const searchParams = new URLSearchParams();
          searchParams.append("name", searchQuery);
          searchParams.append("type", searchQuery);

          const response = await fetch(`${SEARCH_URL}?${searchParams.toString()}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          });

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
        
        // Always restore scroll position after initial load (prevents jumping)
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'instant' as ScrollBehavior,
          });
        });
      }
    };

    // Debounce: wait after user stops typing
    const debounceTimer = setTimeout(() => {
      fetchEvents();
    }, debounceMs);

    // Cleanup: cancel the timer if searchQuery changes before timeout
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, debounceMs]);

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className={`space-y-3 ${className}`}>
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
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {searchQuery && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Searching for: <span className="font-medium">"{searchQuery}"</span></span>
          {isSearching && <span className="text-xs">(searching...)</span>}
        </div>
      )}
    </div>
  );
}
