import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, SlidersHorizontal, ArrowUpDown } from "lucide-react";

const eventTypes = [
  { value: "all", label: "All event types" },
  { value: "bazaar", label: "Bazaars" },
  { value: "conference", label: "Conferences" },
  { value: "trip", label: "Trips" },
  { value: "workshop", label: "Workshops" },
  { value: "platform_booth", label: "Platform Booths" },
];

export interface EventFilterState {
  eventType: string;
  location: string;
  startDate: string;
  endDate: string;
}

interface EventFiltersProps {
  filters: EventFilterState;
  onFilterChange: (filters: EventFilterState) => void;
  locations: string[];
  sortOrder?: "asc" | "desc";
  onSortChange?: (order: "asc" | "desc") => void;
}

export default function EventFilters({
  filters,
  onFilterChange,
  locations,
  sortOrder,
  onSortChange,
}: EventFiltersProps) {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString().split("T")[0];
  }, []);

  const locationOptions = useMemo(() => {
    const unique = Array.from(new Set(locations.filter(Boolean)));
    return ["all", ...unique];
  }, [locations]);

  const updateFilters = (changes: Partial<EventFilterState>) => {
    onFilterChange({ ...filters, ...changes });
  };

  const handleClearFilters = () => {
    onFilterChange({
      eventType: "all",
      location: "all",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Calendar className="h-4 w-4" />
            Event Type
          </div>
          <Select
            value={filters.eventType}
            onValueChange={(value) => updateFilters({ eventType: value })}
          >
            <SelectTrigger className="w-full" data-testid="filter-event-type">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4" />
            Location
          </div>
          <Select
            value={filters.location}
            onValueChange={(value) => updateFilters({ location: value })}
          >
            <SelectTrigger className="w-full" data-testid="filter-location">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((location) => (
                <SelectItem key={location} value={location}>
                  {location === "all" ? "All locations" : location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold mb-1">Date Range</div>
          <div className="space-y-2">
            <div
              className="relative cursor-pointer group"
              tabIndex={0}
              onClick={(e) => {
                const input = document.getElementById(
                  "event-filter-start-date"
                );
                if (input) {
                  if ((input as HTMLInputElement).showPicker) {
                    (input as HTMLInputElement).showPicker();
                  } else {
                    input.focus();
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const input = document.getElementById(
                    "event-filter-start-date"
                  );
                  if (input) {
                    if ((input as HTMLInputElement).showPicker) {
                      (input as HTMLInputElement).showPicker();
                    } else {
                      input.focus();
                    }
                  }
                }
              }}
            >
              <Input
                id="event-filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
                min={today}
                aria-label="Filter start date"
                className="appearance-none pr-2 pl-2 cursor-pointer"
              />
              <div
                className="absolute inset-0"
                style={{ pointerEvents: "auto" }}
              ></div>
            </div>
            <div
              className="relative cursor-pointer group"
              tabIndex={0}
              onClick={(e) => {
                const input = document.getElementById("event-filter-end-date");
                if (input) {
                  if ((input as HTMLInputElement).showPicker) {
                    (input as HTMLInputElement).showPicker();
                  } else {
                    input.focus();
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const input = document.getElementById(
                    "event-filter-end-date"
                  );
                  if (input) {
                    if ((input as HTMLInputElement).showPicker) {
                      (input as HTMLInputElement).showPicker();
                    } else {
                      input.focus();
                    }
                  }
                }
              }}
            >
              <Input
                id="event-filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
                min={filters.startDate || today}
                aria-label="Filter end date"
                className="appearance-none pr-2 pl-2 cursor-pointer"
              />
              <div
                className="absolute inset-0"
                style={{ pointerEvents: "auto" }}
              ></div>
            </div>
          </div>
        </div>

        {sortOrder !== undefined && onSortChange && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ArrowUpDown className="h-4 w-4" />
              Sort by Date
            </div>
            <Select
              value={sortOrder}
              onValueChange={(value) => onSortChange(value as "asc" | "desc")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Earliest First</SelectItem>
                <SelectItem value="desc">Latest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          data-testid="button-clear-filters"
          onClick={handleClearFilters}
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}
