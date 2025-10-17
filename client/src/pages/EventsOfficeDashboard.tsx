import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Plus, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";
import QuickActions from "@/components/QuickActions";
import { Badge } from "@/components/ui/badge";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

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

export default function EventsOfficeDashboard() {
  const [, setLocation] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bazaars, setBazaars] = useState<Bazaar[]>([]);
  const [loadingBazaars, setLoadingBazaars] = useState(true);
  const formRef = useRef<HTMLDivElement | null>(null);
  const existingRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const [editingBazaarId, setEditingBazaarId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchBazaars();
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

      const url = editingBazaarId
        ? `${API_BASE_URL}/api/events/bazaars/${editingBazaarId}`
        : `${API_BASE_URL}/api/events/bazaars`;
      const method = editingBazaarId ? "PATCH" : "POST";

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
          data.message || (editingBazaarId ? "Failed to update bazaar" : "Failed to create bazaar")
        );

      // Reset form and refresh list
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
      setEditingBazaarId(null);
      await fetchBazaars();
      toast({
        title: editingBazaarId ? "Bazaar updated" : "Bazaar created",
        description: editingBazaarId
          ? "The bazaar has been updated successfully."
          : "Your bazaar has been created successfully.",
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (b: Bazaar) => {
    const toDate = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
    const toTime = (iso?: string) => (iso ? new Date(iso).toISOString().slice(11, 16) : "");
    setEditingBazaarId(b._id);
    setFormData({
      name: b.name || "",
      location: b.location || "",
      startDate: toDate(b.startDate),
      startTime: toTime(b.startDate),
      endDate: toDate(b.endDate),
      endTime: toTime(b.endDate),
      description: b.description || "",
      registrationDeadline: toDate(b.registrationDeadline),
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingBazaarId(null);
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Events Office Dashboard</h1>
            <Button variant="outline" onClick={() => setLocation("/")}>Back to Home</Button>
          </div>
          <p className="text-muted-foreground">
            Create and manage bazaars. Fill in the details below to create a new bazaar.
          </p>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <StatCard
              title="Total Bazaars"
              value={loadingBazaars ? "-" : bazaars.length}
              icon={CalendarDays}
            />
            <StatCard
              title="Upcoming"
              value={loadingBazaars ? "-" : bazaars.filter(b => new Date(b.startDate) > new Date()).length}
              icon={Clock}
            />
            <StatCard
              title="Active/Approved"
              value={loadingBazaars ? "-" : bazaars.filter(b => (b.status || "").toLowerCase().includes("approved") || (b.status || "").toLowerCase().includes("active")).length}
              icon={CheckCircle2}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card ref={formRef as any}>
              <CardHeader>
                <CardTitle>{editingBazaarId ? "Edit Bazaar" : "Create Bazaar"}</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="text-red-500 mb-3" role="alert">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Bazaar Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Spring Festival Bazaar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="input-bazaar-name"
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
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                        data-testid="input-location"
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
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          required
                          data-testid="input-start-date"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                        data-testid="input-start-time"
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
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          required
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                        data-testid="input-end-time"
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
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      data-testid="input-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline">Vendor Registration Deadline</Label>
                    <Input
                      id="registrationDeadline"
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                      required
                      data-testid="input-deadline"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={editingBazaarId ? cancelEdit : () => setLocation("/dashboard")}
                      className="flex-1"
                    >
                      {editingBazaarId ? "Cancel Edit" : "Cancel"}
                    </Button>
                    <Button type="submit" className="flex-1" disabled={submitting} data-testid="button-submit-bazaar">
                      <Plus className="h-4 w-4 mr-2" />
                      {submitting
                        ? editingBazaarId
                          ? "Updating..."
                          : "Creating..."
                        : editingBazaarId
                          ? "Update Bazaar"
                          : "Create Bazaar"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card ref={existingRef as any}>
              <CardHeader>
                <CardTitle>Existing Bazaars</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBazaars ? (
                  <div className="text-center py-8 text-muted-foreground">Loading bazaars...</div>
                ) : bazaars.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No bazaars found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bazaars.map((b) => (
                      <Card key={b._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-base">{b.name}</div>
                                {b.status && (
                                  <Badge variant="outline" className="uppercase tracking-wide">
                                    {b.status}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{b.description}</div>
                            </div>
                            <div className="shrink-0">
                              <Button size="sm" variant="outline" onClick={() => beginEdit(b)} data-testid={`button-edit-${b._id}`}>
                                Edit
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(b.startDate).toLocaleString()} - {new Date(b.endDate).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{b.location}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <QuickActions
              onCreateEvent={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              onEditBazaar={() => existingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            />
            <Card>
              <CardHeader>
                <CardTitle>Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Review dates and times carefully before publishing.</li>
                  <li>Vendor applications close at the specified registration deadline.</li>
                  <li>Provide a concise description and accurate location details.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
