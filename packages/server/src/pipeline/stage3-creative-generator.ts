import OpenAI from "openai";
import { config } from "../config";
import { geminiService } from "../services/geminiService";
import { ModelRouter } from "./modelRouter";
import { extractArchetypeFromSection } from "./prompts/archetypePrompts";
import { detectDocumentDomain } from "./prompts/domainAdaptivePrompts";
import {
  parseStoryboardIntoSlides,
  buildSingleSlidePrompt,
  isValidSlideHtml,
  sanitizeAiTone,
  synthesizeFallbackSlide,
  DESIGN_SYSTEM_VOCABULARY,
} from "./generator";
import { rlSlideOptimizer } from "./rl";

// Re-export for backward compatibility
export {
  parseStoryboardIntoSlides,
  buildSingleSlidePrompt,
  isValidSlideHtml,
  sanitizeAiTone,
  synthesizeFallbackSlide,
  DESIGN_SYSTEM_VOCABULARY,
};

/** Single source of Stage 3 model IDs; tiers come from STAGE3_* env config. */
const modelRouter = new ModelRouter();

export interface Stage3Callbacks {
  onReasoning: (delta: string) => void;
  onChunk: (delta: string) => void;
  onModelSwitch?: (model: string) => void;
  onSlideReady?: (index: number, total: number, slideHtml: string) => void;
}

/**
 * Model 3: Creative Presentation Generator (Zero AI Slop, Zero Templates)
 * 
 * Synthesizes the dynamic interactive presentation using a high-throughput,
 * concurrent slide synthesis pipeline.
 */
