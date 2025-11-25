import { useEffect, useState } from "react";
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
import { Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface EventSale {
  _id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  price: number | null;
  attendeesCount: number;
  revenue: number;
  totalRevenue: number;
  grossRevenue: number;
  totalRefunds: number;
  walletPayments: number;
  cardPayments: number;
  transactionCount: number;
}

interface SalesReportData {
  totalEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  grossRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  paymentBreakdown: {
    wallet: number;
    card: number;
  };
  page: number;
  limit: number;
  totalPages: number;
  events: EventSale[];
}

export default function SalesReport() {
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [eventType, setEventType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      // Build query params
      const params = new URLSearchParams();

      // Only add eventType if it's not "all"
      if (eventType && eventType !== "all") {
        params.append("eventType", eventType);
      }

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      params.append("sortOrder", sortOrder);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/events/reports/sales?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch sales report");
      }

      const data = await response.json();
      setReportData(data.data);
    } catch (err: any) {
      console.error("Error fetching report:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [page, eventType, startDate, endDate, sortOrder]);

  const handleClearFilters = () => {
    setEventType("all");
    setStartDate("");
    setEndDate("");
    setSortOrder("desc");
    setPage(1);
  };
  const exportToCSV = async () => {
    if (!reportData) return;

    try {
      setExporting(true);
      const token = localStorage.getItem("token");

      // Build query params for fetching ALL data (no pagination)
      const params = new URLSearchParams();

      if (eventType && eventType !== "all") {
        params.append("eventType", eventType);
      }

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      params.append("sortOrder", sortOrder);
      params.append("page", "1");
      params.append("limit", "999999"); // Get all results

      const response = await fetch(
        `${API_BASE_URL}/api/events/reports/sales?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch complete data for export");
      }

      const data = await response.json();
      const allEvents = data.data.events;

      if (!allEvents || allEvents.length === 0) {
        throw new Error("No data to export");
      }

      const headers = [
        "Event Name",
        "Type",
        "Start Date",
        "End Date",
        "Transactions",
        "Gross Revenue",
        "Refunds",
        "Net Revenue",
        "Wallet Payments",
        "Card Payments",
      ];

      const formatDateForExcel = (dateString: string) => {
        if (!dateString) return "TBA";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "TBA";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const rows = allEvents.map((event: EventSale) => ({
        "Event Name": event.name,
        Type: event.eventType,
        "Start Date": formatDateForExcel(event.startDate),
        "End Date": formatDateForExcel(event.endDate),
        Transactions: event.transactionCount || 0,
        "Gross Revenue": (event.grossRevenue || 0).toFixed(2),
        Refunds: (event.totalRefunds || 0).toFixed(2),
        "Net Revenue": (event.totalRevenue || 0).toFixed(2),
        "Wallet Payments": (event.walletPayments || 0).toFixed(2),
        "Card Payments": (event.cardPayments || 0).toFixed(2),
      }));

      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Set column widths
      const columnWidths = [
        { wch: 30 }, // Event Name
        { wch: 15 }, // Type
        { wch: 12 }, // Start Date
        { wch: 12 }, // End Date
        { wch: 12 }, // Transactions
        { wch: 15 }, // Gross Revenue
        { wch: 12 }, // Refunds
        { wch: 15 }, // Net Revenue
        { wch: 15 }, // Wallet Payments
        { wch: 15 }, // Card Payments
      ];
      worksheet["!cols"] = columnWidths;

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

      // Generate Excel file and download
      XLSX.writeFile(
        workbook,
        `sales-report-${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (err: any) {
      console.error("Export failed:", err);
      alert(`Export failed: ${err.message || "Please try again."}`);
    } finally {
      setExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading report...</span>
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <Card className="mt-6">
        <CardContent className="text-center py-8">
          <p className="text-red-500 font-semibold mb-2">
            Failed to Load Sales Report
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchReport} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {reportData?.totalEvents || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {reportData?.totalAttendees || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(reportData?.grossRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {formatCurrency(reportData?.totalRefunds || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">
              {formatCurrency(reportData?.netRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Wallet:{" "}
                {formatCurrency(reportData?.paymentBreakdown?.wallet || 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Card: {formatCurrency(reportData?.paymentBreakdown?.card || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filters</CardTitle>
          <Button
            variant="default"
            size="sm"
            onClick={exportToCSV}
            className="gap-2"
            disabled={exporting || !reportData?.events?.length}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="trip">Trip</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="bazaar">Bazaar</SelectItem>
                  <SelectItem value="platform_booth">Platform Booth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Events Starting From
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue by Event</CardTitle>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by Revenue:</label>
            <Select
              value={sortOrder}
              onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Greatest to Least</SelectItem>
                <SelectItem value="asc">Least to Greatest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {reportData?.events && reportData.events.length > 0 ? (
            <>
              <div className="overflow-x-auto relative">
                {loading && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-center">
                        Transactions
                      </TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Refunds</TableHead>
                      <TableHead className="text-right">Net Revenue</TableHead>
                      <TableHead className="text-right">Wallet</TableHead>
                      <TableHead className="text-right">Card</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.events.map((event) => (
                      <TableRow key={event._id}>
                        <TableCell className="font-medium">
                          {event.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {event.eventType}
                        </TableCell>
                        <TableCell>
                          {event.startDate
                            ? new Date(event.startDate).toLocaleDateString()
                            : "TBA"}
                        </TableCell>
                        <TableCell>
                          {event.endDate
                            ? new Date(event.endDate).toLocaleDateString()
                            : "TBA"}
                        </TableCell>
                        <TableCell className="text-center">
                          {event.transactionCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(event.grossRevenue || 0)}
                        </TableCell>
                        <TableCell className="text-right text-red-500">
                          {event.totalRefunds > 0
                            ? formatCurrency(event.totalRefunds)
                            : "$0.00"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-500">
                          {formatCurrency(event.totalRevenue || 0)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(event.walletPayments || 0)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(event.cardPayments || 0)}
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
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">
                {loading ? "Loading sales data..." : "No sales data found"}
              </p>
              {!loading && (eventType !== "all" || startDate || endDate) && (
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your filters or clearing them to see more
                  results.
                </p>
              )}
              {!loading && eventType === "all" && !startDate && !endDate && (
                <p className="text-sm text-muted-foreground">
                  No events with sales data available yet.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
