import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import EditGymSessionDialog from "@/components/EditGymSessionDialog";

type GymSession = {
  _id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  maxParticipants: number;
  attendees?: string[];
  instructor: string;
  status?: string;
};

type GymScheduleViewerProps = {
  userRole?: string;
  onCreateClick?: () => void;
  navigateToDate?: Date;
};

const GYM_SESSION_TYPES: Record<string, string> = {
  yoga: "Yoga",
  pilates: "Pilates",
  aerobics: "Aerobics",
  zumba: "Zumba",
  cross_circuit: "Cross Circuit",
  kick_boxing: "Kick-boxing",
};

export default function GymScheduleViewer({
  userRole,
  onCreateClick,
  navigateToDate,
}: GymScheduleViewerProps) {
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<GymSession | null>(
    null
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const year = currentDate.getFullYear();

  useEffect(() => {
    fetchGymSessions();
  }, [month, year]);

  // Navigate to the specified date when provided
  useEffect(() => {
    if (navigateToDate) {
      setCurrentDate(navigateToDate);
    }
  }, [navigateToDate]);

  const fetchGymSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:4000/api/facilities/gym/sessions?month=${month}&year=${year}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch gym sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load gym sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleRegister = async (sessionId: string) => {
    //gym session registration logic
    const response = await fetch(
      `http://localhost:4000/api/facilities/gym/sessions/${sessionId}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      toast({
        title: "Error",
        description:
          errorData.message || "Failed to register for the gym session.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Success",
      description: "Successfully registered for the gym session.",
    });
  };

  const handleEditClick = (session: GymSession) => {
    setSelectedSession(session);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchGymSessions(); // Refresh the sessions list
  };

  const handleCancelClick = (session: GymSession) => {
    setSelectedSession(session);
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedSession) return;

    setIsCancelling(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `http://localhost:4000/api/facilities/gym/sessions/${selectedSession._id}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel session");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: `Gym session cancelled successfully. ${data.data.notificationsSent || 0} participant(s) notified.`,
      });

      setIsCancelDialogOpen(false);
      setSelectedSession(null);
      fetchGymSessions(); // Refresh the sessions list
    } catch (error) {
      console.error("Cancel session error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cancel session",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formattedMonthYear = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const canCreateSession = userRole === "events_office";
  const canEditSession = userRole === "events_office";
  const canCancelSession = userRole === "events_office";
  const canRegister =
    userRole === "student" ||
    userRole === "staff" ||
    userRole === "ta" ||
    userRole === "professor";

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="text-lg font-semibold min-w-[200px] text-center">
            {formattedMonthYear}
          </div>
          <Button variant="outline" onClick={handleNextMonth}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {canCreateSession && onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        )}
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gym Sessions for {formattedMonthYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading gym sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No gym sessions scheduled for this month.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Capacity</TableHead>
                  {canRegister && <TableHead>Registration</TableHead>}
                  {(canEditSession || canCancelSession) && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const enrolled = session.attendees?.length || 0;
                  const capacity = session.maxParticipants;
                  const isFull = enrolled >= capacity;

                  return (
                    <TableRow key={session._id}>
                      <TableCell className="font-medium">
                        {GYM_SESSION_TYPES[session.type] || session.type}
                      </TableCell>
                      <TableCell>{formatDate(session.date)}</TableCell>
                      <TableCell>{session.startTime}</TableCell>
                      <TableCell>{session.durationMinutes} min</TableCell>
                      <TableCell>{session.instructor || "TBA"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="min-w-[3rem]">
                            {enrolled}/{capacity}
                          </span>
                          {isFull ? (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
                            >
                              Full
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                            >
                              Available
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {canRegister && (
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={isFull}
                            onClick={() => handleRegister(session._id)}
                          >
                            Register
                          </Button>
                        </TableCell>
                      )}
                      {(canEditSession || canCancelSession) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEditSession && (
                              <button
                                onClick={() => handleEditClick(session)}
                                className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
                                aria-label="Edit session"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                            {canCancelSession && (
                              <button
                                onClick={() => handleCancelClick(session)}
                                className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
                                aria-label="Cancel session"
                              >
                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Gym Session Dialog */}
      <EditGymSessionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        session={selectedSession}
        onSuccess={handleEditSuccess}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Gym Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this gym session?
              {selectedSession &&
                selectedSession.attendees &&
                selectedSession.attendees.length > 0 && (
                  <span>
                    {" "}
                    {selectedSession.attendees.length} registered participant
                    {selectedSession.attendees.length !== 1 ? "s" : ""} will be
                    notified via email.
                  </span>
                )}
              {selectedSession && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="font-medium text-foreground">
                    {GYM_SESSION_TYPES[selectedSession.type] ||
                      selectedSession.type}
                  </p>
                  <p className="text-sm mt-1">
                    {formatDate(selectedSession.date)} at{" "}
                    {selectedSession.startTime}
                  </p>
                  <p className="text-sm">
                    Instructor: {selectedSession.instructor}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelConfirm();
              }}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 outline-none border-0 shadow-none focus:outline-none focus:border-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
