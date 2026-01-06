import EventCard from "../EventCard";
import { logger } from "@/lib/logger";

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
        onRegister={() => logger.info("Register clicked")}
        onSave={() => logger.info("Save clicked")}
        onShare={() => logger.info("Share clicked")}
      />
    </div>
  );
}
