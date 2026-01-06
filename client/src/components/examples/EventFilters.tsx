import EventFilters, { EventFilterState } from "../EventFilters";
import { logger } from "@/lib/logger";

export default function EventFiltersExample() {
  return (
    <div className="p-6 max-w-sm">
      <EventFilters
        filters={
          {
            eventType: "all",
            location: "all",
            startDate: "",
            endDate: "",
            professor: "",
          } as EventFilterState
        }
        onFilterChange={(filters) => logger.info("Filters:", filters)}
        locations={[]}
        professors={[]}
      />
    </div>
  );
}
