import {
  Home,
  BookOpen,
  Dumbbell,
  Calendar,
  Store,
  Heart,
  Gift,
  Star,
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
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
import WalletPopover from "./WalletPopover"; // Import the WalletPopover
import CalendarPopover from "./CalendarPopover";
import { useLocation } from "wouter";
import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { logger } from "@/lib/logger";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.user || parsed;
    } catch {
      return null;
    }
  });
  const apiBase = getApiBaseUrl();

  // 2. Fetch User Profile Logic
  const fetchUserProfile = useCallback(async () => {
    try {
      let token: string | null = null;
      try {
        token = localStorage.getItem("token");
      } catch (error) {
        logger.warn("Storage access blocked; skipping profile fetch", error);
        return;
      }
      if (!token) return;

      const res = await fetch(`${apiBase}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const payload = await res.json();
        // Extract inner user object safely
        const freshUserData = payload.user || payload.data || payload;
        setUser(freshUserData);
        try {
          localStorage.setItem("user", JSON.stringify(freshUserData));
        } catch {
          void 0;
        }
      }
    } catch (err) {
      logger.error("Failed to fetch user profile", err);
    }
  }, [apiBase]);

  useEffect(() => {
    // Fetch fresh data immediately
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUserProfile();
  }, [fetchUserProfile]);

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
              onClick={() => setLocation("/professor")}
            >
              <Logo size="xl" />
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* 3. Pass Balance Props */}
            <WalletPopover
              balance={user?.walletBalance ?? 0}
              onRefreshBalance={fetchUserProfile}
            />

            <CalendarPopover />
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
                        location === homeHref ? "bg-accent font-medium" : ""
                      }`}
                      onClick={() => setLocation(homeHref)}
                    >
                      <Home className="h-5 w-5" />
                      Dashboard
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/professor/workshops"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/professor/workshops")}
                    >
                      <BookOpen className="h-5 w-5" />
                      My Workshops
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/my-events" ? "bg-accent font-medium" : ""
                      }`}
                      onClick={() => setLocation("/my-events")}
                    >
                      <Calendar className="h-5 w-5" />
                      My Events
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
                        location === "/booth-vote"
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setLocation("/booth-vote")}
                    >
                      <Store className="h-5 w-5" />
                      Booth Voting
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 px-4 h-12 rounded-none ${
                        location === "/favorites" ? "bg-accent font-medium" : ""
                      }`}
                      onClick={() => setLocation("/favorites")}
                    >
                      <Heart className="h-5 w-5" />
                      Favorites
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
