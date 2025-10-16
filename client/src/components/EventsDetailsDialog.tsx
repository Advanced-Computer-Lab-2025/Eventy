import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ClipboardList } from "lucide-react";
import CategoryBadge from "./CategoryBadge";

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any | null;
  loading: boolean;
}

export default function EventDetailsDialog({
  open,
  onOpenChange,
  event,
  loading,
}: EventDetailsDialogProps) {
  if (!event) return null;

  const startDate = new Date(event.startDate).toLocaleString();
  const endDate = new Date(event.endDate).toLocaleString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event.name}
            <CategoryBadge category={event.eventType} />
          </DialogTitle>
          <DialogDescription>{event.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <img
            src={event.bannerImage || "/images/bazaar-default.jpg"}
            alt={event.name}
            className="w-full h-48 object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/bazaar-default.jpg";
            }}
          />
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {startDate} → {endDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {event.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> Capacity: {event.capacity}
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" /> Status: {event.status}
            </span>
          </div>
          {event.agenda && (
            <div>
              <h4 className="font-semibold mt-2">Agenda</h4>
              <p>{event.agenda}</p>
            </div>
          )}
          {event.extraResources && (
            <div>
              <h4 className="font-semibold mt-2">Extra Resources</h4>
              <p>{event.extraResources}</p>
            </div>
          )}
          {event.faculty && (
            <div>
              <h4 className="font-semibold mt-2">Faculty</h4>
              <p>{event.faculty}</p>
            </div>
          )}
          {event.fundingSource && (
            <div>
              <h4 className="font-semibold mt-2">Funding Source</h4>
              <p>{event.fundingSource}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
