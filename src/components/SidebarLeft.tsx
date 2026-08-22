import React from 'react';
import {
  Plus,
  Layers,
  Building2,
  Key,
  Globe,
  PauseCircle,
  CheckCircle2,
  Info,
  Target,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { Mission } from '../types';

interface SidebarLeftProps {
  missions: Mission[];
  activeMission: Mission | null;
  onSelectMission: (id: string) => void;
  onOpenNewMission: () => void;
  onOpenMissionManager: () => void;
  onOpenMissionDetail: (mission: Mission) => void;
  onToggleStatus: (id: string) => void;
  selectedEntity: string | null;
  onSelectEntity: (entityName: string | null) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  missions,
  activeMission,
  onSelectMission,
  onOpenNewMission,
  onOpenMissionManager,
  onOpenMissionDetail,
  onToggleStatus,
  selectedEntity,
  onSelectEntity
}) => {
  const targetEntities = activeMission?.targetEntities || [];
  const companiesList = activeMission?.companies || [];
  const competitorsList = activeMission?.competitors || [];

  return (
    <aside className="w-72 border-r border-[#27272A] bg-[#0D0D0F] flex flex-col shrink-0 select-none overflow-y-auto">
      {/* 1. Research Mission Selector & Tracking Controls */}
      <div className="p-4 border-b border-[#27272A] bg-[#121214] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#71717A] font-mono font-semibold">
            Active Mission
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMissionManager}
              className="text-[#A1A1AA] hover:text-[#00FF9C] flex items-center gap-1 text-[10px] font-mono transition-colors"
              title="Open missions manager directory"
            >
              <Layers className="w-3 h-3 text-[#00FF9C]" />
              <span>All ({missions.length})</span>
            </button>
            <button
              onClick={onOpenNewMission}
              className="flex items-center gap-0.5 text-[#00FF9C] hover:underline text-[10px] font-mono font-bold"
              title="Create new research mission"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Mission Selector Dropdown */}
        <select
          value={activeMission?.id || ''}
          onChange={(e) => onSelectMission(e.target.value)}
          className="w-full bg-[#1C1C1F] border border-[#27272A] rounded text-xs px-2.5 py-2 text-[#E4E4E7] focus:border-[#00FF9C] focus:outline-none cursor-pointer font-sans truncate font-medium"
        >
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {activeMission && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onToggleStatus(activeMission.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-medium border transition-colors ${
                activeMission.status === 'active'
                  ? 'bg-[#00FF9C]/10 border-[#00FF9C]/40 text-[#00FF9C] hover:bg-[#00FF9C]/20'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Toggle continuous tracking status"
            >
              {activeMission.status === 'active' ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>TRACKING ON</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3 h-3" />
                  <span>PAUSED</span>
                </>
              )}
            </button>

            <button
              onClick={() => onOpenMissionDetail(activeMission)}
              className="text-[#A1A1AA] hover:text-white flex items-center gap-1 text-[10px] font-mono hover:underline"
              title="View full research specifications and parameters"
            >
              <Info className="w-3 h-3 text-[#00FF9C]" />
              <span>Details</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* 2. Target Entities & Competitors Filter */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-mono font-semibold flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[#00FF9C]" />
              <span>Target Entities ({targetEntities.length || companiesList.length})</span>
            </h3>
            {selectedEntity && (
              <button
                onClick={() => onSelectEntity(null)}
                className="text-[9px] text-[#00FF9C] hover:underline font-mono"
              >
                Reset Filter
              </button>
            )}
          </div>

          {targetEntities.length > 0 ? (
            <div className="space-y-1">
              {targetEntities.map((entity, idx) => {
                const isSelected = selectedEntity === entity.name;
                const isCompetitor = entity.type === 'competitor' || entity.role.toLowerCase().includes('competitor');
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectEntity(isSelected ? null : entity.name)}
                    className={`w-full text-left flex items-center justify-between text-xs p-2 rounded transition-all ${
                      isSelected
                        ? 'bg-[#1C1C1F] border border-[#00FF9C] text-white shadow-[0_0_8px_rgba(0,255,156,0.15)]'
                        : 'hover:bg-[#161618] text-[#A1A1AA] border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-1">
                      <span className="font-medium text-[#E4E4E7] text-[11px] truncate">
                        {entity.name}
                      </span>
                      <span className="text-[9px] text-[#71717A] truncate">{entity.role}</span>
                    </div>
                    {isCompetitor ? (
                      <span className="text-[8px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 shrink-0">
                        COMPETITOR
                      </span>
                    ) : entity.ticker ? (
                      <span className="text-[9px] font-mono text-[#00FF9C] bg-[#0A0A0B] px-1.5 py-0.5 rounded shrink-0">
                        {entity.ticker}
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono text-[#71717A] shrink-0">TRACKED</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : companiesList.length > 0 ? (
            <div className="space-y-1">
              {companiesList.map((company, idx) => {
                const isSelected = selectedEntity === company;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectEntity(isSelected ? null : company)}
                    className={`w-full text-left flex items-center justify-between text-xs p-2 rounded transition-all ${
                      isSelected
                        ? 'bg-[#1C1C1F] border border-[#00FF9C] text-white'
                        : 'hover:bg-[#161618] text-[#A1A1AA]'
                    }`}
                  >
                    <span className="font-medium text-[#E4E4E7] text-[11px]">{company}</span>
                    <span className="text-[8px] font-mono text-[#00FF9C]">PRIMARY</span>
                  </button>
                );
              })}
              {competitorsList.map((comp, idx) => {
                const isSelected = selectedEntity === comp;
                return (
                  <button
                    key={`comp-${idx}`}
                    onClick={() => onSelectEntity(isSelected ? null : comp)}
                    className={`w-full text-left flex items-center justify-between text-xs p-2 rounded transition-all ${
                      isSelected
                        ? 'bg-[#1C1C1F] border border-[#00FF9C] text-white'
                        : 'hover:bg-[#161618] text-[#A1A1AA]'
                    }`}
                  >
                    <span className="font-medium text-[#E4E4E7] text-[11px]">{comp}</span>
                    <span className="text-[8px] font-mono text-sky-400">COMPETITOR</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-2.5 bg-[#141416] border border-[#27272A] rounded text-[11px] text-[#71717A] italic">
              No specific corporate entities identified (Domain-wide research).
            </div>
          )}
        </section>

        {/* 3. Target Keywords */}
        {activeMission?.keywords && activeMission.keywords.length > 0 && (
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-[#A1A1AA] mb-2 font-mono font-semibold flex items-center gap-1.5">
              <Key className="w-3 h-3 text-amber-400" />
              <span>Keywords Tracked</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {activeMission.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[#161618] rounded text-[10px] text-amber-200/90 border border-[#27272A] font-mono"
                >
                  {kw}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 4. Research Scope & Interests */}
        {activeMission?.researchInterests && activeMission.researchInterests.length > 0 && (
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-[#A1A1AA] mb-2 font-mono font-semibold flex items-center gap-1.5">
              <Target className="w-3 h-3 text-sky-400" />
              <span>Research Focus</span>
            </h3>
            <div className="space-y-1 text-xs text-[#D4D4D8]">
              {activeMission.researchInterests.map((interest, idx) => (
                <div key={idx} className="p-1.5 bg-[#141416] rounded border border-[#27272A] text-[11px] flex items-start gap-1.5">
                  <span className="text-[#00FF9C] font-mono">›</span>
                  <span>{interest}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Active Query Sources */}
        <section>
          <h3 className="text-[10px] uppercase tracking-wider text-[#A1A1AA] mb-2 font-mono font-semibold flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-[#00FF9C]" />
            <span>Configured Sources</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(activeMission?.preferredSources || ['arxiv', 'patent', 'news', 'sec_filing', 'social_media', 'github']).map((src, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-[#141416] rounded text-[9px] text-[#A1A1AA] border border-[#27272A] font-mono uppercase"
              >
                {src.replace('_', ' ')}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Clean Status Footer */}
      <div className="p-3 border-t border-[#27272A] bg-[#121214] flex items-center justify-between text-[10px] font-mono text-[#71717A]">
        <div className="flex items-center gap-1.5 text-[#00FF9C]">
          <span className="w-2 h-2 rounded-full bg-[#00FF9C] shadow-[0_0_6px_#00FF9C]" />
          <span className="font-semibold">Cadence: {activeMission?.frequencyMinutes || 30}m</span>
        </div>
        <span>{activeMission?.totalSignalsScanned || 1204} signals</span>
      </div>
    </aside>
  );
};
