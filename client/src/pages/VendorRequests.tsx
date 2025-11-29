import { CheckCircle, XCircle, Eye, Plus, Filter } from "lucide-react";
import Header from "@/components/Header";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";

async function updateVendorStatus(
  requestId: string,
  status: "approved" | "rejected",
  token: string | null
) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  try {
    const response = await fetch(
      `http://localhost:4000/api/applications/${requestId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    // CRITICAL FIX 1: Check Content-Type header before trying to parse the body.
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      // Throw an informative error if the server didn't return JSON.
      throw new Error(
        `Server Error: Expected JSON, but received non-JSON (Status: ${response.status}). Preview: ${text.substring(0, 50)}...`
      );
    }

    // CRITICAL FIX 2: Only parse JSON if we know it's JSON.
    const data = await response.json();

    // CRITICAL FIX 3: Check response status after successfully parsing the body.
    if (!response.ok) {
      throw new Error(data.message || "Failed to update status");
    }

    return data.data; // updated application
  } catch (err: unknown) {
    console.error(err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to update status";
    throw new Error(errorMessage);
  }
}

interface VendorRequest {
  _id: string;
  type: "bazaar" | "booth";
  status: "pending" | "approved" | "rejected" | "cancelled";
  boothSize: "2x2" | "4x4";
  durationWeeks?: number;
  locationPreference?: string;
  createdAt: string;
  attendees: Array<{ name: string; email: string }>;
  event?:
    | {
        _id: string;
        name: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        location?: string;
      }
    | string;
  createdBy?: {
    companyName?: string;
    email?: string;
    companyLogoUrl?: string;
    taxCardUrl?: string;
  };
}

//todo: remove mock functionality
// const vendorRequests = [
//   {
//     id: "1",
//     company: "Tech Solutions Co.",
//     bazaar: "Spring Festival Bazaar",
//     boothSize: "4x4",
//     attendees: 3,
//     status: "pending",
//   },
//   {
//     id: "2",
//     company: "Food Delights",
//     bazaar: "Summer Market",
//     boothSize: "2x2",
//     attendees: 2,
//     status: "pending",
//   },
// ];

export default function VendorRequests() {
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<VendorRequest | null>(null);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Initialize token and userRole on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        setUserRole(payload?.role || null);
      } catch (err) {
        console.error("Failed to decode token:", err);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    if (!token) return; // Wait for token to be loaded

    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://localhost:4000/api/applications`, {
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
            `Server Error: Expected JSON, got non-JSON (Status: ${res.status}). Preview: ${text.substring(0, 50)}...`
          );
        }

        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.message || "Failed to fetch applications");
        }

        const apps = Array.isArray(body.data) ? body.data : [];
        setRequests(apps);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load applications"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [token]);

  // Helper function to get event name from request
  const getEventName = (request: VendorRequest): string => {
    // If event is populated (object with name property)
    if (
      request?.event &&
      typeof request.event === "object" &&
      request.event.name
    ) {
      return request.event.name;
    }
    // If event is just an ID string or null/undefined, return N/A
    return "N/A";
  };

  const handleApprove = async (requestId: string) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication token is missing.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const updatedApp = await updateVendorStatus(requestId, "approved", token);
      if (updatedApp) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === requestId ? { ...r, status: "approved" } : r
          )
        );
        toast({
          title: "Request approved",
          description: "The vendor request has been approved.",
        });
        return updatedApp;
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to approve the request.",
        variant: "destructive",
      });
    }
    return null;
  };

  const handleReject = async (requestId: string) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication token is missing.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const updatedApp = await updateVendorStatus(requestId, "rejected", token);
      if (updatedApp) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === requestId ? { ...r, status: "rejected" } : r
          )
        );
        toast({
          title: "Request rejected",
          description: "The vendor request has been rejected.",
          variant: "destructive",
        });
        return updatedApp;
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reject the request.",
        variant: "destructive",
      });
    }
    return null;
  };

  const handleGoToPolls = () => {
    setLocation("/events-office/polls");
  };

  const handleViewDocuments = (requestId: string) => {
    const req = requests.find((r) => r._id === requestId);
    setSelected(req || null);
    setDetailsOpen(!!req);
  };

  return (
    <div className="min-h-screen bg-background">
      {userRole === "admin" ? (
        <AdminHeader />
      ) : userRole === "events_office" ? (
        <EventsOfficeHeader />
      ) : (
        <Header />
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Vendor Requests</h1>
            <p className="text-muted-foreground">
              Review vendor participation requests for bazaars and booths
            </p>
          </div>
          <div className="flex flex-row gap-2 items-center">
            {userRole === "events_office" && (
              <Button
                onClick={handleGoToPolls}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 text-xs sm:text-sm font-semibold rounded-md shadow-sm whitespace-nowrap"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create Poll
              </Button>
            )}
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(
                  v as "all" | "pending" | "approved" | "rejected"
                )
              }
            >
              <SelectTrigger className="h-auto px-4 py-2 text-xs sm:text-sm font-semibold rounded-md shadow-sm whitespace-nowrap border border-input bg-background hover:bg-accent hover:text-accent-foreground w-auto">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4 flex-shrink-0" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading requests...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Booth Size</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(statusFilter === "all"
                    ? requests
                    : requests.filter((r) => r.status === statusFilter)
                  ).map((request) => (
                    <TableRow
                      key={request._id}
                      data-testid={`row-request-${request._id}`}
                    >
                      <TableCell className="font-medium">
                        {request?.createdBy?.companyName || "Unknown"}
                      </TableCell>
                      <TableCell>{getEventName(request)}</TableCell>
                      <TableCell>{request?.boothSize || "-"}</TableCell>
                      <TableCell>
                        {Array.isArray(request?.attendees)
                          ? request.attendees.length
                          : 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            request.status === "approved"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {request.status?.charAt(0).toUpperCase() +
                            request.status?.slice(1)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocuments(request._id)}
                            data-testid={`button-view-${request._id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApprove(request._id)}
                                data-testid={`button-approve-${request._id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request._id)}
                                data-testid={`button-reject-${request._id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Review vendor participation request details
              </DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  {selected?.createdBy?.companyLogoUrl ? (
                    <img
                      src={selected.createdBy.companyLogoUrl}
                      alt="Company Logo"
                      className="w-12 h-12 rounded border object-cover"
                    />
                  ) : null}
                  <div>
                    <div className="font-medium">Company</div>
                    <div>{selected?.createdBy?.companyName || "Unknown"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Event</div>
                    <div>{getEventName(selected)}</div>
                  </div>
                  <div>
                    <div className="font-medium">Type</div>
                    <div className="capitalize">{selected?.type || "-"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Booth Size</div>
                    <div>{selected?.boothSize || "-"}</div>
                  </div>
                  <div>
                    <div className="font-medium">Status</div>
                    <div>
                      <Badge
                        variant="outline"
                        className={
                          selected?.status === "approved"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : selected?.status === "rejected"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }
                      >
                        {selected?.status?.charAt(0).toUpperCase() +
                          selected?.status?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Company Email</div>
                    <div>{selected?.createdBy?.email || "-"}</div>
                  </div>
                  <div>
                    <div className="font-medium">Created At</div>
                    <div>
                      {selected?.createdAt
                        ? new Date(selected.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Company Logo</div>
                    {selected?.createdBy?.companyLogoUrl ? (
                      <a
                        className="text-primary underline"
                        href={selected.createdBy.companyLogoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Logo
                      </a>
                    ) : (
                      <div>-</div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">Tax Card</div>
                    {selected?.createdBy?.taxCardUrl ? (
                      <a
                        className="text-primary underline"
                        href={selected.createdBy.taxCardUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Document
                      </a>
                    ) : (
                      <div>-</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">Attendees</div>
                  {Array.isArray(selected?.attendees) &&
                  selected.attendees.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {selected.attendees.map((a) => (
                        <li key={`${a.name}-${a.email}`}>
                          {a.name} — {a.email}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>-</div>
                  )}
                </div>
                {selected?.status === "pending" && (
                  <DialogFooter>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        const updatedApp = await handleApprove(selected._id);
                        if (updatedApp) {
                          setSelected({ ...selected, status: "approved" });
                          setDetailsOpen(false);
                        }
                      }}
                      data-testid={`dialog-approve-${selected._id}`}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        const updatedApp = await handleReject(selected._id);
                        if (updatedApp) {
                          setSelected({ ...selected, status: "rejected" });
                          setDetailsOpen(false);
                        }
                      }}
                      data-testid={`dialog-reject-${selected._id}`}
                    >
                      Reject
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
