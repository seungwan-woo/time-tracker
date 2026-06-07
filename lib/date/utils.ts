import { TZDate } from "@date-fns/tz";
import { format, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";

const TIMEZONE = "Asia/Seoul";

/**
 * Get the current time in Asia/Seoul timezone
 */
export function nowKST(): Date {
  return new TZDate(new Date(), TIMEZONE);
}

/**
 * Convert a date to Asia/Seoul timezone
 */
export function toKST(date: Date | string): Date {
  return new TZDate(typeof date === "string" ? new Date(date) : date, TIMEZONE);
}

/**
 * Format a date in Asia/Seoul timezone
 */
export function formatKST(date: Date | string, formatStr: string): string {
  const kstDate = toKST(date);
  return format(kstDate, formatStr, { locale: ko });
}

/**
 * Get the report_date (YYYY-MM-DD) from a start_at timestamp.
 * Uses Asia/Seoul timezone.
 */
export function getReportDate(startAt: Date | string): string {
  const kstDate = toKST(startAt);
  return format(kstDate, "yyyy-MM-dd");
}

/**
 * Calculate duration in minutes between two timestamps
 */
export function calculateDurationMinutes(
  startAt: Date | string,
  endAt: Date | string
): number {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  const end = typeof endAt === "string" ? new Date(endAt) : endAt;
  return differenceInMinutes(end, start);
}

/**
 * Format minutes to a human-readable duration string
 * e.g. 150 → "2시간 30분"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) return "0분";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

/**
 * Format minutes to a compact duration string
 * e.g. 150 → "2h 30m"
 */
export function formatDurationCompact(minutes: number): string {
  if (minutes < 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format a time range for display
 */
export function formatTimeRange(startAt: string, endAt: string | null): string {
  const startStr = formatKST(startAt, "HH:mm");
  if (!endAt) return `${startStr} ~ 진행 중`;
  const endStr = formatKST(endAt, "HH:mm");
  // Check if dates are different
  const startDate = formatKST(startAt, "MM/dd");
  const endDate = formatKST(endAt, "MM/dd");
  if (startDate !== endDate) {
    return `${startStr} ~ 다음날 ${endStr}`;
  }
  return `${startStr} ~ ${endStr}`;
}

/**
 * Calculate achievement percentage (capped at 100)
 */
export function calculateAchievement(
  totalMinutes: number,
  targetMinutes: number
): number {
  if (targetMinutes <= 0) return 0;
  return Math.min(Math.round((totalMinutes / targetMinutes) * 100), 100);
}

/**
 * Get today's date string in YYYY-MM-DD format (Asia/Seoul)
 */
export function getTodayDateString(): string {
  return format(nowKST(), "yyyy-MM-dd");
}

/**
 * Format date for display: "6월 7일 (토)"
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return format(date, "M월 d일 (EEE)", { locale: ko });
}

/**
 * Format for datetime-local input
 */
export function toDatetimeLocalString(date: Date | string): string {
  const kstDate = toKST(date);
  return format(kstDate, "yyyy-MM-dd'T'HH:mm");
}

// Re-export date-fns functions for convenience
export {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  format,
};
