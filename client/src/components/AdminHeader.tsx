import { Users, Star, FileText, Gift, Home, Camera, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
// Calendar popover removed per request
import { useLocation } from "wouter";
import { useState } from "react";

export default function AdminHeader() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize state directly from localStorage to avoid setState in useEffect
  const [user] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    companyName?: string;
  } | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div
              className="cursor-pointer"
              onClick={() => setLocation("/admin")}
            >
              <Logo size="xl" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <ThemeToggle />
            <ProfileMenu />

            {/* Mobile navigation drawer */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col py-2">
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/admin" ? "bg-accent font-medium" : ""
                      }`}
                      onClick={() => setLocation("/admin")}
                    >
                      <Home className="h-5 w-5" />
                      Dashboard
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/live-moments"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/live-moments")}
                    >
                      <Camera className="h-5 w-5" />
                      Live Moments
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/admin/users"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/admin/users")}
                    >
                      <Users className="h-5 w-5" />
                      Users
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/feedback" ? "bg-accent font-medium" : ""
                      }`}
                      onClick={() => setLocation("/feedback")}
                    >
                      <Star className="h-5 w-5" />
                      Feedback
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/reports/attendees"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/reports/attendees")}
                    >
                      <FileText className="h-5 w-5" />
                      Attendees Report
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/reports/sales"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/reports/sales")}
                    >
                      <FileText className="h-5 w-5" />
                      Sales Report
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/loyalty-partners"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/loyalty-partners")}
                    >
                      <Gift className="h-5 w-5" />
                      Loyalty Partners
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/vendor-requests"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/vendor-requests")}
                    >
                      <Users className="h-5 w-5" />
                      Vendor Requests
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>

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
            className={`gap-2 ${location === "/live-moments" ? "underline decoration-primary decoration-2" : ""}`}
            data-testid="button-nav-live-moments"
            onClick={() => setLocation("/live-moments")}
          >
            <Camera className="h-4 w-4" />
            Live Moments
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
            className={`gap-2 ${location === "/feedback" ? "underline decoration-primary decoration-2" : ""}`}
            data-testid="button-nav-feedback"
            onClick={() => setLocation("/feedback")}
          >
            <Star className="h-4 w-4" />
            Feedback
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
