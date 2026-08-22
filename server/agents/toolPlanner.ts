import { GoogleGenAI, Type } from '@google/genai';
import { DynamicToolPlan, ToolName } from '../tools/types';

export interface ToolPlanningContext {
  topic?: string;
  objective?: string;
  description?: string;
  keywords?: string[];
  companies?: string[];
  competitors?: string[];
  researchInterests?: string[];
  preferredSources?: string[];
}

/**
 * Dynamic Tool Planner using Gemini
 * Analyzes the user's natural-language research intent and dynamically determines
 * whether to call search_arxiv, search_github, both, or neither.
 */
export async function planDynamicTools(
  queryOrPrompt: string,
  context?: ToolPlanningContext
): Promise<DynamicToolPlan> {
  const apiKey = process.env.GEMINI_API_KEY;

  const topic = context?.topic || queryOrPrompt;
  const description = context?.description || '';
  const keywords = context?.keywords || [];
  const companies = context?.companies || [];
  const researchInterests = context?.researchInterests || [];
  const preferredSources = context?.preferredSources || [];

  const contextDescription = `
User Query / Task: "${queryOrPrompt}"
Topic: ${topic}
${description ? `Description: ${description}` : ''}
${companies.length > 0 ? `Target Companies: ${companies.join(', ')}` : ''}
${keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : ''}
${researchInterests.length > 0 ? `Research Interests: ${researchInterests.join(', ')}` : ''}
${preferredSources.length > 0 ? `User Preferred Sources: ${preferredSources.join(', ')}` : ''}
`.trim();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are the Dynamic Tool Selection Agent for HackVerse Autonomous Intelligence Tracker.
Available Tools:
1. "search_arxiv": Searches academic research papers, preprints, algorithms, and theoretical breakthroughs on arXiv.
2. "search_github": Searches open-source code repositories, frameworks, implementations, and benchmarks on GitHub.

DYNAMIC SELECTION RULES:
- Do NOT blindly select both tools for every query!
- If the user explicitly asks for research papers, academic studies, preprints, theoretical math, or physics breakthroughs -> select ONLY ["search_arxiv"].
- If the user explicitly asks for open-source code, GitHub repositories, software libraries, benchmarks, or frameworks -> select ONLY ["search_github"].
- If the user asks to compare academic research with open-source implementations, or asks for comprehensive technical intelligence spanning both literature and code implementations -> select BOTH ["search_arxiv", "search_github"].
- If the query is general technology exploration (e.g. "AI accelerator architectures"), evaluate what sources are most relevant. If both academic architecture design and open-source stacks apply, choose both; if purely theoretical or paper-based, choose "search_arxiv".
- Construct clean, specific, keyword-optimized queries for each selected tool in tool_queries (e.g. for arXiv: "AI accelerator architecture", for GitHub: "LLM inference accelerator").

User Context:
${contextDescription}`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              research_intent: {
                type: Type.STRING,
                description: 'Short 1-sentence statement of why specific tools were selected or excluded.'
              },
              selected_tools: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  enum: ['search_arxiv', 'search_github']
                },
                description: 'Array of selected tool names.'
              },
              tool_queries: {
                type: Type.OBJECT,
                properties: {
                  search_arxiv: { type: Type.STRING, description: 'Optimized search query for arXiv' },
                  search_github: { type: Type.STRING, description: 'Optimized search query for GitHub' }
                }
              }
            },
            required: ['research_intent', 'selected_tools', 'tool_queries']
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini dynamic tool selection timeout')), 5000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        const validTools: ToolName[] = ['search_arxiv', 'search_github'];
        const selectedTools: ToolName[] = Array.isArray(parsed.selected_tools)
          ? parsed.selected_tools.filter((t: string) => validTools.includes(t as ToolName))
          : [];

        // Ensure at least one tool is selected if user requested research
        const finalTools = selectedTools.length > 0 ? selectedTools : (['search_arxiv'] as ToolName[]);

        return {
          research_intent: parsed.research_intent || 'Dynamic tool selection for technical intelligence.',
          selected_tools: finalTools,
          tool_queries: {
            search_arxiv: parsed.tool_queries?.search_arxiv || topic,
            search_github: parsed.tool_queries?.search_github || topic
          }
        };
      }
    } catch (err) {
      console.warn('Gemini dynamic tool selection fallback triggered:', err);
    }
  }

  // Deterministic Intent Heuristic Fallback
  const lower = (queryOrPrompt + ' ' + topic + ' ' + (preferredSources.join(' '))).toLowerCase();

  const isArxivMentioned =
    lower.includes('paper') ||
    lower.includes('arxiv') ||
    lower.includes('academic') ||
    lower.includes('research') ||
    lower.includes('study') ||
    lower.includes('theory') ||
    lower.includes('equation') ||
    lower.includes('quantum') ||
    lower.includes('architecture');

  const isGithubMentioned =
    lower.includes('github') ||
    lower.includes('code') ||
    lower.includes('repo') ||
    lower.includes('project') ||
    lower.includes('open-source') ||
    lower.includes('opensource') ||
    lower.includes('implementation') ||
    lower.includes('library') ||
    lower.includes('framework') ||
    lower.includes('software') ||
    lower.includes('benchmark');

  const selectedTools: ToolName[] = [];
  let intentDesc = '';

  // Determine selection based on keyword prominence
  if (isArxivMentioned && isGithubMentioned) {
    selectedTools.push('search_arxiv', 'search_github');
    intentDesc = 'Multi-vector research comparing academic papers with open-source implementations.';
  } else if (isGithubMentioned && !isArxivMentioned) {
    selectedTools.push('search_github');
    intentDesc = 'Targeted open-source software and GitHub repository discovery.';
  } else if (isArxivMentioned && !isGithubMentioned) {
    selectedTools.push('search_arxiv');
    intentDesc = 'Targeted academic literature and preprint paper discovery.';
  } else {
    // Default general technical research: check preferred sources or default to arXiv
    if (preferredSources.includes('github') && !preferredSources.includes('arxiv')) {
      selectedTools.push('search_github');
      intentDesc = 'Targeted GitHub repository search based on preferred sources.';
    } else if (preferredSources.includes('arxiv') && !preferredSources.includes('github')) {
      selectedTools.push('search_arxiv');
      intentDesc = 'Targeted arXiv paper search based on preferred sources.';
    } else {
      selectedTools.push('search_arxiv', 'search_github');
      intentDesc = 'Comprehensive technical discovery across academic and engineering sources.';
    }
  }

  const cleanTopic = topic.replace(/[^\w\s\-]/g, ' ').trim();
  const kw = keywords.slice(0, 3).join(' ') || cleanTopic;

  return {
    research_intent: intentDesc,
    selected_tools: selectedTools,
    tool_queries: {
      search_arxiv: `${cleanTopic} ${kw}`.trim(),
      search_github: cleanTopic
    }
  };
}
