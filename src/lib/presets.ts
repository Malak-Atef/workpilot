export interface TaskPreset {
  id: string;
  title: string;
  category: string;
  location?: string;
  defaultDuration: number;
  isCustom?: boolean;
}

export const DEFAULT_PRESETS: TaskPreset[] = [
  {
    id: 'default-1',
    title: 'Printer / Scanner Issue',
    category: 'Hardware',
    defaultDuration: 0.5,
  },
  {
    id: 'default-2',
    title: 'Wi-Fi / Network Troubleshooting',
    category: 'Infrastructure',
    defaultDuration: 0.5,
  },
  {
    id: 'default-3',
    title: 'Computer / Laptop Issue',
    category: 'Hardware',
    defaultDuration: 1.0,
  },
  {
    id: 'default-4',
    title: 'Software Installation',
    category: 'IT Ops',
    defaultDuration: 0.5,
  },
  {
    id: 'default-5',
    title: 'Google Workspace / Account Issue',
    category: 'IT Ops',
    defaultDuration: 0.5,
  },
  {
    id: 'default-6',
    title: 'Classroom Technology / Display Setup',
    category: 'Hardware',
    defaultDuration: 0.5,
  },
  {
    id: 'default-7',
    title: 'Internet Connection Issue',
    category: 'Infrastructure',
    defaultDuration: 0.5,
  },
  {
    id: 'default-8',
    title: 'Projector / Smart Board Issue',
    category: 'Hardware',
    defaultDuration: 0.5,
  },
  {
    id: 'default-9',
    title: 'Email Issue',
    category: 'IT Ops',
    defaultDuration: 0.5,
  },
  {
    id: 'default-10',
    title: 'Student / Staff Account Support',
    category: 'IT Ops',
    defaultDuration: 0.5,
  },
  {
    id: 'default-11',
    title: 'Odoo Support',
    category: 'IT Ops',
    defaultDuration: 0.5,
  },
  {
    id: 'default-12',
    title: 'Website / Google Workspace Administration',
    category: 'IT Ops',
    defaultDuration: 0.5,
  },
  {
    id: 'default-13',
    title: 'Network Cable / Port Issue',
    category: 'Infrastructure',
    defaultDuration: 0.5,
  },
  {
    id: 'default-14',
    title: 'General Classroom IT Support',
    category: 'Maintenance',
    defaultDuration: 0.5,
  },
];

const LOCAL_STORAGE_KEY = 'workpilot_quick_presets';

export const getStoredPresets = (): TaskPreset[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PRESETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Error loading presets from localStorage:', err);
  }
  return DEFAULT_PRESETS;
};

export const saveStoredPresets = (presets: TaskPreset[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.error('Error saving presets to localStorage:', err);
  }
};

export const resetStoredPresets = (): TaskPreset[] => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Error resetting presets in localStorage:', err);
  }
  return DEFAULT_PRESETS;
};

export const DEFAULT_LOCATIONS = [
  'Elementary School',
  'Secondary School',
  'Admin Office',
  'Elementary Computer Lab',
  'Secondary Computer Lab',
  'Library',
  'Chapel',
  'Maintenance Area',
  'IT Office',
  'Main Campus',
  'Other / Custom',
];
