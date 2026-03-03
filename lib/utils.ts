import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
