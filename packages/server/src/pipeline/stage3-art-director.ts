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
const TIER2_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

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

  const cssVariableContract = `CSS VARIABLE CONTRACT — ABSOLUTE LAW:
You MUST use ONLY these exact CSS variable names in your JSON output.
Never invent new variable names. Never use --color-* naming.

The global design system provides exactly these tokens:

BACKGROUNDS:
  --bg-primary      → page background (pure black)
  --bg-stage        → presentation stage background  
  --bg-card         → card/panel background
  --bg-card-hover   → card hover state

BORDERS:
  --border-subtle   → default border color
  --border-active   → active/accent border color

TEXT:
  --text-main       → primary text (#f8fafc)
  --text-muted      → secondary text (#94a3b8)

ACCENTS (use these for highlights, glows, badges):
  --accent-blue     → #2563eb
  --accent-cyan     → #3b82f6  ← DEFAULT accent, use this most
  --accent-emerald  → #15803d
  --accent-amber    → #b45309
  --accent-rose     → #b91c1c
  --accent-indigo   → #475569
  --accent-purple   → #475569

TYPOGRAPHY (never write font names directly):
  --font-sans       → Inter, system-ui
  --font-display    → Plus Jakarta Sans
  --font-mono       → JetBrains Mono, Fira Code

Your css_vars output object MUST use only keys from this list.
Example of CORRECT output:
{
  "css_vars": {
    "--bg-stage": "#05060a",
    "--border-active": "#2563eb",
    "--accent-cyan": "#2563eb",
    "--text-main": "#f8fafc",
    "--text-muted": "#94a3b8"
  }
}

Example of FORBIDDEN output — NEVER do this:
{
  "css_vars": {
    "--color-bg": "#05060a",      ← FORBIDDEN
    "--color-text": "#f8fafc",    ← FORBIDDEN  
    "--color-accent": "#2563eb",  ← FORBIDDEN
    "--color-primary": "#3b82f6", ← FORBIDDEN
    "--color-muted": "#94a3b8"    ← FORBIDDEN
  }
}`;

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

${cssVariableContract}

MATHEMATICAL STEP ANIMATION & PACING RULES (CRITICAL):
For slides containing mathematical derivations, formulas, or problem-solving steps:
1. DELIBERATE, READABLE PACING:
   - Math derivation steps MUST NOT animate quickly or simultaneously!
   - Each mathematical step requires sufficient cognitive time for the audience to read and comprehend the algebraic transformation.
   - Space each derivation step with at least 1.4s to 2.0s between consecutive steps:
     e.g., [
       "0.0s — background renders and title reveals",
       "0.8s — Step 1: Initial formula renders with step badge (duration 600ms ease-out)",
       "2.4s — Step 2: Substitution & law application reveals with highlight (duration 800ms ease-out)",
       "4.2s — Step 3: Intermediate algebraic simplification appears (duration 800ms ease-out)",
       "6.0s — Step 4: Final evaluated solution glows emerald (duration 800ms ease-out)"
     ]
2. NEVER RUSH MATH: Staggering math steps at 100ms-200ms is FORBIDDEN. Give each step at least 1.4s of reading room.

Strategy received:
${strategyJsonStr}

Return this exact schema:
{
  "global": {
    "font_primary": "specific font name",
    "font_mono": "monospace font for code slides",
    "transition_style": "morph | slide | fade | zoom",
    "css_vars": {
      "--bg-stage": "#hex",
      "--border-active": "#hex",
      "--accent-cyan": "#hex",
      "--text-main": "#hex",
      "--text-muted": "#hex"
    }
  },
  "slides": [
    {
      "index": 1,
      "mood": "single word",
      "layout": "precise spatial description of every element",
      "visual_concept": "the one striking idea that makes this slide memorable",
      "local_overrides": {
        "--bg-stage": "#hex or null",
        "--border-active": "#hex or null",
        "--accent-cyan": "#hex or null"
      },
      "typography": {
        "title_weight": "100 | 400 | 700 | 900",
        "title_size": "clamp(2rem, 5%, 5rem)",
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

  const systemInstruction = `You are a world-class creative director for interactive keynote presentations. Return ONLY valid JSON. Zero code. Zero markdown.

${cssVariableContract}`;

  // Tier 1: Gemini if explicitly selected or auto
  if ((engine === "gemini" || engine === "auto") && geminiService.isAvailable()) {
    try {
      signal?.throwIfAborted();
      const models = geminiService.getPlanningModels();
      usedModel = `google/${models[0]}`;
      await geminiService.streamChat({
        models,
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

  // Tier 3: Gemini High-Quota Fallback
  if (geminiService.isAvailable()) {
    try {
      signal?.throwIfAborted();
      const models = geminiService.getPlanningModels();
      usedModel = `google/${models[0]}`;
      await geminiService.streamChat({
        models,
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
