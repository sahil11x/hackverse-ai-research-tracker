import {
  IntelAlert,
  IntelItem,
  Mission,
  SystemLog,
  TrendSignal,
  SourceType,
  ResearchContext,
  ResearchRunResult
} from '../types';

export interface CreateMissionPayload {
  name?: string;
  topic?: string;
  description?: string;
  companies?: string[];
  competitors?: string[];
  keywords?: string[];
  researchInterests?: string[];
  preferredSources?: SourceType[];
  objective?: string;
  frequencyMinutes?: number;
  status?: 'active' | 'paused';
}

export interface StructuredResearchObjective {
  name: string;
  topic: string;
  description: string;
  companies: string[];
  competitors: string[];
  keywords: string[];
  researchInterests: string[];
  researchAreas: string[];
  preferredSources: SourceType[];
  trackingObjective: string;
  responseSummary: string;
  usedGemini: boolean;
}

export const api = {
  async parseResearchPrompt(prompt: string): Promise<StructuredResearchObjective> {
    const res = await fetch('/api/research/chat-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
      throw new Error(`Failed to parse research prompt: ${res.statusText}`);
    }
    return res.json();
  },

  async getMissions(): Promise<{ missions: Mission[]; activeMissionId: string }> {
    const res = await fetch('/api/missions');
    return res.json();
  },

  async getMission(id: string): Promise<Mission> {
    const res = await fetch(`/api/missions/${id}`);
    return res.json();
  },

  async getActiveMission(): Promise<Mission> {
    const res = await fetch('/api/missions/active');
    return res.json();
  },

  async setActiveMission(id: string): Promise<{ success: boolean; activeMissionId?: string }> {
    const res = await fetch('/api/missions/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return res.json();
  },

  async createMission(payload: string | CreateMissionPayload, frequencyMinutes = 30): Promise<Mission> {
    const body = typeof payload === 'string'
      ? { objective: payload, frequencyMinutes }
      : { ...payload, frequencyMinutes: payload.frequencyMinutes || frequencyMinutes };

    const res = await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission> {
    const res = await fetch(`/api/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async deleteMission(id: string): Promise<{ success: boolean; activeMissionId?: string }> {
    const res = await fetch(`/api/missions/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async toggleMissionStatus(id: string): Promise<Mission> {
    const res = await fetch(`/api/missions/${id}/toggle-status`, {
      method: 'POST'
    });
    return res.json();
  },

  async runAutonomousCycle(missionId: string, options?: { query?: string; isFollowUp?: boolean; runId?: string }): Promise<ResearchRunResult> {
    const res = await fetch(`/api/missions/${missionId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {})
    });
    return res.json();
  },

  async runResearchStep(
    missionId: string,
    query: string,
    isFollowUp = false,
    options?: { adversarialConfig?: any; initialBudget?: any }
  ): Promise<ResearchRunResult> {
    const res = await fetch(`/api/missions/${missionId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, isFollowUp, ...options })
    });
    return res.json();
  },

  async runAdversarialTest(params?: {
    missionId?: string;
    query?: string;
    failTool?: string;
    injectConflictingClaims?: boolean;
    forceLowInitialConfidence?: boolean;
    tightBudget?: boolean;
  }): Promise<ResearchRunResult> {
    const res = await fetch('/api/research/adversarial-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    return res.json();
  },

  async getContext(missionId: string): Promise<ResearchContext> {
    const res = await fetch(`/api/missions/${missionId}/context`);
    return res.json();
  },

  async getIntelItems(
    missionId: string,
    filters?: { minRelevance?: number; minImpact?: number; source?: string; query?: string }
  ): Promise<{ items: IntelItem[]; totalCount: number }> {
    const params = new URLSearchParams();
    if (filters?.minRelevance) params.set('minRelevance', String(filters.minRelevance));
    if (filters?.minImpact) params.set('minImpact', String(filters.minImpact));
    if (filters?.source) params.set('source', filters.source);
    if (filters?.query) params.set('query', filters.query);

    const res = await fetch(`/api/missions/${missionId}/intel?${params.toString()}`);
    return res.json();
  },

  async getTrends(missionId: string): Promise<TrendSignal[]> {
    const res = await fetch(`/api/missions/${missionId}/trends`);
    return res.json();
  },

  async getAlerts(missionId: string): Promise<IntelAlert[]> {
    const res = await fetch(`/api/missions/${missionId}/alerts`);
    return res.json();
  },

  async markAlertRead(missionId: string, alertId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/missions/${missionId}/alerts/${alertId}/read`, {
      method: 'POST'
    });
    return res.json();
  },

  async getLogs(): Promise<SystemLog[]> {
    const res = await fetch('/api/logs');
    return res.json();
  },

  async getReport(missionId: string): Promise<{ missionName: string; reportMarkdown: string }> {
    const res = await fetch(`/api/missions/${missionId}/report`);
    return res.json();
  }
};
