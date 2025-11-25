import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StudentHeader from "@/components/StudentHeader";
import StaffHeader from "@/components/StaffHeader";
import ProfessorHeader from "@/components/ProfessorHeader";
import EventsOfficeHeader from "@/components/EventsOfficeHeader";
import AdminHeader from "@/components/AdminHeader";

interface Partner {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  discountRate: number;
  promoCode: string;
  termsAndConditions: string;
  expiryDate: string;
  createdAt: string;
}

export default function ApprovedLoyaltyPartnersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        const role = (parsed?.role || "").toLowerCase();
        setUserRole(role);
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
    }
  }, []);

  const renderHeader = () => {
    switch (userRole) {
      case "student":
        return <StudentHeader />;
      case "staff":
      case "ta":
        return <StaffHeader />;
      case "professor":
        return <ProfessorHeader />;
      case "events_office":
        return <EventsOfficeHeader />;
      case "admin":
        return <AdminHeader />;
      default:
        return null;
    }
  };

  const fetchPartners = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        "http://localhost:4000/api/loyalty-partners/partners",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Fetched data:", data); // Debugging log
      setPartners(data.data || []);
    } catch (error: any) {
      console.error("Error fetching loyalty partners:", error);
      setError(error.message || "Failed to fetch loyalty partners");
      toast({
        title: "Error",
        description: error.message || "Failed to fetch loyalty partners",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (isLoading) {
    return (
      <>
        {renderHeader()}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">
                Loading loyalty partners...
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {renderHeader()}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Failed to Load Partners
                  </h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={fetchPartners} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {renderHeader()}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">GUC Loyalty Program Partners</h1>
            <p className="text-muted-foreground">
              View all approved vendors participating in the loyalty program
            </p>
          </div>
          <Button
            onClick={fetchPartners}
            variant="outline"
            className="gap-2 shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {partners.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Partners Found
                  </h3>
                  <p className="text-muted-foreground">
                    There are currently no approved vendors in the loyalty
                    program.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Approved Partners ({partners.length})
              </CardTitle>
              <CardDescription>
                List of all vendors with active loyalty program partnerships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">
                        Vendor Name
                      </TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[120px]">
                        Discount Rate
                      </TableHead>
                      <TableHead className="min-w-[110px]">
                        Promo Code
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        Terms & Conditions
                      </TableHead>
                      <TableHead className="min-w-[130px]">
                        Expiry Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => (
                      <TableRow key={partner.vendorId}>
                        <TableCell className="font-medium truncate px-4">
                          {partner.vendorName}
                        </TableCell>
                        <TableCell className="truncate px-4">
                          {partner.vendorEmail}
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            {partner.discountRate}% OFF
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {partner.promoCode}
                          </code>
                        </TableCell>
                        <TableCell className="truncate max-w-xs px-4">
                          <p
                            className="text-sm truncate"
                            title={partner.termsAndConditions}
                          >
                            {partner.termsAndConditions}
                          </p>
                        </TableCell>
                        <TableCell className="px-4">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-sm">
                              {formatDate(partner.expiryDate)}
                            </span>
                            {isExpired(partner.expiryDate) && (
                              <Badge
                                variant="destructive"
                                className="text-xs shrink-0"
                              >
                                Expired
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
