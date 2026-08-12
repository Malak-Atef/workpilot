import React, { useState } from 'react';
import { useRoutineStore } from '../../store/useRoutineStore';
import { RoutineTask, RecurrenceFrequency } from '../../types';
import { DEFAULT_LOCATIONS } from '../../lib/presets';
import { calculateRoutineStats } from '../../utils/routineAnalytics';
import { Plus, Trash2, Edit2, RotateCcw, X, Check, Repeat, Clock, MapPin, Tag, Flame, TrendingUp } from 'lucide-react';

interface RoutineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS = ['IT Ops', 'Helpdesk', 'Infrastructure', 'Security', 'Network'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RoutineManagerModal: React.FC<RoutineManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    routines,
    completions,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    toggleRoutineActive,
    restoreDefaultRoutines,
  } = useRoutineStore();

  const [editingRoutine, setEditingRoutine] = useState<RoutineTask | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IT Ops');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('0.5');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily');
  const [weeklyDay, setWeeklyDay] = useState(1); // Monday
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [active, setActive] = useState(true);

  if (!isOpen) return null;

  const startCreate = () => {
    setTitle('');
    setCategory('IT Ops');
    setLocation('');
    setDuration('0.5');
    setDescription('');
    setFrequency('daily');
    setWeeklyDay(1);
    setMonthlyDay(1);
    setActive(true);
    setEditingRoutine(null);
    setIsCreating(true);
  };

  const startEdit = (routine: RoutineTask) => {
    setTitle(routine.title);
    setCategory(routine.category || 'IT Ops');
    setLocation(routine.location || '');
    setDuration(String(routine.default_duration || 0.5));
    setDescription(routine.description || '');
    setFrequency(routine.frequency || 'daily');
    setWeeklyDay(routine.weekly_day ?? 1);
    setMonthlyDay(routine.monthly_day ?? 1);
    setActive(routine.active);
    setIsCreating(false);
    setEditingRoutine(routine);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingRoutine(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedDuration = parseFloat(duration) || 0.5;

    if (isCreating) {
      addRoutine({
        title: title.trim(),
        category,
        location: location.trim() || undefined,
        default_duration: parsedDuration,
        description: description.trim() || undefined,
        frequency,
        weekly_day: frequency === 'weekly' ? weeklyDay : undefined,
        monthly_day: frequency === 'monthly' ? monthlyDay : undefined,
        active,
      });
    } else if (editingRoutine) {
      updateRoutine(editingRoutine.id, {
        title: title.trim(),
        category,
        location: location.trim() || undefined,
        default_duration: parsedDuration,
        description: description.trim() || undefined,
        frequency,
        weekly_day: frequency === 'weekly' ? weeklyDay : undefined,
        monthly_day: frequency === 'monthly' ? monthlyDay : undefined,
        active,
      });
    }

    cancelForm();
  };

  const getFrequencyLabel = (routine: RoutineTask) => {
    if (routine.frequency === 'daily') return 'Daily';
    if (routine.frequency === 'weekly') {
      const dayName = WEEKDAYS[routine.weekly_day ?? 1];
      return `Weekly (${dayName})`;
    }
    if (routine.frequency === 'monthly') {
      return `Monthly (Day ${routine.monthly_day ?? 1})`;
    }
    return 'Daily';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#292931]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c0c1ff]/10 text-[#c0c1ff] border border-[#c0c1ff]/20 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#e3e1ec]">Routine Task Manager</h3>
              <p className="text-xs text-[#90909a] font-mono">
                Define and configure recurring IT maintenance & operational routines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#90909a] hover:text-[#e3e1ec] hover:bg-[#292931] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Action Bar (Add & Reset) */}
          {!isCreating && !editingRoutine && (
            <div className="flex items-center justify-between">
              <button
                onClick={startCreate}
                className="px-3.5 py-2 bg-[#4d8eff] hover:bg-[#3b7be8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Routine</span>
              </button>

              <button
                onClick={restoreDefaultRoutines}
                className="px-3 py-1.5 bg-[#12131a] hover:bg-[#292931] text-[#90909a] hover:text-[#e3e1ec] border border-[#292931] rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                title="Reset to default IT routine task templates"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Default Routines</span>
              </button>
            </div>
          )}

          {/* Form (Create / Edit) */}
          {(isCreating || editingRoutine) && (
            <form onSubmit={handleSaveForm} className="bg-[#12131a] border border-[#292931] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#292931]/60">
                <span className="text-xs font-semibold text-[#adc6ff]">
                  {isCreating ? 'Create New Routine Task' : 'Edit Routine Task'}
                </span>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-xs text-[#90909a] hover:text-[#e3e1ec]"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono text-[#90909a] mb-1">
                    Routine Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Daily Server & Backup Check"
                    className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#90909a] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#90909a] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Server Room / HQ"
                    list="routine-location-list"
                    className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                  <datalist id="routine-location-list">
                    {DEFAULT_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#90909a] mb-1">
                    Default Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.1"
                    max="24"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#90909a] mb-1">
                    Recurrence Schedule
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {frequency === 'weekly' && (
                  <div>
                    <label className="block text-[11px] font-mono text-[#90909a] mb-1">
                      Target Day of Week
                    </label>
                    <select
                      value={weeklyDay}
                      onChange={(e) => setWeeklyDay(Number(e.target.value))}
                      className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                    >
                      {WEEKDAYS.map((day, idx) => (
                        <option key={day} value={idx}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {frequency === 'monthly' && (
                  <div>
                    <label className="block text-[11px] font-mono text-[#90909a] mb-1">
                      Day of Month (1 - 31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={monthlyDay}
                      onChange={(e) => setMonthlyDay(Number(e.target.value))}
                      className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono text-[#90909a] mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of instructions or checklist items for this routine"
                    className="w-full bg-[#1e1f26] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c2c6d6]">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-[#292931] bg-[#1e1f26] text-[#4d8eff] focus:ring-0"
                  />
                  <span>Active (enabled for schedule)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-3 py-1.5 text-xs text-[#90909a] hover:text-[#e3e1ec]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#4d8eff] hover:bg-[#3b7be8] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Routine</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Routine Task List */}
          <div className="space-y-2">
            {routines.length === 0 ? (
              <div className="text-center py-8 bg-[#12131a] rounded-xl border border-[#292931]">
                <Repeat className="w-8 h-8 text-[#90909a] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#90909a]">No routine tasks defined yet.</p>
              </div>
            ) : (
              routines.map((routine) => {
                const stats = calculateRoutineStats(routine, completions);

                return (
                  <div
                    key={routine.id}
                    className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                      routine.active
                        ? 'bg-[#12131a] border-[#292931]'
                        : 'bg-[#12131a]/50 border-[#292931]/40 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-[#e3e1ec]">{routine.title}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#c0c1ff]/10 text-[#c0c1ff] border border-[#c0c1ff]/20">
                          {getFrequencyLabel(routine)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#292931] text-[#adc6ff]">
                          {routine.category}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#ff9d42]/10 text-[#ffb77d] border border-[#ff9d42]/20 flex items-center gap-1"
                          title="Current consecutive completion streak"
                        >
                          <Flame className="w-3 h-3 text-[#ff9d42]" />
                          {stats.currentStreak}d streak
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#4d8eff]/10 text-[#adc6ff] border border-[#4d8eff]/20 flex items-center gap-1"
                          title="30-day completion rate"
                        >
                          <TrendingUp className="w-3 h-3 text-[#4d8eff]" />
                          {stats.completionRate30Days}% 30d
                        </span>
                        {!routine.active && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                            Inactive
                          </span>
                        )}
                      </div>

                    {routine.description && (
                      <p className="text-xs text-[#90909a] line-clamp-1">{routine.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[#90909a] font-mono pt-0.5">
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
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => toggleRoutineActive(routine.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                        routine.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-[#1e1f26] text-[#90909a] border-[#292931]'
                      }`}
                      title={routine.active ? 'Deactivate Routine' : 'Activate Routine'}
                    >
                      {routine.active ? 'Active' : 'Enable'}
                    </button>
                    <button
                      onClick={() => startEdit(routine)}
                      className="p-1.5 text-[#90909a] hover:text-[#e3e1ec] hover:bg-[#292931] rounded-lg transition-all cursor-pointer"
                      title="Edit Routine"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRoutine(routine.id)}
                      className="p-1.5 text-[#90909a] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                      title="Delete Routine"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#292931] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#292931] hover:bg-[#34343d] text-[#e3e1ec] rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
