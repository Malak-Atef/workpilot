import React, { useState } from 'react';
import { TaskPreset, DEFAULT_LOCATIONS } from '../../lib/presets';
import { Plus, Trash2, Edit2, RotateCcw, X, Check } from 'lucide-react';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: TaskPreset[];
  onSavePresets: (updated: TaskPreset[]) => void;
  onRestoreDefaults: () => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSavePresets,
  onRestoreDefaults,
}) => {
  const [editingPreset, setEditingPreset] = useState<TaskPreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IT Ops');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('0.5');

  if (!isOpen) return null;

  const startCreate = () => {
    setTitle('');
    setCategory('IT Ops');
    setLocation('');
    setDuration('0.5');
    setEditingPreset(null);
    setIsCreating(true);
  };

  const startEdit = (preset: TaskPreset) => {
    setTitle(preset.title);
    setCategory(preset.category || 'IT Ops');
    setLocation(preset.location || '');
    setDuration(String(preset.defaultDuration || 0.5));
    setIsCreating(false);
    setEditingPreset(preset);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingPreset(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedDuration = parseFloat(duration) || 0.5;

    if (isCreating) {
      const newPreset: TaskPreset = {
        id: `custom-${Date.now()}`,
        title: title.trim(),
        category,
        location: location.trim() || undefined,
        defaultDuration: parsedDuration,
        isCustom: true,
      };
      onSavePresets([...presets, newPreset]);
    } else if (editingPreset) {
      const updatedList = presets.map((p) =>
        p.id === editingPreset.id
          ? {
              ...p,
              title: title.trim(),
              category,
              location: location.trim() || undefined,
              defaultDuration: parsedDuration,
            }
          : p
      );
      onSavePresets(updatedList);
    }

    cancelForm();
  };

  const handleDelete = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    onSavePresets(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#292931]">
          <div>
            <h3 className="font-semibold text-base text-[#e3e1ec]">Manage Quick Log Presets</h3>
            <p className="text-xs text-[#90909a] font-mono">
              Customize reusable IT operational tasks for instant logging
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#90909a] hover:text-[#e3e1ec] rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        {!isCreating && !editingPreset && (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={startCreate}
              className="px-3.5 py-1.5 bg-[#4d8eff] hover:bg-[#3b7be8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Preset</span>
            </button>

            <button
              onClick={onRestoreDefaults}
              className="px-3 py-1.5 bg-[#12131a] hover:bg-[#292931] text-[#90909a] hover:text-[#e3e1ec] border border-[#292931] rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
              title="Reset all presets back to default seed list"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>
          </div>
        )}

        {/* Edit / Create Form */}
        {(isCreating || editingPreset) && (
          <form onSubmit={handleSaveForm} className="bg-[#12131a] border border-[#292931] p-4 rounded-xl space-y-3 text-xs font-mono">
            <h4 className="font-semibold text-[#adc6ff]">
              {isCreating ? 'Create New Preset' : `Edit Preset: ${editingPreset?.title}`}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[#90909a] block mb-1">Preset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wi-Fi Router Reset"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-3 py-1.5 text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                />
              </div>

              <div>
                <label className="text-[#90909a] block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-3 py-1.5 text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                >
                  <option value="IT Ops">IT Ops</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="text-[#90909a] block mb-1">Default Location (Optional)</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-3 py-1.5 text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                >
                  <option value="">No Location Specified</option>
                  {DEFAULT_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#90909a] block mb-1">Default Duration (Hours)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[#1e1f26] border border-[#33343c] rounded-lg px-3 py-1.5 text-[#e3e1ec] focus:outline-none focus:border-[#4d8eff]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#292931]">
              <button
                type="button"
                onClick={cancelForm}
                className="px-3 py-1.5 rounded-lg text-[#90909a] hover:bg-[#292931] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#4d8eff] hover:bg-[#3b7be8] text-white font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Preset</span>
              </button>
            </div>
          </form>
        )}

        {/* Presets Table / List */}
        <div className="overflow-y-auto flex-1 border border-[#292931] rounded-xl bg-[#12131a]/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#292931] text-[11px] font-mono text-[#90909a] uppercase bg-[#12131a]">
                <th className="py-2.5 px-3 font-medium">Title</th>
                <th className="py-2.5 px-3 font-medium">Category</th>
                <th className="py-2.5 px-3 font-medium">Location</th>
                <th className="py-2.5 px-3 font-medium">Duration</th>
                <th className="py-2.5 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292931] text-xs font-mono">
              {presets.map((preset) => (
                <tr key={preset.id} className="hover:bg-[#1a1b22] transition-all">
                  <td className="py-2.5 px-3 font-medium text-[#e3e1ec]">
                    {preset.title}
                    {preset.isCustom && (
                      <span className="ml-2 text-[9px] bg-[#4d8eff]/20 text-[#adc6ff] px-1.5 py-0.2 rounded border border-[#4d8eff]/30">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="bg-[#ffb786]/10 text-[#ffb786] px-2 py-0.5 rounded text-[10px]">
                      {preset.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#90909a]">
                    {preset.location || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[#c2c6d6]">
                    {preset.defaultDuration} hrs
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1">
                    <button
                      onClick={() => startEdit(preset)}
                      className="p-1 text-[#adc6ff] hover:text-white transition-all cursor-pointer"
                      title="Edit Preset"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-[#292931]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#12131a] hover:bg-[#292931] text-[#e3e1ec] border border-[#292931] font-semibold rounded-xl text-xs cursor-pointer transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
