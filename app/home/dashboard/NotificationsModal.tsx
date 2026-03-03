"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
import { createClient } from "@/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type?: string;
}

function NotificationsModal() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  const fetchAllNotifications = async () => {
    const userProfile = localStorage.getItem("userProfile");
    const userId = userProfile ? JSON.parse(userProfile).user_id : null;

    if (!userId) return;

    const { data, error } = await supabase
      .from("user_notifications")
      .select(
        `
        notifications (
          notification_id,
          title,
          description,
          created_at,
          unread
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch notifications");
      return;
    }

    if (data) {
      const formatted = data.map((item: any) => ({
        id: item.notifications.notification_id,
        title: item.notifications.title,
        message: item.notifications.description,
        time: item.notifications.created_at,
        unread: item.notifications.unread,
        type: "system", // Add type logic if you have it
      }));
      setNotifications(formatted);
    }
  };

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllNotifications();
    }
  }, [isOpen]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications_modal")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
        },
        () => {
          if (isOpen) {
            fetchAllNotifications();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, supabase]);

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => n.unread) : notifications;

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );

    try {
      await supabase
        .from("notifications")
        .update({ unread: false })
        .eq("notification_id", id);
    } catch (err) {
      toast.error("Failed to mark as read");
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: true } : n)),
      );
    }
  };

  const markAllAsRead = async () => {
    const previousNotifications = notifications;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

    try {
      const userProfile = localStorage.getItem("userProfile");
      const userId = userProfile ? JSON.parse(userProfile).user_id : null;

      if (!userId) return;

      const { data: userNotifs } = await supabase
        .from("user_notifications")
        .select("notification_id")
        .eq("user_id", userId);

      if (!userNotifs?.length) return;

      const notificationIds = userNotifs.map((n) => n.notification_id);

      await supabase
        .from("notifications")
        .update({ unread: false })
        .in("notification_id", notificationIds);

      toast.success("All notifications marked as read");
    } catch (err) {
      setNotifications(previousNotifications);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await supabase
        .from("user_notifications")
        .delete()
        .eq("notification_id", id);
    } catch (err) {
      toast.error("Failed to delete notification");
      fetchAllNotifications(); // Refetch to restore
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      ticket: "🎫",
      task: "✅",
      system: "🔧",
      mention: "💬",
    };
    return icons[type] || "📌";
  };

  const formatTime = (timestamp: string) => {
    // Add your formatManilaTime logic here or import it
    return new Date(timestamp).toLocaleString();
  };

  const formatNotificationMessage = (message: string) => {
    if (!message.includes("•") && !message.includes("\n")) {
      return <span>{message}</span>;
    }

    const lines = message.split("\n").filter((line) => line.trim());

    return (
      <div className="space-y-1">
        <p className="font-medium text-gray-900">{lines[0]}</p>
        {lines.slice(1).map((line, index) => (
          <div key={index} className="flex items-start gap-2 text-gray-600">
            <span className="text-indigo-500 mt-1">•</span>
            <span>{line.replace("•", "").trim()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        >
          View all notifications
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                Stay updated with your tickets, tasks, and mentions
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-4 border-b">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === "all"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === "unread"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    notification.unread
                      ? "bg-indigo-50/50 hover:bg-indigo-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">
                    {getTypeIcon(notification.type || "system")}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                          {notification.unread && (
                            <span className="ml-2 w-2 h-2 bg-indigo-600 rounded-full inline-block" />
                          )}
                        </p>
                        <div className="text-sm text-gray-600 mt-0.5">
                          {formatNotificationMessage(notification.message)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.time)}
                        </p>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {notification.unread && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t flex items-center justify-center text-sm text-gray-500">
          <span>Showing {filteredNotifications.length} notifications</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationsModal;
