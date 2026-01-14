import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Info,
  Edit,
  SlidersHorizontal,
  Building2,
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  AlignLeft,
  DollarSign,
  Landmark,
  GraduationCap,
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
import { logger } from "@/lib/logger";
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
import { getApiBaseUrl } from "@/lib/apiBase";

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

  const apiBase = useMemo(() => getApiBaseUrl(), []);

  const statusFilterRef = useRef(statusFilter);
  const facultyFilterRef = useRef(facultyFilter);

  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  useEffect(() => {
    facultyFilterRef.current = facultyFilter;
  }, [facultyFilter]);

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

  // Client-side search
  const performSearch = useCallback(
    (query: string, workshopsToSearch: any[]) => {
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
    },
    []
  );

  // Apply status, faculty filters, and search to workshops
  const applyFilters = useCallback(
    (
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
    },
    [performSearch]
  );

  // Fetch all workshops
  const fetchAllWorkshops = useCallback(async () => {
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
      applyFilters(
        workshops,
        statusFilterRef.current,
        facultyFilterRef.current
      );
    } catch (err: any) {
      logger.error("Error fetching workshops:", err);
      setAllWorkshops([]);
      setFilteredWorkshops([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, applyFilters]);

  // Initial load
  useEffect(() => {
    fetchAllWorkshops();
  }, [fetchAllWorkshops]);

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
  }, [searchInput, allWorkshops, statusFilter, facultyFilter, applyFilters]);

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

  const formatWorkshopDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatWorkshopTime = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const startDateStr = selectedWorkshop
    ? formatWorkshopDate(selectedWorkshop.startDate)
    : "";
  const endDateStr = selectedWorkshop
    ? formatWorkshopDate(selectedWorkshop.endDate)
    : "";
  const formatStringTime = (timeStr?: string) => {
    if (!timeStr) return null;
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hoursStr, minutesStr] = timeStr.split(":");
      let hours = parseInt(hoursStr, 10);
      const suffix = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutesStr} ${suffix}`;
    }
    return timeStr;
  };

  const startTimeStr = selectedWorkshop
    ? formatStringTime(selectedWorkshop.startTime) ||
      (selectedWorkshop.startDate
        ? formatWorkshopTime(selectedWorkshop.startDate)
        : "")
    : "";
  const endTimeStr = selectedWorkshop
    ? formatStringTime(selectedWorkshop.endTime) ||
      (selectedWorkshop.endDate
        ? formatWorkshopTime(selectedWorkshop.endDate)
        : "")
    : "";

  if (loading && allWorkshops.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <EventsOfficeHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading workshops...</div>
        </div>
      </div>
    );
  }

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
                <CardTitle>Workshops </CardTitle>
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
                                  ? "bg-green-100 text-green-700 border-green-200/50 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
                                  : workshop.status === "rejected"
                                    ? "bg-red-100 text-red-700 border-red-200/50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                                    : workshop.status === "needs_revision"
                                      ? "bg-orange-100 text-orange-700 border-orange-200/50 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50"
                                      : workshop.status === "archived"
                                        ? "bg-blue-100 text-blue-700 border-blue-200/50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50"
                                        : "bg-yellow-100 text-yellow-800 border-yellow-200/50 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50"
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
                                    className="bg-green-600 hover:bg-green-700 text-white focus-visible:ring-0 focus:outline-none border-0"
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
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-background text-foreground border-border shadow-2xl">
          {selectedWorkshop && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="relative p-6 pb-2 shrink-0">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-1 pr-12">
                  <div className="flex flex-wrap items-center gap-3">
                    <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight">
                      {selectedWorkshop?.name}
                    </DialogTitle>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={
                          selectedWorkshop.status === "approved"
                            ? "bg-green-100 text-green-800 border-green-200/50 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
                            : selectedWorkshop.status === "rejected"
                              ? "bg-red-100 text-red-800 border-red-200/50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                              : selectedWorkshop.status === "archived"
                                ? "bg-blue-100 text-blue-700 border-blue-200/50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50"
                                : selectedWorkshop.status === "needs_revision"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200/50 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200/50 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50"
                        }
                      >
                        {selectedWorkshop.status === "approved"
                          ? "Approved"
                          : selectedWorkshop.status === "rejected"
                            ? "Rejected"
                            : selectedWorkshop.status === "archived"
                              ? "Archived"
                              : selectedWorkshop.status === "needs_revision"
                                ? "Needs Revision"
                                : selectedWorkshop.status === "pending"
                                  ? "Pending"
                                  : selectedWorkshop.status}
                      </Badge>
                    </div>
                  </div>

                  {selectedWorkshop.location && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{selectedWorkshop.location}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div
                className="
                  overflow-y-auto p-6 pt-2 space-y-6 pr-4
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-gray-200
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  dark:[&::-webkit-scrollbar-thumb]:bg-[#6A33B8]/10
                  dark:[&::-webkit-scrollbar-thumb]:hover:bg-[#6A33B8]/40
                  transition-colors
                "
              >
                {/* Dates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {startDateStr && (
                    <div className="flex flex-col p-3 rounded-xl bg-purple-50/50 dark:bg-[#130F19] border border-purple-100 dark:border-[#6A33B8]/20">
                      <span className="text-xs font-semibold uppercase text-[#6A33B8] dark:text-[#D6BCFA] mb-1">
                        Start
                      </span>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-purple-50">
                        <Calendar className="w-4 h-4 opacity-70" />
                        {startDateStr}
                      </div>
                      {startTimeStr && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-purple-200/60 mt-0.5">
                          <Clock className="w-4 h-4 opacity-70" />
                          {startTimeStr}
                        </div>
                      )}
                    </div>
                  )}

                  {endDateStr && (
                    <div className="flex flex-col p-3 rounded-xl bg-purple-50/50 dark:bg-[#130F19] border border-purple-100 dark:border-[#6A33B8]/20">
                      <span className="text-xs font-semibold uppercase text-[#6A33B8] dark:text-[#D6BCFA] mb-1">
                        End
                      </span>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-purple-50">
                        <Calendar className="w-4 h-4 opacity-70" />
                        {endDateStr}
                      </div>
                      {endTimeStr && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-purple-200/60 mt-0.5">
                          <Clock className="w-4 h-4 opacity-70" />
                          {endTimeStr}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-purple-100">
                    <AlignLeft className="w-4 h-4 text-primary" /> Description
                  </h4>
                  <div className="text-sm leading-relaxed text-slate-600 dark:text-purple-200/80">
                    {selectedWorkshop.description || "No description provided."}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedWorkshop.faculty && (
                    <WorkshopDetailCard
                      icon={GraduationCap}
                      label="Faculty"
                      value={String(selectedWorkshop.faculty)}
                    />
                  )}

                  {selectedWorkshop.location && (
                    <WorkshopDetailCard
                      icon={MapPin}
                      label="Location"
                      value={String(selectedWorkshop.location)}
                    />
                  )}

                  {selectedWorkshop.requiredBudget !== undefined &&
                    selectedWorkshop.requiredBudget !== null && (
                      <WorkshopDetailCard
                        icon={DollarSign}
                        label="Budget"
                        value={`$${String(selectedWorkshop.requiredBudget)}`}
                      />
                    )}

                  {selectedWorkshop.fundingSource && (
                    <WorkshopDetailCard
                      icon={Landmark}
                      label="Funding"
                      value={String(selectedWorkshop.fundingSource)}
                    />
                  )}

                  {(selectedWorkshop.createdBy?.firstName ||
                    selectedWorkshop.createdBy?.lastName) && (
                    <WorkshopDetailCard
                      icon={User}
                      label="Created By"
                      value={`${selectedWorkshop.createdBy?.firstName || ""} ${selectedWorkshop.createdBy?.lastName || ""}`.trim()}
                      className="sm:col-span-2"
                    />
                  )}
                </div>

                {/* Professors */}
                {selectedWorkshop.professors &&
                  selectedWorkshop.professors.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-purple-100 mb-3">
                        Participating Professors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkshop.professors.map((prof: any) => (
                          <div
                            key={prof._id}
                            className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#130F19] border border-slate-200 dark:border-[#6A33B8]/30 text-sm transition-colors hover:bg-slate-200 dark:hover:border-[#6A33B8]/60"
                          >
                            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-[#6A33B8]/20 text-purple-600 dark:text-[#D6BCFA] flex items-center justify-center">
                              <User size={12} />
                            </div>
                            <span className="text-slate-700 dark:text-purple-100">
                              {prof.firstName} {prof.lastName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Revision Comments */}
                {selectedWorkshop.revisionComments && (
                  <div className="bg-slate-50 dark:bg-[#130F19] rounded-xl p-4 border border-slate-200 dark:border-[#6A33B8]/20">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-purple-100 mb-2">
                      Revision Comments
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-purple-200/80 whitespace-pre-wrap">
                      {selectedWorkshop.revisionComments}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedWorkshop?.status === "pending" && (
                <DialogFooter className="flex justify-end gap-3 p-6 pt-0 shrink-0">
                  <Button
                    className="bg-green-600 hover:bg-green-700 focus-visible:ring-0 focus:outline-none border-0"
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
            </div>
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

function WorkshopDetailCard({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: any;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-[#6A33B8]/20 bg-slate-50/50 dark:bg-[#130F19] ${className}`}
    >
      <div className="p-2 rounded-lg bg-purple-100 dark:bg-[#6A33B8]/20 text-[#6A33B8] dark:text-[#D6BCFA] shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-purple-300/60 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-900 dark:text-purple-50 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}
