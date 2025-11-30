import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Heart,
  Calendar,
  MapPin,
  Clock,
  Store,
  GraduationCap,
  Route,
  Megaphone,
  Search,
  Bell,
  User as UserIcon,
  Home,
  Dumbbell,
} from "lucide-react";
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
import StaffHeader from "@/components/StaffHeader";
import EventCard from "@/components/EventCard";
import EventFeedbackDialog from "@/components/EventFeedbackDialog";

// Helper to get token
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
  price?: number;
  attendeesCount?: number;
  attendees?: string[]; // Assuming backend returns array of IDs
  durationWeeks?: number;
  locationPreference?: string;
}

export default function MyEvents() {
  const [, setLocation] = useLocation();
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>(
    []
  );
  const [favoriteEvents, setFavoriteEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedEventForFeedback, setSelectedEventForFeedback] =
    useState<RegisteredEvent | null>(null);

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

    // Listen for registrations happening elsewhere in the app and refetch
    const onRegistered = (e: any) => {
      try {
        // If the event was passed and user already has it, skip; otherwise refetch
        fetchEvents();
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("event:registered", onRegistered as any);

    return () => {
      window.removeEventListener("event:registered", onRegistered as any);
    };
  }, []);

  // Fetch full event details by ID
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatBoothDate = (durationWeeks: number) => {
    return `Active for ${durationWeeks} week${durationWeeks > 1 ? "s" : ""}`;
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Use appropriate header based on user role */}
      {userRole === "professor" ? (
        <ProfessorHeader homeHref="/professor" />
      ) : userRole === "staff" || userRole === "ta" ? (
        <StaffHeader />
      ) : (
        <StudentHeader />
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">Manage your registered events</p>
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
              {registeredEvents.map((event) => {
                const isBoothEvent =
                  String(event.eventType).toLowerCase() === "platform_booth";
                return (
                  <EventCard
                    key={event._id}
                    id={event._id}
                    title={event.name}
                    category={event.eventType}
                    date={
                      isBoothEvent && event.durationWeeks
                        ? formatBoothDate(event.durationWeeks)
                        : formatEventDate(event.startDate)
                    }
                    time={
                      isBoothEvent && event.durationWeeks
                        ? ""
                        : formatEventTime(event.startDate)
                    }
                    location={
                      event.location ||
                      (isBoothEvent ? event.locationPreference : null) ||
                      "Unknown location"
                    }
                    // FIX: Pass actual attendee data
                    attendees={
                      event.attendees
                        ? event.attendees.length
                        : event.attendeesCount || 0
                    }
                    image={event.bannerImage}
                    startDate={event.startDate}
                    endDate={event.endDate}
                    durationWeeks={event.durationWeeks}
                    showActions={true}
                    isRegistered={true}
                    hideRegisterButton={
                      userRole === "student" ||
                      userRole === "professor" ||
                      userRole === "staff" ||
                      userRole === "ta"
                    }
                    price={event.price || 0}
                    allowCancellation={true}
                    showAttendeeCount={false}
                    inlinePriceWithLocation
                    // CALLBACK to remove from list instantly
                    onUnregister={() => {
                      setRegisteredEvents((prev) =>
                        prev.filter((e) => e._id !== event._id)
                      );
                    }}
                    onViewDetails={() => handleCardClick(event._id)}
                    onFeedback={() => {
                      setSelectedEventForFeedback(event);
                      setFeedbackDialogOpen(true);
                    }}
                  />
                );
              })}
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

        {selectedEventForFeedback && (
          <EventFeedbackDialog
            open={feedbackDialogOpen}
            onOpenChange={(open) => {
              setFeedbackDialogOpen(open);
              if (!open) setSelectedEventForFeedback(null);
            }}
            eventId={selectedEventForFeedback._id}
            eventName={selectedEventForFeedback.name}
          />
        )}
      </main>
    </div>
  );
}
