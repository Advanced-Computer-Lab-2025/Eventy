import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calendar, MapPin, Users, DollarSign, Edit, Plus } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Workshop {
  _id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  faculty: string;
  capacity: number;
  requiredBudget: number;
  fundingSource: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  registrationDeadline: string;
  revisionComments?: string;
}

export default function WorkshopManagement() {
  const [, setLocation] = useLocation();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyWorkshops();
  }, []);

  const fetchMyWorkshops = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLocation("/login");
        return;
      }

      const res = await fetch("http://localhost:4000/api/events/me/workshops", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch workshops");
      }

      const data = await res.json();
      setWorkshops(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load workshops");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { 
        className: "ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800", 
        label: "Pending Approval" 
      },
      approved: { 
        className: "ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800", 
        label: "Approved" 
      },
      rejected: { 
        className: "ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800", 
        label: "Rejected" 
      },
      needs_revision: { 
        className: "ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800", 
        label: "Needs Revision" 
      },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading workshops...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Workshops</h1>
            <p className="text-muted-foreground">
              Manage and track your workshop submissions
            </p>
          </div>
          <Button onClick={() => setLocation("/professor/create-workshop")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workshop
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Workshops Grid */}
        {workshops.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workshops yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first workshop to get started
              </p>
              <Button onClick={() => setLocation("/professor/create-workshop")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workshop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((workshop) => (
              <Card key={workshop._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{workshop.name}</CardTitle>
                    {getStatusBadge(workshop.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workshop.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      {workshop.location}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(workshop.startDate)} - {formatDate(workshop.endDate)}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      Capacity: {workshop.capacity}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Budget: ${workshop.requiredBudget.toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Faculty: {workshop.faculty.toUpperCase()}</span>
                      <span>Source: {workshop.fundingSource.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Deadline: {formatDate(workshop.registrationDeadline)}
                    </div>
                  </div>

                  {workshop.revisionComments && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                      <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        Revision Required:
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        {workshop.revisionComments}
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setLocation(`/professor/edit-workshop/${workshop._id}`)}
                    disabled={workshop.status !== "pending" && workshop.status !== "needs_revision"}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {workshop.status === "approved" || workshop.status === "rejected" 
                      ? "Cannot Edit" 
                      : "Edit Workshop"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
