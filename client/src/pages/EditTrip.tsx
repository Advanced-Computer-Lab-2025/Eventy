import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { MapPin, Users, DollarSign, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { cn } from "@/lib/utils";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function EditTrip() {
  const [, params] = useRoute("/events-office/events/trip/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    startDate: undefined as Date | undefined,
    startTime: "",
    endDate: undefined as Date | undefined,
    endTime: "",
    description: "",
    capacity: "",
    registrationDeadline: undefined as Date | undefined,
  });
  const [restrictedRoles, setRestrictedRoles] = useState<string[]>([]);

  const availableRoles = [
    { value: "student", label: "Students" },
    { value: "staff", label: "Staff" },
    { value: "ta", label: "Teaching Assistants" },
    { value: "professor", label: "Professors" },
  ];

  useEffect(() => {
    if (params?.id) {
      fetchTrip(params.id);
    }
  }, [params?.id]);

  const fetchTrip = async (tripId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${tripId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch trip details");
      }

      const data = await res.json();
      const tripData = data.data;

      if (tripData.eventType !== "trip") {
        toast({
          title: "Error",
          description: "This event is not a trip",
          variant: "destructive",
        });
        setLocation("/events-office");
        return;
      }

      setTrip(tripData);

      // Check if trip has already started and show toast, then redirect
      const now = new Date();
      const tripStartDate = tripData.startDate
        ? new Date(tripData.startDate)
        : null;
      if (tripStartDate && tripStartDate <= now) {
        toast({
          title: "Cannot Edit Trip",
          description: "Cannot edit a trip that has already started.",
          variant: "destructive",
        });
        // Redirect back immediately
        setLocation("/events-office/dashboard");
        return;
      }

      const getTimeFromDate = (dateStr: string) => {
        if (!dateStr) return "";
        const timeMatch = dateStr.match(/T(\d{2}:\d{2})/);
        return timeMatch ? timeMatch[1] : "";
      };

      setFormData({
        name: tripData.name || "",
        location: tripData.location || "",
        price: tripData.price?.toString() || "",
        startDate: tripData.startDate
          ? new Date(tripData.startDate)
          : undefined,
        startTime:
          tripData.startTime || getTimeFromDate(tripData.startDate || ""),
        endDate: tripData.endDate ? new Date(tripData.endDate) : undefined,
        endTime: tripData.endTime || getTimeFromDate(tripData.endDate || ""),
        description: tripData.description || "",
        capacity: tripData.capacity?.toString() || "",
        registrationDeadline: tripData.registrationDeadline
          ? new Date(tripData.registrationDeadline)
          : undefined,
      });
      setRestrictedRoles(tripData.restrictedRoles || []);
    } catch (error) {
      console.error("Error fetching trip:", error);
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive",
      });
      setLocation("/events-office");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      // Validate dates
      const now = new Date();
      const start = formData.startDate
        ? new Date(
            `${format(formData.startDate, "yyyy-MM-dd")}T${(formData.startTime || "00:00").trim()}:00`
          )
        : null;
      const end = formData.endDate
        ? new Date(
            `${format(formData.endDate, "yyyy-MM-dd")}T${(formData.endTime || "00:00").trim()}:00`
          )
        : null;

      if (!start || isNaN(start.getTime())) {
        toast({
          title: "Invalid start date",
          description: "Please provide a valid start date/time.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // For editing: Only validate past dates if the date was actually changed
      // Allow keeping the existing date even if it's in the past
      const originalStartDate = trip?.startDate
        ? new Date(trip.startDate)
        : null;
      const originalStartTime = trip?.startTime || "";
      const originalStart =
        originalStartDate && originalStartTime
          ? new Date(
              `${originalStartDate.toISOString().split("T")[0]}T${originalStartTime}:00`
            )
          : null;

      // Check if the date/time was actually changed
      const dateChanged =
        !originalStart ||
        Math.abs(start.getTime() - originalStart.getTime()) > 1000; // 1 second tolerance

      // Only validate past dates if the date was changed to a new past date
      if (dateChanged && start < now) {
        toast({
          title: "Start date in the past",
          description: "Trip start date/time cannot be in the past.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (!end || isNaN(end.getTime())) {
        toast({
          title: "Invalid end date",
          description: "Please provide a valid end date/time.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (end <= start) {
        toast({
          title: "Invalid date range",
          description: "End date/time must be after start date/time.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const payload = {
        name: formData.name,
        location: formData.location,
        startDate: formData.startDate
          ? format(formData.startDate, "yyyy-MM-dd")
          : "",
        startTime: formData.startTime,
        endDate: formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : "",
        endTime: formData.endTime,
        description: formData.description,
        registrationDeadline: formData.registrationDeadline
          ? formData.registrationDeadline.toISOString()
          : undefined,
        // Normalize numeric fields to avoid floating/locale issues
        price: (() => {
          const p = Number(String(formData.price).trim());
          if (Number.isNaN(p)) return undefined;
          return Math.round(p * 100) / 100; // keep two decimals
        })(),
        capacity: (() => {
          const c = Number(String(formData.capacity).trim());
          if (Number.isNaN(c)) return undefined;
          return Math.max(1, Math.round(c));
        })(),
        restrictedRoles,
      };

      const res = await fetch(
        `${API_BASE_URL}/api/events/edit/trips/${params?.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        // Display error toast for specific error messages
        if (data.message && data.message.includes("already started")) {
          toast({
            title: "Cannot Edit Trip",
            description: "Cannot edit a trip that has already started.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to update trip",
            variant: "destructive",
          });
        }
        setSaving(false);
        return;
      }

      toast({
        title: "Success",
        description: "Trip updated successfully",
      });

      // Small delay to allow toast to be visible before redirect
      setTimeout(() => {
        setLocation("/events-office/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Error updating trip:", error);
      // Only show toast if error wasn't already handled above
      if (error.message && !error.message.includes("already started")) {
        toast({
          title: "Error",
          description: error.message || "Failed to update trip",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    setRestrictedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <EventsOfficeHeader />
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading trip details...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <EventsOfficeHeader />
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500 mb-4">Trip not found</p>
              <Button onClick={() => setLocation("/events-office")}>
                Back to Events Office Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Trip</h1>
          <p className="text-muted-foreground">
            Update the trip information below
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Trip Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Enter trip name"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="pl-10"
                    required
                    placeholder="Enter location"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (Dollars) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="pl-10"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(formData.startDate, "dd/MM/yyyy")
                        ) : (
                          <span>dd/mm/yyyy</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, startDate: date })
                        }
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          (formData.endDate ? date > formData.endDate : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
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

              {/* End Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? (
                          format(formData.endDate, "dd/MM/yyyy")
                        ) : (
                          <span>dd/mm/yyyy</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, endDate: date })
                        }
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          (formData.startDate
                            ? date < formData.startDate
                            : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
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

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    step={1}
                    min={1}
                    className="pl-10"
                    required
                    placeholder="Maximum number of attendees"
                  />
                </div>
              </div>

              {/* Registration Deadline */}
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">
                  Registration Deadline *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.registrationDeadline &&
                          "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.registrationDeadline ? (
                        format(formData.registrationDeadline, "dd/MM/yyyy")
                      ) : (
                        <span>dd/mm/yyyy</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.registrationDeadline}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          registrationDeadline: date,
                        })
                      }
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  placeholder="Enter trip description"
                  rows={4}
                />
              </div>

              {/* Restricted Roles */}
              <div className="space-y-2">
                <Label>Restrict Access For</Label>
                <div className="space-y-2">
                  {availableRoles.map((role) => (
                    <div
                      key={role.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={role.value}
                        checked={restrictedRoles.includes(role.value)}
                        onCheckedChange={() => toggleRole(role.value)}
                      />
                      <Label
                        htmlFor={role.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected roles will not be able to view or register for this
                  trip
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? "Updating..." : "Update Trip"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to discard your changes? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Editing</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setLocation("/events-office/dashboard")}
              >
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
