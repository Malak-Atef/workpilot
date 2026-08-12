import React from 'react';
import { ClipboardList, Clock, MapPin } from 'lucide-react';
import { WorkLog } from '../../types';

interface RecentActivityProps {
  logs: WorkLog[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs }) => {
  return (
    <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#c0c1ff]" />
          <h3 className="font-semibold text-sm text-[#e3e1ec]">Recent Work Logs</h3>
        </div>
        <span className="text-xs font-mono text-[#90909a] bg-[#12131a] px-2 py-0.5 rounded border border-[#292931]">
          {logs.length} Total Logs
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#292931] rounded-xl bg-[#12131a]/50">
          <Clock className="w-8 h-8 text-[#90909a] mx-auto mb-2 opacity-50" />
          <p className="text-xs text-[#c2c6d6] font-medium">No work logged yet</p>
          <p className="text-[11px] text-[#90909a] mt-1 font-mono">
            Log completed work via Quick Capture or Work Log tab.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="p-3 bg-[#12131a] border border-[#292931] rounded-xl flex items-center justify-between gap-3 hover:border-[#c0c1ff]/40 transition-all"
            >
              <div>
                <h4 className="text-xs font-medium text-[#e3e1ec]">{log.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-[#90909a]">
                  <span>{log.date}</span>
                  <span className="text-[#ffb786] bg-[#ffb786]/10 px-1.5 py-0.2 rounded">
                    {log.category || 'General'}
                  </span>
                  {log.location && (
                    <span className="flex items-center gap-1 text-[#c2c6d6]">
                      <MapPin className="w-3 h-3 text-[#adc6ff]" />
                      {log.location}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                LOGGED
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
