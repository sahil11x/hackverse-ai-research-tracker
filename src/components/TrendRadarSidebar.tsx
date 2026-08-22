import React from 'react';
import { TrendingUp, Bell, CheckCircle2, Zap, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { IntelAlert, TrendSignal } from '../types';

interface TrendRadarSidebarProps {
  trends: TrendSignal[];
  alerts: IntelAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onSelectTrendTopic?: (topic: string) => void;
}

export const TrendRadarSidebar: React.FC<TrendRadarSidebarProps> = ({
  trends,
  alerts,
  onAcknowledgeAlert,
  onSelectTrendTopic
}) => {
  const unreadAlerts = alerts.filter((a) => !a.isRead);

  return (
    <aside className="w-80 border-l border-[#27272A] bg-[#0D0D0F] flex flex-col p-4 shrink-0 overflow-y-auto select-none space-y-6">
      {/* 1. Priority Alerts Notification Panel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono font-semibold flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#FF4F00]" />
            <span>Priority Alerts</span>
          </h3>
          {unreadAlerts.length > 0 && (
            <span className="text-[10px] font-mono text-[#FF4F00] bg-[#FF4F00]/20 px-2 py-0.5 rounded font-bold">
              {unreadAlerts.length} NEW
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {alerts.length === 0 ? (
            <div className="text-xs text-[#71717A] p-3 border border-[#27272A] rounded text-center">
              No active priority alerts.
            </div>
          ) : (
            alerts.slice(0, 4).map((alert) => {
              const isCrit = alert.severity === 'critical';
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded text-xs transition-all relative ${
                    isCrit
                      ? 'bg-[#FF4F00]/10 border border-[#FF4F00]/30 text-white'
                      : 'bg-sky-500/10 border border-sky-500/30 text-white'
                  } ${alert.isRead ? 'opacity-60' : 'opacity-100 shadow-sm'}`}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-1">
                    <span className="font-bold tracking-tight uppercase flex items-center gap-1.5 text-xs truncate">
                      {isCrit ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-[#FF4F00] shrink-0" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      )}
                      <span className={isCrit ? 'text-[#FF4F00]' : 'text-sky-300'}>
                        {alert.headline}
                      </span>
                    </span>
                    {!alert.isRead && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="text-[9px] font-mono px-1.5 py-0.5 bg-black/50 hover:bg-black rounded text-white shrink-0 border border-white/20 transition-colors"
                        title="Mark as acknowledged"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#D4D4D8] leading-relaxed mb-2">
                    {alert.reason}
                  </p>
                  <div className="flex justify-between text-[10px] text-[#71717A] font-mono border-t border-white/10 pt-1.5">
                    <span>{alert.source}</span>
                    <span>{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Emerging Technology Trends */}
      <div className="pt-2 border-t border-[#27272A]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#00FF9C]" />
            <span>Emerging Tech Trends</span>
          </h3>
          <span className="text-[9px] font-mono text-[#00FF9C] bg-[#00FF9C]/10 px-1.5 py-0.5 rounded border border-[#00FF9C]/30">
            AUTO-CLUSTERED
          </span>
        </div>

        <div className="space-y-3">
          {trends.length === 0 ? (
            <div className="text-xs text-[#71717A] p-3 border border-[#27272A] rounded text-center">
              Scanning source clusters for emerging trends...
            </div>
          ) : (
            trends.map((trend) => (
              <div
                key={trend.id}
                onClick={() => onSelectTrendTopic && onSelectTrendTopic(trend.topic)}
                className="bg-[#141416] border border-[#27272A] p-3 rounded hover:border-[#00FF9C] transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                  <span className="text-[#E4E4E7] group-hover:text-white truncate pr-1">
                    {trend.topic}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold shrink-0 ${
                      trend.progressPercent > 50 ? 'text-[#00FF9C]' : 'text-white'
                    }`}
                  >
                    {trend.changePercent}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-[#1C1C1F] rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${
                      trend.progressPercent > 50
                        ? 'bg-[#00FF9C] shadow-[0_0_6px_#00FF9C]'
                        : 'bg-[#71717A]'
                    }`}
                    style={{ width: `${trend.progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-[#71717A]">
                  <span className="capitalize text-[#A1A1AA]">{trend.velocity} Velocity</span>
                  <span>{trend.itemCount} linked sources</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
