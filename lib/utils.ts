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
