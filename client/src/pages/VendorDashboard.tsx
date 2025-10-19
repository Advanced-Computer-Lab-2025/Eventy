import { useState, useEffect } from "react";
import { Store, Calendar, CheckCircle, Clock, XCircle, Plus, Trash2, MapPin, FolderOpen, AlertCircle, Users, Target } from "lucide-react";
import VendorHeader from "@/components/VendorHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BazaarList, { Bazaar } from "@/components/BazaarList";
import VendorApplicationDialog from "@/components/VendorApplicationDialog";
import PlatformMap from "@/components/PlatformMap";
import BoothApplicationDialog from "@/components/BoothApplicationDialog";
import StatCard from "@/components/StatCard";
import { bazaarApiService, Application } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Attendee {
  name: string;
  email: string;
}

export default function VendorDashboard() {
  const [location, setLocation] = useLocation();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedBazaar, setSelectedBazaar] = useState<Bazaar | null>(null);
  const [upcomingBazaars, setUpcomingBazaars] = useState<Bazaar[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Application[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<Application[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  // Platform booth form state
  const [platformBoothAttendees, setPlatformBoothAttendees] = useState<Attendee[]>([
    { name: "", email: "" }
  ]);
  const [boothSize, setBoothSize] = useState<"2x2" | "4x4">("2x2");
  const [durationWeeks, setDurationWeeks] = useState<number>(1);
  const [locationPreference, setLocationPreference] = useState<string>("");
  const [selectedMapLocation, setSelectedMapLocation] = useState<string>("");
  const [isSubmittingPlatformBooth, setIsSubmittingPlatformBooth] = useState(false);
  
  // Booth application dialog state
  const [boothApplicationOpen, setBoothApplicationOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<{id: string, number: number | string} | null>(null);
  
  const { toast } = useToast();

  // Handle booth application
  const handleBoothApplication = (boothId: string, boothNumber: number | string) => {
    setSelectedBooth({ id: boothId, number: boothNumber });
    setBoothApplicationOpen(true);
  };

  // Get current tab from URL hash or default to 'upcoming'
  const getCurrentTab = () => {
    const hash = window.location.hash;
    const validTabs = ['upcoming', 'platform-booths', 'participating', 'pending', 'rejected'];
    const tabFromHash = hash.replace('#', '');
    return validTabs.includes(tabFromHash) ? tabFromHash : 'upcoming';
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
    
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  };

  // Get filtered data for each tab
  const filteredUpcomingBazaars = getFilteredData(upcomingBazaars, ['name', 'description', 'location']);
  const filteredPendingApplications = getFilteredData(pendingApplications, ['event.name', 'type']);
  const filteredRejectedApplications = getFilteredData(rejectedApplications, ['event.name', 'type']);
  const filteredApprovedApplications = getFilteredData(approvedApplications, ['event.name', 'type']);

  // Calculate vendor statistics
  const getVendorStats = () => {
    const totalApplications = pendingApplications.length + rejectedApplications.length + approvedApplications.length;
    const pendingCount = pendingApplications.length;
    const approvedCount = approvedApplications.length;
    const rejectedCount = rejectedApplications.length;
    
    return {
      totalApplications,
      pendingCount,
      approvedCount,
      rejectedCount
    };
  };

  const vendorStats = getVendorStats();

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
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch bazaars";
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
      const [pending, rejected, approved] = await Promise.all([
        bazaarApiService.getPendingApplications(),
        bazaarApiService.getRejectedApplications(),
        bazaarApiService.getApprovedApplications(),
      ]);
      
      console.log("Pending applications:", pending);
      console.log("Rejected applications:", rejected);
      console.log("Approved applications:", approved);
      
      const totalApplications = pending.length + rejected.length + approved.length;
      console.log("Total applications found:", totalApplications);
      
      if (totalApplications === 0) {
        console.log("No applications found in database for this user");
        toast({
          title: "Info",
          description: "No applications found. You may need to apply to a bazaar first.",
          variant: "default",
        });
      }
      
      setPendingApplications(pending);
      setRejectedApplications(rejected);
      setApprovedApplications(approved);
      
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

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRegister = (bazaarId: string) => {
    const bazaar = upcomingBazaars.find(b => b._id === bazaarId);
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


  // Platform booth form helpers
  const addPlatformBoothAttendee = () => {
    if (platformBoothAttendees.length < 5) {
      setPlatformBoothAttendees([...platformBoothAttendees, { name: "", email: "" }]);
    }
  };

  const removePlatformBoothAttendee = (index: number) => {
    if (platformBoothAttendees.length > 1) {
      setPlatformBoothAttendees(platformBoothAttendees.filter((_, i) => i !== index));
    }
  };

  const updatePlatformBoothAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updatedAttendees = platformBoothAttendees.map((attendee, i) =>
      i === index ? { ...attendee, [field]: value } : attendee
    );
    setPlatformBoothAttendees(updatedAttendees);
  };

  const validatePlatformBoothForm = () => {
    const validAttendees = platformBoothAttendees.filter(attendee => 
      attendee.name.trim() && attendee.email.trim()
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
          description: `Invalid email format for ${attendee.name || 'attendee'}.`,
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
      const validAttendees = platformBoothAttendees.filter(attendee => 
        attendee.name.trim() && attendee.email.trim()
      );

      // TODO: Replace with actual API call when backend is ready
      console.log("Platform booth application data:", {
        attendees: validAttendees,
        boothSize,
        durationWeeks,
        selectedMapLocation
      });

      toast({
        title: "Application Submitted",
        description: "Your platform booth application has been submitted successfully!",
      });

      // Reset form
      setPlatformBoothAttendees([{ name: "", email: "" }]);
      setBoothSize("2x2");
      setDurationWeeks(1);
      setSelectedMapLocation("");
      
      // Immediately refresh data after user action
      fetchApplicationsData();
      fetchUpcomingBazaars();
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
      <VendorHeader 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearch={handleSearch}
      />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Store className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Vendor Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome, {companyName}! Manage your bazaar applications and platform booth requests.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

          <TabsContent value="upcoming" className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Total Applications"
                value={vendorStats.totalApplications}
                description="All applications submitted"
                icon={FolderOpen}
                valueColor="text-foreground"
                iconColor="text-muted-foreground"
              />
              <StatCard
                title="Pending Approval"
                value={vendorStats.pendingCount}
                description="Awaiting review"
                icon={Clock}
                valueColor="text-blue-600 dark:text-blue-400"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                title="Approved"
                value={vendorStats.approvedCount}
                description="Successfully approved"
                icon={CheckCircle}
                valueColor="text-green-600 dark:text-green-400"
                iconColor="text-green-600 dark:text-green-400"
              />
              <StatCard
                title="Rejected"
                value={vendorStats.rejectedCount}
                description="Requires updates"
                icon={XCircle}
                valueColor="text-orange-600 dark:text-orange-400"
                iconColor="text-orange-600 dark:text-orange-400"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Upcoming Bazaars</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredUpcomingBazaars.length} bazaar{filteredUpcomingBazaars.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading upcoming bazaars...</p>
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
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Apply for Platform Booth
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill in the details to apply for a platform booth. You can register up to 5 individuals.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlatformBoothSubmit} className="space-y-6">
                  {/* Attendees Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Attendees ({platformBoothAttendees.length}/5)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPlatformBoothAttendee}
                        disabled={platformBoothAttendees.length >= 5}
                        className="flex items-center gap-2"
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
                                  onClick={() => removePlatformBoothAttendee(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`platform-name-${index}`}>Name</Label>
                                <Input
                                  id={`platform-name-${index}`}
                                  placeholder="Full name"
                                  value={attendee.name}
                                  onChange={(e) => updatePlatformBoothAttendee(index, "name", e.target.value)}
                                  required={index === 0}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`platform-email-${index}`}>Email</Label>
                                <Input
                                  id={`platform-email-${index}`}
                                  type="email"
                                  placeholder="email@example.com"
                                  value={attendee.email}
                                  onChange={(e) => updatePlatformBoothAttendee(index, "email", e.target.value)}
                                  required={index === 0}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Booth Size Section */}
                  <div className="space-y-2">
                    <Label htmlFor="platform-boothSize" className="text-base font-semibold">Booth Size</Label>
                    <Select value={boothSize} onValueChange={(value: "2x2" | "4x4") => setBoothSize(value)}>
                      <SelectTrigger id="platform-boothSize">
                        <SelectValue placeholder="Select booth size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2x2">2x2</SelectItem>
                        <SelectItem value="4x4">4x4</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Choose the size of your booth space. Larger booths may have additional fees.
                    </p>
                  </div>

                  {/* Duration Section */}
                  <div className="space-y-2">
                    <Label htmlFor="platform-duration" className="text-base font-semibold">Duration</Label>
                    <Select value={durationWeeks.toString()} onValueChange={(value) => setDurationWeeks(parseInt(value))}>
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
                    <p className="text-sm text-muted-foreground">
                      Select how long you want to set up your booth (1-4 weeks).
                    </p>
                  </div>


                  {/* Dummy Map Section */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Platform Map - Select Preferred Location</Label>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApprovedApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved applications yet</p>
                </div>
              ) : (
                filteredApprovedApplications.map((application) => (
                  <Card key={application._id} data-testid={`card-participation-${application._id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl mb-2">
                          {application.type === 'bazaar' 
                            ? (application.event?.name || 'Unknown Bazaar')
                            : 'Platform Booth Application'
                          }
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {application.type === 'bazaar' ? 'Bazaar' : 'Booth'}
                          </Badge>
                          <Badge className="bg-green-500 hover:bg-green-600 w-fit">Approved</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {application.type === 'bazaar' && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            {new Date(application.event.startDate).toLocaleDateString('en-GB')}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Store className="h-4 w-4 flex-shrink-0" />
                          Booth Size: {application.boothSize}
                        </div>
                        {application.type === 'booth' && application.durationWeeks && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            Duration: {application.durationWeeks} week{application.durationWeeks > 1 ? 's' : ''}
                          </div>
                        )}
                        {application.type === 'booth' && application.locationPreference && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="h-4 w-4 flex-shrink-0" />
                            Preferred Location: {application.locationPreference}
                          </div>
                        )}
                        {application.type === 'bazaar' && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            {application.event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 flex-shrink-0" />
                          {application.attendees.length} attendee{application.attendees.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          Applied: {new Date(application.createdAt).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPendingApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending applications</p>
                </div>
              ) : (
                filteredPendingApplications.map((application) => (
                  <Card key={application._id} data-testid={`card-request-${application._id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl mb-2">
                          {application.type === 'bazaar' 
                            ? (application.event?.name || 'Unknown Bazaar')
                            : 'Platform Booth Application'
                          }
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {application.type === 'bazaar' ? 'Bazaar' : 'Booth'}
                          </Badge>
                          <Badge variant="outline" className="w-fit">Pending Review</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        {application.type === 'bazaar' && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            {new Date(application.event.startDate).toLocaleDateString('en-GB')}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Store className="h-4 w-4 flex-shrink-0" />
                          Booth Size: {application.boothSize}
                        </div>
                        {application.type === 'booth' && application.durationWeeks && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            Duration: {application.durationWeeks} week{application.durationWeeks > 1 ? 's' : ''}
                          </div>
                        )}
                        {application.type === 'booth' && application.locationPreference && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="h-4 w-4 flex-shrink-0" />
                            Preferred Location: {application.locationPreference}
                          </div>
                        )}
                        {application.type === 'bazaar' && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            {application.event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 flex-shrink-0" />
                          {application.attendees.length} attendee{application.attendees.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          Applied: {new Date(application.createdAt).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        className="w-full"
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRejectedApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rejected applications</p>
                </div>
              ) : (
                filteredRejectedApplications.map((application) => (
                  <Card key={application._id} data-testid={`card-rejected-${application._id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl mb-2">
                          {application.type === 'bazaar' 
                            ? (application.event?.name || 'Unknown Bazaar')
                            : 'Platform Booth Application'
                          }
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {application.type === 'bazaar' ? 'Bazaar' : 'Booth'}
                          </Badge>
                          <Badge variant="destructive" className="w-fit">Rejected</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        {application.type === 'bazaar' && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            {new Date(application.event.startDate).toLocaleDateString('en-GB')}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Store className="h-4 w-4 flex-shrink-0" />
                          Booth Size: {application.boothSize}
                        </div>
                        {application.type === 'booth' && application.durationWeeks && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            Duration: {application.durationWeeks} week{application.durationWeeks > 1 ? 's' : ''}
                          </div>
                        )}
                        {application.type === 'booth' && application.locationPreference && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="h-4 w-4 flex-shrink-0" />
                            Preferred Location: {application.locationPreference}
                          </div>
                        )}
                        {application.type === 'bazaar' && application.event && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            {application.event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 flex-shrink-0" />
                          {application.attendees.length} attendee{application.attendees.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          Applied: {new Date(application.createdAt).toLocaleDateString('en-GB')}
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
    </div>
  );
}
