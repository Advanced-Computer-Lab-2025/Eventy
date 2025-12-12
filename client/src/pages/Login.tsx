"use client";

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";

export default function Login() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Check for calendar connection success/error on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has("calendar_connected")) {
      toast({
        title: "Google Calendar Connected! 🎉",
        description: "Your calendar is now synced with Google Calendar.",
      });
    }

    if (params.has("calendar_error")) {
      const errorCode = params.get("calendar_error");
      let errorMsg = "Failed to connect calendar";

      if (errorCode === "no_code") {
        errorMsg = "Authorization code missing from Google";
      } else if (errorCode === "no_session") {
        errorMsg = "Session expired, please try again";
      } else if (errorCode === "auth_failed") {
        errorMsg = "Failed to authenticate with Google Calendar";
      }

      toast({
        variant: "destructive",
        title: "Calendar Connection Failed ❌",
        description: errorMsg,
      });
    }
  }, [toast]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = (data?.user?.role ?? data?.role ?? "").toLowerCase();

      // Use companyName for vendors, firstName for other users
      let displayName = "user";
      if (role === "vendor") {
        displayName = data.user.companyName || "Vendor";
      } else if (data.user.firstName) {
        displayName = data.user.firstName;
      } else if (data.user.email) {
        // Extract name from email (part before @) for events_office, admin, etc.
        const emailName = data.user.email.split("@")[0];
        displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }

      toast({
        title: "Login successful 🎉",
        description: `Welcome back, ${displayName}!`,
      });

      setTimeout(() => {
        // Prefer the normalized `role` variable for comparisons
        if (role === "vendor") {
          setLocation("/vendor/dashboard");
        } else if (role === "events_office") {
          setLocation("/events-office/dashboard");
        } else if (role === "admin") {
          setLocation("/admin");
        } else if (role === "staff" || role === "ta") {
          setLocation("/staff-ta");
        } else if (role === "professor") {
          setLocation("/professor");
        } else {
          setLocation("/home");
        }
      }, 1000); // small delay so toast shows briefly
    } catch (err: any) {
      // Handle specific verification error message
      const errorMessage =
        err.message || "Something went wrong. Please try again.";

      // Check if it's a verification error, null pointer error, or other specific cases
      if (
        errorMessage.includes("verified yet") ||
        errorMessage.includes("verification") ||
        errorMessage.includes("Cannot read properties of null") ||
        errorMessage.includes("toLowerCase")
      ) {
        toast({
          variant: "destructive",
          title: "Cannot login yet ⏳",
          description: "Please check your email for verification",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login failed ❌",
          description: errorMessage,
        });
      }
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border border-border/40 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mt-4">
              <Logo size="xxl" />
            </div>
            <CardTitle className="text-3xl font-semibold text-foreground">
              Welcome Back
            </CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@guc.edu.eg"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    data-testid="input-email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    data-testid="input-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                data-testid="button-login"
              >
                Login
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline"
                data-testid="link-signup"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Toast viewport to render notifications */}
      <ToastViewport />
    </ToastProvider>
  );
}
