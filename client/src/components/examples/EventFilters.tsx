import EventFilters, { EventFilterState } from "../EventFilters";

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
        onFilterChange={(filters) => console.log("Filters:", filters)}
        locations={[]}
        professors={[]}
      />
    </div>
  );
}
