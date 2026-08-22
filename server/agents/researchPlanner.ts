import { GoogleGenAI, Type } from '@google/genai';
import { AgentHandoff, ResearchPlan, ToolName } from '../../src/types';
import { store } from '../store';

export interface PlanObjectiveInput {
  name?: string;
  topic?: string;
  description?: string;
  companies?: string[];
  competitors?: string[];
  keywords?: string[];
  researchInterests?: string[];
  preferredSources?: string[];
  objective?: string;
}

// Fallback rule-based planner if Gemini API is unavailable
export function generateHeuristicResearchPlan(input: PlanObjectiveInput): { plan: ResearchPlan; handoff: AgentHandoff } {
  const rawText = (input.objective || input.description || input.topic || input.name || 'AI Research').trim();
  const lower = rawText.toLowerCase();

  // Determine intent
  const hasAcademic =
    lower.includes('academic') ||
    lower.includes('paper') ||
    lower.includes('research') ||
    lower.includes('arxiv') ||
    lower.includes('theory') ||
    lower.includes('algorithm') ||
    lower.includes('literature');

  const hasCode =
    lower.includes('github') ||
    lower.includes('open-source') ||
    lower.includes('open source') ||
    lower.includes('code') ||
    lower.includes('repo') ||
    lower.includes('implementation') ||
    lower.includes('framework') ||
    lower.includes('library');

  const isComparison =
    lower.includes('compare') ||
    lower.includes('comparing') ||
    lower.includes('versus') ||
    lower.includes('vs') ||
    lower.includes('benchmark') ||
    (hasAcademic && hasCode);

  let intentType: ResearchPlan['intentType'] = 'exploratory';
  const selectedTools: ToolName[] = [];

  if (isComparison || (hasAcademic && hasCode)) {
    intentType = 'comparative';
    selectedTools.push('search_arxiv', 'search_github');
  } else if (hasAcademic) {
    intentType = 'academic_only';
    selectedTools.push('search_arxiv');
  } else if (hasCode) {
    intentType = 'opensource_only';
    selectedTools.push('search_github');
  } else {
    intentType = 'exploratory';
    selectedTools.push('search_arxiv', 'search_github');
  }

  // Extract core keywords by stripping filler words
  const cleanKeywords = rawText
    .replace(/^(research|compare|analyze|investigate|find|look for|track|study|search for)\s+/i, '')
    .replace(/(by comparing|with|for|recent|latest|academic|research papers|open-source|github implementations|state of the art)\b/gi, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 5)
    .join(' ')
    .trim() || 'transformer LLM inference optimization';

  const planId = `PLAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const handoffId = `HND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const plan: ResearchPlan = {
    planId,
    objective: rawText,
    intent: `Investigate and analyze ${rawText}`,
    intentType,
    selectedTools,
    toolQueries: {
      search_arxiv: selectedTools.includes('search_arxiv') ? cleanKeywords : undefined,
      search_github: selectedTools.includes('search_github') ? cleanKeywords : undefined
    },
    researchAreas: [
      'Inference Acceleration & Kernel Optimization',
      'Transformer Architecture Enhancements',
      'Hardware-Software Co-Design & Quantization'
    ],
    targetEntities: [
      { name: 'NVIDIA', ticker: 'NVDA', role: 'AI Accelerator & GPU Computing' },
      { name: 'Open-Source AI Community', role: 'Framework & Kernel Implementations' }
    ],
    searchVectors: ['ArXiv Preprint Repositories', 'GitHub Open Source Commits', 'Tech Research Disclosures'],
    hypotheses: [
      'Open-source implementations rapidly adapt academic kernel designs for production inference.',
      'Hardware memory bandwidth constraints drive novel quantization and attention optimizations.'
    ],
    createdAt: new Date().toISOString()
  };

  const handoff: AgentHandoff = {
    handoffId,
    fromAgent: 'ResearchPlannerAgent',
    toAgent: 'IntelligenceAnalystAgent',
    timestamp: new Date().toISOString(),
    plan,
    instructionsForAnalyst: `Analyze live evidence collected for objective "${rawText}". Cross-correlate academic papers with open-source implementations, identify strategic impact, and synthesize actionable findings with source provenance.`,
    status: 'dispatched'
  };

  return { plan, handoff };
}

