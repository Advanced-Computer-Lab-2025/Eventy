import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Info,
  Edit,
  SlidersHorizontal,
  Building2,
  Search,
} from "lucide-react";

// top-level components (from components folder)
import EventsOfficeHeader from "@/components/EventsOfficeHeader";

// UI primitives (from components/ui)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WorkshopApprovals() {
  const [allWorkshops, setAllWorkshops] = useState<any[]>([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]);
  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditRequestDialog, setShowEditRequestDialog] = useState(false);
  const [revisionComments, setRevisionComments] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef<number | null>(null);

  const apiBase =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";

  // Compute unique faculties dynamically from workshops data
  const facultyOptions = useMemo(() => {
    const uniqueFaculties = new Set<string>();
    allWorkshops.forEach((workshop) => {
      if (workshop.faculty) {
        uniqueFaculties.add(workshop.faculty);
      }
    });
    return Array.from(uniqueFaculties).sort();
  }, [allWorkshops]);

  // Fetch all workshops
  const fetchAllWorkshops = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAllWorkshops([]);
        setFilteredWorkshops([]);
        setLoading(false);
        return;
      }

      const url = `${apiBase}/api/events/allworkshops`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const workshops = res.data?.data ?? res.data ?? [];
      setAllWorkshops(workshops);
      applyFilters(workshops, statusFilter, facultyFilter);
    } catch (err: any) {
      logger.error("Error fetching workshops:", err);
      setAllWorkshops([]);
      setFilteredWorkshops([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side search
  const performSearch = (query: string, workshopsToSearch: any[]) => {
    if (!query.trim()) {
      return workshopsToSearch;
    }

    const lowerQuery = query.toLowerCase();
    return workshopsToSearch.filter((w) => {
      const nameMatch = w.name?.toLowerCase().includes(lowerQuery);
      const creatorMatch =
        `${w.createdBy?.firstName || ""} ${w.createdBy?.lastName || ""}`
          .toLowerCase()
          .includes(lowerQuery);
      return nameMatch || creatorMatch;
    });
  };

  // Apply status, faculty filters, and search to workshops
  const applyFilters = (
    workshops: any[],
    statuses: string[],
    faculty: string,
    search: string = ""
  ) => {
    let filtered = workshops.filter((w) => {
      const statusMatch =
        statuses.includes("all") || statuses.includes(w.status);
      const facultyMatch = faculty === "all" || w.faculty === faculty;
      return statusMatch && facultyMatch;
    });

    // Apply search filter
    if (search.trim()) {
      filtered = performSearch(search, filtered);
    }

    setFilteredWorkshops(filtered);
  };

  // Initial load
  useEffect(() => {
    fetchAllWorkshops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search - applies search on top of existing filters
  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = window.setTimeout(() => {
      applyFilters(allWorkshops, statusFilter, facultyFilter, searchInput);
    }, 500);

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, allWorkshops, statusFilter, facultyFilter]);

  // Handle status filter change
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    let newStatuses: string[];

    if (status === "all") {
      newStatuses = checked ? ["all"] : [];
    } else {
      if (checked) {
        // Remove "all" if it exists and add the new status
        newStatuses = statusFilter.filter((s) => s !== "all").concat(status);
      } else {
        // Remove the status
        newStatuses = statusFilter.filter((s) => s !== status);
        // If no statuses selected, default to "all"
        if (newStatuses.length === 0) {
          newStatuses = ["all"];
        }
      }
    }

    setStatusFilter(newStatuses);
    applyFilters(allWorkshops, newStatuses, facultyFilter, searchInput);
  };

  // Handle faculty filter change
  const handleFacultyFilterChange = (faculty: string) => {
    setFacultyFilter(faculty);
    applyFilters(allWorkshops, statusFilter, faculty, searchInput);
  };

  // Approve workshop
  const handleApprove = async (workshopId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${apiBase}/api/events/${workshopId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDetailsDialog(false);
      fetchAllWorkshops();
    } catch (err: any) {
      logger.error(
        "Error approving workshop:",
        err.response?.data || err.message
      );
      alert("❌ Failed to approve workshop");
    }
  };

  // Reject workshop
  const handleReject = async (workshopId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${apiBase}/api/events/${workshopId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDetailsDialog(false);
      fetchAllWorkshops();
    } catch (err: any) {
      logger.error(
        "Error rejecting workshop:",
        err.response?.data || err.message
      );
      alert("❌ Failed to reject workshop");
    }
  };

  // Request edits
  const handleRequestEdits = async () => {
    if (!revisionComments.trim()) {
      alert("⚠️ Please provide comments for the edit request");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${apiBase}/api/events/${selectedWorkshop._id}/request-edits`,
        { revisionComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditRequestDialog(false);
      setShowDetailsDialog(false);
      setRevisionComments("");
      setStatusFilter(["needs_revision"]);
      fetchAllWorkshops();
    } catch (err: any) {
      logger.error(
        "Error requesting edits:",
        err.response?.data || err.message
      );
      alert("❌ Failed to request edits");
    }
  };

  // View details
  const handleViewDetails = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setShowDetailsDialog(true);
  };

  const openEditRequestDialog = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setShowEditRequestDialog(true);
  };

  if (loading && allWorkshops.length === 0)
    return <p className="p-8">Loading workshops...</p>;

  return (
    <div className="min-h-screen bg-background">
      <EventsOfficeHeader />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Workshop Management</h1>
          <p className="text-muted-foreground m-0">
            View, filter, and manage workshop approvals
          </p>
        </div>

        {/* Sidebar Layout with Filters */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-32">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Status</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="status-all"
                          checked={statusFilter.includes("all")}
                          onCheckedChange={(checked) =>
                            handleStatusFilterChange("all", checked as boolean)
                          }
                        />
                        <Label
                          htmlFor="status-all"
                          className="cursor-pointer text-sm"
                        >
                          All
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="status-pending"
                          checked={statusFilter.includes("pending")}
                          onCheckedChange={(checked) =>
                            handleStatusFilterChange(
                              "pending",
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor="status-pending"
                          className="cursor-pointer text-sm"
                        >
                          Pending
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="status-approved"
                          checked={statusFilter.includes("approved")}
                          onCheckedChange={(checked) =>
                            handleStatusFilterChange(
                              "approved",
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor="status-approved"
                          className="cursor-pointer text-sm"
                        >
                          Approved
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="status-rejected"
                          checked={statusFilter.includes("rejected")}
                          onCheckedChange={(checked) =>
                            handleStatusFilterChange(
                              "rejected",
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor="status-rejected"
                          className="cursor-pointer text-sm"
                        >
                          Rejected
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="status-needs_revision"
                          checked={statusFilter.includes("needs_revision")}
                          onCheckedChange={(checked) =>
                            handleStatusFilterChange(
                              "needs_revision",
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor="status-needs_revision"
                          className="cursor-pointer text-sm"
                        >
                          Requested Edits
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Faculty Filter */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Building2 className="h-4 w-4" />
                      Faculty
                    </div>
                    <Select
                      value={facultyFilter}
                      onValueChange={handleFacultyFilterChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Faculties</SelectItem>
                        {facultyOptions.map((faculty) => (
                          <SelectItem key={faculty} value={faculty}>
                            {faculty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStatusFilter(["all"]);
                      setFacultyFilter("all");
                      setSearchInput("");
                      applyFilters(allWorkshops, ["all"], "all", "");
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Right Content - Workshops Table */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  Workshops{" "}
                  {filteredWorkshops.length > 0 &&
                    `(${filteredWorkshops.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by workshop name or creator..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                {/* Workshops Table */}
                {loading ? (
                  <p className="text-muted-foreground text-center py-6">
                    Loading workshops...
                  </p>
                ) : filteredWorkshops.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No workshops found.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorkshops.map((workshop) => (
                        <TableRow key={workshop._id}>
                          <TableCell className="font-medium">
                            {workshop.name}
                          </TableCell>
                          <TableCell>{workshop.faculty}</TableCell>
                          <TableCell>
                            {new Date(workshop.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(workshop.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {workshop.requiredBudget || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                workshop.status === "approved"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : workshop.status === "rejected"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : workshop.status === "needs_revision"
                                      ? "bg-orange-100 text-orange-700 border-orange-200"
                                      : workshop.status === "archived"
                                        ? "bg-blue-100 text-blue-700 border-blue-200"
                                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }
                            >
                              {workshop.status === "approved"
                                ? "Approved"
                                : workshop.status === "rejected"
                                  ? "Rejected"
                                  : workshop.status === "needs_revision"
                                    ? "Needs Revision"
                                    : workshop.status === "archived"
                                      ? "Archived"
                                      : workshop.status === "pending"
                                        ? "Pending"
                                        : workshop.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(workshop)}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                              {workshop.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleApprove(workshop._id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(workshop._id)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                                    onClick={() =>
                                      openEditRequestDialog(workshop)
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
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
          </div>
        </div>
      </main>

      {/* Workshop Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWorkshop?.name}</DialogTitle>
            <DialogDescription>
              Detailed information about the selected workshop
            </DialogDescription>
          </DialogHeader>

          {selectedWorkshop && (
            <div className="space-y-3">
              <p>
                <strong>Faculty:</strong> {selectedWorkshop.faculty}
              </p>
              <p>
                <strong>Description:</strong> {selectedWorkshop.description}
              </p>
              <p>
                <strong>Location:</strong> {selectedWorkshop.location}
              </p>
              <p>
                <strong>Start:</strong>{" "}
                {new Date(selectedWorkshop.startDate).toLocaleString()}
              </p>
              <p>
                <strong>End:</strong>{" "}
                {new Date(selectedWorkshop.endDate).toLocaleString()}
              </p>
              <p>
                <strong>Budget:</strong> {selectedWorkshop.requiredBudget}
              </p>
              <p>
                <strong>Funding:</strong> {selectedWorkshop.fundingSource}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedWorkshop.status === "needs_revision"
                  ? "Edits Requested"
                  : selectedWorkshop.status}
              </p>
              <p>
                <strong>Created By:</strong>{" "}
                {selectedWorkshop.createdBy?.firstName}{" "}
                {selectedWorkshop.createdBy?.lastName}
              </p>
              {selectedWorkshop.professors &&
                selectedWorkshop.professors.length > 0 && (
                  <div>
                    <strong>Participating Professors:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {selectedWorkshop.professors.map((prof: any) => (
                        <li key={prof._id}>
                          {prof.firstName} {prof.lastName} ({prof.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              {selectedWorkshop.revisionComments && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p>
                    <strong>Revision Comments:</strong>
                  </p>
                  <p className="mt-1 text-sm">
                    {selectedWorkshop.revisionComments}
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedWorkshop?.status === "pending" && (
            <DialogFooter className="flex justify-end gap-3 mt-4">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(selectedWorkshop._id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(selectedWorkshop._id)}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button
                variant="outline"
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                onClick={() => {
                  setShowDetailsDialog(false);
                  setShowEditRequestDialog(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Request Edits
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Edits Dialog */}
      <Dialog
        open={showEditRequestDialog}
        onOpenChange={setShowEditRequestDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Edits</DialogTitle>
            <DialogDescription>
              Specify what needs to be edited in this workshop
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="revision-comments">Edit Requirements</Label>
              <Textarea
                id="revision-comments"
                placeholder="Please describe what changes are needed..."
                value={revisionComments}
                onChange={(e) => setRevisionComments(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditRequestDialog(false);
                setRevisionComments("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestEdits}>
              <Edit className="mr-2 h-4 w-4" /> Send Edit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
