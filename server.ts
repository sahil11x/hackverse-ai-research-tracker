import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { expandObjectiveIntoQueries } from './server/agents/queryPlanner';
import { parseResearchPromptWithGemini } from './server/agents/researchChatbot';
import { runAutonomousMissionCycle } from './server/engine';
import { store } from './server/store';
import { Mission } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Research Assistant Natural Language Chatbot Endpoint
  app.post('/api/research/chat-parse', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Research task prompt is required' });
      }

      store.addLog('INFO', `AI Research Assistant parsing: "${prompt.slice(0, 80)}..."`, 'ChatAssistant');
      const structured = await parseResearchPromptWithGemini(prompt.trim());
      res.json(structured);
    } catch (err: any) {
      console.error('Research chat parse error:', err);
      res.status(500).json({ error: err.message || 'Failed to parse research prompt' });
    }
  });

  // Missions
  app.get('/api/missions', (req, res) => {
    res.json({
      missions: store.getMissions(),
      activeMissionId: store.getActiveMissionId()
    });
  });

  app.get('/api/missions/active', (req, res) => {
    const activeId = store.getActiveMissionId();
    const mission = store.getMission(activeId);
    if (!mission) {
      return res.status(404).json({ error: 'Active mission not found' });
    }
    res.json(mission);
  });

  app.post('/api/missions/active', (req, res) => {
    const { id } = req.body;
    if (id && store.getMission(id)) {
      store.setActiveMissionId(id);
      store.addLog('SYSTEM', `Switched active dashboard mission to: [${id}]`, 'Dashboard');
      return res.json({ success: true, activeMissionId: id });
    }
    res.status(400).json({ error: 'Invalid mission id' });
  });

  // Get single mission
  app.get('/api/missions/:id', (req, res) => {
    const { id } = req.params;
    const mission = store.getMission(id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(mission);
  });

  // Create new mission with automated AI expansion and structured parameters
  app.post('/api/missions', async (req, res) => {
    try {
      const {
        name,
        topic,
        description,
        companies = [],
        competitors = [],
        keywords = [],
        researchInterests = [],
        preferredSources = ['arxiv', 'patent', 'news', 'sec_filing', 'github', 'web'],
        objective,
        frequencyMinutes = 30
      } = req.body;

      const rawObjective = objective || description || topic || name;
      if (!rawObjective && !name && !topic) {
        return res.status(400).json({ error: 'Mission name, topic, or objective is required' });
      }

      store.addLog('INFO', `Analyzing new tracking mission: "${name || topic || rawObjective}"`, 'MissionManager');
      const plan = await expandObjectiveIntoQueries({
        name,
        topic: topic || rawObjective,
        description: description || rawObjective,
        companies: Array.isArray(companies) ? companies : [],
        competitors: Array.isArray(competitors) ? competitors : [],
        keywords: Array.isArray(keywords) ? keywords : [],
        researchInterests: Array.isArray(researchInterests) ? researchInterests : [],
        preferredSources: Array.isArray(preferredSources) ? preferredSources : [],
        objective: rawObjective
      });

      const newMission: Mission = {
        id: `mission-${Date.now()}`,
        name: name || plan.missionName,
        code: plan.code,
        topic: topic || rawObjective,
        description: description || rawObjective,
        companies: Array.isArray(companies) ? companies : [],
        competitors: Array.isArray(competitors) ? competitors : [],
        keywords: Array.isArray(keywords) ? keywords : [],
        researchInterests: Array.isArray(researchInterests) ? researchInterests : [],
        preferredSources: Array.isArray(preferredSources) ? preferredSources : ['arxiv', 'patent', 'news', 'sec_filing', 'github'],
        objective: rawObjective,
        targetEntities: plan.targetEntities,
        searchVectors: plan.searchVectors,
        focusAreas: plan.focusAreas,
        frequencyMinutes: Number(frequencyMinutes) || 30,
        status: 'active',
        createdAt: new Date().toISOString(),
        totalSignalsScanned: 0,
        filteredInsightsCount: 0,
        meanLatencyMs: 6.8
      };

      const created = store.createMission(newMission);

      // Trigger initial collection cycle
      runAutonomousMissionCycle(created.id).catch((err) => {
        console.error('Initial cycle error:', err);
      });

      res.status(201).json(created);
    } catch (err: any) {
      console.error('Create mission error:', err);
      res.status(500).json({ error: err.message || 'Failed to create mission' });
    }
  });

  // Edit / update existing mission
  app.put('/api/missions/:id', async (req, res) => {
    const { id } = req.params;
    const existing = store.getMission(id);
    if (!existing) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    try {
      const updates = req.body;
      // Re-run light planning if topic, companies, competitors, or keywords changed
      if (
        updates.topic !== undefined ||
        updates.companies !== undefined ||
        updates.competitors !== undefined ||
        updates.keywords !== undefined ||
        updates.researchInterests !== undefined
      ) {
        const plan = await expandObjectiveIntoQueries({
          name: updates.name || existing.name,
          topic: updates.topic || existing.topic,
          description: updates.description || existing.description,
          companies: updates.companies || existing.companies,
          competitors: updates.competitors || existing.competitors,
          keywords: updates.keywords || existing.keywords,
          researchInterests: updates.researchInterests || existing.researchInterests,
          preferredSources: updates.preferredSources || existing.preferredSources
        });

        updates.targetEntities = plan.targetEntities;
        updates.searchVectors = plan.searchVectors;
        updates.focusAreas = plan.focusAreas;
      }

      const updated = store.updateMission(id, updates);
      res.json(updated);
    } catch (err: any) {
      console.error('Update mission error:', err);
      res.status(500).json({ error: err.message || 'Failed to update mission' });
    }
  });

  // Delete mission
  app.delete('/api/missions/:id', (req, res) => {
    const { id } = req.params;
    const success = store.deleteMission(id);
    if (!success) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json({
      success: true,
      activeMissionId: store.getActiveMissionId()
    });
  });

  // Activate / Deactivate (toggle status)
  app.post('/api/missions/:id/toggle-status', (req, res) => {
    const { id } = req.params;
    const updated = store.toggleMissionStatus(id);
    if (!updated) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(updated);
  });

  // Run autonomous cycle for a mission
  app.post('/api/missions/:id/run', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await runAutonomousMissionCycle(id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution error' });
    }
  });

  // Get Intelligence items
  app.get('/api/missions/:id/intel', (req, res) => {
    const { id } = req.params;
    const { minRelevance, minImpact, source, query } = req.query;

    let items = store.getIntelItems(id);

    if (minRelevance) {
      const min = Number(minRelevance);
      items = items.filter((i) => i.relevanceScore >= min);
    }
    if (minImpact) {
      const min = Number(minImpact);
      items = items.filter((i) => i.impactScore >= min);
    }
    if (source && source !== 'all') {
      items = items.filter((i) => i.source === source);
    }
    if (query && typeof query === 'string') {
      const q = query.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          i.mentionedEntities.some((e) => e.toLowerCase().includes(q))
      );
    }

    res.json({
      items,
      totalCount: items.length
    });
  });

  // Get Trends
  app.get('/api/missions/:id/trends', (req, res) => {
    const { id } = req.params;
    res.json(store.getTrends(id));
  });

  // Get Alerts
  app.get('/api/missions/:id/alerts', (req, res) => {
    const { id } = req.params;
    res.json(store.getAlerts(id));
  });

  // Mark Alert Read
  app.post('/api/missions/:id/alerts/:alertId/read', (req, res) => {
    const { id, alertId } = req.params;
    const success = store.markAlertRead(id, alertId);
    res.json({ success });
  });

  // System Logs
  app.get('/api/logs', (req, res) => {
    res.json(store.getLogs());
  });

  // Generate Executive Intelligence Briefing
  app.get('/api/missions/:id/report', (req, res) => {
    const { id } = req.params;
    const mission = store.getMission(id);
    const items = store.getIntelItems(id);
    const trends = store.getTrends(id);
    const alerts = store.getAlerts(id);

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const reportMarkdown = `# Autonomous Intelligence Briefing: ${mission.name} [${mission.code}]
**Generated:** ${new Date().toUTCString()}
**Tracking Objective:** ${mission.objective}
**Monitored Entities:** ${mission.targetEntities.map((e) => e.name).join(', ')}

---

## 1. Executive Summary
The autonomous tracker has indexed ${mission.totalSignalsScanned} signals across ArXiv, USPTO, and trade news, extracting ${items.length} actionable intelligence items. Key priority shifts center on ${mission.focusAreas.slice(0, 3).join(', ')}.

---

## 2. Critical & Strategic Alerts
${
  alerts.length > 0
    ? alerts.map((a) => `- **[${a.severity.toUpperCase()}]** ${a.headline} (${a.source})\n  *${a.reason}*`).join('\n')
    : '_No critical alerts triggered in this period._'
}

---

## 3. High-Impact Discoveries
${items
  .slice(0, 5)
  .map(
    (i, idx) => `### ${idx + 1}. ${i.title}
- **Source:** ${i.sourceLabel} | **Relevance:** ${i.relevanceScore}/100 | **Impact:** ${i.impactScore}/100 | **Priority:** ${i.strategicPriority}
- **Summary:** ${i.summary}
- **Strategic Implications:**
${i.keyImplications.map((imp) => `  - ${imp}`).join('\n')}
- **Evidence / Source Reference:** [Direct Link](${i.sourceUrl})
`
  )
  .join('\n')}

---

## 4. Trend Velocity Radar
${trends.map((t) => `- **${t.topic}** (${t.changePercent} growth): ${t.summary} [Velocity: ${t.velocity}]`).join('\n')}
`;

    res.json({
      missionName: mission.name,
      reportMarkdown
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hackverse Intel Tracker running on http://localhost:${PORT}`);
  });
}

startServer();
