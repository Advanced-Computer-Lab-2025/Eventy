import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/AdminHeader";
import StudentHeader from "@/components/StudentHeader";
import ProfessorHeader from "@/components/ProfessorHeader";
import StaffHeader from "@/components/StaffHeader";
import VendorHeader from "@/components/VendorHeader";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";

interface EventItem {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  category?: EventCategory | string;
  startDate?: string;
  location?: string;
}

interface RatingItem {
  id: string;
  eventId: string;
  user?: { firstName?: string; lastName?: string; email?: string } | null;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  deletedAt?: string | null;
}

export default function AdminRatings() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [allRatings, setAllRatings] = useState<RatingItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    // Fetch both upcoming and past events so we include any event
    setLoadingEvents(true);
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

        // For each mapped event, check whether it has any feedback and
        // only keep events that have at least one feedback item.
        Promise.allSettled(
          mapped.map((m: any) => api.get(`/feedback/events/${m.id}`))
        )
          .then((fbResults) => {
            const eventsWithFeedback = mapped.filter((m: any, idx: number) => {
              const res = fbResults[idx];
              if (res.status !== "fulfilled") return false;
              const data = (res as any).value?.data?.data;
              const feedback = data?.feedback || [];
              return Array.isArray(feedback) && feedback.length > 0;
            });

            setEvents(eventsWithFeedback as EventItem[]);
            if (eventsWithFeedback.length > 0)
              setSelectedEvent((prev) => {
                const next = eventsWithFeedback[0].id;
                if (!prev) setDialogOpen(true);
                return next;
              });
          })
          .catch(() => {
            setEvents([]);
          })
          .finally(() => setLoadingEvents(false));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setRatings([]);
      return;
    }
    // Fetch feedback for the selected event from the API
    setLoadingRatings(true);
    api
      .get(`/feedback/events/${selectedEvent}`)
      .then((resp) => {
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
          comment: f.comment,
          createdAt: f.createdAt,
          deletedAt: f.deletedAt || null,
        }));
        setAllRatings(mapped);
        setRatings(mapped);
      })
      .catch(() => {
        setRatings([]);
        setAllRatings([]);
      })
      .finally(() => setLoadingRatings(false));
  }, [selectedEvent]);

  async function handleDeleteComment(ratingId: string) {
    if (!confirm("Delete this comment? This action is permanent.")) return;
    try {
      await api.delete(`/feedback/events/${selectedEvent}/${ratingId}`);
      // Optimistically remove from UI
      const updated = allRatings.map((r) =>
        r.id === ratingId
          ? { ...r, comment: null, deletedAt: new Date().toISOString() }
          : r
      );
      setAllRatings(updated);
      setRatings(updated.filter((r) => r.eventId === selectedEvent));
    } catch (err) {
      alert("Failed to delete comment");
    }
  }

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
          <h1 className="text-3xl font-bold">Event Ratings & Comments</h1>
          <p className="text-muted-foreground">
            Click an event card to view its ratings and comments. Admins can
            remove inappropriate comments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => {
                setSelectedEvent(ev.id);
                setDialogOpen(true);
              }}
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
                className={selectedEvent === ev.id ? "ring-2 ring-primary" : ""}
              />
            </div>
          ))}
        </div>
        {/* Dialog overlay to show ratings/comments for selected event */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
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
                <div className="text-muted-foreground">Loading ratings…</div>
              ) : ratings.length === 0 ? (
                <div className="text-muted-foreground">
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
                          <div className="font-semibold text-foreground">
                            {r.rating} / 5
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.createdAt
                              ? formatDistanceToNow(new Date(r.createdAt), {
                                  addSuffix: true,
                                })
                              : ""}
                          </div>
                        </div>
                      </div>

                      {r.comment ? (
                        <div className="mt-2 text-sm text-foreground">
                          {r.comment}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                          Comment removed by admin
                        </div>
                      )}

                      <div className="mt-3 flex gap-2 justify-end">
                        {r.comment && currentUser?.role === "admin" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteComment(r.id)}
                          >
                            Delete comment
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
