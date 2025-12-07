import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle?: string;
  price?: number;
}

export function WaitlistDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  price = 0,
}: WaitlistDialogProps) {
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleJoinWaitlist = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/events/${eventId}/waitlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            autopayEnabled,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to join waitlist");
      }

      toast({
        title: "Joined Waitlist!",
        description: `You've been added to the waitlist${autopayEnabled ? " with autopay enabled" : ""}. We'll notify you when a spot becomes available.`,
      });
      onOpenChange(false);
      setAutopayEnabled(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Join Waitlist</DialogTitle>
          <DialogDescription>
            This event is currently full. Join the waitlist to be notified when
            a spot becomes available.
            {eventTitle && (
              <span className="block mt-2 font-medium text-foreground">
                {eventTitle}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {price > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Event Price:</p>
              <p className="text-2xl font-bold">${price.toFixed(2)}</p>
            </div>
          )}

          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="autopay"
              checked={autopayEnabled}
              onCheckedChange={(checked) => setAutopayEnabled(checked === true)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="autopay"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Enable Autopay
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically pay and register when a spot becomes available.
                {price > 0 && (
                  <span className="block mt-1">
                    ${price.toFixed(2)} will be charged from your wallet or
                    saved payment method.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setAutopayEnabled(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinWaitlist}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? "Joining..." : "Join Waitlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
