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
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp
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
  return (
    <aside className="w-72 border-r border-[#27272A] bg-[#0D0D0F] flex flex-col shrink-0 select-none overflow-y-auto">
      {/* 1. Research Task & Mission Header */}
      <div className="p-4 border-b border-[#27272A] bg-[#121214] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#71717A] font-mono font-semibold">
            Tracking Mission
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMissionManager}
              className="text-[#A1A1AA] hover:text-[#00FF9C] flex items-center gap-1 text-[10px] font-mono transition-colors"
              title="Open missions manager"
            >
              <Layers className="w-3 h-3 text-[#00FF9C]" />
              <span>Switch</span>
            </button>
            <button
              onClick={onOpenNewMission}
              className="flex items-center gap-0.5 text-[#00FF9C] hover:underline text-[10px] font-mono font-bold"
              title="Create new mission"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Mission Selector */}
        <select
          value={activeMission?.id || ''}
          onChange={(e) => onSelectMission(e.target.value)}
          className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-sm text-xs px-2.5 py-2 text-[#E4E4E7] focus:border-[#00FF9C] focus:outline-none cursor-pointer font-sans truncate font-medium"
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
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-medium border transition-colors ${
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
              title="View full mission specifications and query vectors"
            >
              <Info className="w-3 h-3 text-[#00FF9C]" />
              <span>Parameters</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* 2. What Changed Since Last Scan (Tracking Highlights) */}
        <section className="bg-[#141416] border border-[#27272A] rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-mono font-semibold flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Changed Since Last Scan</span>
            </h3>
            <span className="text-[9px] font-mono text-[#00FF9C] bg-[#00FF9C]/10 px-1.5 py-0.2 rounded font-bold">
              3 UPDATES
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#D4D4D8]">
            <div className="p-1.5 bg-[#1C1C1F] rounded border-l-2 border-l-[#00FF9C] text-[11px]">
              <div className="font-semibold text-white flex items-center justify-between">
                <span>NVIDIA</span>
                <span className="text-[9px] text-[#71717A] font-mono">Patent</span>
              </div>
              <p className="text-[10px] text-[#A1A1AA] mt-0.5 line-clamp-1">
                Advanced CoWoS-L wafer interposer design
              </p>
            </div>

            <div className="p-1.5 bg-[#1C1C1F] rounded border-l-2 border-l-sky-400 text-[11px]">
              <div className="font-semibold text-white flex items-center justify-between">
                <span>AMD</span>
                <span className="text-[9px] text-[#71717A] font-mono">Research</span>
              </div>
              <p className="text-[10px] text-[#A1A1AA] mt-0.5 line-clamp-1">
                ROCm 6.2 kernel compiler Triton benchmark
              </p>
            </div>

            <div className="p-1.5 bg-[#1C1C1F] rounded border-l-2 border-l-amber-400 text-[11px]">
              <div className="font-semibold text-white flex items-center justify-between">
                <span>Google</span>
                <span className="text-[9px] text-[#71717A] font-mono">Benchmark</span>
              </div>
              <p className="text-[10px] text-[#A1A1AA] mt-0.5 line-clamp-1">
                Axion ARM architecture cloud performance
              </p>
            </div>
          </div>
        </section>

        {/* 3. Monitored Companies & Competitors */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] uppercase tracking-wider text-[#71717A] font-mono font-semibold flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[#00FF9C]" />
              <span>Monitored Companies</span>
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
          <div className="space-y-1">
            {activeMission?.targetEntities.map((entity, idx) => {
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
        </section>

        {/* 4. Target Keywords */}
        {activeMission?.keywords && activeMission.keywords.length > 0 && (
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-[#71717A] mb-2 font-mono font-semibold flex items-center gap-1.5">
              <Key className="w-3 h-3 text-amber-400" />
              <span>Target Keywords</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {activeMission.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[#18181B] rounded text-[10px] text-amber-200/90 border border-[#27272A] font-mono"
                >
                  {kw}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 5. Preferred Sources */}
        <section>
          <h3 className="text-[10px] uppercase tracking-wider text-[#71717A] mb-2 font-mono font-semibold flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-[#00FF9C]" />
            <span>Active Sources</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(activeMission?.preferredSources || ['arxiv', 'patent', 'news', 'sec_filing', 'github']).map((src, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-[#1C1C1F] rounded text-[9px] text-[#A1A1AA] border border-[#27272A] font-mono uppercase"
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
          <span className="font-semibold">Auto-Track: {activeMission?.frequencyMinutes || 30}m</span>
        </div>
        <span>{activeMission?.totalSignalsScanned || 1420} signals</span>
      </div>
    </aside>
  );
};
