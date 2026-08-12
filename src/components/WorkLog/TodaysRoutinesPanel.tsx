import React, { useState } from 'react';
import { useRoutineStore } from '../../store/useRoutineStore';
import { useStore } from '../../store/useStore';
import { RoutineTask } from '../../types';
import { calculateCurrentStreak, calculate30DayCompletionRate } from '../../utils/routineAnalytics';
import { Repeat, CheckCircle2, SkipForward, Clock, MapPin, Tag, ChevronDown, ChevronUp, Check, X, Flame, TrendingUp, Calendar } from 'lucide-react';

interface TodaysRoutinesPanelProps {
  onSelectRoutine: (routine: RoutineTask) => void;
  onOpenManager: () => void;
}

export const TodaysRoutinesPanel: React.FC<TodaysRoutinesPanelProps> = ({
  onSelectRoutine,
  onOpenManager,
}) => {
  const { getRoutinesDueForDate, getCompletionForDate, recordCompletion, removeCompletionRecord, completions } = useRoutineStore();
  const { addPlannedItem, plannedItems } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(new Set());

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const todayStr = getTodayStr();

  const dueRoutines = getRoutinesDueForDate(todayStr);

  const completionStats = dueRoutines.reduce(
    (acc, routine) => {
      const record = getCompletionForDate(routine.id, todayStr);
      if (record?.status === 'completed') acc.completed++;
      else if (record?.status === 'skipped') acc.skipped++;
      else acc.pending++;
      return acc;
    },
    { completed: 0, skipped: 0, pending: 0 }
  );

  const totalDue = dueRoutines.length;

  const handleSkip = (routineId: string) => {
    recordCompletion(routineId, todayStr, 'skipped');
  };

  const handleUnskip = (routineId: string) => {
    removeCompletionRecord(routineId, todayStr);
  };

  const isRoutineScheduledOnPlanner = (routine: RoutineTask) => {
    return (
      scheduledIds.has(routine.id) ||
      plannedItems.some(
        (item) =>
          item.date === todayStr &&
          item.title.trim().toLowerCase() === routine.title.trim().toLowerCase() &&
          item.status !== 'dismissed'
      )
    );
  };

  const handleScheduleRoutine = async (routine: RoutineTask) => {
    try {
      setSchedulingId(routine.id);
      let desc = routine.description || '';
      if (routine.location) {
        desc = desc ? `${desc} [Location: ${routine.location}]` : `[Location: ${routine.location}]`;
      }
      if (routine.default_duration) {
        desc = desc ? `${desc} [Est: ${routine.default_duration}h]` : `[Est: ${routine.default_duration}h]`;
      }

      await addPlannedItem({
        title: routine.title,
        category: routine.category || 'IT Ops',
        description: desc || undefined,
        date: todayStr,
        status: 'planned',
        source: 'manual',
      });
      setScheduledIds((prev) => new Set(prev).add(routine.id));
    } catch (err) {
      console.error('Failed to schedule routine on planner', err);
    } finally {
      setSchedulingId(null);
    }
  };

  if (totalDue === 0) {
    return (
      <div className="bg-[#1e1f26] border border-[#292931] p-3.5 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#c0c1ff]/10 text-[#c0c1ff] border border-[#c0c1ff]/20 flex items-center justify-center">
            <Repeat className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-[#e3e1ec]">Today's Routines</span>
            <span className="text-[#90909a] font-mono ml-2 text-[11px]">No routine tasks scheduled for today.</span>
          </div>
        </div>
        <button
          onClick={onOpenManager}
          className="px-2.5 py-1.5 bg-[#12131a] hover:bg-[#292931] text-[#adc6ff] border border-[#292931] rounded-lg font-mono text-[11px] transition-all cursor-pointer"
        >
          Manage Routines
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1e1f26] border border-[#292931] p-4 rounded-2xl space-y-3 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#c0c1ff]/10 text-[#c0c1ff] border border-[#c0c1ff]/20 flex items-center justify-center">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs text-[#e3e1ec]">Today's Routines</h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#4d8eff]/15 text-[#adc6ff] border border-[#4d8eff]/30">
                Today's Routines: {completionStats.completed} / {totalDue} completed
              </span>
              {completionStats.skipped > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#292931] text-[#90909a]">
                  {completionStats.skipped} skipped
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#90909a] font-mono">
              Quickly prefill and record recurring daily/weekly/monthly IT operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManager}
            className="px-2.5 py-1.5 bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] hover:text-[#e3e1ec] border border-[#292931] rounded-lg font-mono text-[11px] transition-all cursor-pointer"
          >
            Manage Routines
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 bg-[#12131a] hover:bg-[#292931] text-[#90909a] hover:text-[#e3e1ec] border border-[#292931] rounded-lg transition-all cursor-pointer"
            title={isCollapsed ? "Expand Routines" : "Collapse Routines"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Routine Task Items List */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2.5 pt-1">
          {dueRoutines.map((routine) => {
            const completion = getCompletionForDate(routine.id, todayStr);
            const isCompleted = completion?.status === 'completed';
            const isSkipped = completion?.status === 'skipped';
            const isPending = !isCompleted && !isSkipped;

            const streak = calculateCurrentStreak(routine, completions, todayStr);
            const rate30d = calculate30DayCompletionRate(routine, completions, todayStr);

            return (
              <div
                key={routine.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isSkipped
                    ? 'bg-[#12131a]/40 border-[#292931]/60 opacity-60'
                    : 'bg-[#12131a] border-[#292931] hover:border-[#3b3c48]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`font-semibold text-xs ${isCompleted ? 'text-emerald-200 line-through' : 'text-[#e3e1ec]'}`}>
                      {routine.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-[#292931] text-[#adc6ff] shrink-0">
                      {routine.frequency}
                    </span>
                  </div>

                  {routine.description && (
                    <p className="text-[11px] text-[#90909a] line-clamp-1">{routine.description}</p>
                  )}

                  <div className="flex items-center gap-2.5 text-[10px] text-[#90909a] font-mono pt-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-[#1e1f26] text-[#c2c6d6]">
                      {routine.category}
                    </span>
                    {routine.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#adc6ff]" />
                        {routine.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#adc6ff]" />
                      {routine.default_duration}h
                    </span>
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#ff9d42]/10 text-[#ffb77d] border border-[#ff9d42]/20 font-semibold"
                      title="Current consecutive completion streak"
                    >
                      <Flame className="w-3 h-3 text-[#ff9d42]" />
                      {streak}d streak
                    </span>
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#4d8eff]/10 text-[#adc6ff] border border-[#4d8eff]/20 font-semibold"
                      title="30-day completion rate"
                    >
                      <TrendingUp className="w-3 h-3 text-[#4d8eff]" />
                      {rate30d}% (30d)
                    </span>
                  </div>
                </div>

                {/* Actions / Status Indicators */}
                <div className="pt-2 border-t border-[#292931]/60 flex items-center justify-between">
                  {isCompleted && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed Today</span>
                    </div>
                  )}

                  {isSkipped && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-xs text-[#90909a] font-medium font-mono">
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skipped for Today</span>
                      </div>
                      <button
                        onClick={() => handleUnskip(routine.id)}
                        className="px-2 py-0.5 text-[11px] font-mono text-[#adc6ff] hover:text-[#e3e1ec] hover:underline cursor-pointer"
                        title="Undo skip and return routine to Pending"
                      >
                        Undo
                      </button>
                    </div>
                  )}

                  {isPending && (() => {
                    const isScheduled = isRoutineScheduledOnPlanner(routine);
                    const isScheduling = schedulingId === routine.id;

                    return (
                      <>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSkip(routine.id)}
                            className="px-2 py-1 bg-[#1e1f26] hover:bg-[#292931] text-[#90909a] hover:text-[#e3e1ec] rounded-lg text-[11px] font-mono transition-all cursor-pointer border border-[#292931]"
                            title="Skip this routine task for today without logging"
                          >
                            Skip
                          </button>

                          <button
                            onClick={() => handleScheduleRoutine(routine)}
                            disabled={isScheduled || isScheduling}
                            className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 border ${
                              isScheduled
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 cursor-default'
                                : 'bg-[#1e1f26] hover:bg-[#292931] text-[#adc6ff] hover:text-[#e3e1ec] border-[#292931] cursor-pointer'
                            }`}
                            title={isScheduled ? "Already scheduled on Planner for today" : "Add task to Planner for today"}
                          >
                            <Calendar className="w-3 h-3 text-[#adc6ff]" />
                            <span>{isScheduled ? 'Timeboxed' : isScheduling ? 'Timeboxing...' : 'Timebox'}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => onSelectRoutine(routine)}
                          className="px-3 py-1 bg-[#4d8eff] hover:bg-[#3b7be8] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Log Routine</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
