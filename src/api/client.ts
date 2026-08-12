import { PlannedItem, WorkLog, Suggestion, ConfirmSuggestionPayload } from '../types';

let tauriApiPort: number | null = null;
let tauriPortPromise: Promise<number | null> | null = null;

async function getTauriPort(): Promise<number | null> {
  if (tauriApiPort !== null) return tauriApiPort;

  if (typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)) {
    if (!tauriPortPromise) {
      tauriPortPromise = (async () => {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          let port = await invoke<number>('get_api_port');
          if (port) {
            tauriApiPort = port;
            return port;
          }
          for (let i = 0; i < 5; i++) {
            await new Promise((r) => setTimeout(r, 100));
            port = await invoke<number>('get_api_port');
            if (port) {
              tauriApiPort = port;
              return port;
            }
          }
        } catch (e) {
          console.warn('Failed to resolve Tauri API port:', e);
        }
        return null;
      })();
    }
    return tauriPortPromise;
  }
  return null;
}

export async function getApiBase(): Promise<string> {
  const port = await getTauriPort();
  if (port) {
    return `http://127.0.0.1:${port}/api/v1`;
  }
  if (typeof window !== 'undefined' && (window as any).__API_PORT__) {
    return `http://127.0.0.1:${(window as any).__API_PORT__}/api/v1`;
  }
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  if (metaEnv && metaEnv.VITE_API_URL) {
    const customUrl = (metaEnv.VITE_API_URL as string).replace(/\/$/, '');
    return customUrl.endsWith('/api/v1') ? customUrl : `${customUrl}/api/v1`;
  }
  return '/api/v1';
}

export async function captureWork(rawText: string): Promise<Suggestion[]> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText }),
  });
  if (!res.ok) throw new Error('Capture failed');
  return res.json();
}

export async function getPendingSuggestions(): Promise<Suggestion[]> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/suggestions/pending`);
  if (!res.ok) throw new Error('Failed to fetch pending suggestions');
  return res.json();
}

export async function confirmSuggestion(
  suggestionId: string,
  payload?: ConfirmSuggestionPayload
): Promise<any> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/suggestions/${suggestionId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error('Failed to confirm suggestion');
  return res.json();
}

export async function dismissSuggestion(suggestionId: string): Promise<any> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/suggestions/${suggestionId}/dismiss`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to dismiss suggestion');
  return res.json();
}

export async function getPlannedItems(weekStart?: string, weekEnd?: string): Promise<PlannedItem[]> {
  const baseUrl = await getApiBase();
  const params = new URLSearchParams();
  if (weekStart) params.append('week_start', weekStart);
  if (weekEnd) params.append('week_end', weekEnd);
  const res = await fetch(`${baseUrl}/planned-items?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch planned items');
  return res.json();
}

export async function createPlannedItem(item: Partial<PlannedItem>): Promise<PlannedItem> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/planned-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to create planned item');
  return res.json();
}

export async function updatePlannedItem(id: number, updates: Partial<PlannedItem>): Promise<PlannedItem> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/planned-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update planned item');
  return res.json();
}

export async function deletePlannedItem(id: number): Promise<void> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/planned-items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete planned item');
}

export async function getWorkLogs(date?: string): Promise<WorkLog[]> {
  const baseUrl = await getApiBase();
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  const url = params.toString() ? `${baseUrl}/work-logs?${params.toString()}` : `${baseUrl}/work-logs`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch work logs');
  return res.json();
}

export async function createWorkLog(log: Partial<WorkLog>): Promise<WorkLog> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/work-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!res.ok) throw new Error('Failed to create work log');
  return res.json();
}

export async function updateWorkLog(id: number, updates: Partial<WorkLog>): Promise<WorkLog> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/work-logs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update work log');
  return res.json();
}

export async function deleteWorkLog(id: number): Promise<void> {
  const baseUrl = await getApiBase();
  const res = await fetch(`${baseUrl}/work-logs/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete work log');
}

