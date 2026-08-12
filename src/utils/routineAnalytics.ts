import { RoutineTask, RoutineCompletionRecord } from '../types';

/**
 * Pure utility functions for local date formatting and parsing (YYYY-MM-DD).
 * Avoids UTC timezone shift issues.
 */

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function getTodayLocalDateStr(): string {
  return formatLocalDate(new Date());
}

/**
 * Checks whether a routine is scheduled/due on a given YYYY-MM-DD date.
 * Reuses the exact Sprint 5 recurrence and month-end clamping logic.
 */
export function isRoutineDueOnDate(
  routine: RoutineTask,
  dateStr: string,
  ignoreActiveCheck: boolean = false
): boolean {
  if (!ignoreActiveCheck && !routine.active) {
    return false;
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return false;

  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayOfMonth = dateObj.getDate(); // 1..31

  if (routine.frequency === 'daily') {
    return true;
  }

  if (routine.frequency === 'weekly') {
    const targetDay = routine.weekly_day ?? 1;
    return dayOfWeek === targetDay;
  }

  if (routine.frequency === 'monthly') {
    const targetDay = routine.monthly_day ?? 1;
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const effectiveMonthlyDay = Math.min(targetDay, totalDaysInMonth);
    return dayOfMonth === effectiveMonthlyDay;
  }

  return false;
}

/**
 * Calculates current completion streak for a routine.
 * Counts consecutive completed due dates going backwards from today (or todayStr).
 *
 * Rules:
 * - Future dates > todayStr are ignored.
 * - If today is due and completed -> streak includes today.
 * - If today is due and pending (no record) -> streak is not broken yet, past completed due dates count.
 * - If today is due and skipped -> streak is broken (0).
 * - For past due dates (< todayStr):
 *   - Completed -> streak++
 *   - Skipped or missing -> breaks streak (stop counting).
 * - Non-due dates are skipped without breaking streak.
 */
export function calculateCurrentStreak(
  routine: RoutineTask,
  completions: Record<string, RoutineCompletionRecord>,
  todayStr: string = getTodayLocalDateStr()
): number {
  if (!routine.active) {
    return 0;
  }

  let streak = 0;
  let currDateStr = todayStr;
  const MAX_DAYS_LOOKBACK = 1000;

  for (let i = 0; i < MAX_DAYS_LOOKBACK; i++) {
    const isDue = isRoutineDueOnDate(routine, currDateStr);

    if (isDue) {
      const key = `${routine.id}_${currDateStr}`;
      const record = completions[key];

      if (record?.status === 'completed') {
        streak++;
      } else if (record?.status === 'skipped') {
        // Skipped day breaks the streak
        break;
      } else {
        // No record (pending)
        if (currDateStr === todayStr) {
          // If today is due but pending, it does not break the streak from past days.
          // Continue to previous days without incrementing streak.
        } else {
          // A past due date was missed -> streak is broken
          break;
        }
      }
    }

    currDateStr = addDays(currDateStr, -1);
  }

  return streak;
}

/**
 * Calculates longest completion streak for a routine across history.
 */
export function calculateLongestStreak(
  routine: RoutineTask,
  completions: Record<string, RoutineCompletionRecord>,
  todayStr: string = getTodayLocalDateStr(),
  lookbackDays: number = 365
): number {
  if (!routine.active) {
    return 0;
  }

  let maxStreak = 0;
  let currentRun = 0;

  const startDateStr = addDays(todayStr, -(lookbackDays - 1));
  let currDateStr = startDateStr;

  for (let i = 0; i < lookbackDays; i++) {
    if (currDateStr > todayStr) break;

    const isDue = isRoutineDueOnDate(routine, currDateStr);
    if (isDue) {
      const key = `${routine.id}_${currDateStr}`;
      const record = completions[key];

      if (record?.status === 'completed') {
        currentRun++;
        if (currentRun > maxStreak) {
          maxStreak = currentRun;
        }
      } else if (record?.status === 'skipped') {
        currentRun = 0;
      } else {
        // Pending
        if (currDateStr < todayStr) {
          // Past missed date breaks current run
          currentRun = 0;
        }
      }
    }

    currDateStr = addDays(currDateStr, 1);
  }

  return maxStreak;
}

export interface RoutineWindowStats {
  dueCount: number;
  completedCount: number;
  skippedCount: number;
  missedCount: number;
  completionRate: number; // 0 to 100
}

/**
 * Helper to calculate stats over an arbitrary N-day window ending at todayStr.
 */
export function getWindowStats(
  routine: RoutineTask,
  completions: Record<string, RoutineCompletionRecord>,
  todayStr: string = getTodayLocalDateStr(),
  windowDays: number = 30
): RoutineWindowStats {
  if (!routine.active) {
    return { dueCount: 0, completedCount: 0, skippedCount: 0, missedCount: 0, completionRate: 0 };
  }

  let dueCount = 0;
  let completedCount = 0;
  let skippedCount = 0;
  let missedCount = 0;

  for (let i = windowDays - 1; i >= 0; i--) {
    const dStr = addDays(todayStr, -i);
    if (isRoutineDueOnDate(routine, dStr)) {
      dueCount++;
      const key = `${routine.id}_${dStr}`;
      const record = completions[key];

      if (record?.status === 'completed') {
        completedCount++;
      } else if (record?.status === 'skipped') {
        skippedCount++;
      } else {
        if (dStr < todayStr) {
          missedCount++;
        }
      }
    }
  }

  const completionRate = dueCount > 0 ? Math.round((completedCount / dueCount) * 100) : 0;

  return {
    dueCount,
    completedCount,
    skippedCount,
    missedCount,
    completionRate,
  };
}

/**
 * Calculates 30-day completion rate (0 - 100 percentage integer).
 * Window: [todayStr - 29 days, todayStr] (30 calendar days total).
 */
export function calculate30DayCompletionRate(
  routine: RoutineTask,
  completions: Record<string, RoutineCompletionRecord>,
  todayStr: string = getTodayLocalDateStr()
): number {
  if (!routine.active) {
    return 0;
  }

  const windowStats = getWindowStats(routine, completions, todayStr, 30);
  if (windowStats.dueCount === 0) {
    return 0;
  }

  return windowStats.completionRate;
}

export interface RoutineSummaryStats {
  currentStreak: number;
  longestStreak: number;
  completionRate30Days: number;
  completedCount30Days: number;
  skippedCount30Days: number;
  dueCount30Days: number;
  totalCompletedCount: number;
  totalSkippedCount: number;
}

/**
 * Calculates comprehensive routine analytics stats for a routine.
 */
export function calculateRoutineStats(
  routine: RoutineTask,
  completions: Record<string, RoutineCompletionRecord>,
  todayStr: string = getTodayLocalDateStr()
): RoutineSummaryStats {
  if (!routine.active) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      completionRate30Days: 0,
      completedCount30Days: 0,
      skippedCount30Days: 0,
      dueCount30Days: 0,
      totalCompletedCount: 0,
      totalSkippedCount: 0,
    };
  }

  const currentStreak = calculateCurrentStreak(routine, completions, todayStr);
  const longestStreak = calculateLongestStreak(routine, completions, todayStr);
  const stats30 = getWindowStats(routine, completions, todayStr, 30);

  let totalCompletedCount = 0;
  let totalSkippedCount = 0;

  Object.values(completions).forEach((rec) => {
    if (rec.routineId === routine.id && rec.date <= todayStr) {
      if (rec.status === 'completed') {
        totalCompletedCount++;
      } else if (rec.status === 'skipped') {
        totalSkippedCount++;
      }
    }
  });

  return {
    currentStreak,
    longestStreak,
    completionRate30Days: stats30.completionRate,
    completedCount30Days: stats30.completedCount,
    skippedCount30Days: stats30.skippedCount,
    dueCount30Days: stats30.dueCount,
    totalCompletedCount,
    totalSkippedCount,
  };
}
