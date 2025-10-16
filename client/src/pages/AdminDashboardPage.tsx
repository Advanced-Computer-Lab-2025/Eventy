import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Plus } from "lucide-react";
import EventCard from "@/components/EventCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface Bazaar {
  _id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  status?: string;
}

interface Event {
  _id: string;
  name: string;
  eventType?: string;
  startDate?: string;
  location?: string;
  attendeesCount?: number;
  image?: string;
}

export default function EventsOfficeDashboard() {
  const [, setLocation] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bazaars, setBazaars] = useState<Bazaar[]>([]);
  const [loadingBazaars, setLoadingBazaars] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
    registrationDeadline: "",
  });

  // Fetch bazaars
  const fetchBazaars = async () => {
    try {
      setLoadingBazaars(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/search?type=bazaar`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch bazaars");
      setBazaars(data.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to load bazaars");
      setBazaars([]);
    } finally {
      setLoadingBazaars(false);
    }
  };

  // Fetch upcoming events (like in Home)
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/upcoming`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load events");
      setEvents(data.data || []);
    } catch (e: any) {
      console.error("Error fetching events:", e);
      setEventsError(e.message || "Unable to load events");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchBazaars();
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        startDate: `${formData.startDate}T${formData.startTime}:00.000Z`,
        endDate: `${formData.endDate}T${formData.endTime}:00.000Z`,
        registrationDeadline: formData.registrationDeadline
          ? `${formData.registrationDeadline}T23:59:59.000Z`
          : undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/events/bazaars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create bazaar");

      setFormData({
        name: "",
        location: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        description: "",
        registrationDeadline: "",
      });
      await fetchBazaars();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Events Office Dashboard</h1>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Back to Home
            </Button>
          </div>
          <p className="text-muted-foreground">
            Create and manage bazaars. View upcoming university events below.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Create Bazaar Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Bazaar</CardTitle>
              </CardHeader>
              <CardContent>
                {error && <div className="text-red-500 mb-3">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Bazaar Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Spring Festival Bazaar"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="e.g., University Courtyard"
                        className="pl-10"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, startDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({ ...formData, startTime: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the bazaar..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline">
                      Vendor Registration Deadline
                    </Label>
                    <Input
                      id="registrationDeadline"
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationDeadline: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/dashboard")}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={submitting}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {submitting ? "Creating..." : "Create Bazaar"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Existing Bazaars */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Bazaars</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBazaars ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading bazaars...
                  </div>
                ) : bazaars.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bazaars found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bazaars.map((b) => (
                      <div key={b._id} className="border rounded-lg p-4">
                        <div className="font-semibold">{b.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {b.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(b.startDate).toLocaleString()} -{" "}
                          {new Date(b.endDate).toLocaleString()} • {b.location}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEvents ? (
                  <p>Loading events...</p>
                ) : eventsError ? (
                  <p className="text-red-500">{eventsError}</p>
                ) : events.length === 0 ? (
                  <p>No upcoming events found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {events.map((event, index) => (
                      <EventCard
                        key={event._id || index}
                        id={event._id || String(index)}
                        title={event.name || "Untitled Event"}
                        category={(event.eventType || "academic") as any}
                        date={
                          event.startDate
                            ? new Date(event.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "TBA"
                        }
                        time={
                          event.startDate
                            ? new Date(event.startDate).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )
                            : "TBA"
                        }
                        location={event.location || "Unknown location"}
                        attendees={event.attendeesCount || 0}
                        image={
                          event.image ||
                          "https://via.placeholder.com/400x250?text=Event+Image"
                        }
                        onRegister={() =>
                          console.log("Register:", event.name)
                        }
                        onSave={() => console.log("Save:", event.name)}
                        onShare={() => console.log("Share:", event.name)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                - Ensure dates and times are correct before submitting.
                <br />- Vendors will see approved bazaars and can apply before
                the registration deadline.
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
