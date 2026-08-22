export type SourceType = 'arxiv' | 'patent' | 'news' | 'sec_filing' | 'github' | 'web';
export type PriorityLevel = 'CRITICAL' | 'STRATEGIC' | 'HIGH' | 'MEDIUM' | 'TREND' | 'LOW';
export type CategoryType = 'hardware' | 'architecture' | 'patent' | 'business' | 'benchmark' | 'software';
export type VelocityType = 'accelerating' | 'steady' | 'emerging';

export interface Mission {
  id: string;
  name: string;
  code: string;
  topic: string;
  description: string;
  companies: string[];
  competitors: string[];
  keywords: string[];
  researchInterests: string[];
  preferredSources: SourceType[];
  objective: string; // backward compatibility fallback
  targetEntities: Array<{
    name: string;
    ticker?: string;
    role: string;
    type?: 'company' | 'competitor' | 'partner';
  }>;
  searchVectors: string[];
  focusAreas: string[];
  frequencyMinutes: number;
  status: 'active' | 'paused';
  createdAt: string;
  lastRunAt?: string;
  totalSignalsScanned: number;
  filteredInsightsCount: number;
  meanLatencyMs: number;
}

export interface IntelItem {
  id: string;
  missionId: string;
  title: string;
  source: SourceType;
  sourceLabel: string;
  sourceUrl: string;
  publishedAt: string;
  rawContent: string;
  fingerprint: string;
  relevanceScore: number; // 0 - 100
  impactScore: number; // 0 - 100
  strategicPriority: PriorityLevel;
  category: CategoryType;
  summary: string;
  keyImplications: string[];
  mentionedEntities: string[];
  relatedItemIds: string[];
  evidenceSnippet?: string;
  confidence: number;
}

export interface TrendSignal {
  id: string;
  missionId: string;
  topic: string;
  changePercent: string;
  progressPercent: number;
  summary: string;
  velocity: VelocityType;
  itemCount: number;
  itemIds: string[];
  primaryEntities: string[];
  detectedAt: string;
}

export interface IntelAlert {
  id: string;
  missionId: string;
  itemId?: string;
  headline: string;
  reason: string;
  severity: 'critical' | 'strategic' | 'warning' | 'info';
  isRead: boolean;
  createdAt: string;
  source: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'SYSTEM';
  message: string;
  stage?: string;
}

export interface PipelineStageStatus {
  stage: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  itemCount?: number;
  durationMs?: number;
}

export interface IntelligenceReport {
  missionName: string;
  generatedAt: string;
  executiveSummary: string;
  criticalAlerts: string[];
  topInsights: Array<{
    title: string;
    source: string;
    relevance: number;
    impact: number;
    summary: string;
    implications: string[];
  }>;
  emergingTrends: Array<{
    topic: string;
    growth: string;
    summary: string;
  }>;
}
