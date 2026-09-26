import OpenAI from "openai";
import { config } from "../config";
import { extractCleanTopic } from "./topic-extractor";
import { geminiService } from "../services/geminiService";
import { Stage1Extraction } from "./types/sixStageTypes";
import { parseTolerantJson } from "./utils/tolerantJson";

export interface Stage1AnalysisResult {
  analysis: string;
  cleanTopic: string;
  usedModel?: string;
  data?: Stage1Extraction;
}

export function parseStage1Json(raw: string): Stage1Extraction | null {
  return parseTolerantJson<Stage1Extraction>(raw).data;
}

const TIER1_MODEL = config.nvidiaReasoningModel || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
const TIER2_MODEL = config.nvidiaModel || "nvidia/nemotron-3-super-120b-a12b";

/**
 * Stage 1: Extractor (Nemotron 30B / Fallbacks)
 * Extracts structured JSON and up to 18 verbatim technical_payload items.
 */
export async function runStage1Analyzer(
  rawContent: string,
  targetCount: number,
  onChunk: (delta: string, isReasoning: boolean) => void,
  engine: "gemini" | "nvidia" | "auto" = "auto",
  signal?: AbortSignal,
  domainParam?: string
): Promise<Stage1AnalysisResult> {
  const { title: cleanTopicFromInput } = extractCleanTopic(rawContent);
  let cleanTopic = cleanTopicFromInput;
  let analysisText = "";
  let usedModel = TIER1_MODEL;
  const maxTokens = 3500;

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
    timeout: 15000,
  });

  const prompt = `You are a precision document analyst with deep technical expertise.
Your output feeds a 6-stage AI pipeline. Data loss here = garbage slides.

CRITICAL RULES:
- Return ONLY valid JSON. Zero explanation. Zero markdown. Zero preamble.
- Never summarize technical content — extract it verbatim
- Never invent or infer data not present in the input
- Extract TOP 12-18 technical_payload items maximum
- Prioritize by importance to core thesis, not by order of appearance
- If source has 50+ technical items, be ruthless — keep only the most critical

Extract this exact schema:
{
  "core_thesis": "one sentence, the single most important point",
  "target_audience": "specific description of who will see this",
  "slide_count": number 8-14 based on content density,
  "domain": "tech | science | business | education | other",
  "tone": "formal | casual | cinematic | academic",
  "key_concepts": ["max 6 concepts, specific not generic"],
  "content_types_needed": {
    "has_math": boolean,
    "has_data": boolean,
    "has_timeline": boolean,
    "has_comparison": boolean,
    "has_code": boolean,
    "has_diagrams": boolean
  },
  "technical_payload": [
    {
      "id": "tp_001",
      "type": "formula | code | stat | quote | definition | command",
      "label": "short human label",
      "content": "EXACT verbatim content — never paraphrased",
      "slide_hint": "which concept this likely belongs to",
      "importance": "critical | high | medium"
    }
  ]
}

The technical_payload is the most important field.
Hard limit: 18 items. If you exceed this your JSON 
will be truncated and the pipeline will fail.
Rank by importance. Cut ruthlessly.

Input: ${rawContent}`;

  const systemInstruction = "You are a precision document analyst and technical knowledge extractor. Return ONLY valid JSON. Zero explanation. Zero markdown. Zero preamble.";

  // Tier 1: Nemotron 30B (or Gemini if engine === 'gemini')
  if (engine === "gemini" && geminiService.isAvailable()) {
    try {
      signal?.throwIfAborted();
      usedModel = `google/${geminiService.getModel()}`;
      await geminiService.streamChat({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        maxTokens,
        signal,
        onReasoning: (delta) => onChunk(delta, true),
        onChunk: (delta) => {
          analysisText += delta;
          onChunk(delta, false);
        },
      });

      const parsed = parseTolerantJson<Stage1Extraction>(analysisText);
      if (parsed.data?.core_thesis) {
        if (!cleanTopic || cleanTopic.length < 3) cleanTopic = parsed.data.core_thesis;
        return { analysis: analysisText, cleanTopic, usedModel, data: parsed.data };
      }
    } catch (gErr: any) {
      if (signal?.aborted) throw gErr;
      console.warn(`[Stage1Analyzer] Gemini error: ${gErr?.message}. Falling back to NVIDIA...`);
      analysisText = "";
    }
  }

  // Tier 1 (NVIDIA / Auto): Nemotron 30B
  try {
    signal?.throwIfAborted();
    usedModel = TIER1_MODEL;
    const stream = await openai.chat.completions.create({
      model: TIER1_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.2,
      stream: true,
    }, { signal });

    for await (const chunk of stream) {
      const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
      if (reasoning) onChunk(reasoning, true);
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        analysisText += delta;
        onChunk(delta, false);
      }
    }

    const parsed = parseTolerantJson<Stage1Extraction>(analysisText);
    if (parsed.data?.core_thesis) {
      if (!cleanTopic || cleanTopic.length < 3) cleanTopic = parsed.data.core_thesis;
      return { analysis: analysisText, cleanTopic, usedModel, data: parsed.data };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage1Analyzer] Tier 1 (${TIER1_MODEL}) failed: ${err?.message}. Falling back to Tier 2...`);
    analysisText = "";
  }

  // Tier 2: Nemotron 120B Super
  try {
    signal?.throwIfAborted();
    usedModel = TIER2_MODEL;
    analysisText = "";
    const stream = await openai.chat.completions.create({
      model: TIER2_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.2,
      stream: true,
    }, { signal });

    for await (const chunk of stream) {
      const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
      if (reasoning) onChunk(reasoning, true);
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        analysisText += delta;
        onChunk(delta, false);
      }
    }

    const parsed = parseTolerantJson<Stage1Extraction>(analysisText);
    if (parsed.data?.core_thesis) {
      if (!cleanTopic || cleanTopic.length < 3) cleanTopic = parsed.data.core_thesis;
      return { analysis: analysisText, cleanTopic, usedModel, data: parsed.data };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage1Analyzer] Tier 2 (${TIER2_MODEL}) failed: ${err?.message}. Falling back to Tier 3 (Gemini)...`);
    analysisText = "";
  }

  // Tier 3: Gemini 3.8 Flash Cross-Provider Fallback
  if (geminiService.isAvailable()) {
    try {
      signal?.throwIfAborted();
      usedModel = `google/${geminiService.getModel()}`;
      await geminiService.streamChat({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        maxTokens,
        signal,
        onReasoning: (delta) => onChunk(delta, true),
        onChunk: (delta) => {
          analysisText += delta;
          onChunk(delta, false);
        },
      });

      const parsed = parseTolerantJson<Stage1Extraction>(analysisText);
      if (parsed.data?.core_thesis) {
        if (!cleanTopic || cleanTopic.length < 3) cleanTopic = parsed.data.core_thesis;
        return { analysis: analysisText, cleanTopic, usedModel, data: parsed.data };
      }
    } catch (gErr: any) {
      if (signal?.aborted) throw gErr;
      console.warn(`[Stage1Analyzer] Tier 3 (Gemini) failed: ${gErr?.message}`);
    }
  }

  signal?.throwIfAborted();
  throw new Error("Stage 1 (Extractor) failed across all 3 tiers. Please verify API keys and network connectivity.");
}
