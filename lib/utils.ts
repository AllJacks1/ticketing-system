import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { StatColor } from "./types";
import { LayoutDashboard, TicketPlus, CheckSquare, Archive } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (first_name: string, last_name: string) => {
  const firstInitial = first_name ? first_name[0].toUpperCase() : ""; 
  const lastInitial = last_name ? last_name[0].toUpperCase() : ""; 
  return `${firstInitial}${lastInitial}`;
};

export const formatManilaTime = (utcString: string) => {
  if (!utcString) return "";

  const date = new Date(utcString);

  return date.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper to format relative due date
export const formatDueDate = (dateString: string): string => {
  if (!dateString) return "No due date";
  
  const due = new Date(dateString);
  const now = new Date();
  
  // Convert to Manila time if needed, or use UTC
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "1 day";
  return `${diffDays} days`;
};

// Helper to check if urgent (2 days or less)
export const isUrgent = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const due = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return diffDays <= 2 && diffDays >= 0;
};

export const normalizeToArray = <T,>(value: T | T[] | null | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export const normalizeFiles = (files: any): { type: string; url: string }[] => {
  if (!files) return [];
  return normalizeToArray(files).map((f) => ({ type: f.type, url: f.url }));
};

export const formatUser = (user: any) => {
  if (!user?.first_name || !user?.last_name) return null;
  return {
    name: `${user.first_name} ${user.last_name}`,
    avatar: getInitials(user.first_name, user.last_name),
  };
};

export const TICKET_STATUS_CONFIG: Record<
  string,
  { label: string; color: StatColor; icon: React.ComponentType<{ className?: string }> }
> = {
  Open: { label: "Open Tickets", color: "blue", icon: TicketPlus },
  "In Progress": { label: "Tickets In Progress", color: "amber", icon: LayoutDashboard },
  Resolved: { label: "Tickets Resolved", color: "green", icon: CheckSquare },
  Closed: { label: "Closed Tickets", color: "purple", icon: Archive },
};

export const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Waiting: "bg-gray-50 text-gray-700 border-gray-200",
  Resolved: "bg-green-50 text-green-700 border-green-200",
  Closed: "bg-gray-50 text-gray-500 border-gray-200",
  "To Do": "bg-gray-100 text-gray-700 border-gray-200",
  "In Review": "bg-purple-100 text-purple-700 border-purple-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  default: "bg-gray-100 text-gray-700",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
  default: "bg-gray-100 text-gray-600",
};

export const STAT_ICON_COLORS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  default: "bg-gray-50 text-gray-600",
};