import { useState, useEffect } from "react";
import { Edit2, Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function TripManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

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

  const handleCreateTrip = () => {
    setLocation("/events-office/create/trip");
  };

  const handleOpenDescriptionModal = (trip: any) => {
    setSelectedTrip(trip);
    setShowDescriptionModal(true);
  };

  const handleCloseDescriptionModal = () => {
    setShowDescriptionModal(false);
    setSelectedTrip(null);
  };

  const handleEditTrip = (tripId: string) => {
    // Check if trip has already started before navigating
    const trip = trips.find((t) => t._id === tripId);
    if (trip && trip.startDate) {
      const now = new Date();
      const tripStartDate = new Date(trip.startDate);
      if (tripStartDate <= now) {
        toast({
          title: "Cannot Edit Trip",
          description: "Cannot edit a trip that has already started.",
          variant: "destructive",
        });
        return;
      }
    }
    setLocation(`/events-office/events/trip/edit/${tripId}`);
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Trip Management</h1>
            <Button
              onClick={handleCreateTrip}
              data-testid="button-create-trip"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 text-xs sm:text-sm font-semibold rounded-md shadow-sm whitespace-nowrap"
            >
              <Plus className="mr-1 h-4 w-4" />
              Create Trip
            </Button>
          </div>
          <p className="text-muted-foreground">
            Organize and manage trips for university students and staff
          </p>
        </div>

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
                              onClick={() => handleEditTrip(trip._id)}
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
