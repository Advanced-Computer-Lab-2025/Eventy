import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Search,
  Bell,
  User as UserIcon,
  Home,
  ArrowLeft,
} from "lucide-react";
import ProfessorHeader from "@/components/ProfessorHeader";
import StudentHeader from "@/components/StudentHeader";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import StaffHeader from "@/components/StaffHeader";
import AdminHeader from "@/components/AdminHeader";
import { useToast } from "@/hooks/use-toast";
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
  const [courtSchedules, setCourtSchedules] = useState<
    Record<CourtType, CourtSchedule[]>
  >({
    basketball: [],
    tennis: [],
    football: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [navigateToDate, setNavigateToDate] = useState<Date | undefined>(
    undefined
  );
  const [reservingKeys, setReservingKeys] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Load saved tab from localStorage, default to "courts"
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("sportsFacilitiesTab");
      return savedTab || "courts";
    }
    return "courts";
  });
  const { toast } = useToast();

  const ymdLocal = (d: string | Date | undefined | null) => {
    if (!d) return undefined;
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dateObj.getTime())) return undefined;
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const fetchCourtSchedules = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/api/facilities/courts", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.warn("Reserve response:", res.status, data);
      if (data.success && data.data) {
        // Normalize schedule dates to local YYYY-MM-DD (use local date parts)
        const normalize = (arr: unknown[]) =>
          (arr || []).map((s: unknown) => {
            const sc = s as any;
            return {
              ...sc,
              // produce local Y-M-D string regardless of incoming format
              date: ymdLocal(sc?.date),
            };
          });

        const normalized = {
          basketball: normalize(data.data.basketball),
          tennis: normalize(data.data.tennis),
          football: normalize(data.data.football),
        };
        setCourtSchedules(normalized);
        // warn with sample so devs can inspect if needed
        console.warn("Fetched court schedules (normalized):", normalized);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast({
        title: "Error",
        description: "Failed to load court schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user role from token and localStorage
    let role: string | null = null;

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        role = payload.role;
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }

    // Also try to get role from localStorage user object as fallback
    if (!role) {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const userData = JSON.parse(user);
          role = userData.role || null;
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
      }
    }

    if (role) {
      setUserRole(role);
    }

    // Fetch court schedules
    fetchCourtSchedules();
  }, []);

  // Save tab selection to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sportsFacilitiesTab", activeTab);
    }
  }, [activeTab]);

  const getBodyDateFromIndex = (index: number) => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() + index);
    return ymdLocal(d) || "";
  };

  // Generate the canonical day slots (matches server: startHour=10, endHour=17)
  const generateDaySlots = () => {
    const startHour = 10;
    const endHour = 17;
    const slots: Slot[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const next = hour + 1;
      const startAMPM = hour >= 12 ? "PM" : "AM";
      const endAMPM = next >= 12 ? "PM" : "AM";
      const startHour12 = hour % 12 === 0 ? 12 : hour % 12;
      const endHour12 = next % 12 === 0 ? 12 : next % 12;
      slots.push({
        startTime: `${startHour12}:00 ${startAMPM}`,
        endTime: `${endHour12}:00 ${endAMPM}`,
        status: "booked",
      });
    }
    return slots;
  };

  const makeKey = (courtType: string, dateYMD: string, startTime: string) =>
    `${courtType}-${dateYMD}-${startTime}`;

  const handleReserveCourt = async (
    courtType: CourtType,
    _dateLabel: string,
    slot: Slot
  ) => {
    const bodyDate = getBodyDateFromIndex(currentDayIndex);
    const startTime = slot.startTime;
    const endTime = slot.endTime;
    const key = makeKey(courtType, bodyDate, startTime);

    if (reservingKeys.includes(key)) return;
    setReservingKeys((prev) => [...prev, key]);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:4000/api/facilities/courts/reserve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            date: bodyDate,
            courtType,
            startTime,
            endTime,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const message = data?.message || "Failed to reserve court";
        toast({ title: "Error", description: message, variant: "destructive" });
        return;
      }

      toast({
        title: "Success",
        description: `${COURT_NAMES[courtType]} reserved for ${bodyDate} ${startTime} - ${endTime}`,
      });

      // Refresh schedules so the slot becomes booked
      await fetchCourtSchedules();
    } catch (err) {
      console.error("Reserve error:", err);
      const message =
        (err && (err as any).message) || "Failed to reserve court";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setReservingKeys((prev) => prev.filter((k) => k !== key));
    }
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

    const formattedDate = ymdLocal(targetDate) || "";
    return Object.fromEntries(
      Object.entries(courtSchedules).map(([type, schedules]) => {
        const match = schedules.find((s) => s.date === formattedDate);
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

  const renderHeader = () => {
    switch (userRole) {
      case "student":
        return <StudentHeader />;
      case "staff":
      case "ta":
        return <StaffHeader />;
      case "professor":
        return <ProfessorHeader />;
      case "events_office":
        return <EventsOfficeHeader />;
      case "admin":
        return <AdminHeader />;
      default:
        return <StudentHeader />;
    }
  };

  const renderCourtContent = () => {
    const bodyDate = getBodyDateFromIndex(currentDayIndex);
    return (
      <div className="space-y-6">
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
            {Object.entries(COURT_NAMES).map(([type, label]) => {
              const serverSlots = currentSchedules[type as CourtType] || [];
              const fullSlots = generateDaySlots();
              // mark availability by checking serverSlots presence
              const slots = fullSlots.map((s) => {
                const found = serverSlots.find(
                  (ss) =>
                    ss.startTime === s.startTime && ss.endTime === s.endTime
                );
                return { ...s, status: found ? "available" : "booked" } as Slot;
              });

              // Check if there are any available slots
              const availableSlots = slots.filter(
                (s) => s.status === "available"
              );
              const hasAvailableSlots = availableSlots.length > 0;

              return (
                <Card key={type} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-center">
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex items-center justify-center min-h-[200px]">
                    <div className="flex flex-col gap-2 w-full">
                      {!hasAvailableSlots ? (
                        <div className="w-full min-h-12 flex items-center justify-center bg-muted rounded text-muted-foreground text-sm py-4 text-center">
                          No available slots today
                        </div>
                      ) : (
                        availableSlots.map((slot) => {
                          const slotKey = makeKey(
                            type as CourtType,
                            bodyDate,
                            slot.startTime
                          );
                          const isReserving = reservingKeys.includes(slotKey);
                          return (
                            <Button
                              key={slotKey}
                              variant="outline"
                              className="w-full justify-start gap-2 min-h-12 py-3"
                              disabled={isReserving}
                              onClick={() =>
                                handleReserveCourt(
                                  type as CourtType,
                                  formattedDate,
                                  slot
                                )
                              }
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="text-left">
                                  <div className="font-medium">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                </div>
                                <div>
                                  <Badge>Available</Badge>
                                </div>
                              </div>
                            </Button>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sports Facilities</h1>
          <p className="text-muted-foreground">
            Book courts and join gym sessions
          </p>
        </div>

        {canViewCourts ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
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

            <TabsContent value="courts">{renderCourtContent()}</TabsContent>

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
