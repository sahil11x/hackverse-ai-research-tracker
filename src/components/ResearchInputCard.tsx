import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface ResearchInputCardProps {
  onStartResearch: (prompt: string) => void;
  isWorking?: boolean;
}

const EXAMPLE_SUGGESTIONS = [
  "NVIDIA vs AMD AI accelerators",
  "Quantum computing architectures",
  "Cybersecurity startups",
  "Battery technology breakthroughs",
  "Open-source LLM inference on GitHub"
];

const DEFAULT_PLACEHOLDER =
  "Research NVIDIA's latest AI chips and compare them with AMD and Google. Identify important competitive developments, patents, research papers, technology news, GitHub activity and relevant social-media signals.";

export const ResearchInputCard: React.FC<ResearchInputCardProps> = ({
  onStartResearch,
  isWorking = false
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = prompt.trim() || DEFAULT_PLACEHOLDER;
    onStartResearch(query);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    onStartResearch(suggestion);
  };

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg">
          <Search className="w-5 h-5 text-[#00FF9C]" />
          <span>What do you want me to research?</span>
        </div>
        <span className="text-[11px] font-mono text-[#71717A] hidden sm:inline-block">
          Natural-Language Intelligence Engine
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isWorking}
            rows={3}
            placeholder={DEFAULT_PLACEHOLDER}
            className="w-full bg-[#161618] border border-[#2E2E33] hover:border-[#3F3F46] focus:border-[#00FF9C] rounded-lg p-3.5 text-xs sm:text-sm text-[#E4E4E7] placeholder-[#52525B] focus:outline-none resize-none font-sans leading-relaxed transition-colors disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          {/* Quick Clickable Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#71717A] uppercase mr-1">Examples:</span>
            {EXAMPLE_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                disabled={isWorking}
                className="px-2.5 py-1 bg-[#1A1A1D] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#00FF9C] border border-[#27272A] hover:border-[#00FF9C]/40 rounded text-[11px] font-mono transition-colors disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Start Research Button */}
          <button
            type="submit"
            disabled={isWorking}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-[#0A0A0B] font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 font-mono transition-all transform active:scale-95 shrink-0 shadow-[0_0_20px_rgba(0,255,156,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWorking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0B]" />
                <span>RESEARCHING...</span>
              </>
            ) : (
              <>
                <span>START RESEARCH</span>
                <ArrowRight className="w-4 h-4 text-[#0A0A0B]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
