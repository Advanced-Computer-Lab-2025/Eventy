import { Calendar, MapPin, Users, Bookmark, Share2, Store, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CategoryBadge, { type EventCategory } from "./CategoryBadge";
import { getEventImage } from "@/lib/eventImages";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function deleteEvent(eventId: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/api/events/admin/events/${eventId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const contentType = response.headers.get("content-type");
  if (response.status === 409) {
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.message || "Cannot delete event with registered users.");
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

// ✅ Define a single, correct vendor type
interface Vendor {
  vendorId?: string;
  vendorName?: string;
  vendorEmail?: string;
  email?: string;  
  _id?: string; 
  name?: string;
  type?: string;
  boothSize?: string;
  attendees?: number;
}

export interface EventCardProps {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  attendees: number;
  image?: string;
  vendors?: Vendor[];
  showActions?: boolean;
  onRegister?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
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
  vendors = [],
  showActions = true,
  onRegister,
  onSave,
  onShare,
  onDelete,
  canDelete = false,
}: EventCardProps) {
  const imageSrc = image || getEventImage(String(category), title);
  const isRegisterable = /workshop|trip/i.test(String(category));
  const isBazaarOrBooth = /bazaar|booth/i.test(String(category));
  const { toast } = useToast();

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

        <h3
          className="text-xl font-bold line-clamp-2 text-foreground"
          data-testid={`text-event-title-${id}`}
        >
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

       {/* 🛍 Vendors section */}
{isBazaarOrBooth && vendors.length > 0 && (
  <div className="mt-2">
    <div className="flex items-center gap-2 text-foreground font-medium">
      <Store className="h-4 w-4 text-primary" />
      <span>Participating Vendors</span>
    </div>
    <div className="mt-1 text-sm text-muted-foreground">
      {(() => {
        const names = vendors
        .map((v) => v.name)
        .filter(Boolean) as string[];
        const shown = names.slice(0, 3);
        const remaining = Math.max(0, names.length - shown.length);
        return (
          <span data-testid={`text-vendors-${id}`}>
            {shown.join(", ")}
            {remaining > 0 ? ` and ${remaining} more` : ""}
          </span>
        );
      })()}
    </div>
  </div>
)}


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
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={async (e) => {
                  if ((e as any).stopPropagation) (e as any).stopPropagation();
                  if (!confirm("Are you sure you want to delete this event?")) return;
                  try {
                    await deleteEvent(id);
                    toast({ title: "Event deleted", description: "The event was deleted successfully." });
                    onDelete?.(id);
                  } catch (err: any) {
                    toast({ title: "Delete failed", description: err?.message || "Failed to delete event", variant: "destructive" });
                  }
                }}
                data-testid={`button-delete-event-${id}`}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
