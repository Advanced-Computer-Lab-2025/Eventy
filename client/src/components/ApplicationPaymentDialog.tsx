import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2 } from "lucide-react";
import { bazaarApiService } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";
import { Application } from "@/lib/bazaarApi";

interface ApplicationPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onPaymentSuccess?: () => void;
}

export default function ApplicationPaymentDialog({
  open,
  onOpenChange,
  application,
  onPaymentSuccess,
}: ApplicationPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<
    "credit_card" | "debit_card" | ""
  >("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Initiate payment
      const result = await bazaarApiService.payForApplication(
        application._id,
        paymentMethod as "credit_card" | "debit_card"
      );

      // Confirm payment (simulating Stripe confirmation)
      // In a real implementation, you would use Stripe Elements here
      // For now, we'll confirm the payment immediately
      if (result.clientSecret) {
        // Extract payment intent ID from client secret or transaction
        const transaction = result.transaction;
        if (transaction?.stripePaymentIntentId) {
          await bazaarApiService.confirmPayment(
            transaction.stripePaymentIntentId
          );

          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully.",
          });

          onOpenChange(false);
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
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

  const handleClose = () => {
    if (!isProcessing) {
      setPaymentMethod("");
      onOpenChange(false);
    }
  };

  // Calculate fee (this should match the backend calculation)
  // For now, we'll show a placeholder - in production, you'd fetch this from the backend
  const estimatedFee = application.type === "booth" ? 50 : 60;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment for Application
          </DialogTitle>
          <DialogDescription>
            Complete payment for your approved application to secure your spot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Application Type</Label>
            <div className="text-sm text-muted-foreground">
              {application.type === "bazaar"
                ? application.event?.name || "Bazaar Application"
                : "Platform Booth Application"}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estimated Fee</Label>
            <div className="text-lg font-semibold">
              ${estimatedFee.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Final amount will be calculated based on your application details.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value: "credit_card" | "debit_card") =>
                setPaymentMethod(value)
              }
              disabled={isProcessing}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> Payment must be completed within 3 days of
              approval. Your application will be confirmed once payment is
              processed.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !paymentMethod}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
