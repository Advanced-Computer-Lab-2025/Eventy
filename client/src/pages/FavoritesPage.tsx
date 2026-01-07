import { useState, useEffect } from "react";
import { useFavorites } from "../hooks/useFavorites";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "../components/ui/alert";
import Header from "../components/Header";
import ProfessorHeader from "../components/ProfessorHeader";
import StaffHeader from "../components/StaffHeader";
import StudentHeader from "../components/StudentHeader";
import EventCard from "../components/EventCard";
import type { EventCategory } from "../components/CategoryBadge";

export default function FavoritesPage() {
  const { favorites, loading, error, refetch } = useFavorites();
  const [userRole] = useState<string | null>(() => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return null;
      const parsed = JSON.parse(user);
      return parsed.role ?? null;
    } catch {
      return null;
    }
  });

  // Poll for updates every 30 seconds to check for archived events
  useEffect(() => {
    const interval = setInterval(() => {
      if (refetch && !loading) {
        refetch();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [refetch, loading]);

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    switch (userRole?.toLowerCase()) {
      case "professor":
        return "/professor";
      case "staff":
      case "ta":
        return "/staff-ta";
      case "student":
        return "/home";
      default:
        return "/home";
    }
  };

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

  const formatBoothDate = (event: any) => {
    // If platform booth has startDate and endDate, show dates
    if (event.startDate && event.endDate) {
      const start = formatEventDate(event.startDate);
      const end = formatEventDate(event.endDate);
      return `${start} - ${end}`;
    }
    // Otherwise fall back to duration
    if (event.durationWeeks) {
      return `Active for ${event.durationWeeks} week${event.durationWeeks > 1 ? "s" : ""}`;
    }
    return "TBA";
  };

  const getCategoryFromEvent = (event: any): EventCategory => {
    // Get the event type from multiple possible fields
    const rawCategory =
      event.eventType || event.type || event.category || "academic";
    const categoryLower = rawCategory.toLowerCase();

    // Map to valid EventCategory values
    // platform_booth maps to booth (not bazaar - they are different)
    const categoryMap: Record<string, EventCategory> = {
      bazaar: "bazaar",
      platform_booth: "booth", // Map platform_booth to booth (not bazaar)
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
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
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            My Favorites
          </h1>
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
                <Link to={getDashboardRoute()}>Browse Events</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((event) => {
              const isBoothEvent = event.eventType === "platform_booth";
              return (
                <EventCard
                  key={event._id}
                  id={event._id}
                  title={event.name}
                  category={getCategoryFromEvent(event)}
                  date={
                    isBoothEvent
                      ? formatBoothDate(event)
                      : formatEventDate(event.startDate)
                  }
                  time={
                    isBoothEvent && !event.startDate
                      ? ""
                      : formatEventTime(event.startDate)
                  }
                  location={
                    event.location ||
                    (event.eventType === "platform_booth"
                      ? event.locationPreference
                      : null) ||
                    "Unknown location"
                  }
                  attendees={event.attendeesCount || 0}
                  image={event.bannerImage}
                  description={event.description}
                  startDate={event.startDate}
                  endDate={event.endDate}
                  durationWeeks={event.durationWeeks}
                  showActions={true}
                  showDetailedView={false}
                  showAttendees={false}
                  showRegisterButton={false}
                  // NEW PROPS
                  eventData={event}
                  inlineShareButton={true}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
