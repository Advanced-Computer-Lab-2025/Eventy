import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/apiBase";
import { logger } from "@/lib/logger";

const API_BASE_URL = getApiBaseUrl();

export default function GoogleCalendarIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("calendar_connected") === "true") {
      toast({
        title: "✅ Calendar Connected!",
        description: "Your Google Calendar has been successfully connected.",
      });
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get("calendar_error")) {
      toast({
        title: "❌ Connection Failed",
        description: "Failed to connect Google Calendar. Please try again.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/calendar/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.data.connected);
      }
    } catch (error) {
      logger.error("Error checking calendar status:", error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/calendar/auth/google`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Google OAuth page
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to initiate Google Calendar connection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Error connecting calendar:", error);
      toast({
        title: "Error",
        description: "An error occurred while connecting to Google Calendar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/calendar/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setIsConnected(false);
        toast({
          title: "Disconnected",
          description: "Google Calendar has been disconnected.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to disconnect Google Calendar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Error disconnecting calendar:", error);
      toast({
        title: "Error",
        description: "An error occurred while disconnecting Google Calendar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/calendar/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "✅ Sync Complete",
          description: `Synced ${data.data.totalEvents} events to your Google Calendar.`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: "Failed to sync events to Google Calendar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Error syncing calendar:", error);
      toast({
        title: "Error",
        description: "An error occurred while syncing your calendar.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Calendar Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </DialogTitle>
          <DialogDescription>
            Connect your Google Calendar to automatically sync your registered
            events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Connection Status Card */}
          <Card
            className={
              isConnected
                ? "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/40"
                : "border-gray-200 bg-white dark:bg-card dark:border-gray-700"
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-gray-400 dark:text-gray-300" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {isConnected ? "Connected" : "Not Connected"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isConnected
                        ? "Your Google Calendar is linked"
                        : "Connect to sync events automatically"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Benefits of connecting:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>View events across all your devices</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Receive Google Calendar notifications</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Connect Google Calendar
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Sync All Events Now
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Disconnect Google Calendar
                </Button>
              </>
            )}
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            🔒 We only access your calendar to add events. Your privacy is
            protected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