export async function runStage3CreativeGenerator(
  cleanTopic: string,
  storyboardText: string,
  analysisText: string,
  targetCount: number,
  callbacks: Stage3Callbacks,
  engine: "gemini" | "nvidia" | "auto" = "auto",
  signal?: AbortSignal,
  domainParam?: import("./prompts/domainAdaptivePrompts").DocumentDomain
): Promise<{ rawSlides: string; activeModel: string }> {
  const apiKey = config.nvidiaApiKeyUltra || config.nvidiaApiKey;
  const openai = new OpenAI({
    apiKey,
    baseURL: config.nvidiaBaseUrl,
  });

  const slideSections = parseStoryboardIntoSlides(storyboardText, targetCount, analysisText);
  const effectiveCount = Math.max(slideSections.length, targetCount);
  const domain = domainParam || detectDocumentDomain(`${cleanTopic}\n${analysisText}`);
  console.log(`[Stage3CreativeGenerator] Domain lock: "${domain}" for topic "${cleanTopic}"`);
  const isPureGemini = engine === "gemini" && geminiService.isAvailable();
  let activeModel = isPureGemini
    ? `google/${geminiService.getModel()}`
    : engine === "auto"
    ? `${modelRouter.complexModelId} + Gemini Critic`
    : modelRouter.complexModelId;

  console.log(`[Stage3CreativeGenerator] Concurrently synthesizing ${effectiveCount} slides with ${activeModel}...`);
  callbacks.onChunk(`\n[Model 3: ${activeModel}] Initiating concurrent synthesis across ${effectiveCount} slide sections...\n`);

  // Helper to generate a single slide with watchdog and fallback
  const synthesizeSlideSection = async (i: number): Promise<string> => {
    const slideDirective = slideSections[i] || `Slide ${i + 1} of ${effectiveCount}: Technical details and synthesis.`;
    const archetypeId = extractArchetypeFromSection(slideDirective);
    
    // Pass preceding archetype IDs to enforce visual diversity per slide.
    // Read from the planned storyboard slideSections so diversity is 100% known
    // even when slides are synthesized concurrently in parallel workers.
    const plannedPrecedingArchetypes = slideSections
      .slice(0, i)
      .map((sec) => extractArchetypeFromSection(sec))
      .filter(Boolean);

    const completedPrecedingArchetypes = generatedSlides
      .slice(0, i)
      .filter(Boolean)
      .map((html) => extractArchetypeFromSection(html))
      .filter(Boolean);

    const precedingArchetypes = Array.from(new Set([...plannedPrecedingArchetypes, ...completedPrecedingArchetypes]));
    const prompt = buildSingleSlidePrompt(cleanTopic, i, effectiveCount, slideDirective, analysisText, precedingArchetypes, domain);

    // Route per-slide model by archetype complexity (simulators/topologies → Super, else Nano).
    const primaryModel = modelRouter.routeStage3(archetypeId);
    const fallbackModel =
      primaryModel === modelRouter.complexModelId
        ? modelRouter.simpleModelId
        : modelRouter.complexModelId;

    const callModel = async (model: string): Promise<string> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      const onParentAbort = () => controller.abort();
      signal?.addEventListener("abort", onParentAbort, { once: true });
      let contentAcc = "";

      try {
        signal?.throwIfAborted();
        const stream: any = await openai.chat.completions.create(
          {
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are an elite Keynote Presentation Visual Designer. You output ONLY the valid HTML <section class='slide'> block. Keep internal reasoning to under 80 tokens. Begin outputting HTML immediately.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.55,
            top_p: 0.9,
            max_tokens: 5500,
            stream: true,
          } as any,
          { signal: controller.signal }
        );

        for await (const chunk of stream) {
          const reasoning = (chunk.choices?.[0]?.delta as any)?.reasoning_content || "";
          if (reasoning) {
            callbacks.onReasoning(reasoning);
          }
          const delta = chunk.choices?.[0]?.delta?.content || "";
          if (delta) {
            contentAcc += delta;
          }
        }
        return contentAcc;
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onParentAbort);
      }
    };

    let slideHtml = "";
    let attemptSuccess = false;

    // Attempt 0: Pure Gemini (if explicitly selected by user)
    if (isPureGemini) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 35000);
        const onParentAbort = () => controller.abort();
        signal?.addEventListener("abort", onParentAbort, { once: true });
        let contentAcc = "";
        try {
          contentAcc = await geminiService.streamChat({
            messages: [
              {
                role: "system",
                content:
                  "You are an elite Keynote Presentation Visual Designer. You output ONLY the valid HTML <section class='slide'> block. Keep internal reasoning to under 80 tokens. Begin outputting HTML immediately.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.55,
            maxTokens: 5500,
            signal: controller.signal,
            onReasoning: (reasoning) => callbacks.onReasoning(reasoning),
            onChunk: (delta) => {
              contentAcc += delta;
            },
          });
        } finally {
          clearTimeout(timer);
          signal?.removeEventListener("abort", onParentAbort);
        }

        if (isValidSlideHtml(contentAcc)) {
          slideHtml = contentAcc;
          attemptSuccess = true;
        }
      } catch (geminiErr: any) {
        if (signal?.aborted) throw geminiErr;
        console.warn(`[Stage3CreativeGenerator] Slide ${i + 1} Gemini error (${geminiErr?.message}). Retrying with Nemotron...`);
      }
    }

    // Attempt 1: Routed primary model (Super for complex, Nano for simple slides)
    if (!attemptSuccess) {
      try {
        signal?.throwIfAborted();
        slideHtml = await callModel(primaryModel);
        if (isValidSlideHtml(slideHtml)) {
          attemptSuccess = true;
          if (!isPureGemini) activeModel = engine === "auto" ? `${primaryModel} + Gemini Critic` : primaryModel;
        }
      } catch (err: any) {
        if (signal?.aborted) throw err;
        console.warn(`[Stage3CreativeGenerator] Slide ${i + 1} primary model error (${err?.message}). Retrying with fallback tier...`);
      }
    }

    // Attempt 2: Routed fallback tier
    if (!attemptSuccess) {
      try {
        signal?.throwIfAborted();
        slideHtml = await callModel(fallbackModel);
        if (isValidSlideHtml(slideHtml)) {
          attemptSuccess = true;
        }
      } catch (err: any) {
        if (signal?.aborted) throw err;
        console.warn(`[Stage3CreativeGenerator] Slide ${i + 1} fallback error:`, err?.message);
      }
    }

    // Attempt 3: Gemini Fallback (if both NVIDIA models failed and Gemini is available)
    if (!attemptSuccess && geminiService.isAvailable()) {
      try {
        signal?.throwIfAborted();
        const contentAcc = await geminiService.streamChat({
          messages: [
            {
              role: "system",
              content:
                "You are an elite Keynote Presentation Visual Designer. You output ONLY the valid HTML <section class='slide'> block. Keep internal reasoning to under 80 tokens. Begin outputting HTML immediately.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.35,
          maxTokens: 4000,
          signal,
          onReasoning: (reasoning) => callbacks.onReasoning(reasoning),
          onChunk: () => {},
        });
        if (isValidSlideHtml(contentAcc)) {
          slideHtml = contentAcc;
          attemptSuccess = true;
        }
      } catch (gErr: any) {
        if (signal?.aborted) throw gErr;
        console.warn(`[Stage3CreativeGenerator] Slide ${i + 1} Gemini fallback error:`, gErr?.message);
      }
    }

    signal?.throwIfAborted();
    // Attempt 4: Preserve only source-derived text when every model attempt fails.
    if (!attemptSuccess || !isValidSlideHtml(slideHtml)) {
      console.log(`[Stage3CreativeGenerator] Using source-derived fallback for slide ${i + 1} (archetype: ${archetypeId}, domain: ${domain})`);
      slideHtml = synthesizeFallbackSlide(cleanTopic, i, effectiveCount, slideDirective, analysisText, archetypeId, domain);
    }

    // Clean up slide tags, eliminate CoT monologue, and ensure proper </section> closing
    let cleanSlide = slideHtml.trim();
    cleanSlide = cleanSlide.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();

    const isActive = i === 0;
    const expectedOpen = `<section class="slide${isActive ? " active" : ""}" id="slide${i}">`;

    // 1. Locate opening <section> or first opening tag
    const openSecIdx = cleanSlide.indexOf("<section");
    if (openSecIdx >= 0) {
      cleanSlide = cleanSlide.slice(openSecIdx);
    }
    // Strip opening section tag to inspect body
    cleanSlide = cleanSlide.replace(/^<section\b[^>]*>/i, "").trim();

    // 2. Strip any preamble before the first opening <div
    const firstDivIdx = cleanSlide.indexOf("<div");
    if (firstDivIdx > 0) {
      const preamble = cleanSlide.slice(0, firstDivIdx);
      if (!preamble.includes("<h") && !preamble.includes("<p")) {
        cleanSlide = cleanSlide.slice(firstDivIdx).trim();
      }
    }

    // 3. Remove raw CoT monologue paragraphs/lines that leak into the slide
    cleanSlide = cleanSlide.replace(/(?:^|\n)\s*(?:From the storyboard|Looking at the narrative|We are to extract|Let's break down|We can form|Note that:|In this slide)[^\n<]+(?:\n|$)/gi, "\n");

    cleanSlide = `${expectedOpen}\n${cleanSlide}`;

    // 4. Ensure proper </section> closing
    if (!cleanSlide.endsWith("</section>")) {
      const lastClose = cleanSlide.lastIndexOf("</section>");
      if (lastClose > 0) {
        cleanSlide = cleanSlide.slice(0, lastClose + 10);
      } else {
        cleanSlide = cleanSlide.replace(/<[a-z0-9_-]+(?:\s+[^>]*)?$/i, "");
        const openDivs = (cleanSlide.match(/<div\b/gi) || []).length;
        const closeDivs = (cleanSlide.match(/<\/div>/gi) || []).length;
        for (let d = 0; d < openDivs - closeDivs; d++) {
          cleanSlide += "</div>";
        }
        cleanSlide += "\n</section>";
      }
    }

    // 5. Sanitize AI tone: strip pseudo-math, buzzwords, and inline rainbow overrides
    cleanSlide = sanitizeAiTone(cleanSlide);

    // 6. Reinforcement Learning from AI Feedback (RLAIF) Slide Optimizer
    // Evaluates multi-objective reward vector (fidelity, archetype, syntax, anti-slop, diversity)
    // and executes policy refinement if initial reward < 0.82.
    if (!isPureGemini && (engine === "auto" || config.geminiCriticEnabled)) {
      try {
        const rlResult = await rlSlideOptimizer.optimizeSlide({
          candidateHtml: cleanSlide,
          topic: cleanTopic,
          slideIndex: i,
          totalSlides: effectiveCount,
          archetypeId,
          analysisSnippet: analysisText,
          precedingArchetypes,
          domain,
          actorModel: primaryModel,
          signal,
          onRewardProgress: (reward) => {
            callbacks.onReasoning(
              `\n[RL Reward Model] Slide ${i + 1} score: ${reward.totalReward} ` +
              `(Fidelity: ${reward.fidelityScore}, Archetype: ${reward.archetypeScore}, Syntax: ${reward.syntaxScore}, Anti-Slop: ${reward.antiSlopScore})\n`
            );
          },
        });

        if (rlResult.optimalSlideHtml) {
          cleanSlide = rlResult.optimalSlideHtml;
          if (!cleanSlide.startsWith("<section")) {
            cleanSlide = `${expectedOpen}\n${cleanSlide}`;
          }
          cleanSlide = sanitizeAiTone(cleanSlide);
        }
      } catch (rlErr: any) {
        console.warn(`[Stage3CreativeGenerator] RL optimization pass skipped for slide ${i + 1}:`, rlErr?.message);
      }
    }

    callbacks.onChunk(`\n/* Slide ${i + 1}/${effectiveCount} ready */\n${cleanSlide}\n`);
    callbacks.onSlideReady?.(i, effectiveCount, cleanSlide);
    console.log(`[Stage3CreativeGenerator] Slide ${i + 1}/${effectiveCount} ready (${cleanSlide.length} chars).`);
    return cleanSlide;
  };

  // Run slide syntheses with pooled concurrency (up to 6 parallel workers) for resilience up to 20+ slides
  const generatedSlides: string[] = new Array(effectiveCount);
  const queue = Array.from({ length: effectiveCount }, (_, idx) => idx);
  const CONCURRENCY_LIMIT = 6;

  const worker = async () => {
    while (queue.length > 0) {
      signal?.throwIfAborted();
      const idx = queue.shift();
      if (idx !== undefined) {
        generatedSlides[idx] = await synthesizeSlideSection(idx);
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(CONCURRENCY_LIMIT, effectiveCount) },
    () => worker()
  );
  await Promise.all(workers);

  signal?.throwIfAborted();
  const combinedSlides = generatedSlides.join("\n\n");
  return { rawSlides: combinedSlides, activeModel };
}
