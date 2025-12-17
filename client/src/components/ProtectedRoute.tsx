import { useEffect, useState } from "react";
import { useLocation } from "wouter";

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
      const token = localStorage.getItem("token");

      if (!token) {
        setLocation(redirectTo);
        return;
      }

      try {
        // Decode JWT token to get user role
        const payload = JSON.parse(atob(token.split(".")[1]));
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
