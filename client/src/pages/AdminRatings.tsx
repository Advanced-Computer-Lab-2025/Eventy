import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { eventStore, userStore, authStore } from "@/lib/mockData";
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

const RATINGS_KEY = "mock_ratings_v1";

function loadMockRatings(): RatingItem[] {
  const raw = localStorage.getItem(RATINGS_KEY);
  if (raw) return JSON.parse(raw);

  // Default mock ratings tied to the default events in mockData
  const defaults: RatingItem[] = [
    {
      id: "r1",
      eventId: "1",
      user: { firstName: "Lina", lastName: "Ahmed", email: "lina@example.com" },
      rating: 5,
      comment: "Great hands-on examples and super helpful instructor.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      deletedAt: null,
    },
    {
      id: "r2",
      eventId: "1",
      user: { firstName: "Omar", lastName: "Sami", email: "omar@example.com" },
      rating: 4,
      comment: "Good content but the room was noisy.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      deletedAt: null,
    },
    {
      id: "r3",
      eventId: "2",
      user: {
        firstName: "Sara",
        lastName: "Hassan",
        email: "sara@example.com",
      },
      rating: 5,
      comment: "Amazing atmosphere!",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      deletedAt: null,
    },
    {
      id: "r4",
      eventId: "3",
      user: { firstName: "Ali", lastName: "Kamal", email: "ali@example.com" },
      rating: 3,
      comment: "Seats were uncomfortable but the game was exciting.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      deletedAt: null,
    },
    {
      id: "r5",
      eventId: "4",
      user: {
        firstName: "Mona",
        lastName: "Youssef",
        email: "mona@example.com",
      },
      rating: 4,
      comment: "Good networking opportunities.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      deletedAt: null,
    },
  ];

  localStorage.setItem(RATINGS_KEY, JSON.stringify(defaults));
  return defaults;
}

export default function AdminRatings() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [allRatings, setAllRatings] = useState<RatingItem[]>([]);

  useEffect(() => {
    // Load events from mock store (Event shape in mockData uses `id`)
    const ev = eventStore.getAll().map((e) => ({
      id: e.id || String((e as any)._id || e.id),
      title:
        e.title ||
        (e as any).name ||
        `Event ${(e as any).id || (e as any)._id || ""}`,
    }));
    setEvents(ev as EventItem[]);

    const loaded = loadMockRatings();
    setAllRatings(loaded);

    // Preselect first event for convenience
    if (ev.length > 0) setSelectedEvent(ev[0].id);
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setRatings([]);
      return;
    }
    const list = allRatings
      .filter((r) => r.eventId === selectedEvent)
      .sort((a, b) => ((b.createdAt || "") > (a.createdAt || "") ? 1 : -1));
    setRatings(list);
  }, [selectedEvent, allRatings]);

  function persistRatings(r: RatingItem[]) {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(r));
    setAllRatings(r);
  }

  function handleDeleteComment(ratingId: string) {
    if (
      !confirm("Delete this comment? This action is permanent in the mock UI.")
    )
      return;
    const updated = allRatings.map((r) =>
      r.id === ratingId
        ? { ...r, comment: null, deletedAt: new Date().toISOString() }
        : r
    );
    persistRatings(updated);
  }

  const currentUser = authStore.getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Event Ratings & Comments (Mock)
          </h1>
          <p className="text-muted-foreground">
            This view uses frontend mock data. Click an event card to view its
            ratings and comments. Admins can remove inappropriate comments
            (client-side).
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
