"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import NewTicketModal from "./NewTicketModal";
import TicketDetailModal from "./TicketDetailModal";
import { Ticket } from "@/lib/types";
import { createClient } from "@/supabase/client";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch tickets from Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

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
        files(type, url),
        assigned_by_user:users!tickets_assigned_by_fkey(first_name, last_name),
        assigned_to_user:users!tickets_assigned_to_fkey(first_name, last_name)
      `,
        )
        .order("created_at", { ascending: false });

      console.log("Supabase response data:", data);

      if (error) throw error;

      const tickets: Ticket[] = data.map((ticket: any) => ({
        id: ticket.ticket_id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        dueDate: ticket.deadline || undefined,
        tags: [],
        comments: 0,

        // ✅ Correct mapping of attachments
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
              name:
                ticket.assigned_to_user.first_name +
                " " +
                ticket.assigned_to_user.last_name,
              avatar: getInitials(
                ticket.assigned_to_user.first_name +
                  " " +
                  ticket.assigned_to_user.last_name,
              ),
            }
          : null,

        reporter: ticket.assigned_by_user
          ? {
              name:
                ticket.assigned_by_user.first_name +
                " " +
                ticket.assigned_by_user.last_name,
              avatar: getInitials(
                ticket.assigned_by_user.first_name +
                  " " +
                  ticket.assigned_by_user.last_name,
              ),
            }
          : null,
      }));
      setTickets(tickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format dates
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Tomorrow";
    if (diffInDays > 1 && diffInDays < 7) return `${diffInDays} days`;
    return date.toLocaleDateString();
  };

  // Load tickets on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Open: "bg-blue-50 text-blue-700 border-blue-200",
      "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
      Waiting: "bg-gray-50 text-gray-700 border-gray-200",
      Resolved: "bg-green-50 text-green-700 border-green-200",
      Closed: "bg-gray-50 text-gray-500 border-gray-200",
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const stats = [
    { label: "Total Tickets", value: tickets.length, icon: AlertCircle },
    {
      label: "Open",
      value: tickets.filter((t) => t.status === "Open").length,
      icon: Clock,
    },
    {
      label: "In Progress",
      value: tickets.filter((t) => t.status === "In Progress").length,
      icon: ArrowUpDown,
    },
    {
      label: "Resolved",
      value: tickets.filter(
        (t) => t.status === "Resolved" || t.status === "Closed",
      ).length,
      icon: CheckCircle2,
    },
  ];

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: newStatus as Ticket["status"],
            }
          : ticket,
      ),
    );
  };

  // Refresh tickets after creating new one
  const handleTicketCreated = () => {
    fetchTasks();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all support tickets
          </p>
        </div>
        <NewTicketModal onSubmit={handleTicketCreated} />
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
                placeholder="Search tickets..."
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
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Waiting">Waiting</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold">
            All Tickets ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
              <p className="text-sm">Loading tickets...</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {paginatedTickets.map((ticket) => (
                  <TicketDetailModal
                    key={ticket.id}
                    ticket={ticket}
                    onStatusChange={handleStatusChange}
                  >
                    <div className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {ticket.assignee?.avatar}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Meta row */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <span className="font-medium text-gray-900">
                              {ticket.id}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {ticket.createdAt}
                            </span>
                            {ticket.dueDate && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span
                                  className={`flex items-center gap-1 ${
                                    ticket.dueDate === "Today" ||
                                    ticket.dueDate === "Tomorrow"
                                      ? "text-red-600 font-medium"
                                      : ""
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  Due {ticket.dueDate}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-0.5">
                            {ticket.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Badges */}
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
                  </TicketDetailModal>
                ))}
              </div>

              {filteredTickets.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No tickets found</p>
                  <p className="text-sm">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}

              {/* Pagination Footer */}
              {filteredTickets.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Showing</span>
                    <span className="font-medium text-gray-900">
                      {startIndex + 1}-
                      {Math.min(endIndex, filteredTickets.length)}
                    </span>
                    <span>of</span>
                    <span className="font-medium text-gray-900">
                      {filteredTickets.length}
                    </span>
                    <span>tickets</span>
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
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
