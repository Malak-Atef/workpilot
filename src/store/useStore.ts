import { create } from 'zustand';
import { PlannedItem, WorkLog, Suggestion } from '../types';
import * as api from '../api/client';

interface AppState {
  pendingSuggestions: Suggestion[];
  plannedItems: PlannedItem[];
  workLogs: WorkLog[];
  isLoading: boolean;
  captureInput: string;
  isCapturing: boolean;

  setCaptureInput: (val: string) => void;
  fetchPendingSuggestions: () => Promise<void>;
  fetchPlannedItems: (weekStart?: string, weekEnd?: string) => Promise<void>;
  fetchWorkLogs: (date?: string) => Promise<void>;
  
  handleCaptureSubmit: (rawText: string) => Promise<Suggestion[]>;
  handleConfirmSuggestion: (suggestionId: string, resolutionOrAction?: string, titleOverride?: string, dateOverride?: string) => Promise<void>;
  handleDismissSuggestion: (suggestionId: string) => Promise<void>;

  addPlannedItem: (item: Partial<PlannedItem>) => Promise<void>;
  updatePlannedItem: (id: number, updates: Partial<PlannedItem>) => Promise<void>;
  deletePlannedItem: (id: number) => Promise<void>;

  addWorkLog: (log: Partial<WorkLog>) => Promise<void>;
  updateWorkLog: (id: number, updates: Partial<WorkLog>) => Promise<void>;
  deleteWorkLog: (id: number) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  pendingSuggestions: [],
  plannedItems: [],
  workLogs: [],
  isLoading: false,
  captureInput: '',
  isCapturing: false,

  setCaptureInput: (val) => set({ captureInput: val }),

  fetchPendingSuggestions: async () => {
    try {
      const suggestions = await api.getPendingSuggestions();
      set({ pendingSuggestions: suggestions });
    } catch (e) {
      console.error('Failed to fetch pending suggestions', e);
    }
  },

  fetchPlannedItems: async (weekStart, weekEnd) => {
    try {
      set({ isLoading: true });
      const items = await api.getPlannedItems(weekStart, weekEnd);
      set({ plannedItems: items, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch planned items', e);
      set({ isLoading: false });
    }
  },

  fetchWorkLogs: async (date) => {
    try {
      set({ isLoading: true });
      const logs = await api.getWorkLogs(date);
      set({ workLogs: logs, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch work logs', e);
      set({ isLoading: false });
    }
  },

  handleCaptureSubmit: async (rawText) => {
    if (!rawText.trim()) return [];
    set({ isCapturing: true });
    try {
      const suggestions = await api.captureWork(rawText);
      set({ captureInput: '', isCapturing: false });
      await get().fetchPendingSuggestions();
      return suggestions;
    } catch (e) {
      console.error('Capture failed', e);
      set({ isCapturing: false });
      throw e;
    }
  },

  handleConfirmSuggestion: async (suggestionId, resolutionOrAction, titleOverride, dateOverride) => {
    try {
      let resolution: 'mark_planned_item_done' | 'create_new_work_log' | undefined = undefined;
      if (resolutionOrAction === 'mark_planned_item_done' || resolutionOrAction === 'mark_done') {
        resolution = 'mark_planned_item_done';
      } else if (resolutionOrAction === 'create_new_work_log' || resolutionOrAction === 'create_new') {
        resolution = 'create_new_work_log';
      }

      await api.confirmSuggestion(suggestionId, {
        resolution,
        action: resolutionOrAction as any,
        title_override: titleOverride,
        date_override: dateOverride,
      });
      await get().fetchPendingSuggestions();
      await get().fetchPlannedItems();
      await get().fetchWorkLogs();
    } catch (e) {
      console.error('Confirm suggestion failed', e);
    }
  },

  handleDismissSuggestion: async (suggestionId) => {
    try {
      await api.dismissSuggestion(suggestionId);
      await get().fetchPendingSuggestions();
    } catch (e) {
      console.error('Dismiss suggestion failed', e);
    }
  },

  addPlannedItem: async (item) => {
    await api.createPlannedItem(item);
    await get().fetchPlannedItems();
  },

  updatePlannedItem: async (id, updates) => {
    await api.updatePlannedItem(id, updates);
    await get().fetchPlannedItems();
  },

  deletePlannedItem: async (id) => {
    await api.deletePlannedItem(id);
    await get().fetchPlannedItems();
  },

  addWorkLog: async (log) => {
    await api.createWorkLog(log);
    await get().fetchWorkLogs();
  },

  updateWorkLog: async (id, updates) => {
    await api.updateWorkLog(id, updates);
    await get().fetchWorkLogs();
  },

  deleteWorkLog: async (id) => {
    await api.deleteWorkLog(id);
    await get().fetchWorkLogs();
  },
}));
