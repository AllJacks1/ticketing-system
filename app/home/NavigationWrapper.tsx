"use client";

import { useRouter } from "next/navigation";
import TopNavigation from "@/app/home/NavigationBar";
import { LayoutDashboard, Ticket, CheckSquare } from "lucide-react";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation
        user={{ name: "Jane Smith", role: "Developer", avatar: "JS" }}
        navLinks={[
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            active: true,
          },
          { name: "My Tickets", href: "/tickets", icon: Ticket },
          { name: "My Tasks", href: "/tasks", icon: CheckSquare },
        ]}
        onSearch={(query) => console.log("Searching:", query)}
        onNavigate={(href) => router.push(href)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
