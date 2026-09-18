import OpenAI from "openai";
import { config } from "../config";
import { extractCleanTopic } from "./topic-extractor";

export interface Stage1Result {
  outline: string;
  cleanTopic: string;
}

const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";

export async function runStage1Architect(
  topic: string,
  targetCount: number,
  isExplicit: boolean,
  reason: string,
  onChunk: (delta: string, isReasoning: boolean) => void
): Promise<Stage1Result> {
  const { title: cleanTopic } = extractCleanTopic(topic);
  let outlineText = "";

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const prompt = `You are a Principal Presentation Architect. Synthesize a ${targetCount}-slide technical presentation blueprint strictly derived from the provided document content for "${cleanTopic}".

SOURCE DOCUMENT & CONTEXT:
"""
${topic}
"""

TARGET SLIDE COUNT: ${targetCount} Slides (${isExplicit ? "Explicit user request" : reason})

CRITICAL VISUAL DESIGN MANDATE (ZERO TEXT-ONLY SLIDES):
1. MANDATORY VISUAL DRAWINGS & SHAPES: Never output slides consisting merely of text bullet cards. Presentations must look like world-class interactive explainers with diagrams, Venn topologies, and charts.
2. 100% FAITHFUL DOMAIN EXTRACTION: All concepts, formulas, statistics, and categories MUST be directly extracted from the provided text above.
3. DOMAIN RELEVANCE: Every parameter, slider, and label must compute an authentic metric described in the document.

Synthesize a bespoke ${targetCount}-slide visual explainer blueprint with numbered slides (SLIDE 1 through SLIDE ${targetCount}) specifying the exact visual drawing for each:
- SLIDE 1 (Scale & Metrics): Executive overview paired with a dynamic visual bar chart (.chart-card) comparing key growth numbers or metrics from the text.
- SLIDE 2 (Conceptual Architecture): Prominent visual drawing — an SVG Venn Diagram (.venn-container) showing overlapping conceptual visions/domains, OR a connected node pipeline (.flow-diagram).
- SLIDE 3 (Deep Dive & Invariants): Layered architectural stack OR structured dimensional matrix (.matrix-table) with visual status badges and trade-offs.
- SLIDE 4 (Interactive Living Simulation): Interactive simulation model (.sim-container) with a live visual graphic stage (.sim-visual-grid) that lights up and animates dynamically as parameters are adjusted.`;

  // Attempt 1: Nemotron 120B Super
  try {
    const stream = await openai.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a Principal Presentation Architect. Synthesize rich, highly technical slide outlines derived 100% from user documents. Never output generic boilerplate or placeholder variables.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2500,
      temperature: 0.5,
      stream: true,
    });

    for await (const chunk of stream) {
      const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
      if (reasoning) {
        onChunk(reasoning, true);
      }
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        outlineText += delta;
        onChunk(delta, false);
      }
    }
  } catch (err: any) {
    console.warn(`[Stage1Architect] Primary model ${PRIMARY_MODEL} error (${err?.message}). Trying fallback ${FALLBACK_MODEL}...`);
  }

  // Attempt 2: Nemotron 3.5 Lightning (fast fallback)
  if (!outlineText || outlineText.trim().length < 80) {
    try {
      outlineText = "";
      const stream = await openai.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a Principal Presentation Architect. Synthesize rich, highly technical slide outlines derived 100% from user documents. Never output generic boilerplate or placeholder variables.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2500,
        temperature: 0.5,
        stream: true,
      });

      for await (const chunk of stream) {
        const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
        if (reasoning) {
          onChunk(reasoning, true);
        }
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) {
          outlineText += delta;
          onChunk(delta, false);
        }
      }
    } catch (err: any) {
      console.warn(`[Stage1Architect] Fallback model error:`, err?.message || err);
    }
  }

  // Fallback: ZERO-SHOT DYNAMIC EXTRACTION directly from user sentences (NEVER Greek letters!)
  if (!outlineText || outlineText.trim().length < 60) {
    console.warn("[Stage1Architect] Generating dynamic extractive outline directly from source sentences...");
    const rawSentences = topic
      .replace(/#{1,6}\s+/g, "")
      .split(/[\n\.\?\!]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && !s.toLowerCase().startsWith("topic:") && !s.toLowerCase().startsWith("target:"));

    const s1 = rawSentences[0] || `Understanding the fundamental principles of ${cleanTopic}.`;
    const s2 = rawSentences[1] || `Key architectural structures and operational mechanisms.`;
    const s3 = rawSentences[2] || `Comparative trade-offs and scaling characteristics.`;
    const s4 = rawSentences[3] || `Key empirical findings and practical takeaways.`;

    outlineText = `SLIDE 1: Executive Overview & Foundation of ${cleanTopic}
- Primary Concept: ${s1}
- Scope & Scale: Critical operational principles directly from source text

SLIDE 2: Architectural Mechanisms & Operational Categories
- Mechanism: ${s2}
- Core Structure: Technical separation of concerns and data flow

SLIDE 3: Technical Challenges & Evaluation Matrix
- Key Factor: ${s3}
- Dimensional Trade-offs: Detailed analysis from the document

SLIDE 4: Strategic Takeaways & Interactive Simulation
- Core Takeaway: ${s4}
- Interactive Model: Direct parameter evaluation of ${cleanTopic}`;

    onChunk("\n\n" + outlineText, false);
  }

  return { outline: outlineText, cleanTopic };
}
