import EventFilters from "../EventFilters";

export default function EventFiltersExample() {
  return (
    <div className="p-6 max-w-sm">
      <EventFilters
        onFilterChange={(filters) => console.log("Filters:", filters)}
      />
    </div>
  );
}
