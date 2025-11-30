import { useState } from "react";
import type { FormEvent } from "react";
import { Calendar, MapPin, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { useLocation } from "wouter";

export default function CreateTripForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
    capacity: "",
    registrationDeadline: "",
  });
  const [restrictedRoles, setRestrictedRoles] = useState<string[]>([]);

  const availableRoles = [
    { value: "student", label: "Students" },
    { value: "staff", label: "Staff" },
    { value: "ta", label: "Teaching Assistants" },
    { value: "professor", label: "Professors" },
  ];

  const apiBase =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setLoading(true);
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
        toast({
          title: "Invalid start date",
          description: "Please provide a valid start date/time.",
          variant: "destructive",
        });
        return;
      }
      if (start < now) {
        toast({
          title: "Start date in the past",
          description: "Trip start date/time cannot be in the past.",
          variant: "destructive",
        });
        return;
      }
      if (!end || isNaN(end.getTime())) {
        toast({
          title: "Invalid end date",
          description: "Please provide a valid end date/time.",
          variant: "destructive",
        });
        return;
      }
      if (end <= start) {
        toast({
          title: "Invalid date range",
          description: "End date/time must be after start date/time.",
          variant: "destructive",
        });
        return;
      }
      if (!token) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to create a trip.",
          variant: "destructive",
        });
        return;
      }

      // Build payload compatible with backend model/validation:
      // - Keep date and time fields separate
      // - convert numeric fields to numbers
      const payload: any = { ...formData };

      // Format dates as ISO dates (without time) and keep time fields separate
      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate)
          .toISOString()
          .split("T")[0];
      }
      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate)
          .toISOString()
          .split("T")[0];
      }

      // Keep time fields as they are, ensuring they're not empty strings
      if (!formData.startTime) {
        toast({
          title: "Start time required",
          description: "Please provide a start time for the trip.",
          variant: "destructive",
        });
        return;
      }
      if (!formData.endTime) {
        toast({
          title: "End time required",
          description: "Please provide an end time for the trip.",
          variant: "destructive",
        });
        return;
      }

      payload.startTime = formData.startTime;
      payload.endTime = formData.endTime;

      // registrationDeadline -> full ISO date (backend expects Date)
      if (formData.registrationDeadline) {
        // Validate registration deadline (must be today or in the future)
        const todayIso = new Date().toISOString().slice(0, 10);
        if (formData.registrationDeadline < todayIso) {
          toast({
            title: "Invalid registration deadline",
            description:
              "Registration deadline must be today or a future date.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        payload.registrationDeadline = new Date(
          formData.registrationDeadline
        ).toISOString();
      }

      // numeric conversions
      if (payload.price !== "") payload.price = Number(payload.price);
      if (payload.capacity !== "") payload.capacity = Number(payload.capacity);

      // Add restricted roles only if there are restrictions
      if (restrictedRoles.length > 0) {
        payload.restrictedRoles = restrictedRoles;
      }

      // POST to create trip endpoint
      const url = `${apiBase}/api/events/createtrips`;
      const method = "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);
      if (response.ok) {
        toast({
          title: "Trip created",
          description: "The trip was created successfully.",
        });
        // Navigate to events office dashboard
        setLocation("/events-office/dashboard");
      } else {
        // more verbose error output to help debugging
        console.error("Submit failed:", response.status, json);
        const msg =
          json?.message ?? json?.error ?? `Server returned ${response.status}`;
        toast({
          title: "Failed to create trip",
          description: String(msg),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Unexpected error",
        description: "Error submitting form. See console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setLocation("/events-office/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Create New Trip</h1>
          <p className="text-muted-foreground">
            Fill in the details to create a new trip for university students and
            staff
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Trip Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Alexandria Beach Trip"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  data-testid="input-trip-name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Destination</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="e.g., Alexandria, Egypt"
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

                <div className="space-y-2">
                  <Label htmlFor="price">Price (EGP)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="500"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    data-testid="input-price"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="startDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDate: e.target.value,
                        })
                      }
                      onClick={(e) =>
                        (e.currentTarget as HTMLInputElement).showPicker?.()
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
                    onClick={(e) =>
                      (e.currentTarget as HTMLInputElement).showPicker?.()
                    }
                    data-testid="input-start-time"
                    required
                    className="cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="endDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      onClick={(e) =>
                        (e.currentTarget as HTMLInputElement).showPicker?.()
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the trip activities and highlights..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  data-testid="input-description"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="30"
                      className="pl-10"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      data-testid="input-capacity"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Registration Deadline</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="deadline"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      value={formData.registrationDeadline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationDeadline: e.target.value,
                        })
                      }
                      onClick={(e) =>
                        (e.currentTarget as HTMLInputElement).showPicker?.()
                      }
                      data-testid="input-deadline"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Restrict Access Section */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-base font-semibold">
                      Restrict Access (Optional)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select which roles should NOT be able to view or register
                      for this trip
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {availableRoles.map((role) => (
                    <div
                      key={role.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`restrict-${role.value}`}
                        checked={restrictedRoles.includes(role.value)}
                        onCheckedChange={(checked) => {
                          setRestrictedRoles(
                            checked
                              ? [...restrictedRoles, role.value]
                              : restrictedRoles.filter((r) => r !== role.value)
                          );
                        }}
                      />
                      <Label
                        htmlFor={`restrict-${role.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="button-submit-trip"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {loading ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
