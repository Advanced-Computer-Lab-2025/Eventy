import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import EventCard from "@/components/EventCard";
import type { EventCategory } from "@/components/CategoryBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/AdminHeader";
import StudentHeader from "@/components/StudentHeader";
import ProfessorHeader from "@/components/ProfessorHeader";
import StaffHeader from "@/components/StaffHeader";
import VendorHeader from "@/components/VendorHeader";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";

interface EventItem {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  category?: EventCategory | string;
  startDate?: string;
  location?: string;
  averageRating?: number;
  totalReviews?: number;
}

interface RatingItem {
  id: string;
  eventId: string;
  user?: { firstName?: string; lastName?: string; email?: string } | null;
  rating?: number;
  comment?: string | null;
  commentRemoved?: boolean;
  createdAt?: string;
  deletedAt?: string | null;
  commentDeletedAt?: string | null;
}

export default function FeedbackDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [_allRatings, setAllRatings] = useState<RatingItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ratingToDelete, setRatingToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch both upcoming and past events so we include any event
    setLoadingEvents(true);

    // First get upcoming + past, then for the deduped list fetch feedback for each
    Promise.allSettled([api.get("/events/upcoming"), api.get("/events/past")])
      .then((results) => {
        const combined: any[] = [];

        // helper to extract data array safely
        const extract = (res: any) => (res?.data?.data ? res.data.data : []);

        const up =
          results[0].status === "fulfilled"
            ? extract((results[0] as any).value)
            : [];
        const past =
          results[1].status === "fulfilled"
            ? extract((results[1] as any).value)
            : [];

        combined.push(...up, ...past);

        // Deduplicate by _id
        const seen = new Set<string>();
        const mapped = combined
          .filter((e) => e)
          .map((e: any) => ({
            id: e._id || e.id,
            title: e.title || e.name || `Event ${e._id || e.id}`,
            category: e.eventType || e.type || "academic",
            startDate: e.startDate,
            location: e.location,
          }))
          .filter((m: any) => {
            if (!m.id) return false;
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });

        // Return the inner Promise so the outer chain waits for feedback checks
        return Promise.allSettled(
          mapped.map((m: any) => api.get(`/feedback/events/${m.id}`))
        ).then((fbResults) => {
          const eventsWithFeedback = mapped
            .map((m: any, idx: number) => {
              const res = fbResults[idx];
              if (res.status !== "fulfilled") return null;
              const data = (res as any).value?.data?.data;
              const feedback = data?.feedback || [];
              if (!Array.isArray(feedback) || feedback.length === 0) {
                return null;
              }

              return {
                ...m,
                averageRating: data?.averageRating || 0,
                totalReviews: data?.totalReviews || feedback.length,
              };
            })
            .filter((e): e is EventItem => e !== null);

          setEvents(eventsWithFeedback);
          setSelectedEvent((prev) => {
            if (
              prev &&
              eventsWithFeedback.some(
                (eventWithFeedback) => eventWithFeedback.id === prev
              )
            ) {
              return prev;
            }
            return null;
          });
        });
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  const fetchEventRatings = useCallback(async () => {
    if (!selectedEvent) return;

    setLoadingRatings(true);
    try {
      // ✅ Use the correct endpoint without '/all'
      const resp = await api.get(`/feedback/events/${selectedEvent}`);
      const data = resp.data?.data || {};
      const feedback = data.feedback || [];
      const mapped = feedback.map((f: any) => ({
        id: f._id,
        eventId: f.eventId,
        user: f.userId
          ? {
              firstName: f.userId.firstName,
              lastName: f.userId.lastName,
              email: f.userId.email,
            }
          : null,
        rating: f.rating,
        // ✅ Check if comment field is empty or feedback has type indicating deletion
        comment: !f.comment || !f.comment.trim() ? null : f.comment,
        commentRemoved: false, // Will be determined based on deletedAt and presence of rating
        createdAt: f.createdAt,
        deletedAt: f.deletedAt || null,
        commentDeletedAt: f.commentDeletedAt || null,
      }));
      setAllRatings(mapped);
      setRatings(mapped);
    } catch (err) {
      logger.error("Error fetching ratings:", err);
      setRatings([]);
      setAllRatings([]);
    } finally {
      setLoadingRatings(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) {
      setRatings([]);
      return;
    }
    fetchEventRatings();
  }, [fetchEventRatings, selectedEvent]);

  const handleDeleteCommentClick = (ratingId: string) => {
    setRatingToDelete(ratingId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ratingToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/feedback/${ratingToDelete}/comment`);

      toast({
        title: "Comment Deleted",
        description:
          "The comment has been successfully deleted and a warning email has been sent to the user.",
      });

      // Refresh the ratings list automatically
      await fetchEventRatings();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Failed to delete comment";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setRatingToDelete(null);
    }
  };

  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  const renderHeader = () => {
    const role = currentUser?.role;
    switch (role) {
      case "student":
        return <StudentHeader />;
      case "professor":
        return <ProfessorHeader />;
      case "staff":
      case "ta":
        return <StaffHeader />;
      case "events_office":
        return <EventsOfficeHeader />;
      case "vendor":
        return <VendorHeader />;
      default:
        return <AdminHeader />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Event Feedback</h1>
          <p className="text-muted-foreground">
            Review event ratings and comments. Click on any event card to view
            its ratings and comments.
          </p>
        </div>

        {loadingEvents ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events with feedback found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => {
                  setSelectedEvent(ev.id);
                  setDialogOpen(true);
                }}
                className="cursor-pointer h-full relative group"
              >
                <EventCard
                  id={ev.id}
                  title={ev.title || `Event ${ev.id}`}
                  category={(ev.category as EventCategory) || "academic"}
                  date={
                    ev.startDate
                      ? new Date(ev.startDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Date TBA"
                  }
                  time={
                    ev.startDate
                      ? new Date(ev.startDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }
                  location={ev.location || "Location TBA"}
                  attendees={0}
                  showAttendees={false}
                  showActions={false}
                  className="h-full"
                />
                {/* Rating Badge Overlay */}
                {ev.averageRating !== undefined && ev.averageRating > 0 && (
                  <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 z-10">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-sm">
                        {ev.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-border" />
                    <span className="text-xs text-muted-foreground">
                      {ev.totalReviews || 0}{" "}
                      {ev.totalReviews === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ratings Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ratings & Comments</DialogTitle>
              <DialogDescription>
                {events.find((e) => e.id === selectedEvent)?.title || ""}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {!selectedEvent ? (
                <div className="text-muted-foreground">
                  Click an event card to view ratings.
                </div>
              ) : loadingRatings ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading ratings…
                </div>
              ) : ratings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No ratings/comments for the selected event.
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((r) => (
                    <div key={r.id} className="p-4 border rounded-md bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-foreground">
                            {r.user
                              ? `${r.user.firstName || ""} ${r.user.lastName || ""}`.trim()
                              : "Unknown user"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {r.user?.email || ""}
                          </div>
                        </div>

                        <div className="text-right">
                          {typeof r.rating === "number" && (
                            <div className="font-semibold text-foreground flex items-center justify-end gap-1">
                              {r.rating} / 5
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {r.createdAt
                              ? formatDistanceToNow(new Date(r.createdAt), {
                                  addSuffix: true,
                                })
                              : ""}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        {r.commentDeletedAt || r.deletedAt ? (
                          <div className="text-sm text-muted-foreground italic">
                            Comment deleted by admin
                          </div>
                        ) : r.comment ? (
                          <div className="text-sm text-foreground">
                            {r.comment}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            No comment added
                          </div>
                        )}
                      </div>

                      {currentUser?.role === "admin" &&
                        !r.deletedAt &&
                        r.comment && (
                          <div className="mt-3 flex gap-2 justify-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCommentClick(r.id)}
                            >
                              Delete Comment
                            </Button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this comment? This action cannot
                be undone. A warning email will be sent to the user who posted
                this comment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Comment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
