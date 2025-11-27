import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  GraduationCap,
  Calendar,
  Dumbbell,
  BookOpen,
  ArrowRight,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ProfessorHeader from "@/components/ProfessorHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import EventSearch from "@/components/EventSearch";
import EventSort from "@/components/EventSort";
import EventCard from "@/components/EventCard";
import { useToast } from "@/hooks/use-toast";

interface Workshop {
  _id: string;
  name: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  startDate: string;
}

export default function ProfessorDashboard() {
  const [, setLocation] = useLocation();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [professorOptions, setProfessorOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [filters, setFilters] = useState<EventFilterState>({
    eventType: "all",
    location: "all",
    startDate: "",
    endDate: "",
    professor: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
    fetchWorkshopStats();
    fetchProfessors();
  }, []);

  const fetchUserData = () => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      // Use firstName field directly from the database model
      setUserName(userData.firstName);
    }
  };

  const fetchWorkshopStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLocation("/login");
        return;
      }

      const res = await fetch("http://localhost:4000/api/events/me/workshops", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setWorkshops(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch workshops:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:4000/api/users/professors", {
        headers: { Authorization: `Bearer ${token}` },
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

  // Compute unique locations from events
  const computedLocationOptions = useMemo(() => {
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

  const getWorkshopStats = () => {
    const total = workshops.length;
    const pending = workshops.filter((w) => w.status === "pending").length;
    const approved = workshops.filter((w) => w.status === "approved").length;
    const needsRevision = workshops.filter(
      (w) => w.status === "needs_revision"
    ).length;
    return { total, pending, approved, needsRevision };
  };

  const stats = getWorkshopStats();

  const handleSearchResults = (searchResults: any[]) => {
    // Sort events to show workshops first
    const sortedResults = searchResults.sort((a, b) => {
      if (a.eventType === "workshop" && b.eventType !== "workshop") return -1;
      if (a.eventType !== "workshop" && b.eventType === "workshop") return 1;
      return 0;
    });
    setEvents(sortedResults);
    // Only disable loading after first results
    if (events.length === 0) {
      setLoading(false);
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

  const handleLoading = (isLoading: boolean) => {
    // Only show loading overlay when there are no events yet (initial load)
    if (events.length === 0) {
      setLoading(isLoading);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const quickActions = [
    {
      title: "Workshop Management",
      icon: BookOpen,
      color: "bg-blue-500",
      path: "/professor/workshops",
      features: ["Create & edit workshops", "Track approval status"],
    },
    {
      title: "Sports Facilities",
      icon: Dumbbell,
      color: "bg-green-500",
      path: "/sports",
      activities: [
        "Yoga",
        "Pilates",
        "Aerobics",
        "Zumba",
        "Cross Circuit",
        "Kick-boxing",
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ProfessorHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfessorHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Professor Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Welcome, Professor {userName}! Manage your workshops and access
            university facilities.
          </p>
        </div>

        {/* Workshop Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Workshops
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All workshops created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approval
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Needs Revision
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.needsRevision}
              </div>
              <p className="text-xs text-muted-foreground">Requires updates</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Event Filters */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-32 space-y-4">
              <EventFilters
                filters={filters}
                onFilterChange={setFilters}
                locations={computedLocationOptions}
                professors={professorOptions.length > 0 ? professorOptions : []}
              />
            </div>
          </aside>{" "}
          {/* Center and Right Columns */}
          <div className="flex-1">
            {/* Center Column - Upcoming Events */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>

              {/* Event Search and Sort */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex-1">
                  <EventSearch
                    onSearchResults={handleSearchResults}
                    onLoading={handleLoading}
                    onError={handleError}
                    filters={filters}
                  />
                </div>
                <EventSort sortOrder={sortOrder} onSortChange={setSortOrder} />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading events...</div>
                </div>
              ) : error && events.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">{error}</p>
                  </CardContent>
                </Card>
              ) : events.length > 0 ? (
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
                    .map((event: any, index: number) => (
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
                        onRegister={() =>
                          console.log(handleRegisterEvent(event._id))
                        }
                        onViewDetails={() =>
                          console.log("View details:", event.name)
                        }
                      />
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No Events Found
                    </h3>
                    <p className="text-muted-foreground text-center">
                      There are no upcoming events at the moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
