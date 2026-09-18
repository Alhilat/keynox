/**
 * HTML to PresentationSchema AST Converter
 * 
 * Bridges the 3-stage LLM presentation pipeline into the native
 * @presentation/schema & @presentation/engine ecosystem.
 * Enables AI-generated presentations to be seamlessly presented in Keynote Player
 * with GSAP step-by-step animations and edited in Visual Studio.
 */

import { Presentation, Scene, Element, Step, CardElement, ImageElement, InteractiveWidgetElement } from "@presentation/schema";
import { extractSlidesFromContent } from "./html-assembler";

export function convertHtmlToPresentationAst(
  topic: string,
  html: string,
  modelName: string = "HyperDeck 3-Stage Engine"
): Presentation {
  const rawSlides = extractSlidesFromContent(html);
  const scenes: Scene[] = [];

  const cleanTopic = topic.replace(/^TOPIC:\s*["']?|["']?$/gi, "").trim() || "Interactive Presentation";

  rawSlides.forEach((slideHtml, slideIdx) => {
    const sceneId = `scene-${slideIdx + 1}`;
    
    // Extract Title
    let title = `Slide ${slideIdx + 1}`;
    const titleMatch = slideHtml.match(/<(?:h1|h2|h3)[^>]*class=["'][^"']*slide-title[^"']*["'][^>]*>([\s\S]*?)<\/(?:h1|h2|h3)>/i)
      || slideHtml.match(/<(?:h1|h2)[^>]*>([\s\S]*?)<\/(?:h1|h2)>/i);
    if (titleMatch) {
      title = stripTags(titleMatch[1]).trim();
    }

    // Extract Subtitle
    let subtitle: string | undefined;
    const subMatch = slideHtml.match(/<p[^>]*class=["'][^"']*slide-subtitle[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    if (subMatch) {
      subtitle = stripTags(subMatch[1]).trim();
    }

    // Extract Category
    let category = "ARCHITECTURE";
    const catMatch = slideHtml.match(/<(?:span|div)[^>]*class=["'][^"']*slide-category[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i);
    if (catMatch) {
      category = stripTags(catMatch[1]).trim();
    }

    const elements: Element[] = [];

    // 1. Extract Images
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
          alt: altMatch ? altMatch[1] : "Presentation Visual",
        } as ImageElement);
      }
    }

    // 2. Extract Pipeline Stages as Cards
    const pipelineStageRegex = /<div[^>]*class=["'][^"']*pipeline-stage[^"']*["'][^>]*>([\s\S]*?)<\/div>(?=(?:\s*<div[^>]*class=["'][^"']*(?:pipeline-stage|pipeline-connector)[^"']*["'])|\s*<\/div>)/gi;
    let pMatch: RegExpExecArray | null;
    let pCount = 0;
    while ((pMatch = pipelineStageRegex.exec(slideHtml)) !== null) {
      const stageContent = pMatch[1];
      pCount++;
      const numMatch = stageContent.match(/<span[^>]*class=["'][^"']*stage-num[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
      const titleM = stageContent.match(/<div[^>]*class=["'][^"']*stage-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      const descM = stageContent.match(/<div[^>]*class=["'][^"']*stage-desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

      elements.push({
        id: `${sceneId}-card-${elements.length + 1}`,
        type: "card",
        title: titleM ? stripTags(titleM[1]).trim() : `Phase 0${pCount}`,
        badge: numMatch ? stripTags(numMatch[1]).trim() : `0${pCount}`,
        tag: "PIPELINE STAGE",
        description: descM ? stripTags(descM[1]).trim() : "Operational state progression",
        points: [],
        accentColor: pCount === 1 ? "#10b981" : pCount === 2 ? "#38bdf8" : pCount === 3 ? "#818cf8" : "#f59e0b",
      } as CardElement);
    }

    // 3. Extract Glass Cards
    const cardRegex = /<div[^>]*class=["'][^"']*glass-card[^"']*["'][^>]*>([\s\S]*?)<\/div>(?=\s*<div[^>]*class=["'][^"']*glass-card[^"']*["']|\s*<\/div>\s*<\/section>|\s*<\/section>)/gi;
    let cMatch: RegExpExecArray | null;
    while ((cMatch = cardRegex.exec(slideHtml)) !== null) {
      const cardInner = cMatch[1];
      
      const cardTitleM = cardInner.match(/<(?:span|h3|h4|div)[^>]*class=["'][^"']*card-title[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|h3|h4|div)>/i)
        || cardInner.match(/<(?:h3|h4)[^>]*>([\s\S]*?)<\/(?:h3|h4)>/i);
      
      const badgeM = cardInner.match(/<span[^>]*class=["'][^"']*badge[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
      const descM = cardInner.match(/<p[^>]*class=["'][^"']*card-desc[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
      
      const points: string[] = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(cardInner)) !== null) {
        const pt = stripTags(liMatch[1]).trim();
        if (pt) points.push(pt);
      }

      // Determine accent color from classes
      let accentColor = "#38bdf8";
      if (cardInner.includes("card-emerald") || cardInner.includes("badge-emerald")) accentColor = "#10b981";
      else if (cardInner.includes("card-indigo") || cardInner.includes("badge-indigo")) accentColor = "#818cf8";
      else if (cardInner.includes("card-amber") || cardInner.includes("badge-amber")) accentColor = "#f59e0b";
      else if (cardInner.includes("card-rose") || cardInner.includes("badge-rose")) accentColor = "#f43f5e";

      elements.push({
        id: `${sceneId}-card-${elements.length + 1}`,
        type: "card",
        title: cardTitleM ? stripTags(cardTitleM[1]).trim() : `Key Concept 0${elements.length + 1}`,
        badge: badgeM ? stripTags(badgeM[1]).trim() : `0${elements.length + 1}`,
        tag: "ARCHITECTURAL INVARIANT",
        description: descM ? stripTags(descM[1]).trim() : points[0] || "Key architectural insight",
        points: points.length > 0 ? points : ["Domain verified invariant", "Production architectural guarantee"],
        accentColor,
      } as CardElement);
    }

    // 4. Extract Interactive Simulator if present
    if (slideHtml.includes("sim-container") || slideHtml.includes("sim-controls")) {
      elements.push({
        id: `${sceneId}-widget-${elements.length + 1}`,
        type: "interactive-widget",
        widgetType: "physics-slider",
        title: "Dynamic Parameter Simulation",
        config: {
          metric: "Throughput / Latency Ratio",
          formula: "a = F/m",
        },
      } as InteractiveWidgetElement);
    }

    // Fallback: Ensure scene has at least 2 structured cards if elements are empty
    if (elements.length === 0) {
      elements.push({
        id: `${sceneId}-card-1`,
        type: "card",
        title: "Core Mechanism",
        tag: "FOUNDATION",
        badge: "01",
        description: subtitle || `Primary operational invariant of ${cleanTopic}`,
        points: ["Deterministic state execution", "Boundary invariant preservation"],
        accentColor: "#38bdf8",
      } as CardElement);

      elements.push({
        id: `${sceneId}-card-2`,
        type: "card",
        title: "System Telemetry & Guarantees",
        tag: "ANALYSIS",
        badge: "02",
        description: "Verified architectural bounds and telemetry monitoring",
        points: ["Zero-latency dispatch", "Self-healing fault barriers"],
        accentColor: "#818cf8",
      } as CardElement);
    }

    // Determine Scene Layout
    let layout: "hero" | "cards" | "split" | "timeline" | "stat" | "standard" = "cards";
    if (slideIdx === 0) layout = "hero";
    else if (pCount > 0) layout = "timeline";
    else if (elements.length === 2 || elements.some((e) => e.type === "interactive-widget" || e.type === "image")) layout = "split";
    else layout = "cards";

    // Build Sequenced GSAP Steps
    const steps: Step[] = [
      {
        id: `${sceneId}-step-1`,
        title: title,
        description: subtitle || "Initial slide overview",
        actions: [],
      },
    ];

    // Create a step highlighting each element in turn
    elements.forEach((el, elIdx) => {
      steps.push({
        id: `${sceneId}-step-${elIdx + 2}`,
        title: el.type === "card" ? (el as CardElement).title : `Focus Component ${elIdx + 1}`,
        description: `Deep dive into ${(el as any).title || "this component"}`,
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

    scenes.push({
      id: sceneId,
      title,
      subtitle,
      category,
      layout,
      elements,
      steps,
    });
  });

  return {
    version: 1,
    title: cleanTopic,
    metadata: {
      topic: cleanTopic,
      model: `${modelName} (HyperDeck 3-Stage Pipeline)`,
      createdAt: new Date().toISOString(),
    },
    scenes: scenes.length > 0 ? scenes : [
      {
        id: "scene-1",
        title: cleanTopic,
        subtitle: "Interactive Keynote Deck",
        category: "OVERVIEW",
        layout: "hero",
        elements: [
          {
            id: "hero-1",
            type: "card",
            title: "Core Thesis",
            tag: "OVERVIEW",
            badge: "01",
            description: `Primary technical foundation of ${cleanTopic}`,
            points: ["Deterministic evaluation", "Autonomous failover"],
            accentColor: "#38bdf8",
          },
        ],
        steps: [
          {
            id: "step-1-1",
            title: "Overview",
            description: "Introduction",
            actions: [],
          },
        ],
      },
    ],
  };
}

function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
