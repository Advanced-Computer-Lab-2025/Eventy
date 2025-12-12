import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Clock, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface CreateEventFormValues {
  name: string;
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  description: string;
  websiteUrl?: string;
  requiredBudget?: string;
  fundingSource?: "external" | "guc";
  agenda?: string;
  restrictedRoles?: string[];
}

interface CreateEventFormProps {
  onSubmit: (
    values: CreateEventFormValues,
    professors?: string[]
  ) => Promise<void> | void;
  submitting?: boolean;
  includeWebsiteUrl?: boolean;
  includeBudgetAndFunding?: boolean;
  includeAgenda?: boolean;
  includeRestrictAccess?: boolean;
  includeProfessors?: boolean;
  submitLabel?: string;
  title?: string;
  initialValues?: Partial<CreateEventFormValues>;
  initialProfessors?: string[];
  hideSubmitButton?: boolean;
  formId?: string;
  onCancel?: () => void;
}

export default function CreateEventForm({
  onSubmit,
  submitting = false,
  includeWebsiteUrl = true,
  includeBudgetAndFunding = true,
  includeAgenda = true,
  includeRestrictAccess = true,
  includeProfessors = false,
  submitLabel = "Create",
  title = "Event Information",
  initialValues = {},
  initialProfessors = [],
  hideSubmitButton = false,
  formId,
  onCancel,
}: CreateEventFormProps) {
  const [values, setValues] = useState<CreateEventFormValues>({
    name: initialValues.name || "",
    startDate: initialValues.startDate || undefined,
    startTime: initialValues.startTime || "",
    endDate: initialValues.endDate || undefined,
    endTime: initialValues.endTime || "",
    description: initialValues.description || "",
    websiteUrl: initialValues.websiteUrl || "",
    requiredBudget: initialValues.requiredBudget || "",
    fundingSource: initialValues.fundingSource || undefined,
    agenda: initialValues.agenda || "",
    restrictedRoles: initialValues.restrictedRoles || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [professorsOptions, setProfessorsOptions] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [selectedProfessors, setSelectedProfessors] =
    useState<string[]>(initialProfessors);

  const availableRoles = [
    { value: "student", label: "Students" },
    { value: "staff", label: "Staff" },
    { value: "ta", label: "Teaching Assistants" },
    { value: "professor", label: "Professors" },
  ];

  // Fetch professors if includeProfessors is true
  useEffect(() => {
    if (!includeProfessors) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const baseUrl =
          (import.meta as any).env.VITE_API_URL || "http://localhost:4000";
        const res = await fetch(`${baseUrl}/api/users/professors`, {
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
  }, [includeProfessors]);

  // Helper: today's date in local timezone as YYYY-MM-DD
  const todayLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = "Name is required";
    if (!values.startDate) nextErrors.startDate = "Start date is required";
    if (!values.startTime) nextErrors.startTime = "Start time is required";
    if (!values.endDate) nextErrors.endDate = "End date is required";
    if (!values.endTime) nextErrors.endTime = "End time is required";
    if (!values.description.trim())
      nextErrors.description = "Description is required";

    if (includeProfessors && selectedProfessors.length === 0) {
      toast({
        title: "Professors required",
        description: "Please select at least one professor.",
        variant: "destructive",
      });
      return false;
    }

    if (includeWebsiteUrl && values.websiteUrl) {
      try {
        // Basic URL format validation

        new URL(values.websiteUrl);
      } catch {
        nextErrors.websiteUrl = "Enter a valid URL (including protocol)";
      }
    }

    if (includeAgenda && !values.agenda?.trim()) {
      nextErrors.agenda = "Agenda is required";
    }

    if (includeBudgetAndFunding) {
      if (!values.requiredBudget || Number(values.requiredBudget) <= 0) {
        nextErrors.requiredBudget = "Required budget must be a positive number";
      }
      if (!values.fundingSource) {
        nextErrors.fundingSource = "Select a funding source";
      }
    }

    // Logical date/time validation
    if (values.startDate && values.startTime) {
      const start = new Date(
        `${format(values.startDate, "yyyy-MM-dd")}T${values.startTime}:00`
      );
      const now = new Date();
      if (!isNaN(start.getTime()) && start < now) {
        nextErrors.startTime = "Start date/time cannot be in the past";
        toast({
          title: "Start date in the past",
          description: "Start date/time cannot be in the past.",
          variant: "destructive",
        });
      }
    }
    if (
      values.startDate &&
      values.startTime &&
      values.endDate &&
      values.endTime
    ) {
      const start = new Date(
        `${format(values.startDate, "yyyy-MM-dd")}T${values.startTime}:00`
      );
      const end = new Date(
        `${format(values.endDate, "yyyy-MM-dd")}T${values.endTime}:00`
      );
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        // Attach error to end time for clarity
        nextErrors.endTime = "End date/time must be after start date/time";
        toast({
          title: "Invalid dates",
          description: "End date/time must be after start date/time.",
          variant: "destructive",
        });
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(values, includeProfessors ? selectedProfessors : undefined);
  };

  return (
    <form onSubmit={handleSubmit} id={formId}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., International AI Conference"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !values.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {values.startDate ? (
                      format(values.startDate, "dd/MM/yyyy")
                    ) : (
                      <span>dd/mm/yyyy</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={values.startDate}
                    onSelect={(date) =>
                      setValues({ ...values, startDate: date })
                    }
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                      (values.endDate ? date > values.endDate : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="startTime"
                  type="time"
                  value={values.startTime}
                  onChange={(e) =>
                    setValues({ ...values, startTime: e.target.value })
                  }
                  required
                  onClick={(e) => {
                    (e.currentTarget as HTMLInputElement).showPicker?.();
                  }}
                  className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !values.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {values.endDate ? (
                      format(values.endDate, "dd/MM/yyyy")
                    ) : (
                      <span>dd/mm/yyyy</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={values.endDate}
                    onSelect={(date) => setValues({ ...values, endDate: date })}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                      (values.startDate ? date < values.startDate : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="endTime"
                  type="time"
                  value={values.endTime}
                  onChange={(e) =>
                    setValues({ ...values, endTime: e.target.value })
                  }
                  required
                  onClick={(e) => {
                    (e.currentTarget as HTMLInputElement).showPicker?.();
                  }}
                  className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a short description of the conference..."
              rows={4}
              value={values.description}
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
              required
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {includeWebsiteUrl && (
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Conference Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://example.org"
                value={values.websiteUrl || ""}
                onChange={(e) =>
                  setValues({ ...values, websiteUrl: e.target.value })
                }
                required
              />
              {errors.websiteUrl && (
                <p className="text-sm text-red-500">{errors.websiteUrl}</p>
              )}
            </div>
          )}

          {includeAgenda && (
            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda</Label>
              <Textarea
                id="agenda"
                placeholder="Provide a detailed agenda for the conference..."
                rows={4}
                value={values.agenda || ""}
                onChange={(e) =>
                  setValues({ ...values, agenda: e.target.value })
                }
                required
              />
              {errors.agenda && (
                <p className="text-sm text-red-500">{errors.agenda}</p>
              )}
            </div>
          )}

          {includeBudgetAndFunding && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requiredBudget">
                  Required Budget (Dollars)
                </Label>
                <Input
                  id="requiredBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="10000"
                  value={values.requiredBudget || ""}
                  onChange={(e) =>
                    setValues({ ...values, requiredBudget: e.target.value })
                  }
                />
                {errors.requiredBudget && (
                  <p className="text-sm text-red-500">
                    {errors.requiredBudget}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingSource">Funding Source</Label>
                <select
                  id="fundingSource"
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={values.fundingSource || ""}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      fundingSource: e.target.value as any,
                    })
                  }
                >
                  <option value="" disabled>
                    Select source
                  </option>
                  <option value="external">External</option>
                  <option value="guc">GUC</option>
                </select>
                {errors.fundingSource && (
                  <p className="text-sm text-red-500">{errors.fundingSource}</p>
                )}
              </div>
            </div>
          )}

          {includeProfessors && (
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
                        id={`professor-${p.id}`}
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
                        htmlFor={`professor-${p.id}`}
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
          )}

          {includeRestrictAccess && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <Label className="text-base font-semibold">
                    Restrict Access (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select which roles should NOT be able to view or register
                    for this event
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {availableRoles.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`restrict-${role.value}`}
                      checked={values.restrictedRoles?.includes(role.value)}
                      onCheckedChange={(checked) => {
                        const currentRoles = values.restrictedRoles || [];
                        setValues({
                          ...values,
                          restrictedRoles: checked
                            ? [...currentRoles, role.value]
                            : currentRoles.filter((r) => r !== role.value),
                        });
                      }}
                    />
                    <Label
                      htmlFor={`restrict-${role.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!hideSubmitButton && (
        <div className="flex gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
