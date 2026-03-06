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

// Helper to safely parse user from localStorage
const getUserFromStorage = () => {
  const storedUser = localStorage.getItem("userProfile");
  if (!storedUser) return null;
  
  try {
    const parsed = JSON.parse(storedUser);
    return {
      userId: parsed.user_id?.toString(),
      roleId: parsed.assignment?.role_id?.toString(),
    };
  } catch {
    toast.error("Failed to parse user profile");
    return null;
  }
};

// Helper functions
const normalizeToArray = <T,>(val: T | T[] | null | undefined): T[] => {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

const normalizeFiles = (files: any) => {
  if (!files) return [];
  const arr = Array.isArray(files) ? files : [files];
  return arr.map((f) => ({ type: f.type, url: f.url }));
};

const formatUser = (user: any) => {
  if (!user?.first_name || !user?.last_name) return null;
  return {
    name: `${user.first_name} ${user.last_name}`,
    avatar: getInitials(user.first_name, user.last_name),
  };
};

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTasks: 0,
    resolvedTickets: 0,
  });

  // Initialize user data
  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      setUserId(user.userId);
      setRoleId(user.roleId);
    }
  }, []);

  const isRoleOne = roleId === "1";

  // Build stats array dynamically
  const dashboardStats: DashboardStats[] = [
    {
      label: "Open Tickets",
      value: stats.openTickets,
      color: "blue",
      icon: TicketPlus,
    },
    {
      label: "Tasks In Progress",
      value: stats.inProgressTasks,
      color: "amber",
      icon: LayoutDashboard,
    },
    {
      label: "Tickets Resolved",
      value: stats.resolvedTickets,
      color: "green",
      icon: CheckSquare,
    },
  ];

  // Format ticket data (reusable)
  const formatTicket = (ticket: any): Ticket => ({
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
  });

  // Format task assignee data
  const formatTaskAssignee = (item: any): Task[] => {
    const tasks = normalizeToArray(item.tasks);
    const user = normalizeToArray(item.users)[0] || normalizeToArray(item.author)[0];
    
    return tasks.map((task: any) => {
      const author = normalizeToArray(task.author)[0];
      const project = task.task_projects?.projects?.[0] || task.task_projects?.[0]?.projects?.[0];

      return {
        task_id: task.task_id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        created_at: task.created_at,
        projectName: project?.name || null,
        author: {
          first_name: author?.first_name || "",
          last_name: author?.last_name || "",
          avatar: getInitials(author?.first_name, author?.last_name),
        },
        assignee: {
          first_name: user?.first_name || "",
          last_name: user?.last_name || "",
          avatar: getInitials(user?.first_name, user?.last_name),
        },
      };
    });
  };

  // Fetch tickets with role-based filtering
  const fetchTickets = useCallback(async () => {
    if (!userId) return;

    setLoadingTickets(true);
    const supabase = createClient();

    try {
      let query = supabase
        .from("tickets")
        .select(`
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
        `)
        .order("created_at", { ascending: false });

      // Role 1: Only see tickets assigned TO them OR created BY them
      if (isRoleOne) {
        query = query.or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);
      }

      const { data, error } = await query.limit(5);

      if (error) throw error;

      // Fetch counts for stats
      let countQuery = supabase
        .from("tickets")
        .select("status", { count: "exact" });

      if (isRoleOne) {
        countQuery = countQuery.or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);
      }

      const { data: countData } = await countQuery.in("status", ["Open", "Resolved", "Closed"]);

      const countsByStatus = (countData || []).reduce(
        (acc, { status }) => ({ ...acc, [status]: (acc[status] || 0) + 1 }),
        {} as Record<string, number>
      );

      setTickets((data || []).map(formatTicket));
      setStats(prev => ({
        ...prev,
        openTickets: countsByStatus["Open"] || 0,
        resolvedTickets: (countsByStatus["Resolved"] || 0) + (countsByStatus["Closed"] || 0),
      }));
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast.error("Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, [userId, isRoleOne]);

  // Fetch tasks with role-based filtering
  const fetchTasks = useCallback(async () => {
    if (!userId) return;

    setLoadingTasks(true);
    const supabase = createClient();

    try {
      // For role is not 1, we need both assigned and authored tasks
      if (!isRoleOne) {
        // Fetch tasks assigned to user
        const { data: assignedData, error: assignedError } = await supabase
          .from("task_assignees")
          .select(`
            task_id,
            user_id,
            tasks!inner (
              task_id,
              created_at,
              title,
              author,
              author (first_name, last_name),
              due_date,
              status,
              priority,
              description,
              task_projects!inner (project_id, projects!inner (name))
            ),
            users (first_name, last_name)
          `)
          .eq("user_id", userId);

        if (assignedError) throw assignedError;

        // Fetch tasks authored by user
        const { data: authoredData, error: authoredError } = await supabase
          .from("tasks")
          .select(`
            task_id,
            created_at,
            title,
            author,
            author (first_name, last_name),
            due_date,
            status,
            priority,
            description,
            task_projects!inner (project_id, projects!inner (name)),
            task_assignees (user_id, users (first_name, last_name))
          `)
          .eq("author", userId);

        if (authoredError) throw authoredError;

        // Merge and deduplicate by task_id
        const assignedTasks = (assignedData || []).flatMap(formatTaskAssignee);
        const authoredTasks = (authoredData || []).map((task: any) => {
          const author = normalizeToArray(task.author)[0];
          const project = task.task_projects?.[0]?.projects || task.task_projects?.projects?.[0];
          const assignees = normalizeToArray(task.task_assignees);
          const primaryAssignee = assignees[0]?.users || author;

          return {
            task_id: task.task_id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            due_date: task.due_date,
            created_at: task.created_at,
            projectName: project?.name || null,
            author: {
              first_name: author?.first_name || "",
              last_name: author?.last_name || "",
              avatar: getInitials(author?.first_name, author?.last_name),
            },
            assignee: {
              first_name: primaryAssignee?.first_name || "",
              last_name: primaryAssignee?.last_name || "",
              avatar: getInitials(primaryAssignee?.first_name, primaryAssignee?.last_name),
            },
          };
        });

        // Combine and remove duplicates
        const taskMap = new Map();
        [...assignedTasks, ...authoredTasks].forEach(task => {
          taskMap.set(task.task_id, task);
        });
        setTasks(Array.from(taskMap.values()));

        // Fetch in-progress count
        const { data: inProgressData } = await supabase
          .from("task_assignees")
          .select("tasks!inner(status)")
          .eq("tasks.status", "In Progress");

        setStats(prev => ({
          ...prev,
          inProgressTasks: inProgressData?.length || 0,
        }));
      } else {
        // role-1: fetch only assigned tasks
        const { data, error } = await supabase
          .from("task_assignees")
          .select(`
            task_id,
            user_id,
            tasks!inner (
              task_id,
              created_at,
              title,
              author,
              author (first_name, last_name),
              due_date,
              status,
              priority,
              description,
              task_projects!inner (project_id, projects!inner (name))
            ),
            users (first_name, last_name)
          `)
          .eq("user_id", userId);

        if (error) throw error;

        setTasks((data || []).flatMap(formatTaskAssignee));

        // Fetch in-progress count
        const { data: inProgressData } = await supabase
          .from("task_assignees")
          .select("tasks!inner(status)")
          .eq("user_id", userId)
          .eq("tasks.status", "In Progress");

        setStats(prev => ({
          ...prev,
          inProgressTasks: inProgressData?.length || 0,
        }));
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [userId, isRoleOne]);

  // Load data when userId is available
  useEffect(() => {
    if (!userId) return;
    
    Promise.all([fetchTickets(), fetchTasks()]).catch(() => {
      toast.error("Failed to load dashboard data");
    });
  }, [userId, fetchTickets, fetchTasks]);

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

  const completedTasksCount = tasks.filter((t) => t.status === "Completed").length;
  const taskProgress = tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0;

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
            onSubmit={() => fetchTickets()}
          />
          <NewTaskModal
            onSubmit={() => fetchTasks()}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardStats.map((stat, index) => (
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
                <div className={`p-2 rounded-lg ${getStatIconColor(stat.color)}`}>
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

      {/* My Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
          <div>
            <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Web development assignments and progress
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {completedTasksCount}/{tasks.length} completed
            </span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingTasks ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No tasks assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div
                  key={task.task_id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-500">
                          {task.task_id}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {task.projectName || "No project"}
                        </span>
                        {task.due_date && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span
                              className={`text-xs ${
                                isUrgent(task.due_date)
                                  ? "text-red-600 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              Due in {formatDueDate(task.due_date)}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={`w-20 justify-center text-center ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`w-24 justify-center text-center ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </Badge>
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