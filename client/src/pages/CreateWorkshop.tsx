import { useState } from "react";
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

// ✅ Define types for your form fields
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
  professor: string;
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
    professor: "",
    budget: "",
    fundingSource: "",
    resources: "",
    capacity: "",
    deadline: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Handle submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Prepare data for backend
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
        professors: formData.professor,
        requiredBudget: Number(formData.budget),
        fundingSource: formData.fundingSource,
        extraResources: formData.resources,
        capacity: Number(formData.capacity),
        registrationDeadline: formData.deadline,
      };

      // Get JWT token (from login)
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated. Please log in first.");

      // Send request to backend
      const res = await fetch("http://localhost:5000/api/events/workshops", {
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

      alert("✅ Workshop created successfully and sent for approval!");
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
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
          {/* --- Basic Information --- */}
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
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guc-cairo">GUC Cairo</SelectItem>
                      <SelectItem value="guc-berlin">GUC Berlin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty Responsible</Label>
                  <Select
                    value={formData.faculty}
                    onValueChange={(value) =>
                      setFormData({ ...formData, faculty: value })
                    }
                  >
                    <SelectTrigger id="faculty">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startDate"
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
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
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
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endDate"
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
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
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

          {/* --- Description, Agenda, Professors --- */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Details & Agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
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
                <Label htmlFor="agenda">Full Agenda</Label>
                <Textarea
                  id="agenda"
                  placeholder="Detailed workshop agenda..."
                  rows={5}
                  value={formData.agenda}
                  onChange={(e) =>
                    setFormData({ ...formData, agenda: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professor">Professor(s) Participating</Label>
                <Input
                  id="professor"
                  placeholder="e.g., Dr. Ahmed Hassan, Dr. Sara Mohamed"
                  value={formData.professor}
                  onChange={(e) =>
                    setFormData({ ...formData, professor: e.target.value })
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* --- Budget & Resources --- */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Budget & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Required Budget</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="budget"
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
                  <Label htmlFor="fundingSource">Funding Source</Label>
                  <Select
                    value={formData.fundingSource}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fundingSource: value })
                    }
                  >
                    <SelectTrigger id="fundingSource">
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
                <Label htmlFor="resources">Extra Required Resources</Label>
                <Textarea
                  id="resources"
                  placeholder="e.g., Projector, Laptops, Lab equipment..."
                  rows={3}
                  value={formData.resources}
                  onChange={(e) =>
                    setFormData({ ...formData, resources: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* --- Registration Details --- */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Registration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capacity"
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
                  <Label htmlFor="deadline">Registration Deadline</Label>
                  <Input
                    id="deadline"
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
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Workshop for Approval"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
