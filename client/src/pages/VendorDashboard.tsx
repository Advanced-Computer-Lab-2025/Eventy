import { useState } from "react";
import { Store, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

//todo: remove mock functionality
const upcomingBazaars = [
  { id: "1", name: "Spring Festival Bazaar", date: "April 15, 2024", location: "University Courtyard", deadline: "April 1, 2024" },
  { id: "2", name: "Tech Expo Bazaar", date: "May 20, 2024", location: "Engineering Building", deadline: "May 5, 2024" },
];

const myParticipations = [
  { id: "1", name: "Spring Festival Bazaar", date: "April 15, 2024", status: "accepted", boothSize: "4x4" },
];

const pendingRequests = [
  { id: "2", name: "Summer Market", date: "June 10, 2024", status: "pending", boothSize: "2x2" },
];

export default function VendorDashboard() {
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedBazaar, setSelectedBazaar] = useState<any>(null);
  const [applicationForm, setApplicationForm] = useState({
    attendees: "",
    emails: "",
    boothSize: "2x2",
  });

  const handleApply = (bazaar: any) => {
    setSelectedBazaar(bazaar);
    setShowApplyDialog(true);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Application submitted:", { bazaar: selectedBazaar, ...applicationForm });
    setShowApplyDialog(false);
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
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingBazaars.map((bazaar) => (
                <Card key={bazaar.id} data-testid={`card-bazaar-${bazaar.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{bazaar.name}</CardTitle>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {bazaar.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {bazaar.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Application deadline: {bazaar.deadline}
                    </p>
                    <Button 
                      onClick={() => handleApply(bazaar)} 
                      className="w-full"
                      data-testid={`button-apply-${bazaar.id}`}
                    >
                      Apply to Join
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="participating" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myParticipations.map((participation) => (
                <Card key={participation.id} data-testid={`card-participation-${participation.id}`}>
                  <CardHeader>
                    <CardTitle className="text-xl mb-2">{participation.name}</CardTitle>
                    <Badge className="bg-green-500 hover:bg-green-600 w-fit">Accepted</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {participation.date}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Store className="h-3 w-3" />
                        Booth Size: {participation.boothSize}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map((request) => (
                <Card key={request.id} data-testid={`card-request-${request.id}`}>
                  <CardHeader>
                    <CardTitle className="text-xl mb-2">{request.name}</CardTitle>
                    <Badge variant="outline" className="w-fit">Pending Review</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {request.date}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Store className="h-3 w-3" />
                        Booth Size: {request.boothSize}
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      data-testid={`button-cancel-${request.id}`}
                    >
                      Cancel Request
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Join Bazaar</DialogTitle>
            <DialogDescription>
              Fill in the details to apply for {selectedBazaar?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitApplication} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attendees">Names of Attendees (max 5)</Label>
              <Input
                id="attendees"
                placeholder="John Doe, Jane Smith..."
                value={applicationForm.attendees}
                onChange={(e) => setApplicationForm({ ...applicationForm, attendees: e.target.value })}
                data-testid="input-attendees"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Input
                id="emails"
                placeholder="john@example.com, jane@example.com..."
                value={applicationForm.emails}
                onChange={(e) => setApplicationForm({ ...applicationForm, emails: e.target.value })}
                data-testid="input-emails"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="boothSize">Booth Size</Label>
              <Select
                value={applicationForm.boothSize}
                onValueChange={(value) => setApplicationForm({ ...applicationForm, boothSize: value })}
              >
                <SelectTrigger id="boothSize" data-testid="select-booth-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x2">2x2</SelectItem>
                  <SelectItem value="4x4">4x4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApplyDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-application">
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