/**
 * AGENT 1: RESEARCH PLANNER
 * Receives the research objective, classifies intent, selects research tools,
 * generates optimized queries tailored to each tool, and outputs a structured
 * ResearchPlan + AgentHandoff payload.
 */
export async function executeResearchPlannerAgent(
  input: PlanObjectiveInput
): Promise<{ plan: ResearchPlan; handoff: AgentHandoff }> {
  const objective = (input.objective || input.description || input.topic || input.name || '').trim();
  const apiKey = process.env.GEMINI_API_KEY;

  store.addLog('INFO', `AGENT 1 — RESEARCH PLANNER: Initiating research planning for objective: "${objective.slice(0, 100)}..."`, 'ResearchPlannerAgent');

  if (!apiKey || !objective) {
    store.addLog('SYSTEM', 'AGENT 1 — RESEARCH PLANNER: Using deterministic heuristic planning engine.', 'ResearchPlannerAgent');
    const result = generateHeuristicResearchPlan(input);
    logPlannerSummary(result.plan, result.handoff);
    return result;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are AGENT 1: RESEARCH PLANNER for Hackverse Intel, an autonomous AI research & competitive intelligence platform.

Your mission:
1. Thoroughly parse the user's research objective: "${objective}"
2. Identify the core intent: Is it comparative (e.g. comparing academic research with open-source code), academic-only, open-source-only, or general exploratory?
3. Decide which external research tools MUST be invoked:
   - "search_arxiv": Academic papers, scientific preprints, theoretical algorithms, mathematical formulations.
   - "search_github": Open-source repositories, software libraries, code implementations, kernels, benchmarks.
   - IMPORTANT: If the user mentions comparing papers with code, research with implementations, or both academic and open-source, you MUST select BOTH ["search_arxiv", "search_github"].
4. Generate HIGHLY TARGETED, OPTIMIZED queries for each tool:
   - For arXiv: Clean academic terms without conversational filler (e.g., "transformer inference optimization" or "LLM quantization flashattention").
   - For GitHub: Keyword search query suitable for repository discovery (e.g., "llm inference optimization" or "transformer acceleration").
5. Identify target entities/companies (e.g., NVIDIA, AMD, PyTorch, vLLM), core research focus areas, and key analytical hypotheses.
6. Provide specific analytical instructions for AGENT 2 (Intelligence Analyst Agent).

Respond strictly with a valid JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            intentType: {
              type: Type.STRING,
              enum: ['comparative', 'academic_only', 'opensource_only', 'exploratory']
            },
            selectedTools: {
              type: Type.ARRAY,
              items: { type: Type.STRING, enum: ['search_arxiv', 'search_github'] }
            },
            arxivQuery: { type: Type.STRING },
            githubQuery: { type: Type.STRING },
            researchAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            targetEntities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  ticker: { type: Type.STRING },
                  role: { type: Type.STRING }
                },
                required: ['name', 'role']
              }
            },
            hypotheses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            instructionsForAnalyst: { type: Type.STRING }
          },
          required: [
            'intent',
            'intentType',
            'selectedTools',
            'researchAreas',
            'targetEntities',
            'instructionsForAnalyst'
          ]
        }
      }
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    // Safeguard tool selection: if objective is comparative, guarantee both tools are included
    let selectedTools: ToolName[] = Array.isArray(parsed.selectedTools) ? parsed.selectedTools : [];
    const lowerObj = objective.toLowerCase();
    if (
      (lowerObj.includes('academic') || lowerObj.includes('paper') || lowerObj.includes('research')) &&
      (lowerObj.includes('github') || lowerObj.includes('open-source') || lowerObj.includes('code') || lowerObj.includes('implementation'))
    ) {
      if (!selectedTools.includes('search_arxiv')) selectedTools.push('search_arxiv');
      if (!selectedTools.includes('search_github')) selectedTools.push('search_github');
    }

    if (selectedTools.length === 0) {
      selectedTools = ['search_arxiv', 'search_github'];
    }

    const planId = `PLAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const handoffId = `HND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const plan: ResearchPlan = {
      planId,
      objective,
      intent: parsed.intent || `Investigate ${objective}`,
      intentType: (parsed.intentType as ResearchPlan['intentType']) || 'comparative',
      selectedTools,
      toolQueries: {
        search_arxiv: selectedTools.includes('search_arxiv') ? (parsed.arxivQuery || parsed.intent || objective) : undefined,
        search_github: selectedTools.includes('search_github') ? (parsed.githubQuery || parsed.intent || objective) : undefined
      },
      researchAreas: Array.isArray(parsed.researchAreas) && parsed.researchAreas.length > 0 ? parsed.researchAreas : [
        'Hardware-Aware Architecture Optimization',
        'Kernel Compilation & Memory Bandwidth',
        'Model Compression & Low-Precision Inference'
      ],
      targetEntities: Array.isArray(parsed.targetEntities) && parsed.targetEntities.length > 0 ? parsed.targetEntities : [
        { name: 'NVIDIA Corp.', ticker: 'NVDA', role: 'AI Accelerator Leader' }
      ],
      searchVectors: ['ArXiv Preprint Repositories', 'GitHub Open Source Commits', 'Industry Disclosures'],
      hypotheses: Array.isArray(parsed.hypotheses) && parsed.hypotheses.length > 0 ? parsed.hypotheses : [
        'Open-source software stacks are rapidly closing efficiency gaps for production LLM serving.'
      ],
      createdAt: new Date().toISOString()
    };

    const handoff: AgentHandoff = {
      handoffId,
      fromAgent: 'ResearchPlannerAgent',
      toAgent: 'IntelligenceAnalystAgent',
      timestamp: new Date().toISOString(),
      plan,
      instructionsForAnalyst: parsed.instructionsForAnalyst || `Evaluate collected evidence against research plan [${planId}] and synthesize actionable intelligence.`,
      status: 'dispatched'
    };

    logPlannerSummary(plan, handoff);
    return { plan, handoff };
  } catch (err: any) {
    store.addLog('WARNING', `AGENT 1 — RESEARCH PLANNER: Gemini planning error (${err.message}), falling back to deterministic planning.`, 'ResearchPlannerAgent');
    const fallback = generateHeuristicResearchPlan(input);
    logPlannerSummary(fallback.plan, fallback.handoff);
    return fallback;
  }
}

