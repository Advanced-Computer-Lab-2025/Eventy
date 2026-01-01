import { useEffect, useState } from "react";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { bazaarApiService } from "@/lib/bazaarApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { getApiBaseUrl } from "@/lib/apiBase";

const API_BASE_URL = getApiBaseUrl();

interface PollOption {
  _id: string;
  optionText: string;
  voteCount?: number;
}

interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  context?: {
    locationPreference?: string;
    durationWeeks?: number;
    type?: string;
  };
  createdAt: string;
}

interface BoothRequest {
  _id: string;
  type: "bazaar" | "booth";
  status: "pending" | "approved" | "rejected" | "cancelled";
  locationPreference?: string;
  boothSize: "2x2" | "4x4";
  durationWeeks?: number;
  createdAt: string;
  createdBy?:
    | {
        _id?: string;
        companyName?: string;
        firstName?: string;
        lastName?: string;
      }
    | string;
}

export default function EventsOfficePolls() {
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [pollsError, setPollsError] = useState<string | null>(null);

  const [requests, setRequests] = useState<BoothRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const [selectedForPoll, setSelectedForPoll] = useState<string[]>([]);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollLocation, setPollLocation] = useState<string | null>(null);
  const [endingPollId, setEndingPollId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchPolls = async () => {
      try {
        setLoadingPolls(true);
        setPollsError(null);
        const res = await fetch(`${API_BASE_URL}/api/polls/booth-conflict`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Server Error: Expected JSON, got non-JSON (Status: ${res.status}). Preview: ${text.substring(
              0,
              80
            )}...`
          );
        }

        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.message || "Failed to fetch polls");
        }

        setPolls(Array.isArray(body.data) ? body.data : []);
      } catch (error: unknown) {
        setPollsError(
          error instanceof Error ? error.message : "Failed to load polls"
        );
      } finally {
        setLoadingPolls(false);
      }
    };

    const fetchApplications = async () => {
      try {
        setLoadingRequests(true);
        setRequestsError(null);
        const res = await fetch(`${API_BASE_URL}/api/applications`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Server Error: Expected JSON, got non-JSON (Status: ${res.status}). Preview: ${text.substring(
              0,
              80
            )}...`
          );
        }

        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.message || "Failed to fetch applications");
        }

        const apps = Array.isArray(body.data) ? body.data : [];
        setRequests(apps);
      } catch (error: unknown) {
        setRequestsError(
          error instanceof Error ? error.message : "Failed to load applications"
        );
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchPolls();
    fetchApplications();
  }, []);

  const toggleSelectForPoll = (
    requestId: string,
    checked: boolean | string
  ) => {
    const isChecked = checked === true || checked === "indeterminate";
    setSelectedForPoll((prev) => {
      if (isChecked) {
        return prev.includes(requestId) ? prev : [...prev, requestId];
      }
      return prev.filter((id) => id !== requestId);
    });
  };

  const openPollDialog = () => {
    const selectedRequests = requests.filter((r) =>
      selectedForPoll.includes(r._id)
    );

    if (selectedRequests.length < 2) {
      toast({
        title: "Select more requests",
        description:
          "Please select at least two pending booth requests to create a poll.",
        variant: "destructive",
      });
      return;
    }

    const nonPending = selectedRequests.filter((r) => r.status !== "pending");
    if (nonPending.length > 0) {
      toast({
        title: "Invalid selection",
        description: "Polls can only be created for pending requests.",
        variant: "destructive",
      });
      return;
    }

    const nonBooth = selectedRequests.filter((r) => r.type !== "booth");
    if (nonBooth.length > 0) {
      toast({
        title: "Invalid selection",
        description: "Polls can only be created for booth applications.",
        variant: "destructive",
      });
      return;
    }

    const firstLocation = selectedRequests[0]?.locationPreference;
    const sameLocation = selectedRequests.every(
      (r) => r.locationPreference && r.locationPreference === firstLocation
    );

    if (!firstLocation || !sameLocation) {
      toast({
        title: "Invalid selection",
        description:
          "All selected requests must have the same booth location to create a poll.",
        variant: "destructive",
      });
      return;
    }

    // Check that all applications are from different vendors
    const vendorIds = selectedRequests
      .map((r) => {
        if (typeof r.createdBy === "string") {
          return r.createdBy;
        }
        const vendorId = r.createdBy?._id || (r.createdBy as any)?._id;
        return vendorId ? String(vendorId) : null;
      })
      .filter((id) => id !== null);

    if (vendorIds.length !== selectedRequests.length) {
      toast({
        title: "Invalid selection",
        description: "All applications must have a valid vendor.",
        variant: "destructive",
      });
      return;
    }

    const uniqueVendorIds = new Set(vendorIds);
    if (uniqueVendorIds.size !== vendorIds.length) {
      toast({
        title: "Invalid selection",
        description:
          "Polls can only be created between different vendors. All selected applications must be from different vendors.",
        variant: "destructive",
      });
      return;
    }

    setPollLocation(firstLocation);
    setPollDialogOpen(true);
  };

  const handleCreatePoll = async () => {
    const applicationIds = selectedForPoll;
    if (applicationIds.length < 2) {
      setPollDialogOpen(false);
      return;
    }

    try {
      setIsCreatingPoll(true);
      await bazaarApiService.createBoothConflictPoll({ applicationIds });

      toast({
        title: "Poll created",
        description: pollLocation
          ? `A poll has been created for ${pollLocation}.`
          : "A booth conflict poll has been created.",
      });

      setPollDialogOpen(false);
      setSelectedForPoll([]);

      // Refresh polls list
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/polls/booth-conflict`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      const body = await res.json();
      if (res.ok && Array.isArray(body.data)) {
        setPolls(body.data);
      }
    } catch (error: unknown) {
      toast({
        title: "Failed to create poll",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the poll.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const pendingBoothRequests = requests.filter(
    (r) => r.type === "booth" && r.status === "pending"
  );

  const handleEndPoll = async (pollId: string) => {
    try {
      setEndingPollId(pollId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/polls/${pollId}/end`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `Server Error: Expected JSON, got non-JSON (Status: ${res.status}). Preview: ${text.substring(
            0,
            80
          )}...`
        );
      }

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || "Failed to end poll");
      }

      const updated = body.data as Poll;
      setPolls((prev) =>
        prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p))
      );

      toast({
        title: "Poll ended",
        description: "The poll has been marked as ended.",
      });
    } catch (error: unknown) {
      toast({
        title: "Failed to end poll",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while ending the poll.",
        variant: "destructive",
      });
    } finally {
      setEndingPollId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Booth Polls</h1>
          <p className="text-muted-foreground">
            Review existing booth conflict polls and create new polls for
            overlapping vendor requests.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Existing Booth Conflict Polls</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPolls ? (
              <p className="text-muted-foreground">Loading polls...</p>
            ) : pollsError ? (
              <p className="text-red-600">{pollsError}</p>
            ) : polls.length === 0 ? (
              <p className="text-muted-foreground">No polls yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Booth</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {polls.map((poll) => (
                    <TableRow key={poll._id}>
                      <TableCell className="font-medium">
                        {poll.question}
                      </TableCell>
                      <TableCell>
                        {poll.context?.locationPreference || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            poll.isActive
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }
                        >
                          {poll.isActive ? "Active" : "Ended"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ul className="text-sm space-y-1">
                          {poll.options.map((opt) => (
                            <li key={opt._id}>{opt.optionText}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <ul className="text-sm space-y-1">
                          {poll.options.map((opt) => (
                            <li key={opt._id}>
                              <strong>{opt.voteCount ?? 0}</strong>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          if (!poll.options || poll.options.length === 0) {
                            return "-";
                          }
                          const maxVotes = Math.max(
                            ...poll.options.map((o) => o.voteCount ?? 0)
                          );
                          if (maxVotes <= 0) {
                            return "No votes";
                          }
                          const winners = poll.options.filter(
                            (o) => (o.voteCount ?? 0) === maxVotes
                          );
                          return winners.map((w) => w.optionText).join(", ");
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        {poll.isActive && (
                          <Button
                            size="sm"
                            disabled={endingPollId === poll._id}
                            onClick={() => handleEndPoll(poll._id)}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-1 text-xs font-semibold rounded-md"
                          >
                            {endingPollId === poll._id
                              ? "Ending..."
                              : "End Poll"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create New Poll from Pending Booth Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRequests ? (
              <p className="text-muted-foreground">
                Loading vendor requests...
              </p>
            ) : requestsError ? (
              <p className="text-red-600">{requestsError}</p>
            ) : pendingBoothRequests.length === 0 ? (
              <p className="text-muted-foreground">
                There are no pending booth requests available for poll creation.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    Select at least two pending booth requests with the same
                    location to create a poll.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedForPoll.length < 2}
                    onClick={openPollDialog}
                  >
                    Create Poll
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Select</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Booth Size</TableHead>
                      <TableHead>Duration (weeks)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBoothRequests.map((req) => (
                      <TableRow key={req._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedForPoll.includes(req._id)}
                            onCheckedChange={(checked) =>
                              toggleSelectForPoll(req._id, checked)
                            }
                            aria-label="Select request for poll"
                          />
                        </TableCell>
                        <TableCell>
                          {req?.createdBy?.companyName || "Unknown"}
                        </TableCell>
                        <TableCell>{req.locationPreference || "-"}</TableCell>
                        <TableCell>{req.boothSize || "-"}</TableCell>
                        <TableCell>{req.durationWeeks || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create booth conflict poll</DialogTitle>
              <DialogDescription>
                {pollLocation
                  ? `You are about to create a poll for ${pollLocation}.`
                  : "You are about to create a poll for the selected booth requests."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                Selected requests: <strong>{selectedForPoll.length}</strong>
              </p>
              <p>
                This poll will help decide which vendor should get the booth.
                You can end the poll manually later from the Events Office side.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPollDialogOpen(false)}
                disabled={isCreatingPoll}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePoll}
                disabled={isCreatingPoll || selectedForPoll.length < 2}
              >
                {isCreatingPoll ? "Creating..." : "Create Poll"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
