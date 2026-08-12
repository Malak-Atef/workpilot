import { create } from 'zustand';

export interface WeeklyDocumentMetaData {
  weekGoal: string;
  nextWeekTasks: string[];
  videoObservations: string[];
}

interface WeeklyPlanStoreState {
  weeklyData: Record<string, WeeklyDocumentMetaData>; // Keyed by weekStart date (YYYY-MM-DD)
  getWeekData: (weekStart: string) => WeeklyDocumentMetaData;
  setWeekGoal: (weekStart: string, goal: string) => void;
  setNextWeekTasks: (weekStart: string, tasks: string[]) => void;
  addNextWeekTask: (weekStart: string, task: string) => void;
  removeNextWeekTask: (weekStart: string, index: number) => void;
  updateNextWeekTask: (weekStart: string, index: number, task: string) => void;
  setVideoObservations: (weekStart: string, observations: string[]) => void;
  addVideoObservation: (weekStart: string, obs: string) => void;
  removeVideoObservation: (weekStart: string, index: number) => void;
  updateVideoObservation: (weekStart: string, index: number, obs: string) => void;
}

const STORAGE_KEY = 'workpilot_weekly_plan_metadata';

function getStoredData(): Record<string, WeeklyDocumentMetaData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse weekly plan metadata from localStorage:', err);
    return {};
  }
}

function saveStoredData(data: Record<string, WeeklyDocumentMetaData>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save weekly plan metadata to localStorage:', err);
  }
}

const DEFAULT_METADATA: WeeklyDocumentMetaData = {
  weekGoal: '',
  nextWeekTasks: [],
  videoObservations: [],
};

export const useWeeklyWorkPlanStore = create<WeeklyPlanStoreState>((set, get) => ({
  weeklyData: getStoredData(),

  getWeekData: (weekStart: string) => {
    return get().weeklyData[weekStart] || DEFAULT_METADATA;
  },

  setWeekGoal: (weekStart: string, goal: string) => {
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        weekGoal: goal,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },

  setNextWeekTasks: (weekStart: string, tasks: string[]) => {
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        nextWeekTasks: tasks,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },

  addNextWeekTask: (weekStart: string, task: string) => {
    if (!task.trim()) return;
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updatedTasks = [...existing.nextWeekTasks, task.trim()];
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        nextWeekTasks: updatedTasks,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },

  removeNextWeekTask: (weekStart: string, index: number) => {
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updatedTasks = existing.nextWeekTasks.filter((_, i) => i !== index);
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        nextWeekTasks: updatedTasks,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },

  updateNextWeekTask: (weekStart: string, index: number, task: string) => {
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updatedTasks = [...existing.nextWeekTasks];
    updatedTasks[index] = task;
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        nextWeekTasks: updatedTasks,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },

  setVideoObservations: (weekStart: string, observations: string[]) => {
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        videoObservations: observations,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },

  addVideoObservation: (weekStart: string, obs: string) => {
    if (!obs.trim()) return;
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updatedObs = [...existing.videoObservations, obs.trim()];
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        videoObservations: updatedObs,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },

  removeVideoObservation: (weekStart: string, index: number) => {
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updatedObs = existing.videoObservations.filter((_, i) => i !== index);
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        videoObservations: updatedObs,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },

  updateVideoObservation: (weekStart: string, index: number, obs: string) => {
    const current = get().weeklyData;
    const existing = current[weekStart] || { ...DEFAULT_METADATA };
    const updatedObs = [...existing.videoObservations];
    updatedObs[index] = obs;
    const updated = {
      ...current,
      [weekStart]: {
        ...existing,
        videoObservations: updatedObs,
      },
    };
    saveStoredData(updated);
    set({ weeklyData: updated });
  },
}));
