import { useState } from "react";
import StaffHeader from "@/components/StaffHeader";
import EventCard from "@/components/EventCard";
import EventSearch from "@/components/EventSearch";
import { useToast } from "@/hooks/use-toast";

interface Event {
  _id: string;
  name: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  attendeesCount?: number;
  attendees?: string[]; // List of IDs
  capacity?: number;
  registrationDeadline?: string;
  image?: string;
  bannerImage?: string;
  description?: string;
  price?: number; // Added price
  durationWeeks?: number;
  locationPreference?: string;
  vendors?: Array<{
    vendorId?: string;
    vendorName?: string;
    name?: string;
    vendorEmail?: string;
    type?: string;
    boothSize?: string;
    attendees?: number;
  }>;
}

export default function StaffUpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSearchResults = (results: any[]) => {
    setEvents(results);
    if (loading) setLoading(false);
  };

  const handleLoading = (isLoading: boolean) => {
    if (events.length === 0) {
      setLoading(isLoading);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader homeHref="/staff-ta" />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
          <p className="text-muted-foreground">Browse all upcoming events</p>
        </div>

        <EventSearch
          onSearchResults={handleSearchResults}
          onLoading={handleLoading}
          onError={handleError}
          placeholder="Search events by name, professor, or type..."
          className="mb-6"
        />

        {loading ? (
          <p>Loading events...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : events.length === 0 ? (
          <p>No upcoming events found.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event, index) => (
              <EventCard
                key={event._id || index}
                id={event._id || String(index)}
                title={event.name || "Untitled Event"}
                category={(event.eventType || "academic") as any}
                date={
                  event.startDate
                    ? new Date(event.startDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBA"
                }
                time={
                  event.startDate
                    ? new Date(event.startDate).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "TBA"
                }
                location={
                  event.location ||
                  (event.eventType === "platform_booth"
                    ? event.locationPreference
                    : null) ||
                  "Unknown location"
                }
                // 1. Pass the count for initial display
                attendees={
                  Array.isArray(event.attendees)
                    ? event.attendees.length
                    : event.attendeesCount || 0
                }
                // 2. Pass the list for "Registered" button check
                attendeesList={event.attendees}
                // 3. Pass the price for Payment Dialog logic
                price={event.price || 0}
                image={event.bannerImage || event.image}
                description={event.description}
                startDate={event.startDate}
                endDate={event.endDate}
                durationWeeks={event.durationWeeks}
                capacity={event.capacity}
                registrationDeadline={event.registrationDeadline}
                vendors={event.vendors || []}
                showDetailedView={true}
                // 4. Removed 'onRegister'. EventCard handles this internally now.
                onShare={() => console.log("Share:", event.name)}
                onViewDetails={() => console.log("View details:", event.name)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
