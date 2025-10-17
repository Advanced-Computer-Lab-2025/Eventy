import EventCard from "../EventCard";

export default function EventCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <EventCard
        id="1"
        title="AI & Machine Learning Workshop"
        category="academic"
        date="March 15, 2024"
        time="2:00 PM - 5:00 PM"
        location="Engineering Building, Room 301"
        attendees={45}
        vendors={[]}
        onRegister={() => console.log("Register clicked")}
        onSave={() => console.log("Save clicked")}
        onShare={() => console.log("Share clicked")}
      />
    </div>
  );
}
