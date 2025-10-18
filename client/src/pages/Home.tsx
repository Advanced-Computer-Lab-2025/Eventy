import { useState, useEffect } from "react";
import EventCard from "@/components/EventCard";
import EventHero from "@/components/EventHero";
import EventFilters from "@/components/EventFilters";
import EventSearch from "@/components/EventSearch";
import StudentHeader from "@/components/StudentHeader";
import MobileNav from "@/components/MobileNav";
import CreateEventDialog from "@/components/CreateEventDialog";
import { getEventImage } from "@/lib/eventImages";

// Define Event type for type safety
interface Event {
  _id: string;
  name: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  attendeesCount?: number;
  capacity?: number;
  registrationDeadline?: string;
  image?: string;
  description?: string;
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

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [loading, setLoading] = useState(true); // Initial loading state
  const [error, setError] = useState("");

  const handleSearchResults = (results: any[]) => {
    setEvents(results);
    // After first results, we're no longer in initial loading
    if (loading) setLoading(false);
  };

  const handleLoading = (isLoading: boolean) => {
    // Only show loading overlay on initial load
    if (events.length === 0) {
      setLoading(isLoading);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />

      <main className="pb-20 md:pb-8">
        {!loading && events.length > 0 && (
          <EventHero
            title={events[0].name || "Untitled Event"}
            category={(events[0].eventType || "academic") as any}
            date={events[0].startDate
              ? new Date(events[0].startDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "TBA"}
            time={events[0].startDate
              ? new Date(events[0].startDate).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "TBA"}
            location={events[0].location || "Unknown location"}
            attendees={events[0].attendeesCount || 0}
            image={events[0].image || getEventImage(events[0].eventType, events[0].name)}
            description={
              events[0].description ||
              "Discover and register for exciting upcoming events across campus."
            }
            onRegister={() => console.log("Register:", events[0].name)}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                <EventFilters />
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
                <p className="text-muted-foreground">
                  Discover exciting events happening at your university
                </p>
              </div>

              {/* Event Search */}
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
                      date={event.startDate
                        ? new Date(event.startDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBA"}
                      time={event.startDate
                        ? new Date(event.startDate).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "TBA"}
                      location={event.location || "Unknown location"}
                      attendees={event.attendeesCount || 0}
                      image={event.image}
                      description={event.description}
                      startDate={event.startDate}
                      endDate={event.endDate}
                      capacity={event.capacity}
                      registrationDeadline={event.registrationDeadline}
                      vendors={event.vendors || []}
                      showDetailedView={true}
                      onRegister={() => console.log("Register:", event.name)}
                      onSave={() => console.log("Save:", event.name)}
                      onShare={() => console.log("Share:", event.name)}
                      onViewDetails={() => console.log("View details:", event.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
