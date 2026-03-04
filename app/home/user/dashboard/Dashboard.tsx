"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import NewTicketModal from "@/app/home/admin/tickets/NewTicketModal";
import { createClient } from "@/supabase/client";
import { DashboardStats, Ticket } from "@/lib/types";
import {
  formatManilaTime,
  TICKET_STATUS_CONFIG,
  STATUS_COLORS,
  PRIORITY_COLORS,
  STAT_ICON_COLORS,
  normalizeToArray,
  normalizeFiles,
  formatUser,
} from "@/lib/utils";
import { toast } from "sonner";

// Custom hook for user ID
const useUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userProfile");
    if (!storedUser) return;

    try {
      const { user_id } = JSON.parse(storedUser);
      setUserId(user_id);
    } catch {
      toast.error("Failed to parse user profile");
      console.error("Failed to parse user profile from localStorage");
    }
  }, []);

  return userId;
};

export default function DashboardPage() {
  const userId = useUserId();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!userId) return;

    setLoadingTickets(true);
    const supabase = createClient();

    try {
      // Parallel queries for tickets and counts
      const [ticketsRes, countsRes] = await Promise.all([
        supabase
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
          .eq("assigned_by", userId)
          .order("created_at", { ascending: false })
          .limit(5),

        supabase
          .from("tickets")
          .select("status", { count: "exact" })
          .eq("assigned_by", userId)
          .in("status", ["Open", "In Progress", "Resolved", "Closed"]),
      ]);

      if (ticketsRes.error) throw ticketsRes.error;

      // Process counts
      const countsByStatus = (countsRes.data || []).reduce(
        (acc, { status }) => ({
          ...acc,
          [status]: (acc[status] || 0) + 1,
        }),
        {} as Record<string, number>,
      );

      // Build stats from config
      const dashboardStats = Object.entries(TICKET_STATUS_CONFIG).map(
        ([status, config]) => ({
          label: config.label,
          value: countsByStatus[status] || 0,
          color: config.color,
          icon: config.icon,
        }),
      );

      // Transform tickets
      const formattedTickets: Ticket[] = (ticketsRes.data || []).map(
        (ticket) => ({
          id: ticket.ticket_id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.created_at,
          updatedAt: ticket.updated_at,
          dueDate: ticket.deadline ?? undefined,
          tags: [],
          comments: normalizeToArray(ticket.remarks),
          attachments: normalizeFiles(ticket.files),
          assignee: formatUser(ticket.assigned_to_user),
          reporter: formatUser(ticket.assigned_by_user),
        }),
      );

      setTickets(formattedTickets);
      setStats(dashboardStats);
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingTickets(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized color getters
  const getStatusColor = useMemo(
    () => (status: string) => STATUS_COLORS[status] || STATUS_COLORS.default,
    [],
  );

  const getPriorityColor = useMemo(
    () => (priority: string) =>
      PRIORITY_COLORS[priority] || PRIORITY_COLORS.default,
    [],
  );

  const getStatIconColor = useMemo(
    () => (color: string) =>
      STAT_ICON_COLORS[color] || STAT_ICON_COLORS.default,
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your support tickets
          </p>
        </div>

        <NewTicketModal onSubmit={() => fetchDashboardData()} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
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
            onClick={() => (window.location.href = "/home/user/tickets")}
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
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Extracted ticket row component for better performance
function TicketRow({
  ticket,
  getStatusColor,
  getPriorityColor,
}: {
  ticket: Ticket;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
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
                <span className="text-xs text-gray-500">{ticket.id}</span>
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
  );
}
