import React, { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  Sparkles,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  CheckCircle,
  ExternalLink,
  Zap,
  Info
} from 'lucide-react';
import { IntelItem, PriorityLevel } from '../types';

interface IntelFeedProps {
  items: IntelItem[];
  totalSignals: number;
  minRelevanceFilter: number | null;
  onToggleRelevanceFilter: () => void;
  selectedEntity: string | null;
  onSelectItem: (item: IntelItem) => void;
  onOpenReport: () => void;
  activeMissionName?: string;
  onOpenNewMission?: () => void;
}

export const IntelFeed: React.FC<IntelFeedProps> = ({
  items,
  totalSignals,
  minRelevanceFilter,
  onToggleRelevanceFilter,
  selectedEntity,
  onSelectItem,
  onOpenReport,
  activeMissionName = 'AI Semiconductor Intelligence',
  onOpenNewMission
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(8);

  const filteredItems = items.filter((item) => {
    if (selectedEntity && !item.mentionedEntities.includes(selectedEntity)) {
      return false;
    }
    if (sourceFilter !== 'all' && item.source !== sourceFilter) {
      return false;
    }
    if (priorityFilter !== 'all') {
      if (priorityFilter === 'high_impact' && item.strategicPriority !== 'CRITICAL' && item.strategicPriority !== 'STRATEGIC' && item.strategicPriority !== 'HIGH') {
        return false;
      }
      if (priorityFilter === 'critical' && item.strategicPriority !== 'CRITICAL') {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchEntity = item.mentionedEntities.some((e) => e.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchEntity) return false;
    }
    return true;
  });

  const criticalCount = items.filter(i => i.strategicPriority === 'CRITICAL' || i.strategicPriority === 'STRATEGIC').length;
  const displayedItems = filteredItems.slice(0, visibleCount);

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="bg-[#FF4F00] text-[#0A0A0B] text-[10px] font-black px-2 py-0.5 tracking-wider rounded-xs font-mono">
            CRITICAL IMPACT
          </span>
        );
      case 'STRATEGIC':
        return (
          <span className="bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 tracking-wider rounded-xs font-mono">
            STRATEGIC SHIFT
          </span>
        );
      case 'TREND':
        return (
          <span className="bg-amber-400 text-[#0A0A0B] text-[10px] font-bold px-2 py-0.5 tracking-wider rounded-xs font-mono">
            TREND ACCELERATION
          </span>
        );
      case 'HIGH':
        return (
          <span className="bg-[#00FF9C] text-[#0A0A0B] text-[10px] font-bold px-2 py-0.5 tracking-wider rounded-xs font-mono">
            HIGH PRIORITY
          </span>
        );
      default:
        return (
          <span className="bg-[#27272A] text-[#A1A1AA] text-[10px] font-medium px-2 py-0.5 rounded-xs font-mono">
            MEDIUM
          </span>
        );
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-[#0A0A0B] overflow-hidden">
      {/* 1. Research Prompt & Executive Stats Header */}
      <div className="p-4 sm:p-5 border-b border-[#27272A] bg-[#0E0E10] shrink-0 space-y-4">
        {/* Research Mission Objective Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00FF9C]" />
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Intelligence & Research Findings
              </h1>
            </div>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Synthesized research for <strong className="text-white font-medium">{activeMissionName}</strong> across ArXiv preprints, patents, tech news, SEC filings, and benchmarks.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenReport}
              className="bg-[#1C1C1F] hover:bg-[#27272A] border border-[#27272A] text-white text-xs px-3 py-1.5 font-medium rounded flex items-center gap-1.5 transition-colors font-mono"
              title="Download executive research briefing"
            >
              <FileText className="w-3.5 h-3.5 text-[#00FF9C]" />
              <span>Export Report</span>
            </button>
            {onOpenNewMission && (
              <button
                onClick={onOpenNewMission}
                className="bg-[#00FF9C] text-[#0A0A0B] text-xs px-3 py-1.5 font-bold rounded flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-transform font-mono shadow-[0_0_10px_rgba(0,255,156,0.3)]"
              >
                <span>+ Research Topic</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Key Digest Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-[#161618] border border-[#27272A] p-2.5 rounded">
            <div className="text-[10px] font-mono uppercase text-[#71717A]">Sources Analyzed</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{totalSignals.toLocaleString()}</div>
          </div>
          <div className="bg-[#161618] border border-[#27272A] p-2.5 rounded">
            <div className="text-[10px] font-mono uppercase text-[#71717A]">Key Findings</div>
            <div className="text-lg font-bold text-[#00FF9C] font-mono mt-0.5">{items.length}</div>
          </div>
          <div className="bg-[#161618] border border-[#27272A] p-2.5 rounded">
            <div className="text-[10px] font-mono uppercase text-[#71717A]">High Impact Shifts</div>
            <div className="text-lg font-bold text-[#FF4F00] font-mono mt-0.5">{criticalCount}</div>
          </div>
          <div className="bg-[#161618] border border-[#27272A] p-2.5 rounded">
            <div className="text-[10px] font-mono uppercase text-[#71717A]">Active Tracking</div>
            <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">Continuous</div>
          </div>
        </div>

        {/* Search & Filtering Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                type="text"
                placeholder="Search findings by keyword, entity, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161618] border border-[#27272A] text-xs pl-8 pr-3 py-1.5 rounded text-[#E4E4E7] placeholder-[#71717A] focus:border-[#00FF9C] focus:outline-none font-sans"
              />
            </div>
            {selectedEntity && (
              <span className="text-xs font-mono px-2 py-1 bg-[#1C1C1F] border border-[#00FF9C]/40 text-[#00FF9C] rounded flex items-center gap-1 shrink-0">
                <span>Filter: {selectedEntity}</span>
              </span>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono shrink-0">
            <button
              onClick={() => setPriorityFilter(priorityFilter === 'high_impact' ? 'all' : 'high_impact')}
              className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                priorityFilter === 'high_impact'
                  ? 'bg-[#FF4F00]/20 border-[#FF4F00] text-[#FF4F00]'
                  : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:text-white'
              }`}
            >
              High Impact Only
            </button>
            <button
              onClick={onToggleRelevanceFilter}
              className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                minRelevanceFilter !== null
                  ? 'bg-[#00FF9C]/20 border-[#00FF9C] text-[#00FF9C]'
                  : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:text-white'
              }`}
            >
              Rel &gt; 80%
            </button>
          </div>
        </div>

        {/* Source Categories Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono border-t border-[#27272A]/70 pt-2.5">
          <span className="text-[#71717A] uppercase text-[9px] tracking-wider pr-1">Sources:</span>
          {[
            { id: 'all', label: 'All Sources' },
            { id: 'arxiv', label: 'ArXiv Preprints' },
            { id: 'patent', label: 'Patents' },
            { id: 'news', label: 'Tech News' },
            { id: 'sec_filing', label: 'SEC Filings' },
            { id: 'github', label: 'Benchmarks / GitHub' }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSourceFilter(s.id)}
              className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                sourceFilter === s.id
                  ? 'bg-[#1C1C1F] text-[#00FF9C] border border-[#00FF9C]/40 font-bold'
                  : 'text-[#8E8E93] hover:text-white bg-[#141416] border border-[#27272A]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Results List with Readable Cards & "Why It Matters" */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#27272A] rounded bg-[#0D0D0F]">
            <Sparkles className="w-8 h-8 text-[#71717A] mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-[#E4E4E7]">No findings match your current filters</p>
            <p className="text-xs text-[#71717A] mt-1">Try resetting the source category or search keyword.</p>
          </div>
        ) : (
          <>
            {displayedItems.map((item) => {
              const isCritical = item.strategicPriority === 'CRITICAL' || item.strategicPriority === 'STRATEGIC';
              const connectedCount = item.relatedItemIds?.length || 0;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`bg-[#141416] border rounded p-4 sm:p-5 group hover:border-[#00FF9C] transition-all cursor-pointer shadow-sm relative ${
                    isCritical
                      ? 'border-l-4 border-l-[#FF4F00] border-[#27272A]'
                      : 'border-[#27272A]'
                  }`}
                >
                  {/* Card Header: Priority, Source Tag, Date */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPriorityBadge(item.strategicPriority)}
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A]">
                        {item.sourceLabel}
                      </span>
                      <span className="text-[11px] font-mono text-[#71717A]">
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
                      <span className="text-[#00FF9C] font-bold">Rel {item.relevanceScore}%</span>
                      <span className="text-[#71717A]">|</span>
                      <span>Impact: <strong className={item.impactScore >= 80 ? 'text-[#FF4F00]' : 'text-white'}>{item.impactScore}</strong>/100</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#00FF9C] transition-colors leading-snug mb-2">
                    {item.title}
                  </h3>

                  {/* Concise Summary */}
                  <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed mb-3">
                    {item.summary}
                  </p>

                  {/* Highlighted "Why This Matters" Callout Box */}
                  {item.keyImplications && item.keyImplications.length > 0 && (
                    <div className="bg-[#18181B] border border-[#27272A] rounded p-3 mb-3 text-xs">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#00FF9C] font-bold mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#00FF9C]" />
                        <span>Why This Matters:</span>
                      </div>
                      <p className="text-[#E4E4E7] leading-relaxed">
                        {item.keyImplications[0]}
                      </p>
                    </div>
                  )}

                  {/* Card Footer: Impacted Entities & Evidence Link */}
                  <div className="flex items-center justify-between gap-3 pt-1 text-xs font-mono flex-wrap border-t border-[#27272A]/60 mt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#71717A] uppercase">Entities:</span>
                      {item.mentionedEntities.map((ent, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#1C1C1F] text-[#E4E4E7] text-[10px] rounded border border-[#27272A]"
                        >
                          {ent}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      {connectedCount > 0 && (
                        <span className="text-[11px] text-sky-400 font-mono flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> {connectedCount} connected sources
                        </span>
                      )}
                      <span className="text-xs text-[#00FF9C] font-medium flex items-center gap-1 group-hover:underline">
                        <span>View Evidence</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* View All / Load More */}
            {filteredItems.length > visibleCount && (
              <div className="text-center pt-2 pb-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="px-4 py-2 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white text-xs font-mono font-medium rounded transition-colors"
                >
                  View All {filteredItems.length} Findings ({filteredItems.length - visibleCount} more)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
