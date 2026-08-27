import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, FileText, Target, ListTodo, Video, Plus, Trash2, Edit2, Check, Sparkles, Printer, Copy, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useRoutineStore } from '../store/useRoutineStore';
import { useWeeklyWorkPlanStore } from '../store/useWeeklyWorkPlanStore';
import { PlannedItem, WorkLog } from '../types';
import { getSunThuWeekDays, getSunThuWeekRange, formatTimeRange } from '../utils/weekUtils';

const TIME_SLOTS = [
  { label: '07:30 AM', value: '07:30' },
  { label: '08:00 AM', value: '08:00' },
  { label: '08:30 AM', value: '08:30' },
  { label: '09:00 AM', value: '09:00' },
  { label: '09:30 AM', value: '09:30' },
  { label: '10:00 AM', value: '10:00' },
  { label: '10:30 AM', value: '10:30' },
  { label: '11:00 AM', value: '11:00' },
  { label: '11:30 AM', value: '11:30' },
  { label: '12:00 PM', value: '12:00' },
  { label: '12:30 PM', value: '12:30' },
  { label: '01:00 PM', value: '13:00' },
  { label: '01:30 PM', value: '13:30' },
  { label: '02:00 PM', value: '14:00' },
  { label: '02:30 PM', value: '14:30' },
  { label: '03:00 PM', value: '15:00' },
  { label: '03:30 PM', value: '15:30' },
];

export interface AggregatedWorkItem {
  id: string;
  title: string;
  category: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  isCompleted: boolean;
  itemType: 'planned' | 'logged' | 'combined';
  plannedItem?: PlannedItem;
  workLog?: WorkLog;
  durationHours?: number;
  location?: string;
}

export function getCategoryStyle(category?: string) {
  const cat = (category || 'IT Ops').toLowerCase();
  if (cat.includes('it op') || cat.includes('it')) {
    return {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      accent: 'bg-blue-500',
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      printBg: '#eff6ff',
      printText: '#1e40af',
      printBorder: '#bfdbfe',
    };
  }
  if (cat.includes('maint') || cat.includes('repair')) {
    return {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      accent: 'bg-amber-500',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      printBg: '#fef3c7',
      printText: '#92400e',
      printBorder: '#fde68a',
    };
  }
  if (cat.includes('infr') || cat.includes('network') || cat.includes('server')) {
    return {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      accent: 'bg-purple-500',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      printBg: '#f3e8ff',
      printText: '#6b21a8',
      printBorder: '#e9d5ff',
    };
  }
  if (cat.includes('hard') || cat.includes('device') || cat.includes('laptop')) {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      accent: 'bg-emerald-500',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      printBg: '#d1fae5',
      printText: '#065f46',
      printBorder: '#a7f3d0',
    };
  }
  if (cat.includes('sec') || cat.includes('admin')) {
    return {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      accent: 'bg-rose-500',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      printBg: '#ffe4e6',
      printText: '#9f1239',
      printBorder: '#fecdd3',
    };
  }
  return {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    accent: 'bg-indigo-500',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    printBg: '#e0e7ff',
    printText: '#3730a3',
    printBorder: '#c7d2fe',
  };
}


export function getPrintDarkTheme(category?: string) {
  const cat = (category || 'IT Ops').toLowerCase();
  if (cat.includes('it op') || cat.includes('it')) {
    return { text: '#93c5fd', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.45)' };
  }
  if (cat.includes('infr') || cat.includes('network') || cat.includes('server')) {
    return { text: '#c4b5fd', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.45)' };
  }
  if (cat.includes('hard') || cat.includes('device') || cat.includes('laptop')) {
    return { text: '#6ee7b7', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.45)' };
  }
  if (cat.includes('maint') || cat.includes('repair')) {
    return { text: '#fcd34d', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.45)' };
  }
  if (cat.includes('sec') || cat.includes('admin')) {
    return { text: '#fda4af', bg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.45)' };
  }
  return { text: '#a5b4fc', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.45)' };
}

function timeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim().toUpperCase();
  if (!trimmed) return null;

  const isPM = trimmed.includes('PM');
  const isAM = trimmed.includes('AM');

  const cleanStr = trimmed.replace(/[^\d:]/g, '');
  const parts = cleanStr.split(':');
  if (parts.length < 2) return null;

  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

function extractTimesFromText(text?: string): { startTime?: string; endTime?: string } {
  if (!text) return {};
  const timeRangeRegex = /\b(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)?\s*(?:-|to|–)\s*(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)?\b/i;
  const rangeMatch = text.match(timeRangeRegex);
  if (rangeMatch) {
    const sH = rangeMatch[1];
    const sM = rangeMatch[2];
    const sAmpm = rangeMatch[3] || '';
    const eH = rangeMatch[4];
    const eM = rangeMatch[5];
    const eAmpm = rangeMatch[6] || sAmpm;
    return {
      startTime: `${sH}:${sM}${sAmpm ? ' ' + sAmpm : ''}`,
      endTime: `${eH}:${eM}${eAmpm ? ' ' + eAmpm : ''}`,
    };
  }

  const singleTimeRegex = /\b(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)?\b/i;
  const singleMatch = text.match(singleTimeRegex);
  if (singleMatch) {
    return {
      startTime: singleMatch[0],
    };
  }

  return {};
}

function isTitleMatch(t1: string, t2: string): boolean {
  if (!t1 || !t2) return false;
  const n1 = t1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n2 = t2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.startsWith(n2.slice(0, 8)) || n2.startsWith(n1.slice(0, 8))) {
    if (Math.abs(n1.length - n2.length) <= 5) return true;
  }
  return false;
}

