import { useState, useEffect, useMemo } from "react";
import EventCard from "@/components/EventCard";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import EventSearch, { EventSearchFilters } from "@/components/EventSearch";
import EventSort from "@/components/EventSort";
import StudentHeader from "@/components/StudentHeader";
import MobileNav from "@/components/MobileNav";
import CreateEventDialog from "@/components/CreateEventDialog";
import { useToast } from "@/hooks/use-toast";
import { getEventImage } from "@/lib/eventImages";

// Define Event type for type safety
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
  vendors?: Array<{
    vendorId?: string;
    vendorName?: string;
    name?: string;
    vendorEmail?: string;
    type?: string;
    boothSize?: string;
    attendees?: number;
  }>;
  durationWeeks?: number;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [professorOptions, setProfessorOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [loading, setLoading] = useState(true); // Initial loading state
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<EventFilterState>({
    eventType: "all",
    location: "all",
    startDate: "",
    endDate: "",
    professor: "",
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

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
    const uniqueLocations = new Set<string>();
    events.forEach((event) => {
      const loc =
        event.location ||
        (event.eventType === "platform_booth"
          ? (event as any).locationPreference
          : "");
      if (loc) uniqueLocations.add(loc);
    });
    return Array.from(uniqueLocations);
  }, [events]);

  const appliedFilters: EventSearchFilters = useMemo(() => {
    const next: EventSearchFilters = {};
    if (filters.eventType !== "all") {
      next.type = filters.eventType;
    }
    if (filters.location !== "all") {
      next.location = filters.location;
    }
    if (filters.startDate && filters.endDate) {
      next.startDate = filters.startDate;
      next.endDate = filters.endDate;
    }
    if (filters.professor) {
      (next as any).professor = filters.professor;
    }
    return next;
  }, [filters]);

  // compute professorOptions from events as a fallback
  const computedProfessorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    events.forEach((event) => {
      if (event.eventType === "workshop" || event.eventType === "conference") {
        const profs = (event as any).professors || [];
        (profs || []).forEach((p: any) => {
          const id = p._id || p.id || p;
          const name =
            p.firstName && p.lastName
              ? `${p.firstName} ${p.lastName}`
              : p.name ||
                p.companyName ||
                `${p.firstName || ""} ${p.lastName || ""}`.trim();
          if (id) seen.set(String(id), name || String(id));
        });
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
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

          {/* Filters and Content Section */}
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                <EventFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  locations={locationOptions}
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
                <p>No upcoming events found.</p>
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
                        image={
                          event.bannerImage ||
                          event.image ||
                          getEventImage(event.eventType, event.name)
                        }
                        description={event.description}
                        startDate={event.startDate}
                        endDate={event.endDate}
                        durationWeeks={event.durationWeeks}
                        capacity={event.capacity}
                        registrationDeadline={event.registrationDeadline}
                        onRegister={() => handleRegisterEvent(event._id)}
                        showDetailedView={true}
                        onSave={() => console.log("Save:", event.name)}
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

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
