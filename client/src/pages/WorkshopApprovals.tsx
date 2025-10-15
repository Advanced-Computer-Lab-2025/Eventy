import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Info, Edit } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function WorkshopApprovals() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditRequestDialog, setShowEditRequestDialog] = useState(false);
  const [revisionComments, setRevisionComments] = useState("");

  // ✅ Fetch all workshops from backend
  const fetchWorkshops = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("DEBUG: token from localStorage ->", token);

      if (!token) {
        console.warn("No token found in localStorage.");
        setWorkshops([]);
        setLoading(false);
        return;
      }

      const apiBase = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";
      const url = `${apiBase}/api/events/allworkshops`;
      console.log("DEBUG: requesting", url);

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched workshops response:", res.status, res.data);
      setWorkshops(res.data?.data ?? res.data ?? []);
    } catch (err: any) {
      console.error("Full error fetching workshops:", err);
      console.error("err.response:", err?.response);
      alert("❌ Failed to fetch workshops — check console/network tab for details");
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  // ✅ Filter workshops by status
  const filteredWorkshops =
    statusFilter === "all"
      ? workshops
      : workshops.filter((w) => w.status === statusFilter);

  // ✅ Approve workshop
  const handleApprove = async (workshopId: string) => {
    try {
      const token = localStorage.getItem("token");
      const apiBase = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";
      
      await axios.patch(
        `${apiBase}/api/events/${workshopId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      alert("✅ Workshop approved successfully!");
      setShowDetailsDialog(false);
      fetchWorkshops();
    } catch (err: any) {
      console.error("Error approving workshop:", err.response?.data || err.message);
      alert("❌ Failed to approve workshop");
    }
  };

  // ✅ Reject workshop
  const handleReject = async (workshopId: string) => {
    try {
      const token = localStorage.getItem("token");
      const apiBase = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";
      
      await axios.patch(
        `${apiBase}/api/events/${workshopId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      alert("🚫 Workshop rejected successfully!");
      setShowDetailsDialog(false);
      fetchWorkshops();
    } catch (err: any) {
      console.error("Error rejecting workshop:", err.response?.data || err.message);
      alert("❌ Failed to reject workshop");
    }
  };

  // ✅ Request edits
  const handleRequestEdits = async () => {
    if (!revisionComments.trim()) {
      alert("⚠️ Please provide comments for the edit request");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiBase = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";
      
      await axios.patch(
        `${apiBase}/api/events/${selectedWorkshop._id}/request-edits`,
        { revisionComments },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      alert("✅ Edit request sent successfully!");
      setShowEditRequestDialog(false);
      setShowDetailsDialog(false);
      setRevisionComments("");
      fetchWorkshops();
    } catch (err: any) {
      console.error("Error requesting edits:", err.response?.data || err.message);
      alert("❌ Failed to request edits");
    }
  };

  // ✅ View full workshop details
  const handleViewDetails = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setShowDetailsDialog(true);
  };

  const openEditRequestDialog = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setShowEditRequestDialog(true);
  };

  if (loading) return <p className="p-8">Loading workshops...</p>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Workshop Management</h1>
          <p className="text-muted-foreground">
            View, filter, and manage workshop approvals
          </p>
        </div>

        <Tabs defaultValue="all" onValueChange={setStatusFilter}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="needs_revision">Requested Edits</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {statusFilter === "all"
                    ? "All Workshops"
                    : statusFilter === "needs_revision"
                    ? "Workshops with Requested Edits"
                    : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Workshops`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredWorkshops.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No {statusFilter === "all" ? "" : statusFilter} workshops found.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorkshops.map((workshop) => (
                        <TableRow key={workshop._id}>
                          <TableCell className="font-medium">{workshop.name}</TableCell>
                          <TableCell>{workshop.faculty}</TableCell>
                          <TableCell>
                            {new Date(workshop.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(workshop.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{workshop.requiredBudget || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                workshop.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                              }
                              className={
                                workshop.status === "approved"
                                  ? "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-700 text-white border-0"
                                  : workshop.status === "needs_revision"
                                  ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                                  : ""
                              }
                            >
                              {workshop.status === "needs_revision" 
                                ? "edits requested" 
                                : workshop.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                                onClick={() => handleViewDetails(workshop)}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                              {(workshop.status === "pending" ) && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                    onClick={() => handleApprove(workshop._id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                                    onClick={() => handleReject(workshop._id)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
                                    onClick={() => openEditRequestDialog(workshop)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Workshop Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWorkshop?.name}</DialogTitle>
            <DialogDescription>
              Detailed information about the selected workshop
            </DialogDescription>
          </DialogHeader>

          {selectedWorkshop && (
            <div className="space-y-3">
              <p><strong>Faculty:</strong> {selectedWorkshop.faculty}</p>
              <p><strong>Description:</strong> {selectedWorkshop.description}</p>
              <p><strong>Location:</strong> {selectedWorkshop.location}</p>
              <p><strong>Start:</strong> {new Date(selectedWorkshop.startDate).toLocaleString()}</p>
              <p><strong>End:</strong> {new Date(selectedWorkshop.endDate).toLocaleString()}</p>
              <p><strong>Budget:</strong> {selectedWorkshop.requiredBudget}</p>
              <p><strong>Funding:</strong> {selectedWorkshop.fundingSource}</p>
              <p><strong>Status:</strong> {selectedWorkshop.status === "needs_revision" ? "Edits Requested" : selectedWorkshop.status}</p>
              <p><strong>Created By:</strong> {selectedWorkshop.createdBy?.firstName} {selectedWorkshop.createdBy?.lastName}</p>
              {selectedWorkshop.revisionComments && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p><strong>Revision Comments:</strong></p>
                  <p className="mt-1 text-sm">{selectedWorkshop.revisionComments}</p>
                </div>
              )}
            </div>
          )}

          {selectedWorkshop?.status === "pending" && (
            <DialogFooter className="flex justify-end gap-3 mt-4">
              <Button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                onClick={() => handleApprove(selectedWorkshop._id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                onClick={() => handleReject(selectedWorkshop._id)}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button
                variant="outline"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
                onClick={() => {
                  setShowDetailsDialog(false);
                  setShowEditRequestDialog(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Request Edits
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Edits Dialog */}
      <Dialog open={showEditRequestDialog} onOpenChange={setShowEditRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Edits</DialogTitle>
            <DialogDescription>
              Specify what needs to be edited in this workshop
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="revision-comments">Edit Requirements</Label>
              <Textarea
                id="revision-comments"
                placeholder="Please describe what changes are needed..."
                value={revisionComments}
                onChange={(e) => setRevisionComments(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditRequestDialog(false);
                setRevisionComments("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestEdits}>
              <Edit className="mr-2 h-4 w-4" /> Send Edit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}