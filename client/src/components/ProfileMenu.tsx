"use client";

import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ProfileMenu() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border hover:bg-accent/30 transition-colors duration-200"
          data-testid="button-profile"
        >
          <User className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-2 rounded-xl shadow-lg bg-background border border-border"
      >
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <DropdownMenuLabel className="text-sm font-semibold">
              {(() => {
                if (!user) return "Guest";
                // Prefer companyName for vendors, otherwise fall back to first+last name
                if ((user as any).companyName) return (user as any).companyName;
                return (
                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                  "Guest"
                );
              })()}
            </DropdownMenuLabel>
            <div className="text-xs text-muted-foreground">
              {user?.email || "Not signed in"}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onSelect={handleLogout}
          className="text-destructive flex items-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/10 transition-colors duration-150"
        >
          <LogOut className="h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
