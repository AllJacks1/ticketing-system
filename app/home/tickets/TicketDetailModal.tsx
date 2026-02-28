"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Ticket,
  Calendar,
  User,
  Clock,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "Open" | "In Progress" | "Waiting" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee: {
    name: string;
    avatar: string;
  };
  reporter: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  dueDate?: string;
}

interface TicketDetailModalProps {
  children: React.ReactNode;
  ticket: Ticket;
  onStatusChange?: (ticketId: string, newStatus: string) => void;
}

export default function TicketDetailModal({
  children,
  ticket,
  onStatusChange,
}: TicketDetailModalProps) {
  const [comment, setComment] = useState("");

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: "bg-gray-100 text-gray-600",
      Medium: "bg-blue-100 text-blue-700",
      High: "bg-orange-100 text-orange-700",
      Urgent: "bg-red-100 text-red-700",
    };
    return colors[priority] || "bg-gray-100 text-gray-600";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Open: "bg-blue-50 text-blue-700",
      "In Progress": "bg-amber-50 text-amber-700",
      Waiting: "bg-gray-50 text-gray-700",
      Resolved: "bg-green-50 text-green-700",
      Closed: "bg-gray-50 text-gray-500",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const statuses = ["Open", "In Progress", "Waiting", "Resolved", "Closed"];

  const details = [
    {
      icon: User,
      label: "Assignee",
      value: (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {ticket.assignee.avatar}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {ticket.assignee.name}
          </span>
        </div>
      ),
    },
    {
      icon: User,
      label: "Reporter",
      value: (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {ticket.reporter.avatar}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {ticket.reporter.name}
          </span>
        </div>
      ),
    },
    {
      icon: Calendar,
      label: "Created",
      value: ticket.createdAt,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="font-medium text-gray-900">{ticket.id}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5" />
              Support Ticket
            </span>
          </div>
          <DialogTitle className="text-lg font-semibold leading-tight">
            {ticket.title}
          </DialogTitle>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Priority */}
          <div className="flex items-center gap-2">
            <Select
              value={ticket.status}
              onValueChange={(value) => onStatusChange?.(ticket.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(s)}`}>
                      {s}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge
              variant="outline"
              className={`w-24 justify-center ${getPriorityColor(ticket.priority)}`}
            >
              {ticket.priority}
            </Badge>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
              Description
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {ticket.description || "No description provided."}
            </p>
          </div>

          {/* Due Date Banner */}
          {ticket.dueDate && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              ticket.dueDate === "Today" || ticket.dueDate === "Tomorrow"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Due {ticket.dueDate}
              </span>
            </div>
          )}

          {/* Details Grid - 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            {details.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="p-1.5 bg-white rounded-md shadow-sm mb-2">
                  <item.icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <div className="text-sm font-medium text-gray-900 w-full truncate">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              Activity
            </h4>
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!comment.trim()}
              >
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}