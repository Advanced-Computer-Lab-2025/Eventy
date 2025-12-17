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

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// --- Types ---
export interface ResaleListing {
  _id: string;
  sellerId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  originalPrice: number;
  finalPrice?: number;
}

interface ResalePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTicket: ResaleListing | null;
  eventId: string;
  eventName: string;
  onPurchaseSuccess: () => void;
}

// --- Stripe Form Component (Inner) ---
function StripeResaleForm({
  clientSecret,
  amount,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
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
      // 1. Submit Elements to Stripe
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message);

      // 2. Confirm Payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (error) throw new Error(error.message);

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // 3. Confirm Transaction with Backend
        const token = localStorage.getItem("token");

        const confirmResponse = await fetch(
          `${API_BASE_URL}/api/transactions/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          }
        );

        const data = await confirmResponse.json();

        if (!confirmResponse.ok || data.status === "failed") {
          throw new Error(
            data.error ||
              data.message ||
              "Payment confirmation failed on server."
          );
        }

        // --- SUCCESS TOAST (UPDATED COLOR) ---
        toast({
          title: "Payment Successful",
          description: "Your ticket has been secured.",
          // Removed the green background class
        });

        onSuccess();
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      toast({
        title: "Payment Failed",
        description: err.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base shadow-md"
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

// --- Main Dialog Component ---
export function ResalePurchaseDialog({
  open,
  onOpenChange,
  selectedTicket,
  eventId,
  eventName,
  onPurchaseSuccess,
}: ResalePurchaseDialogProps) {
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

  // Calculate Price
  const finalPrice = selectedTicket
    ? selectedTicket.finalPrice || selectedTicket.originalPrice * 1.2
    : 0;

  // Helper to extract ID string safely
  const getSellerId = () => {
    if (!selectedTicket) return "";
    return typeof selectedTicket.sellerId === "object"
      ? selectedTicket.sellerId._id
      : selectedTicket.sellerId;
  };

  // 1. Handle Stripe Card Initialization (Resale Endpoint)
  const handleInitiateCardPayment = async () => {
    if (!selectedTicket) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const sellerIdStr = getSellerId();

      const res = await fetch(`${API_BASE_URL}/api/transactions/resale/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: eventId,
          sellerId: sellerIdStr,
          paymentMethod: "credit_card",
        }),
      });

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
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Wallet Payment (Resale Endpoint)
  const handleWalletPayment = async () => {
    if (!selectedTicket) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const sellerIdStr = getSellerId();

      const res = await fetch(`${API_BASE_URL}/api/transactions/resale/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: eventId,
          sellerId: sellerIdStr,
          paymentMethod: "wallet",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Wallet payment failed.");
      }

      // --- SUCCESS TOAST (UPDATED COLOR) ---
      toast({
        title: "Purchase Successful",
        description: "You have successfully bought the ticket via Wallet.",
        // Removed the green background class, it will now use default theme
      });

      onPurchaseSuccess();
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Payment Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!selectedTicket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-2xl font-bold">
            Resale Ticket Purchase
          </DialogTitle>
          <DialogDescription>
            Securely pay and receive your ticket from{" "}
            {selectedTicket.sellerId.firstName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 pt-4 items-start">
          <div className="space-y-4 hidden md:block">
            {/* Fallback container if image fails to load */}
            <div className="w-full h-auto min-h-[400px] rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white overflow-hidden relative shadow-lg">
              <img
                src="/images/payment.png"
                alt="Secure Payment"
                className="w-full h-full object-cover absolute inset-0 z-10"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div className="z-0 text-center p-4">
                <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-semibold">Secure Transaction</p>
              </div>
            </div>
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
                    ${finalPrice.toFixed(2)}
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
                  ) : paymentMethod === "card" ? (
                    `Proceed to Card Details`
                  ) : (
                    `Pay with Wallet`
                  )}
                </Button>
              </form>
            ) : (
              // --- Step 2: Stripe Form (Only for Card) ---
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
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
                    <StripeResaleForm
                      clientSecret={clientSecret}
                      amount={finalPrice}
                      onSuccess={() => {
                        // Toast handled inside form
                        onPurchaseSuccess();
                        onOpenChange(false);
                      }}
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
