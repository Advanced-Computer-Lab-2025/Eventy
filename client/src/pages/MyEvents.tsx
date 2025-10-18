import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Heart, Calendar, MapPin, Clock, Store, GraduationCap, Route, Megaphone, Search, Bell, User as UserIcon, Home, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryBadge, { EventCategory } from "@/components/CategoryBadge";
import EventDetailsDialog from "@/components/EventsDetailsDialog";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import StudentHeader from "@/components/StudentHeader";
import ProfessorHeader from "@/components/ProfessorHeader";
import EventCard from "@/components/EventCard";

// Helper to get token (adjust as needed)
const getToken = () => localStorage.getItem("token");

interface RegisteredEvent {
  _id: string;
  name: string;
  eventType: EventCategory;
  location: string;
  startDate: string;
  endDate: string;
  bannerImage?: string;
  status?: string;
}

export default function MyEvents() {
  const [, setLocation] = useLocation();
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // Get user role from localStorage
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role || "");
    }

    const fetchEvents = async () => {
      setLoading(true);
      try {
        // For local testing, you can just hardcode this
        const apiBaseUrl = "http://localhost:4000";

        const res = await fetch(`${apiBaseUrl}/api/events/me/events`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to fetch events:", res.statusText);
          setRegisteredEvents([]);
          return;
        }

        const data = await res.json();
        setRegisteredEvents(data.data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setRegisteredEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bazaar":
        return Store;
      case "workshop":
        return GraduationCap;
      case "trip":
        return Route;
      case "conference":
        return Megaphone;
      default:
        return Megaphone;
    }
  };

  const handleCancelRegistration = (eventId: string) => {
    alert(
      `Registration cancelled for event ${eventId}. Amount will be refunded.`
    );
  };

  const handleRemoveFavorite = (eventId: string) => {
    alert(`Removed event ${eventId} from favorites.`);
  };

  // Fetch full event details by ID
  const handleCardClick = async (eventId: string) => {
    setDetailsLoading(true);
    setDialogOpen(true);
    try {
      const apiBaseUrl = "http://localhost:4000";
      const res = await fetch(`${apiBaseUrl}/api/events/${eventId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Use appropriate header based on user role */}
      {userRole === "professor" ? (
        <ProfessorHeader homeHref="/professor" />
      ) : userRole === "staff" || userRole === "ta" ? (
        <div className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Logo size="xl" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <ThemeToggle />
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => setLocation("/staff-ta")}
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => setLocation("/my-events")}
              >
                <Calendar className="h-4 w-4" />
                My Events
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => setLocation("/sports")}
              >
                <Dumbbell className="h-4 w-4" />
                Sports Facilities
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <StudentHeader homeHref="/" />
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">
            Manage your registered events
          </p>
        </div>

        <div className="space-y-6">
          {/* REGISTERED EVENTS */}
          {loading ? (
            <div>Loading...</div>
          ) : registeredEvents.length === 0 ? (
            <p className="text-muted-foreground text-center">
              You have not registered for any events yet.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {registeredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  id={event._id}
                  title={event.name}
                  category={event.eventType}
                  date={new Date(event.startDate).toLocaleDateString()}
                  time={new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  location={event.location}
                  attendees={0}
                  image={event.bannerImage}
                  startDate={event.startDate}
                  endDate={event.endDate}
                  showActions={true}
                  onViewDetails={() => handleCardClick(event._id)}
                  onSave={() => {}}
                  onShare={() => {}}
                />
              ))}
            </div>
          )}
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