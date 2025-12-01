import { useState, useEffect, useMemo } from "react";
import { Calendar, Users, TrendingUp, UserCheck } from "lucide-react";
import Header from "@/components/AdminHeader";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import EventSearch from "@/components/EventSearch";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";
import { getEventImage } from "@/lib/eventImages";
import EventSort from "@/components/EventSort";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import EventCountBadge from "@/components/EventCountBadge";
import EventsDetailsDialog from "@/components/EventsDetailsDialog";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface Conference {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  websiteUrl?: string;
  requiredBudget?: number;
  fundingSource?: "external" | "guc";
  createdBy: string;
}

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const [creating, setCreating] = useState(false);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [totalUpcomingCount, setTotalUpcomingCount] = useState<number | null>(
    null
  );
  const [approvedEventsCount, setApprovedEventsCount] = useState<number>(0);
  const [approvedLoading, setApprovedLoading] = useState<boolean>(true);
  const [professorOptions, setProfessorOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [filters, setFilters] = useState<EventFilterState>({
    eventType: "all",
    location: "all",
    startDate: "",
    endDate: "",
    professor: "",
    showUpcoming: true,
    showPast: true,
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0); // ✅ Add this
  const [activeUsersLoading, setActiveUsersLoading] = useState<boolean>(true); // ✅ Add this
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "all" | "bazaar" | "trip" | "workshop" | "conference" | "platform_booth"
  >("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/api/events/admin/conferences`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }
        );

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch conferences");

        setConferences(data.data || []);
      } catch (err: any) {
        console.error("Error fetching conferences:", err);
        setConferences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConferences();
  }, []);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      // 204 No Content is success
      if (res.status === 204) {
        // Refresh the events list
        setUpcomingEvents((prev) => prev.filter((e) => e._id !== eventId));
        setAllEvents((prev) => prev.filter((e) => e._id !== eventId));
        return;
      }

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.message || "Failed to delete event");
        }
        throw new Error("Failed to delete event");
      }

      // Refresh the events list
      setUpcomingEvents((prev) => prev.filter((e) => e._id !== eventId));
      setAllEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err: any) {
      console.error(err.message || "Failed to delete event");
    }
  };

  const handleCardClick = async (eventId: string) => {
    setDetailsLoading(true);
    setDialogOpen(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch event details");
      const data = await res.json();
      setSelectedEvent(data.data);
    } catch (err) {
      setSelectedEvent(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/events/upcoming`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Unexpected response. Preview: ${text.substring(0, 60)}...`
          );
        }
        const body = await res.json();
        if (!res.ok)
          throw new Error(body.message || "Failed to fetch upcoming events");
        const eventsList = Array.isArray(body.data) ? body.data : body;
        setUpcomingEvents(eventsList);
        setTotalUpcomingCount(eventsList.length);
      } catch (err: any) {
        setEventsError(err.message || "Failed to load upcoming events");
        setUpcomingEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    const fetchApprovedEvents = async () => {
      try {
        setApprovedLoading(true);
        const token = localStorage.getItem("token");

        // ✅ Use the new dedicated endpoint
        const res = await fetch(`${API_BASE_URL}/api/events/approved/count`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch approved events count");
        }

        const body = await res.json();
        const count = body.data?.count ?? 0;

        setApprovedEventsCount(count);
      } catch (err) {
        console.error("Error fetching approved events count:", err);
        setApprovedEventsCount(0);
      } finally {
        setApprovedLoading(false);
      }
    };
    fetchApprovedEvents();
  }, []);

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

  const handleSearchResults = (results: any[]) => {
    setUpcomingEvents(results);

    // If this is the first load (allEvents is empty), store all events for location computation
    if (allEvents.length === 0) {
      setAllEvents(results);
    }

    if (eventsLoading) setEventsLoading(false);
  };

  const handleLoading = (isLoading: boolean) => {
    if (upcomingEvents.length === 0) {
      setEventsLoading(isLoading);
    }
  };
  // ✅ Add this new useEffect to fetch active users count
  useEffect(() => {
    const fetchActiveUsersCount = async () => {
      try {
        setActiveUsersLoading(true);
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE_URL}/api/users/active/count`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch active users count");
        }

        const body = await res.json();
        const count = body.data?.count ?? 0;

        setActiveUsersCount(count);
      } catch (err) {
        console.error("Error fetching active users count:", err);
        setActiveUsersCount(0);
      } finally {
        setActiveUsersLoading(false);
      }
    };
    fetchActiveUsersCount();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleError = (errorMessage: string) => {
    setEventsError(errorMessage);
  };

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

  // Compute unique locations dynamically based on current filters
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

  const appliedFilters = useMemo(() => {
    const next: any = {};
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
      next.professor = filters.professor;
    }
    return next;
  }, [filters]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage events, approvals, and administrative operations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* ✅ Replace Budget Requested card with Active Users */}
          <StatCard
            title="Active Users"
            value={activeUsersLoading ? "-" : activeUsersCount.toString()}
            icon={Users}
            valueColor="text-foreground"
            iconColor="text-muted-foreground"
            description="Users active in last 24 hours"
          />
          <StatCard
            title="Upcoming Events"
            value={
              totalUpcomingCount === null ? "-" : totalUpcomingCount.toString()
            }
            icon={Calendar}
            valueColor="text-blue-600"
            iconColor="text-blue-600"
            description="Coming soon"
          />
          <StatCard
            title="Approved Events"
            value={approvedLoading ? "-" : approvedEventsCount.toString()}
            icon={TrendingUp}
            valueColor="text-green-600"
            iconColor="text-green-600"
            description="Successfully approved"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-32 space-y-4">
              <EventFilters
                filters={filters}
                onFilterChange={setFilters}
                locations={locationOptions}
                professors={computedProfessorOptions}
              />
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">Upcoming Events</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Curated upcoming events across all categories
                </p>
              </div>
              <EventCountBadge
                count={upcomingEvents.length}
                loading={eventsLoading}
              />
            </div>

            <div className="flex items-center gap-4 mb-6">
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

            {eventsLoading ? (
              <p>Loading events...</p>
            ) : eventsError ? (
              <p className="text-red-500">{eventsError}</p>
            ) : upcomingEvents.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[...upcomingEvents]
                  .sort((a, b) => {
                    const aDate = a.startDate
                      ? new Date(a.startDate).getTime()
                      : 0;
                    const bDate = b.startDate
                      ? new Date(b.startDate).getTime()
                      : 0;
                    return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
                  })
                  .filter((e: any) => {
                    // Filter by event type
                    if (
                      filters.eventType !== "all" &&
                      e.eventType !== filters.eventType
                    ) {
                      return false;
                    }
                    // Filter by location
                    if (filters.location !== "all") {
                      const eventLocation =
                        e.location ||
                        (e.eventType === "platform_booth"
                          ? e.locationPreference
                          : "");
                      if (eventLocation !== filters.location) return false;
                    }
                    // Filter by professor
                    if (filters.professor) {
                      const eventProfessors = (e as any).professors || [];
                      const hasProfessor = eventProfessors.some(
                        (p: any) =>
                          String(p._id || p.id || p) === filters.professor
                      );
                      if (!hasProfessor) return false;
                    }
                    // Filter by date range
                    if (filters.startDate && filters.endDate) {
                      const eventDate = new Date(e.startDate);
                      const startDate = new Date(filters.startDate);
                      const endDate = new Date(filters.endDate);
                      if (eventDate < startDate || eventDate > endDate)
                        return false;
                    }
                    return true;
                  })
                  .map((e: any, index: number) => (
                    <EventCard
                      key={e._id || index}
                      id={e._id || String(index)}
                      title={e.name || "Untitled Event"}
                      category={(e.eventType || "academic") as any}
                      date={
                        e.startDate
                          ? new Date(e.startDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "TBA"
                      }
                      time={
                        e.startDate
                          ? new Date(e.startDate).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "TBA"
                      }
                      location={
                        e.location ||
                        (e.eventType === "platform_booth"
                          ? e.locationPreference
                          : null) ||
                        "Unknown location"
                      }
                      attendees={
                        Array.isArray(e.attendees)
                          ? e.attendees.length
                          : e.attendeesCount || 0
                      }
                      image={
                        e.bannerImage ||
                        e.image ||
                        getEventImage(e.eventType, e.name)
                      }
                      description={e.description}
                      startDate={e.startDate}
                      endDate={e.endDate}
                      // --- UPDATED HERE ---
                      // Pass raw strings for time fix
                      dbStartTime={e.startTime}
                      dbEndTime={e.endTime}
                      // --------------------

                      durationWeeks={e.durationWeeks}
                      capacity={-1}
                      vendors={e.vendors || []}
                      showDetailedView={true}
                      hideRegisterButton={true}
                      canDelete={
                        (Array.isArray(e.attendees)
                          ? e.attendees.length
                          : e.attendeesCount || 0) === 0
                      }
                      onDelete={() => handleDeleteEvent(e._id)}
                      onViewDetails={() => handleCardClick(e._id)}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <EventsDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        loading={detailsLoading}
      />
    </div>
  );
}
