import { analyzeAndScoreItems } from './agents/analyzer';
import { collectMultiSourceRawItems } from './agents/fetcher';
import { expandObjectiveIntoQueries } from './agents/queryPlanner';
import { correlateAndClusterItems } from './agents/trendCorrelator';
import { store } from './store';
import { SourceType, SourceUsageStat } from '../src/types';

export async function runAutonomousMissionCycle(missionId: string) {
  const startTime = Date.now();
  const mission = store.getMission(missionId);

  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  store.addLog('INFO', `Starting autonomous intelligence cycle for [${mission.code}] "${mission.name}"`, 'Orchestrator');

  try {
    // Stage 1: Query Expansion & Plan Generation
    store.addLog('INFO', `Step 1/5: Expanding tracking objective into multi-source search vectors...`, 'QueryPlanner');
    const plan = await expandObjectiveIntoQueries({
      name: mission.name,
      topic: mission.topic || mission.objective,
      description: mission.description || mission.objective,
      companies: mission.companies,
      competitors: mission.competitors,
      keywords: mission.keywords,
      researchInterests: mission.researchInterests,
      preferredSources: mission.preferredSources,
      objective: mission.objective
    });

    // Update mission target entities and focus areas if richer
    if (plan.targetEntities.length > 0) {
      mission.targetEntities = plan.targetEntities;
    }
    if (plan.searchVectors.length > 0) {
      mission.searchVectors = plan.searchVectors;
    }
    if (plan.focusAreas.length > 0) {
      mission.focusAreas = plan.focusAreas;
    }

    store.addLog('SUCCESS', `Generated search vectors for ${mission.companies?.join(', ') || mission.name}.`, 'QueryPlanner');

    // Stage 2: Dynamic Tool Calling & Multi-Source Collection
    const searchTarget = `${mission.name}: ${mission.topic || mission.objective}. Companies: ${(mission.companies || []).join(', ')}. Keywords: ${(mission.keywords || []).join(', ')}`;
    store.addLog('INFO', `Step 2/5: Executing dynamic tool planner and calling real external APIs (arXiv / GitHub)...`, 'Collector');
    
    const { rawItems, toolRecords, toolPlan } = await collectMultiSourceRawItems(searchTarget, plan, {
      topic: mission.topic || mission.objective,
      description: mission.description || mission.objective,
      companies: mission.companies,
      competitors: mission.competitors,
      keywords: mission.keywords,
      researchInterests: mission.researchInterests,
      preferredSources: mission.preferredSources
    });

    store.addLog('INFO', `Dynamic Tool Selection: ${toolPlan.research_intent} Selected tools: [${toolPlan.selected_tools.join(', ') || 'none'}]`, 'ToolPlanner');

    for (const record of toolRecords) {
      if (record.selected) {
        if (record.status === 'success') {
          store.addLog('SUCCESS', `Tool [${record.tool}]: Received ${record.resultCount} real external records for query "${record.query}".`, 'ToolExecutor');
        } else if (record.status === 'no_results') {
          store.addLog('WARNING', `Tool [${record.tool}]: Executed for query "${record.query}" — 0 matching results found.`, 'ToolExecutor');
        } else if (record.status === 'failed') {
          store.addLog('CRITICAL', `Tool [${record.tool}]: Failed (${record.error || 'Network error'}). Continuing with remaining sources.`, 'ToolExecutor');
        }
      } else {
        store.addLog('INFO', `Tool [${record.tool}]: Not selected (Research intent did not require this tool).`, 'ToolPlanner');
      }
    }

    store.addLog('SUCCESS', `Ingested ${rawItems.length} candidate documents from live tools & active vectors.`, 'Collector');

    // Stage 3 & 4: Deduplication, Relevance, and Deep Impact Analysis
    store.addLog('INFO', `Step 3/5: Normalizing fingerprints, filtering relevance (>=60), and synthesizing actionable intelligence...`, 'Analyst');
    const scoredItems = await analyzeAndScoreItems(rawItems, missionId, plan);
    store.addLog('SUCCESS', `Synthesized ${scoredItems.length} actionable intelligence records with verified evidence.`, 'Analyst');

    // Stage 5: Cross-Source Correlation, Trend Radar & Alerts
    store.addLog('INFO', `Step 4/5: Building cross-source relationship graph and computing trend velocity...`, 'TrendRadar');
    const { correlatedItems, detectedTrends, newAlerts } = correlateAndClusterItems(scoredItems, missionId, plan);

    // Compute Source Usage Transparency Summary matching live tool execution records
    const arxivRecord = toolRecords.find((r) => r.tool === 'search_arxiv');
    const githubRecord = toolRecords.find((r) => r.tool === 'search_github');

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

    // Save to store
    store.addIntelItems(missionId, correlatedItems);
    if (detectedTrends.length > 0) {
      store.setTrends(missionId, detectedTrends);
    }
    for (const alert of newAlerts) {
      store.addAlert(alert);
    }

    const elapsedMs = Date.now() - startTime;
    mission.meanLatencyMs = Number((elapsedMs / (scoredItems.length || 1) / 10).toFixed(1));
    mission.lastRunAt = new Date().toISOString();

    if (newAlerts.length > 0) {
      store.addLog('CRITICAL', `Step 5/5: Autonomous tracker triggered ${newAlerts.length} high-impact alerts for review.`, 'AlertEngine');
    }

    store.addLog('SYSTEM', `Autonomous intelligence cycle finished in ${(elapsedMs / 1000).toFixed(2)}s. Mean latency: ${mission.meanLatencyMs}ms.`, 'Orchestrator');

    return {
      success: true,
      itemsCount: correlatedItems.length,
      trendsCount: detectedTrends.length,
      alertsCount: newAlerts.length,
      sourcesUsedSummary,
      toolRecords,
      elapsedMs
    };
  } catch (err: any) {
    store.addLog('CRITICAL', `Pipeline execution error: ${err.message || err}`, 'Orchestrator');
    throw err;
  }
}
