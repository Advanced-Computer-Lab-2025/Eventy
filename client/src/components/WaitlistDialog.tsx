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
import { EventPaymentDialog } from "./EventPaymentDialog";

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle?: string;
  price?: number;
  onJoined?: () => void; // Callback when successfully joined
}

export function WaitlistDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  price = 0,
  onJoined,
}: WaitlistDialogProps) {
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "wallet" | "credit_card" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAutopayChange = (checked: boolean) => {
    if (checked && price > 0) {
      // Open payment dialog to select payment method
      setShowPaymentDialog(true);
    } else {
      setAutopayEnabled(false);
      setPaymentMethod(null);
    }
  };

  const handlePaymentComplete = (method: "wallet" | "credit_card") => {
    setPaymentMethod(method);
    setAutopayEnabled(true); // Automatically check the autopay checkbox
    setShowPaymentDialog(false);
    toast({
      title: "Payment Method Set",
      description: `Autopay will use ${method === "wallet" ? "your wallet" : "your card"} when a spot becomes available.`,
    });
  };

  const handleJoinWaitlist = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      // Logic 1: If payment method is selected, autopay is automatically enabled
      // Logic 2: If no payment method, autopay is disabled
      const finalAutopayEnabled = !!paymentMethod;
      const finalPaymentMethod = paymentMethod || null;

      // If user has payment method but checkbox shows unchecked, sync it
      if (paymentMethod && !autopayEnabled) {
        setAutopayEnabled(true);
      }

      // Prepare request body with correct values
      const requestBody = {
        autopayEnabled: finalAutopayEnabled,
        paymentMethod: finalPaymentMethod,
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/events/${eventId}/waitlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to join waitlist");
      }

      toast({
        title: "Joined Waitlist!",
        description: `You've been added to the waitlist${finalAutopayEnabled ? " with autopay enabled" : ""}. We'll notify you when a spot becomes available.`,
      });

      // Call the onJoined callback if provided BEFORE closing dialog
      if (onJoined) {
        await onJoined();
      }

      onOpenChange(false);
      setAutopayEnabled(false);
      setPaymentMethod(null);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to join waitlist. Please try again.",
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
              checked={autopayEnabled || !!paymentMethod}
              onCheckedChange={handleAutopayChange}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="autopay"
                className="text-sm font-medium leading-none cursor-pointer"
                onClick={() => {
                  if (!paymentMethod && price > 0) {
                    setShowPaymentDialog(true);
                  }
                }}
              >
                Enable Autopay
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically pay and register when a spot becomes available.
                {price > 0 && (
                  <span className="block mt-1">
                    ${price.toFixed(2)} will be charged from your selected
                    payment method.
                  </span>
                )}
              </p>
              {paymentMethod && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  ✓ Payment method:{" "}
                  {paymentMethod === "wallet" ? "Wallet" : "Credit Card"}
                </p>
              )}
              {!paymentMethod && price > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  Select Payment Method
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setAutopayEnabled(false);
              setPaymentMethod(null);
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

      {/* Payment Dialog for Autopay Setup */}
      {price > 0 && (
        <EventPaymentDialog
          open={showPaymentDialog}
          onOpenChange={(open) => {
            setShowPaymentDialog(open);
            if (!open && !paymentMethod) {
              // If dialog closed without selecting payment method, uncheck autopay
              setAutopayEnabled(false);
            }
          }}
          eventId={eventId}
          price={price}
          onRegistered={() => {
            // This won't be called in waitlist mode
          }}
          waitlistMode={true}
          onPaymentMethodSelected={handlePaymentComplete}
        />
      )}
    </Dialog>
  );
}
