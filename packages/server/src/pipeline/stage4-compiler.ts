import OpenAI from "openai";
import { config } from "../config";
import { geminiService } from "../services/geminiService";
import {
  Stage2SlideStrategy,
  Stage3SlideBrief,
  Stage4SlideResult,
  TechnicalPayloadItem,
} from "./types/sixStageTypes";

const TIER1_MODEL = config.nvidiaModel || "nvidia/nemotron-3-super-120b-a12b";
const TIER2_MODEL = "meta/llama-3.3-70b-instruct";

export interface CompileSlideOptions {
  index: number;
  slideBrief: Stage3SlideBrief;
  slideStrategy: Stage2SlideStrategy;
  payloadItems: TechnicalPayloadItem[];
  globalTheme: {
    font_primary: string;
    font_mono: string;
    transition_style: string;
    css_vars: Record<string, string>;
  };
  engine?: "gemini" | "nvidia" | "auto";
  signal?: AbortSignal;
}

/**
 * Stage 4: Compiler (Nemotron 120B / Fallbacks)
 * Compiles a single self-contained slide HTML div with strictly scoped CSS (.slide-N-*),
 * KaTeX expressions, percentage coordinates, and an activation GSAP timeline returning `tl`.
 */
export async function compileSingleSlide(
  options: CompileSlideOptions
): Promise<Stage4SlideResult> {
  const {
    index,
    slideBrief,
    slideStrategy,
    payloadItems,
    globalTheme,
    engine = "auto",
    signal,
  } = options;

  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
    timeout: 25000,
  });

  const payloadStr =
    payloadItems.length > 0
      ? payloadItems
          .map((item) => `[${item.id}] (${item.type} - ${item.label}):\n${item.content}`)
          .join("\n\n")
      : "No technical payload required for this slide (hook, closing, or transition).";

  const prompt = `You are a senior frontend engineer specializing in scoped cinematic HTML with GSAP animations.

ABSOLUTE RULES — violating any fails the audit:
1. ALL CSS classes prefixed with .slide-${index}-
2. ALL colors via CSS variables only — no hardcoded hex
3. GSAP wrapped in activation function that RETURNS the timeline:
   <script>
   window.initSlide_${index} = function(el) {
     const tl = gsap.timeline({ paused: true });
     // your animations scoped to el
     return tl; // REQUIRED: Engine uses this to replay and reset
   };
   </script>
4. ALL querySelector scoped to el parameter — never document.querySelector
5. Slide container sizing — CRITICAL:
   width: 100%;
   height: 100%;
   position: absolute;
   inset: 0;
   overflow: hidden;
   NEVER use vw, vh, vmin, vmax units.
   Slides live inside an auto-scaled 1280x720 16:9 stage.
   100vw = browser window width, NOT stage width.
   Using vw/vh will blow elements 2-3x outside the stage boundary.
   Percentage units only. Always.
6. NO emojis anywhere
7. NO placeholder content, NO lorem ipsum
8. NO code comments in output code
9. NO markdown backticks in your output
10. KaTeX: <span class="slide-${index}-katex" data-expr="LATEX"></span>
    KaTeX renders BEFORE initSlide is called — do not animate elements before they render.
11. Output: starts with <div class="slide slide-${index}">
    ends with </div> — nothing before, nothing after.

Global assets already loaded on page:
- GSAP 3.12 + ScrollTrigger
- KaTeX 0.16
- CSS variables from global theme:
${JSON.stringify(globalTheme.css_vars, null, 2)}

Art direction:
${JSON.stringify(slideBrief, null, 2)}

Slide content:
${JSON.stringify(slideStrategy, null, 2)}

Technical payload for this slide:
${payloadStr}

Payload content is verbatim source material. Use it exactly. Generic content = audit failure.
Return ONLY the raw HTML string starting with <div class="slide slide-${index}">. No markdown backticks.`;

  const systemInstruction =
    "You are an expert cinematic presentation UI compiler. Return ONLY raw HTML starting with <div and ending with </div>. Zero markdown backticks. Zero comments.";

  let rawHtml = "";

  // Helper to sanitize markdown wrapper if LLM returned ```html
  const cleanCode = (str: string): string => {
    let s = str.trim();
    if (s.startsWith("```html")) {
      s = s.replace(/^```html\s*/i, "").replace(/\s*```[\s\S]*$/, "");
    } else if (s.startsWith("```")) {
      s = s.replace(/^```\s*/, "").replace(/\s*```[\s\S]*$/, "");
    }
    return s.trim();
  };

  // Tier 1: Gemini if explicitly requested
  if (engine === "gemini" && geminiService.isAvailable()) {
    try {
      signal?.throwIfAborted();
      rawHtml = await geminiService.streamChat({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        maxTokens: 3500,
        signal,
      });

      const cleaned = cleanCode(rawHtml);
      if (cleaned.startsWith("<div") && cleaned.includes(`slide-${index}`)) {
        return { index, html: cleaned };
      }
    } catch (gErr: any) {
      if (signal?.aborted) throw gErr;
      console.warn(`[Stage4Compiler] Slide ${index} Gemini error: ${gErr?.message}. Falling back...`);
    }
  }

  // Tier 1: Nemotron 120B Super
  try {
    signal?.throwIfAborted();
    const response = await openai.chat.completions.create({
      model: TIER1_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      max_tokens: 3500,
      temperature: 0.2,
    }, { signal });

    rawHtml = response.choices?.[0]?.message?.content || "";
    const cleaned = cleanCode(rawHtml);
    if (cleaned.startsWith("<div") && cleaned.includes(`slide-${index}`)) {
      return { index, html: cleaned };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage4Compiler] Slide ${index} Tier 1 (${TIER1_MODEL}) failed: ${err?.message}. Trying Tier 2...`);
  }

  // Tier 2: Llama 70B Instruct Fallback
  try {
    signal?.throwIfAborted();
    const response = await openai.chat.completions.create({
      model: TIER2_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      max_tokens: 3500,
      temperature: 0.25,
    }, { signal });

    rawHtml = response.choices?.[0]?.message?.content || "";
    const cleaned = cleanCode(rawHtml);
    if (cleaned.startsWith("<div") && cleaned.includes(`slide-${index}`)) {
      return { index, html: cleaned };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn(`[Stage4Compiler] Slide ${index} Tier 2 (${TIER2_MODEL}) failed: ${err?.message}. Trying Tier 3...`);
  }

  // Tier 3: Gemini 3.8 Flash Fallback
  if (geminiService.isAvailable()) {
    try {
      signal?.throwIfAborted();
      rawHtml = await geminiService.streamChat({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        maxTokens: 3500,
        signal,
      });

      const cleaned = cleanCode(rawHtml);
      if (cleaned.startsWith("<div") && cleaned.includes(`slide-${index}`)) {
        return { index, html: cleaned };
      }
    } catch (gErr: any) {
      if (signal?.aborted) throw gErr;
      console.warn(`[Stage4Compiler] Slide ${index} Tier 3 (Gemini) failed: ${gErr?.message}`);
    }
  }

  signal?.throwIfAborted();
  throw new Error(`Stage 4 (Compiler) failed to compile slide ${index} across all tiers.`);
}
