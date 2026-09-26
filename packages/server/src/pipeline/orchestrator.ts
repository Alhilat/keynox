import { detectTargetSlideCount } from "../services/slideCountDetector";
import { presentationCache } from "./cache";
import { runStage1Analyzer } from "./stage1-analyzer";
import { runStage2Storyboard } from "./stage2-storyboard";
import { runStage3ArtDirector } from "./stage3-art-director";
import { compileSingleSlide } from "./stage4-compiler";
import { auditAndRepairSlide } from "./stage5-critic";
import { assembleHyperDeckPresentation } from "./html-assembler";
import { extractPresentationAst } from "./presentationAstExtractor";
import { MidPipelineCache } from "./cache/midPipelineCache";
import { detectDocumentDomain } from "./prompts/domainAdaptivePrompts";
import { Stage1Extraction, Stage2Strategy, Stage3ArtDirection, TechnicalPayloadItem } from "./types/sixStageTypes";

/** Stage-level cache: reuses Stage 1/2/3 artifacts across runs with 24-hour TTL */
const midPipelineCache = new MidPipelineCache();

export interface PipelineEvent {
  type:
    | "cache_hit"
    | "stage0_start"
    | "stage0_complete"
    | "stage1_start"
    | "stage1_chunk"
    | "stage1_complete"
    | "stage2_start"
    | "stage2_chunk"
    | "stage2_complete"
    | "stage3_start"
    | "stage3_reasoning"
    | "stage3_chunk"
    | "stage3_complete"
    | "slide_ready"
    | "photo_start"
    | "photo_done"
    | "warn"
    | "complete"
    | "error";
  message?: string;
  delta?: string;
  analysis?: string;
  storyboard?: string;
  outline?: string;
  html?: string;
  presentation?: any;
  topic?: string;
  model?: string;
  photoUrl?: string;
  slideIndex?: number;
  totalSlides?: number;
  slideHtml?: string;
  warning?: string;
  data?: any;
  status?: string;
}

export type PipelineEventHandler = (event: PipelineEvent) => void;

