export interface PlannedItem {
  id: number;
  title: str;
  description?: string;
  category?: string;
  date: string; // YYYY-MM-DD
  start_time?: string;
  end_time?: string;
  status: 'planned' | 'done' | 'dismissed';
  source: 'manual' | 'suggestion';
  source_ref_id?: string;
  work_log_id?: number;
  created_at: string;
  updated_at: string;
}

export type str = string;

export interface WorkLog {
  id: number;
  title: string;
  description?: string;
  category?: string;
  date: string; // YYYY-MM-DD
  start_time?: string;
  end_time?: string;
  duration_hours?: number;
  status: 'completed' | 'in_progress';
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface SuggestionPayload {
  suggested_title: string;
  suggested_date: string;
  suggested_category?: string;
  confidence?: number;
  matched_planned_item_title?: string;
  matched_planned_item_date?: string;
}

export interface Suggestion {
  id: string;
  payload: string | SuggestionPayload;
  suggestion_type: 'planned_item' | 'completed_work' | 'work_log';
  source: string;
  source_ref_id?: string;
  matched_planned_item_id?: number;
  status: 'pending' | 'confirmed' | 'dismissed';
  resulting_id?: number;
  created_at: string;
  updated_at: string;
  // Optional convenience properties
  suggested_title?: string;
  suggested_date?: string;
  suggested_category?: string;
  confidence?: number;
  matched_planned_item_title?: string;
  matched_planned_item_date?: string;
}

export interface CapturedItem {
  id: number;
  raw_text: string;
  captured_at: string;
  interpretation_status: string;
  created_at: string;
}

export interface ConfirmSuggestionPayload {
  resolution?: 'mark_planned_item_done' | 'create_new_work_log';
  action?: 'mark_done' | 'create_new';
  title_override?: string;
  date_override?: string;
  category_override?: string;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface RoutineTask {
  id: string;
  title: string;
  category: string;
  location?: string;
  default_duration: number;
  description?: string;
  frequency: RecurrenceFrequency;
  weekly_day?: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  monthly_day?: number; // 1 - 31
  active: boolean;
  created_at: string;
}

export interface RoutineCompletionRecord {
  routineId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped';
  workLogId?: number;
  completedAt: string;
}
