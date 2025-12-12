import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  CreditCard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { WalletTopUpDialog } from "./WalletTopUpDialog";

interface WalletPopoverProps {
  balance: number;
  onRefreshBalance: () => void;
}

export default function WalletPopover({
  balance,
  onRefreshBalance,
}: WalletPopoverProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/transactions/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (popoverOpen) {
      fetchTransactions();
      if (onRefreshBalance) onRefreshBalance();
    }
  }, [popoverOpen]);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" title="My Transactions">
            <Wallet className="h-5 w-5" />
          </Button>
        </PopoverTrigger>

        {/* Dimensions matched to Notifications: 408px x 573px */}
        <PopoverContent
          className="!w-[408px] !h-[573px] p-0 flex flex-col overflow-hidden shadow-2xl border-purple-100 dark:border-white/10 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-background/95 dark:via-background/90 dark:to-purple-900/10 backdrop-blur-xl"
          align="end"
        >
          {/* Header: Restored "Available Funds" design you liked */}
          <div className="px-4 py-4 border-b border-purple-100/50 dark:border-white/5 shrink-0">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Available Funds
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground tracking-tight">
                ${Number(balance).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                USD
              </span>
            </div>
          </div>

          {/* Subheader: "Recent Activity" */}
          <div className="px-4 py-2 border-b border-purple-100/50 dark:border-white/5 bg-white/30 dark:bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
            Recent Activity
          </div>

          {/* ScrollArea: List items matched to Notifications typography */}
          <ScrollArea className="flex-1 w-full h-full">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-60">
                <Wallet className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-purple-100/50 dark:divide-white/5">
                {transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="p-4 hover:bg-accent/50 transition-colors cursor-default"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div
                          className={`p-2 rounded-full shrink-0 ${
                            tx.type === "payment"
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {tx.type === "payment" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                        </div>
                        {/* Text - Matches Notification typography */}
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold capitalize text-foreground">
                            {tx.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <span
                        className={`font-bold text-sm ${
                          tx.type === "payment"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {tx.type === "payment" ? "-" : "+"}$
                        {tx.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer: Matches "Mark all as read" section style */}
          <div className="p-3 border-t border-purple-100/50 dark:border-white/5 bg-muted/30 backdrop-blur-sm shrink-0">
            <Button
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              onClick={() => setTopUpOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Top Up Wallet
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <WalletTopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        onPaymentSuccess={() => {
          fetchTransactions();
          if (onRefreshBalance) onRefreshBalance();
        }}
      />
    </>
  );
}
