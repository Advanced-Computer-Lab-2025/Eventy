import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Calendar,
  Edit,
  Search,
  AlertCircle,
  X,
  ClipboardList,
  Dumbbell,
  Store,
  Plane,
  Archive,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import StatCard from "@/components/StatCard";
import BazaarList from "@/components/BazaarList";
import EventSearch from "@/components/EventSearch";
import EventCard from "@/components/EventCard";
import EventDetailsDialog from "@/components/EventsDetailsDialog";
import CreateGymSessionDialog from "@/components/CreateGymSessionDialog";
import { getEventImage } from "@/lib/eventImages";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
  const { toast } = useToast();
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isCreateGymDialogOpen, setIsCreateGymDialogOpen] = useState(false);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);

  // Past events states
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [pastEventsLoading, setPastEventsLoading] = useState(false);
  const [pastEventsError, setPastEventsError] = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [pastEventSearch, setPastEventSearch] = useState("");

  // Combined filter states
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showPast, setShowPast] = useState(true);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([
    "bazaar",
    "trip",
    "workshop",
    "conference",
    "platform_booth",
  ]);
  const [eventSearch, setEventSearch] = useState("");
  const [displayLimit, setDisplayLimit] = useState(12);

  // Extra totals
  const [totalTrips, setTotalTrips] = useState<number | null>(null);
  const [totalWorkshops, setTotalWorkshops] = useState<number | null>(null);
  const [totalBooths, setTotalBooths] = useState<number | null>(null);

  // Combined filtered events
  const allEvents = [...upcomingEvents, ...pastEvents];
  const filteredEvents = allEvents.filter((event: any) => {
    const q = eventSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (event.name || "").toLowerCase().includes(q) ||
      (event.eventType || "").toLowerCase().includes(q) ||
      (event.location || "").toLowerCase().includes(q);

    const matchesType = selectedEventTypes.includes(event.eventType);

    const now = new Date();
    const eventEndDate = new Date(event.endDate);
    eventEndDate.setUTCHours(23, 59, 59, 999);
    const isUpcoming = eventEndDate.getTime() >= now.getTime();
    const isPast = eventEndDate.getTime() < now.getTime();

    const matchesTimeFilter =
      (showUpcoming && isUpcoming) || (showPast && isPast);

    return matchesSearch && matchesType && matchesTimeFilter;
  });

  const toggleEventType = (type: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setShowUpcoming(false);
    setShowPast(false);
    setSelectedEventTypes([]);
    setEventSearch("");
    setDisplayLimit(12);
  };

  const handleShowMore = () => {
    setDisplayLimit((prev) => prev + 12);
  };

  const filteredPastEvents = pastEvents.filter((event: any) => {
    const q = pastEventSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (event.name || "").toLowerCase().includes(q) ||
      (event.eventType || "").toLowerCase().includes(q) ||
      (event.location || "").toLowerCase().includes(q)
    );
  });

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
        const pendingCount = workshops.filter(
          (w: any) => w.status === "pending"
        ).length;
        setPendingWorkshops(pendingCount);
        setTotalWorkshops(Array.isArray(workshops) ? workshops.length : 0);
        if (pendingCount > 0) {
          setShowWorkshopNotif(true);
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch pending workshops");
    }
  };

  const fetchCountByType = async (type: "trip" | "platform_booth") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/events/search?type=${type}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch events");
      const items = Array.isArray(data.data) ? data.data : [];
      if (type === "trip") setTotalTrips(items.length);
      if (type === "platform_booth") setTotalBooths(items.length);
    } catch (e) {
      if (type === "trip") setTotalTrips(0);
      if (type === "platform_booth") setTotalBooths(0);
    }
  };

  const handleReminderLater = () => {
    setShowWorkshopNotif(false);
    // Remind after 5 minutes
    const timeout = setTimeout(
      () => {
        setShowWorkshopNotif(true);
      },
      5 * 60 * 1000
    );
    setReminderTime(timeout);
  };

  const handleCloseNotif = () => {
    setShowWorkshopNotif(false);
    if (reminderTime) clearTimeout(reminderTime);
  };

  const handleArchiveEvent = async (eventId: string) => {
    try {
      setArchivingId(eventId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to archive event");
      }

      // Remove the archived event from the past events list
      setPastEvents((prevEvents) =>
        prevEvents.filter((e) => e._id !== eventId)
      );

      toast({
        title: "Event archived",
        description: "The event has been successfully archived.",
      });
    } catch (err: any) {
      console.error("Error archiving event:", err);
      toast({
        title: "Failed to archive event",
        description:
          err.message || "An error occurred while archiving the event.",
        variant: "destructive",
      });
    } finally {
      setArchivingId(null);
    }
  };

  const fetchPastEvents = async () => {
    setPastEventsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/past`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch past events");
      }
      const data = await res.json();
      // Only keep non-archived events
      const items = Array.isArray(data.data) ? data.data : [];
      setPastEvents(items.filter((e: any) => e.status !== "archived"));
    } catch (err: any) {
      setPastEventsError(err.message || "Failed to fetch past events");
      setPastEvents([]);
    } finally {
      setPastEventsLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    setUpcomingLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/upcoming`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch upcoming events");
      }
      const data = await res.json();
      setUpcomingEvents(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setUpcomingError(err.message || "Failed to fetch upcoming events");
      setUpcomingEvents([]);
    } finally {
      setUpcomingLoading(false);
    }
  };

  useEffect(() => {
    fetchBazaars();
    fetchPendingWorkshops();
    fetchPastEvents();
    fetchUpcomingEvents();
    fetchCountByType("trip");
    fetchCountByType("platform_booth");
    const fetchConferences = async () => {
      try {
        setLoadingConfs(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/api/events/admin/conferences`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch conferences");
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
      filtered = conferences.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q)
      );
    }
    setFilteredConfs(filtered);
  }, [conferences, confSearch]);

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(12);
  }, [showUpcoming, showPast, selectedEventTypes, eventSearch]);

  // Prepare bazaars for BazaarList component (adds required fields and sane defaults)
  const formattedBazaars = bazaars.map((b) => ({
    _id: b._id,
    name: b.name,
    description: b.description,
    location: b.location,
    startDate: b.startDate,
    endDate: b.endDate,
    registrationDeadline: b.registrationDeadline || b.endDate,
    status: (b.status || "approved") as any,
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Events Office Dashboard</h1>
          <p className="text-muted-foreground">
            Create and manage bazaars, conferences, trips, and workshop
            approvals all in one place.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Left: Stats in two rows */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Total Bazaars"
                  value={loadingBazaars ? "-" : bazaars.length}
                  icon={CalendarDays}
                  themed
                />
                <StatCard
                  title="Total Events"
                  value={
                    loadingBazaars || loadingConfs
                      ? "-"
                      : bazaars.length + conferences.length
                  }
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <StatCard
                  title="Total Trips"
                  value={totalTrips == null ? "-" : totalTrips}
                  icon={Calendar}
                  themed
                />
                <StatCard
                  title="Total Workshops"
                  value={totalWorkshops == null ? "-" : totalWorkshops}
                  icon={ClipboardList}
                  themed
                />
                <StatCard
                  title="Total Booths"
                  value={totalBooths == null ? "-" : totalBooths}
                  icon={Archive}
                  themed
                />
              </div>
            </div>
            {/* Right: Quick Actions Card */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader className="flex justify-center">
                  <CardTitle className="text-center">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-3">
                    <>
                      <Button
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white whitespace-normal px-3 py-2 w-44 sm:w-48 flex items-center justify-center gap-2"
                        onClick={() => setIsCreateEventDialogOpen(true)}
                        data-testid="button-header-create-event"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-xs sm:text-sm leading-tight text-center">
                          Create Event
                        </span>
                      </Button>
                      <Dialog
                        open={isCreateEventDialogOpen}
                        onOpenChange={setIsCreateEventDialogOpen}
                      >
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Create an event</DialogTitle>
                            <DialogDescription>
                              Choose which type of event to create
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid gap-2 mt-4">
                            <Button
                              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center justify-center gap-2"
                              onClick={() => {
                                setIsCreateEventDialogOpen(false);
                                setLocation("/create/bazaar");
                              }}
                            >
                              <Store className="h-4 w-4" />
                              <span>Create Bazaar</span>
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center justify-center gap-2"
                              onClick={() => {
                                setIsCreateEventDialogOpen(false);
                                setIsCreateGymDialogOpen(true);
                              }}
                            >
                              <Dumbbell className="h-4 w-4" />
                              <span>Create Gym Session</span>
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center justify-center gap-2"
                              onClick={() => {
                                setIsCreateEventDialogOpen(false);
                                setLocation("/events-office/create/conference");
                              }}
                            >
                              <CalendarDays className="h-4 w-4" />
                              <span>Create Conference</span>
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center justify-center gap-2"
                              onClick={() => {
                                setIsCreateEventDialogOpen(false);
                                setLocation("/create/trip");
                              }}
                            >
                              <Plane className="h-4 w-4" />
                              <span>Create Trip</span>
                            </Button>
                          </div>

                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsCreateEventDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                    {/* Create Gym Session moved into Create Event dialog */}
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white whitespace-normal px-3 py-2 w-44 sm:w-48 flex items-center justify-center gap-2"
                      onClick={() => setLocation("/approvals/workshops")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs sm:text-sm leading-tight">
                        Workshop Approvals
                      </span>
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white whitespace-normal px-3 py-2 w-44 sm:w-48 flex items-center justify-center gap-2"
                      onClick={() => setLocation("/vendor-requests")}
                      data-testid="button-quick-vendor-requests"
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span className="text-xs sm:text-sm leading-tight">
                        Vendor Requests
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                  <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-2">
                    Pending Workshops
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                    You have{" "}
                    <span className="font-semibold">{pendingWorkshops}</span>{" "}
                    workshop{pendingWorkshops !== 1 ? "s" : ""} awaiting
                    approval.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => {
                        handleCloseNotif();
                        setLocation("/approvals/workshops");
                      }}
                      className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 border-amber-600 hover:border-amber-700 dark:border-amber-700 dark:hover:border-amber-600"
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
          {/* Combined Events with Sidebar Filters */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Filters */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <SlidersHorizontal className="h-5 w-5" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Time Period Filter */}
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Time Period</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="filter-upcoming"
                            checked={showUpcoming}
                            onCheckedChange={(checked) =>
                              setShowUpcoming(checked as boolean)
                            }
                          />
                          <Label
                            htmlFor="filter-upcoming"
                            className="cursor-pointer text-sm"
                          >
                            Upcoming Events
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="filter-past"
                            checked={showPast}
                            onCheckedChange={(checked) =>
                              setShowPast(checked as boolean)
                            }
                          />
                          <Label
                            htmlFor="filter-past"
                            className="cursor-pointer text-sm"
                          >
                            Past Events
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Event Type Filter */}
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Event Type</div>
                      <div className="space-y-2">
                        {[
                          { value: "bazaar", label: "Bazaars" },
                          { value: "trip", label: "Trips" },
                          { value: "workshop", label: "Workshops" },
                          { value: "conference", label: "Conferences" },
                          { value: "platform_booth", label: "Platform Booths" },
                        ].map((type) => (
                          <div
                            key={type.value}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`filter-${type.value}`}
                              checked={selectedEventTypes.includes(type.value)}
                              onCheckedChange={() =>
                                toggleEventType(type.value)
                              }
                            />
                            <Label
                              htmlFor={`filter-${type.value}`}
                              className="cursor-pointer text-sm"
                            >
                              {type.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        handleClearFilters();
                      }}
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Right Content - Events */}
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>All Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search events by name, type, or location..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {/* Events Display */}
                  {upcomingLoading || pastEventsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading events...</p>
                    </div>
                  ) : upcomingError || pastEventsError ? (
                    <p className="text-red-500 text-center py-8">
                      {upcomingError || pastEventsError}
                    </p>
                  ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        No events found
                      </p>
                      <p className="text-sm">
                        Try adjusting your filters or search criteria
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredEvents
                        .filter((event: any) => !event?.deletedAt)
                        .slice(0, displayLimit)
                        .map((event: any, index: number) => {
                          const now = new Date();
                          const eventEndDate = new Date(event.endDate);
                          eventEndDate.setUTCHours(23, 59, 59, 999);
                          const isPastEvent =
                            eventEndDate.getTime() < now.getTime();

                          return (
                            <div key={event._id || index} className="h-full">
                              <EventCard
                                className="h-full flex flex-col"
                                id={event._id || String(index)}
                                title={event.name || "Untitled Event"}
                                category={
                                  (event.eventType || "academic") as any
                                }
                                date={
                                  event.startDate
                                    ? new Date(
                                        event.startDate
                                      ).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "TBA"
                                }
                                time={
                                  event.startDate
                                    ? new Date(
                                        event.startDate
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })
                                    : "TBA"
                                }
                                location={event.location || "Unknown location"}
                                attendees={
                                  Array.isArray(event.attendees)
                                    ? event.attendees.length
                                    : event.attendeesCount || 0
                                }
                                image={
                                  event.bannerImage ||
                                  event.image ||
                                  getEventImage(event.eventType, event.name)
                                }
                                description={event.description}
                                startDate={event.startDate}
                                endDate={event.endDate}
                                capacity={-1}
                                vendors={event.vendors || []}
                                showDetailedView={true}
                                canDelete={false}
                                {...(isPastEvent && {
                                  onArchive: () =>
                                    handleArchiveEvent(event._id),
                                  isArchiving: archivingId === event._id,
                                })}
                              />
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Show More Button */}
                  {!upcomingLoading &&
                    !pastEventsLoading &&
                    filteredEvents.filter((event: any) => !event?.deletedAt)
                      .length > displayLimit && (
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={handleShowMore}
                          variant="outline"
                          size="lg"
                        >
                          Show More Events (
                          {filteredEvents.filter(
                            (event: any) => !event?.deletedAt
                          ).length - displayLimit}{" "}
                          remaining)
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Existing Bazaars */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Bazaars</CardTitle>
            </CardHeader>
            <CardContent>
              <BazaarList
                bazaars={formattedBazaars}
                showFilters={true}
                onEdit={(id: string) => setLocation(`/create/bazaar?id=${id}`)}
              />
            </CardContent>
          </Card>

          {/* Conferences */}
          <Card>
            <CardHeader>
              <CardTitle>Conferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search conferences..."
                  value={confSearch}
                  onChange={(e) => setConfSearch(e.target.value)}
                />
              </div>
              {loadingConfs ? (
                <p>Loading conferences...</p>
              ) : filteredConfs.length === 0 ? (
                <p className="text-muted-foreground">No conferences found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredConfs.map((c: any) => (
                    <div
                      key={c._id}
                      className="border rounded-lg p-4 flex flex-col gap-2"
                    >
                      <div className="font-semibold line-clamp-2">
                        {c.name || "Untitled Conference"}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {c.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.startDate
                          ? new Date(c.startDate).toLocaleString()
                          : "TBA"}
                        {c.endDate
                          ? ` - ${new Date(c.endDate).toLocaleString()}`
                          : ""}
                      </div>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            setLocation(
                              `/events-office/events/conference/edit/${c._id}`
                            )
                          }
                          className="w-full justify-center"
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                      </div>
                    </div>
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
