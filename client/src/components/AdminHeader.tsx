import { Bell, LayoutGrid, User, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
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
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>

        <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-nav-all">
            <LayoutGrid className="h-4 w-4" />
            All Events
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-academic">Academic</Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-social">Social</Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-sports">Sports</Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-cultural">Cultural</Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-career">Career</Button>
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-nav-admin-dashboard"
            onClick={() => setLocation("/admin")}
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>
      </div>
    </header>
  );
}
