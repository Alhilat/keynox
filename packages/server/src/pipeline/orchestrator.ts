import { detectTargetSlideCount } from "../services/slideCountDetector";
import { presentationCache } from "./cache";
import { runStage1Analyzer } from "./stage1-analyzer";
import { runStage2Storyboard } from "./stage2-storyboard";
import { runStage3CreativeGenerator } from "./stage3-creative-generator";
import { assembleHyperDeckPresentation } from "./html-assembler";
import { convertHtmlToPresentationAst } from "./html-to-ast";

export interface PipelineEvent {
  type:
    | "cache_hit"
    | "stage1_start"
    | "stage1_chunk"
    | "stage1_complete"
    | "stage2_start"
    | "stage2_chunk"
    | "stage2_complete"
    | "stage3_start"
    | "stage3_reasoning"
    | "stage3_chunk"
    | "photo_start"
    | "photo_done"
    | "complete"
    | "error";
  message?: string;
  delta?: string;
  analysis?: string;
  storyboard?: string;
  outline?: string; // backwards compatibility
  html?: string;
  presentation?: any;
  topic?: string;
  model?: string;
  photoUrl?: string;
}

export type PipelineEventHandler = (event: PipelineEvent) => void;

export class PipelineOrchestrator {
  /**
   * Executes the 3-Stage LLM Presentation Pipeline:
   * 1. Model 1: Deep Document & Information Analyzer
   * 2. Model 2: Slide Storyboard & Visual/Photo Director
   * 3. Model 3: Creative Presentation Generator (Zero Templates / Zero Slop)
   */
  public async execute(
    topic: string,
    onEvent: PipelineEventHandler,
    requestedSlideCount?: number,
    theme?: string
  ): Promise<{ outline: string; html: string }> {
    const { count: targetCount, isExplicit, reason } = detectTargetSlideCount(topic, requestedSlideCount);

    // 1. Check in-memory cache for instant <10ms response
    const cached = presentationCache.get(topic, requestedSlideCount);
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
        message: "HyperDeck presentation ready (cached)",
        html: cached.html,
        presentation: cached.presentation,
        outline: cached.outline || cached.storyboard || cached.analysis,
        topic: cached.topic,
        model: `${cached.model} (Cached)`,
      });
      return { outline: cached.outline || cached.storyboard || "", html: cached.html };
    }

    // 2. STAGE 1: Model 1 - Deep Document Analyzer & Knowledge Extractor
    onEvent({
      type: "stage1_start",
      message: `[Model 1: Analyzer] Reading document, extracting deep technical concepts & metrics (${targetCount} slides: ${reason})...`,
      topic,
    });

    const { analysis: analysisText, cleanTopic } = await runStage1Analyzer(
      topic,
      targetCount,
      (delta) => {
        onEvent({ type: "stage1_chunk", delta });
      }
    );

    onEvent({
      type: "stage1_complete",
      message: `[Model 1: Analyzer] Knowledge extraction complete for "${cleanTopic}".`,
      analysis: analysisText,
      outline: analysisText,
      topic: cleanTopic,
    });

    // 3. STAGE 2: Model 2 - Slide Storyboard & Visuals/Photos Director
    onEvent({
      type: "stage2_start",
      message: `[Model 2: Storyboard] Writing slide narrative & specifying required AI photos & visual assets...`,
      topic: cleanTopic,
    });

    const { storyboard: storyboardText } = await runStage2Storyboard(
      cleanTopic,
      analysisText,
      targetCount,
      (delta) => {
        onEvent({ type: "stage2_chunk", delta });
      }
    );

    onEvent({
      type: "stage2_complete",
      message: `[Model 2: Storyboard] Slide texts & visual/photo blueprint ready.`,
      storyboard: storyboardText,
      outline: storyboardText,
      topic: cleanTopic,
    });

    // 4. STAGE 3: Model 3 - Creative Presentation Generator (Zero Templates, Pure Creativity)
    onEvent({
      type: "stage3_start",
      message: `[Model 3: Creative Engine] Synthesizing ${targetCount}-slide bespoke presentation with zero templates...`,
      topic: cleanTopic,
    });

    let currentModel = "nvidia/nemotron-3-super-120b-a12b";
    const { rawSlides, activeModel } = await runStage3CreativeGenerator(
      cleanTopic,
      storyboardText,
      analysisText,
      targetCount,
      {
        onReasoning: (delta) => onEvent({ type: "stage3_reasoning", delta }),
        onChunk: (delta) => onEvent({ type: "stage3_chunk", delta }),
        onModelSwitch: (model) => {
          currentModel = model;
          onEvent({
            type: "stage3_start",
            message: `[Model 3: Creative Engine] Synthesizing slides with ${model.replace("nvidia/", "")}...`,
            topic: cleanTopic,
          });
        },
      }
    );
    currentModel = activeModel;
    let slidesContent = rawSlides;

    // 4.5 Synthesize Real Photos from Model 2's Prompts via NVIDIA NIM FLUX (Concurrent Generation)
    const photoRegex = /<img([^>]*data-photo-prompt=["']([^"']+)["'][^>]*)>/gi;
    const photoMatches = Array.from(slidesContent.matchAll(photoRegex)).slice(0, 4);

    if (photoMatches.length > 0) {
      const { generatePhotoWithNvidia, createFallbackPhotoSvg } = await import("../services/imageService");

      onEvent({
        type: "photo_start",
        message: `Rendering ${photoMatches.length} photorealistic visual assets concurrently via NVIDIA FLUX...`,
        delta: `\n🎨 [NVIDIA FLUX] Rendering ${photoMatches.length} slide visuals in parallel...\n`,
      });

      const photoPromises = photoMatches.map(async (match, i) => {
        const fullImgTag = match[0];
        const designerPrompt = match[2]?.trim();
        if (!designerPrompt) return { fullImgTag, newImgTag: fullImgTag };

        try {
          const photoResult = await generatePhotoWithNvidia({
            prompt: designerPrompt,
            width: 1024,
            height: 576,
            steps: 2,
            timeoutMs: 8000,
          });

          onEvent({
            type: "photo_done",
            message: `Photo ${i + 1} rendered (${photoResult.latencyMs}ms)`,
            photoUrl: photoResult.imageUrl,
            delta: `✅ [NVIDIA FLUX] Photo ${i + 1} rendered (${photoResult.latencyMs}ms)\n`,
          });

          let newImgTag = fullImgTag;
          if (newImgTag.includes("src=")) {
            newImgTag = newImgTag.replace(/src=["'][^"']*["']/, `src="${photoResult.imageUrl}"`);
          } else {
            newImgTag = newImgTag.replace("<img", `<img src="${photoResult.imageUrl}"`);
          }
          return { fullImgTag, newImgTag };
        } catch (photoErr: any) {
          console.warn(`[PipelineOrchestrator] AI photo generation warning for photo ${i + 1}:`, photoErr?.message);
          const fallbackUrl = createFallbackPhotoSvg(designerPrompt);
          onEvent({
            type: "photo_done",
            message: `Photo fallback visual ready`,
            photoUrl: fallbackUrl,
            delta: `⚠️ [NVIDIA FLUX] Using visual fallback for photo ${i + 1}\n`,
          });

          let newImgTag = fullImgTag;
          if (newImgTag.includes("src=")) {
            newImgTag = newImgTag.replace(/src=["'][^"']*["']/, `src="${fallbackUrl}"`);
          } else {
            newImgTag = newImgTag.replace("<img", `<img src="${fallbackUrl}"`);
          }
          return { fullImgTag, newImgTag };
        }
      });

      const photoResults = await Promise.allSettled(photoPromises);
      for (const res of photoResults) {
        if (res.status === "fulfilled" && res.value) {
          slidesContent = slidesContent.replace(res.value.fullImgTag, res.value.newImgTag);
        }
      }
    }

    // 5. Assemble Presentation HTML with Embedded Navigation & Engine
    let finalHtml = "";
    let slideTagCount = (slidesContent.match(/<(?:section|div)[^>]*(?:class=["'][^"']*(?:^|\s)slide(?:\s|["'])|id=["']slide\d+)[^>]*>/gi) || []).length;

    // Safety Recovery: If fewer than 2 slides were produced, re-run with Lightning to guarantee all slides
    if (slideTagCount < 2) {
      console.warn(`[PipelineOrchestrator] Only ${slideTagCount} slides detected. Triggering multi-slide recovery...`);
      onEvent({
        type: "stage3_start",
        message: `[Model 3: Recovery] Generating all ${targetCount} slides with high-speed engine...`,
        topic: cleanTopic,
      });

      const retryResult = await runStage3CreativeGenerator(
        cleanTopic,
        storyboardText,
        analysisText,
        targetCount,
        {
          onReasoning: (delta) => onEvent({ type: "stage3_reasoning", delta }),
          onChunk: (delta) => onEvent({ type: "stage3_chunk", delta }),
        }
      );
      slidesContent = retryResult.rawSlides;
      currentModel = retryResult.activeModel;
      slideTagCount = (slidesContent.match(/<section[^>]*class=["'][^"']*(?:^|\s)slide(?:\s|["'])[^>]*>/gi) || []).length;
    }

    finalHtml = assembleHyperDeckPresentation({
      topic: cleanTopic,
      slidesHtml: slidesContent,
      outline: storyboardText,
      targetCount,
      theme,
    });

    // 5.5 Convert HTML into Presentation AST for Native Keynote Player & Visual Studio
    let presentationAst: any = null;
    try {
      presentationAst = convertHtmlToPresentationAst(cleanTopic, finalHtml, currentModel);
    } catch (astErr: any) {
      console.warn("[PipelineOrchestrator] Failed to convert HTML to AST:", astErr?.message);
    }

    // 6. Cache the 3-stage artifacts
    presentationCache.set(
      topic,
      {
        topic: cleanTopic,
        analysis: analysisText,
        storyboard: storyboardText,
        outline: storyboardText,
        html: finalHtml,
        presentation: presentationAst,
        model: currentModel,
      },
      requestedSlideCount
    );

    onEvent({
      type: "complete",
      message: "HyperDeck presentation synthesized successfully with 3-stage pipeline!",
      html: finalHtml,
      presentation: presentationAst,
      outline: storyboardText,
      topic: cleanTopic,
      model: currentModel,
    });

    return { outline: storyboardText, html: finalHtml };
  }
}

export const pipelineOrchestrator = new PipelineOrchestrator();
