import { useState, useEffect } from "react";
import { Calendar, Clock, Dumbbell, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const gymSessions = [
  { id: "1", type: "Yoga", date: "March 15, 2024", time: "9:00 AM - 10:00 AM", capacity: 20, enrolled: 15 },
  { id: "2", type: "Pilates", date: "March 16, 2024", time: "5:00 PM - 6:00 PM", capacity: 15, enrolled: 12 },
  { id: "3", type: "Zumba", date: "March 17, 2024", time: "6:00 PM - 7:00 PM", capacity: 25, enrolled: 20 },
  { id: "4", type: "CrossFit", date: "March 18, 2024", time: "7:00 AM - 8:00 AM", capacity: 15, enrolled: 10 },
  { id: "5", type: "Kickboxing", date: "March 19, 2024", time: "5:00 PM - 6:00 PM", capacity: 20, enrolled: 18 },
];

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
  const [courtSchedules, setCourtSchedules] = useState<Record<CourtType, CourtSchedule[]>>({
    basketball: [],
    tennis: [],
    football: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");
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

  const handleJoinSession = (session: any) => {
    alert(`Registered for ${session.type} on ${session.date}`);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Left-aligned title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sports Facilities</h1>
          <p className="text-muted-foreground">
            Book courts and join gym sessions
          </p>
        </div>

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

          {/* Centered Date Navigation — now below the tabs */}
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

          {/* COURT SCHEDULES */}
          <TabsContent value="courts">
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
          </TabsContent>

          {/* GYM SCHEDULES */}
          <TabsContent value="gym" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Gym Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gymSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.type}</TableCell>
                        <TableCell>{session.date}</TableCell>
                        <TableCell>{session.time}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>
                              {session.enrolled}/{session.capacity}
                            </span>
                            {session.enrolled >= session.capacity ? (
                              <Badge variant="destructive">Full</Badge>
                            ) : (
                              <Badge className="bg-green-500 hover:bg-green-600">
                                Available
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={session.enrolled >= session.capacity}
                            onClick={() => handleJoinSession(session)}
                          >
                            Register
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
