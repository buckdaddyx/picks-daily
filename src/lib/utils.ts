import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pretty date string (e.g. "Wed, May 14") */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "May 14, 2026" */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Milliseconds until the next local midnight. */
export function msUntilNextDay(now: Date = new Date()): number {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

/** Format a millisecond delta as "Hh Mm Ss" (with leading-zero seconds). */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0h 0m 0s";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${String(s).padStart(2, "0")}s`;
}
