import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, ClipboardList, BarChart2, Settings, Terminal, Database } from 'lucide-react';

export const SideNavBar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: Calendar },
    { to: '/weekly-plan', label: 'Weekly Work Plan', icon: FileText },
    { to: '/work-log', label: 'Work Log', icon: ClipboardList },
    { to: '/weekly-report', label: 'Weekly Report', icon: BarChart2, badge: 'Future' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#12131a] border-r border-[#292931] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-[#292931]/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4d8eff] to-[#1258d4] flex items-center justify-center text-white shadow-lg shadow-[#4d8eff]/20 font-bold text-lg">
            W
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight text-[#e3e1ec]">WorkPilot</h1>
            <p className="text-xs text-[#90909a] font-mono">IT Engineering Ops</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1e1f26] text-[#adc6ff] border-l-2 border-[#4d8eff] shadow-sm'
                      : 'text-[#c2c6d6] hover:bg-[#1a1b22] hover:text-[#e3e1ec]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#292931] text-[#90909a]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#292931]/60 bg-[#0d0e15]/50 m-3 rounded-xl border border-[#292931]">
        <div className="flex items-center justify-between text-xs text-[#90909a] mb-2 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Ready
          </span>
          <span className="text-[10px]">v1.0</span>
        </div>
        <div className="space-y-1 text-[11px] text-[#90909a] font-mono">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-[#adc6ff]" />
            <span>Interpreter: Rule-Based</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#adc6ff]" />
            <span>Storage: SQLite Local</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
