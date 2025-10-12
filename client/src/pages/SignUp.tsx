import { useState } from "react";
import { Link, useLocation } from "wouter";
import { userStore, type User as UserType } from "@/lib/mockData";
import { Mail, Lock, User, Building2, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/Logo";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [studentForm, setStudentForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    studentId: "",
    role: "student",
  });

  const [vendorForm, setVendorForm] = useState({
    email: "",
    password: "",
    companyName: "",
  });

  const handleStudentSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate GUC email
    if (!studentForm.email.endsWith("@guc.edu.eg")) {
      alert("Please use your GUC email address");
      return;
    }
    
    // Check if user already exists
    const existingUser = userStore.findByEmail(studentForm.email);
    if (existingUser) {
      alert("An account with this email already exists");
      return;
    }
    
    // Create new user (pending verification for staff/ta/professor)
    const newUser: UserType = {
      id: crypto.randomUUID(),
      email: studentForm.email,
      firstName: studentForm.firstName,
      lastName: studentForm.lastName,
      role: studentForm.role as any,
      status: studentForm.role === "student" ? "active" : "pending",
      verified: false,
    };
    
    userStore.add(newUser);
    
    if (studentForm.role === "student") {
      alert("Account created! Please check your email for verification link.");
    } else {
      alert("Account created! Please wait for admin to verify your role.");
    }
    
    setLocation("/login");
  };

  const handleVendorSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if vendor already exists
    const existingUser = userStore.findByEmail(vendorForm.email);
    if (existingUser) {
      alert("An account with this email already exists");
      return;
    }
    
    // Create new vendor
    const newVendor: UserType = {
      id: crypto.randomUUID(),
      email: vendorForm.email,
      role: "vendor",
      status: "active",
      verified: false,
    };
    
    userStore.add(newVendor);
    alert("Vendor account created! Please upload your tax card and logo to complete verification.");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mt-4">
            <Logo size="xxl" />
          </div>
          <CardTitle className="text-3xl">Create Account</CardTitle>
          <CardDescription>Join our university event management platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" data-testid="tab-student">
                Student/Staff/TA/Professor
              </TabsTrigger>
              <TabsTrigger value="vendor" data-testid="tab-vendor">
                Vendor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-6">
              <form onSubmit={handleStudentSignUp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="pl-10"
                        value={studentForm.firstName}
                        onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                        data-testid="input-first-name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className="pl-10"
                        value={studentForm.lastName}
                        onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                        data-testid="input-last-name"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={studentForm.role}
                    onValueChange={(value) => setStudentForm({ ...studentForm, role: value })}
                  >
                    <SelectTrigger id="role" data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="ta">Teaching Assistant</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student/Staff ID</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="studentId"
                      placeholder="12345"
                      className="pl-10"
                      value={studentForm.studentId}
                      onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                      data-testid="input-student-id"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">GUC Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@guc.edu.eg"
                      className="pl-10"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
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
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      data-testid="input-password"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" data-testid="button-signup">
                  Create Account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="vendor" className="mt-6">
              <form onSubmit={handleVendorSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder="Acme Inc."
                      className="pl-10"
                      value={vendorForm.companyName}
                      onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                      data-testid="input-company-name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="vendorEmail"
                      type="email"
                      placeholder="contact@company.com"
                      className="pl-10"
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      data-testid="input-vendor-email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="vendorPassword"
                      type="password"
                      className="pl-10"
                      value={vendorForm.password}
                      onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                      data-testid="input-vendor-password"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" data-testid="button-vendor-signup">
                  Create Vendor Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
