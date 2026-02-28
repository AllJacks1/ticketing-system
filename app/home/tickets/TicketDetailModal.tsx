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
  Paperclip,
  X,
  Download,
  ExternalLink,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { TicketDetailModalProps } from "@/lib/types";

interface Attachment {
  url: string;
  type: string;
}

export default function TicketDetailModal({
  children,
  ticket,
  onStatusChange,
}: TicketDetailModalProps) {
  const [comment, setComment] = useState("");
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

  const statuses = ["Open", "In Progress", "Waiting", "Resolved", "Closed"];

  const details = [
    {
      icon: User,
      label: "Assignee",
      value: (
        <span className="text-sm font-medium text-gray-900">
          {ticket.assignee?.name}
        </span>
      ),
    },
    {
      icon: User,
      label: "Reporter",
      value: (
        <span className="text-sm font-medium text-gray-900">
          {ticket.reporter?.name}
        </span>
      ),
    },
    {
      icon: Calendar,
      label: "Created",
      value: ticket.createdAt,
    },
  ];

  const hasAttachments = ticket.attachments && ticket.attachments.length > 0;

  const isImage = (type: string) => {
    return type.startsWith('image/');
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'Attachment';
    } catch {
      return 'Attachment';
    }
  };

  const getFileIcon = (type: string) => {
    if (isImage(type)) return ImageIcon;
    return FileText;
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh]">
          {/* Header - Fixed */}
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
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(s)}`}
                      >
                        {s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge
                variant="outline"
                className={`w-24 justify-center shrink-0 ${getPriorityColor(ticket.priority)}`}
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
              <p className="text-sm text-gray-600 leading-relaxed break-words">
                {ticket.description || "No description provided."}
              </p>
            </div>

            {/* Due Date Banner */}
            {ticket.dueDate && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  ticket.dueDate === "Today" || ticket.dueDate === "Tomorrow"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Due {ticket.dueDate}</span>
              </div>
            )}

            {/* Attachment Section */}
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
                      <button
                        key={index}
                        onClick={() => isImageFile && setPreviewAttachment(file)}
                        className={`flex items-center gap-3 p-3 w-full bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group text-left ${
                          isImageFile ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <div className="p-2 bg-white rounded-md shadow-sm group-hover:shadow transition-shadow shrink-0">
                          <FileIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getFileName(file.url)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isImageFile ? 'Click to preview' : file.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isImageFile && (
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          )}
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </a>
                        </div>
                      </button>
                    );
                  })}
                </div>
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

      {/* Image Preview Dialog */}
      {previewAttachment && (
        <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
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
                  onClick={() => window.open(previewAttachment.url, '_blank')}
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