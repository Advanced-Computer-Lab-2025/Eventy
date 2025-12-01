import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Loader2,
  Download,
  CalendarIcon,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface EventStat {
  _id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string; // ✅ Added endDate
  location: string;
  attendeesCount: number;
}

interface ReportData {
  totalAttendees: number;
  totalEvents: number;
  events: EventStat[];
  page: number;
  limit: number;
  totalPages: number;
}

export default function EventsReport() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Filters
  const [name, setEventName] = useState("");
  const [eventType, setEventType] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      // Build query params
      const params = new URLSearchParams();
      if (name.trim()) params.append("name", name.trim());
      if (eventType && eventType !== "all")
        params.append("eventType", eventType);
      if (startDate)
        params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/events/reports/attendees?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch attendees report"
        );
      }

      const data = await response.json();
      setReportData(data.data);
      setError("");
    } catch (err: any) {
      console.error("Error fetching report:", err);
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      toast({
        title: "Failed to fetch report",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [page, eventType, name, startDate, endDate]); // ✅ Added endDate to dependencies

  const handleClearFilters = () => {
    setEventName("");
    setEventType("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const handleExport = async (
    eventId: string,
    eventName: string,
    format: "pdf" | "xlsx"
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/events/export-registered/${eventId}?format=${format}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Use event name for filename, sanitize it for filesystem
      const sanitizedName = eventName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      let filename = `${sanitizedName}-attendees.${format}`;

      // Try to extract filename from Content-Disposition header as fallback
      const contentDisposition = response.headers.get("Content-Disposition");
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
          contentDisposition
        );
        if (matches != null && matches[1]) {
          const headerFilename = matches[1].replace(/['"]/g, "");
          // Only use header filename if it doesn't contain the event ID
          if (!headerFilename.includes(eventId)) {
            filename = headerFilename;
          }
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Event data exported as ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({
        title: "Export failed",
        description: err.message || "Failed to export event data",
        variant: "destructive",
      });
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading report...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {reportData?.totalAttendees || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {reportData?.totalEvents || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError("")}
                  className="ml-2"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 md:grid-cols-5">
            {" "}
            {/* ✅ Changed to 5 columns */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Event Name
              </label>
              <Input
                type="text"
                placeholder="Enter event name..."
                value={name}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Event Type
              </label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="trip">Trip</SelectItem>
                  <SelectItem value="bazaar">Bazaar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="platform_booth">Platform Booth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => (endDate ? date > endDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData?.events && reportData.events.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>{" "}
                      {/* ✅ Added End Date column */}
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">
                        Attendees
                      </TableHead>{" "}
                      {/* ✅ Changed to text-center */}
                      <TableHead className="text-right">Export</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.events.map((event) => (
                      <TableRow key={event._id}>
                        <TableCell className="font-medium">
                          {event.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {event.eventType === "platform_booth"
                            ? "Platform Booth"
                            : event.eventType}
                        </TableCell>
                        <TableCell>
                          {event.startDate
                            ? new Date(event.startDate).toLocaleDateString()
                            : "TBA"}
                        </TableCell>
                        {/* ✅ Added End Date cell */}
                        <TableCell>
                          {event.endDate
                            ? new Date(event.endDate).toLocaleDateString()
                            : "TBA"}
                        </TableCell>
                        <TableCell>{event.location || "N/A"}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {" "}
                          {/* ✅ Changed to text-center */}
                          {event.attendeesCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {event.eventType !== "conference" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleExport(event._id, event.name, "pdf")
                                  }
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Export as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleExport(event._id, event.name, "xlsx")
                                  }
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Export as XLSX
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {reportData.page} of {reportData.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (reportData.totalPages || 1) || loading}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No events found matching the filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
