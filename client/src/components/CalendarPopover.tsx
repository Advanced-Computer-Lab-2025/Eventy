import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import MiniCalendar from "./MiniCalendar";
import { useLocation } from "wouter";

const API_BASE_URL = "http://localhost:4000";

interface Event {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
  eventType?: string;
}

export default function CalendarPopover() {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/me/events`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const handleDateClick = (date: Date) => {
    // Navigate to calendar page with selected date
    setLocation(`/calendar?date=${date.toISOString()}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Calendar className="h-5 w-5" />
          {events.length > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <MiniCalendar events={events} onDateClick={handleDateClick} />
      </PopoverContent>
    </Popover>
  );
}
