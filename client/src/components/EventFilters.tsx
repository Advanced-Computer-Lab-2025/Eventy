import { useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Calendar,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  User,
  AlertCircle,
  CalendarDays,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  startDate: Date | undefined;
  professor?: string;
  endDate: Date | undefined;
  showUpcoming?: boolean;
  showPast?: boolean;
}

interface EventFiltersProps {
  filters: EventFilterState;
  onFilterChange: (filters: EventFilterState) => void;
  locations: string[];
  professors?: { id: string; name: string }[];
  sortOrder?: "asc" | "desc";
  onSortChange?: (order: "asc" | "desc") => void;
  userRole?: string;
  onClear?: () => void;
  events?: any[];
}

export default function EventFilters({
  filters,
  onFilterChange,
  locations,
  professors = [],
  sortOrder,
  onSortChange,
  userRole,
  onClear,
  events,
}: EventFiltersProps) {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString().split("T")[0];
  }, []);

  // ------------------------------------------------------------------
  // 1. FILTER LOCATIONS (based on selected Professor)
  // ------------------------------------------------------------------
  const locationOptions = useMemo(() => {
    // If a professor is selected, filter available locations
    if (
      events &&
      events.length > 0 &&
      filters.professor &&
      filters.professor !== "all"
    ) {
      const selectedProfId = String(filters.professor);

      const professorEvents = events.filter((event) => {
        // Check singular 'professor'
        const pSingle =
          event.professor?._id ||
          event.professor?.id ||
          event.professorId ||
          event.professor;
        if (pSingle && String(pSingle) === selectedProfId) return true;

        // Check plural 'professors'
        if (Array.isArray(event.professors)) {
          return event.professors.some((p: any) => {
            const pId = p?._id || p?.id || p;
            return String(pId) === selectedProfId;
          });
        }
        return false;
      });

      const uniqueFilteredLocations = Array.from(
        new Set(
          professorEvents
            .map((e) => e.location || e.locationPreference)
            .filter(Boolean)
        )
      );

      return ["all", ...uniqueFilteredLocations];
    }

    // Default: Show all locations
    const unique = Array.from(new Set(locations.filter(Boolean)));
    return ["all", ...unique];
  }, [locations, filters.professor, events]);

  // ------------------------------------------------------------------
  // 2. FILTER PROFESSORS (based on selected Location)
  // ------------------------------------------------------------------
  const filteredProfessors = useMemo(() => {
    // If a location is selected, filter available professors
    if (
      events &&
      events.length > 0 &&
      filters.location &&
      filters.location !== "all"
    ) {
      const selectedLocation = filters.location;
      const relevantProfessorIds = new Set<string>();

      // Find all events at this location
      const locationEvents = events.filter(
        (e) =>
          e.location === selectedLocation ||
          e.locationPreference === selectedLocation
      );

      // Extract professor IDs from these events
      locationEvents.forEach((event) => {
        // Check singular 'professor'
        const pSingle =
          event.professor?._id ||
          event.professor?.id ||
          event.professorId ||
          event.professor;
        if (pSingle) relevantProfessorIds.add(String(pSingle));

        // Check plural 'professors'
        if (Array.isArray(event.professors)) {
          event.professors.forEach((p: any) => {
            const pId = p?._id || p?.id || p;
            if (pId) relevantProfessorIds.add(String(pId));
          });
        }
      });

      // Return only professors that exist in our relevant IDs set
      return professors.filter((p) => relevantProfessorIds.has(String(p.id)));
    }

    // Default: Show all professors
    return professors;
  }, [professors, filters.location, events]);

  // ------------------------------------------------------------------

  const updateFilters = (changes: Partial<EventFilterState>) => {
    onFilterChange({ ...filters, ...changes });
  };

  const handleClearFilters = () => {
    onFilterChange({
      eventType: "all",
      location: "all",
      startDate: "",
      endDate: "",
      professor: "",
      showUpcoming: true,
      showPast: true,
    });
    onClear?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent
        className={userRole === "events_office" ? "space-y-4" : "space-y-6"}
      >
        {userRole === "events_office" && (
          <div
            className={userRole === "events_office" ? "space-y-2" : "space-y-3"}
          >
            <div className="text-sm font-semibold">Time Period</div>
            {!(filters.showUpcoming || filters.showPast) && (
              <div className="bg-amber-50/80 dark:bg-amber-900/10 border border-amber-300/50 dark:border-amber-700/30 rounded-lg p-2.5">
                <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Select at least one time period</span>
                </p>
              </div>
            )}
            <div
              className={
                userRole === "events_office" ? "space-y-1.5" : "space-y-2"
              }
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-upcoming"
                  checked={filters.showUpcoming || false}
                  onCheckedChange={(checked) =>
                    updateFilters({ showUpcoming: checked as boolean })
                  }
                />
                <Label
                  htmlFor="filter-upcoming"
                  className="cursor-pointer text-sm"
                >
                  Upcoming Events
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-past"
                  checked={filters.showPast || false}
                  onCheckedChange={(checked) =>
                    updateFilters({ showPast: checked as boolean })
                  }
                />
                <Label htmlFor="filter-past" className="cursor-pointer text-sm">
                  Past Events
                </Label>
              </div>
            </div>
          </div>
        )}

        <div
          className={userRole === "events_office" ? "space-y-2" : "space-y-3"}
        >
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

        {professors !== undefined && (
          <div
            className={userRole === "events_office" ? "space-y-2" : "space-y-3"}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4" />
              Professor
            </div>
            <Select
              value={filters.professor || "all"}
              onValueChange={(value) =>
                updateFilters({ professor: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="w-full" data-testid="filter-professor">
                <SelectValue placeholder="Select professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All professors</SelectItem>
                {filteredProfessors.length === 0
                  ? null
                  : filteredProfessors.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div
          className={userRole === "events_office" ? "space-y-2" : "space-y-3"}
        >
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

        <div
          className={userRole === "events_office" ? "space-y-2" : "space-y-3"}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4" />
            Date Range
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                From
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm h-9 px-2",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-0.5 h-3.5 w-3.5" />
                    {filters.startDate ? (
                      format(filters.startDate, "dd/MM/yyyy")
                    ) : (
                      <span className="text-xs">dd/mm/yyyy</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => updateFilters({ startDate: date })}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return (
                        date < today ||
                        (filters.endDate ? date > filters.endDate : false)
                      );
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                To
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm h-9 px-2",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-0.5 h-3.5 w-3.5" />
                    {filters.endDate ? (
                      format(filters.endDate, "dd/MM/yyyy")
                    ) : (
                      <span className="text-xs">dd/mm/yyyy</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => updateFilters({ endDate: date })}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return (
                        date < today ||
                        (filters.startDate ? date < filters.startDate : false)
                      );
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
