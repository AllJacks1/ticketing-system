"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layout,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";
import NewTaskModal from "./NewTaskModal";
import TaskDetailModal from "./TaskDetailModal";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "To Do" | "In Progress" | "In Review" | "Completed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  project: string;
  assignee: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  progress: number;
  estimatedHours?: number;
  loggedHours?: number;
}

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "TASK-001",
      title: "Implement user authentication API",
      description: "Create JWT-based auth system with refresh tokens",
      status: "In Progress",
      priority: "High",
      project: "IssueLane Core",
      assignee: { name: "Sarah Chen", avatar: "SC" },
      createdAt: "3 days ago",
      updatedAt: "2 hours ago",
      dueDate: "2 days",
      progress: 65,
      estimatedHours: 16,
      loggedHours: 10,
    },
    {
      id: "TASK-002",
      title: "Design dashboard analytics charts",
      description: "Create reusable chart components for data visualization",
      status: "To Do",
      priority: "Medium",
      project: "IssueLane Core",
      assignee: { name: "John Doe", avatar: "JD" },
      createdAt: "5 days ago",
      updatedAt: "1 day ago",
      dueDate: "5 days",
      progress: 0,
      estimatedHours: 12,
      loggedHours: 0,
    },
    {
      id: "TASK-003",
      title: "Fix responsive layout on mobile",
      description: "Resolve CSS issues on iPhone and Android devices",
      status: "Completed",
      priority: "High",
      project: "IssueLane Core",
      assignee: { name: "Emma Wilson", avatar: "EW" },
      createdAt: "1 week ago",
      updatedAt: "3 hours ago",
      dueDate: "Done",
      progress: 100,
      estimatedHours: 8,
      loggedHours: 6,
    },
    {
      id: "TASK-004",
      title: "Write documentation for API endpoints",
      description: "Document all REST endpoints with examples",
      status: "To Do",
      priority: "Low",
      project: "IssueLane Docs",
      assignee: { name: "Alex Kim", avatar: "AK" },
      createdAt: "2 days ago",
      updatedAt: "5 hours ago",
      dueDate: "1 week",
      progress: 0,
      estimatedHours: 6,
      loggedHours: 0,
    },
    {
      id: "TASK-005",
      title: "Optimize database queries",
      description: "Improve query performance for dashboard stats",
      status: "In Review",
      priority: "Medium",
      project: "IssueLane Core",
      assignee: { name: "Mike Ross", avatar: "MR" },
      createdAt: "4 days ago",
      updatedAt: "1 hour ago",
      dueDate: "3 days",
      progress: 90,
      estimatedHours: 10,
      loggedHours: 9,
    },
    {
      id: "TASK-006",
      title: "Setup CI/CD pipeline",
      description:
        "Configure GitHub Actions for automated testing and deployment",
      status: "In Progress",
      priority: "High",
      project: "IssueLane Infrastructure",
      assignee: { name: "James Lee", avatar: "JL" },
      createdAt: "1 week ago",
      updatedAt: "6 hours ago",
      dueDate: "Tomorrow",
      progress: 40,
      estimatedHours: 20,
      loggedHours: 8,
    },
    {
      id: "TASK-007",
      title: "Implement email notifications",
      description: "Add SMTP integration for ticket updates",
      status: "To Do",
      priority: "Medium",
      project: "IssueLane Core",
      assignee: { name: "Sarah Chen", avatar: "SC" },
      createdAt: "2 days ago",
      updatedAt: "1 day ago",
      dueDate: "Next week",
      progress: 0,
      estimatedHours: 8,
      loggedHours: 0,
    },
    {
      id: "TASK-008",
      title: "Security audit and fixes",
      description: "Review code for vulnerabilities and apply patches",
      status: "In Review",
      priority: "Urgent",
      project: "IssueLane Core",
      assignee: { name: "John Doe", avatar: "JD" },
      createdAt: "3 days ago",
      updatedAt: "30 min ago",
      dueDate: "Today",
      progress: 85,
      estimatedHours: 24,
      loggedHours: 20,
    },
  ]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "To Do": "bg-gray-100 text-gray-700 border-gray-200",
      "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
      "In Review": "bg-purple-50 text-purple-700 border-purple-200",
      Completed: "bg-green-50 text-green-700 border-green-200",
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

  // Get unique projects for filter
  const projects = Array.from(new Set(tasks.map((t) => t.project)));

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject =
      projectFilter === "all" || task.project === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const stats = [
    { label: "Total Tasks", value: tasks.length, icon: Layout },
    {
      label: "To Do",
      value: tasks.filter((t) => t.status === "To Do").length,
      icon: CheckSquare,
    },
    {
      label: "In Progress",
      value: tasks.filter((t) => t.status === "In Progress").length,
      icon: ArrowUpDown,
    },
    {
      label: "Completed",
      value: tasks.filter((t) => t.status === "Completed").length,
      icon: CheckCircle2,
    },
  ];

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus as Task["status"],
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage development tasks and track progress
          </p>
        </div>
        <NewTaskModal
          onSubmit={(task) => {
            console.log("New task:", task);
            // Add to your tasks list
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) =>
                  handleFilterChange(setSearchQuery, e.target.value)
                }
                className="pl-9"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  handleFilterChange(setStatusFilter, value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter}
                onValueChange={(value) =>
                  handleFilterChange(setPriorityFilter, value)
                }
              >
                <SelectTrigger className="w-[160px]">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={projectFilter}
                onValueChange={(value) =>
                  handleFilterChange(setProjectFilter, value)
                }
              >
                <SelectTrigger className="w-[260px]">
                  <Layout className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold">
            All Tasks ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {paginatedTasks.map((task) => (
              <TaskDetailModal
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
              >
                <div className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {task.assignee.avatar}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Meta row */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span className="font-medium text-gray-900">
                          {task.id}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1">
                          <Layout className="w-3 h-3" />
                          {task.project}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {task.createdAt}
                        </span>
                        {task.dueDate && task.dueDate !== "Done" && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span
                              className={`flex items-center gap-1 ${
                                task.dueDate.includes("day") &&
                                parseInt(task.dueDate) <= 2
                                  ? "text-red-600 font-medium"
                                  : ""
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              Due in {task.dueDate}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                        {task.title}
                      </h3>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0">
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
              </TaskDetailModal>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm">
                Try adjusting your filters or search query
              </p>
            </div>
          )}

          {/* Pagination Footer */}
          {filteredTasks.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Showing</span>
                <span className="font-medium text-gray-900">
                  {startIndex + 1}-{Math.min(endIndex, filteredTasks.length)}
                </span>
                <span>of</span>
                <span className="font-medium text-gray-900">
                  {filteredTasks.length}
                </span>
                <span>tasks</span>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <span className="text-sm text-gray-600 min-w-[80px] text-center">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
