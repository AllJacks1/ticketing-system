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
import {
  Ticket,
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
  Paperclip,
  X,
  Download,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { TicketDetailModalProps } from "@/lib/types";
import { formatManilaTime } from "@/lib/utils";

interface Attachment {
  url: string;
  type: string;
}

// Status helpers
const getStatusIcon = (status: string) => {
  const icons: Record<string, React.ReactNode> = {
    Open: <AlertCircle className="w-5 h-5" />,
    "In Progress": <Loader2 className="w-5 h-5 animate-spin" />,
    Waiting: <Clock className="w-5 h-5" />,
    Resolved: <CheckCircle2 className="w-5 h-5" />,
    Closed: <XCircle className="w-5 h-5" />,
  };
  return icons[status] || <AlertCircle className="w-5 h-5" />;
};

const getStatusDescription = (status: string) => {
  const descriptions: Record<string, string> = {
    Open: "Ticket is active and awaiting assignment",
    "In Progress": "Currently being worked on by assignee",
    Waiting: "Pending response from reporter or external party",
    Resolved: "Solution provided, awaiting confirmation",
    Closed: "Ticket completed and archived",
  };
  return descriptions[status] || "Status unknown";
};

// Priority helpers
const getPriorityIcon = (priority: string) => {
  const icons: Record<string, React.ReactNode> = {
    Urgent: <AlertTriangle className="w-5 h-5" />,
    High: <ArrowUp className="w-5 h-5" />,
    Medium: <Minus className="w-5 h-5" />,
    Low: <ArrowDown className="w-5 h-5" />,
  };
  return icons[priority] || <Minus className="w-5 h-5" />;
};

const getPriorityLevel = (priority: string) => {
  const levels: Record<string, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Urgent: 4,
  };
  return levels[priority] || 1;
};

const getPriorityBarColor = (priority: string) => {
  const colors: Record<string, string> = {
    Low: "bg-gray-400",
    Medium: "bg-blue-500",
    High: "bg-orange-500",
    Urgent: "bg-red-600",
  };
  return colors[priority] || "bg-gray-400";
};

const getPriorityDescription = (priority: string) => {
  const descriptions: Record<string, string> = {
    Low: "Minimal impact, can be scheduled",
    Medium: "Moderate impact, standard queue",
    High: "Significant impact, expedited handling",
    Urgent: "Critical impact, immediate attention required",
  };
  return descriptions[priority] || "Priority not set";
};

export default function TicketDetailModal({
  children,
  ticket,
}: Omit<TicketDetailModalProps, "onStatusChange">) {
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

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

  const details = [
    {
      avatar: ticket.assignee?.avatar,
      label: "Assignee",
      value: ticket.assignee?.name || "Unassigned",
    },
    {
      avatar: ticket.reporter?.avatar,
      label: "Reporter",
      value: ticket.reporter?.name || "Unknown",
    },
    {
      icon: Calendar,
      label: "Created",
      value: formatManilaTime(ticket.createdAt),
    },
  ];

  const hasAttachments = ticket.attachments && ticket.attachments.length > 0;
  const hasComments = ticket.comments && ticket.comments.length > 0;

  const isImage = (type: string) => type.startsWith("image/");

  const getFileName = (url: string) => {
    try {
      return new URL(url).pathname.split("/").pop() || "Attachment";
    } catch {
      return "Attachment";
    }
  };

  const getFileIcon = (type: string) => (isImage(type) ? ImageIcon : FileText);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b shrink-0">
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

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Status & Priority */}
            <div className="flex flex-col gap-3">
              {/* Status with icon and description */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <p className="text-sm font-semibold text-gray-900">{ticket.status}</p>
                  <p className="text-xs text-gray-500">{getStatusDescription(ticket.status)}</p>
                </div>
              </div>

              {/* Priority with visual indicator */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getPriorityColor(ticket.priority)}`}>
                  {getPriorityIcon(ticket.priority)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Priority</p>
                      <p className="text-sm font-semibold text-gray-900">{ticket.priority}</p>
                    </div>
                    {/* Priority level indicator */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`w-2 h-6 rounded-full ${
                            level <= getPriorityLevel(ticket.priority)
                              ? getPriorityBarColor(ticket.priority)
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getPriorityDescription(ticket.priority)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                Description
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed break-words">
                {ticket.description || "No description provided."}
              </p>
            </div>

            {/* Due Date */}
            {ticket.dueDate && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  ["Today", "Tomorrow"].includes(ticket.dueDate)
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">
                  Due: {formatManilaTime(ticket.dueDate)}
                </span>
              </div>
            )}

            {/* Attachments */}
            {hasAttachments && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                  Attachments ({ticket.attachments.length})
                </h4>

                <div className="space-y-2">
                  {ticket.attachments.map((file: Attachment, index: number) => {
                    const FileIcon = getFileIcon(file.type);
                    const isImageFile = isImage(file.type);

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group"
                      >
                        <div className="p-2 bg-white rounded-md shadow-sm shrink-0">
                          <FileIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getFileName(file.url)}
                          </p>
                          <p className="text-xs text-gray-500">{file.type}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isImageFile && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPreviewAttachment(file)}
                            >
                              <ExternalLink className="w-4 h-4 text-gray-600" />
                            </Button>
                          )}
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-3">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg"
                >
                  {item.avatar ? (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium mb-2">
                      {item.avatar}
                    </div>
                  ) : item.icon ? (
                    <div className="p-1.5 bg-white rounded-md shadow-sm mb-2">
                      <item.icon className="w-6 h-6 text-gray-400" />
                    </div>
                  ) : null}
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 w-full truncate">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Comments */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                Comments {hasComments && `(${ticket.comments.length})`}
              </h4>

              {hasComments ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ticket.comments.map((comment: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <p className="text-sm text-gray-700 break-words">
                        {comment}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">#{index + 1}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No comments yet.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      {previewAttachment && (
        <Dialog
          open={!!previewAttachment}
          onOpenChange={() => setPreviewAttachment(null)}
        >
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-gray-800">
            <DialogHeader className="p-4 border-b border-gray-800 flex flex-row items-center justify-between">
              <DialogTitle className="text-white text-sm font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span className="truncate max-w-[300px]">
                  {getFileName(previewAttachment.url)}
                </span>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={() => window.open(previewAttachment.url, "_blank")}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={() => setPreviewAttachment(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex items-center justify-center min-h-[400px] max-h-[70vh] p-4">
              <img
                src={previewAttachment.url}
                alt="Attachment preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}