import { Calendar, MapPin, Users, Share2, Store, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import VendorApplicationDialog from "./VendorApplicationDialog";

export interface BazaarCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  registrationDeadline: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  attendees?: number;
  capacity?: number;
  bannerImage?: string;
  onRegister?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
}

export default function BazaarCard({
  id,
  name,
  description,
  location,
  startDate,
  endDate,
  startTime,
  endTime,
  registrationDeadline,
  status,
  attendees = 0,
  capacity,
  bannerImage,
  onRegister,
  onShare,
  onEdit,
}: BazaarCardProps) {
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper to convert 24H string to 12H format
  const formatStringTime = (timeStr?: string) => {
    if (!timeStr) return null;

    // If string is in HH:mm format (e.g. "23:52" or "09:30")
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hoursStr, minutesStr] = timeStr.split(":");
      let hours = parseInt(hoursStr, 10);
      const suffix = hours >= 12 ? "PM" : "AM";

      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'

      return `${hours}:${minutesStr} ${suffix}`;
    }

    // Return original if it doesn't match expected format
    return timeStr;
  };

  // Fallback to extracting time from date if startTime/endTime not provided
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700";
      case "needs_revision":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600";
    }
  };

  // Check if registration is still open
  const isRegistrationOpen = new Date(registrationDeadline) > new Date();

  const handleRegister = () => {
    if (onRegister) {
      onRegister();
    } else {
      setIsApplicationDialogOpen(true);
    }
  };

  return (
    <Card
      className="group overflow-hidden hover-elevate transition-all duration-200 hover:-translate-y-1 h-full flex flex-col"
      data-testid={`card-bazaar-${id}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Store className="h-16 w-16 text-primary/40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className={`${getStatusColor(status)} border`}>
            {status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge
            variant="secondary"
            className="bg-background/90 text-foreground"
          >
            <Store className="h-3 w-3 mr-1" />
            BAZAAR
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <div className="space-y-3 flex-1">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
            <div className="font-mono text-sm">
              <div className="font-semibold text-foreground">
                {formatDate(startDate)} - {formatDate(endDate)}
              </div>
              <div className="text-muted-foreground">
                {formatStringTime(startTime) || formatTime(startDate)} -{" "}
                {formatStringTime(endTime) || formatTime(endDate)}
              </div>
            </div>
          </div>

          <h3
            className="text-xl font-bold line-clamp-2 text-foreground"
            data-testid={`text-bazaar-title-${id}`}
          >
            {name}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {attendees}
                {capacity ? `/${capacity}` : ""}
              </span>
            </div>
          </div>

          {!isRegistrationOpen && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              Registration closed on {formatDate(registrationDeadline)}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          {onEdit && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onEdit}
              data-testid={`button-edit-${id}`}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button
            onClick={handleRegister}
            className="flex-1"
            disabled={!isRegistrationOpen}
            data-testid={`button-register-${id}`}
          >
            {isRegistrationOpen ? "Register" : "Registration Closed"}
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
      </CardContent>

      <VendorApplicationDialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
        bazaarId={id}
        bazaarName={name}
      />
    </Card>
  );
}
