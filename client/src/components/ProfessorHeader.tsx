import { Home, BookOpen, Dumbbell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";
import NotificationsPopover from "./NotificationsPopover";
import { useLocation } from "wouter";

interface ProfessorHeaderProps {
  homeHref?: string;
}

export default function ProfessorHeader({
  homeHref = "/professor",
}: ProfessorHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="xl" />
          </div>

          <div className="flex items-center gap-2">
            <NotificationsPopover />
            <ThemeToggle />
            <ProfileMenu />
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
            Home
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setLocation("/professor/workshops")}
            data-testid="button-nav-workshops"
          >
            <BookOpen className="h-4 w-4" />
            Workshops
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
        </div>
      </div>
    </header>
  );
}
