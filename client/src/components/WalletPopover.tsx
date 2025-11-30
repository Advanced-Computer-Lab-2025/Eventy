import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowDownLeft, ArrowUpRight, PlusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { WalletTopUpDialog } from "./WalletTopUpDialog"; // Import the new dialog

interface Transaction {
  _id: string;
  type: "payment" | "refund" | "wallet_top_up";
  amount: number;
  description?: string;
  createdAt: string;
}

export default function WalletPopover() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const balance = transactions.reduce((acc, tx) => {
    return tx.type === "refund" || tx.type === "wallet_top_up"
      ? acc + tx.amount
      : acc - tx.amount;
  }, 0);

  const fetchWallet = async () => {
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
      console.error("Failed to load wallet", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (popoverOpen) {
      fetchWallet();
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
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">My Transactions</h3>
            </div>
            <Badge variant="outline" className="text-sm font-mono">
              ${balance.toFixed(2)}
            </Badge>
          </div>
          <ScrollArea className="h-[350px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No transactions yet.
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="p-3 flex items-start justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-full ${
                          tx.type === "payment"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-green-100 dark:bg-green-900/30"
                        }`}
                      >
                        {tx.type === "payment" ? (
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {tx.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold text-sm ${
                        tx.type === "payment"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {tx.type === "payment" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="p-3 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setTopUpOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Top Up Wallet
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* The Top Up Dialog */}
      <WalletTopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        onPaymentSuccess={() => {
          fetchWallet(); // Refetch wallet data after successful payment
        }}
      />
    </>
  );
}
