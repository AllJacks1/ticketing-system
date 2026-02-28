"use client";

import { useState } from "react";
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

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type?: "ticket" | "task" | "system" | "mention";
}

// Example extended notifications for the modal
const allNotifications: Notification[] = [
  {
    id: 1,
    title: "New ticket assigned",
    message: "TASK-006 has been assigned to you by Sarah Chen",
    time: "2 min ago",
    unread: true,
    type: "ticket",
  },
  {
    id: 2,
    title: "Task completed",
    message: "Mike Ross resolved #2041 - API timeout fix",
    time: "15 min ago",
    unread: true,
    type: "task",
  },
  {
    id: 3,
    title: "System update scheduled",
    message: "Scheduled maintenance tonight at 2 AM EST",
    time: "30 min ago",
    unread: false,
    type: "system",
  },
  {
    id: 4,
    title: "You were mentioned",
    message: "Sarah Chen mentioned you in TASK-004 comments",
    time: "45 min ago",
    unread: true,
    type: "mention",
  },
  {
    id: 5,
    title: "Deadline approaching",
    message: "TASK-002 is due tomorrow - Design dashboard charts",
    time: "1 hour ago",
    unread: false,
    type: "task",
  },
  {
    id: 6,
    title: "New comment on your ticket",
    message: "John Doe commented on #2038 - Database connection issue",
    time: "2 hours ago",
    unread: true,
    type: "ticket",
  },
  {
    id: 7,
    title: "Build failed",
    message: "Production deployment failed - Check logs",
    time: "3 hours ago",
    unread: true,
    type: "system",
  },
  {
    id: 8,
    title: "Task moved to review",
    message: "Alex Kim moved TASK-007 to In Review",
    time: "4 hours ago",
    unread: false,
    type: "task",
  },
  {
    id: 9,
    title: "New team member",
    message: "Emma Wilson joined the IssueLane Core project",
    time: "5 hours ago",
    unread: false,
    type: "system",
  },
  {
    id: 10,
    title: "Priority changed",
    message: "TASK-005 priority changed to Urgent by Mike Ross",
    time: "6 hours ago",
    unread: true,
    type: "task",
  },
  {
    id: 11,
    title: "Ticket reopened",
    message: "#2032 reopened by customer - Login issue persists",
    time: "8 hours ago",
    unread: true,
    type: "ticket",
  },
  {
    id: 12,
    title: "Sprint started",
    message: "Sprint 24 started - 12 tasks assigned to you",
    time: "10 hours ago",
    unread: false,
    type: "system",
  },
  {
    id: 13,
    title: "You were assigned as reviewer",
    message: "James Lee requested your review on PR #442",
    time: "12 hours ago",
    unread: true,
    type: "mention",
  },
  {
    id: 14,
    title: "Task blocked",
    message: "TASK-009 blocked - Waiting for API documentation",
    time: "1 day ago",
    unread: false,
    type: "task",
  },
  {
    id: 15,
    title: "Security alert",
    message: "New vulnerability detected in dependency lodash",
    time: "1 day ago",
    unread: true,
    type: "system",
  },
  {
    id: 16,
    title: "Milestone completed",
    message: "v2.0 Beta milestone completed - 45/45 tasks done",
    time: "2 days ago",
    unread: false,
    type: "system",
  },
  {
    id: 17,
    title: "New ticket created",
    message: "Customer created #2056 - Payment not processing",
    time: "2 days ago",
    unread: false,
    type: "ticket",
  },
  {
    id: 18,
    title: "Weekly summary",
    message: "You completed 8 tasks this week - Great job!",
    time: "3 days ago",
    unread: false,
    type: "system",
  },
  {
    id: 19,
    title: "Meeting reminder",
    message: "Team standup in 15 minutes - Daily sync",
    time: "3 days ago",
    unread: false,
    type: "mention",
  },
  {
    id: 20,
    title: "Task overdue",
    message: "TASK-001 is now overdue - Please update status",
    time: "4 days ago",
    unread: true,
    type: "task",
  },
];

function NotificationsModal() {
  const [notifications, setNotifications] =
    useState<Notification[]>(allNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => n.unread) : notifications;

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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

  return (
    <Dialog>
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
                        <p className="text-sm text-gray-600 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.time}
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
