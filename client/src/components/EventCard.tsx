import {
  Calendar,
  MapPin,
  Users,
  Share2,
  Store,
  Trash2,
  Archive,
  Clock,
  DollarSign,
  ArchiveRestore,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "./FavoriteButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryBadge, { type EventCategory } from "./CategoryBadge";
import { getEventImage } from "@/lib/eventImages";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { EventPaymentDialog } from "./EventPaymentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EventDetailsDialog from "@/components/EventsDetailsDialog";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
  attendeesList?: any[];
  image?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationWeeks?: number;
  capacity?: number;
  registrationDeadline?: string;
  vendors?: Vendor[];
  price?: number;
  showActions?: boolean;
  showDetailedView?: boolean;
  showAttendees?: boolean;
  showRegisterButton?: boolean;
  isRegistered?: boolean;
  onRegister?: () => void;
  status?: string;
  onSave?: () => void;
  onShare?: () => void;
  onDelete?: (id: string) => void;
  onViewDetails?: () => void;
  onFeedback?: () => void;
  onArchive?: () => void;
  isArchiving?: boolean;
  onUnarchive?: () => void;
  isUnarchiving?: boolean;
  onEdit?: () => void;
  canDelete?: boolean;
  className?: string;
  allowCancellation?: boolean;
  onUnregister?: () => void;
  hideRegisterButton?: boolean;
  showAttendeeCount?: boolean;
  inlinePriceWithLocation?: boolean;
}

