import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Ensure you have this
import { useToast } from "@/hooks/use-toast"; // Ensure you have this hook
import {
  Loader2,
  Crown,
  Clock,
  Info,
  X,
  Receipt,
  CheckCircle2,
  Ticket,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import the Purchase Dialog (Only used for PAID tickets now)
import { ResalePurchaseDialog, ResaleListing } from "./ResalePurchaseDialog";

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ResaleMarketplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  tickets: ResaleListing[];
  onPurchaseSuccess: () => void;
  isLoadingInitial?: boolean;
}

export function ResaleMarketplaceDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  tickets,
  onPurchaseSuccess,
  isLoadingInitial,
}: ResaleMarketplaceDialogProps) {
  const { toast } = useToast();

  // State for PAID tickets (opens full payment dialog)
  const [selectedPaidTicket, setSelectedPaidTicket] =
    useState<ResaleListing | null>(null);

  // State for FREE tickets (opens simple confirmation)
  const [selectedFreeTicket, setSelectedFreeTicket] =
    useState<ResaleListing | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // --- Handlers ---

  const handleTicketClick = (ticket: ResaleListing) => {
    // 1. Calculate Price safely
    const basePrice = Number(ticket.originalPrice) || 0;
    // Use backend finalPrice if available, otherwise estimate markup (e.g. 1.15 or 1.2)
    const finalPrice = ticket.finalPrice
      ? Number(ticket.finalPrice)
      : basePrice > 0
        ? basePrice * 1.15
        : 0;

    // 2. Route to appropriate flow
    if (finalPrice > 0) {
      setSelectedPaidTicket(ticket);
    } else {
      setSelectedFreeTicket(ticket);
    }
  };

  const confirmClaimFreeTicket = async () => {
    if (!selectedFreeTicket) return;
    setIsClaiming(true);

    try {
      const token = localStorage.getItem("token");
      const sellerIdStr =
        typeof selectedFreeTicket.sellerId === "object"
          ? selectedFreeTicket.sellerId._id
          : selectedFreeTicket.sellerId;

      // API Call
      const res = await fetch(`${API_BASE_URL}/api/transactions/resale/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: eventId,
          sellerId: sellerIdStr,
          paymentMethod: "wallet", // Backend treats this as 0 deduction
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Claim failed.");
      }

      toast({
        title: "Ticket Claimed!",
        description: "You have successfully claimed this spot.",
      });

      setSelectedFreeTicket(null);
      onPurchaseSuccess(); // Refresh parent
      onOpenChange(false); // Close main dialog
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  // --- Render Purchase Dialog (Only if Paid Ticket Selected) ---
  if (selectedPaidTicket) {
    return (
      <ResalePurchaseDialog
        open={!!selectedPaidTicket}
        onOpenChange={(isOpen) => !isOpen && setSelectedPaidTicket(null)}
        selectedTicket={selectedPaidTicket}
        eventId={eventId}
        eventName={eventName}
        onPurchaseSuccess={() => {
          setSelectedPaidTicket(null);
          onPurchaseSuccess();
          onOpenChange(false);
        }}
      />
    );
  }

  // --- Render Main List ---
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] p-0 gap-0 block overflow-hidden bg-background text-foreground border-border shadow-2xl outline-none">
          <DialogClose className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground text-white/70 hover:text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>

          {/* Header */}
          <div className="relative w-full overflow-hidden border-b border-purple-100 dark:border-purple-900/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950/60 dark:via-background dark:to-indigo-950/30 z-0" />
            <div className="absolute -right-10 -top-12 text-purple-200/50 dark:text-purple-900/20 rotate-12 z-0">
              <Crown className="w-56 h-56" />
            </div>

            <DialogHeader className="p-8 relative z-10 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20 border border-purple-400/20">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <Badge
                  variant="outline"
                  className="bg-purple-100/50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                >
                  Exclusive Resale Market
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                Last Minute Access
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-medium">
                  {eventName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Verified Resale{" "}
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                </span>
              </div>
            </DialogHeader>
          </div>

          {/* Main Body */}
          <div className="p-6 min-h-[400px] bg-background">
            {isLoadingInitial ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-2 px-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Available Opportunities
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground/70 hover:text-purple-600 transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
                          <p>
                            These tickets are exclusive last-minute listings.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h3>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${tickets.length > 0 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200" : "bg-muted text-muted-foreground"}`}
                  >
                    {tickets.length} active
                  </span>
                </div>

                {tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-2xl bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent text-center">
                    <div className="h-20 w-20 bg-white dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4 shadow-sm border border-purple-100 dark:border-purple-800 relative">
                      <Clock className="h-10 w-10 text-purple-400 dark:text-purple-500" />
                      <div className="absolute top-0 right-0 h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-background">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-foreground">
                      The Marketplace is Quiet
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 leading-relaxed">
                      Listings appear here instantly when a student lists their
                      ticket.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {tickets.map((ticket, index) => {
                      // --- SAFE PRICE CALCULATION (Fixes $NaN) ---
                      const original = Number(ticket.originalPrice);
                      const basePrice = isNaN(original) ? 0 : original;

                      const finalPrice = ticket.finalPrice
                        ? Number(ticket.finalPrice)
                        : basePrice > 0
                          ? basePrice * 1.15
                          : 0; // 15% Markup assumption

                      const isFree = finalPrice <= 0;

                      return (
                        <div
                          key={ticket._id}
                          onClick={() => handleTicketClick(ticket)}
                          className="group relative flex w-full cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex w-full bg-card hover:bg-purple-50 dark:hover:bg-purple-900/10 border border-border hover:border-purple-200 dark:hover:border-purple-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            {/* Left Info */}
                            <div className="flex-1 p-4 flex items-center gap-4 relative">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {ticket.sellerId.firstName?.charAt(0) || "U"}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-medium text-sm text-foreground">
                                  {ticket.sellerId.firstName}{" "}
                                  {ticket.sellerId.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                  Last Minute Resale
                                </p>
                              </div>
                            </div>

                            {/* Perforation */}
                            <div className="relative w-0 border-l border-dashed border-border group-hover:border-purple-200 dark:group-hover:border-purple-800 my-2">
                              <div className="absolute -top-4 -left-2 w-4 h-4 rounded-full bg-background border-b border-border group-hover:border-purple-200 dark:group-hover:border-purple-700" />
                              <div className="absolute -bottom-4 -left-2 w-4 h-4 rounded-full bg-background border-t border-border group-hover:border-purple-200 dark:group-hover:border-purple-700" />
                            </div>

                            {/* Price Area */}
                            <div className="w-24 bg-muted/30 group-hover:bg-purple-100/30 dark:group-hover:bg-purple-900/20 flex flex-col items-center justify-center text-center p-2">
                              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-0.5">
                                Exclusive
                              </span>
                              {isFree ? (
                                <p className="text-lg font-bold text-green-600 dark:text-green-500">
                                  FREE
                                </p>
                              ) : (
                                <p className="text-lg font-bold text-foreground">
                                  ${finalPrice.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-1 p-3 bg-muted/40 border-t text-[10px] text-muted-foreground text-center justify-center">
            <div className="flex items-center justify-center gap-1.5 font-semibold text-purple-700 dark:text-purple-400">
              <Info className="h-3 w-3" />
              <span>Please note: Service fees are non-refundable.</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 opacity-70">
              <Receipt className="h-3 w-3" /> 100% Secure Transaction • Proceeds
              support Student Activities.
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Simple Alert Dialog for FREE items --- */}
      <AlertDialog
        open={!!selectedFreeTicket}
        onOpenChange={(open) => !open && setSelectedFreeTicket(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-600" />
              Claim Ticket?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to claim a free ticket from{" "}
              <b>{selectedFreeTicket?.sellerId.firstName}</b>. This will
              officially transfer the ticket to your name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClaiming}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Prevent auto-close to handle async
                confirmClaimFreeTicket();
              }}
              disabled={isClaiming}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isClaiming ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirm Claim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
