import { useState, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar as CalendarIcon, Users } from "lucide-react";

const localizer = momentLocalizer(moment);

interface Event {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
  eventType?: string;
  attendeesCount?: number;
  bannerImage?: string;
  price?: number;
  status?: string;
}

interface BigCalendarViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  defaultDate?: Date;
  defaultView?: View;
  className?: string;
}

export default function BigCalendarView({
  events,
  onEventClick,
  defaultDate,
  defaultView = "month",
  className = "",
}: BigCalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(defaultDate || new Date());
  const [currentView, setCurrentView] = useState<View>(defaultView);

  // Transform events for react-big-calendar
  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event._id,
      title: event.name,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      resource: event, // Store full event data
    }));
  }, [events]);

  const handleSelectEvent = useCallback(
    (calendarEvent: any) => {
      const event = calendarEvent.resource as Event;
      setSelectedEvent(event);
      setIsDialogOpen(true);
      onEventClick?.(event);
    },
    [onEventClick]
  );

  // Custom event style getter
  const eventStyleGetter = useCallback((calendarEvent: any) => {
    const event = calendarEvent.resource as Event;

    // Color code by event type
    const colorMap: Record<string, string> = {
      workshop: "#8b5cf6", // purple
      conference: "#3b82f6", // blue
      trip: "#10b981", // green
      bazaar: "#f59e0b", // amber
      sports: "#ef4444", // red
      default: "#6366f1", // indigo
    };

    const backgroundColor =
      colorMap[event.eventType?.toLowerCase() || "default"] || colorMap.default;

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "13px",
        fontWeight: "500",
        padding: "4px 8px",
      },
    };
  }, []);

  // Custom toolbar component
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate("PREV");
    };

    const goToNext = () => {
      toolbar.onNavigate("NEXT");
    };

    const goToToday = () => {
      toolbar.onNavigate("TODAY");
    };

    const label = () => {
      const date = moment(toolbar.date);
      if (toolbar.view === "month") {
        return date.format("MMMM YYYY");
      } else if (toolbar.view === "week") {
        return `Week of ${date.format("MMM DD, YYYY")}`;
      } else if (toolbar.view === "day") {
        return date.format("MMMM DD, YYYY");
      }
      return date.format("MMMM DD, YYYY");
    };

    return (
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <h2 className="text-2xl font-bold">{label()}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToBack}>
            ←
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            →
          </Button>
          <div className="flex gap-1 ml-2">
            <Button
              variant={toolbar.view === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => toolbar.onView("month")}
            >
              Month
            </Button>
            <Button
              variant={toolbar.view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => toolbar.onView("week")}
            >
              Week
            </Button>
            <Button
              variant={toolbar.view === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => toolbar.onView("day")}
            >
              Day
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className={`p-6 ${className}`}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar,
          }}
          date={currentDate}
          onNavigate={setCurrentDate}
          view={currentView}
          onView={setCurrentView}
          popup
          showMultiDayTimes
        />
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedEvent?.name}
            </DialogTitle>
            <DialogDescription>Event Details</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.bannerImage && (
                <img
                  src={selectedEvent.bannerImage}
                  alt={selectedEvent.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Start Date</p>
                    <p className="text-muted-foreground">
                      {moment(selectedEvent.startDate).format(
                        "MMM DD, YYYY h:mm A"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">End Date</p>
                    <p className="text-muted-foreground">
                      {moment(selectedEvent.endDate).format(
                        "MMM DD, YYYY h:mm A"
                      )}
                    </p>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">
                        {selectedEvent.location}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.attendeesCount !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Attendees</p>
                      <p className="text-muted-foreground">
                        {selectedEvent.attendeesCount}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.price !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <div>
                      <p className="font-medium">Price</p>
                      <p className="text-muted-foreground">
                        {selectedEvent.price === 0
                          ? "Free"
                          : `$${selectedEvent.price}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.eventType && (
                <div>
                  <Badge variant="secondary" className="capitalize">
                    {selectedEvent.eventType}
                  </Badge>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <p className="font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    // Navigate to event details page
                    window.location.href = `/events/${selectedEvent._id}`;
                  }}
                  className="flex-1"
                >
                  View Full Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
