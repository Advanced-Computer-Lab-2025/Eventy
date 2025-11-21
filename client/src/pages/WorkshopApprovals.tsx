import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Info, Edit } from "lucide-react";

// top-level components (from components folder)
import EventsOfficeHeader from "@/components/EventsOfficeHeader";

// UI primitives (from components/ui)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditRequestDialog, setShowEditRequestDialog] = useState(false);
  const [revisionComments, setRevisionComments] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef<number | null>(null);

  const apiBase =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";

  const faculties = [
    "MET",
    "IET",
    "EMS",
    "Pharmacy & Biotechnology",
    "Dentistry",
    "BI",
    "Management",
    "Applied Arts",
  ];

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
      console.error("Error fetching workshops:", err);
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
    status: string,
    faculty: string,
    search: string = ""
  ) => {
    let filtered = workshops.filter((w) => {
      const statusMatch = status === "all" || w.status === status;
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
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    applyFilters(allWorkshops, newStatus, facultyFilter, searchInput);
  };

  // Handle faculty filter change
  const handleFacultyFilterChange = (newFaculty: string) => {
    setFacultyFilter(newFaculty);
    applyFilters(allWorkshops, statusFilter, newFaculty, searchInput);
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
      console.error(
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
      console.error(
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
      handleStatusFilterChange("needs_revision");
      fetchAllWorkshops();
    } catch (err: any) {
      console.error(
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
          <p className="text-muted-foreground">
            View, filter, and manage workshop approvals
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="mb-2 block text-sm font-medium">
              Search Workshops
            </Label>
            <Input
              id="search"
              placeholder="Search by workshop name or creator..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <Label
              htmlFor="faculty-filter"
              className="mb-2 block text-sm font-medium"
            >
              Filter by Faculty
            </Label>
            <Select
              value={facultyFilter}
              onValueChange={handleFacultyFilterChange}
            >
              <SelectTrigger id="faculty-filter">
                <SelectValue placeholder="Select Faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculties</SelectItem>
                {faculties
                  .filter(
                    (faculty): faculty is string => typeof faculty === "string"
                  )
                  .map((faculty) => (
                    <SelectItem key={faculty} value={faculty}>
                      {faculty}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={statusFilter} onValueChange={handleStatusFilterChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="needs_revision">Requested Edits</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {statusFilter === "all"
                    ? "All Workshops"
                    : statusFilter === "needs_revision"
                      ? "Workshops with Requested Edits"
                      : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Workshops`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredWorkshops.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No {statusFilter === "all" ? "" : statusFilter} workshops
                    found.
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
                              variant={
                                workshop.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                              }
                              className={
                                workshop.status === "approved"
                                  ? "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-700 text-white border-0"
                                  : workshop.status === "needs_revision"
                                    ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                                    : ""
                              }
                            >
                              {workshop.status === "needs_revision"
                                ? "edits requested"
                                : workshop.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                                onClick={() => handleViewDetails(workshop)}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                              {workshop.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                    onClick={() => handleApprove(workshop._id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                                    onClick={() => handleReject(workshop._id)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
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
          </TabsContent>
        </Tabs>
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
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                onClick={() => handleApprove(selectedWorkshop._id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                onClick={() => handleReject(selectedWorkshop._id)}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button
                variant="outline"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
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
