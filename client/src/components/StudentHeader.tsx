import React from "react"; // No longer need useState here
import { useLocation } from "wouter";
import {
  Bell,
  Home,
  Calendar,
  Dumbbell,
  Heart,
  Gift,
  Wallet,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
import { useEffect, useState } from "react";
import WalletPopover from "./WalletPopover"; // Import the new WalletPopover

interface StudentHeaderProps {
  homeHref?: string;
}

export default function StudentHeader({
  homeHref = "/home",
}: StudentHeaderProps) {
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
          <div className="flex items-center gap-2">
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* The WalletPopover now contains its own trigger button */}
            <WalletPopover />
            <NotificationsPopover />
            <ThemeToggle />
            <ProfileMenu />
            {user?.role &&
              ((user.role === "vendor" && user?.companyName) ||
                (user.role !== "vendor" && user?.firstName)) && (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <span className="text-sm font-medium text-foreground">
                    {user.role === "vendor" ? user.companyName : user.firstName}{" "}
                    / {user.role.replace(/_/g, " ")}
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
          {/* ... all your navigation buttons ... */}
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === homeHref ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation(homeHref)}
          >
            <Home className="h-4 w-4" /> Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/my-events" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/my-events")}
          >
            <Calendar className="h-4 w-4" /> My Events
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/sports" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/sports")}
          >
            <Dumbbell className="h-4 w-4" /> Sports Facilities
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/favorites" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/favorites")}
          >
            <Heart className="h-4 w-4" /> Favorites
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/loyalty-partners" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/loyalty-partners")}
          >
            <Gift className="h-4 w-4" /> Loyalty Partners
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/admin/ratings" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/admin/ratings")}
          >
            <Star className="h-4 w-4" /> Ratings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/booth-vote")}
            data-testid="button-nav-booth-vote"
          >
            <Store className="h-4 w-4" />
            Booth Vote
          </Button>
        </div>
      </div>
    </header>
  );
}
