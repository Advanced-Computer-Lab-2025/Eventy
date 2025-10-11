import { useState } from "react";
import { Calendar, Clock, Dumbbell } from "lucide-react";
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

//todo: remove mock functionality
const courts = [
  { id: "basketball-1", name: "Basketball Court 1", type: "basketball", available: ["10:00 AM", "2:00 PM", "4:00 PM"] },
  { id: "tennis-1", name: "Tennis Court 1", type: "tennis", available: ["9:00 AM", "11:00 AM", "3:00 PM"] },
  { id: "football-1", name: "Football Field", type: "football", available: ["8:00 AM", "5:00 PM", "7:00 PM"] },
];

const gymSessions = [
  { id: "1", type: "Yoga", date: "March 15, 2024", time: "9:00 AM - 10:00 AM", capacity: 20, enrolled: 15 },
  { id: "2", type: "Pilates", date: "March 16, 2024", time: "5:00 PM - 6:00 PM", capacity: 15, enrolled: 12 },
  { id: "3", type: "Zumba", date: "March 17, 2024", time: "6:00 PM - 7:00 PM", capacity: 25, enrolled: 20 },
  { id: "4", type: "CrossFit", date: "March 18, 2024", time: "7:00 AM - 8:00 AM", capacity: 15, enrolled: 10 },
  { id: "5", type: "Kickboxing", date: "March 19, 2024", time: "5:00 PM - 6:00 PM", capacity: 20, enrolled: 18 },
];

export default function SportsFacilities() {
  const [selectedCourt, setSelectedCourt] = useState<any>(null);

  const handleReserveCourt = (court: any, time: string) => {
    console.log("Reserve court:", court.name, "at", time);
    alert(`Court ${court.name} reserved for ${time}`);
  };

  const handleJoinSession = (session: any) => {
    console.log("Join session:", session);
    alert(`Registered for ${session.type} on ${session.date}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sports Facilities</h1>
          <p className="text-muted-foreground">
            Book courts and join gym sessions
          </p>
        </div>

        <Tabs defaultValue="courts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courts" data-testid="tab-courts">
              <Calendar className="h-4 w-4 mr-2" />
              Court Reservations
            </TabsTrigger>
            <TabsTrigger value="gym" data-testid="tab-gym">
              <Dumbbell className="h-4 w-4 mr-2" />
              Gym Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courts" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courts.map((court) => (
                <Card key={court.id} data-testid={`card-court-${court.id}`}>
                  <CardHeader>
                    <CardTitle className="text-xl">{court.name}</CardTitle>
                    <Badge variant="outline" className="w-fit capitalize">
                      {court.type}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-semibold mb-3">Available Times:</p>
                    <div className="space-y-2">
                      {court.available.map((time, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => handleReserveCourt(court, time)}
                          data-testid={`button-reserve-${court.id}-${index}`}
                        >
                          <Clock className="h-4 w-4" />
                          {time}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

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
                      <TableRow key={session.id} data-testid={`row-session-${session.id}`}>
                        <TableCell className="font-medium">{session.type}</TableCell>
                        <TableCell>{session.date}</TableCell>
                        <TableCell>{session.time}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{session.enrolled}/{session.capacity}</span>
                            {session.enrolled >= session.capacity ? (
                              <Badge variant="destructive">Full</Badge>
                            ) : (
                              <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={session.enrolled >= session.capacity}
                            onClick={() => handleJoinSession(session)}
                            data-testid={`button-join-${session.id}`}
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
