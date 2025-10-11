import { Heart, Calendar, MapPin, Clock } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryBadge from "@/components/CategoryBadge";

//todo: remove mock functionality
const registeredEvents = [
  {
    id: "1",
    title: "AI & Machine Learning Workshop",
    category: "academic" as const,
    date: "March 15, 2024",
    time: "2:00 PM - 5:00 PM",
    location: "Engineering Building",
    status: "upcoming",
    image: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=400&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Spring Festival",
    category: "cultural" as const,
    date: "March 20, 2024",
    time: "6:00 PM - 10:00 PM",
    location: "Main Quadrangle",
    status: "upcoming",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&auto=format&fit=crop",
  },
];

const favoriteEvents = [
  {
    id: "3",
    title: "Career Fair 2024",
    category: "career" as const,
    date: "March 25, 2024",
    time: "10:00 AM - 4:00 PM",
    location: "Convention Center",
    image: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&auto=format&fit=crop",
  },
];

export default function MyEvents() {
  const handleCancelRegistration = (eventId: string) => {
    console.log("Cancel registration:", eventId);
    alert("Registration cancelled. Amount will be refunded to your wallet.");
  };

  const handleRemoveFavorite = (eventId: string) => {
    console.log("Remove from favorites:", eventId);
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
            <TabsTrigger value="registered" data-testid="tab-registered">
              <Calendar className="h-4 w-4 mr-2" />
              Registered Events
            </TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registered" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {registeredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden" data-testid={`card-registered-${event.id}`}>
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

                    <Badge className="bg-green-500 hover:bg-green-600">Registered</Badge>

                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleCancelRegistration(event.id)}
                      data-testid={`button-cancel-${event.id}`}
                    >
                      Cancel Registration
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {favoriteEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden" data-testid={`card-favorite-${event.id}`}>
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
                      <Button className="flex-1" data-testid={`button-register-${event.id}`}>
                        Register
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveFavorite(event.id)}
                        data-testid={`button-remove-${event.id}`}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
