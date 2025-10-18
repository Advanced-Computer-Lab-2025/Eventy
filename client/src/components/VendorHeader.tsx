import { Search, Bell, Calendar, Store, CheckCircle, Clock, XCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { useLocation } from "wouter";

interface VendorHeaderProps {
  onSearch?: (query: string) => void;
  hideSearch?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function VendorHeader({ 
  onSearch, 
  hideSearch = false, 
  activeTab = "upcoming",
  onTabChange 
}: VendorHeaderProps) {
  const [, setLocation] = useLocation();

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    // Update URL hash
    window.location.hash = tab;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="xl" />
          </div>

          {!hideSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bazaars..."
                  className="pl-10"
                  onChange={(e) => onSearch?.(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" data-testid="button-profile">
              <User className="h-5 w-5" />
            </Button>
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
            <Calendar className="h-4 w-4" />
            Upcoming Bazaars
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
        </div>
      </div>
    </header>
  );
}
