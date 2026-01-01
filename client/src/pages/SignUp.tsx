import { useState } from "react";
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
import { bazaarApiService } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";
import { FileUploadWithCrop } from "@/components/ui/file-upload-with-crop";
import { getApiBaseUrl } from "@/lib/apiBase";

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
    companyLogoUrl: "",
    taxCardUrl: "",
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingTax, setIsUploadingTax] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxFile, setTaxFile] = useState<File | null>(null);

  const validateStudentId = (id: string): boolean => {
    const studentIdPattern = /^\d{2}-\d{4}$/;
    return studentIdPattern.test(id);
  };

  const validateStudentEmail = (email: string): boolean => {
    // require firstname.lastname@student.guc.edu.eg
    const pattern = /^[a-zA-Z]+\.[a-zA-Z]+@student\.guc\.edu\.eg$/i;
    return pattern.test(email);
  };

  const validateStaffEmail = (email: string): boolean => {
    // require firstname.lastname@guc.edu.eg (covers staff/ta/professor)
    const pattern = /^[a-zA-Z]+\.[a-zA-Z]+@guc\.edu\.eg$/i;
    return pattern.test(email);
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

    if (!validateStudentEmail(studentForm.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Student Email",
        description:
          "Student email must be in the form firstname.lastname@student.guc.edu.eg",
      });
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
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

    if (!validateStaffEmail(staffForm.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Staff Email",
        description:
          "Staff email must be in the form firstname.lastname@guc.edu.eg",
      });
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
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
      const res = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vendorForm,
          role: "vendor",
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
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters.
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters.
                  </p>
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
              <form onSubmit={handleVendorSignUp} className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters.
                  </p>
                </div>

                <FileUploadWithCrop
                  label="Company Logo"
                  description="Upload your company logo."
                  accept="application/pdf,image/*"
                  maxSize={5}
                  enableCrop={true}
                  cropAspectRatio={1}
                  previewType="image"
                  value={vendorForm.companyLogoUrl}
                  isUploading={isUploadingLogo}
                  onFileSelect={async (file) => {
                    try {
                      setIsUploadingLogo(true);
                      const res = await bazaarApiService.uploadVendorDocument(
                        file as File
                      );
                      setVendorForm({
                        ...vendorForm,
                        companyLogoUrl: res.url,
                      });
                      setLogoFile(file as File);
                      toast({
                        title: "Success",
                        description: "Logo uploaded successfully!",
                      });
                    } catch (err: any) {
                      toast({
                        variant: "destructive",
                        title: "Upload failed",
                        description: err?.message || "Could not upload logo",
                      });
                    } finally {
                      setIsUploadingLogo(false);
                    }
                  }}
                  onRemove={() => {
                    setVendorForm({
                      ...vendorForm,
                      companyLogoUrl: "",
                    });
                    setLogoFile(null);
                  }}
                />

                <FileUploadWithCrop
                  label="Tax Card"
                  description="Upload your tax registration card."
                  accept="application/pdf,image/*"
                  maxSize={5}
                  enableCrop={false}
                  previewType="document"
                  value={vendorForm.taxCardUrl}
                  isUploading={isUploadingTax}
                  onFileSelect={async (file) => {
                    try {
                      setIsUploadingTax(true);
                      const res = await bazaarApiService.uploadVendorDocument(
                        file as File
                      );
                      setVendorForm({
                        ...vendorForm,
                        taxCardUrl: res.url,
                      });
                      setTaxFile(file as File);
                      toast({
                        title: "Success",
                        description: "Tax card uploaded successfully!",
                      });
                    } catch (err: any) {
                      toast({
                        variant: "destructive",
                        title: "Upload failed",
                        description:
                          err?.message || "Could not upload tax card",
                      });
                    } finally {
                      setIsUploadingTax(false);
                    }
                  }}
                  onRemove={() => {
                    setVendorForm({
                      ...vendorForm,
                      taxCardUrl: "",
                    });
                    setTaxFile(null);
                  }}
                />

                <Button
                  type="submit"
                  className="w-full"
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
