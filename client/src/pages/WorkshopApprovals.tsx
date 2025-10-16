import { useState } from "react";
import { CheckCircle, XCircle, Edit, Eye } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

//todo: remove mock functionality
const pendingWorkshops = [
  {
    id: "1",
    name: "Advanced Machine Learning",
    professor: "Dr. Ahmed Hassan",
    faculty: "MET",
    date: "April 15, 2024",
    budget: "5000 EGP",
    status: "pending",
  },
  {
    id: "2",
    name: "Blockchain Technology",
    professor: "Dr. Sara Mohamed",
    faculty: "IET",
    date: "April 20, 2024",
    budget: "3000 EGP",
    status: "pending",
  },
];

export default function WorkshopApprovals() {
  const [showRequestEditsDialog, setShowRequestEditsDialog] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [editsRequested, setEditsRequested] = useState("");

  const handleApprove = (workshopId: string) => {
    console.log("Approve workshop:", workshopId);
    alert("Workshop approved and published!");
  };

  const handleReject = (workshopId: string) => {
    console.log("Reject workshop:", workshopId);
    alert("Workshop rejected");
  };

  const handleRequestEdits = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setShowRequestEditsDialog(true);
  };

  const handleSubmitEdits = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Request edits:", { workshop: selectedWorkshop, edits: editsRequested });
    alert("Edit request sent to professor");
    setShowRequestEditsDialog(false);
    setEditsRequested("");
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Workshop Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve workshop submissions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Workshop Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workshop Name</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWorkshops.map((workshop) => (
                  <TableRow key={workshop.id} data-testid={`row-workshop-${workshop.id}`}>
                    <TableCell className="font-medium">{workshop.name}</TableCell>
                    <TableCell>{workshop.professor}</TableCell>
                    <TableCell>{workshop.faculty}</TableCell>
                    <TableCell>{workshop.date}</TableCell>
                    <TableCell>{workshop.budget}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestEdits(workshop)}
                          data-testid={`button-edit-${workshop.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(workshop.id)}
                          data-testid={`button-approve-${workshop.id}`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(workshop.id)}
                          data-testid={`button-reject-${workshop.id}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showRequestEditsDialog} onOpenChange={setShowRequestEditsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Edits</DialogTitle>
            <DialogDescription>
              Specify the edits needed for {selectedWorkshop?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEdits} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edits">Requested Changes</Label>
              <Textarea
                id="edits"
                placeholder="Please describe the changes needed..."
                rows={5}
                value={editsRequested}
                onChange={(e) => setEditsRequested(e.target.value)}
                data-testid="input-edits"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRequestEditsDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-edits">
                Send Edit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
