import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Clock, Users, DollarSign, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import ProfessorHeader from "@/components/ProfessorHeader";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/apiBase";

interface WorkshopFormData {
  name: string;
  location: string;
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  description: string;
  agenda: string;
  faculty: string;
  budget: string;
  fundingSource: string;
  resources: string;
  capacity: string;
  deadline: Date | undefined;
  price: string;
}

export default function CreateWorkshop() {
  const [, setLocation] = useLocation();
  const apiBaseUrl = getApiBaseUrl();

  const [formData, setFormData] = useState<WorkshopFormData>({
    name: "",
    location: "",
    startDate: undefined,
    startTime: "",
    endDate: undefined,
    endTime: "",
    description: "",
    agenda: "",
    faculty: "",
    budget: "",
    fundingSource: "",
    resources: "",
    capacity: "",
    deadline: undefined,
    price: "",
  });

  const [professorsOptions, setProfessorsOptions] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Get current user ID from localStorage
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;
        setCurrentUserId(userId);
        // Auto-select current user in professors list
        if (userId && !selectedProfessors.includes(userId)) {
          setSelectedProfessors([userId]);
        }
      }
    } catch (err) {
      logger.error("Failed to parse user from localStorage", err);
    }

    (async () => {
      try {
        // Validate registration deadline (must be today or in the future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (formData.deadline && formData.deadline < today) {
          toast({
            title: "Invalid registration deadline",
            description:
              "Registration deadline must be today or a future date.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const res = await fetch(`${apiBaseUrl}/api/users/professors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          logger.error("Failed to fetch professors: ", res.status);
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
        logger.error("Failed to fetch professors", err);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedProfessors.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one professor.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const workshopData = {
        name: formData.name,
        location: formData.location,
        startDate: formData.startDate
          ? format(formData.startDate, "yyyy-MM-dd")
          : "",
        startTime: formData.startTime,
        endDate: formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : "",
        endTime: formData.endTime,
        description: formData.description,
        agenda: formData.agenda,
        faculty: formData.faculty,
        professors: selectedProfessors,
        requiredBudget: Number(formData.budget),
        fundingSource: formData.fundingSource,
        extraResources: formData.resources,
        capacity: Number(formData.capacity),
        registrationDeadline: formData.deadline
          ? format(formData.deadline, "yyyy-MM-dd")
          : "",
        price: Number(formData.price),
      };

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in first.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const res = await fetch(`${apiBaseUrl}/api/events/workshops`, {
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

      toast({
        title: "Workshop Created! 🎉",
        description:
          "Your workshop has been successfully submitted for approval.",
      });

      setTimeout(() => setLocation("/professor/workshops"), 1500);
    } catch (error) {
      logger.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create workshop",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ProfessorHeader />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Workshop</h1>
          <p className="text-muted-foreground">
            Fill in the details to create a new workshop
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* --- Basic Info --- */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Workshop Name <span className="text-red-500">*</span>
                </Label>
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
                  <Label>
                    Location <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    Faculty Responsible <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(formData.startDate, "dd/MM/yyyy")
                        ) : (
                          <span>dd/mm/yyyy</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, startDate: date })
                        }
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          (formData.endDate ? date > formData.endDate : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    Start Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      onClick={(e) => {
                        e.currentTarget.showPicker();
                      }}
                      required
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? (
                          format(formData.endDate, "dd/MM/yyyy")
                        ) : (
                          <span>dd/mm/yyyy</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) =>
                          setFormData({ ...formData, endDate: date })
                        }
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          (formData.startDate
                            ? date < formData.startDate
                            : false)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">
                    End Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      onClick={(e) => {
                        e.currentTarget.showPicker();
                      }}
                      required
                      className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
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
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="agenda">
                  Full Agenda <span className="text-red-500">*</span>
                </Label>
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

              {/* Professors multi-select */}
              <div className="space-y-2">
                <Label>
                  Professor(s) Participating{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {professorsOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No professors found
                    </p>
                  ) : (
                    professorsOptions.map((p) => {
                      const isCurrentUser = p.id === currentUserId;
                      return (
                        <div key={p.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={p.id}
                            checked={selectedProfessors.includes(p.id)}
                            disabled={isCurrentUser}
                            onCheckedChange={(checked) => {
                              // Prevent deselection of current user
                              if (isCurrentUser) return;

                              if (checked) {
                                setSelectedProfessors((prev) => [
                                  ...prev,
                                  p.id,
                                ]);
                              } else {
                                setSelectedProfessors((prev) =>
                                  prev.filter((id) => id !== p.id)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={p.id}
                            className={`text-sm ${isCurrentUser ? "cursor-default" : "cursor-pointer"}`}
                          >
                            {p.name}
                            {isCurrentUser && " (You)"}{" "}
                            <span className="text-muted-foreground text-xs">
                              ({p.email})
                            </span>
                          </Label>
                        </div>
                      );
                    })
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
                  <Label htmlFor="budget">
                    Required Budget <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                  <Label>
                    Funding Source <span className="text-red-500">*</span>
                  </Label>
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
                <Label htmlFor="price">
                  Workshop Price <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="price"
                    type="number"
                    placeholder="100"
                    className="pl-10"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resources">
                  Extra Resources <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="resources"
                  placeholder="e.g., Projector, laptops..."
                  rows={3}
                  value={formData.resources}
                  onChange={(e) =>
                    setFormData({ ...formData, resources: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacity <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                  <Label htmlFor="deadline">
                    Registration Deadline{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? (
                          format(formData.deadline, "dd/MM/yyyy")
                        ) : (
                          <span>dd/mm/yyyy</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) =>
                          setFormData({ ...formData, deadline: date })
                        }
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- Buttons --- */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/professor/workshops")}
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
    </div>
  );
}
