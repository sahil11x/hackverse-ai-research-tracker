export type SourceType = 'arxiv' | 'patent' | 'news' | 'sec_filing' | 'social_media' | 'github' | 'web';
export type PriorityLevel = 'CRITICAL' | 'STRATEGIC' | 'HIGH' | 'MEDIUM' | 'TREND' | 'LOW';
export type ImpactLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type CategoryType = 'hardware' | 'architecture' | 'patent' | 'business' | 'benchmark' | 'software';
export type VelocityType = 'accelerating' | 'steady' | 'emerging';

export interface EvidenceLink {
  source: SourceType;
  sourceLabel: string;
  title: string;
  url: string;
  date?: string;
  excerpt?: string;
  supportingReason?: string;
  evidenceType?: 'primary' | 'secondary' | 'research' | 'company' | 'social';
}

export interface SourceUsageStat {
  source: SourceType;
  label: string;
  status: 'used' | 'not_used' | 'not_required';
  count: number;
}

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
  sourcesUsedSummary?: SourceUsageStat[];
  lastOrchestration?: MultiAgentOrchestrationSummary;
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

  // Phase 3 Actionable Intelligence Model
  whatChanged?: string;
  whyItMatters?: string;
  impact?: ImpactLevel;
  recommendedAction?: string;
  timeHorizon?: string;
  evidenceCount?: number;
  sourceTypes?: SourceType[];
  evidenceLinks?: EvidenceLink[];
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

// ==========================================
// TASK 3: MULTI-AGENT ARCHITECTURE TYPES
// ==========================================

export type ToolName = 'search_arxiv' | 'search_github';

export interface ResearchPlan {
  planId: string;
  objective: string;
  intent: string;
  intentType: 'comparative' | 'academic_only' | 'opensource_only' | 'exploratory';
  selectedTools: ToolName[];
  toolQueries: {
    search_arxiv?: string;
    search_github?: string;
  };
  researchAreas: string[];
  targetEntities: Array<{ name: string; ticker?: string; role: string; type?: string }>;
  searchVectors: string[];
  hypotheses: string[];
  createdAt: string;
}

export interface AgentHandoff {
  handoffId: string;
  fromAgent: 'ResearchPlannerAgent';
  toAgent: 'IntelligenceAnalystAgent';
  timestamp: string;
  plan: ResearchPlan;
  instructionsForAnalyst: string;
  status: 'dispatched' | 'received' | 'analyzed' | 'failed';
}

export interface RawDiscoveredItem {
  title: string;
  source: SourceType;
  sourceLabel: string;
  sourceUrl: string;
  publishedAt: string;
  rawContent: string;
  evidenceSnippet?: string;
}

export interface ToolExecutionRecord {
  tool: ToolName;
  selected: boolean;
  status: 'success' | 'no_results' | 'failed' | 'not_selected';
  resultCount: number;
  query?: string;
  error?: string;
}

export interface EvidenceBundle {
  bundleId: string;
  planId: string;
  handoffId: string;
  collectedAt: string;
  totalCollected: number;
  toolExecutionRecords: ToolExecutionRecord[];
  evidenceItems: RawDiscoveredItem[];
  sourceBreakdown: Record<string, number>;
  collectionErrors?: string[];
}

export interface AnalystResult {
  analystId: string;
  planId: string;
  handoffId: string;
  evidenceAnalyzedCount: number;
  findings: IntelItem[];
  rejectedFindings?: RejectedFinding[];
  strategicSummary: string;
  rankedImpacts: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  executionTimeMs: number;
  evidenceAttachedCount: number;
}

export interface AgentExecutionRecord {
  id: string;
  agentName: 'ResearchPlannerAgent' | 'ToolExecutionLayer' | 'IntelligenceAnalystAgent';
  status: 'started' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  summary: string;
  steps: string[];
  outputMetadata?: Record<string, any>;
  error?: string;
}

export interface MultiAgentOrchestrationSummary {
  planner: {
    planId: string;
    intent: string;
    intentType: string;
    selectedTools: ToolName[];
    toolQueries: Record<string, string>;
    targetEntitiesCount: number;
  };
  tools: {
    executedTools: ToolName[];
    totalEvidenceReturned: number;
    records: ToolExecutionRecord[];
  };
  analyst: {
    handoffId: string;
    analyzedEvidenceCount: number;
    findingsGeneratedCount: number;
    rankedImpacts: {
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
    };
  };
  orchestrationStatus: 'complete' | 'partial' | 'failed';
  handoffTimestamp: string;
}

// ==========================================
// TASK 4: CONTEXT & MEMORY MANAGEMENT TYPES
// ==========================================

