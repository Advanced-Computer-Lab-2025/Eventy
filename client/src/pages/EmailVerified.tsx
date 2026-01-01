import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

export default function EmailVerified() {
  const [, params] = useRoute("/verify-email/:token");
  const [, setLocation] = useLocation();
  const API_BASE_URL = getApiBaseUrl();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = params?.token;
        logger.info("Token from params:", token);
        if (!token) {
          setStatus("error");
          setMessage("Invalid verification link");
          return;
        }

        logger.info(
          "Calling verification endpoint:",
          `/api/auth/verify-email/${token}`
        );
        const response = await fetch(
          `${API_BASE_URL}/api/auth/verify-email/${token}`
        );
        const data = await response.json();
        logger.info("Verification response:", response.status, data);

        if (response.ok) {
          setStatus("success");
          setMessage(
            data.message || "Your email has been verified successfully!"
          );
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [params]);

  // Auto-redirect to login after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/login");
    }, 4000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 px-4 relative">
      <style>
        {`
          @keyframes loading-bar {
            from { width: 0%; }
            to { width: 100%; }
          }
          .animate-loading-bar {
            animation: loading-bar 4s linear forwards;
          }
        `}
      </style>
      {/* Purple loading bar - full width */}
      <div className="absolute top-0 left-0 w-full h-1 bg-purple-600 animate-loading-bar"></div>
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {status === "loading" && (
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
            )}
            {status === "success" && (
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            )}
            {status === "error" && (
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
            )}

            <CardTitle className="text-2xl">
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription className="mt-2">
              {status === "loading" &&
                "Please wait while we verify your email address"}
              {status === "success" && message}
              {status === "error" && message}
            </CardDescription>
          </CardHeader>

          {status !== "loading" && (
            <CardContent className="text-center text-sm text-muted-foreground">
              {status === "success" && (
                <p>
                  You can now log in to your account and access the platform.
                </p>
              )}
              {status === "error" && (
                <p>
                  The verification link may be invalid or expired. Please
                  contact your administrator for assistance.
                </p>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
