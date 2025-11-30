"use client";

import {
  Search,
  Bell,
  LayoutGrid,
  User,
  Home,
  LogOut,
  Store,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ProfileMenu from "./ProfileMenu";

interface HeaderProps {
  onSearch?: (query: string) => void;
  homeOnly?: boolean;
  homeHref?: string;
  hideSearch?: boolean;
  showHomeTop?: boolean;
  hideBottomNav?: boolean;
}

export default function Header({
  onSearch,
  homeOnly = false,
  homeHref = "/",
  hideSearch = false,
  showHomeTop = false,
  hideBottomNav = false,
}: HeaderProps) {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setLocation("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="xl" />
            {showHomeTop && (
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => setLocation(homeHref)}
                data-testid="button-header-home-top"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            )}
          </div>

          {!hideSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="pl-10"
                  onChange={(e) => onSearch?.(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {user?.firstName && (
              <span className="hidden md:inline-block text-sm font-medium text-foreground">
                {user.firstName}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />

            {/* profile menu (logout only) */}
            <ProfileMenu />
          </div>
        </div>

        {!hideBottomNav && (
          <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
            {homeOnly ? (
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
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  data-testid="button-nav-all"
                >
                  <LayoutGrid className="h-4 w-4" />
                  All Events
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 ${location === "/admin/ratings" ? "underline decoration-primary decoration-2" : ""}`}
                  onClick={() => setLocation("/admin/ratings")}
                  data-testid="button-nav-ratings"
                >
                  <Star className="h-4 w-4" />
                  Ratings
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-nav-academic"
                >
                  Academic
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-nav-social"
                >
                  Social
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-nav-sports"
                >
                  Sports
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-nav-cultural"
                >
                  Cultural
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-nav-career"
                >
                  Career
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
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
