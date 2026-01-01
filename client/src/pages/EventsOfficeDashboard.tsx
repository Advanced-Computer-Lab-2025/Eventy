import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  CheckCircle2,
  Plus,
  AlertCircle,
  X,
  ClipboardList,
  Dumbbell,
  Store,
  Plane,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
import EventSort from "@/components/EventSort";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";
import EventDetailsDialog from "@/components/EventsDetailsDialog";
import EventFilters, { EventFilterState } from "@/components/EventFilters";
import CreateGymSessionDialog from "@/components/CreateGymSessionDialog";
import { getEventImage } from "@/lib/eventImages";
import { useToast } from "@/hooks/use-toast";
import RestrictAccessDialog from "@/components/RestrictAccessDialog";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

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
  const [userRole, setUserRole] = useState<string>("");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [isCreateGymDialogOpen, setIsCreateGymDialogOpen] = useState(false);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [restrictAccessDialogOpen, setRestrictAccessDialogOpen] =
    useState(false);
  const [selectedEventForRestrict, setSelectedEventForRestrict] =
    useState<any>(null);

  // Past events states
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [pastEventsLoading, setPastEventsLoading] = useState(false);
  const [pastEventsError, setPastEventsError] = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [pastEventSearch, setPastEventSearch] = useState("");

  // Combined filter states
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([
    "bazaar",
    "trip",
    "workshop",
    "conference",
    "platform_booth",
  ]);
  const [eventSearch, setEventSearch] = useState("");
  const [displayLimit, setDisplayLimit] = useState(12);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [professorOptions, setProfessorOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [filters, setFilters] = useState<EventFilterState>({
    eventType: "all",
    location: "all",
    startDate: undefined,
    endDate: undefined,
    professor: "",
    showUpcoming: true,
    showPast: true,
  });

  // Extra totals
  const [totalTrips, setTotalTrips] = useState<number | null>(null);
  const [totalWorkshops, setTotalWorkshops] = useState<number | null>(null);
  const [totalBooths, setTotalBooths] = useState<number | null>(null);

  // Combined filtered events
  const combinedEvents = [...upcomingEvents, ...pastEvents].filter(
    (event) => event
  );
  const filteredEvents = combinedEvents.filter((event: any) => {
    const q = eventSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (event.name || "").toLowerCase().includes(q) ||
      (event.eventType || "").toLowerCase().includes(q) ||
      (event.location || "").toLowerCase().includes(q) ||
      (event.locationPreference || "").toLowerCase().includes(q);

    const matchesType =
      selectedEventTypes.includes(event.eventType) &&
      (filters.eventType === "all" || event.eventType === filters.eventType);

    const now = new Date();
    const isBoothEvent = event.eventType === "platform_booth";
    let isUpcoming = false;
    let isPast = false;

    if (isBoothEvent) {
      // Platform booths now have startDate and endDate
      // Check if both dates have passed
      if (event.startDate && event.endDate) {
        const eventStartDate = new Date(event.startDate);
        const eventEndDate = new Date(event.endDate);
        eventEndDate.setUTCHours(23, 59, 59, 999);
        // Both start and end dates must have passed for it to be past
        isPast =
          eventStartDate.getTime() < now.getTime() &&
          eventEndDate.getTime() < now.getTime();
        isUpcoming = !isPast;
      } else {
        // If booth doesn't have dates yet, consider it upcoming
        isUpcoming = true;
        isPast = false;
      }
    } else if (event.endDate) {
      const eventEndDate = new Date(event.endDate);
      eventEndDate.setUTCHours(23, 59, 59, 999);
      isUpcoming = eventEndDate.getTime() >= now.getTime();
      isPast = eventEndDate.getTime() < now.getTime();
    } else {
      // Events without endDate are considered upcoming
      isUpcoming = true;
      isPast = false;
    }

    const matchesTimeFilter =
      ((filters.showUpcoming ?? true) && isUpcoming) ||
      ((filters.showPast ?? true) && isPast);

    const matchesLocation =
      filters.location === "all" || event.location === filters.location;

    const eventStart = event.startDate ? new Date(event.startDate) : null;
    const eventEnd = event.endDate ? new Date(event.endDate) : null;
    const matchesDateRange =
      (!filters.startDate ||
        !eventStart ||
        eventStart >= new Date(filters.startDate)) &&
      (!filters.endDate || !eventEnd || eventEnd <= new Date(filters.endDate));

    // Professor filter: if a specific professor is selected, only include workshops/conferences with that professor
    if (filters.professor && filters.professor !== "") {
      if (event.eventType !== "workshop" && event.eventType !== "conference")
        return false;
      const profs = (event as any).professors || [];
      const profIds = profs.map((p: any) => String(p._id || p.id || p));
      if (!profIds.includes(String(filters.professor))) return false;
    }

    return (
      matchesSearch &&
      matchesType &&
      matchesTimeFilter &&
      matchesLocation &&
      matchesDateRange
    );
  });

  const toggleEventType = (type: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setSelectedEventTypes([
      "bazaar",
      "trip",
      "workshop",
      "conference",
      "platform_booth",
    ]);
    setEventSearch("");
    setDisplayLimit(12);
  };

  const handleShowMore = () => {
    setDisplayLimit((prev) => prev + 12);
  };
  // Chart data states
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);

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
      logger.error("Failed to fetch pending workshops");
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
      logger.error("Error archiving event:", err);
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

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      // 204 No Content is success
      if (res.status === 204) {
        // Remove the deleted event from the list
        setUpcomingEvents((prevEvents) =>
          prevEvents.filter((e) => e._id !== eventId)
        );
        setPastEvents((prevEvents) =>
          prevEvents.filter((e) => e._id !== eventId)
        );

        toast({
          title: "Event deleted",
          description: "The event has been successfully deleted.",
        });
        return;
      }

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          throw new Error(error.message || "Failed to delete event");
        }
        throw new Error("Failed to delete event");
      }

      // Remove the deleted event from the list
      setUpcomingEvents((prevEvents) =>
        prevEvents.filter((e) => e._id !== eventId)
      );
      setPastEvents((prevEvents) =>
        prevEvents.filter((e) => e._id !== eventId)
      );

      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to delete event",
        description:
          err.message || "An error occurred while deleting the event.",
        variant: "destructive",
      });
    }
  };

  const handleRestrictSuccess = async () => {
    // Refresh the events to show updated restrictions
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/events/upcoming`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUpcomingEvents(data.data || []);
      }
    } catch (err) {
      logger.error("Failed to refresh events", err);
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

  const fetchAllEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      // Use EventSearch component's approach - fetch all event types
      const [bazaarsRes, conferencesRes, tripsRes, workshopsRes, boothsRes] =
        await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/events/search?type=bazaar`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/api/events/admin/conferences`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/api/events/search?type=trip`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/api/events/allworkshops`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/api/events/search?type=platform_booth`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }),
        ]);

      const allEventsData: any[] = [];

      // Process bazaars
      if (bazaarsRes.status === "fulfilled" && bazaarsRes.value.ok) {
        const data = await bazaarsRes.value.json();
        if (Array.isArray(data.data)) {
          allEventsData.push(...data.data);
        }
      }

      // Process conferences
      if (conferencesRes.status === "fulfilled" && conferencesRes.value.ok) {
        const data = await conferencesRes.value.json();
        const confs = Array.isArray(data.data) ? data.data : data;
        allEventsData.push(...(Array.isArray(confs) ? confs : []));
      }

      // Process trips
      if (tripsRes.status === "fulfilled" && tripsRes.value.ok) {
        const data = await tripsRes.value.json();
        if (Array.isArray(data.data)) {
          allEventsData.push(...data.data);
        }
      }

      // Process workshops
      if (workshopsRes.status === "fulfilled" && workshopsRes.value.ok) {
        const data = await workshopsRes.value.json();
        const workshops = Array.isArray(data.data) ? data.data : data;
        allEventsData.push(...(Array.isArray(workshops) ? workshops : []));
      }

      // Process platform booths
      if (boothsRes.status === "fulfilled" && boothsRes.value.ok) {
        const data = await boothsRes.value.json();
        if (Array.isArray(data.data)) {
          allEventsData.push(...data.data);
        }
      }

      setAllEvents(allEventsData);
    } catch (e) {
      setAllEvents([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fetch all transactions (for events office/admin)
      const res = await fetch(`${API_BASE_URL}/api/transactions`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // Handle different response formats
        const transactionsData = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.transactions)
            ? data.transactions
            : Array.isArray(data)
              ? data
              : [];
        setTransactions(transactionsData);
      } else {
        const errorData = await res.json().catch(() => ({}));
        logger.error("Failed to fetch transactions:", res.status, errorData);
        setTransactions([]);
      }
    } catch (e) {
      logger.error("Error fetching transactions:", e);
      setTransactions([]);
    } finally {
      setLoadingCharts(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/applications/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data.data) ? data.data : []);
      } else {
        setApplications([]);
      }
    } catch (e) {
      setApplications([]);
    }
  };

  useEffect(() => {
    // Get user role from localStorage
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role || "");
    }

    fetchBazaars();
    fetchPendingWorkshops();
    fetchPastEvents();
    fetchUpcomingEvents();
    fetchCountByType("trip");
    fetchCountByType("platform_booth");
    fetchAllEvents();
    fetchTransactions();
    fetchApplications();
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

  // Fetch professors for dropdown
  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchProfessors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/professors`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return;
        const payload = await res.json();
        const list = payload?.data || payload || [];
        setProfessorOptions(
          (list || []).map((u: any) => ({
            id: u._id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          }))
        );
      } catch (err) {
        logger.error("Failed to fetch professors", err);
      }
    };
    fetchProfessors();
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
  }, [filters, selectedEventTypes, eventSearch]);

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

  // Calculate attendees by event type for pie chart
  // For bazaars and platform booths, count attendees from applications
  // For other event types, use attendees from the event itself
  const attendeesByType = allEvents.reduce(
    (acc, event) => {
      const type = event.eventType || "other";
      // For bazaars and booths, we'll calculate from applications separately
      if (type === "bazaar" || type === "platform_booth") {
        return acc; // Skip these here, we'll add them from applications
      }
      const attendeeCount = Array.isArray(event.attendees)
        ? event.attendees.length
        : event.attendeesCount || 0;
      acc[type] = (acc[type] || 0) + attendeeCount;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate attendees for bazaars and platform booths from applications
  const bazaarAttendees = applications
    .filter((app) => app.type === "bazaar" && app.status === "approved")
    .reduce((total, app) => {
      const attendeeCount = Array.isArray(app.attendees)
        ? app.attendees.length
        : 0;
      return total + attendeeCount;
    }, 0);

  const boothAttendees = applications
    .filter((app) => app.type === "booth" && app.status === "approved")
    .reduce((total, app) => {
      const attendeeCount = Array.isArray(app.attendees)
        ? app.attendees.length
        : 0;
      return total + attendeeCount;
    }, 0);

  // Add bazaar and booth attendees to the totals
  attendeesByType.bazaar = (attendeesByType.bazaar || 0) + bazaarAttendees;
  attendeesByType.platform_booth =
    (attendeesByType.platform_booth || 0) + boothAttendees;

  const attendeesChartData = [
    {
      name: "Bazaar",
      value: attendeesByType.bazaar || 0,
      color: "#3b82f6", // blue
    },
    {
      name: "Conference",
      value: attendeesByType.conference || 0,
      color: "#22c55e", // green
    },
    {
      name: "Trip",
      value: attendeesByType.trip || 0,
      color: "#f97316", // orange
    },
    {
      name: "Platform Booth",
      value: attendeesByType.platform_booth || 0,
      color: "#8b5cf6", // purple
    },
    {
      name: "Workshop",
      value: attendeesByType.workshop || 0,
      color: "#eab308", // yellow
    },
  ].filter((item) => item.value > 0);

  // Calculate revenue by month for bar chart
  // Only use transactions from the transactions table (payment type, completed status)
  const revenueByMonth = transactions
    .filter((t) => {
      if (!t || t.type !== "payment" || t.status !== "completed") return false;
      if (!t.createdAt) return false;
      const date = new Date(t.createdAt);
      return !isNaN(date.getTime()); // Validate date
    })
    .reduce(
      (acc, transaction) => {
        try {
          const date = new Date(transaction.createdAt);
          if (isNaN(date.getTime())) return acc; // Skip invalid dates
          const monthKey = date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          const amount = Number(transaction.amount) || 0;
          acc[monthKey] = (acc[monthKey] || 0) + amount;
        } catch (e) {
          // Skip transactions with invalid dates
          logger.error("Error processing transaction date:", e);
        }
        return acc;
      },
      {} as Record<string, number>
    );

  // Get last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    months.push({
      name: monthKey,
      revenue: Number(revenueByMonth[monthKey] || 0),
    });
  }

  const revenueChartData = months;

  // Purple and pink colors like vendor dashboard
  const barColors = ["#8b5cf6", "#ec4899"]; // purple-500, pink-500

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
            {/* Left: Charts */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendees by Event Type Pie Chart */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">
                      Total Attendees by Event Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pl-6 pr-6">
                    {loadingCharts ? (
                      <div className="h-[280px] flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : attendeesChartData.length === 0 ? (
                      <div className="h-[280px] flex items-center justify-center">
                        <p className="text-muted-foreground">
                          No data available
                        </p>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={attendeesChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              label={({
                                name,
                                value,
                                cx,
                                cy,
                                midAngle,
                                outerRadius,
                              }) => {
                                if (value === 0) return null;
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 25;
                                const x =
                                  cx + radius * Math.cos(-midAngle * RADIAN);
                                const y =
                                  cy + radius * Math.sin(-midAngle * RADIAN);
                                const segmentData = attendeesChartData.find(
                                  (item) => item.name === name
                                );
                                const labelColor = segmentData?.color || "#333";
                                // Show "Booth" instead of "Platform Booth" on chart label
                                const displayName =
                                  name === "Platform Booth" ? "Booth" : name;
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill={labelColor}
                                    textAnchor={x > cx ? "start" : "end"}
                                    dominantBaseline="central"
                                    fontSize="11"
                                  >
                                    {`${displayName}: ${value}`}
                                  </text>
                                );
                              }}
                              labelLine={(props: any) => {
                                if (props.value === 0) return <g />;
                                const { points } = props;
                                return (
                                  <path
                                    d={`M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`}
                                    stroke="#666"
                                    strokeWidth={1}
                                    fill="none"
                                  />
                                );
                              }}
                            >
                              {attendeesChartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  stroke="none"
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string) => [
                                Math.floor(value),
                                name,
                              ]}
                              contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                color: "hsl(var(--foreground))",
                              }}
                              itemStyle={{ color: "hsl(var(--foreground))" }}
                              labelStyle={{ display: "none" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex justify-center">
                          <div className="flex flex-col gap-3 text-sm">
                            {/* Row 1: Conference, Trip */}
                            <div className="flex justify-center gap-6">
                              {attendeesChartData
                                .filter(
                                  (item) =>
                                    item.name === "Conference" ||
                                    item.name === "Trip"
                                )
                                .sort((a, b) => {
                                  const order = ["Conference", "Trip"];
                                  return (
                                    order.indexOf(a.name) -
                                    order.indexOf(b.name)
                                  );
                                })
                                .map((item) => (
                                  <div
                                    key={item.name}
                                    className="flex items-center gap-2"
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-muted-foreground font-medium">
                                      {item.name}
                                    </span>
                                  </div>
                                ))}
                            </div>
                            {/* Row 2: Bazaar, Platform Booth, Workshop */}
                            <div className="flex justify-center gap-6">
                              {attendeesChartData
                                .filter(
                                  (item) =>
                                    item.name === "Bazaar" ||
                                    item.name === "Platform Booth" ||
                                    item.name === "Workshop"
                                )
                                .sort((a, b) => {
                                  const order = [
                                    "Bazaar",
                                    "Platform Booth",
                                    "Workshop",
                                  ];
                                  return (
                                    order.indexOf(a.name) -
                                    order.indexOf(b.name)
                                  );
                                })
                                .map((item) => (
                                  <div
                                    key={item.name}
                                    className="flex items-center gap-2"
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-muted-foreground font-medium">
                                      {item.name}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Revenue by Month Bar Chart */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">
                      Revenue by Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pl-6 pr-6">
                    {loadingCharts ? (
                      <div className="h-[280px] flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={revenueChartData}
                          margin={{ top: 5, right: 5, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            tickFormatter={(value) => {
                              if (value >= 1000) {
                                return `$${(value / 1000).toFixed(1)}k`;
                              }
                              return `$${value}`;
                            }}
                            tick={{ fontSize: 12 }}
                            width={60}
                          />
                          <Tooltip
                            formatter={(value: number) => {
                              const numValue = Number(value);
                              return `$${numValue.toFixed(2)}`;
                            }}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))",
                            }}
                            labelStyle={{ color: "hsl(var(--foreground))" }}
                          />
                          <Bar dataKey="revenue" fill="#8b5cf6" barSize={60}>
                            {revenueChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  Number(entry.revenue) > 0
                                    ? barColors[index % barColors.length]
                                    : "#e5e7eb"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
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
                                setLocation("/events-office/create/trip");
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
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white whitespace-normal px-3 py-2 w-44 sm:w-48 flex items-center justify-center gap-2"
                      onClick={() => setLocation("/events-office/polls")}
                      data-testid="button-quick-polls"
                    >
                      <PieChartIcon className="h-4 w-4" />
                      <span className="text-xs sm:text-sm leading-tight">
                        Polls
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
          <Card className="mb-8 border-amber-200/50 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20">
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
              <div className="sticky top-32">
                <EventFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  locations={Array.from(
                    new Set(
                      combinedEvents
                        .filter((event) => event)
                        .map(
                          (event) => event.location || event.locationPreference
                        )
                        .filter((loc) => !!loc)
                    )
                  )}
                  professors={professorOptions}
                  userRole={userRole}
                  onClear={handleClearFilters}
                  events={combinedEvents} // <--- ADDED THIS PROP
                />
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
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Search events by name, type, or location..."
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <EventSort
                      sortOrder={sortOrder}
                      onSortChange={setSortOrder}
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
                    <EmptyState />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                      {[...filteredEvents]
                        .sort((a, b) => {
                          const aDate = a.startDate
                            ? new Date(a.startDate).getTime()
                            : 0;
                          const bDate = b.startDate
                            ? new Date(b.startDate).getTime()
                            : 0;
                          return sortOrder === "asc"
                            ? aDate - bDate
                            : bDate - aDate;
                        })
                        .filter((event: any) => !event?.deletedAt)
                        .slice(0, displayLimit)
                        .map((event: any, index: number) => {
                          const now = new Date();
                          // For booth events, they don't have endDate, so they're always "upcoming"
                          const isBoothEvent =
                            event.eventType === "platform_booth";
                          const eventEndDate = event.endDate
                            ? new Date(event.endDate)
                            : null;
                          if (eventEndDate) {
                            eventEndDate.setUTCHours(23, 59, 59, 999);
                          }
                          const isPastEvent =
                            !isBoothEvent &&
                            eventEndDate &&
                            eventEndDate.getTime() < now.getTime();

                          return (
                            <div key={event._id || index} className="h-full">
                              <EventCard
                                className="h-full flex flex-col"
                                id={event._id || String(index)}
                                title={event.name || "Untitled Event"}
                                category={
                                  event.eventType === "platform_booth"
                                    ? "booth"
                                    : event.eventType || "academic"
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
                                    : event.eventType === "platform_booth" &&
                                        event.durationWeeks
                                      ? `Active for ${event.durationWeeks} week${
                                          event.durationWeeks > 1 ? "s" : ""
                                        }`
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
                                    : event.eventType === "platform_booth" &&
                                        event.durationWeeks
                                      ? ""
                                      : "TBA"
                                }
                                location={
                                  event.location ||
                                  (event.eventType === "platform_booth"
                                    ? event.locationPreference
                                    : null) ||
                                  "Unknown location"
                                }
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
                                // --- UPDATED HERE ---
                                // Pass raw strings for time fix
                                dbStartTime={event.startTime}
                                dbEndTime={event.endTime}
                                // --------------------

                                durationWeeks={event.durationWeeks}
                                capacity={-1}
                                vendors={event.vendors || []}
                                price={event.price}
                                showDetailedView={true}
                                canDelete={
                                  (Array.isArray(event.attendees)
                                    ? event.attendees.length
                                    : event.attendeesCount || 0) === 0
                                }
                                onDelete={() => handleDeleteEvent(event._id)}
                                hideRegisterButton={true}
                                onViewDetails={() => handleCardClick(event._id)}
                                {...(isPastEvent
                                  ? {
                                      onArchive: () =>
                                        handleArchiveEvent(event._id),
                                      isArchiving: archivingId === event._id,
                                    }
                                  : [
                                        "trip",
                                        "conference",
                                        "bazaar",
                                        "workshop",
                                      ].includes(event.eventType)
                                    ? {
                                        onEdit: () => {
                                          if (event.eventType === "workshop") {
                                            // Open restrict access dialog for workshops
                                            setSelectedEventForRestrict(event);
                                            setRestrictAccessDialogOpen(true);
                                          } else if (
                                            event.eventType === "trip"
                                          ) {
                                            // Check if trip has already started before navigating
                                            if (event.startDate) {
                                              const now = new Date();
                                              const tripStartDate = new Date(
                                                event.startDate
                                              );
                                              if (tripStartDate <= now) {
                                                toast({
                                                  title: "Cannot Edit Trip",
                                                  description:
                                                    "Cannot edit a trip that has already started.",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                            }
                                            setLocation(
                                              `/events-office/events/trip/edit/${event._id}`
                                            );
                                          } else {
                                            const editRoutes: Record<
                                              string,
                                              string
                                            > = {
                                              conference: `/events-office/events/conference/edit/${event._id}`,
                                              bazaar: `/create/bazaar?id=${event._id}`,
                                            };
                                            const route =
                                              editRoutes[event.eventType];
                                            if (route) setLocation(route);
                                          }
                                        },
                                      }
                                    : {})}
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
          logger.info("Gym session created for:", createdDate);
          // Optionally navigate to sports facilities page
          // setLocation("/sports");
        }}
      />
      <RestrictAccessDialog
        open={restrictAccessDialogOpen}
        onOpenChange={setRestrictAccessDialogOpen}
        eventId={selectedEventForRestrict?._id || null}
        eventName={selectedEventForRestrict?.name || ""}
        currentRestrictedRoles={selectedEventForRestrict?.restrictedRoles || []}
        onSuccess={handleRestrictSuccess}
      />
    </div>
  );
}
