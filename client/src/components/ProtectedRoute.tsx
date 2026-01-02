import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { logger } from "@/lib/logger";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
};

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      let token: string | null = null;
      try {
        token = localStorage.getItem("token");
      } catch (error) {
        logger.warn("Storage access blocked; redirecting to login", error);
        setLocation(redirectTo);
        return;
      }

      if (!token) {
        setLocation(redirectTo);
        return;
      }

      try {
        // Decode JWT token to get user role
        const parts = token.split(".");
        const payloadBase64 = parts.length >= 2 ? parts[1] : "";
        if (!payloadBase64) {
          throw new Error("Invalid token format");
        }

        const payload = JSON.parse(atob(payloadBase64));
        const userRole = payload.role;

        if (allowedRoles.includes(userRole)) {
          setIsAuthorized(true);
        } else {
          // User is authenticated but doesn't have permission
          setLocation("/");
        }
      } catch (error) {
        logger.error("Failed to decode token:", error);
        setLocation(redirectTo);
      }
    };

    checkAuth();
  }, [allowedRoles, redirectTo, setLocation]);

  // Show nothing while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Render children only if authorized
  return isAuthorized ? <>{children}</> : null;
}
