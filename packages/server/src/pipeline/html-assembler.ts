import { MASTER_DESIGN_SYSTEM_CSS } from "./token-optimizer";
import { sanitizeAiTone } from "./stage3-creative-generator";
import { HYPERDECK_CONTROLLER_SCRIPT } from "../runtime";

export interface AssembleOptions {
  topic: string;
  slidesHtml: string;
  slides?: string[];
  outline?: string;
  targetCount: number;
  theme?: string;
}

/**
 * Robustly extracts slide sections (<section class="slide"...>...</section> or <div class="slide slide-N"...>...</div>) from LLM content.
 * Guarantees that internal classes like slide-title-group or slide-category are never mistaken for slides.
 */
export function extractSlidesFromContent(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];
  let clean = raw
    .replace(/```(?:html)?/gi, "")
    .replace(/```/g, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<html[^>]*>|<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>|<\/body>/gi, "");

  // Strip scripts during slide parsing so they don't break tag balance
  const scriptsRemoved = clean.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Match actual slide opening boundary:
  // Must match <section> or <div> with id="slideN" or class containing standalone token "slide" (not hyphenated)
  const slideDelimiterRegex = /(?=<section\b[^>]*(?:\bid=["']slide\d+["']|\bclass=["'][^"']*(?<=[ "'])slide(?=[ "'])[^"']*["'])|<div\b[^>]*(?:\bid=["']slide\d+["']|\bclass=["'][^"']*(?<=[ "'])slide(?=[ "'])[^"']*["']))/i;
  const isSlideTag = /<(?:section|div)\b[^>]*(?:\bid=["']slide\d+["']|\bclass=["'][^"']*(?<=[ "'])slide(?=[ "'])[^"']*["'])/i;

  const rawParts = scriptsRemoved.split(slideDelimiterRegex).map((p) => p.trim()).filter(Boolean);
  const slides: string[] = [];

  for (const part of rawParts) {
    if (isSlideTag.test(part)) {
      let slide = part;

      if (slide.startsWith("<section")) {
        const lastClose = slide.lastIndexOf("</section>");
        if (lastClose > 0) {
          slide = slide.slice(0, lastClose + 10);
        } else {
          // Slide truncated without </section>: strip dangling incomplete tag
          slide = slide.replace(/<[a-z0-9_-]+(?:\s+[^>]*)?$/i, "");
          const openDivs = (slide.match(/<div\b/gi) || []).length;
          const closeDivs = (slide.match(/<\/div>/gi) || []).length;
          for (let d = 0; d < openDivs - closeDivs; d++) {
            slide += "</div>";
          }
          slide += "</section>";
        }
      } else if (slide.startsWith("<div")) {
        const lastClose = slide.lastIndexOf("</div>");
        if (lastClose > 0) {
          slide = slide.slice(0, lastClose + 6);
        } else {
          slide = slide.replace(/<[a-z0-9_-]+(?:\s+[^>]*)?$/i, "");
          slide += "</div>";
        }
      }

      // Normalize raw unformatted <h2>Slide X</h2> headings into standard .slide-title-group
      if (/<h2\b[^>]*>.*?<\/h2>/i.test(slide) && !slide.includes("slide-title-group")) {
        slide = slide.replace(
          /<h2\b[^>]*>(?:.*?Slide\s+\d+[^<]*[–-]\s*)?([^<]+)<\/h2>(?:\s*<h3\b[^>]*>([^<]+)<\/h3>)?(?:\s*<p class="subtitle"[^>]*>([^<]+)<\/p>)?/i,
          (_, h2Text, h3Text, subText) => {
            const cleanTitle = (h3Text || h2Text || "Component Architecture").trim();
            const subtitle = (subText || (h3Text ? h2Text : "") || "Core technical principles and runtime architecture").trim();
            return `<div class="slide-title-group">
    <div class="slide-category">SYSTEM ARCHITECTURE</div>
    <h2 class="slide-title">${cleanTitle}</h2>
    <p class="slide-subtitle">${subtitle}</p>
  </div>`;
          }
        );
      }

      slides.push(slide.trim());
    }
  }

  // If delimiter splitting found no slides, try regex fallback
  if (slides.length === 0) {
    const fallbackRegex = /<(?:section|div)\b[^>]*(?:\bid=["']slide\d+["']|\bclass=["'][^"']*(?<=[ "'])slide(?=[ "'])[^"']*["'])[^>]*>([\s\S]*?)<\/(?:section|div)>/gi;
    let match: RegExpExecArray | null;
    while ((match = fallbackRegex.exec(clean)) !== null) {
      slides.push(match[0].trim());
    }
  }

  return slides;
}

/**
 * Extracts custom scripts from LLM output.
 */
export function extractCustomScripts(raw: string): string {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let combinedJs = "";
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(raw)) !== null) {
    const content = match[1].trim();
    if (content && !content.includes("master-hyperdeck-controller")) {
      combinedJs += "\n" + content;
    }
  }

  return combinedJs.trim();
}

/**
 * Assembles a complete, standalone HyperDeck presentation website.
 */
export function assembleHyperDeckPresentation(options: AssembleOptions): string {
  const { topic, slidesHtml, targetCount } = options;
  const cleanSlides =
    options.slides && options.slides.length > 0
      ? options.slides.map((s) => s.trim()).filter(Boolean)
      : extractSlidesFromContent(slidesHtml);
  const customScript = extractCustomScripts(slidesHtml);

  // If no valid slides were parsed, wrap the raw content or generate structured default
  let renderedSlidesHtml = "";
  if (cleanSlides.length > 0) {
    renderedSlidesHtml = cleanSlides.map((rawSlide, idx) => {
      // Apply comprehensive AI tone and pseudo-math sanitization
      const slide = sanitizeAiTone(rawSlide);
      // Ensure first slide is active and others are not active
      let fixed = slide.replace(/\bactive\b/g, "");
      // Normalize id to sequential index matching thumbnails and controller
      if (/\bid=["']slide\d+["']/i.test(fixed)) {
        fixed = fixed.replace(/\bid=["']slide\d+["']/i, `id="slide${idx}"`);
      } else if (/<section\b/i.test(fixed)) {
        fixed = fixed.replace(/<section\b/i, `<section id="slide${idx}"`);
      } else if (/<div\b/i.test(fixed)) {
        fixed = fixed.replace(/<div\b/i, `<div id="slide${idx}"`);
      }
      if (idx === 0) {
        fixed = fixed.replace(/class=["']([^"']*)["']/, 'class="$1 active"');
      }
      return fixed;
    }).join("\n\n");
  } else {
    // Fallback wrapper for raw content
    renderedSlidesHtml = `<section class="slide active" id="slide0">
      <div class="slide-title-group">
        <div class="slide-category">PRESENTATION</div>
        <h2 class="slide-title">${escapeHtml(topic)}</h2>
      </div>
      <div class="glass-card">
        <p class="card-desc">${escapeHtml(topic)}</p>
      </div>
    </section>`;
  }

  const effectiveCount = cleanSlides.length > 0 ? cleanSlides.length : targetCount;

  // Build thumbnail buttons
  const thumbButtons = Array.from({ length: effectiveCount }, (_, i) => {
    return `<button class="thumb-btn ${i === 0 ? "active" : ""}" data-index="${i}" onclick="goToSlide(${i})">Slide ${i + 1}</button>`;
  }).join("\n          ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(topic)} — Keynox</title>
  
  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- GSAP Animation Engine -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <!-- Three.js 3D WebGL Engine -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <!-- KaTeX Mathematical Typography Engine -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
  
  <style>
${MASTER_DESIGN_SYSTEM_CSS}

    /* Presentation Annotation & Zoom Controls */
    .controls-bar {
      position: absolute; 
      bottom: max(74px, calc(56px + 18px)); 
      left: 50%;
      transform: translateX(-50%) translateZ(0); 
      display: none;
      align-items: center; gap: 6px;
      background: rgba(15, 23, 42, 0.96); 
      padding: 8px 12px; border-radius: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12);
      z-index: 2147483647; width: 95vw; max-width: 580px;
      overflow-x: auto; flex-wrap: nowrap; justify-content: flex-start;
      scrollbar-width: none; 
      -ms-overflow-style: none; 
      backdrop-filter: blur(16px);
      transition: opacity 0.2s ease;
    }
    @media (min-width: 580px) {
      .controls-bar { justify-content: center; }
    }
    .controls-bar::-webkit-scrollbar { display: none; }
    
    .controls-bar.visible,
    :fullscreen .controls-bar.visible,
    :-webkit-full-screen .controls-bar.visible {
      display: flex !important;
    }
    .controls-bar.hidden,
    #controlsBar.hidden,
    :fullscreen .controls-bar.hidden,
    :-webkit-full-screen .controls-bar.hidden {
      display: none !important;
    }

    .slide-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono, monospace);
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-muted, #94a3b8);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
      padding: 6px 14px;
      border-radius: 20px;
      letter-spacing: 0.05em;
    }
    .slide-indicator .current {
      color: #fff;
      font-weight: 800;
    }
    .slide-indicator .sep {
      opacity: 0.4;
    }

    .top-zoom-controls {
      position: absolute;
      top: max(15px, env(safe-area-inset-top));
      right: max(15px, env(safe-area-inset-right));
      display: none;
      gap: 6px;
      z-index: 1005;
    }
    .top-zoom-controls.visible,
    :fullscreen .top-zoom-controls.visible,
    :-webkit-full-screen .top-zoom-controls.visible {
      display: flex !important;
    }
    .top-zoom-controls.hidden,
    #topZoomControls.hidden,
    :fullscreen .top-zoom-controls.hidden,
    :-webkit-full-screen .top-zoom-controls.hidden {
      display: none !important;
    }

    /* Guaranteed clickability over drawing canvas */
    .stage-chevron {
      z-index: 1005 !important;
    }
    .stage-footer {
      z-index: 1005 !important;
    }
    .stage-header {
      z-index: 1005 !important;
    }

    .btn-annot {
      display: inline-flex; align-items: center; justify-content: center; gap: 4px;
      background-color: #2563eb; color: white; padding: 7px 11px;
      border-radius: 20px; text-decoration: none; font-weight: 500; font-size: 12px;
      border: none; cursor: pointer; white-space: nowrap;
      touch-action: manipulation; flex-shrink: 0;
      transition: background-color 0.15s, transform 0.1s;
      font-family: inherit;
    }
    .btn-annot svg { width: 14px; height: 14px; flex-shrink: 0; }
    .btn-annot:active { background-color: #1d4ed8; transform: scale(0.93); }
    .btn-annot.active { background-color: #dc2626 !important; }
    .btn-annot:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-nav.active {
      background: #2563eb !important;
      border-color: #3b82f6 !important;
      color: #ffffff !important;
    }

    .color-picker {
      width: 26px; height: 26px; border: 2px solid rgba(255,255,255,0.4); border-radius: 50%;
      cursor: pointer; background: none; padding: 0; flex-shrink: 0;
      -webkit-appearance: none; appearance: none;
      outline: none;
    }
    .color-picker::-webkit-color-swatch-wrapper { padding: 0; }
    .color-picker::-webkit-color-swatch { border: none; border-radius: 50%; }

    .drawing-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
      touch-action: none;
    }
  </style>
</head>
<body class="theme-${options.theme || 'midnight'}">
  <main class="hyperdeck-stage" id="hyperdeckStage">
    <!-- Top Right Zoom Controls -->
    <div class="top-zoom-controls hidden" id="topZoomControls">
      <button class="btn-annot" onclick="zoomIn()" title="Zoom In (+)" style="background-color: rgba(15, 23, 42, 0.95);">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>
      </button>
      <button class="btn-annot" onclick="zoomOut()" title="Zoom Out (-)" style="background-color: rgba(15, 23, 42, 0.95);">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"></path></svg>
      </button>
      <button class="btn-annot" onclick="resetZoom()" id="zoomResetBtn" title="Reset Zoom (100%)" style="background-color: rgba(15, 23, 42, 0.95); font-size: 11px; padding: 6px 9px; min-width: 42px;">
        100%
      </button>
    </div>

    <!-- Progress Indicator -->
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" id="progressBar"></div>
    </div>

    <!-- Executive Header -->
    <header class="stage-header">
      <div class="header-left">
        <span class="badge">KEYNOX</span>
        <h1 class="deck-title">${escapeHtml(topic)}</h1>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="badge" id="slideCounter">1 / ${effectiveCount}</div>
      </div>
    </header>

    <!-- Slide Content Viewport -->
    <section class="slides-viewport" id="viewport">
${renderedSlidesHtml}
      <canvas id="drawingCanvas" class="drawing-canvas"></canvas>
    </section>

    <!-- Floating Stage Chevrons for Easy Click-Through -->
    <button class="stage-chevron stage-chevron-prev" onclick="prevSlide()" aria-label="Previous Slide" title="Previous Slide (← / K)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <button class="stage-chevron stage-chevron-next" onclick="nextSlide()" aria-label="Next Slide" title="Next Slide (→ / Space / J)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>

    <!-- Bottom Drawing Tools -->
    <div class="controls-bar hidden" id="controlsBar">
      <button id="penBtn" class="btn-annot" onclick="setTool('pen')" title="Pen Tool (P)">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        Pen
      </button>
      <button id="highlighterBtn" class="btn-annot" onclick="setTool('highlighter')" title="Highlighter Tool (H)">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10M5 16h14M8 3v5m8-5v5M6 8a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-4a2 2 0 00-2-2H6z"></path></svg>
        Highlight
      </button>
      <button id="scrollBtn" class="btn-annot active" onclick="setTool('scroll')" title="Scroll / Interact Mode (S)">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
        Scroll
      </button>
      
      <input type="color" id="penColor" class="color-picker" value="#ef4444" title="Pen Color">
      
      <button class="btn-annot" onclick="undo()" title="Undo (Ctrl+Z)" style="background-color: #475569;">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
      </button>
      <button class="btn-annot" onclick="redo()" title="Redo (Ctrl+Y)" style="background-color: #475569;">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
      </button>

      <button class="btn-annot" id="saveBtn" onclick="saveDrawings()" style="background-color: #10b981;" title="Save Drawings">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
        Save
      </button>
      <button class="btn-annot" id="clearBtn" onclick="clearDrawings()" style="background-color: #334155;" title="Clear Current Slide Drawings">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        Clear
      </button>
      <button class="btn-annot" onclick="toggleAnnotationBar(false)" title="Hide Bar" style="background-color: rgba(255, 255, 255, 0.08); padding: 7px 8px;">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <!-- Persistent Navigation Footer -->
    <footer class="stage-footer">
      <div class="slide-indicator" id="footerSlideCounter">
        <span class="current" id="footerCurrent">01</span>
        <span class="sep">/</span>
        <span class="total">${effectiveCount < 10 ? "0" + effectiveCount : effectiveCount}</span>
      </div>

      <div class="nav-actions">
        <button class="btn-nav" id="annotateToggleBtn" onclick="toggleAnnotationBar()" title="Drawing & Annotation Tools (P)">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;margin-right:2px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>Draw
        </button>
        <button class="btn-nav" id="prevBtn" onclick="prevSlide()" title="Previous (Left Arrow / K)">◀ Prev</button>
        <button class="btn-nav btn-primary" id="nextBtn" onclick="nextSlide()" title="Next (Right Arrow / Space / J)">Next ▶</button>
        <button class="btn-nav" onclick="toggleFullscreen()" title="Fullscreen (F)">⛶</button>
      </div>
    </footer>
  </main>

  <script id="master-hyperdeck-controller">
${HYPERDECK_CONTROLLER_SCRIPT}
  </script>

  ${customScript ? `<script id="custom-hyperdeck-widgets">\n${customScript}\n</script>` : ""}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
