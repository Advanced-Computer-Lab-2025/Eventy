import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LoyaltyProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoyaltyProgramDialog({
  open,
  onOpenChange,
}: LoyaltyProgramDialogProps) {
  const { toast } = useToast();
  const [discountRate, setDiscountRate] = useState<number | "">("");
  const [promoCode, setPromoCode] = useState<string>("");
  const [terms, setTerms] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (discountRate === "" || !promoCode || !terms || !expiryDate) {
      toast({
        title: "Validation Error",
        description: "All fields are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the token from localStorage or your auth context
      const token = localStorage.getItem("token"); // or get from your auth context

      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        "http://localhost:4000/api/loyalty-partners/apply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            discountRate: Number(discountRate),
            promoCode,
            termsAndConditions: terms,
            expiryDate,
          }),
        }
      );

      const data = await response.json().catch(() => ({})); // Handle non-JSON responses

      if (!response.ok) {
        // If the server returned an error message, use it, otherwise use a default message
        const errorMessage =
          data.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description:
          data.message ||
          "You applied to the GUC Loyalty Program successfully!",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error applying to loyalty program:", error);

      // More specific error messages based on the error type
      let errorMessage = "Failed to apply to the loyalty program";

      if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to GUC Loyalty Program</DialogTitle>
          <DialogDescription>
            Fill the form below to participate in the program.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discountRate">Discount Rate (%)</Label>
            <Input
              id="discountRate"
              type="number"
              value={discountRate}
              placeholder="e.g., 20"
              onChange={(e) =>
                setDiscountRate(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promoCode">Promo Code</Label>
            <Input
              id="promoCode"
              value={promoCode}
              placeholder="e.g., SAVE20"
              onChange={(e) => setPromoCode(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Terms and Conditions</Label>
            <Textarea
              id="terms"
              value={terms}
              placeholder="e.g., Valid for all purchases over 100 EGP"
              onChange={(e) => setTerms(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
