import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  User, 
  Mail, 
  Building2, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  QrCode,
  Store,
  CalendarDays
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

interface AttendeeData {
  attendee: {
    name: string;
    email: string;
    individualID: string;
  };
  application: {
    type: string;
    eventName: string;
    location: string;
    duration: string;
    boothSize: string;
    status: string;
  };
  vendor: {
    companyName: string;
    email: string;
  };
}

export default function AttendeeDetails() {
  const [, params] = useRoute("/attendee/:token");
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<AttendeeData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchAttendeeData = async () => {
      try {
        const token = params?.token;
        if (!token) {
          setStatus("error");
          setErrorMessage("Invalid QR code link");
          return;
        }

        console.log("🔵 Frontend: Fetching attendee data for token:", token);
        console.log("🔵 Frontend: API URL:", `${API_BASE_URL}/api/applications/attendee/${token}`);
        
        const response = await fetch(`${API_BASE_URL}/api/applications/attendee/${token}`);
        
        console.log("🔵 Frontend: Response status:", response.status);
        console.log("🔵 Frontend: Response statusText:", response.statusText);
        console.log("🔵 Frontend: Response headers:", Object.fromEntries(response.headers.entries()));
        console.log("🔵 Frontend: Content-Type:", response.headers.get("content-type"));
        
        // Read response as text first to see what we're actually getting
        const responseText = await response.text();
        console.log("🔵 Frontend: Raw response text (first 500 chars):", responseText.substring(0, 500));
        console.log("🔵 Frontend: Full response length:", responseText.length);
        
        // Check if response is HTML (starts with <!DOCTYPE or <html)
        if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
          console.error("❌ Frontend: Received HTML instead of JSON! Response starts with:", responseText.substring(0, 100));
          setStatus("error");
          setErrorMessage("Server returned HTML instead of JSON. The API route may not be registered correctly.");
          return;
        }
        
        // Try to parse as JSON
        let result;
        try {
          result = JSON.parse(responseText);
          console.log("🔵 Frontend: Parsed JSON result:", result);
        } catch (parseError) {
          console.error("❌ Frontend: Failed to parse response as JSON:", parseError);
          console.error("❌ Frontend: Response text that failed to parse:", responseText.substring(0, 500));
          setStatus("error");
          setErrorMessage(`Failed to parse server response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
          return;
        }

        if (response.ok && result.success) {
          setData(result.data);
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(result.message || `Failed to load attendee details (${response.status})`);
        }
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(`An error occurred: ${error?.message || "Unknown error"}`);
        console.error("❌ Frontend: Error fetching attendee data:", error);
        console.error("❌ Frontend: Error stack:", error?.stack);
      }
    };

    fetchAttendeeData();
  }, [params, API_BASE_URL]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading attendee details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Error</CardTitle>
            <CardDescription className="mt-2">{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              The QR code may be invalid or expired. Please contact the Events Office for assistance.
            </p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <QrCode className="h-4 w-4" />
            <span>QR Code Verification</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Attendee Verified</h1>
          <p className="text-muted-foreground">
            This QR code has been successfully verified
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Attendee Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Attendee Information</CardTitle>
              </div>
              <CardDescription>Personal details of the attendee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Name</span>
                </div>
                <p className="text-lg font-semibold">{data.attendee.name}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="text-lg">{data.attendee.email}</p>
              </div>

              {data.attendee.individualID && (
                <div className="pt-4 border-t">
                  <img
                    src={data.attendee.individualID}
                    alt="ID Card"
                    className="w-full rounded-lg border object-cover max-h-48"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Event Information</CardTitle>
              </div>
              <CardDescription>Details about the event or booth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>Type</span>
                </div>
                <p className="text-lg font-semibold">{data.application.type}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>Event/Booth</span>
                </div>
                <p className="text-lg">{data.application.eventName}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </div>
                <p className="text-lg">{data.application.location}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration</span>
                </div>
                <p className="text-lg">{data.application.duration}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Booth Size</span>
                </div>
                <p className="text-lg">{data.application.boothSize}</p>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span>Status</span>
                </div>
                {getStatusBadge(data.application.status)}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Vendor Information</CardTitle>
              </div>
              <CardDescription>Company details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Company Name</span>
                  </div>
                  <p className="text-lg font-semibold">{data.vendor.companyName}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Company Email</span>
                  </div>
                  <p className="text-lg">{data.vendor.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Eventy Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

