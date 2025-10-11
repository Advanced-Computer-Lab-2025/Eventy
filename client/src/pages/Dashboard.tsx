import { useState } from "react";
import { Calendar, Users, TrendingUp, Plus } from "lucide-react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import EventListItem from "@/components/EventListItem";
import QuickActions from "@/components/QuickActions";
import CreateEventDialog from "@/components/CreateEventDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

//todo: remove mock functionality
const recentEvents = [
  {
    id: "1",
    title: "AI & Machine Learning Workshop",
    category: "academic" as const,
    date: "Mar 15, 2024",
    time: "2:00 PM",
    location: "Engineering Building",
    image: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=200&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Spring Festival",
    category: "cultural" as const,
    date: "Mar 20, 2024",
    time: "6:00 PM",
    location: "Main Quadrangle",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&auto=format&fit=crop",
  },
];

export default function Dashboard() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage your university events and track performance
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatCard
            title="Total Events"
            value="142"
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
            title="Active Now"
            value="24"
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentEvents.map((event) => (
                  <EventListItem
                    key={event.id}
                    {...event}
                    onClick={() => console.log("Event clicked:", event.title)}
                  />
                ))}
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
            <QuickActions
              onCreateEvent={() => setShowCreateDialog(true)}
              onImport={() => console.log("Import events")}
              onExport={() => console.log("Export data")}
              onSettings={() => console.log("Settings")}
            />

            <Card>
              <CardHeader>
                <CardTitle>Popular Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Academic</span>
                  <span className="text-sm font-semibold">45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Social</span>
                  <span className="text-sm font-semibold">38</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sports</span>
                  <span className="text-sm font-semibold">32</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cultural</span>
                  <span className="text-sm font-semibold">27</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
