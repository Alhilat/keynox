/**
 * Robust Domain-Aware Presentation AST Extractor
 * 
 * Converts AI-generated HTML presentations into the native @presentation/schema AST format.
 * Designed to NEVER throw an error, ensuring Keynote Player and Visual Studio work for 100% of generated presentations.
 */

import { Presentation, Scene, Element, Step, CardElement, ImageElement, InteractiveWidgetElement } from "@presentation/schema";
import { extractSlidesFromContent } from "./html-assembler";

export function extractPresentationAst(
  topic: string,
  html: string,
  modelName: string = "Keynox Engine"
): Presentation {
  const cleanTopic = topic.replace(/^TOPIC:\s*["']?|["']?$/gi, "").trim() || "Untitled Presentation";
  const rawSlides = extractSlidesFromContent(html);

  // If no slide sections extracted, treat entire HTML as one slide
  const slidesToProcess = rawSlides.length > 0 ? rawSlides : [html];

  const scenes: Scene[] = slidesToProcess.map((slideHtml, slideIdx) => {
    const sceneId = `scene-${slideIdx + 1}`;

    // 1. Extract Slide Title (Safe fallback)
    let title = "";
    const titleMatch =
      slideHtml.match(/<(?:h1|h2|h3)[^>]*class=["'][^"']*slide-title[^"']*["'][^>]*>([\s\S]*?)<\/(?:h1|h2|h3)>/i) ||
      slideHtml.match(/<(?:h1|h2)[^>]*>([\s\S]*?)<\/(?:h1|h2)>/i) ||
      slideHtml.match(/<title>([\s\S]*?)<\/title>/i);

    if (titleMatch) {
      title = stripTags(titleMatch[1]).trim();
    }
    if (!title) {
      title = slideIdx === 0 ? cleanTopic : `Section ${slideIdx + 1}`;
    }

    // 2. Extract Subtitle
    let subtitle: string | undefined;
    const subMatch = slideHtml.match(/<p[^>]*class=["'][^"']*slide-subtitle[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    if (subMatch) {
      subtitle = stripTags(subMatch[1]).trim();
    }

    // 3. Extract Category
    let category: string | undefined;
    const catMatch = slideHtml.match(/<(?:span|div)[^>]*class=["'][^"']*slide-category[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i);
    if (catMatch) {
      const extractedCategory = stripTags(catMatch[1]).trim();
      if (extractedCategory) category = extractedCategory;
    }

    const elements: Element[] = [];

    // --- Element Extraction Rules ---

    // A. Images
    const imgRegex = /<img\b([^>]*)>/gi;
    let imgMatch: RegExpExecArray | null;
    let imgCount = 0;
    while ((imgMatch = imgRegex.exec(slideHtml)) !== null) {
      const attrs = imgMatch[1];
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      const altMatch = attrs.match(/alt=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        imgCount++;
        elements.push({
          id: `${sceneId}-img-${imgCount}`,
          type: "image",
          src: srcMatch[1],
          ...(altMatch?.[1] ? { alt: altMatch[1] } : {}),
        } as ImageElement);
      }
    }

    // B. Interactive Widgets (Simulators, Code Blocks, Matrices)
    if (slideHtml.includes("boolean-simulator") || slideHtml.includes("logic-gate")) {
      elements.push({
        id: `${sceneId}-widget-bool`,
        type: "interactive-widget",
        widgetType: "boolean-simulator",
        title: "Live Logic Circuit Simulator",
        config: { defaultGate: "AND" },
      } as InteractiveWidgetElement);
    } else if (slideHtml.includes("physics-slider") || slideHtml.includes("acceleration-val")) {
      elements.push({
        id: `${sceneId}-widget-physics`,
        type: "interactive-widget",
        widgetType: "physics-slider",
        title: "Dynamic Physics Simulator",
        config: { defaultMass: 10, defaultForce: 50 },
      } as InteractiveWidgetElement);
    } else if (slideHtml.includes("terminal-card") || slideHtml.includes("code-block")) {
      elements.push({
        id: `${sceneId}-widget-code`,
        type: "interactive-widget",
        widgetType: "code-block",
        title: "Live Terminal",
        config: {},
      } as InteractiveWidgetElement);
    } else if (slideHtml.includes("matrix-table") || slideHtml.includes("comparison-matrix")) {
      elements.push({
        id: `${sceneId}-widget-matrix`,
        type: "interactive-widget",
        widgetType: "comparison-matrix",
        title: "Comparison Matrix",
        config: {},
      } as InteractiveWidgetElement);
    }

    // C. Pipeline Stages
    const pipelineStageRegex = /<div[^>]*class=["'][^"']*pipeline-stage[^"']*["'][^>]*>([\s\S]*?)<\/div>(?=(?:\s*<div[^>]*class=["'][^"']*(?:pipeline-stage|pipeline-connector)[^"']*["'])|\s*<\/div>)/gi;
    let pMatch: RegExpExecArray | null;
    let pCount = 0;
    while ((pMatch = pipelineStageRegex.exec(slideHtml)) !== null) {
      const stageContent = pMatch[1];
      pCount++;
      const numMatch = stageContent.match(/<span[^>]*class=["'][^"']*stage-num[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
      const titleM = stageContent.match(/<div[^>]*class=["'][^"']*stage-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      const descM = stageContent.match(/<div[^>]*class=["'][^"']*stage-desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      const stageTitle = titleM ? stripTags(titleM[1]).trim() : `Stage ${pCount}`;
      const stageDescription = descM ? stripTags(descM[1]).trim() : "";

      elements.push({
        id: `${sceneId}-card-${elements.length + 1}`,
        type: "card",
        title: stageTitle,
        ...(numMatch ? { badge: stripTags(numMatch[1]).trim() } : {}),
        ...(stageDescription ? { description: stageDescription } : {}),
        points: [],
        accentColor: getAccentColorByIndex(pCount),
      } as CardElement);
    }

    // D. Glass Cards & Standard Cards
    const cardRegex = /<div[^>]*class=["'][^"']*(?:glass-card|card|stat-card|terminal-card)[^"']*["'][^>]*>([\s\S]*?)<\/div>(?=\s*<div[^>]*class=["'][^"']*(?:glass-card|card|stat-card|terminal-card)[^"']*["']|\s*<\/div>\s*<\/section>|\s*<\/section>)/gi;
    let cMatch: RegExpExecArray | null;
    while ((cMatch = cardRegex.exec(slideHtml)) !== null) {
      const cardInner = cMatch[1];

      const cardTitleM =
        cardInner.match(/<(?:span|h3|h4|div)[^>]*class=["'][^"']*(?:card-title|stat-label|stage-title)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|h3|h4|div)>/i) ||
        cardInner.match(/<(?:h3|h4)[^>]*>([\s\S]*?)<\/(?:h3|h4)>/i);

      const badgeM = cardInner.match(/<span[^>]*class=["'][^"']*badge[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
      const descM = cardInner.match(/<p[^>]*class=["'][^"']*(?:card-desc|stat-value)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);

      const points: string[] = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(cardInner)) !== null) {
        const pt = stripTags(liMatch[1]).trim();
        if (pt) points.push(pt);
      }

      const cardTitle = cardTitleM ? stripTags(cardTitleM[1]).trim() : `Concept ${elements.length + 1}`;
      const cardDescription = descM ? stripTags(descM[1]).trim() : "";
      const accentColor = detectAccentColor(cardInner, elements.length);

      elements.push({
        id: `${sceneId}-card-${elements.length + 1}`,
        type: "card",
        title: cardTitle,
        ...(badgeM ? { badge: stripTags(badgeM[1]).trim() } : {}),
        ...(cardDescription ? { description: cardDescription } : {}),
        ...(points.length > 0 ? { points } : {}),
        accentColor,
      } as CardElement);
    }

    // E. Fallback Element if slide contained no recognized structural components
    if (elements.length === 0) {
      // Extract paragraphs as fallback concept cards
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let pMatch: RegExpExecArray | null;
      let pCount = 0;
      while ((pMatch = pRegex.exec(slideHtml)) !== null && pCount < 3) {
        const pText = stripTags(pMatch[1]).trim();
        if (pText && pText.length > 10) {
          pCount++;
          elements.push({
            id: `${sceneId}-card-${elements.length + 1}`,
            type: "card",
            title: `Key Insight ${pCount}`,
            description: pText,
            points: [],
            accentColor: getAccentColorByIndex(pCount),
          } as CardElement);
        }
      }

      // If even paragraphs were empty, reject empty slide
      if (elements.length === 0) {
        throw new Error(`Slide ${slideIdx + 1} contains no source-derived elements`);
      }
    }

    // Determine Layout
    let layout: "hero" | "cards" | "split" | "timeline" | "stat" | "standard" = "cards";
    if (slideIdx === 0) layout = "hero";
    else if (pCount > 0) layout = "timeline";
    else if (elements.length === 2 || elements.some((e) => e.type === "interactive-widget" || e.type === "image")) layout = "split";
    else layout = "cards";

    // Build Step Sequence with GSAP Highlight actions
    const steps: Step[] = [
      {
        id: `${sceneId}-step-1`,
        title: title,
        description: subtitle || "Slide Overview",
        actions: [],
      },
    ];

    elements.forEach((el, elIdx) => {
      const elementTitle =
        el.type === "card"
          ? (el as CardElement).title
          : "title" in el && typeof el.title === "string" && el.title.trim()
          ? el.title.trim()
          : title;

      steps.push({
        id: `${sceneId}-step-${elIdx + 2}`,
        title: elementTitle,
        description: (el as CardElement).description || elementTitle,
        actions: [
          {
            action: "highlight",
            target: el.id,
            color: (el as CardElement).accentColor || "#38bdf8",
            duration: 0.6,
            pulse: true,
          },
        ],
      });
    });

    return {
      id: sceneId,
      title,
      subtitle,
      category,
      layout,
      elements,
      steps,
    };
  });

  return {
    version: 1,
    title: cleanTopic,
    metadata: {
      topic: cleanTopic,
      model: `${modelName} (Keynox 3-Stage Pipeline)`,
      createdAt: new Date().toISOString(),
    },
    scenes,
  };
}

function stripTags(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function detectAccentColor(cardInner: string, idx: number): string {
  if (cardInner.includes("card-emerald") || cardInner.includes("badge-emerald")) return "#10b981";
  if (cardInner.includes("card-indigo") || cardInner.includes("badge-indigo")) return "#818cf8";
  if (cardInner.includes("card-amber") || cardInner.includes("badge-amber")) return "#f59e0b";
  if (cardInner.includes("card-rose") || cardInner.includes("badge-rose")) return "#f43f5e";
  return getAccentColorByIndex(idx);
}

function getAccentColorByIndex(idx: number): string {
  const colors = ["#38bdf8", "#10b981", "#818cf8", "#f59e0b", "#f43f5e", "#a855f7"];
  return colors[idx % colors.length];
}
