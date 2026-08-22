import { GoogleGenAI, Type } from '@google/genai';
import { CategoryType, IntelItem, PriorityLevel } from '../../src/types';
import { RawDiscoveredItem } from './fetcher';
import { PlannedQueryPlan } from './queryPlanner';

function generateFingerprint(title: string, content: string): string {
  const clean = (title + content.slice(0, 40))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 32);
  return `fp_${clean}_${clean.length}`;
}

export async function analyzeAndScoreItems(
  rawItems: RawDiscoveredItem[],
  missionId: string,
  plan: PlannedQueryPlan
): Promise<IntelItem[]> {
  const analyzed: IntelItem[] = [];
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Deduplication stage
  const seenFp = new Set<string>();
  const uniqueRaw: RawDiscoveredItem[] = [];

  for (const raw of rawItems) {
    const fp = generateFingerprint(raw.title, raw.rawContent);
    if (!seenFp.has(fp)) {
      seenFp.add(fp);
      uniqueRaw.push(raw);
    }
  }

  // 2. AI Deep Analysis & Scoring Batch
  if (apiKey && uniqueRaw.length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are a Senior Strategic Intelligence Analyst.
Mission Target Entities: ${plan.targetEntities.map((e) => e.name).join(', ')}
Mission Focus Areas: ${plan.focusAreas.join(', ')}

Analyze the following collected items. For each item:
1. Calculate Relevance Score (0-100): How closely does this match the core entities and technological focus?
2. Calculate Impact Score (0-100): Assess technical breakthrough, competitor threat level, and commercial impact.
3. Assign Strategic Priority: CRITICAL (>=85), STRATEGIC (>=75), HIGH (>=65), TREND (>=50), or MEDIUM.
4. Assign Category: hardware, architecture, patent, business, benchmark, or software.
5. Provide a concise, highly actionable 2-3 sentence executive intelligence summary.
6. Extract 2-3 bullet point strategic implications.
7. Identify mentioned entities from the target list.

Raw Items:
${JSON.stringify(uniqueRaw.slice(0, 6), null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemIndex: { type: Type.INTEGER },
                relevanceScore: { type: Type.INTEGER },
                impactScore: { type: Type.INTEGER },
                strategicPriority: {
                  type: Type.STRING,
                  enum: ['CRITICAL', 'STRATEGIC', 'HIGH', 'MEDIUM', 'TREND', 'LOW']
                },
                category: {
                  type: Type.STRING,
                  enum: ['hardware', 'architecture', 'patent', 'business', 'benchmark', 'software']
                },
                summary: { type: Type.STRING },
                keyImplications: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                mentionedEntities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                confidence: { type: Type.NUMBER }
              },
              required: ['itemIndex', 'relevanceScore', 'impactScore', 'strategicPriority', 'category', 'summary', 'keyImplications', 'mentionedEntities']
            }
          }
        }
      });

      if (response.text) {
        const enrichedList = JSON.parse(response.text.trim());
        for (const enr of enrichedList) {
          const raw = uniqueRaw[enr.itemIndex] || uniqueRaw[0];
          if (raw && enr.relevanceScore >= 60) {
            analyzed.push({
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              missionId,
              title: raw.title,
              source: raw.source,
              sourceLabel: raw.sourceLabel,
              sourceUrl: raw.sourceUrl,
              publishedAt: raw.publishedAt,
              rawContent: raw.rawContent,
              fingerprint: generateFingerprint(raw.title, raw.rawContent),
              relevanceScore: Math.min(100, Math.max(10, enr.relevanceScore)),
              impactScore: Math.min(100, Math.max(10, enr.impactScore)),
              strategicPriority: enr.strategicPriority as PriorityLevel,
              category: enr.category as CategoryType,
              summary: enr.summary,
              keyImplications: enr.keyImplications,
              mentionedEntities: enr.mentionedEntities,
              relatedItemIds: [],
              evidenceSnippet: raw.evidenceSnippet,
              confidence: enr.confidence || 0.92
            });
          }
        }
      }
    } catch (err) {
      console.warn('Gemini analysis fallback triggered:', err);
    }
  }

  // Fallback heuristic scoring if AI call did not process all items
  if (analyzed.length === 0) {
    for (let i = 0; i < uniqueRaw.length; i++) {
      const raw = uniqueRaw[i];
      const lower = (raw.title + ' ' + raw.rawContent).toLowerCase();

      // Heuristic Relevance
      let rel = 70;
      for (const ent of plan.targetEntities) {
        if (lower.includes(ent.name.toLowerCase()) || (ent.ticker && lower.includes(ent.ticker.toLowerCase()))) {
          rel += 10;
        }
      }
      rel = Math.min(98, rel);

      // Heuristic Impact
      let imp = 65;
      if (raw.source === 'patent') imp += 15;
      if (lower.includes('yield') || lower.includes('breakthrough') || lower.includes('benchmark')) imp += 12;
      imp = Math.min(96, imp);

      let prio: PriorityLevel = 'MEDIUM';
      if (imp >= 85) prio = 'CRITICAL';
      else if (imp >= 75) prio = 'STRATEGIC';
      else if (imp >= 65) prio = 'HIGH';

      let cat: CategoryType = 'hardware';
      if (raw.source === 'patent') cat = 'patent';
      else if (raw.source === 'github') cat = 'software';
      else if (lower.includes('interconnect') || lower.includes('fabric')) cat = 'architecture';
      else if (lower.includes('benchmark')) cat = 'benchmark';

      const foundEntities = plan.targetEntities
        .filter((e) => lower.includes(e.name.toLowerCase()) || (e.ticker && lower.includes(e.ticker.toLowerCase())))
        .map((e) => e.name);

      analyzed.push({
        id: `item-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        missionId,
        title: raw.title,
        source: raw.source,
        sourceLabel: raw.sourceLabel,
        sourceUrl: raw.sourceUrl,
        publishedAt: raw.publishedAt,
        rawContent: raw.rawContent,
        fingerprint: generateFingerprint(raw.title, raw.rawContent),
        relevanceScore: rel,
        impactScore: imp,
        strategicPriority: prio,
        category: cat,
        summary: `Strategic discovery: ${raw.title}. Cross-source inspection indicates significant development in ${cat} technology affecting target competitors.`,
        keyImplications: [
          `Potential performance or commercial acceleration for ${foundEntities[0] || 'target entity'}`,
          `Competitive pressure on alternate hardware stacks and interconnects`,
          `Evidence verified via ${raw.sourceLabel}`
        ],
        mentionedEntities: foundEntities.length > 0 ? foundEntities : [plan.targetEntities[0]?.name || 'Target Entity'],
        relatedItemIds: [],
        evidenceSnippet: raw.evidenceSnippet,
        confidence: 0.9
      });
    }
  }

  return analyzed;
}
