import React, { useState } from 'react';
import { Check, X, Calendar, ArrowRight, Tag, AlertCircle, FileCheck, PlusCircle } from 'lucide-react';
import { Suggestion } from '../../types';
import { useStore } from '../../store/useStore';

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  const { handleConfirmSuggestion, handleDismissSuggestion } = useStore();

  const payloadObj: Record<string, any> = typeof suggestion.payload === 'string'
    ? (() => { try { return JSON.parse(suggestion.payload); } catch { return {}; } })()
    : (suggestion.payload || {});

  const suggestedTitle = suggestion.suggested_title || payloadObj.suggested_title || '';
  const suggestedDate = suggestion.suggested_date || payloadObj.suggested_date || '';
  const suggestedCategory = suggestion.suggested_category || payloadObj.suggested_category || 'IT Ops';
  const confidence = suggestion.confidence ?? payloadObj.confidence ?? 0.95;
  const matchedTitle = suggestion.matched_planned_item_title || payloadObj.matched_planned_item_title || '';
  const matchedDate = suggestion.matched_planned_item_date || payloadObj.matched_planned_item_date || '';

  const [isEditing, setIsEditing] = useState(false);
  const [titleOverride, setTitleOverride] = useState(suggestedTitle);
  const [dateOverride, setDateOverride] = useState(suggestedDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompletedWork = suggestion.suggestion_type === 'completed_work' || suggestion.suggestion_type === 'work_log';
  const hasMatchedItem = Boolean(suggestion.matched_planned_item_id);

  const onConfirmPlanned = async () => {
    setIsSubmitting(true);
    try {
      await handleConfirmSuggestion(
        suggestion.id,
        undefined,
        titleOverride,
        dateOverride
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmCompletedAction = async (action: 'mark_done' | 'create_new') => {
    setIsSubmitting(true);
    try {
      const resolution = action === 'mark_done' ? 'mark_planned_item_done' : 'create_new_work_log';
      await handleConfirmSuggestion(
        suggestion.id,
        resolution,
        titleOverride,
        dateOverride
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDismiss = async () => {
    setIsSubmitting(true);
    try {
      await handleDismissSuggestion(suggestion.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isCompletedWork
        ? 'bg-[#1e1f26] border-[#df7412]/40 shadow-lg shadow-[#df7412]/5'
        : 'bg-[#1e1f26] border-[#4d8eff]/40 shadow-lg shadow-[#4d8eff]/5'
    }`}>
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
          isCompletedWork
            ? 'bg-[#df7412]/15 text-[#ffb786] border border-[#df7412]/30'
            : 'bg-[#4d8eff]/15 text-[#adc6ff] border border-[#4d8eff]/30'
        }`}>
          {isCompletedWork ? 'Completed Work Signal' : 'Planned Item Suggestion'}
        </span>
        <span className="text-[11px] font-mono text-[#90909a]">
          Confidence: {Math.round(confidence * 100)}%
        </span>
      </div>

      {/* Main Content / Inputs */}
      {isEditing ? (
        <div className="space-y-3 my-3">
          <div>
            <label className="text-[11px] text-[#90909a] font-mono block mb-1">Title</label>
            <input
              type="text"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              className="w-full bg-[#12131a] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#90909a] font-mono block mb-1">Target Date</label>
            <input
              type="date"
              value={dateOverride}
              onChange={(e) => setDateOverride(e.target.value)}
              className="w-full bg-[#12131a] border border-[#292931] rounded-lg px-3 py-1.5 text-xs text-[#e3e1ec]"
            />
          </div>
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-[#adc6ff] hover:underline font-mono"
          >
            Done Editing
          </button>
        </div>
      ) : (
        <div className="my-2">
          <h4 className="font-semibold text-base text-[#e3e1ec]">{titleOverride}</h4>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#c2c6d6] font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#adc6ff]" />
              {dateOverride}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#ffb786]" />
              {suggestedCategory}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-[11px] text-[#adc6ff] hover:underline ml-auto"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Matched Planned Item Callout for Completed Work */}
      {isCompletedWork && (
        <div className="mt-3 mb-4 p-3 bg-[#12131a] rounded-lg border border-[#33343c]">
          {hasMatchedItem ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ffb786]">
                <FileCheck className="w-4 h-4" />
                <span>Matching Planned Item Found</span>
              </div>
              <p className="text-xs text-[#e3e1ec] font-medium pl-5">
                "{matchedTitle}" (Planned for {matchedDate})
              </p>
              <p className="text-[11px] text-[#90909a] pl-5">
                Should WorkPilot mark this planned task as completed?
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#90909a]">
              <AlertCircle className="w-4 h-4 text-[#ffb786]" />
              <span>No matching planned item found in range. A new Work Log will be created.</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#292931]">
        <button
          onClick={onDismiss}
          disabled={isSubmitting}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#c2c6d6] hover:bg-[#292931] flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Dismiss</span>
        </button>

        <div className="flex items-center gap-2">
          {isCompletedWork ? (
            hasMatchedItem ? (
              <>
                <button
                  onClick={() => onConfirmCompletedAction('create_new')}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#292931] hover:bg-[#33343c] text-[#e3e1ec] flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#c0c1ff]" />
                  <span>Create New Log Only</span>
                </button>
                <button
                  onClick={() => onConfirmCompletedAction('mark_done')}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#df7412] hover:bg-[#c8630b] text-white flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Yes, Mark Done & Create Log</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onConfirmCompletedAction('create_new')}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#4d8eff] hover:bg-[#3b7be8] text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Create Work Log</span>
              </button>
            )
          ) : (
            <button
              onClick={onConfirmPlanned}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#4d8eff] hover:bg-[#3b7be8] text-white flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Add to Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
