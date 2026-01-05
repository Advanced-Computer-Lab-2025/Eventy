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
import {
  Clock,
  Users,
  CreditCard,
  Wallet,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";

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
        `${getApiBaseUrl()}/api/events/${eventId}/waitlist`,
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
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                Join Waitlist
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-slate-600 dark:text-slate-300">
              This event is currently full. Join the waitlist to be notified
              when a spot becomes available.
              {eventTitle && (
                <span className="block mt-2 font-semibold text-slate-900 dark:text-white">
                  {eventTitle}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Price Card */}
          {price > 0 && (
            <div className="relative p-4 bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Event Price
                  </p>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${price.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Autopay Section */}
          <div className="relative p-5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
            <div className="flex items-start gap-4">
              <Checkbox
                id="autopay"
                checked={autopayEnabled || !!paymentMethod}
                onCheckedChange={handleAutopayChange}
                className="mt-1 h-5 w-5 border-2 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="autopay"
                    className="text-base font-semibold text-slate-900 dark:text-white cursor-pointer flex items-center gap-2"
                  >
                    Enable Autopay
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </Label>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Automatically pay and register when a spot becomes available.
                  {price > 0 && (
                    <span className="block mt-2 font-medium text-slate-700 dark:text-slate-300">
                      ${price.toFixed(2)} will be charged automatically from
                      your selected payment method.
                    </span>
                  )}
                </p>

                {/* Payment Method Badge */}
                {paymentMethod && (
                  <div className="flex items-center gap-2 mt-3 p-2.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      {paymentMethod === "wallet" ? (
                        <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Payment method:{" "}
                        {paymentMethod === "wallet" ? "Wallet" : "Credit Card"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Info for free events */}
                {price === 0 && (
                  <div className="flex items-start gap-2 mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      You'll be automatically registered when a spot becomes
                      available (no payment required).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setAutopayEnabled(false);
              setPaymentMethod(null);
            }}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinWaitlist}
            disabled={isSubmitting}
            className="min-w-[140px] bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Join Waitlist
              </span>
            )}
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
