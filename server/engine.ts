import { executeResearchPlannerAgent } from './agents/researchPlanner';
import { executeEvidenceCollection } from './agents/evidenceCollector';
import { executeIntelligenceAnalystAgent } from './agents/intelligenceAnalyst';
import { correlateAndClusterItems } from './agents/trendCorrelator';
import { store } from './store';
import {
  MultiAgentOrchestrationSummary,
  SourceType,
  SourceUsageStat
} from '../src/types';

/**
 * Core Multi-Agent Orchestrator:
 * Executes Agent 1 (Research Planner) -> Live Tools Execution Layer -> Agent 2 (Intelligence Analyst) -> Trend & Alert Engine.
 */
export async function runAutonomousMissionCycle(missionId: string) {
  const startTime = Date.now();
  const mission = store.getMission(missionId);

  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  const rawObjective = mission.objective || `${mission.name}: ${mission.topic || mission.description}`;

  store.addLog(
    'SYSTEM',
    `============================================================\nSTARTING MULTI-AGENT RESEARCH PIPELINE: [${mission.code}] "${mission.name}"\n============================================================`,
    'MultiAgentOrchestrator'
  );

  try {
    // =========================================================================
    // AGENT 1: RESEARCH PLANNER AGENT
    // =========================================================================
    store.addLog(
      'INFO',
      `STAGE 1/4: AGENT 1 (RESEARCH PLANNER) — Analyzing intent, selecting tools, generating optimized queries...`,
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
      objective: rawObjective
    });

    // Update mission parameters if the planner discovered richer structure
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
    // LIVE RESEARCH TOOLS EXECUTION LAYER
    // =========================================================================
    store.addLog(
      'INFO',
      `STAGE 2/4: LIVE RESEARCH TOOLS — Executing tools [${plan.selectedTools.join(', ')}] with query optimization...`,
      'EvidenceCollector'
    );

    const evidenceBundle = await executeEvidenceCollection(handoff);

    // =========================================================================
    // AGENT 2: INTELLIGENCE ANALYST AGENT
    // =========================================================================
    store.addLog(
      'INFO',
      `STAGE 3/4: AGENT 2 (INTELLIGENCE ANALYST) — Analyzing ${evidenceBundle.totalCollected} live evidence items under Plan [${plan.planId}]...`,
      'IntelligenceAnalystAgent'
    );

    const analystResult = await executeIntelligenceAnalystAgent(evidenceBundle, handoff, missionId);

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

    // Compute Source Usage Transparency Summary based on real tool execution
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

    // Build Multi-Agent Orchestration Summary
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

    // Save to store
    store.addIntelItems(missionId, correlatedItems);
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
        `Autonomous Alert Engine triggered ${newAlerts.length} high-impact alerts.`,
        'AlertEngine'
      );
    }

    store.addLog(
      'SUCCESS',
      `============================================================\nMULTI-AGENT PIPELINE COMPLETE: ${correlatedItems.length} verified findings synthesized in ${(elapsedMs / 1000).toFixed(2)}s.\n============================================================`,
      'MultiAgentOrchestrator'
    );

    return {
      success: true,
      orchestration: orchestrationSummary,
      itemsCount: correlatedItems.length,
      trendsCount: detectedTrends.length,
      alertsCount: newAlerts.length,
      sourcesUsedSummary,
      toolRecords: evidenceBundle.toolExecutionRecords,
      elapsedMs
    };
  } catch (err: any) {
    store.addLog('CRITICAL', `Multi-agent pipeline error: ${err.message || err}`, 'MultiAgentOrchestrator');
    throw err;
  }
}
