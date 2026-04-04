import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-success";
  if (status >= 300 && status < 400) return "text-warning";
  if (status >= 400 && status < 500) return "text-[#f97316]";
  if (status >= 500) return "text-destructive";
  return "text-muted-foreground";
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: "text-success",
    POST: "text-warning",
    PUT: "text-info",
    PATCH: "text-[#f97316]",
    DELETE: "text-destructive",
    HEAD: "text-[#a855f7]",
    OPTIONS: "text-muted-foreground",
  };
  return colors[method] ?? "text-foreground";
}
