import { useState, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "@/components/ui/card";
import EventDetailsDialog from "@/components/EventsDetailsDialog";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/apiBase";

const localizer = momentLocalizer(moment);
const API_BASE_URL = getApiBaseUrl();

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
  onUnregister?: () => void;
  defaultDate?: Date;
  defaultView?: View;
  className?: string;
  customToolbarComponent?: React.ReactNode;
  messages?: {
    noEventsInRange?: React.ReactNode;
  };
}

export default function BigCalendarView({
  events,
  onEventClick,
  onUnregister,
  defaultDate,
  defaultView = "month",
  className = "",
  customToolbarComponent,
  messages,
}: BigCalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
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
    async (calendarEvent: any) => {
      const eventId = calendarEvent.id;
      setIsLoadingDetails(true);
      try {
        // Fetch complete event details from the database
        const token = localStorage.getItem("token");
        logger.info(
          "Fetching event:",
          eventId,
          "API URL:",
          `${API_BASE_URL}/api/events/${eventId}`
        );

        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        logger.info("API Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          logger.info("API Response data:", data);
          const eventData = data.data || data;
          logger.info("Setting selected event:", eventData);
          setSelectedEvent(eventData);
          onEventClick?.(eventData);
        } else {
          // Fallback to the resource data if API call fails
          logger.warn("API call failed, using fallback data");
          const event = calendarEvent.resource as Event;
          setSelectedEvent(event);
          onEventClick?.(event);
        }
      } catch (error) {
        logger.error("Error fetching event details:", error);
        // Fallback to the resource data if fetch fails
        const event = calendarEvent.resource as Event;
        setSelectedEvent(event);
        onEventClick?.(event);
      } finally {
        setIsLoadingDetails(false);
        setIsDialogOpen(true);
      }
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
          {customToolbarComponent}
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
          messages={messages}
          date={currentDate}
          onNavigate={setCurrentDate}
          view={currentView}
          onView={setCurrentView}
          popup
          showMultiDayTimes
        />
      </Card>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        event={selectedEvent}
        loading={isLoadingDetails}
      />
    </>
  );
}
