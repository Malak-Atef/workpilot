import React, { useState } from 'react';
import { Plus, Trash2, Edit2, MapPin, Calendar, Tag, ClipboardList, ChevronLeft, ChevronRight, Search, Clock, Download, Repeat } from 'lucide-react';
import { WorkLog, RoutineTask } from '../../types';
import { useStore } from '../../store/useStore';
import { useRoutineStore } from '../../store/useRoutineStore';
import { QuickPresetsBar } from './QuickPresetsBar';
import { RecentFrequentBar, TaskItem } from './RecentFrequentBar';
import { TodaysRoutinesPanel } from './TodaysRoutinesPanel';
import { TaskPreset, DEFAULT_LOCATIONS } from '../../lib/presets';
import { exportToCSV } from '../../utils/csvExport';
import { RoutineManagerModal } from './RoutineManagerModal';
import { calculateEndTime, calculateDurationHours, formatTimeRange } from '../../utils/weekUtils';

const getTodayStr = () => new Date().toISOString().split('T')[0];

export const WorkLogTable: React.FC = () => {
  const { workLogs, addWorkLog, updateWorkLog, deleteWorkLog, fetchWorkLogs } = useStore();
  const { recordCompletion } = useRoutineStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);

  // Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Date Filter & Navigation State ('', or 'YYYY-MM-DD')
  const [selectedDate, setSelectedDate] = useState<string>('');

  // New Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IT Ops');
  const [date, setDate] = useState(getTodayStr());
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('1.0');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Combined locations list from default presets + existing work logs
  const locationShortcuts = Array.from(
    new Set([
      ...DEFAULT_LOCATIONS.filter((l) => l !== 'Other / Custom'),
      ...workLogs.map((log) => log.location).filter(Boolean),
    ])
  ) as string[];

  const durationOptions = [
    { label: '15m', val: '0.25' },
    { label: '30m', val: '0.5' },
    { label: '45m', val: '0.75' },
    { label: '1h', val: '1.0' },
    { label: '1.5h', val: '1.5' },
    { label: '2h', val: '2.0' },
  ];

  // Unique categories list combining presets and loaded logs
  const categoriesInLogs = Array.from(
    new Set([
      'IT Ops',
      'Infrastructure',
      'Hardware',
      'Maintenance',
      'Security',
      ...workLogs.map((log) => log.category).filter(Boolean),
    ])
  );

  // Filter workLogs by search query (title / location) and selected category
  const filteredWorkLogs = workLogs.filter((log) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (log.title || '').toLowerCase().includes(q) ||
      (log.location || '').toLowerCase().includes(q);

    const matchesCategory =
      !selectedCategory || log.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalHours = filteredWorkLogs.reduce((sum, log) => sum + (log.duration_hours || 0), 0);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchWorkLogs(newDate || undefined);
  };

  const handlePrevDay = () => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    baseDate.setDate(baseDate.getDate() - 1);
    const newStr = baseDate.toISOString().split('T')[0];
    handleDateChange(newStr);
  };

  const handleNextDay = () => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    const newStr = baseDate.toISOString().split('T')[0];
    handleDateChange(newStr);
  };

  const handleToday = () => {
    handleDateChange(getTodayStr());
  };

  const handleAllDates = () => {
    handleDateChange('');
  };

  const handleSelectPreset = (preset: TaskPreset) => {
    setTitle(preset.title);
    setCategory(preset.category || 'IT Ops');
    setLocation(preset.location || '');
    setDuration(String(preset.defaultDuration || 0.5));
    setStartTime('');
    setEndTime('');
    setDate(getTodayStr());
    setActiveRoutineId(null);
    setShowAddModal(true);
  };

  const handleSelectRecentOrFrequent = (task: TaskItem) => {
    setTitle(task.title);
    setCategory(task.category || 'IT Ops');
    setLocation(task.location || '');
    setDuration(String(task.duration_hours || 0.5));
    setStartTime(task.start_time || '');
    setEndTime(task.end_time || '');
    setDate(getTodayStr());
    setActiveRoutineId(null);
    setShowAddModal(true);
  };

  const handleSelectRoutine = (routine: RoutineTask) => {
    setTitle(routine.title);
    setCategory(routine.category || 'IT Ops');
    setLocation(routine.location || '');
    setDuration(String(routine.default_duration || 0.5));
    setStartTime('');
    setEndTime('');
    setDate(getTodayStr());
    setActiveRoutineId(routine.id);
    setShowAddModal(true);
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const durHours = parseFloat(duration);
    if (newStart && !isNaN(durHours) && durHours > 0) {
      const computedEnd = calculateEndTime(newStart, durHours);
      if (computedEnd) setEndTime(computedEnd);
    }
  };

  const handleDurationChange = (newDurStr: string) => {
    setDuration(newDurStr);
    const durHours = parseFloat(newDurStr);
    if (startTime && !isNaN(durHours) && durHours > 0) {
      const computedEnd = calculateEndTime(startTime, durHours);
      if (computedEnd) setEndTime(computedEnd);
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    if (startTime && newEnd) {
      const computedDur = calculateDurationHours(startTime, newEnd);
      if (computedDur && computedDur > 0) {
        setDuration(String(computedDur));
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalEndTime = endTime.trim();
    const durHours = parseFloat(duration);
    if (startTime.trim() && !finalEndTime && !isNaN(durHours) && durHours > 0) {
      const computed = calculateEndTime(startTime.trim(), durHours);
      if (computed) finalEndTime = computed;
    }

    await addWorkLog({
      title: title.trim(),
      category,
      date,
      start_time: startTime.trim() || undefined,
      end_time: finalEndTime || undefined,
      location: location.trim() || undefined,
      duration_hours: !isNaN(durHours) ? durHours : 1.0,
      status: 'completed',
    });

    if (activeRoutineId) {
      recordCompletion(activeRoutineId, date, 'completed');
      setActiveRoutineId(null);
    }

    setTitle('');
    setStartTime('');
    setEndTime('');
    setShowAddModal(false);
    // Refresh with current filter
    fetchWorkLogs(selectedDate || undefined);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog || !editingLog.title.trim()) return;

    const durHours = typeof editingLog.duration_hours === 'number' ? editingLog.duration_hours : parseFloat(editingLog.duration_hours as any) || 0;
    let finalEndTime = editingLog.end_time;
    if (editingLog.start_time && !finalEndTime && durHours > 0) {
      const computed = calculateEndTime(editingLog.start_time, durHours);
      if (computed) finalEndTime = computed;
    }

    await updateWorkLog(editingLog.id, {
      title: editingLog.title.trim(),
      category: editingLog.category,
      date: editingLog.date,
      start_time: editingLog.start_time ? editingLog.start_time.trim() : undefined,
      end_time: finalEndTime ? finalEndTime.trim() : undefined,
      location: editingLog.location ? editingLog.location.trim() : undefined,
      duration_hours: durHours,
    });
    setEditingLog(null);
    // Refresh with current filter
    fetchWorkLogs(selectedDate || undefined);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Category',
      'Location',
      'Duration (Hours)',
      'Date',
      'Status',
      'Notes',
    ];

    const rows = filteredWorkLogs.map((log) => [
      log.id ?? '',
      log.title ?? '',
      log.category ?? '',
      log.location ?? '',
      log.duration_hours ?? 0,
      log.date ?? '',
      log.status ?? 'completed',
      log.description ?? '',
    ]);

    const todayStr = getTodayStr();
    exportToCSV(`worklogs_export_${todayStr}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Today's Routines Panel */}
      <TodaysRoutinesPanel
        onSelectRoutine={handleSelectRoutine}
        onOpenManager={() => setShowRoutineModal(true)}
      />

      {/* Quick Presets Bar */}
      <QuickPresetsBar onSelectPreset={handleSelectPreset} />

      {/* Recent & Frequent Tasks Bar */}
      <RecentFrequentBar workLogs={workLogs} onSelectTask={handleSelectRecentOrFrequent} />

      {/* Header Bar */}
      <div className="flex items-center justify-between bg-[#1e1f26] border border-[#292931] p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#c0c1ff]" />
          <div>
            <h3 className="font-semibold text-sm text-[#e3e1ec]">IT Work Logs</h3>
            <p className="text-xs text-[#90909a] font-mono">Historical records of completed operations & engineering tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block font-mono text-xs">
            <span className="text-[#90909a] block text-[10px] uppercase tracking-wider">Total Duration</span>
            <span className="text-[#adc6ff] font-semibold">{totalHours.toFixed(1)} hrs</span>
          </div>
          <button
            onClick={() => setShowRoutineModal(true)}
            className="px-3.5 py-2 bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] hover:text-[#e3e1ec] border border-[#292931] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Manage recurring routine tasks"
          >
            <Repeat className="w-4 h-4 text-[#c0c1ff]" />
            <span>Routines</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] hover:text-[#e3e1ec] border border-[#292931] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Export filtered WorkLogs to CSV"
          >
            <Download className="w-4 h-4 text-[#adc6ff]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setTitle('');
              setLocation('');
              setDuration('1.0');
              setStartTime('');
              setEndTime('');
              setDate(getTodayStr());
              setActiveRoutineId(null);
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-[#4d8eff] hover:bg-[#3b7be8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Log</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Search/Category Bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e1f26] border border-[#292931] p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-1.5 bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] rounded-lg border border-[#292931] transition-all cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
                selectedDate === getTodayStr()
                  ? 'bg-[#4d8eff]/20 text-[#adc6ff] border-[#4d8eff]'
                  : 'bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] border-[#292931]'
              }`}
            >
              Today
            </button>

            <button
              onClick={handleNextDay}
              className="p-1.5 bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] rounded-lg border border-[#292931] transition-all cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleAllDates}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
                selectedDate === ''
                  ? 'bg-[#4d8eff]/20 text-[#adc6ff] border-[#4d8eff]'
                  : 'bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] border-[#292931]'
              }`}
            >
              All Dates
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#90909a]">
            <Calendar className="w-4 h-4 text-[#adc6ff]" />
            <span>Date Filter:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-[#12131a] border border-[#292931] text-[#e3e1ec] rounded-lg px-2 py-1 text-xs font-mono cursor-pointer"
            />
          </div>
        </div>

        {/* Search & Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e1f26] border border-[#292931] p-3 rounded-xl">
          <div className="flex flex-1 items-center gap-2 min-w-[200px] bg-[#12131a] border border-[#292931] rounded-lg px-2.5 py-1.5">
            <Search className="w-4 h-4 text-[#90909a] shrink-0" />
            <input
              type="text"
              placeholder="Search by title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[#e3e1ec] text-xs font-mono focus:outline-none placeholder-[#60606a]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#90909a] hover:text-[#e3e1ec] text-xs font-mono px-1 cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#90909a]">
            <Tag className="w-4 h-4 text-[#adc6ff]" />
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#12131a] border border-[#292931] text-[#e3e1ec] rounded-lg px-2 py-1.5 text-xs font-mono cursor-pointer focus:outline-none focus:border-[#4d8eff]"
            >
              <option value="">All Categories</option>
              {categoriesInLogs.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#12131a] border-b border-[#292931] text-[11px] font-mono text-[#90909a]">
              <th className="py-3 px-4">TASK TITLE</th>
              <th className="py-3 px-4">CATEGORY</th>
              <th className="py-3 px-4">DATE & TIME</th>
              <th className="py-3 px-4">LOCATION</th>
              <th className="py-3 px-4">DURATION</th>
              <th className="py-3 px-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#292931] text-xs">
            {filteredWorkLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#90909a] font-mono text-xs">
                  {workLogs.length === 0
                    ? 'No work logs recorded yet.'
                    : 'No work logs match the current search and category filters.'}
                </td>
              </tr>
            ) : (
              filteredWorkLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1a1b22] transition-all">
                  <td className="py-3.5 px-4 font-medium text-[#e3e1ec]">
                    {log.title}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="bg-[#ffb786]/10 text-[#ffb786] px-2 py-0.5 rounded text-[10px]">
                      {log.category || 'General'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#c2c6d6]">
                    <div>{log.date}</div>
                    {log.start_time && (
                      <div className="text-[10px] text-[#adc6ff] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeRange(log.start_time, log.end_time)}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#90909a]">
                    {log.location ? (
                      <span className="flex items-center gap-1 text-[#adc6ff]">
                        <MapPin className="w-3 h-3" />
                        {log.location}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#c2c6d6]">
                    {log.duration_hours ? `${log.duration_hours} hrs` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setEditingLog(log)}
                      className="p-1 text-[#adc6ff] hover:text-white transition-all cursor-pointer"
                      title="Edit Log"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteWorkLog(log.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                      title="Delete Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-semibold text-base text-[#e3e1ec]">Log Completed Work</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-[#90909a] font-mono block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Serviced printer in East Wing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#12131a] border border-[#33343c] rounded-lg px-3 py-2 text-[#e3e1ec]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#90909a] font-mono block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-lg px-3 py-2 text-[#e3e1ec]"
                  >
                    <option value="IT Ops">IT Ops</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#90909a] font-mono block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-lg px-3 py-2 text-[#e3e1ec]"
                  />
                </div>
              </div>

              {/* Time Fields */}
              <div className="p-3 bg-[#12131a] border border-[#292931] rounded-xl space-y-2">
                <div className="text-[11px] font-mono text-[#adc6ff] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Work Time Details (Optional for Weekly Work Plan)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[#90909a] font-mono block mb-1 text-[10px]">Start Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:05 AM"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-2 py-1.5 text-[#e3e1ec] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[#90909a] font-mono block mb-1 text-[10px]">Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="e.g. 0.37"
                      value={duration}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-2 py-1.5 text-[#e3e1ec] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[#90909a] font-mono block mb-1 text-[10px]">End Time (Auto)</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:27 AM"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-2 py-1.5 text-[#e3e1ec] font-mono"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => handleDurationChange(opt.val)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        duration === opt.val
                          ? 'bg-[#4d8eff]/20 text-[#adc6ff] border-[#4d8eff]/40'
                          : 'bg-[#1e1f26] text-[#90909a] hover:text-[#e3e1ec] border-[#292931]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[#90909a] font-mono block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Elementary School, Lab A..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-lg px-3 py-2 text-[#e3e1ec]"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {locationShortcuts.slice(0, 6).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          location === loc
                            ? 'bg-[#4d8eff]/20 text-[#adc6ff] border-[#4d8eff]/40'
                            : 'bg-[#12131a] text-[#90909a] hover:text-[#e3e1ec] border-[#292931]'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setActiveRoutineId(null);
                  }}
                  className="px-3 py-2 rounded-lg text-[#90909a] hover:bg-[#292931]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4d8eff] text-white font-semibold rounded-lg"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-semibold text-base text-[#e3e1ec]">Edit Work Log #{editingLog.id}</h3>
            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="text-[#90909a] font-mono block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingLog.title}
                  onChange={(e) => setEditingLog({ ...editingLog, title: e.target.value })}
                  className="w-full bg-[#12131a] border border-[#33343c] rounded-lg px-3 py-2 text-[#e3e1ec]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#90909a] font-mono block mb-1">Category</label>
                  <input
                    type="text"
                    value={editingLog.category || ''}
                    onChange={(e) => setEditingLog({ ...editingLog, category: e.target.value })}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-lg px-3 py-2 text-[#e3e1ec]"
                  />
                </div>
                <div>
                  <label className="text-[#90909a] font-mono block mb-1">Date</label>
                  <input
                    type="date"
                    value={editingLog.date}
                    onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-lg px-3 py-2 text-[#e3e1ec]"
                  />
                </div>
              </div>

              {/* Time Fields in Edit Modal */}
              <div className="p-3 bg-[#12131a] border border-[#292931] rounded-xl space-y-2">
                <div className="text-[11px] font-mono text-[#adc6ff] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Work Time Details</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[#90909a] font-mono block mb-1 text-[10px]">Start Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:05 AM"
                      value={editingLog.start_time || ''}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        const durHours = typeof editingLog.duration_hours === 'number' ? editingLog.duration_hours : 0;
                        const computedEnd = (newStart && durHours > 0) ? calculateEndTime(newStart, durHours) : editingLog.end_time;
                        setEditingLog({
                          ...editingLog,
                          start_time: newStart,
                          end_time: computedEnd || editingLog.end_time,
                        });
                      }}
                      className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-2 py-1.5 text-[#e3e1ec] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[#90909a] font-mono block mb-1 text-[10px]">Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="e.g. 0.37"
                      value={editingLog.duration_hours ?? 1.0}
                      onChange={(e) => {
                        const newDur = parseFloat(e.target.value) || 0;
                        const computedEnd = (editingLog.start_time && newDur > 0) ? calculateEndTime(editingLog.start_time, newDur) : editingLog.end_time;
                        setEditingLog({
                          ...editingLog,
                          duration_hours: newDur,
                          end_time: computedEnd || editingLog.end_time,
                        });
                      }}
                      className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-2 py-1.5 text-[#e3e1ec] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[#90909a] font-mono block mb-1 text-[10px]">End Time (Auto)</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:27 AM"
                      value={editingLog.end_time || ''}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        const computedDur = (editingLog.start_time && newEnd) ? calculateDurationHours(editingLog.start_time, newEnd) : editingLog.duration_hours;
                        setEditingLog({
                          ...editingLog,
                          end_time: newEnd,
                          duration_hours: computedDur ?? editingLog.duration_hours,
                        });
                      }}
                      className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-2 py-1.5 text-[#e3e1ec] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[#90909a] font-mono block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bldg B"
                    value={editingLog.location || ''}
                    onChange={(e) => setEditingLog({ ...editingLog, location: e.target.value })}
                    className="w-full bg-[#12131a] border border-[#33343c] rounded-lg px-3 py-2 text-[#e3e1ec]"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {locationShortcuts.slice(0, 6).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setEditingLog({ ...editingLog, location: loc })}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          editingLog.location === loc
                            ? 'bg-[#4d8eff]/20 text-[#adc6ff] border-[#4d8eff]/40'
                            : 'bg-[#12131a] text-[#90909a] hover:text-[#e3e1ec] border-[#292931]'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-3 py-2 rounded-lg text-[#90909a] hover:bg-[#292931]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4d8eff] text-white font-semibold rounded-lg"
                >
                  Update Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routine Task Manager Modal */}
      <RoutineManagerModal
        isOpen={showRoutineModal}
        onClose={() => setShowRoutineModal(false)}
      />
    </div>
  );
};
