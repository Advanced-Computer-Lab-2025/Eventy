import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  Clock,
  Users,
  DollarSign,
  AlertCircle,
  CalendarIcon,
} from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
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
}

export default function EditWorkshop() {
  const [, params] = useRoute("/professor/edit-workshop/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const workshopId = params?.id;
  const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

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
  });

  const [professorsOptions, setProfessorsOptions] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingWorkshop, setFetchingWorkshop] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [workshopStatus, setWorkshopStatus] = useState<string>("");
  const [revisionComments, setRevisionComments] = useState<string>("");

  const fetchProfessors = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/professors`, {
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
  }, [API_BASE_URL]);

  const fetchWorkshopDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLocation("/login");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/events/${workshopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch workshop details");
      }

      const data = await res.json();
      const workshop = data.data;

      // Parse dates and times
      const parseDateOrUndefined = (value: unknown) => {
        if (typeof value !== "string" || !value) return undefined;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? undefined : d;
      };

      const startDate = parseDateOrUndefined(workshop.startDate);
      const endDate = parseDateOrUndefined(workshop.endDate);
      const deadline = parseDateOrUndefined(workshop.registrationDeadline);

      setFormData({
        name: workshop.name || "",
        location: workshop.location || "",
        startDate: startDate,
        startTime: workshop.startTime || "",
        endDate: endDate,
        endTime: workshop.endTime || "",
        description: workshop.description || "",
        agenda: workshop.agenda || "",
        faculty: workshop.faculty || "",
        budget: workshop.requiredBudget?.toString() || "",
        fundingSource: workshop.fundingSource || "",
        resources: workshop.extraResources || "",
        capacity: workshop.capacity?.toString() || "",
        deadline: deadline,
      });

      // Set selected professors
      if (workshop.professors && Array.isArray(workshop.professors)) {
        const professorIds = workshop.professors.map((p: any) =>
          typeof p === "string" ? p : p._id
        );
        setSelectedProfessors(professorIds);
      }

      // Set status and revision comments
      setWorkshopStatus(workshop.status || "");
      setRevisionComments(workshop.revisionComments || "");
    } catch (err) {
      logger.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to load workshop"
      );
      toast({
        title: "Error",
        description: "Failed to load workshop details",
        variant: "destructive",
      });
    } finally {
      setFetchingWorkshop(false);
    }
  }, [API_BASE_URL, setLocation, toast, workshopId]);

  useEffect(() => {
    fetchProfessors();
    if (workshopId) {
      fetchWorkshopDetails();
    }
  }, [fetchProfessors, fetchWorkshopDetails, workshopId]);

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
      };

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated. Please log in first.");

      const res = await fetch(
        `${API_BASE_URL}/api/events/workshops/${workshopId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(workshopData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update workshop");
      }

      toast({
        title: "Workshop Updated",
        description:
          "Your workshop has been successfully updated and is pending re-approval.",
      });

      setTimeout(() => setLocation("/professor/workshops"), 1500);
    } catch (error) {
      logger.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Unexpected error");
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update workshop",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingWorkshop) {
    return (
      <div className="min-h-screen bg-background">
        <ProfessorHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">
            Loading workshop details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfessorHeader />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Workshop</h1>
          <p className="text-muted-foreground">
            Update the workshop details below
          </p>
          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
        </div>

        {/* Revision Comments Alert */}
        {workshopStatus === "needs_revision" && revisionComments && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Revision Required</AlertTitle>
            <AlertDescription className="mt-2">
              {revisionComments}
            </AlertDescription>
          </Alert>
        )}

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
                        <Label
                          htmlFor={p.id}
                          className="text-sm cursor-pointer"
                        >
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
              {loading ? "Updating..." : "Update Workshop"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