export default function EventCard({
  id,
  title,
  category,
  date,
  time,
  location,
  attendees,
  attendeesList = [],
  image,
  description,
  startDate,
  endDate,
  durationWeeks,
  capacity,
  registrationDeadline,
  vendors = [],
  showActions = true,
  showDetailedView = false,
  showAttendees = true,
  showRegisterButton = true,
  hideRegisterButton = false,
  onRegister,
  onSave,
  onShare,
  onDelete,
  onViewDetails,
  onFeedback,
  isRegistered = false,
  onArchive,
  isArchiving = false,
  onUnarchive,
  isUnarchiving = false,
  onEdit,
  canDelete = false,
  status,
  className,
  price = 0,
  allowCancellation = false,
  onUnregister,
  showAttendeeCount = true,
  inlinePriceWithLocation = false,
}: EventCardProps & { price?: number }) {
  const { toast } = useToast();
  const [expandedVendors, setExpandedVendors] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [internalDetailsOpen, setInternalDetailsOpen] = useState(false);
  const [internalEventDetails, setInternalEventDetails] = useState<any>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Share handler
  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    const shareText = `Check out this event: ${title}${location ? ` at ${location}` : ""}${date ? ` on ${date}` : ""}`;
    const shareUrl = `${window.location.origin}/events/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "Event link copied to clipboard!",
        });
      } catch (err) {
        // Fallback...
      }
    }
  };

  const handleViewDetailsClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (onViewDetails) {
      onViewDetails();
      return;
    }

    setInternalDetailsOpen(true);
    setIsFetchingDetails(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch details");

      const data = await res.json();
      setInternalEventDetails(data.data);
    } catch (err) {
      console.error("Error fetching event details:", err);
      toast({
        title: "Error",
        description: "Could not load event details.",
        variant: "destructive",
      });
      setInternalDetailsOpen(false);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const [localAttendeeCount, setLocalAttendeeCount] = useState(attendees);

  useEffect(() => {
    setLocalAttendeeCount(attendees);
  }, [attendees]);

  const isPlatformBooth = /booth|platform_booth/i.test(String(category));

  // Helper to identify conferences
  const isConference = /conference/i.test(String(category));

  const isRegisterable =
    !isPlatformBooth && /workshop|trip|conference/i.test(String(category));

  const isBazaar = /bazaar/i.test(String(category));

  const eventTypeForImage = isPlatformBooth
    ? "platform_booth"
    : String(category);

  // Display category name (human readable)
  const displayCategory = isPlatformBooth
    ? "Platform Booth"
    : String(category)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

  const imageSrc = image || getEventImage(eventTypeForImage, title);

  const requiresPayment = ["trip", "workshop"].includes(
    String(category).toLowerCase()
  );

  const handleDirectRegister = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/events/${id}/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Registration Failed",
          description:
            err.error || err.message || "Could not register for event.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Registered!",
        description: "You are now registered for this event.",
      });

      setRegistered(true);
      setLocalAttendeeCount((prev) => prev + 1);
    } catch {
      toast({
        title: "Error",
        description: "Could not register for event.",
        variant: "destructive",
      });
    }
  };

  const executeCancellation = async () => {
    setIsCanceling(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/events/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to cancel registration");
      }

      toast({
        title: "Registration Cancelled",
        description: "You have successfully cancelled your registration.",
      });

      setRegistered(false);
      setLocalAttendeeCount((prev) => Math.max(0, prev - 1));

      if (onUnregister) {
        onUnregister();
      }
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Could not cancel registration.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
      setShowCancelDialog(false);
    }
  };

  let currentUserId = "";
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload?.id || payload?._id || "";
    }
  } catch {}

  const isActuallyRegistered =
    Array.isArray(attendeesList) &&
    attendeesList.some((att: any) => {
      if (typeof att === "string") return att === currentUserId;
      return att?._id === currentUserId || att?.id === currentUserId;
    });

  const [registered, setRegistered] = useState(
    isActuallyRegistered || isRegistered
  );

  useEffect(() => {
    if (isActuallyRegistered) {
      setRegistered(true);
    }
  }, [isActuallyRegistered]);

  let roleAllowsDelete = false;
  let roleAllowsFavorites = false;
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload?.role;
      roleAllowsDelete = role === "admin" || role === "events_office";
      roleAllowsFavorites = ["student", "staff", "ta", "professor"].includes(
        role
      );
    }
  } catch {}

  const canShowDelete = roleAllowsDelete && canDelete;
  const canShowFavorites = roleAllowsFavorites;
  const hasRegistrations = localAttendeeCount > 0;

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

  const now = new Date();
  const deadline = registrationDeadline ? new Date(registrationDeadline) : null;
  const isBeforeDeadline = !deadline || now <= deadline;
  const hasCapacity = !capacity || localAttendeeCount < capacity;
  const isArchived = status === "archived";

  const canRegister =
    isRegisterable && isBeforeDeadline && hasCapacity && !isArchived;

  const hasPrice = typeof price === "number" && price > 0;
  const formattedPrice = hasPrice
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: price % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(price)
    : null;
  const inlinePriceLabel =
    inlinePriceWithLocation && hasPrice && formattedPrice
      ? `${formattedPrice} Dollars`
      : null;
  const showStandalonePrice =
    hasPrice && formattedPrice && !inlinePriceWithLocation;

  if (isDeleted) return null;

  return (
    <>
      <Card
        className={`group overflow-hidden hover-elevate transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col ${
          className || ""
        }`}
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
              <CategoryBadge category={displayCategory as EventCategory} />
            </div>
          )}
        </div>

        {showDetailedView ? (
          <>
            {/* --- DETAILED VIEW --- */}
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-xl break-words whitespace-normal">
                  {title}
                </CardTitle>
                <CategoryBadge category={displayCategory as EventCategory} />
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
                  {/* Date & Time */}
                  <div className="flex items-start text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {isPlatformBooth && durationWeeks ? (
                        <div>
                          Active for {durationWeeks} week
                          {durationWeeks > 1 ? "s" : ""}
                        </div>
                      ) : startDate && endDate ? (
                        <div>
                          {formatDate(startDate)}, {formatTime(startDate)} →{" "}
                          {formatDate(endDate)}, {formatTime(endDate)}
                        </div>
                      ) : startDate ? (
                        <div>
                          {formatDate(startDate)}, {formatTime(startDate)}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Location - HIDE IF CONFERENCE */}
                  {location && !isConference && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>{location}</span>
                    </div>
                  )}

                  {showStandalonePrice && (
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>{formattedPrice} Dollars</span>
                    </div>
                  )}

                  {(showAttendees || registrationDeadline) && (
                    <div className="flex items-center gap-6 text-muted-foreground flex-wrap">
                      {showAttendees && (
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span>
                            {localAttendeeCount} attendee
                            {localAttendeeCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {registrationDeadline && (
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span>
                            Deadline: {formatDate(registrationDeadline)}
                            {new Date() > new Date(registrationDeadline) && (
                              <span className="text-red-500 font-semibold ml-2">
                                (Closed)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Vendors Section */}
                {isBazaar && vendors.length > 0 && (
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
                        const shown = expandedVendors
                          ? vendorNames
                          : vendorNames.slice(0, initialCount);
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
                                + {remaining} more vendor
                                {remaining > 1 ? "s" : ""}
                              </Button>
                            )}
                            {expandedVendors &&
                              vendorNames.length > initialCount && (
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

              {/* ACTION BUTTONS (Detailed View) */}
              <div className="flex gap-2 mt-auto w-full">
                {registered && startDate && new Date() > new Date(startDate) ? (
                  <>
                    <div className="flex gap-2 flex-1 justify-center">
                      <Button
                        variant="outline"
                        className={canRegister ? "flex-1" : "w-full"}
                        onClick={handleViewDetailsClick}
                      >
                        View Details
                      </Button>
                      {onUnarchive && (
                        <Button
                          variant="outline"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await onUnarchive();
                            } catch (err) {
                              // parent handles errors
                            }
                          }}
                          disabled={isUnarchiving}
                          data-testid={`button-unarchive-${id}`}
                        >
                          {isUnarchiving ? (
                            "Unarchiving..."
                          ) : (
                            <>
                              <ArchiveRestore className="h-4 w-4 mr-1" />
                              Unarchive
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <Button
                      className="flex-1"
                      onClick={onFeedback}
                      data-testid={`button-feedback-${id}`}
                    >
                      Give Feedback
                    </Button>
                  </>
                ) : registered ? (
                  allowCancellation ? (
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleViewDetailsClick}
                      >
                        View Details
                      </Button>
                      <Button
                        className="w-full"
                        variant="destructive"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={isCanceling}
                      >
                        {isCanceling ? "Canceling..." : "Cancel Registration"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full items-center">
                      <Button className="flex-1" disabled>
                        Registered
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleViewDetailsClick}
                      >
                        View Details
                      </Button>
                      {canShowFavorites && (
                        <div
                          className="relative flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FavoriteButton eventId={id} />
                        </div>
                      )}
                    </div>
                  )
                ) : onEdit ? (
                  <Button
                    className={canRegister ? "flex-1" : "w-full"}
                    onClick={() => onEdit()}
                    data-testid={`button-edit-${id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : showRegisterButton &&
                  !hideRegisterButton &&
                  isRegisterable &&
                  isBeforeDeadline &&
                  !isArchived ? (
                  <div className="flex gap-2 w-full items-center">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleViewDetailsClick}
                    >
                      View Details
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() =>
                        requiresPayment
                          ? setShowPaymentDialog(true)
                          : handleDirectRegister()
                      }
                      data-testid={`button-register-${id}`}
                      disabled={!canRegister}
                    >
                      Register
                    </Button>
                    {canShowFavorites && (
                      <div
                        className="relative flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavoriteButton eventId={id} />
                      </div>
                    )}
                  </div>
                ) : null}

                {onArchive && (
                  <Button
                    className={canRegister ? "flex-1" : "w-full"}
                    onClick={async (e) => {
                      if ((e as any).stopPropagation)
                        (e as any).stopPropagation();
                      try {
                        await onArchive();
                      } catch (err) {
                        // parent handles errors
                      }
                    }}
                    disabled={isArchiving}
                    data-testid={`button-archive-${id}`}
                  >
                    {isArchiving ? (
                      "Archiving..."
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </>
                    )}
                  </Button>
                )}
                {/* 4. UPDATED CHECK: Show view details button if not registered, regardless of prop */}
                {!(
                  showRegisterButton &&
                  !hideRegisterButton &&
                  isRegisterable &&
                  isBeforeDeadline &&
                  !isArchived &&
                  !registered
                ) &&
                  !registered && (
                    <div className="flex gap-2 w-full items-center">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleViewDetailsClick}
                      >
                        View Details
                      </Button>
                      {canShowFavorites && (
                        <div
                          className="relative flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FavoriteButton eventId={id} />
                        </div>
                      )}
                    </div>
                  )}
                {onUnarchive && (
                  <div className="flex gap-2 w-full items-center">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await onUnarchive();
                        } catch (err) {
                          // parent handles errors
                        }
                      }}
                      disabled={isUnarchiving}
                      data-testid={`button-unarchive-${id}`}
                    >
                      {isUnarchiving ? (
                        "Unarchiving..."
                      ) : (
                        <>
                          <ArchiveRestore className="h-4 w-4 mr-1" />
                          Unarchive
                        </>
                      )}
                    </Button>
                    {canShowFavorites && (
                      <div
                        className="relative flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavoriteButton eventId={id} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </>
        ) : (
          <>
            {/* --- COMPACT VIEW --- */}
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 mb-0.5 text-primary flex-shrink-0" />
                  <div className="font-mono text-sm">
                    <div className="font-semibold text-foreground leading-tight">
                      {date}
                      {time && (
                        <span className="text-muted-foreground font-normal ml-2">
                          {time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <h3
                  className="text-xl font-bold break-words whitespace-normal text-foreground"
                  data-testid={`text-event-title-${id}`}
                >
                  {title}
                </h3>

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex flex-col gap-1">
                    {/* HIDE IF CONFERENCE */}
                    {!isConference && location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{location}</span>
                      </div>
                    )}
                    {inlinePriceLabel && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{inlinePriceLabel}</span>
                      </div>
                    )}
                  </div>
                  {showAttendees && showAttendeeCount && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{localAttendeeCount}</span>
                    </div>
                  )}
                  {showStandalonePrice && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{formattedPrice} Dollars</span>
                    </div>
                  )}
                </div>

                {isBazaar && vendors.length > 0 && (
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
                        const remaining = Math.max(
                          0,
                          names.length - shown.length
                        );
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
              </div>

              {showActions && (
                <div className="flex flex-col gap-2 pt-2 mt-auto">
                  {registered &&
                  startDate &&
                  new Date() > new Date(startDate) ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleViewDetailsClick}
                      >
                        View Details
                      </Button>
                      {onUnarchive && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await onUnarchive();
                            } catch (err) {
                              // parent handles errors
                            }
                          }}
                          disabled={isUnarchiving}
                          data-testid={`button-unarchive-compact-${id}`}
                        >
                          {isUnarchiving ? (
                            "Unarchiving..."
                          ) : (
                            <>
                              <ArchiveRestore className="h-4 w-4 mr-1" />
                              Unarchive
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={onFeedback}
                        className="w-full"
                        data-testid={`button-feedback-${id}`}
                      >
                        Give Feedback
                      </Button>
                    </>
                  ) : registered ? (
                    allowCancellation ? (
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleViewDetailsClick}
                        >
                          View Details
                        </Button>
                        <Button
                          className="w-full"
                          variant="destructive"
                          onClick={() => setShowCancelDialog(true)}
                          disabled={isCanceling}
                        >
                          {isCanceling ? "Canceling..." : "Cancel Registration"}
                        </Button>
                        {onUnarchive && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onUnarchive();
                              } catch (err) {
                                // parent handles errors
                              }
                            }}
                            disabled={isUnarchiving}
                            data-testid={`button-unarchive-compact-${id}`}
                          >
                            {isUnarchiving ? (
                              "Unarchiving..."
                            ) : (
                              <>
                                <ArchiveRestore className="h-4 w-4 mr-1" />
                                Unarchive
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 w-full items-center">
                        <Button className="flex-1" disabled>
                          Registered
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleViewDetailsClick}
                        >
                          View Details
                        </Button>
                        {canShowFavorites && (
                          <div
                            className="relative flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FavoriteButton eventId={id} />
                          </div>
                        )}
                        {onUnarchive && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onUnarchive();
                              } catch (err) {
                                // parent handles errors
                              }
                            }}
                            disabled={isUnarchiving}
                            data-testid={`button-unarchive-compact-${id}`}
                          >
                            {isUnarchiving ? (
                              "Unarchiving..."
                            ) : (
                              <>
                                <ArchiveRestore className="h-4 w-4 mr-1" />
                                Unarchive
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )
                  ) : (
                    showRegisterButton &&
                    !hideRegisterButton &&
                    isRegisterable &&
                    isBeforeDeadline &&
                    !isArchived && (
                      <div className="flex gap-2 w-full items-center">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleViewDetailsClick}
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() =>
                            requiresPayment
                              ? setShowPaymentDialog(true)
                              : handleDirectRegister()
                          }
                          className="flex-1"
                          data-testid={`button-register-${id}`}
                          disabled={!canRegister}
                        >
                          Register
                        </Button>
                        {canShowFavorites && (
                          <div
                            className="relative flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FavoriteButton eventId={id} />
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {onArchive && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={async (e) => {
                        if ((e as any).stopPropagation)
                          (e as any).stopPropagation();
                        try {
                          await onArchive();
                        } catch (err) {
                          // parent handles errors
                        }
                      }}
                      disabled={isArchiving}
                      data-testid={`button-archive-compact-${id}`}
                      className="bg-primary text-primary-foreground"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
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
                        if ((e as any).stopPropagation)
                          (e as any).stopPropagation();
                        if (
                          !confirm(
                            "This will permanently delete the event. Proceed?"
                          )
                        )
                          return;
                        try {
                          await deleteEvent(id);
                          toast({
                            title: "Event deleted",
                            description: "The event was deleted successfully.",
                          });
                          setIsDeleted(true);
                          onDelete?.(id);
                        } catch (err: any) {
                          toast({
                            title: "Delete failed",
                            description:
                              err?.message || "Failed to delete event",
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
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <EventPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          eventId={id}
          price={price || 0}
          onRegistered={() => {
            setRegistered(true);
            setLocalAttendeeCount((prev) => prev + 1);
          }}
        />
      )}

      {/* Custom Alert Dialog for Cancellation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your registration? If this was a
              paid event, refunds are processed separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeCancellation();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCanceling ? "Canceling..." : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 5. ADD THE DIALOG RENDER HERE */}
      <EventDetailsDialog
        open={internalDetailsOpen}
        onOpenChange={(open) => {
          setInternalDetailsOpen(open);
          if (!open) setInternalEventDetails(null);
        }}
        event={internalEventDetails}
        loading={isFetchingDetails}
      />
    </>
  );
}
