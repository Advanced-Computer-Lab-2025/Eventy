import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getAuthToken } from "@/lib/authToken";

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
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
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
            return;
          }

          setLocation("/");
          return;
        } catch (error) {
          logger.error("Failed to decode token:", error);
          // Fall through to cookie session check.
        }
      }

      // Cookie-based session check (works with Vercel /api proxy).
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          setLocation(redirectTo);
          return;
        }

        const data = await res.json();
        const userRole = data?.user?.role;

        if (userRole && allowedRoles.includes(userRole)) {
          setIsAuthorized(true);
          return;
        }

        // Authenticated but not authorized
        setLocation("/");
      } catch (error) {
        logger.error("Session check failed:", error);
        setLocation(redirectTo);
      }
    };

    void checkAuth();
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
