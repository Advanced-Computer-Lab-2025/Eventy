import { Calendar, LayoutGrid, Plus, Ticket, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface MobileNavProps {
  onCreateEvent?: () => void;
}

export default function MobileNav({ onCreateEvent }: MobileNavProps) {
  const [location, setLocation] = useLocation();

  const tabs = [
    { id: "discover", icon: LayoutGrid, label: "Discover", path: "/home" },
    { id: "calendar", icon: Calendar, label: "Calendar", path: "/calendar" },
    { id: "create", icon: Plus, label: "Create", path: null },
    { id: "my-events", icon: Ticket, label: "My Events", path: "/my-events" },
    { id: "favorites", icon: Heart, label: "Favorites", path: "/favorites" },
  ];

  const activeTab = (() => {
    if (location === "/home") return "discover";
    if (location === "/calendar") return "calendar";
    if (location === "/my-events") return "my-events";
    if (location === "/favorites") return "favorites";
    return "discover";
  })();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => {
                if (tab.id === "create") {
                  onCreateEvent?.();
                } else if (tab.path) {
                  setLocation(tab.path);
                }
              }}
              data-testid={`button-nav-${tab.id}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
