// client/src/pages/EventListPage.tsx
import { useState, useEffect } from "react";
import EventListItem from "@/components/EventListItem";
import { getEventImage } from "@/lib/eventImages";

export default function EventListPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from the backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle delete
  const handleDelete = async (eventId: string) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete event");

      // Remove deleted event from state so UI updates immediately
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      alert("Event deleted successfully ✅");
    } catch (err) {
      alert("Failed to delete event ❌");
      logger.error(err);
    }
  };

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (events.length === 0) return <p>No events found.</p>;

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventListItem
          key={event._id}
          id={event._id}
          title={event.name}
          category={event.eventType}
          date={new Date(event.startDate).toLocaleDateString()}
          time={`${new Date(event.startDate).toLocaleTimeString()} - ${new Date(event.endDate).toLocaleTimeString()}`}
          location={
            event.location ||
            (event.eventType === "platform_booth"
              ? event.locationPreference
              : null) ||
            "Unknown location"
          }
          image={
            event.bannerImage ||
            event.image ||
            getEventImage(event.eventType, event.name) ||
            "/placeholder.png"
          }
          canDelete={true} // show delete button for admins/events office
          onDelete={handleDelete} // pass the delete handler
        />
      ))}
    </div>
  );
}
