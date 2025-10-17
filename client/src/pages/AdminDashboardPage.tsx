import { useState, useEffect } from "react";
import { Calendar, Users, TrendingUp, Plus, Edit, Settings, UserCheck } from "lucide-react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import EventListItem from "@/components/EventListItem";

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
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

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
          throw new Error(`Unexpected response. Preview: ${text.substring(0, 60)}...`);
        }
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Failed to fetch upcoming events");
        setUpcomingEvents(Array.isArray(body.data) ? body.data : body);
      } catch (err: any) {
        setEventsError(err.message || "Failed to load upcoming events");
        setUpcomingEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchUpcomingEvents();
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
            <Button onClick={() => setLocation("/admin/create/conference")}> 
              <Plus className="h-4 w-4 mr-2" />
              Create Conference
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage events, approvals, and administrative operations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatCard 
            title="Total Conferences" 
            value={conferences.length.toString()} 
            icon={Calendar} 
            trend={{ value: 12, isPositive: true }} 
          />
          <StatCard 
            title="Total Attendees" 
            value="3,456" 
            icon={Users} 
            trend={{ value: 8, isPositive: true }} 
          />
          <StatCard 
            title="Pending Approvals" 
            value="7" 
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conferences</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setLocation("/admin/create/conference")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Conference
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    Loading conferences...
                  </div>
                ) : conferences.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No conferences found</p>
                    <p className="text-sm mb-4">Create your first conference to get started</p>
                    <Button onClick={() => setLocation("/admin/create/conference")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Conference
                    </Button>
                  </div>
                ) : (
                  conferences.map((conference) => (
                    <div key={conference._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {conference.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {conference.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              🕐 {formatTime(conference.startDate)}
                            </span>
                            {conference.requiredBudget && (
                              <span className="flex items-center gap-1">
                                💰 {conference.requiredBudget} EGP
                              </span>
                            )}
                            {conference.fundingSource && (
                              <span className="flex items-center gap-1 capitalize">
                                🏛️ {conference.fundingSource}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setLocation(`/admin/events/conference/edit/${conference._id}`)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart visualization would go here
                </div>
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
                  onClick={() => setLocation("/admin/create/conference")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Conference
                </Button>
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
                  onClick={() => console.log("Settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conference Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Conferences</span>
                  <span className="text-sm font-semibold">{conferences.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">External Funding</span>
                  <span className="text-sm font-semibold">
                    {conferences.filter(c => c.fundingSource === 'external').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">GUC Funding</span>
                  <span className="text-sm font-semibold">
                    {conferences.filter(c => c.fundingSource === 'guc').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Budget</span>
                  <span className="text-sm font-semibold">
                    {conferences.reduce((sum, c) => sum + (c.requiredBudget || 0), 0)} EGP
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

