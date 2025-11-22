import { useEffect, useState } from "react";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EventCard from "@/components/EventCard";
import { getEventImage } from "@/lib/eventImages";
import EventDetailsDialog from "@/components/EventsDetailsDialog";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function ArchivedEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
    const fetchAllEvents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        // Fetch past events from the server and keep only archived ones
        const res = await fetch(`${API_BASE_URL}/api/events/past`, {
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
        // Keep only events that are archived
        setEvents(items.filter((e: any) => e.status === "archived"));
      } catch (err: any) {
        setError(err.message || "Failed to fetch archived events");
      } finally {
        setLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Archived Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading archived events...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground">No archived events found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {events.map((event: any) => (
                  <EventCard
                    key={event._id}
                    id={event._id}
                    title={event.name || "Untitled Event"}
                    category={event.eventType as any}
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
                    showDetailedView={true}
                    onViewDetails={() => handleCardClick(event._id)}
                    // Archived events must not be deletable from the UI
                    canDelete={false}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
