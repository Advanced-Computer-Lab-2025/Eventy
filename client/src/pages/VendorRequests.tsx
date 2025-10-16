import { CheckCircle, XCircle, Eye, Download } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const token = localStorage.getItem("token");

async function updateVendorStatus(requestId: string, status: "approved" | "rejected") {
  try {
    const response = await fetch(`http://localhost:4000/api/applications/${requestId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    // CRITICAL FIX 1: Check Content-Type header before trying to parse the body.
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      // Throw an informative error if the server didn't return JSON.
      throw new Error(
        `Server Error: Expected JSON, but received non-JSON (Status: ${response.status}). Preview: ${text.substring(0, 50)}...`
      );
    }
    
    // CRITICAL FIX 2: Only parse JSON if we know it's JSON.
    const data = await response.json();

    // CRITICAL FIX 3: Check response status after successfully parsing the body.
    if (!response.ok) {
      throw new Error(data.message || "Failed to update status");
    }

    return data.data; // updated application
  } catch (err: any) {
    console.error(err);
    alert(err.message);
  }
}


//todo: remove mock functionality
// const vendorRequests = [
//   {
//     id: "1",
//     company: "Tech Solutions Co.",
//     bazaar: "Spring Festival Bazaar",
//     boothSize: "4x4",
//     attendees: 3,
//     status: "pending",
//   },
//   {
//     id: "2",
//     company: "Food Delights",
//     bazaar: "Summer Market",
//     boothSize: "2x2",
//     attendees: 2,
//     status: "pending",
//   },
// ];

const vendorRequests = [
  {
    id: "68e67bc571164efe8d0162f4", // ← a real ObjectId from MongoDB
    company: "Tech Solutions Co.",
    bazaar: "Spring Festival Bazaar",
    boothSize: "4x4",
    attendees: 3,
    status: "apprved",
  },
];

export default function VendorRequests() {
  const [requests, setRequests] = useState(vendorRequests);

  const handleApprove = async (requestId: string) => {
  const updatedApp = await updateVendorStatus(requestId, "approved");
  if (updatedApp) {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r))
    );
    alert("Vendor request approved!");
  }
};

  const handleReject = async (requestId: string) => {
  const updatedApp = await updateVendorStatus(requestId, "rejected");
  if (updatedApp) {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r))
    );
    alert("Vendor request rejected.");
  }
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
                  <Badge variant={request.status === "pending" ? "outline" : request.status === "accepted" ? "default" : "destructive"}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
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
                           disabled={request.status !== "pending"}

                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                            disabled={request.status !== "pending"}
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
