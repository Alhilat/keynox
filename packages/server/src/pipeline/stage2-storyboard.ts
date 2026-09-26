import OpenAI from "openai";
import { config } from "../config";
import { geminiService } from "../services/geminiService";
import { Stage1Extraction, Stage2Strategy } from "./types/sixStageTypes";
import { parseTolerantJson } from "./utils/tolerantJson";

export interface Stage2StoryboardResult {
  storyboard: string;
  strategy: Stage2Strategy;
  usedModel?: string;
}

const TIER1_MODEL = config.nvidiaReasoningModel || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
const TIER2_MODEL = config.nvidiaModel || "nvidia/nemotron-3-super-120b-a12b";

/**
 * Stage 2: Strategist (Nemotron 30B / Fallbacks)
 * Receives Stage 1 extraction and plans slide-by-slide structure,
 * linking each slide to specific technical_payload items.
 */
export async function runStage2Storyboard(
  cleanTopic: string,
  stage1Output: Stage1Extraction | string,
  targetCount: number,
  onChunk: (delta: string, isReasoning: boolean) => void,
  engine: "gemini" | "nvidia" | "auto" = "auto",
  signal?: AbortSignal
): Promise<Stage2StoryboardResult> {
  let storyboardText = "";
  let usedModel = TIER1_MODEL;
  const maxTokens = 4500;

  const stage1JsonStr = typeof stage1Output === "string" ? stage1Output : JSON.stringify(stage1Output, null, 2);

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
    timeout: 15000,
  });

  const prompt = `You are a master presentation strategist.
You receive extracted analysis and plan slide-by-slide structure.

CRITICAL RULES:
- Return ONLY valid JSON. Zero explanation. Zero markdown.
- Purpose "hook", "closing", and "transition" slides are EXEMPT from payload references
- ALL other slides MUST reference at least one technical_payload item
- No slide can have generic content_summary words:
  "overview", "introduction", "key points", "summary" are banned
- Use actual terminology from the analysis
- Plan exactly ${targetCount} slides (index 1 to ${targetCount})

Analysis received:
${stage1JsonStr}

Return this exact schema:
{
  "slides": [
    {
      "index": 1,
      "purpose": "hook | concept | proof | data | demo | transition | closing",
      "title": "specific title using real terminology",
      "content_summary": "exactly what this slide proves or shows",
      "content_type": "text | math | chart | timeline | comparison | code | simulator | quote",
      "technical_payload_refs": [],
      "animation_energy": "calm | dynamic | explosive | subtle",
      "is_hero": boolean,
      "narrative_weight": "light | medium | heavy"
    }
  ],
  "visual_direction": "dark | light | gradient | minimal | bold",
  "color_hint": "specific color direction tied to domain and tone"
}

PAYLOAD REFERENCE RULE:
- purpose "hook": technical_payload_refs must be []
- purpose "closing": technical_payload_refs must be []
- purpose "transition": technical_payload_refs must be []
- ALL other purposes: at least one ref required
- Every ref must exist in Stage 1 output
- Invented content is a critical failure`;

  const systemInstruction = "You are a master presentation strategist. Return ONLY valid JSON. Zero explanation. Zero markdown.";

  // Tier 1: Gemini if explicitly requested
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
          storyboardText += delta;
          onChunk(delta, false);
        },
      });

      const parsed = parseTolerantJson<Stage2Strategy>(storyboardText);
      if (parsed.data?.slides && parsed.data.slides.length > 0) {
        return { storyboard: storyboardText, strategy: parsed.data, usedModel };
      }
    } catch (gErr: any) {
      if (signal?.aborted) throw gErr;
      console.warn(`[Stage2Storyboard] Gemini error: ${gErr?.message}. Falling back to NVIDIA...`);
      storyboardText = "";
    }
  }

  // Tier 1: Nemotron 30B (NVIDIA / Auto)
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
        storyboardText += delta;
        onChunk(delta, false);
      }
    }

    const parsed = parseTolerantJson<Stage2Strategy>(storyboardText);
    if (parsed.data?.slides && parsed.data.slides.length > 0) {
      return { storyboard: storyboardText, strategy: parsed.data, usedModel };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage2Storyboard] Tier 1 (${TIER1_MODEL}) failed: ${err?.message}. Falling back to Tier 2...`);
    storyboardText = "";
  }

  // Tier 2: Nemotron 120B Super
  try {
    signal?.throwIfAborted();
    usedModel = TIER2_MODEL;
    storyboardText = "";
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
        storyboardText += delta;
        onChunk(delta, false);
      }
    }

    const parsed = parseTolerantJson<Stage2Strategy>(storyboardText);
    if (parsed.data?.slides && parsed.data.slides.length > 0) {
      return { storyboard: storyboardText, strategy: parsed.data, usedModel };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage2Storyboard] Tier 2 (${TIER2_MODEL}) failed: ${err?.message}. Falling back to Tier 3 (Gemini)...`);
    storyboardText = "";
  }

  // Tier 3: Gemini 3.8 Flash Fallback
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
          storyboardText += delta;
          onChunk(delta, false);
        },
      });

      const parsed = parseTolerantJson<Stage2Strategy>(storyboardText);
      if (parsed.data?.slides && parsed.data.slides.length > 0) {
        return { storyboard: storyboardText, strategy: parsed.data, usedModel };
      }
    } catch (gErr: any) {
      if (signal?.aborted) throw gErr;
      console.warn(`[Stage2Storyboard] Tier 3 (Gemini) failed: ${gErr?.message}`);
    }
  }

  signal?.throwIfAborted();
  throw new Error("Stage 2 (Strategist) failed across all 3 tiers.");
}
