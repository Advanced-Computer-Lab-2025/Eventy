import { useState, useEffect } from "react";
import {
  Store,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Trash2,
  MapPin,
  FolderOpen,
  AlertCircle,
  Users,
  Target,
  CreditCard,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import VendorHeader from "@/components/VendorHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import BazaarList from "@/components/BazaarList";
import VendorApplicationDialog from "@/components/VendorApplicationDialog";
import PlatformMap from "@/components/PlatformMap";
import BoothApplicationDialog from "@/components/BoothApplicationDialog";
import ApplicationPaymentDialog from "@/components/ApplicationPaymentDialog";
import StatCard from "@/components/StatCard";
import IdUploadButton from "@/components/IdUploadButton";
import { bazaarApiService, Application, Bazaar } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Attendee {
  name: string;
  email: string;
  individualID?: string;
}

export default function VendorDashboard() {
  const [location, setLocation] = useLocation();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedBazaar, setSelectedBazaar] = useState<Bazaar | null>(null);
  const [upcomingBazaars, setUpcomingBazaars] = useState<Bazaar[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Application[]>(
    []
  );
  const [rejectedApplications, setRejectedApplications] = useState<
    Application[]
  >([]);
  const [approvedApplications, setApprovedApplications] = useState<
    Application[]
  >([]);
  const [cancelledApplications, setCancelledApplications] = useState<
    Application[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Platform booth form state
  const [platformBoothAttendees, setPlatformBoothAttendees] = useState<
    Attendee[]
  >([{ name: "", email: "" }]);
  const [boothSize, setBoothSize] = useState<"2x2" | "4x4">("2x2");
  const [durationWeeks, setDurationWeeks] = useState<number>(1);
  const [locationPreference, setLocationPreference] = useState<string>("");
  const [selectedMapLocation, setSelectedMapLocation] = useState<string>("");
  const [isSubmittingPlatformBooth, setIsSubmittingPlatformBooth] =
    useState(false);

  // Booth application dialog state
  const [boothApplicationOpen, setBoothApplicationOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<{
    id: string;
    number: number | string;
  } | null>(null);

  // Cancel confirmation dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [applicationToCancel, setApplicationToCancel] = useState<string | null>(
    null
  );

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedApplicationForPayment, setSelectedApplicationForPayment] =
    useState<Application | null>(null);

  const { toast } = useToast();

  // Handle booth application
  const handleBoothApplication = (
    boothId: string,
    boothNumber: number | string
  ) => {
    setSelectedBooth({ id: boothId, number: boothNumber });
    setBoothApplicationOpen(true);
  };

  // Get current tab from URL hash or default to 'upcoming'
  const getCurrentTab = () => {
    const hash = window.location.hash;
    const validTabs = [
      "upcoming",
      "platform-booths",
      "participating",
      "pending",
      "rejected",
    ];
    const tabFromHash = hash.replace("#", "");
    return validTabs.includes(tabFromHash) ? tabFromHash : "upcoming";
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  // Filter data based on search term
  const getFilteredData = (data: any[], searchFields: string[]) => {
    if (!searchTerm) return data;

    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return (
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    );
  };

  // Get filtered data for each tab
  const filteredUpcomingBazaars = getFilteredData(upcomingBazaars, [
    "name",
    "description",
    "location",
  ]);
  const filteredPendingApplications = getFilteredData(pendingApplications, [
    "event.name",
    "type",
  ]);
  const filteredRejectedApplications = getFilteredData(rejectedApplications, [
    "event.name",
    "type",
  ]);
  const filteredApprovedApplications = getFilteredData(approvedApplications, [
    "event.name",
    "type",
  ]);

  // Calculate vendor statistics
  const getVendorStats = () => {
    const totalApplications =
      pendingApplications.length +
      rejectedApplications.length +
      approvedApplications.length +
      cancelledApplications.length;
    const pendingCount = pendingApplications.length;
    const approvedCount = approvedApplications.length;
    const rejectedCount = rejectedApplications.length;
    const cancelledCount = cancelledApplications.length;

    return {
      totalApplications,
      pendingCount,
      approvedCount,
      rejectedCount,
      cancelledCount,
    };
  };

  const vendorStats = getVendorStats();

  // Prepare chart data
  const applicationStatusData = [
    {
      name: "Approved",
      value: vendorStats.approvedCount,
      color: "#22c55e", // green-500
    },
    {
      name: "Pending",
      value: vendorStats.pendingCount,
      color: "#3b82f6", // blue-500
    },
    {
      name: "Rejected",
      value: vendorStats.rejectedCount,
      color: "#f97316", // orange-500
    },
    {
      name: "Cancelled",
      value: vendorStats.cancelledCount,
      color: "#6b7280", // gray-500
    },
  ];

  // Calculate application type breakdown (Bazaar vs Booth)
  const getApplicationTypeData = () => {
    const allApplications = [
      ...pendingApplications,
      ...approvedApplications,
      ...rejectedApplications,
    ];

    const bazaarCount = allApplications.filter(
      (app) => app.type === "bazaar"
    ).length;
    const boothCount = allApplications.filter(
      (app) => app.type === "booth"
    ).length;

    return [
      { name: "Bazaars", value: bazaarCount, color: "#8b5cf6" }, // purple-500
      { name: "Platform Booths", value: boothCount, color: "#ec4899" }, // pink-500
    ];
  };

  const applicationTypeData = getApplicationTypeData();

  // Check if vendor has active booths (approved applications)
  const hasActiveBooths = approvedApplications.length > 0;
  const activeBoothsCount = approvedApplications.length;

  // Calculate success rate (approved / total * 100)
  const successRate =
    vendorStats.totalApplications > 0
      ? Math.round(
          (vendorStats.approvedCount / vendorStats.totalApplications) * 100
        )
      : 0;

  // Fetch company name from localStorage
  const fetchCompanyName = () => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setCompanyName(userData.companyName || "Vendor");
    } else {
      setCompanyName("Vendor");
    }
  };

  // Fetch upcoming bazaars
  const fetchUpcomingBazaars = async () => {
    try {
      setLoading(true);
      setError(null);
      const bazaars = await bazaarApiService.getEvents("bazaar");
      setUpcomingBazaars(bazaars);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch bazaars";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load upcoming bazaars. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications data
  const fetchApplicationsData = async () => {
    try {
      console.log("=== Starting application fetch ===");

      console.log("Fetching applications by status...");
      const results = await Promise.allSettled([
        bazaarApiService.getPendingApplications(),
        bazaarApiService.getRejectedApplications(),
        bazaarApiService.getApprovedApplications(),
        bazaarApiService.getApplicationsByStatus("cancelled"),
      ]);

      const pending = results[0].status === "fulfilled" ? results[0].value : [];
      const rejected =
        results[1].status === "fulfilled" ? results[1].value : [];
      const approved =
        results[2].status === "fulfilled" ? results[2].value : [];
      const cancelled =
        results[3].status === "fulfilled" ? results[3].value : [];

      console.log("Pending applications:", pending);
      console.log("Rejected applications:", rejected);
      console.log("Approved applications:", approved);
      console.log("Cancelled applications:", cancelled);

      const totalApplications =
        pending.length + rejected.length + approved.length + cancelled.length;
      console.log("Total applications found:", totalApplications);

      if (totalApplications === 0) {
        console.log("No applications found in database for this user");
      }

      setPendingApplications(pending);
      setRejectedApplications(rejected);
      setApprovedApplications(approved);
      setCancelledApplications(cancelled);

      console.log("=== Application fetch completed ===");
    } catch (err) {
      console.error("Error fetching applications:", err);
      toast({
        title: "Error",
        description: "Failed to load applications data.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCompanyName();
    fetchUpcomingBazaars();
    fetchApplicationsData();
  }, []);

  // Listen for hash changes to update active tab
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getCurrentTab());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleRegister = (bazaarId: string) => {
    // Check if user has already applied to this bazaar (excluding rejected applications)
    // Users should be able to reapply if their application was rejected
    const activeApplications = [
      ...pendingApplications,
      ...approvedApplications,
    ];

    const existingApplication = activeApplications.find(
      (app) => app.type === "bazaar" && app.event?._id === bazaarId
    );

    if (existingApplication) {
      toast({
        title: "Already Applied",
        description: "You have already applied to this bazaar.",
        variant: "destructive",
      });
      return;
    }

    const bazaar = upcomingBazaars.find((b) => b._id === bazaarId);
    if (bazaar) {
      setSelectedBazaar(bazaar);
      setShowApplyDialog(true);
    }
  };

  const handleApplicationSubmitted = () => {
    // Immediately refresh data after user action
    fetchApplicationsData();
    fetchUpcomingBazaars();
  };

  const handleCancelClick = (applicationId: string) => {
    setApplicationToCancel(applicationId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!applicationToCancel) return;

    try {
      await bazaarApiService.cancelApplication(applicationToCancel);
      toast({
        title: "Application Cancelled",
        description: "Your application has been cancelled successfully.",
      });
      // Refresh applications data to update the UI
      fetchApplicationsData();
      setCancelDialogOpen(false);
      setApplicationToCancel(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cancel application";
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Platform booth form helpers
  const addPlatformBoothAttendee = () => {
    if (platformBoothAttendees.length < 5) {
      setPlatformBoothAttendees([
        ...platformBoothAttendees,
        { name: "", email: "" },
      ]);
    }
  };

  const removePlatformBoothAttendee = (index: number) => {
    if (platformBoothAttendees.length > 1) {
      setPlatformBoothAttendees(
        platformBoothAttendees.filter((_, i) => i !== index)
      );
    }
  };

  const updatePlatformBoothAttendee = (
    index: number,
    field: keyof Attendee,
    value: string
  ) => {
    const updatedAttendees = platformBoothAttendees.map((attendee, i) =>
      i === index ? { ...attendee, [field]: value } : attendee
    );
    setPlatformBoothAttendees(updatedAttendees);
  };

  const handleIdUploadSuccess = (index: number, url: string) => {
    const updatedAttendees = platformBoothAttendees.map((attendee, i) =>
      i === index ? { ...attendee, individualID: url } : attendee
    );
    setPlatformBoothAttendees(updatedAttendees);
  };

  const validatePlatformBoothForm = () => {
    const validAttendees = platformBoothAttendees.filter(
      (attendee) => attendee.name.trim() && attendee.email.trim()
    );

    if (validAttendees.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one attendee with name and email is required.",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const attendee of validAttendees) {
      if (!emailRegex.test(attendee.email)) {
        toast({
          title: "Validation Error",
          description: `Invalid email format for ${attendee.name || "attendee"}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Check for missing IDs and collect all attendees without IDs
    // Check all attendees that have at least a name (so we can display them)
    const attendeesToCheck = platformBoothAttendees.filter(
      (attendee) => attendee.name && attendee.name.trim()
    );
    const attendeesWithoutID = attendeesToCheck.filter(
      (attendee) => !attendee.individualID
    );

    if (attendeesWithoutID.length > 0) {
      const firstNames = attendeesWithoutID
        .map((attendee) => {
          const trimmedName = attendee.name.trim();
          return trimmedName.split(" ")[0]; // Get first name only
        })
        .filter((name) => name.length > 0);

      if (firstNames.length > 0) {
        let namesList: string;
        if (firstNames.length === 1) {
          namesList = firstNames[0];
        } else if (firstNames.length === 2) {
          namesList = `${firstNames[0]} and ${firstNames[1]}`;
        } else {
          namesList = `${firstNames.slice(0, -1).join(", ")}, and ${firstNames[firstNames.length - 1]}`;
        }

        toast({
          title: "Validation Error",
          description: `Please upload an ID card for ${namesList}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handlePlatformBoothSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePlatformBoothForm()) {
      return;
    }

    setIsSubmittingPlatformBooth(true);

    try {
      const validAttendees = platformBoothAttendees.filter(
        (attendee) => attendee.name.trim() && attendee.email.trim()
      );

      // This will be called from BoothApplicationDialog, so we don't submit here
      // The actual submission happens when user clicks on a booth in the map
      console.log("Platform booth form validated:", {
        attendees: validAttendees,
        boothSize,
        durationWeeks,
        selectedMapLocation,
      });
    } catch (error) {
      console.error("Error submitting platform booth application:", error);
      toast({
        title: "Application Failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPlatformBooth(false);
    }
  };

  const handleSave = (bazaarId: string) => {
    toast({
      title: "Saved",
      description: "Bazaar saved to your favorites!",
    });
  };

  const handleShare = (bazaarId: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Check out this bazaar!",
        text: "I found an interesting bazaar at GUC",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Bazaar link copied to clipboard!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <VendorHeader activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {activeTab !== "platform-booths" &&
          activeTab !== "participating" &&
          activeTab !== "pending" &&
          activeTab !== "rejected" && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Store className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Vendor Dashboard</h1>
              </div>
              <p className="text-muted-foreground">
                Welcome, {companyName}! Manage your bazaar applications and
                platform booth requests.
              </p>
            </div>
          )}

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsContent value="upcoming" className="space-y-4">
            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* Application Status Doughnut Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">
                    Application Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4">
                  {applicationStatusData.length === 0 ||
                  applicationStatusData.every((item) => item.value === 0) ? (
                    <div className="h-[280px] flex flex-col items-center justify-center">
                      <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">
                        No applications yet
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Start by applying to a bazaar or booth
                      </p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={applicationStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({
                              name,
                              value,
                              cx,
                              cy,
                              midAngle,
                              outerRadius,
                            }) => {
                              if (value === 0) return null;
                              const RADIAN = Math.PI / 180;
                              const radius = outerRadius + 25; // Add distance from chart for spacing
                              const x =
                                cx + radius * Math.cos(-midAngle * RADIAN);
                              const y =
                                cy + radius * Math.sin(-midAngle * RADIAN);
                              // Find the color for this segment
                              const segmentData = applicationStatusData.find(
                                (item) => item.name === name
                              );
                              const labelColor = segmentData?.color || "#333";
                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill={labelColor}
                                  textAnchor={x > cx ? "start" : "end"}
                                  dominantBaseline="central"
                                  fontSize="11"
                                >
                                  {`${name}: ${value}`}
                                </text>
                              );
                            }}
                            labelLine={(props: any) => {
                              if (props.value === 0) return null;
                              return (
                                <path
                                  d={props.points?.reduce(
                                    (acc: string, point: any, i: number) => {
                                      return i === 0
                                        ? `M${point.x},${point.y}`
                                        : `${acc}L${point.x},${point.y}`;
                                    },
                                    ""
                                  )}
                                  stroke="#666"
                                  strokeWidth={1}
                                  fill="none"
                                />
                              );
                            }}
                          >
                            {applicationStatusData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="none"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => Math.floor(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 flex justify-center">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {applicationStatusData.map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-muted-foreground font-medium">
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Application Type Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Applications by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applicationTypeData.length === 0 ||
                  applicationTypeData.every((item) => item.value === 0) ? (
                    <div className="h-[280px] flex flex-col items-center justify-center">
                      <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">
                        No applications yet
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Start by applying to a bazaar or booth
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={applicationTypeData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            Math.floor(value).toString()
                          }
                          allowDecimals={false}
                        />
                        <Tooltip
                          formatter={(
                            value: number,
                            name: string,
                            props: any
                          ) => {
                            const label =
                              props.payload.name === "Platform Booths"
                                ? "Number of booths"
                                : "Number of bazaars";
                            return [Math.floor(value), label];
                          }}
                        />
                        <Bar dataKey="value" fill="#8884d8" barSize={60}>
                          {applicationTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Active Booths & Success Rate Card */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-center">
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center space-y-6">
                  {/* Active Booths Status */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Store
                        className={`h-5 w-5 ${
                          hasActiveBooths
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">Active Booths</span>
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        hasActiveBooths
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {activeBoothsCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hasActiveBooths
                        ? "You have active booths"
                        : "No active booths"}
                    </p>
                  </div>

                  {/* Success Rate */}
                  <div className="text-center border-t pt-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Success Rate</span>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {successRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {vendorStats.approvedCount} of{" "}
                      {vendorStats.totalApplications} approved
                    </p>
                  </div>

                  {/* Total Applications */}
                  <div className="text-center border-t pt-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">
                        Total Applications
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {vendorStats.totalApplications}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {vendorStats.pendingCount} pending review
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Upcoming Bazaars</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredUpcomingBazaars.length} bazaar
                  {filteredUpcomingBazaars.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Loading upcoming bazaars...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchUpcomingBazaars} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <BazaarList
                bazaars={filteredUpcomingBazaars}
                onRegister={handleRegister}
                onSave={handleSave}
                onShare={handleShare}
                showFilters={false}
              />
            )}
          </TabsContent>

          <TabsContent value="platform-booths" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Store className="h-5 w-5" />
                  Apply for Platform Booth
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill in the details to apply for a platform booth. You can
                  register up to 5 individuals.
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handlePlatformBoothSubmit}
                  className="space-y-6"
                >
                  {/* Attendees Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">
                        Attendees ({platformBoothAttendees.length}/5)
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPlatformBoothAttendee}
                        disabled={platformBoothAttendees.length >= 5}
                        className="flex items-center gap-2 h-9"
                      >
                        <Plus className="h-4 w-4" />
                        Add Attendee
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {platformBoothAttendees.map((attendee, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-muted-foreground">
                                Attendee {index + 1}
                              </span>
                              {platformBoothAttendees.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removePlatformBoothAttendee(index)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 items-end">
                              <div className="space-y-2 flex-1">
                                <Label htmlFor={`platform-name-${index}`}>
                                  Name
                                </Label>
                                <Input
                                  id={`platform-name-${index}`}
                                  placeholder="Full name"
                                  value={attendee.name}
                                  onChange={(e) =>
                                    updatePlatformBoothAttendee(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  required={index === 0}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2 flex-1">
                                <Label htmlFor={`platform-email-${index}`}>
                                  Email
                                </Label>
                                <Input
                                  id={`platform-email-${index}`}
                                  type="email"
                                  placeholder="email@example.com"
                                  value={attendee.email}
                                  onChange={(e) =>
                                    updatePlatformBoothAttendee(
                                      index,
                                      "email",
                                      e.target.value
                                    )
                                  }
                                  required={index === 0}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2 flex-shrink-0">
                                <Label className="opacity-0 pointer-events-none">
                                  Upload
                                </Label>
                                <IdUploadButton
                                  index={index}
                                  attendeeName={attendee.name}
                                  individualID={attendee.individualID}
                                  onUploadSuccess={handleIdUploadSuccess}
                                  buttonClassName="h-9"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Booth Size and Duration Section */}
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="space-y-2 flex-1 max-w-[calc(50%-57px)]">
                      <Label
                        htmlFor="platform-boothSize"
                        className="text-base font-semibold"
                      >
                        Booth Size
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Choose the size of your booth space. Larger booths may
                        have additional fees.
                      </p>
                      <Select
                        value={boothSize}
                        onValueChange={(value: "2x2" | "4x4") =>
                          setBoothSize(value)
                        }
                      >
                        <SelectTrigger id="platform-boothSize">
                          <SelectValue placeholder="Select booth size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2x2">2x2</SelectItem>
                          <SelectItem value="4x4">4x4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 flex-1">
                      <Label
                        htmlFor="platform-duration"
                        className="text-base font-semibold"
                      >
                        Duration
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Select how long you want to set up your booth (1-4
                        weeks).
                      </p>
                      <Select
                        value={durationWeeks.toString()}
                        onValueChange={(value) =>
                          setDurationWeeks(parseInt(value))
                        }
                      >
                        <SelectTrigger id="platform-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 week</SelectItem>
                          <SelectItem value="2">2 weeks</SelectItem>
                          <SelectItem value="3">3 weeks</SelectItem>
                          <SelectItem value="4">4 weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dummy Map Section */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Platform Map - Select Preferred Location
                    </Label>
                    <PlatformMap
                      selectedLocation={selectedMapLocation}
                      onLocationSelect={setSelectedMapLocation}
                      attendees={platformBoothAttendees}
                      boothSize={boothSize}
                      onBoothApplication={handleBoothApplication}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participating" className="space-y-4">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">My Participations</h1>
              </div>
              <p className="text-muted-foreground">
                View all your approved applications and platform booth requests.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApprovedApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No approved applications yet
                  </p>
                </div>
              ) : (
                filteredApprovedApplications.map((application) => (
                  <Card
                    key={application._id}
                    data-testid={`card-participation-${application._id}`}
                    className="flex flex-col"
                  >
                    <CardHeader className="pb-4 min-h-[5rem]">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl mb-2 text-card-foreground flex-1">
                          {application.type === "bazaar"
                            ? application.event?.name || "Unknown Bazaar"
                            : "Platform Booth Application"}
                        </CardTitle>
                        <div className="flex gap-2 items-start flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {application.type === "bazaar" ? "Bazaar" : "Booth"}
                          </Badge>
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 w-fit min-w-[4.5rem]">
                            Approved
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                      <div className="space-y-2 text-sm mb-4 flex-grow">
                        {application.type === "bazaar" && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            {new Date(
                              application.event.startDate
                            ).toLocaleDateString("en-GB")}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Store className="h-4 w-4 flex-shrink-0" />
                          Booth Size: {application.boothSize}
                        </div>
                        {application.type === "booth" &&
                          application.durationWeeks && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              Duration: {application.durationWeeks} week
                              {application.durationWeeks > 1 ? "s" : ""}
                            </div>
                          )}
                        {application.type === "booth" &&
                          application.locationPreference && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Target className="h-4 w-4 flex-shrink-0" />
                              Preferred Location:{" "}
                              {application.locationPreference}
                            </div>
                          )}
                        {application.type === "bazaar" && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            {application.event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          {application.attendees?.length || "0"} attendee
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          Applied:{" "}
                          {new Date(application.createdAt).toLocaleDateString(
                            "en-GB"
                          )}
                        </div>
                      </div>
                      {application.paymentStatus === "paid" ? (
                        <Button
                          className="w-full mt-auto bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-not-allowed"
                          variant="outline"
                          disabled
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Already Paid
                        </Button>
                      ) : application.paymentStatus === "overdue" ? (
                        <Button className="w-full mt-auto" disabled>
                          Payment Overdue
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedApplicationForPayment(application);
                            setPaymentDialogOpen(true);
                          }}
                          className="w-full mt-auto"
                          variant="default"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Pending Requests</h1>
              </div>
              <p className="text-muted-foreground">
                Applications and requests that are currently under review.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPendingApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No pending applications
                  </p>
                </div>
              ) : (
                filteredPendingApplications.map((application) => (
                  <Card
                    key={application._id}
                    data-testid={`card-request-${application._id}`}
                    className="flex flex-col"
                  >
                    <CardHeader className="pb-4 min-h-[5rem]">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl mb-2 text-card-foreground flex-1">
                          {application.type === "bazaar"
                            ? application.event?.name || "Unknown Bazaar"
                            : "Platform Booth Application"}
                        </CardTitle>
                        <div className="flex gap-2 items-start flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {application.type === "bazaar" ? "Bazaar" : "Booth"}
                          </Badge>
                          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700 w-fit min-w-[4.5rem]">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                      <div className="space-y-2 text-sm mb-4 flex-grow">
                        {application.type === "bazaar" && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            {new Date(
                              application.event.startDate
                            ).toLocaleDateString("en-GB")}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Store className="h-4 w-4 flex-shrink-0" />
                          Booth Size: {application.boothSize}
                        </div>
                        {application.type === "booth" &&
                          application.durationWeeks && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              Duration: {application.durationWeeks} week
                              {application.durationWeeks > 1 ? "s" : ""}
                            </div>
                          )}
                        {application.type === "booth" &&
                          application.locationPreference && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Target className="h-4 w-4 flex-shrink-0" />
                              Preferred Location:{" "}
                              {application.locationPreference}
                            </div>
                          )}
                        {application.type === "bazaar" && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            {application.event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          {application.attendees?.length || "0"}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          Applied:{" "}
                          {new Date(application.createdAt).toLocaleDateString(
                            "en-GB"
                          )}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        className="w-full mt-auto"
                        onClick={() => handleCancelClick(application._id)}
                        data-testid={`button-cancel-${application._id}`}
                      >
                        Cancel Request
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Rejected Applications</h1>
              </div>
              <p className="text-muted-foreground">
                Applications that were not approved. You can review and reapply
                if needed.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRejectedApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No rejected applications
                  </p>
                </div>
              ) : (
                filteredRejectedApplications.map((application) => (
                  <Card
                    key={application._id}
                    data-testid={`card-rejected-${application._id}`}
                    className="flex flex-col"
                  >
                    <CardHeader className="pb-4 min-h-[5rem]">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl mb-2 text-card-foreground flex-1">
                          {application.type === "bazaar"
                            ? application.event?.name || "Unknown Bazaar"
                            : "Platform Booth Application"}
                        </CardTitle>
                        <div className="flex gap-2 items-start flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {application.type === "bazaar" ? "Bazaar" : "Booth"}
                          </Badge>
                          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700 w-fit min-w-[4.5rem]">
                            Rejected
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        {application.type === "bazaar" && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            {new Date(
                              application.event.startDate
                            ).toLocaleDateString("en-GB")}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Store className="h-4 w-4 flex-shrink-0" />
                          Booth Size: {application.boothSize}
                        </div>
                        {application.type === "booth" &&
                          application.durationWeeks && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              Duration: {application.durationWeeks} week
                              {application.durationWeeks > 1 ? "s" : ""}
                            </div>
                          )}
                        {application.type === "booth" &&
                          application.locationPreference && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Target className="h-4 w-4 flex-shrink-0" />
                              Preferred Location:{" "}
                              {application.locationPreference}
                            </div>
                          )}
                        {application.type === "bazaar" && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            {application.event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          {application.attendees?.length || "0"}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          Applied:{" "}
                          {new Date(application.createdAt).toLocaleDateString(
                            "en-GB"
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        data-testid={`button-reapply-${application._id}`}
                      >
                        Reapply
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {selectedBazaar && (
        <VendorApplicationDialog
          open={showApplyDialog}
          onOpenChange={setShowApplyDialog}
          bazaarId={selectedBazaar._id}
          bazaarName={selectedBazaar.name}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}

      {/* Booth Application Dialog */}
      {selectedBooth && (
        <BoothApplicationDialog
          open={boothApplicationOpen}
          onOpenChange={setBoothApplicationOpen}
          boothId={selectedBooth.id}
          boothNumber={selectedBooth.number}
          attendees={platformBoothAttendees}
          boothSize={boothSize}
          durationWeeks={durationWeeks}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold">
                  Cancel Application?
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  Are you sure you want to cancel this request? This action
                  cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:space-x-2 pt-4 justify-center !sm:justify-center">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setCancelDialogOpen(false);
                setApplicationToCancel(null);
              }}
            >
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleCancelConfirm}
            >
              Yes, Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {selectedApplicationForPayment && (
        <ApplicationPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          application={selectedApplicationForPayment}
          onPaymentSuccess={() => {
            fetchApplicationsData();
            setSelectedApplicationForPayment(null);
          }}
        />
      )}
    </div>
  );
}
