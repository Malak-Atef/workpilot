import React, { useState } from 'react';
import { Send, Zap, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const QuickCaptureBar: React.FC = () => {
  const { captureInput, setCaptureInput, handleCaptureSubmit, isCapturing } = useStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const examples = [
    "Check school printers tomorrow",
    "Finished checking school printers",
    "Prepare laptops for MAP testing tomorrow",
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captureInput.trim() || isCapturing) return;
    setErrorMsg(null);
    try {
      await handleCaptureSubmit(captureInput);
    } catch (err: any) {
      setErrorMsg(err.message || 'Capture failed');
    }
  };

  const handleExampleClick = (ex: string) => {
    setCaptureInput(ex);
  };

  return (
    <div className="bg-[#1e1f26] border border-[#292931] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Decorative top ambient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4d8eff] via-[#adc6ff] to-[#ffb786]"></div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#4d8eff]/10 text-[#adc6ff] flex items-center justify-center border border-[#4d8eff]/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#e3e1ec]">Quick Capture</h3>
            <p className="text-xs text-[#90909a]">Type naturally to plan or log IT work with zero friction</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#90909a] bg-[#12131a] px-2.5 py-1 rounded-md border border-[#292931]">
          <Sparkles className="w-3 h-3 text-[#adc6ff]" />
          <span>Rule Interpreter Active</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="relative mt-2">
        <input
          type="text"
          value={captureInput}
          onChange={(e) => setCaptureInput(e.target.value)}
          placeholder="e.g. 'Check school printers tomorrow' or 'Finished checking school printers'"
          className="w-full bg-[#12131a] border border-[#33343c] focus:border-[#4d8eff] text-sm text-[#e3e1ec] placeholder-[#6b7280] rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-1 focus:ring-[#4d8eff] transition-all font-sans"
        />
        <button
          type="submit"
          disabled={!captureInput.trim() || isCapturing}
          className="absolute right-2 top-2 bottom-2 px-3.5 bg-[#4d8eff] hover:bg-[#3b7be8] disabled:opacity-40 disabled:hover:bg-[#4d8eff] text-white rounded-lg flex items-center justify-center transition-all font-medium text-xs gap-1.5 cursor-pointer disabled:cursor-not-allowed"
        >
          {isCapturing ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Capture</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {errorMsg && (
        <p className="text-xs text-rose-400 mt-2 font-mono">{errorMsg}</p>
      )}

      {/* Quick Example Chips */}
      <div className="flex items-center gap-2 mt-3 text-xs">
        <span className="text-[#90909a] font-mono text-[11px]">Try:</span>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleExampleClick(ex)}
              className="px-2.5 py-1 rounded-md bg-[#292931]/60 hover:bg-[#33343c] text-[#c2c6d6] hover:text-[#e3e1ec] border border-[#33343c] transition-all text-xs cursor-pointer font-mono text-[11px]"
            >
              "{ex}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