export const WeeklyWorkPlanView: React.FC = () => {
  const { plannedItems, fetchPlannedItems, workLogs, fetchWorkLogs } = useStore();
  const { routines } = useRoutineStore();
  const {
    getWeekData,
    setWeekGoal,
    addNextWeekTask,
    removeNextWeekTask,
    updateNextWeekTask,
    addVideoObservation,
    removeVideoObservation,
    updateVideoObservation,
  } = useWeeklyWorkPlanStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showAddVideoObsForm, setShowAddVideoObsForm] = useState(false);

  // Inputs for adding new items
  const [newNextWeekTaskInput, setNewNextWeekTaskInput] = useState('');
  const [newVideoObsInput, setNewVideoObsInput] = useState('');

  // Inline editing indices
  const [editingNextWeekIdx, setEditingNextWeekIdx] = useState<number | null>(null);
  const [editingNextWeekVal, setEditingNextWeekVal] = useState('');

  const [editingObsIdx, setEditingObsIdx] = useState<number | null>(null);
  const [editingObsVal, setEditingObsVal] = useState('');

  // Calculate Sunday-Thursday days for current week offset
  const weekDays = getSunThuWeekDays(weekOffset);
  const { weekStart, weekEnd } = getSunThuWeekRange(undefined, weekOffset);

  // Fetch current week metadata
  const currentWeekMeta = getWeekData(weekStart);
  const hasVideoObs = currentWeekMeta.videoObservations.length > 0;
  const hasGoal = Boolean(currentWeekMeta.weekGoal && currentWeekMeta.weekGoal.trim().length > 0);

  useEffect(() => {
    fetchPlannedItems();
    fetchWorkLogs();
  }, [fetchPlannedItems, fetchWorkLogs, weekOffset]);

  const handlePrevWeek = () => setWeekOffset(prev => prev - 1);
  const handleNextWeek = () => setWeekOffset(prev => prev + 1);
  const handleTodayWeek = () => setWeekOffset(0);

  // دالة جديدة لطباعة التقرير بشكل احترافي عبر فتح نافذة جديدة وتوليد HTML
  // دالة جديدة لطباعة التقرير باستخدام Iframe (بدون نافذة منبثقة)
  const handlePrint = () => {
    // Build the schedule grid rows for the print/PDF document
    let tableRows = '';
    TIME_SLOTS.forEach(slot => {
      tableRows += `<tr>`;
      tableRows += `<td class="time-cell">${slot.label}</td>`;
      weekDays.forEach(day => {
        const items = getItemsForSlot(day.dateStr, slot.value);
        let cellContent = '';
        items.forEach(item => {
          const startMins = timeToMinutes(item.startTime);
          const slotMins = timeToMinutes(slot.value);
          const isStarting = startMins !== null && slotMins !== null && startMins >= slotMins && startMins < slotMins + 30;

          if (isStarting) {
            const theme = getPrintDarkTheme(item.category);
            const statusClass = item.isCompleted ? 'completed' : 'planned';
            const timeRange = formatTimeRange(item.startTime, item.endTime);

            cellContent += `
              <div class="task-card ${statusClass}">
                <div class="task-card-top">
                  <span class="task-title">${item.isCompleted ? '<span class="check-mark">&check;</span> ' : ''}${item.title}</span>
                  <span class="category-pill" style="background:${theme.bg}; color:${theme.text}; border:1px solid ${theme.border};">${item.category}</span>
                </div>
                <div class="task-meta-row">
                  ${timeRange ? `<span class="task-time">${timeRange}</span>` : ''}
                  ${item.durationHours ? `<span class="task-duration">${item.durationHours}h logged</span>` : ''}
                  ${item.location ? `<span class="task-location">${item.location}</span>` : ''}
                </div>
                ${item.description ? `<div class="task-desc">${item.description}</div>` : ''}
              </div>
            `;
          }
        });
        tableRows += `<td class="day-cell">${cellContent || ''}</td>`;
      });
      tableRows += `</tr>`;
    });

    // Additional / unscheduled items grouped by day, so nothing that appears
    // in the on-screen grid silently disappears from the printed report.
    let unscheduledSection = '';
    if (totalUnscheduledCount > 0) {
      let cols = '';
      weekDays.forEach(day => {
        const items = getUnscheduledItems(day.dateStr);
        if (items.length === 0) return;
        let cards = '';
        items.forEach(item => {
          const theme = getPrintDarkTheme(item.category);
          const statusClass = item.isCompleted ? 'completed' : 'planned';
          cards += `
            <div class="task-card compact ${statusClass}">
              <div class="task-card-top">
                <span class="task-title">${item.isCompleted ? '<span class="check-mark">&check;</span> ' : ''}${item.title}</span>
                <span class="category-pill" style="background:${theme.bg}; color:${theme.text}; border:1px solid ${theme.border};">${item.category}</span>
              </div>
              ${item.durationHours ? `<div class="task-meta-row"><span class="task-duration">${item.durationHours}h logged</span></div>` : ''}
            </div>
          `;
        });
        cols += `
          <div class="unscheduled-col">
            <div class="unscheduled-col-title">${day.dayName}</div>
            ${cards}
          </div>
        `;
      });
      unscheduledSection = `
        <div class="section-block">
          <h3 class="section-title">Additional &amp; Unscheduled Items</h3>
          <div class="unscheduled-grid">${cols}</div>
        </div>
      `;
    }

    // KPI metrics
    const totalItemsCount = completedItemsCount + plannedItemsCount;
    const completionRate = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;
    const activeCategoriesCount = new Set(aggregatedWeekItems.map(i => i.category || 'General')).size;

    let statusTag = 'IN PROGRESS';
    if (weekOffset > 0) statusTag = 'UPCOMING';
    else if (weekOffset < 0) statusTag = 'ARCHIVED';
    else if (totalItemsCount > 0 && completionRate === 100) statusTag = 'COMPLETE';

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const rangeLabel = `${weekDays[0].dayName}, ${weekDays[0].monthName} ${weekDays[0].dayNum} \u2013 ${weekDays[4].dayName}, ${weekDays[4].monthName} ${weekDays[4].dayNum}`;

    const nextWeekItemsHtml = currentWeekMeta.nextWeekTasks.length > 0
      ? currentWeekMeta.nextWeekTasks.map(t => `<li>${t}</li>`).join('')
      : '<li class="empty-item">Nothing queued yet</li>';

    const videoObsHtml = hasVideoObs
      ? currentWeekMeta.videoObservations.map(v => `<li>${v}</li>`).join('')
      : '<li class="empty-item">No observations logged</li>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Weekly Work Plan - Print</title>
          <style>
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: A4 landscape;
              margin: 8mm 8mm 10mm 8mm;
              /* Standards-based running footer. Renders in paged-media engines
                 that support CSS @page margin boxes; browsers that ignore it
                 still get the in-flow .print-footer block below. */
              @bottom-left {
                content: "Official Weekly IT & Operational Report";
                font-size: 8px;
                color: #71717a;
              }
              @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 8px;
                color: #71717a;
              }
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #0f1117;
              color: #f4f4f5;
              font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            }

            /* ---------- Header ---------- */
            .doc-header {
              padding-bottom: 8px;
              margin-bottom: 10px;
              border-bottom: 1px solid #272730;
              page-break-inside: avoid;
            }
            .header-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 6px;
            }
            .badge {
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 0.08em;
              color: #60a5fa;
              background: rgba(96,165,250,0.12);
              border: 1px solid rgba(96,165,250,0.4);
              border-radius: 4px;
              padding: 3px 8px;
            }
            .status-tag {
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 0.06em;
              color: #34d399;
              background: rgba(52,211,153,0.12);
              border: 1px solid rgba(52,211,153,0.4);
              border-radius: 4px;
              padding: 3px 8px;
            }
            .doc-title {
              font-size: 20px;
              font-weight: 800;
              margin: 2px 0 4px 0;
              color: #ffffff;
              letter-spacing: -0.01em;
            }
            .doc-meta {
              font-size: 10.5px;
              color: #a1a1aa;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .doc-meta .divider { color: #3f3f46; }

            /* ---------- KPI bar ---------- */
            .kpi-bar {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              margin: 10px 0;
              page-break-inside: avoid;
            }
            .kpi-card {
              background: #181920;
              border: 1px solid #272730;
              border-radius: 8px;
              padding: 8px 10px;
            }
            .kpi-label {
              display: block;
              font-size: 8.5px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #a1a1aa;
              margin-bottom: 3px;
            }
            .kpi-value {
              display: block;
              font-size: 17px;
              font-weight: 800;
              color: #60a5fa;
            }

            /* ---------- Weekly focus banner ---------- */
            .focus-banner {
              background: #181920;
              border: 1px solid #272730;
              border-left: 4px solid #ffb74d;
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            .focus-label {
              display: block;
              font-size: 8.5px;
              font-weight: 700;
              letter-spacing: 0.06em;
              color: #ffb74d;
              margin-bottom: 2px;
            }
            .focus-text {
              margin: 0;
              font-size: 11.5px;
              color: #f4f4f5;
            }

            /* ---------- Schedule grid ---------- */
            table.schedule-grid {
              width: 100%;
              border-collapse: collapse;
              font-size: 9.5px;
              table-layout: fixed;
            }
            table.schedule-grid thead { display: table-header-group; }
            table.schedule-grid tbody { display: table-row-group; }
            table.schedule-grid tr { page-break-inside: avoid; }
            table.schedule-grid th {
              background: #181920;
              border: 1px solid #272730;
              padding: 6px;
              text-align: left;
              font-size: 10px;
            }
            table.schedule-grid th .day-date {
              display: block;
              font-weight: 400;
              font-size: 9px;
              color: #a1a1aa;
              margin-top: 1px;
            }
            table.schedule-grid td {
              border: 1px solid #272730;
              padding: 4px;
              vertical-align: top;
            }
            .time-cell {
              width: 62px;
              text-align: center;
              font-weight: 600;
              color: #a1a1aa;
              background: #14151b;
              white-space: nowrap;
            }
            .day-cell { min-width: 0; }

            /* ---------- Task cards ---------- */
            .task-card {
              border-radius: 6px;
              padding: 5px 6px;
              margin-bottom: 3px;
              page-break-inside: avoid;
            }
            .task-card.completed { background: #13221a; border: 1px solid #38a169; }
            .task-card.planned { background: #1a2333; border: 1px solid #4299e1; }
            .task-card-top {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 4px;
            }
            .task-title { font-size: 9.5px; font-weight: 600; color: #f4f4f5; }
            .check-mark { color: #4ade80; font-weight: 800; }
            .category-pill {
              font-size: 7.5px;
              font-weight: 700;
              letter-spacing: 0.03em;
              padding: 1px 5px;
              border-radius: 8px;
              white-space: nowrap;
              flex-shrink: 0;
            }
            .task-meta-row {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              margin-top: 3px;
              font-size: 8.5px;
              color: #a1a1aa;
            }
            .task-desc {
              margin-top: 3px;
              padding-top: 3px;
              border-top: 1px dashed #33343c;
              font-size: 8.5px;
              font-style: italic;
              color: #a1a1aa;
            }

            /* ---------- Unscheduled / additional items ---------- */
            .section-block { margin-top: 12px; page-break-inside: avoid; }
            .section-title {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #f4f4f5;
              margin: 0 0 6px 0;
            }
            .unscheduled-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
            }
            .unscheduled-col-title {
              font-size: 9px;
              font-weight: 700;
              color: #a1a1aa;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .task-card.compact { padding: 4px 5px; }

            /* ---------- Bottom summary (two-column) ---------- */
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 14px;
              page-break-inside: avoid;
            }
            .summary-box {
              background: #181920;
              border: 1px solid #272730;
              border-radius: 8px;
              padding: 10px 12px;
            }
            .summary-box h4 {
              margin: 0 0 6px 0;
              font-size: 10.5px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #60a5fa;
            }
            .summary-box ul { margin: 0; padding-left: 14px; }
            .summary-box li {
              font-size: 10px;
              color: #e4e4e7;
              margin-bottom: 4px;
              padding-left: 2px;
            }
            .summary-box li::marker { color: #60a5fa; }
            .summary-box li.empty-item { color: #71717a; font-style: italic; }

            /* ---------- In-flow footer fallback ----------
               @page margin boxes above are the spec-correct way to repeat a
               footer + "Page X of Y" on every sheet, but Chromium's print/PDF
               pipeline currently ignores @page margin-box content. This div
               guarantees the footer text is visible at least once, at the end
               of the document, in every browser. */
            .print-footer {
              margin-top: 10px;
              padding-top: 6px;
              border-top: 1px solid #272730;
              display: flex;
              justify-content: space-between;
              font-size: 8.5px;
              color: #71717a;
            }
          </style>
        </head>
        <body>
          <div class="doc-header">
            <div class="header-top">
              <span class="badge">OFFICIAL EXECUTIVE WORK PLAN</span>
              <span class="status-tag">${statusTag}</span>
            </div>
            <h1 class="doc-title">Malak's Weekly Work &amp; Operational Plan</h1>
            <div class="doc-meta">
              <span>${rangeLabel}</span>
              <span class="divider">&bull;</span>
              <span>Generated ${dateStr}</span>
            </div>
          </div>

          <div class="kpi-bar">
            <div class="kpi-card"><span class="kpi-label">Total Logged Hours</span><span class="kpi-value">${totalLoggedHours.toFixed(1)}h</span></div>
            <div class="kpi-card"><span class="kpi-label">Completed Tasks</span><span class="kpi-value">${completedItemsCount}</span></div>
            <div class="kpi-card"><span class="kpi-label">Planned Tasks</span><span class="kpi-value">${plannedItemsCount}</span></div>
            <div class="kpi-card"><span class="kpi-label">Completion Rate</span><span class="kpi-value">${completionRate}%</span></div>
            <div class="kpi-card"><span class="kpi-label">Active Categories</span><span class="kpi-value">${activeCategoriesCount}</span></div>
          </div>

          ${hasGoal ? `
          <div class="focus-banner">
            <span class="focus-label">WEEKLY FOCUS</span>
            <p class="focus-text">${currentWeekMeta.weekGoal}</p>
          </div>` : ''}

          <table class="schedule-grid">
            <thead>
              <tr>
                <th>Time</th>
                ${weekDays.map(d => `<th>${d.dayName}<span class="day-date">${d.monthName} ${d.dayNum}</span></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          ${unscheduledSection}

          <div class="summary-grid">
            <div class="summary-box">
              <h4>Things To Do Next Week</h4>
              <ul>${nextWeekItemsHtml}</ul>
            </div>
            <div class="summary-box">
              <h4>Video Observations &amp; Notes</h4>
              <ul>${videoObsHtml}</ul>
            </div>
          </div>

          <div class="print-footer">
            <span>Official Weekly IT &amp; Operational Report</span>
            <span>Generated via WorkPilot IT Engineering Ops</span>
          </div>
        </body>
      </html>
    `;

    // Render into a hidden iframe (avoids popup blockers) and trigger print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 500);
    }
  };

  // Build aggregated work items combining PlannedItems and WorkLogs
  const weekDateStrs = new Set(weekDays.map(d => d.dateStr));
  const relevantPlanned = plannedItems.filter(p => weekDateStrs.has(p.date));
  const relevantWorkLogs = workLogs.filter(w => weekDateStrs.has(w.date));

  const usedWorkLogIds = new Set<number>();
  const aggregatedWeekItems: AggregatedWorkItem[] = [];

  // 1. Process PlannedItems and associate with matching WorkLogs
  relevantPlanned.forEach(p => {
    let matchedLog: WorkLog | undefined = undefined;

    if (p.work_log_id) {
      matchedLog = relevantWorkLogs.find(w => w.id === p.work_log_id);
    }
    if (!matchedLog) {
      matchedLog = relevantWorkLogs.find(
        w => !usedWorkLogIds.has(w.id) && w.date === p.date && isTitleMatch(p.title, w.title)
      );
    }

    if (matchedLog) {
      usedWorkLogIds.add(matchedLog.id);
      const timeExt = extractTimesFromText(`${matchedLog.title} ${matchedLog.description || ''}`);
      const sTime = p.start_time || matchedLog.start_time || timeExt.startTime;
      const eTime = p.end_time || matchedLog.end_time || timeExt.endTime;
      aggregatedWeekItems.push({
        id: `c-${p.id}-${matchedLog.id}`,
        title: p.title || matchedLog.title,
        category: p.category || matchedLog.category || 'IT Ops',
        date: p.date,
        startTime: sTime,
        endTime: eTime,
        description: matchedLog.description || p.description,
        isCompleted: true,
        itemType: 'combined',
        plannedItem: p,
        workLog: matchedLog,
        durationHours: matchedLog.duration_hours,
        location: matchedLog.location,
      });
    } else {
      aggregatedWeekItems.push({
        id: `p-${p.id}`,
        title: p.title,
        category: p.category || 'IT Ops',
        date: p.date,
        startTime: p.start_time,
        endTime: p.end_time,
        description: p.description,
        isCompleted: p.status === 'done',
        itemType: 'planned',
        plannedItem: p,
      });
    }
  });

  // 2. Process standalone WorkLogs not linked to PlannedItems
  relevantWorkLogs.forEach(w => {
    if (!usedWorkLogIds.has(w.id)) {
      const timeExt = extractTimesFromText(`${w.title} ${w.description || ''}`);
      const sTime = w.start_time || timeExt.startTime;
      const eTime = w.end_time || timeExt.endTime;
      aggregatedWeekItems.push({
        id: `w-${w.id}`,
        title: w.title,
        category: w.category || 'General',
        date: w.date,
        startTime: sTime,
        endTime: eTime,
        description: w.description,
        isCompleted: true,
        itemType: 'logged',
        workLog: w,
        durationHours: w.duration_hours,
        location: w.location,
      });
    }
  });

  // Get items for a specific date and time slot
  const getItemsForSlot = (dateStr: string, slotValue: string) => {
    const slotMins = timeToMinutes(slotValue);
    if (slotMins === null) return [];
    const slotEndMins = slotMins + 30;

    return aggregatedWeekItems.filter(item => {
      if (item.date !== dateStr) return false;
      const startMins = timeToMinutes(item.startTime);
      if (startMins === null) return false;

      let endMins = timeToMinutes(item.endTime);
      if (endMins === null || endMins <= startMins) {
        const durHours = item.durationHours || 0.5;
        endMins = startMins + Math.max(15, Math.round(durHours * 60));
      }

      return slotMins < endMins && slotEndMins > startMins;
    });
  };

  // Get unscheduled items
  const getUnscheduledItems = (dateStr: string) => {
    return aggregatedWeekItems.filter(
      item => item.date === dateStr && (!item.startTime || item.startTime.trim() === '')
    );
  };

  const totalUnscheduledCount = weekDays.reduce(
    (sum, d) => sum + getUnscheduledItems(d.dateStr).length,
    0
  );

  // Generate clean text and HTML representation for copy action
  const generateReportData = () => {
    let plain = `MALAK'S WEEKLY WORK PLAN\n`;
    plain += `Week of: ${weekStart} to ${weekEnd}\n`;
    plain += `----------------------------------------\n`;
    if (hasGoal) {
      plain += `WEEK GOAL: ${currentWeekMeta.weekGoal}\n`;
      plain += `----------------------------------------\n`;
    }
    plain += `SCHEDULE GRID (7:30 AM - 3:30 PM):\n\n`;

    weekDays.forEach(day => {
      plain += `[ ${day.dayName.toUpperCase()} - ${day.monthName} ${day.dayNum} ]\n`;
      TIME_SLOTS.forEach(slot => {
        const items = getItemsForSlot(day.dateStr, slot.value);
        if (items.length > 0) {
          items.forEach(item => {
            const startMins = timeToMinutes(item.startTime);
            const slotMins = timeToMinutes(slot.value);
            const isFirst = startMins !== null && slotMins !== null && startMins >= slotMins && startMins < slotMins + 30;
            if (isFirst) {
              const statusTag = item.isCompleted ? '✓ Completed' : 'Planned';
              const timeRange = formatTimeRange(item.startTime, item.endTime);
              const durationStr = item.durationHours ? ` (${item.durationHours}h logged)` : '';
              const locStr = item.location ? ` @ ${item.location}` : '';
              plain += `  • [${statusTag}] ${slot.label}: ${item.title} (${item.category})${timeRange ? ' [' + timeRange + ']' : ''}${durationStr}${locStr}\n`;
              if (item.description) plain += `    Note: ${item.description}\n`;
            }
          });
        }
      });

      const unscheduled = getUnscheduledItems(day.dateStr);
      if (unscheduled.length > 0) {
        plain += `  Unscheduled & Logged Day Tasks:\n`;
        unscheduled.forEach(u => {
          const statusTag = u.isCompleted ? '✓ Completed' : 'Planned';
          const durationStr = u.durationHours ? ` (${u.durationHours}h)` : '';
          const locStr = u.location ? ` @ ${u.location}` : '';
          plain += `    - [${statusTag}] ${u.title} (${u.category})${durationStr}${locStr}\n`;
        });
      }
      plain += `\n`;
    });

    if (currentWeekMeta.nextWeekTasks.length > 0) {
      plain += `----------------------------------------\n`;
      plain += `THINGS TO DO NEXT WEEK:\n`;
      currentWeekMeta.nextWeekTasks.forEach(t => {
        plain += `  • ${t}\n`;
      });
      plain += `\n`;
    }

    if (hasVideoObs) {
      plain += `----------------------------------------\n`;
      plain += `VIDEO OBSERVATIONS:\n`;
      currentWeekMeta.videoObservations.forEach(v => {
        plain += `  • ${v}\n`;
      });
      plain += `\n`;
    }

    // HTML formatted representation for rich text paste
    let html = `<div style="font-family: Arial, sans-serif; color: #111; max-width: 900px; padding: 20px;">`;
    html += `<h2 style="margin:0 0 4px 0; color:#111827; font-size:20px;">Malak's Weekly Work Plan</h2>`;
    html += `<p style="margin:0 0 16px 0; color:#6b7280; font-size:14px;"><strong>Week of:</strong> ${weekStart} to ${weekEnd}</p>`;

    if (hasGoal) {
      html += `<div style="background:#f3f4f6; border-left:4px solid #3b82f6; padding:10px 14px; margin-bottom:16px; border-radius:4px;">`;
      html += `<strong style="color:#1e40af; font-size:12px; text-transform:uppercase;">Week Goal:</strong>`;
      html += `<p style="margin:4px 0 0 0; font-size:14px; color:#1f2937;">${currentWeekMeta.weekGoal}</p>`;
      html += `</div>`;
    }

    html += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;">`;
    html += `<thead><tr style="background:#e5e7eb; border-bottom:2px solid #d1d5db;">`;
    html += `<th style="padding:8px; border:1px solid #d1d5db; text-align:left; width:80px;">Time</th>`;
    weekDays.forEach(d => {
      html += `<th style="padding:8px; border:1px solid #d1d5db; text-align:left;">${d.dayName}<br/><span style="font-weight:normal; font-size:11px; color:#4b5563;">${d.monthName} ${d.dayNum}</span></th>`;
    });
    html += `</tr></thead><tbody>`;

    TIME_SLOTS.forEach(slot => {
      html += `<tr style="border-bottom:1px solid #e5e7eb;">`;
      html += `<td style="padding:6px; border:1px solid #d1d5db; font-family:monospace; background:#f9fafb; font-weight:bold; font-size:11px;">${slot.label}</td>`;
      weekDays.forEach(d => {
        const items = getItemsForSlot(d.dateStr, slot.value);
        html += `<td style="padding:4px; border:1px solid #d1d5db; vertical-align:top;">`;
        items.forEach(item => {
          const startMins = timeToMinutes(item.startTime);
          const slotMins = timeToMinutes(slot.value);
          const isFirst = startMins !== null && slotMins !== null && startMins >= slotMins && startMins < slotMins + 30;
          if (isFirst) {
            const catStyle = getCategoryStyle(item.category);
            html += `<div style="background:${catStyle.printBg}; border:1px solid ${catStyle.printBorder}; border-radius:4px; padding:4px; margin-bottom:2px;">`;
            html += `<strong style="color:${catStyle.printText};">${item.isCompleted ? '✓ ' : ''}${item.title}</strong> `;
            html += `<span style="font-size:10px; background:#e5e7eb; color:#374151; padding:1px 4px; border-radius:3px;">${item.category}</span>`;
            if (formatTimeRange(item.startTime, item.endTime)) {
              html += `<br/><span style="font-size:10px; color:#4b5563;">${formatTimeRange(item.startTime, item.endTime)}</span>`;
            }
            if (item.durationHours) {
              html += `<span style="font-size:10px; color:#15803d; margin-left:4px;">[${item.durationHours}h logged]</span>`;
            }
            if (item.location) {
              html += `<br/><span style="font-size:10px; color:#6b7280;">📍 ${item.location}</span>`;
            }
            if (item.description) {
              html += `<br/><i style="font-size:10px; color:#6b7280;">${item.description}</i>`;
            }
            html += `</div>`;
          }
        });
        html += `</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;

    // Unscheduled tasks if any exist
    if (totalUnscheduledCount > 0) {
      html += `<div style="margin-bottom:20px;">`;
      html += `<h4 style="margin:0 0 8px 0; font-size:13px; color:#1f2937;">Unscheduled & Logged Day Tasks</h4>`;
      html += `<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px;">`;
      weekDays.forEach(d => {
        const unscheduled = getUnscheduledItems(d.dateStr);
        html += `<div style="border:1px solid #d1d5db; border-radius:6px; padding:6px; background:#f9fafb;">`;
        html += `<strong style="font-size:11px; color:#374151;">${d.dayName}</strong>`;
        if (unscheduled.length === 0) {
          html += `<p style="margin:4px 0 0 0; font-size:10px; color:#9ca3af; font-style:italic;">None</p>`;
        } else {
          unscheduled.forEach(u => {
            html += `<p style="margin:4px 0 0 0; font-size:11px; color:#111827;">${u.isCompleted ? '✓ ' : '• '}${u.title}</p>`;
          });
        }
        html += `</div>`;
      });
      html += `</div></div>`;
    }

    // Footer sections
    html += `<div style="display:flex; gap:16px; margin-top:16px; border-top:2px solid #e5e7eb; padding-top:16px;">`;
    html += `<div style="flex:1;">`;
    html += `<h4 style="margin:0 0 8px 0; font-size:12px; text-transform:uppercase; color:#4338ca;">THINGS TO DO NEXT WEEK</h4>`;
    if (currentWeekMeta.nextWeekTasks.length === 0) {
      html += `<p style="font-size:11px; color:#9ca3af; margin:0;">None</p>`;
    } else {
      html += `<ul style="margin:0; padding-left:16px; font-size:12px; color:#1f2937;">`;
      currentWeekMeta.nextWeekTasks.forEach(t => {
        html += `<li style="margin-bottom:4px;">${t}</li>`;
      });
      html += `</ul>`;
    }
    html += `</div>`;

    if (hasVideoObs) {
      html += `<div style="flex:1;">`;
      html += `<h4 style="margin:0 0 8px 0; font-size:12px; text-transform:uppercase; color:#15803d;">Video Observations</h4>`;
      html += `<ul style="margin:0; padding-left:16px; font-size:12px; color:#1f2937;">`;
      currentWeekMeta.videoObservations.forEach(v => {
        html += `<li style="margin-bottom:4px;">${v}</li>`;
      });
      html += `</ul>`;
      html += `</div>`;
    }

    html += `</div></div>`;

    return { plain, html };
  };

  const handleCopyReport = async () => {
    const { plain, html } = generateReportData();
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([plain], { type: 'text/plain' });
        const htmlBlob = new Blob([html], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
          }),
        ]);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(plain);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy formatted report:', err);
      try {
        await navigator.clipboard.writeText(plain);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Fallback writeText failed:', e);
      }
    }
  };

  // Add next week task
  const handleAddNextWeekTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNextWeekTaskInput.trim()) return;
    addNextWeekTask(weekStart, newNextWeekTaskInput);
    setNewNextWeekTaskInput('');
  };

  // Add video observation
  const handleAddVideoObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoObsInput.trim()) return;
    addVideoObservation(weekStart, newVideoObsInput);
    setNewVideoObsInput('');
    setShowAddVideoObsForm(false);
  };

  // Calculate optional suggestions for Next Week Tasks from active routines & upcoming items
  const getSuggestions = () => {
    const activeRoutineTitles = routines.filter(r => r.active).map(r => r.title);
    const existing = new Set(currentWeekMeta.nextWeekTasks);
    return activeRoutineTitles.filter(t => !existing.has(t)).slice(0, 4);
  };

  const suggestions = getSuggestions();

  const totalLoggedHours = aggregatedWeekItems.reduce((acc, curr) => acc + (curr.durationHours || 0), 0);
  const completedItemsCount = aggregatedWeekItems.filter(i => i.isCompleted).length;
  const plannedItemsCount = aggregatedWeekItems.filter(i => !i.isCompleted).length;
  const daysWithUnscheduled = weekDays.filter(d => getUnscheduledItems(d.dateStr).length > 0);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none">
      <style>{`
        @media print {
          /* Safety net if the page is printed directly (Ctrl+P) instead of
             via the "Print / Save PDF" button above, which renders its own
             fully-styled executive report through a hidden iframe. */
          .no-print { display: none !important; }
          body { background: #0f1117 !important; }
        }
      `}</style>

      {/* Outer Quick Action & Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181920] p-5 rounded-2xl border border-[#292931] no-print shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#4d8eff]/10 border border-[#4d8eff]/30 flex items-center justify-center text-[#4d8eff] shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#f4f4f5] tracking-tight">Weekly Work Plan Schedule</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4d8eff]/15 text-[#60a5fa] border border-[#4d8eff]/30 font-semibold uppercase">
                Executive View
              </span>
            </div>
            <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
              Work Week: Sunday – Thursday | {weekDays[0].monthName} {weekDays[0].dayNum} – {weekDays[4].monthName} {weekDays[4].dayNum}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#4d8eff]/20 border border-[#4d8eff]/50 text-[#adc6ff] hover:bg-[#4d8eff]/30 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer no-print shadow-sm"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#60a5fa]" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleCopyReport}
            className="px-3.5 py-1.5 bg-[#272730] border border-[#33343c] text-[#e4e4e7] hover:border-[#60a5fa] rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer no-print shadow-sm"
            title="Copy formatted plan for Email or Word"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5 text-[#60a5fa]" />}
            <span>{copied ? 'Copied!' : 'Copy Report'}</span>
          </button>

          <button
            onClick={handleTodayWeek}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border no-print ${
              weekOffset === 0
                ? 'bg-[#4d8eff]/20 border-[#4d8eff] text-[#adc6ff] font-medium'
                : 'bg-[#12131a] border-[#292931] text-[#90909a] hover:text-[#e3e1ec] hover:border-[#33343c]'
            }`}
          >
            Current Week
          </button>

          <div className="flex items-center gap-1 bg-[#12131a] p-1 rounded-xl border border-[#292931] no-print">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg text-[#90909a] hover:text-[#e3e1ec] hover:bg-[#1f2029] transition-all cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-[#adc6ff]">
              Week {weekOffset === 0 ? '(Current)' : weekOffset > 0 ? `(+${weekOffset})` : `(${weekOffset})`}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg text-[#90909a] hover:text-[#e3e1ec] hover:bg-[#1f2029] transition-all cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Printable Document Container */}
      <div className="printable-document bg-[#181920] rounded-2xl border border-[#292931] overflow-hidden shadow-2xl space-y-0">
        {/* Executive Document Header Banner */}
        <div className="bg-[#12131a] p-6 border-b border-[#292931] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 bg-[#4d8eff]/15 text-[#60a5fa] border border-[#4d8eff]/30 rounded text-xs font-mono font-bold uppercase tracking-wider">
                Official Weekly IT Report
              </span>
              <span className="text-xs font-mono text-[#a1a1aa] font-medium">IT Department</span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#f4f4f5] tracking-tight">
              Malak's Weekly IT Work & Activity Report
            </h3>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-xs text-[#cbd5e1] font-mono">
              <span>Week Period: <strong className="text-white font-semibold">{weekStart}</strong> to <strong className="text-white font-semibold">{weekEnd}</strong></span>
              <span className="text-[#33343c]">|</span>
              <span className="text-[#68d391] font-bold">✓ {completedItemsCount} Completed</span>
              <span className="text-[#33343c]">|</span>
              <span className="text-[#63b3ed] font-bold">{plannedItemsCount} Planned</span>
              {totalLoggedHours > 0 && (
                <>
                  <span className="text-[#33343c]">|</span>
                  <span className="text-[#4ade80] font-extrabold bg-[#13221a] px-2 py-0.5 rounded border border-[#22543d]">
                    {totalLoggedHours}h Total Logged
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status & Category Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-[#cbd5e1] bg-[#181920] p-3.5 rounded-xl border border-[#272730] no-print shrink-0">
            <div className="flex items-center gap-3.5 pr-4 border-r border-[#272730]">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <span className="w-3 h-3 rounded bg-[#38a169]"></span> ✓ Completed
              </span>
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <span className="w-3 h-3 rounded bg-[#4299e1]"></span> Planned
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-medium">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> IT Ops
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Maint
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Infra
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Hardware
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Security
              </span>
            </div>
          </div>
        </div>

        {/* Section: Week Goal Banner */}
        <div className="px-6 py-3.5 bg-[#14151d] border-b border-[#292931] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 rounded-lg bg-[#ffb74d]/10 border border-[#ffb74d]/30 text-[#ffb74d]">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#ffb74d] font-mono uppercase tracking-wider">
              Weekly Goal:
            </span>
          </div>
          <input
            type="text"
            value={currentWeekMeta.weekGoal || ''}
            onChange={(e) => setWeekGoal(weekStart, e.target.value)}
            placeholder="+ Click to set high-level focus or key goal for this week..."
            className="w-full bg-[#181920] border border-[#272730] focus:border-[#4d8eff] rounded-lg px-3.5 py-1.5 text-xs sm:text-sm text-[#f4f4f5] placeholder-[#71717a] focus:outline-none transition-all print:hidden font-medium"
          />
          <div className="hidden print:block text-xs font-semibold text-black">
            {currentWeekMeta.weekGoal || 'None set'}
          </div>
        </div>

        {/* Schedule Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[980px] text-left">
            <thead>
              <tr className="bg-[#12131a] border-b border-[#292931]">
                <th className="w-28 p-3.5 text-xs font-mono font-bold text-[#a1a1aa] border-r border-[#292931] tracking-wider uppercase">
                  Time
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.dateStr}
                    className={`p-3.5 border-r border-[#292931] last:border-r-0 ${
                      day.isToday ? 'bg-[#4d8eff]/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold tracking-tight ${day.isToday ? 'text-[#60a5fa]' : 'text-[#f4f4f5]'}`}>
                        {day.dayName}
                      </span>
                      <span
                        className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-semibold ${
                          day.isToday
                            ? 'bg-[#4d8eff] text-white shadow-sm'
                            : 'bg-[#272730] text-[#a1a1aa]'
                        }`}
                      >
                        {day.monthName} {day.dayNum}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot.value} className="border-b border-[#292931]/60 hover:bg-[#1c1d27]/40 transition-colors">
                  <td className="p-2.5 text-xs font-mono text-[#cbd5e1] font-semibold bg-[#12131a]/60 border-r border-[#292931] align-top select-none">
                    {slot.label}
                  </td>
                  {weekDays.map((day) => {
                    const items = getItemsForSlot(day.dateStr, slot.value);
                    const isFirstSlotOfItem = (item: AggregatedWorkItem) => {
                      const startMins = timeToMinutes(item.startTime);
                      const slotMins = timeToMinutes(slot.value);
                      return startMins !== null && slotMins !== null && startMins >= slotMins && startMins < slotMins + 30;
                    };

                    return (
                      <td
                        key={day.dateStr}
                        className={`p-2 border-r border-[#292931] last:border-r-0 align-top min-h-[48px] ${
                          day.isToday ? 'bg-[#4d8eff]/5' : ''
                        }`}
                      >
                        <div className="space-y-2">
                          {items.map((item) => {
                            const isStarting = isFirstSlotOfItem(item);
                            const catStyle = getCategoryStyle(item.category);
                            return (
                              <div
                                  key={item.id}
                                  className={`relative rounded-xl border transition-all shadow-md overflow-hidden break-inside-avoid print:break-inside-avoid ${
                                    isStarting
                                      ? item.isCompleted
                                        ? 'bg-[#13221a] border-[#22543d] text-[#f1f5f9]'
                                        : 'bg-[#1a2333] border-[#2b4c7e] text-[#f1f5f9]'
                                      : 'bg-[#161c28]/70 border-[#272730] text-[#a1a1aa]'
                                  }`}
                                >
                                {isStarting ? (
                                  <div className="p-3 pl-4 space-y-1.5">
                                    {/* Left Accent Color Strip */}
                                    <div
                                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                        item.isCompleted ? 'bg-[#38a169]' : 'bg-[#4299e1]'
                                      }`}
                                    ></div>

                                    {/* Task Title & Category Header */}
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-bold text-white text-sm leading-snug line-clamp-2 flex items-start gap-1.5">
                                        {item.isCompleted && (
                                          <CheckCircle2 className="w-4 h-4 text-[#38a169] shrink-0 mt-0.5" />
                                        )}
                                        <span>{item.title}</span>
                                      </span>
                                      <span
                                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 font-semibold uppercase tracking-wider ${catStyle.badge}`}
                                      >
                                        {item.category}
                                      </span>
                                    </div>

                                    {/* Meta Row: Status, Time, Duration, Location */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#cbd5e1]">
                                      {item.isCompleted ? (
                                        <span className="px-2 py-0.5 rounded-md bg-[#38a169]/20 text-[#68d391] border border-[#38a169]/40 font-bold flex items-center gap-1">
                                          ✓ Completed
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-md bg-[#4299e1]/20 text-[#63b3ed] border border-[#4299e1]/40 font-bold flex items-center gap-1">
                                          Planned
                                        </span>
                                      )}

                                      {formatTimeRange(item.startTime, item.endTime) && (
                                        <div className="flex items-center gap-1 text-[#e4e4e7] font-semibold bg-[#111827]/80 px-2 py-0.5 rounded-md border border-[#272730]">
                                          <Clock className="w-3.5 h-3.5 text-[#60a5fa]" />
                                          <span>{formatTimeRange(item.startTime, item.endTime)}</span>
                                        </div>
                                      )}

                                      {item.durationHours && (
                                        <span className="text-[#68d391] font-bold bg-[#13221a] px-2 py-0.5 rounded-md border border-[#22543d]">
                                          {item.durationHours}h logged
                                        </span>
                                      )}

                                      {item.location && (
                                        <span className="text-[#cbd5e1] font-medium">
                                          📍 {item.location}
                                        </span>
                                      )}
                                    </div>

                                    {/* Description / Note */}
                                    {item.description && (
                                      <p className="text-xs text-[#cbd5e1] leading-normal italic bg-[#0f172a]/70 p-2 rounded-lg border border-[#1e293b] mt-1.5">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-1.5 px-3 flex items-center gap-2 text-xs font-mono text-[#cbd5e1]">
                                    <div
                                      className={`w-1 h-3 rounded-full ${
                                        item.isCompleted ? 'bg-[#38a169]' : 'bg-[#4299e1]'
                                      }`}
                                    ></div>
                                    <span className="truncate opacity-90 font-medium">↳ {item.title}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Unscheduled Tasks Section (Compact & Exception-Driven) */}
        {daysWithUnscheduled.length > 0 ? (
          <div className="p-5 bg-[#12131a] border-t border-[#292931]">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#60a5fa]" />
                <h4 className="text-sm font-bold text-[#f4f4f5] uppercase tracking-wider font-mono">
                  Unscheduled & Flexible Day Tasks ({totalUnscheduledCount} items)
                </h4>
              </div>
              <span className="text-xs font-mono text-[#a1a1aa]">
                Logged work without fixed 30-min time slot
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {daysWithUnscheduled.map((day) => {
                const unscheduled = getUnscheduledItems(day.dateStr);
                return (
                  <div key={day.dateStr} className="bg-[#181920] p-3.5 rounded-xl border border-[#292931] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#292931] pb-2">
                      <span className="text-xs font-bold text-[#f4f4f5]">{day.dayName} ({day.monthName} {day.dayNum})</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#272730] text-[#a1a1aa] font-medium">
                        {unscheduled.length} {unscheduled.length === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {unscheduled.map(item => {
                        const catStyle = getCategoryStyle(item.category);
                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                              item.isCompleted
                                ? 'bg-[#13221a]/90 border-[#22543d] text-[#f1f5f9]'
                                : 'bg-[#1a2333]/90 border-[#2b4c7e] text-[#f1f5f9]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-bold text-white text-xs line-clamp-1 flex items-center gap-1">
                                {item.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#38a169] shrink-0" />}
                                <span>{item.title}</span>
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 font-medium ${catStyle.badge}`}>
                                {item.category}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono text-[#cbd5e1]">
                              <span className={item.isCompleted ? 'text-[#68d391] font-bold' : 'text-[#63b3ed] font-bold'}>
                                {item.isCompleted ? '✓ Completed' : 'Planned'}
                              </span>
                              {item.durationHours && (
                                <span className="text-[#68d391] font-extrabold">{item.durationHours}h logged</span>
                              )}
                            </div>
                            {item.location && (
                              <span className="text-xs font-mono text-[#cbd5e1] block">📍 {item.location}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-6 py-3 bg-[#12131a] border-t border-[#292931] flex items-center justify-between text-xs font-mono text-[#a1a1aa] no-print">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#38a169]" />
              <span>Unscheduled Tasks: All logged and planned tasks for this week are scheduled in specific time slots.</span>
            </span>
          </div>
        )}

        {/* Document Footer Grid: THINGS TO DO NEXT WEEK & Video Observations */}
        <div
          className={`grid gap-0 border-t border-[#292931] bg-[#14151d] ${
            hasVideoObs || showAddVideoObsForm
              ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#292931]'
              : 'grid-cols-1'
          }`}
        >
          {/* Section: THINGS TO DO NEXT WEEK */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#818cf8]" />
                <h4 className="text-xs font-bold text-[#f4f4f5] tracking-wider uppercase font-mono">
                  THINGS TO DO NEXT WEEK
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#272730] px-2 py-0.5 rounded font-medium">
                  {currentWeekMeta.nextWeekTasks.length} items
                </span>
                {!hasVideoObs && !showAddVideoObsForm && (
                  <button
                    onClick={() => setShowAddVideoObsForm(true)}
                    className="text-[10px] font-mono px-2 py-0.5 bg-[#38a169]/10 border border-[#38a169]/30 text-[#68d391] rounded hover:bg-[#38a169]/20 transition-all cursor-pointer flex items-center gap-1 no-print"
                    title="Record classroom video observation note"
                  >
                    <Video className="w-3 h-3 text-[#38a169]" />
                    <span>+ Video Observation</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of items */}
            <div className="space-y-2 min-h-[60px]">
              {currentWeekMeta.nextWeekTasks.length === 0 ? (
                <div className="p-3 rounded-xl border border-dashed border-[#292931] text-center text-xs text-[#a1a1aa] font-mono">
                  No upcoming items added for next week yet.
                </div>
              ) : (
                currentWeekMeta.nextWeekTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2.5 bg-[#181920] border border-[#292931] rounded-xl text-xs text-[#f4f4f5]">
                    {editingNextWeekIdx === idx ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingNextWeekVal}
                          onChange={(e) => setEditingNextWeekVal(e.target.value)}
                          className="w-full bg-[#12131a] border border-[#4d8eff] rounded px-2 py-1 text-xs text-[#f4f4f5] focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            updateNextWeekTask(weekStart, idx, editingNextWeekVal);
                            setEditingNextWeekIdx(null);
                          }}
                          className="p-1 text-[#4d8eff] hover:bg-[#272730] rounded cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]"></span>
                          <span>{task}</span>
                        </span>
                        <div className="flex items-center gap-1 no-print">
                          <button
                            onClick={() => {
                              setEditingNextWeekIdx(idx);
                              setEditingNextWeekVal(task);
                            }}
                            className="p-1 text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#272730] rounded transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeNextWeekTask(weekStart, idx)}
                            className="p-1 text-[#a1a1aa] hover:text-[#f87171] hover:bg-[#272730] rounded transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add task input form */}
            <form onSubmit={handleAddNextWeekTask} className="flex items-center gap-2 no-print">
              <input
                type="text"
                value={newNextWeekTaskInput}
                onChange={(e) => setNewNextWeekTaskInput(e.target.value)}
                placeholder="Add item for next week..."
                className="w-full bg-[#181920] border border-[#292931] rounded-xl px-3 py-1.5 text-xs text-[#f4f4f5] placeholder-[#71717a] focus:outline-none focus:border-[#818cf8]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#818cf8]/20 border border-[#818cf8]/40 text-[#a5b4fc] rounded-xl text-xs font-mono hover:bg-[#818cf8]/30 transition-all cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            {/* Optional suggestions chips */}
            {suggestions.length > 0 && (
              <div className="pt-2 border-t border-[#292931] no-print">
                <p className="text-[10px] font-mono text-[#a1a1aa] mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#ffb74d]" /> Suggested from Routines:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => addNextWeekTask(weekStart, s)}
                      className="text-[10px] font-mono px-2 py-0.5 bg-[#272730] border border-[#33343c] text-[#adc6ff] rounded-md hover:border-[#818cf8] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Video Observations (Conditional) */}
          {(hasVideoObs || showAddVideoObsForm) && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#38a169]" />
                  <h4 className="text-xs font-bold text-[#f4f4f5] tracking-wider uppercase font-mono">
                    Video Observations
                  </h4>
                </div>
                <div className="flex items-center gap-2 no-print">
                  <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#272730] px-2 py-0.5 rounded font-medium">
                    {currentWeekMeta.videoObservations.length} notes
                  </span>
                  {!hasVideoObs && (
                    <button
                      onClick={() => setShowAddVideoObsForm(false)}
                      className="text-[10px] font-mono text-[#a1a1aa] hover:text-[#f4f4f5] px-1.5 py-0.5 rounded transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* List of observations */}
              <div className="space-y-2 min-h-[60px]">
                {currentWeekMeta.videoObservations.length === 0 ? (
                  <div className="p-3 rounded-xl border border-dashed border-[#292931] text-center text-xs text-[#a1a1aa] font-mono">
                    Enter video observation note below...
                  </div>
                ) : (
                  currentWeekMeta.videoObservations.map((obs, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2.5 bg-[#181920] border border-[#292931] rounded-xl text-xs text-[#f4f4f5]">
                      {editingObsIdx === idx ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editingObsVal}
                            onChange={(e) => setEditingObsVal(e.target.value)}
                            className="w-full bg-[#12131a] border border-[#38a169] rounded px-2 py-1 text-xs text-[#f4f4f5] focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              updateVideoObservation(weekStart, idx, editingObsVal);
                              setEditingObsIdx(null);
                            }}
                            className="p-1 text-[#38a169] hover:bg-[#272730] rounded cursor-pointer no-print"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#38a169]"></span>
                            <span>{obs}</span>
                          </span>
                          <div className="flex items-center gap-1 no-print">
                            <button
                              onClick={() => {
                                setEditingObsIdx(idx);
                                setEditingObsVal(obs);
                              }}
                              className="p-1 text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#272730] rounded transition-all cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeVideoObservation(weekStart, idx)}
                              className="p-1 text-[#a1a1aa] hover:text-[#f87171] hover:bg-[#272730] rounded transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add observation input form */}
              <form onSubmit={handleAddVideoObs} className="flex items-center gap-2 no-print">
                <input
                  type="text"
                  value={newVideoObsInput}
                  onChange={(e) => setNewVideoObsInput(e.target.value)}
                  placeholder="Add video observation note..."
                  className="w-full bg-[#181920] border border-[#292931] rounded-xl px-3 py-1.5 text-xs text-[#f4f4f5] placeholder-[#71717a] focus:outline-none focus:border-[#38a169]"
                  autoFocus={showAddVideoObsForm && !hasVideoObs}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#38a169]/20 border border-[#38a169]/40 text-[#68d391] rounded-xl text-xs font-mono hover:bg-[#38a169]/30 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyWorkPlanView;