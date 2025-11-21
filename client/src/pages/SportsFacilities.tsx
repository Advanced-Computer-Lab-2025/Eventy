import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Calendar, Clock, ChevronLeft, ChevronRight, Dumbbell, Search, Bell, User as UserIcon, Home , ArrowLeft} from "lucide-react";
import ProfessorHeader from "@/components/ProfessorHeader";
import StudentHeader from "@/components/StudentHeader";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import StaffHeader from "@/components/StaffHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GymScheduleViewer from "@/components/GymScheduleViewer";
import CreateGymSessionDialog from "@/components/CreateGymSessionDialog";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";


type Slot = {
  startTime: string;
  endTime: string;
  status: string;
};

type CourtSchedule = {
  date: string;
  slots: Slot[];
};

type CourtType = "basketball" | "tennis" | "football";

const COURT_NAMES: Record<CourtType, string> = {
  basketball: "Basketball Court",
  tennis: "Tennis Court",
  football: "Football Field",
};

// Helper to format 24h time into 12h AM/PM
const formatTimeToAMPM = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

export default function SportsFacilities() {
  const [, setLocation] = useLocation();
  const [courtSchedules, setCourtSchedules] = useState<Record<CourtType, CourtSchedule[]>>({
    basketball: [],
    tennis: [],
    football: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [navigateToDate, setNavigateToDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Fetch user role from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }

    // Fetch court schedules
    setLoading(true);
    fetch("http://localhost:4000/api/facilities/courts", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          setCourtSchedules({
            basketball: data.data.basketball || [],
            tennis: data.data.tennis || [],
            football: data.data.football || [],
          });
        }
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleReserveCourt = (courtType: CourtType, date: string, slot: Slot) => {
    alert(`${COURT_NAMES[courtType]} reserved for ${date} ${slot.startTime}-${slot.endTime}`);
  };

  const handleCreateSuccess = (createdDate: Date) => {
    // Navigate to the month of the created session
    setNavigateToDate(createdDate);
    // Trigger refresh of gym schedule by updating key
    setRefreshKey((prev) => prev + 1);
  };

  const getSchedulesForDay = (dayIndex: number) => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayIndex);
    targetDate.setHours(0, 0, 0, 0);

    const formattedDate = targetDate.toISOString().split("T")[0];
    return Object.fromEntries(
      Object.entries(courtSchedules).map(([type, schedules]) => {
        const match = schedules.find(
          (s) => s.date && s.date.startsWith(formattedDate)
        );
        return [type, match ? match.slots : []];
      })
    ) as Record<CourtType, Slot[]>;
  };

  const currentSchedules = getSchedulesForDay(currentDayIndex);
  const today = new Date();
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + currentDayIndex);

  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const canViewCourts = userRole === "student";

  const renderCourtContent = () => (
    <div className="space-y-6">
      {/* Centered Date Navigation — for courts only */}
      <div className="flex items-center justify-center gap-4 my-6">
        <Button
          variant="outline"
          onClick={() => setCurrentDayIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentDayIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <div className="text-lg font-semibold min-w-[250px] text-center">
          {formattedDate}
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentDayIndex((prev) => Math.min(6, prev + 1))}
          disabled={currentDayIndex === 6}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">
          Loading court schedules...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(COURT_NAMES).map(([type, label]) => (
            <Card key={type} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-xl text-center">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {currentSchedules[type as CourtType]?.length > 0 ? (
                    currentSchedules[type as CourtType].map(
                      (slot, sidx) => (
                        <Button
                          key={sidx}
                          variant="outline"
                          className="w-full justify-start gap-2"
                          disabled={slot.status !== "available"}
                          onClick={() =>
                            handleReserveCourt(
                              type as CourtType,
                              formattedDate,
                              slot
                            )
                          }
                        >
                          <Clock className="h-4 w-4" />
                          {formatTimeToAMPM(slot.startTime)} –{" "}
                          {formatTimeToAMPM(slot.endTime)}
                          {slot.status !== "available" && (
                            <Badge
                              variant="destructive"
                              className="ml-2"
                            >
                              Booked
                            </Badge>
                          )}
                        </Button>
                      )
                    )
                  ) : (
                    <p className="text-muted-foreground text-sm text-center">
                      No slots available for this day.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {userRole === "professor" ? (
        <ProfessorHeader />
      ) : userRole === "events_office" ? (
        <EventsOfficeHeader />
      ) : (userRole === "staff" || userRole === "ta") ? (
        <StaffHeader />
      ) : (
        <StudentHeader />
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Left-aligned title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sports Facilities</h1>
          <p className="text-muted-foreground">
            Book courts and join gym sessions
          </p>
        </div>

        {canViewCourts ? (
          <Tabs defaultValue="courts" className="space-y-6">
            <TabsList>
              <TabsTrigger value="courts">
                <Calendar className="h-4 w-4 mr-2" />
                Court Reservations
              </TabsTrigger>
              <TabsTrigger value="gym">
                <Dumbbell className="h-4 w-4 mr-2" />
                Gym Schedule
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courts">
              {renderCourtContent()}
            </TabsContent>

            <TabsContent value="gym" className="space-y-4">
              <GymScheduleViewer
                key={refreshKey}
                userRole={userRole || undefined}
                onCreateClick={() => setIsCreateDialogOpen(true)}
                navigateToDate={navigateToDate}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <GymScheduleViewer
              key={refreshKey}
              userRole={userRole || undefined}
              onCreateClick={() => setIsCreateDialogOpen(true)}
              navigateToDate={navigateToDate}
            />
          </div>
        )}
      </main>

      {/* Create Gym Session Dialog */}
      <CreateGymSessionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
