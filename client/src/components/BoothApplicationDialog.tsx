import { useState } from "react";
import { MapPin, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { bazaarApiService } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";

interface BoothApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boothId: string;
  boothNumber: number | string;
  attendees: Array<{ name: string; email: string }>;
  boothSize: "2x2" | "4x4";
  durationWeeks: number;
}

export default function BoothApplicationDialog({
  open,
  onOpenChange,
  boothId,
  boothNumber,
  attendees,
  boothSize,
  durationWeeks,
}: BoothApplicationDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    // Check if all attendees have both name and email
    const validAttendees = attendees.filter(attendee => 
      attendee.name.trim() && attendee.email.trim()
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
          description: `Invalid email format for ${attendee.name || 'attendee'}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validAttendees = attendees.filter(attendee => 
        attendee.name.trim() && attendee.email.trim()
      );

      console.log("Submitting booth application with data:", {
        boothId,
        attendees: validAttendees,
        boothSize,
        durationWeeks,
        locationPreference: `Booth ${boothNumber}`
      });

      await bazaarApiService.applyToBooth(boothId, {
        attendees: validAttendees,
        boothSize,
        durationWeeks, // Use the actual duration from the form
        locationPreference: `Booth ${boothNumber}`, // Use booth number as location preference
      });

      toast({
        title: "Application Submitted Successfully",
        description: `Your booth application for Booth ${boothNumber} has been submitted successfully!`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting booth application:", error);
      
      // Extract error message from the error object
      const errorMessage = error instanceof Error ? error.message : "Failed to submit your booth application. Please try again.";
      
      toast({
        title: "Application Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Apply for Booth {boothNumber}
          </DialogTitle>
          <DialogDescription>
            Confirm your application details for this platform booth.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Booth Details */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Booth Details</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Booth Number:</strong> {boothNumber}</p>
                <p><strong>Booth Size:</strong> {boothSize}</p>
                <p><strong>Duration:</strong> {durationWeeks} week{durationWeeks > 1 ? 's' : ''}</p>
              </div>
            </CardContent>
          </Card>

          {/* Attendees Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendees ({attendees.filter(a => a.name.trim() && a.email.trim()).length})
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {attendees
                  .filter(attendee => attendee.name.trim() && attendee.email.trim())
                  .map((attendee, index) => (
                    <p key={index}>
                      <strong>{attendee.name}</strong> - {attendee.email}
                    </p>
                  ))}
              </div>
            </CardContent>
          </Card>
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}