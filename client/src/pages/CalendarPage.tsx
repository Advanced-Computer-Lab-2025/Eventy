import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import StudentHeader from "@/components/StudentHeader";
import BigCalendarView from "@/components/BigCalendarView";
import GoogleCalendarIntegration from "@/components/GoogleCalendarIntegration";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getApiBaseUrl } from "@/lib/apiBase";
import { logger } from "@/lib/logger";

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

export default function CalendarPage() {
  const [location, navigate] = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  useEffect(() => {
    const handler = (e: globalThis.Event) => {
      const custom = e as CustomEvent<{ date?: string }>;
      const raw = custom.detail?.date;
      if (!raw) return;
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return;
      setSelectedDate(parsed);
    };

    window.addEventListener("calendar:jumpToDate", handler as EventListener);
    return () => {
      window.removeEventListener(
        "calendar:jumpToDate",
        handler as EventListener
      );
    };
  }, []);

  useEffect(() => {
    // Allow other UI (e.g., CalendarPopover/MiniCalendar) to deep-link the calendar.
    // Example: /calendar?date=2026-01-06T00:00:00.000Z
    const dateParam = new URLSearchParams(window.location.search).get("date");
    if (!dateParam) {
      setSelectedDate(null);
      return;
    }

    const parsed = new Date(dateParam);
    if (Number.isNaN(parsed.getTime())) {
      setSelectedDate(null);
      return;
    }

    setSelectedDate(parsed);
  }, [location]);

  useEffect(() => {
    fetchUserEvents();

    // Listen for registration and cancellation events to keep all calendars in sync
    const handleRegistration = () => {
      fetchUserEvents();
    };

    const handleCancellation = () => {
      fetchUserEvents();
    };

    window.addEventListener("event:registered", handleRegistration);
    window.addEventListener("event:unregistered", handleCancellation);

    return () => {
      window.removeEventListener("event:registered", handleRegistration);
      window.removeEventListener("event:unregistered", handleCancellation);
    };
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserRole(userData.role);
      } catch {
        setUserRole(null);
      }
    }
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = events;

    if (eventTypeFilter !== "all") {
      filtered = filtered.filter(
        (event) => event.eventType === eventTypeFilter
      );
    }

    setFilteredEvents(filtered);
  }, [events, eventTypeFilter]);

  const fetchUserEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/me/events`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        logger.error("Failed to fetch events:", res.statusText);
        setEvents([]);
        return;
      }

      const data = await res.json();
      setEvents(data.data || []);
      setFilteredEvents(data.data || []);
    } catch (err) {
      logger.error("Error fetching events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCalendar = () => {
    // Generate ICS file for download
    const icsContent = generateICSForAllEvents(filteredEvents);
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "eventy-calendar.ics";
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateICSForAllEvents = (events: Event[]): string => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Eventy//Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Eventy Events",
      "X-WR-TIMEZONE:Africa/Cairo",
    ];

    events.forEach((event) => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      };

      lines.push(
        "BEGIN:VEVENT",
        `UID:${event._id}@eventy.com`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${event.name}`,
        `DESCRIPTION:${event.description || "Event details available on Eventy"}`,
        `LOCATION:${event.location || "TBD"}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };

  const eventTypes = Array.from(
    new Set(events.map((e) => e.eventType).filter(Boolean))
  );

  return (
    <>
      <StudentHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mb-6">
          <GoogleCalendarIntegration />
          <Button variant="outline" size="sm" onClick={exportCalendar}>
            <Download className="h-4 w-4 mr-2" />
            Export Calendar
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Big Calendar */}
          <div>
            {loading ? (
              <Card className="p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading your calendar...
                  </p>
                </div>
              </Card>
            ) : (
              <BigCalendarView
                events={filteredEvents}
                defaultDate={selectedDate || undefined}
                defaultView="month"
                customToolbarComponent={
                  <div className="flex items-center gap-2">
                    <Select
                      value={eventTypeFilter}
                      onValueChange={setEventTypeFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Event Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Event Types</SelectItem>
                        {eventTypes.map((type) => (
                          <SelectItem
                            key={type}
                            value={type!}
                            className="capitalize"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {eventTypeFilter !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEventTypeFilter("all")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                }
                messages={{
                  noEventsInRange: (
                    <div className="text-center py-12">
                      <h3 className="text-xl font-semibold mb-2">
                        No events to display
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {events.length === 0
                          ? "You haven't registered for any events yet."
                          : "Try adjusting your filters or browse for more events."}
                      </p>
                      <Button
                        onClick={() => {
                          const role = userRole ? userRole.toLowerCase() : "";
                          if (role === "vendor") navigate("/vendor/dashboard");
                          else if (role === "events_office")
                            navigate("/events-office/dashboard");
                          else if (role === "admin") navigate("/admin");
                          else if (role === "staff" || role === "ta")
                            navigate("/staff-ta");
                          else if (role === "professor") navigate("/professor");
                          else navigate("/home");
                        }}
                      >
                        Browse Events
                      </Button>
                    </div>
                  ),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
