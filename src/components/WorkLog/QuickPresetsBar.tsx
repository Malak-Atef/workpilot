import React, { useState, useEffect } from 'react';
import { TaskPreset, getStoredPresets, saveStoredPresets, resetStoredPresets } from '../../lib/presets';
import { PresetManagerModal } from './PresetManagerModal';
import { Zap, Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface QuickPresetsBarProps {
  onSelectPreset: (preset: TaskPreset) => void;
}

export const QuickPresetsBar: React.FC<QuickPresetsBarProps> = ({ onSelectPreset }) => {
  const [presets, setPresets] = useState<TaskPreset[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setPresets(getStoredPresets());
  }, []);

  const handleSavePresets = (updated: TaskPreset[]) => {
    setPresets(updated);
    saveStoredPresets(updated);
  };

  const handleRestoreDefaults = () => {
    const defaults = resetStoredPresets();
    setPresets(defaults);
  };

  // Limit initially visible chips to 8 unless expanded
  const visiblePresets = isExpanded ? presets : presets.slice(0, 8);

  return (
    <div className="bg-[#1e1f26] border border-[#292931] p-4 rounded-2xl shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#ffb786]/10 text-[#ffb786] rounded-lg border border-[#ffb786]/20 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#e3e1ec] uppercase tracking-wider font-mono">
              Quick Log Presets
            </h4>
            <p className="text-[11px] text-[#90909a] font-mono">
              Click a common task to prefill a new work log entry
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowManager(true)}
          className="px-2.5 py-1.5 bg-[#12131a] hover:bg-[#292931] text-[#adc6ff] border border-[#292931] rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          title="Manage & customize presets"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Manage Presets</span>
        </button>
      </div>

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {visiblePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className="group px-3 py-1.5 bg-[#12131a] hover:bg-[#4d8eff]/15 hover:border-[#4d8eff]/40 border border-[#292931] rounded-xl text-xs font-medium text-[#c2c6d6] hover:text-[#e3e1ec] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>{preset.title}</span>
            <span className="text-[10px] font-mono text-[#90909a] group-hover:text-[#adc6ff] bg-[#1e1f26] px-1.5 py-0.2 rounded border border-[#292931]">
              {preset.defaultDuration}h
            </span>
          </button>
        ))}

        {presets.length > 8 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-[#12131a] hover:bg-[#292931] border border-[#292931] rounded-xl text-xs font-mono text-[#adc6ff] flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>{isExpanded ? 'Show Less' : `+${presets.length - 8} More`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Manager Modal */}
      <PresetManagerModal
        isOpen={showManager}
        onClose={() => setShowManager(false)}
        presets={presets}
        onSavePresets={handleSavePresets}
        onRestoreDefaults={handleRestoreDefaults}
      />
    </div>
  );
};
