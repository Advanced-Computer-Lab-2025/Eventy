import { Calendar, LayoutGrid, Plus, Ticket, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function MobileNav({
  activeTab = "discover",
  onTabChange,
}: MobileNavProps) {
  const tabs = [
    { id: "discover", icon: LayoutGrid, label: "Discover" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "create", icon: Plus, label: "Create" },
    { id: "tickets", icon: Ticket, label: "My Events" },
    { id: "profile", icon: User, label: "Profile" },
  ];

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
              onClick={() => onTabChange?.(tab.id)}
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
