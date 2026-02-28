"use client";

import { useState } from "react";
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
import { Plus, Calendar, User, Layout, AlertCircle } from "lucide-react";

interface NewTaskModalProps {
  onSubmit?: (task: {
    title: string;
    description: string;
    project: string;
    priority: string;
    assignee: string;
    dueDate: string;
  }) => void;
}

export default function NewTaskModal({ onSubmit }: NewTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      title,
      description,
      project,
      priority,
      assignee,
      dueDate,
    });
    setOpen(false);
    // Reset form
    setTitle("");
    setDescription("");
    setProject("");
    setPriority("Medium");
    setAssignee("");
    setDueDate("");
  };

  const projects = [
    "IssueLane Core",
    "IssueLane Docs",
    "IssueLane Infrastructure",
    "IssueLane Mobile",
  ];

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project backlog
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
              placeholder="What needs to be done?"
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
              placeholder="Add details about this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label htmlFor="project" className="flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-gray-500" />
              Project <span className="text-red-500">*</span>
            </Label>
            <Select value={project} onValueChange={setProject} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((proj) => (
                  <SelectItem key={proj} value={proj}>
                    {proj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority, Assignee & Due Date */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priority" className="flex items-center gap-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="assignee" className="flex items-center gap-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!title.trim() || !project}
            >
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}