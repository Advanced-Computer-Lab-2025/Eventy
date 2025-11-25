import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";

interface EventItem {
  id: string;
  title?: string;
  name?: string;
  type?: string;
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
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [allRatings, setAllRatings] = useState<RatingItem[]>([]);
  const [setLoadingEvents] = useState(false);
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
          }))
          .filter((m: any) => {
            if (!m.id) return false;
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });

        setEvents(mapped as EventItem[]);
        if (mapped.length > 0) setSelectedEvent(mapped[0].id);
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

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

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
            <div key={ev.id} onClick={() => setSelectedEvent(ev.id)}>
              <EventCard
                id={ev.id}
                title={ev.title || `Event ${ev.id}`}
                category="academic"
                date=""
                time=""
                location=""
                attendees={0}
                showActions={false}
                className={selectedEvent === ev.id ? "ring-2 ring-primary" : ""}
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ratings & Comments</CardTitle>
            </CardHeader>
            <CardContent>
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
                              ? `${r.user.firstName || ""} ${
                                  r.user.lastName || ""
                                }`.trim()
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
