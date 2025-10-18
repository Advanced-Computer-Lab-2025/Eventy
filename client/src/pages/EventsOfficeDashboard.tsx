import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Clock, Plus, Calendar, Edit, Search, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatCard from "@/components/StatCard";
import BazaarList from "@/components/BazaarList";

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
      <Header homeOnly homeHref="/events-office/dashboard" hideSearch />
      
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
              />
              <StatCard
                title="Total Events"
                value={(loadingBazaars || loadingConfs) ? "-" : (bazaars.length + conferences.length)}
                icon={Clock}
              />
              <StatCard
                title="Total Conferences"
                value={loadingConfs ? "-" : conferences.length}
                icon={CheckCircle2}
              />
            </div>
          </div>

          {/* Action Buttons Card */}
          <div>
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
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow hover:opacity-90"
                  onClick={() => setLocation("/approvals/workshops")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Workshop Approvals
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workshop Pending Notification */}
        {showWorkshopNotif && pendingWorkshops > 0 && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-amber-900 mb-2">Pending Workshops</h3>
                  <p className="text-sm text-amber-800 mb-4">
                    You have <span className="font-semibold">{pendingWorkshops}</span> workshop{pendingWorkshops !== 1 ? "s" : ""} awaiting approval.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => {
                        handleCloseNotif();
                        setLocation("/approvals/workshops");
                      }}
                      className="bg-amber-600 hover:bg-amber-700"
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
                  className="flex-shrink-0 text-amber-600 hover:text-amber-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6" ref={existingRef as any}>
          <Card>
            <CardHeader>
              <CardTitle>Existing Bazaars</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBazaars ? (
                <div className="text-center py-8 text-muted-foreground">Loading bazaars...</div>
              ) : (
                <BazaarList 
                  bazaars={formattedBazaars} 
                  showFilters 
                  className="mt-2" 
                  onEdit={(id) => setLocation(`/create/bazaar?id=${id}`)}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No upcoming events</p>
                <p className="text-sm">Events will appear here as they are created</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Conferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingConfs ? (
                <div className="text-center py-8 text-muted-foreground">Loading conferences...</div>
              ) : conferences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No conferences found</p>
                  <p className="text-sm mb-4">Create your first conference to get started</p>
                </div>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search conferences..."
                              value={confSearch}
                              onChange={(e) => setConfSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        {confSearch && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfSearch("")}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {filteredConfs.length} conference{filteredConfs.length !== 1 ? "s" : ""} found
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredConfs.map((c: any) => (
                      <div key={c._id} className="border rounded-lg overflow-hidden bg-card">
                        <div className="h-40 w-full flex items-center justify-center bg-muted">
                          <Calendar className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg hover:text-primary transition-colors">{c.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button size="sm" variant="outline" onClick={() => setLocation(`/events-office/events/conference/edit/${c._id}`)}>
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

         
        </div>
      </main>
    </div>
  );
}