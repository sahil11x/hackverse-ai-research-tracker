import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Loader2, Sparkles, Database, FileSearch, Cpu, ArrowRight } from 'lucide-react';

interface AiWorkingStateProps {
  currentTopic?: string;
}

interface StepItem {
  id: string;
  title: string;
  activeLabel: string;
  completedLabel: string;
  durationMs: number;
}

const STEPS: StepItem[] = [
  {
    id: 'step-1',
    title: 'Understanding research objective...',
    activeLabel: 'Parsing entities, technical concepts & competitor scope',
    completedLabel: 'Research objective identified',
    durationMs: 900
  },
  {
    id: 'step-2',
    title: 'Planning research sources...',
    activeLabel: 'Evaluating ArXiv, Patents, Tech News, SEC Filings, Social Media, GitHub',
    completedLabel: 'Relevant sources selected',
    durationMs: 1100
  },
  {
    id: 'step-3',
    title: 'Collecting evidence...',
    activeLabel: 'Querying technical disclosures & verified repository feeds',
    completedLabel: 'Research sources queried',
    durationMs: 1300
  },
  {
    id: 'step-4',
    title: 'Analyzing competitive signals...',
    activeLabel: 'Cross-correlating breakthroughs, yield data & supply chain reports',
    completedLabel: 'Evidence analyzed',
    durationMs: 1200
  },
  {
    id: 'step-5',
    title: 'Synthesizing actionable intelligence...',
    activeLabel: 'Formulating What Changed, Why It Matters & Recommended Actions',
    completedLabel: 'Actionable intelligence generated',
    durationMs: 1000
  }
];

export const AiWorkingState: React.FC<AiWorkingStateProps> = ({ currentTopic }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStepIndex < STEPS.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, STEPS[currentStepIndex].durationMs);
    }
    return () => clearTimeout(timer);
  }, [currentStepIndex]);

  return (
    <div className="bg-[#121214] border border-[#00FF9C]/40 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#00FF9C]/10 border border-[#00FF9C]/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#00FF9C] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FF9C] font-bold bg-[#00FF9C]/10 px-2 py-0.5 rounded">
                AUTONOMOUS PIPELINE
              </span>
              <span className="text-xs font-mono text-[#71717A]">Processing query</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              AI WORKING
            </h2>
          </div>
        </div>

        {currentTopic && (
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-mono uppercase text-[#71717A] block">Target Focus</span>
            <span className="text-xs font-mono text-[#00FF9C] truncate max-w-xs block font-bold">
              {currentTopic}
            </span>
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-lg border transition-all ${
                isDone
                  ? 'bg-[#161618] border-[#00FF9C]/30 text-[#E4E4E7]'
                  : isCurrent
                  ? 'bg-[#18181C] border-[#00FF9C] shadow-[0_0_15px_rgba(0,255,156,0.1)] text-white'
                  : 'bg-[#121214]/50 border-[#27272A]/50 text-[#71717A]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[#00FF9C] shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-[#00FF9C] animate-spin shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#3F3F46] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-mono text-[#71717A]">{idx + 1}</span>
                    </div>
                  )}

                  <div>
                    <div className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                      <span>{step.title}</span>
                    </div>
                    <div className="text-[11px] font-mono mt-0.5">
                      {isDone ? (
                        <span className="text-[#00FF9C] font-medium">✓ {step.completedLabel}</span>
                      ) : isCurrent ? (
                        <span className="text-sky-400">● {step.activeLabel}...</span>
                      ) : (
                        <span className="text-[#52525B]">Pending queue</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#71717A] shrink-0">
                  {isDone ? 'COMPLETED' : isCurrent ? 'IN PROGRESS' : 'QUEUED'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#161618] border border-[#27272A] rounded-lg text-xs font-mono text-[#71717A] flex items-center justify-between">
        <span>Grounded Multi-Source Validation • Zero Hallucination Mode</span>
        <span className="text-[#00FF9C] animate-pulse">Running cycle...</span>
      </div>
    </div>
  );
};