export interface ResearchStep {
  stepNumber: number;
  runId: string;
  query: string;
  timestamp: string;
  intent: string;
  intentType: 'comparative' | 'academic_only' | 'opensource_only' | 'exploratory';
  selectedTools: ToolName[];
  executedTools: ToolName[];
  evidenceCount: number;
  findingsCount: number;
  topFindings: string[];
  keyEntities: string[];
  planSummary?: string;
  analystSummary?: string;
  isFollowUp?: boolean;
}

export interface RejectedFinding {
  title: string;
  source: SourceType;
  reason: string;
  url?: string;
}

export interface SummarizedFinding {
  id: string;
  title: string;
  source: SourceType;
  whatChanged: string;
  whyItMatters: string;
  impact: string;
  publishedAt?: string;
}

export interface ResearchContext {
  missionId: string;
  currentQuery: string;
  previousQueries: string[];
  researchObjective: string;
  detectedIntent: string;
  targetEntities: Array<{ name: string; ticker?: string; role: string; type?: string }>;
  competitors: string[];
  selectedTools: ToolName[];
  executedTools: ToolName[];
  relevantKeywords: string[];
  researchAreas: string[];
  currentResearchPlan?: ResearchPlan;
  handoffId?: string;
  evidenceSummary: string;
  verifiedSources: SourceType[];
  importantFindings: SummarizedFinding[];
  rejectedFindings: RejectedFinding[];
  lastResearchTimestamp: string;
  conversationSteps: ResearchStep[];
  followUpQueries: string[];
  userPreferences: {
    preferredSources?: SourceType[];
    focusAreas?: string[];
  };
}

export interface ResearchRunResult {
  success: boolean;
  runId: string;
  missionId: string;
  stepNumber: number;
  query: string;
  isFollowUp: boolean;
  orchestration: MultiAgentOrchestrationSummary;
  itemsCount: number;
  trendsCount: number;
  alertsCount: number;
  sourcesUsedSummary: SourceUsageStat[];
  toolRecords: ToolExecutionRecord[];
  rejectedFindings: RejectedFinding[];
  context: ResearchContext;
  elapsedMs: number;
  graphExecution?: GraphExecutionSummary;
}

// ==========================================
// TASK 5: AUTONOMOUS GRAPH ORCHESTRATION TYPES
// ==========================================

export type GraphNodeName =
  | 'ResearchPlanner'
  | 'ResourceEvaluator'
  | 'ParallelEvidenceCollector'
  | 'EvidenceValidator'
  | 'ConflictResolution'
  | 'IntelligenceAnalyst'
  | 'SelfEvaluation'
  | 'Replanner'
  | 'Completion';

export type GraphExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'RECOVERED'
  | 'NEEDS_REVIEW'
  | 'HALTED_LOOP'
  | 'BUDGET_EXHAUSTED';

export interface HypothesisItem {
  id: string;
  hypothesis: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  verificationStatus: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CONTRADICTED' | 'UNVERIFIED';
  confidence: number; // 0 - 1
  rationale?: string;
}

