import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface Event {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  eventType?: string;
}

interface SmartSchedulingAssistantProps {
  events: Event[];
  className?: string;
}

export default function SmartSchedulingAssistant({
  events,
  className = "",
}: SmartSchedulingAssistantProps) {
  const insights = useMemo(() => {
    const now = new Date();
    const upcomingEvents = events.filter((e) => new Date(e.startDate) > now);
    const pastEvents = events.filter((e) => new Date(e.endDate) < now);

    // Find scheduling conflicts (overlapping events)
    const conflicts: Array<{ event1: Event; event2: Event }> = [];
    for (let i = 0; i < upcomingEvents.length; i++) {
      for (let j = i + 1; j < upcomingEvents.length; j++) {
        const e1Start = new Date(upcomingEvents[i].startDate);
        const e1End = new Date(upcomingEvents[i].endDate);
        const e2Start = new Date(upcomingEvents[j].startDate);
        const e2End = new Date(upcomingEvents[j].endDate);

        if (
          (e1Start <= e2End && e1End >= e2Start) ||
          (e2Start <= e1End && e2End >= e1Start)
        ) {
          conflicts.push({
            event1: upcomingEvents[i],
            event2: upcomingEvents[j],
          });
        }
      }
    }

    // Find busiest day
    const eventsByDate = new Map<string, Event[]>();
    upcomingEvents.forEach((event) => {
      const date = new Date(event.startDate).toISOString().split("T")[0];
      if (!eventsByDate.has(date)) {
        eventsByDate.set(date, []);
      }
      eventsByDate.get(date)!.push(event);
    });

    let busiestDate = "";
    let busiestCount = 0;
    eventsByDate.forEach((eventsOnDate, date) => {
      if (eventsOnDate.length > busiestCount) {
        busiestCount = eventsOnDate.length;
        busiestDate = date;
      }
    });

    // Find events happening soon (next 24 hours)
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const eventsSoon = upcomingEvents.filter(
      (e) => new Date(e.startDate) <= next24Hours
    );

    // Find preferred event types
    const eventTypeCounts = new Map<string, number>();
    pastEvents.forEach((event) => {
      if (event.eventType) {
        eventTypeCounts.set(
          event.eventType,
          (eventTypeCounts.get(event.eventType) || 0) + 1
        );
      }
    });

    const preferredType = Array.from(eventTypeCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // Calculate average events per week
    const weeksActive =
      pastEvents.length > 0
        ? Math.ceil(
            (now.getTime() - new Date(pastEvents[0].startDate).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        : 1;
    const avgEventsPerWeek = (pastEvents.length / weeksActive).toFixed(1);

    // Find free time gaps
    const sortedUpcoming = [...upcomingEvents].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const freeTimeGaps: Array<{ start: Date; end: Date; hours: number }> = [];
    for (let i = 0; i < sortedUpcoming.length - 1; i++) {
      const currentEnd = new Date(sortedUpcoming[i].endDate);
      const nextStart = new Date(sortedUpcoming[i + 1].startDate);
      const gapHours =
        (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60);

      if (gapHours >= 2) {
        // At least 2 hours gap
        freeTimeGaps.push({
          start: currentEnd,
          end: nextStart,
          hours: gapHours,
        });
      }
    }

    return {
      conflicts,
      busiestDate,
      busiestCount,
      eventsSoon,
      preferredType,
      avgEventsPerWeek,
      freeTimeGaps: freeTimeGaps.slice(0, 3), // Top 3 gaps
    };
  }, [events]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Smart Scheduling Assistant
        </CardTitle>
        <CardDescription>
          AI-powered insights to help you manage your time better
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conflicts Alert */}
        {insights.conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Scheduling Conflict Detected!</strong>
              <div className="mt-2 space-y-1">
                {insights.conflicts.map((conflict, index) => (
                  <div key={index} className="text-sm">
                    • <strong>{conflict.event1.name}</strong> overlaps with{" "}
                    <strong>{conflict.event2.name}</strong>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Events Soon */}
        {insights.eventsSoon.length > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>🔔 Events Starting Soon</strong>
              <div className="mt-2 space-y-1">
                {insights.eventsSoon.map((event) => (
                  <div key={event._id} className="text-sm">
                    • <strong>{event.name}</strong> starts{" "}
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Insights Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Busiest Day */}
          {insights.busiestDate && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                  Busiest Day
                </span>
              </div>
              <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {insights.busiestCount} events
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {new Date(insights.busiestDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Average Events */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Weekly Average
              </span>
            </div>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {insights.avgEventsPerWeek} events
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">per week</p>
          </div>
        </div>

        {/* Preferred Event Type */}
        {insights.preferredType && (
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                Your Favorite Type
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="capitalize bg-green-600">
                {insights.preferredType[0]}
              </Badge>
              <span className="text-sm text-green-700 dark:text-green-300">
                {insights.preferredType[1]} events attended
              </span>
            </div>
          </div>
        )}

        {/* Free Time Gaps */}
        {insights.freeTimeGaps.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">⏰ Available Time Slots</p>
            {insights.freeTimeGaps.map((gap, index) => (
              <div
                key={index}
                className="p-3 bg-muted rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {gap.start.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {gap.end.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {gap.hours.toFixed(1)} hours free
                  </p>
                </div>
                <Badge variant="outline">Available</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg space-y-2">
          <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            💡 Recommendations
          </p>
          <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
            {insights.conflicts.length > 0 && (
              <li>• Consider rescheduling conflicting events</li>
            )}
            {insights.busiestCount > 3 && (
              <li>
                • Your busiest day has {insights.busiestCount} events - plan
                accordingly
              </li>
            )}
            {insights.freeTimeGaps.length > 0 && (
              <li>
                • You have {insights.freeTimeGaps.length} free time slots for
                additional events
              </li>
            )}
            {insights.eventsSoon.length === 0 && (
              <li>• All clear for the next 24 hours!</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
