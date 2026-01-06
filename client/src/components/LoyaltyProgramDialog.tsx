import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Gift, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/apiBase";
import { logger } from "@/lib/logger";

interface LoyaltyProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VendorStatus {
  hasParticipation: boolean;
  status: "active" | "cancelled" | null;
  details?: {
    discountRate: number;
    promoCode: string;
    termsAndConditions: string;
    expiryDate: string;
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
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<VendorStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Fetch vendor status when dialog opens
  useEffect(() => {
    if (open) {
      fetchVendorStatus();
    }
  }, [open]);

  const fetchVendorStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/loyalty-partners/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      setVendorStatus(data.data);
    } catch (error: any) {
      logger.error("Error fetching vendor status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch loyalty program status",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/loyalty-partners/cancel`,
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
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      toast({
        title: "Success",
        description:
          data.message ||
          "Successfully cancelled loyalty program participation",
      });

      // Refresh status after cancellation
      await fetchVendorStatus();
    } catch (error: any) {
      logger.error("Error cancelling loyalty program:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel loyalty program",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      // Get the token from localStorage or your auth context
      const token = localStorage.getItem("token"); // or get from your auth context

      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/loyalty-partners/apply`,
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
            expiryDate: format(expiryDate, "yyyy-MM-dd"),
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
      logger.error("Error applying to loyalty program:", error);

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
      <DialogContent
        className={
          vendorStatus?.status === "cancelled" ? "max-w-sm" : "max-w-lg"
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {isLoadingStatus
              ? "Loading..."
              : vendorStatus?.status === "active"
                ? "Loyalty Program Status"
                : vendorStatus?.status === "cancelled"
                  ? "Reapply to Loyalty Program"
                  : "Apply to GUC Loyalty Program"}
          </DialogTitle>
          <DialogDescription>
            {isLoadingStatus
              ? "Checking your loyalty program status..."
              : vendorStatus?.status === "active"
                ? "You currently have an active participation in the GUC Loyalty Program."
                : vendorStatus?.status === "cancelled"
                  ? "You previously participated in the GUC Loyalty Program. You can apply again below."
                  : "Fill the form below to participate in the program."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingStatus ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : vendorStatus?.status === "active" ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                Active Participation Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount Rate:
                  </span>
                  <span className="font-medium text-foreground">
                    {vendorStatus.details?.discountRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Promo Code:
                  </span>
                  <span className="font-medium text-foreground">
                    {vendorStatus.details?.promoCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Expiry Date:
                  </span>
                  <span className="font-medium text-foreground">
                    {vendorStatus.details?.expiryDate
                      ? new Date(
                          vendorStatus.details.expiryDate
                        ).toLocaleDateString()
                      : "No expiry"}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {vendorStatus.details?.termsAndConditions}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : vendorStatus?.status === "cancelled" ? (
          <div className="space-y-2">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-300 text-xs mb-1">
                Previous Participation
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Cancelled. You can apply again.
              </p>
            </div>
            {/* Show application form for reapplication */}
            <div className="space-y-2">
              <div className="space-y-1">
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
              <div className="space-y-1">
                <Label htmlFor="promoCode">Promo Code</Label>
                <Input
                  id="promoCode"
                  value={promoCode}
                  placeholder="e.g., SAVE20"
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="terms">Terms and Conditions</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  placeholder="e.g., Valid for all purchases over 100 EGP"
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? (
                        format(expiryDate, "dd/MM/yyyy")
                      ) : (
                        <span>dd/mm/yyyy</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ) : (
          /* Show application form for new applicants */
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? (
                      format(expiryDate, "dd/MM/yyyy")
                    ) : (
                      <span>dd/mm/yyyy</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isLoadingStatus}
          >
            {vendorStatus?.status === "active" ? "Close" : "Cancel"}
          </Button>
          {vendorStatus?.status === "active" ? (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isSubmitting || isLoadingStatus}
            >
              {isSubmitting ? "Cancelling..." : "Cancel Participation"}
            </Button>
          ) : vendorStatus?.status === "cancelled" ||
            (!isLoadingStatus && !vendorStatus?.hasParticipation) ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isLoadingStatus}
            >
              {isSubmitting ? "Submitting..." : "Apply"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
