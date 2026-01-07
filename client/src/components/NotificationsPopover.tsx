import { useCallback, useEffect, useState } from "react";
import { Bell, Trash2, ArrowUpDown, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { getApiBaseUrl } from "@/lib/apiBase";
import { logger } from "@/lib/logger";

interface Notification {
  _id: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

type SortOrder = "newest" | "oldest";

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<
    string | null
  >(null);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${getApiBaseUrl()}/api/notifications/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      } else {
        throw new Error("Failed to fetch notifications");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch notifications on mount to show badge count immediately
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refetch when popover opens to ensure data is fresh
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${getApiBaseUrl()}/api/notifications/${notificationId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isRead: true }),
        }
      );

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (err) {
      logger.error("Failed to mark as read:", err);
    }
  };

  const confirmDelete = (notificationId: string) => {
    setNotificationToDelete(notificationId);
    setDeleteConfirmOpen(true);
  };

  const deleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${getApiBaseUrl()}/api/notifications/${notificationToDelete}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationToDelete)
        );
        toast({
          title: "Notification Deleted",
          description: "The notification has been deleted",
        });
        setDeleteConfirmOpen(false);
        setNotificationToDelete(null);
        // Close detail dialog if the deleted notification was selected
        if (selectedNotification?._id === notificationToDelete) {
          setDetailDialogOpen(false);
          setSelectedNotification(null);
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          // Don't close the popover if a dialog is open
          if (!newOpen && (detailDialogOpen || deleteConfirmOpen)) {
            return;
          }
          setOpen(newOpen);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-[18px] w-[18px] bg-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-[1.6px] border-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={toggleSortOrder}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "newest" ? "Newest" : "Oldest"}
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-accent/50 transition-colors ${
                      !notification.isRead ? "bg-accent/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex-1 space-y-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Auto-mark as read when opening
                          if (!notification.isRead) {
                            markAsRead(notification._id);
                          }
                          setSelectedNotification({
                            ...notification,
                            isRead: true, // Update local state immediately
                          });
                          setDetailDialogOpen(true);
                          // Explicitly keep popover open
                          setOpen(true);
                        }}
                      >
                        <p
                          className={`text-sm ${
                            !notification.isRead
                              ? "font-semibold"
                              : "font-normal"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-purple-600" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(notification._id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {sortedNotifications.length > 0 && (
            <div className="p-3 border-t bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  sortedNotifications
                    .filter((n) => !n.isRead)
                    .forEach((n) => markAsRead(n._id));
                }}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Notification Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onOpenChange={(isOpen) => {
          setDetailDialogOpen(isOpen);
          // Keep popover open when dialog closes
          if (!isOpen && open) {
            setOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {selectedNotification?.title || "Notification"}
            </DialogTitle>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4 pt-2">
              {/* Header: Date and Sender Info */}
              <div className="flex items-start justify-between pb-4 border-b">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedNotification.createdAt), "PPpp")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(
                      new Date(selectedNotification.createdAt),
                      {
                        addSuffix: true,
                      }
                    )}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">
                    {selectedNotification.sender
                      ? ["events_office", "admin"].includes(
                          selectedNotification.sender.role
                        )
                        ? selectedNotification.sender.role
                            .replace("_", " ")
                            .toUpperCase()
                        : `${selectedNotification.sender.firstName || ""} ${selectedNotification.sender.lastName || ""}`.trim()
                      : ""}
                  </p>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase">
                  Content
                </h3>
                <p className="text-base leading-relaxed bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900">
                  {selectedNotification.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    confirmDelete(selectedNotification._id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(isOpen) => {
          setDeleteConfirmOpen(isOpen);
          setNotificationToDelete(isOpen ? notificationToDelete : null);
          // Keep popover open when dialog closes
          if (!isOpen && open) {
            setOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setNotificationToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteNotification}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
