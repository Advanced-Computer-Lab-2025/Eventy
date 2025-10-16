import { useState, useEffect } from "react";
import { Store, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BazaarList, { Bazaar } from "@/components/BazaarList";
import VendorApplicationDialog from "@/components/VendorApplicationDialog";
import { bazaarApiService, Application } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";

export default function VendorDashboard() {
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedBazaar, setSelectedBazaar] = useState<Bazaar | null>(null);
  const [upcomingBazaars, setUpcomingBazaars] = useState<Bazaar[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Application[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<Application[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
    fetchUpcomingBazaars();
    fetchApplicationsData();
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

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming Bazaars
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
    </div>
  );
}
