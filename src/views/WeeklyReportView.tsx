import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  Calendar,
  Tag,
  ListTodo,
  FileText,
  MapPin,
  Download,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportToCSV } from '../utils/csvExport';

export const WeeklyReportView: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const { workLogs, plannedItems, fetchWorkLogs, fetchPlannedItems } = useStore();

  useEffect(() => {
    fetchWorkLogs();
    fetchPlannedItems();
  }, []);

  // Compute Monday-Sunday date range for weekOffset
  const getWeekBounds = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + distanceToMonday + offset * 7
    );
    const sunday = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + 6
    );

    const formatISO = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const formatReadable = (d: Date) => {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return {
      monday,
      sunday,
      mondayStr: formatISO(monday),
      sundayStr: formatISO(sunday),
      readableRange: `${formatReadable(monday)} – ${formatReadable(sunday)}`,
    };
  };

  const { mondayStr, sundayStr, readableRange } = getWeekBounds(weekOffset);

  // Filter records within Monday - Sunday date scope
  const weekLogs = workLogs.filter(
    (log) => log.date >= mondayStr && log.date <= sundayStr
  );
  const weekPlanned = plannedItems.filter(
    (item) => item.date >= mondayStr && item.date <= sundayStr
  );

  // Aggregated Metrics
  const totalHours = weekLogs.reduce(
    (sum, log) => sum + (log.duration_hours || 0),
    0
  );
  const totalLogsCount = weekLogs.length;

  const totalPlannedCount = weekPlanned.length;
  const completedPlannedCount = weekPlanned.filter(
    (item) => item.status === 'done'
  ).length;
  const dismissedPlannedCount = weekPlanned.filter(
    (item) => item.status === 'dismissed'
  ).length;
  const stillPlannedCount = weekPlanned.filter(
    (item) => item.status === 'planned'
  ).length;

  const completionRate =
    totalPlannedCount > 0
      ? Math.round((completedPlannedCount / totalPlannedCount) * 100)
      : 0;

  // Category Breakdown
  const categoryMap = new Map<
    string,
    { category: string; hours: number; count: number }
  >();
  weekLogs.forEach((log) => {
    const cat = log.category || 'IT Ops';
    const existing = categoryMap.get(cat) || { category: cat, hours: 0, count: 0 };
    existing.hours += log.duration_hours || 0;
    existing.count += 1;
    categoryMap.set(cat, existing);
  });
  const categoryBreakdown = Array.from(categoryMap.values());

  // Completed Work Items
  const completedLogs = weekLogs.filter(
    (log) => log.status === 'completed' || !log.status
  );
  const completedPlans = weekPlanned.filter((item) => item.status === 'done');

  // Copy Markdown Report
  const handleCopyMarkdown = async () => {
    const lines: string[] = [];
    lines.push(`# Weekly Work Report`);
    lines.push(``);
    lines.push(`**Week:** ${readableRange} (${mondayStr} to ${sundayStr})`);
    lines.push(``);
    lines.push(`## Summary`);
    lines.push(`- **Total Hours Logged:** ${totalHours.toFixed(1)} hrs`);
    lines.push(`- **Work Logs:** ${totalLogsCount}`);
    lines.push(`- **Planned Items:** ${totalPlannedCount}`);
    lines.push(`- **Completed Items:** ${completedPlannedCount}`);
    lines.push(`- **Completion Rate:** ${completionRate}%`);
    lines.push(``);
    lines.push(`## Work by Category`);
    if (categoryBreakdown.length === 0) {
      lines.push(`*No work logged for this week.*`);
    } else {
      lines.push(`| Category | Hours | Log Count |`);
      lines.push(`| --- | --- | --- |`);
      categoryBreakdown.forEach((c) => {
        lines.push(`| ${c.category} | ${c.hours.toFixed(1)} hrs | ${c.count} |`);
      });
    }
    lines.push(``);
    lines.push(`## Completed Work`);
    if (completedLogs.length === 0 && completedPlans.length === 0) {
      lines.push(`*No completed work items recorded for this week.*`);
    } else {
      if (completedLogs.length > 0) {
        lines.push(`### Work Logs`);
        completedLogs.forEach((log) => {
          lines.push(
            `- **${log.title}** (${log.category || 'IT Ops'}, ${log.date}) - ${log.duration_hours || 0} hrs${log.location ? ` @ ${log.location}` : ''}`
          );
        });
      }
      if (completedPlans.length > 0) {
        lines.push(`### Completed Planned Items`);
        completedPlans.forEach((plan) => {
          lines.push(
            `- **${plan.title}** (${plan.category || 'IT Ops'}, ${plan.date})`
          );
        });
      }
    }

    const markdownText = lines.join('\n');
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      alert('Failed to copy to clipboard: ' + (err as Error).message);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Type',
      'ID',
      'Title',
      'Category',
      'Location',
      'Duration (Hours)',
      'Date',
      'Status',
      'Notes',
    ];

    const logRows = weekLogs.map((log) => [
      'Work Log',
      log.id ?? '',
      log.title ?? '',
      log.category ?? 'IT Ops',
      log.location ?? '',
      log.duration_hours ?? 0,
      log.date ?? '',
      log.status ?? 'completed',
      log.description ?? '',
    ]);

    const planRows = weekPlanned.map((plan) => [
      'Planned Item',
      plan.id ?? '',
      plan.title ?? '',
      plan.category ?? 'IT Ops',
      '',
      '',
      plan.date ?? '',
      plan.status ?? 'planned',
      plan.description ?? '',
    ]);

    const rows = [...logRows, ...planRows];
    exportToCSV(`weekly_report_${mondayStr}_to_${sundayStr}.csv`, headers, rows);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header & Week Control Bar */}
      <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4d8eff]/10 text-[#adc6ff] rounded-xl border border-[#4d8eff]/20 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#e3e1ec]">Weekly Operational Report</h1>
              <p className="text-xs text-[#90909a] font-mono mt-0.5">
                Calculated strictly from verified WorkLogs and PlannedItems ({mondayStr} – {sundayStr})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-xl border border-[#292931] bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] hover:text-[#e3e1ec] transition-all cursor-pointer shadow-sm"
              title="Export weekly records to CSV"
            >
              <Download className="w-4 h-4 text-[#adc6ff]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-xl border transition-all cursor-pointer shadow-sm ${
                copySuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#4d8eff] hover:bg-[#3b7be8] text-white border-transparent'
              }`}
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Markdown!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Markdown Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Week Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#292931]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] rounded-lg border border-[#292931] transition-all cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
                weekOffset === 0
                  ? 'bg-[#4d8eff]/20 text-[#adc6ff] border-[#4d8eff]'
                  : 'bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] border-[#292931]'
              }`}
            >
              Current Week
            </button>

            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 bg-[#12131a] hover:bg-[#292931] text-[#c2c6d6] rounded-lg border border-[#292931] transition-all cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#adc6ff] bg-[#12131a] px-3 py-1.5 rounded-lg border border-[#292931]">
            <Calendar className="w-4 h-4 text-[#4d8eff]" />
            <span className="font-semibold">{readableRange}</span>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#90909a]">
            <span>Total Hours Logged</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#e3e1ec]">
            {totalHours.toFixed(1)} <span className="text-xs font-normal text-[#90909a]">hrs</span>
          </div>
          <div className="text-[10px] font-mono text-[#90909a]">
            Across {totalLogsCount} work log {totalLogsCount === 1 ? 'entry' : 'entries'}
          </div>
        </div>

        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#90909a]">
            <span>Total Planned Items</span>
            <ListTodo className="w-4 h-4 text-[#adc6ff]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#e3e1ec]">
            {totalPlannedCount}
          </div>
          <div className="text-[10px] font-mono text-[#90909a]">
            {stillPlannedCount} still planned, {dismissedPlannedCount} dismissed
          </div>
        </div>

        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#90909a]">
            <span>Completed Items</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#e3e1ec]">
            {completedPlannedCount}
          </div>
          <div className="text-[10px] font-mono text-[#90909a]">
            Completed from plan
          </div>
        </div>

        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#90909a]">
            <span>Completion Rate</span>
            <BarChart2 className="w-4 h-4 text-[#ffb786]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#e3e1ec]">
            {completionRate}%
          </div>
          <div className="text-[10px] font-mono text-[#90909a]">
            {totalPlannedCount === 0 ? 'No planned items this week' : `${completedPlannedCount} of ${totalPlannedCount} tasks completed`}
          </div>
        </div>
      </div>

      {/* Main Content Sections: Category Breakdown & Completed Work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Table */}
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#e3e1ec] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#adc6ff]" />
              <span>Category Breakdown</span>
            </h3>
            <span className="text-xs font-mono text-[#90909a] bg-[#12131a] px-2 py-0.5 rounded border border-[#292931]">
              {categoryBreakdown.length} {categoryBreakdown.length === 1 ? 'Category' : 'Categories'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#292931] text-[11px] font-mono text-[#90909a] uppercase">
                  <th className="pb-2.5 font-medium">Category</th>
                  <th className="pb-2.5 font-medium text-right">Hours</th>
                  <th className="pb-2.5 font-medium text-right">Log Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292931] text-xs font-mono">
                {categoryBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[#90909a]">
                      No work logged for this week.
                    </td>
                  </tr>
                ) : (
                  categoryBreakdown.map((cat) => (
                    <tr key={cat.category} className="hover:bg-[#12131a]/50">
                      <td className="py-3 font-medium text-[#e3e1ec]">
                        <span className="px-2 py-0.5 rounded bg-[#4d8eff]/10 text-[#adc6ff] border border-[#4d8eff]/20">
                          {cat.category}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[#e3e1ec]">
                        {cat.hours.toFixed(1)} hrs
                      </td>
                      <td className="py-3 text-right text-[#90909a]">
                        {cat.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Planned Items Status Overview */}
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#e3e1ec] flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-[#ffb786]" />
              <span>Planned Items Status</span>
            </h3>
            <span className="text-xs font-mono text-[#90909a] bg-[#12131a] px-2 py-0.5 rounded border border-[#292931]">
              Total: {totalPlannedCount}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 bg-[#12131a] border border-[#292931] rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[#e3e1ec]">Completed Tasks</span>
              </div>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {completedPlannedCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#12131a] border border-[#292931] rounded-xl">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#adc6ff]" />
                <span className="text-[#e3e1ec]">Still Planned</span>
              </div>
              <span className="font-bold text-[#adc6ff] bg-[#4d8eff]/10 px-2 py-0.5 rounded border border-[#4d8eff]/20">
                {stillPlannedCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#12131a] border border-[#292931] rounded-xl">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#90909a]" />
                <span className="text-[#e3e1ec]">Dismissed Tasks</span>
              </div>
              <span className="font-bold text-[#90909a] bg-[#1e1f26] px-2 py-0.5 rounded border border-[#292931]">
                {dismissedPlannedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Work / Achievements List */}
      <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-[#e3e1ec] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Completed Work & Verified Activity</span>
          </h3>
          <span className="text-xs font-mono text-[#90909a] bg-[#12131a] px-2 py-0.5 rounded border border-[#292931]">
            {completedLogs.length + completedPlans.length} Total Items
          </span>
        </div>

        {completedLogs.length === 0 && completedPlans.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#292931] rounded-xl bg-[#12131a]/50 font-mono text-xs text-[#90909a]">
            No completed work logs or planned tasks for this week.
          </div>
        ) : (
          <div className="space-y-2">
            {completedLogs.map((log) => (
              <div
                key={`log-${log.id}`}
                className="p-3 bg-[#12131a] border border-[#292931] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#e3e1ec]">{log.title}</span>
                    <span className="text-[10px] font-mono text-[#adc6ff] bg-[#4d8eff]/10 px-1.5 py-0.2 rounded border border-[#4d8eff]/20">
                      {log.category || 'IT Ops'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[#90909a]">
                    <span>Date: {log.date}</span>
                    {log.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#adc6ff]" />
                        {log.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {log.duration_hours || 0} hrs
                  </span>
                </div>
              </div>
            ))}

            {completedPlans.map((plan) => (
              <div
                key={`plan-${plan.id}`}
                className="p-3 bg-[#12131a] border border-[#292931] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#e3e1ec]">{plan.title}</span>
                    <span className="text-[10px] font-mono text-[#ffb786] bg-[#ffb786]/10 px-1.5 py-0.2 rounded border border-[#ffb786]/20">
                      {plan.category || 'IT Ops'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#90909a]">
                    Planned Date: {plan.date} (Source: {plan.source})
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Completed Plan
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

