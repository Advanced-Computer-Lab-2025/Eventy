import { CheckCircle, XCircle, Eye, Download } from "lucide-react";
import Header from "@/components/Header";
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

//todo: remove mock functionality
const vendorRequests = [
  {
    id: "1",
    company: "Tech Solutions Co.",
    bazaar: "Spring Festival Bazaar",
    boothSize: "4x4",
    attendees: 3,
    status: "pending",
  },
  {
    id: "2",
    company: "Food Delights",
    bazaar: "Summer Market",
    boothSize: "2x2",
    attendees: 2,
    status: "pending",
  },
];

export default function VendorRequests() {
  const handleApprove = (requestId: string) => {
    console.log("Approve request:", requestId);
    alert("Vendor request approved! Notification sent.");
  };

  const handleReject = (requestId: string) => {
    console.log("Reject request:", requestId);
    alert("Vendor request rejected. Notification sent.");
  };

  const handleViewDocuments = (requestId: string) => {
    console.log("View documents:", requestId);
    alert("Viewing uploaded documents...");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Vendor Requests</h1>
          <p className="text-muted-foreground">
            Review vendor participation requests for bazaars and booths
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Vendor Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Booth Size</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorRequests.map((request) => (
                  <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                    <TableCell className="font-medium">{request.company}</TableCell>
                    <TableCell>{request.bazaar}</TableCell>
                    <TableCell>{request.boothSize}</TableCell>
                    <TableCell>{request.attendees}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocuments(request.id)}
                          data-testid={`button-view-${request.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          data-testid={`button-reject-${request.id}`}
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
    </div>
  );
}
