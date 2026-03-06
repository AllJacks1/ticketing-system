"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import TopNavigation from "@/app/home/admin/NavigationBar";
import { LayoutDashboard, Ticket, CheckSquare } from "lucide-react";
import { Notification } from "@/lib/types";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const navLinks = [
    {
      name: "Dashboard",
      href: "/home/admin",
      icon: LayoutDashboard,
      active: pathname === "/home/admin",
    },
    {
      name: "My Tickets",
      href: "/home/admin/tickets",
      icon: Ticket,
      active: pathname === "/home/admin/tickets",
    },
    {
      name: "My Tasks",
      href: "/home/admin/tasks",
      icon: CheckSquare,
      active: pathname === "/home/admin/tasks",
    },
  ];

  useEffect(() => {
    const fetchNotifications = async () => {
      const userProfile = localStorage.getItem("userProfile");
      const userId = userProfile ? JSON.parse(userProfile).user_id : null;

      if (!userId) return;

      const { data } = await supabase
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
        .order("created_at", { ascending: false })
        .limit(3);

      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.notifications.notification_id,
          title: item.notifications.title,
          message: item.notifications.description,
          time: item.notifications.created_at,
          unread: item.notifications.unread,
        }));
        setNotifications(formatted);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel("user_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation
        user={{ name: "Jane Smith", role: "Developer", avatar: "JS" }}
        notifications={notifications}
        navLinks={navLinks}
        onNavigate={(href) => router.push(href)}
        onMarkAsRead={async (id) => {
          // Update the notifications table, not user_notifications
          await supabase
            .from("notifications")
            .update({ unread: false })
            .eq("notification_id", id);
        }}
        onMarkAllAsRead={async () => {
          const userId = JSON.parse(
            localStorage.getItem("userProfile")!,
          ).user_id;

          // First get all unread notification IDs for this user
          const { data: userNotifs } = await supabase
            .from("user_notifications")
            .select("notification_id")
            .eq("user_id", userId);

          if (!userNotifs?.length) return;

          const notificationIds = userNotifs.map((n) => n.notification_id);

          // Update all those notifications to unread = false
          await supabase
            .from("notifications")
            .update({ unread: false })
            .in("notification_id", notificationIds);
        }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
