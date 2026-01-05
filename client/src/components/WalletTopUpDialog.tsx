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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";

// --- Internal Payment Form Component (This logic is correct, no changes needed) ---
function PaymentForm({
  clientSecret,
  onSuccess,
  amount,
}: {
  clientSecret: string;
  onSuccess: () => void;
  amount: number;
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
      if (submitError) {
        throw new Error(
          submitError.message || "Please check your payment details."
        );
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message || "Payment could not be processed.");
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        const token = localStorage.getItem("token");
        const apiBase = getApiBaseUrl();
        const confirmResponse = await fetch(
          `${apiBase}/api/transactions/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          }
        );

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          throw new Error(
            errorData.message ||
              "Payment succeeded, but we couldn't update your wallet. Please contact support."
          );
        }

        toast({
          title: "Payment Successful!",
          description: "Your wallet has been topped up.",
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
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

// --- Main Dialog Component (Updated with a larger, two-column layout) ---
interface WalletTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function WalletTopUpDialog({
  open,
  onOpenChange,
  onPaymentSuccess,
}: WalletTopUpDialogProps) {
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    // Reset state when the dialog is closed
    if (!open) {
      setTimeout(() => {
        setAmount("");
        setClientSecret(null);
      }, 300); // Delay to allow for closing animation
    }
  }, [open]);

  const handleInitiateTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const topUpAmount = parseFloat(amount);
    if (isNaN(topUpAmount) || topUpAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least $1.00.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/transactions/wallet/top-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: topUpAmount,
          paymentMethod: "credit_card",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.message || "Failed to initiate payment.");
      }
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Could not start payment process.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const options = useMemo(() => {
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
            Secure Wallet Top-up
          </DialogTitle>
          <DialogDescription>
            Add funds to your wallet securely. Your transactions are protected
            by Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8 pt-4 items-start">
          {/* LEFT COLUMN - Image and descriptive text */}
          <div className="space-y-4 hidden md:block">
            <img
              src="/images/payment.png"
              alt="Secure Payment"
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>

          {/* RIGHT COLUMN - Payment Forms */}
          <div className="w-full space-y-6">
            {!clientSecret ? (
              <form onSubmit={handleInitiateTopUp} className="space-y-4">
                <h3 className="font-semibold text-lg">1. Choose Amount</h3>
                <div className="flex items-center gap-2 p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <CreditCard className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                  <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                    Credit or Debit Card
                  </span>
                </div>

                <div>
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount to add (USD)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 20.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  2. Enter Payment Details
                </h3>
                {stripePromise && options && (
                  <Elements stripe={stripePromise} options={options}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      onSuccess={() => {
                        onPaymentSuccess();
                        onOpenChange(false);
                      }}
                      amount={parseFloat(amount)}
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
