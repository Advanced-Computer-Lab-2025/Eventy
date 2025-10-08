import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CategoryBadge, { type EventCategory } from "./CategoryBadge";

interface EventListItemProps {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  image: string;
  onClick?: () => void;
}

export default function EventListItem({
  id,
  title,
  category,
  date,
  time,
  location,
  image,
  onClick,
}: EventListItemProps) {
  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all duration-200"
      onClick={onClick}
      data-testid={`card-event-list-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold line-clamp-1" data-testid={`text-event-title-${id}`}>
                {title}
              </h3>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
            
            <div className="mb-2">
              <CategoryBadge category={category} />
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="font-mono">{date} • {time}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{location}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
