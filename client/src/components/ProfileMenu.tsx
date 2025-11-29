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
import { resetFavoritesCache } from "../hooks/useFavorites";

export default function ProfileMenu() {
  const [, setLocation] = useLocation();

  // Updated state to handle both camelCase and lowercase last name
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    companyName?: string;
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
    resetFavoritesCache();
    setUser(null);
    setLocation("/login");
  };

  const getInitials = () => {
    if (!user) return "";
    if (user.role !== "vendor") {
      const first = user.firstName?.[0] || "";
      // Check both lastName and lastname
      const last = user.lastName?.[0] || "";
      return (first + last).toUpperCase() || "";
    } else {
      return user.companyName?.[0]?.toUpperCase() || "";
    }
  };

  const initials = getInitials();

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
            {initials ? (
              <span className="text-sm font-semibold text-primary">
                {initials}
              </span>
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <DropdownMenuLabel className="text-sm font-semibold px-0">
              {(() => {
                if (!user) return "Guest";
                if (user.role !== "vendor") {
                  // Fallback logic for last name
                  const fName = user.firstName || "";
                  const lName = user.lastName || "";
                  return `${fName} ${lName}`.trim() || "Guest";
                } else {
                  return user.companyName || "Guest";
                }
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
          className="text-destructive flex items-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/10 transition-colors duration-150 cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
