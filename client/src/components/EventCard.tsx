import { Calendar, MapPin, Users, Share2, Store, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "./FavoriteButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryBadge, { type EventCategory } from "./CategoryBadge";
import { getEventImage } from "@/lib/eventImages";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  description?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  registrationDeadline?: string;
  vendors?: Vendor[];
  showActions?: boolean;
  showDetailedView?: boolean;
  onRegister?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onDelete?: (id: string) => void;
  onViewDetails?: () => void;
  canDelete?: boolean;
  className?: string;
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
  description,
  startDate,
  endDate,
  capacity,
  registrationDeadline,
  vendors = [],
  showActions = true,
  showDetailedView = false,
  onRegister,
  onSave,
  onShare,
  onDelete,
  onViewDetails,
  canDelete = false,
  className,
}: EventCardProps) {
  const imageSrc = image || getEventImage(String(category), title);
  const isRegisterable = /workshop|trip/i.test(String(category));
  const isBazaarOrBooth = /bazaar|booth/i.test(String(category));
  const { toast } = useToast();
  const [expandedVendors, setExpandedVendors] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  // Determine user role for delete permission and favorite button visibility
  let roleAllowsDelete = false;
  let roleAllowsFavorites = false;
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload?.role;
      roleAllowsDelete = role === "admin" || role === "events_office";
      roleAllowsFavorites = ["student", "staff", "ta", "professor"].includes(role);
    }
  } catch {}
  const canShowDelete = roleAllowsDelete;
  const canShowFavorites = roleAllowsFavorites;
  const hasRegistrations = typeof attendees === "number" && attendees > 0;

  // Helper functions for date/time formatting
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if registration is available
  const now = new Date();
  const deadline = registrationDeadline ? new Date(registrationDeadline) : null;
  const isBeforeDeadline = !deadline || now <= deadline;
  const hasCapacity = !capacity || attendees < capacity;
  const canRegister = isRegisterable && isBeforeDeadline && hasCapacity;

  if (isDeleted) return null;

  return (
    <Card
      className={`group overflow-hidden hover-elevate transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col ${className || ""}`}
      data-testid={`card-event-${id}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!showDetailedView && (
          <div className="absolute top-3 left-3">
            <CategoryBadge category={category} />
          </div>
        )}
      </div>

      {showDetailedView ? (
        <>
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-xl break-words whitespace-normal">{title}</CardTitle>
              <CategoryBadge category={category} />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                {/* Date & Time - Compact Layout */}
                <div className="flex items-start text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    {startDate && endDate ? (
                      <div>
                        {formatDate(startDate)}, {formatTime(startDate)} → {formatDate(endDate)}, {formatTime(endDate)}
                      </div>
                    ) : startDate ? (
                      <div>
                        {formatDate(startDate)}, {formatTime(startDate)}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Location */}
                {location && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>{location}</span>
                  </div>
                )}

                {/* Attendees and Registration Deadline - Same Line */}
                <div className="flex items-center gap-6 text-muted-foreground flex-wrap">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>{attendees} attendee{attendees !== 1 ? 's' : ''}</span>
                  </div>

                  {registrationDeadline && (
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>
                        Deadline: {formatDate(registrationDeadline)}
                        {new Date() > new Date(registrationDeadline) && (
                          <span className="text-red-500 font-semibold ml-2">(Closed)</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendors Section for Bazaar/Booth */}
              {isBazaarOrBooth && vendors.length > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-foreground font-medium mb-2">
                    <Store className="h-4 w-4 text-primary" />
                    <span>Participating Vendors</span>
                  </div>
                  <div>
                    {(() => {
                      const vendorNames = vendors
                        .map((v) => v.name || v.vendorName)
                        .filter(Boolean) as string[];
                      const initialCount = 4;
                      const shown = expandedVendors ? vendorNames : vendorNames.slice(0, initialCount);
                      const remaining = vendorNames.length - initialCount;
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {shown.map((name: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                              >
                                {name}
                              </Badge>
                            ))}
                          </div>
                          {remaining > 0 && !expandedVendors && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => setExpandedVendors(true)}
                            >
                              + {remaining} more vendor{remaining > 1 ? 's' : ''}
                            </Button>
                          )}
                          {expandedVendors && vendorNames.length > initialCount && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => setExpandedVendors(false)}
                            >
                              Show less
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-auto">
              {canRegister && (
                <Button
                  className="flex-1"
                  onClick={onRegister}
                  data-testid={`button-register-${id}`}
                >
                  Register
                </Button>
              )}
                <div className="flex gap-2 ml-auto">                {onViewDetails && (
                  <Button
                    className={canRegister ? "flex-1" : "flex-1"}
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails();
                    }}
                  >
                    View Details
                  </Button>
                )}
                {canShowFavorites && <FavoriteButton eventId={id} />}
              </div>
              {canShowDelete && !hasRegistrations && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async (e) => {
                    if ((e as any).stopPropagation) (e as any).stopPropagation();
                    if (!confirm("This will permanently delete the event. Proceed?")) return;
                    try {
                      await deleteEvent(id);
                      toast({ title: "Event deleted", description: "The event was deleted successfully." });
                      setIsDeleted(true);
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
          </CardContent>
        </>
      ) : (
        <>
          {/* Compact View (Original Design) */}
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <div className="font-mono text-sm">
                <div className="font-semibold text-foreground">{date}</div>
                <div className="text-muted-foreground">{time}</div>
              </div>
            </div>

            <h3
              className="text-xl font-bold break-words whitespace-normal text-foreground"
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

            {/* Vendors section - compact view */}
            {isBazaarOrBooth && vendors.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Store className="h-4 w-4 text-primary" />
                  <span>Participating Vendors</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {(() => {
                    const names = vendors
                      .map((v) => v.name || v.vendorName)
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
              <div className="flex flex-col gap-2 pt-2">
                {isRegisterable && (
                  <Button
                    onClick={onRegister}
                    className="w-full"
                    data-testid={`button-register-${id}`}
                  >
                    Register
                  </Button>
                )}
                  <div className="flex items-center gap-2 ml-auto">                  {canShowFavorites && (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <FavoriteButton eventId={id} />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare?.();
                    }}
                    data-testid={`button-share-${id}`}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                {canShowDelete && !hasRegistrations && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async (e) => {
                      if ((e as any).stopPropagation) (e as any).stopPropagation();
                      if (!confirm("This will permanently delete the event. Proceed?")) return;
                      try {
                        await deleteEvent(id);
                        toast({ title: "Event deleted", description: "The event was deleted successfully." });
                        setIsDeleted(true);
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
        </>
      )}
    </Card>
  );
}
