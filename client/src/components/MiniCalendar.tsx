import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Event {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  eventType?: string;
}

interface MiniCalendarProps {
  events: Event[];
  onDateClick?: (date: Date) => void;
  className?: string;
}

export default function MiniCalendar({
  events,
  onDateClick,
  className = "",
}: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState<Map<string, Event[]>>(
    new Map()
  );

  useEffect(() => {
    // Group events by date
    const grouped = new Map<string, Event[]>();
    events.forEach((event) => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      // Add event to all days it spans
      const currentDay = new Date(startDate);
      while (currentDay <= endDate) {
        const dateKey = currentDay.toISOString().split("T")[0];
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(event);
        currentDay.setDate(currentDay.getDate() + 1);
      }
    });
    setEventsByDate(grouped);
  }, [events]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date): Event[] => {
    const dateKey = date.toISOString().split("T")[0];
    return eventsByDate.get(dateKey) || [];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (selectedDate: Date) => {
    setCurrentDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
    onDateClick?.(selectedDate);
  };

  const renderCalendarDays = () => {
    const days = [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
    const trailingDays = totalCells - (startingDayOfWeek + daysInMonth);

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNumber = prevMonthLastDay - startingDayOfWeek + 1 + i;
      const date = new Date(year, month - 1, dayNumber);
      const dayEvents = getEventsForDate(date);
      const hasEvents = dayEvents.length > 0;
      const today = isToday(date);

      days.push(
        <TooltipProvider key={`prev-${dayNumber}`}>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleDayClick(date)}
                className={`
                  aspect-square p-1 rounded-lg text-sm font-medium
                  transition-all duration-200 relative
                  hover:bg-accent hover:scale-105
                  opacity-60
                  ${today ? "bg-primary text-primary-foreground opacity-100" : ""}
                  ${hasEvents && !today ? "font-bold" : ""}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{dayNumber}</span>
                  {hasEvents && (
                    <div className="flex items-center justify-center -mt-0.5">
                      <div
                        className={`w-1 h-1 rounded-full ${
                          today ? "bg-primary-foreground" : "bg-primary"
                        }`}
                      />
                    </div>
                  )}
                </div>
              </button>
            </TooltipTrigger>
            {hasEvents && (
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">
                    {dayEvents.length} Event{dayEvents.length > 1 ? "s" : ""}
                  </p>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div key={event._id} className="text-xs">
                        <p className="font-medium">{event.name}</p>
                        {event.location && (
                          <p className="text-muted-foreground">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Click to view in calendar
                  </p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const hasEvents = dayEvents.length > 0;
      const today = isToday(date);

      days.push(
        <TooltipProvider key={day}>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleDayClick(date)}
                className={`
                  aspect-square p-1 rounded-lg text-sm font-medium
                  transition-all duration-200 relative
                  hover:bg-accent hover:scale-105
                  ${today ? "bg-primary text-primary-foreground" : ""}
                  ${hasEvents && !today ? "font-bold" : ""}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{day}</span>
                  {hasEvents && (
                    <div className="flex items-center justify-center -mt-0.5">
                      <div
                        className={`w-1 h-1 rounded-full ${
                          today ? "bg-primary-foreground" : "bg-primary"
                        }`}
                      />
                    </div>
                  )}
                </div>
              </button>
            </TooltipTrigger>
            {hasEvents && (
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">
                    {dayEvents.length} Event{dayEvents.length > 1 ? "s" : ""}
                  </p>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div key={event._id} className="text-xs">
                        <p className="font-medium">{event.name}</p>
                        {event.location && (
                          <p className="text-muted-foreground">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Click to view in calendar
                  </p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Trailing days from next month
    for (let day = 1; day <= trailingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dayEvents = getEventsForDate(date);
      const hasEvents = dayEvents.length > 0;
      const today = isToday(date);

      days.push(
        <TooltipProvider key={`next-${day}`}>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleDayClick(date)}
                className={`
                  aspect-square p-1 rounded-lg text-sm font-medium
                  transition-all duration-200 relative
                  hover:bg-accent hover:scale-105
                  opacity-60
                  ${today ? "bg-primary text-primary-foreground opacity-100" : ""}
                  ${hasEvents && !today ? "font-bold" : ""}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{day}</span>
                  {hasEvents && (
                    <div className="flex items-center justify-center -mt-0.5">
                      <div
                        className={`w-1 h-1 rounded-full ${
                          today ? "bg-primary-foreground" : "bg-primary"
                        }`}
                      />
                    </div>
                  )}
                </div>
              </button>
            </TooltipTrigger>
            {hasEvents && (
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">
                    {dayEvents.length} Event{dayEvents.length > 1 ? "s" : ""}
                  </p>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div key={event._id} className="text-xs">
                        <p className="font-medium">{event.name}</p>
                        {event.location && (
                          <p className="text-muted-foreground">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Click to view in calendar
                  </p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    }

    return days;
  };

  return (
    <div className={className}>
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((name) => (
            <div
              key={name}
              className="text-center text-xs font-semibold text-muted-foreground py-1"
            >
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>Has Events</span>
              </div>
            </div>
            <span>{events.length} total events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
