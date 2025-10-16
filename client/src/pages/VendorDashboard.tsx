import { useState, useEffect } from "react";
import { Store, Calendar, CheckCircle, Clock, XCircle, Plus, Trash2, MapPin } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BazaarList, { Bazaar } from "@/components/BazaarList";
import VendorApplicationDialog from "@/components/VendorApplicationDialog";
import PlatformMap from "@/components/PlatformMap";
import BoothApplicationDialog from "@/components/BoothApplicationDialog";
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

  // Fetch upcoming bazaars
  const fetchUpcomingBazaars = async () => {
    try {
      setLoading(true);
      setError(null);
      const bazaars = await bazaarApiService.getUpcomingBazaars();
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
    // Refresh applications data after successful submission
    fetchApplicationsData();
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
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your bazaar and booth applications
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming Bazaars
            </TabsTrigger>
            <TabsTrigger value="platform-booths" data-testid="tab-platform-booths">
              <Store className="h-4 w-4 mr-2" />
              Platform Booths
            </TabsTrigger>
            <TabsTrigger value="participating" data-testid="tab-participating">
              <CheckCircle className="h-4 w-4 mr-2" />
              My Participations
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              <Clock className="h-4 w-4 mr-2" />
              Pending Requests
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              <XCircle className="h-4 w-4 mr-2" />
              Rejected Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
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
                bazaars={upcomingBazaars}
                onRegister={handleRegister}
                onSave={handleSave}
                onShare={handleShare}
                showFilters={true}
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
              {approvedApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved applications yet</p>
                </div>
              ) : (
                approvedApplications.map((application) => (
                  <Card key={application._id} data-testid={`card-participation-${application._id}`}>
                    <CardHeader>
                      <CardTitle className="text-xl mb-2">{application.bazaarId.name}</CardTitle>
                      <Badge className="bg-green-500 hover:bg-green-600 w-fit">Approved</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(application.bazaarId.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Store className="h-3 w-3" />
                          Booth Size: {application.boothSize}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="h-3 w-3">📍</span>
                          {application.bazaarId.location}
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
              {pendingApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending applications</p>
                </div>
              ) : (
                pendingApplications.map((application) => (
                  <Card key={application._id} data-testid={`card-request-${application._id}`}>
                    <CardHeader>
                      <CardTitle className="text-xl mb-2">{application.bazaarId.name}</CardTitle>
                      <Badge variant="outline" className="w-fit">Pending Review</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(application.bazaarId.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Store className="h-3 w-3" />
                          Booth Size: {application.boothSize}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="h-3 w-3">📍</span>
                          {application.bazaarId.location}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="h-3 w-3">👥</span>
                          {application.attendees.length} attendee(s)
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
              {rejectedApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rejected applications</p>
                </div>
              ) : (
                rejectedApplications.map((application) => (
                  <Card key={application._id} data-testid={`card-rejected-${application._id}`}>
                    <CardHeader>
                      <CardTitle className="text-xl mb-2">{application.bazaarId.name}</CardTitle>
                      <Badge variant="destructive" className="w-fit">Rejected</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(application.bazaarId.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Store className="h-3 w-3" />
                          Booth Size: {application.boothSize}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="h-3 w-3">📍</span>
                          {application.bazaarId.location}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="h-3 w-3">👥</span>
                          {application.attendees.length} attendee(s)
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="h-3 w-3">📅</span>
                          Applied: {new Date(application.createdAt).toLocaleDateString()}
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
