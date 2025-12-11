import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Home,
  Calendar,
  Dumbbell,
  Heart,
  Gift,
  Store,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
import WalletPopover from "./WalletPopover";

interface StudentHeaderProps {
  homeHref?: string;
}

interface UserData {
  _id?: string;
  id?: string; // Handle both _id and id based on DB
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  companyName?: string;
  walletBalance?: number;
}

export default function StudentHeader({
  homeHref = "/home",
}: StudentHeaderProps) {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<UserData | null>(null);

  // Function to fetch fresh user data (including walletBalance)
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const payload = await res.json();

        // --- CRITICAL FIX ---
        // Based on your JSON: { message: "...", user: { ... } }
        // We must extract the inner 'user' object.
        const freshUserData = payload.user || payload.data || payload;

        setUser(freshUserData);
        localStorage.setItem("user", JSON.stringify(freshUserData));
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  useEffect(() => {
    // 1. Initial Load from LocalStorage (fast render)
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        // Handle case where localStorage accidentally saved the wrapper
        setUser(parsed.user || parsed);
      }
    } catch (err) {
      // ignore
    }

    // 2. Fetch fresh data from API (accurate balance)
    fetchUserProfile();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setLocation("/home")}
          >
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Pass the balance to the child. Default to 0 if undefined. */}
            <WalletPopover
              balance={user?.walletBalance ?? 0}
              onRefreshBalance={fetchUserProfile}
            />

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
            className="gap-2"
            onClick={() => setLocation("/booth-vote")}
            data-testid="button-nav-booth-vote"
          >
            <Store className="h-4 w-4" />
            Booth Voting
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/feedback" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/feedback")}
            data-testid="button-nav-feedback"
          >
            <Star className="h-4 w-4" />
            Feedback
          </Button>
        </div>
      </div>
    </header>
  );
}
