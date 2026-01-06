import EventFilters from "../EventFilters";
import { logger } from "@/lib/logger";

export default function EventFiltersExample() {
  return (
    <div className="p-6 max-w-sm">
      <EventFilters
        filters={{
          eventType: "all",
          location: "all",
          startDate: undefined,
          endDate: undefined,
          professor: "",
        }}
        onFilterChange={(filters) => logger.info("Filters:", filters)}
        locations={[]}
        professors={[]}
      />
    </div>
  );
}
