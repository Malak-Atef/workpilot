import React from 'react';
import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import { PlannedItem } from '../../types';
import { useStore } from '../../store/useStore';

interface TodayFocusProps {
  items: PlannedItem[];
}

export const TodayFocus: React.FC<TodayFocusProps> = ({ items }) => {
  const { updatePlannedItem, addWorkLog } = useStore();

  const toggleStatus = async (item: PlannedItem) => {
    if (item.status === 'planned') {
      await updatePlannedItem(item.id, { status: 'done' });
      await addWorkLog({
        title: item.title,
        date: item.date,
        category: item.category,
        status: 'completed'
      });
    } else if (item.status === 'done') {
      await updatePlannedItem(item.id, { status: 'planned' });
    }
  };

  return (
    <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#adc6ff]" />
          <h3 className="font-semibold text-sm text-[#e3e1ec]">Today's Planned Focus</h3>
        </div>
        <span className="text-xs font-mono text-[#90909a] bg-[#12131a] px-2 py-0.5 rounded border border-[#292931]">
          {items.filter(i => i.status === 'done').length}/{items.length} Completed
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#292931] rounded-xl bg-[#12131a]/50">
          <Clock className="w-8 h-8 text-[#90909a] mx-auto mb-2 opacity-50" />
          <p className="text-xs text-[#c2c6d6] font-medium">No tasks planned for today</p>
          <p className="text-[11px] text-[#90909a] mt-1 font-mono">Use Quick Capture above (e.g., "Check school printers today")</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isDone = item.status === 'done';
            return (
              <div
                key={item.id}
                onClick={() => toggleStatus(item)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isDone
                    ? 'bg-[#12131a]/60 border-[#292931] opacity-70'
                    : 'bg-[#12131a] border-[#292931] hover:border-[#4d8eff]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button className="text-[#adc6ff] hover:text-[#4d8eff] transition-all">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#90909a]" />
                    )}
                  </button>
                  <div>
                    <h4 className={`text-xs font-medium ${isDone ? 'line-through text-[#90909a]' : 'text-[#e3e1ec]'}`}>
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-[#ffb786] bg-[#ffb786]/10 px-1.5 py-0.2 rounded">
                        {item.category || 'IT Ops'}
                      </span>
                      <span className="text-[10px] font-mono text-[#90909a]">
                        Source: {item.source}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  isDone
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-[#4d8eff]/10 text-[#adc6ff] border border-[#4d8eff]/20'
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
