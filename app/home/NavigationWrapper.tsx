"use client";

import { useRouter, usePathname } from "next/navigation";
import TopNavigation from "@/app/home/NavigationBar";
import { LayoutDashboard, Ticket, CheckSquare } from "lucide-react";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    {
      name: "Dashboard",
      href: "/home",
      icon: LayoutDashboard,
      active: pathname === "/home",
    },
    {
      name: "My Tickets",
      href: "/home/tickets",
      icon: Ticket,
      active: pathname === "/home/tickets",
    },
    {
      name: "My Tasks",
      href: "/home/tasks",
      icon: CheckSquare,
      active: pathname === "/home/tasks",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation
        user={{ name: "Jane Smith", role: "Developer", avatar: "JS" }}
        navLinks={navLinks}
        onSearch={(query) => console.log("Searching:", query)}
        onNavigate={(href) => router.push(href)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
