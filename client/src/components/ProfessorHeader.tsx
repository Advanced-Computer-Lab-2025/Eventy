import { Home, BookOpen, Dumbbell, Calendar, Heart, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
import WalletPopover from "./WalletPopover"; // Import the WalletPopover
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface ProfessorHeaderProps {
  homeHref?: string;
}

export default function ProfessorHeader({
  homeHref = "/professor",
}: ProfessorHeaderProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
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
          <div className="flex items-center gap-2">
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <WalletPopover /> {/* <-- Replaced dialog button with this */}
            <NotificationsPopover />
            <ThemeToggle />
            <ProfileMenu />
            {user?.firstName && user?.role && (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <span className="text-sm font-medium text-foreground">
                  {user.firstName} / {user.role.replace(/_/g, " ")}
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
            onClick={() => setLocation(homeHref)}
            data-testid="button-nav-home"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/professor/workshops")}
            data-testid="button-nav-workshops"
          >
            <BookOpen className="h-4 w-4" />
            My Workshops
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/my-events")}
            data-testid="button-nav-my-events"
          >
            <Calendar className="h-4 w-4" />
            My Events
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/favorites")}
            data-testid="button-nav-favorites"
          >
            <Heart className="h-4 w-4" />
            Favorites
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
