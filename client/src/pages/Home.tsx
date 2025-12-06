import { useState, useEffect, useMemo } from "react";
import EventCard from "@/components/EventCard";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import EventSearch, { EventSearchFilters } from "@/components/EventSearch";
import EventSort from "@/components/EventSort";
import StudentHeader from "@/components/StudentHeader";
import MobileNav from "@/components/MobileNav";
import CreateEventDialog from "@/components/CreateEventDialog";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { getEventImage } from "@/lib/eventImages";

// Define Event type for type safety
interface Event {
  _id: string;
  name: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string; // Added for DB time string
  endTime?: string; // Added for DB time string
  location?: string;
  locationPreference?: string;
  attendeesCount?: number;
  attendees?: any[]; // This contains the list of user IDs/objects
  capacity?: number;
  registrationDeadline?: string;
  image?: string;
  bannerImage?: string;
  description?: string;
  price?: number;
  durationWeeks?: number;
  vendors?: Array<{
    vendorId?: string;
    vendorName?: string;
    name?: string;
    vendorEmail?: string;
    type?: string;
    boothSize?: string;
    attendees?: number;
  }>;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [professorOptions, setProfessorOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<EventFilterState>({
    eventType: "all",
    location: "all",
    startDate: "" as any,
    endDate: "" as any,
    professor: "",
    showUpcoming: true,
    showPast: true,
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const handleSearchResults = (results: any[]) => {
    // Sort events to prioritize bazaars first, then by startDate
    const sortedResults = [...results].sort((a, b) => {
      const aIsBazaar = a.eventType === "bazaar";
      const bIsBazaar = b.eventType === "bazaar";

      // If one is a bazaar and the other isn't, bazaar comes first
      if (aIsBazaar && !bIsBazaar) return -1;
      if (!aIsBazaar && bIsBazaar) return 1;

      // If both are bazaars or both are not, sort by startDate
      const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aDate - bDate;
    });

    setEvents(sortedResults);

    // If this is the first load (allEvents is empty), store all events for location computation
    if (allEvents.length === 0) {
      setAllEvents(sortedResults);
    }

    // After first results, we're no longer in initial loading
    if (loading) setLoading(false);
  };

  const handleLoading = (isLoading: boolean) => {
    // Only show loading overlay on initial load
    if (events.length === 0) {
      setLoading(isLoading);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const locationOptions = useMemo(() => {
    // Filter events by current eventType and professor (excluding location filter)
    const filteredEvents = allEvents.filter((event) => {
      // Filter by event type
      if (
        filters.eventType !== "all" &&
        event.eventType !== filters.eventType
      ) {
        return false;
      }
      // Filter by professor
      if (filters.professor) {
        const eventProfessors = (event as any).professors || [];
        const hasProfessor = eventProfessors.some(
          (p: any) => String(p._id || p.id || p) === filters.professor
        );
        if (!hasProfessor) return false;
      }
      return true;
    });

    const uniqueLocations = new Set<string>();
    filteredEvents.forEach((event) => {
      const loc =
        event.location ||
        (event.eventType === "platform_booth"
          ? (event as any).locationPreference
          : "");
      if (loc) uniqueLocations.add(loc);
    });
    return Array.from(uniqueLocations);
  }, [allEvents, filters.eventType, filters.professor]);

  const appliedFilters: EventSearchFilters = useMemo(() => {
    const next: EventSearchFilters = {};
    if (filters.eventType !== "all") {
      next.type = filters.eventType;
    }
    if (filters.location !== "all") {
      next.location = filters.location;
    }
    if (filters.startDate && filters.endDate) {
      next.startDate = filters.startDate as any;
      next.endDate = filters.endDate as any;
    }
    if (filters.professor) {
      (next as any).professor = filters.professor;
    }
    return next;
  }, [filters]);

  // compute professorOptions dynamically by filtering API professors based on available events
  const computedProfessorOptions = useMemo(() => {
    // Filter events by current eventType and location (excluding professor filter)
    const filteredEvents = allEvents.filter((event) => {
      // Filter by event type
      if (
        filters.eventType !== "all" &&
        event.eventType !== filters.eventType
      ) {
        return false;
      }
      // Filter by location
      if (filters.location !== "all") {
        const eventLocation =
          event.location ||
          (event.eventType === "platform_booth"
            ? (event as any).locationPreference
            : "");
        if (eventLocation !== filters.location) return false;
      }
      return true;
    });

    // Get all professor IDs from filtered events
    const availableProfessorIds = new Set<string>();
    filteredEvents.forEach((event) => {
      if (event.eventType === "workshop" || event.eventType === "conference") {
        const profs = (event as any).professors || [];
        profs.forEach((p: any) => {
          const id = p._id || p.id || p;
          if (id) availableProfessorIds.add(String(id));
        });
      }
    });

    // Filter API professors to only include those available in filtered events
    return professorOptions.filter((prof) =>
      availableProfessorIds.has(prof.id)
    );
  }, [allEvents, filters.eventType, filters.location, professorOptions]);

  // Clear invalid filter selections when options change
  useEffect(() => {
    let needsUpdate = false;
    const newFilters = { ...filters };

    // Clear location if it's no longer available
    if (
      filters.location !== "all" &&
      !locationOptions.includes(filters.location)
    ) {
      newFilters.location = "all";
      needsUpdate = true;
    }

    // Clear professor if it's no longer available
    if (
      filters.professor &&
      !computedProfessorOptions.some((p) => p.id === filters.professor)
    ) {
      newFilters.professor = "";
      needsUpdate = true;
    }

    if (needsUpdate) {
      setFilters(newFilters);
    }
  }, [
    locationOptions,
    computedProfessorOptions,
    filters.location,
    filters.professor,
  ]);

  useEffect(() => {
    const baseUrl =
      (import.meta as any).env.VITE_API_URL || "http://localhost:4000";
    const token = localStorage.getItem("token");
    const fetchProfessors = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/users/professors`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return;
        const payload = await res.json();
        const list = payload?.data || payload || [];
        setProfessorOptions(
          (list || []).map((u: any) => ({
            id: u._id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          }))
        );
      } catch (err) {
        console.error("Failed to fetch professors", err);
      }
    };
    fetchProfessors();
  }, []);

  // Fetch personalized recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) return;

        const userData = JSON.parse(user);
        const userId = userData.id || userData._id;

        if (!userId) return;

        setLoadingRecommendations(true);

        const response = await fetch(
          `http://localhost:5000/api/recommendations/user/${userId}?limit=6`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch recommendations");
          return;
        }

        const recommendations = await response.json();

        // Fetch full event details for recommended event IDs
        if (recommendations && recommendations.length > 0) {
          const eventIds = recommendations.map((rec: any) => rec.event_id);
          const eventDetailsPromises = eventIds.map((id: string) =>
            fetch(`http://localhost:5000/api/events/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json())
          );

          const eventDetails = await Promise.all(eventDetailsPromises);
          setRecommendedEvents(eventDetails.filter((e) => e && e._id));
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, []);

  // Track when user clicks on a recommended event
  const trackRecommendationClick = async (eventId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch("http://localhost:5000/api/recommendations/track-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      });
    } catch (err) {
      console.error("Failed to track recommendation click:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />

      <main className="pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Header Section - Full Width */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground">
              Discover exciting events happening at your university
            </p>
          </div>

          {/* AI Recommendations Section */}
          {recommendedEvents.length > 0 && (
            <div className="mb-10">
              <div className="mb-4">
                <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <span className="text-primary">✨</span>
                  Recommended for You
                </h3>
                <p className="text-sm text-muted-foreground">
                  Personalized picks based on your interests
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    id={event._id}
                    title={event.name}
                    category={(event.eventType || "event") as any}
                    date={event.startDate || ""}
                    time={event.startTime || ""}
                    endDate={event.endDate}
                    dbStartTime={event.startTime}
                    dbEndTime={event.endTime}
                    location={
                      event.location ||
                      event.locationPreference ||
                      "Location TBA"
                    }
                    attendees={
                      event.attendeesCount || event.attendees?.length || 0
                    }
                    capacity={event.capacity}
                    registrationDeadline={event.registrationDeadline}
                    image={
                      event.bannerImage ||
                      event.image ||
                      getEventImage(event.eventType || "")
                    }
                    description={event.description}
                    price={event.price}
                    durationWeeks={event.durationWeeks}
                    vendors={event.vendors}
                    onViewDetails={() => trackRecommendationClick(event._id)}
                  />
                ))}
              </div>
              <div className="mt-6 border-t border-border pt-6"></div>
            </div>
          )}

          {/* Filters and Content Section */}
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-32 space-y-4">
                <EventFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  locations={locationOptions}
                  professors={computedProfessorOptions}
                  userRole=""
                />
              </div>
            </aside>

            <div className="flex-1">
              {/* Event Search + Sort */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex-1">
                  <EventSearch
                    onSearchResults={handleSearchResults}
                    onLoading={handleLoading}
                    onError={handleError}
                    placeholder="Search events by name, professor, or type..."
                    filters={appliedFilters}
                  />
                </div>
                <EventSort sortOrder={sortOrder} onSortChange={setSortOrder} />
              </div>

              {loading ? (
                <p>Loading events...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : events.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {[...events]
                    .sort((a, b) => {
                      const aDate = a.startDate
                        ? new Date(a.startDate).getTime()
                        : 0;
                      const bDate = b.startDate
                        ? new Date(b.startDate).getTime()
                        : 0;
                      return sortOrder === "asc"
                        ? aDate - bDate
                        : bDate - aDate;
                    })
                    .map((event, index) => (
                      <EventCard
                        key={event._id || index}
                        id={event._id || String(index)}
                        title={event.name || "Untitled Event"}
                        category={(event.eventType || "academic") as any}
                        date={
                          event.startDate
                            ? new Date(event.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "TBA"
                        }
                        time={
                          event.startDate
                            ? new Date(event.startDate).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )
                            : "TBA"
                        }
                        location={
                          event.location ||
                          (event.eventType === "platform_booth"
                            ? event.locationPreference
                            : null) ||
                          "Unknown location"
                        }
                        attendees={
                          Array.isArray(event.attendees)
                            ? event.attendees.length
                            : event.attendeesCount || 0
                        }
                        // Pass ACTUAL array for logic checks
                        attendeesList={event.attendees}
                        image={
                          event.bannerImage ||
                          event.image ||
                          getEventImage(event.eventType, event.name)
                        }
                        price={
                          typeof event.price === "number" ? event.price : 0
                        }
                        description={event.description}
                        startDate={event.startDate}
                        endDate={event.endDate}
                        // --- UPDATED HERE ---
                        // Pass the raw strings from the DB to fix the time issue
                        dbStartTime={event.startTime}
                        dbEndTime={event.endTime}
                        // --------------------

                        durationWeeks={event.durationWeeks}
                        capacity={event.capacity}
                        registrationDeadline={event.registrationDeadline}
                        eventData={event}
                        onRegister={() => console.log("Register:", event._id)}
                        showDetailedView={true}
                        onSave={() => console.log("Save:", event.name)}
                        onShare={() => console.log("Share:", event.name)}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
