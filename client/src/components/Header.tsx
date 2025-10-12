import { Search, Bell, LayoutGrid, User, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { useLocation } from "wouter";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2 -ml-6">
            <Logo size="xl" />
          </div>

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
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-nav-all">
            <LayoutGrid className="h-4 w-4" />
            All Events
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-academic">Academic</Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-social">Social</Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-sports">Sports</Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-cultural">Cultural</Button>
          <Button variant="ghost" size="sm" data-testid="button-nav-career">Career</Button>
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-nav-bazaars"
            onClick={() => setLocation("/bazaars")}
          >
            <Store className="h-4 w-4" />
            Bazaars
          </Button>
        </div>
      </div>
    </header>
  );
}
