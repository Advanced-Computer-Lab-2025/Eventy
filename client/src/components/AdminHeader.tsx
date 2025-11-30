import { Users, Star, FileText, Gift, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function AdminHeader() {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    companyName?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div
            className="flex items-center gap-2 -ml-6 cursor-pointer"
            onClick={() => setLocation("/admin")}
          >
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <ThemeToggle />
            <ProfileMenu />
            {user?.role && (user?.firstName || user?.email) && (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <span className="text-sm font-medium text-foreground">
                  {user.firstName || user.email?.split("@")[0] || "User"} /{" "}
                  {user.role.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/admin" ? "underline decoration-primary decoration-2" : ""}`}
            data-testid="button-nav-dashboard"
            onClick={() => setLocation("/admin")}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/admin/users" ? "underline decoration-primary decoration-2" : ""}`}
            data-testid="button-nav-users"
            onClick={() => setLocation("/admin/users")}
          >
            <Users className="h-4 w-4" />
            Users
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/admin/ratings" ? "underline decoration-primary decoration-2" : ""}`}
            data-testid="button-nav-ratings"
            onClick={() => setLocation("/admin/ratings")}
          >
            <Star className="h-4 w-4" />
            Ratings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/reports/attendees" ? "underline decoration-primary decoration-2" : ""}`}
            data-testid="button-nav-attendees-report"
            onClick={() => setLocation("/reports/attendees")}
          >
            <FileText className="h-4 w-4" />
            Attendees Report
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/reports/sales" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/reports/sales")}
            data-testid="button-nav-sales-reports"
          >
            <FileText className="h-4 w-4" />
            Sales Report
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/loyalty-partners" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/loyalty-partners")}
            data-testid="button-nav-loyalty-partners"
          >
            <Gift className="h-4 w-4" />
            Loyalty Partners
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/vendor-requests")}
            data-testid="button-nav-vendor-requests"
          >
            <Users className="h-4 w-4" />
            Vendor Requests
          </Button>
        </div>
      </div>
    </header>
  );
}
