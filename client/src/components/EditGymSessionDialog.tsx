import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type GymSession = {
  _id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  maxParticipants: number;
  instructor: string;
  restrictedRoles?: string[];
};

type EditGymSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: GymSession | null;
  onSuccess?: () => void;
};

type EditFormData = {
  date?: string;
  startTime?: string;
  durationMinutes?: number;
};

// Convert 12-hour format (hh:mm AM/PM) to 24-hour format (HH:MM) for input
const convertTo24HourFormat = (time12h: string): string => {
  const match = time12h.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return time12h;

  let [, hours, minutes, period] = match;
  let hour = parseInt(hours, 10);

  if (period.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, "0")}:${minutes}`;
};

// Convert 24-hour format (HH:MM) to 12-hour format (hh:mm AM/PM) for API
const convertTo12HourFormat = (time24h: string): string => {
  const [hours, minutes] = time24h.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export default function EditGymSessionDialog({
  open,
  onOpenChange,
  session,
  onSuccess,
}: EditGymSessionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restrictedRoles, setRestrictedRoles] = useState<string[]>([]);

  const availableRoles = [
    { value: "student", label: "Students" },
    { value: "staff", label: "Staff" },
    { value: "ta", label: "Teaching Assistants" },
    { value: "professor", label: "Professors" },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>();

  useEffect(() => {
    if (session && open) {
      // Format date for input (YYYY-MM-DD)
      const formattedDate = new Date(session.date).toISOString().split("T")[0];
      // Convert 12-hour time to 24-hour for input field
      const formattedTime = convertTo24HourFormat(session.startTime);
      reset({
        date: formattedDate,
        startTime: formattedTime,
        durationMinutes: session.durationMinutes,
      });
      setRestrictedRoles(session.restrictedRoles || []);
    }
  }, [session, open, reset]);

  const onSubmit = async (data: EditFormData) => {
    if (!session) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Transform field names to match API contract (time and duration)
      const updateData: any = {};
      if (data.date) updateData.date = data.date;
      if (data.startTime) {
        // Convert 24-hour format (HH:MM) to 12-hour format (hh:mm AM/PM)
        updateData.startTime = convertTo12HourFormat(data.startTime);
      }
      if (data.durationMinutes)
        updateData.durationMinutes = Number(data.durationMinutes);

      // Always send restrictedRoles when editing (even if empty) to clear restrictions
      updateData.restrictedRoles = restrictedRoles;

      const response = await fetch(
        `http://localhost:4000/api/facilities/gym/sessions/${session._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update session");
      }

      toast({
        title: "Success",
        description:
          "Gym session updated successfully. Participants have been notified.",
      });

      onOpenChange(false);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Edit session error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update session",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  const formatSessionType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Gym Session</DialogTitle>
          <DialogDescription>
            Update the date, time, or duration for{" "}
            {formatSessionType(session.type)} with {session.instructor}. All
            registered participants will be notified of the changes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              min={today}
              {...register("date")}
              disabled={isSubmitting}
              className="cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              onClick={(e) => e.currentTarget.showPicker?.()}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              {...register("startTime")}
              disabled={isSubmitting}
              className="cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              onClick={(e) => e.currentTarget.showPicker?.()}
            />
            {errors.startTime && (
              <p className="text-sm text-destructive">
                {errors.startTime.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duration (minutes)</Label>
            <Input
              id="durationMinutes"
              type="number"
              min="15"
              {...register("durationMinutes", {
                valueAsNumber: true,
                min: {
                  value: 15,
                  message: "Duration must be at least 15 minutes",
                },
              })}
              disabled={isSubmitting}
            />
            {errors.durationMinutes && (
              <p className="text-sm text-destructive">
                {errors.durationMinutes.message}
              </p>
            )}
          </div>

          {/* Restrict Access Section */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <Label className="text-base font-semibold">
                  Restrict Access (Optional)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select which roles should NOT be able to view or register for
                  this session
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {availableRoles.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`restrict-${role.value}`}
                    checked={restrictedRoles.includes(role.value)}
                    onCheckedChange={(checked) => {
                      setRestrictedRoles(
                        checked
                          ? [...restrictedRoles, role.value]
                          : restrictedRoles.filter((r) => r !== role.value)
                      );
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
