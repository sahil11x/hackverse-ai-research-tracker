import { GoogleGenAI, Type } from '@google/genai';
import { SourceType } from '../../src/types';

export interface StructuredResearchObjective {
  name: string;
  topic: string;
  description: string;
  companies: string[];
  competitors: string[];
  keywords: string[];
  researchInterests: string[];
  researchAreas: string[];
  preferredSources: SourceType[];
  trackingObjective: string;
  responseSummary: string;
  usedGemini: boolean;
}

export async function parseResearchPromptWithGemini(
  prompt: string
): Promise<StructuredResearchObjective> {
  const apiKey = process.env.GEMINI_API_KEY;

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

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `You are the AI Research Assistant of HACKVERSE Autonomous Competitive Intelligence Tracker.
The user provides a natural-language research task:
"${prompt}"

Extract and structure this into an operational research mission specification:
1. topic: The main technological topic or focus (e.g. "AI semiconductor technology", "Quantum Hardware", etc.)
2. name: A concise, professional title for the mission (e.g. "AI Semiconductor Intelligence")
3. description: A clear 1-2 sentence description of what will be researched
4. companies: Array of primary target companies/entities explicitly mentioned or primary to the topic (e.g. ["NVIDIA", "AMD", "Google"])
5. competitors: Array of key direct competitors or market challengers in this space (e.g. ["Intel", "Tenstorrent", "Cerebras"])
6. keywords: Core technical keywords to track (e.g. ["GPU", "AI accelerator", "inference", "HBM", "chiplets"])
7. researchInterests: Specific technical or market angles of interest (e.g. ["Substrate packaging yields", "Benchmark parity", "Thermal dissipation"])
8. researchAreas: Human-readable research areas (e.g. ["Research papers", "Patents", "Industry news", "Competitor developments"])
9. preferredSources: Array chosen from ["arxiv", "patent", "news", "sec_filing", "github", "web"]
10. trackingObjective: A concise operational objective (e.g. "Monitor new developments and identify important changes in AI semiconductor technology.")
11. responseSummary: A conversational confirmation message following this clean format:
"I understand your research objective.

Topic:
{topic}

Entities:
{companies}

Research areas:
{researchAreas}

Tracking objective:
{trackingObjective}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              topic: { type: Type.STRING },
              description: { type: Type.STRING },
              companies: { type: Type.ARRAY, items: { type: Type.STRING } },
              competitors: { type: Type.ARRAY, items: { type: Type.STRING } },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              researchInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
              researchAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
              preferredSources: { type: Type.ARRAY, items: { type: Type.STRING } },
              trackingObjective: { type: Type.STRING },
              responseSummary: { type: Type.STRING }
            },
            required: [
              'name',
              'topic',
              'description',
              'companies',
              'keywords',
              'researchAreas',
              'trackingObjective',
              'responseSummary'
            ]
          }
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timeout')), 5000)
      );

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        const validSources: SourceType[] = ['arxiv', 'patent', 'news', 'sec_filing', 'github', 'web'];
        const sanitizedSources = Array.isArray(parsed.preferredSources)
          ? parsed.preferredSources.filter((s: string) => validSources.includes(s as SourceType))
          : (['arxiv', 'patent', 'news', 'sec_filing', 'github'] as SourceType[]);

        return {
          name: parsed.name || 'AI Research Mission',
          topic: parsed.topic || prompt,
          description: parsed.description || prompt,
          companies: Array.isArray(parsed.companies) ? parsed.companies : [],
          competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          researchInterests: Array.isArray(parsed.researchInterests) ? parsed.researchInterests : [],
          researchAreas: Array.isArray(parsed.researchAreas) && parsed.researchAreas.length > 0
            ? parsed.researchAreas
            : ['Research papers', 'Patents', 'Industry news', 'Competitor developments'],
          preferredSources: sanitizedSources.length > 0 ? (sanitizedSources as SourceType[]) : ['arxiv', 'patent', 'news', 'sec_filing', 'github'],
          trackingObjective: parsed.trackingObjective || `Monitor new developments and identify important changes.`,
          responseSummary: parsed.responseSummary || `I understand your research objective.\n\nTopic:\n${parsed.topic || prompt}\n\nEntities:\n${(parsed.companies || []).join(', ') || 'Target industry entities'}\n\nResearch areas:\nResearch papers, patents, industry news, competitor developments\n\nTracking objective:\n${parsed.trackingObjective || 'Monitor new developments and identify important changes.'}`,
          usedGemini: true
        };
      }
    } catch (err) {
      console.warn('Gemini chat parser fallback triggered:', err);
    }
  }

  // Deterministic NLP / Pattern Fallback
  const lower = prompt.toLowerCase();
  
  // Extract companies
  const detectedCompanies: string[] = [];
  if (lower.includes('nvidia')) detectedCompanies.push('NVIDIA');
  if (lower.includes('amd')) detectedCompanies.push('AMD');
  if (lower.includes('google')) detectedCompanies.push('Google');
  if (lower.includes('intel')) detectedCompanies.push('Intel');
  if (lower.includes('apple')) detectedCompanies.push('Apple');
  if (lower.includes('microsoft')) detectedCompanies.push('Microsoft');
  if (lower.includes('amazon') || lower.includes('aws')) detectedCompanies.push('AWS');
  if (lower.includes('tesla')) detectedCompanies.push('Tesla');
  if (lower.includes('tsmc')) detectedCompanies.push('TSMC');
  if (lower.includes('qualcomm')) detectedCompanies.push('Qualcomm');
  if (lower.includes('ibm')) detectedCompanies.push('IBM');

  // If no companies explicitly detected, extract capitalized words or defaults
  if (detectedCompanies.length === 0) {
    if (lower.includes('semiconductor') || lower.includes('chip')) {
      detectedCompanies.push('NVIDIA', 'AMD', 'Google');
    } else {
      detectedCompanies.push('Primary Industry Leader', 'Key Challenger');
    }
  }

  // Topic determination
  let topic = 'AI semiconductor technology';
  let name = 'AI Semiconductor Intelligence';
  let keywords = ['GPU', 'AI accelerator', 'inference', 'HBM', 'chiplets'];
  let competitors = ['Intel', 'Tenstorrent', 'Cerebras', 'Groq'];
  let researchInterests = ['Packaging yields', 'Inference acceleration', 'Interconnect bandwidth'];

  if (lower.includes('quantum')) {
    topic = 'Quantum computing architectures';
    name = 'Quantum Hardware Breakthroughs';
    keywords = ['Superconducting qubit', 'Surface codes', 'Cryo-CMOS'];
    competitors = ['QuEra', 'IonQ', 'Quantinuum'];
    researchInterests = ['Logical qubit fidelity', 'Quantum error correction'];
  } else if (lower.includes('robot') || lower.includes('humanoid')) {
    topic = 'Humanoid robotics & embodied actuation';
    name = 'Humanoid Robotics Intelligence';
    keywords = ['Harmonic drive', 'Actuator', 'VLA model', 'Tactile sensing'];
    competitors = ['Unitree', 'Agility Robotics', 'Sanctuary AI'];
    researchInterests = ['Torque density', 'Sim-to-real transfer'];
  } else if (lower.includes('battery') || lower.includes('energy')) {
    topic = 'Solid-state battery chemistry';
    name = 'Battery Chemistry Innovations';
    keywords = ['Solid electrolyte', 'Silicon anode', 'Cathode loading'];
    competitors = ['QuantumScape', 'CATL', 'Toyota'];
    researchInterests = ['Dendrite suppression', 'Energy density'];
  } else if (lower.includes('semiconductor') || lower.includes('gpu') || lower.includes('chip')) {
    topic = 'AI semiconductor technology';
    name = 'AI Semiconductor Intelligence';
    keywords = ['GPU', 'AI accelerator', 'inference', 'HBM', 'chiplets'];
  } else {
    // Clean topic from prompt
    const cleaned = prompt.replace(/research|track|monitor|the latest developments in|and track|please/gi, '').trim();
    topic = cleaned.length > 3 ? cleaned : 'Emerging Technology Intelligence';
    name = `${topic.slice(0, 24).trim()} Intelligence`;
  }

  const researchAreas = [
    'Research papers',
    'Patents',
    'Industry news',
    'Competitor developments'
  ];

  const trackingObjective = 'Monitor new developments and identify important changes.';

  const responseSummary = `I understand your research objective.

Topic:
${topic}

Entities:
${detectedCompanies.join(', ')}

Research areas:
${researchAreas.join(', ')}

Tracking objective:
${trackingObjective}`;

  return {
    name,
    topic,
    description: `Track latest developments, patent disclosures, and competitor architectures for ${topic}.`,
    companies: detectedCompanies,
    competitors,
    keywords,
    researchInterests,
    researchAreas,
    preferredSources: ['arxiv', 'patent', 'news', 'sec_filing', 'github'],
    trackingObjective,
    responseSummary,
    usedGemini: false
  };
}
