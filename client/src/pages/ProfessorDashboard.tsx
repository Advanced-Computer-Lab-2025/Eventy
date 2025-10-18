import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  GraduationCap, 
  Calendar, 
  Dumbbell, 
  BookOpen, 
  ArrowRight,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import ProfessorHeader from "@/components/ProfessorHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Workshop {
  _id: string;
  name: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  startDate: string;
}

export default function ProfessorDashboard() {
  const [, setLocation] = useLocation();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchUserData();
    fetchWorkshopStats();
  }, []);

  const fetchUserData = () => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      // Use firstName field directly from the database model
      setUserName(userData.firstName);
    }
  };

  const fetchWorkshopStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLocation("/login");
        return;
      }

      const res = await fetch("http://localhost:4000/api/events/me/workshops", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setWorkshops(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch workshops:", err);
    } finally {
      setLoading(false);
    }
  };

  const getWorkshopStats = () => {
    const total = workshops.length;
    const pending = workshops.filter(w => w.status === "pending").length;
    const approved = workshops.filter(w => w.status === "approved").length;
    const needsRevision = workshops.filter(w => w.status === "needs_revision").length;
    return { total, pending, approved, needsRevision };
  };

  const stats = getWorkshopStats();

  const quickActions = [
    {
      title: "Workshop Management",
      description: "Create, edit, and view all your workshops",
      icon: BookOpen,
      color: "bg-blue-500",
      path: "/professor/workshops",
      features: [
        "Create new workshops",
        "Edit workshop details",
        "View all your workshops",
        "Track approval status"
      ]
    },
    {
      title: "Sports Facilities",
      description: "View gym schedule and fitness sessions",
      icon: Dumbbell,
      color: "bg-green-500",
      path: "/sports",
      activities: [
        "Yoga",
        "Pilates",
        "Aerobics",
        "Zumba",
        "Cross Circuit",
        "Kick-boxing"
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ProfessorHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfessorHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Professor Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Welcome, Professor {userName}! Manage your workshops and access university facilities.
          </p>
        </div>

        {/* Workshop Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All workshops created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                Successfully approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.needsRevision}</div>
              <p className="text-xs text-muted-foreground">
                Requires updates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quickActions.map((action) => (
              <Card key={action.title} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${action.color} p-3 rounded-lg`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{action.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1">
                    {action.features && (
                      <ul className="space-y-2 mb-4">
                        {action.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    {action.activities && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          Access the gym schedule to view monthly fitness sessions and book your preferred time slots.
                        </p>
                        <p className="text-sm font-medium mb-3">Available Sessions:</p>
                        <div className="flex flex-wrap gap-2">
                          {action.activities.map((activity, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary"
                              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                            >
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-auto" 
                    onClick={() => setLocation(action.path)}
                  >
                    Access {action.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Workshops */}
        {workshops.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Recent Workshops</h2>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/professor/workshops")}
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workshops.slice(0, 3).map((workshop) => (
                <Card key={workshop._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-1">{workshop.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date(workshop.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          workshop.status === "approved" 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : workshop.status === "pending"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : workshop.status === "needs_revision"
                            ? "bg-orange-100 text-orange-800 border-orange-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {workshop.status === "needs_revision" ? "Needs Revision" : workshop.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {workshops.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Workshops Yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Start by creating your first workshop. You can add details like name, location, 
                dates, description, faculty, budget, and more.
              </p>
              <Button onClick={() => setLocation("/professor/workshops")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Go to Workshop Management
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
