import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Suggestion } from '../../types';
import { SuggestionCard } from '../QuickCapture/SuggestionCard';

interface PendingActionsProps {
  suggestions: Suggestion[];
}

export const PendingActions: React.FC<PendingActionsProps> = ({ suggestions }) => {
  return (
    <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ffb786]" />
          <h3 className="font-semibold text-sm text-[#e3e1ec]">Pending Suggestions</h3>
        </div>
        {suggestions.length > 0 && (
          <span className="text-xs font-mono font-semibold text-[#ffb786] bg-[#ffb786]/10 px-2 py-0.5 rounded border border-[#ffb786]/20">
            {suggestions.length} Awaiting Confirmation
          </span>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#292931] rounded-xl bg-[#12131a]/50">
          <CheckCircle className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
          <p className="text-xs text-[#c2c6d6] font-medium">All suggestions confirmed!</p>
          <p className="text-[11px] text-[#90909a] mt-1 font-mono">
            Captured text will generate rule-interpreted suggestions here for explicit user review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      )}
    </div>
  );
};
