import React from 'react';
import { WorkLog } from '../../types';
import { Clock, Repeat, MapPin } from 'lucide-react';

export interface TaskItem {
  title: string;
  category: string;
  location: string;
  duration_hours: number;
  start_time?: string;
  end_time?: string;
  count?: number;
}

interface RecentFrequentBarProps {
  workLogs: WorkLog[];
  onSelectTask: (task: TaskItem) => void;
}

export const RecentFrequentBar: React.FC<RecentFrequentBarProps> = ({ workLogs, onSelectTask }) => {
  // Sort logs by date descending, then id descending
  const sortedLogs = [...workLogs].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return (b.id || 0) - (a.id || 0);
  });

  // Calculate Recent Tasks (top 5 unique combinations)
  const recentTasks: TaskItem[] = [];
  const seenKeys = new Set<string>();

  for (const log of sortedLogs) {
    const title = (log.title || '').trim();
    if (!title) continue;
    const category = (log.category || 'IT Ops').trim();
    const location = (log.location || '').trim();
    const key = `${title.toLowerCase()}|${category.toLowerCase()}|${location.toLowerCase()}`;

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      recentTasks.push({
        title,
        category,
        location,
        duration_hours: log.duration_hours || 0.5,
      });
      if (recentTasks.length >= 5) break;
    }
  }

  // Calculate Frequent Tasks (top 5 by count, tie-breaker: most recent)
  const groupMap = new Map<
    string,
    {
      title: string;
      category: string;
      location: string;
      duration_hours: number;
      count: number;
      latestDate: string;
      latestId: number;
    }
  >();

  for (const log of workLogs) {
    const title = (log.title || '').trim();
    if (!title) continue;
    const category = (log.category || 'IT Ops').trim();
    const location = (log.location || '').trim();
    const key = `${title.toLowerCase()}|${category.toLowerCase()}|${location.toLowerCase()}`;

    const existing = groupMap.get(key);
    if (!existing) {
      groupMap.set(key, {
        title,
        category,
        location,
        duration_hours: log.duration_hours || 0.5,
        count: 1,
        latestDate: log.date,
        latestId: log.id || 0,
      });
    } else {
      existing.count += 1;
      // Update latest info if log is newer
      const isNewer =
        log.date > existing.latestDate ||
        (log.date === existing.latestDate && (log.id || 0) > existing.latestId);
      if (isNewer) {
        existing.latestDate = log.date;
        existing.latestId = log.id || 0;
        existing.duration_hours = log.duration_hours || 0.5;
      }
    }
  }

  const sortedFrequentGroups = Array.from(groupMap.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count; // Sort by occurrence count descending
    }
    if (a.latestDate !== b.latestDate) {
      return b.latestDate.localeCompare(a.latestDate); // Tie-breaker: latest date
    }
    return b.latestId - a.latestId;
  });

  const frequentTasks: TaskItem[] = sortedFrequentGroups.slice(0, 5).map((g) => ({
    title: g.title,
    category: g.category,
    location: g.location,
    duration_hours: g.duration_hours,
    count: g.count,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Recent Tasks */}
      <div className="bg-[#1e1f26] border border-[#292931] p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#4d8eff]/10 text-[#adc6ff] rounded-lg border border-[#4d8eff]/20 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#e3e1ec] uppercase tracking-wider font-mono">
              Recent Tasks
            </h4>
            <p className="text-[10px] text-[#90909a] font-mono">
              Last 5 unique logged activities
            </p>
          </div>
        </div>

        {recentTasks.length === 0 ? (
          <p className="text-xs font-mono text-[#90909a] py-2 italic">
            No recent tasks yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentTasks.map((task, idx) => (
              <button
                key={`recent-${idx}`}
                onClick={() => onSelectTask(task)}
                className="group px-3 py-1.5 bg-[#12131a] hover:bg-[#4d8eff]/15 hover:border-[#4d8eff]/40 border border-[#292931] rounded-xl text-xs font-medium text-[#c2c6d6] hover:text-[#e3e1ec] transition-all flex items-center gap-2 cursor-pointer text-left"
              >
                <span>{task.title}</span>
                {task.location && (
                  <span className="text-[10px] font-mono text-[#90909a] group-hover:text-[#adc6ff] flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-[#adc6ff]/70" />
                    {task.location}
                  </span>
                )}
                <span className="text-[10px] font-mono text-[#90909a] bg-[#1e1f26] px-1.5 py-0.2 rounded border border-[#292931]">
                  {task.duration_hours}h
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Frequent Tasks */}
      <div className="bg-[#1e1f26] border border-[#292931] p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Repeat className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#e3e1ec] uppercase tracking-wider font-mono">
              Frequent Tasks
            </h4>
            <p className="text-[10px] text-[#90909a] font-mono">
              Most repeated operational tasks
            </p>
          </div>
        </div>

        {frequentTasks.length === 0 ? (
          <p className="text-xs font-mono text-[#90909a] py-2 italic">
            No frequent tasks yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {frequentTasks.map((task, idx) => (
              <button
                key={`frequent-${idx}`}
                onClick={() => onSelectTask(task)}
                className="group px-3 py-1.5 bg-[#12131a] hover:bg-emerald-500/15 hover:border-emerald-500/40 border border-[#292931] rounded-xl text-xs font-medium text-[#c2c6d6] hover:text-[#e3e1ec] transition-all flex items-center gap-2 cursor-pointer text-left"
              >
                <span>{task.title}</span>
                {task.location && (
                  <span className="text-[10px] font-mono text-[#90909a] group-hover:text-emerald-300 flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400/70" />
                    {task.location}
                  </span>
                )}
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold">
                  {task.count}x
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
