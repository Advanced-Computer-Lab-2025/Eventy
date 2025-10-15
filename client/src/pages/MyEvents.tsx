import { useEffect, useState } from "react";
import { Heart, Calendar, MapPin, Clock } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryBadge from "@/components/CategoryBadge";

// Helper to get token (adjust as needed)
const getToken = () => localStorage.getItem("token");

export default function MyEvents() {
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleCancelRegistration = (eventId: string) => {
    alert(`Registration cancelled for event ${eventId}. Amount will be refunded.`);
  };

  const handleRemoveFavorite = (eventId: string) => {
    alert(`Removed event ${eventId} from favorites.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">
            Manage your registered events and favorites
          </p>
        </div>

        <Tabs defaultValue="registered" className="space-y-6">
          <TabsList>
            <TabsTrigger value="registered">
              <Calendar className="h-4 w-4 mr-2" />
              Registered Events
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
          </TabsList>

          {/* REGISTERED EVENTS TAB */}
          <TabsContent value="registered" className="space-y-4">
            {loading ? (
              <div>Loading...</div>
            ) : registeredEvents.length === 0 ? (
              <p className="text-muted-foreground text-center">
                You have not registered for any events yet.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {registeredEvents.map((event) => {
                  const startDate = new Date(event.startDate).toLocaleDateString();
                  const endDate = new Date(event.endDate).toLocaleDateString();

                  return (
                    <Card
                      key={event._id}
                      className="overflow-hidden"
                      data-testid={`card-registered-${event._id}`}
                    >
                      <div className="relative aspect-[16/9] bg-muted">
                        <img
                          src={event.bannerImage || "/placeholder.jpg"}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <CategoryBadge category={event.eventType} />
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <h3 className="text-xl font-bold">{event.name}</h3>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {startDate} → {endDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        </div>

                        <Badge className="bg-green-500 hover:bg-green-600">
                          Registered
                        </Badge>

                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleCancelRegistration(event._id)}
                          data-testid={`button-cancel-${event._id}`}
                        >
                          Cancel Registration
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* FAVORITES TAB (Optional future feature) */}
          <TabsContent value="favorites" className="space-y-4">
            {favoriteEvents.length === 0 ? (
              <p className="text-muted-foreground text-center">
                No favorite events added yet.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {favoriteEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden"
                    data-testid={`card-favorite-${event.id}`}
                  >
                    <div className="relative aspect-[16/9] bg-muted">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <CategoryBadge category={event.category} />
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-xl font-bold">{event.title}</h3>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1">Register</Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveFavorite(event.id)}
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
