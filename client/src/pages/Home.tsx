import { useState, useEffect } from "react";
import EventCard from "@/components/EventCard";
import EventFilters from "@/components/EventFilters";
import EventSearch from "@/components/EventSearch";
import StudentHeader from "@/components/StudentHeader";
import MobileNav from "@/components/MobileNav";
import CreateEventDialog from "@/components/CreateEventDialog";
import { useToast } from "@/hooks/use-toast";
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
  attendees?: string[];
  capacity?: number;
  registrationDeadline?: string;
  image?: string;
  bannerImage?: string;
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
  const { toast } = useToast();

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

  const handleSearchResults = (results: any[]) => {
    // Sort events to prioritize bazaars first, then by startDate
    const sortedResults = [...results].sort((a, b) => {
      const aIsBazaar = a.eventType === "bazaar";
      const bIsBazaar = b.eventType === "bazaar";

      // If one is a bazaar and the other isn't, bazaar comes first
      if (aIsBazaar && !bIsBazaar) return -1;
      if (!aIsBazaar && bIsBazaar) return 1;

      // If both are bazaars or both are not, sort by startDate
      const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aDate - bDate;
    });

    setEvents(sortedResults);
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
                      capacity={event.capacity}
                      registrationDeadline={event.registrationDeadline}
                      onRegister={() => handleRegisterEvent(event._id)}
                      showDetailedView={true}
                      onSave={() => console.log("Save:", event.name)}
                      onShare={() => console.log("Share:", event.name)}
                      onViewDetails={() =>
                        console.log("View details:", event.name)
                      }
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
