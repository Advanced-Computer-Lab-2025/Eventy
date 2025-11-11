import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Mail, Lock, User, Building2, IdCard } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [studentForm, setStudentForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    studentStaffId: "",
  });

  const [staffForm, setStaffForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    studentStaffId: "",
    role: "staff",
  });

  const [vendorForm, setVendorForm] = useState({
    email: "",
    password: "",
    companyName: "",
  });

  const [vendorFiles, setVendorFiles] = useState<{
    companyLogo?: File | null;
    taxCard?: File | null;
  }>({});

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [taxPreview, setTaxPreview] = useState<string | null>(null);

  // create object URLs for previews and clean up when files change
  useEffect(() => {
    if (vendorFiles.companyLogo) {
      const url = URL.createObjectURL(vendorFiles.companyLogo);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setLogoPreview(null);
  }, [vendorFiles.companyLogo]);

  useEffect(() => {
    if (vendorFiles.taxCard) {
      const url = URL.createObjectURL(vendorFiles.taxCard);
      setTaxPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setTaxPreview(null);
  }, [vendorFiles.taxCard]);

  const validateStudentId = (id: string): boolean => {
    const studentIdPattern = /^\d{2}-\d{4}$/;
    return studentIdPattern.test(id);
  };

  const validateStaffId = (id: string): boolean => {
    const staffIdPattern = /^\d{4}$/;
    return staffIdPattern.test(id);
  };

  const handleStudentSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStudentId(studentForm.studentStaffId)) {
      toast({
        variant: "destructive",
        title: "Invalid Student ID",
        description:
          "Student ID must follow the format XX-XXXX (e.g., 58-1001)",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...studentForm,
          role: "student",
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Signup failed");

      toast({
        title: "Success",
        description: data.message,
      });

      setLocation("/login");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: err.message,
      });
    }
  };

  const handleStaffSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStaffId(staffForm.studentStaffId)) {
      toast({
        variant: "destructive",
        title: "Invalid Staff ID",
        description: "Staff ID must be exactly 4 digits (e.g., 1234)",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Signup failed");

      toast({
        title: "Success",
        description: data.message,
      });

      setLocation("/login");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: err.message,
      });
    }
  };

  const handleVendorSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!vendorFiles.companyLogo || !vendorFiles.taxCard) {
        toast({
          variant: "destructive",
          title: "Missing files",
          description: "Please attach both company logo and tax card files.",
        });
        return;
      }

      const formData = new FormData();
      formData.append("companyName", vendorForm.companyName);
      formData.append("email", vendorForm.email);
      formData.append("password", vendorForm.password);
      formData.append("role", "vendor");
      formData.append("companyLogo", vendorFiles.companyLogo as File);
      formData.append("taxCard", vendorFiles.taxCard as File);

      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      toast({ title: "Success", description: data.message });
      setLocation("/login");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: err.message,
      });
    }
  };

  // (Simplified) no client-side previews or upload progress — keep UI minimal: drag & drop and filename display.

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mt-4">
            <Logo size="xxl" />
          </div>
          <CardTitle className="text-3xl">Create Account</CardTitle>
          <CardDescription>
            Join our university event management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="student" data-testid="tab-student">
                Student
              </TabsTrigger>
              <TabsTrigger value="staff" data-testid="tab-staff">
                Staff
              </TabsTrigger>
              <TabsTrigger value="vendor" data-testid="tab-vendor">
                Vendor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-6">
              <form onSubmit={handleStudentSignUp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="student-firstName"
                        placeholder="John"
                        className="pl-10"
                        value={studentForm.firstName}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            firstName: e.target.value,
                          })
                        }
                        data-testid="input-student-first-name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="student-lastName"
                        placeholder="Doe"
                        className="pl-10"
                        value={studentForm.lastName}
                        onChange={(e) =>
                          setStudentForm({
                            ...studentForm,
                            lastName: e.target.value,
                          })
                        }
                        data-testid="input-student-last-name"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-id">Student ID</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="student-id"
                      placeholder="58-1001"
                      className="pl-10"
                      value={studentForm.studentStaffId}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          studentStaffId: e.target.value,
                        })
                      }
                      data-testid="input-student-id"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: XX-XXXX (e.g., 58-1001)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-email">GUC Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="john.doe@student.guc.edu.eg"
                      className="pl-10"
                      value={studentForm.email}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          email: e.target.value,
                        })
                      }
                      data-testid="input-student-email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="student-password"
                      type="password"
                      className="pl-10"
                      value={studentForm.password}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          password: e.target.value,
                        })
                      }
                      data-testid="input-student-password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  data-testid="button-student-signup"
                >
                  Create Student Account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="staff" className="mt-6">
              <form onSubmit={handleStaffSignUp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="staff-firstName"
                        placeholder="John"
                        className="pl-10"
                        value={staffForm.firstName}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            firstName: e.target.value,
                          })
                        }
                        data-testid="input-staff-first-name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="staff-lastName"
                        placeholder="Doe"
                        className="pl-10"
                        value={staffForm.lastName}
                        onChange={(e) =>
                          setStaffForm({
                            ...staffForm,
                            lastName: e.target.value,
                          })
                        }
                        data-testid="input-staff-last-name"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-id">Staff ID</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="staff-id"
                      placeholder="1234"
                      className="pl-10"
                      value={staffForm.studentStaffId}
                      onChange={(e) =>
                        setStaffForm({
                          ...staffForm,
                          studentStaffId: e.target.value,
                        })
                      }
                      data-testid="input-staff-id"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: 4 digits (e.g., 1234)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-email">GUC Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="john.doe@guc.edu.eg"
                      className="pl-10"
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, email: e.target.value })
                      }
                      data-testid="input-staff-email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="staff-password"
                      type="password"
                      className="pl-10"
                      value={staffForm.password}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, password: e.target.value })
                      }
                      data-testid="input-staff-password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  data-testid="button-staff-signup"
                >
                  Create Staff Account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="vendor" className="mt-6">
              <form onSubmit={handleVendorSignUp} className="space-y-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">Vendor Details</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-companyName">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="vendor-companyName"
                      placeholder="Acme Inc."
                      className="pl-10"
                      value={vendorForm.companyName}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          companyName: e.target.value,
                        })
                      }
                      data-testid="input-vendor-company-name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="vendor-email"
                      type="email"
                      placeholder="contact@company.com"
                      className="pl-10"
                      value={vendorForm.email}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, email: e.target.value })
                      }
                      data-testid="input-vendor-email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="vendor-password"
                      type="password"
                      className="pl-10"
                      value={vendorForm.password}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          password: e.target.value,
                        })
                      }
                      data-testid="input-vendor-password"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-logo">Company Logo</Label>
                  <label
                    htmlFor="vendor-logo"
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) setVendorFiles({ ...vendorFiles, companyLogo: f });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors bg-transparent cursor-pointer flex flex-col items-center"
                  >
                    <input
                      id="vendor-logo"
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        setVendorFiles({
                          ...vendorFiles,
                          companyLogo: e.target.files
                            ? e.target.files[0]
                            : null,
                        })
                      }
                    />

                    {logoPreview ? (
                      vendorFiles.companyLogo &&
                      vendorFiles.companyLogo.type === "application/pdf" ? (
                        <embed
                          src={logoPreview}
                          type="application/pdf"
                          className="w-full max-h-32"
                        />
                      ) : (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-32 object-contain"
                        />
                      )
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Drag & drop your logo here, or click to select
                      </div>
                    )}
                  </label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-tax">Tax Card</Label>
                  <label
                    htmlFor="vendor-tax"
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) setVendorFiles({ ...vendorFiles, taxCard: f });
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors bg-transparent cursor-pointer flex flex-col items-center"
                  >
                    <input
                      id="vendor-tax"
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        setVendorFiles({
                          ...vendorFiles,
                          taxCard: e.target.files ? e.target.files[0] : null,
                        })
                      }
                    />

                    {taxPreview ? (
                      // show image preview for images, embed for pdfs
                      vendorFiles.taxCard &&
                      vendorFiles.taxCard.type === "application/pdf" ? (
                        <embed
                          src={taxPreview}
                          type="application/pdf"
                          className="w-full max-h-40"
                        />
                      ) : (
                        <img
                          src={taxPreview as string}
                          alt="Tax preview"
                          className="max-h-40 object-contain"
                        />
                      )
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Drag & drop tax card here, or click to select
                      </div>
                    )}
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  data-testid="button-vendor-signup"
                >
                  Create Vendor Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline"
              data-testid="link-login"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
