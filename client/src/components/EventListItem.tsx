import { Calendar, MapPin, ChevronRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CategoryBadge, { type EventCategory } from "./CategoryBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

async function deleteEvent(eventId: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${API_BASE_URL}/api/events/admin/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    }
  );

  // Try to parse JSON if available for better error messages
  const contentType = response.headers.get("content-type");
  if (response.status === 409) {
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(
        data.message || "Cannot delete event with registered users."
      );
    }
    throw new Error("Cannot delete event with registered users.");
  }

  if (!response.ok) {
    let msg = "Failed to delete event";
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      if (data?.message) msg = data.message;
    }
    throw new Error(msg);
  }

  return true;
}

interface EventListItemProps {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  image: string;
  onClick?: () => void;
  onDelete?: (id: string) => void; // ✅ new prop
  canDelete?: boolean; // ✅ controls visibility (admin/events office only)
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
  onDelete,
  canDelete = false,
}: EventListItemProps) {
  const { toast } = useToast();
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
              <h3
                className="font-semibold line-clamp-1"
                data-testid={`text-event-title-${id}`}
              >
                {title}
              </h3>
              <div className="flex items-center gap-2">
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        !confirm("Are you sure you want to delete this event?")
                      )
                        return;
                      try {
                        await deleteEvent(id);
                        toast({
                          title: "Event deleted",
                          description: "The event was deleted successfully.",
                        });
                        onDelete?.(id);
                      } catch (err: any) {
                        toast({
                          title: "Delete failed",
                          description: err?.message || "Failed to delete event",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid={`button-delete-event-${id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}

                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </div>

            <div className="mb-2">
              <CategoryBadge category={category} />
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="font-mono">
                  {date} • {time}
                </span>
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
