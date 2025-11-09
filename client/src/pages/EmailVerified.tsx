import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EmailVerified() {
  const [, params] = useRoute("/verify-email/:token");
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = params?.token;
        console.log("Token from params:", token);
        if (!token) {
          setStatus("error");
          setMessage("Invalid verification link");
          return;
        }

        console.log(
          "Calling verification endpoint:",
          `/api/auth/verify-email/${token}`
        );
        const response = await fetch(
          `http://localhost:4000/api/auth/verify-email/${token}`
        );
        const data = await response.json();
        console.log("Verification response:", response.status, data);

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

  const handleGoToLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
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
              <p>You can now log in to your account and access the platform.</p>
            )}
            {status === "error" && (
              <p>
                The verification link may be invalid or expired. Please contact
                your administrator for assistance.
              </p>
            )}
          </CardContent>
        )}

        {status !== "loading" && (
          <CardFooter className="flex justify-center">
            <Button onClick={handleGoToLogin} className="w-full">
              {status === "success" ? "Go to Login" : "Back to Login"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
