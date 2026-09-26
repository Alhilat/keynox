import OpenAI from "openai";
import { config } from "../config";
import { geminiService } from "../services/geminiService";
import { Stage2Strategy, Stage3ArtDirection } from "./types/sixStageTypes";
import { parseTolerantJson } from "./utils/tolerantJson";

export interface Stage3ArtDirectorResult {
  artDirection: Stage3ArtDirection;
  hadTruncation: boolean;
  rawText: string;
  usedModel?: string;
}

const TIER1_MODEL = config.nvidiaModel || "nvidia/nemotron-3-super-120b-a12b";
const TIER2_MODEL = "meta/llama-3.3-70b-instruct";

/**
 * Stage 3: Art Director (Nemotron 120B / Fallbacks)
 * Translates the pedagogical strategy from Stage 2 into a high-end visual brief,
 * global styling tokens, and exact GSAP animation sequences per slide.
 */
export async function runStage3ArtDirector(
  strategy: Stage2Strategy,
  onChunk: (delta: string, isReasoning: boolean) => void,
  engine: "gemini" | "nvidia" | "auto" = "auto",
  signal?: AbortSignal
): Promise<Stage3ArtDirectorResult> {
  let rawText = "";
  let usedModel = TIER1_MODEL;
  const maxTokens = 6500;

  const strategyJsonStr = JSON.stringify(strategy, null, 2);

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
    timeout: 20000,
  });

  const prompt = `You are a world-class creative director for cinematic presentations.
You think in visuals, motion, and emotion. You never write code.

CRITICAL RULES:
- Return ONLY valid JSON. Zero code. Zero markdown. Zero explanation.
- Token budget: 5,800 tokens. Complete ALL slides.
- Every color must be a valid hex code
- Animation sequences must be specific — no vague "animate in"
- CONTRAST IS LAW:
  Dark background (#000000–#444444) → text must be #E0E0E0 to #FFFFFF
  Light background (#BBBBBB–#FFFFFF) → text must be #0A0A0A to #222222
  Never use low-contrast combinations under any circumstance

Strategy received:
${strategyJsonStr}

Return this exact schema:
{
  "global": {
    "font_primary": "specific font name",
    "font_mono": "monospace font for code slides",
    "transition_style": "morph | slide | fade | zoom",
    "css_vars": {
      "--color-bg": "#hex",
      "--color-primary": "#hex",
      "--color-accent": "#hex",
      "--color-text": "#hex",
      "--color-muted": "#hex"
    }
  },
  "slides": [
    {
      "index": 1,
      "mood": "single word",
      "layout": "precise spatial description of every element",
      "visual_concept": "the one striking idea that makes this slide memorable",
      "local_overrides": {
        "--color-bg": "#hex or null",
        "--color-accent": "#hex or null"
      },
      "typography": {
        "title_weight": "100 | 400 | 700 | 900",
        "title_size": "clamp(2rem, 5vw, 5rem)",
        "title_transform": "uppercase | lowercase | none",
        "body_weight": "300 | 400"
      },
      "animation_sequence": [
        "0.0s — background renders opacity 0, fades to 1 over 400ms",
        "0.4s — title clips from left edge, duration 600ms ease-out",
        "0.8s — accent line draws left to right, 300ms linear",
        "1.1s — body lines rise 20px staggered 100ms, opacity 0→1"
      ],
      "special_element": "unique visual trick or null"
    }
  ]
}

CONTRAST CHECK: Before finalizing each slide's colors,
verify: is background dark or light? Set text accordingly.
A slide that is unreadable on a projector is a failed slide.

If truncated mid-array: complete slide objects beat detailed early ones.
Prioritize finishing all slides over perfecting the first few.`;

  const systemInstruction = "You are a world-class creative director for interactive keynote presentations. Return ONLY valid JSON. Zero code. Zero markdown.";

  // Tier 1: Gemini if explicitly selected
  if (engine === "gemini" && geminiService.isAvailable()) {
    try {
      signal?.throwIfAborted();
      usedModel = `google/${geminiService.getModel()}`;
      await geminiService.streamChat({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.25,
        maxTokens,
        signal,
        onReasoning: (delta) => onChunk(delta, true),
        onChunk: (delta) => {
          rawText += delta;
          onChunk(delta, false);
        },
      });

      const parsed = parseTolerantJson<Stage3ArtDirection>(rawText);
      if (parsed.data?.slides && parsed.data.slides.length > 0) {
        return {
          artDirection: parsed.data,
          hadTruncation: parsed.hadTruncation,
          rawText,
          usedModel,
        };
      }
    } catch (gErr: any) {
      if (signal?.aborted) throw gErr;
      console.warn(`[Stage3ArtDirector] Gemini error: ${gErr?.message}. Falling back to NVIDIA...`);
      rawText = "";
    }
  }

  // Tier 1: Nemotron 120B Super
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
      temperature: 0.25,
      stream: true,
    }, { signal });

    for await (const chunk of stream) {
      const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
      if (reasoning) onChunk(reasoning, true);
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        rawText += delta;
        onChunk(delta, false);
      }
    }

    const parsed = parseTolerantJson<Stage3ArtDirection>(rawText);
    if (parsed.data?.slides && parsed.data.slides.length > 0) {
      return {
        artDirection: parsed.data,
        hadTruncation: parsed.hadTruncation,
        rawText,
        usedModel,
      };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage3ArtDirector] Tier 1 (${TIER1_MODEL}) failed: ${err?.message}. Trying Tier 2 (${TIER2_MODEL})...`);
    rawText = "";
  }

  // Tier 2: Llama 70B Instruct Fallback
  try {
    signal?.throwIfAborted();
    usedModel = TIER2_MODEL;
    rawText = "";
    const stream = await openai.chat.completions.create({
      model: TIER2_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: true,
    }, { signal });

    for await (const chunk of stream) {
      const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
      if (reasoning) onChunk(reasoning, true);
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        rawText += delta;
        onChunk(delta, false);
      }
    }

    const parsed = parseTolerantJson<Stage3ArtDirection>(rawText);
    if (parsed.data?.slides && parsed.data.slides.length > 0) {
      return {
        artDirection: parsed.data,
        hadTruncation: parsed.hadTruncation,
        rawText,
        usedModel,
      };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage3ArtDirector] Tier 2 (${TIER2_MODEL}) failed: ${err?.message}. Trying Tier 3 (Gemini)...`);
    rawText = "";
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
        temperature: 0.25,
        maxTokens,
        signal,
        onReasoning: (delta) => onChunk(delta, true),
        onChunk: (delta) => {
          rawText += delta;
          onChunk(delta, false);
        },
      });

      const parsed = parseTolerantJson<Stage3ArtDirection>(rawText);
      if (parsed.data?.slides && parsed.data.slides.length > 0) {
        return {
          artDirection: parsed.data,
          hadTruncation: parsed.hadTruncation,
          rawText,
          usedModel,
        };
      }
    } catch (gErr: any) {
      if (signal?.aborted) throw gErr;
      console.warn(`[Stage3ArtDirector] Tier 3 (Gemini) failed: ${gErr?.message}`);
    }
  }

  signal?.throwIfAborted();
  throw new Error("Stage 3 (Art Director) failed across all 3 tiers.");
}
