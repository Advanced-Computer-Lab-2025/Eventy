import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface RestrictAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  eventName: string;
  currentRestrictedRoles?: string[];
  onSuccess?: () => void;
}

const ROLE_OPTIONS = [
  { value: "student", label: "Students" },
  { value: "staff", label: "Staff" },
  { value: "ta", label: "Teaching Assistants" },
  { value: "professor", label: "Professors" },
  { value: "vendor", label: "Vendors" },
];

export default function RestrictAccessDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  currentRestrictedRoles = [],
  onSuccess,
}: RestrictAccessDialogProps) {
  const { toast } = useToast();
  const [restrictedRoles, setRestrictedRoles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRestrictedRoles(currentRestrictedRoles);
    }
  }, [open, currentRestrictedRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/events/${eventId}/restrict-access`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ roles: restrictedRoles }),
        }
      );

      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(
            data.message || "Failed to update access restrictions"
          );
        } else {
          throw new Error(
            `Failed to update access restrictions (${res.status})`
          );
        }
      }

      const data = await res.json();

      toast({
        title: "Access restrictions updated",
        description: `Successfully updated access restrictions for ${eventName}`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Failed to update restrictions",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRole = (roleValue: string) => {
    setRestrictedRoles((prev) =>
      prev.includes(roleValue)
        ? prev.filter((r) => r !== roleValue)
        : [...prev, roleValue]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Restrict Access</DialogTitle>
            <DialogDescription>
              Select which roles should be restricted from accessing "
              {eventName}
              ". Users with restricted roles won't be able to view or register
              for this event.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Restrict Access For:
              </Label>
              <div className="space-y-3">
                {ROLE_OPTIONS.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={restrictedRoles.includes(role.value)}
                      onCheckedChange={() => handleToggleRole(role.value)}
                    />
                    <Label
                      htmlFor={`role-${role.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
              {restrictedRoles.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No restrictions - event is accessible to all roles
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Restrictions"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
