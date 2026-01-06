import { useState, useEffect, useMemo } from "react";
import StaffHeader from "@/components/StaffHeader";
import EventCard from "@/components/EventCard";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import EventSearch, { EventSearchFilters } from "@/components/EventSearch";
import EventSort from "@/components/EventSort";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

interface Event {
  _id: string;
  name: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  locationPreference?: string;
  attendeesCount?: number;
  attendees?: string[];
  capacity?: number;
  registrationDeadline?: string;
  image?: string;
  bannerImage?: string;
  description?: string;
  professors?: any[];
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

export default function StaffUpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [professorOptions, setProfessorOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [eventFilters, setEventFilters] = useState<EventFilterState>({
    eventType: "all",
    location: "all",
    startDate: undefined,
    endDate: undefined,
    professor: "",
    showUpcoming: true,
    showPast: true,
  });
  const { toast } = useToast();

  const safeProfessorForLocationOptions = useMemo(() => {
    if (!eventFilters.professor) return "";
    if (professorOptions.length === 0) return eventFilters.professor;
    return professorOptions.some((p) => p.id === eventFilters.professor)
      ? eventFilters.professor
      : "";
  }, [eventFilters.professor, professorOptions]);

  const handleSearchResults = (results: any[]) => {
    setEvents(results);

    // If this is the first load (allEvents is empty), store all events for location computation
    if (allEvents.length === 0) {
      setAllEvents(results);
    }

    if (loading) setLoading(false);
  };

  const handleLoading = (isLoading: boolean) => {
    if (events.length === 0) {
      setLoading(isLoading);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Compute unique locations dynamically based on current filters
  const availableLocations = useMemo(() => {
    const filteredEvents = allEvents.filter((event) => {
      if (
        eventFilters.eventType !== "all" &&
        event.eventType !== eventFilters.eventType
      ) {
        return false;
      }
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

    const locations = filteredEvents
      .map(
        (event) =>
          event.location ||
          (event.eventType === "platform_booth"
            ? event.locationPreference
            : null)
      )
      .filter(Boolean) as string[];
    return Array.from(new Set(locations));
  }, [allEvents, eventFilters.eventType, safeProfessorForLocationOptions]);

  const safeLocation = useMemo(() => {
    if (eventFilters.location === "all") return "all";
    return availableLocations.includes(eventFilters.location)
      ? eventFilters.location
      : "all";
  }, [eventFilters.location, availableLocations]);

  const computedProfessorOptions = useMemo(() => {
    const filteredEvents = allEvents.filter((event) => {
      if (
        eventFilters.eventType !== "all" &&
        event.eventType !== eventFilters.eventType
      ) {
        return false;
      }
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

    return professorOptions.filter((prof) =>
      availableProfessorIds.has(prof.id)
    );
  }, [allEvents, eventFilters.eventType, safeLocation, professorOptions]);

  const safeProfessor = useMemo(() => {
    if (!eventFilters.professor) return "";
    const optionsToValidate =
      professorOptions.length > 0 ? professorOptions : computedProfessorOptions;
    if (optionsToValidate.length === 0) return eventFilters.professor;
    return optionsToValidate.some((p) => p.id === eventFilters.professor)
      ? eventFilters.professor
      : "";
  }, [eventFilters.professor, professorOptions, computedProfessorOptions]);

  const displayFilters = useMemo(() => {
    return {
      ...eventFilters,
      location: safeLocation,
      professor: safeProfessor,
    };
  }, [eventFilters, safeLocation, safeProfessor]);

  const appliedFilters: EventSearchFilters = useMemo(() => {
    const next: EventSearchFilters = {};
    if (displayFilters.eventType !== "all") {
      next.type = displayFilters.eventType;
    }
    if (displayFilters.location !== "all") {
      next.location = displayFilters.location;
    }
    if (displayFilters.startDate) {
      next.startDate = displayFilters.startDate.toISOString().slice(0, 10);
    }
    if (displayFilters.endDate) {
      next.endDate = displayFilters.endDate.toISOString().slice(0, 10);
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
      <StaffHeader homeHref="/staff-ta" />

      <main className="pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground">Browse all upcoming events</p>
          </div>

          {/* Filters and Content Section */}
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-32 space-y-4">
                <EventFilters
                  filters={displayFilters}
                  onFilterChange={setEventFilters}
                  locations={availableLocations}
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
                    className="w-full"
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
                        price={event.price || 0}
                        image={event.bannerImage || event.image}
                        description={event.description}
                        startDate={event.startDate}
                        endDate={event.endDate}
                        durationWeeks={event.durationWeeks}
                        capacity={event.capacity}
                        registrationDeadline={event.registrationDeadline}
                        vendors={event.vendors || []}
                        eventData={event}
                        showDetailedView={true}

                        // --- CHANGES MADE HERE ---
                        // Removed onViewDetails, onShare, and onRegister props.
                        // EventCard will now use its internal logic for these actions.
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
