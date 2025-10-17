import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import EventDetailsDialog from "@/components/EventsDetailsDialog";

interface Workshop {
  _id: string;
  name: string;
  eventType: "workshop";
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: "pending" | "approved" | "rejected" | string;
  attendees: any[];
  capacity: number;
  createdBy: string;
  deletedAt: string | null;
  agenda?: string;
  requiredBudget?: number;
  fundingSource?: string;
  extraResources?: string;
  faculty?: string;
  professors?: string[];
  createdAt: string;
  updatedAt: string;
}

const getToken = () => localStorage.getItem("token");

export default function MyWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20";
      case "pending":
        return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20";
      case "rejected":
        return "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20";
      case "needs_revision":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  useEffect(() => {
    const fetchWorkshops = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBaseUrl = "http://localhost:4000";
        const res = await fetch(`${apiBaseUrl}/api/events/me/workshops`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed: ${res.status}`);
        }
        const data = await res.json();
        setWorkshops(Array.isArray(data?.data) ? data.data : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load workshops");
        setWorkshops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  const handleRowClick = async (eventId: string) => {
    setDialogOpen(true);
    setDetailsLoading(true);
    try {
      const apiBaseUrl = "http://localhost:4000";
      const res = await fetch(`${apiBaseUrl}/api/events/${eventId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch event details");
      const data = await res.json();
      // EventDetailsDialog only renders safe fields, so pass through
      setSelectedEvent(data?.data ?? null);
    } catch (e) {
      setSelectedEvent(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Workshops</h1>
          <p className="text-muted-foreground">View workshops you created</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workshops</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-destructive">{error}</div>
            ) : workshops.length === 0 ? (
              <div className="text-muted-foreground">No workshops found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workshops.map((w) => {
                    const start = new Date(w.startDate).toLocaleDateString();
                    const end = new Date(w.endDate).toLocaleDateString();
                    return (
                      <TableRow
                        key={w._id}
                        className="cursor-pointer"
                        onClick={() => handleRowClick(w._id)}
                        data-testid={`row-workshop-${w._id}`}
                      >
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell>{start} 
                          {start !== end ? ` → ${end}` : ""}
                        </TableCell>
                        <TableCell>{w.location}</TableCell>
                        <TableCell>
                          <Badge className={getStatusClasses(w.status)}>{w.status}</Badge>
                        </TableCell>
                        <TableCell>{w.capacity ?? "-"}</TableCell>
                        <TableCell>{w.faculty ?? "-"}</TableCell>
                        <TableCell>{w.requiredBudget ? `$${w.requiredBudget}` : "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <EventDetailsDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedEvent(null);
          }}
          event={selectedEvent}
          loading={detailsLoading}
        />
      </main>
    </div>
  );
}
