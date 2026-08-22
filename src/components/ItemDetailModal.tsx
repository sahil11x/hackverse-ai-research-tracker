import React from 'react';
import { X, ExternalLink, ShieldCheck, Link2, AlertCircle, Cpu, Calendar, Tag } from 'lucide-react';
import { IntelItem } from '../types';

interface ItemDetailModalProps {
  item: IntelItem | null;
  allItems: IntelItem[];
  onClose: () => void;
  onSelectRelated: (item: IntelItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  allItems,
  onClose,
  onSelectRelated
}) => {
  if (!item) return null;

  const relatedItems = allItems.filter((i) => item.relatedItemIds?.includes(i.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-2xl max-h-[85vh] flex flex-col rounded shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#27272A] bg-[#161618] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded ${
                item.strategicPriority === 'CRITICAL'
                  ? 'bg-[#FF4F00] text-[#0A0A0B]'
                  : item.strategicPriority === 'STRATEGIC'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#00FF9C] text-[#0A0A0B]'
              }`}
            >
              {item.strategicPriority}
            </span>
            <span className="text-xs font-mono text-[#71717A] uppercase">
              CATEGORY: {item.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#27272A] rounded text-[#A1A1AA] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#E4E4E7]">
          {/* Title */}
          <div>
            <h3 className="text-lg font-bold text-white leading-snug">{item.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#71717A] mt-2">
              <span className="text-[#00FF9C]">SOURCE: {item.sourceLabel}</span>
              <span>DATE: {new Date(item.publishedAt).toLocaleDateString()}</span>
              <span>CONFIDENCE: {Math.round((item.confidence || 0.92) * 100)}%</span>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#161618] border border-[#27272A] p-3 rounded flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono text-[#71717A]">Relevance Score</div>
                <div className="text-xl font-bold font-mono text-[#00FF9C]">{item.relevanceScore}/100</div>
              </div>
              <div className="w-12 h-1.5 bg-[#0A0A0B] rounded-full overflow-hidden">
                <div className="bg-[#00FF9C] h-full" style={{ width: `${item.relevanceScore}%` }} />
              </div>
            </div>

            <div className="bg-[#161618] border border-[#27272A] p-3 rounded flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono text-[#71717A]">Impact Score</div>
                <div className="text-xl font-bold font-mono text-[#FF4F00]">{item.impactScore}/100</div>
              </div>
              <div className="w-12 h-1.5 bg-[#0A0A0B] rounded-full overflow-hidden">
                <div className="bg-[#FF4F00] h-full" style={{ width: `${item.impactScore}%` }} />
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-mono text-[#71717A] mb-2">
              Actionable Executive Summary
            </h4>
            <div className="p-3.5 bg-[#161618] border border-[#27272A] rounded text-xs text-[#E4E4E7] leading-relaxed">
              {item.summary}
            </div>
          </div>

          {/* Strategic Implications */}
          {item.keyImplications && item.keyImplications.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-[#71717A] mb-2">
                Strategic Implications & Market Shifts
              </h4>
              <ul className="space-y-2 text-xs text-[#A1A1AA]">
                {item.keyImplications.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-[#161618]/50 p-2.5 rounded border border-[#27272A]/50">
                    <span className="text-[#00FF9C] font-mono font-bold">›</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Supporting Evidence Snippet */}
          {item.evidenceSnippet && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-[#71717A] mb-2">
                Supporting Evidence & Raw Signal
              </h4>
              <div className="p-3 bg-[#0A0A0B] border border-[#27272A] rounded text-xs font-mono text-[#00FF9C]/80 leading-relaxed">
                "{item.evidenceSnippet}"
              </div>
            </div>
          )}

          {/* Mentioned Target Entities */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-mono text-[#71717A] mb-2">
              Impacted Competitors & Entities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {item.mentionedEntities.map((ent, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#1C1C1F] border border-[#27272A] rounded text-xs text-[#E4E4E7] font-mono"
                >
                  {ent}
                </span>
              ))}
            </div>
          </div>

          {/* Connected Cross-Source Items */}
          {relatedItems.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-[#71717A] mb-2 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#00FF9C]" />
                <span>Connected Intelligence Signals ({relatedItems.length})</span>
              </h4>
              <div className="space-y-2">
                {relatedItems.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="w-full text-left p-2.5 bg-[#161618] hover:bg-[#1C1C1F] border border-[#27272A] hover:border-[#00FF9C] rounded flex items-center justify-between transition-colors"
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-medium text-[#E4E4E7] truncate">{rel.title}</div>
                      <div className="text-[10px] font-mono text-[#71717A]">{rel.sourceLabel}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#00FF9C] shrink-0">VIEW ›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#27272A] bg-[#161618] flex justify-between items-center">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono text-[#00FF9C] hover:underline"
          >
            <span>OPEN ORIGINAL EVIDENCE URL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1C1C1F] hover:bg-[#27272A] border border-[#27272A] text-xs font-mono text-white rounded transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
