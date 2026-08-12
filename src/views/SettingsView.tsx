import React from 'react';
import { Database, Terminal, ShieldCheck, Cpu, HardDrive } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#e3e1ec]">WorkPilot Configuration & Diagnostics</h2>
        <p className="text-xs text-[#90909a] font-mono">Local-first desktop environment settings</p>
      </div>

      <div className="space-y-4">
        {/* Architecture Card */}
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#292931] pb-3">
            <Cpu className="w-5 h-5 text-[#adc6ff]" />
            <h3 className="font-semibold text-sm text-[#e3e1ec]">Active Architecture Stack</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#12131a] rounded-xl border border-[#292931]">
              <span className="text-[10px] font-mono text-[#90909a] block">FRONTEND</span>
              <p className="font-semibold text-[#e3e1ec] mt-1">React + Vite + Tailwind v4</p>
              <p className="text-[11px] text-[#90909a]">Zustand State, TanStack Query</p>
            </div>
            <div className="p-3 bg-[#12131a] rounded-xl border border-[#292931]">
              <span className="text-[10px] font-mono text-[#90909a] block">BACKEND SERVICE</span>
              <p className="font-semibold text-[#e3e1ec] mt-1">FastAPI (Python 3.10+)</p>
              <p className="text-[11px] text-[#90909a]">SQLModel ORM, Alembic Migrations</p>
            </div>
            <div className="p-3 bg-[#12131a] rounded-xl border border-[#292931]">
              <span className="text-[10px] font-mono text-[#90909a] block">DESKTOP SHELL</span>
              <p className="font-semibold text-[#e3e1ec] mt-1">Tauri 2</p>
              <p className="text-[11px] text-[#90909a]">Desktop Shell Integration</p>
            </div>
            <div className="p-3 bg-[#12131a] rounded-xl border border-[#292931]">
              <span className="text-[10px] font-mono text-[#90909a] block">DATABASE</span>
              <p className="font-semibold text-[#e3e1ec] mt-1">SQLite Local Database</p>
              <p className="text-[11px] text-[#90909a]">~/.workpilot/data.db</p>
            </div>
          </div>
        </div>

        {/* Interpreter Settings Card */}
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#292931] pb-3">
            <Terminal className="w-5 h-5 text-[#ffb786]" />
            <h3 className="font-semibold text-sm text-[#e3e1ec]">Interpreter Rules Engine</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#12131a] rounded-xl border border-[#292931]">
              <div>
                <p className="font-medium text-[#e3e1ec]">Sprint 1 Rule-Based Interpreter</p>
                <p className="text-[11px] text-[#90909a]">Parses today/tomorrow, weekday names, completion signals without external AI dependency.</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Data Persistence Info */}
        <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#292931] pb-3">
            <HardDrive className="w-5 h-5 text-[#c0c1ff]" />
            <h3 className="font-semibold text-sm text-[#e3e1ec]">Data Safety Guarantee</h3>
          </div>
          <p className="text-xs text-[#c2c6d6] leading-relaxed">
            All persistent data is strictly contained in your local SQLite database file. Frontend calls go directly through the secure local FastAPI backend routes (<code className="text-[#adc6ff] bg-[#12131a] px-1 py-0.5 rounded">/api/v1</code>).
          </p>
        </div>
      </div>
    </div>
  );
};
