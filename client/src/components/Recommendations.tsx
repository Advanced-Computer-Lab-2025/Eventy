import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Sparkles, TrendingUp, Calendar, MapPin } from "lucide-react";
import { getEventImage } from "@/lib/eventImages";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EventDetailsDialog from "@/components/EventsDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import { EventPaymentDialog } from "./EventPaymentDialog";

interface RecommendationResponse {
  type: "popular" | "personalized";
  events: any[];
  reason: string;
}

function CompactEventCard({ event }: { event: any }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  const [localIsRegistered, setLocalIsRegistered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeout = useRef<any>(null);

  // Get current user info
  const token = localStorage.getItem("token");
  let currentUserId = "";
  let userRole = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.id || payload._id;
      userRole = payload.role;
    } catch (e) {}
  }

  // Check registration status
  const isRegistered =
    localIsRegistered ||
    (event.attendees &&
      Array.isArray(event.attendees) &&
      event.attendees.some((att: any) => {
        const attId = typeof att === "string" ? att : att._id;
        return attId === currentUserId;
      }));

  // Check if professor in workshop
  const isProfessorInWorkshop =
    userRole === "professor" &&
    event.eventType === "workshop" &&
    event.professors?.some((prof: any) => {
      const profId = prof._id || prof;
      return profId === currentUserId;
    });

  const isArchived = event.status === "archived";
  const isBeforeDeadline = event.registrationDeadline
    ? new Date() <= new Date(event.registrationDeadline)
    : true;

  const isRegisterable =
    ["workshop", "trip", "conference"].includes(event.eventType) &&
    event.status === "approved";

  const requiresPayment = event.price && event.price > 0;

  // Check if event is full
  const isFull =
    event.capacity &&
    event.attendees &&
    event.attendees.length >= event.capacity;

  const canRegister =
    !isRegistered &&
    isRegisterable &&
    isBeforeDeadline &&
    !isArchived &&
    !isFull &&
    !isProfessorInWorkshop &&
    userRole !== "admin" &&
    userRole !== "events_office";

  const handleDirectRegister = async () => {
    if (!token) {
      toast({ title: "Error", description: "Please login to register" });
      return;
    }
    setIsRegistering(true);
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const res = await fetch(
        `${API_BASE_URL}/api/events/${event._id}/register`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }
      toast({ title: "Success", description: "Registered successfully!" });
      setLocalIsRegistered(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <Card
        className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group hover:ring-[0.5px] hover:ring-primary/10"
        onClick={() => setShowDetails(true)}
        onMouseEnter={() => {
          hoverTimeout.current = setTimeout(() => setIsHovering(true), 300);
        }}
        onMouseLeave={() => {
          if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
          setIsHovering(false);
        }}
        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
      >
        <div className="relative h-32 overflow-hidden shrink-0 rounded-t-lg">
          <img
            src={
              event.image || event.bannerImage || getEventImage(event.eventType)
            }
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-2 right-2">
            <Badge
              variant="default"
              className="capitalize text-xs font-semibold shadow-sm"
            >
              {event.eventType === "platform_booth"
                ? "Platform Booth"
                : String(event.eventType).replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
        <CardContent className="p-3 flex flex-col flex-1">
          <h3
            className="font-semibold text-sm line-clamp-2 mb-3 leading-snug text-foreground"
            title={event.name}
          >
            {event.name}
          </h3>
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {new Date(event.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-1 leading-relaxed">
                {event.location || "TBD"}
              </span>
            </div>
          </div>

          <div className="mt-auto flex gap-2">
            {canRegister ? (
              <Button
                size="sm"
                variant="default"
                className="w-full text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  if (requiresPayment) {
                    setShowPaymentDialog(true);
                  } else {
                    handleDirectRegister();
                  }
                }}
                disabled={isRegistering}
              >
                {isRegistering ? "Registering..." : "Register"}
              </Button>
            ) : isRegistered ? (
              <Button
                size="sm"
                variant="default"
                className="w-full mt-auto cursor-default"
                disabled
              >
                Registered
              </Button>
            ) : isFull ? (
              <Button
                size="sm"
                variant="secondary"
                className="w-full mt-auto cursor-default opacity-60"
                disabled
              >
                Event Full
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      {isHovering &&
        createPortal(
          <div
            className="fixed z-[100] pointer-events-none bg-popover text-popover-foreground text-sm px-3 py-1.5 rounded-md border shadow-md animate-in fade-in-0 zoom-in-95"
            style={{
              left: tooltipPos.x + 16,
              top: tooltipPos.y + 16,
            }}
          >
            Click on event to view details
          </div>,
          document.body
        )}

      <EventDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        event={{
          _id: event._id,
          id: event._id,
          name: event.name, // Changed from title to name
          eventType:
            event.eventType === "platform_booth" ? "booth" : event.eventType, // Changed from category to eventType
          date: new Date(event.startDate).toLocaleDateString(),
          time: event.startTime || "TBD",
          location: event.location || "TBD",
          attendees: event.attendees?.length || 0,
          attendeesList: event.attendees,
          image:
            event.image || event.bannerImage || getEventImage(event.eventType),
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime, // Added explicit startTime
          endTime: event.endTime, // Added explicit endTime
          dbStartTime: event.startTime,
          dbEndTime: event.endTime,
          price: event.price,
          capacity: event.capacity,
          registrationDeadline: event.registrationDeadline,
          vendors: event.vendors,
          status: event.status,
          createdBy: event.createdBy,
          agenda: event.agenda,
          professors: event.professors,
          faculty: event.faculty,
          boothSize: event.boothSize,
          durationWeeks: event.durationWeeks,
        }}
      />

      <EventPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        eventId={event._id}
        price={event.price || 0}
        onRegistered={() => {
          setLocalIsRegistered(true);
          toast({ title: "Success", description: "Registered successfully!" });
        }}
      />
    </>
  );
}

export default function Recommendations() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Reset recommendations is disabled to avoid accidental data loss during testing.
  // const handleReset = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const API_BASE_URL =
  //       import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  //
  //     await fetch(`${API_BASE_URL}/api/recommendations/reset`, {
  //       method: "POST",
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //
  //     toast({
  //       title: "Recommendations Reset",
  //       description: "Your interaction history has been cleared.",
  //     });
  //
  //     window.location.reload();
  //   } catch (err) {
  //     console.error("Failed to reset", err);
  //   }
  // };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const res = await fetch(`${API_BASE_URL}/api/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data.events.length > 0) {
          setData(json.data);
        } else {
          setData(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchRecommendations();

    // Listen for custom events that should trigger a refresh
    const handleRefresh = () => {
      // Small delay to ensure backend has processed the action
      setTimeout(() => {
        fetchRecommendations();
      }, 500);
    };

    // Listen for various user interactions
    window.addEventListener("event-viewed", handleRefresh);
    window.addEventListener("event-favorited", handleRefresh);
    window.addEventListener("event-unfavorited", handleRefresh);
    window.addEventListener("event-registered", handleRefresh);
    window.addEventListener("event-unregistered", handleRefresh);
    // Also listen for the existing event:registered event (with colon)
    window.addEventListener("event:registered", handleRefresh);

    return () => {
      window.removeEventListener("event-viewed", handleRefresh);
      window.removeEventListener("event-favorited", handleRefresh);
      window.removeEventListener("event-unfavorited", handleRefresh);
      window.removeEventListener("event-registered", handleRefresh);
      window.removeEventListener("event-unregistered", handleRefresh);
      window.removeEventListener("event:registered", handleRefresh);
    };
  }, []);

  // Show loading skeleton instead of null
  if (loading) {
    return (
      <div className="mb-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 px-1">
          <div className="p-2.5 rounded-xl shadow-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-1 ring-primary/20 animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[230px] w-[230px]">
              <Card className="h-full animate-pulse">
                <div className="h-32 bg-muted rounded-t-lg" />
                <CardContent className="p-3 space-y-3">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-8 w-full bg-muted rounded mt-4" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mb-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 px-1">
        <div
          className={`p-2.5 rounded-xl shadow-sm ${data.type === "personalized" ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-1 ring-primary/20" : "bg-gradient-to-br from-orange-500/20 to-orange-500/10 text-orange-600 ring-1 ring-orange-500/20"}`}
        >
          {data.type === "personalized" ? (
            <Sparkles className="h-5 w-5 animate-pulse" />
          ) : (
            <TrendingUp className="h-5 w-5" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {data.type === "personalized"
              ? "Recommended for You"
              : "Popular Events"}
          </h2>
          <p className="text-sm text-muted-foreground">{data.reason}</p>
        </div>
        <div className="ml-auto">
          {/* Reset Recommendations temporarily disabled for safety */}
        </div>
      </div>

      <div className="relative group/container pt-2 -mx-6 px-6">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30">
          {data.events
            .filter((event) => {
              // Filter out full events
              const isFull =
                event.capacity &&
                event.attendees &&
                event.attendees.length >= event.capacity;
              return !isFull;
            })
            .slice(0, 5)
            .map((event) => (
              <div
                key={event._id}
                className="min-w-[230px] w-[230px] snap-start relative mt-1"
              >
                <CompactEventCard event={event} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
