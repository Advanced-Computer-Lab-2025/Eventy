import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Users,
  Calendar,
  Dumbbell,
  BookOpen,
  ArrowRight,
  FolderOpen,
  Clock,
  CheckCircle2,
  Store,
  GraduationCap,
  Route as RouteIcon,
  Megaphone,
  Grid2x2,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StaffHeader from "@/components/StaffHeader";
import { EventCategory } from "@/components/CategoryBadge";
import EventDetailsDialog from "@/components/EventsDetailsDialog";
import EventCard from "@/components/EventCard";
import BigCalendarView from "@/components/BigCalendarView";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import EventSearch, { EventSearchFilters } from "@/components/EventSearch";
import EventSort from "@/components/EventSort";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

interface RegisteredEvent {
  _id: string;
  name: string;
  eventType: string;
  status: string;
  startDate: string;
}

interface MyEvent {
  _id: string;
  name: string;
  eventType: EventCategory;
  location: string;
  startDate: string;
  endDate: string;
  bannerImage?: string;
  status?: string;
}

export default function StaffTADashboard() {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<RegisteredEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { toast } = useToast();

  // Upcoming events states
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [allUpcomingEvents, setAllUpcomingEvents] = useState<any[]>([]);
  const [professorOptions, setProfessorOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [eventFilters, setEventFilters] = useState<EventFilterState>({
    eventType: "all",
    location: "all",
    startDate: undefined,
    endDate: undefined,
    professor: "",
    showUpcoming: true,
    showPast: true,
  });

  useEffect(() => {
    fetchUserData();
    fetchEventStats();
    fetchRegisteredEvents();
  }, []);

  const fetchUserData = () => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.firstName);
      setUserRole(userData.role);
    }
  };

  const fetchEventStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLocation("/login");
        return;
      }

      const res = await fetch("http://localhost:4000/api/events/me/events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:4000/api/events/me/events", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRegisteredEvents(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching registered events:", err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bazaar":
        return Store;
      case "workshop":
        return GraduationCap;
      case "trip":
        return RouteIcon;
      case "conference":
        return Megaphone;
      default:
        return Megaphone;
    }
  };

  const handleCardClick = async (eventId: string) => {
    setDetailsLoading(true);
    setDialogOpen(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/events/${eventId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20";
      case "pending":
        return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20";
      case "rejected":
        return "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20";
      case "needs_revision":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Fetch professors for filter
  useEffect(() => {
    const token = localStorage.getItem("token");
    const baseUrl =
      (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:4000";

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

    fetchEventStats();
    fetchRegisteredEvents();
    fetchProfessors();
  }, []);

  const getEventStats = () => {
    const total = events.length;
    const now = new Date();
    const upcoming = events.filter((e) => new Date(e.startDate) > now).length;
    const past = events.filter((e) => new Date(e.startDate) <= now).length;
    const approved = events.filter((e) => e.status === "approved").length;
    return { total, upcoming, past, approved };
  };

  const stats = getEventStats();

  const appliedFilters: EventSearchFilters = useMemo(() => {
    const next: EventSearchFilters = {};
    if (eventFilters.eventType !== "all") {
      next.type = eventFilters.eventType;
    }
    if (eventFilters.location !== "all") {
      next.location = eventFilters.location;
    }
    if (eventFilters.startDate) {
      next.startDate =
        (eventFilters.startDate as any).toISOString?.() ||
        String(eventFilters.startDate);
    }
    if (eventFilters.endDate) {
      next.endDate =
        (eventFilters.endDate as any).toISOString?.() ||
        String(eventFilters.endDate);
    }
    if (eventFilters.professor) {
      (next as any).professor = eventFilters.professor;
    }
    return next;
  }, [eventFilters]);

  const handleSearchResults = (results: any[]) => {
    setUpcomingEvents(results);
    if (allUpcomingEvents.length === 0) {
      setAllUpcomingEvents(results);
    }
    if (upcomingLoading) setUpcomingLoading(false);
  };

  const handleUpcomingLoading = (isLoading: boolean) => {
    if (upcomingEvents.length === 0) {
      setUpcomingLoading(isLoading);
    }
  };

  const handleUpcomingError = (errorMessage: string) => {
    setUpcomingError(errorMessage);
  };

  const handleRegisterEvent = (eventId: string) => {
    console.log("Register for event:", eventId);
  };

  const availableLocations = useMemo(() => {
    const filteredEvents = allUpcomingEvents.filter((event) => {
      // Filter by event type
      if (
        eventFilters.eventType !== "all" &&
        event.eventType !== eventFilters.eventType
      ) {
        return false;
      }
      // Filter by professor
      if (eventFilters.professor) {
        const eventProfessors = (event as any).professors || [];
        const hasProfessor = eventProfessors.some(
          (p: any) => String(p._id || p.id || p) === eventFilters.professor
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
  }, [allUpcomingEvents, eventFilters.eventType, eventFilters.professor]);

  const filteredProfessorOptions = useMemo(() => {
    // Match Home: filter professors by available events
    const filteredEvents = allUpcomingEvents.filter((event) => {
      // Filter by event type
      if (
        eventFilters.eventType !== "all" &&
        event.eventType !== eventFilters.eventType
      ) {
        return false;
      }
      // Filter by location
      if (eventFilters.location !== "all") {
        const eventLocation =
          event.location ||
          (event.eventType === "platform_booth"
            ? (event as any).locationPreference
            : "");
        if (eventLocation !== eventFilters.location) return false;
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
  }, [
    allUpcomingEvents,
    eventFilters.eventType,
    eventFilters.location,
    professorOptions,
  ]);

  // Clear invalid filter selections when options change (like Home)
  useEffect(() => {
    let needsUpdate = false;
    const newFilters = { ...eventFilters };
    if (
      eventFilters.location !== "all" &&
      !availableLocations.includes(eventFilters.location)
    ) {
      newFilters.location = "all";
      needsUpdate = true;
    }
    if (
      eventFilters.professor &&
      !filteredProfessorOptions.some((p) => p.id === eventFilters.professor)
    ) {
      newFilters.professor = "";
      needsUpdate = true;
    }
    if (needsUpdate) {
      setEventFilters(newFilters);
    }
  }, [
    availableLocations,
    filteredProfessorOptions,
    eventFilters.location,
    eventFilters.professor,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const roleDisplay =
    userRole === "ta"
      ? "TA"
      : userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{roleDisplay} Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Welcome, {userName}! Manage your events and access university
            facilities.
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-8">
          {/* Event Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Events
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All registered events
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Events
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.upcoming}
                </div>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Past Events
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.past}
                </div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully approved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>

            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-72 flex-shrink-0">
                <div className="sticky top-32 space-y-4">
                  <EventFilters
                    filters={eventFilters}
                    onFilterChange={setEventFilters}
                    locations={availableLocations}
                    professors={filteredProfessorOptions}
                    userRole=""
                  />
                </div>
              </aside>

              <div className="flex-1">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex-1">
                    <EventSearch
                      onSearchResults={handleSearchResults}
                      onLoading={handleUpcomingLoading}
                      onError={handleUpcomingError}
                      placeholder="Search events by name, professor, or type..."
                      className="w-full"
                      filters={appliedFilters}
                    />
                  </div>

                  <EventSort
                    sortOrder={sortOrder}
                    onSortChange={setSortOrder}
                  />
                  <div className="flex gap-1 border rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === "list" ? "default" : "ghost"}
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "calendar" ? "default" : "ghost"}
                      onClick={() => setViewMode("calendar")}
                      className="h-8 w-8 p-0"
                    >
                      <Grid2x2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {upcomingLoading ? (
                  <p>Loading events...</p>
                ) : upcomingError ? (
                  <p className="text-red-500">{upcomingError}</p>
                ) : upcomingEvents.length === 0 ? (
                  <EmptyState />
                ) : viewMode === "calendar" ? (
                  <BigCalendarView
                    events={[...upcomingEvents].sort((a, b) => {
                      const aDate = a.startDate
                        ? new Date(a.startDate).getTime()
                        : 0;
                      const bDate = b.startDate
                        ? new Date(b.startDate).getTime()
                        : 0;
                      return sortOrder === "asc"
                        ? aDate - bDate
                        : bDate - aDate;
                    })}
                    onUnregister={fetchEventStats}
                  />
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
                          // --- UPDATED HERE ---
                          // Pass raw strings for time fix
                          dbStartTime={event.startTime}
                          dbEndTime={event.endTime}
                          // --------------------

                          durationWeeks={event.durationWeeks}
                          capacity={event.capacity}
                          registrationDeadline={event.registrationDeadline}
                          vendors={event.vendors || []}
                          showDetailedView={true}
                          onRegister={() => handleRegisterEvent(event._id)}
                          onShare={() => console.log("Share:", event.name)}
                          onViewDetails={() => handleCardClick(event._id)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <EventDetailsDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedEvent(null);
          }}
          event={selectedEvent}
          loading={detailsLoading}
        />
      </main>
    </div>
  );
}
