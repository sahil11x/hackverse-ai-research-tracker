import React, { useEffect, useState, useCallback } from 'react';
import { api, CreateMissionPayload } from './services/api';
import { IntelAlert, IntelItem, Mission, SystemLog, TrendSignal } from './types';
import { Header } from './components/Header';
import { SidebarLeft } from './components/SidebarLeft';
import { IntelFeed } from './components/IntelFeed';
import { TrendRadarSidebar } from './components/TrendRadarSidebar';
import { FooterTerminal } from './components/FooterTerminal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ResearchAssistantModal } from './components/ResearchAssistantModal';
import { MissionFormModal } from './components/MissionFormModal';
import { MissionDetailModal } from './components/MissionDetailModal';
import { MissionManagerModal } from './components/MissionManagerModal';
import { ExportReportModal } from './components/ExportReportModal';

export default function App() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [intelItems, setIntelItems] = useState<IntelItem[]>([]);
  const [trends, setTrends] = useState<TrendSignal[]>([]);
  const [alerts, setAlerts] = useState<IntelAlert[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Filters & State
  const [minRelevanceFilter, setMinRelevanceFilter] = useState<number | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [isRunningScan, setIsRunningScan] = useState<boolean>(false);

  // Modals
  const [selectedItem, setSelectedItem] = useState<IntelItem | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');

  // Mission Management Modals
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isMissionFormOpen, setIsMissionFormOpen] = useState<boolean>(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [isMissionDetailOpen, setIsMissionDetailOpen] = useState<boolean>(false);
  const [detailMission, setDetailMission] = useState<Mission | null>(null);
  const [isMissionManagerOpen, setIsMissionManagerOpen] = useState<boolean>(false);

  // Load Mission Data
  const loadActiveMissionData = useCallback(async (missionId: string) => {
    try {
      const [itemsRes, trendsRes, alertsRes, logsRes] = await Promise.all([
        api.getIntelItems(missionId, { minRelevance: minRelevanceFilter || undefined }),
        api.getTrends(missionId),
        api.getAlerts(missionId),
        api.getLogs()
      ]);

      setIntelItems(itemsRes.items || []);
      setTrends(trendsRes || []);
      setAlerts(alertsRes || []);
      setLogs(logsRes || []);
    } catch (err) {
      console.error('Failed to load mission data:', err);
    }
  }, [minRelevanceFilter]);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const { missions: loadedMissions, activeMissionId } = await api.getMissions();
        setMissions(loadedMissions);
        const current = loadedMissions.find((m) => m.id === activeMissionId) || loadedMissions[0];
        if (current) {
          setActiveMission(current);
          await loadActiveMissionData(current.id);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    init();
  }, [loadActiveMissionData]);

  // Background Heartbeat for Logs and Telemetry (Every 4s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [updatedLogs, updatedAlerts] = await Promise.all([
          api.getLogs(),
          activeMission ? api.getAlerts(activeMission.id) : Promise.resolve([])
        ]);
        setLogs(updatedLogs);
        if (updatedAlerts) setAlerts(updatedAlerts);
      } catch (err) {
        // silent fail on background tick
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeMission]);

  // Switch Mission
  const handleSelectMission = async (missionId: string) => {
    try {
      await api.setActiveMission(missionId);
      const target = missions.find((m) => m.id === missionId);
      if (target) {
        setActiveMission(target);
        setSelectedEntity(null);
        await loadActiveMissionData(missionId);
      }
    } catch (err) {
      console.error('Failed to switch mission:', err);
    }
  };

  // Trigger Immediate Pipeline Run for Active or Specific Mission
  const handleTriggerScan = async (missionId?: string) => {
    const targetMissionId = missionId || activeMission?.id;
    if (!targetMissionId || isRunningScan) return;
    setIsRunningScan(true);
    try {
      await api.runAutonomousCycle(targetMissionId);
      // Reload mission list for updated stats
      const { missions: updatedMissions } = await api.getMissions();
      setMissions(updatedMissions);

      if (activeMission?.id === targetMissionId) {
        const refreshed = updatedMissions.find((m) => m.id === targetMissionId);
        if (refreshed) setActiveMission(refreshed);
        await loadActiveMissionData(targetMissionId);
      }
    } catch (err) {
      console.error('Scan execution error:', err);
    } finally {
      setIsRunningScan(false);
    }
  };

  // Create or Update Mission
  const handleSaveMission = async (
    payload: CreateMissionPayload,
    isEditing: boolean,
    missionId?: string
  ) => {
    if (isEditing && missionId) {
      const updated = await api.updateMission(missionId, payload);
      const { missions: updatedMissions } = await api.getMissions();
      setMissions(updatedMissions);
      if (activeMission?.id === missionId) {
        setActiveMission(updated);
      }
      if (detailMission?.id === missionId) {
        setDetailMission(updated);
      }
    } else {
      const created = await api.createMission(payload);
      const { missions: updatedMissions } = await api.getMissions();
      setMissions(updatedMissions);
      setActiveMission(created);
      setSelectedEntity(null);
      await loadActiveMissionData(created.id);
    }
  };

  // Delete Mission
  const handleDeleteMission = async (missionId: string) => {
    if (missions.length <= 1) {
      alert('At least one tracking mission must be maintained in the system.');
      return;
    }
    const target = missions.find((m) => m.id === missionId);
    if (!window.confirm(`Are you sure you want to delete mission "${target?.name || missionId}"?`)) {
      return;
    }

    try {
      await api.deleteMission(missionId);
      const { missions: updatedMissions, activeMissionId } = await api.getMissions();
      setMissions(updatedMissions);

      if (detailMission?.id === missionId) {
        setIsMissionDetailOpen(false);
        setDetailMission(null);
      }

      if (activeMission?.id === missionId) {
        const nextActive = updatedMissions.find((m) => m.id === activeMissionId) || updatedMissions[0];
        if (nextActive) {
          setActiveMission(nextActive);
          setSelectedEntity(null);
          await loadActiveMissionData(nextActive.id);
        }
      }
    } catch (err) {
      console.error('Failed to delete mission:', err);
    }
  };

  // Toggle Mission Status (Activate / Pause)
  const handleToggleMissionStatus = async (missionId: string) => {
    try {
      const updated = await api.toggleMissionStatus(missionId);
      setMissions((prev) => prev.map((m) => (m.id === missionId ? updated : m)));
      if (activeMission?.id === missionId) {
        setActiveMission(updated);
      }
      if (detailMission?.id === missionId) {
        setDetailMission(updated);
      }
    } catch (err) {
      console.error('Failed to toggle mission status:', err);
    }
  };

  // Open AI Research Assistant Chatbot Modal
  const handleOpenAssistant = () => {
    setIsAssistantOpen(true);
  };

  // Open Create Mission Form Modal (Advanced)
  const handleOpenCreateMission = () => {
    setEditingMission(null);
    setIsMissionFormOpen(true);
  };

  // Open Edit Mission Modal
  const handleOpenEditMission = (mission: Mission) => {
    setEditingMission(mission);
    setIsMissionFormOpen(true);
  };

  // Open View Mission Detail Modal
  const handleOpenViewMission = (mission: Mission) => {
    setDetailMission(mission);
    setIsMissionDetailOpen(true);
  };

  // Acknowledge Alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!activeMission) return;
    await api.markAlertRead(activeMission.id, alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  // Open Intelligence Report
  const handleOpenReport = async () => {
    if (!activeMission) return;
    try {
      const res = await api.getReport(activeMission.id);
      setReportMarkdown(res.reportMarkdown);
      setIsReportOpen(true);
    } catch (err) {
      console.error('Failed to load report:', err);
    }
  };

  const handleToggleRelevanceFilter = () => {
    setMinRelevanceFilter((prev) => (prev === 80 ? null : 80));
  };

  // Direct Natural-Language Research Trigger
  const handleStartResearch = async (promptText: string) => {
    if (isRunningScan) return;
    setIsRunningScan(true);
    try {
      const structured = await api.parseResearchPrompt(promptText);
      const payload: CreateMissionPayload = {
        name: structured.name,
        topic: structured.topic,
        description: structured.description,
        companies: structured.companies,
        competitors: structured.competitors,
        keywords: structured.keywords,
        researchInterests: structured.researchInterests,
        preferredSources: structured.preferredSources,
        status: 'active',
        frequencyMinutes: 30
      };

      const newMission = await api.createMission(payload);
      const { missions: updatedMissions } = await api.getMissions();
      setMissions(updatedMissions);
      setActiveMission(newMission);
      setSelectedEntity(null);

      await api.runAutonomousCycle(newMission.id);
      await loadActiveMissionData(newMission.id);
    } catch (err) {
      console.error('Failed to run autonomous research:', err);
    } finally {
      setIsRunningScan(false);
    }
  };

  return (
    <div className="bg-[#0A0A0B] text-[#E4E4E7] w-full h-screen flex flex-col font-sans overflow-hidden border border-[#27272A]">
      {/* Top Header */}
      <Header
        activeMission={activeMission}
        isRunningScan={isRunningScan}
        onTriggerScan={() => handleTriggerScan()}
        onOpenNewMission={handleOpenAssistant}
        onOpenMissionManager={() => setIsMissionManagerOpen(true)}
        onOpenMissionDetail={handleOpenViewMission}
        onOpenReport={handleOpenReport}
        onToggleStatus={handleToggleMissionStatus}
      />

      {/* Main 3-Pane Center Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Target Entities & Vectors */}
        <SidebarLeft
          missions={missions}
          activeMission={activeMission}
          onSelectMission={handleSelectMission}
          onOpenNewMission={handleOpenAssistant}
          onOpenMissionManager={() => setIsMissionManagerOpen(true)}
          onOpenMissionDetail={handleOpenViewMission}
          onToggleStatus={handleToggleMissionStatus}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
        />

        {/* Center: Actionable Intelligence Feed */}
        <IntelFeed
          items={intelItems}
          totalSignals={activeMission?.totalSignalsScanned || 1204}
          minRelevanceFilter={minRelevanceFilter}
          onToggleRelevanceFilter={handleToggleRelevanceFilter}
          selectedEntity={selectedEntity}
          onSelectItem={setSelectedItem}
          onOpenReport={handleOpenReport}
          activeMissionName={activeMission?.name || 'AI Semiconductor Intelligence'}
          activeMissionTopic={activeMission?.topic || activeMission?.name}
          activeMissionDescription={activeMission?.description}
          activeMissionStatus={activeMission?.status}
          onOpenNewMission={handleOpenAssistant}
          sourcesUsedSummary={activeMission?.sourcesUsedSummary}
          preferredSources={activeMission?.preferredSources}
          onStartResearch={handleStartResearch}
          isWorkingScan={isRunningScan}
          onToggleTracking={() => activeMission && handleToggleMissionStatus(activeMission.id)}
          orchestration={activeMission?.lastOrchestration}
        />

        {/* Right Sidebar: Trend Detection Radar & Live Alerts */}
        <TrendRadarSidebar
          trends={trends}
          alerts={alerts}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onSelectTrendTopic={(topic) => {
            console.log('Selected trend topic:', topic);
          }}
        />
      </main>

      {/* Bottom Console Terminal: Logs & Latency Gauge */}
      <FooterTerminal
        logs={logs}
        meanLatencyMs={activeMission?.meanLatencyMs || 7.4}
      />

      {/* AI Research Assistant Chatbot Modal */}
      <ResearchAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onStartResearch={async (payload) => {
          await handleSaveMission(payload, false);
        }}
        onOpenAdvancedForm={() => {
          setIsAssistantOpen(false);
          handleOpenCreateMission();
        }}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        allItems={intelItems}
        onClose={() => setSelectedItem(null)}
        onSelectRelated={(related) => setSelectedItem(related)}
      />

      {/* Mission Form Modal (Create & Edit) */}
      <MissionFormModal
        isOpen={isMissionFormOpen}
        initialMission={editingMission}
        onClose={() => {
          setIsMissionFormOpen(false);
          setEditingMission(null);
        }}
        onSave={handleSaveMission}
      />

      {/* Mission Detail Modal (View Specification) */}
      <MissionDetailModal
        isOpen={isMissionDetailOpen}
        mission={detailMission}
        isActive={activeMission?.id === detailMission?.id}
        onClose={() => {
          setIsMissionDetailOpen(false);
          setDetailMission(null);
        }}
        onSetActive={handleSelectMission}
        onToggleStatus={handleToggleMissionStatus}
        onEdit={(m) => {
          setIsMissionDetailOpen(false);
          handleOpenEditMission(m);
        }}
        onDelete={handleDeleteMission}
        onRunCycle={handleTriggerScan}
      />

      {/* Mission Manager Directory Modal */}
      <MissionManagerModal
        isOpen={isMissionManagerOpen}
        missions={missions}
        activeMissionId={activeMission?.id || ''}
        onClose={() => setIsMissionManagerOpen(false)}
        onSelectMission={handleSelectMission}
        onOpenCreate={handleOpenCreateMission}
        onOpenEdit={handleOpenEditMission}
        onOpenView={handleOpenViewMission}
        onToggleStatus={handleToggleMissionStatus}
        onDeleteMission={handleDeleteMission}
        onRunCycle={handleTriggerScan}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportMarkdown={reportMarkdown}
        missionName={activeMission?.name || 'Intelligence Briefing'}
      />
    </div>
  );
}

