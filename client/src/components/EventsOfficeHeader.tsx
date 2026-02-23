import {
  Home,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Archive,
  FileText,
  Gift,
  Star,
  ChevronDown,
  Camera,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
// CalendarPopover removed from events office header
import { useLocation } from "wouter";
import { useState } from "react";

export default function EventsOfficeHeader() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);

  const goHome = () => setLocation("/events-office/dashboard");

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
              onClick={() => setLocation("/events-office/dashboard")}
            >
              <Logo size="xl" />
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                        location === "/events-office/dashboard"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={goHome}
                    >
                      <Home className="h-5 w-5" />
                      Dashboard
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/sports" ? "bg-accent font-medium" : ""
                      }`}
                      onClick={() => setLocation("/sports")}
                    >
                      <Dumbbell className="h-5 w-5" />
                      Sports Facilities
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
                        location === "/approvals/workshops"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/approvals/workshops")}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Workshop Approvals
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
                      <ClipboardList className="h-5 w-5" />
                      Vendor Requests
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/events-office/archived"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/events-office/archived")}
                    >
                      <Archive className="h-5 w-5" />
                      Archived
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
                        location === "/feedback" ? "bg-accent font-medium" : ""
                      }`}
                      onClick={() => setLocation("/feedback")}
                    >
                      <Star className="h-5 w-5" />
                      Feedback
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
            className={`gap-2 ${location === "/events-office/dashboard" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={goHome}
            data-testid="button-nav-home"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/sports" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/sports")}
            data-testid="button-nav-sports"
          >
            <Dumbbell className="h-4 w-4" />
            Sports Facilities
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/live-moments" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/live-moments")}
            data-testid="button-nav-live-moments"
          >
            <Camera className="h-4 w-4" />
            Live Moments
          </Button>
          <DropdownMenu
            open={isApprovalsOpen}
            onOpenChange={setIsApprovalsOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 cursor-pointer focus-visible:ring-0 hover:bg-accent ${location === "/approvals/workshops" || location === "/vendor-requests" ? "underline decoration-primary decoration-2" : ""}`}
                data-testid="button-nav-approvals"
                onMouseEnter={() => setIsApprovalsOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approvals
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              onMouseLeave={() => setIsApprovalsOpen(false)}
            >
              <DropdownMenuItem
                onClick={() => setLocation("/approvals/workshops")}
                className="cursor-pointer"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Workshop Approvals
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation("/vendor-requests")}
                className="cursor-pointer"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Vendor Requests
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/events-office/archived" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/events-office/archived")}
            data-testid="button-nav-archived"
          >
            <Archive className="h-4 w-4" />
            Archived
          </Button>
          <DropdownMenu open={isReportsOpen} onOpenChange={setIsReportsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 cursor-pointer focus-visible:ring-0 hover:bg-accent ${location === "/reports/attendees" || location === "/reports/sales" ? "underline decoration-primary decoration-2" : ""}`}
                data-testid="button-nav-reports"
                onMouseEnter={() => setIsReportsOpen(true)}
              >
                <FileText className="h-4 w-4" />
                Reports
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              onMouseLeave={() => setIsReportsOpen(false)}
            >
              <DropdownMenuItem
                onClick={() => setLocation("/reports/attendees")}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Attendees Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocation("/reports/sales")}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Sales Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            className={`gap-2 ${location === "/feedback" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/feedback")}
            data-testid="button-nav-ratings"
          >
            <Star className="h-4 w-4" />
            Feedback
          </Button>
        </div>
      </div>
    </header>
  );
}
