import { useState, useEffect, useMemo } from "react";
import EventCard from "@/components/EventCard";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import EventSearch, { EventSearchFilters } from "@/components/EventSearch";
import EventSort from "@/components/EventSort";
import StudentHeader from "@/components/StudentHeader";
import MobileNav from "@/components/MobileNav";
import CreateEventDialog from "@/components/CreateEventDialog";
import EmptyState from "@/components/EmptyState";
import Recommendations from "@/components/Recommendations";
import { getEventImage } from "@/lib/eventImages";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

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
    startDate: undefined,
    endDate: undefined,
    professor: "",
    showUpcoming: true,
    showPast: true,
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const safeProfessorForLocationOptions = useMemo(() => {
    if (!filters.professor) return "";
    if (professorOptions.length === 0) return filters.professor;
    return professorOptions.some((p) => p.id === filters.professor)
      ? filters.professor
      : "";
  }, [filters.professor, professorOptions]);

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
      if (safeProfessorForLocationOptions) {
        const eventProfessors = (event as any).professors || [];
        const hasProfessor = eventProfessors.some(
          (p: any) =>
            String(p._id || p.id || p) === safeProfessorForLocationOptions
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
  }, [allEvents, filters.eventType, safeProfessorForLocationOptions]);

  const safeLocation = useMemo(() => {
    if (filters.location === "all") return "all";
    return locationOptions.includes(filters.location)
      ? filters.location
      : "all";
  }, [filters.location, locationOptions]);

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
      if (safeLocation !== "all") {
        const eventLocation =
          event.location ||
          (event.eventType === "platform_booth"
            ? (event as any).locationPreference
            : "");
        if (eventLocation !== safeLocation) return false;
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
  }, [allEvents, filters.eventType, safeLocation, professorOptions]);

  const safeProfessor = useMemo(() => {
    if (!filters.professor) return "";
    const optionsToValidate =
      computedProfessorOptions.length > 0
        ? computedProfessorOptions
        : professorOptions;
    if (optionsToValidate.length === 0) return filters.professor;
    return optionsToValidate.some((p) => p.id === filters.professor)
      ? filters.professor
      : "";
  }, [filters.professor, computedProfessorOptions, professorOptions]);

  const displayFilters = useMemo(() => {
    return {
      ...filters,
      location: safeLocation,
      professor: safeProfessor,
    };
  }, [filters, safeLocation, safeProfessor]);

  const appliedFilters: EventSearchFilters = useMemo(() => {
    const next: EventSearchFilters = {};
    if (displayFilters.eventType !== "all") {
      next.type = displayFilters.eventType;
    }
    if (displayFilters.location !== "all") {
      next.location = displayFilters.location;
    }
    if (displayFilters.startDate && displayFilters.endDate) {
      next.startDate = displayFilters.startDate.toISOString();
      next.endDate = displayFilters.endDate.toISOString();
    }
    if (displayFilters.professor) {
      (next as any).professor = displayFilters.professor;
    }
    return next;
  }, [displayFilters]);

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
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
        logger.error("Failed to fetch professors", err);
      }
    };
    fetchProfessors();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />

      <main className="pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Recommendations Section */}
          <Recommendations />

          {/* Header Section - Full Width */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground">
              Discover exciting events happening at your university
            </p>
          </div>

          {/* Filters and Content Section */}
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-32 space-y-4">
                <EventFilters
                  filters={displayFilters}
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
                        vendors={event.vendors || []}
                        eventData={event}
                        onRegister={() => logger.info("Register:", event._id)}
                        showDetailedView={true}
                        onSave={() => logger.info("Save:", event.name)}
                        onShare={() => logger.info("Share:", event.name)}
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
