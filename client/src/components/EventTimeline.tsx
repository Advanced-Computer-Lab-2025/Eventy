import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Event {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  eventType?: string;
  bannerImage?: string;
}

interface EventTimelineProps {
  events: Event[];
  className?: string;
  maxEvents?: number;
}

export default function EventTimeline({
  events,
  className = "",
  maxEvents = 10,
}: EventTimelineProps) {
  const sortedEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((e) => new Date(e.startDate) >= now)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      .slice(0, maxEvents);
  }, [events, maxEvents]);

  const getTimeUntilEvent = (startDate: string): string => {
    const now = new Date();
    const eventDate = new Date(startDate);
    const diffMs = eventDate.getTime() - now.getTime();

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 7) {
      return `in ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""}`;
    } else if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    } else if (diffMinutes > 0) {
      return `in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    } else {
      return "Starting now!";
    }
  };

  const getEventColor = (eventType?: string): string => {
    const colorMap: Record<string, string> = {
      workshop: "bg-purple-100 text-purple-700 border-purple-300",
      conference: "bg-blue-100 text-blue-700 border-blue-300",
      trip: "bg-green-100 text-green-700 border-green-300",
      bazaar: "bg-amber-100 text-amber-700 border-amber-300",
      sports: "bg-red-100 text-red-700 border-red-300",
    };
    return (
      colorMap[eventType?.toLowerCase() || ""] ||
      "bg-gray-100 text-gray-700 border-gray-300"
    );
  };

  if (sortedEvents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-12">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

            <div className="space-y-6">
              {sortedEvents.map((event, index) => {
                const isFirst = index === 0;
                const timeUntil = getTimeUntilEvent(event.startDate);

                return (
                  <div key={event._id} className="relative pl-14">
                    {/* Timeline dot */}
                    <div
                      className={`
                        absolute left-3.5 top-3 w-5 h-5 rounded-full border-4
                        ${isFirst ? "bg-primary border-primary animate-pulse" : "bg-background border-primary"}
                      `}
                    />

                    {/* Event card */}
                    <Card className={`${isFirst ? "ring-2 ring-primary" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            {/* Event type badge and time */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {event.eventType && (
                                <Badge
                                  variant="outline"
                                  className={`capitalize ${getEventColor(event.eventType)}`}
                                >
                                  {event.eventType}
                                </Badge>
                              )}
                              <Badge
                                variant="secondary"
                                className={
                                  isFirst
                                    ? "bg-primary text-primary-foreground"
                                    : ""
                                }
                              >
                                {timeUntil}
                              </Badge>
                            </div>

                            {/* Event name */}
                            <h3 className="font-semibold text-lg leading-tight">
                              {event.name}
                            </h3>

                            {/* Event details */}
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {new Date(event.startDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Action button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 w-full justify-between"
                              onClick={() => {
                                window.location.href = `/events/${event._id}`;
                              }}
                            >
                              View Details
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Event thumbnail */}
                          {event.bannerImage && (
                            <div className="flex-shrink-0">
                              <img
                                src={event.bannerImage}
                                alt={event.name}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {events.filter((e) => new Date(e.startDate) >= new Date()).length >
          maxEvents && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/my-events";
              }}
            >
              View All Events
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
