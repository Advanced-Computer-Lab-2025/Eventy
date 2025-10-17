import { Calendar, MapPin, Users, Bookmark, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CategoryBadge, { type EventCategory } from "./CategoryBadge";
import { getEventImage } from "@/lib/eventImages";

export interface EventCardProps {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  attendees: number;
  image?: string;
  showActions?: boolean;
  onRegister?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

export default function EventCard({
  id,
  title,
  category,
  date,
  time,
  location,
  attendees,
  image,
  showActions = true,
  onRegister,
  onSave,
  onShare,
}: EventCardProps) {
  const imageSrc = image || getEventImage(String(category), title);
  const isRegisterable = /workshop|trip/i.test(String(category));
  return (
    <Card 
      className="group overflow-hidden hover-elevate transition-all duration-200 hover:-translate-y-1"
      data-testid={`card-event-${id}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <CategoryBadge category={category} />
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
          <div className="font-mono text-sm">
            <div className="font-semibold text-foreground">{date}</div>
            <div className="text-muted-foreground">{time}</div>
          </div>
        </div>
        
        <h3 className="text-xl font-bold line-clamp-2 text-foreground" data-testid={`text-event-title-${id}`}>
          {title}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{attendees}</span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            {isRegisterable && (
              <Button 
                onClick={onRegister} 
                className="flex-1"
                data-testid={`button-register-${id}`}
              >
                Register
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={onSave}
              data-testid={`button-save-${id}`}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={onShare}
              data-testid={`button-share-${id}`}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
