"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Command,
  LayoutDashboard,
  Ticket,
  CheckSquare,
} from "lucide-react";
import { NavLink, Notification, NavigationBarProps } from "@/lib/types";
import NotificationsModal from "./dashboard/NotificationsModal";
import ProfileModal from "./ProfileModal";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { toast } from "sonner";

const defaultNavLinks: NavLink[] = [
  { name: "Dashboard", href: "#", icon: LayoutDashboard, active: true },
  { name: "Tickets", href: "#", icon: Ticket, active: false },
  { name: "Tasks", href: "#", icon: CheckSquare, active: false },
  { name: "Projects", href: "#", icon: LayoutDashboard, active: false },
  { name: "Reports", href: "#", icon: LayoutDashboard, active: false },
];

const defaultNotifications: Notification[] = [
  {
    id: 1,
    title: "New ticket assigned",
    message: "TASK-006 has been assigned to you",
    time: "2 min ago",
    unread: true,
  },
  {
    id: 2,
    title: "Task completed",
    message: "Mike Ross resolved #2041",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "System update",
    message: "Scheduled maintenance tonight",
    time: "3 hours ago",
    unread: false,
  },
];

export function NavigationBar({
  user = { name: "John Doe", role: "Product Manager", avatar: "JD" },
  notifications = defaultNotifications,
  navLinks = defaultNavLinks,
  onNavigate,
}: NavigationBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const router = useRouter();

  const handleNavClick = (href: string) => {
    onNavigate?.(href);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
  const supabase = createClient();

  try {
    // 1️⃣ Show a loading toast
    const toastId = toast.loading("Logging out...");

    // 2️⃣ Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Logout failed: ${error.message}`, { id: toastId });
      return;
    }

    // 3️⃣ Clear local/session storage
    localStorage.clear();
    sessionStorage.clear();

    // 4️⃣ Clear all cookies
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // 5️⃣ Success toast
    toast.success("Logged out successfully!", { id: toastId });

    // 6️⃣ Redirect to login page
    router.replace("/");
  } catch (err) {
    console.error(err);
    toast.error("An unexpected error occurred during logout");
  }
};

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-8 hover:cursor-pointer"
            onClick={() => (window.location.href = "/home")}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Command className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                IssueLane
              </span>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    link.active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </a>
              ))}
            </div>
            {/* Notifications Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-600 hover:text-gray-900"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </Button>

              {/* Notifications Panel */}
              {isNotificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Mark all read
                      </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                            notification.unread ? "bg-indigo-50/30" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                                notification.unread
                                  ? "bg-indigo-600"
                                  : "bg-gray-300"
                              }`}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <NotificationsModal />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user.avatar ||
                    user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Menu */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1">
                    <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <ProfileModal
                      user={{
                        name: "Jane Smith",
                        email: "jane.smith@issuelane.com",
                        role: "Developer",
                        department: "Engineering",
                        avatar: "JS",
                      }}
                    />
                    <div className="border-t border-gray-100 my-1" />
                    <a className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-600 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  link.active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavigationBar;
