import { Users, Star, FileText, Gift, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
import { useLocation } from "wouter";

export default function AdminHeader() {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 -ml-6">
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>

        <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            data-testid="button-nav-dashboard"
            onClick={() => setLocation("/admin")}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            data-testid="button-nav-users"
            onClick={() => setLocation("/admin/users")}
          >
            <Users className="h-4 w-4" />
            Users
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            data-testid="button-nav-ratings"
            onClick={() => setLocation("/admin/ratings")}
          >
            <Star className="h-4 w-4" />
            Ratings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            data-testid="button-nav-attendees-report"
            onClick={() => setLocation("/reports/attendees")}
          >
            <FileText className="h-4 w-4" />
            Attendees Report
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/reports/sales")}
            data-testid="button-nav-sales-reports"
          >
            <FileText className="h-4 w-4" />
            Sales Report
          </Button>
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
