import {
  Home,
  CheckCircle2,
  Plane,
  ClipboardList,
  Dumbbell,
  Archive,
  FileText,
  PieChart,
  Gift,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function EventsOfficeHeader() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    companyName?: string;
  } | null>(null);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);

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

  const goHome = () => setLocation("/events-office/dashboard");

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-3">
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
            className="gap-2"
            onClick={goHome}
            data-testid="button-nav-home"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/create/trip")}
            data-testid="button-nav-trips"
          >
            <Plane className="h-4 w-4" />
            Trips
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/sports")}
            data-testid="button-nav-sports"
          >
            <Dumbbell className="h-4 w-4" />
            Sports Facilities
          </Button>
          <DropdownMenu
            open={isApprovalsOpen}
            onOpenChange={setIsApprovalsOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 cursor-pointer focus-visible:ring-0 hover:bg-accent"
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
            className="gap-2"
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
                className="gap-2 cursor-pointer focus-visible:ring-0 hover:bg-accent"
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
            className="gap-2"
            onClick={() => setLocation("/loyalty-partners")}
            data-testid="button-nav-loyalty-partners"
          >
            <Gift className="h-4 w-4" />
            Loyalty Partners
          </Button>
        </div>
      </div>
    </header>
  );
}
