"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Plus,
  Calendar,
  User,
  Layout,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { NewTaskModalProps, Project } from "@/lib/types";
import { Assignee } from "@/lib/types";
import { createClient } from "@/supabase/client";
import { toast } from "sonner";

export default function NewTaskModal({ onSubmit }: NewTaskModalProps) {
  const [fetchingAssignees, setFetchingAssignees] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const cachedAssigneesRef = useRef<Assignee[]>([]);
  const cachedProjectsRef = useRef<Project[]>([]);
  const [creating, setCreating] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      // Assignees
      if (cachedAssigneesRef.current.length > 0) {
        setAssignees(cachedAssigneesRef.current);
      } else {
        await fetchAssignees();
      }

      // Projects
      if (cachedProjectsRef.current.length > 0) {
        setProjects(cachedProjectsRef.current);
      } else {
        await fetchProjects();
      }
    };

    loadData();
  }, [open]);

  async function fetchAssignees() {
    const supabase = createClient();

    try {
      setFetchingAssignees(true);
      const { data, error } = await supabase
        .from("user_assignments")
        .select(
          `
          role_id,
          users:user_id (
            user_id,
            first_name,
            last_name
          )
        `,
        )
        .in("role_id", [1, 2]);

      if (error) {
        toast.error(`Failed to fetch assignees: ${error.message}`);
        return;
      }

      // Transform data to flat array with avatar initials
      const transformedAssignees =
        data?.map((item: any) => ({
          user_id: item.users.user_id,
          first_name: item.users.first_name,
          last_name: item.users.last_name,
          avatar:
            `${item.users.first_name[0]}${item.users.last_name[0]}`.toUpperCase(),
        })) || [];

      // Cache in ref and state
      cachedAssigneesRef.current = transformedAssignees;
      setAssignees(transformedAssignees);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while fetching assignees");
    } finally {
      setFetchingAssignees(false);
    }
  }

  async function fetchProjects() {
    const supabase = createClient();

    try {
      setFetchingProjects(true);
      const { data, error } = await supabase
        .from("projects")
        .select("project_id, name");

      if (error) {
        toast.error(`Failed to fetch projects: ${error.message}`);
        return;
      }

      const projectList =
        data?.map((item: any) => ({
          project_id: item.project_id,
          name: item.name,
        })) || [];

      cachedProjectsRef.current = projectList;
      setProjects(projectList);
      setProjects(projectList);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while fetching projects");
    } finally {
      setFetchingProjects(false);
    }
  }

  async function createTask() {
    const supabase = createClient();

    const storedUser = localStorage.getItem("userProfile");
    const userId = storedUser ? JSON.parse(storedUser).user_id : null;

    if (!userId) {
      toast.error("User not found. Cannot create task.");
      return null;
    }

    try {
      setCreating(true);

      // 1️⃣ Create main task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          author: userId,
          due_date: dueDate || null,
          status: "To Do",
          updated: new Date().toLocaleString("en-PH", {
            timeZone: "Asia/Manila",
          }),
        })
        .select()
        .single();

      if (taskError || !task) {
        toast.error(taskError?.message || "Failed to create task");
        return null;
      }

      const taskId = task.task_id;

      // 2️⃣ Create related records in parallel
      const relations = [
        supabase.from("task_projects").insert({
          task_id: taskId,
          project_id: project,
        }),

        supabase.from("task_assignees").insert({
          task_id: taskId,
          user_id: assignee || null,
        }),

        supabase.from("task_companies").insert({
          task_id: taskId,
          company_id: 1,
        }),

        supabase.from("task_branches").insert({
          task_id: taskId,
          branch_id: 1,
        }),

        supabase.from("task_departments").insert({
          task_id: taskId,
          department_id: 1,
        }),
      ];

      const results = await Promise.all(relations);

      const relationError = results.find((r) => r.error);

      if (relationError?.error) {
        toast.error("Task created but relations failed.");
        console.error(relationError.error);
        return task;
      }

      toast.success("Task created successfully 🎉");

      return task;
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while creating task");
      return null;
    } finally {
      setCreating(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !project) return;

    const newTask = await createTask();

    if (!newTask) return;

    onSubmit?.(newTask); // optional callback to update UI

    setOpen(false);

    // Reset form
    setTitle("");
    setDescription("");
    setProject("");
    setPriority("Medium");
    setAssignee("");
    setDueDate("");
  };

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
                {fetchingProjects && projects.length === 0 ? (
                  <span className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <SelectValue placeholder="Select project">
                    {(() => {
                      const selected = projects.find(
                        (p) => String(p.project_id) === project,
                      );
                      return selected ? selected.name : null;
                    })()}
                  </SelectValue>
                )}
              </SelectTrigger>
              <SelectContent>
                {projects.map((proj) => (
                  <SelectItem key={proj.project_id} value={proj.project_id}>
                    {proj.name}
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
              <Label className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500" />
                Assignee
              </Label>
              <Select
                value={assignee}
                onValueChange={setAssignee}
                disabled={fetchingAssignees && assignees.length === 0}
              >
                <SelectTrigger className="w-full">
                  {fetchingAssignees && assignees.length === 0 ? (
                    <span className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    <SelectValue placeholder="Select assignee">
                      {(() => {
                        const selected = assignees.find(
                          (p) => String(p.user_id) === assignee,
                        );
                        return selected
                          ? `${selected.first_name} ${selected.last_name}`
                          : null;
                      })()}
                    </SelectValue>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((person) => (
                    <SelectItem key={person.user_id} value={person.user_id}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                          {person.avatar}
                        </div>
                        {`${person.first_name} ${person.last_name}`}
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
