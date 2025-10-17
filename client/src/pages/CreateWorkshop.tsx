import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calendar, Users, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// ✅ Toast imports
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from "@/components/ui/toast";

interface WorkshopFormData {
  name: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  agenda: string;
  faculty: string;
  budget: string;
  fundingSource: string;
  resources: string;
  capacity: string;
  deadline: string;
}

export default function CreateWorkshop() {
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState<WorkshopFormData>({
    name: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
    agenda: "",
    faculty: "",
    budget: "",
    fundingSource: "",
    resources: "",
    capacity: "",
    deadline: "",
  });

  const [professorsOptions, setProfessorsOptions] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Toast state
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("http://localhost:4000/api/users/professors", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.error("Failed to fetch professors: ", res.status);
          return;
        }
        const payload = await res.json();
        const list = payload?.data || payload;
        setProfessorsOptions(
          list.map((u: any) => ({
            id: u._id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch professors", err);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (selectedProfessors.length === 0) {
        throw new Error("Please select at least one professor.");
      }

      const workshopData = {
        name: formData.name,
        location: formData.location,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        description: formData.description,
        agenda: formData.agenda,
        faculty: formData.faculty,
        professors: selectedProfessors,
        requiredBudget: Number(formData.budget),
        fundingSource: formData.fundingSource,
        extraResources: formData.resources,
        capacity: Number(formData.capacity),
        registrationDeadline: formData.deadline,
      };

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated. Please log in first.");

      const res = await fetch("http://localhost:4000/api/events/workshops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(workshopData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create workshop");
      }

      // ✅ Success toast instead of alert
      setToastOpen(true);

      // Navigate after toast appears
      setTimeout(() => setLocation("/dashboard"), 2000); // yehia : change location to our dashboard
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Workshop</h1>
          <p className="text-muted-foreground">
            Fill in the details to create a new workshop
          </p>
          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
        </div>

        <form onSubmit={handleSubmit}>
          {/* --- Basic Info --- */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workshop Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Advanced Machine Learning"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GUC Cairo">GUC Cairo</SelectItem>
                      <SelectItem value="GUC Berlin">GUC Berlin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Faculty Responsible</Label>
                  <Select
                    value={formData.faculty}
                    onValueChange={(value) =>
                      setFormData({ ...formData, faculty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="met">MET</SelectItem>
                      <SelectItem value="iet">IET</SelectItem>
                      <SelectItem value="phar">Pharmacy</SelectItem>
                      <SelectItem value="law">Law</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Start & End */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-10"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-10"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- Description & Professors --- */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Details & Professors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief overview of the workshop..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Full Agenda</Label>
                <Textarea
                  placeholder="Detailed workshop agenda..."
                  rows={5}
                  value={formData.agenda}
                  onChange={(e) =>
                    setFormData({ ...formData, agenda: e.target.value })
                  }
                  required
                />
              </div>

              {/* Professors multi-select */}
              <div className="space-y-2">
                <Label>Professor(s) Participating</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {professorsOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No professors found
                    </p>
                  ) : (
                    professorsOptions.map((p) => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={p.id}
                          checked={selectedProfessors.includes(p.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProfessors((prev) => [...prev, p.id]);
                            } else {
                              setSelectedProfessors((prev) =>
                                prev.filter((id) => id !== p.id)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={p.id} className="text-sm">
                          {p.name}{" "}
                          <span className="text-muted-foreground text-xs">
                            ({p.email})
                          </span>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- Budget & Registration --- */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Budget & Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Required Budget</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="5000"
                      className="pl-10"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Funding Source</Label>
                  <Select
                    value={formData.fundingSource}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fundingSource: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guc">GUC</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Extra Resources</Label>
                <Textarea
                  placeholder="e.g., Projector, laptops..."
                  rows={3}
                  value={formData.resources}
                  onChange={(e) =>
                    setFormData({ ...formData, resources: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="50"
                      className="pl-10"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Registration Deadline</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- Buttons --- */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Submitting..." : "Submit Workshop for Approval"}
            </Button>
          </div>
        </form>
      </main>

      {/* ✅ Toast Notification */}
      <ToastProvider>
        <Toast open={toastOpen} onOpenChange={setToastOpen}>
          <div className="flex flex-col space-y-1">
            <ToastTitle>Workshop Created 🎉</ToastTitle>
            <ToastDescription>
              Your workshop has been successfully submitted for approval!
            </ToastDescription>
          </div>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}