/**
 * Concurrency runner: processes tasks with a maximum concurrency limit
 */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await task(items[idx]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export class PipelineOrchestrator {
  /**
   * Executes the Production 7-Stage LLM Presentation Pipeline (Stage 0 to Stage 6)
   * Resolves all 18 traps with 3-tier fallbacks, TS sanitizer, and 2-worker pool.
   */
  public async execute(
    topic: string,
    onEvent: PipelineEventHandler,
    requestedSlideCount?: number,
    theme?: string,
    engine: "gemini" | "nvidia" | "auto" = "auto",
    signal?: AbortSignal,
    pdfPagesBase64?: string[]
  ): Promise<{ outline: string; html: string }> {
    const { count: initialTargetCount, isExplicit, reason } = detectTargetSlideCount(topic, requestedSlideCount);
    let targetCount = initialTargetCount;

    // 0. Detect and lock document domain upfront
    const domain = detectDocumentDomain(topic);
    console.log(`[PipelineOrchestrator] Document domain locked: "${domain}" (${targetCount} slides: ${reason})`);

    // 1. Instant Cache Check (24h TTL keyed by topic, count, theme, engine)
    const cached = presentationCache.get(topic, requestedSlideCount, theme, engine);
    if (cached) {
      onEvent({
        type: "cache_hit",
        message: "Loaded instant cached presentation",
        topic: cached.topic,
      });
      onEvent({
        type: "stage1_complete",
        analysis: cached.analysis,
        outline: cached.outline || cached.analysis,
      });
      if (cached.storyboard) {
        onEvent({
          type: "stage2_complete",
          storyboard: cached.storyboard,
        });
      }
      onEvent({
        type: "complete",
        message: "Keynox presentation ready (cached)",
        html: cached.html,
        presentation: cached.presentation,
        outline: cached.outline || cached.storyboard || cached.analysis,
        topic: cached.topic,
        model: `${cached.model} (Cached)`,
      });
      return { outline: cached.outline || cached.storyboard || "", html: cached.html };
    }

    // 2. STAGE 0: Multimodal PDF & Document Pre-Processor (if PDF provided)
    let processedInput = topic;
    if (pdfPagesBase64 && pdfPagesBase64.length > 0) {
      onEvent({
        type: "stage0_start",
        message: `[Stage 0: Multimodal Vision] Transcribing ${pdfPagesBase64.length} PDF pages with Gemini Vision...`,
        topic,
      });
      try {
        const { geminiService } = await import("../services/geminiService");
        const docResult = await geminiService.extractDocumentVision(pdfPagesBase64, "Document");
        processedInput = docResult.markdownContent;
        onEvent({
          type: "stage0_complete",
          message: `[Stage 0: Multimodal Vision] Extracted ${docResult.tables.length} tables, ${docResult.formulas.length} formulas, and ${docResult.diagrams.length} diagrams.`,
        });
      } catch (err: any) {
        console.warn("[PipelineOrchestrator] Stage 0 fallback to raw text:", err?.message);
      }
    }

    // 3. STAGE 1: Extractor (Nemotron 30B / Fallbacks)
    let stage1Data: Stage1Extraction | undefined;
    let cleanTopic = topic.slice(0, 100);
    let stage1AnalysisText = "";

    const cachedStage1 = await midPipelineCache.getStage1(processedInput);
    if (cachedStage1) {
      stage1AnalysisText = cachedStage1.analysis;
      cleanTopic = cachedStage1.cleanTopic;
      onEvent({
        type: "stage1_start",
        message: "[Stage 1: Extractor] Restored cached knowledge extraction...",
        topic,
      });
    } else {
      onEvent({
        type: "stage1_start",
        message: `[Stage 1: Extractor] Extracting thesis, audience, and technical payload items...`,
        topic,
      });

      const s1Result = await runStage1Analyzer(
        processedInput,
        targetCount,
        (delta) => onEvent({ type: "stage1_chunk", delta }),
        engine,
        signal,
        domain
      );

      stage1Data = s1Result.data;
      cleanTopic = s1Result.cleanTopic;
      stage1AnalysisText = s1Result.analysis;

      if (!isExplicit && stage1Data?.slide_count && stage1Data.slide_count >= 8 && stage1Data.slide_count <= 14) {
        targetCount = stage1Data.slide_count;
        console.log(`[PipelineOrchestrator] Adapted slide count to ${targetCount} based on Stage 1 extraction`);
      }

      await midPipelineCache.setStage1(processedInput, { analysis: stage1AnalysisText, cleanTopic });
    }

    signal?.throwIfAborted();
    onEvent({
      type: "stage1_complete",
      message: `[Stage 1: Extractor] Extraction complete for "${cleanTopic}".`,
      analysis: stage1AnalysisText,
      outline: stage1AnalysisText,
      topic: cleanTopic,
      data: stage1Data,
    });

    // 4. STAGE 2: Strategist (Nemotron 30B / Fallbacks)
    let stage2Strategy: Stage2Strategy;
    let storyboardText = "";

    const cachedStage2 = await midPipelineCache.getStage2(processedInput, targetCount);
    if (cachedStage2 && (cachedStage2 as any).strategy) {
      stage2Strategy = (cachedStage2 as any).strategy;
      storyboardText = cachedStage2.storyboard;
      onEvent({
        type: "stage2_start",
        message: "[Stage 2: Strategist] Restored cached slide strategy...",
        topic: cleanTopic,
      });
    } else {
      onEvent({
        type: "stage2_start",
        message: `[Stage 2: Strategist] Structuring ${targetCount} slides and linking technical payloads...`,
        topic: cleanTopic,
      });

      const s2Result = await runStage2Storyboard(
        cleanTopic,
        stage1Data || stage1AnalysisText,
        targetCount,
        (delta) => onEvent({ type: "stage2_chunk", delta }),
        engine,
        signal
      );

      stage2Strategy = s2Result.strategy;
      storyboardText = s2Result.storyboard;
      await midPipelineCache.setStage2(processedInput, targetCount, {
        storyboard: storyboardText,
        strategy: stage2Strategy as any,
      });
    }

    signal?.throwIfAborted();
    onEvent({
      type: "stage2_complete",
      message: `[Stage 2: Strategist] Planned ${stage2Strategy.slides.length} slides with zero buzzwords.`,
      storyboard: storyboardText,
      outline: storyboardText,
    });

    // 5. STAGE 3: Art Director (Nemotron 120B / Fallbacks)
    onEvent({
      type: "stage3_start",
      message: `[Stage 3: Art Director] Conceiving global theme, typography, and GSAP motion sequences...`,
      topic: cleanTopic,
    });

    const s3Result = await runStage3ArtDirector(
      stage2Strategy,
      (delta) => onEvent({ type: "stage3_chunk", delta }),
      engine,
      signal
    );

    const artDirection: Stage3ArtDirection = s3Result.artDirection;
    onEvent({
      type: "stage3_complete",
      message: `[Stage 3: Art Director] Generated visual direction and animation briefs.`,
    });

    signal?.throwIfAborted();

    // 6. STAGES 4 + 5: Slide Compilation & Gemini Critic (Worker Pool: Concurrency = 2)
    const slidesToCompile = stage2Strategy.slides;
    const technicalPayloadItems: TechnicalPayloadItem[] = stage1Data?.technical_payload || [];
    const payloadMap = new Map<string, TechnicalPayloadItem>();
    for (const item of technicalPayloadItems) {
      payloadMap.set(item.id, item);
    }

    console.log(`[PipelineOrchestrator] Starting Worker Pool (concurrency=2) for ${slidesToCompile.length} slides...`);

    const compiledSlideResults = await runWithConcurrency(
      slidesToCompile,
      2,
      async (slideStrategy) => {
        signal?.throwIfAborted();
        const index = slideStrategy.index;

        // Match brief from Stage 3
        const slideBrief =
          artDirection.slides.find((s) => s.index === index) ||
          artDirection.slides[index - 1] || {
            index,
            mood: "focused",
            layout: "split-screen with primary metric card",
            visual_concept: "high-contrast focal topology",
            typography: {
              title_weight: "700",
              title_size: "clamp(2rem, 5vw, 4rem)",
              title_transform: "none",
              body_weight: "400",
            },
            animation_sequence: ["0.0s — background fades in", "0.4s — title reveals"],
          };

        // Gather relevant payload items
        const relevantPayloads: TechnicalPayloadItem[] = [];
        for (const ref of slideStrategy.technical_payload_refs || []) {
          const item = payloadMap.get(ref);
          if (item) relevantPayloads.push(item);
        }

        // Stage 4: Compile single slide with exponential backoff on 429
        let stage4Result: { index: number; html: string } | null = null;
        const delays = [0, 2000, 6000];

        for (let attempt = 0; attempt < delays.length; attempt++) {
          if (delays[attempt] > 0) {
            await new Promise((r) => setTimeout(r, delays[attempt]));
          }
          try {
            stage4Result = await compileSingleSlide({
              index,
              slideBrief,
              slideStrategy,
              payloadItems: relevantPayloads,
              globalTheme: artDirection.global,
              engine,
              signal,
            });
            break;
          } catch (err: any) {
            if (signal?.aborted) throw err;
            console.warn(`[PipelineOrchestrator] Slide ${index} compile attempt ${attempt + 1} failed: ${err?.message}`);
          }
        }

        if (!stage4Result) {
          // Fallback minimal slide if all retries failed
          stage4Result = {
            index,
            html: `<div class="slide slide-${index}" style="position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; background: var(--color-bg, #0B0F19); color: var(--color-text, #F8FAFC); padding: 5%;">
              <h2 class="slide-${index}-title" style="font-size: 2.5rem; margin-bottom: 1rem;">${slideStrategy.title}</h2>
              <p class="slide-${index}-desc" style="font-size: 1.25rem; max-width: 800px; text-align: center;">${slideStrategy.content_summary}</p>
            </div>`,
          };
        }

        // Stage 5: Critic Audit & In-Place Repair
        const auditResult = await auditAndRepairSlide(index, slideBrief, stage4Result.html, signal);

        // Immediate progressive SSE streaming
        onEvent({
          type: "slide_ready",
          slideIndex: index - 1,
          totalSlides: slidesToCompile.length,
          slideHtml: auditResult.html,
          status: auditResult.status,
        });

        return auditResult.html;
      }
    );

    // 7. Assemble Full Presentation HTML
    const allSlidesHtml = compiledSlideResults.join("\n\n");
    const activeModel = s3Result.usedModel || "nvidia/nemotron-3-super-120b-a12b";

    const finalHtml = assembleHyperDeckPresentation({
      topic: cleanTopic,
      slidesHtml: allSlidesHtml,
      slides: compiledSlideResults,
      outline: storyboardText,
      targetCount: slidesToCompile.length,
      theme,
    });

    // 8. Convert HTML into Presentation AST for Keynote Player & Studio
    let presentationAst: any = null;
    try {
      presentationAst = extractPresentationAst(cleanTopic, finalHtml, activeModel);
    } catch (astErr: any) {
      console.warn("[PipelineOrchestrator] AST extraction warning:", astErr?.message);
    }

    // 9. Cache Gate: only cache if Stage 3 had zero truncation warnings
    if (!s3Result.hadTruncation) {
      presentationCache.set(
        topic,
        {
          topic: cleanTopic,
          analysis: stage1AnalysisText,
          storyboard: storyboardText,
          outline: storyboardText,
          html: finalHtml,
          presentation: presentationAst,
          model: activeModel,
        },
        requestedSlideCount,
        theme,
        engine
      );
      console.log(`[PipelineOrchestrator] Cached clean presentation run (24h TTL) for "${cleanTopic}"`);
    } else {
      console.warn(`[PipelineOrchestrator] Stage 3 experienced truncation repair. Bypassing cache.`);
    }

    onEvent({
      type: "complete",
      message: "Keynox presentation synthesized successfully with 7-stage bulletproof pipeline!",
      html: finalHtml,
      presentation: presentationAst,
      outline: storyboardText,
      topic: cleanTopic,
      model: activeModel,
    });

    return { outline: storyboardText, html: finalHtml };
  }
}

export const pipelineOrchestrator = new PipelineOrchestrator();
