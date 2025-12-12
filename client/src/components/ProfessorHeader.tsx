import {
  Bell,
  User,
  Home,
  BookOpen,
  Dumbbell,
  Calendar,
  Store,
  Heart,
  Gift,
  Star,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
import WalletPopover from "./WalletPopover"; // Import the WalletPopover
import CalendarPopover from "./CalendarPopover";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface ProfessorHeaderProps {
  homeHref?: string;
}

// 1. Updated User Interface
interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  companyName?: string;
  walletBalance?: number;
}

export default function ProfessorHeader({
  homeHref = "/professor",
}: ProfessorHeaderProps) {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<UserData | null>(null);

  // 2. Fetch User Profile Logic
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
        // Extract inner user object safely
        const freshUserData = payload.user || payload.data || payload;
        setUser(freshUserData);
        localStorage.setItem("user", JSON.stringify(freshUserData));
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  useEffect(() => {
    // Initial Load from LocalStorage
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || parsed);
      }
    } catch (err) {
      // ignore
    }
    // Fetch fresh data immediately
    fetchUserProfile();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setLocation("/professor")}
          >
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* 3. Pass Balance Props */}
            <WalletPopover
              balance={user?.walletBalance ?? 0}
              onRefreshBalance={fetchUserProfile}
            />

            <NotificationsPopover />
            <ThemeToggle />
            <ProfileMenu />
            {user?.role && user?.firstName && (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <span className="text-sm font-medium text-foreground">
                  {user.firstName} / {user.role.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Unchanged) */}
        <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === homeHref ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation(homeHref)}
            data-testid="button-nav-home"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/professor/workshops" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/professor/workshops")}
            data-testid="button-nav-workshops"
          >
            <BookOpen className="h-4 w-4" />
            My Workshops
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/my-events" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/my-events")}
            data-testid="button-nav-my-events"
          >
            <Calendar className="h-4 w-4" />
            My Events
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
            className={`gap-2 ${location === "/booth-vote" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/booth-vote")}
            data-testid="button-nav-booth-vote"
          >
            <Store className="h-4 w-4" />
            Booth Voting
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${location === "/favorites" ? "underline decoration-primary decoration-2" : ""}`}
            onClick={() => setLocation("/favorites")}
            data-testid="button-nav-favorites"
          >
            <Heart className="h-4 w-4" />
            Favorites
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
