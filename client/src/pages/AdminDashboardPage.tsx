import { useState, useEffect } from "react";
import { Calendar, Users, TrendingUp, Plus, Edit, Settings, UserCheck } from "lucide-react";
import Header from "@/components/AdminHeader";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import EventListItem from "@/components/EventListItem";
import EventSearch from "@/components/EventSearch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]); // Filtered/searched events for display
  const [totalUpcomingCount, setTotalUpcomingCount] = useState<number>(0); // Static count for the tile
  const [approvedEventsCount, setApprovedEventsCount] = useState<number>(0);
  const [approvedLoading, setApprovedLoading] = useState<boolean>(true);

  const handleSearchResults = (results: any[]) => {
    setUpcomingEvents(results);
    if (eventsLoading) setEventsLoading(false);
    
    // Set the total count only on initial load (when search is empty)
    // This check needs to be done in EventSearch component callback
  };

  const handleLoading = (isLoading: boolean) => {
    // Only show loading overlay on initial load
    if (upcomingEvents.length === 0) {
      setEventsLoading(isLoading);
    }
  };

  const handleError = (errorMessage: string) => {
    setEventsError(errorMessage);
  };

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/events/admin/conferences`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch conferences");

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
          throw new Error(`Unexpected response. Preview: ${text.substring(0, 60)}...`);
        }
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Failed to fetch approved events");
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

  // Fetch total upcoming events count for the statistics tile (static, not affected by search)
  useEffect(() => {
    const fetchUpcomingCount = async () => {
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
          throw new Error("Failed to fetch upcoming events count");
        }
        
        const data = await res.json();
        const events = Array.isArray(data.data) ? data.data : data;
        setTotalUpcomingCount(events.length);
      } catch (err) {
        console.error("Error fetching upcoming events count:", err);
        setTotalUpcomingCount(0);
      }
    };
    
    fetchUpcomingCount();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            value={(conferences.reduce((sum, c) => sum + (c.requiredBudget || 0), 0)).toLocaleString()} 
            icon={TrendingUp} 
          />
          <StatCard 
            title="Upcoming Events" 
            value={totalUpcomingCount.toString()} 
            icon={Calendar} 
          />
          <StatCard 
            title="Approved Events" 
            value={approvedLoading ? "-" : approvedEventsCount.toString()} 
            icon={TrendingUp} 
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Event Search */}
                <EventSearch
                  onSearchResults={handleSearchResults}
                  onLoading={handleLoading}
                  onError={handleError}
                  placeholder="Search events by name, professor, or type..."
                  className="mb-6"
                />

                {eventsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading upcoming events...</div>
                ) : eventsError ? (
                  <div className="text-center py-8 text-red-600">{eventsError}</div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No upcoming events found.</div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((e: any) => (
                      <EventListItem
                        key={e._id}
                        id={e._id}
                        title={e.name}
                        // eventType differs from CategoryBadge type, reuse as-is like EventListPage
                        category={e.eventType as any}
                        date={new Date(e.startDate).toLocaleDateString()}
                        time={`${new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(e.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        location={e.location}
                        image={e.bannerImage || "/placeholder.png"}
                        canDelete={true}
                        onDelete={(id: string) => setUpcomingEvents(prev => prev.filter((x) => x._id !== id))}
                      />
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
