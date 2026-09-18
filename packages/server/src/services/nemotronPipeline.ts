/**
 * HyperDeck Presentation Synthesis Pipeline Facade
 * Provides high-performance two-stage reasoning and generation.
 */

import { pipelineOrchestrator, PipelineEvent } from "../pipeline/orchestrator";
import { extractCleanTopic } from "../pipeline/topic-extractor";
import { assembleHyperDeckPresentation, extractSlidesFromContent, extractCustomScripts } from "../pipeline/html-assembler";

export { PipelineEvent, extractCleanTopic };

export async function runNemotronPipeline(
  topic: string,
  onEvent: (event: PipelineEvent) => void,
  requestedSlideCount?: number,
  theme?: string
): Promise<{ outline: string; html: string }> {
  return pipelineOrchestrator.execute(topic, onEvent, requestedSlideCount, theme);
}

export function isHtmlFullyComplete(html: string): boolean {
  if (!html || html.length < 300) return false;
  const slideCount = (html.match(/class=["'][^"']*\bslide\b/g) || []).length;
  return slideCount >= 2;
}

export function extractSlideSections(html: string): string[] {
  return extractSlidesFromContent(html);
}

export function extractCustomStyles(html: string): string {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let customCss = "";
  let match: RegExpExecArray | null;
  while ((match = styleRegex.exec(html)) !== null) {
    customCss += "\n" + match[1];
  }
  return customCss.trim();
}

export { extractCustomScripts };

export function assemblePresentationWebsite(
  topic: string,
  rawContent: string,
  outline: string,
  targetCount: number = 4
): string {
  return assembleHyperDeckPresentation({
    topic,
    slidesHtml: rawContent,
    outline,
    targetCount,
  });
}
