import { Bell, Home, CalendarDays, Store, CheckCircle2, Plane, ClipboardList, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import { useLocation } from "wouter";

export default function EventsOfficeHeader() {
  const [, setLocation] = useLocation();

  const goHome = () => setLocation("/events-office/dashboard");

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <ProfileMenu />
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
            Home
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/create/bazaar")}
            data-testid="button-nav-bazaars"
          >
            <Store className="h-4 w-4" />
            Bazaars
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/events-office/create/conference")}
            data-testid="button-nav-conferences"
          >
            <CalendarDays className="h-4 w-4" />
            Conferences
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/vendor-requests")}
            data-testid="button-nav-vendor-requests"
          >
            <ClipboardList className="h-4 w-4" />
            Vendor Requests
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/create/trip")}
            data-testid="button-nav-trips"
          >
            <Dumbbell className="h-4 w-4" />
            Sports Facilities
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/approvals/workshops")}
            data-testid="button-nav-approvals"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approvals
          </Button>
        </div>
      </div>
    </header>
  );
}
