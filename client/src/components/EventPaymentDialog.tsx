import React, { useState, useEffect, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTheme } from "@/components/ThemeProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Wallet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Assuming you have this or standard inputs

// --- Stripe Form Component (Unchanged) ---
function EventPaymentForm({
  clientSecret,
  eventId,
  amount,
  onSuccess,
  waitlistMode = false,
  onPaymentMethodSelected,
}: {
  clientSecret: string;
  eventId: string;
  amount: number;
  onSuccess: () => void;
  waitlistMode?: boolean;
  onPaymentMethodSelected?: (method: "wallet" | "credit_card") => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message);

      // In waitlist mode, we need to create a setup intent to save the payment method
      if (waitlistMode) {
        // For waitlist, we'll create a setup intent to save the payment method
        // without charging. The backend should handle this.
        // For now, we'll just validate the card is entered correctly
        const paymentElement = elements.getElement("payment");
        if (!paymentElement) {
          throw new Error("Payment element not found");
        }

        // Get the payment method from the element
        const { error: pmError, paymentMethod } =
          await stripe.createPaymentMethod({
            elements,
          });

        if (pmError) throw new Error(pmError.message);

        if (paymentMethod) {
          // Payment method created successfully, save it
          if (onPaymentMethodSelected) {
            onPaymentMethodSelected("credit_card");
          }
          toast({
            title: "Card Details Saved",
            description:
              "Your card details have been saved for autopay. You'll be charged when a spot becomes available.",
          });
          onSuccess();
          return;
        } else {
          throw new Error("Failed to save payment method");
        }
      }

      // Normal payment flow
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (error) throw new Error(error.message);

      if (paymentIntent && paymentIntent.status === "succeeded") {
        const token = localStorage.getItem("token");
        // Confirm payment with backend
        const confirmRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/transactions/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          }
        );
        if (!confirmRes.ok) {
          const errData = await confirmRes.json();
          throw new Error(
            errData.error ||
              errData.message ||
              "Payment succeeded, but registration failed. Contact support."
          );
        }
        // Register for event
        const regRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/events/${eventId}/register`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!regRes.ok) {
          const errData = await regRes.json();
          throw new Error(
            errData.error ||
              errData.message ||
              "Payment succeeded, but registration failed. Contact support."
          );
        }
        toast({
          title: "Registration Successful!",
          description: "You are now registered for this event.",
        });
        onSuccess();
      } else {
        throw new Error("Payment status is not complete. Please try again.");
      }
    } catch (err) {
      toast({
        title: "An Error Occurred",
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full bg-purple-600 hover:bg-purple-700"
        size="lg"
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : waitlistMode ? (
          "Save Card for Autopay"
        ) : (
          `Pay $${amount.toFixed(2)} & Register`
        )}
      </Button>
    </form>
  );
}

// --- Main Dialog Component ---

interface EventPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  price: number;
  onRegistered: () => void;
  waitlistMode?: boolean;
  onPaymentMethodSelected?: (method: "wallet" | "credit_card") => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function EventPaymentDialog({
  open,
  onOpenChange,
  eventId,
  price,
  onRegistered,
  waitlistMode = false,
  onPaymentMethodSelected,
}: EventPaymentDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");
  const { toast } = useToast();
  const { theme } = useTheme();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setClientSecret(null);
        setPaymentMethod("card");
        setIsLoading(false);
      }, 300);
    }
  }, [open]);

  // 1. Handle Stripe Card Initialization
  const handleInitiateCardPayment = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      // For waitlist mode, we still need to create a payment intent
      // so the user can enter their card details for autopay
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/transactions/pay/${eventId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod: "credit_card",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Failed to initiate payment."
        );
      }

      if (!data.clientSecret) {
        throw new Error("No client secret received from server.");
      }

      setClientSecret(data.clientSecret);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
      if (msg.toLowerCase().includes("already paid")) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Wallet Payment (Immediate Execution)
  const handleWalletPayment = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (waitlistMode) {
        // In waitlist mode, just store the payment method preference
        if (onPaymentMethodSelected) {
          onPaymentMethodSelected("wallet");
        }
        onOpenChange(false);
        return;
      }

      // Step A: Deduct Money
      const payRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/transactions/pay/${eventId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentMethod: "wallet" }),
        }
      );

      const payData = await payRes.json();

      if (!payRes.ok) {
        throw new Error(
          payData.error || payData.message || "Wallet payment failed."
        );
      }

      // Step B: Register User (Since wallet payment is successful)
      // We skip the 'confirm' step for wallet, but we still need to register the user to the event
      const regRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/events/${eventId}/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!regRes.ok) {
        const regData = await regRes.json();
        // Edge case: Money deducted but registration failed
        throw new Error(
          regData.error ||
            regData.message ||
            "Payment successful, but registration failed. Please contact support."
        );
      }

      // Success!
      toast({
        title: "Success!",
        description: "Payment successful via wallet. You are registered.",
      });
      // Dispatch custom event to trigger recommendations refresh
      window.dispatchEvent(
        new CustomEvent("event-registered", { detail: { eventId } })
      );
      onRegistered();
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Payment Failed",
        description: msg,
        variant: "destructive",
      });
      if (msg.toLowerCase().includes("already paid")) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Main submission handler based on selected method
  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "card") {
      handleInitiateCardPayment();
    } else {
      handleWalletPayment();
    }
  };

  const stripeOptions = useMemo(() => {
    if (!clientSecret) return null;
    return {
      clientSecret,
      appearance: {
        theme: theme === "dark" ? "night" : ("stripe" as "night" | "stripe"),
        variables: {
          fontFamily: ' "Inter", sans-serif',
          borderRadius: "0.5rem",
          colorPrimary: "#7c3aed",
        },
      },
    };
  }, [clientSecret, theme]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-2xl font-bold">
            {waitlistMode ? "Set Up Autopay" : "Event Registration & Payment"}
          </DialogTitle>
          <DialogDescription>
            {waitlistMode
              ? "Select your payment method for automatic payment when a spot becomes available."
              : "Securely pay and register for this event."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 pt-4 items-start">
          <div className="space-y-4 hidden md:block">
            <img
              src="/images/payment.png"
              alt="Secure Payment"
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>
          <div className="w-full space-y-6">
            {!clientSecret ? (
              // --- Step 1: Method Selection ---
              <form onSubmit={handleProceed} className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    1. Select Payment Method
                  </h3>

                  <div className="grid gap-4">
                    {/* Card Option */}
                    <div
                      className={`relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                        paymentMethod === "card"
                          ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-600"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                      }`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <Label className="font-medium cursor-pointer">
                          Credit or Debit Card
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pay securely via Stripe
                        </p>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border border-primary ${
                          paymentMethod === "card"
                            ? "bg-primary"
                            : "bg-transparent"
                        }`}
                      />
                    </div>

                    {/* Wallet Option */}
                    <div
                      className={`relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                        paymentMethod === "wallet"
                          ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-600"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                      }`}
                      onClick={() => setPaymentMethod("wallet")}
                    >
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <Label className="font-medium cursor-pointer">
                          Digital Wallet
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pay using your account balance
                        </p>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border border-primary ${
                          paymentMethod === "wallet"
                            ? "bg-primary"
                            : "bg-transparent"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Total Amount (USD)
                  </label>
                  <div className="mt-1 font-bold text-2xl">
                    ${price.toFixed(2)}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : waitlistMode ? (
                    paymentMethod === "card" ? (
                      "Set Up Card Payment"
                    ) : (
                      "Use Wallet"
                    )
                  ) : paymentMethod === "card" ? (
                    `Proceed to Card Details`
                  ) : (
                    `Pay with Wallet`
                  )}
                </Button>
              </form>
            ) : (
              // --- Step 2: Stripe Form (Only for Card) ---
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    2. Enter Card Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setClientSecret(null);
                      setPaymentMethod("card");
                    }}
                    disabled={isLoading}
                  >
                    Change Method
                  </Button>
                </div>
                {stripePromise && stripeOptions && (
                  <Elements stripe={stripePromise} options={stripeOptions}>
                    <EventPaymentForm
                      clientSecret={clientSecret}
                      eventId={eventId}
                      amount={price}
                      waitlistMode={waitlistMode}
                      onSuccess={() => {
                        if (waitlistMode && onPaymentMethodSelected) {
                          onPaymentMethodSelected("credit_card");
                        } else {
                          // Dispatch custom event to trigger recommendations refresh
                          window.dispatchEvent(
                            new CustomEvent("event-registered", {
                              detail: { eventId },
                            })
                          );
                          onRegistered();
                        }
                        onOpenChange(false);
                      }}
                      onPaymentMethodSelected={onPaymentMethodSelected}
                    />
                  </Elements>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
