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
import { Plus, AlertCircle, User, Paperclip, Calendar } from "lucide-react";

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
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSubmit?.({
      title,
      description,
      issueType,
      priority,
      assignee,
      deadline,
    });
    setOpen(false);
    // Reset form
    setTitle("");
    setDescription("");
    setIssueType("");
    setPriority("Medium");
    setAssignee("");
    setDeadline("");
    setFiles([]);
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

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const fileArray = Array.from(selectedFiles);
    setFiles((prev) => [...prev, ...fileArray]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    inputRef.current?.click();
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

          {/* Attachments */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-gray-500" />
              Attachments
            </Label>

            <div
              onClick={handleClick}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer"
            >
              <p className="text-sm text-gray-600">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
            </div>

            <input
              type="file"
              multiple
              ref={inputRef}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {files.length > 0 && (
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                {files.map((file, index) => (
                  <li key={index}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            )}
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
