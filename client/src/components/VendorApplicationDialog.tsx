import { useState } from "react";
import { Plus, Trash2, Store } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { bazaarApiService } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";
import IdUploadButton from "@/components/IdUploadButton";

interface VendorApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bazaarId: string;
  bazaarName: string;
  onApplicationSubmitted?: () => void;
}

interface Attendee {
  name: string;
  email: string;
  individualID?: string;
}

export default function VendorApplicationDialog({
  open,
  onOpenChange,
  bazaarId,
  bazaarName,
  onApplicationSubmitted,
}: VendorApplicationDialogProps) {
  const { toast } = useToast();
  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: "", email: "" },
  ]);
  const [boothSize, setBoothSize] = useState<"2x2" | "4x4">("2x2");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAttendee = () => {
    if (attendees.length < 5) {
      setAttendees([...attendees, { name: "", email: "" }]);
    }
  };

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    }
  };

  const updateAttendee = (
    index: number,
    field: keyof Attendee,
    value: string
  ) => {
    const updatedAttendees = attendees.map((attendee, i) =>
      i === index ? { ...attendee, [field]: value } : attendee
    );
    setAttendees(updatedAttendees);
  };

  const handleIdUploadSuccess = (index: number, url: string) => {
    const updatedAttendees = attendees.map((attendee, i) =>
      i === index ? { ...attendee, individualID: url } : attendee
    );
    setAttendees(updatedAttendees);
  };

  const validateForm = () => {
    // Check if all attendees have both name and email
    const validAttendees = attendees.filter(
      (attendee) => attendee.name.trim() && attendee.email.trim()
    );

    if (validAttendees.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one attendee with name and email is required.",
        variant: "destructive",
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const attendee of validAttendees) {
      if (!emailRegex.test(attendee.email)) {
        toast({
          title: "Validation Error",
          description: `Invalid email format for ${attendee.name || "attendee"}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Check for attendees without ID
    const attendeesWithoutID = validAttendees.filter(
      (attendee) => !attendee.individualID
    );
    if (attendeesWithoutID.length > 0) {
      const namesList = attendeesWithoutID
        .map((attendee) => attendee.name || "Unnamed attendee")
        .join(", ");
      toast({
        title: "Validation Error",
        description: `Please upload ID cards for: ${namesList}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const validAttendees = attendees.filter(
        (attendee) => attendee.name.trim() && attendee.email.trim()
      );

      await bazaarApiService.applyToBazaar(bazaarId, {
        attendees: validAttendees.map((attendee) => ({
          name: attendee.name,
          email: attendee.email,
          individualID: attendee.individualID || "",
        })),
        boothSize,
      });

      toast({
        title: "Application Submitted",
        description: "Your vendor application has been submitted successfully!",
      });

      // Reset form
      setAttendees([{ name: "", email: "" }]);
      setBoothSize("2x2");
      onOpenChange(false);

      // Notify parent component that application was submitted
      if (onApplicationSubmitted) {
        onApplicationSubmitted();
      }
    } catch (error) {
      console.error("Error submitting application:", error);

      // Check if it's a duplicate application error
      if (
        error instanceof Error &&
        error.message.includes("already applied to this bazaar")
      ) {
        toast({
          title: "Already Applied",
          description: "You have already applied to this bazaar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Application Failed",
          description:
            error instanceof Error
              ? error.message
              : "You have already applied to this bazaar.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Apply to {bazaarName}
          </DialogTitle>
          <DialogDescription>
            Fill in the details to apply as a vendor for this bazaar. You can
            register up to 5 individuals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Attendees Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Attendees ({attendees.length}/5)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttendee}
                disabled={attendees.length >= 5}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Attendee
              </Button>
            </div>

            <div className="space-y-3">
              {attendees.map((attendee, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Attendee {index + 1}
                      </span>
                      {attendees.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttendee(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 items-end">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor={`name-${index}`}>Name</Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="Full name"
                          value={attendee.name}
                          onChange={(e) =>
                            updateAttendee(index, "name", e.target.value)
                          }
                          required={index === 0}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          placeholder="email@example.com"
                          value={attendee.email}
                          onChange={(e) =>
                            updateAttendee(index, "email", e.target.value)
                          }
                          required={index === 0}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2 flex-shrink-0">
                        <Label className="opacity-0 pointer-events-none">
                          Upload
                        </Label>
                        <IdUploadButton
                          index={index}
                          attendeeName={attendee.name}
                          individualID={attendee.individualID}
                          onUploadSuccess={handleIdUploadSuccess}
                          buttonClassName="h-9 min-w-[120px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Booth Size Section */}
          <div className="space-y-2">
            <Label htmlFor="boothSize" className="text-base font-semibold">
              Booth Size
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose the size of your booth space. Larger booths may have
              additional fees.
            </p>
            <Select
              value={boothSize}
              onValueChange={(value: "2x2" | "4x4") => setBoothSize(value)}
            >
              <SelectTrigger id="boothSize">
                <SelectValue placeholder="Select booth size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2x2">2x2</SelectItem>
                <SelectItem value="4x4">4x4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
