import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface LoyaltyProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LoyaltyStatus {
  status:
    | "not_participated"
    | "pending"
    | "verified"
    | "cancelled"
    | "rejected";
  application?: {
    discountRate: number;
    promoCode: string;
    termsAndConditions: string;
    expiryDate: string;
    createdAt: string;
    updatedAt: string;
  };
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
  const [isLoading, setIsLoading] = useState(false);
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(
    null
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Fetch loyalty status when dialog opens
  useEffect(() => {
    if (open) {
      fetchLoyaltyStatus();
    }
  }, [open]);

  const fetchLoyaltyStatus = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        "http://localhost:4000/api/loyalty-partners/status",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLoyaltyStatus(data.data);
    } catch (error: any) {
      console.error("Error fetching loyalty status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch loyalty program status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      const token = localStorage.getItem("token");

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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
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

      // Refresh status after successful application
      await fetchLoyaltyStatus();

      // Reset form
      setDiscountRate("");
      setPromoCode("");
      setTerms("");
      setExpiryDate("");

      if (data.data?.status !== "pending") {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error applying to loyalty program:", error);

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

  const handleCancelParticipation = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        "http://localhost:4000/api/loyalty-partners/cancel",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description:
          data.message || "Your participation has been cancelled successfully!",
      });

      setShowCancelConfirm(false);
      await fetchLoyaltyStatus();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error cancelling loyalty program:", error);

      let errorMessage = "Failed to cancel loyalty program participation";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "verified":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!loyaltyStatus) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load loyalty program status. Please try again.
          </AlertDescription>
        </Alert>
      );
    }

    // Not participated yet - show application form
    if (loyaltyStatus.status === "not_participated") {
      return (
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
      );
    }

    // Already participated - show status and details
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {getStatusBadge(loyaltyStatus.status)}
          </div>
        </div>

        {loyaltyStatus.application && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Your Application Details:</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Discount Rate:
                </span>
                <span className="text-sm font-medium">
                  {loyaltyStatus.application.discountRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Promo Code:
                </span>
                <span className="text-sm font-medium">
                  {loyaltyStatus.application.promoCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Expiry Date:
                </span>
                <span className="text-sm font-medium">
                  {new Date(
                    loyaltyStatus.application.expiryDate
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Applied On:
                </span>
                <span className="text-sm font-medium">
                  {new Date(
                    loyaltyStatus.application.createdAt
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">
                  Terms & Conditions:
                </span>
                <p className="text-sm mt-1">
                  {loyaltyStatus.application.termsAndConditions}
                </p>
              </div>
            </div>
          </div>
        )}

        {(loyaltyStatus.status === "pending" ||
          loyaltyStatus.status === "verified") && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {loyaltyStatus.status === "pending"
                ? "Your application is currently under review. You can cancel your participation anytime."
                : "Your application has been approved. You can cancel your participation anytime."}
            </AlertDescription>
          </Alert>
        )}

        {loyaltyStatus.status === "rejected" && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Your application has been rejected. Contact support for more
              information.
            </AlertDescription>
          </Alert>
        )}

        {loyaltyStatus.status === "cancelled" && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your participation has been cancelled. Contact support if you want
              to reapply.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderFooter = () => {
    if (isLoading || !loyaltyStatus) {
      return (
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Close
          </Button>
        </DialogFooter>
      );
    }

    if (loyaltyStatus.status === "not_participated") {
      return (
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
      );
    }

    if (showCancelConfirm) {
      return (
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowCancelConfirm(false)}
            disabled={isSubmitting}
          >
            No, Keep Participation
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelParticipation}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cancelling..." : "Yes, Cancel Participation"}
          </Button>
        </DialogFooter>
      );
    }

    const canCancel =
      loyaltyStatus.status === "pending" || loyaltyStatus.status === "verified";

    // For rejected and cancelled statuses, only show close button
    if (
      loyaltyStatus.status === "rejected" ||
      loyaltyStatus.status === "cancelled"
    ) {
      return (
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Close
          </Button>
        </DialogFooter>
      );
    }

    return (
      <DialogFooter>
        {canCancel && (
          <Button
            variant="destructive"
            onClick={() => setShowCancelConfirm(true)}
            disabled={isSubmitting}
          >
            Cancel Participation
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Close
        </Button>
      </DialogFooter>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {loyaltyStatus?.status === "not_participated"
              ? "Apply to GUC Loyalty Program"
              : "Loyalty Program Status"}
          </DialogTitle>
          <DialogDescription>
            {loyaltyStatus?.status === "not_participated"
              ? "Fill the form below to participate in the program."
              : "View and manage your loyalty program participation."}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}
