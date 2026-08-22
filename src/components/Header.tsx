import React from 'react';
import { RotateCw, Sparkles, Layers, FileText, Plus, Shield } from 'lucide-react';
import { Mission } from '../types';

interface HeaderProps {
  activeMission: Mission | null;
  isRunningScan: boolean;
  onTriggerScan: () => void;
  onOpenNewMission: () => void;
  onOpenMissionManager: () => void;
  onOpenMissionDetail: (mission: Mission) => void;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMission,
  isRunningScan,
  onTriggerScan,
  onOpenNewMission,
  onOpenMissionManager,
  onOpenMissionDetail,
  onOpenReport
}) => {
  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[#27272A] bg-[#121214] select-none shrink-0">
      {/* Brand & Active Research Mission */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="bg-[#00FF9C] text-[#0A0A0B] font-black px-2.5 py-1 text-xs tracking-wider rounded-xs shadow-[0_0_12px_rgba(0,255,156,0.35)] shrink-0 font-mono">
          HACKVERSE
        </div>
        <div className="h-4 w-[1px] bg-[#27272A] hidden sm:block shrink-0" />

        {/* Current Active Mission */}
        {activeMission ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider hidden md:inline shrink-0">
              TRACKING:
            </span>
            <button
              onClick={() => onOpenMissionDetail(activeMission)}
              className="flex items-center gap-2 group text-left hover:bg-[#1C1C1F] px-2 py-1 rounded transition-colors truncate"
              title="Click to view full mission research specifications"
            >
              <span className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-[#00FF9C] transition-colors">
                {activeMission.name}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                  activeMission.status === 'active'
                    ? 'bg-[#00FF9C]/15 text-[#00FF9C] border border-[#00FF9C]/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {activeMission.status === 'active' ? 'ACTIVE' : 'PAUSED'}
              </span>
            </button>
          </div>
        ) : (
          <span className="text-[#71717A] font-mono text-xs">NO ACTIVE MISSION</span>
        )}
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs">
        {/* Missions Directory */}
        <button
          onClick={onOpenMissionManager}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border bg-[#18181B] border-[#27272A] text-[#D4D4D8] hover:border-[#00FF9C] hover:text-white transition-colors text-xs font-mono"
          title="Browse, create, or switch tracking missions"
        >
          <Layers className="w-3.5 h-3.5 text-[#00FF9C]" />
          <span className="hidden sm:inline">Missions</span>
        </button>

        {/* New Mission */}
        <button
          onClick={onOpenNewMission}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border bg-[#18181B] border-[#27272A] text-[#D4D4D8] hover:border-[#00FF9C] hover:text-white transition-colors text-xs font-mono"
          title="Create a new research tracking mission"
        >
          <Plus className="w-3.5 h-3.5 text-[#00FF9C]" />
          <span className="hidden md:inline">New Research</span>
        </button>

        {/* Export Briefing Report */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border bg-[#18181B] border-[#27272A] text-[#D4D4D8] hover:border-[#00FF9C] hover:text-white transition-colors text-xs font-mono"
          title="Generate executive intelligence briefing markdown/PDF"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Export Brief</span>
        </button>

        {/* Run Research Scan */}
        <button
          onClick={onTriggerScan}
          disabled={isRunningScan}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(0,255,156,0.25)] ${
            isRunningScan
              ? 'bg-[#00FF9C]/20 border border-[#00FF9C] text-[#00FF9C] animate-pulse cursor-wait'
              : 'bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-[#0A0A0B] cursor-pointer'
          }`}
          title="Trigger immediate multi-source collection and AI analysis"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRunningScan ? 'animate-spin text-[#00FF9C]' : 'text-[#0A0A0B]'}`} />
          <span>{isRunningScan ? 'SCANNING...' : 'RUN SCAN'}</span>
        </button>
      </div>
    </header>
  );
};
