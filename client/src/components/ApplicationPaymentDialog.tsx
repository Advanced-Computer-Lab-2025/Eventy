import { useState, useEffect, useMemo } from "react";
import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { MdAttachMoney } from "react-icons/md";
import { bazaarApiService } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";
import { Application } from "@/lib/bazaarApi";
import { logger } from "@/lib/logger";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTheme } from "@/components/ThemeProvider";

interface ApplicationPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onPaymentSuccess?: () => void;
}

// Payment form component that uses Stripe Elements
function PaymentForm({
  onPaymentSuccess,
  onClose,
  estimatedFee,
  clientSecret,
}: {
  onPaymentSuccess?: () => void;
  onClose: () => void;
  estimatedFee: number;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // First, submit the elements to validate the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast({
          title: "Payment Failed",
          description:
            submitError.message || "Please check your payment details",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Then, confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Verify payment on backend
        await bazaarApiService.confirmPayment(paymentIntent.id);

        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });

        onClose();
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${estimatedFee.toFixed(2)}`
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Payment must be completed within 3 days of approval. Your application
        will be confirmed once payment is processed.
      </p>
    </form>
  );
}

export default function ApplicationPaymentDialog({
  open,
  onOpenChange,
  application,
  onPaymentSuccess,
}: ApplicationPaymentDialogProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [actualFee, setActualFee] = useState<number | null>(null);
  const { toast } = useToast();

  // Load Stripe publishable key and initialize Stripe
  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        const publishableKey = await bazaarApiService.getStripePublishableKey();
        if (publishableKey) {
          setStripePromise(loadStripe(publishableKey));
        }
      } catch (error) {
        logger.error("Failed to load Stripe key:", error);
        toast({
          title: "Payment System Error",
          description:
            "Failed to initialize payment system. Please try again later.",
          variant: "destructive",
        });
      }
    };

    if (open) {
      loadStripeKey();
    }
  }, [open, toast]);

  // Initialize payment intent when dialog opens
  useEffect(() => {
    const initializePayment = async () => {
      if (!open || !stripePromise) return;

      try {
        const result = await bazaarApiService.payForApplication(
          application._id,
          "credit_card"
        );
        if (result.clientSecret) {
          setClientSecret(result.clientSecret);
        }
        // Use the actual amount from the transaction returned by the backend
        if (result.transaction?.amount !== undefined) {
          setActualFee(result.transaction.amount);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to initialize payment";
        toast({
          title: "Payment Initialization Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    if (open && stripePromise) {
      initializePayment();
    }
  }, [open, stripePromise, application._id, toast]);

  const handleClose = () => {
    setClientSecret(null);
    setActualFee(null);
    onOpenChange(false);
  };

  // Use actual fee from backend, fallback to a simple estimate if not available yet
  const estimatedFee = actualFee ?? (application.type === "booth" ? 50 : 60);

  const { theme } = useTheme();

  const options = useMemo<StripeElementsOptions | undefined>(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: theme === "dark" ? "night" : "stripe",
              variables: {
                ...(theme === "dark" && {
                  // These three control ALL text inside every input & dropdown,
                  // including country.
                  colorText: "#e5e5e5",
                  colorTextSecondary: "#bbbbbb",
                  colorTextPlaceholder: "#888888",

                  // DO NOT override backgrounds → keeps boxes white!
                }),

                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                borderRadius: "0.5rem",
              },

              rules:
                theme === "dark"
                  ? {
                      // Make the COUNTRY text readable
                      ".SelectInput": {
                        color: "#e5e5e5 !important",
                      },
                      ".SelectInput--empty": {
                        color: "#888888 !important",
                      },
                      ".Input--empty": {
                        color: "#888888 !important",
                      },
                    }
                  : undefined,
            },
          }
        : undefined,
    [clientSecret, theme]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MdAttachMoney className="h-6 w-6" />
            Payment details
          </DialogTitle>
          <DialogDescription>
            Complete payment for your approved application
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Payment Summary */}
          <div className="space-y-4">
            <div>
              <img
                src="/images/payment.png"
                alt="Payment illustration"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
              <div className="flex items-center gap-2 mb-2 p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
                <CreditCard className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  Credit or Debit Card
                </span>
              </div>
            </div>

            {stripePromise && options && clientSecret ? (
              <Elements stripe={stripePromise} options={options}>
                <PaymentForm
                  onPaymentSuccess={onPaymentSuccess}
                  onClose={handleClose}
                  estimatedFee={estimatedFee}
                  clientSecret={clientSecret}
                />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
