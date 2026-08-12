import React from 'react';
import { Search, Clock } from 'lucide-react';

interface TopHeaderProps {
  title: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, subtitle }) => {
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 border-b border-[#292931] bg-[#12131a]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-[#e3e1ec] tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-[#90909a]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1b22] border border-[#292931] text-xs font-mono text-[#c2c6d6]">
          <Clock className="w-3.5 h-3.5 text-[#adc6ff]" />
          <span>{todayDateStr}</span>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#90909a]" />
          <input
            type="text"
            placeholder="Search work logs, plans..."
            className="pl-9 pr-4 py-1.5 bg-[#1a1b22] border border-[#292931] rounded-lg text-xs text-[#e3e1ec] placeholder-[#90909a] focus:outline-none focus:border-[#4d8eff] w-56 transition-all"
          />
        </div>
      </div>
    </header>
  );
};
