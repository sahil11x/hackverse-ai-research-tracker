import { executeResearchPlannerAgent } from './agents/researchPlanner';
import { executeEvidenceCollection } from './agents/evidenceCollector';
import { executeIntelligenceAnalystAgent } from './agents/intelligenceAnalyst';
import { correlateAndClusterItems } from './agents/trendCorrelator';
import { store } from './store';
import {
  MultiAgentOrchestrationSummary,
  ResearchContext,
  ResearchRunResult,
  ResearchStep,
  SourceType,
  SourceUsageStat,
  SummarizedFinding
} from '../src/types';

export interface MissionCycleOptions {
  query?: string;
  isFollowUp?: boolean;
  runId?: string;
}

/**
 * Core Multi-Agent Orchestrator with Context & Memory Management:
 * Executes Agent 1 (Research Planner with Context)
 *   -> Live Tools Execution Layer (isolated to planned tools)
 *   -> Agent 2 (Intelligence Analyst with Context & Quality Filter)
 *   -> Trend & Alert Engine
 *   -> Context & Memory Persistence Layer.
 */
export async function runAutonomousMissionCycle(
  missionId: string,
  options?: MissionCycleOptions
): Promise<ResearchRunResult> {
  const startTime = Date.now();
  const mission = store.getMission(missionId);

  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  // Generate unique run ID for strict execution isolation
  const runId = options?.runId || `RUN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const context = store.getContext(missionId);

  const rawObjective = options?.query?.trim() || mission.objective || `${mission.name}: ${mission.topic || mission.description}`;
  const isFollowUp = options?.isFollowUp || (context.conversationSteps.length > 0 && Boolean(options?.query));
  const stepNumber = context.conversationSteps.length + 1;

  store.addLog(
    'SYSTEM',
    `============================================================\n[RUN: ${runId}] ${isFollowUp ? `STEP ${stepNumber} (FOLLOW-UP)` : 'RESEARCH STEP'} FOR [${mission.code}] "${mission.name}"\nOBJECTIVE: "${rawObjective}"\n============================================================`,
    'MultiAgentOrchestrator'
  );

  try {
    // =========================================================================
    // AGENT 1: RESEARCH PLANNER AGENT (WITH CONTEXT INGESTION)
    // =========================================================================
    store.addLog(
      'INFO',
      `STAGE 1/4: AGENT 1 (RESEARCH PLANNER) — Analyzing intent with mission context (${context.conversationSteps.length} prior steps)...`,
      'ResearchPlannerAgent'
    );

    const { plan, handoff } = await executeResearchPlannerAgent({
      name: mission.name,
      topic: mission.topic || rawObjective,
      description: mission.description || rawObjective,
      companies: mission.companies,
      competitors: mission.competitors,
      keywords: mission.keywords,
      researchInterests: mission.researchInterests,
      preferredSources: mission.preferredSources,
      objective: rawObjective,
      context
    });

    // Update mission metadata if planner extracted structured entities
    if (plan.targetEntities.length > 0) {
      mission.targetEntities = plan.targetEntities.map((e) => ({
        name: e.name,
        ticker: e.ticker,
        role: e.role,
        type: (e.type as any) || 'company'
      }));
    }
    if (plan.searchVectors.length > 0) {
      mission.searchVectors = plan.searchVectors;
    }
    if (plan.researchAreas.length > 0) {
      mission.focusAreas = plan.researchAreas;
    }

    // =========================================================================
    // LIVE RESEARCH TOOLS EXECUTION LAYER (ONLY EXECUTES SELECTED TOOLS)
    // =========================================================================
    store.addLog(
      'INFO',
      `STAGE 2/4: LIVE RESEARCH TOOLS — Executing tools [${plan.selectedTools.join(', ')}] with query optimization...`,
      'EvidenceCollector'
    );

    const evidenceBundle = await executeEvidenceCollection(handoff);

    // =========================================================================
    // AGENT 2: INTELLIGENCE ANALYST AGENT (WITH CONTEXT & QUALITY FILTER)
    // =========================================================================
    store.addLog(
      'INFO',
      `STAGE 3/4: AGENT 2 (INTELLIGENCE ANALYST) — Analyzing ${evidenceBundle.totalCollected} live evidence items under Plan [${plan.planId}] with context...`,
      'IntelligenceAnalystAgent'
    );

    const analystResult = await executeIntelligenceAnalystAgent(evidenceBundle, handoff, missionId, context);

    // =========================================================================
    // TREND RADAR & ALERT ENGINE
    // =========================================================================
    store.addLog(
      'INFO',
      `STAGE 4/4: TREND RADAR & ALERTS — Correlating cross-source signals and computing trend velocity...`,
      'TrendRadar'
    );

    const { correlatedItems, detectedTrends, newAlerts } = correlateAndClusterItems(
      analystResult.findings,
      missionId,
      {
        missionName: mission.name,
        code: mission.code,
        targetEntities: plan.targetEntities,
        searchVectors: plan.searchVectors,
        focusAreas: plan.researchAreas,
        queries: {
          arxiv: plan.toolQueries.search_arxiv ? [plan.toolQueries.search_arxiv] : [],
          patents: [],
          news: [],
          industry: plan.toolQueries.search_github ? [plan.toolQueries.search_github] : []
        }
      }
    );

    // Compute Source Usage Transparency Summary strictly based on real tool execution
    const arxivRecord = evidenceBundle.toolExecutionRecords.find((r) => r.tool === 'search_arxiv');
    const githubRecord = evidenceBundle.toolExecutionRecords.find((r) => r.tool === 'search_github');

    const sourceCounts: Record<string, number> = {};
    for (const item of correlatedItems) {
      sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    }

    const allTaxonomy: Array<{ source: SourceType; label: string }> = [
      { source: 'arxiv', label: 'ArXiv' },
      { source: 'patent', label: 'Patents' },
      { source: 'news', label: 'Tech News' },
      { source: 'sec_filing', label: 'SEC Filings' },
      { source: 'social_media', label: 'Social Media' },
      { source: 'github', label: 'GitHub' }
    ];

    const sourcesUsedSummary: SourceUsageStat[] = allTaxonomy.map((tax) => {
      if (tax.source === 'arxiv') {
        if (arxivRecord?.selected) {
          return {
            source: 'arxiv',
            label: 'ArXiv',
            status: arxivRecord.resultCount > 0 ? 'used' : 'not_used',
            count: arxivRecord.resultCount
          };
        } else {
          return {
            source: 'arxiv',
            label: 'ArXiv',
            status: 'not_required',
            count: 0
          };
        }
      }

      if (tax.source === 'github') {
        if (githubRecord?.selected) {
          return {
            source: 'github',
            label: 'GitHub',
            status: githubRecord.resultCount > 0 ? 'used' : 'not_used',
            count: githubRecord.resultCount
          };
        } else {
          return {
            source: 'github',
            label: 'GitHub',
            status: 'not_required',
            count: 0
          };
        }
      }

      const count = sourceCounts[tax.source] || 0;
      const isPreferred = (mission.preferredSources || []).includes(tax.source);
      let status: 'used' | 'not_used' | 'not_required' = 'not_required';
      if (count > 0) {
        status = 'used';
      } else if (isPreferred) {
        status = 'not_used';
      }
      return {
        source: tax.source,
        label: tax.label,
        status,
        count
      };
    });

    mission.sourcesUsedSummary = sourcesUsedSummary;

    // Build truthful MultiAgentOrchestrationSummary strictly representing the current run
    const orchestrationSummary: MultiAgentOrchestrationSummary = {
      planner: {
        planId: plan.planId,
        intent: plan.intent,
        intentType: plan.intentType,
        selectedTools: plan.selectedTools,
        toolQueries: {
          ...(plan.toolQueries.search_arxiv ? { search_arxiv: plan.toolQueries.search_arxiv } : {}),
          ...(plan.toolQueries.search_github ? { search_github: plan.toolQueries.search_github } : {})
        },
        targetEntitiesCount: plan.targetEntities.length
      },
      tools: {
        executedTools: plan.selectedTools,
        totalEvidenceReturned: evidenceBundle.totalCollected,
        records: evidenceBundle.toolExecutionRecords
      },
      analyst: {
        handoffId: handoff.handoffId,
        analyzedEvidenceCount: analystResult.evidenceAnalyzedCount,
        findingsGeneratedCount: analystResult.findings.length,
        rankedImpacts: analystResult.rankedImpacts
      },
      orchestrationStatus: evidenceBundle.collectionErrors ? 'partial' : 'complete',
      handoffTimestamp: handoff.timestamp
    };

    mission.lastOrchestration = orchestrationSummary;

    // =========================================================================
    // TASK 4: CONTEXT & MEMORY UPDATE
    // =========================================================================
    const topFindingsSummarized: SummarizedFinding[] = correlatedItems.slice(0, 5).map((f) => ({
      id: f.id,
      title: f.title,
      source: f.source,
      whatChanged: f.whatChanged || f.title,
      whyItMatters: f.whyItMatters || f.summary,
      impact: f.impact || 'High',
      publishedAt: f.publishedAt
    }));

    const conversationStep: ResearchStep = {
      stepNumber,
      runId,
      query: rawObjective,
      timestamp: new Date().toISOString(),
      intent: plan.intent,
      intentType: plan.intentType,
      selectedTools: plan.selectedTools,
      executedTools: plan.selectedTools,
      evidenceCount: evidenceBundle.totalCollected,
      findingsCount: correlatedItems.length,
      topFindings: correlatedItems.slice(0, 3).map((i) => i.title),
      keyEntities: plan.targetEntities.map((e) => e.name),
      planSummary: `Intent: [${plan.intentType.toUpperCase()}]. Query vectors: ${Object.values(plan.toolQueries).filter(Boolean).join(' | ')}.`,
      analystSummary: analystResult.strategicSummary,
      isFollowUp
    };

    // Formulate dynamic follow-up suggestions based on active step results
    let dynamicFollowUps = [
      'Now find open-source GitHub implementations of these techniques',
      'Compare recent academic benchmarks for these architectures',
      'Analyze memory bandwidth optimization and kernel execution trade-offs'
    ];
    if (plan.selectedTools.includes('search_arxiv') && !plan.selectedTools.includes('search_github')) {
      dynamicFollowUps = [
        'Now find open-source GitHub implementations of these techniques',
        'Compare performance benchmarks with TensorRT-LLM and vLLM',
        'Analyze hardware deployment requirements on NVIDIA GPUs'
      ];
    } else if (plan.selectedTools.includes('search_github') && !plan.selectedTools.includes('search_arxiv')) {
      dynamicFollowUps = [
        'Find theoretical academic papers explaining these algorithms on arXiv',
        'Compare kernel throughput across NVIDIA vs AMD hardware',
        'Investigate memory footprint quantization trade-offs'
      ];
    }

    // Update the long-term mission context
    const updatedContext: ResearchContext = {
      missionId,
      currentQuery: rawObjective,
      previousQueries: [...context.previousQueries.filter((q) => q !== rawObjective), rawObjective],
      researchObjective: mission.objective || rawObjective,
      detectedIntent: plan.intentType,
      targetEntities: plan.targetEntities,
      competitors: mission.competitors || [],
      selectedTools: plan.selectedTools,
      executedTools: plan.selectedTools,
      relevantKeywords: mission.keywords || [],
      researchAreas: plan.researchAreas,
      currentResearchPlan: plan,
      handoffId: handoff.handoffId,
      evidenceSummary: `Step ${stepNumber} retrieved ${evidenceBundle.totalCollected} live evidence records, synthesizing ${correlatedItems.length} actionable findings.`,
      verifiedSources: plan.selectedTools.map((t) => (t === 'search_arxiv' ? 'arxiv' : 'github')) as SourceType[],
      importantFindings: topFindingsSummarized,
      rejectedFindings: analystResult.rejectedFindings || [],
      lastResearchTimestamp: new Date().toISOString(),
      conversationSteps: [...context.conversationSteps, conversationStep],
      followUpQueries: dynamicFollowUps,
      userPreferences: {
        preferredSources: mission.preferredSources,
        focusAreas: mission.focusAreas
      }
    };

    store.setContext(missionId, updatedContext);

    // =========================================================================
    // STATE SYNCHRONIZATION: ATOMICALLY COMMIT CURRENT RUN FINDINGS
    // (Prevents stale results from previous runs from lingering)
    // =========================================================================
    store.replaceIntelItems(missionId, correlatedItems);

    if (detectedTrends.length > 0) {
      store.setTrends(missionId, detectedTrends);
    }
    for (const alert of newAlerts) {
      store.addAlert(alert);
    }

    const elapsedMs = Date.now() - startTime;
    mission.meanLatencyMs = Number((elapsedMs / (correlatedItems.length || 1) / 10).toFixed(1));
    mission.lastRunAt = new Date().toISOString();

    if (newAlerts.length > 0) {
      store.addLog(
        'CRITICAL',
        `Autonomous Alert Engine triggered ${newAlerts.length} high-impact alerts for run [${runId}].`,
        'AlertEngine'
      );
    }

    store.addLog(
      'SUCCESS',
      `============================================================\nMULTI-AGENT PIPELINE COMPLETE [RUN: ${runId}]: ${correlatedItems.length} verified findings synthesized in ${(elapsedMs / 1000).toFixed(2)}s.\n============================================================`,
      'MultiAgentOrchestrator'
    );

    return {
      success: true,
      runId,
      missionId,
      stepNumber,
      query: rawObjective,
      isFollowUp,
      orchestration: orchestrationSummary,
      itemsCount: correlatedItems.length,
      trendsCount: detectedTrends.length,
      alertsCount: newAlerts.length,
      sourcesUsedSummary,
      toolRecords: evidenceBundle.toolExecutionRecords,
      rejectedFindings: analystResult.rejectedFindings || [],
      context: updatedContext,
      elapsedMs
    };
  } catch (err: any) {
    store.addLog('CRITICAL', `Multi-agent pipeline error in run [${runId}]: ${err.message || err}`, 'MultiAgentOrchestrator');
    throw err;
  }
}
