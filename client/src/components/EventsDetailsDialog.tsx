import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ClipboardList, Store, GraduationCap, Route, Megaphone } from "lucide-react";
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

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20";
      case "pending":
        return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20";
      case "rejected":
        return "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20";
      case "needs_revision":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const TypeIcon = (() => {
    switch (event.eventType) {
      case "bazaar":
        return Store;
      case "workshop":
        return GraduationCap;
      case "trip":
        return Route;
      case "conference":
        return Megaphone;
      default:
        return Megaphone;
    }
  })();

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
          {event.bannerImage ? (
            <img
              src={event.bannerImage}
              alt={event.name}
              className="w-full h-48 object-cover rounded"
            />
          ) : (
            <div className="w-full h-48 rounded bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center">
              <TypeIcon className="h-16 w-16 text-muted-foreground/60" />
            </div>
          )}
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
              <ClipboardList className="h-4 w-4" />
              <Badge className={getStatusClasses(event.status)}>{event.status}</Badge>
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
