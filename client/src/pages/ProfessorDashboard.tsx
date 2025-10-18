import { useEffect, useState } from "react";
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
  Users,
  MapPin,
  Store
} from "lucide-react";
import ProfessorHeader from "@/components/ProfessorHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EventSearch from "@/components/EventSearch";
import CategoryBadge, { type EventCategory } from "@/components/CategoryBadge";
import { getEventImage } from "@/lib/eventImages";

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
  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchUserData();
    fetchWorkshopStats();
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

  const getWorkshopStats = () => {
    const total = workshops.length;
    const pending = workshops.filter(w => w.status === "pending").length;
    const approved = workshops.filter(w => w.status === "approved").length;
    const needsRevision = workshops.filter(w => w.status === "needs_revision").length;
    return { total, pending, approved, needsRevision };
  };

  const stats = getWorkshopStats();

  const handleSearchResults = (searchResults: any[]) => {
    setEvents(searchResults);
    // Only disable loading after first results
    if (events.length === 0) {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const quickActions = [
    {
      title: "Workshop Management",
      description: "Create, edit, and view all your workshops",
      icon: BookOpen,
      color: "bg-blue-500",
      path: "/professor/workshops",
      features: [
        "Create new workshops",
        "Edit workshop details",
        "View all your workshops",
        "Track approval status"
      ]
    },
    {
      title: "Sports Facilities",
      description: "View gym schedule and fitness sessions",
      icon: Dumbbell,
      color: "bg-green-500",
      path: "/sports",
      activities: [
        "Yoga",
        "Pilates",
        "Aerobics",
        "Zumba",
        "Cross Circuit",
        "Kick-boxing"
      ]
    }
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
            Welcome, Professor {userName}! Manage your workshops and access university facilities.
          </p>
        </div>

        {/* Workshop Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
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
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                Successfully approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.needsRevision}</div>
              <p className="text-xs text-muted-foreground">
                Requires updates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left Column - Upcoming Events */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
            
            <EventSearch 
              onSearchResults={handleSearchResults}
              onLoading={handleLoading}
              onError={handleError}
              className="mb-6"
            />

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event: any, index: number) => {
                  const eventType = (event.eventType || "academic").toLowerCase();
                  const isWorkshop = eventType.includes("workshop");
                  const isBazaarOrBooth = eventType.includes("bazaar") || eventType.includes("booth");
                  const imageSrc = event.image || getEventImage(event.eventType, event.name);
                  
                  // Check if registration is available
                  const now = new Date();
                  const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
                  const isBeforeDeadline = !registrationDeadline || now <= registrationDeadline;
                  const hasCapacity = !event.capacity || (event.attendeesCount || 0) < event.capacity;
                  const canRegister = isWorkshop && isBeforeDeadline && hasCapacity;
                  
                  return (
                    <Card key={event._id || index} className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
                      {/* Event Image */}
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                        <img
                          src={imageSrc}
                          alt={event.name || "Event"}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>

                      <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-xl line-clamp-2">{event.name || "Untitled Event"}</CardTitle>
                          <CategoryBadge category={(event.eventType || "academic") as EventCategory} />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4 flex-1 flex flex-col">
                        <div className="flex-1 space-y-4">
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-2 text-sm">
                            {/* Start Date & Time */}
                            {event.startDate && (
                              <div className="flex items-start text-muted-foreground">
                                <Calendar className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-foreground">Start</div>
                                  <div>{formatDate(event.startDate)} at {formatTime(event.startDate)}</div>
                                </div>
                              </div>
                            )}
                            
                            {/* End Date & Time */}
                            {event.endDate && (
                              <div className="flex items-start text-muted-foreground">
                                <Calendar className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-foreground">End</div>
                                  <div>{formatDate(event.endDate)} at {formatTime(event.endDate)}</div>
                                </div>
                              </div>
                            )}

                            {/* Location */}
                            {event.location && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            {/* Attendees */}
                            <div className="flex items-center text-muted-foreground">
                              <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                              <span>{event.attendeesCount || 0} attendees</span>
                            </div>

                            {/* Capacity */}
                            {event.capacity && (
                              <div className="text-xs text-muted-foreground ml-6">
                                Capacity: {event.attendeesCount || 0} / {event.capacity}
                                {(event.attendeesCount || 0) >= event.capacity && (
                                  <span className="text-red-500 font-semibold ml-2">(Full)</span>
                                )}
                              </div>
                            )}

                            {/* Registration Deadline */}
                            {event.registrationDeadline && (
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span>
                                  Registration deadline: {formatDate(event.registrationDeadline)}
                                  {new Date() > new Date(event.registrationDeadline) && (
                                    <span className="text-red-500 font-semibold ml-2">(Closed)</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Vendors Section for Bazaar/Booth */}
                          {isBazaarOrBooth && event.vendors && event.vendors.length > 0 && (
                            <div className="pt-3 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                  <Store className="h-4 w-4 text-primary" />
                                  <span>Participating Vendors ({event.vendors.length})</span>
                                </div>
                                {event.vendors.length > 5 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto py-1 px-2 text-xs"
                                    onClick={() => setExpandedVendors(prev => ({
                                      ...prev,
                                      [event._id]: !prev[event._id]
                                    }))}
                                  >
                                    {expandedVendors[event._id] ? "Show less" : "Show more"}
                                  </Button>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {(() => {
                                  const vendorNames = event.vendors
                                    .map((v: any) => v.vendorName)
                                    .filter(Boolean) as string[];
                                  const isExpanded = expandedVendors[event._id];
                                  const shown = isExpanded ? vendorNames : vendorNames.slice(0, 5);
                                  
                                  return (
                                    <div className="space-y-1">
                                      {shown.map((name: string, idx: number) => (
                                        <div key={idx} className="flex items-center">
                                          <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                                          {name}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          {canRegister && (
                            <Button
                              className="flex-1"
                              onClick={() => console.log("Register:", event.name)}
                            >
                              Register
                            </Button>
                          )}
                          <Button
                            className={canRegister ? "flex-1" : "w-full"}
                            variant="outline"
                            onClick={() => console.log("View details:", event.name)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                  <p className="text-muted-foreground text-center">
                    There are no upcoming events at the moment.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Access */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
              <div className="space-y-6">
                {quickActions.map((action) => (
                  <Card key={action.title} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`${action.color} p-3 rounded-lg`}>
                            <action.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{action.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {action.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex-1">
                        {action.features && (
                          <ul className="space-y-2 mb-4">
                            {action.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center text-sm text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                        {action.activities && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground mb-3">
                              Access the gym schedule to view monthly fitness sessions and book your preferred time slots.
                            </p>
                            <p className="text-sm font-medium mb-3">Available Sessions:</p>
                            <div className="flex flex-wrap gap-2">
                              {action.activities.map((activity, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                >
                                  {activity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        className="w-full mt-auto" 
                        onClick={() => setLocation(action.path)}
                      >
                        Access {action.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
