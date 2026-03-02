"use client";

import { useState, useEffect } from "react";
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
  Check,
  ArrowRight,
} from "lucide-react";
import { TicketDetailModalProps } from "@/lib/types";
import { createClient } from "@/supabase/client";
import { formatManilaTime } from "@/lib/utils";
import { toast } from "sonner";

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
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null,
  );

  // Track pending status change
  const [pendingStatus, setPendingStatus] = useState(ticket.status);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-promotion from Waiting to Open
  const [showAutoPromote, setShowAutoPromote] = useState(false);

  // Reset and check for auto-promotion when dialog opens
  useEffect(() => {
    setPendingStatus(ticket.status);
    setHasChanges(false);
    setShowAutoPromote(false);

    // If ticket is Waiting, prompt for auto-promotion to Open
    if (ticket.status === "Waiting") {
      setShowAutoPromote(true);
      setPendingStatus("Open");
      setHasChanges(true);
    }
  }, [ticket.status, ticket.id]);

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

  const statuses = ["Waiting", "Open", "Resolved", "Closed"];

  const details = [
    {
      avatar: ticket.assignee?.avatar,
      label: "Assignee",
      value: (
        <span className="text-sm font-medium text-gray-900">
          {ticket.assignee?.name}
        </span>
      ),
    },
    {
      avatar: ticket.reporter?.avatar,
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
      value: formatManilaTime(ticket.createdAt),
    },
  ];

  const hasAttachments = ticket.attachments && ticket.attachments.length > 0;
  const hasComments = ticket.comments && ticket.comments.length > 0;

  const isImage = (type: string) => {
    return type.startsWith("image/");
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || "Attachment";
    } catch {
      return "Attachment";
    }
  };

  const getFileIcon = (type: string) => {
    if (isImage(type)) return ImageIcon;
    return FileText;
  };

  const handleStatusChange = (value: string) => {
    setPendingStatus(value);
    setHasChanges(value !== ticket.status);
    setShowAutoPromote(false);
  };

  const handleApplyChanges = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    const toastId = toast.loading("Updating ticket status...");

    try {
      const supabase = createClient();

      if (!ticket.id) {
        throw new Error("Invalid ticket ID");
      }

      const { error } = await supabase
        .from("tickets")
        .update({
          status: pendingStatus,
          updated_at: new Date().toLocaleString("en-PH", {
            timeZone: "Asia/Manila",
          }),
        })
        .eq("ticket_id", ticket.id);

      if (error) {
        throw error;
      }

      onStatusChange?.(ticket.id, pendingStatus);

      toast.success("Status updated successfully", { id: toastId });
      setHasChanges(false);
      setShowAutoPromote(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update status", { id: toastId });
      setPendingStatus(ticket.status);
      setShowAutoPromote(ticket.status === "Waiting");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostComment = async () => {
    if (!comment.trim()) return;

    setIsSaving(true);
    const toastId = toast.loading("Posting comment...");

    try {
      const supabase = createClient();

      if (!ticket.id) {
        throw new Error("Invalid ticket ID");
      }

      const updatedComments = ticket.comments
        ? [...ticket.comments, comment.trim()]
        : [comment.trim()];

      const { error } = await supabase
        .from("tickets")
        .update({
          remarks: updatedComments,
          updated: new Date().toLocaleString("en-PH", {
            timeZone: "Asia/Manila",
          }),
        })
        .eq("ticket_id", ticket.id);

      if (error) {
        throw error;
      }

      ticket.comments = updatedComments;
      setComment("");

      toast.success("Comment posted", { id: toastId });
    } catch (error: any) {
      console.error("Comment error:", error);
      toast.error(error.message || "Failed to post comment", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setPendingStatus(ticket.status);
    setHasChanges(false);
    setShowAutoPromote(false);
  };

  const handleConfirmAutoPromote = () => {
    handleApplyChanges();
  };

  const handleRejectAutoPromote = () => {
    setPendingStatus("Waiting");
    setHasChanges(false);
    setShowAutoPromote(false);
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
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Select
                  value={pendingStatus}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses
                      .filter((s) => {
                        const currentIndex = statuses.indexOf(ticket.status);
                        const optionIndex = statuses.indexOf(s);
                        return optionIndex >= currentIndex;
                      })
                      .map((s) => (
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

              {/* Auto-promote Banner */}
              {showAutoPromote && (
                <div className="flex flex-col gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span>
                      This ticket is <strong>Waiting</strong>. Start working on
                      it?
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-blue-700">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                        Waiting
                      </span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="px-2 py-1 bg-blue-100 rounded text-blue-700 font-medium">
                        Open
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRejectAutoPromote}
                        className="h-7 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                      >
                        Keep Waiting
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConfirmAutoPromote}
                        disabled={isSaving}
                        className="h-7 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSaving ? (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Starting...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Start Ticket
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Apply Changes Banner */}
              {hasChanges && !showAutoPromote && (
                <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-sm text-indigo-900">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span>
                      Change status to <strong>{pendingStatus}</strong>?
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDiscardChanges}
                      className="h-7 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyChanges}
                      disabled={isSaving}
                      className="h-7 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Apply
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
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
                <span className="text-sm font-medium">
                  Due: {formatManilaTime(ticket.dueDate)}
                </span>
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
                        onClick={() =>
                          isImageFile && setPreviewAttachment(file)
                        }
                        className={`flex items-center gap-3 p-3 w-full bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group text-left ${
                          isImageFile ? "cursor-pointer" : "cursor-default"
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
                            {isImageFile ? "Click to preview" : file.type}
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
                  <div>
                    {item.avatar ? (
                      <div className="shrink-0 p-1.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {item.avatar}
                        </div>
                      </div>
                    ) : item.icon ? (
                      <div className="p-1.5 bg-white rounded-md shadow-sm mb-2">
                        <item.icon className="w-6 h-6 text-gray-400" />
                      </div>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <div className="text-sm font-medium text-gray-900 w-full truncate">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Comments Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                Comments {hasComments && `(${ticket.comments.length})`}
              </h4>

              {/* Comments List */}
              {hasComments && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ticket.comments.map((commentText: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <p className="text-sm text-gray-700 break-words">
                        {commentText}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">#{index + 1}</p>
                    </div>
                  ))}
                </div>
              )}

              {!hasComments && (
                <p className="text-sm text-gray-400 italic">
                  No comments yet. Add one below.
                </p>
              )}

              {/* Add Comment */}
              <div className="space-y-2 pt-2 border-t">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handlePostComment}
                    disabled={!comment.trim() || isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting...
                      </span>
                    ) : (
                      "Post Comment"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
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
