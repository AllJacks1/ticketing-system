"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutDashboard, Ticket, CheckSquare } from "lucide-react";

export default function DashboardPage() {
  const [tasks, setTasks] = useState([
    {
      id: "TASK-001",
      title: "Implement user authentication API",
      status: "In Progress",
      priority: "High",
      project: "IssueLane Core",
      dueDate: "2 days",
      progress: 65,
    },
    {
      id: "TASK-002",
      title: "Design dashboard analytics charts",
      status: "To Do",
      priority: "Medium",
      project: "IssueLane Core",
      dueDate: "5 days",
      progress: 0,
    },
    {
      id: "TASK-003",
      title: "Fix responsive layout on mobile",
      status: "Completed",
      priority: "High",
      project: "IssueLane Core",
      dueDate: "Done",
      progress: 100,
    },
    {
      id: "TASK-004",
      title: "Write documentation for API endpoints",
      status: "To Do",
      priority: "Low",
      project: "IssueLane Docs",
      dueDate: "1 week",
      progress: 0,
    },
    {
      id: "TASK-005",
      title: "Optimize database queries",
      status: "In Review",
      priority: "Medium",
      project: "IssueLane Core",
      dueDate: "3 days",
      progress: 90,
    },
  ]);

  const stats = [
    {
      label: "Open Tickets",
      value: 24,
      change: "+12%",
      trend: "up",
      color: "blue",
      icon: Ticket,
    },
    {
      label: "In Progress",
      value: 8,
      change: "+3",
      trend: "up",
      color: "amber",
      icon: LayoutDashboard,
    },
    {
      label: "Resolved Today",
      value: 16,
      change: "+5",
      trend: "up",
      color: "green",
      icon: CheckSquare,
    },
    {
      label: "Avg Response",
      value: "2.4h",
      change: "-15min",
      trend: "down",
      color: "purple",
      icon: LayoutDashboard,
    },
  ];

  const recentTickets = [
    {
      id: "#2042",
      title: "Login page not loading on mobile",
      status: "Open",
      priority: "High",
      user: "Sarah Chen",
      time: "5 min ago",
      avatar: "SC",
    },
    {
      id: "#2041",
      title: "API timeout error on checkout",
      status: "In Progress",
      priority: "Urgent",
      user: "Mike Ross",
      time: "12 min ago",
      avatar: "MR",
    },
    {
      id: "#2040",
      title: "Update documentation for v2.0",
      status: "Waiting",
      priority: "Low",
      user: "Emma Wilson",
      time: "1 hour ago",
      avatar: "EW",
    },
    {
      id: "#2039",
      title: "Dark mode toggle broken",
      status: "Resolved",
      priority: "Medium",
      user: "James Lee",
      time: "2 hours ago",
      avatar: "JL",
    },
    {
      id: "#2038",
      title: "Database connection pool exhausted",
      status: "Closed",
      priority: "Urgent",
      user: "Alex Kim",
      time: "3 hours ago",
      avatar: "AK",
    },
  ];

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

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              progress:
                newStatus === "Completed"
                  ? 100
                  : newStatus === "To Do"
                    ? 0
                    : task.progress,
            }
          : task,
      ),
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your support tickets and development tasks
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  className={`p-2 rounded-lg ${
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "amber"
                        ? "bg-amber-50 text-amber-600"
                        : stat.color === "green"
                          ? "bg-green-50 text-green-600"
                          : "bg-purple-50 text-purple-600"
                  }`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                <span
                  className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500">from last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
          <CardTitle className="text-lg font-semibold">
            Recent Tickets
          </CardTitle>
          <Button
            variant="link"
            className="text-indigo-600 hover:text-indigo-700 p-0"
            onClick={() => window.location.href = "/home/tickets"}
          >
            View all
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                    {ticket.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {ticket.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {ticket.id}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            by {ticket.user}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            {ticket.time}
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
        </CardContent>
      </Card>

      {/* My Tasks Section */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
          <div>
            <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Web development assignments and progress
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {tasks.filter((t) => t.status === "Completed").length}/
              {tasks.length} completed
            </span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${(tasks.filter((t) => t.status === "Completed").length / tasks.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">
                        {task.id}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {task.project}
                      </span>
                      {task.dueDate !== "Done" && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`text-xs ${task.dueDate.includes("day") && parseInt(task.dueDate) <= 2 ? "text-red-600 font-medium" : "text-gray-500"}`}
                          >
                            Due in {task.dueDate}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                        <div
                          className={`h-full transition-all duration-500 ${
                            task.progress === 100
                              ? "bg-green-500"
                              : task.progress > 60
                                ? "bg-blue-500"
                                : task.progress > 30
                                  ? "bg-amber-500"
                                  : "bg-gray-400"
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {task.progress}%
                      </span>
                    </div>
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
        </CardContent>
      </Card>
    </>
  );
}