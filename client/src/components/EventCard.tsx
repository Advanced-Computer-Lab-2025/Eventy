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
  Ticket,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "./FavoriteButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryBadge, {
  type CategoryBadgeTone,
  type EventCategory,
} from "./CategoryBadge";
import { getEventImage } from "@/lib/eventImages";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { EventPaymentDialog } from "./EventPaymentDialog";
import { ResaleMarketplaceDialog } from "./ResaleMarketplaceDialog";
import { WaitlistDialog } from "./WaitlistDialog";
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
import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

function normalizeBackendAssetUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  if (url.startsWith("/uploads/")) {
    return API_BASE_URL ? `${API_BASE_URL}${url}` : url;
  }

  if (
    API_BASE_URL &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)
  ) {
    try {
      const parsed = new URL(url);
      return `${API_BASE_URL}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  return url;
}

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

interface ResaleListing {
  _id: string;
  sellerId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  price: number;
  originalPrice: number;
  status: "available" | "sold" | "cancelled";
  createdAt: string;
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
  dbStartTime?: string;
  dbEndTime?: string;
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
  editDisabled?: boolean;
  canDelete?: boolean;
  className?: string;
  allowCancellation?: boolean;
  onUnregister?: () => void;
  hideRegisterButton?: boolean;
  showAttendeeCount?: boolean;
  inlinePriceWithLocation?: boolean;
  eventData?: any;
  inlineShareButton?: boolean;
  categoryBadgeTone?: CategoryBadgeTone;
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
  dbStartTime,
  dbEndTime,
  durationWeeks,
  capacity,
  registrationDeadline,
  vendors = [],
  showActions = true,
  showDetailedView = false,
  showAttendees = true,
  showRegisterButton = true,
  hideRegisterButton = false,
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
  editDisabled = false,
  canDelete = false,
  status,
  className,
  price = 0,
  allowCancellation = false,
  onUnregister,
  showAttendeeCount = true,
  inlinePriceWithLocation = false,
  eventData,
  inlineShareButton = false,
  categoryBadgeTone = "default",
}: EventCardProps & { price?: number }) {
  const { toast } = useToast();
  const [expandedVendors, setExpandedVendors] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // --- SELLER RESALE STATES ---
  const [showResaleConfirmationDialog, setShowResaleConfirmationDialog] =
    useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isAlreadyListed, setIsAlreadyListed] = useState(false);

  // --- BUYER RESALE MARKETPLACE STATES ---
  const [showMarketplaceDialog, setShowMarketplaceDialog] = useState(false);
  const [resaleTickets, setResaleTickets] = useState<ResaleListing[]>([]);
  const [isLoadingResale, setIsLoadingResale] = useState(false);

  const [internalDetailsOpen, setInternalDetailsOpen] = useState(false);
  const [internalEventDetails, setInternalEventDetails] = useState<any>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isProfessorInWorkshop, setIsProfessorInWorkshop] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isCheckingWaitlist, setIsCheckingWaitlist] = useState(true); // Start as true to prevent flash

  // Check if ticket is already listed (for My Events view)
  useEffect(() => {
    if (eventData?.resaleListings && Array.isArray(eventData.resaleListings)) {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const currentUserId = payload?.id || payload?._id;

          const listed = eventData.resaleListings.some(
            (l: any) =>
              (l.sellerId === currentUserId ||
                l.sellerId?._id === currentUserId) &&
              l.status === "available"
          );
          setIsAlreadyListed(listed);
        }
      } catch (e) {
        logger.debug("Failed to parse token for resale listings", e);
      }
    }
  }, [eventData]);

  // --- HELPER TO CONVERT 24H STRING TO 12H ---
  const formatStringTime = (timeStr?: string) => {
    if (!timeStr) return null;
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hoursStr, minutesStr] = timeStr.split(":");
      let hours = parseInt(hoursStr, 10);
      const suffix = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutesStr} ${suffix}`;
    }
    return timeStr;
  };

  // Check if current user is a professor in this workshop
  useEffect(() => {
    if (category === "workshop") {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const currentUserId = payload?.id || payload?._id || "";
          const userRole = payload?.role;

          if (userRole === "professor" && currentUserId) {
            const professors =
              eventData?.professors || internalEventDetails?.professors || [];
            if (professors.length > 0) {
              const isProfessor = professors.some((prof: any) => {
                const profId =
                  prof?._id?.toString() ||
                  prof?.id?.toString() ||
                  prof?.toString();
                return profId === currentUserId.toString();
              });
              setIsProfessorInWorkshop(isProfessor);
            } else {
              setIsProfessorInWorkshop(false);
            }
          } else {
            setIsProfessorInWorkshop(false);
          }
        }
      } catch {
        setIsProfessorInWorkshop(false);
      }
    } else {
      setIsProfessorInWorkshop(false);
    }
  }, [category, eventData, internalEventDetails]);

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }
    const shareText = `Check out this event: ${title}${
      location ? ` at ${location}` : ""
    }${date ? ` on ${date}` : ""}`;
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
          logger.error("Error sharing:", err);
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
        logger.debug("Failed to copy event link to clipboard", err);
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
    if (eventData) {
      setInternalEventDetails(eventData);
      setInternalDetailsOpen(true);
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
    } catch {
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
  const isConference = /conference/i.test(String(category));
  const isRegisterable =
    !isPlatformBooth && /workshop|trip|conference/i.test(String(category));
  const isBazaar = /bazaar/i.test(String(category));
  const eventTypeForImage = isPlatformBooth
    ? "platform_booth"
    : String(category);
  const badgeCategory = isPlatformBooth
    ? "platform_booth"
    : String(category).toLowerCase();
  const imageSrc =
    normalizeBackendAssetUrl(image) || getEventImage(eventTypeForImage, title);
  const requiresPayment = ["trip", "workshop"].includes(
    String(category).toLowerCase()
  );

  const handleDirectRegister = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${id}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const data = await res.json().catch(() => null);
      toast({
        title: "Registered!",
        description: "You are now registered for this event.",
      });
      setRegistered(true);
      setLocalAttendeeCount((prev) => prev + 1);
      // Dispatch custom event to trigger recommendations refresh
      window.dispatchEvent(
        new CustomEvent("event-registered", { detail: { eventId: id } })
      );
      try {
        window.dispatchEvent(
          new CustomEvent("event:registered", {
            detail: { eventId: id, event: data?.event || null },
          })
        );
      } catch (e) {
        logger.debug("Failed to dispatch event registration notification", e);
      }
    } catch {
      toast({
        title: "Error",
        description: "Could not register for event.",
        variant: "destructive",
      });
    }
  };

  // --- SELLER: LIST TICKET ---
  const handleResaleListing = async () => {
    setIsListing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${id}/resale/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to list ticket");
      }
      toast({
        title: "Ticket Listed!",
        description: "Your ticket is now listed on the marketplace.",
      });
      setIsAlreadyListed(true);
    } catch (err: any) {
      toast({
        title: "Listing Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsListing(false);
      setShowResaleConfirmationDialog(false);
    }
  };

  // --- BUYER: FETCH TICKETS ---
  const handleFetchResaleTickets = async () => {
    setIsLoadingResale(true);
    setShowMarketplaceDialog(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${id}/resale`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch tickets");

      const data = await res.json();
      setResaleTickets(data.data || []);
    } catch (err) {
      logger.error(err);
      toast({
        title: "Error",
        description: "Could not load resale tickets.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResale(false);
    }
  };

  const executeCancellation = async () => {
    setIsCanceling(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
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

      // Dispatch custom event to trigger recommendations refresh
      window.dispatchEvent(
        new CustomEvent("event-unregistered", { detail: { eventId: id } })
      );

      if (onUnregister) {
        onUnregister();
      }

      // Dispatch event so other components (like CalendarPopover and MiniCalendar) can update
      try {
        window.dispatchEvent(
          new CustomEvent("event:unregistered", {
            detail: { eventId: id },
          })
        );
      } catch {
        // ignore if dispatch not supported
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
  } catch (err) {
    logger.debug("Failed to parse token for current user id", err);
  }

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

  // Check waitlist status on component mount
  useEffect(() => {
    const checkWaitlistStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsCheckingWaitlist(false);
          return;
        }

        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const role = payload?.role;
          const roleAllowsWaitlistStatus = [
            "student",
            "staff",
            "ta",
            "professor",
          ].includes(role);
          if (!roleAllowsWaitlistStatus) {
            setIsCheckingWaitlist(false);
            return;
          }
        } catch {
          setIsCheckingWaitlist(false);
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}/api/events/${id}/waitlist/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setIsOnWaitlist(data.data?.isOnWaitlist || false);
        }
      } catch (error) {
        logger.error("Error checking waitlist status:", error);
      } finally {
        setIsCheckingWaitlist(false);
      }
    };

    // Only check if event is full and cancellations can be made
    const eventStartDate = startDate ? new Date(startDate) : null;
    const twoWeeksBefore = eventStartDate ? new Date(eventStartDate) : null;
    if (twoWeeksBefore) {
      twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);
    }
    const canCancel =
      eventStartDate && twoWeeksBefore ? new Date() <= twoWeeksBefore : false;
    const isFull = capacity && localAttendeeCount >= capacity;

    if (isFull && canCancel) {
      checkWaitlistStatus();
    } else {
      // If waitlist is not available, don't check and set checking to false
      setIsCheckingWaitlist(false);
    }
  }, [id, capacity, localAttendeeCount, startDate]);

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
  } catch (err) {
    logger.debug("Failed to parse token for role permissions", err);
  }

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

  const parseEventDateForComparison = (
    dateString?: string,
    boundary: "start" | "end" = "start"
  ) => {
    if (!dateString) return null;

    const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
    if (ymdMatch) {
      const year = Number(ymdMatch[1]);
      const monthIndex = Number(ymdMatch[2]) - 1;
      const day = Number(ymdMatch[3]);
      const hours = boundary === "end" ? 23 : 0;
      const minutes = boundary === "end" ? 59 : 0;
      const seconds = boundary === "end" ? 59 : 0;
      const ms = boundary === "end" ? 999 : 0;
      return new Date(year, monthIndex, day, hours, minutes, seconds, ms);
    }

    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  // Feedback should only be available for past events.
  // Prefer endDate when available; for date-only strings, compare against end-of-day.
  const feedbackComparisonDate =
    parseEventDateForComparison(endDate ?? startDate, "end") ??
    parseEventDateForComparison(startDate, "end");
  const canShowFeedbackAction = Boolean(
    onFeedback &&
      registered &&
      feedbackComparisonDate &&
      now > feedbackComparisonDate
  );

  const deadline = registrationDeadline ? new Date(registrationDeadline) : null;
  const isBeforeDeadline = !deadline || now <= deadline;
  const hasCapacity = !capacity || localAttendeeCount < capacity;
  const isFull = capacity && localAttendeeCount >= capacity;
  const isArchived = status === "archived";

  // --- DATE LOGIC FOR 14-DAY RULE ---
  const getActionStatus = () => {
    if (!startDate) return { canCancel: true, canResell: false, days: 99 };

    const eventDate = new Date(startDate);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const daysUntilEvent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0)
      return { canCancel: false, canResell: false, isExpired: true, days: -1 };

    // Seller Logic:
    // If > 14 days, they can cancel normally.
    // If < 14 days, they must sell on marketplace.
    if (daysUntilEvent >= 14) {
      return { canCancel: true, canResell: false, days: daysUntilEvent };
    } else {
      return { canCancel: false, canResell: true, days: daysUntilEvent };
    }
  };

  const {
    canCancel,
    canResell,
    isExpired,
    days: daysUntilEvent,
  } = getActionStatus();

  const canRegister =
    isRegisterable &&
    isBeforeDeadline &&
    hasCapacity &&
    !isArchived &&
    !isProfessorInWorkshop;

  const canJoinWaitlist =
    isRegisterable &&
    canCancel &&
    isFull &&
    !isArchived &&
    !isProfessorInWorkshop &&
    !registered;

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

  const ShareButton = () => (
    <Button
      variant={inlineShareButton ? "ghost" : "outline"}
      size={inlineShareButton ? "icon" : "icon"}
      className={
        inlineShareButton
          ? "shrink-0 text-muted-foreground hover:text-foreground"
          : ""
      }
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      data-testid={`button-share-${id}`}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );

  // --- MODIFIED BUYER LOGIC (FIXED) ---
  // If registered: They see cancellation or sell options (handled elsewhere).
  // If NOT registered:
  //   - If registration is OPEN (isBeforeDeadline), show "Register".
  //   - If registration is CLOSED (!isBeforeDeadline):
  //       - AND days < 14: Show "View Resale Tickets".
  //       - AND days >= 14: Show dimmed "Registration Closed" (or similar).
  const showResaleMarketplaceOption =
    !registered &&
    !isArchived &&
    !isBeforeDeadline && // Only relevant if main registration is closed
    daysUntilEvent < 14 && // <--- ADDED: Strict check for 14-day window
    daysUntilEvent >= 0 &&
    isRegisterable;

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
              <CategoryBadge
                category={badgeCategory}
                tone={categoryBadgeTone}
              />
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
                <CategoryBadge
                  category={badgeCategory}
                  tone={categoryBadgeTone}
                />
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
                  <div className="flex items-start text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {startDate && endDate ? (
                        <div>
                          {formatDate(startDate)},{" "}
                          {formatStringTime(dbStartTime) ||
                            formatTime(startDate)}{" "}
                          → {formatDate(endDate)},{" "}
                          {formatStringTime(dbEndTime) || formatTime(endDate)}
                        </div>
                      ) : startDate ? (
                        <div>
                          {formatDate(startDate)},{" "}
                          {formatStringTime(dbStartTime) ||
                            formatTime(startDate)}
                        </div>
                      ) : isPlatformBooth && durationWeeks ? (
                        <div>
                          Active for {durationWeeks} week
                          {durationWeeks > 1 ? "s" : ""}
                        </div>
                      ) : null}
                    </div>
                  </div>

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
                {canShowFeedbackAction ? (
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
                          className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await onUnarchive();
                            } catch (err) {
                              logger.debug(
                                "Failed to parse token for workshop role check",
                                err
                              );
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
                      <Button
                        variant="outline"
                        className="flex-1 order-1"
                        onClick={handleViewDetailsClick}
                      >
                        View Details
                      </Button>
                      <Button className="flex-1 order-2" disabled>
                        Registered
                      </Button>
                      {canShowFavorites && (
                        <div
                          className="relative flex-shrink-0 order-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FavoriteButton eventId={id} />
                        </div>
                      )}
                    </div>
                  )
                ) : onEdit || onArchive || canShowDelete ? (
                  <div className="flex gap-2 w-full items-center">
                    {onEdit && (
                      <Button
                        className="flex-1 order-2"
                        onClick={() => onEdit()}
                        disabled={editDisabled}
                        data-testid={`button-edit-${id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {onArchive && (
                      <Button
                        className="flex-1 order-3"
                        onClick={async (e) => {
                          if ((e as any).stopPropagation)
                            (e as any).stopPropagation();
                          try {
                            await onArchive();
                          } catch (err) {
                            logger.debug(
                              "Failed to parse token for registration state",
                              err
                            );
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
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        className="flex-1 order-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails();
                        }}
                      >
                        View Details
                      </Button>
                    )}
                    {canShowDelete && (
                      <Trash2
                        className="h-5 w-5 text-red-600 cursor-pointer hover:text-red-700 transition-colors flex-shrink-0 order-4"
                        onClick={(e) => {
                          if ((e as any).stopPropagation)
                            (e as any).stopPropagation();
                          setShowDeleteDialog(true);
                        }}
                        data-testid={`button-delete-event-${id}`}
                      />
                    )}
                  </div>
                ) : showRegisterButton &&
                  !hideRegisterButton &&
                  isRegisterable &&
                  !isArchived &&
                  !isProfessorInWorkshop ? (
                  <div className="flex gap-2 w-full items-center">
                    <Button
                      variant="outline"
                      className="flex-1 order-1"
                      onClick={handleViewDetailsClick}
                    >
                      View Details
                    </Button>

                    {showResaleMarketplaceOption ? (
                      <Button
                        className="flex-1 order-2 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={handleFetchResaleTickets}
                        // removed variant="secondary"
                      >
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        View Resale Tickets
                      </Button>
                    ) : isFull && canJoinWaitlist ? (
                      isCheckingWaitlist ? (
                        <Button
                          className="flex-1 order-2"
                          disabled
                          variant="outline"
                          data-testid={`button-checking-waitlist-${id}`}
                        >
                          Checking...
                        </Button>
                      ) : isOnWaitlist ? (
                        <Button
                          className="flex-1 order-2"
                          disabled
                          variant="outline"
                          data-testid={`button-waitlisted-${id}`}
                        >
                          Waitlisted
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 order-2"
                          onClick={() => setShowWaitlistDialog(true)}
                          data-testid={`button-join-waitlist-${id}`}
                        >
                          Join Waitlist
                        </Button>
                      )
                    ) : (
                      <Button
                        className="flex-1 order-2"
                        onClick={() =>
                          requiresPayment
                            ? setShowPaymentDialog(true)
                            : handleDirectRegister()
                        }
                        data-testid={`button-register-${id}`}
                        disabled={!canRegister}
                      >
                        {isBeforeDeadline ? "Register" : "Registration Closed"}
                      </Button>
                    )}
                    {canShowFavorites && (
                      <div
                        className="relative flex-shrink-0 order-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavoriteButton eventId={id} />
                      </div>
                    )}
                  </div>
                ) : !(
                    showRegisterButton &&
                    !hideRegisterButton &&
                    isRegisterable &&
                    isBeforeDeadline &&
                    !isArchived &&
                    !isProfessorInWorkshop &&
                    !registered
                  ) &&
                  !registered &&
                  !(onEdit || onArchive || canShowDelete) &&
                  !onUnarchive ? (
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
                ) : null}
                {onUnarchive && (
                  <div className="flex gap-2 w-full items-center justify-center">
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails();
                        }}
                      >
                        View Details
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className={`${
                        onViewDetails ? "flex-1" : "w-full"
                      } bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await onUnarchive();
                        } catch (err) {
                          logger.debug(
                            "Failed to parse token for favorites role",
                            err
                          );
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
            {/* --- COMPACT VIEW (Dashboard & My Events) --- */}
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
                  {canShowFeedbackAction ? (
                    <>
                      <div className="flex gap-2 w-full items-center">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleViewDetailsClick}
                        >
                          View Details
                        </Button>
                        {inlineShareButton && <ShareButton />}
                      </div>
                      {onUnarchive && (
                        <Button
                          variant="outline"
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await onUnarchive();
                            } catch (err) {
                              logger.debug(
                                "Failed to parse token for delete permission",
                                err
                              );
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
                        <div className="flex gap-2 w-full items-center">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleViewDetailsClick}
                          >
                            View Details
                          </Button>
                          {inlineShareButton && <ShareButton />}
                        </div>

                        {/* --- 14-DAY LOGIC START (My Events / Already Registered) --- */}
                        {isAlreadyListed ? (
                          <Button
                            className="w-full opacity-60 cursor-not-allowed"
                            disabled
                          >
                            <Ticket className="h-4 w-4 mr-2" /> Ticket Listed
                          </Button>
                        ) : canCancel ? (
                          <Button
                            className="w-full"
                            variant="destructive"
                            onClick={() => setShowCancelDialog(true)}
                            disabled={isCanceling}
                          >
                            {isCanceling
                              ? "Canceling..."
                              : "Cancel Registration"}
                          </Button>
                        ) : canResell ? (
                          <Button
                            className="w-full"
                            onClick={() =>
                              setShowResaleConfirmationDialog(true)
                            }
                          >
                            <Ticket className="h-4 w-4 mr-2" />
                            Sell on Marketplace
                          </Button>
                        ) : isExpired ? (
                          <Button
                            variant="ghost"
                            disabled
                            className="w-full border border-dashed text-muted-foreground"
                          >
                            Event Started
                          </Button>
                        ) : null}
                        {/* --- 14-DAY LOGIC END --- */}

                        {onUnarchive && (
                          <Button
                            variant="outline"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onUnarchive();
                              } catch (err) {
                                logger.debug(
                                  "Failed to parse token for waitlist auth",
                                  err
                                );
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
                        <Button
                          variant="outline"
                          className="flex-1 order-1"
                          onClick={handleViewDetailsClick}
                        >
                          View Details
                        </Button>
                        <Button className="flex-1 order-2" disabled>
                          Registered
                        </Button>
                        {canShowFavorites && (
                          <div
                            className="relative flex-shrink-0 order-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FavoriteButton eventId={id} />
                          </div>
                        )}
                        {inlineShareButton && (
                          <div className="order-4">
                            <ShareButton />
                          </div>
                        )}
                        {onUnarchive && (
                          <Button
                            variant="outline"
                            className="flex-1 order-5 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await onUnarchive();
                              } catch (err) {
                                logger.debug(
                                  "Failed to parse token for resale auth",
                                  err
                                );
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
                    <>
                      {showRegisterButton &&
                      !hideRegisterButton &&
                      isRegisterable &&
                      !isArchived &&
                      !isProfessorInWorkshop ? (
                        <div className="flex gap-2 w-full items-center">
                          <Button
                            variant="outline"
                            className="flex-1 order-1"
                            onClick={handleViewDetailsClick}
                          >
                            View Details
                          </Button>

                          {/* --- NEW LOGIC FOR DASHBOARD (Upcoming Events) --- */}
                          {showResaleMarketplaceOption ? (
                            <Button
                              className="flex-1 order-2 bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={handleFetchResaleTickets}
                              // removed variant="secondary"
                            >
                              <ShoppingBag className="h-4 w-4 mr-1" />
                              View Resale Tickets
                            </Button>
                          ) : isFull && canJoinWaitlist ? (
                            isCheckingWaitlist ? (
                              <Button
                                className="flex-1 order-2"
                                disabled
                                variant="outline"
                                data-testid={`button-checking-waitlist-${id}`}
                              >
                                Checking...
                              </Button>
                            ) : isOnWaitlist ? (
                              <Button
                                className="flex-1 order-2"
                                disabled
                                variant="outline"
                                data-testid={`button-waitlisted-${id}`}
                              >
                                Waitlisted
                              </Button>
                            ) : (
                              <Button
                                className="flex-1 order-2"
                                onClick={() => setShowWaitlistDialog(true)}
                                data-testid={`button-join-waitlist-${id}`}
                              >
                                Join Waitlist
                              </Button>
                            )
                          ) : (
                            <Button
                              onClick={() =>
                                requiresPayment
                                  ? setShowPaymentDialog(true)
                                  : handleDirectRegister()
                              }
                              className="flex-1 order-2"
                              data-testid={`button-register-${id}`}
                              disabled={!canRegister}
                            >
                              {isBeforeDeadline
                                ? "Register"
                                : "Registration Closed"}
                            </Button>
                          )}
                          {canShowFavorites && (
                            <div
                              className="relative flex-shrink-0 order-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FavoriteButton eventId={id} />
                            </div>
                          )}
                          {inlineShareButton && (
                            <div className="order-4">
                              <ShareButton />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full items-center">
                          <Button
                            variant="outline"
                            className="flex-1 order-1"
                            onClick={handleViewDetailsClick}
                          >
                            View Details
                          </Button>
                          {canShowFavorites && (
                            <div
                              className="relative flex-shrink-0 order-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FavoriteButton eventId={id} />
                            </div>
                          )}
                          {inlineShareButton && (
                            <div className="order-4">
                              <ShareButton />
                            </div>
                          )}
                        </div>
                      )}
                    </>
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
                          logger.debug(
                            "Failed to parse token for booth auth",
                            err
                          );
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

                  {!inlineShareButton && (
                    <div className="flex items-center gap-2 ml-auto">
                      <ShareButton />
                    </div>
                  )}

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

      {/* --- DIALOGS --- */}
      {showPaymentDialog && (
        <EventPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          eventId={id}
          price={price || 0}
          onRegistered={() => {
            setRegistered(true);
            setLocalAttendeeCount((prev) => prev + 1);

            // Dispatch event so other parts of the app (e.g., CalendarPage, CalendarPopover)
            // can react and refetch their data
            try {
              window.dispatchEvent(
                new CustomEvent("event:registered", {
                  detail: { eventId: id },
                })
              );
            } catch {
              // ignore if dispatch not supported
            }
          }}
        />
      )}

      {/* Seller: Resale Confirmation Dialog */}
      <AlertDialog
        open={showResaleConfirmationDialog}
        onOpenChange={setShowResaleConfirmationDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>List Ticket for Resale?</AlertDialogTitle>
            <AlertDialogDescription>
              We are less than 14 days from the event, so standard cancellation
              is closed. You can list your ticket on the Marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Ticket</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResaleListing();
              }}
            >
              {isListing ? "Listing..." : "Confirm Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Buyer: Resale Marketplace Dialog */}
      <ResaleMarketplaceDialog
        open={showMarketplaceDialog}
        onOpenChange={setShowMarketplaceDialog}
        eventId={id}
        eventName={title}
        tickets={resaleTickets}
        isLoadingInitial={isLoadingResale}
        onPurchaseSuccess={() => {
          setRegistered(true);
          setLocalAttendeeCount((prev) => prev + 1);
        }}
      />

      {/* Waitlist Dialog */}
      <WaitlistDialog
        open={showWaitlistDialog}
        onOpenChange={setShowWaitlistDialog}
        onJoined={async () => {
          // Set state optimistically first - this will update the UI immediately
          logger.info("onJoined callback called, setting isOnWaitlist to true");
          setIsOnWaitlist(true);

          // Use setTimeout to ensure state update is processed before async operations
          setTimeout(async () => {
            // Then verify with backend after a short delay
            try {
              const token = localStorage.getItem("token");
              if (!token) {
                // If no token, keep optimistic state
                return;
              }

              try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const role = payload?.role;
                const roleAllowsWaitlistStatus = [
                  "student",
                  "staff",
                  "ta",
                  "professor",
                ].includes(role);
                if (!roleAllowsWaitlistStatus) {
                  return;
                }
              } catch {
                return;
              }

              // Small delay to ensure backend has processed the join
              await new Promise((resolve) => setTimeout(resolve, 500));

              const res = await fetch(
                `${API_BASE_URL}/api/events/${id}/waitlist/status`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (res.ok) {
                const data = await res.json();
                logger.info(
                  "Waitlist status verified:",
                  data.data?.isOnWaitlist
                );
                // Update with actual backend state
                setIsOnWaitlist(data.data?.isOnWaitlist || false);
              } else {
                // If check fails, keep optimistic state
                logger.warn(
                  "Failed to verify waitlist status, keeping optimistic state"
                );
              }
            } catch (error) {
              logger.error("Error checking waitlist status:", error);
              // Keep optimistic state on error
            }
          }, 0);
        }}
        eventId={id}
        eventTitle={title}
        price={price || 0}
      />

      {/* Custom Alert Dialog for Cancellation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your registration? You will
              receive a standard refund.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeCancellation();
              }}
              className="bg-red-600 hover:bg-red-700 text-white focus-visible:ring-0 border-0"
            >
              {isCanceling ? "Canceling..." : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        open={internalDetailsOpen}
        onOpenChange={(open) => {
          setInternalDetailsOpen(open);
          if (!open) setInternalEventDetails(null);
        }}
        event={internalEventDetails}
        loading={isFetchingDetails}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                setShowDeleteDialog(false);
                if (onDelete) {
                  onDelete(id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
