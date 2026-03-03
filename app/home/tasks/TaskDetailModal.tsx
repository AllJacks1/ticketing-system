"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout, Calendar, AlertCircle, Check } from "lucide-react";
import { TaskDetailModalProps } from "@/lib/types";
import { createClient } from "@/supabase/client";
import { formatManilaTime } from "@/lib/utils";
import { toast } from "sonner";

export default function TaskDetailModal({
  children,
  task,
  onStatusChange,
}: TaskDetailModalProps) {
  const [pendingStatus, setPendingStatus] = useState(task.status);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      "To Do": "bg-gray-100 text-gray-700",
      "In Progress": "bg-amber-50 text-amber-700",
      Completed: "bg-green-50 text-green-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const statuses = ["To Do", "In Progress", "Completed"];

  const handleStatusChange = (value: string) => {
    setPendingStatus(value);
    setHasChanges(value !== task.status);
  };

  const handleDiscardChanges = () => {
    setPendingStatus(task.status);
    setHasChanges(false);
  };

  const handleApplyChanges = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    const toastId = toast.loading("Updating ticket status...");

    try {
      const supabase = createClient();

      if (!task.task_id) {
        throw new Error("Invalid ticket ID");
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          status: pendingStatus,
          updated: new Date().toLocaleString("en-PH", {
            timeZone: "Asia/Manila",
          }),
        })
        .eq("task_id", task.task_id);

      if (error) {
        throw error;
      }

      onStatusChange?.(task.task_id, pendingStatus);

      toast.success("Status updated successfully", { id: toastId });
      setHasChanges(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update status", { id: toastId });
      setPendingStatus(task.status);
    } finally {
      setIsSaving(false);
    }
  };

  const details = [
    {
      avatar: task.assignee?.avatar,
      label: "Assignee",
      value: (
        <span className="text-sm font-medium text-gray-900">
          {task.assignee?.first_name || "" + task.assignee?.last_name || ""}
        </span>
      ),
    },
    {
      avatar: task.author?.avatar,
      label: "Reporter",
      value: (
        <span className="text-sm font-medium text-gray-900">
          {task.author?.first_name || "" + task.author?.last_name || ""}
        </span>
      ),
    },
    {
      icon: Calendar,
      label: "Created",
      value: formatManilaTime(task.created_at),
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="font-medium text-gray-900">{task.task_id}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layout className="w-3.5 h-3.5" />
              {task.projectName}
            </span>
          </div>
          <DialogTitle className="text-lg font-semibold leading-tight">
            {task.title}
          </DialogTitle>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Priority */}
          <div className="flex items-center gap-2">
            <Select value={pendingStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses
                  .filter((s) => {
                    const currentIndex = statuses.indexOf(task.status);
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
              className={`w-24 justify-center shrink-0 ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </Badge>
          </div>

          {hasChanges && (
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

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
              Description
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {task.description || "No description provided."}
            </p>
          </div>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
