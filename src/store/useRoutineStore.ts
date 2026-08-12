import { create } from 'zustand';
import { RoutineTask, RoutineCompletionRecord, RecurrenceFrequency } from '../types';

const ROUTINES_STORAGE_KEY = 'workpilot_routines';
const COMPLETIONS_STORAGE_KEY = 'workpilot_routine_completions';

export const DEFAULT_ROUTINES: RoutineTask[] = [
  {
    id: 'routine-1',
    title: 'Daily Server & Backup Check',
    category: 'Infrastructure',
    location: 'Server Room',
    default_duration: 0.5,
    description: 'Verify nightly backups, check RAID status, monitor server temperatures.',
    frequency: 'daily',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'routine-2',
    title: 'Morning Helpdesk Triage & Queue Review',
    category: 'Helpdesk',
    location: 'HQ - Floor 2',
    default_duration: 0.5,
    description: 'Review overnight tickets, assign priorities, check queue SLAs.',
    frequency: 'daily',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'routine-3',
    title: 'Weekly Network Equipment Inspection & Log Review',
    category: 'Network',
    location: 'IDF / MDF Racks',
    default_duration: 1.0,
    description: 'Inspect switch indicators, check UPS battery levels, audit firewall alerts.',
    frequency: 'weekly',
    weekly_day: 1, // Monday
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'routine-4',
    title: 'Monthly Security Patching & Vulnerability Audit',
    category: 'Security',
    location: 'Remote / HQ',
    default_duration: 2.0,
    description: 'Deploy OS security patches, audit endpoint compliance, review access logs.',
    frequency: 'monthly',
    monthly_day: 1, // 1st of month
    active: true,
    created_at: new Date().toISOString(),
  },
];

function getStoredRoutines(): RoutineTask[] {
  try {
    const raw = localStorage.getItem(ROUTINES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(DEFAULT_ROUTINES));
      return DEFAULT_ROUTINES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load routines from storage', e);
    return DEFAULT_ROUTINES;
  }
}

function saveStoredRoutines(routines: RoutineTask[]): void {
  try {
    localStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
  } catch (e) {
    console.error('Failed to save routines to storage', e);
  }
}

function getStoredCompletions(): Record<string, RoutineCompletionRecord> {
  try {
    const raw = localStorage.getItem(COMPLETIONS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load completions from storage', e);
    return {};
  }
}

function saveStoredCompletions(completions: Record<string, RoutineCompletionRecord>): void {
  try {
    localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(completions));
  } catch (e) {
    console.error('Failed to save completions to storage', e);
  }
}

interface RoutineState {
  routines: RoutineTask[];
  completions: Record<string, RoutineCompletionRecord>;

  addRoutine: (routine: Omit<RoutineTask, 'id' | 'created_at'>) => RoutineTask;
  updateRoutine: (id: string, updates: Partial<RoutineTask>) => void;
  deleteRoutine: (id: string) => void;
  toggleRoutineActive: (id: string) => void;

  recordCompletion: (
    routineId: string,
    date: string,
    status: 'completed' | 'skipped',
    workLogId?: number
  ) => void;
  removeCompletionRecord: (routineId: string, date: string) => void;
  getCompletionForDate: (routineId: string, date: string) => RoutineCompletionRecord | undefined;
  getRoutinesDueForDate: (dateStr: string) => RoutineTask[];
  restoreDefaultRoutines: () => void;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: getStoredRoutines(),
  completions: getStoredCompletions(),

  addRoutine: (routineData) => {
    const newRoutine: RoutineTask = {
      ...routineData,
      id: `routine-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updatedRoutines = [...get().routines, newRoutine];
    saveStoredRoutines(updatedRoutines);
    set({ routines: updatedRoutines });
    return newRoutine;
  },

  updateRoutine: (id, updates) => {
    const updatedRoutines = get().routines.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    saveStoredRoutines(updatedRoutines);
    set({ routines: updatedRoutines });
  },

  deleteRoutine: (id) => {
    const updatedRoutines = get().routines.filter((r) => r.id !== id);
    saveStoredRoutines(updatedRoutines);
    set({ routines: updatedRoutines });
  },

  toggleRoutineActive: (id) => {
    const updatedRoutines = get().routines.map((r) =>
      r.id === id ? { ...r, active: !r.active } : r
    );
    saveStoredRoutines(updatedRoutines);
    set({ routines: updatedRoutines });
  },

  recordCompletion: (routineId, date, status, workLogId) => {
    const key = `${routineId}_${date}`;
    const record: RoutineCompletionRecord = {
      routineId,
      date,
      status,
      workLogId,
      completedAt: new Date().toISOString(),
    };
    const updatedCompletions = {
      ...get().completions,
      [key]: record,
    };
    saveStoredCompletions(updatedCompletions);
    set({ completions: updatedCompletions });
  },

  removeCompletionRecord: (routineId, date) => {
    const key = `${routineId}_${date}`;
    const updatedCompletions = { ...get().completions };
    delete updatedCompletions[key];
    saveStoredCompletions(updatedCompletions);
    set({ completions: updatedCompletions });
  },

  getCompletionForDate: (routineId, date) => {
    const key = `${routineId}_${date}`;
    return get().completions[key];
  },

  getRoutinesDueForDate: (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return [];
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon...
    const dayOfMonth = dateObj.getDate(); // 1..31

    return get().routines.filter((routine) => {
      if (!routine.active) return false;
      if (routine.frequency === 'daily') return true;
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
    });
  },

  restoreDefaultRoutines: () => {
    saveStoredRoutines(DEFAULT_ROUTINES);
    set({ routines: DEFAULT_ROUTINES });
  },
}));
