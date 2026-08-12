/**
 * Utility functions for Sunday-Thursday work week calculations and formatting
 */

export interface SunThuDay {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // Sun, Mon, etc.
  dayNum: number;
  monthName: string; // Jan, Feb, etc.
  isToday: boolean;
  isFocused: boolean;
}

export interface WeekRange {
  weekStart: string; // YYYY-MM-DD (Sunday)
  weekEnd: string; // YYYY-MM-DD (Thursday)
}

/**
 * Returns the local date string formatted as YYYY-MM-DD
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the Sunday-Thursday work week dates for a given offset relative to current week or reference date.
 */
export function getSunThuWeekDays(
  weekOffset: number = 0,
  focusedDateStr?: string,
  referenceDate: Date = new Date()
): SunThuDay[] {
  const todayStr = getLocalDateStr(referenceDate);
  const currentDay = referenceDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Determine Sunday for the current offset
  const sunday = new Date(referenceDate);
  sunday.setDate(referenceDate.getDate() - currentDay + weekOffset * 7);

  const days: SunThuDay[] = [];
  // 5 days: Sunday (i=0) to Thursday (i=4)
  for (let i = 0; i < 5; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateStr = getLocalDateStr(d);
    
    days.push({
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: dateStr === todayStr,
      isFocused: dateStr === focusedDateStr,
    });
  }

  return days;
}

/**
 * Returns the Sunday to Thursday date range for a given date string or week offset.
 */
export function getSunThuWeekRange(dateStr?: string, weekOffset: number = 0): WeekRange {
  const ref = dateStr ? new Date(dateStr) : new Date();
  const currentDay = ref.getDay();

  const sunday = new Date(ref);
  sunday.setDate(ref.getDate() - currentDay + weekOffset * 7);

  const thursday = new Date(sunday);
  thursday.setDate(sunday.getDate() + 4);

  return {
    weekStart: getLocalDateStr(sunday),
    weekEnd: getLocalDateStr(thursday),
  };
}

/**
 * Checks if a date string falls within a specific Sunday-Thursday week range.
 */
export function isWithinSunThuWeek(dateStr: string, weekStart: string, weekEnd: string): boolean {
  return dateStr >= weekStart && dateStr <= weekEnd;
}

/**
 * Formats start and end times into a clean time range label (e.g. "08:00 - 09:30" or "08:00")
 */
export function formatTimeRange(startTime?: string, endTime?: string): string | null {
  if (!startTime && !endTime) return null;
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || null;
}

/**
 * Converts a time string (e.g. "10:05 AM", "10:05", "14:30") to minutes from midnight.
 */
export function timeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim().toUpperCase();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm) {
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
  }
  return h * 60 + m;
}

/**
 * Converts minutes from midnight to 12-hour formatted time string (e.g., 627 -> "10:27 AM").
 */
export function minutesToTimeStr(mins: number): string {
  let normalized = Math.round(mins) % 1440;
  if (normalized < 0) normalized += 1440;

  let h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';

  h = h % 12;
  if (h === 0) h = 12;

  const mStr = String(m).padStart(2, '0');
  const hStr = String(h).padStart(2, '0');
  return `${hStr}:${mStr} ${ampm}`;
}

/**
 * Calculates end time given start time string and duration in hours.
 */
export function calculateEndTime(startTimeStr?: string, durationHours?: number): string | undefined {
  if (!startTimeStr || durationHours === undefined || durationHours === null || isNaN(durationHours) || durationHours <= 0) {
    return undefined;
  }
  const startMins = timeToMinutes(startTimeStr);
  if (startMins === null) return undefined;

  const durationMins = Math.round(durationHours * 60);
  const endMins = startMins + durationMins;
  return minutesToTimeStr(endMins);
}

/**
 * Calculates duration in hours given start and end time strings.
 */
export function calculateDurationHours(startTimeStr?: string, endTimeStr?: string): number | undefined {
  if (!startTimeStr || !endTimeStr) return undefined;
  const startMins = timeToMinutes(startTimeStr);
  const endMins = timeToMinutes(endTimeStr);
  if (startMins === null || endMins === null || endMins <= startMins) return undefined;

  const diffMins = endMins - startMins;
  return Math.round((diffMins / 60) * 100) / 100;
}
