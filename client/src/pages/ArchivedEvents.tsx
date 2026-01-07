import { useEffect, useState } from "react";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { Card, CardContent } from "@/components/ui/card";
import EventCard from "@/components/EventCard";
import { getEventImage } from "@/lib/eventImages";
import EventDetailsDialog from "@/components/EventsDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/EmptyState";
import { Archive } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

export default function ArchivedEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);
  const { toast } = useToast();

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
    } catch {
      setSelectedEvent(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const fetchAllEvents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        // Fetch archived events from the server
        const res = await fetch(`${API_BASE_URL}/api/events/archived`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to fetch archived events");
        }

        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : [];
        setEvents(items);
      } catch (err: any) {
        setError(err.message || "Failed to fetch archived events");
      } finally {
        setLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  const handleUnarchive = async (eventId: string) => {
    try {
      setUnarchiving(eventId);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/events/${eventId}/unarchive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to unarchive event");
      }

      toast({
        title: "Event unarchived",
        description: "The event has been restored",
      });

      // Remove the event from the list
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err: any) {
      toast({
        title: "Unarchive failed",
        description: err.message || "Failed to unarchive event",
        variant: "destructive",
      });
    } finally {
      setUnarchiving(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Archived Events</h1>
          <p className="text-muted-foreground">
            View and manage archived events
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Loading archived events...
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <EmptyState
            title="No archived events"
            description="Events that have ended will appear here once they are archived."
            icon={Archive}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {events.map((event: any) => (
                  <EventCard
                    key={event._id}
                    id={event._id}
                    title={event.name || "Untitled Event"}
                    category={event.eventType as any}
                    status={event.status}
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
                    capacity={event.capacity || -1}
                    vendors={event.vendors || []}
                    price={event.price}
                    showDetailedView={true}
                    onViewDetails={() => handleCardClick(event._id)}
                    onUnarchive={() => handleUnarchive(event._id)}
                    isUnarchiving={unarchiving === event._id}
                    canDelete={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <EventDetailsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedEvent(null);
        }}
        event={selectedEvent}
        loading={detailsLoading}
      />
    </div>
  );
}
