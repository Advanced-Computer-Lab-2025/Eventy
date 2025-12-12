import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
}

interface CalendarHeatmapProps {
  events: Event[];
  className?: string;
}

export default function CalendarHeatmap({
  events,
  className = "",
}: CalendarHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 6); // Last 6 months

    const data: Map<string, number> = new Map();

    // Initialize all dates with 0
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split("T")[0];
      data.set(dateKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count events per day
    events.forEach((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      const currentDay = new Date(eventStart);
      while (currentDay <= eventEnd && currentDay <= today) {
        if (currentDay >= startDate) {
          const dateKey = currentDay.toISOString().split("T")[0];
          data.set(dateKey, (data.get(dateKey) || 0) + 1);
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }
    });

    return data;
  }, [events]);

  const getColorIntensity = (count: number): string => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count === 1) return "bg-green-200 dark:bg-green-900";
    if (count === 2) return "bg-green-400 dark:bg-green-700";
    if (count === 3) return "bg-green-600 dark:bg-green-600";
    return "bg-green-800 dark:bg-green-500";
  };

  const weeks: Array<Array<{ date: Date; count: number }>> = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 6);

    // Start from Sunday of that week
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeksArray: Array<Array<{ date: Date; count: number }>> = [];
    let currentWeek: Array<{ date: Date; count: number }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today || currentWeek.length > 0) {
      if (currentDate.getDay() === 0 && currentWeek.length > 0) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }

      const dateKey = currentDate.toISOString().split("T")[0];
      const count = heatmapData.get(dateKey) || 0;
      currentWeek.push({ date: new Date(currentDate), count });

      currentDate.setDate(currentDate.getDate() + 1);

      if (currentDate > today) break;
    }

    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [heatmapData]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; position: number }> = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      const month = firstDay.date.getMonth();

      if (month !== lastMonth) {
        labels.push({
          month: firstDay.date.toLocaleDateString("en-US", { month: "short" }),
          position: weekIndex,
        });
        lastMonth = month;
      }
    });

    return labels;
  }, [weeks]);

  const totalEvents = useMemo(() => {
    return Array.from(heatmapData.values()).reduce(
      (sum, count) => sum + count,
      0
    );
  }, [heatmapData]);

  const mostActiveDay = useMemo(() => {
    let maxCount = 0;
    let maxDate = "";

    heatmapData.forEach((count, date) => {
      if (count > maxCount) {
        maxCount = count;
        maxDate = date;
      }
    });

    return { date: maxDate, count: maxCount };
  }, [heatmapData]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
        <CardDescription>
          Your event participation over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold">{totalEvents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Most Active Day</p>
              <p className="text-lg font-bold">
                {mostActiveDay.count > 0
                  ? `${mostActiveDay.count} events`
                  : "No events yet"}
              </p>
              {mostActiveDay.date && (
                <p className="text-xs text-muted-foreground">
                  {new Date(mostActiveDay.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Month labels */}
              <div className="flex mb-2 ml-8">
                {monthLabels.map((label, index) => (
                  <div
                    key={index}
                    className="text-xs text-muted-foreground"
                    style={{
                      marginLeft:
                        index === 0
                          ? `${label.position * 14}px`
                          : `${(label.position - monthLabels[index - 1].position) * 14 - 30}px`,
                    }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>

              {/* Day labels and heatmap grid */}
              <div className="flex gap-1">
                {/* Day of week labels */}
                <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day, index) => (
                      <div key={day} className="h-3 flex items-center">
                        {index % 2 === 1 && day.slice(0, 1)}
                      </div>
                    )
                  )}
                </div>

                {/* Heatmap grid */}
                <TooltipProvider>
                  <div className="flex gap-1">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day, dayIndex) => (
                          <Tooltip key={dayIndex} delayDuration={0}>
                            <TooltipTrigger asChild>
                              <div
                                className={`
                                  w-3 h-3 rounded-sm transition-all duration-200
                                  ${getColorIntensity(day.count)}
                                  hover:ring-2 hover:ring-primary hover:scale-125
                                  cursor-pointer
                                `}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-semibold">
                                  {day.date.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                                <p className="text-muted-foreground">
                                  {day.count === 0
                                    ? "No events"
                                    : `${day.count} event${day.count > 1 ? "s" : ""}`}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getColorIntensity(level)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
