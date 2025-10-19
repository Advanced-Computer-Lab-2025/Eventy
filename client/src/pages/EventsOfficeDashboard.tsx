import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Clock, Plus, Calendar, Edit, Search, AlertCircle, X, ClipboardList, Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatCard from "@/components/StatCard";
import BazaarList from "@/components/BazaarList";
import EventSearch from "@/components/EventSearch";
import EventCard from "@/components/EventCard";
import EventDetailsDialog from "@/components/EventsDetailsDialog";
import CreateGymSessionDialog from "@/components/CreateGymSessionDialog";
import { getEventImage } from "@/lib/eventImages";

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
  const [bazaars, setBazaars] = useState<Bazaar[]>([]);
  const [loadingBazaars, setLoadingBazaars] = useState(true);
  const [conferences, setConferences] = useState<any[]>([]);
  const [loadingConfs, setLoadingConfs] = useState(true);
  const [confSearch, setConfSearch] = useState("");
  const [filteredConfs, setFilteredConfs] = useState<any[]>([]);
  const [pendingWorkshops, setPendingWorkshops] = useState(0);
  const [showWorkshopNotif, setShowWorkshopNotif] = useState(false);
  const [reminderTime, setReminderTime] = useState<NodeJS.Timeout | null>(null);
  const existingRef = useRef<HTMLDivElement | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<
    'all' | 'bazaar' | 'trip' | 'workshop' | 'conference' | 'platform_booth'
  >('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isCreateGymDialogOpen, setIsCreateGymDialogOpen] = useState(false);

  const handleCardClick = async (eventId: string) => {
    setDetailsLoading(true);
    setDialogOpen(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch event details");
      const data = await res.json();
      setSelectedEvent(data.data);
    } catch (err) {
      setSelectedEvent(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchBazaars = async () => {
    try {
      setLoadingBazaars(true);
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
      setBazaars([]);
    } finally {
      setLoadingBazaars(false);
    }
  };

  const fetchPendingWorkshops = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/allworkshops`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        const workshops = Array.isArray(data.data) ? data.data : data;
        const pendingCount = workshops.filter((w: any) => w.status === "pending").length;
        setPendingWorkshops(pendingCount);
        if (pendingCount > 0) {
          setShowWorkshopNotif(true);
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch pending workshops");
    }
  };

  const handleReminderLater = () => {
    setShowWorkshopNotif(false);
    // Remind after 5 minutes
    const timeout = setTimeout(() => {
      setShowWorkshopNotif(true);
    }, 5 * 60 * 1000);
    setReminderTime(timeout);
  };

  const handleCloseNotif = () => {
    setShowWorkshopNotif(false);
    if (reminderTime) clearTimeout(reminderTime);
  };

  useEffect(() => {
    fetchBazaars();
    fetchPendingWorkshops();

    const fetchConferences = async () => {
      try {
        setLoadingConfs(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/events/admin/conferences`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch conferences");
        setConferences(Array.isArray(data.data) ? data.data : data);
      } catch (e) {
        setConferences([]);
      } finally {
        setLoadingConfs(false);
      }
    };
    fetchConferences();

    return () => {
      if (reminderTime) clearTimeout(reminderTime);
    };
  }, []);

  // Filter conferences when search changes
  useEffect(() => {
    let filtered = conferences;
    if (confSearch) {
      const q = confSearch.toLowerCase();
      filtered = conferences.filter((c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    }
    setFilteredConfs(filtered);
  }, [conferences, confSearch]);

  // Prepare bazaars for BazaarList component (adds required fields and sane defaults)
  const formattedBazaars = bazaars.map((b) => ({
    _id: b._id,
    name: b.name,
    description: b.description,
    location: b.location,
    startDate: b.startDate,
    endDate: b.endDate,
    registrationDeadline: b.registrationDeadline || b.endDate,
    status: ((b.status || "approved") as any),
    attendees: undefined,
    capacity: undefined,
    bannerImage: undefined,
    eventType: "bazaar" as const,
    createdBy: "",
  }));

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Title and Info Section */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold mb-2">Events Office Dashboard</h1>
            <p className="text-muted-foreground">
              Create and manage bazaars, conferences, trips, and workshop approvals all in one place.
            </p>
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <StatCard
                title="Total Bazaars"
                value={loadingBazaars ? "-" : bazaars.length}
                icon={CalendarDays}
                themed
              />
              <StatCard
                title="Total Events"
                value={(loadingBazaars || loadingConfs) ? "-" : (bazaars.length + conferences.length)}
                icon={Clock}
                themed
              />
              <StatCard
                title="Total Conferences"
                value={loadingConfs ? "-" : conferences.length}
                icon={CheckCircle2}
                themed
              />
            </div>

          </div>

          {/* Action Buttons Card */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow hover:opacity-90"
                  onClick={() => setLocation("/create/bazaar")}
                  data-testid="button-header-create-bazaar"
                >
                  <Plus className="h-4 w-4" />
                  Create Bazaar
                </button>
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow hover:opacity-90"
                  onClick={() => setLocation("/events-office/create/conference")}
                >
                  <Plus className="h-4 w-4" />
                  Create Conference
                </button>
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow hover:opacity-90"
                  onClick={() => setLocation("/create/trip")}
                >
                  <Plus className="h-4 w-4" />
                  Create Trip
                </button>
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow hover:opacity-90"
                  onClick={() => setIsCreateGymDialogOpen(true)}
                >
                  <Dumbbell className="h-4 w-4" />
                  Create Gym Session
                </button>
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow hover:opacity-90"
                  onClick={() => setLocation("/approvals/workshops")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Workshop Approvals
                </button>
                <button
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium shadow hover:opacity-90"
                  onClick={() => setLocation("/vendor-requests")}
                  data-testid="button-quick-vendor-requests"
                >
                  <ClipboardList className="h-4 w-4" />
                  Vendor Requests
                </button>
              </CardContent>
            </Card>
            {/* Sidebar kept for Quick Actions only */}
          </div>
          </div>
        </div>

        {/* Workshop Pending Notification */}
        {showWorkshopNotif && pendingWorkshops > 0 && (
          <Card className="mb-8 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-2">Pending Workshops</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                    You have <span className="font-semibold">{pendingWorkshops}</span> workshop{pendingWorkshops !== 1 ? "s" : ""} awaiting approval.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => {
                        handleCloseNotif();
                        setLocation("/approvals/workshops");
                      }}
                      className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                    >
                      Review Approvals
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReminderLater}
                    >
                      Remind Later
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleCloseNotif}
                  className="flex-shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6" ref={existingRef as any}>
          {/* Upcoming Events (same width as Existing Bazaars) */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'bazaar', label: 'Bazaars' },
                  { key: 'trip', label: 'Trips' },
                  { key: 'workshop', label: 'Workshops' },
                  { key: 'conference', label: 'Conferences' },
                  { key: 'platform_booth', label: 'Platform Booths' },
                ].map((opt) => (
                  <Button
                    key={opt.key}
                    size="sm"
                    variant={eventTypeFilter === (opt.key as any) ? 'default' : 'outline'}
                    onClick={() => setEventTypeFilter(opt.key as any)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <EventSearch
                onSearchResults={(results) => setUpcomingEvents(results)}
                onLoading={(isLoading) => setUpcomingLoading(isLoading)}
                onError={(msg) => setUpcomingError(msg)}
                placeholder="Search events by name, professor, or type..."
              />
              {upcomingLoading ? (
                <p>Loading events...</p>
              ) : upcomingError ? (
                <p className="text-red-500">{upcomingError}</p>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No upcoming events found</p>
                  <p className="text-sm">Events will appear here as they are created</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {upcomingEvents
                    .filter((event: any) => eventTypeFilter === 'all' ? true : event.eventType === eventTypeFilter)
                    .filter((event: any) => !event?.deletedAt)
                    .slice(0, 8)
                    .map((event: any, index: number) => (
                    <EventCard
                      key={event._id || index}
                      id={event._id || String(index)}
                      title={event.name || "Untitled Event"}
                      category={(event.eventType || "academic") as any}
                      date={event.startDate
                        ? new Date(event.startDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBA"}
                      time={event.startDate
                        ? new Date(event.startDate).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "TBA"}
                      location={event.location || "Unknown location"}
                      attendees={event.attendeesCount || 0}
                      image={event.bannerImage || event.image || getEventImage(event.eventType, event.name)}
                      description={event.description}
                      startDate={event.startDate}
                      endDate={event.endDate}
                      capacity={-1}
                      vendors={event.vendors || []}
                      showDetailedView={true}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <EventDetailsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedEvent(null);
        }}
        event={selectedEvent}
        loading={detailsLoading}
      />
      <CreateGymSessionDialog
        open={isCreateGymDialogOpen}
        onOpenChange={setIsCreateGymDialogOpen}
        onSuccess={(createdDate) => {
          console.log("Gym session created for:", createdDate);
          // Optionally navigate to sports facilities page
          // setLocation("/sports");
        }}
      />
    </div>
  );
}