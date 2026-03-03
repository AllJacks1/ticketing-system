"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, TicketPlus, CheckSquare } from "lucide-react";
import NewTicketModal from "@/app/home/admin/tickets/NewTicketModal";
import NewTaskModal from "../tasks/NewTaskModal";
import { createClient } from "@/supabase/client";
import { Task, Ticket } from "@/lib/types";
import {
  formatDueDate,
  formatManilaTime,
  getInitials,
  isUrgent,
} from "@/lib/utils";
import { toast } from "sonner";

interface DashboardStats {
  label: string;
  value: number;
  color: "blue" | "amber" | "green" | "purple";
  icon: React.ElementType;
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const stats: DashboardStats[] = [
    {
      label: "Created Tickets",
      value: tickets.filter((t) => t.status === "Open").length,
      color: "blue",
      icon: TicketPlus,
    },
    {
      label: "Tickets In Progress",
      value: tasks.filter((t) => t.status === "In Progress").length,
      color: "amber",
      icon: LayoutDashboard,
    },
    {
      label: "Tickets Resolved Today",
      value: tickets.filter((t) => t.status === "Resolved").length,
      color: "green",
      icon: CheckSquare,
    },
  ];

  // Get userId once on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    if (storedUser) {
      try {
        const { user_id } = JSON.parse(storedUser);
        setUserId(user_id);
      } catch {
        toast.error("Failed to parse user profile");
      }
    }
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!userId) return;

    setLoadingTickets(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          ticket_id,
          title,
          description,
          status,
          priority,
          deadline,
          created_at,
          updated_at,
          remarks,
          files(type, url),
          assigned_by_user:users!tickets_assigned_by_fkey(first_name, last_name),
          assigned_to_user:users!tickets_assigned_to_fkey(first_name, last_name)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedTickets: Ticket[] = (data || []).map((ticket: any) => ({
        id: ticket.ticket_id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        dueDate: ticket.deadline || undefined,
        tags: [],
        comments: ticket.remarks
          ? Array.isArray(ticket.remarks)
            ? ticket.remarks
            : [ticket.remarks]
          : [],
        attachments: ticket.files
          ? Array.isArray(ticket.files)
            ? ticket.files.map((f: any) => ({
                type: f.type,
                url: f.url,
              }))
            : [{ type: ticket.files.type, url: ticket.files.url }]
          : [],
        assignee: ticket.assigned_to_user
          ? {
              name: `${ticket.assigned_to_user.first_name} ${ticket.assigned_to_user.last_name}`,
              avatar: getInitials(
                ticket.assigned_to_user.first_name,
                ticket.assigned_to_user.last_name,
              ),
            }
          : null,
        reporter: ticket.assigned_by_user
          ? {
              name: `${ticket.assigned_by_user.first_name} ${ticket.assigned_by_user.last_name}`,
              avatar: getInitials(
                ticket.assigned_by_user.first_name,
                ticket.assigned_by_user.last_name,
              ),
            }
          : null,
      }));

      setTickets(formattedTickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast.error("Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, [userId]);

  // Load data when userId is available
  useEffect(() => {
    fetchTickets();
  }, [userId]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Open: "bg-blue-50 text-blue-700 border-blue-200",
      "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
      Waiting: "bg-gray-50 text-gray-700 border-gray-200",
      Resolved: "bg-green-50 text-green-700 border-green-200",
      Closed: "bg-gray-50 text-gray-500 border-gray-200",
      "To Do": "bg-gray-100 text-gray-700 border-gray-200",
      "In Review": "bg-purple-100 text-purple-700 border-purple-200",
      Completed: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: "bg-gray-100 text-gray-600",
      Medium: "bg-blue-100 text-blue-700",
      High: "bg-orange-100 text-orange-700",
      Urgent: "bg-red-100 text-red-700",
    };
    return colors[priority] || "bg-gray-100 text-gray-600";
  };

  const getStatIconColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-50 text-blue-600",
      amber: "bg-amber-50 text-amber-600",
      green: "bg-green-50 text-green-600",
      purple: "bg-purple-50 text-purple-600",
    };
    return colors[color] || "bg-gray-50 text-gray-600";
  };

  const completedTasksCount = tasks.filter(
    (t) => t.status === "Completed",
  ).length;
  const taskProgress =
    tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your support tickets and development tasks
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <NewTicketModal
            onSubmit={(ticket) => {
              console.log("New ticket:", ticket);
              fetchTickets(); // Refresh after creation
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${getStatIconColor(stat.color)}`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
          <CardTitle className="text-lg font-semibold">
            Recent Tickets
          </CardTitle>
          <Button
            variant="link"
            className="text-indigo-600 hover:text-indigo-700 p-0"
            onClick={() => (window.location.href = "/home/tickets")}
          >
            View all
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingTickets ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No tickets found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      {ticket.reporter?.avatar || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {ticket.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">
                              {ticket.id}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              by {ticket.reporter?.name || "Unknown"}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              {formatManilaTime(ticket.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`w-20 justify-center text-center ${getPriorityColor(ticket.priority)}`}
                          >
                            {ticket.priority}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`w-24 justify-center text-center ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
