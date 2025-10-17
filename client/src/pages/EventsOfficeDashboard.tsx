import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Clock, Plus } from "lucide-react";
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

  useEffect(() => {
    fetchBazaars();
  }, []);

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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Events Office Dashboard</h1>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow hover:opacity-90"
              onClick={() => setLocation("/create/bazaar")}
              data-testid="button-header-create-bazaar"
            >
              <Plus className="h-4 w-4" />
              Create Bazaar
            </button>
          </div>
          <p className="text-muted-foreground">
            Manage existing bazaars below, or create a new one using the Create Bazaar button above.
          </p>
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <StatCard
              title="Total Bazaars"
              value={loadingBazaars ? "-" : bazaars.length}
              icon={CalendarDays}
            />
            <StatCard
              title="Upcoming"
              value={loadingBazaars ? "-" : bazaars.filter(b => new Date(b.startDate) > new Date()).length}
              icon={Clock}
            />
            <StatCard
              title="Active/Approved"
              value={loadingBazaars ? "-" : bazaars.filter(b => (b.status || "").toLowerCase().includes("approved") || (b.status || "").toLowerCase().includes("active")).length}
              icon={CheckCircle2}
            />
          </div>
        </div>

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
        </div>
      </main>
    </div>
  );
}
