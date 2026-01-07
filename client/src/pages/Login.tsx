"use client";

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Mail, Lock, Info, X, Users } from "lucide-react";
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
import { getApiBaseUrl } from "@/lib/apiBase";
import { setAuthToken } from "@/lib/authToken";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEMO_ACCOUNTS_STORAGE_KEY = "eventy_demo_dismissed";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showDemoGuide, setShowDemoGuide] = useState(false);

  // Check if demo guide should show on first visit
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DEMO_ACCOUNTS_STORAGE_KEY);
      if (!dismissed) {
        // Small delay so it appears after page loads
        setTimeout(() => setShowDemoGuide(true), 500);
      }
    } catch {
      // localStorage might be blocked
    }
  }, []);

  const handleDismissDemoGuide = () => {
    try {
      localStorage.setItem(DEMO_ACCOUNTS_STORAGE_KEY, "true");
    } catch {
      // Ignore if storage is blocked
    }
    setShowDemoGuide(false);
  };

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
      const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      setAuthToken(data.token);
      try {
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch {
        // Storage may be blocked; ignore.
      }

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

      const normalizedMessage = String(errorMessage).toLowerCase();

      // Admin verification (staff/TA/professor awaiting role assignment)
      if (normalizedMessage.includes("admin verification")) {
        toast({
          variant: "destructive",
          title: "Cannot login yet ⏳",
          description: "Please await admin verification",
        });
        return;
      }

      // Email verification (students)
      if (
        normalizedMessage.includes("email is not verified") ||
        normalizedMessage.includes("check your inbox") ||
        normalizedMessage.includes("verification link") ||
        normalizedMessage.includes("verified yet") ||
        normalizedMessage.includes("cannot read properties of null") ||
        normalizedMessage.includes("tolowercase")
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
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
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
                    placeholder="Enter your password"
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
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline"
                data-testid="link-signup"
              >
                Sign up
              </Link>
            </div>

            {/* Demo accounts link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowDemoGuide(true)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto"
              >
                <Info className="h-3 w-3" />
                View demo accounts
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Guide Dialog */}
      <Dialog open={showDemoGuide} onOpenChange={setShowDemoGuide}>
        <DialogContent className="max-w-[800px] w-[90vw] p-0 border-0 bg-transparent shadow-none [&>button]:hidden sm:rounded-none">
          <div className="bg-card/95 backdrop-blur shadow-2xl rounded-2xl border p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Explore Eventy
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Select a persona to auto-fill credentials
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted"
                onClick={handleDismissDemoGuide}
              >
                <X className="h-5 w-5 opacity-70" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Student */}
              <button
                onClick={() => {
                  setFormData({
                    email: "student@student.guc.edu.eg",
                    password: "password123",
                  });
                  handleDismissDemoGuide();
                  toast({
                    title: "Credentials Filled!",
                    description: "Login as a student to browse and register.",
                  });
                }}
                className="flex items-center p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 hover:border-primary/20 group text-left bg-card"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-lg">🎓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">
                    Student
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    student@student.guc.edu.eg
                  </div>
                </div>
              </button>

              {/* Professor */}
              <button
                onClick={() => {
                  setFormData({
                    email: "prof@guc.edu.eg",
                    password: "password123",
                  });
                  handleDismissDemoGuide();
                  toast({
                    title: "Credentials Filled!",
                    description: "Login as a professor.",
                  });
                }}
                className="flex items-center p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 hover:border-primary/20 group text-left bg-card"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-lg">👨‍🏫</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">
                    Professor
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    prof@guc.edu.eg
                  </div>
                </div>
              </button>

              {/* Staff / TA */}
              <button
                onClick={() => {
                  setFormData({
                    email: "staff@guc.edu.eg",
                    password: "password123",
                  });
                  handleDismissDemoGuide();
                  toast({
                    title: "Credentials Filled!",
                    description: "Login as Staff/TA.",
                  });
                }}
                className="flex items-center p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 hover:border-primary/20 group text-left bg-card"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-lg">👨‍💼</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">
                    Staff / TA
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    staff@guc.edu.eg
                  </div>
                </div>
              </button>

              {/* Vendor */}
              <button
                onClick={() => {
                  setFormData({
                    email: "vendor@company.com",
                    password: "password123",
                  });
                  handleDismissDemoGuide();
                  toast({
                    title: "Credentials Filled!",
                    description: "Login as a Vendor.",
                  });
                }}
                className="flex items-center p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 hover:border-primary/20 group text-left bg-card"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-lg">🏢</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">
                    Vendor
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    vendor@company.com
                  </div>
                </div>
              </button>

              {/* Events Office */}
              <button
                onClick={() => {
                  setFormData({
                    email: "events@guc.edu.eg",
                    password: "password123",
                  });
                  handleDismissDemoGuide();
                  toast({
                    title: "Credentials Filled!",
                    description: "Login as Events Office.",
                  });
                }}
                className="flex items-center p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 hover:border-primary/20 group text-left bg-card"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-lg">🎯</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">
                    Events Office
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    events@guc.edu.eg
                  </div>
                </div>
              </button>

              {/* Admin */}
              <button
                onClick={() => {
                  setFormData({
                    email: "admin@guc.edu.eg",
                    password: "password123",
                  });
                  handleDismissDemoGuide();
                  toast({
                    title: "Credentials Filled!",
                    description: "Login as Admin.",
                  });
                }}
                className="flex items-center p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 hover:border-primary/20 group text-left bg-card"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 shrink-0">
                  <span className="text-lg">⚙️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">
                    Admin
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    admin@guc.edu.eg
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Password for all:</span>
                <code className="bg-muted px-2 py-0.5 rounded font-mono font-bold text-foreground">
                  password123
                </code>
              </div>
              <button
                onClick={handleDismissDemoGuide}
                className="hover:text-foreground hover:underline transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Toast viewport to render notifications */}
      <ToastViewport />
    </ToastProvider>
  );
}
