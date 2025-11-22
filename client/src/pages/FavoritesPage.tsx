import { useState, useEffect } from "react";
import { useFavorites } from "../hooks/useFavorites";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useToast } from "../hooks/use-toast";
import Header from "../components/Header";
import ProfessorHeader from "../components/ProfessorHeader";
import StaffHeader from "../components/StaffHeader";
import StudentHeader from "../components/StudentHeader";
import EventCard from "../components/EventCard";
import type { EventCategory } from "../components/CategoryBadge";

export default function FavoritesPage() {
  const { favorites, loading, error, removeFromFavorites, isEventLoading } =
    useFavorites();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    }
  }, []);

  const renderHeader = () => {
    switch (userRole) {
      case "professor":
        return <ProfessorHeader />;
      case "staff":
      case "ta":
        return <StaffHeader />;
      case "student":
        return <StudentHeader />;
      default:
        return <Header homeOnly hideSearch />;
    }
  };

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

  const getCategoryFromEvent = (event: any): EventCategory => {
    // Get the event type from multiple possible fields
    const rawCategory =
      event.eventType || event.type || event.category || "academic";
    const categoryLower = rawCategory.toLowerCase();

    // Map to valid EventCategory values
    const categoryMap: Record<string, EventCategory> = {
      bazaar: "bazaar",
      workshop: "workshop",
      trip: "trip",
      conference: "conference",
      academic: "academic",
      cultural: "cultural",
      social: "social",
      sports: "sports",
      career: "career",
    };

    // Return mapped category or default to 'academic'
    return (categoryMap[categoryLower] || "academic") as EventCategory;
  };

  // Initial loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your favorites...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto mt-12">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
          <div className="text-center mt-6">
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              My Favorites
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {favorites.length > 0
              ? `You have ${favorites.length} favorite event${favorites.length !== 1 ? "s" : ""}`
              : "Your saved events will appear here"}
          </p>
        </div>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent className="pt-6">
              <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No favorite events yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start exploring events and save your favorites to see them here.
              </p>
              <Button size="lg" className="w-full" asChild>
                <Link to="/events">Browse Events</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((event) => (
              <EventCard
                key={event._id}
                id={event._id}
                title={event.name}
                category={getCategoryFromEvent(event)}
                date={formatEventDate(event.startDate)}
                time={formatEventTime(event.startDate)}
                location={event.location}
                attendees={0}
                image={event.bannerImage}
                description={event.description}
                startDate={event.startDate}
                endDate={event.endDate}
                showActions={true}
                showDetailedView={false}
                onViewDetails={() => setLocation(`/events/${event._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
