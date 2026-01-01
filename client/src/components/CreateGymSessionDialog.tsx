import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Users, Dumbbell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { getApiBaseUrl } from "@/lib/apiBase";

type CreateGymSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (createdDate: Date) => void;
};

const GYM_SESSION_TYPES = [
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "aerobics", label: "Aerobics" },
  { value: "zumba", label: "Zumba" },
  { value: "cross_circuit", label: "Cross Circuit" },
  { value: "kick_boxing", label: "Kick-boxing" },
];

export default function CreateGymSessionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateGymSessionDialogProps) {
  const API_BASE_URL = getApiBaseUrl();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    date: Date | undefined;
    time: string;
    duration: string;
    type: string;
    instructor: string;
    maxParticipants: string;
  }>({
    date: undefined,
    time: "",
    duration: "",
    type: "",
    instructor: "",
    maxParticipants: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date) {
      toast({
        title: "Validation Error",
        description: "Please select a date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Convert 24-hour time to 12-hour AM/PM format
      const convertTo12Hour = (time24: string) => {
        const [hours, minutes] = time24.split(":");
        const hour = parseInt(hours);
        const period = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
      };

      const response = await fetch(
        `${API_BASE_URL}/api/facilities/admin/gym/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: format(formData.date, "yyyy-MM-dd"),
            time: convertTo12Hour(formData.time),
            duration: parseInt(formData.duration),
            type: formData.type.toLowerCase(),
            instructor: formData.instructor,
            maxParticipants: formData.maxParticipants
              ? parseInt(formData.maxParticipants)
              : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create gym session");
      }

      toast({
        title: "Success",
        description: "Gym session created successfully!",
      });

      // Get the created session date
      const createdDate = formData.date;

      // Reset form
      setFormData({
        date: undefined,
        time: "",
        duration: "",
        type: "",
        instructor: "",
        maxParticipants: "",
      });

      onOpenChange(false);
      if (onSuccess && createdDate) {
        onSuccess(createdDate);
      }
    } catch (error) {
      logger.error("Failed to create gym session:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create gym session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      date: undefined,
      time: "",
      duration: "",
      type: "",
      instructor: "",
      maxParticipants: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Gym Session</DialogTitle>
          <DialogDescription>
            Schedule a new gym session. Fill in all the required details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 py-4 px-2 pr-3 scrollbar-custom flex-1">
            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Session Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                required
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {GYM_SESSION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "dd/MM/yyyy")
                    ) : (
                      <span>dd/mm/yyyy</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time">
                Time <span className="text-red-500">*</span>
              </Label>
              <div
                className="relative cursor-pointer"
                onClick={() =>
                  (
                    document.getElementById("time") as HTMLInputElement
                  )?.showPicker?.()
                }
              >
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="time"
                  type="time"
                  className="pl-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Dumbbell className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="240"
                  placeholder="60"
                  className="pl-10"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Between 15 and 240 minutes
              </p>
            </div>

            {/* Instructor Name */}
            <div className="space-y-2">
              <Label htmlFor="instructor">
                Instructor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="instructor"
                type="text"
                placeholder="Enter instructor's name"
                value={formData.instructor}
                onChange={(e) =>
                  setFormData({ ...formData, instructor: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the full name of the instructor
              </p>
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">
                Max Participants (Optional)
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="20"
                  className="pl-10"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxParticipants: e.target.value,
                    })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for default (20 participants) or set max 100
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
