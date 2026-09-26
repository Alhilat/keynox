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
5. Slide container sizing & scrolling — CRITICAL:
   width: 100%;
   height: 100%;
   position: absolute;
   inset: 0;
   overflow-y: auto;
   overflow-x: hidden;
   padding-bottom: 84px;
   NEVER use vw, vh, vmin, vmax units.
   Slides live inside an auto-scaled 1280x720 16:9 stage.
   100vw = browser window width, NOT stage width.
   Using vw/vh will blow elements 2-3x outside the stage boundary.
   Percentage units only. Always.
   Vertical scrolling is fully enabled so multi-step math derivations, diagrams, and content extending downwards can be freely scrolled and seen.
6. NO emojis anywhere
7. NO placeholder content, NO lorem ipsum
8. NO code comments in output code
9. NO markdown backticks in your output
10. KaTeX: Use <div class="slide-${index}-equation equation-display">$$ LATEX_EXPRESSION $$</div> for block equations, and <span class="slide-${index}-katex" data-expr="LATEX_EXPRESSION">$$ LATEX_EXPRESSION $$</span> for inline math. ALWAYS enclose LaTeX in $$ ... $$ delimiters so KaTeX renders immediately. Never output empty math spans.
11. Output: starts with <div class="slide slide-${index}">
    ends with </div> — nothing before, nothing after.
12. MATHEMATICAL STEP DERIVATIONS VS STANDARD SLIDE ANIMATION (CRITICAL):
    A. IF this slide contains a mathematical problem solution or formula derivation:
       - Structure each derivation step in its own container: <div class="slide-${index}-step math-step-card"> containing:
         * Step badge: <span class="step-badge">STEP 01: [ACTION/LAW]</span>
         * Formula: <div class="equation-display">$$ FORMULA $$</div>
         * Explanatory text: <p class="step-explanation">Reason for the transformation...</p>
       - ZERO SKIPPED STEPS: Present all intermediate algebraic, substitution, and factoring steps from the technical payload.
       - DELIBERATE GSAP PACING:
         window.initSlide_${index} = function(el) {
           const tl = gsap.timeline({ paused: true });
           tl.fromTo(el.querySelectorAll(".slide-${index}-title, .slide-${index}-subtitle"), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6 });
           const steps = el.querySelectorAll(".slide-${index}-step, .math-step-card, .math-result-box");
           steps.forEach((st, idx) => {
             // Mandatory >= 1.5s cognitive reading delay between consecutive math steps & auto-scroll into view!
             tl.fromTo(st, { opacity: 0, y: 16 }, { 
               opacity: 1, 
               y: 0, 
               duration: 0.85, 
               ease: "power2.out",
               onStart: () => { try { st.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e){} }
             }, idx === 0 ? "+=0.3" : "+=1.5");
           });
           return tl;
         };
    B. FOR ALL OTHER SLIDES (System Architecture, Tech Overviews, Comparisons, Keynotes):
       - Keep the snappy, energetic, immediate staggered animation:
         window.initSlide_${index} = function(el) {
           const tl = gsap.timeline({ paused: true });
           tl.from(el.querySelectorAll(".slide-${index}-title, .slide-${index}-content, h1, h2, p"), {
             opacity: 0,
             y: 20,
             stagger: 0.1,
             duration: 0.6,
             ease: "power2.out"
           });
           return tl;
         };
13. ZERO BLANK SLIDES GUARANTEE:
    - Every slide MUST contain substantive, visible layout: title group, container cards, formulas, and descriptive annotations.
    - Do NOT apply CSS opacity: 0 or display: none without ensuring GSAP fromTo reveals them.
    - Never render empty divs or containers without text.
14. MANDATORY MODERN TYPOGRAPHY & ZERO COURIER / TYPEWRITER FONTS (CRITICAL):
    - ABSOLUTELY NEVER use 'Courier', 'Courier New', or raw 'monospace' / 'serif' font-family anywhere!
    - On Linux, Courier resolves to an ancient, pixelated, jagged 1980s typewriter font that looks broken.
    - ALWAYS use CSS variables for all typography:
      * var(--font-mono) for all code blocks, terminals, syntax highlighting, commands, chips, and metrics.
      * var(--font-sans) for all body text, bullet points, and descriptions.
      * var(--font-display) for all slide titles, headlines, and card headers.

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
