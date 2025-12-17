import { Home, Store, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import CalendarPopover from "./CalendarPopover";
import { useLocation } from "wouter";
import { useState } from "react";
import { Gift } from "lucide-react";
import LoyaltyProgramDialog from "./LoyaltyProgramDialog";

interface VendorHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function VendorHeader({
  activeTab = "upcoming",
  onTabChange,
}: VendorHeaderProps) {
  const [location, setLocation] = useLocation();

  const [isLoyaltyDialogOpen, setIsLoyaltyDialogOpen] = useState(false);
  const [user, setUser] = useState<{
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

  // Check URL hash on component mount and when it changes
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === "loyalty-program") {
      setIsLoyaltyDialogOpen(true);
    }
  }, []);

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    window.location.hash = tab;
  };

  const handleLoyaltyProgramClick = () => {
    window.location.hash = "loyalty-program";
    setIsLoyaltyDialogOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (location !== "/vendor/dashboard") {
                setLocation("/vendor/dashboard");
              } else {
                window.location.hash = "upcoming";
              }
            }}
          >
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-2">
            <CalendarPopover />
            <ThemeToggle />
            <ProfileMenu />
            {user?.role && user?.companyName && (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <span className="text-sm font-medium text-foreground">
                  {user.companyName} / {user.role.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${activeTab === "upcoming" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => handleTabClick("upcoming")}
            data-testid="button-nav-upcoming"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${activeTab === "platform-booths" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => handleTabClick("platform-booths")}
            data-testid="button-nav-platform-booths"
          >
            <Store className="h-4 w-4" />
            Platform Booths
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${activeTab === "participating" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => handleTabClick("participating")}
            data-testid="button-nav-participating"
          >
            <CheckCircle className="h-4 w-4" />
            My Participations
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${activeTab === "pending" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => handleTabClick("pending")}
            data-testid="button-nav-pending"
          >
            <Clock className="h-4 w-4" />
            Pending Requests
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${activeTab === "rejected" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => handleTabClick("rejected")}
            data-testid="button-nav-rejected"
          >
            <XCircle className="h-4 w-4" />
            Rejected Requests
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${window.location.hash === "#loyalty-program" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={handleLoyaltyProgramClick}
            data-testid="button-nav-loyalty"
          >
            <Gift className="h-4 w-4" />
            Loyalty Program
          </Button>
        </div>
      </div>

      <LoyaltyProgramDialog
        open={isLoyaltyDialogOpen}
        onOpenChange={(open) => {
          setIsLoyaltyDialogOpen(open);
          if (!open) {
            // Remove the hash when closing the dialog
            window.history.pushState(
              "",
              document.title,
              window.location.pathname + window.location.search
            );
          } else {
            window.location.hash = "loyalty-program";
          }
        }}
      />
    </header>
  );
}
