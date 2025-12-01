import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calendar, MapPin, Info, Clock, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CreateBazaar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startDate: undefined as Date | undefined,
    startTime: "",
    endDate: undefined as Date | undefined,
    endTime: "",
    description: "",
    deadline: undefined as Date | undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [restrictedRoles, setRestrictedRoles] = useState<string[]>([]);

  const availableRoles = [
    { value: "student", label: "Students" },
    { value: "staff", label: "Staff" },
    { value: "ta", label: "Teaching Assistants" },
    { value: "professor", label: "Professors" },
    { value: "vendor", label: "Vendors" },
  ];

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Validate registration deadline (must be today or in the future)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (formData.deadline && formData.deadline < today) {
        toast({
          title: "Invalid registration deadline",
          description:
            "Vendor registration deadline must be today or a future date.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      const token = localStorage.getItem("token");
      // Validate date logic: no past start, and end after start
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

      const payload: any = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        startDate: formData.startDate
          ? `${format(formData.startDate, "yyyy-MM-dd")}T${startTimeValue}:00.000Z`
          : undefined,
        endDate: formData.endDate
          ? `${format(formData.endDate, "yyyy-MM-dd")}T${endTimeValue}:00.000Z`
          : undefined,
        startTime: startTimeValue, // Required by backend model
        endTime: endTimeValue, // Required by backend model
        registrationDeadline: formData.deadline
          ? `${format(formData.deadline, "yyyy-MM-dd")}T23:59:59.000Z`
          : undefined,
      };

      // Add restricted roles
      // When editing, always send restrictedRoles (even if empty) to clear restrictions
      // When creating, only send if there are restrictions
      if (editingId) {
        payload.restrictedRoles = restrictedRoles;
      } else if (restrictedRoles.length > 0) {
        payload.restrictedRoles = restrictedRoles;
      }

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

      const isEdit = Boolean(editingId);
      toast({
        title: isEdit ? "Bazaar updated" : "Bazaar created",
        description: isEdit
          ? "The bazaar was updated successfully."
          : "The bazaar was created successfully.",
      });

      // Small delay to allow toast to be visible before redirect
      setTimeout(() => {
        setLocation("/events-office/dashboard");
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.message || "Something went wrong";
      setError(errorMessage);
      toast({
        title: editingId
          ? "Failed to update bazaar"
          : "Failed to create bazaar",
        description: errorMessage,
        variant: "destructive",
      });
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
        setRestrictedRoles(b.restrictedRoles || []);
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
                  <Label htmlFor="startTime">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      onClick={(e) => {
                        (e.currentTarget as HTMLInputElement).showPicker?.();
                      }}
                      data-testid="input-start-time"
                      required
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
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
                  <Label htmlFor="endTime">End Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      onClick={(e) => {
                        (e.currentTarget as HTMLInputElement).showPicker?.();
                      }}
                      data-testid="input-end-time"
                      required
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? (
                        format(formData.deadline, "dd/MM/yyyy")
                      ) : (
                        <span>dd/mm/yyyy</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) =>
                        setFormData({ ...formData, deadline: date })
                      }
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                      for this bazaar
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              className="min-w-[120px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-[120px]"
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

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to discard your changes and return to the Events
                Office dashboard? This action cannot be undone.
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
