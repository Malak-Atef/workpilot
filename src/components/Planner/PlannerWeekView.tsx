import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle, XCircle, Plus, Trash2, X, Edit2, ClipboardList, Clock } from 'lucide-react';
import { useStore } from '../../store/useStore';
import * as api from '../../api/client';
import { PlannedItem } from '../../types';
import { getSunThuWeekDays, formatTimeRange } from '../../utils/weekUtils';

export const PlannerWeekView: React.FC = () => {
  const { plannedItems, updatePlannedItem, addPlannedItem, deletePlannedItem, fetchPlannedItems, fetchWorkLogs } = useStore();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [focusedDateStr, setFocusedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [weekViewMode, setWeekViewMode] = useState<'mon-sun' | 'sun-thu'>('mon-sun');

  // New Planned Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('IT Ops');
  const [newItemDate, setNewItemDate] = useState<string>(focusedDateStr);
  const [newItemStartTime, setNewItemStartTime] = useState('');
  const [newItemEndTime, setNewItemEndTime] = useState('');

  // Edit Planned Item Modal State
  const [editingItem, setEditingItem] = useState<PlannedItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('IT Ops');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Log Work from Plan Modal State
  const [logWorkItem, setLogWorkItem] = useState<PlannedItem | null>(null);
  const [logWorkTitle, setLogWorkTitle] = useState('');
  const [logWorkCategory, setLogWorkCategory] = useState('IT Ops');
  const [logWorkDate, setLogWorkDate] = useState('');
  const [logWorkDuration, setLogWorkDuration] = useState('1.0');
  const [logWorkLocation, setLogWorkLocation] = useState('');
  const [isLoggingWork, setIsLoggingWork] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    await addPlannedItem({
      title: newItemTitle.trim(),
      category: newItemCategory.trim() || 'IT Ops',
      date: newItemDate || focusedDateStr,
      start_time: newItemStartTime || undefined,
      end_time: newItemEndTime || undefined,
      status: 'planned',
      source: 'manual',
    });
    setShowAddModal(false);
    setNewItemTitle('');
    setNewItemCategory('IT Ops');
    setNewItemStartTime('');
    setNewItemEndTime('');
  };

  const handleOpenEditModal = (item: PlannedItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category || 'IT Ops');
    setEditDate(item.date);
    setEditStartTime(item.start_time || '');
    setEditEndTime(item.end_time || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.id || !editTitle.trim()) return;
    try {
      await updatePlannedItem(editingItem.id, {
        title: editTitle.trim(),
        category: editCategory.trim() || 'IT Ops',
        date: editDate,
        start_time: editStartTime || undefined,
        end_time: editEndTime || undefined,
      });
      setEditingItem(null);
    } catch (err) {
      alert('Failed to update planned item: ' + (err as Error).message);
    }
  };

  const handleOpenLogWorkModal = (item: PlannedItem) => {
    if (item.work_log_id != null || item.status === 'done') return;
    setLogWorkItem(item);
    setLogWorkTitle(item.title);
    setLogWorkCategory(item.category || 'IT Ops');
    setLogWorkDate(item.date);
    setLogWorkDuration('1.0');
    setLogWorkLocation('Main Campus');
  };

  const handleSaveLogWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logWorkItem || !logWorkItem.id || logWorkItem.work_log_id != null || logWorkItem.status === 'done') return;
    if (!logWorkTitle.trim()) return;

    setIsLoggingWork(true);
    try {
      const durationHours = parseFloat(logWorkDuration) || 1.0;
      const createdLog = await api.createWorkLog({
        title: logWorkTitle.trim(),
        category: logWorkCategory.trim() || 'IT Ops',
        date: logWorkDate,
        duration_hours: durationHours,
        location: logWorkLocation.trim() || undefined,
        status: 'completed',
      });

      if (createdLog && createdLog.id) {
        await api.updatePlannedItem(logWorkItem.id, {
          status: 'done',
          work_log_id: createdLog.id,
        });
      }

      await fetchPlannedItems();
      await fetchWorkLogs();

      setLogWorkItem(null);
    } catch (err) {
      alert('Failed to log work: ' + (err as Error).message);
    } finally {
      setIsLoggingWork(false);
    }
  };

  const handlePrevDay = () => {
    const cur = new Date(focusedDateStr);
    cur.setDate(cur.getDate() - 1);
    const newStr = cur.toISOString().split('T')[0];
    setFocusedDateStr(newStr);

    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const mondayThisWeek = new Date(today);
    mondayThisWeek.setDate(today.getDate() + distanceToMonday);

    const diffDays = Math.floor((cur.getTime() - mondayThisWeek.getTime()) / (1000 * 3600 * 24));
    const newOffset = Math.floor(diffDays / 7);
    setCurrentWeekOffset(newOffset);
  };

  const handleNextDay = () => {
    const cur = new Date(focusedDateStr);
    cur.setDate(cur.getDate() + 1);
    const newStr = cur.toISOString().split('T')[0];
    setFocusedDateStr(newStr);

    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const mondayThisWeek = new Date(today);
    mondayThisWeek.setDate(today.getDate() + distanceToMonday);

    const diffDays = Math.floor((cur.getTime() - mondayThisWeek.getTime()) / (1000 * 3600 * 24));
    const newOffset = Math.floor(diffDays / 7);
    setCurrentWeekOffset(newOffset);
  };

  const handleToday = () => {
    const todayStr = getTodayStr();
    setFocusedDateStr(todayStr);
    setCurrentWeekOffset(0);
  };

  // Calculate days for current displayed week
  const getWeekDays = (offset: number) => {
    if (weekViewMode === 'sun-thu') {
      return getSunThuWeekDays(offset, focusedDateStr);
    }
    const today = new Date();
    const currentDay = today.getDay();
    // Start week on Monday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + offset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const isToday = isoDate === getTodayStr();
      const isFocused = isoDate === focusedDateStr;
      days.push({
        dateStr: isoDate,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday,
        isFocused,
      });
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeekOffset);

  return (
    <div className="space-y-4">
      {/* Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e1f26] border border-[#292931] p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#adc6ff]" />
          <div>
            <h3 className="font-semibold text-sm text-[#e3e1ec]">
              Week of {weekDays[0].monthName} {weekDays[0].dayNum} – {weekDays[weekDays.length - 1].monthName} {weekDays[weekDays.length - 1].dayNum}
            </h3>
            <p className="text-xs text-[#90909a] font-mono">
              Focused Date: {focusedDateStr === getTodayStr() ? `Today (${focusedDateStr})` : focusedDateStr}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Week Bound Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#12131a] p-1 rounded-xl border border-[#292931] text-xs font-mono">
            <button
              onClick={() => setWeekViewMode('mon-sun')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                weekViewMode === 'mon-sun'
                  ? 'bg-[#292931] text-[#adc6ff] font-semibold'
                  : 'text-[#90909a] hover:text-[#c2c6d6]'
              }`}
              title="Standard 7-Day View (Mon-Sun)"
            >
              Mon–Sun
            </button>
            <button
              onClick={() => setWeekViewMode('sun-thu')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                weekViewMode === 'sun-thu'
                  ? 'bg-[#292931] text-[#adc6ff] font-semibold'
                  : 'text-[#90909a] hover:text-[#c2c6d6]'
              }`}
              title="Work Week Bound View (Sun-Thu)"
            >
              Sun–Thu
            </button>
          </div>

          <div className="h-4 w-px bg-[#292931] mx-1 hidden sm:block" />

          {/* Day Navigation */}
          <div className="flex items-center gap-1 bg-[#12131a] p-1 rounded-xl border border-[#292931]">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-[#292931] text-[#c2c6d6] rounded-lg transition-all cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                focusedDateStr === getTodayStr()
                  ? 'bg-[#4d8eff]/20 text-[#adc6ff] border border-[#4d8eff]/40'
                  : 'text-[#c2c6d6] hover:bg-[#292931]'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-[#292931] text-[#c2c6d6] rounded-lg transition-all cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#292931] mx-1 hidden sm:block" />

          {/* Week Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="px-2.5 py-1.5 bg-[#12131a] hover:bg-[#292931] text-xs font-mono text-[#c2c6d6] rounded-lg border border-[#292931] transition-all cursor-pointer"
              title="Previous Week"
            >
              Prev Week
            </button>
            <button
              onClick={() => {
                setCurrentWeekOffset(0);
                setFocusedDateStr(getTodayStr());
              }}
              className="px-3 py-1.5 bg-[#12131a] hover:bg-[#292931] text-xs font-mono font-medium text-[#adc6ff] rounded-lg border border-[#292931] transition-all cursor-pointer"
            >
              Current Week
            </button>
            <button
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="px-2.5 py-1.5 bg-[#12131a] hover:bg-[#292931] text-xs font-mono text-[#c2c6d6] rounded-lg border border-[#292931] transition-all cursor-pointer"
              title="Next Week"
            >
              Next Week
            </button>
          </div>

          <div className="h-4 w-px bg-[#292931] mx-1 hidden sm:block" />

          {/* New Plan Action */}
          <button
            onClick={() => {
              setNewItemDate(focusedDateStr);
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 bg-[#4d8eff] hover:bg-[#3b7be8] text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      <div className={`grid ${weekViewMode === 'sun-thu' ? 'grid-cols-1 sm:grid-cols-5' : 'grid-cols-1 sm:grid-cols-7'} gap-3`}>
        {weekDays.map((day) => {
          const dayItems = plannedItems.filter(item => item.date === day.dateStr);

          return (
            <div
              key={day.dateStr}
              onClick={() => setFocusedDateStr(day.dateStr)}
              className={`bg-[#1e1f26] border rounded-xl flex flex-col justify-between p-3 min-h-[380px] transition-all cursor-pointer ${
                day.isFocused
                  ? 'border-[#4d8eff] ring-1 ring-[#4d8eff] shadow-lg shadow-[#4d8eff]/10'
                  : day.isToday
                  ? 'border-[#3b7be8] shadow-md'
                  : 'border-[#292931] hover:border-[#33343c]'
              }`}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#292931] mb-3">
                  <div>
                    <span className="text-[11px] font-mono text-[#90909a] uppercase tracking-wider block">
                      {day.dayName}
                    </span>
                    <span className={`text-base font-bold ${day.isToday ? 'text-[#adc6ff]' : 'text-[#e3e1ec]'}`}>
                      {day.dayNum} {day.monthName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {day.isToday && (
                      <span className="text-[9px] font-mono font-bold bg-[#4d8eff]/20 text-[#adc6ff] px-1.5 py-0.5 rounded border border-[#4d8eff]/40">
                        TODAY
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewItemDate(day.dateStr);
                        setShowAddModal(true);
                      }}
                      className="p-1 hover:bg-[#292931] text-[#90909a] hover:text-[#adc6ff] rounded transition-colors cursor-pointer"
                      title={`Add plan for ${day.dayName} ${day.dayNum}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day Planned Items */}
                <div className="space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="text-[11px] text-[#90909a] font-mono text-center py-6 opacity-60">
                      No plans
                    </p>
                  ) : (
                    dayItems.map((item) => {
                      const isDone = item.status === 'done';
                      const isDismissed = item.status === 'dismissed';

                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-lg border text-xs transition-all relative group ${
                            isDone
                              ? 'bg-[#12131a]/60 border-[#292931] opacity-70'
                              : isDismissed
                              ? 'bg-[#12131a]/40 border-[#292931]/60 opacity-50'
                              : 'bg-[#12131a] border-[#292931] hover:border-[#3a3b45]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              disabled={isDone || isDismissed}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDone && !isDismissed && item.id) {
                                  updatePlannedItem(item.id, { status: 'done' });
                                }
                              }}
                              className={`mt-0.5 shrink-0 ${
                                isDone || isDismissed ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
                              }`}
                              title={isDone ? 'Completed' : isDismissed ? 'Dismissed' : 'Mark Complete'}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                              ) : isDismissed ? (
                                <XCircle className="w-4 h-4 text-[#90909a]" />
                              ) : (
                                <Circle className="w-4 h-4 text-[#90909a] hover:text-emerald-400" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-1">
                                <p className={`font-medium break-words flex-1 ${isDone || isDismissed ? 'line-through text-[#90909a]' : 'text-[#e3e1ec]'}`}>
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditModal(item);
                                    }}
                                    className="text-[#90909a] hover:text-[#adc6ff] p-0.5 rounded transition-colors cursor-pointer"
                                    title="Edit Planned Item"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.id && window.confirm(`Delete "${item.title}"?`)) {
                                        deletePlannedItem(item.id);
                                      }
                                    }}
                                    className="text-[#90909a] hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                                    title="Delete Planned Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 mt-1 font-mono text-[9px]">
                                <span className="text-[#ffb786]">{item.category || 'IT Ops'}</span>
                                <span className={`px-1 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold ${
                                  isDone
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : isDismissed
                                    ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                  {item.status}
                                </span>
                              </div>

                              {formatTimeRange(item.start_time, item.end_time) && (
                                <div className="flex items-center gap-1 text-[10px] text-[#adc6ff] font-mono mt-1 bg-[#1c1f2e] px-1.5 py-0.5 rounded border border-[#292931] w-fit">
                                  <Clock className="w-3 h-3 text-[#4d8eff]" />
                                  <span>{formatTimeRange(item.start_time, item.end_time)}</span>
                                </div>
                              )}

                              {item.status === 'planned' && item.id && (
                                <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-[#292931]/60">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updatePlannedItem(item.id!, { status: 'done' });
                                    }}
                                    className="flex-1 py-1 px-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-[9px] rounded border border-emerald-500/30 transition-all cursor-pointer text-center font-medium"
                                  >
                                    Complete
                                  </button>
                                  {item.work_log_id == null && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenLogWorkModal(item);
                                      }}
                                      className="flex-1 py-1 px-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-mono text-[9px] rounded border border-blue-500/30 transition-all cursor-pointer text-center font-medium flex items-center justify-center gap-1"
                                      title="Log Work from this planned item"
                                    >
                                      <ClipboardList className="w-3 h-3" />
                                      <span>Log Work</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updatePlannedItem(item.id!, { status: 'dismissed' });
                                    }}
                                    className="py-1 px-1 bg-[#1e1f26] hover:bg-rose-500/10 text-[#90909a] hover:text-rose-400 font-mono text-[9px] rounded border border-[#292931] hover:border-rose-500/30 transition-all cursor-pointer text-center"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Planned Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#292931]">
              <h3 className="font-semibold text-base text-[#e3e1ec]">New Planned Item</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#90909a] hover:text-[#e3e1ec] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#90909a] block mb-1">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upgrade core switch firmware"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3.5 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. IT Ops"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3.5 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newItemDate}
                    onChange={(e) => setNewItemDate(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Start Time (Optional)</label>
                  <input
                    type="time"
                    value={newItemStartTime}
                    onChange={(e) => setNewItemStartTime(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">End Time (Optional)</label>
                  <input
                    type="time"
                    value={newItemEndTime}
                    onChange={(e) => setNewItemEndTime(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#292931]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#12131a] hover:bg-[#292931] text-xs font-mono text-[#c2c6d6] rounded-xl border border-[#292931] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4d8eff] hover:bg-[#3b7be8] text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Planned Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#292931]">
              <h3 className="font-semibold text-base text-[#e3e1ec] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#4d8eff]" />
                <span>Edit Planned Item</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-[#90909a] hover:text-[#e3e1ec] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#90909a] block mb-1">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3.5 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. IT Ops"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3.5 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Start Time (Optional)</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">End Time (Optional)</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#292931]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-[#12131a] hover:bg-[#292931] text-xs font-mono text-[#c2c6d6] rounded-xl border border-[#292931] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4d8eff] hover:bg-[#3b7be8] text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Work from Plan Modal */}
      {logWorkItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#292931]">
              <h3 className="font-semibold text-base text-[#e3e1ec] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                <span>Log Work from Plan</span>
              </h3>
              <button
                type="button"
                onClick={() => setLogWorkItem(null)}
                className="text-[#90909a] hover:text-[#e3e1ec] p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLogWork} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#90909a] block mb-1">
                  WorkLog Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={logWorkTitle}
                  onChange={(e) => setLogWorkTitle(e.target.value)}
                  className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3.5 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Category</label>
                  <input
                    type="text"
                    value={logWorkCategory}
                    onChange={(e) => setLogWorkCategory(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3.5 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={logWorkDate}
                    onChange={(e) => setLogWorkDate(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.1"
                    required
                    value={logWorkDuration}
                    onChange={(e) => setLogWorkDuration(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3.5 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#90909a] block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Campus"
                    value={logWorkLocation}
                    onChange={(e) => setLogWorkLocation(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-xl px-3.5 py-2 text-sm text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#292931]">
                <button
                  type="button"
                  disabled={isLoggingWork}
                  onClick={() => setLogWorkItem(null)}
                  className="px-4 py-2 bg-[#12131a] hover:bg-[#292931] text-xs font-mono text-[#c2c6d6] rounded-xl border border-[#292931] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingWork}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoggingWork ? 'Logging Work...' : 'Log Work & Complete Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
