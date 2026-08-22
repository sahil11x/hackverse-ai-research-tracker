import React, { useState } from 'react';
import { Search, ArrowRight, Loader2 } from 'lucide-react';

interface ResearchInputCardProps {
  onStartResearch: (prompt: string) => void;
  isWorking?: boolean;
}

const EXAMPLE_SUGGESTIONS = [
  "NVIDIA vs AMD AI accelerators",
  "Recent research on AI accelerator architectures",
  "Open-source LLM inference optimization on GitHub"
];

const DEFAULT_PLACEHOLDER =
  "Enter a research query (e.g., Research NVIDIA's AI accelerators by comparing recent arXiv research with open-source GitHub implementations)...";

export const ResearchInputCard: React.FC<ResearchInputCardProps> = ({
  onStartResearch,
  isWorking = false
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = prompt.trim();
    if (!query) return;
    onStartResearch(query);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    onStartResearch(suggestion);
  };

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#00FF9C]" />
          <span>What do you want me to research?</span>
        </h2>
        <span className="text-[11px] font-mono text-[#71717A] hidden sm:inline-block">
          Autonomous Multi-Source Investigation
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isWorking}
          rows={3}
          placeholder={DEFAULT_PLACEHOLDER}
          className="w-full bg-[#161618] border border-[#2A2A2E] focus:border-[#00FF9C] rounded-lg p-3.5 text-sm text-[#E4E4E7] placeholder-[#52525B] focus:outline-none resize-none font-sans leading-relaxed transition-colors disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-0.5">
          {/* Curated Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#71717A] mr-1">Examples:</span>
            {EXAMPLE_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                disabled={isWorking}
                className="px-2.5 py-1 bg-[#18181B] hover:bg-[#222226] text-[#A1A1AA] hover:text-[#00FF9C] border border-[#27272A] hover:border-[#00FF9C]/40 rounded text-xs transition-colors disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={isWorking || !prompt.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#00FF9C] hover:bg-[#00E58C] text-[#0A0A0B] font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 font-mono transition-all transform active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-sm"
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

