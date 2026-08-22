import { analyzeAndScoreItems } from './agents/analyzer';
import { collectMultiSourceRawItems } from './agents/fetcher';
import { expandObjectiveIntoQueries } from './agents/queryPlanner';
import { correlateAndClusterItems } from './agents/trendCorrelator';
import { store } from './store';

export async function runAutonomousMissionCycle(missionId: string) {
  const startTime = Date.now();
  const mission = store.getMission(missionId);

  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  store.addLog('INFO', `Starting autonomous intelligence cycle for [${mission.code}] "${mission.name}"`, 'Orchestrator');

  try {
    // Stage 1: Query Expansion
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

    store.addLog('SUCCESS', `Generated ${Object.values(plan.queries).flat().length} search sub-vectors for ${mission.companies?.join(', ') || mission.name} across ArXiv, USPTO & Tech News.`, 'QueryPlanner');

    // Stage 2: Multi-source collection
    const searchTarget = `${mission.name}: ${mission.topic || mission.objective}. Companies: ${(mission.companies || []).join(', ')}. Keywords: ${(mission.keywords || []).join(', ')}`;
    store.addLog('INFO', `Step 2/5: Ingesting signals from ArXiv API, USPTO, and Google Grounded Web...`, 'Collector');
    const rawItems = await collectMultiSourceRawItems(searchTarget, plan);
    store.addLog('SUCCESS', `Ingested ${rawItems.length} candidate documents from multi-source vectors.`, 'Collector');

    // Stage 3 & 4: Deduplication, Relevance, and Deep Impact Analysis
    store.addLog('INFO', `Step 3/5: Normalizing fingerprints, filtering relevance (>=60), and calculating impact scores...`, 'Analyst');
    const scoredItems = await analyzeAndScoreItems(rawItems, missionId, plan);
    store.addLog('SUCCESS', `Validated ${scoredItems.length} high-relevance actionable intelligence records.`, 'Analyst');

    // Stage 5: Cross-Source Correlation, Trend Radar & Alerts
    store.addLog('INFO', `Step 4/5: Building cross-source relationship graph and computing trend velocity...`, 'TrendRadar');
    const { correlatedItems, detectedTrends, newAlerts } = correlateAndClusterItems(scoredItems, missionId, plan);

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
      elapsedMs
    };
  } catch (err: any) {
    store.addLog('CRITICAL', `Pipeline execution error: ${err.message || err}`, 'Orchestrator');
    throw err;
  }
}