export interface ConflictingEvidenceItem {
  id: string;
  claimA: string;
  claimB: string;
  sourcesA: string[];
  sourcesB: string[];
  sourceReliability: {
    sourcesA: 'HIGH' | 'MEDIUM' | 'LOW';
    sourcesB: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  evidenceStrength: number; // 0 - 1
  conflictType: 'factual' | 'interpretation' | 'methodology' | 'metric_discrepancy';
  resolution: string;
  confidence: number; // 0 - 1
  unresolved: boolean;
}

export interface ResourceBudget {
  maxToolCalls: number;
  maxParallelCalls: number;
  maxRetries: number;
  maxReplans: number;
  estimatedCost: number; // in abstract compute units / ms
  remainingBudget: number; // units remaining
  toolCallsMade: number;
  parallelCallsMade: number;
  retriesUsed: number;
  replansUsed: number;
}

export interface ToolFailureRecord {
  tool: ToolName;
  query: string;
  error: string;
  category: 'NETWORK' | 'RATE_LIMIT' | 'TIMEOUT' | 'SCHEMA' | 'INJECTED_ADVERSARIAL' | 'EMPTY_RESULTS';
  timestamp: string;
  durationMs: number;
}

export interface FallbackAttemptRecord {
  id: string;
  fromTool: ToolName;
  toTool: ToolName;
  reason: string;
  successful: boolean;
  timestamp: string;
  resultsRetrieved: number;
}

export interface GraphCheckpoint {
  id: string;
  checkpointNumber: number;
  node: GraphNodeName;
  timestamp: string;
  summary: string;
  evidenceCount: number;
  findingsCount: number;
  confidence: number;
  uncertainty: number;
  stateSnapshot: {
    currentObjective: string;
    selectedTools: ToolName[];
    completedNodes: string[];
    replanCount: number;
    budgetRemaining: number;
  };
}

export interface LoopDetectionState {
  executionSignatures: string[];
  loopDetected: boolean;
  loopReason?: string;
  haltedEarly: boolean;
  maxThreshold: number;
}

export interface SelfEvaluationResult {
  objectiveSatisfied: boolean;
  evidenceSufficient: boolean;
  confidence: number; // 0 - 1
  uncertainty: number; // 0 - 1
  unresolvedIssues: string[];
  unsupportedClaims: string[];
  recommendedNextAction: 'COMPLETE' | 'REPLAN_MORE_EVIDENCE' | 'FALLBACK_TOOL' | 'RESOLVE_CONFLICT';
  evaluationSummary: string;
}

export interface ReplanRecord {
  replanNumber: number;
  timestamp: string;
  reason: string;
  previousTools: ToolName[];
  newTools: ToolName[];
  newSubtasks: string[];
  reformulatedQueries: Record<string, string>;
  hypothesesAdded: string[];
}

export interface GraphFinalDecision {
  objectiveSatisfied: boolean;
  confidence: number; // 0 - 1
  evidenceStrength: number; // 0 - 1
  uncertainty: number; // 0 - 1
  decisionReason: string;
  finalStatus: GraphExecutionStatus;
  summary: string;
}

export interface ParallelBranchRecord {
  branchId: string;
  tool: ToolName;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  resultCount: number;
  status: 'started' | 'completed' | 'failed';
  errorCategory?: string;
  error?: string;
}

export interface GraphNodeExecutionRecord {
  nodeName: GraphNodeName;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  inputSummary?: string;
  outputSummary?: string;
  confidence?: number;
  uncertainty?: number;
}

export interface GraphExecutionSummary {
  framework: 'AgentGraph' | 'ResearchGraph' | 'LangGraph';
  runId: string;
  missionId: string;
  executionStatus: GraphExecutionStatus;
  routeTaken: GraphNodeName[];
  currentNode?: GraphNodeName;
  parallelBranches: ParallelBranchRecord[];
  toolFailures: ToolFailureRecord[];
  fallbacks: FallbackAttemptRecord[];
  conflicts: ConflictingEvidenceItem[];
  replans: ReplanRecord[];
  checkpoints: GraphCheckpoint[];
  loopDetection: {
    loopDetected: boolean;
    signaturesCount: number;
    haltedEarly: boolean;
    reason?: string;
  };
  resourceBudget: ResourceBudget;
  selfEvaluation?: SelfEvaluationResult;
  finalDecision?: GraphFinalDecision;
  nodeExecutions: GraphNodeExecutionRecord[];
  elapsedTotalMs: number;
  adversarialModeActive?: boolean;
}

export interface AdversarialTestConfig {
  enabled: boolean;
  failTool?: ToolName;
  delayToolMs?: number;
  injectConflictingClaims?: boolean;
  forceLowInitialConfidence?: boolean;
  injectEmptyResults?: boolean;
  forceReplanningLoopTest?: boolean;
  tightBudget?: boolean;
}

export interface GraphState {
  runId: string;
  missionId: string;
  originalObjective: string;
  currentObjective: string;
  researchContext: ResearchContext;
  researchPlan?: ResearchPlan;
  detectedIntent: 'comparative' | 'academic_only' | 'opensource_only' | 'exploratory';
  targetEntities: Array<{ name: string; ticker?: string; role: string; type?: string }>;
  hypotheses: HypothesisItem[];
  selectedTools: ToolName[];
  availableTools: ToolName[];
  evidenceBundle?: EvidenceBundle;
  findings: IntelItem[];
  conflictingEvidence: ConflictingEvidenceItem[];
  rejectedFindings: RejectedFinding[];
  uncertainty: number; // 0 - 1
  confidence: number; // 0 - 1
  resourceBudget: ResourceBudget;
  toolFailures: ToolFailureRecord[];
  fallbackAttempts: FallbackAttemptRecord[];
  checkpoints: GraphCheckpoint[];
  completedNodes: GraphNodeName[];
  failedNodes: GraphNodeName[];
  retryCount: number;
  replanCount: number;
  replans: ReplanRecord[];
  loopDetectionState: LoopDetectionState;
  finalDecision?: GraphFinalDecision;
  executionStatus: GraphExecutionStatus;
  
  // Internal Graph Metadata
  routeTaken: GraphNodeName[];
  parallelBranches: ParallelBranchRecord[];
  nodeExecutions: GraphNodeExecutionRecord[];
  selfEvaluation?: SelfEvaluationResult;
  adversarialConfig?: AdversarialTestConfig;
  handoff?: AgentHandoff;
  analystResult?: AnalystResult;
  strategicSummary?: string;
}

