"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle, User, Paperclip, Calendar, X } from "lucide-react";
import { TaskPayload } from "@/lib/types";
import { toast } from "sonner";
import { createClient } from "@/supabase/client";

interface NewTicketModalProps {
  onSubmit?: (ticket: {
    title: string;
    description: string;
    issueType: string;
    priority: string;
    assignee: string;
    deadline: string;
  }) => void;
}

export default function NewTicketModal({ onSubmit }: NewTicketModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function createTask({
    title,
    description,
    issueType,
    priority,
    assignee,
    deadline,
    attachment,
  }: TaskPayload & { attachment?: File | null }) {
    const supabase = createClient();
    const userId = localStorage.getItem("userProfile")
      ? JSON.parse(localStorage.getItem("userProfile")!).user_id
      : null;

    if (!userId) {
      toast.error("User not found. Cannot create ticket.");
      return false;
    }

    let attachmentId: string | null = null;

    // ─────────────────────────────────────
    // 1️⃣ Optional attachment handling
    // ─────────────────────────────────────
    if (attachment) {
      try {
        const filePath = `tickets/${crypto.randomUUID()}-${attachment.name}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("ticket_attachments")
            .upload(filePath, attachment);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicData } = supabase.storage
          .from("ticket_attachments")
          .getPublicUrl(uploadData.path);

        // Insert into files table
        const { data: fileData, error: fileError } = await supabase
          .from("files")
          .insert({
            url: publicData.publicUrl,
            type: attachment.type,
          })
          .select("file_id")
          .single();

        if (fileError) throw fileError;
        console.log("File uploaded and recorded with ID:", fileData.file_id);

        attachmentId = fileData.file_id;
      } catch (err) {
        console.error("Attachment upload failed:", err);
        toast.error(`Failed to upload file ${attachment.name}`);
      }
    }

    // ─────────────────────────────────────
    // 2️⃣ Create ticket
    // ─────────────────────────────────────
    try {
      const toastId = toast.loading("Creating ticket...");

      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          title,
          description,
          issue_type: issueType,
          priority,
          assigned_to: 1,
          deadline,
          assigned_by: userId,
          file_id: attachmentId,
        })
        .select("ticket_id")
        .single();

      if (ticketError) {
        toast.error(`Failed to create ticket: ${ticketError.message}`, {
          id: toastId,
        });
        return false;
      }

      toast.success("Ticket created successfully!", { id: toastId });
      return ticketData;
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while creating ticket");
      return false;
    }
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const ticketData = {
      title,
      description,
      issueType,
      priority,
      assignee,
      deadline,
      attachment: file,
    };

    const result = await createTask(ticketData);

    if (result) {
      setOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setIssueType("");
      setPriority("Medium");
      setAssignee("");
      setDeadline("");
      setFile(null);

      // Optional: notify parent
      onSubmit?.(ticketData);
    }
  };

  const assignees = [
    { name: "Sarah Chen", avatar: "SC" },
    { name: "John Doe", avatar: "JD" },
    { name: "Mike Ross", avatar: "MR" },
    { name: "Emma Wilson", avatar: "EW" },
    { name: "Alex Kim", avatar: "AK" },
    { name: "James Lee", avatar: "JL" },
  ];

  const priorities = [
    { value: "Low", label: "Low", color: "text-gray-600" },
    { value: "Medium", label: "Medium", color: "text-blue-600" },
    { value: "High", label: "High", color: "text-orange-600" },
    { value: "Urgent", label: "Urgent", color: "text-red-600" },
  ];

  const issueTypes = [
    { value: "Network", label: "Network" },
    { value: "Software", label: "Software" },
    { value: "Hardware", label: "Hardware" },
    { value: "Access", label: "Access" },
    { value: "Email", label: "Email" },
    { value: "Other", label: "Other" },
  ];

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setFile(selectedFiles[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Create a support ticket for your team
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the problem..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Issue Type */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
                Issue Type
              </Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500" />
                Assignee
              </Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((person) => (
                    <SelectItem key={person.avatar} value={person.name}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                          {person.avatar}
                        </div>
                        {person.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                Deadline
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-gray-500" />
              Attachment
            </Label>

            {!file ? (
              <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer"
              >
                <p className="text-sm text-gray-600">
                  Drop file here or click to upload
                </p>
                <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            <input
              type="file"
              ref={inputRef}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!title.trim()}
            >
              Create Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}