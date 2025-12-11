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

        {/* 
           UPDATED: "Native Glass" Theme
           1. dark:bg-background/95 -> Uses your app's actual background color so it matches perfectly.
           2. backdrop-blur-xl -> Blends it slightly with whatever is behind it.
           3. Gradient -> Subtle fade to purple-900/20 at the bottom for branding.
        */}
        <PopoverContent
          className="w-80 p-0 overflow-hidden shadow-2xl border-purple-100 dark:border-white/10 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-background/95 dark:via-background/90 dark:to-purple-900/10 backdrop-blur-xl"
          align="end"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-purple-100/50 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
              <CreditCard className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Available Funds
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                ${Number(balance).toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                USD
              </span>
            </div>
          </div>

          {/* Subheader */}
          <div className="px-4 py-2 border-b border-purple-100/50 dark:border-white/5 bg-white/30 dark:bg-white/[0.02] text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Activity
          </div>

          {/* ScrollArea */}
          <ScrollArea className="h-[280px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Loading...
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground opacity-60">
                <Wallet className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs">No transactions yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-purple-100/50 dark:divide-white/5">
                {transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-full shadow-sm ${
                          tx.type === "payment"
                            ? "bg-red-100/80 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                            : "bg-green-100/80 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                        }`}
                      >
                        {tx.type === "payment" ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium capitalize text-foreground">
                          {tx.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-xs ${
                        tx.type === "payment"
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {tx.type === "payment" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-purple-100/50 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm">
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
