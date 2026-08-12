import React, { useEffect } from 'react';
import { QuickCaptureBar } from '../components/QuickCapture/QuickCaptureBar';
import { TodayFocus } from '../components/Dashboard/TodayFocus';
import { PendingActions } from '../components/Dashboard/PendingActions';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { useStore } from '../store/useStore';
import { Clock, Calendar, Sparkles } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    pendingSuggestions,
    plannedItems,
    workLogs,
    fetchPendingSuggestions,
    fetchPlannedItems,
    fetchWorkLogs,
  } = useStore();

  useEffect(() => {
    fetchPendingSuggestions();
    fetchPlannedItems();
    fetchWorkLogs();
  }, []);

  const formatYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatYYYYMMDD(new Date());

  const todayWorkLogs = workLogs.filter((log) => log.date === todayStr);
  const todayHours = todayWorkLogs.reduce((sum, log) => sum + (log.duration_hours || 0), 0);

  const todayPlanned = plannedItems.filter((item) => item.date === todayStr);
  const todayPlannedCount = todayPlanned.length;
  const todayPlannedCompleted = todayPlanned.filter((item) => item.status === 'done').length;

  const pendingCount = pendingSuggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Quick Capture Prominent Section */}
      <QuickCaptureBar />

      {/* Live KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Hours Logged Today */}
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#90909a] font-medium">Hours Logged Today</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#e3e1ec]">
              {todayHours.toFixed(1)} <span className="text-sm font-normal text-[#90909a]">hrs</span>
            </div>
            <div className="text-[11px] font-mono text-[#90909a] mt-1">
              {todayWorkLogs.length} {todayWorkLogs.length === 1 ? 'log entry' : 'log entries'}
            </div>
          </div>
        </div>

        {/* Card 2: Planned Items Today */}
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#90909a] font-medium">Planned Items Today</span>
            <div className="p-2 bg-[#4d8eff]/10 text-[#adc6ff] rounded-xl border border-[#4d8eff]/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#e3e1ec]">
              {todayPlannedCount}
            </div>
            <div className="text-[11px] font-mono text-[#90909a] mt-1">
              {todayPlannedCompleted} completed
            </div>
          </div>
        </div>

        {/* Card 3: Pending Actions */}
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#90909a] font-medium">Pending Actions</span>
            <div className="p-2 bg-[#ffb786]/10 text-[#ffb786] rounded-xl border border-[#ffb786]/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[#e3e1ec]">
              {pendingCount}
            </div>
            <div className="text-[11px] font-mono text-[#90909a] mt-1">
              {pendingCount === 1 ? '1 suggestion awaiting review' : `${pendingCount} suggestions awaiting review`}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Pending Actions & Today Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingActions suggestions={pendingSuggestions} />
        <TodayFocus items={todayPlanned} />
      </div>

      {/* Recent Activity Section */}
      <RecentActivity logs={workLogs} />
    </div>
  );
};

