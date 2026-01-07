import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Camera,
  Eye,
  ChevronLeft,
  ChevronRight,
  ImageOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StudentHeader from "@/components/StudentHeader";
import ProfessorHeader from "@/components/ProfessorHeader";
import StaffHeader from "@/components/StaffHeader";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

interface Event {
  _id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  location?: string;
  description?: string;
  bannerImage?: string;
  capacity?: number;
  price?: number;
  attendees?: Array<{ _id: string }>;
}

interface EventImage {
  url: string;
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  uploadedAt: string;
}

const API_BASE_URL = getApiBaseUrl();

// Component for displaying a single event with sliding images
function LiveEventCard({ event }: { event: Event }) {
  const { toast } = useToast();
  const [images, setImages] = useState<EventImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [dialogImageIndex, setDialogImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is registered for this event
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const user = localStorage.getItem("user");
        if (!user) return;

        const parsed = JSON.parse(user);
        const userId = parsed._id || parsed.id;

        // Check if userId is in event.attendees
        const registered = event.attendees?.some(
          (attendee: any) => attendee._id === userId || attendee === userId
        );
        setIsRegistered(registered || false);
      } catch (err) {
        logger.error("Error checking registration:", err);
      }
    };

    checkRegistration();
  }, [event]);

  // Fetch images for this event
  const fetchImages = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/events/${event._id}/images`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setImages(result.data?.images || []);
      }
    } catch (err) {
      logger.error("Error fetching images:", err);
    } finally {
      setLoadingImages(false);
    }
  }, [event._id]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${API_BASE_URL}/api/events/${event._id}/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
        // Refresh images
        await fetchImages();
        setCurrentImageIndex(images.length); // Show the newly uploaded image
      } else {
        const error = await response.json();
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload image",
          variant: "destructive",
        });
      }
    } catch (err) {
      logger.error("Upload error:", err);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Auto-slide images every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle image URL - check if it's already a full URL or just a path
  const getImageUrl = (imageUrl: string) => {
    // If it's a relative uploads path, prefer the configured backend.
    if (imageUrl.startsWith("/uploads/")) {
      return API_BASE_URL ? `${API_BASE_URL}${imageUrl}` : imageUrl;
    }

    // Rewrite any localhost/loopback absolute URLs to the configured backend.
    if (
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(imageUrl) &&
      API_BASE_URL
    ) {
      try {
        const parsed = new URL(imageUrl);
        return `${API_BASE_URL}${parsed.pathname}${parsed.search}`;
      } catch {
        return imageUrl;
      }
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    return API_BASE_URL ? `${API_BASE_URL}${imageUrl}` : imageUrl;
  };

  const currentImage =
    images.length > 0
      ? getImageUrl(images[currentImageIndex].url)
      : event.bannerImage || "/placeholder.svg";

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image Section */}
        <div className="relative h-48 bg-muted">
          {loadingImages ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Only provide alt text when there is a real image (uploaded or banner).
                 When no image exists we render a decorative image with empty alt
                 and aria-hidden to avoid the browser showing fallback text. */}
              <img
                src={currentImage}
                alt={images.length > 0 || event.bannerImage ? event.name : ""}
                aria-hidden={images.length === 0 && !event.bannerImage}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
              {images.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <ImageOff className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground/70 font-medium">
                    No photos yet
                  </p>
                  {isRegistered && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Be the first to share!
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">{event.name}</h3>
            <Badge variant="default" className="capitalize">
              {event.eventType === "platform_booth"
                ? "Platform Booth"
                : event.eventType.replace(/_/g, " ")}
            </Badge>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Start:</span>
              <span className="text-muted-foreground">
                {formatDate(event.startDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">End:</span>
              <span className="text-muted-foreground">
                {formatDate(event.endDate)}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            {images.length} photo{images.length !== 1 ? "s" : ""} shared
          </div>

          {/* Action buttons */}
          {(isRegistered || images.length > 0) && (
            <div className="pt-3 border-t">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <div className="flex gap-2">
                {isRegistered && (
                  <Button
                    size="sm"
                    className="flex-1 group transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Share a Moment
                      </>
                    )}
                  </Button>
                )}
                {images.length > 0 && (
                  <Button
                    size="sm"
                    className="flex-1 group transition-all"
                    onClick={() => {
                      setDialogImageIndex(0);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    View Gallery
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Images Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{event.name} - Photo Gallery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {images.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {/* Left Arrow */}
                  {images.length > 1 && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="flex-shrink-0 h-10 w-10"
                      onClick={() =>
                        setDialogImageIndex(
                          (prev) => (prev - 1 + images.length) % images.length
                        )
                      }
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Image Counter and Info */}
                  <div className="flex-1 text-center space-y-1">
                    <div className="text-sm font-medium">
                      {dialogImageIndex + 1} / {images.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Uploaded by{" "}
                      {images[dialogImageIndex].uploadedBy.firstName}{" "}
                      {images[dialogImageIndex].uploadedBy.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(
                        images[dialogImageIndex].uploadedAt
                      ).toLocaleString()}
                    </div>
                  </div>

                  {/* Right Arrow */}
                  {images.length > 1 && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="flex-shrink-0 h-10 w-10"
                      onClick={() =>
                        setDialogImageIndex(
                          (prev) => (prev + 1) % images.length
                        )
                      }
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {/* Main Image Display - Full Width */}
                <div className="relative bg-muted rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(images[dialogImageIndex].url)}
                    alt={`${event.name} - Photo ${dialogImageIndex + 1}`}
                    className="w-full h-[60vh] object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No photos available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LiveMoments() {
  const { toast } = useToast();
  const [userRole] = useState<string | null>(() => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return null;
      const parsed = JSON.parse(user);
      return parsed.role ?? null;
    } catch {
      return null;
    }
  });
  const [_eventImageCounts, setEventImageCounts] = useState<
    Record<string, number>
  >({});
  const [currentUserId] = useState<string | null>(() => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return null;
      const parsed = JSON.parse(user);
      return parsed._id || parsed.id || null;
    } catch {
      return null;
    }
  });

  const {
    data: ongoingEvents,
    isLoading,
    error,
  } = useQuery<Event[]>({
    queryKey: ["ongoing-events", currentUserId], // Add currentUserId as dependency
    queryFn: async () => {
      const token = localStorage.getItem("token");

      // Get current user ID directly from localStorage in the query
      let userId = currentUserId;
      if (!userId) {
        try {
          const user = localStorage.getItem("user");
          if (user) {
            const parsed = JSON.parse(user);
            userId = parsed._id || parsed.id;
          }
        } catch (err) {
          logger.error("Error getting user ID:", err);
        }
      }

      logger.info("Query running with user ID:", userId);
      const response = await fetch(`${API_BASE_URL}/api/events/ongoing`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          "Failed to fetch ongoing events:",
          response.status,
          errorText
        );
        throw new Error(`Failed to fetch ongoing events: ${response.status}`);
      }

      const result = await response.json();
      logger.info("Ongoing events response:", result);
      const events = result.data || [];

      // Fetch image counts for all events
      const counts: Record<string, number> = {};
      await Promise.all(
        events.map(async (event: Event) => {
          try {
            const imgResponse = await fetch(
              `${API_BASE_URL}/api/events/${event._id}/images`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            if (imgResponse.ok) {
              const imgResult = await imgResponse.json();
              counts[event._id] = imgResult.data?.images?.length || 0;
            } else {
              counts[event._id] = 0;
            }
          } catch {
            counts[event._id] = 0;
          }
        })
      );

      setEventImageCounts(counts);

      logger.info("Current User ID in filter:", userId);

      // Filter events: show only if user is registered OR event has photos
      const filteredEvents = events.filter((event: Event) => {
        const hasPhotos = (counts[event._id] || 0) > 0;

        // Log attendees for debugging
        if (event.name === "Yehia's Bazaar") {
          logger.info("DEBUG - Yehia's Bazaar details:", {
            eventId: event._id,
            attendees: event.attendees,
            attendeesType: typeof event.attendees,
            userId,
            userIdType: typeof userId,
          });
        }

        const isRegistered =
          userId &&
          event.attendees?.some((attendee: any) => {
            const attendeeId = attendee._id || attendee;
            const match =
              attendeeId === userId || String(attendeeId) === String(userId);

            if (event.name === "Yehia's Bazaar") {
              logger.info("Checking attendee:", {
                attendee,
                attendeeId,
                userId,
                attendeeIdString: String(attendeeId),
                userIdString: String(userId),
                match,
              });
            }

            return match;
          });

        logger.info(`Event: ${event.name}`, {
          eventId: event._id,
          hasPhotos,
          isRegistered,
          userId,
          attendeesCount: event.attendees?.length,
          willShow: hasPhotos || isRegistered,
        });

        return hasPhotos || isRegistered;
      });

      logger.info(
        `Total events: ${events.length}, Filtered events: ${filteredEvents.length}`
      );

      // Sort filtered events by image count (descending)
      return filteredEvents.sort((a: Event, b: Event) => {
        const countA = counts[a._id] || 0;
        const countB = counts[b._id] || 0;
        return countB - countA;
      });
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load ongoing events",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Use appropriate header based on user role */}
      {userRole === "professor" ? (
        <ProfessorHeader homeHref="/professor" />
      ) : userRole === "staff" || userRole === "ta" ? (
        <StaffHeader />
      ) : userRole === "events_office" ? (
        <EventsOfficeHeader />
      ) : userRole === "admin" ? (
        <AdminHeader />
      ) : (
        <StudentHeader />
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Live Moments</h1>
          <p className="text-muted-foreground mb-6">
            Capture and share moments from events happening right now
          </p>

          <div className="relative rounded-xl overflow-hidden shadow-lg border-4 border-primary/20">
            <img
              src="/images/acl pic.jpg"
              alt="Campus Events"
              className="w-full h-auto object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
              <div className="p-6">
                <p className="text-white font-bold text-4xl md:text-4xl drop-shadow-2xl leading-tight">
                  Share the Best Moments
                </p>
                <p className="text-white font-bold text-4xl md:text-4xl drop-shadow-2xl leading-tight">
                  Skip the FOMO
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ongoingEvents && ongoingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoingEvents.map((event) => (
              <LiveEventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Ongoing Events</h3>
            <p className="text-muted-foreground">
              There are no events happening right now. Check back later!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
