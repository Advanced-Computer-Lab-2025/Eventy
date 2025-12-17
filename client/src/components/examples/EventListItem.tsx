import EventListItem from "../EventListItem";

export default function EventListItemExample() {
  return (
    <div className="p-6 max-w-2xl space-y-3">
      <EventListItem
        id="1"
        title="AI & Machine Learning Workshop"
        category="academic"
        date="Mar 15, 2024"
        time="2:00 PM"
        location="Engineering Building, Room 301"
        image="https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&auto=format&fit=crop"
        onClick={() => logger.info("Event clicked")}
      />
      <EventListItem
        id="2"
        title="Spring Festival Celebration"
        category="cultural"
        date="Mar 20, 2024"
        time="6:00 PM"
        location="Main Quadrangle"
        image="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&auto=format&fit=crop"
        onClick={() => logger.info("Event clicked")}
      />
    </div>
  );
}
