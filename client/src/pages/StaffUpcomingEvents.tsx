import { useState, useEffect, useMemo } from "react";
import StaffHeader from "@/components/StaffHeader";
import EventCard from "@/components/EventCard";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import EventSearch from "@/components/EventSearch";
import EventSort from "@/components/EventSort";
import { useToast } from "@/hooks/use-toast";

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
  const [professorOptions, setProfessorOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [eventFilters, setEventFilters] = useState<EventFilterState>({
    eventType: "all",
    location: "all",
    startDate: "",
    endDate: "",
    professor: "",
  });
  const { toast } = useToast();

  const handleSearchResults = (results: any[]) => {
    setEvents(results);
    setFilteredEvents(applyFilters(results));
    if (loading) setLoading(false);
  };

  const handleLoading = (isLoading: boolean) => {
    if (events.length === 0) {
      setLoading(isLoading);
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Login Required",
          description: "Please login to register for events",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `http://localhost:4000/api/events/${eventId}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Registration Successful! 🎉",
          description: "You have been successfully registered for the event.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Registration Failed",
          description: errorData.message || "Failed to register for event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Error",
        description: "An error occurred while registering for the event",
        variant: "destructive",
      });
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Filtering logic
  const applyFilters = (events: Event[]) => {
    return events.filter((event) => {
      // Event type filter
      if (
        eventFilters.eventType !== "all" &&
        event.eventType !== eventFilters.eventType
      )
        return false;
      // Location filter
      if (
        eventFilters.location !== "all" &&
        event.location !== eventFilters.location
      )
        return false;
      // Date range filter
      if (eventFilters.startDate) {
        const eventDate = event.startDate
          ? new Date(event.startDate).toISOString().split("T")[0]
          : "";
        if (eventDate < eventFilters.startDate) return false;
      }
      if (eventFilters.endDate) {
        const eventDate = event.startDate
          ? new Date(event.startDate).toISOString().split("T")[0]
          : "";
        if (eventDate > eventFilters.endDate) return false;
      }
      // Professor filter: only apply to workshops and conferences
      if (eventFilters.professor) {
        if (event.eventType !== "workshop" && event.eventType !== "conference")
          return false;
        const profs = (event as any).professors || [];
        const ids = profs.map((p: any) => String(p._id || p.id || p));
        if (!ids.includes(String(eventFilters.professor))) return false;
      }
      return true;
    });
  };

  // When filters change, update filteredEvents
  useEffect(() => {
    setFilteredEvents(applyFilters(events));
  }, [events, eventFilters]);

  const handleFilterChange = (newFilters: any) => {
    setEventFilters(newFilters);
  };

  // Compute unique locations from events
  const availableLocations = useMemo(() => {
    const locations = events
      .map(
        (event) =>
          event.location ||
          (event.eventType === "platform_booth"
            ? event.locationPreference
            : null)
      )
      .filter(Boolean) as string[];
    return Array.from(new Set(locations));
  }, [events]);

  const computedProfessorOptions = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((ev) => {
      if (ev.eventType === "workshop" || ev.eventType === "conference") {
        const profs = (ev as any).professors || [];
        profs.forEach((p: any) => {
          const id = p._id || p.id || p;
          const name =
            p.firstName && p.lastName
              ? `${p.firstName} ${p.lastName}`
              : p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim();
          if (id) map.set(String(id), name || String(id));
        });
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [events]);

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

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader homeHref="/staff-ta" />

      <main className="pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Header Section - Full Width */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground">Browse all upcoming events</p>
          </div>

          {/* Filters and Content Section */}
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-32 space-y-4">
                <EventFilters
                  filters={eventFilters}
                  onFilterChange={setEventFilters}
                  locations={availableLocations}
                  professors={
                    professorOptions.length > 0
                      ? professorOptions
                      : computedProfessorOptions
                  }
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
                    filters={eventFilters}
                  />
                </div>

                <EventSort sortOrder={sortOrder} onSortChange={setSortOrder} />
              </div>

              {loading ? (
                <p>Loading events...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : filteredEvents.length === 0 ? (
                <p>No upcoming events found.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {[...filteredEvents]
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
                        image={event.bannerImage || event.image}
                        description={event.description}
                        startDate={event.startDate}
                        endDate={event.endDate}
                        durationWeeks={event.durationWeeks}
                        capacity={event.capacity}
                        registrationDeadline={event.registrationDeadline}
                        vendors={event.vendors || []}
                        showDetailedView={true}
                        onRegister={() => handleRegisterEvent(event._id)}
                        onShare={() => console.log("Share:", event.name)}
                        onViewDetails={() =>
                          console.log("View details:", event.name)
                        }
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
