import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryBadge, { type EventCategory } from "./CategoryBadge";

interface EventHeroProps {
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  attendees: number;
  image: string;
  description: string;
  onRegister?: () => void;
}

export default function EventHero({
  title,
  category,
  date,
  time,
  location,
  attendees,
  image,
  description,
  onRegister,
}: EventHeroProps) {
  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden">
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

      <div className="relative h-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col justify-end pb-12 md:pb-16">
        <div className="mb-4">
          <CategoryBadge category={category} />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 max-w-4xl">
          {title}
        </h1>

        <p className="text-lg text-white/90 mb-6 max-w-2xl">{description}</p>

        <div className="flex flex-wrap gap-6 text-white/90 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">
              {date} • {time}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{attendees} attending</span>
          </div>
        </div>

        <div>
          <Button
            size="lg"
            onClick={onRegister}
            className="text-lg px-8"
            data-testid="button-register-hero"
          >
            Register Now
          </Button>
        </div>
      </div>
    </div>
  );
}
