import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calendar, MapPin } from "lucide-react";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CreateBazaar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
    deadline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      // Validate date logic: no past start, and end after start
      const now = new Date();
      const start = formData.startDate
        ? new Date(
            `${formData.startDate}T${(formData.startTime || "00:00").trim()}:00`
          )
        : null;
      const end = formData.endDate
        ? new Date(
            `${formData.endDate}T${(formData.endTime || "00:00").trim()}:00`
          )
        : null;
      if (!start || isNaN(start.getTime())) {
        setError("Please provide a valid start date/time.");
        toast({
          title: "Invalid start date",
          description: "Please provide a valid start date/time.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      if (start < now) {
        setError("Bazaar start date/time cannot be in the past.");
        toast({
          title: "Start date in the past",
          description: "Bazaar start date/time cannot be in the past.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      if (!end || isNaN(end.getTime())) {
        setError("Please provide a valid end date/time.");
        toast({
          title: "Invalid end date",
          description: "Please provide a valid end date/time.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      if (end <= start) {
        setError("End date/time must be after start date/time.");
        toast({
          title: "Invalid date range",
          description: "End date/time must be after start date/time.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      // Build payload with merged ISO dates and separate time fields
      const startTimeValue =
        formData.startTime && formData.startTime.trim()
          ? formData.startTime.trim()
          : "00:00";
      const endTimeValue =
        formData.endTime && formData.endTime.trim()
          ? formData.endTime.trim()
          : "00:00";

      const payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        startDate: `${formData.startDate}T${startTimeValue}:00.000Z`,
        endDate: `${formData.endDate}T${endTimeValue}:00.000Z`,
        startTime: startTimeValue, // Required by backend model
        endTime: endTimeValue, // Required by backend model
        registrationDeadline: formData.deadline
          ? `${formData.deadline}T23:59:59.000Z`
          : undefined,
      };

      const url = editingId
        ? `${API_BASE_URL}/api/events/bazaars/${editingId}`
        : `${API_BASE_URL}/api/events/bazaars`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message ||
            (editingId ? "Failed to update bazaar" : "Failed to create bazaar")
        );

      setLocation("/events-office/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Load existing bazaar if id is in query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;
    setEditingId(id);
    const fetchExisting = async () => {
      try {
        setLoadingExisting(true);
        setError("");
        const token = localStorage.getItem("token");
        // events_office may not have access to GET /api/events/:id, so use search and filter by id
        const res = await fetch(
          `${API_BASE_URL}/api/events/search?type=bazaar`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load bazaar");
        const list = data.data || [];
        const b = list.find((ev: any) => ev._id === id);
        if (!b) throw new Error("Bazaar not found");
        const toDate = (iso?: string) =>
          iso ? new Date(iso).toISOString().slice(0, 10) : "";
        const toTime = (iso?: string) =>
          iso ? new Date(iso).toISOString().slice(11, 16) : "";
        setFormData({
          name: b.name || "",
          location: b.location || "",
          startDate: toDate(b.startDate),
          startTime: toTime(b.startDate),
          endDate: toDate(b.endDate),
          endTime: toTime(b.endDate),
          description: b.description || "",
          deadline: toDate(b.registrationDeadline),
        });
      } catch (e: any) {
        setError(e.message || "Failed to load bazaar");
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchExisting();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {editingId ? "Edit Bazaar" : "Create Bazaar"}
          </h1>
          <p className="text-muted-foreground">
            {editingId
              ? "Update the bazaar details"
              : "Set up a new bazaar event for vendors"}
          </p>
          {loadingExisting && (
            <p className="text-sm text-muted-foreground">Loading bazaar...</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingId ? "Bazaar Details (Edit)" : "Bazaar Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-red-500" role="alert">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Bazaar Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Spring Festival Bazaar"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  data-testid="input-bazaar-name"
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
                    data-testid="input-location"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startDate"
                      type="date"
                      className="pl-10"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      data-testid="input-start-date"
                      required
                    />
                  </div>
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
                    data-testid="input-start-time"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endDate"
                      type="date"
                      className="pl-10"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      data-testid="input-end-date"
                      required
                    />
                  </div>
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
                    data-testid="input-end-time"
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
                    setFormData({ ...formData, description: e.target.value })
                  }
                  data-testid="input-description"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Vendor Registration Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  data-testid="input-deadline"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/events-office/dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              data-testid="button-submit-bazaar"
              disabled={submitting}
            >
              {submitting
                ? editingId
                  ? "Updating..."
                  : "Creating..."
                : editingId
                  ? "Update Bazaar"
                  : "Create Bazaar"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