function logPlannerSummary(plan: ResearchPlan, handoff: AgentHandoff) {
  store.addLog('SUCCESS', `AGENT 1 — RESEARCH PLANNER: Objective understood: "${plan.objective.slice(0, 80)}"`, 'ResearchPlannerAgent');
  store.addLog('INFO', `AGENT 1 — RESEARCH PLANNER: Intent classified as [${plan.intentType.toUpperCase()}]. Tools selected: [${plan.selectedTools.join(', ')}]`, 'ResearchPlannerAgent');
  if (plan.toolQueries.search_arxiv) {
    store.addLog('INFO', `AGENT 1 — RESEARCH PLANNER: Optimized arXiv query -> "${plan.toolQueries.search_arxiv}"`, 'ResearchPlannerAgent');
  }
  if (plan.toolQueries.search_github) {
    store.addLog('INFO', `AGENT 1 — RESEARCH PLANNER: Optimized GitHub query -> "${plan.toolQueries.search_github}"`, 'ResearchPlannerAgent');
  }
  store.addLog('SUCCESS', `AGENT 1 — RESEARCH PLANNER: Plan [${plan.planId}] generated with ${plan.targetEntities.length} entities and ${plan.researchAreas.length} focus areas.`, 'ResearchPlannerAgent');
  store.addLog('SYSTEM', `AGENT 1 — RESEARCH PLANNER: Dispatched Handoff [${handoff.handoffId}] to Agent 2 (Intelligence Analyst).`, 'ResearchPlannerAgent');
}
