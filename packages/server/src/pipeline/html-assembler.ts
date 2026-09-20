import { MASTER_DESIGN_SYSTEM_CSS } from "./token-optimizer";
import { sanitizeAiTone } from "./stage3-creative-generator";

export interface AssembleOptions {
  topic: string;
  slidesHtml: string;
  outline?: string;
  targetCount: number;
  theme?: string;
}

/**
 * Robustly extracts slide sections (<section class="slide"...>...</section>) from LLM content.
 * Guarantees that internal classes like slide-title-group or slide-category are never mistaken for slides.
 */
export function extractSlidesFromContent(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];
  let clean = raw
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<html[^>]*>|<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>|<\/body>/gi, "");

  // Strip scripts during slide parsing so they don't break tag balance
  const scriptsRemoved = clean.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Match actual slide opening boundary:
  // Must match <section> or <div> with id="slideN" or class containing standalone "slide" (not hyphenated)
  const slideDelimiterRegex = /(?=<section\b[^>]*\b(?:id=["']slide\d+["']|class=["'][^"']*(?:\s|^)slide(?:\s|["']))|<div\b[^>]*\b(?:id=["']slide\d+["']|class=["'][^"']*(?:\s|^)slide(?:\s|["'])))/i;

  const rawParts = scriptsRemoved.split(slideDelimiterRegex).map((p) => p.trim()).filter(Boolean);
  const slides: string[] = [];

  for (const part of rawParts) {
    const isSlide = /<(?:section|div)\b[^>]*\b(?:id=["']slide\d+["']|class=["'][^"']*(?:\s|^)slide(?:\s|["']))/i.test(part);
    if (isSlide) {
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
    const fallbackRegex = /<section\b[^>]*\b(?:id=["']slide\d+["']|class=["'][^"']*(?:\s|^)slide(?:\s|["']))[^>]*>([\s\S]*?)<\/section>/gi;
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
  const cleanSlides = extractSlidesFromContent(slidesHtml);
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
      } else {
        fixed = fixed.replace(/<section\b/i, `<section id="slide${idx}"`);
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

  const effectiveCount = Math.max(cleanSlides.length, targetCount);

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
    :fullscreen .controls-bar,
    :-webkit-full-screen .controls-bar {
      display: flex !important;
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
      z-index: 2147483647;
    }
    .top-zoom-controls.visible,
    :fullscreen .top-zoom-controls,
    :-webkit-full-screen .top-zoom-controls {
      display: flex !important;
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
      z-index: 999;
      touch-action: none;
    }
  </style>
</head>
<body class="theme-${options.theme || 'oxford'}">
  <main class="hyperdeck-stage" id="hyperdeckStage">
    <!-- Top Right Zoom Controls -->
    <div class="top-zoom-controls" id="topZoomControls">
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
    <div class="controls-bar" id="controlsBar">
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
      <button class="btn-annot" onclick="clearDrawings()" style="background-color: #334155;" title="Clear Current Slide Drawings">
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
        <button class="btn-nav" id="annotateToggleBtn" onclick="toggleAnnotationBar()" title="Drawing & Annotation Tools (P)">✏️ Draw</button>
        <button class="btn-nav" id="prevBtn" onclick="prevSlide()" title="Previous (Left Arrow / K)">◀ Prev</button>
        <button class="btn-nav btn-primary" id="nextBtn" onclick="nextSlide()" title="Next (Right Arrow / Space / J)">Next ▶</button>
        <button class="btn-nav" onclick="toggleFullscreen()" title="Fullscreen (F)">⛶</button>
      </div>
    </footer>
  </main>

  <script id="master-hyperdeck-controller">
    let currentSlide = 0;
    const slides = Array.from(document.querySelectorAll('.slide'));
    const totalSlides = slides.length;
    const progressBar = document.getElementById('progressBar');
    const slideCounter = document.getElementById('slideCounter');
    const thumbBtns = Array.from(document.querySelectorAll('.thumb-btn'));

    function setTheme(t) {
      document.body.className = 'theme-' + t;
    }

    function updatePresentationState() {
      slides.forEach((s, idx) => {
        if (idx === currentSlide) {
          s.classList.add('active');
          if (window.gsap) {
            // Animate cards and diagram containers
            gsap.fromTo(s.querySelectorAll('.glass-card, .matrix-table, .sim-container, .chart-card, .venn-container, .flow-diagram'), 
              { opacity: 0, y: 16 }, 
              { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
            );

            // Animate motion pipeline stages with spring bounce
            gsap.fromTo(s.querySelectorAll('.pipeline-stage'),
              { opacity: 0, y: 22, scale: 0.92 },
              { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.1, ease: "back.out(1.4)", delay: 0.05 }
            );

            // Animate pipeline connectors expanding
            gsap.fromTo(s.querySelectorAll('.pipeline-connector'),
              { scaleX: 0, transformOrigin: "left center" },
              { scaleX: 1, duration: 0.4, stagger: 0.1, ease: "power2.out", delay: 0.15 }
            );

            // Animate chart bars growing upward
            gsap.fromTo(s.querySelectorAll('.chart-bar-fill'),
              { scaleY: 0, transformOrigin: "bottom" },
              { scaleY: 1, duration: 0.65, stagger: 0.08, ease: "back.out(1.2)", delay: 0.1 }
            );

            // Animate Venn diagram circles blooming
            gsap.fromTo(s.querySelectorAll('.venn-circle-shape'),
              { scale: 0.6, opacity: 0, transformOrigin: "center" },
              { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.05 }
            );

            // Animate flow nodes popping
            gsap.fromTo(s.querySelectorAll('.flow-node'),
              { scale: 0.5, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.5)", delay: 0.1 }
            );
          }

          // Initialize 2026 Creative 3D WebGL & Particle engines on active slide
          initThreeScenes(s);
          initParticleConduits(s);

          // Render KaTeX mathematical equations on active slide
          if (window.renderMathInElement) {
            try {
              renderMathInElement(s, {
                delimiters: [
                  { left: "$$", right: "$$", display: true },
                  { left: "\\\\[", right: "\\\\]", display: true },
                  { left: "\\\\(", right: "\\\\)", display: false },
                ],
                ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
                ignoredClasses: ["terminal-card", "terminal-body", "terminal-cmd", "arch-stack", "disk-stripe", "stat-card"],
                throwOnError: false,
              });
            } catch (e) {
              console.warn("KaTeX render error:", e);
            }
          }
        } else {
          s.classList.remove('active');
        }
      });

      if (thumbBtns && thumbBtns.length > 0) {
        thumbBtns.forEach((btn, idx) => {
          btn.classList.toggle('active', idx === currentSlide);
        });
      }

      const progress = totalSlides > 1 ? ((currentSlide + 1) / totalSlides) * 100 : 100;
      if (progressBar) progressBar.style.width = progress + '%';
      if (slideCounter) slideCounter.textContent = (currentSlide + 1) + ' / ' + totalSlides;
      const footerCur = document.getElementById('footerCurrent');
      if (footerCur) {
        const curNum = currentSlide + 1;
        footerCur.textContent = curNum < 10 ? '0' + curNum : String(curNum);
      }

      // Reset zoom if slide changed and scale is not 1
      if (typeof resetZoom === 'function' && currentScale !== 1.0) {
        resetZoom();
      }
      // Load drawing layer for current slide
      if (typeof loadSlideDrawing === 'function') {
        loadSlideDrawing(currentSlide);
      }

      // Invoke custom slide hooks if declared (e.g. initSlide1())
      if (typeof window['initSlide' + currentSlide] === 'function') {
        try { window['initSlide' + currentSlide](); } catch (e) { console.warn(e); }
      }

      // Broadcast state update for Presenter Console & iframe containers
      try {
        const activeSlide = slides[currentSlide];
        const activeTitle = activeSlide ? (activeSlide.querySelector('.slide-title')?.textContent?.trim() || ('Slide ' + (currentSlide + 1))) : '';
        const notes = activeSlide?.getAttribute('data-notes') || '';
        const syncMsg = {
          type: 'HYPERDECK_STATE_UPDATE',
          currentSlide,
          totalSlides,
          title: activeTitle,
          notes: notes,
        };
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(syncMsg, '*');
        }
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(syncMsg, '*');
        }
      } catch (err) {
        // Cross-origin safety
      }
    }

    // Bidirectional remote navigation listener (e.g. from Presenter Console)
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'HYPERDECK_NAVIGATE') {
        if (e.data.action === 'next') nextSlide();
        else if (e.data.action === 'prev') prevSlide();
        else if (e.data.action === 'goTo' && typeof e.data.index === 'number') goToSlide(e.data.index);
      }
    });

    // =========================================================================
    // Interactive Annotation, Pen/Highlighter Drawing & Zoom Engine
    // =========================================================================
    let currentTool = 'scroll';
    let currentScale = 1.0;
    let drawingCanvas = null;
    let drawCtx = null;
    let isPainting = false;
    let undoStack = [];
    let redoStack = [];
    const slideDrawings = new Map();
    const storageKey = 'keynox_drawings_' + (window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_') || 'deck');

    function initDrawingEngine() {
      drawingCanvas = document.getElementById('drawingCanvas');
      if (!drawingCanvas) return;
      drawCtx = drawingCanvas.getContext('2d', { alpha: true, desynchronized: true });
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // Load saved drawings from localStorage
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([idx, dataUrl]) => {
            slideDrawings.set(Number(idx), dataUrl);
          });
        }
      } catch (e) {
        // Safe fallback
      }

      loadSlideDrawing(currentSlide);

      // Event listeners for drawing
      drawingCanvas.addEventListener('mousedown', startPosition);
      window.addEventListener('mouseup', stopPosition);
      drawingCanvas.addEventListener('mousemove', draw);
      drawingCanvas.addEventListener('mouseleave', () => { if (isPainting) stopPosition(); });

      drawingCanvas.addEventListener('touchstart', startPosition, { passive: false });
      window.addEventListener('touchend', stopPosition);
      drawingCanvas.addEventListener('touchmove', draw, { passive: false });
    }

    function resizeCanvas() {
      const vp = document.getElementById('viewport');
      if (!drawingCanvas || !vp || !drawCtx) return;
      const rect = vp.getBoundingClientRect();
      const prevData = drawingCanvas.width > 0 && drawingCanvas.height > 0 ? drawingCanvas.toDataURL() : null;
      drawingCanvas.width = rect.width;
      drawingCanvas.height = rect.height;
      drawingCanvas.style.width = rect.width + 'px';
      drawingCanvas.style.height = rect.height + 'px';
      if (prevData) {
        const img = new Image();
        img.src = prevData;
        img.onload = () => { drawCtx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height); };
      }
    }

    function getCoords(e) {
      const rect = drawingCanvas.getBoundingClientRect();
      let clientX = e.clientX;
      let clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      const scaleX = drawingCanvas.width / (rect.width || 1);
      const scaleY = drawingCanvas.height / (rect.height || 1);
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function saveState() {
      if (drawingCanvas) {
        undoStack.push(drawingCanvas.toDataURL());
        if (undoStack.length > 30) undoStack.shift();
      }
    }

    function restoreState(dataUrl) {
      if (!drawingCanvas || !drawCtx) return;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawCtx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height);
      };
    }

    function startPosition(e) {
      if (currentTool === 'scroll') return;
      isPainting = true;
      const coords = getCoords(e);
      drawCtx.beginPath();
      drawCtx.moveTo(coords.x, coords.y);
      e.preventDefault();
    }

    function stopPosition() {
      if (!isPainting) return;
      isPainting = false;
      drawCtx.beginPath();
      redoStack = [];
      saveState();
      slideDrawings.set(currentSlide, drawingCanvas.toDataURL());
    }

    function draw(e) {
      if (!isPainting || currentTool === 'scroll') return;
      const coords = getCoords(e);
      if (currentTool === 'highlighter') {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.lineWidth = 24;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        drawCtx.strokeStyle = 'rgba(255, 235, 59, 0.65)';
      } else {
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.lineWidth = 3.5;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        drawCtx.strokeStyle = document.getElementById('penColor')?.value || '#ef4444';
      }
      drawCtx.lineTo(coords.x, coords.y);
      drawCtx.stroke();
      e.preventDefault();
    }

    window.setTool = function(tool) {
      currentTool = tool;
      const penBtn = document.getElementById('penBtn');
      const hlBtn = document.getElementById('highlighterBtn');
      const scrollBtn = document.getElementById('scrollBtn');
      if (penBtn) penBtn.classList.toggle('active', tool === 'pen');
      if (hlBtn) hlBtn.classList.toggle('active', tool === 'highlighter');
      if (scrollBtn) scrollBtn.classList.toggle('active', tool === 'scroll');

      if (drawingCanvas) {
        drawingCanvas.style.pointerEvents = (tool === 'scroll') ? 'none' : 'auto';
        drawingCanvas.style.cursor = (tool === 'scroll') ? 'default' : 'crosshair';
      }
    };

    window.undo = function() {
      if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        const target = undoStack[undoStack.length - 1];
        restoreState(target);
        slideDrawings.set(currentSlide, target);
      }
    };

    window.redo = function() {
      if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        restoreState(nextState);
        slideDrawings.set(currentSlide, nextState);
      }
    };

    window.saveDrawings = function() {
      if (!drawingCanvas) return;
      slideDrawings.set(currentSlide, drawingCanvas.toDataURL());
      try {
        const payload = JSON.stringify(Object.fromEntries(slideDrawings));
        localStorage.setItem(storageKey, payload);
      } catch (err) {
        console.warn('Storage error:', err);
      }
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) {
        const orig = saveBtn.innerHTML;
        saveBtn.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> Saved!';
        setTimeout(() => { saveBtn.innerHTML = orig; }, 2000);
      }
    };

    window.clearDrawings = function() {
      if (!drawingCanvas || !drawCtx) return;
      if (confirm('Clear all drawings on current slide?')) {
        drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        slideDrawings.delete(currentSlide);
        redoStack = [];
        saveState();
      }
    };

    function saveSlideDrawing(idx) {
      if (drawingCanvas && drawCtx) {
        slideDrawings.set(idx, drawingCanvas.toDataURL());
      }
    }

    function loadSlideDrawing(idx) {
      if (!drawingCanvas || !drawCtx) return;
      drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      undoStack = [];
      redoStack = [];
      saveState(); // Blank base state
      const dataUrl = slideDrawings.get(idx);
      if (dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          drawCtx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height);
          saveState(); // Loaded drawing
        };
      }
    }

    // Zoom Controls
    window.zoomIn = function() {
      currentScale = Math.min(currentScale + 0.15, 2.5);
      applyZoom();
    };

    window.zoomOut = function() {
      currentScale = Math.max(currentScale - 0.15, 0.4);
      applyZoom();
    };

    window.resetZoom = function() {
      currentScale = 1.0;
      applyZoom();
    };

    function applyZoom() {
      const activeSlide = document.querySelector('.slide.active');
      if (activeSlide) {
        activeSlide.style.transform = 'scale(' + currentScale + ')';
        activeSlide.style.transformOrigin = 'center center';
        activeSlide.style.transition = 'transform 0.2s ease-out';
      }
      const resetBtn = document.getElementById('zoomResetBtn');
      if (resetBtn) {
        resetBtn.textContent = Math.round(currentScale * 100) + '%';
      }
    }

    // Toggle Toolbar Visibility
    window.toggleAnnotationBar = function(force) {
      const bar = document.getElementById('controlsBar');
      const zoom = document.getElementById('topZoomControls');
      const isCurrentlyVisible = bar?.classList.contains('visible');
      const nextVisible = typeof force === 'boolean' ? force : !isCurrentlyVisible;
      if (bar) bar.classList.toggle('visible', nextVisible);
      if (zoom) zoom.classList.toggle('visible', nextVisible);
      if (!nextVisible) {
        setTool('scroll');
      }
    };

    // Fullscreen listeners to automatically reveal annotation tools
    document.addEventListener('fullscreenchange', () => {
      const isFs = Boolean(document.fullscreenElement);
      toggleAnnotationBar(isFs);
    });

    // Remote message listener (e.g. from Keynox client when parent goes fullscreen)
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'HYPERDECK_SET_FULLSCREEN') {
        toggleAnnotationBar(Boolean(e.data.isFullscreen));
      }
    });

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        saveSlideDrawing(currentSlide);
        currentSlide++;
        updatePresentationState();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        saveSlideDrawing(currentSlide);
        currentSlide--;
        updatePresentationState();
      }
    }

    function goToSlide(idx) {
      if (idx >= 0 && idx < totalSlides) {
        saveSlideDrawing(currentSlide);
        currentSlide = idx;
        updatePresentationState();
      }
    }

    function toggleFullscreen() {
      const stage = document.getElementById('hyperdeckStage');
      if (!document.fullscreenElement) {
        if (stage.requestFullscreen) stage.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['ArrowRight', 'Space', 'j', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        nextSlide();
      } else if (['ArrowLeft', 'k', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (!isNaN(Number(e.key)) && Number(e.key) >= 1 && Number(e.key) <= totalSlides) {
        goToSlide(Number(e.key) - 1);
      } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) window.redo(); else window.undo();
      } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        window.redo();
      } else if (!e.ctrlKey && !e.altKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'p' || e.key === 'P') {
          toggleAnnotationBar(true);
          setTool('pen');
        } else if (e.key === 'h' || e.key === 'H') {
          toggleAnnotationBar(true);
          setTool('highlighter');
        } else if (e.key === 's' || e.key === 'S' || e.key === 'Escape') {
          setTool('scroll');
        }
      }
    });

    // Interactive Motion Pipeline Handler
    function initMotionPipelines() {
      document.querySelectorAll('.motion-pipeline').forEach((pipeline) => {
        const stages = Array.from(pipeline.querySelectorAll('.pipeline-stage'));
        stages.forEach((stg) => {
          stg.addEventListener('click', () => {
            stages.forEach(s => s.classList.remove('active-stage'));
            stg.classList.add('active-stage');
            if (window.gsap) {
              gsap.fromTo(stg, { scale: 0.96 }, { scale: 1.04, duration: 0.35, ease: "back.out(2)" });
            }
          });
        });
      });

      // State switcher buttons
      document.querySelectorAll('.state-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const parent = btn.closest('.state-switcher');
          if (parent) {
            parent.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          }
        });
      });
    }

    // Global simulation runner triggered by [▶ Simulate Flow] buttons
    window.simulatePipelineFlow = function(btn) {
      const pipeline = btn.closest('.slide')?.querySelector('.motion-pipeline') || btn.closest('.motion-pipeline');
      if (!pipeline) return;
      const stages = Array.from(pipeline.querySelectorAll('.pipeline-stage'));
      if (stages.length === 0) return;

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:-1px;margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Transmitting...';

      let step = 0;
      stages.forEach(s => s.classList.remove('active-stage'));

      const interval = setInterval(() => {
        if (step < stages.length) {
          stages.forEach(s => s.classList.remove('active-stage'));
          const currentStage = stages[step];
          currentStage.classList.add('active-stage');
          if (window.gsap) {
            gsap.fromTo(currentStage, { scale: 0.94 }, { scale: 1.06, duration: 0.35, ease: "back.out(2)" });
          }
          step++;
        } else {
          clearInterval(interval);
          btn.disabled = false;
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:-1px;margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>Complete';
          setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        }
      }, 550);
    };

    // =========================================================================
    // 2026 Creative Runtime: Three.js 3D WebGL Worlds & Particle Conduits
    // =========================================================================
    const active3DScenes = new Map();

    function initThreeScenes(slideEl) {
      if (!window.THREE) return;
      const containers = slideEl.querySelectorAll('.three-container');
      containers.forEach((container) => {
        if (container.dataset.initialized) return;
        container.dataset.initialized = 'true';

        const modelType = container.getAttribute('data-model') || 'quantum-bloch-sphere';
        const width = container.clientWidth || 550;
        const height = container.clientHeight || 320;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1.2, 4.8);

        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch (e) {
          console.warn('WebGL not supported:', e);
          return;
        }

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.className = 'three-canvas';
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        if (modelType.includes('bloch') || modelType.includes('quantum')) {
          // 3D Quantum Bloch Sphere
          const sphereGeo = new THREE.SphereGeometry(1.5, 26, 16);
          const sphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.18 });
          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          rootGroup.add(sphere);

          const eqGeo = new THREE.TorusGeometry(1.5, 0.022, 16, 64);
          const eqMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const eqRing = new THREE.Mesh(eqGeo, eqMat);
          eqRing.rotation.x = Math.PI / 2;
          rootGroup.add(eqRing);

          const merGeo = new THREE.TorusGeometry(1.5, 0.018, 16, 64);
          const merMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
          const merRing = new THREE.Mesh(merGeo, merMat);
          rootGroup.add(merRing);

          const zPoints = [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(0, 1.8, 0)];
          const zGeo = new THREE.BufferGeometry().setFromPoints(zPoints);
          const zLine = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 }));
          rootGroup.add(zLine);

          const dir = new THREE.Vector3(0.7, 1.1, 0.6).normalize();
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1.5, 0xf59e0b, 0.28, 0.16);
          rootGroup.add(arrow);

          const partGeo = new THREE.BufferGeometry();
          const partCount = 70;
          const posArr = new Float32Array(partCount * 3);
          for (let p = 0; p < partCount * 3; p += 3) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = 1.5 + (Math.random() - 0.5) * 0.12;
            posArr[p] = r * Math.sin(phi) * Math.cos(theta);
            posArr[p + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArr[p + 2] = r * Math.cos(phi);
          }
          partGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
          const partMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.045, transparent: true, opacity: 0.8 });
          rootGroup.add(new THREE.Points(partGeo, partMat));

        } else if (modelType.includes('chip') || modelType.includes('hardware') || modelType.includes('die')) {
          // 3D Silicon Microchip Die
          const substrate = new THREE.Mesh(
            new THREE.BoxGeometry(2.8, 0.12, 2.8),
            new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.2, metalness: 0.8 })
          );
          rootGroup.add(substrate);

          const die = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.16, 1.6),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9, emissive: 0x0284c7, emissiveIntensity: 0.3 })
          );
          die.position.y = 0.05;
          rootGroup.add(die);

          for (let p = -1.2; p <= 1.2; p += 0.4) {
            const pin = new THREE.Mesh(
              new THREE.BoxGeometry(0.08, 0.08, 0.4),
              new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 })
            );
            pin.position.set(p, 0.08, -1.2);
            rootGroup.add(pin);
            const pinS = pin.clone();
            pinS.position.z = 1.2;
            rootGroup.add(pinS);
          }
          rootGroup.rotation.x = 0.65;
          rootGroup.rotation.y = -0.45;

        } else {
          // 3D Neural Constellation / Dynamic Node Graph
          const nodePositions = [];
          const nodeMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x818cf8, emissiveIntensity: 0.6 });
          for (let n = 0; n < 14; n++) {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), nodeMat);
            sphere.position.set(
              (Math.random() - 0.5) * 3.2,
              (Math.random() - 0.5) * 2.2,
              (Math.random() - 0.5) * 2.2
            );
            rootGroup.add(sphere);
            nodePositions.push(sphere.position);
          }
          const linePoints = [];
          for (let a = 0; a < nodePositions.length; a++) {
            for (let b = a + 1; b < nodePositions.length; b++) {
              if (nodePositions[a].distanceTo(nodePositions[b]) < 1.6) {
                linePoints.push(nodePositions[a], nodePositions[b]);
              }
            }
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }));
          rootGroup.add(lines);
        }

        // Interactive Mouse/Touch Orbit Controls
        let isDragging = false;
        let prevMouseX = 0;
        let prevMouseY = 0;
        let rotSpeedX = 0;
        let rotSpeedY = 0;

        const onDown = (e) => {
          isDragging = true;
          prevMouseX = e.touches ? e.touches[0].clientX : e.clientX;
          prevMouseY = e.touches ? e.touches[0].clientY : e.clientY;
        };

        const onMove = (e) => {
          if (!isDragging) return;
          const curX = e.touches ? e.touches[0].clientX : e.clientX;
          const curY = e.touches ? e.touches[0].clientY : e.clientY;
          rotSpeedY = (curX - prevMouseX) * 0.006;
          rotSpeedX = (curY - prevMouseY) * 0.006;
          rootGroup.rotation.y += rotSpeedY;
          rootGroup.rotation.x += rotSpeedX;
          prevMouseX = curX;
          prevMouseY = curY;
        };

        const onUp = () => { isDragging = false; };

        container.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        container.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);

        const animate = () => {
          requestAnimationFrame(animate);
          if (!isDragging) {
            rootGroup.rotation.y += 0.004;
            rotSpeedX *= 0.94;
            rotSpeedY *= 0.94;
            rootGroup.rotation.x += rotSpeedX;
            rootGroup.rotation.y += rotSpeedY;
          }
          renderer.render(scene, camera);
        };
        animate();
      });
    }

    // Particle Conduit 2D Canvas Engine
    function initParticleConduits(slideEl) {
      const canvases = slideEl.querySelectorAll('.particle-canvas');
      canvases.forEach(canvas => {
        if (canvas.dataset.initialized) return;
        canvas.dataset.initialized = 'true';
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width = canvas.parentElement.clientWidth || 550;
        const height = canvas.height = canvas.parentElement.clientHeight || 220;

        const particles = [];
        for (let i = 0; i < 40; i++) {
          particles.push({
            t: Math.random(),
            speed: 0.004 + Math.random() * 0.006,
            offsetY: (Math.random() - 0.5) * 35,
            size: 2.5 + Math.random() * 2.5,
            color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#38bdf8' : '#818cf8'
          });
        }

        function renderParticles() {
          ctx.clearRect(0, 0, width, height);

          // Draw conduit curved track
          ctx.beginPath();
          ctx.moveTo(30, height / 2);
          ctx.bezierCurveTo(width * 0.35, height * 0.2, width * 0.65, height * 0.8, width - 30, height / 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.stroke();

          particles.forEach(p => {
            p.t += p.speed;
            if (p.t > 1) p.t = 0;
            const t = p.t;
            const x = Math.pow(1 - t, 3) * 30 +
                      3 * Math.pow(1 - t, 2) * t * (width * 0.35) +
                      3 * (1 - t) * Math.pow(t, 2) * (width * 0.65) +
                      Math.pow(t, 3) * (width - 30);
            const y = (Math.pow(1 - t, 3) * (height / 2) +
                      3 * Math.pow(1 - t, 2) * t * (height * 0.2) +
                      3 * (1 - t) * Math.pow(t, 2) * (height * 0.8) +
                      Math.pow(t, 3) * (height / 2)) + p.offsetY;

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          });

          requestAnimationFrame(renderParticles);
        }
        renderParticles();
      });
    }

    // Initialize
    initMotionPipelines();
    initDrawingEngine();
    updatePresentationState();
    if (window.renderMathInElement) {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\\\[", right: "\\\\]", display: true },
            { left: "\\\\(", right: "\\\\)", display: false },
          ],
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
          ignoredClasses: ["terminal-card", "terminal-body", "terminal-cmd", "arch-stack", "disk-stripe", "stat-card"],
          throwOnError: false,
        });
      } catch (e) {
        console.warn("Global KaTeX error:", e);
      }
    }
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
