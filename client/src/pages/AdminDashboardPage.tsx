import { useState, useEffect } from "react";
import { Calendar, Users, TrendingUp, Settings, UserCheck } from "lucide-react";
import Header from "@/components/AdminHeader";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import EventSearch from "@/components/EventSearch";
import EventCard from "@/components/EventCard";
import { getEventImage } from "@/lib/eventImages";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface Conference {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  websiteUrl?: string;
  requiredBudget?: number;
  fundingSource?: "external" | "guc";
  createdBy: string;
}

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const [creating, setCreating] = useState(false);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [totalUpcomingCount, setTotalUpcomingCount] = useState<number | null>(
    null
  );
  const [approvedEventsCount, setApprovedEventsCount] = useState<number>(0);
  const [approvedLoading, setApprovedLoading] = useState<boolean>(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "all" | "bazaar" | "trip" | "workshop" | "conference" | "platform_booth"
  >("all");

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/api/events/admin/conferences`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
          }
        );

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch conferences");

        setConferences(data.data || []);
      } catch (err: any) {
        console.error("Error fetching conferences:", err);
        setConferences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConferences();
  }, []);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/events/upcoming`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Unexpected response. Preview: ${text.substring(0, 60)}...`
          );
        }
        const body = await res.json();
        if (!res.ok)
          throw new Error(body.message || "Failed to fetch upcoming events");
        const eventsList = Array.isArray(body.data) ? body.data : body;
        setUpcomingEvents(eventsList);
        setTotalUpcomingCount(eventsList.length);
      } catch (err: any) {
        setEventsError(err.message || "Failed to load upcoming events");
        setUpcomingEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    const fetchApprovedEvents = async () => {
      try {
        setApprovedLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/events/search`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Unexpected response. Preview: ${text.substring(0, 60)}...`
          );
        }
        const body = await res.json();
        if (!res.ok)
          throw new Error(body.message || "Failed to fetch approved events");
        const list = Array.isArray(body.data) ? body.data : body;
        setApprovedEventsCount(Array.isArray(list) ? list.length : 0);
      } catch (err) {
        setApprovedEventsCount(0);
      } finally {
        setApprovedLoading(false);
      }
    };
    fetchApprovedEvents();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage events, approvals, and administrative operations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatCard
            title="Budget Requested (EGP)"
            value={conferences
              .reduce((sum, c) => sum + (c.requiredBudget || 0), 0)
              .toLocaleString()}
            icon={TrendingUp}
            themed={true}
          />
          <StatCard
            title="Upcoming Events"
            value={
              totalUpcomingCount === null ? "-" : totalUpcomingCount.toString()
            }
            icon={Calendar}
            themed={true}
          />
          <StatCard
            title="Approved Events"
            value={approvedLoading ? "-" : approvedEventsCount.toString()}
            icon={TrendingUp}
            themed={true}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Events</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Curated upcoming events across all categories
                    </p>
                  </div>
                  {!eventsLoading && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground border">
                      {upcomingEvents.length} found
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  onSearchResults={(results) => setUpcomingEvents(results)}
                  onLoading={(isLoading) => setEventsLoading(isLoading)}
                  onError={(msg) => setEventsError(msg)}
                  placeholder="Search events by name, professor, or type..."
                />

                {eventsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading upcoming events...
                  </div>
                ) : eventsError ? (
                  <div className="text-center py-8 text-red-600">
                    {eventsError}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming events found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                    {upcomingEvents
                      .filter((e: any) =>
                        eventTypeFilter === "all"
                          ? true
                          : e.eventType === eventTypeFilter
                      )
                      .slice(0, 6)
                      .map((e: any, index: number) => (
                        <div key={e._id || index} className="h-full">
                          <EventCard
                            className="h-full hover:-translate-y-2"
                            id={e._id || String(index)}
                            title={e.name || "Untitled Event"}
                            category={(e.eventType || "academic") as any}
                            date={
                              e.startDate
                                ? new Date(e.startDate).toLocaleDateString(
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
                              e.startDate
                                ? new Date(e.startDate).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    }
                                  )
                                : "TBA"
                            }
                            location={
                              e.location ||
                              (e.eventType === "platform_booth"
                                ? e.locationPreference
                                : null) ||
                              "Unknown location"
                            }
                            attendees={
                              Array.isArray(e.attendees)
                                ? e.attendees.length
                                : e.attendeesCount || 0
                            }
                            image={
                              e.bannerImage ||
                              e.image ||
                              getEventImage(e.eventType, e.name)
                            }
                            description={e.description}
                            startDate={e.startDate}
                            endDate={e.endDate}
                            durationWeeks={e.durationWeeks}
                            capacity={-1}
                            vendors={e.vendors || []}
                            price={e.price}
                            showDetailedView={true}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setLocation("/admin/users")}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setLocation("/vendor-requests")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Vendor Requests
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => console.log("Settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
