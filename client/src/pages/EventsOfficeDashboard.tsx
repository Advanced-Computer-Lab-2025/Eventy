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
  Users,
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
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "all" | "bazaar" | "trip" | "workshop" | "conference" | "platform_booth"
  >("all");
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

  // Extra totals
  const [totalTrips, setTotalTrips] = useState<number | null>(null);
  const [totalWorkshops, setTotalWorkshops] = useState<number | null>(null);
  const [totalBooths, setTotalBooths] = useState<number | null>(null);

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
      // Try to fetch all transactions (for events office/admin)
      // This endpoint should return all transactions when implemented
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
        // If endpoint doesn't exist yet (404) or access denied (403), set empty array
        setTransactions([]);
      }
    } catch (e) {
      // If endpoint doesn't exist, set empty array
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
    fetchBazaars();
    fetchPendingWorkshops();
    fetchPastEvents();
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
      name: "Workshop",
      value: attendeesByType.workshop || 0,
      color: "#eab308", // yellow
    },
    {
      name: "Platform Booth",
      value: attendeesByType.platform_booth || 0,
      color: "#8b5cf6", // purple
    },
  ].filter((item) => item.value > 0);

  // Calculate revenue by month for bar chart
  // Only use transactions from the transactions table (payment type, completed status)
  const revenueByMonth = transactions
    .filter(
      (t) => t.type === "payment" && t.status === "completed" && t.createdAt
    )
    .reduce(
      (acc, transaction) => {
        const date = new Date(transaction.createdAt);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        acc[monthKey] = (acc[monthKey] || 0) + (transaction.amount || 0);
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
      revenue: revenueByMonth[monthKey] || 0,
    });
  }

  const revenueChartData = months;

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
                  <CardContent className="pt-0 px-4">
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
                              cx="45%"
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
                              labelLine={{
                                stroke: "#666",
                                strokeWidth: 1,
                              }}
                            >
                              {attendeesChartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => Math.floor(value)}
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
                  <CardContent className="pt-0 px-4">
                    {loadingCharts ? (
                      <div className="h-[280px] flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : revenueChartData.length === 0 ||
                      revenueChartData.every((d) => d.revenue === 0) ? (
                      <div className="h-[280px] flex items-center justify-center">
                        <p className="text-muted-foreground">
                          No data available
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            allowDecimals={false}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip
                            formatter={(value: number) =>
                              `$${value.toFixed(2)}`
                            }
                          />
                          <Bar dataKey="revenue" fill="#8b5cf6" barSize={60}>
                            {revenueChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.revenue > 0 ? "#8b5cf6" : "#e5e7eb"}
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
                  { key: "all", label: "All" },
                  { key: "bazaar", label: "Bazaars" },
                  { key: "trip", label: "Trips" },
                  { key: "workshop", label: "Workshops" },
                  { key: "conference", label: "Conferences" },
                  { key: "platform_booth", label: "Platform Booths" },
                ].map((opt) => (
                  <Button
                    key={opt.key}
                    size="sm"
                    variant={
                      eventTypeFilter === (opt.key as any)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setEventTypeFilter(opt.key as any)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <EventSearch
                onSearchResults={(results) => {
                  // Filter to show only upcoming events
                  const now = new Date();
                  const upcomingEvts = results.filter((event: any) => {
                    const eventEndDate = new Date(event.endDate);
                    eventEndDate.setUTCHours(23, 59, 59, 999);
                    return eventEndDate.getTime() >= now.getTime();
                  });
                  setUpcomingEvents(upcomingEvts);
                }}
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
                  <p className="text-lg font-medium mb-2">
                    No upcoming events found
                  </p>
                  <p className="text-sm">
                    Events will appear here as they are created
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {upcomingEvents
                    .filter((event: any) =>
                      eventTypeFilter === "all"
                        ? true
                        : event.eventType === eventTypeFilter
                    )
                    .filter((event: any) => !event?.deletedAt)
                    .slice(0, 8)
                    .map((event: any, index: number) => (
                      <EventCard
                        key={event._id || index}
                        id={event._id || String(index)}
                        title={event.name || "Untitled Event"}
                        category={(event.eventType || "academic") as any}
                        date={
                          event.startDate
                            ? new Date(event.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "TBA"
                        }
                        time={
                          event.startDate
                            ? new Date(event.startDate).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )
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
                      />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Events */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Past Events</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search past events..."
                  value={pastEventSearch}
                  onChange={(e) => setPastEventSearch(e.target.value)}
                  className="w-64"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchPastEvents()}
                >
                  Refresh
                </Button>
              </div>
              {pastEventsLoading ? (
                <p>Loading past events...</p>
              ) : pastEventsError ? (
                <p className="text-red-500">{pastEventsError}</p>
              ) : filteredPastEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    No past events found
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredPastEvents.slice(0, 8).map((event: any) => (
                    <div key={event._id} className="relative">
                      <EventCard
                        id={event._id}
                        title={event.name || "Untitled Event"}
                        category={(event.eventType || "academic") as any}
                        date={
                          event.startDate
                            ? new Date(event.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "TBA"
                        }
                        time={
                          event.startDate
                            ? new Date(event.startDate).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )
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
                        onArchive={() => handleArchiveEvent(event._id)}
                        isArchiving={archivingId === event._id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
