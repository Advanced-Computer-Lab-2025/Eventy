import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Calendar, MapPin, Users, Edit2, Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";

export default function TripManagement() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showModal, setShowModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
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
    { value: "vendor", label: "Vendors" },
  ];

  const apiBase =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";

  // Fetch trips from the backend admin trips endpoint and handle ApiResponse wrapper
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token in localStorage, fetch aborted.");
        setTrips([]);
        return;
      }

      // route is mounted on the events router -> /api/events/gettrips
      const res = await fetch(`${apiBase}/api/events/gettrips`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("Failed to fetch trips:", res.status, json);
        setTrips([]);
        return;
      }

      // backend may return ApiResponse { status, data, message }
      const data = json?.data ?? json ?? [];
      setTrips(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTrips();
  }, []);

  const handleOpenModal = (trip: any = null) => {
    if (trip) {
      setEditingId(trip._id);
      setFormData({
        name: trip.name ?? "",
        location: trip.location ?? "",
        price: trip.price ?? "",
        startDate: trip.startDate?.split?.("T")[0] ?? "",
        startTime: trip.startDate
          ? new Date(trip.startDate).toTimeString().slice(0, 5)
          : "",
        endDate: trip.endDate?.split?.("T")[0] ?? "",
        endTime: trip.endDate
          ? new Date(trip.endDate).toTimeString().slice(0, 5)
          : "",
        description: trip.description ?? "",
        capacity: trip.capacity ?? "",
        registrationDeadline: trip.registrationDeadline?.split?.("T")[0] ?? "",
      });
      setRestrictedRoles(trip.restrictedRoles ?? []);
    } else {
      setEditingId(null);
      setFormData({
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
      setRestrictedRoles([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setRestrictedRoles([]);
  };

  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  const handleOpenDescriptionModal = (trip: any) => {
    setSelectedTrip(trip);
    setShowDescriptionModal(true);
  };
  const handleCloseDescriptionModal = () => {
    setShowDescriptionModal(false);
    setSelectedDescription("");
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

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
          description: "You must be logged in to create or edit a trip.",
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
        payload.registrationDeadline = new Date(
          formData.registrationDeadline
        ).toISOString();
      }

      // numeric conversions
      if (payload.price !== "") payload.price = Number(payload.price);
      if (payload.capacity !== "") payload.capacity = Number(payload.capacity);

      // Add restricted roles
      // When editing, always send restrictedRoles (even if empty) to clear restrictions
      // When creating, only send if there are restrictions
      if (editingId) {
        payload.restrictedRoles = restrictedRoles;
      } else if (restrictedRoles.length > 0) {
        payload.restrictedRoles = restrictedRoles;
      }

      // POST/PATCH paths are under /api/events/
      const url = editingId
        ? `${apiBase}/api/events/edit/trips/${editingId}`
        : `${apiBase}/api/events/createtrips`;
      const method = editingId ? "PATCH" : "POST";

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
        const isEdit = Boolean(editingId);
        toast({
          title: isEdit ? "Trip updated" : "Trip created",
          description: isEdit
            ? "The trip was updated successfully."
            : "The trip was created successfully.",
        });
        await fetchTrips();
        handleCloseModal();
      } else {
        // more verbose error output to help debugging
        console.error("Submit failed:", response.status, json);
        const msg =
          json?.message ?? json?.error ?? `Server returned ${response.status}`;
        toast({
          title: "Failed to save trip",
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
    }
  };

  const filterTrips = () => {
    const now = new Date();
    if (activeTab === "upcoming") {
      return trips.filter((trip) => {
        try {
          return new Date(trip.startDate) > now;
        } catch {
          return false;
        }
      });
    } else {
      return trips.filter((trip) => {
        try {
          return new Date(trip.startDate) <= now;
        } catch {
          return false;
        }
      });
    }
  };

  const filteredTrips = filterTrips();

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Trip Management</h1>
          <p className="text-muted-foreground">
            Organize and manage trips for university students and staff
          </p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="mb-6"
          data-testid="button-create-trip"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Trip
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>All Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6 border-b">
              <Button
                variant="ghost"
                className={`pb-2 px-4 font-medium transition-colors ${
                  activeTab === "upcoming"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("upcoming")}
              >
                Upcoming
              </Button>
              <Button
                variant="ghost"
                className={`pb-2 px-4 font-medium transition-colors ${
                  activeTab === "past"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("past")}
              >
                Past
              </Button>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-8">
                Loading trips...
              </p>
            ) : filteredTrips.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No {activeTab} trips found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Location
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Start Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Price (EGP)
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Capacity
                      </th>

                      {activeTab === "upcoming" && (
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Actions
                        </th>
                      )}
                      {activeTab === "past" && (
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                          Description
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map((trip) => (
                      <tr
                        key={trip._id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">{trip.name}</td>
                        <td className="py-3 px-4">{trip.location}</td>
                        <td className="py-3 px-4">
                          {trip.startDate
                            ? new Date(trip.startDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3 px-4">{trip.price ?? "—"}</td>
                        <td className="py-3 px-4">{trip.capacity ?? "—"}</td>
                        <td className="py-3 px-4 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDescriptionModal(trip)}
                            data-testid={`button-info-trip-${trip._id}`}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                          {activeTab === "upcoming" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(trip)}
                              data-testid={`button-edit-trip-${trip._id}`}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>{editingId ? "Edit Trip" : "Create Trip"}</CardTitle>
              <Button
                variant="ghost"
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
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
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        className="pl-10"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
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
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="deadline"
                        type="date"
                        className="pl-10"
                        value={formData.registrationDeadline}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            registrationDeadline: e.target.value,
                          })
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
                        Select which roles should NOT be able to view or
                        register for this trip
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
                                : restrictedRoles.filter(
                                    (r) => r !== role.value
                                  )
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
                  <Button variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-submit-trip">
                    {editingId ? "Update Trip" : "Create Trip"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Trip Details</CardTitle>
              <Button
                variant="ghost"
                onClick={handleCloseDescriptionModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Name:</strong> {selectedTrip?.name}
                </p>
                <p>
                  <strong>Location:</strong> {selectedTrip?.location}
                </p>
                <p>
                  <strong>Price:</strong> {selectedTrip?.price} EGP
                </p>
                <p>
                  <strong>Capacity:</strong> {selectedTrip?.capacity}
                </p>
                <p>
                  <strong>Start:</strong>{" "}
                  {selectedTrip?.startDate
                    ? new Date(selectedTrip.startDate).toLocaleString()
                    : "—"}
                </p>
                <p>
                  <strong>End:</strong>{" "}
                  {selectedTrip?.endDate
                    ? new Date(selectedTrip.endDate).toLocaleString()
                    : "—"}
                </p>
                <p>
                  <strong>Registration Deadline:</strong>{" "}
                  {selectedTrip?.registrationDeadline
                    ? new Date(
                        selectedTrip.registrationDeadline
                      ).toLocaleDateString()
                    : "—"}
                </p>
                <p>
                  <strong>Description:</strong>
                </p>
                <p className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                  {selectedTrip?.description || "No description"}
                </p>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={handleCloseDescriptionModal}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
