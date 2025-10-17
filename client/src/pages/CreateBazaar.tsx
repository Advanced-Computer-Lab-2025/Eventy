import { useState } from "react";
import { useLocation } from "wouter";
import { Calendar, MapPin } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateBazaar() {
  const [, setLocation] = useLocation();
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const payload = {
        eventType: "bazaar",
        name: formData.name,
        description: formData.description,
        location: formData.location,
        startDate: `${formData.startDate}T${formData.startTime}:00.000Z`,
        endDate: `${formData.endDate}T${formData.endTime}:00.000Z`,
        registrationDeadline: formData.deadline
          ? `${formData.deadline}T23:59:59.000Z`
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

      setLocation("/events-office/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Bazaar</h1>
          <p className="text-muted-foreground">
            Set up a new bazaar event for vendors
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Bazaar Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-red-500" role="alert">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Bazaar Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Spring Festival Bazaar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
              onClick={() => setLocation("/dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" data-testid="button-submit-bazaar" disabled={submitting}>
              {submitting ? "Creating..." : "Create Bazaar"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
